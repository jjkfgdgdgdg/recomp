// Académie : guides, bibliothèque, carte musculaire, liens bien-être.
import { h, add, clear } from '../ui.js';
import { GUIDES, GUIDE } from '../data/guides.js';
import { getState } from '../store.js';
import { weeklyVolume, GROUPS, volumeLevel } from '../data/muscles.js';
import { todayISO } from '../engine/dates.js';
import { volumeMap } from './musclemap.js';
import { demoPlayer } from './demo.js';
import { navigate } from '../router.js';

export function renderAcademy(root) {
  clear(root);
  const vol = weeklyVolume(getState(), todayISO());
  const lagging = GROUPS.filter((g) => (vol[g.id] || 0) < 4).map((g) => g.label);
  const cats = [...new Set(GUIDES.map((g) => g.cat))];
  add(root,
    h('section', { class: 'page-head' }, h('h1', null, '🎓 Académie'), h('p', { class: 'muted' }, 'Tout ce qu’il faut savoir pour prendre du muscle et progresser en Muay Thai.')),
    h('a', { class: 'card feature', href: '#/library' },
      h('div', { class: 'feature-demo' }, demoPlayer('squat', { size: 120, compact: true })),
      h('div', null, h('h2', null, '📚 Bibliothèque d’exercices'), h('p', { class: 'muted small' }, '~90 exercices avec démo animée, erreurs à éviter, respiration, variantes et vidéos.'), h('span', { class: 'link' }, 'Explorer →'))),
    h('section', { class: 'card' },
      h('div', { class: 'card-title' }, '🗺️ Ta carte musculaire (7 derniers jours)'),
      h('p', { class: 'small muted' }, 'Séries par muscle cette semaine. Pour grossir, vise 10 à 20 séries par muscle.'),
      volumeMap(vol),
      lagging.length && lagging.length < GROUPS.length ? h('p', { class: 'pill info' }, `À renforcer : ${lagging.slice(0, 4).join(', ')}`) : null),
    cats.map((c) => [
      h('h2', { class: 'section-title' }, c),
      h('div', { class: 'guide-grid' }, GUIDES.filter((g) => g.cat === c).map((g) => h('a', { class: 'guide-card', href: `#/guide/${g.id}` },
        h('span', { class: 'tc-emoji' }, g.emoji), h('b', null, g.title), h('span', { class: 'muted small' }, `${g.minutes} min de lecture`)))),
    ]),
    h('section', { class: 'card soft' },
      h('div', { class: 'card-title' }, '🧘 Bien-être & récupération'),
      h('p', { class: 'small muted' }, 'Respiration guidée, routines de mobilité, suivi du sommeil.'),
      h('button', { class: 'btn ghost', onclick: () => navigate('#/wellness') }, 'Ouvrir Bien-être')),
  );
}

export function renderGuide(root, { id }) {
  const g = GUIDE[id];
  if (!g) { navigate('#/academy', { replace: true }); return; }
  clear(root);
  const idx = GUIDES.indexOf(g);
  const next = GUIDES[(idx + 1) % GUIDES.length];
  add(root, h('article', { class: 'guide' },
    h('button', { class: 'link small', onclick: () => history.back() }, '← Retour'),
    h('div', { class: 'guide-emoji' }, g.emoji),
    h('h1', null, g.title),
    h('p', { class: 'lead' }, g.intro),
    g.sections.map((s) => h('section', null,
      h('h2', null, s.h),
      (s.p || []).map((p) => h('p', null, p)),
      s.list ? h('ul', { class: 'bullets' }, s.list.map((li) => h('li', null, li))) : null)),
    h('a', { class: 'card next-guide', href: `#/guide/${next.id}` }, h('span', { class: 'muted small' }, 'Guide suivant'), h('b', null, `${next.emoji} ${next.title}`))));
}
