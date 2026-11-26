// Carte musculaire (face + dos) colorée selon le volume de la semaine ou les muscles d'un exercice.
import { h } from '../ui.js';
import { GROUPS, volumeLevel } from '../data/muscles.js';

// Formes simplifiées (silhouette stylisée originale). Coordonnées dans un repère 120 × 260.
const FRONT = {
  shoulders: ['<ellipse cx="34" cy="62" rx="11" ry="9"/>', '<ellipse cx="86" cy="62" rx="11" ry="9"/>'],
  chest: ['<path d="M42 60 Q60 56 59 62 L59 82 Q48 86 40 78 Z"/>', '<path d="M78 60 Q60 56 61 62 L61 82 Q72 86 80 78 Z"/>'],
  biceps: ['<ellipse cx="27" cy="85" rx="6" ry="14"/>', '<ellipse cx="93" cy="85" rx="6" ry="14"/>'],
  forearms: ['<ellipse cx="22" cy="115" rx="5" ry="15"/>', '<ellipse cx="98" cy="115" rx="5" ry="15"/>'],
  abs: ['<rect x="50" y="86" width="20" height="40" rx="6"/>'],
  obliques: ['<path d="M41 88 L49 90 L49 124 L43 120 Z"/>', '<path d="M79 88 L71 90 L71 124 L77 120 Z"/>'],
  quads: ['<path d="M42 140 Q52 136 58 142 L56 190 Q48 194 44 188 Z"/>', '<path d="M78 140 Q68 136 62 142 L64 190 Q72 194 76 188 Z"/>'],
  calves: ['<ellipse cx="49" cy="222" rx="6" ry="17"/>', '<ellipse cx="71" cy="222" rx="6" ry="17"/>'],
};
const BACK = {
  shoulders: ['<ellipse cx="34" cy="62" rx="11" ry="9"/>', '<ellipse cx="86" cy="62" rx="11" ry="9"/>'],
  back: ['<path d="M44 58 L76 58 L80 82 L68 110 L52 110 L40 82 Z"/>'],
  triceps: ['<ellipse cx="27" cy="85" rx="6" ry="14"/>', '<ellipse cx="93" cy="85" rx="6" ry="14"/>'],
  forearms: ['<ellipse cx="22" cy="115" rx="5" ry="15"/>', '<ellipse cx="98" cy="115" rx="5" ry="15"/>'],
  lowerback: ['<rect x="51" y="110" width="18" height="18" rx="5"/>'],
  glutes: ['<path d="M42 130 Q60 124 59 132 L59 150 Q48 156 41 148 Z"/>', '<path d="M78 130 Q60 124 61 132 L61 150 Q72 156 79 148 Z"/>'],
  hamstrings: ['<path d="M43 156 L57 156 L56 192 Q49 196 45 190 Z"/>', '<path d="M77 156 L63 156 L64 192 Q71 196 75 190 Z"/>'],
  calves: ['<ellipse cx="49" cy="222" rx="7" ry="17"/>', '<ellipse cx="71" cy="222" rx="7" ry="17"/>'],
};

const SILHOUETTE = `
  <circle cx="60" cy="26" r="14"/>
  <path d="M52 40 h16 v10 h-16z"/>
  <path d="M30 54 Q60 44 90 54 L100 70 L106 132 L96 134 L88 96 L84 130 L82 200 L78 250 L64 250 L62 160 L58 160 L56 250 L42 250 L38 200 L36 130 L32 96 L24 134 L14 132 L20 70 Z"/>`;

function figure(regions, colorFor, label) {
  const parts = Object.entries(regions).map(([g, shapes]) => shapes.map((s) => s.replace('/>', ` class="mm-${colorFor(g)}" data-g="${g}"/>`)).join('')).join('');
  return `<svg viewBox="0 0 120 260" class="mm-fig" role="img" aria-label="${label}"><g class="mm-sil">${SILHOUETTE}</g>${parts}</svg>`;
}

/** Carte du volume hebdomadaire. vol = { group: séries } */
export function volumeMap(vol) {
  const colorFor = (g) => volumeLevel(vol[g] || 0).id;
  const wrap = h('div', { class: 'muscle-map' });
  wrap.innerHTML = `<div class="mm-row"><div>${figure(FRONT, colorFor, 'Muscles de face')}<span>Face</span></div><div>${figure(BACK, colorFor, 'Muscles de dos')}<span>Dos</span></div></div>`;
  wrap.append(h('div', { class: 'mm-legend small' },
    h('span', null, h('i', { class: 'mm-none' }), ' < 4 séries'),
    h('span', null, h('i', { class: 'mm-low' }), ' 4-9'),
    h('span', null, h('i', { class: 'mm-good' }), ' 10-20 (croissance)'),
    h('span', null, h('i', { class: 'mm-high' }), ' > 20')));
  wrap.append(h('div', { class: 'mm-list' }, GROUPS.map((g) => {
    const v = vol[g.id] || 0;
    return h('div', { class: 'mm-item' }, h('span', null, g.label), h('div', { class: 'bar' }, h('div', { class: `bar-fill mm-bar-${volumeLevel(v).id}`, style: { width: `${Math.min(100, (v / 20) * 100)}%` } })), h('b', null, v));
  })));
  return wrap;
}

/** Petite carte qui surligne les muscles d'un exercice. groups = [{group, weight}] */
export function exerciseMap(groups) {
  const map = Object.fromEntries(groups.map((g) => [g.group, g.weight >= 1 ? 'primary' : 'secondary']));
  const colorFor = (g) => map[g] || 'off';
  const wrap = h('div', { class: 'muscle-map small-map' });
  wrap.innerHTML = `<div class="mm-row"><div>${figure(FRONT, colorFor, 'Face')}</div><div>${figure(BACK, colorFor, 'Dos')}</div></div>`;
  return wrap;
}
