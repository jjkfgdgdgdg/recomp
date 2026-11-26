import { useState } from 'preact/hooks';
import { IconCheck, IconLeft, IconPlus, IconRight } from '../components/Icons';
import { Bar, Tickets } from '../components/ui';
import { addDays, daysBetween, relativeDay } from '../lib/dates';
import { confetti, play, toast, unlockAudio } from '../lib/effects';
import {
  dayItems,
  doneSet,
  indexCompletions,
  isPerfectDay,
  nextStep,
  pointsFor,
  shortUnit,
  streakIfChecked,
  streakMultiplier,
  streakUnit,
  type Derived,
} from '../lib/logic';
import { dispatch, getState } from '../lib/store';
import type { DateKey, State } from '../lib/types';

const MAX_BACK = 6;

export function Today({ state, derived, today }: { state: State; derived: Derived; today: DateKey }) {
  const [day, setDay] = useState<DateKey>(today);
  const [gains, setGains] = useState<Record<string, number>>({});
  const viewing = day > today ? today : day;
  const back = daysBetween(viewing, today);
  const items = dayItems(state, derived.index, viewing);
  const doneCount = items.filter((i) => i.done).length;
  const earnedToday = derived.byDay.get(viewing) ?? 0;
  const perfect = isPerfectDay(state, derived.index, viewing);

  function toggle(habitId: string) {
    unlockAudio();
    const habit = state.habits.find((h) => h.id === habitId);
    if (!habit) return;
    const done = doneSet(derived.index, habitId);
    const wasDone = done.has(viewing);
    const streak = wasDone ? 0 : streakIfChecked(habit, done, viewing);
    const mult = streakMultiplier(habit.frequency, streak);
    const newTier = !wasDone && mult > streakMultiplier(habit.frequency, streak - 1);
    const perfectBefore = isPerfectDay(state, derived.index, viewing);
    dispatch({ type: 'toggle', habitId, date: viewing, now: Date.now() });
    if (!wasDone) {
      play('check');
      setGains((g) => ({ ...g, [habitId]: Date.now() }));
      if (newTier) {
        toast('🔥', `Nouveau palier : ×${String(mult).replace('.', ',')} !`, `${habit.name} rapporte maintenant ${pointsFor(habit, done, viewing)} tickets.`, 3500);
      }
      const after = getState();
      if (!perfectBefore && isPerfectDay(after, indexCompletions(after.completions), viewing)) {
        confetti();
        toast('⭐', 'Journée parfaite !', 'Toutes tes habitudes du jour sont cochées.');
      }
    }
  }

  return (
    <div class="page">
      <div class="daybar">
        <button class="icon-btn" aria-label="Jour précédent" disabled={back >= MAX_BACK} onClick={() => setDay(addDays(viewing, -1))}>
          <IconLeft />
        </button>
        <h1>{relativeDay(viewing, today)}</h1>
        <button class="icon-btn" aria-label="Jour suivant" disabled={back <= 0} onClick={() => setDay(addDays(viewing, 1))}>
          <IconRight />
        </button>
      </div>

      {items.length > 0 && (
        <div class="card today-summary">
          <div>
            <div class="num" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
              {doneCount} / {items.length}
            </div>
            <div class="muted small">{doneCount === items.length ? 'Tout est fait !' : `encore ${items.length - doneCount} à cocher`}</div>
          </div>
          <Tickets n={earnedToday} sign />
          <Bar value={items.length ? doneCount / items.length : 0} kind="good" />
        </div>
      )}

      {perfect && (
        <div class="banner">
          <span class="big-emoji">⭐</span>
          <span>Journée parfaite. Toutes tes habitudes du jour sont cochées.</span>
        </div>
      )}

      {back > 0 && (
        <p class="muted small" style={{ margin: 0 }}>
          Tu as oublié de cocher ? Tu peux rattraper jusqu’à {MAX_BACK} jours en arrière.
        </p>
      )}

      {items.length === 0 ? (
        <div class="empty">
          <strong>Rien de prévu {back === 0 ? "aujourd'hui" : 'ce jour-là'}.</strong>
          <span>Ajoute des habitudes pour commencer à gagner des tickets.</span>
          <a class="btn" href="#habitudes">
            <IconPlus /> Gérer mes habitudes
          </a>
        </div>
      ) : (
        <ul class="habit-list">
          {items.map(({ habit, done, completion, streak, weekly }) => {
            // Pas encore coché : on montre ce que la coche rapporterait maintenant (bonus compris)
            const potential = done ? streak : streakIfChecked(habit, doneSet(derived.index, habit.id), viewing);
            const mult = streakMultiplier(habit.frequency, potential);
            const next = nextStep(habit.frequency, potential);
            const gainAt = gains[habit.id];
            return (
              <li key={habit.id}>
                <button class={`habit-row${done ? ' done' : ''}`} aria-pressed={done} onClick={() => toggle(habit.id)}>
                  <span class="emoji" aria-hidden="true">
                    {habit.emoji}
                  </span>
                  <span class="info">
                    <span class="name">{habit.name}</span>
                    <span class="meta">
                      <span>
                        <b class="num">{done && completion ? completion.points : Math.round(habit.points * mult)}</b> tickets
                      </span>
                      {streak > 0 && (
                        <span class="flame">
                          🔥 {streak} {streakUnit(habit.frequency, streak)}
                        </span>
                      )}
                      {mult > 1 && <span class="mult">×{String(mult).replace('.', ',')}</span>}
                      {weekly && (
                        <span>
                          {weekly.count}/{weekly.target} cette semaine
                        </span>
                      )}
                      {!done && next && streak > 0 && (
                        <span>
                          encore {shortUnit(habit.frequency, next.remaining)} pour ×{String(next.mult).replace('.', ',')}
                        </span>
                      )}
                    </span>
                  </span>
                  <span class="check" aria-hidden="true">
                    <IconCheck />
                  </span>
                  {done && gainAt && Date.now() - gainAt < 1500 && completion && (
                    <span class="gain" key={gainAt}>
                      +{completion.points}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
