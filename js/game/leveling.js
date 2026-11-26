// Progression façon RPG : XP, niveaux, rangs, statistiques et titres. Fonctions pures.

export const RANKS = [
  { id: 'E', min: 1, label: 'Rang E', color: '#9aa4b2', desc: 'Recrue' },
  { id: 'D', min: 10, label: 'Rang D', color: '#4ade80', desc: 'Combattant' },
  { id: 'C', min: 20, label: 'Rang C', color: '#38bdf8', desc: 'Guerrier' },
  { id: 'B', min: 35, label: 'Rang B', color: '#a78bfa', desc: 'Élite' },
  { id: 'A', min: 50, label: 'Rang A', color: '#f59e0b', desc: 'Champion' },
  { id: 'S', min: 70, label: 'Rang S', color: '#ef4444', desc: 'Légende' },
];

export const STATS = [
  { id: 'str', label: 'Force', short: 'FOR', emoji: '💪', desc: 'Musculation, charges, pompes, squats' },
  { id: 'end', label: 'Endurance', short: 'END', emoji: '🫀', desc: 'Cardio, rounds, séances longues, hydratation' },
  { id: 'agi', label: 'Agilité', short: 'AGI', emoji: '⚡', desc: 'Muay Thai, kicks, mobilité, explosivité' },
  { id: 'tec', label: 'Technique', short: 'TEC', emoji: '🎯', desc: 'Qualité des reps validée par la caméra' },
  { id: 'men', label: 'Mental', short: 'MEN', emoji: '🧠', desc: 'Régularité, quêtes, check-ins, respiration' },
];

export function emptyGame() {
  return {
    xp: 0,
    statXp: { str: 0, end: 0, agi: 0, tec: 0, men: 0 },
    titles: [],
    equippedTitle: null,
    quests: {}, // date -> { manual: {questId: n}, claimed: bool, xpGiven: {questId: true} }
    bosses: {}, // bossId -> { wins, losses, bestTimeSec, bestGrade }
    counters: { validReps: 0, perfectSets: 0, breathing: 0, bossWins: 0, questDays: 0, waterDays: 0, camSets: 0 },
    history: [], // { date, amount, reason }
  };
}

// XP nécessaire pour passer du niveau n au niveau n+1
export function xpForLevel(level) {
  return Math.round(100 + 45 * (level - 1) + 2.5 * (level - 1) ** 2);
}

export function levelInfo(totalXp) {
  let level = 1;
  let rest = Math.max(0, Math.floor(totalXp || 0));
  while (rest >= xpForLevel(level) && level < 999) {
    rest -= xpForLevel(level);
    level += 1;
  }
  const next = xpForLevel(level);
  return { level, into: rest, next, progress: rest / next };
}

export function rankFor(level) {
  let r = RANKS[0];
  for (const rk of RANKS) if (level >= rk.min) r = rk;
  return r;
}

export function statValue(xp) {
  return 1 + Math.floor(Math.sqrt(Math.max(0, xp || 0) / 20));
}

export function statValues(game) {
  return Object.fromEntries(STATS.map((s) => [s.id, statValue(game?.statXp?.[s.id])]));
}

/**
 * Ajoute de l'XP. split = répartition dans les stats, ex. { str: 0.6, end: 0.4 }.
 * Renvoie { game, gained, levelsGained: [niveaux atteints] }.
 */
export function grantXp(game, amount, split = { men: 1 }, reason = '', date = '') {
  const g = structuredCloneSafe(game || emptyGame());
  const xp = Math.max(0, Math.round(amount));
  if (!xp) return { game: g, gained: 0, levelsGained: [] };
  const before = levelInfo(g.xp).level;
  g.xp += xp;
  const total = Object.values(split).reduce((a, b) => a + b, 0) || 1;
  Object.entries(split).forEach(([k, v]) => {
    if (k in g.statXp) g.statXp[k] += Math.round((xp * v) / total);
  });
  g.history.push({ date, amount: xp, reason });
  if (g.history.length > 300) g.history.splice(0, g.history.length - 300);
  const after = levelInfo(g.xp).level;
  const levelsGained = [];
  for (let l = before + 1; l <= after; l += 1) levelsGained.push(l);
  return { game: g, gained: xp, levelsGained };
}

function structuredCloneSafe(o) {
  return JSON.parse(JSON.stringify(o));
}

// Répartition des stats selon le type de séance
export const SPLIT = {
  strength: { str: 0.65, end: 0.15, men: 0.2 },
  muaythai: { agi: 0.4, end: 0.3, tec: 0.15, men: 0.15 },
  cardio: { end: 0.7, agi: 0.15, men: 0.15 },
  mobility: { agi: 0.4, men: 0.6 },
  camera: { tec: 0.5, str: 0.3, end: 0.2 },
  guard: { tec: 0.4, agi: 0.4, end: 0.2 },
  life: { men: 1 },
  water: { end: 0.5, men: 0.5 },
};

export function sessionXp(log) {
  const minutes = (log.durationSec || 0) / 60;
  return Math.round(Math.min(400, 50 + minutes * 2 + Math.min(150, (log.totalReps || 0) * 0.5)));
}

