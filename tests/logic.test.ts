import { describe, expect, it } from 'vitest';
import { addDays, todayKey, weekday, weekStart } from '../src/lib/dates';
import { advance, IDLE, pause, remainingMs, resume, start } from '../src/lib/focus';
import {
  bestStreak,
  currentStreak,
  dayItems,
  derive,
  frequencyLabel,
  indexCompletions,
  isPerfectDay,
  levelInfo,
  nextStep,
  pointsFor,
  streakMultiplier,
  unlockedNow,
  weeklyReport,
} from '../src/lib/logic';
import { initialState, migrate, reduce } from '../src/lib/state';
import { joinDocs, splitState, stableStringify } from '../src/lib/sync';
import type { DateKey, Habit, State } from '../src/lib/types';

// 2026-11-23 est un lundi
const MON = '2026-11-23';

const habit = (over: Partial<Habit> = {}): Habit => ({
  id: 'h1',
  name: 'Lire',
  emoji: '📚',
  points: 10,
  frequency: { type: 'daily' },
  createdAt: '2026-10-01',
  ...over,
});

const days = (from: DateKey, n: number) => Array.from({ length: n }, (_, i) => addDays(from, i));

function withChecks(h: Habit, dates: DateKey[]): State {
  let s: State = { ...initialState(), habits: [h] };
  for (const d of dates) s = reduce(s, { type: 'toggle', habitId: h.id, date: d, now: 0 });
  return s;
}

