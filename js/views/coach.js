// Onglet « Coach caméra » : choisir un exercice, une série libre, un objectif ou un test de niveau.
import { h, clear, modal, chips, toast } from '../ui.js';
import { getState, update } from '../store.js';
import { TRACKERS, TEMPO_TRACKERS } from '../pose/trackers.js';
import { roundConfig } from '../data/muaythai.js';
import { todayISO, shortDate } from '../engine/dates.js';
import { openCoach } from './coachOverlay.js';
import { EXERCISES } from '../data/exercises.js';
import { award } from '../game/service.js';

const GROUPS = [
  { title: 'Haut du corps', ids: ['pushup', 'knee_pushup', 'pike', 'dips', 'pullup', 'row', 'curl', 'press'] },
  { title: 'Bas du corps', ids: ['squat', 'lunge', 'hinge', 'bridge', 'calf', 'wall_sit'] },
  { title: 'Abdos & gainage', ids: ['plank', 'leg_raise', 'knee_raise', 'mountain'] },
  { title: 'Cardio', ids: ['jacks', 'high_knees', 'jump_squat', 'burpee', 'jumps', 'swing'] },
  { title: 'Muay Thai', ids: ['guard', 'kicks', 'knees'] },
];

const EMOJI = {
  pushup: '🫸', knee_pushup: '🧎', squat: '🏋️', lunge: '🚶', bridge: '🌉', curl: '💪', press: '🙌', plank: '🧱',
  jacks: '⭐', high_knees: '🏃', jump_squat: '🦘', burpee: '🔥', guard: '🥊', kicks: '🦵', knees: '🦿',
  pike: '🔺', dips: '⬇️', pullup: '🧗', row: '🚣', hinge: '🏋️', swing: '🔔', calf: '🦶', wall_sit: '🪑', leg_raise: '🦵', knee_raise: '🧗', mountain: '⛰️', jumps: '🪢',
};

// Tests de niveau qui mettent à jour le profil (et donc le programme)
const TESTS = [
  { key: 'push', trackerId: 'pushup', label: 'Max pompes', info: 'Fais le maximum de pompes propres d’affilée.' },
  { key: 'squat', trackerId: 'squat', label: 'Squats en 1 min', info: 'Le plus de squats complets possible en 60 secondes.', secs: 60 },
  { key: 'plank', trackerId: 'plank', label: 'Gainage max', info: 'Tiens la planche le plus longtemps possible, corps aligné.' },
];

export function renderCoach(root) {
  const s = getState();
  clear(root);
  root.append(h('section', { class: 'page-head' },
    h('h1', null, 'Coach caméra'),
    h('p', { class: 'muted' }, 'Un squelette se dessine sur toi : il compte tes reps et corrige ta posture en direct. Tout est calculé sur ton téléphone, rien n’est envoyé.')));

  root.append(h('section', { class: 'card soft' },
    h('div', { class: 'card-title' }, '🎯 Tests de niveau'),
    h('p', { class: 'small muted' }, 'Refais-les toutes les 4 semaines : ton programme se recalibre avec tes nouveaux résultats.'),
    h('div', { class: 'row gap wrap' }, TESTS.map((t) => h('button', { class: 'btn ghost small', onclick: () => runTest(t, () => renderCoach(root)) }, t.label)))));

  GROUPS.forEach((g) => {
    root.append(h('h2', { class: 'section-title' }, g.title));
    root.append(h('div', { class: 'tracker-grid' }, g.ids.map((id) => {
      const t = TRACKERS[id];
      const rec = s.records[id];
      return h('button', { class: 'tracker-card', onclick: () => configure(id) },
        h('span', { class: 'tc-emoji' }, EMOJI[id] || '🎯'),
        h('b', null, t.label),
        h('span', { class: 'muted small' }, t.view),
        rec ? h('span', { class: 'tc-rec' }, `🏆 ${t.mode === 'hold' ? `${rec.holdSec} s` : `${rec.reps}`}`) : null);
    })));
  });

  const history = [...s.logs.coach].reverse().slice(0, 8);
  if (history.length) {
    root.append(h('h2', { class: 'section-title' }, 'Dernières séries filmées'));
    root.append(h('div', { class: 'card list' }, history.map((c) => {
      const t = TRACKERS[c.trackerId];
      return h('div', { class: 'list-row' },
        h('span', null, EMOJI[c.trackerId] || '🎯', ' ', t?.label || c.trackerId),
        h('span', { class: 'muted small' }, shortDate(c.date)),
        h('b', null, t?.mode === 'hold' ? `${c.holdSec} s` : t?.mode === 'guard' ? `${c.score}% garde` : `${c.reps} ✓ ${c.partial ? `· ${c.partial} ✗` : ''}`));
    })));
  }

  root.append(h('section', { class: 'card soft small' },
    h('b', null, 'Astuces pour une détection parfaite'),
    h('ul', { class: 'bullets' },
      h('li', null, 'Pose le téléphone contre un mur ou une bouteille, à 2-3 m.'),
      h('li', null, 'Bonne lumière, pas de fenêtre derrière toi.'),
      h('li', null, 'Vêtements près du corps : les articulations sont mieux repérées.'),
      h('li', null, 'Si c’est lent, choisis le modèle « rapide » dans Profil > Réglages.'))));
}

