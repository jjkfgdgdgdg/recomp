import { addDays, DAY_NAMES, weekday, weekStart } from './dates';
import type { Completion, DateKey, Frequency, Habit, State } from './types';

export type DoneIndex = Map<string, Set<DateKey>>;

/** habitId → ensemble des jours où l'habitude a été cochée */
export function indexCompletions(completions: Completion[]): DoneIndex {
  const index: DoneIndex = new Map();
  for (const c of completions) {
    let set = index.get(c.habitId);
    if (!set) index.set(c.habitId, (set = new Set()));
    set.add(c.date);
  }
  return index;
}

const EMPTY = new Set<DateKey>();
export const doneSet = (index: DoneIndex, id: string) => index.get(id) ?? EMPTY;

export function isScheduled(h: Habit, k: DateKey): boolean {
  if (k < h.createdAt) return false;
  return h.frequency.type === 'days' ? h.frequency.days.includes(weekday(k)) : true;
}

/** Nombre de jours cochés dans la semaine (lundi → dimanche) qui contient k */
export function weekCount(done: Set<DateKey>, k: DateKey): number {
  const start = weekStart(k);
  let n = 0;
  for (let i = 0; i < 7; i++) if (done.has(addDays(start, i))) n++;
  return n;
}

/**
 * Série en cours au jour k. Un jour (ou une semaine) pas encore terminé ne casse pas la série :
 * si k n'est pas coché, on compte à partir de la veille.
 * Unité : jours prévus pour daily/days, semaines réussies pour weekly.
 */