describe('dates', () => {
  it('commence la semaine le lundi', () => {
    expect(weekday(MON)).toBe(0);
    expect(weekday('2026-11-29')).toBe(6);
    expect(weekStart('2026-11-29')).toBe(MON);
  });

  it('gère le passage de mois et d’année', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('fait basculer la journée à l’heure choisie', () => {
    const uneHeureDuMatin = new Date(2026, 10, 26, 1, 0).getTime();
    expect(todayKey(uneHeureDuMatin, 0)).toBe('2026-11-26');
    expect(todayKey(uneHeureDuMatin, 4)).toBe('2026-11-25');
  });
});

describe('séries', () => {
  it('compte les jours consécutifs et ne casse pas la série tant que la journée n’est pas finie', () => {
    const h = habit();
    const done = new Set(days('2026-11-20', 4)); // 20 → 23
    expect(currentStreak(h, done, '2026-11-23')).toBe(4);
    expect(currentStreak(h, done, '2026-11-24')).toBe(4); // 24 pas encore coché
    expect(currentStreak(h, done, '2026-11-25')).toBe(0); // 24 raté
  });

  it('ignore les jours non prévus pour une habitude à jours précis', () => {
    const h = habit({ frequency: { type: 'days', days: [0, 2, 4] } }); // lun, mer, ven
    const done = new Set(['2026-11-16', '2026-11-18', '2026-11-20', MON]);
    expect(currentStreak(h, done, '2026-11-24')).toBe(4);
    expect(bestStreak(h, done, '2026-11-24')).toBe(4);
  });

  it('compte les semaines réussies pour « N fois par semaine »', () => {
    const h = habit({ frequency: { type: 'weekly', times: 2 } });
    const done = new Set(['2026-11-10', '2026-11-12', '2026-11-17', '2026-11-19', '2026-11-24']);
    expect(currentStreak(h, done, '2026-11-25')).toBe(2); // semaine en cours pas encore réussie
    done.add('2026-11-25');
    expect(currentStreak(h, done, '2026-11-25')).toBe(3);
  });

  it('retient la meilleure série', () => {
    const h = habit();
    const done = new Set([...days('2026-11-01', 6), ...days('2026-11-10', 3)]);
    expect(bestStreak(h, done, '2026-11-20')).toBe(6);
  });
});

describe('bonus de série', () => {
  it('applique les paliers ×1,2 / ×1,5 / ×2', () => {
    const f = { type: 'daily' } as const;
    expect([1, 3, 7, 30].map((n) => streakMultiplier(f, n))).toEqual([1, 1.2, 1.5, 2]);
    expect(nextStep(f, 5)).toEqual({ remaining: 2, mult: 1.5 });
    expect(nextStep(f, 40)).toBeNull();
  });

  it('calcule les tickets en incluant la coche du jour', () => {
    const h = habit({ points: 10 });
    expect(pointsFor(h, new Set(), MON)).toBe(10);
    expect(pointsFor(h, new Set(days('2026-11-21', 2)), MON)).toBe(12); // 3e jour → ×1,2
    expect(pointsFor(h, new Set(days('2026-11-17', 6)), MON)).toBe(15); // 7e jour → ×1,5
  });

  it('fige les tickets gagnés dans l’historique', () => {
    const s = withChecks(habit(), days('2026-11-17', 7));
    expect(s.completions.map((c) => c.points)).toEqual([10, 10, 12, 12, 12, 12, 15]);
  });

  it('décocher retire la coche et ses tickets', () => {
    let s = withChecks(habit(), [MON]);
    s = reduce(s, { type: 'toggle', habitId: 'h1', date: MON, now: 0 });
    expect(s.completions).toHaveLength(0);
  });
});

describe('liste du jour', () => {
  it('affiche ce qui est prévu et masque ce qui est terminé ailleurs', () => {
    const s: State = {
      ...initialState(),
      habits: [
        habit({ id: 'daily' }),
        habit({ id: 'weekend', frequency: { type: 'days', days: [5, 6] } }),
        habit({ id: 'twice', frequency: { type: 'weekly', times: 2 } }),
        habit({ id: 'once', frequency: { type: 'once' } }),
        habit({ id: 'futur', createdAt: '2026-12-01' }),
      ],
    };
    const done = reduce(reduce(s, { type: 'toggle', habitId: 'twice', date: MON, now: 0 }), {
      type: 'toggle',
      habitId: 'twice',
      date: addDays(MON, 1),
      now: 0,
    });
    const tue = addDays(MON, 2);
    const ids = dayItems(done, indexCompletions(done.completions), tue).map((i) => i.habit.id);
    expect(ids).toEqual(['daily', 'once']); // objectif hebdo atteint, pas le week-end, pas encore créée

    const finished = reduce(done, { type: 'toggle', habitId: 'once', date: MON, now: 0 });
    expect(dayItems(finished, indexCompletions(finished.completions), tue).map((i) => i.habit.id)).toEqual(['daily']);
  });

  it('met les tâches restantes avant les tâches faites', () => {
    const s = withChecks(habit({ id: 'h1' }), [MON]);
    const both = { ...s, habits: [...s.habits, habit({ id: 'h2' })] };
    expect(dayItems(both, indexCompletions(both.completions), MON).map((i) => [i.habit.id, i.done])).toEqual([
      ['h2', false],
      ['h1', true],
    ]);
  });

  it('reconnaît une journée parfaite', () => {
    const s = { ...withChecks(habit(), [MON]), habits: [habit(), habit({ id: 'h2', frequency: { type: 'weekly', times: 3 } })] };
    expect(isPerfectDay(s, indexCompletions(s.completions), MON)).toBe(true); // l'hebdo ne compte pas
    expect(isPerfectDay(s, indexCompletions(s.completions), addDays(MON, 1))).toBe(false);
  });
});

describe('tickets, niveaux et succès', () => {
  it('calcule le solde : gagné − dépensé', () => {
    let s = withChecks(habit({ points: 50 }), days('2026-11-10', 2));
    s = reduce(s, { type: 'saveReward', reward: { id: 'r', name: 'Jeu', emoji: '🎮', cost: 60 } });
    s = reduce(s, { type: 'buy', rewardId: 'r', date: MON, now: 0, id: 'p1' });
    const d = derive(s, MON);
    expect(d.totals).toEqual({ earned: 100, spent: 60, balance: 40 });
    s = reduce(s, { type: 'cancelPurchase', id: 'p1' });
    expect(derive(s, MON).totals.balance).toBe(100);
  });

  it('monte de niveau selon l’XP cumulée', () => {
    expect(levelInfo(0)).toMatchObject({ level: 1, title: 'Recrue' });
    expect(levelInfo(99).level).toBe(1);
    expect(levelInfo(100)).toMatchObject({ level: 2, current: 0, needed: 200 });
    expect(levelInfo(1000)).toMatchObject({ level: 5, title: 'Régulier' });
  });

  it('débloque les succès', () => {
    const s = withChecks(habit(), days('2026-11-17', 7));
    const ids = unlockedNow(s, derive(s, MON));
    expect(ids).toEqual(expect.arrayContaining(['premier-pas', 'serie-3', 'serie-7', 'jour-parfait', 'semaine-parfaite']));
    expect(ids).not.toContain('serie-30');
  });

  it('écrit un bilan lisible pour Discord', () => {
    const s = { ...withChecks(habit(), days('2026-11-17', 7)), settings: { ...initialState().settings, name: 'Lucas' } };
    const text = weeklyReport(s, derive(s, MON), MON);
    expect(text).toContain('**Lucas — mon bilan Recomp de la semaine**');
    expect(text).toContain('✅ 7 habitudes cochées');
    expect(text).toContain('🔥 Meilleure série en cours : 📚 Lire (7 jours)');
  });

  it('décrit les fréquences en français', () => {
    expect(frequencyLabel({ type: 'days', days: [0, 1, 2, 3, 4] })).toBe('En semaine');
    expect(frequencyLabel({ type: 'days', days: [0, 3] })).toBe('lun, jeu');
    expect(frequencyLabel({ type: 'weekly', times: 3 })).toBe('3 fois par semaine');
  });
});

describe('minuteur focus', () => {
  it('enchaîne focus puis pause, même si l’appli était fermée', () => {
    const t0 = 1_000_000;
    const t = start('focus', 25, t0);
    expect(advance(t, t0 + 10 * 60_000, 5).events).toEqual([]);
    const mid = advance(t, t0 + 26 * 60_000, 5);
    expect(mid.events).toEqual([{ type: 'focusDone', minutes: 25, at: t0 + 25 * 60_000 }]);
    expect(mid.timer.phase).toBe('break');
    const late = advance(t, t0 + 60 * 60_000, 5);
    expect(late.events.map((e) => e.type)).toEqual(['focusDone', 'breakDone']);
    expect(late.timer).toEqual(IDLE);
  });

  it('met en pause et reprend sans perdre de temps', () => {
    const t0 = 0;
    const paused = pause(start('focus', 25, t0), 5 * 60_000);
    expect(remainingMs(paused, 999 * 60_000)).toBe(20 * 60_000);
    const resumed = resume(paused, 100 * 60_000);
    expect(resumed.endsAt).toBe(120 * 60_000);
  });
});

describe('sauvegarde', () => {
  it('découpe l’historique par mois et le recolle à l’identique', () => {
    let s = withChecks(habit(), ['2026-10-30', '2026-10-31', '2026-11-01']);
    s = reduce(s, { type: 'focusDone', minutes: 25, points: 20, date: '2026-11-02', now: 5 });
    s = { ...s, updatedAt: 42 };
    const docs = splitState(s);
    expect(Object.keys(docs).sort()).toEqual(['log-2026-10', 'log-2026-11', 'meta']);
    expect(joinDocs(docs)).toEqual(s);
  });

  it('compare les documents sans tenir compte de l’ordre des clés', () => {
    expect(stableStringify({ b: 1, a: [{ d: 2, c: 3 }] })).toBe(stableStringify({ a: [{ c: 3, d: 2 }], b: 1 }));
  });

  it('refuse un fichier qui n’est pas une sauvegarde Recomp', () => {
    expect(migrate({ hello: 'world' })).toBeNull();
    expect(migrate(null)).toBeNull();
    expect(migrate({ version: 1 })?.settings.focusMinutes).toBe(25);
  });
});
