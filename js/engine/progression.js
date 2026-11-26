// Progression automatique (double progression + variantes plus dures). Fonctions pures.
import { EX, exerciseAllowed } from '../data/exercises.js';

const DEFAULT_TESTS = {
  push: [4, 12, 25, 40],
  squat: [25, 35, 45, 55],
  pull: [0, 2, 8, 14],
  plank: [30, 60, 90, 120],
};
const BASE_FACTOR = { push: 0.6, pull: 0.6, squat: 1, plank: 1 };
const REP_CAP = { push: 20, squat: 25, pull: 12 };

export function testValue(profile, base) {
  const t = profile.tests?.[base];
  if (t !== null && t !== undefined && t !== '' && Number.isFinite(Number(t))) return Number(t);
  const lvl = Math.max(0, Math.min(3, profile.liftLevel ?? 1));
  return DEFAULT_TESTS[base][lvl];
}

export function emptyProgression() {
  return { ex: {}, variants: {} };
}

// Variante de départ pour un exercice au poids du corps selon les tests.
export function startingVariant(pattern, profile) {
  if (pattern === 'h_push') {
    const push = testValue(profile, 'push');
    if (push < 5) return 'knee_pushup';
    if (push >= 30 && (profile.liftLevel ?? 1) >= 2) return 'diamond_pushup';
    return 'pushup';
  }
  if (pattern === 'v_pull') {
    const pull = testValue(profile, 'pull');
    return pull >= 4 ? 'pullup' : 'negative_pullup';
  }
  if (pattern === 'squat') {
    const sq = testValue(profile, 'squat');
    if (sq < 15) return 'box_squat';
    if (sq >= 50 && (profile.liftLevel ?? 1) >= 2) return 'bulgarian_split_squat';
    return 'squat';
  }
  if (pattern === 'hinge') return 'glute_bridge';
  return null;
}

// Charge de départ prudente, arrondie à l'incrément de l'exercice (l'utilisateur l'ajuste à la 1re séance).
export function startingLoad(ex, profile) {
  if (!ex.load || !profile.weight) return null;
  const lvl = profile.liftLevel ?? 1;
  const levelF = [0.8, 1, 1.3, 1.6][Math.max(0, Math.min(3, lvl))];
  const sexF = profile.sex === 'female' ? 0.7 : 1;
  const ageF = profile.age >= 60 ? 0.75 : profile.age < 16 ? 0.6 : 1;
  const inc = ex.inc || 2;
  const raw = profile.weight * ex.load * levelF * sexF * ageF;
  return Math.max(inc, Math.round(raw / inc) * inc);
}

export function defaultTarget(ex, profile) {
  if (ex.type === 'time') {
    if (ex.base) {
      const t = testValue(profile, ex.base) * (ex.scale ?? 0.6);
      return { secs: clamp(Math.round(t / 5) * 5, 15, 120) };
    }
    return { secs: ex.secs || 30 };
  }
  if (ex.type === 'round') return {};
  if (ex.weighted) {
    const goal = profile.primaryGoal;
    const weight = startingLoad(ex, profile);
    if (goal === 'strength') return { reps: [5, 8], weight };
    if (goal === 'muscle') return { reps: [8, 12], weight };
    return { reps: [10, 15], weight };
  }
  if (ex.reps) return { reps: [...ex.reps] };
  if (ex.base) {
    const t = testValue(profile, ex.base) * (ex.scale ?? 1) * (BASE_FACTOR[ex.base] ?? 1);
    const lo = clamp(Math.round(t), ex.min ?? 5, ex.max ?? 30);
    const hi = Math.min(ex.max ?? 40, lo + (lo >= 12 ? 4 : 3));
    return { reps: [lo, Math.max(lo, hi)] };
  }
  if (ex.pattern === 'muaythai_drill') return { reps: [10, 12] };
  if (ex.pattern === 'core') return { reps: [10, 15] };
  if (ex.pattern === 'calves') return { reps: [15, 20] };
  return { reps: [10, 15] };
}

export function currentTarget(progression, ex, profile) {
  const p = progression?.ex?.[ex.id];
  const def = defaultTarget(ex, profile);
  if (!p) return def;
  return {
    ...def,
    ...(p.reps ? { reps: p.reps } : {}),
    ...(p.secs ? { secs: p.secs } : {}),
    ...(p.weight !== undefined ? { weight: p.weight } : {}),
  };
}

