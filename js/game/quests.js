// Quêtes quotidiennes adaptatives (+ quête de pénalité si celles de la veille sont ratées). Fonctions pures.
import { EX, exerciseAllowed } from '../data/exercises.js';
import { testValue } from '../engine/progression.js';
import { levelInfo } from './leveling.js';
import { addDays, weekday } from '../engine/dates.js';
import { rng, shuffle } from '../engine/random.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round5 = (v) => Math.round(v / 5) * 5;

export const PHYSICAL = [
  {
    id: 'pushups', label: 'Pompes', emoji: '🫸', unit: 'reps', tracker: 'pushup', check: 'pushup',
    exIds: ['pushup', 'knee_pushup', 'incline_pushup', 'diamond_pushup', 'decline_pushup', 'archer_pushup'],
    target: (p, l) => clamp(round5(testValue(p, 'push') * 1.2 + l * 0.8), 10, 150), steps: [5, 10],
  },
  {
    id: 'squats', label: 'Squats', emoji: '🏋️', unit: 'reps', tracker: 'squat', check: 'squat',
    exIds: ['squat', 'box_squat', 'goblet_squat', 'jump_squat', 'barbell_squat'],
    target: (p, l) => clamp(round5(testValue(p, 'squat') * 0.9 + l * 1.2), 15, 200), steps: [10, 20],
  },
  {
    id: 'plank', label: 'Gainage (cumulé)', emoji: '🧱', unit: 's', tracker: 'plank', check: 'plank',
    exIds: ['plank'],
    target: (p, l) => clamp(round5(testValue(p, 'plank') * 1.1 + l * 3), 30, 400), steps: [15, 30],
  },
  {
    id: 'jacks', label: 'Jumping jacks', emoji: '⭐', unit: 'reps', tracker: 'jacks', check: 'jumping_jacks',
    exIds: [],
    target: (p, l) => clamp(round5(40 + l * 3), 40, 300), steps: [10, 20],
  },
  {
    id: 'lunges', label: 'Fentes', emoji: '🚶', unit: 'reps', tracker: 'lunge', check: 'reverse_lunge',
    exIds: ['reverse_lunge', 'walking_lunge', 'db_lunge'],
    target: (p, l) => clamp(Math.round(16 + l * 1), 16, 120), steps: [4, 10],
  },
  {
    id: 'burpees', label: 'Burpees', emoji: '🔥', unit: 'reps', tracker: 'burpee', check: 'burpees', minLevel: 6,
    exIds: ['burpees', 'mt_sprawl'],
    target: (p, l) => clamp(Math.round(8 + l * 0.6), 8, 80), steps: [2, 5],
  },
  {
    id: 'kicks', label: 'Coups de pied', emoji: '🦵', unit: 'reps', tracker: 'kicks', check: 'mt_kicks', goal: 'muaythai',
    exIds: ['mt_kicks', 'mt_teeps'],
    target: (p, l) => clamp(round5(30 + l * 2), 30, 300), steps: [10, 20],
  },
  {
    id: 'knees', label: 'Coups de genou', emoji: '🦿', unit: 'reps', tracker: 'knees', check: 'mt_knees', goal: 'muaythai',
    exIds: ['mt_knees'],
    target: (p, l) => clamp(round5(30 + l * 2), 30, 300), steps: [10, 20],
  },
];

export const LIFE = {
  water: { id: 'water', label: 'Hydratation', emoji: '💧', unit: 'ml', kind: 'water' },
  checkin: { id: 'checkin', label: 'Check-in de forme', emoji: '📝', unit: '', kind: 'checkin', target: () => 1 },
  session: { id: 'session', label: 'Séance du jour terminée', emoji: '🏁', unit: '', kind: 'session', target: () => 1 },
  breath: { id: 'breath', label: 'Respiration guidée', emoji: '🧘', unit: 'min', kind: 'breath', target: () => 5 },
  walk: { id: 'walk', label: 'Marche dehors', emoji: '🚶', unit: 'min', kind: 'manual', target: () => 20, steps: [10, 20] },
};

function questXp(q, level) {
  if (q.penalty) return 80 + level * 3;
  if (q.kind) return 25 + Math.round(level * 0.5);
  return 40 + level * 2;
}

