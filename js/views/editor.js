// Éditeur de programme : changer la séance de chaque jour et les exercices des séances de muscu.
import { h, add, clear, modal, chips, toast, confirmBox, icon } from '../ui.js';
import { getState, update } from '../store.js';
import {
  SESSION_OPTIONS, setDay, generateSession, TYPE_META, FOCUS_TITLE,
} from '../engine/planner.js';
import { EXERCISES, EX, exerciseAllowed } from '../data/exercises.js';
import { CATEGORIES } from '../data/technique.js';
import { DAY_NAMES, todayISO, addDays, weekday } from '../engine/dates.js';
import { regeneratePlan, prescription } from '../services.js';
import { navigate } from '../router.js';

const GROUP_LABEL = { rest: 'Repos', strength: '💪 Musculation', muaythai: '🥊 Muay Thai', cardio: '🫀 Cardio', mobility: '🧘 Mobilité' };

export function renderEditor(root) {
  const draw = () => {
    const s = getState();
    clear(root);
    add(root, h('section', { class: 'page-head' },
      h('button', { class: 'link small', onclick: () => navigate('#/plan') }, '← Programme'),
      h('h1', null, '✏️ Éditeur de programme'),
      h('p', { class: 'muted' }, 'Change tes jours et tes exercices. Les reps et les charges continuent de progresser automatiquement.')));

    // ---- Semaine
    const weekCard = h('section', { class: 'card' }, h('div', { class: 'card-title' }, '📅 Ma semaine'));
    s.plan.week.forEach((d, i) => {
      const select = h('select', {
        class: 'input', 'aria-label': `Séance du ${DAY_NAMES[i]}`,
        onchange: (e) => { update((st) => { st.plan = setDay(st.plan, i, e.target.value); }); toast(`${DAY_NAMES[i]} : ${FOCUS_TITLE[e.target.value]}`); draw(); },
      });
      Object.keys(GROUP_LABEL).forEach((type) => {
        const opts = SESSION_OPTIONS.filter((o) => o.type === type);
        const group = h('optgroup', { label: GROUP_LABEL[type] });
        opts.forEach((o) => add(group, h('option', { value: o.focus, selected: o.focus === d.focus }, o.title)));
        add(select, group);
      });
      add(weekCard, h('div', { class: 'ed-day' }, h('b', null, DAY_NAMES[i]), select));
    });
    add(weekCard,
      s.plan.custom ? h('p', { class: 'small muted' }, 'Semaine personnalisée. Si tu refais le questionnaire, le programme automatique la remplacera.') : null,
      h('button', {
        class: 'btn ghost small',
        onclick: async () => {
          if (!(await confirmBox('Revenir au programme automatique (semaine et séances) ?'))) return;
          update((st) => { regeneratePlan(st); st.custom = { sessions: {} }; });
          toast('Programme automatique rétabli');
          draw();
        },
      }, 'Revenir au programme automatique'));
    add(root, weekCard);

    // ---- Séances de muscu
    const foci = [...new Set(s.plan.week.filter((d) => d.type === 'strength').map((d) => d.focus))];
    add(root, h('h2', { class: 'section-title' }, 'Mes séances de muscu'));
    if (!foci.length) add(root, h('p', { class: 'muted small' }, 'Aucune séance de musculation dans ta semaine.'));
    foci.forEach((focus) => add(root, sessionEditor(focus, draw)));
  };
  draw();
}

function dateFor(focus) {
  const s = getState();
  const monday = addDays(todayISO(), -weekday(todayISO()));
  const i = s.plan.week.findIndex((d) => d.focus === focus);
  return addDays(monday, Math.max(0, i));
}

function currentItems(focus) {
  const s = getState();
  const custom = s.custom?.sessions?.[focus]?.items;
  if (custom?.length) return custom.map((x) => ({ ...x }));
  const session = generateSession(s.profile, s, dateFor(focus), { force: true });
  const main = session.blocks.find((b) => b.name === 'Bloc principal');
  return (main?.items || []).filter((it) => it.kind === 'sets' || it.kind === 'timed').map((it) => ({ exId: it.exId, sets: it.sets }));
}

function saveItems(focus, items) {
  update((st) => {
    st.custom = st.custom || { sessions: {} };
    st.custom.sessions = st.custom.sessions || {};
    st.custom.sessions[focus] = { items, updatedAt: todayISO() };
  });
}

