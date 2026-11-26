import { doneSet, indexCompletions, pointsFor } from './logic';
import type { DateKey, Habit, Purchase, Reward, Settings, State } from './types';

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  dayEndHour: 0,
  focusMinutes: 25,
  breakMinutes: 5,
  focusPoints: 20,
  sound: true,
};

export function initialState(): State {
  return {
    version: 1,
    updatedAt: 0,
    onboarded: false,
    habits: [],
    rewards: [],
    completions: [],
    purchases: [],
    focus: [],
    settings: { ...DEFAULT_SETTINGS },
    unlocked: [],
    lastLevel: 1,
  };
}

export function uid(): string {
  try {
    return crypto.randomUUID().slice(0, 13);
  } catch {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Valide et complète des données venant du stockage, d'un import ou du cloud. Renvoie null si c'est inutilisable. */
export function migrate(raw: unknown): State | null {
  if (!isObj(raw) || raw.version !== 1) return null;
  const base = initialState();
  return {
    ...base,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
    onboarded: Boolean(raw.onboarded),
    habits: arr<Habit>(raw.habits).filter((h) => isObj(h) && typeof h.id === 'string' && isObj(h.frequency)),
    rewards: arr<Reward>(raw.rewards).filter((r) => isObj(r) && typeof r.id === 'string'),
    completions: arr(raw.completions),
    purchases: arr(raw.purchases),
    focus: arr(raw.focus),
    settings: { ...DEFAULT_SETTINGS, ...(isObj(raw.settings) ? (raw.settings as Partial<Settings>) : {}) },
    unlocked: arr<string>(raw.unlocked),
    lastLevel: typeof raw.lastLevel === 'number' ? raw.lastLevel : 1,
  };
}

export type Action =
  | { type: 'toggle'; habitId: string; date: DateKey; now: number }
  | { type: 'saveHabit'; habit: Habit }
  | { type: 'archiveHabit'; id: string }
  | { type: 'moveHabit'; id: string; dir: -1 | 1 }
  | { type: 'saveReward'; reward: Reward }
  | { type: 'archiveReward'; id: string }
  | { type: 'buy'; rewardId: string; date: DateKey; now: number; id: string }
  | { type: 'cancelPurchase'; id: string }
  | { type: 'focusDone'; minutes: number; points: number; date: DateKey; now: number }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'onboard'; habits: Habit[]; rewards: Reward[] }
  | { type: 'announce'; unlocked: string[]; level: number }
  /** remote = vient de la synchronisation : on ne le renvoie pas au serveur */
  | { type: 'replace'; state: State; remote?: boolean }
  | { type: 'reset' };

const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

/** Réducteur pur : toutes les dates et heures arrivent dans l'action. */
export function reduce(state: State, a: Action): State {
  switch (a.type) {
    case 'toggle': {
      const existing = state.completions.find((c) => c.habitId === a.habitId && c.date === a.date);
      if (existing) return { ...state, completions: state.completions.filter((c) => c !== existing) };
      const habit = state.habits.find((h) => h.id === a.habitId);
      if (!habit) return state;
      const done = doneSet(indexCompletions(state.completions.filter((c) => c.habitId === habit.id)), habit.id);
      const points = pointsFor(habit, done, a.date);
      return {
        ...state,
        completions: [...state.completions, { id: uid(), habitId: habit.id, date: a.date, points, at: a.now }],
      };
    }
    case 'saveHabit':
      return { ...state, habits: upsert(state.habits, a.habit) };
    case 'archiveHabit':
      return { ...state, habits: state.habits.map((h) => (h.id === a.id ? { ...h, archived: true } : h)) };
    case 'moveHabit': {
      const visible = state.habits.filter((h) => !h.archived);
      const i = visible.findIndex((h) => h.id === a.id);
      const j = i + a.dir;
      if (i < 0 || j < 0 || j >= visible.length) return state;
      [visible[i], visible[j]] = [visible[j], visible[i]];
      return { ...state, habits: [...visible, ...state.habits.filter((h) => h.archived)] };
    }
    case 'saveReward':
      return { ...state, rewards: upsert(state.rewards, a.reward) };
    case 'archiveReward':
      return { ...state, rewards: state.rewards.map((r) => (r.id === a.id ? { ...r, archived: true } : r)) };
    case 'buy': {
      const r = state.rewards.find((x) => x.id === a.rewardId);
      if (!r) return state;
      const purchase: Purchase = { id: a.id, rewardId: r.id, name: r.name, emoji: r.emoji, cost: r.cost, date: a.date, at: a.now };
      return { ...state, purchases: [...state.purchases, purchase] };
    }
    case 'cancelPurchase':
      return { ...state, purchases: state.purchases.filter((p) => p.id !== a.id) };
    case 'focusDone':
      return { ...state, focus: [...state.focus, { id: uid(), minutes: a.minutes, points: a.points, date: a.date, at: a.now }] };
    case 'settings':
      return { ...state, settings: { ...state.settings, ...a.patch } };
    case 'onboard':
      return {
        ...state,
        onboarded: true,
        habits: a.habits.reduce(upsert, state.habits),
        rewards: a.rewards.reduce(upsert, state.rewards),
      };
    case 'announce':
      return { ...state, unlocked: a.unlocked, lastLevel: a.level };
    case 'replace':
      return a.state;
    case 'reset':
      return { ...initialState(), onboarded: false };
  }
}
