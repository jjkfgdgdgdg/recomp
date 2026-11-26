import { IconPause, IconPlay, IconStop } from '../components/Icons';
import { Stepper, Tickets } from '../components/ui';
import { keepScreenOn, unlockAudio } from '../lib/effects';
import { formatClock, IDLE, pause, remainingMs, resume, start } from '../lib/focus';
import { formatMinutes } from '../lib/logic';
import { dispatch, setTimer, useTimer } from '../lib/store';
import type { DateKey, State } from '../lib/types';

const R = 54;
const C = 2 * Math.PI * R;

export function Focus({ state, today, now }: { state: State; today: DateKey; now: number }) {
  const timer = useTimer();
  const { focusMinutes, breakMinutes, focusPoints } = state.settings;
  const left = timer.phase === 'idle' ? focusMinutes * 60_000 : remainingMs(timer, now);
  const total = (timer.phase === 'idle' ? focusMinutes : timer.minutes) * 60_000;
  const progress = timer.phase === 'idle' ? 0 : 1 - left / total;
  const sessionsToday = state.focus.filter((f) => f.date === today);
  const minutesToday = sessionsToday.reduce((s, f) => s + f.minutes, 0);

  const begin = () => {
    unlockAudio();
    void keepScreenOn(true);
    setTimer(start('focus', focusMinutes, Date.now()));
  };
  const stop = () => {
    void keepScreenOn(false);
    setTimer(IDLE);
  };

  return (
    <div class="page">
      <div class="page-head">
        <h1>Focus</h1>
        <Tickets n={focusPoints} ghost />
      </div>
      <p class="muted" style={{ margin: 0 }}>
        Concentre-toi {focusMinutes} minutes sans téléphone ni distraction : chaque session terminée rapporte {focusPoints} tickets. Une pause de{' '}
        {breakMinutes} minutes suit automatiquement.
      </p>

      <div class="timer">
        <div class={`timer-ring${timer.phase === 'break' ? ' break' : ''}`}>
          <svg viewBox="0 0 120 120">
            <circle class="track" cx="60" cy="60" r={R} stroke-width="8" />
            <circle class="progress" cx="60" cy="60" r={R} stroke-width="8" stroke-dasharray={C} stroke-dashoffset={C * (1 - progress)} />
          </svg>
          <div class="readout">
            <span class="label">{timer.phase === 'focus' ? (timer.running ? 'Concentration' : 'En pause') : timer.phase === 'break' ? 'Pause' : 'Prêt ?'}</span>
            <span class="clock" role="timer" aria-live="off">
              {formatClock(left)}
            </span>
            {timer.phase === 'break' && <span class="muted small">Lève-toi, bois de l’eau</span>}
          </div>
        </div>

        {timer.phase === 'idle' ? (
          <button class="btn" style={{ minWidth: '220px', minHeight: '52px', fontSize: '1.05rem' }} onClick={begin}>
            <IconPlay /> Lancer {focusMinutes} min
          </button>
        ) : (
          <div class="row" style={{ justifyContent: 'center' }}>
            {timer.running ? (
              <button class="btn" onClick={() => setTimer(pause(timer, Date.now()))}>
                <IconPause /> Pause
              </button>
            ) : (
              <button class="btn" onClick={() => setTimer(resume(timer, Date.now()))}>
                <IconPlay /> Reprendre
              </button>
            )}
            <button class="btn secondary" onClick={stop}>
              <IconStop /> {timer.phase === 'break' ? 'Terminer la pause' : 'Abandonner'}
            </button>
          </div>
        )}
        {timer.phase === 'focus' && <p class="muted small" style={{ margin: 0 }}>Abandonner ne rapporte aucun ticket.</p>}
      </div>

      {timer.phase === 'idle' && (
        <section class="card section">
          <h2 style={{ fontSize: '1rem' }}>Réglages du minuteur</h2>
          <div class="switch-row">
            <span>Durée du focus</span>
            <Stepper id="focus-minutes" value={focusMinutes} min={5} max={90} step={5} unit="min" onChange={(v) => dispatch({ type: 'settings', patch: { focusMinutes: v } })} />
          </div>
          <div class="switch-row">
            <span>Durée de la pause</span>
            <Stepper id="break-minutes" value={breakMinutes} min={1} max={30} unit="min" onChange={(v) => dispatch({ type: 'settings', patch: { breakMinutes: v } })} />
          </div>
          <div class="switch-row">
            <span>Tickets par session</span>
            <Stepper id="focus-points" value={focusPoints} min={5} max={100} step={5} onChange={(v) => dispatch({ type: 'settings', patch: { focusPoints: v } })} />
          </div>
        </section>
      )}

      <section class="kpis" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div class="kpi">
          <span class="label">Aujourd’hui</span>
          <strong>{sessionsToday.length}</strong>
          <span class="muted small">session{sessionsToday.length > 1 ? 's' : ''}</span>
        </div>
        <div class="kpi">
          <span class="label">Temps</span>
          <strong>{formatMinutes(minutesToday)}</strong>
          <span class="muted small">concentré</span>
        </div>
        <div class="kpi">
          <span class="label">Total</span>
          <strong>{state.focus.length}</strong>
          <span class="muted small">sessions</span>
        </div>
      </section>
    </div>
  );
}
