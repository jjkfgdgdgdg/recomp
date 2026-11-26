// Composants partagés entre les écrans.
import { h, modal, icon } from '../ui.js';
import { EX } from '../data/exercises.js';
import { TYPE_META } from '../engine/planner.js';
import { prescription, itemTitle } from '../services.js';
import { TRACKERS } from '../pose/trackers.js';
import { openCoach } from './coachOverlay.js';

export function typeBadge(type) {
  const m = TYPE_META[type] || TYPE_META.rest;
  return h('span', { class: `type-badge t-${type}` }, `${m.emoji} ${m.label}`);
}

export function exerciseModal(exId) {
  const ex = EX[exId];
  if (!ex) return;
  const track = ex.track && TRACKERS[ex.track];
  const m = modal(h('div', { class: 'stack' },
    h('div', { class: 'muted' }, ex.muscles.join(' · ')),
    h('ol', { class: 'cues' }, ex.cues.map((c) => h('li', null, c))),
    track ? h('div', { class: 'card soft' },
      h('div', { class: 'row gap' }, icon('camera'), h('b', null, 'Compatible coach caméra')),
      h('p', { class: 'small muted' }, track.place),
      h('button', {
        class: 'btn primary',
        onclick: () => { m.close(); openCoach({ trackerId: ex.track, exId: ex.id, title: ex.name }); },
      }, 'Essayer avec la caméra')) : null,
    ex.easier && EX[ex.easier] ? h('div', { class: 'small' }, 'Plus facile : ', h('a', { href: '#', onclick: (e) => { e.preventDefault(); m.close(); exerciseModal(ex.easier); } }, EX[ex.easier].name)) : null,
    ex.harder && EX[ex.harder] ? h('div', { class: 'small' }, 'Plus dur : ', h('a', { href: '#', onclick: (e) => { e.preventDefault(); m.close(); exerciseModal(ex.harder); } }, EX[ex.harder].name)) : null),
  { title: ex.name });
}

export function sessionList(session, { compact = false } = {}) {
  return h('div', { class: 'session-list' }, session.blocks.map((b) => h('div', { class: 'block' },
    h('div', { class: 'block-name' }, b.name),
    b.items.map((it) => h('button', { class: 'item-row', onclick: () => exerciseModal(it.kind === 'interval' ? it.exercises[0] : it.exId) },
      h('span', { class: 'item-name' }, itemTitle(it), it.track && TRACKERS[it.track] ? h('span', { class: 'cam-dot', title: 'Coach caméra disponible' }, '📷') : null),
      h('span', { class: 'item-presc' }, prescription(it)),
      !compact && it.kind === 'interval' ? h('span', { class: 'item-sub' }, it.exercises.map((id) => EX[id]?.name).join(' → ')) : null)))));
}

export function emptyState(emoji, title, text, action) {
  return h('div', { class: 'empty' }, h('div', { class: 'empty-emoji' }, emoji), h('h3', null, title), h('p', { class: 'muted' }, text), action || null);
}
