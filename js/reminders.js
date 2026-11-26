// Rappels gratuits, sans serveur :
// 1) ajout à l'agenda du téléphone (.ics ou Google Agenda) : le plus fiable, marche partout (iPhone compris) ;
// 2) notifications de l'app (Android / PC, app installée) : à l'heure choisie quand l'app est ouverte,
//    et en arrière-plan via la « synchronisation périodique » quand le navigateur la permet.
import { getState, update, subscribe } from './store.js';
import { todayISO, weekday, addDays } from './engine/dates.js';
import { questStatus } from './game/quests.js';
import { appUrl } from './install.js';

const BYDAY = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

export function reminderSettings() {
  return { session: '18:00', quests: '20:30', notify: false, ...(getState().settings.reminders || {}) };
}

export function trainingDays(state = getState()) {
  return (state.plan?.week || []).map((d, i) => (d.type !== 'rest' ? i : null)).filter((i) => i !== null);
}

const pad = (n) => String(n).padStart(2, '0');
const icsDate = (iso, time) => `${iso.replace(/-/g, '')}T${time.replace(':', '')}00`;
const esc = (t) => String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

function nextDay(fromIso, days) {
  for (let i = 0; i < 7; i += 1) {
    const d = addDays(fromIso, i);
    if (days.includes(weekday(d))) return d;
  }
  return fromIso;
}

/** Fichier agenda (.ics) : séances récurrentes les jours d'entraînement + rappel quotidien des quêtes. */
export function buildIcs(state, { session, quests }, now = new Date(), url = 'https://recomp.app/') {
  const days = trainingDays(state);
  const today = todayISO(now);
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
  const minutes = state.profile?.sessionMinutes || 45;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Recomp//Coach sport//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Recomp'];
  if (days.length && session) {
    const start = nextDay(today, days);
    lines.push('BEGIN:VEVENT', `UID:recomp-seances-${today}@recomp`, `DTSTAMP:${stamp}`, `DTSTART:${icsDate(start, session)}`, `DURATION:PT${minutes}M`,
      `RRULE:FREQ=WEEKLY;BYDAY=${days.map((d) => BYDAY[d]).join(',')}`,
      `SUMMARY:${esc('💪 Séance Recomp')}`, `DESCRIPTION:${esc(`Ta séance du jour t'attend. Ouvre l'app : ${url}`)}`, `URL:${url}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:-PT10M', `DESCRIPTION:${esc('Séance Recomp dans 10 minutes')}`, 'END:VALARM', 'END:VEVENT');
  }
  if (quests) {
    lines.push('BEGIN:VEVENT', `UID:recomp-quetes-${today}@recomp`, `DTSTAMP:${stamp}`, `DTSTART:${icsDate(today, quests)}`, 'DURATION:PT5M', 'RRULE:FREQ=DAILY',
      `SUMMARY:${esc('📜 Quêtes du jour Recomp')}`, `DESCRIPTION:${esc(`As-tu fini tes quêtes ? Sinon : quête de pénalité demain ! ${url}`)}`, `URL:${url}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:PT0M', `DESCRIPTION:${esc('Quêtes du jour Recomp')}`, 'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

/** Lien « Ajouter à Google Agenda » pour les séances (Android). */
export function googleCalendarUrl(state, session, url = 'https://recomp.app/') {
  const days = trainingDays(state);
  if (!days.length) return null;
  const start = nextDay(todayISO(), days);
  const minutes = state.profile?.sessionMinutes || 45;
  const [hh, mm] = session.split(':').map(Number);
  const endMin = hh * 60 + mm + minutes;
  const end = `${pad(Math.floor(endMin / 60) % 24)}:${pad(endMin % 60)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: '💪 Séance Recomp',
    dates: `${icsDate(start, session)}/${icsDate(start, end)}`,
    recur: `RRULE:FREQ=WEEKLY;BYDAY=${days.map((d) => BYDAY[d]).join(',')}`,
    details: `Ta séance du jour t'attend : ${url}`,
  });
  try { params.set('ctz', Intl.DateTimeFormat().resolvedOptions().timeZone); } catch { /* ignore */ }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs() {
  const s = getState();
  const text = buildIcs(s, reminderSettings(), new Date(), appUrl());
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'recomp-rappels.ics';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}

// ---------------------------------------------------------------- Notifications
export function notificationsSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export async function enableNotifications() {
  if (!notificationsSupported()) return 'unsupported';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return perm;
  update((s) => { s.settings.reminders = { ...reminderSettings(), notify: true }; });
  await registerPeriodicSync();
  mirrorForServiceWorker();
  return 'granted';
}

export function disableNotifications() {
  update((s) => { s.settings.reminders = { ...reminderSettings(), notify: false }; });
  mirrorForServiceWorker();
}

async function registerPeriodicSync() {
  try {
    const reg = await navigator.serviceWorker.ready;
    if (!('periodicSync' in reg)) return false;
    const status = await navigator.permissions.query({ name: 'periodic-background-sync' }).catch(() => null);
    if (status && status.state !== 'granted') return false;
    await reg.periodicSync.register('recomp-reminders', { minInterval: 6 * 60 * 60 * 1000 });
    return true;
  } catch { return false; }
}

export async function showNotification(title, body, tag) {
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, { body, tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: appUrl() } });
    return true;
  } catch {
    try { new Notification(title, { body, tag }); return true; } catch { return false; } // eslint-disable-line no-new
  }
}