function capFor(ex) {
  return ex.cap ?? REP_CAP[ex.base] ?? 20;
}

/**
 * Applique le résultat d'un exercice et renvoie { progression, message }.
 * result = { sets: [{ reps, weight, secs }], rpe: 'easy' | 'ok' | 'hard', slot?: string }
 */
export function applyResult(progression, exId, result, profile) {
  const ex = EX[exId];
  const prog = {
    ex: { ...(progression?.ex || {}) },
    variants: { ...(progression?.variants || {}) },
  };
  if (!ex || !result?.sets?.length) return { progression: prog, message: null };
  const target = currentTarget(progression, ex, profile);
  const cur = { fails: 0, ...(prog.ex[exId] || {}) };
  const rpe = result.rpe || 'ok';
  let message = null;

  if (ex.type === 'time') {
    const goal = target.secs || ex.secs || 30;
    const all = result.sets.every((s) => (s.secs ?? 0) >= goal);
    const weak = result.sets.some((s) => (s.secs ?? 0) < goal * 0.7);
    if (all && rpe !== 'hard') {
      cur.secs = Math.min(180, goal + (goal < 60 ? 5 : 10));
      cur.fails = 0;
      message = `${ex.name} : prochaine fois ${cur.secs} s 🔥`;
    } else if (weak || rpe === 'hard') {
      cur.fails += 1;
      cur.secs = goal;
      if (cur.fails >= 2) {
        cur.secs = Math.max(10, goal - 5);
        cur.fails = 0;
        message = `${ex.name} : on redescend à ${cur.secs} s pour consolider.`;
      }
    } else {
      cur.secs = goal;
    }
    prog.ex[exId] = cur;
    return { progression: prog, message };
  }

  if (!target.reps) {
    prog.ex[exId] = cur;
    return { progression: prog, message };
  }
  let [lo, hi] = target.reps;
  const reps = result.sets.map((s) => Number(s.reps) || 0);
  const allTop = reps.every((r) => r >= hi);
  const anyLow = reps.some((r) => r < lo);
  const weight = result.sets.find((s) => s.weight)?.weight ?? target.weight ?? null;
  if (ex.weighted && weight) cur.weight = weight;

  if (allTop && rpe !== 'hard') {
    cur.fails = 0;
    if (ex.weighted && weight) {
      const inc = ex.inc || 2;
      cur.weight = Math.round((weight + inc) * 10) / 10;
      cur.reps = [lo, hi];
      message = `${ex.name} : +${inc} kg la prochaine fois (${cur.weight} kg) 💪`;
    } else if (!ex.weighted && hi >= capFor(ex) && ex.harder && EX[ex.harder] && exerciseAllowed(EX[ex.harder], profile)) {
      const slot = result.slot || `${ex.pattern}:bw`;
      prog.variants[slot] = ex.harder;
      cur.reps = [lo, hi];
      message = `Niveau supérieur débloqué : ${EX[ex.harder].name} 🚀`;
    } else {
      lo += 1;
      hi += 1;
      cur.reps = [lo, hi];
      message = `${ex.name} : objectif ${lo}-${hi} reps la prochaine fois.`;
    }
  } else if (anyLow) {
    cur.fails += 1;
    cur.reps = [lo, hi];
    if (cur.fails >= 2) {
      cur.fails = 0;
      if (ex.weighted && weight) {
        const inc = ex.inc || 2;
        cur.weight = Math.max(0, Math.round((weight * 0.9) / inc) * inc);
        message = `${ex.name} : charge allégée à ${cur.weight} kg pour repartir proprement.`;
      } else if (lo > (ex.min ?? 4)) {
        cur.reps = [lo - 1, hi - 1];
        message = `${ex.name} : objectif ajusté à ${lo - 1}-${hi - 1} reps.`;
      } else if (ex.easier && EX[ex.easier]) {
        const slot = result.slot || `${ex.pattern}:bw`;
        prog.variants[slot] = ex.easier;
        message = `On passe à ${EX[ex.easier].name} pour progresser sans se blesser.`;
      }
    }
  } else {
    cur.reps = [lo, hi];
  }
  prog.ex[exId] = cur;
  return { progression: prog, message };
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