export function currentStreak(h: Habit, done: Set<DateKey>, k: DateKey): number {
  const f = h.frequency;
  if (f.type === 'once') return 0;

  if (f.type === 'weekly') {
    let ws = weekStart(k);
    let n = weekCount(done, ws) >= f.times ? 1 : 0;
    const first = weekStart(h.createdAt);
    for (ws = addDays(ws, -7); ws >= first; ws = addDays(ws, -7)) {
      if (weekCount(done, ws) >= f.times) n++;
      else break;
    }
    return n;
  }

  let d = done.has(k) ? k : addDays(k, -1);
  let n = 0;
  for (let guard = 0; guard < 5000 && d >= h.createdAt; guard++) {
    if (!isScheduled(h, d)) {
      d = addDays(d, -1);
      continue;
    }
    if (!done.has(d)) break;
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** Meilleure série jamais atteinte, de la création de l'habitude jusqu'à today */
export function bestStreak(h: Habit, done: Set<DateKey>, today: DateKey): number {
  const f = h.frequency;
  if (f.type === 'once') return 0;
  let best = 0;
  let run = 0;
  if (f.type === 'weekly') {
    const thisWeek = weekStart(today);
    for (let ws = weekStart(h.createdAt); ws <= thisWeek; ws = addDays(ws, 7)) {
      if (weekCount(done, ws) >= f.times) best = Math.max(best, ++run);
      else if (ws !== thisWeek) run = 0;
    }
    return best;
  }
  for (let d = h.createdAt; d <= today; d = addDays(d, 1)) {
    if (!isScheduled(h, d)) continue;
    if (done.has(d)) best = Math.max(best, ++run);
    else if (d !== today) run = 0;
  }
  return best;
}

/** Paliers de bonus : [série minimale, multiplicateur] */
export function streakSteps(f: Frequency): [number, number][] {
  if (f.type === 'once') return [];
  return f.type === 'weekly'
    ? [[2, 1.2], [4, 1.5], [12, 2]]
    : [[3, 1.2], [7, 1.5], [30, 2]];
}

export function streakMultiplier(f: Frequency, streak: number): number {
  let m = 1;
  for (const [min, mult] of streakSteps(f)) if (streak >= min) m = mult;
  return m;
}

/** Prochain palier de bonus, pour afficher « encore 2 jours pour ×1,5 » */
export function nextStep(f: Frequency, streak: number): { remaining: number; mult: number } | null {
  for (const [min, mult] of streakSteps(f)) if (streak < min) return { remaining: min - streak, mult };
  return null;
}

export const streakUnit = (f: Frequency, n: number) =>
  f.type === 'weekly' ? (n > 1 ? 'semaines' : 'semaine') : n > 1 ? 'jours' : 'jour';

/** « 3 j » ou « 2 sem. » */
export const shortUnit = (f: Frequency, n: number) => `${n} ${f.type === 'weekly' ? 'sem.' : 'j'}`;

/** Série atteinte si on coche h au jour k */
export function streakIfChecked(h: Habit, done: Set<DateKey>, k: DateKey): number {
  if (done.has(k)) return currentStreak(h, done, k);
  const withThis = new Set(done);
  withThis.add(k);
  return currentStreak(h, withThis, k);
}

/** Tickets gagnés en cochant h au jour k (bonus de série compris) */
export function pointsFor(h: Habit, done: Set<DateKey>, k: DateKey): number {
  return Math.round(h.points * streakMultiplier(h.frequency, streakIfChecked(h, done, k)));
}

export function frequencyLabel(f: Frequency): string {
  switch (f.type) {
    case 'daily':
      return 'Tous les jours';
    case 'once':
      return 'Une seule fois';
    case 'weekly':
      return f.times === 1 ? '1 fois par semaine' : `${f.times} fois par semaine`;
    case 'days': {
      const days = [...f.days].sort();
      if (days.length === 7) return 'Tous les jours';
      if (days.join() === '0,1,2,3,4') return 'En semaine';
      if (days.join() === '5,6') return 'Le week-end';
      return days.map((d) => DAY_NAMES[d].slice(0, 3)).join(', ');
    }
  }
}

export interface DayItem {
  habit: Habit;
  done: boolean;
  completion?: Completion;
  streak: number;
  weekly?: { count: number; target: number };
}

/** Ce qu'il y a à faire le jour k, les tâches restantes d'abord */
export function dayItems(state: State, index: DoneIndex, k: DateKey): DayItem[] {
  const items: DayItem[] = [];
  for (const habit of state.habits) {
    if (habit.archived || habit.createdAt > k) continue;
    const f = habit.frequency;
    const done = doneSet(index, habit.id);
    const isDone = done.has(k);
    if (f.type === 'days' && !f.days.includes(weekday(k))) continue;
    if (f.type === 'once' && !isDone && done.size > 0) continue;
    let weekly: DayItem['weekly'];
    if (f.type === 'weekly') {
      const count = weekCount(done, k);
      if (!isDone && count >= f.times) continue;
      weekly = { count, target: f.times };
    }
    items.push({
      habit,
      done: isDone,
      completion: isDone ? state.completions.find((c) => c.habitId === habit.id && c.date === k) : undefined,
      streak: currentStreak(habit, done, k),
      weekly,
    });
  }
  return items.sort((a, b) => Number(a.done) - Number(b.done));
}

/** Habitudes obligatoires du jour k : quotidiennes et jours précis (pas les « N fois par semaine ») */
function requiredOn(state: State, k: DateKey): Habit[] {
  return state.habits.filter(
    (h) => !h.archived && h.createdAt <= k && (h.frequency.type === 'daily' || (h.frequency.type === 'days' && isScheduled(h, k))),
  );
}

export function isPerfectDay(state: State, index: DoneIndex, k: DateKey): boolean {
  const req = requiredOn(state, k);
  return req.length > 0 && req.every((h) => doneSet(index, h.id).has(k));
}

export function totals(state: State) {
  let earned = 0;
  for (const c of state.completions) earned += c.points;
  for (const f of state.focus) earned += f.points;
  let spent = 0;
  for (const p of state.purchases) spent += p.cost;
  return { earned, spent, balance: earned - spent };
}

export function pointsByDay(state: State): Map<DateKey, number> {
  const map = new Map<DateKey, number>();
  const add = (k: DateKey, n: number) => map.set(k, (map.get(k) ?? 0) + n);
  for (const c of state.completions) add(c.date, c.points);
  for (const f of state.focus) add(f.date, f.points);
  return map;
}

// ---------------------------------------------------------------- Niveaux

/** XP cumulée nécessaire pour atteindre le niveau n (1 → 0, 2 → 100, 3 → 300, 4 → 600…) */
export const xpForLevel = (n: number) => 50 * n * (n - 1);

const TITLES: [number, string][] = [
  [1, 'Recrue'],
  [3, 'Apprenti'],
  [5, 'Régulier'],
  [8, 'Discipliné'],
  [12, 'Inarrêtable'],
  [16, 'Machine'],
  [20, 'Légende'],
  [30, 'Mythique'],
];

export function levelTitle(level: number): string {
  let t = TITLES[0][1];
  for (const [min, title] of TITLES) if (level >= min) t = title;
  return t;
}

export function levelInfo(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const base = xpForLevel(level);
  const needed = xpForLevel(level + 1) - base;
  return { level, title: levelTitle(level), current: xp - base, needed, progress: (xp - base) / needed };
}

// ---------------------------------------------------------------- Statistiques

export interface Derived {
  index: DoneIndex;
  totals: ReturnType<typeof totals>;
  level: ReturnType<typeof levelInfo>;
  /** habitId → série en cours / meilleure série */
  streaks: Map<string, { current: number; best: number }>;
  bestStreakEver: number;
  perfectDays: number;
  bestPerfectRun: number;
  byDay: Map<DateKey, number>;
}

export function derive(state: State, today: DateKey): Derived {
  const index = indexCompletions(state.completions);
  const t = totals(state);
  const streaks = new Map<string, { current: number; best: number }>();
  let bestStreakEver = 0;
  for (const h of state.habits) {
    const done = doneSet(index, h.id);
    const s = { current: currentStreak(h, done, today), best: bestStreak(h, done, today) };
    streaks.set(h.id, s);
    bestStreakEver = Math.max(bestStreakEver, s.best);
  }
  let perfectDays = 0;
  let run = 0;
  let bestPerfectRun = 0;
  const first = state.habits.reduce<DateKey | null>((min, h) => (!min || h.createdAt < min ? h.createdAt : min), null);
  if (first) {
    for (let d = first; d <= today; d = addDays(d, 1)) {
      if (isPerfectDay(state, index, d)) {
        perfectDays++;
        bestPerfectRun = Math.max(bestPerfectRun, ++run);
      } else if (d !== today) run = 0;
    }
  }
  return {
    index,
    totals: t,
    level: levelInfo(t.earned),
    streaks,
    bestStreakEver,
    perfectDays,
    bestPerfectRun,
    byDay: pointsByDay(state),
  };
}

// ---------------------------------------------------------------- Succès

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  test: (s: State, d: Derived) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'premier-pas', emoji: '👣', title: 'Premier pas', description: 'Coche ta première habitude', test: (s) => s.completions.length > 0 },
  { id: 'serie-3', emoji: '🔥', title: 'Ça chauffe', description: 'Atteins une série de 3', test: (_, d) => d.bestStreakEver >= 3 },
  { id: 'serie-7', emoji: '☄️', title: 'Une semaine pleine', description: 'Atteins une série de 7', test: (_, d) => d.bestStreakEver >= 7 },
  { id: 'serie-30', emoji: '🌋', title: 'Inarrêtable', description: 'Atteins une série de 30', test: (_, d) => d.bestStreakEver >= 30 },
  { id: 'jour-parfait', emoji: '⭐', title: 'Journée parfaite', description: 'Coche toutes tes habitudes du jour', test: (_, d) => d.perfectDays >= 1 },
  { id: 'semaine-parfaite', emoji: '🌟', title: 'Semaine parfaite', description: '7 journées parfaites d’affilée', test: (_, d) => d.bestPerfectRun >= 7 },
  { id: 'focus-1', emoji: '🎯', title: 'Concentré', description: 'Termine une session focus', test: (s) => s.focus.length >= 1 },
  { id: 'focus-10', emoji: '🧠', title: 'Mode tunnel', description: 'Termine 10 sessions focus', test: (s) => s.focus.length >= 10 },
  { id: 'premier-lot', emoji: '🎁', title: 'Bien mérité', description: 'Échange ta première récompense', test: (s) => s.purchases.length >= 1 },
  { id: 'tickets-1000', emoji: '🎟️', title: 'Mille tickets', description: 'Gagne 1 000 tickets au total', test: (_, d) => d.totals.earned >= 1000 },
  { id: 'niveau-5', emoji: '🏅', title: 'Niveau 5', description: 'Atteins le niveau 5', test: (_, d) => d.level.level >= 5 },
  { id: 'niveau-10', emoji: '🏆', title: 'Niveau 10', description: 'Atteins le niveau 10', test: (_, d) => d.level.level >= 10 },
  { id: 'tickets-10000', emoji: '💎', title: 'Collectionneur', description: 'Gagne 10 000 tickets au total', test: (_, d) => d.totals.earned >= 10000 },
];

