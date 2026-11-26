import { useEffect, useState } from 'preact/hooks';
import { connectCloud, type CloudHandle, type CloudStatus } from './cloud';
import { IDLE, type Timer } from './focus';
import { initialState, migrate, reduce, type Action } from './state';
import type { State } from './types';

const KEY = 'recomp:v1';
const TIMER_KEY = 'recomp:timer';

function readLocal<T>(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage plein ou bloqué : l'appli continue en mémoire */
  }
}

// ------------------------------------------------------------------ État principal

let state: State = migrate(readLocal(KEY)) ?? initialState();
let cloudStatus: CloudStatus = 'local';
let cloud: CloudHandle | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const getState = () => state;

export function dispatch(action: Action) {
  const next = reduce(state, action);
  if (next === state) return;
  const remote = action.type === 'replace' && action.remote;
  state = remote ? next : { ...next, updatedAt: Date.now() };
  writeLocal(KEY, state);
  if (!remote) cloud?.schedule();
  emit();
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function useExternal<T>(get: () => T): T {
  const [, force] = useState(0);
  useEffect(() => subscribe(() => force((n) => n + 1)), []);
  return get();
}

export const useAppState = () => useExternal(() => state);
export const useCloudStatus = () => useExternal(() => cloudStatus);

export function startCloud() {
  connectCloud({
    getState: () => state,
    onRemote: (remote) => dispatch({ type: 'replace', state: remote, remote: true }),
    onStatus: (s) => {
      cloudStatus = s;
      emit();
    },
  }).then((handle) => {
    cloud = handle;
  });
}

// ------------------------------------------------------------------ Minuteur (propre à chaque appareil)

let timer: Timer = { ...IDLE, ...((readLocal(TIMER_KEY) as Partial<Timer>) ?? {}) };

export const getTimer = () => timer;

export function setTimer(t: Timer) {
  timer = t;
  writeLocal(TIMER_KEY, t);
  emit();
}

export const useTimer = () => useExternal(() => timer);
