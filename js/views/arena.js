// Arène : combats de boss + coach caméra (entraînement libre, tests de niveau).
import { h, clear, modal } from '../ui.js';
import { getState } from '../store.js';
import { BOSSES, bossUnlocked, phaseTarget } from '../game/bosses.js';
import { monsterSvg } from '../game/monster.js';
import { playerSummary } from '../game/service.js';
import { formatDuration } from '../engine/dates.js';
import { TRACKERS } from '../pose/trackers.js';
import { openBossFight } from './bossFight.js';
import { renderCoach } from './coach.js';

export function renderArena(root) {
  const ps = playerSummary();
  const g = ps.game;
  clear(root);
  root.append(h('section', { class: 'page-head' },
    h('h1', null, '⚔️ Arène'),
    h('p', { class: 'muted' }, 'Affronte des boss avec ton corps. Chaque rep propre validée par la caméra lui inflige des dégâts : plus ta technique est parfaite, plus tu frappes fort.')));

  root.append(h('div', { class: 'boss-grid' }, BOSSES.map((b) => {
    const unlocked = bossUnlocked(b, ps.level);
    const rec = g.bosses[b.id];
    const card = h('button', { class: `boss-card${unlocked ? '' : ' locked'}`, onclick: () => (unlocked ? bossModal(b, root) : null), 'aria-disabled': String(!unlocked) },
      h('div', { class: 'boss-art', html: monsterSvg(b, { size: 96 }) }),
      h('div', { class: 'boss-meta' },
        h('div', null, h('span', { class: `rank-badge r-${b.rank}` }, b.rank), h('b', null, b.name)),
        h('div', { class: 'muted small' }, b.phases.map((p) => p.move).join(' → ')),
        unlocked
          ? h('div', { class: 'small' }, rec?.wins ? `🏆 ${rec.wins} victoire${rec.wins > 1 ? 's' : ''} · meilleure note ${rec.bestGrade}` : 'Pas encore vaincu')
          : h('div', { class: 'small warn-text' }, `🔒 Niveau ${b.minLevel} requis`)));
    return card;
  })));

  root.append(h('div', { class: 'card soft small' },
    h('b', null, 'Comment ça marche'),
    h('ul', { class: 'bullets' },
      h('li', null, 'Rep valide = dégâts. Rep parfaite = chance de coup critique (×2).'),
      h('li', null, 'Enchaîne les reps propres : le combo augmente tes dégâts jusqu’à ×2. Une rep ratée remet le combo à zéro.'),
      h('li', null, 'Quand le boss attaque (⚠️), fais vite les reps demandées pour esquiver. Sinon tu perds des PV.'),
      h('li', null, 'Ta Force augmente tes dégâts, ton Endurance tes PV, ta Technique tes critiques.'),
      h('li', null, 'Pas de caméra ? Mode manuel possible, mais dégâts réduits.'))));

  const coachBox = h('div');
  root.append(coachBox);
  renderCoach(coachBox);
}

function bossModal(b, root) {
  const ps = playerSummary();
  const profile = getState().profile;
  const m = modal(h('div', { class: 'stack' },
    h('div', { class: 'boss-modal-art', html: monsterSvg(b, { size: 150, className: 'idle' }) }),
    h('p', { class: 'muted' }, b.lore),
    h('div', { class: 'card soft' },
      h('div', { class: 'card-title' }, 'Phases du combat'),
      h('ol', { class: 'small' }, b.phases.map((p) => {
        const t = phaseTarget(p, profile, ps.level, b.rank);
        const what = t.secs ? `≈ ${t.secs} s de gainage` : t.hits ? `≈ ${t.hits} coups` : `≈ ${t.reps} reps parfaites`;
        return h('li', null, h('b', null, p.move), ` — ${what} (${TRACKERS[p.tracker].view})`);
      }))),
    h('p', { class: 'small' }, `⚠️ Attaque spéciale : ${b.attack.name}, toutes les ${b.attack.every} s.`),
    ps.game.bosses[b.id]?.bestTimeSec ? h('p', { class: 'small muted' }, `Record : ${formatDuration(ps.game.bosses[b.id].bestTimeSec)} · note ${ps.game.bosses[b.id].bestGrade}`) : null,
    h('button', { class: 'btn primary big', onclick: () => { m.close(); openBossFight(b.id, { onDone: () => renderArena(root) }); } }, '📷 Combattre avec la caméra'),
    h('button', { class: 'btn ghost', onclick: () => { m.close(); openBossFight(b.id, { manual: true, onDone: () => renderArena(root) }); } }, 'Combattre sans caméra (dégâts réduits)')),
  { title: `${b.name} · Rang ${b.rank}` });
}