function configure(id) {
  const t = TRACKERS[id];
  const prof = getState().profile;
  let mode = t.mode === 'guard' ? 'rounds' : 'free';
  let target = t.mode === 'hold' ? 45 : 12;
  let rounds = 3;
  let tempo = 'free';
  const opts = t.mode === 'guard'
    ? [{ id: 'rounds', label: 'Rounds avec combos annoncés' }, { id: 'free', label: 'Libre' }]
    : [{ id: 'free', label: 'Série libre' }, { id: 'target', label: t.mode === 'hold' ? 'Objectif de temps' : 'Objectif de reps' }];
  const extra = h('div');
  const renderExtra = () => {
    clear(extra);
    if (mode === 'target') {
      const vals = t.mode === 'hold' ? [20, 30, 45, 60, 90, 120] : [5, 8, 10, 12, 15, 20, 30];
      extra.append(chips(vals.map((v) => ({ id: v, label: t.mode === 'hold' ? `${v} s` : `${v}` })), target, { multi: false, onChange: (v) => { target = v; } }));
    } else if (mode === 'rounds') {
      extra.append(chips([1, 2, 3, 4, 5, 6].map((v) => ({ id: v, label: `${v} round${v > 1 ? 's' : ''}` })), rounds, { multi: false, onChange: (v) => { rounds = v; } }));
    }
  };
  renderExtra();
  const m = modal(h('div', { class: 'stack' },
    h('p', null, t.place),
    chips(opts, mode, { multi: false, onChange: (v) => { mode = v; renderExtra(); } }),
    extra,
    TEMPO_TRACKERS.has(id) ? h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Tempo'),
      chips([{ id: 'free', label: 'Libre (alerte si trop rapide)' }, { id: 'slow', label: '🐢 Lent : 2 s au retour' }], tempo, { multi: false, onChange: (v) => { tempo = v; } }),
      h('span', { class: 'hint' }, 'Le tempo lent (2 s sur la phase de retour) fait travailler le muscle plus longtemps : idéal pour la prise de muscle.')) : null,
    h('button', {
      class: 'btn primary big',
      onclick: () => {
        m.close();
        const cfg = roundConfig(prof.mtLevel ?? 0);
        openCoach({
          trackerId: id,
          title: t.label,
          target: mode === 'target' ? (t.mode === 'hold' ? { secs: target } : { reps: target }) : {},
          rounds: mode === 'rounds' ? { rounds, work: cfg.round, rest: cfg.rest, combos: true, mtLevel: prof.mtLevel ?? 1, comboEvery: cfg.comboEvery } : null,
          tempo: TEMPO_TRACKERS.has(id) ? tempo : null,
          onDone: () => {},
        });
      },
    }, '📷 Ouvrir la caméra')),
  { title: t.label });
}

function runTest(test, rerender) {
  const t = TRACKERS[test.trackerId];
  const m = modal(h('div', { class: 'stack' },
    h('p', null, test.info),
    h('p', { class: 'small muted' }, t.place),
    test.secs ? h('p', { class: 'small' }, `Le test s’arrête automatiquement après ${test.secs} secondes. Appuie sur « Terminer » si tu veux arrêter avant.`) : h('p', { class: 'small' }, 'Appuie sur « Terminer » quand tu ne peux plus.'),
    h('button', {
      class: 'btn primary big',
      onclick: () => {
        m.close();
        openCoach({
          trackerId: test.trackerId,
          title: `Test : ${test.label}`,
          test: true,
          timeLimit: test.secs || null,
          target: {},
          onDone: (sum) => {
            if (!sum) return;
            const value = t.mode === 'hold' ? sum.holdSec : sum.reps;
            update((s) => {
              s.profile.tests = { ...(s.profile.tests || {}), [test.key]: value };
              s.logs.tests.push({ date: todayISO(), [test.key]: value, source: 'camera' });
              // Les objectifs au poids du corps basés sur ce test repartent du nouveau résultat
              EXERCISES.filter((e) => e.base === test.key && !e.weighted).forEach((e) => { delete s.progression.ex[e.id]; });
            });
            toast(`Résultat enregistré : ${value}${t.mode === 'hold' ? ' s' : ''}. Programme recalibré !`, 3500);
            award(50, { str: 0.5, end: 0.3, men: 0.2 }, 'Test de niveau');
            rerender();
          },
        });
      },
    }, 'Commencer le test')),
  { title: test.label });
}