export function unlockedNow(state: State, d: Derived): string[] {
  return ACHIEVEMENTS.filter((a) => a.test(state, d)).map((a) => a.id);
}

// ---------------------------------------------------------------- Bilan à partager

const nf = new Intl.NumberFormat('fr-FR');
export const fmt = (n: number) => nf.format(n);

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
}

/** Bilan des 7 derniers jours, en Markdown Discord */
export function weeklyReport(state: State, d: Derived, today: DateKey): string {
  const from = addDays(today, -6);
  const inWeek = (k: DateKey) => k >= from && k <= today;
  const done = state.completions.filter((c) => inWeek(c.date));
  const focus = state.focus.filter((f) => inWeek(f.date));
  let earned = 0;
  for (let k = from; k <= today; k = addDays(k, 1)) earned += d.byDay.get(k) ?? 0;
  let perfect = 0;
  for (let k = from; k <= today; k = addDays(k, 1)) if (isPerfectDay(state, d.index, k)) perfect++;

  let top: { h: Habit; n: number } | null = null;
  for (const h of state.habits) {
    if (h.archived) continue;
    const n = d.streaks.get(h.id)?.current ?? 0;
    if (n > 0 && (!top || n > top.n)) top = { h, n };
  }

  const who = state.settings.name.trim();
  const lines = [
    `**${who ? `${who} — ` : ''}mon bilan Recomp de la semaine** 🎟️`,
    `Niveau ${d.level.level} · ${d.level.title}`,
    `✅ ${done.length} habitude${done.length > 1 ? 's' : ''} cochée${done.length > 1 ? 's' : ''} · ⭐ ${perfect} journée${perfect > 1 ? 's' : ''} parfaite${perfect > 1 ? 's' : ''}`,
  ];
  if (top) lines.push(`🔥 Meilleure série en cours : ${top.h.emoji} ${top.h.name} (${top.n} ${streakUnit(top.h.frequency, top.n)})`);
  if (focus.length) {
    const min = focus.reduce((s, f) => s + f.minutes, 0);
    lines.push(`🎯 ${focus.length} session${focus.length > 1 ? 's' : ''} focus (${formatMinutes(min)})`);
  }
  lines.push(`🎟️ ${fmt(earned)} tickets gagnés cette semaine`);
  return lines.join('\n');
}
