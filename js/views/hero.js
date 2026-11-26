// Écran « Héros » : niveau, rang, statistiques, titres, trophées de boss.
import { h, clear, toast } from '../ui.js';
import { getState, update } from '../store.js';
import { STATS, TITLES, RANKS, xpForLevel } from '../game/leveling.js';
import { BOSSES } from '../game/bosses.js';
import { monsterSvg } from '../game/monster.js';
import { playerSummary } from '../game/service.js';
import { streak } from '../services.js';
import { navigate } from '../router.js';

export function renderHero(root) {
  const s = getState();
  const ps = playerSummary();
  const g = ps.game;
  const title = TITLES.find((t) => t.id === g.equippedTitle);
  clear(root);

  root.append(h('section', { class: 'hero-card', style: { '--rank': ps.rank.color } },
    h('div', { class: 'hc-top' },
      h('div', { class: 'avatar', style: { borderColor: ps.rank.color } }, (s.profile.name || '?').slice(0, 1).toUpperCase(), h('span', { class: 'avatar-rank', style: { background: ps.rank.color } }, ps.rank.id)),
      h('div', null,
        h('div', { class: 'hc-name' }, s.profile.name || 'Héros'),
        title ? h('div', { class: 'hc-title' }, `${title.emoji} ${title.name}`) : h('div', { class: 'hc-title muted' }, 'Aucun titre équipé'),
        h('div', { class: 'hc-rank', style: { color: ps.rank.color } }, `${ps.rank.label} · ${ps.rank.desc}`))),
    h('div', { class: 'hc-level' }, h('span', null, 'NIV.'), h('b', null, ps.level)),
    h('div', { class: 'xpbar' }, h('div', { class: 'xpbar-fill', style: { width: `${ps.progress * 100}%` } })),
    h('div', { class: 'row between small muted' }, h('span', null, `${ps.into} / ${ps.next} XP`), h('span', null, `${g.xp} XP au total · 🔥 ${streak()} j`))));

  // Statistiques
  root.append(h('section', { class: 'card' },
    h('div', { class: 'card-title' }, '📊 Statistiques'),
    h('div', { class: 'stats-wrap' },
      radar(ps.stats),
      h('div', { class: 'stat-list' }, STATS.map((st) => h('div', { class: 'stat-row' },
        h('span', { class: 'stat-emoji' }, st.emoji),
        h('div', null, h('b', null, `${st.label} `), h('span', { class: 'stat-val' }, ps.stats[st.id]), h('div', { class: 'muted small' }, st.desc)))))),
    h('p', { class: 'small muted' }, 'Tes stats montent toutes seules selon ce que tu fais : muscu → Force, cardio → Endurance, Muay Thai → Agilité, reps parfaites à la caméra → Technique, quêtes et régularité → Mental.')));

  // Rangs
  root.append(h('section', { class: 'card' },
    h('div', { class: 'card-title' }, '🏅 Rangs'),
    h('div', { class: 'ranks' }, RANKS.map((r) => h('div', { class: `rank-step${ps.level >= r.min ? ' on' : ''}`, style: { '--c': r.color } },
      h('b', null, r.id), h('span', null, `niv. ${r.min}`)))),
    h('p', { class: 'small muted' }, `Prochain niveau : ${xpForLevel(ps.level) - ps.into} XP. Gagne de l’XP avec les séances, les quêtes, la caméra et les boss.`)));

  // Titres
  root.append(h('section', { class: 'card' },
    h('div', { class: 'card-title' }, `🎖️ Titres (${g.titles.length}/${TITLES.length})`),
    h('p', { class: 'small muted' }, 'Touche un titre débloqué pour l’afficher sous ton nom.'),
    h('div', { class: 'title-grid' }, TITLES.map((t) => {
      const on = g.titles.includes(t.id);
      return h('button', {
        class: `title-chip${on ? ' on' : ''}${g.equippedTitle === t.id ? ' eq' : ''}`,
        disabled: !on,
        onclick: () => { update((st) => { st.game.equippedTitle = t.id; }); toast(`Titre équipé : ${t.name}`); renderHero(root); },
      }, h('span', null, on ? t.emoji : '🔒'), h('b', null, t.name), h('small', null, t.desc));
    }))));

  // Trophées de boss
  root.append(h('section', { class: 'card' },
    h('div', { class: 'card-title' }, '🏆 Trophées de boss'),
    h('div', { class: 'trophies' }, BOSSES.map((b) => {
      const r = g.bosses[b.id];
      return h('div', { class: `trophy${r?.wins ? ' won' : ''}` },
        h('div', { html: monsterSvg(b, { size: 56 }) }),
        h('small', null, r?.wins ? `${r.bestGrade} · ×${r.wins}` : '—'));
    })),
    h('button', { class: 'btn ghost small', onclick: () => navigate('#/arena') }, 'Aller à l’arène')));

  root.append(h('div', { class: 'row gap wrap' },
    h('button', { class: 'btn ghost grow', onclick: () => navigate('#/progress') }, '📈 Mes progrès (poids, records…)'),
    h('button', { class: 'btn ghost grow', onclick: () => navigate('#/profile') }, '⚙️ Profil & réglages')));
}

function radar(stats) {
  const size = 200; const c = size / 2; const R = 72;
  const max = Math.max(10, ...Object.values(stats));
  const pts = STATS.map((s, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / STATS.length;
    const r = (stats[s.id] / max) * R;
    return { x: c + r * Math.cos(a), y: c + r * Math.sin(a), lx: c + (R + 18) * Math.cos(a), ly: c + (R + 18) * Math.sin(a), s };
  });
  const ring = (f) => STATS.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / STATS.length;
    return `${c + R * f * Math.cos(a)},${c + R * f * Math.sin(a)}`;
  }).join(' ');
  const wrap = h('div', { class: 'radar' });
  wrap.innerHTML = `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Radar des statistiques">
    ${[0.33, 0.66, 1].map((f) => `<polygon points="${ring(f)}" class="r-grid"/>`).join('')}
    <polygon points="${pts.map((p) => `${p.x},${p.y}`).join(' ')}" class="r-area"/>
    ${pts.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="3.5" class="r-dot"/><text x="${p.lx}" y="${p.ly + 4}" text-anchor="middle" class="r-lbl">${p.s.short}</text>`).join('')}
  </svg>`;
  return wrap;
}
