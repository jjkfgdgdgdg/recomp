// Bibliothèque d'exercices + fiche détaillée (démo animée, étapes, erreurs, respiration, variantes, vidéos).
import { h, clear, chips, icon } from '../ui.js';
import { EXERCISES, EX, EQUIPMENT, exerciseAllowed } from '../data/exercises.js';
import { CATEGORIES, techFor, youtubeSearch } from '../data/technique.js';
import { EXERCISE_DEMO } from '../pose/demos.js';
import { TRACKERS } from '../pose/trackers.js';
import { exerciseGroups } from '../data/muscles.js';
import { getState } from '../store.js';
import { demoPlayer } from './demo.js';
import { exerciseMap } from './musclemap.js';
import { openCoach } from './coachOverlay.js';
import { navigate } from '../router.js';

const LEVEL_STARS = ['', '⭐', '⭐⭐', '⭐⭐⭐'];

export function renderLibrary(root, params = {}) {
  const profile = getState().profile;
  let cat = params.cat || 'all';
  let query = '';
  let onlyMine = false;
  clear(root);
  const list = h('div', { class: 'ex-list' });
  const count = h('span', { class: 'muted small' });
  const draw = () => {
    clear(list);
    const q = query.trim().toLowerCase();
    const c = CATEGORIES.find((x) => x.id === cat);
    const items = EXERCISES.filter((e) => (!c || c.patterns.includes(e.pattern))
      && (!q || e.name.toLowerCase().includes(q) || e.muscles.join(' ').toLowerCase().includes(q))
      && (!onlyMine || exerciseAllowed(e, profile)));
    count.textContent = `${items.length} exercice${items.length > 1 ? 's' : ''}`;
    items.forEach((e) => list.append(h('a', { class: 'ex-row', href: `#/exercise/${e.id}` },
      h('div', null, h('b', null, e.name), h('div', { class: 'muted small' }, e.muscles.slice(0, 3).join(' · '))),
      h('div', { class: 'ex-tags' },
        EXERCISE_DEMO[e.id] ? h('span', { title: 'Démo animée' }, '🎬') : null,
        e.track && TRACKERS[e.track] ? h('span', { title: 'Coach caméra' }, '📷') : null,
        h('span', { class: 'stars' }, LEVEL_STARS[e.level])))));
  };
  root.append(
    h('section', { class: 'page-head' },
      h('a', { class: 'link small', href: '#/academy' }, '← Académie'),
      h('h1', null, '📚 Bibliothèque d’exercices'),
      h('p', { class: 'muted' }, 'Chaque fiche : démo animée, étapes, erreurs à éviter, respiration, variantes et vidéos.')),
    h('input', { class: 'input', type: 'search', placeholder: 'Rechercher (ex. pompes, fessiers…)', oninput: (e) => { query = e.target.value; draw(); } }),
    h('div', { class: 'scroll-x' }, chips([{ id: 'all', label: 'Tout' }, ...CATEGORIES], cat, { multi: false, onChange: (v) => { cat = v; draw(); } })),
    h('label', { class: 'check small' }, h('input', { type: 'checkbox', onchange: (e) => { onlyMine = e.target.checked; draw(); } }), h('span', null, 'Seulement ceux possibles avec mon matériel et mes douleurs')),
    count, list,
  );
  draw();
}

export function renderExercise(root, { id }) {
  const ex = EX[id];
  if (!ex) { navigate('#/library', { replace: true }); return; }
  const profile = getState().profile;
  const tech = techFor(ex);
  const demoId = EXERCISE_DEMO[ex.id];
  const tracker = ex.track && TRACKERS[ex.track];
  const allowed = exerciseAllowed(ex, profile);
  const groups = exerciseGroups(ex.id);
  clear(root);
  root.append(
    h('section', { class: 'page-head' },
      h('button', { class: 'link small', onclick: () => history.back() }, '← Retour'),
      h('h1', null, ex.name),
      h('div', { class: 'row gap wrap' },
        h('span', { class: 'pill info' }, `Niveau ${LEVEL_STARS[ex.level]}`),
        h('span', { class: 'pill' }, ex.equip.includes('none') ? 'Sans matériel' : EQUIPMENT.filter((e) => ex.equip.includes(e.id)).map((e) => e.label).join(' / ')),
        !allowed ? h('span', { class: 'pill warn' }, '⚠️ Déconseillé avec ton profil') : null)),
    demoId ? h('section', { class: 'card demo-card' }, demoPlayer(demoId)) : null,
    h('section', { class: 'row gap wrap' },
      h('a', { class: 'btn ghost grow', href: youtubeSearch(ex.name), target: '_blank', rel: 'noopener' }, '▶️ Voir des vidéos tuto'),
      tracker ? h('button', { class: 'btn cam grow', onclick: () => openCoach({ trackerId: ex.track, exId: ex.id, title: ex.name }) }, icon('camera'), ' Essayer avec la caméra') : null),
    h('section', { class: 'card' },
      h('div', { class: 'card-title' }, '🎯 Muscles travaillés'),
      h('div', { class: 'row gap ex-muscles' },
        groups.length ? exerciseMap(groups) : null,
        h('div', null, ex.muscles.map((m, i) => h('div', { class: i === 0 ? 'b' : 'muted' }, i === 0 ? `● ${m} (principal)` : `○ ${m}`))))),
    h('section', { class: 'card' },
      h('div', { class: 'card-title' }, '📋 Comment faire'),
      h('ol', { class: 'cues big' }, ex.cues.map((c) => h('li', null, c)))),
    h('section', { class: 'card' },
      h('div', { class: 'card-title' }, '❌ Erreurs fréquentes'),
      h('ul', { class: 'bullets' }, tech.mistakes.map((m) => h('li', null, m)))),
    h('section', { class: 'grid2 cards' },
      h('div', { class: 'card' }, h('div', { class: 'card-title' }, '🌬️ Respiration'), h('p', { class: 'small' }, tech.breath)),
      h('div', { class: 'card' }, h('div', { class: 'card-title' }, '💡 Conseils'), h('ul', { class: 'bullets small' }, tech.tips.map((t) => h('li', null, t))))),
    (ex.easier || ex.harder) ? h('section', { class: 'card' },
      h('div', { class: 'card-title' }, '🪜 Progression'),
      ex.easier && EX[ex.easier] ? h('a', { class: 'ex-row', href: `#/exercise/${ex.easier}` }, h('span', null, '⬇️ Plus facile : ', h('b', null, EX[ex.easier].name))) : null,
      ex.harder && EX[ex.harder] ? h('a', { class: 'ex-row', href: `#/exercise/${ex.harder}` }, h('span', null, '⬆️ Plus dur : ', h('b', null, EX[ex.harder].name))) : null) : null,
    tracker ? h('section', { class: 'card soft small' }, h('b', null, '📱 Placement caméra : '), tracker.place) : null,
  );
}
