// Écran « Bien-être » : respiration guidée, routines de mobilité, sommeil et récupération.
import { h, add, clear, chips, icon } from '../ui.js';
import { getState } from '../store.js';
import { ROUTINES, routineSession } from '../engine/planner.js';
import { todayISO, addDays, shortDate, formatDuration } from '../engine/dates.js';
import { speak, beep, unlockAudio, keepAwake } from '../audio.js';
import { navigate } from '../router.js';
import { update } from '../store.js';
import { award, bump } from '../game/service.js';
import { SPLIT } from '../game/leveling.js';

const PATTERNS = [
  { id: 'coherence', label: 'Cohérence cardiaque', desc: '5 s inspire, 5 s expire. Calme le stress en 5 minutes (3 fois par jour idéalement).', phases: [['Inspire', 5], ['Expire', 5]] },
  { id: 'box', label: 'Respiration carrée', desc: '4-4-4-4. Utilisée par les militaires et les combattants pour rester lucide sous pression.', phases: [['Inspire', 4], ['Bloque', 4], ['Expire', 4], ['Bloque', 4]] },
  { id: '478', label: 'Respiration 4-7-8', desc: 'Pour t’endormir : inspire 4 s, retiens 7 s, expire 8 s par la bouche.', phases: [['Inspire', 4], ['Bloque', 7], ['Expire', 8]] },
  { id: 'recovery', label: 'Récup entre rounds', desc: 'Expirations longues pour faire redescendre le cœur vite : 3 s inspire, 6 s expire.', phases: [['Inspire', 3], ['Expire', 6]] },
];

