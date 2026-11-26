// Effets de bord du jeu : XP, montées de niveau, titres, popups.
import { getState, update } from '../store.js';
import {
  emptyGame, grantXp, levelInfo, rankFor, newTitles, statValues, STATS,
} from './leveling.js';
import { h } from '../ui.js';
import { say } from '../voice.js';
import { success } from '../audio.js';
import { streak } from '../services.js';
import { todayISO } from '../engine/dates.js';

export function ensureGame() {
  const s = getState();
  if (!s.game) update((st) => { st.game = { ...emptyGame(), startedAt: todayISO() }; });
  return getState().game;
}

export function award(amount, split, reason, { silent = false } = {}) {
  ensureGame();
  let res;
  update((s) => {
    res = grantXp(s.game, amount, split, reason, todayISO());
    s.game = res.game;
  });
  if (res.gained && !silent) xpChip(res.gained, reason);
  if (res.levelsGained.length) queuePopup(() => levelUpPopup(res.levelsGained[res.levelsGained.length - 1]));
  checkTitles();
  return res;
}

export function bump(counter, n = 1) {
  ensureGame();
  update((s) => { s.game.counters[counter] = (s.game.counters[counter] || 0) + n; });
  checkTitles();
}

export function checkTitles() {
  const s = getState();
  if (!s.game) return;
  const found = newTitles(s.game, s, streak());
  if (!found.length) return;
  update((st) => {
    st.game.titles.push(...found.map((t) => t.id));
    if (!st.game.equippedTitle) st.game.equippedTitle = found[0].id;
  });
  found.forEach((t) => queuePopup(() => titlePopup(t)));
}

// ---------------------------------------------------------------- Affichage
let chipTimer = null;
function xpChip(xp, reason) {
  let el = document.getElementById('xp-chip');
  if (!el) {
    el = h('div', { id: 'xp-chip', role: 'status', 'aria-live': 'polite' });
    document.body.append(el);
  }
  el.textContent = `+${xp} XP${reason ? ` · ${reason}` : ''}`;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(chipTimer);
  chipTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

const queue = [];
let showing = false;
function queuePopup(fn) {
  queue.push(fn);
  if (!showing) next();
}
function next() {
  const fn = queue.shift();
  if (!fn) { showing = false; return; }
  showing = true;
  fn(() => setTimeout(next, 250));
}

function levelUpPopup(level) {
  return (done) => {
    const g = getState().game;
    const rank = rankFor(level);
    const prevRank = rankFor(level - 1);
    const stats = statValues(g);
    success();
    say('levelup', { interrupt: true });
    const close = () => { el.classList.remove('open'); setTimeout(() => { el.remove(); done(); }, 250); };
    const el = h('div', { class: 'lvl-pop', role: 'dialog', 'aria-label': 'Niveau supérieur', onclick: close },
      h('div', { class: 'lvl-card' },
        h('div', { class: 'lvl-kicker' }, 'NIVEAU SUPÉRIEUR'),
        h('div', { class: 'lvl-num' }, level),
        rank.id !== prevRank.id ? h('div', { class: 'lvl-rank', style: { color: rank.color } }, `Nouveau rang : ${rank.id} · ${rank.desc}`) : h('div', { class: 'lvl-rank', style: { color: rank.color } }, `${rank.label} · ${rank.desc}`),
        h('div', { class: 'lvl-stats' }, STATS.map((s) => h('div', null, h('span', null, s.emoji), h('b', null, stats[s.id]), h('small', null, s.short)))),
        h('div', { class: 'muted small' }, 'Touche pour continuer')));
    document.body.append(el);
    requestAnimationFrame(() => el.classList.add('open'));
  };
}

function titlePopup(t) {
  return (done) => {
    const el = h('div', { class: 'title-pop', role: 'status' }, h('span', { class: 'tp-emoji' }, t.emoji), h('div', null, h('small', null, 'Titre débloqué'), h('b', null, t.name)));
    document.body.append(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => { el.remove(); done(); }, 300); }, 2600);
  };
}

export function playerSummary() {
  const g = ensureGame();
  const info = levelInfo(g.xp);
  return { ...info, rank: rankFor(info.level), stats: statValues(g), game: g };
}
