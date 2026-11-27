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

const MAX_IMPORT = 25 * 1024 * 1024;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

// Nettoie récursivement un objet importé : retire les caractères HTML des textes, limite les tailles,
// supprime les clés dangereuses (__proto__…). Un fichier piégé ne peut donc pas injecter de code dans l'app.
export function sanitize(value, depth = 0) {
  if (depth > 12) return null;
  if (typeof value === 'string') return value.replace(/[<>]/g, '').slice(0, 2000);
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 5000).map((v) => sanitize(v, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    Object.keys(value).slice(0, 5000).forEach((k) => {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') return;
      out[k.replace(/[<>]/g, '').slice(0, 100)] = sanitize(value[k], depth + 1);
    });
    return out;
  }
  return null;
}

export function importData(text) {
  if (typeof text !== 'string' || text.length > MAX_IMPORT) throw new Error('Fichier trop gros');
  const parsed = sanitize(JSON.parse(text));
  const s = parsed.state || parsed;
  if (!s || typeof s !== 'object' || !('logs' in s) || typeof s.logs !== 'object') throw new Error('Fichier invalide');
  // dates des journaux au bon format, sinon l'entrée est ignorée
  const logs = s.logs || {};
  ['sessions', 'weights', 'coach', 'tests', 'breath'].forEach((k) => {
    logs[k] = Array.isArray(logs[k]) ? logs[k].filter((x) => x && typeof x === 'object' && ISO.test(x.date || '')) : [];
  });
  ['checkins', 'water'].forEach((k) => {
    const o = logs[k] && typeof logs[k] === 'object' && !Array.isArray(logs[k]) ? logs[k] : {};
    logs[k] = Object.fromEntries(Object.entries(o).filter(([d]) => ISO.test(d)));
  });
  s.logs = logs;
  state = merge(defaultState(), s);
  save();
}

export function resetAll() {
  state = defaultState();
  save();
}