export function renderWellness(root) {
  let cleanup = null;
  const s = getState();
  clear(root);
  add(root, h('section', { class: 'page-head' }, h('h1', null, 'Bien-être'), h('p', { class: 'muted' }, 'Récupérer, respirer, dormir : la moitié de tes progrès se fait ici.')));

  // ---- Respiration
  let pattern = PATTERNS[0];
  let minutes = 5;
  const desc = h('p', { class: 'small muted' }, pattern.desc);
  const circle = h('div', { class: 'breath-circle' }, h('span', { class: 'breath-text' }, 'Prêt ?'));
  const timeEl = h('div', { class: 'muted small center' }, '');
  const startBtn = h('button', { class: 'btn primary big', onclick: () => toggle() }, icon('play'), ' Commencer');
  let running = false; let handle = null; let phaseIdx = 0; let phaseLeft = 0; let totalLeft = 0; let last = 0;

  const setPhase = (i) => {
    phaseIdx = i % pattern.phases.length;
    const [name, secs] = pattern.phases[phaseIdx];
    phaseLeft = secs;
    circle.querySelector('.breath-text').textContent = name;
    circle.style.transitionDuration = `${secs}s`;
    circle.classList.toggle('grow', name === 'Inspire');
    circle.classList.toggle('shrink', name === 'Expire');
    beep(name === 'Inspire' ? 520 : name === 'Expire' ? 390 : 450, 0.15, 0.12);
    if (getState().settings.voice && totalLeft > minutes * 60 - 25) speak(name, { interrupt: true, rate: 0.9 });
  };
  let doneSecs = 0;
  const logBreath = (complete) => {
    const secs = Math.round(doneSecs);
    doneSecs = 0;
    if (secs < 60) return;
    update((st) => { st.logs.breath = [...(st.logs.breath || []), { date: todayISO(), secs, pattern: pattern.id }].slice(-300); });
    if (complete) { bump('breathing'); award(20, SPLIT.life, 'Respiration'); }
  };
  const stop = (complete = false) => {
    if (running) logBreath(complete);
    running = false;
    clearInterval(handle);
    keepAwake(false);
    circle.classList.remove('grow', 'shrink');
    circle.querySelector('.breath-text').textContent = 'Prêt ?';
    add(clear(startBtn), icon('play'), ' Commencer');
    timeEl.textContent = '';
  };
  const toggle = () => {
    if (running) { stop(false); return; }
    unlockAudio();
    keepAwake(true);
    running = true;
    totalLeft = minutes * 60;
    last = performance.now();
    setPhase(0);
    add(clear(startBtn), icon('pause'), ' Arrêter');
    handle = setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      phaseLeft -= dt;
      totalLeft -= dt;
      doneSecs += dt;
      timeEl.textContent = `Reste ${formatDuration(totalLeft)}`;
      if (totalLeft <= 0) { stop(true); speak('Bravo. Reviens doucement.', { interrupt: true }); return; }
      if (phaseLeft <= 0) setPhase(phaseIdx + 1);
    }, 100);
  };
  cleanup = () => stop(false);

  add(root, h('section', { class: 'card breath' },
    h('div', { class: 'card-title' }, '🌬️ Respiration guidée'),
    chips(PATTERNS.map((p) => ({ id: p.id, label: p.label })), pattern.id, { multi: false, onChange: (v) => { stop(); pattern = PATTERNS.find((p) => p.id === v); desc.textContent = pattern.desc; } }),
    desc,
    circle, timeEl,
    h('div', { class: 'row gap center' },
      chips([2, 5, 10].map((m) => ({ id: m, label: `${m} min` })), minutes, { multi: false, onChange: (v) => { minutes = v; } })),
    startBtn));

  // ---- Routines
  add(root, h('h2', { class: 'section-title' }, 'Routines de mobilité'));
  add(root, h('div', { class: 'routine-grid' }, Object.entries(ROUTINES).map(([key, r]) => {
    const sess = routineSession(key, s.profile);
    return h('button', { class: 'routine-card', onclick: () => navigate(`#/session/routine-${key}`) },
      h('span', { class: 'tc-emoji' }, r.emoji), h('b', null, r.title), h('span', { class: 'muted small' }, `~${sess.minutes} min · ${sess.blocks[0].items.length} exercices`));
  })));

  // ---- Sommeil & forme (14 derniers jours)
  const days = Array.from({ length: 14 }, (_, i) => addDays(todayISO(), i - 13));
  const ck = s.logs.checkins;
  if (days.some((d) => ck[d])) {
    add(root, h('section', { class: 'card' },
      h('div', { class: 'card-title' }, '😴 Sommeil & forme (14 jours)'),
      h('div', { class: 'mini-bars' }, days.map((d) => {
        const c = ck[d];
        const hgt = c ? Math.min(100, (c.sleep / 10) * 100) : 0;
        return h('div', { class: 'mini-bar', title: c ? `${shortDate(d)} : ${c.sleep} h, forme ${c.score}/100` : shortDate(d) },
          h('div', { class: `fill ${c ? (c.score >= 65 ? 'good' : c.score >= 40 ? 'mid' : 'low') : ''}`, style: { height: `${hgt}%` } }),
          h('span', null, shortDate(d).split('/')[0]));
      })),
      h('p', { class: 'small muted' }, 'Hauteur = heures de sommeil · couleur = score de forme.')));
  }

  // ---- Conseils
  add(root, h('section', { class: 'card soft' },
    h('div', { class: 'card-title' }, '🛌 Récupération : les bases'),
    h('ul', { class: 'bullets small' },
      h('li', null, 'Dors 7 à 9 h, à heures régulières. Chambre fraîche (18-19 °C) et sombre.'),
      h('li', null, 'Pas d’écran 30 min avant de dormir : fais plutôt la respiration 4-7-8.'),
      h('li', null, 'Caféine : pas après 14 h.'),
      h('li', null, 'Après une grosse séance : protéines + glucides dans les 2 h.'),
      h('li', null, 'Courbatures : marche, mobilité douce, douche chaude. Pas besoin de tout arrêter.'),
      h('li', null, 'Stress élevé plusieurs jours : baisse l’intensité, augmente la respiration et la marche dehors.'),
      h('li', null, 'Douleur articulaire vive ou qui dure : stop et avis médical.'))));

  return () => cleanup?.();
}
