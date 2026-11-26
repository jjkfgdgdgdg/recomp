// Écran « Aujourd'hui » : check-in de forme, séance du jour, nutrition, hydratation.
import { h, clear, chips, bar, toast, fmt, icon } from '../ui.js';
import { getState, update } from '../store.js';
import { todayISO, prettyDate, DAY_SHORT, weekday } from '../engine/dates.js';
import { readinessAdvice } from '../engine/readiness.js';
import {
  sessionFor, checkinFor, saveCheckin, sessionLogFor, streak, nutrition, waterFor, addWater, weekDoneCount,
} from '../services.js';
import { TYPE_META } from '../engine/planner.js';
import { typeBadge, sessionList } from './common.js';
import { navigate } from '../router.js';
import { MT_TIPS } from '../data/muaythai.js';
import { playerMini, questsCard } from './quests.js';
import { installBanner } from './install.js';
import { weeklyCard } from './arena.js';
import { award, bump } from '../game/service.js';
import { SPLIT } from '../game/leveling.js';

const TIPS = [
  'La régularité bat l’intensité : 3 séances par semaine pendant 6 mois valent mieux que 6 pendant 3 semaines.',
  'Les muscles grandissent pendant le repos : vise 7 à 9 h de sommeil.',
  'Répartis tes protéines sur 3-4 repas (20-40 g chacun).',
  'Une rep propre vaut mieux que trois reps bâclées. Le coach caméra est là pour ça.',
  'Bois un grand verre d’eau au réveil.',
  'Courbatures ? Bouge doucement : marche, mobilité. Ça récupère plus vite que rester assis.',
  ...MT_TIPS,
];

