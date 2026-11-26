/** Minuteur focus / pause, basé sur des horodatages : il reste juste même si l'onglet dort. */
export interface Timer {
  phase: 'idle' | 'focus' | 'break';
  running: boolean;
  /** Fin prévue (ms) quand le minuteur tourne */
  endsAt: number;
  /** Temps restant (ms) quand il est en pause */
  remaining: number;
  /** Durée de la phase en minutes */
  minutes: number;
}

export const IDLE: Timer = { phase: 'idle', running: false, endsAt: 0, remaining: 0, minutes: 0 };

export function start(phase: 'focus' | 'break', minutes: number, now: number): Timer {
  return { phase, running: true, endsAt: now + minutes * 60_000, remaining: minutes * 60_000, minutes };
}

export function pause(t: Timer, now: number): Timer {
  return t.running ? { ...t, running: false, remaining: Math.max(0, t.endsAt - now) } : t;
}

export function resume(t: Timer, now: number): Timer {
  return !t.running && t.phase !== 'idle' ? { ...t, running: true, endsAt: now + t.remaining } : t;
}

export function remainingMs(t: Timer, now: number): number {
  if (t.phase === 'idle') return 0;
  return t.running ? Math.max(0, t.endsAt - now) : t.remaining;
}

export type TimerEvent = { type: 'focusDone'; minutes: number; at: number } | { type: 'breakDone'; at: number };

/** Fait avancer le minuteur jusqu'à now : une fin de focus enchaîne sur la pause. */
export function advance(t: Timer, now: number, breakMinutes: number): { timer: Timer; events: TimerEvent[] } {
  const events: TimerEvent[] = [];
  let cur = t;
  while (cur.running && now >= cur.endsAt) {
    if (cur.phase === 'focus') {
      events.push({ type: 'focusDone', minutes: cur.minutes, at: cur.endsAt });
      cur = start('break', breakMinutes, cur.endsAt);
    } else {
      events.push({ type: 'breakDone', at: cur.endsAt });
      cur = IDLE;
    }
  }
  return { timer: cur, events };
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
