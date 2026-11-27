// Pont vers les fonctions natives de l'application Android (Capacitor).
// Sur le site web et l'appli PC, ces fonctions renvoient false et l'app utilise les API du navigateur.
import { isCapacitor, nativePlugin } from './platform.js';

// ---------------------------------------------------------------- Voix (synthèse vocale Android)
export function nativeSpeak(text, { rate = 1, pitch = 1, interrupt = false } = {}) {
  const tts = nativePlugin('TextToSpeech');
  if (!tts) return false;
  const run = () => tts.speak({ text, lang: 'fr-FR', rate: Math.max(0.5, Math.min(2, rate)), pitch: Math.max(0.5, Math.min(2, pitch)), volume: 1, category: 'playback', queueStrategy: interrupt ? 0 : 1 }).catch(() => {});
  if (interrupt) tts.stop().catch(() => {}).finally(run);
  else run();
  return true;
}

export function nativeStopSpeaking() {
  const tts = nativePlugin('TextToSpeech');
  if (!tts) return false;
  tts.stop().catch(() => {});
  return true;
}

// ---------------------------------------------------------------- Écran allumé pendant les séances
export function nativeKeepAwake(on) {
  const ka = nativePlugin('KeepAwake');
  if (!ka) return false;
  (on ? ka.keepAwake() : ka.allowSleep()).catch(() => {});
  return true;
}

// ---------------------------------------------------------------- Fichiers (export, agenda, photos)
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/**
 * Enregistre un fichier puis ouvre le menu « Partager » d'Android (Drive, WhatsApp, Fichiers…).
 * data : texte ou Blob. Renvoie true si géré nativement.
 */
export async function nativeSaveFile(name, data, mime = 'application/octet-stream') {
  const fsys = nativePlugin('Filesystem');
  const share = nativePlugin('Share');
  if (!fsys || !share) return false;
  const safe = String(name).replace(/[^\w.-]/g, '_');
  const isText = typeof data === 'string';
  const res = await fsys.writeFile({
    path: safe, directory: 'CACHE', data: isText ? data : await blobToBase64(data), ...(isText ? { encoding: 'utf8' } : {}), recursive: true,
  });
  await share.share({ title: safe, files: [res.uri], dialogTitle: 'Enregistrer ou envoyer le fichier' }).catch(() => {});
  return true;
}

/** Téléchargement universel : partage natif sur Android, téléchargement classique ailleurs. */
export async function saveFile(name, data, mime) {
  if (isCapacitor && await nativeSaveFile(name, data, mime).catch(() => false)) return;
  const blob = typeof data === 'string' ? new Blob([data], { type: mime }) : data;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}

// ---------------------------------------------------------------- Rappels (notifications locales Android)
// Identifiants : 100-106 séances (lundi..dimanche), 200 quêtes.
const IDS = [100, 101, 102, 103, 104, 105, 106, 200];

export async function nativeNotificationsAvailable() {
  return !!nativePlugin('LocalNotifications');
}

export async function nativeRequestNotifications() {
  const ln = nativePlugin('LocalNotifications');
  if (!ln) return 'unsupported';
  const p = await ln.requestPermissions().catch(() => ({ display: 'denied' }));
  return p.display === 'granted' ? 'granted' : 'denied';
}

/** Programme les rappels récurrents : séance les jours d'entraînement + quêtes chaque soir. */
export async function nativeScheduleReminders({ days, session, quests, name }) {
  const ln = nativePlugin('LocalNotifications');
  if (!ln) return false;
  await ln.cancel({ notifications: IDS.map((id) => ({ id })) }).catch(() => {});
  const [sh, sm] = session.split(':').map(Number);
  const [qh, qm] = quests.split(':').map(Number);
  const who = name ? `${name}, ` : '';
  const notifications = days.map((d) => ({
    id: 100 + d,
    title: '💪 C’est l’heure de ta séance',
    body: `${who}ta séance du jour t’attend (si ce n’est pas déjà fait !).`,
    // Capacitor : 1 = dimanche … 7 = samedi ; chez nous 0 = lundi … 6 = dimanche
    schedule: { on: { weekday: ((d + 1) % 7) + 1, hour: sh, minute: sm }, allowWhileIdle: true },
  }));
  notifications.push({
    id: 200,
    title: '📜 Quêtes du jour',
    body: `${who}pense à tes quêtes avant minuit, sinon : quête de pénalité !`,
    schedule: { on: { hour: qh, minute: qm }, allowWhileIdle: true },
  });
  await ln.schedule({ notifications });
  return true;
}

export async function nativeCancelReminders() {
  const ln = nativePlugin('LocalNotifications');
  if (!ln) return false;
  await ln.cancel({ notifications: IDS.map((id) => ({ id })) }).catch(() => {});
  return true;
}