export function renderToday(root) {
  const s = getState();
  const iso = todayISO();
  const p = s.profile;
  clear(root);

  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Bonjour' : hour < 18 ? 'Salut' : 'Bonsoir';
  const st = streak();
  root.append(h('section', { class: 'hero' },
    h('div', null,
      h('div', { class: 'muted small' }, prettyDate(iso)),
      h('h1', null, `${hello}${p.name ? ` ${p.name}` : ''} !`)),
    h('div', { class: 'streak', title: 'Série de jours actifs' }, icon('flame', 18), h('b', null, st), h('span', null, 'jour' + (st > 1 ? 's' : '')))));

  root.append(playerMini());
  const banner = installBanner(s.settings, () => renderToday(root));
  if (banner) root.append(banner);

  // ---- Semaine
  const wk = weekDoneCount(iso);
  root.append(h('div', { class: 'week-strip' }, wk.days.map((d, i) => h('div', {
    class: `wd${d === iso ? ' today' : ''}${wk.done[i] ? ' done' : ''} t-${wk.planned[i]}`,
    title: TYPE_META[wk.planned[i]].label,
  }, h('span', null, DAY_SHORT[i][0]), h('i', null, wk.done[i] ? '✓' : TYPE_META[wk.planned[i]].emoji)))));

  // ---- Check-in
  root.append(checkinCard(iso, () => renderToday(root)));

  // ---- Quêtes du jour
  root.append(questsCard(iso, () => renderToday(root)));

  // ---- Boss de la semaine
  const wk2 = weeklyCard(() => renderToday(root), { compact: true });
  if (wk2) root.append(wk2);

  // ---- Séance du jour
  const session = sessionFor(iso);
  const log = sessionLogFor(iso);
  const active = s.active && s.active.id === iso ? s.active : null;
  const card = h('section', { class: `card session-card t-${session.type}` });
  if (session.type === 'rest') {
    card.append(
      h('div', { class: 'row between' }, typeBadge('rest'), h('span', { class: 'muted small' }, `Semaine ${session.week}`)),
      h('h2', null, 'Jour de repos 😴'),
      h('p', { class: 'muted' }, 'Le repos fait partie du programme : c’est là que tu progresses. Idée : 20-30 min de marche + une routine de mobilité.'),
      h('div', { class: 'row gap wrap' },
        h('button', { class: 'btn ghost', onclick: () => navigate('#/session/routine-morning') }, '🌅 Routine mobilité'),
        h('button', { class: 'btn ghost', onclick: () => navigate('#/wellness') }, '🧘 Respiration')));
  } else {
    card.append(
      h('div', { class: 'row between' }, typeBadge(session.type), h('span', { class: 'muted small' }, `Semaine ${session.week} · ~${session.minutes} min`)),
      h('h2', null, session.title),
      session.deload ? h('div', { class: 'pill info' }, '🔋 Semaine de décharge : volume réduit pour récupérer') : null,
      session.adjusted === 'light' ? h('div', { class: 'pill warn' }, '⚖️ Séance allégée selon ta forme du jour') : null,
      session.adjusted === 'recovery' ? h('div', { class: 'pill warn' }, '🛌 Forme basse : récupération active à la place') : null,
      log ? h('div', { class: 'pill good' }, `✅ Séance faite (${Math.round((log.durationSec || 0) / 60)} min)`) : null,
      sessionList(session, { compact: true }),
      h('div', { class: 'row gap wrap' },
        h('button', { class: 'btn primary big grow', onclick: () => navigate(`#/session/${iso}`) },
          log ? 'Refaire la séance' : active ? 'Reprendre la séance ▶' : 'Commencer la séance ▶'),
        session.adjusted ? h('button', {
          class: 'btn ghost',
          onclick: () => { update((st2) => { st2.overrides = { ...(st2.overrides || {}), [iso]: 'force' }; }); renderToday(root); },
        }, 'Faire la séance normale') : null));
  }
  root.append(card);

  // ---- Nutrition & eau
  const n = nutrition();
  const water = waterFor(iso);
  const waterGoal = Math.round((session.type === 'rest' ? n.waterMl : n.waterTraining * 1000) / 50) * 50;
  const waterBar = bar(water, waterGoal, 'water');
  const waterTxt = h('b', null, `${fmt(water / 1000, 2)} / ${fmt(waterGoal / 1000, 1)} L`);
  const addW = (ml) => {
    addWater(iso, ml);
    const v = waterFor(iso);
    waterTxt.textContent = `${fmt(v / 1000, 2)} / ${fmt(waterGoal / 1000, 1)} L`;
    waterBar.firstChild.style.width = `${Math.min(100, (v / waterGoal) * 100)}%`;
    if (v >= waterGoal && v - ml < waterGoal) {
      toast('💧 Objectif d\u2019hydratation atteint !');
      bump('waterDays');
      award(15, SPLIT.water, 'Hydratation');
    }
  };
  root.append(h('section', { class: 'grid2 cards' },
    h('div', { class: 'card' },
      h('div', { class: 'card-title' }, '🍽️ Nutrition du jour'),
      h('div', { class: 'big-num' }, fmt(n.kcal), h('small', null, ' kcal')),
      h('div', { class: 'macros' },
        h('span', null, h('b', null, `${n.protein} g`), ' protéines'),
        h('span', null, h('b', null, `${n.carbs} g`), ' glucides'),
        h('span', null, h('b', null, `${n.fat} g`), ' lipides')),
      h('a', { href: '#/plan', class: 'small link' }, 'Idées de repas →')),
    h('div', { class: 'card' },
      h('div', { class: 'card-title' }, '💧 Hydratation'),
      waterTxt, waterBar,
      h('div', { class: 'row gap' },
        h('button', { class: 'btn small ghost', onclick: () => addW(250) }, '+ 250 ml'),
        h('button', { class: 'btn small ghost', onclick: () => addW(500) }, '+ 500 ml'),
        h('button', { class: 'btn small ghost', 'aria-label': 'Retirer 250 ml', onclick: () => addW(-250) }, '−')))));

  // ---- Raccourcis
  root.append(h('section', { class: 'quick' },
    h('button', { class: 'quick-btn', onclick: () => navigate('#/arena') }, h('span', null, '⚔️'), 'Boss & caméra'),
    h('button', { class: 'quick-btn', onclick: () => navigate('#/timer') }, h('span', null, '🥊'), 'Minuteur rounds'),
    h('button', { class: 'quick-btn', onclick: () => navigate('#/wellness') }, h('span', null, '🧘'), 'Respiration'),
    h('button', { class: 'quick-btn', onclick: () => navigate('#/library') }, h('span', null, '📚'), 'Exercices')));
  if (!(s.settings.reminders?.notify) && !s.settings.remindersHint) {
    root.append(h('section', { class: 'card soft row between' },
      h('span', { class: 'small' }, '⏰ Un rappel pour ne jamais rater ta séance ?'),
      h('div', { class: 'row gap' },
        h('button', { class: 'btn small ghost', onclick: () => navigate('#/reminders') }, 'Configurer'),
        h('button', { class: 'btn small ghost', 'aria-label': 'Masquer', onclick: () => { update((st) => { st.settings.remindersHint = true; }); renderToday(root); } }, '✕'))));
  }

  const tip = TIPS[(weekday(iso) + new Date().getDate()) % TIPS.length];
  root.append(h('section', { class: 'card soft tip' }, h('b', null, '💡 Conseil du jour'), h('p', null, tip)));
}