export function cameraXp(summary, mode) {
  if (mode === 'hold') return Math.round(Math.min(150, (summary.holdSec || 0) * 0.8 + (summary.score || 0) * 0.2));
  if (mode === 'guard') return Math.round(Math.min(200, ((summary.punches || 0) + (summary.kicks || 0) * 2) * 0.5 + (summary.score || 0) * 0.3));
  return Math.round(Math.min(200, (summary.reps || 0) * 2 + (summary.partial || 0) * 0.5 + (summary.score || 0) * 0.15));
}

// ---------------------------------------------------------------------------
// Titres (succès). check(ctx) avec ctx = { game, state, level, streak }
// ---------------------------------------------------------------------------
export const TITLES = [
  { id: 'first_step', name: 'Premier pas', emoji: '👣', desc: 'Terminer ta première séance', check: (c) => c.state.logs.sessions.length >= 1 },
  { id: 'regular', name: 'Le Régulier', emoji: '📅', desc: '7 jours de série', check: (c) => c.streak >= 7 },
  { id: 'unstoppable', name: 'Inarrêtable', emoji: '🚂', desc: '30 jours de série', check: (c) => c.streak >= 30 },
  { id: 'ten_sessions', name: 'Accro', emoji: '🔁', desc: '10 séances terminées', check: (c) => c.state.logs.sessions.length >= 10 },
  { id: 'fifty_sessions', name: 'Vétéran', emoji: '🎖️', desc: '50 séances terminées', check: (c) => c.state.logs.sessions.length >= 50 },
  { id: 'centurion', name: 'Centurion', emoji: '💯', desc: '100 reps validées par la caméra', check: (c) => c.game.counters.validReps >= 100 },
  { id: 'thousand', name: 'Machine', emoji: '🤖', desc: '1 000 reps validées par la caméra', check: (c) => c.game.counters.validReps >= 1000 },
  { id: 'perfect', name: 'Forme parfaite', emoji: '✨', desc: 'Une série de 10+ reps avec 100 % de technique', check: (c) => c.game.counters.perfectSets >= 1 },
  { id: 'boss1', name: 'Tueur de monstres', emoji: '⚔️', desc: 'Vaincre ton premier boss', check: (c) => c.game.counters.bossWins >= 1 },
  { id: 'boss_hunter', name: 'Chasseur de boss', emoji: '🏹', desc: 'Vaincre 10 boss', check: (c) => c.game.counters.bossWins >= 10 },
  { id: 'dragon', name: 'Fléau du Dragon', emoji: '🐉', desc: 'Vaincre le Dragon des Excuses', check: (c) => (c.game.bosses.dragon?.wins || 0) >= 1 },
  { id: 'quests7', name: 'Discipliné', emoji: '📜', desc: 'Toutes les quêtes du jour réussies 7 fois', check: (c) => c.game.counters.questDays >= 7 },
  { id: 'hydrated', name: 'Source vive', emoji: '💧', desc: 'Objectif d’eau atteint 7 jours', check: (c) => c.game.counters.waterDays >= 7 },
  { id: 'zen', name: 'Esprit calme', emoji: '🧘', desc: '10 séances de respiration', check: (c) => c.game.counters.breathing >= 10 },
  { id: 'rank_d', name: 'Combattant', emoji: '🟢', desc: 'Atteindre le rang D', check: (c) => c.level >= 10 },
  { id: 'rank_c', name: 'Guerrier', emoji: '🔵', desc: 'Atteindre le rang C', check: (c) => c.level >= 20 },
  { id: 'rank_b', name: 'Élite', emoji: '🟣', desc: 'Atteindre le rang B', check: (c) => c.level >= 35 },
  { id: 'rank_a', name: 'Champion', emoji: '🟠', desc: 'Atteindre le rang A', check: (c) => c.level >= 50 },
  { id: 'rank_s', name: 'Légende', emoji: '🔴', desc: 'Atteindre le rang S', check: (c) => c.level >= 70 },
  { id: 'nak_muay', name: 'Nak Muay', emoji: '🥊', desc: '10 séances de Muay Thai', check: (c) => c.state.logs.sessions.filter((s) => s.type === 'muaythai').length >= 10 },
  { id: 'iron_guard', name: 'Garde de fer', emoji: '🛡️', desc: 'Un shadow avec 90 %+ de garde haute', check: (c) => c.state.logs.coach.some((x) => x.trackerId === 'guard' && x.score >= 90 && (x.durationSec || 0) >= 60) },
  { id: 'early', name: 'Lève-tôt', emoji: '🌅', desc: 'Une séance terminée avant 8 h', check: (c) => c.state.logs.sessions.some((s) => s.completedAt && new Date(s.completedAt).getHours() < 8) },
];

export function newTitles(game, state, streak) {
  const level = levelInfo(game.xp).level;
  const ctx = { game, state, level, streak };
  return TITLES.filter((t) => !game.titles.includes(t.id) && safe(() => t.check(ctx)));
}

function safe(fn) {
  try { return !!fn(); } catch { return false; }
}