/** Quêtes de base (sans pénalité) — déterministes pour une date donnée. */
export function baseQuests(state, iso) {
  const p = state.profile;
  if (!p) return [];
  const level = levelInfo(state.game?.xp || 0).level;
  const goals = new Set(p.goals || []);
  const pool = PHYSICAL.filter((q) => (!q.minLevel || level >= q.minLevel)
    && (!q.goal || goals.has(q.goal))
    && (!q.check || !EX[q.check] || exerciseAllowed(EX[q.check], p)));
  const r = rng(`${iso}:quests:${p.createdAt || ''}`);
  // Toujours un exercice « haut du corps » et un « bas du corps » si possible
  const upper = pool.filter((q) => ['pushups', 'plank'].includes(q.id));
  const lower = pool.filter((q) => ['squats', 'lunges'].includes(q.id));
  const picked = [];
  const take = (list) => {
    const c = shuffle(list.filter((q) => !picked.includes(q)), r)[0];
    if (c) picked.push(c);
  };
  take(upper);
  take(lower);
  while (picked.length < 3 && picked.length < pool.length) take(pool);
  const list = picked.map((q) => ({ ...q, target: q.target(p, level) }));
  const training = state.plan?.week?.[weekday(iso)]?.type && state.plan.week[weekday(iso)].type !== 'rest';
  list.push({ ...(training ? LIFE.session : LIFE.breath), target: training ? 1 : 5 });
  const waterMl = Math.round((p.weight || 70) * 35 / 250) * 250;
  list.push({ ...LIFE.water, target: waterMl });
  list.forEach((q) => { q.xp = questXp(q, level); });
  return list;
}

/** Quêtes du jour = quêtes de base + éventuelle quête de pénalité. */
export function dailyQuests(state, iso) {
  const list = baseQuests(state, iso);
  const pen = penaltyQuest(state, iso);
  if (pen) list.unshift(pen);
  return list;
}

export function penaltyQuest(state, iso) {
  const start = state.game?.startedAt;
  const y = addDays(iso, -1);
  if (!start || y < start) return null;
  const yq = baseQuests(state, y);
  if (!yq.length) return null;
  const failed = yq.filter((q) => questProgress(state, y, q) < q.target);
  if (!failed.length) return null;
  const p = state.profile;
  const level = levelInfo(state.game?.xp || 0).level;
  const useSquat = !EX.squat || exerciseAllowed(EX.squat, p);
  const base = useSquat ? PHYSICAL.find((q) => q.id === 'squats') : PHYSICAL.find((q) => q.id === 'plank');
  const q = {
    ...base,
    id: 'penalty',
    penalty: true,
    label: `Pénalité : ${base.label.toLowerCase()}`,
    emoji: '⚠️',
    target: Math.round(base.target(p, level) * 0.6),
    missed: failed.map((f) => f.label),
  };
  q.xp = questXp(q, level);
  return q;
}

/** Progression d'une quête à une date : saisie manuelle + données automatiques (caméra, séances, eau…). */
export function questProgress(state, iso, q) {
  const manual = state.game?.quests?.[iso]?.manual?.[q.id] || 0;
  const logs = state.logs || {};
  let auto = 0;
  if (q.kind === 'water') auto = logs.water?.[iso] || 0;
  else if (q.kind === 'checkin') auto = logs.checkins?.[iso] ? 1 : 0;
  else if (q.kind === 'session') auto = (logs.sessions || []).some((s) => s.date === iso && !s.routine) ? 1 : 0;
  else if (q.kind === 'breath') auto = Math.floor((logs.breath || []).filter((b) => b.date === iso).reduce((t, b) => t + (b.secs || 0), 0) / 60);
  else if (q.tracker) {
    (logs.coach || []).filter((c) => c.date === iso).forEach((c) => {
      if (c.trackerId === q.tracker) auto += q.unit === 's' ? (c.holdSec || 0) : (c.reps || 0);
      if (q.tracker === 'kicks' && c.trackerId === 'guard') auto += c.kicks || 0;
    });
    (logs.sessions || []).filter((s) => s.date === iso).forEach((s) => {
      (s.exercises || []).forEach((e) => {
        if (!q.exIds?.includes(e.exId)) return;
        (e.sets || []).forEach((st) => {
          if (st.coach) return; // déjà compté via le journal caméra
          auto += q.unit === 's' ? (st.secs || 0) : (st.reps || 0);
        });
      });
    });
  }
  return manual + auto;
}

export function questStatus(state, iso) {
  const list = dailyQuests(state, iso);
  const day = state.game?.quests?.[iso] || {};
  const items = list.map((q) => {
    const value = questProgress(state, iso, q);
    return { q, value, done: value >= q.target, claimed: !!day.xpGiven?.[q.id] };
  });
  const allDone = items.length > 0 && items.every((i) => i.done);
  return { items, allDone, bonusClaimed: !!day.claimed };
}