function checkinCard(iso, rerender) {
  const existing = checkinFor(iso);
  if (existing && !existing.editing) {
    const adv = readinessAdvice(existing.score);
    return h('section', { class: `card readiness r-${adv.level}` },
      h('div', { class: 'row between' },
        h('div', null, h('div', { class: 'card-title' }, 'Forme du jour'), h('b', null, adv.label)),
        h('div', { class: 'score' }, existing.score, h('small', null, '/100'))),
      h('p', { class: 'small' }, adv.text),
      h('button', { class: 'link small', onclick: () => { update((s) => { s.logs.checkins[iso].editing = true; }); rerender(); } }, 'Modifier'));
  }
  const prof = getState().profile;
  const d = existing ? { ...existing } : { sleep: prof.sleep || 7, energy: 3, soreness: 2, stress: prof.stress || 3, pain: false };
  const scale = (key, labels) => chips(labels.map((l, i) => ({ id: i + 1, label: l })), d[key], { multi: false, onChange: (v) => { d[key] = v; } });
  return h('section', { class: 'card checkin' },
    h('div', { class: 'card-title' }, '📝 Check-in du jour (20 s)'),
    h('p', { class: 'small muted' }, 'Ta séance s’adapte automatiquement à ta forme.'),
    h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Heures de sommeil cette nuit'),
      chips([4, 5, 6, 7, 8, 9].map((x) => ({ id: x, label: x === 4 ? '≤4' : x === 9 ? '9+' : String(x) })), Math.max(4, Math.min(9, Math.round(d.sleep))), { multi: false, onChange: (v) => { d.sleep = v; } })),
    h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Énergie'), scale('energy', ['😴', '🥱', '🙂', '😃', '⚡'])),
    h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Courbatures'), scale('soreness', ['Aucune', 'Légères', 'Moyennes', 'Fortes', 'Très fortes'])),
    h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Stress'), scale('stress', ['😌', '🙂', '😐', '😟', '😫'])),
    h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: d.pain, onchange: (e) => { d.pain = e.target.checked; } }), h('span', null, 'J’ai une douleur inhabituelle (articulation, dos…)')),
    h('button', {
      class: 'btn primary',
      onclick: () => {
        const first = !existing;
        delete d.editing;
        const score = saveCheckin(iso, d);
        if (first) award(10, SPLIT.life, 'Check-in');
        toast(`Forme : ${score}/100`);
        rerender();
      },
    }, 'Valider'));
}