function sessionEditor(focus, redraw) {
  const s = getState();
  const items = currentItems(focus);
  const isCustom = !!s.custom?.sessions?.[focus]?.items?.length;
  const preview = generateSession(s.profile, s, dateFor(focus), { force: true });
  const mainPreview = preview.blocks.find((b) => b.name === 'Bloc principal')?.items || [];
  const change = (fn) => { const next = items.map((x) => ({ ...x })); fn(next); saveItems(focus, next); redraw(); };
  const card = h('section', { class: 'card ed-session' },
    h('div', { class: 'row between' }, h('div', { class: 'card-title' }, `${TYPE_META.strength.emoji} ${FOCUS_TITLE[focus]}`), h('span', { class: 'muted small' }, `~${preview.minutes} min`)),
    isCustom ? h('span', { class: 'pill info' }, 'Personnalisée') : h('p', { class: 'small muted' }, 'Séance automatique : modifie-la pour la personnaliser.'));
  items.forEach((it, i) => {
    const ex = EX[it.exId];
    const live = mainPreview[i];
    add(card, h('div', { class: 'ed-item' },
      h('div', { class: 'ed-name' }, h('b', null, live && live.exId !== it.exId ? `${EX[live.exId].name}` : ex?.name || it.exId),
        h('span', { class: 'small muted' }, live ? prescription(live) : '')),
      h('div', { class: 'ed-ctrl' },
        h('button', { class: 'icon-btn small', 'aria-label': 'Moins de séries', onclick: () => change((n) => { n[i].sets = Math.max(1, (n[i].sets || 3) - 1); }) }, icon('minus', 16)),
        h('span', { class: 'ed-sets' }, `${it.sets || 3}×`),
        h('button', { class: 'icon-btn small', 'aria-label': 'Plus de séries', onclick: () => change((n) => { n[i].sets = Math.min(10, (n[i].sets || 3) + 1); }) }, icon('plus', 16)),
        h('button', { class: 'icon-btn small', 'aria-label': 'Monter', disabled: i === 0, onclick: () => change((n) => { [n[i - 1], n[i]] = [n[i], n[i - 1]]; }) }, '↑'),
        h('button', { class: 'icon-btn small', 'aria-label': 'Remplacer', onclick: () => pickExercise(ex?.pattern, (id) => change((n) => { n[i] = { exId: id, sets: n[i].sets }; })) }, '⇄'),
        h('button', { class: 'icon-btn small', 'aria-label': 'Retirer', onclick: () => change((n) => { n.splice(i, 1); }) }, icon('close', 16)))));
  });
  add(card, h('div', { class: 'row gap wrap' },
    h('button', { class: 'btn ghost small', onclick: () => pickExercise(null, (id) => change((n) => { n.push({ exId: id, sets: 3 }); })) }, '➕ Ajouter un exercice'),
    isCustom ? h('button', {
      class: 'btn ghost small',
      onclick: () => { update((st) => { delete st.custom.sessions[focus]; }); toast('Séance automatique rétablie'); redraw(); },
    }, 'Réinitialiser') : null));
  return card;
}

function pickExercise(pattern, onPick) {
  const profile = getState().profile;
  const cat = pattern ? (CATEGORIES.find((c) => c.patterns.includes(pattern))?.id || 'all') : 'all';
  let current = cat;
  let query = '';
  const list = h('div', { class: 'ex-list picker' });
  const draw = () => {
    clear(list);
    const c = CATEGORIES.find((x) => x.id === current);
    const q = query.trim().toLowerCase();
    EXERCISES.filter((e) => !['warmup', 'mobility', 'breath', 'endurance'].includes(e.pattern) && e.type !== 'round')
      .filter((e) => (!c || c.patterns.includes(e.pattern)) && (!q || e.name.toLowerCase().includes(q) || e.muscles.join(' ').toLowerCase().includes(q)))
      .sort((a, b) => Number(exerciseAllowed(b, profile)) - Number(exerciseAllowed(a, profile)))
      .forEach((e) => {
        const ok = exerciseAllowed(e, profile);
        add(list, h('button', { class: `ex-row${ok ? '' : ' warn'}`, onclick: () => { m.close(); onPick(e.id); } },
          h('div', null, h('b', null, e.name), h('div', { class: 'muted small' }, `${e.muscles.slice(0, 3).join(' · ')}${ok ? '' : ' · ⚠️ matériel ou douleur'}`)),
          e.track ? h('span', { title: 'Coach caméra' }, '📷') : null));
      });
  };
  const m = modal(h('div', { class: 'stack' },
    h('input', { class: 'input', type: 'search', placeholder: 'Rechercher un exercice…', oninput: (e) => { query = e.target.value; draw(); } }),
    h('div', { class: 'scroll-x' }, chips([{ id: 'all', label: 'Tout' }, ...CATEGORIES.filter((c) => !['mobility'].includes(c.id))], current, { multi: false, onChange: (v) => { current = v; draw(); } })),
    list), { title: 'Choisir un exercice' });
  draw();
}