/** Ce qu'il reste à faire aujourd'hui (pour décider quelle notification envoyer). */
export function pendingToday(state = getState(), iso = todayISO()) {
  const training = state.plan?.week?.[weekday(iso)]?.type !== 'rest';
  const sessionDone = (state.logs?.sessions || []).some((x) => x.date === iso && !x.routine);
  let questsDone = false;
  try { questsDone = questStatus(state, iso).allDone; } catch { /* ignore */ }
  return { session: training && !sessionDone, quests: !questsDone };
}

// Copie minimale de l'état pour le service worker (qui ne peut pas lire localStorage)
function mirrorForServiceWorker() {
  try {
    const s = getState();
    const r = reminderSettings();
    const p = pendingToday(s);
    const data = {
      notify: !!r.notify, session: r.session, quests: r.quests, days: trainingDays(s), today: todayISO(),
      sessionPending: p.session, questsPending: p.quests, name: s.profile?.name || '',
    };
    const req = indexedDB.open('recomp-sw', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('kv');
    req.onsuccess = () => {
      const db = req.result;
      const t = db.transaction('kv', 'readwrite');
      t.objectStore('kv').put(data, 'reminders');
      t.oncomplete = () => db.close();
    };
  } catch { /* ignore */ }
}

let loop = null;
/** Vérifie chaque minute (quand l'app est ouverte) s'il faut envoyer un rappel. */
export function startReminderLoop() {
  let mirrorTimer = null;
  subscribe(() => { clearTimeout(mirrorTimer); mirrorTimer = setTimeout(mirrorForServiceWorker, 1500); });
  mirrorForServiceWorker();
  const check = () => {
    const s = getState();
    const r = reminderSettings();
    if (!s.profile || !r.notify || !notificationsSupported() || Notification.permission !== 'granted') return;
    const now = new Date();
    const hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const iso = todayISO(now);
    const sent = s.settings.notified || {};
    const p = pendingToday(s, iso);
    const name = s.profile.name ? `${s.profile.name}, ` : '';
    if (p.session && hm >= r.session && sent.session !== iso) {
      showNotification('💪 C\u2019est l\u2019heure de ta séance', `${name}ta séance du jour t\u2019attend. On y va ?`, 'recomp-session');
      update((st) => { st.settings.notified = { ...(st.settings.notified || {}), session: iso }; });
    } else if (p.quests && hm >= r.quests && sent.quests !== iso) {
      showNotification('📜 Quêtes du jour', `${name}il te reste des quêtes. Sinon : quête de pénalité demain !`, 'recomp-quests');
      update((st) => { st.settings.notified = { ...(st.settings.notified || {}), quests: iso }; });
    }
  };
  clearInterval(loop);
  loop = setInterval(check, 60 * 1000);
  setTimeout(check, 4000);
}
