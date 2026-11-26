// Stockage local (localStorage) : tout reste sur l'appareil.
const KEY = 'recomp:v1';

export function defaultState() {
  return {
    version: 1,
    profile: null,
    plan: null,
    progression: { ex: {}, variants: {} },
    logs: {
      sessions: [], // { id, date, title, type, minutes, durationSec, exercises: [...], rpe, completedAt }
      weights: [], // { date, weight, waist }
      checkins: {}, // date -> { sleep, energy, soreness, stress, pain, mood, score }
      water: {}, // date -> ml
      coach: [], // { date, trackerId, exId, reps, partial, holdSec, score, topErrors }
      tests: [], // { date, push, squat, pull, plank }
      breath: [], // { date, secs, pattern }
    },
    records: {}, // trackerId -> { reps, holdSec, date }
    settings: { voice: true, sound: true, model: 'lite', voiceCounts: true, persona: 'calm' },
    game: null, // progression RPG (voir js/game/leveling.js)
    active: null, // séance en cours
  };
}

let state = null;
const listeners = new Set();

function merge(base, saved) {
  const out = { ...base, ...saved };
  out.logs = { ...base.logs, ...(saved.logs || {}) };
  out.settings = { ...base.settings, ...(saved.settings || {}) };
  out.progression = { ...base.progression, ...(saved.progression || {}) };
  return out;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? merge(defaultState(), JSON.parse(raw)) : defaultState();
  } catch {
    state = defaultState();
  }
  return state;
}

export function getState() {
  return state || load();
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Sauvegarde impossible', e);
  }
  listeners.forEach((fn) => fn(state));
}

export function update(fn) {
  fn(getState());
  save();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function exportData() {
  return JSON.stringify({ app: 'recomp', exportedAt: new Date().toISOString(), state: getState() }, null, 2);
}

export function importData(text) {
  const parsed = JSON.parse(text);
  const s = parsed.state || parsed;
  if (!s || typeof s !== 'object' || !('logs' in s)) throw new Error('Fichier invalide');
  state = merge(defaultState(), s);
  save();
}

export function resetAll() {
  state = defaultState();
  save();
}
