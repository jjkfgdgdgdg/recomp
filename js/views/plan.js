// Écran « Programme » : semaine type, détail des séances, nutrition et logique du programme.
import { h, clear, modal, fmt, bar } from '../ui.js';
import { getState, update } from '../store.js';
import { DAY_NAMES, todayISO, addDays, weekday, shortDate } from '../engine/dates.js';
import { TYPE_META, isDeload, weekIndex } from '../engine/planner.js';
import { bmiLabel, bodyFatNavy, goalEta, bmr } from '../engine/nutrition.js';
import { mealIdeas } from '../data/meals.js';
import { sessionFor, nutrition, regeneratePlan, currentProfile, sessionLogFor } from '../services.js';
import { sessionList, typeBadge } from './common.js';
import { navigate } from '../router.js';

export function renderPlan(root) {
  const s = getState();
  const today = todayISO();
  const monday = addDays(today, -weekday(today));
  const wIdx = weekIndex(s.profile, today);
  clear(root);
  root.append(h('section', { class: 'page-head' },
    h('h1', null, 'Mon programme'),
    h('p', { class: 'muted' }, `Semaine ${wIdx}${isDeload(s.profile, today) ? ' · 🔋 décharge' : ''} · ${s.profile.days.length} séances de ${s.profile.sessionMinutes} min`)));

  // ---- Semaine
  const list = h('section', { class: 'week-list' });
  for (let i = 0; i < 7; i += 1) {
    const iso = addDays(monday, i);
    const day = s.plan.week[i];
    const done = sessionLogFor(iso);
    const meta = TYPE_META[day.type];
    list.append(h('button', {
      class: `day-row t-${day.type}${iso === today ? ' today' : ''}`,
      onclick: () => (day.type === 'rest' ? null : showSession(iso)),
      disabled: day.type === 'rest',
    },
    h('div', { class: 'day-col' }, h('b', null, DAY_NAMES[i]), h('span', { class: 'muted small' }, shortDate(iso))),
    h('div', { class: 'day-main' }, h('span', { class: 'day-emoji' }, meta.emoji), h('span', null, day.title)),
    h('div', { class: 'day-state' }, done ? '✅' : iso === today && day.type !== 'rest' ? 'Auj.' : '')));
  }
  root.append(list);

  // ---- Pourquoi
  root.append(h('section', { class: 'card soft' },
    h('div', { class: 'card-title' }, '🧠 Pourquoi ce programme ?'),
    h('ul', { class: 'bullets small' }, (s.plan.reasons || []).map((r) => h('li', null, r))),
    h('div', { class: 'row gap wrap' },
      h('button', { class: 'btn ghost small', onclick: () => navigate('#/onboarding') }, 'Modifier mes réponses'),
      h('button', {
        class: 'btn ghost small',
        onclick: () => { update((st) => regeneratePlan(st)); renderPlan(root); },
      }, 'Regénérer'))));

  // ---- Nutrition
  const p = currentProfile();
  const n = nutrition();
  const bf = bodyFatNavy(p);
  const eta = goalEta(p);
  const meals = mealIdeas(p.diet, p.meals, weekday(today) + new Date().getDate());
  const macroTotal = n.protein * 4 + n.carbs * 4 + n.fat * 9;
  root.append(h('section', { class: 'card' },
    h('div', { class: 'card-title' }, '🍽️ Nutrition'),
    h('p', { class: 'small muted' }, n.note),
    h('div', { class: 'stats3' },
      h('div', null, h('b', null, fmt(n.kcal)), h('span', null, 'kcal / jour')),
      h('div', null, h('b', null, fmt(n.tdee)), h('span', null, 'dépense estimée')),
      h('div', null, h('b', null, fmt(bmr(p))), h('span', null, 'métabolisme de base'))),
    macroRow('Protéines', n.protein, (n.protein * 4) / macroTotal, 'p'),
    macroRow('Glucides', n.carbs, (n.carbs * 4) / macroTotal, 'c'),
    macroRow('Lipides', n.fat, (n.fat * 9) / macroTotal, 'f'),
    h('div', { class: 'stats3' },
      h('div', null, h('b', null, `${fmt(n.water, 1)} L`), h('span', null, 'eau / jour')),
      h('div', null, h('b', null, `${n.fiber} g`), h('span', null, 'fibres')),
      h('div', null, h('b', null, fmt(n.bmi, 1)), h('span', null, `IMC · ${bmiLabel(n.bmi)}`))),
    bf ? h('p', { class: 'small' }, `Masse grasse estimée (méthode US Navy) : `, h('b', null, `${fmt(bf, 1)} %`)) : null,
    eta ? h('p', { class: 'small' }, `Objectif ${p.targetWeight} kg : ${eta.diff > 0 ? '+' : ''}${eta.diff} kg, environ `, h('b', null, `${eta.weeks} semaines`), ` à un rythme sain (~${eta.ratePerWeek} kg/sem).`) : null,
    h('div', { class: 'card-title mt' }, 'Idées de repas pour aujourd’hui'),
    h('div', { class: 'meals' }, meals.map((m) => h('div', { class: 'meal' }, h('span', { class: 'muted small' }, m.slot), h('span', null, m.meal.name), h('span', { class: 'small muted' }, `~${m.meal.protein} g prot.`)))),
    h('p', { class: 'small muted' }, 'Astuce : une paume de protéines, un poing de féculents, deux poings de légumes et un pouce de matières grasses par repas.')));
}

function macroRow(label, grams, share, cls) {
  return h('div', { class: 'macro-row' },
    h('span', null, label), bar(share, 1, `m-${cls}`), h('b', null, `${grams} g`));
}

function showSession(iso) {
  const session = sessionFor(iso);
  const m = modal(h('div', { class: 'stack' },
    h('div', { class: 'row between' }, typeBadge(session.type), h('span', { class: 'muted small' }, `~${session.minutes} min`)),
    session.deload ? h('div', { class: 'pill info' }, '🔋 Semaine de décharge') : null,
    sessionList(session),
    h('button', { class: 'btn primary', onclick: () => { m.close(); navigate(`#/session/${iso}`); } }, iso === todayISO() ? 'Commencer' : 'Faire cette séance maintenant')),
  { title: session.title });
}
