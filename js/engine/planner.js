// Générateur de programme : semaine type + séance détaillée pour une date. Règles uniquement.
import { EXERCISES, EX, exerciseAllowed } from '../data/exercises.js';
import { roundConfig } from '../data/muaythai.js';
import { currentTarget, startingVariant } from './progression.js';
import { rng, shuffle } from './random.js';
import { weekday, daysBetween, mondayOf } from './dates.js';

export const GOALS = [
  { id: 'muscle', label: 'Prendre du muscle', emoji: '💪' },
  { id: 'muaythai', label: 'Muay Thai', emoji: '🥊' },
  { id: 'fatloss', label: 'Perdre du gras', emoji: '🔥' },
  { id: 'strength', label: 'Devenir plus fort', emoji: '🏋️' },
  { id: 'cardio', label: 'Cardio / endurance', emoji: '🫀' },
  { id: 'mobility', label: 'Souplesse / mobilité', emoji: '🤸' },
  { id: 'wellbeing', label: 'Bien-être / anti-stress', emoji: '🧘' },
];

export const TYPE_META = {
  strength: { label: 'Musculation', emoji: '💪', color: 'var(--c-strength)' },
  muaythai: { label: 'Muay Thai', emoji: '🥊', color: 'var(--c-mt)' },
  cardio: { label: 'Cardio', emoji: '🫀', color: 'var(--c-cardio)' },
  mobility: { label: 'Mobilité', emoji: '🧘', color: 'var(--c-mob)' },
  rest: { label: 'Repos', emoji: '😴', color: 'var(--c-rest)' },
};

export const FOCUS_TITLE = {
  fullA: 'Full body A', fullB: 'Full body B', fullC: 'Full body C',
  upper: 'Haut du corps', lower: 'Bas du corps',
  push: 'Poussée (pecs, épaules, triceps)', pull: 'Tirage (dos, biceps)', legs: 'Jambes & fessiers',
  fighter: 'Renfo du combattant',
  technique: 'Muay Thai : technique', bag: 'Muay Thai : sac de frappe', shadow: 'Muay Thai : shadow & puissance',
  conditioning: 'Muay Thai : cardio combat', pads: 'Muay Thai : pattes d’ours',
  hiit: 'Cardio HIIT', rope: 'Corde à sauter', zone2: 'Cardio doux',
  recovery: 'Mobilité & récupération', rest: 'Repos',
};

const SLOTS = {
  fullA: ['squat', 'h_push', 'h_pull', 'hinge', 'v_push', 'core', 'biceps'],
  fullB: ['hinge', 'v_pull', 'h_push', 'lunge', 'core', 'triceps', 'calves'],
  fullC: ['lunge', 'h_push', 'h_pull', 'squat', 'v_push', 'core', 'biceps'],
  upper: ['h_push', 'h_pull', 'v_push', 'v_pull', 'biceps', 'triceps', 'core'],
  lower: ['squat', 'hinge', 'lunge', 'calves', 'core'],
  push: ['h_push', 'v_push', 'h_push', 'triceps', 'core'],
  pull: ['v_pull', 'h_pull', 'h_pull', 'biceps', 'core'],
  legs: ['squat', 'hinge', 'lunge', 'calves', 'core'],
  fighter: ['squat', 'h_push', 'v_pull', 'hinge', 'core', 'neck'],
};

const FALLBACK = { v_pull: 'h_pull', v_push: 'h_push', biceps: 'h_pull', triceps: 'h_push', lunge: 'squat', neck: 'core' };

// ---------------------------------------------------------------------------
// Semaine type
// ---------------------------------------------------------------------------
export function buildWeek(profile) {
  const days = [...new Set(profile.days || [])].filter((d) => d >= 0 && d <= 6).sort((a, b) => a - b);
  const n = days.length;
  const week = Array.from({ length: 7 }, () => ({ type: 'rest', focus: 'rest', title: FOCUS_TITLE.rest }));
  const reasons = [];
  if (!n) return { week, reasons: ['Aucun jour choisi : ajoute des jours d’entraînement dans ton profil.'] };

  const G = new Set(profile.goals || []);
  const primary = profile.primaryGoal;
  let wantS = G.has('muscle') || G.has('strength') || G.has('fatloss');
  const wantM = G.has('muaythai');
  const wantC = G.has('cardio') || G.has('fatloss');
  const wantMob = G.has('mobility') || G.has('wellbeing');
  if (!wantS && !wantM && !wantC && !wantMob) wantS = true;

  const c = { strength: 0, muaythai: 0, cardio: 0, mobility: 0 };
  let r = n;
  if ((wantMob && n >= 4) || n === 7) {
    c.mobility = 1;
    r -= 1;
    reasons.push('1 séance de mobilité/récupération pour rester souple et récupérer entre les grosses séances.');
  } else if (wantMob) {
    reasons.push('Mobilité ajoutée en fin de chaque séance (pas assez de jours pour une séance dédiée).');
  }

  if (wantS && wantM) {
    if (r === 1) {
      c[primary === 'muaythai' ? 'muaythai' : 'strength'] = 1;
    } else {
      const sFirst = primary === 'muscle' || primary === 'strength' || primary === 'fatloss';
      c.strength = primary === 'muaythai' ? Math.floor(r / 2) : sFirst ? Math.ceil(r / 2) : Math.ceil(r / 2);
      c.muaythai = r - c.strength;
    }
    reasons.push(`Musculation ${c.strength}×/sem + Muay Thai ${c.muaythai}×/sem, en alternance pour récupérer.`);
  } else if (wantS) {
    c.cardio = wantC ? (r >= 5 ? 2 : r >= 3 ? 1 : 0) : 0;
    c.strength = r - c.cardio;
    reasons.push(`Musculation ${c.strength}×/sem${c.cardio ? ` + cardio ${c.cardio}×/sem` : ''}.`);
  } else if (wantM) {
    c.strength = r >= 3 ? 1 : 0;
    c.cardio = wantC && r >= 5 ? 1 : 0;
    c.muaythai = r - c.strength - c.cardio;
    reasons.push(`Muay Thai ${c.muaythai}×/sem${c.strength ? ' + 1 séance de renfo spéciale combattant' : ''}.`);
  } else {
    c.cardio = wantC ? Math.ceil(r / 2) : 0;
    const rest = r - c.cardio;
    c.strength = rest > 0 ? Math.ceil(rest / 2) : 0;
    c.mobility += rest - c.strength;
    reasons.push('Mélange cardio, renforcement et mobilité pour la santé globale.');
  }

  // Focus de chaque type
  const lvl = profile.liftLevel ?? 1;
  const equip = new Set(profile.equipment || []);
  let sFocus;
  if (wantM && !wantS) sFocus = Array(c.strength).fill('fighter');
  else if (c.strength <= 1) sFocus = ['fullA'];
  else if (c.strength === 2) sFocus = ['fullA', 'fullB'];
  else if (c.strength === 3) sFocus = lvl <= 1 || wantM ? ['fullA', 'fullB', 'fullC'] : ['upper', 'lower', 'fullA'];
  else if (c.strength === 4) sFocus = ['upper', 'lower', 'upper', 'lower'];
  else if (c.strength === 5) sFocus = ['push', 'pull', 'legs', 'upper', 'lower'];
  else sFocus = ['push', 'pull', 'legs', 'push', 'pull', 'legs'];
  sFocus = sFocus.slice(0, c.strength);
  if (c.strength >= 3) reasons.push(lvl <= 1 ? 'Débutant : full body, chaque muscle travaillé plusieurs fois par semaine (le plus efficace pour progresser vite).' : 'Split adapté à ton niveau pour plus de volume par muscle.');

  const power = equip.has('bag') ? 'bag' : equip.has('pads') ? 'pads' : 'shadow';
  const mtCycle = ['technique', power, 'conditioning', power === 'shadow' ? 'technique' : power, 'conditioning', 'technique', power];
  const mFocus = mtCycle.slice(0, c.muaythai);
  const cCycle = equip.has('rope') ? ['hiit', 'rope', 'zone2'] : ['hiit', 'zone2'];
  if (G.has('fatloss') && !G.has('cardio')) cCycle.reverse();
  const cFocus = Array.from({ length: c.cardio }, (_, i) => cCycle[i % cCycle.length]);
  const bFocus = Array(c.mobility).fill('recovery');

  const queues = {
    strength: sFocus, muaythai: mFocus, cardio: cFocus, mobility: bFocus,
  };
  // Entrelacement : on évite deux séances du même type d'affilée.
  const order = [];
  let last = null;
  const remaining = () => Object.entries(queues).filter(([, q]) => q.length);
  while (remaining().length) {
    const opts = remaining().sort((a, b) => b[1].length - a[1].length || prio(a[0]) - prio(b[0]));
    let choice = opts.find(([t]) => t !== last && !(t === 'mobility' && order.length === 0 && opts.length > 1));
    if (!choice) [choice] = opts;
    // la mobilité va de préférence en fin de semaine
    if (choice[0] === 'mobility' && opts.length > 1 && opts.some(([t, q]) => t !== 'mobility' && t !== last && q.length)) {
      choice = opts.find(([t]) => t !== 'mobility' && t !== last) || choice;
    }
    const [type, q] = choice;
    order.push({ type, focus: q.shift() });
    last = type;
  }

  const counters = {};
  order.forEach((s, i) => {
    counters[s.focus] = (counters[s.focus] || 0) + 1;
    week[days[i]] = { type: s.type, focus: s.focus, title: FOCUS_TITLE[s.focus], variant: counters[s.focus] - 1 };
  });

  if (G.has('fatloss')) reasons.push('Perte de gras : on garde la muscu lourde pour conserver le muscle, le déficit vient de l’alimentation.');
  if ((profile.injuries || []).length) reasons.push('Exercices risqués pour tes zones sensibles retirés et remplacés automatiquement.');
  reasons.push('Toutes les 5 semaines : semaine de décharge (volume −40 %) pour récupérer et repartir plus fort.');
  return { week, reasons };
}

function prio(t) {
  return { strength: 0, muaythai: 1, cardio: 2, mobility: 3 }[t];
}

// ---------------------------------------------------------------------------
// Sélection d'exercices
// ---------------------------------------------------------------------------
function levelCap(profile) {
  const l = profile.liftLevel ?? 1;
  return l <= 1 ? 1 : l === 2 ? 2 : 3;
}

function hasLoad(profile) {
  const e = new Set(profile.equipment || []);
  return e.has('dumbbells') || e.has('kettlebell') || e.has('gym');
}

export function candidates(pattern, profile) {
  const cap = levelCap(profile);
  return EXERCISES.filter((e) => e.pattern === pattern && exerciseAllowed(e, profile) && e.level <= cap);
}

/**
 * Choisit un exercice pour un schéma moteur.
 * - si une variante au poids du corps est mémorisée par la progression, on la reprend ;
 * - sinon on privilégie les exercices chargés pour la prise de muscle / force.
 */
export function chooseExercise(pattern, profile, progression, variantIdx, used) {
  let pat = pattern;
  let list = candidates(pat, profile).filter((e) => !used.has(e.id));
  if (!list.length && FALLBACK[pat]) {
    pat = FALLBACK[pat];
    list = candidates(pat, profile).filter((e) => !used.has(e.id));
  }
  if (!list.length) return null;
  const slot = `${pat}:bw`;
  const goals = new Set(profile.goals || []);
  const loadPref = hasLoad(profile) && (goals.has('muscle') || goals.has('strength'));

  // Variante poids du corps mémorisée
  const remembered = progression?.variants?.[slot];
  const bwPick = () => {
    if (remembered && EX[remembered] && exerciseAllowed(EX[remembered], profile) && !used.has(remembered)) return EX[remembered];
    const start = startingVariant(pat, profile);
    if (start && EX[start] && exerciseAllowed(EX[start], profile) && !used.has(start)) return EX[start];
    return null;
  };

  const weighted = list.filter((e) => e.weighted);
  const bodyweight = list.filter((e) => !e.weighted);
  let pool;
  if (loadPref && weighted.length) {
    pool = weighted;
  } else {
    // Poids du corps : on suit la chaîne de progression (pompes genoux -> pompes -> diamant...)
    const bw = bwPick();
    if (bw) return { ex: bw, slot };
    pool = bodyweight.length ? bodyweight : list;
  }
  const sorted = [...pool].sort((a, b) => scoreEx(b, profile) - scoreEx(a, profile) || a.id.localeCompare(b.id));
  const top = sorted.filter((e) => scoreEx(e, profile) >= scoreEx(sorted[0], profile) - 1);
  const ex = top[variantIdx % top.length];
  return { ex, slot };
}

function scoreEx(e, profile) {
  let s = 0;
  if (e.level === levelCap(profile)) s += 1;
  if (e.track) s += 0.5;
  if (!e.unilateral) s += 0.5;
  if (e.weighted && (profile.equipment || []).includes('gym')) s += 0.5;
  return s;
}

// ---------------------------------------------------------------------------
// Séance détaillée
// ---------------------------------------------------------------------------
export function weekIndex(profile, iso) {
  const start = profile.planStart || iso;
  return Math.floor(daysBetween(mondayOf(start), mondayOf(iso)) / 7) + 1;
}

export function isDeload(profile, iso) {
  return weekIndex(profile, iso) % 5 === 0;
}

function estimateSetSec(item) {
  if (item.secs) return item.secs;
  const hi = item.reps ? item.reps[1] : 10;
  return hi * 3 + 15;
}

function itemMinutes(item) {
  if (item.kind === 'sets' || item.kind === 'timed') {
    const sets = item.sets || 1;
    const per = estimateSetSec(item) * (item.unilateral ? 2 : 1);
    return (sets * per + Math.max(0, sets - 1) * (item.rest || 0)) / 60 + 0.5;
  }
  if (item.kind === 'rounds') return (item.rounds * item.work + (item.rounds - 1) * item.restSec) / 60 + 0.5;
  if (item.kind === 'interval') return (item.rounds * item.exercises.length * (item.work + item.restSec)) / 60 + 0.5;
  return 1;
}

export function sessionMinutes(session) {
  return Math.round(session.blocks.reduce((s, b) => s + b.items.reduce((t, i) => t + itemMinutes(i), 0), 0));
}

function makeSets(ex, profile, progression, opts = {}) {
  const t = currentTarget(progression, ex, profile);
  const lvl = profile.liftLevel ?? 1;
  const strengthGoal = profile.primaryGoal === 'strength';
  let sets = opts.sets ?? (ex.pattern === 'core' || ex.pattern === 'calves' || ex.pattern === 'biceps' || ex.pattern === 'triceps' ? 2 : 3);
  if (lvl >= 2 && opts.main) sets += 1;
  let rest = 60;
  if (ex.weighted && opts.main) rest = strengthGoal ? 150 : 90;
  else if (opts.main) rest = 75;
  if (ex.type === 'time') {
    return { exId: ex.id, kind: 'timed', sets, secs: t.secs || ex.secs || 30, rest: Math.min(rest, 60), track: ex.track || null, unilateral: !!ex.unilateral, slot: opts.slot };
  }
  return {
    exId: ex.id, kind: 'sets', sets, reps: t.reps, weight: t.weight ?? null, weighted: !!ex.weighted, rest,
    track: ex.track || null, unilateral: !!ex.unilateral, slot: opts.slot,
  };
}

function timed(exId, secs, extra = {}) {
  const ex = EX[exId];
  return { exId, kind: 'timed', sets: 1, secs: secs ?? ex.secs ?? 30, rest: 10, track: ex.track || null, unilateral: !!ex.unilateral, ...extra };
}

function allowed(id, profile) {
  return EX[id] && exerciseAllowed(EX[id], profile);
}

function warmup(type, profile, minutes, r) {
  const items = [];
  const short = minutes <= 30;
  if (type === 'muaythai' || type === 'cardio') {
    if (allowed('jump_rope', profile)) items.push(timed('jump_rope', short ? 120 : 180));
    else if (allowed('jumping_jacks', profile)) items.push(timed('jumping_jacks', 60));
    else items.push(timed('shadow_run', 90));
    items.push(timed('leg_swings', 40), timed('hip_circles', 30), timed('arm_circles', 30));
    if (type === 'muaythai') items.push(timed('shadow_run', short ? 60 : 120));
  } else if (type === 'mobility') {
    items.push(timed('cat_cow', 45), timed('arm_circles', 30));
  } else {
    const pool = ['arm_circles', 'hip_circles', 'leg_swings'];
    if (allowed('jumping_jacks', profile)) pool.unshift('jumping_jacks');
    if (allowed('inchworm', profile)) pool.push('inchworm');
    if (allowed('bw_squat_warm', profile)) pool.push('bw_squat_warm');
    shuffle(pool, r).slice(0, short ? 3 : 5).forEach((id) => items.push(timed(id)));
  }
  return { name: 'Échauffement', items };
}

const COOL = {
  strength: ['chest_stretch', 'hamstring_stretch', 'hip_flexor_stretch', 'quad_stretch', 'child_pose', 'thoracic_rot'],
  muaythai: ['hip_9090', 'pigeon', 'butterfly', 'hamstring_stretch', 'hip_flexor_stretch', 'child_pose'],
  cardio: ['quad_stretch', 'hamstring_stretch', 'hip_flexor_stretch', 'ankle_mob', 'child_pose'],
};

function cooldown(type, profile, minutes, r, extraMob) {
  const pool = (COOL[type] || COOL.strength).filter((id) => allowed(id, profile));
  const n = extraMob ? 5 : minutes <= 30 ? 2 : 3;
  return { name: 'Retour au calme', items: shuffle(pool, r).slice(0, n).map((id) => timed(id)) };
}

function strengthMain(focus, profile, progression, budget, variant) {
  const slots = SLOTS[focus] || SLOTS.fullA;
  const used = new Set();
  const items = [];
  let usedMin = 0;
  slots.forEach((pattern, i) => {
    if (items.length >= 3 && usedMin >= budget) return;
    const choice = chooseExercise(pattern, profile, progression, variant + i, used);
    if (!choice) return;
    const { ex, slot } = choice;
    const item = makeSets(ex, profile, progression, { main: i < 3, slot });
    const m = itemMinutes(item);
    if (items.length >= 3 && usedMin + m > budget + 3) return;
    used.add(ex.id);
    items.push(item);
    usedMin += m;
  });
  // Séances longues : exercices d'accessoire supplémentaires
  for (const pattern of ['core', 'h_pull', 'h_push', 'lunge', 'biceps', 'triceps', 'calves', 'hinge', 'squat']) {
    if (usedMin >= budget - 5) break;
    if (items.length >= 9) break;
    const choice = chooseExercise(pattern, profile, progression, variant + 7, used);
    if (!choice || used.has(choice.ex.id)) continue;
    const item = makeSets(choice.ex, profile, progression, { main: false, slot: choice.slot });
    const m = itemMinutes(item);
    if (usedMin + m > budget + 2) continue;
    used.add(choice.ex.id);
    items.push(item);
    usedMin += m;
  }
  // Temps restant : une série de plus, en commençant par les exercices principaux
  for (let guard = 0; guard < 30 && usedMin < budget - 3; guard += 1) {
    const it = items[guard % items.length];
    const cap = guard % items.length < 3 ? 5 : 4;
    if (it.sets < cap) {
      it.sets += 1;
      usedMin += itemMinutes({ ...it, sets: 1 }) + (it.rest || 0) / 60;
    }
  }
  return items;
}

function mtMain(focus, profile, progression, budget, r) {
  const cfg = roundConfig(profile.mtLevel ?? 0);
  const items = [];
  const roundMin = (cfg.round + cfg.rest) / 60;
  const drills = [];
  if (allowed('mt_kicks', profile)) drills.push('mt_kicks');
  if (allowed('mt_teeps', profile)) drills.push('mt_teeps');
  if (allowed('mt_knees', profile)) drills.push('mt_knees');
  if (allowed('mt_check', profile)) drills.push('mt_check');

  if (focus === 'technique') {
    items.push(timed('mt_stance', 120, { sets: 2, rest: 30 }));
    shuffle(drills, r).slice(0, 2).forEach((id) => items.push({ ...makeSets(EX[id], profile, progression, { sets: 3 }), rest: 45 }));
    const left = budget - items.reduce((s, i) => s + itemMinutes(i), 0);
    const rounds = Math.max(2, Math.min(10, Math.floor(left / roundMin)));
    items.push({ exId: 'mt_shadow', kind: 'rounds', rounds, work: cfg.round, restSec: cfg.rest, combos: true, track: 'guard' });
  } else if ((focus === 'bag' || focus === 'pads') && allowed(focus === 'bag' ? 'mt_bag' : 'mt_pads', profile)) {
    const id = focus === 'bag' ? 'mt_bag' : 'mt_pads';
    items.push({ exId: 'mt_shadow', kind: 'rounds', rounds: 2, work: cfg.round, restSec: cfg.rest, combos: true, track: 'guard' });
    const left = budget - 2 * roundMin - 5;
    const rounds = Math.max(3, Math.min(12, Math.floor(left / roundMin)));
    items.push({ exId: id, kind: 'rounds', rounds, work: cfg.round, restSec: cfg.rest, combos: true, track: null });
    if (allowed('mt_knees', profile)) items.push({ ...makeSets(EX.mt_knees, profile, progression, { sets: 2 }), reps: [20, 20], rest: 45 });
  } else if (focus === 'shadow' || focus === 'bag' || focus === 'pads') {
    // Sans sac : shadow avec combinaisons + travail de puissance au poids du corps (comptés par la caméra)
    const power = drills.filter((id) => id !== 'mt_check');
    power.forEach((id) => items.push({ ...makeSets(EX[id], profile, progression, { sets: 3 }), reps: id === 'mt_knees' ? [20, 20] : [12, 15], rest: 45 }));
    if (allowed('jump_squat', profile)) items.push({ ...makeSets(EX.jump_squat, profile, progression, { sets: 3 }), rest: 60 });
    const left = budget - items.reduce((s, i) => s + itemMinutes(i), 0);
    const rounds = Math.max(3, Math.min(8, Math.floor(left / roundMin)));
    items.unshift({ exId: 'mt_shadow', kind: 'rounds', rounds, work: cfg.round, restSec: cfg.rest, combos: true, track: 'guard' });
  } else {
    // conditioning
    const pool = ['mt_knees', 'mt_kicks', allowed('mt_sprawl', profile) ? 'mt_sprawl' : 'burpees', 'mountain_climbers', 'high_knees', 'jump_squat', 'skater_jumps']
      .filter((id) => allowed(id, profile));
    const exs = shuffle(pool, r).slice(0, 5);
    if (exs.length < 3) exs.push(...['jumping_jacks', 'shadow_run'].filter((id) => allowed(id, profile)));
    const work = (profile.mtLevel ?? 0) >= 2 ? 40 : 30;
    const restSec = (profile.mtLevel ?? 0) >= 2 ? 20 : 30;
    const circuitMin = (exs.length * (work + restSec)) / 60;
    const rounds = Math.max(2, Math.min(5, Math.floor((budget * 0.55) / circuitMin)));
    items.push({ exId: exs[0], kind: 'interval', exercises: exs, work, restSec, rounds, title: 'Circuit combat' });
    const left = budget - itemMinutes(items[0]) - (budget >= 35 ? 3 : 0);
    const shadowRounds = Math.max(2, Math.min(8, Math.floor(left / roundMin)));
    items.push({ exId: 'mt_shadow', kind: 'rounds', rounds: shadowRounds, work: cfg.round, restSec: cfg.rest, combos: true, track: 'guard' });
  }
  if (budget >= 35 && allowed('plank', profile)) items.push(makeSets(EX.plank, profile, progression, { sets: 2 }));
  if (budget >= 45 && allowed('neck_iso', profile) && (profile.mtLevel ?? 0) >= 1) items.push(timed('neck_iso', 20, { sets: 2, rest: 20 }));
  return items;
}

function cardioMain(focus, profile, progression, budget, r) {
  if (focus === 'zone2') {
    return [timed('zone2', Math.max(15, Math.round(budget)) * 60)];
  }
  if (focus === 'rope' && allowed('jump_rope', profile)) {
    const rounds = Math.max(4, Math.min(15, Math.floor(budget / 1.5)));
    return [{ exId: 'jump_rope', kind: 'interval', exercises: ['jump_rope'], work: 60, restSec: 30, rounds, title: 'Intervalles corde' }];
  }
  const pool = ['jumping_jacks', 'high_knees', 'burpees', 'mountain_climbers', 'jump_squat', 'skater_jumps', 'squat', 'reverse_lunge']
    .filter((id) => allowed(id, profile) && EX[id].level <= levelCap(profile) + 1);
  const exs = shuffle(pool, r).slice(0, 5);
  const work = (profile.liftLevel ?? 1) >= 2 ? 40 : 30;
  const restSec = (profile.liftLevel ?? 1) >= 2 ? 20 : 30;
  const circuitMin = (exs.length * (work + restSec)) / 60;
  const rounds = Math.max(2, Math.min(6, Math.floor(budget / circuitMin)));
  return [{ exId: exs[0], kind: 'interval', exercises: exs, work, restSec, rounds, title: 'Circuit HIIT' }];
}

export const MOBILITY_POOL = ['world_greatest', 'hip_9090', 'cat_cow', 'thoracic_rot', 'hamstring_stretch', 'hip_flexor_stretch', 'pigeon', 'butterfly', 'shoulder_cars', 'chest_stretch', 'child_pose', 'cobra', 'ankle_mob', 'quad_stretch'];

function mobilityMain(profile, budget, r, exclude = new Set()) {
  const pool = shuffle(MOBILITY_POOL.filter((id) => allowed(id, profile) && !exclude.has(id)), r);
  const items = [];
  const breath = budget >= 15 ? timed('breath_coherence', budget >= 30 ? 300 : 180) : null;
  const target = budget - (breath ? itemMinutes(breath) : 0);
  let t = 0;
  for (const id of pool) {
    const it = timed(id, EX[id].secs >= 60 ? 60 : 45);
    items.push(it);
    t += itemMinutes(it);
    if (t >= target) break;
  }
  // Pas assez d'exercices pour remplir : on allonge les maintiens puis on fait 2 tours.
  if (t < target && items.length) {
    const ratio = Math.min(2, target / t);
    items.forEach((it) => { it.secs = Math.min(90, Math.round((it.secs * ratio) / 15) * 15); });
    t = items.reduce((s, i) => s + itemMinutes(i), 0);
    if (t < target * 0.75) items.forEach((it) => { it.sets = 2; it.rest = 10; });
  }
  if (breath) items.push(breath);
  return items;
}

/**
 * Génère la séance d'une date.
 * opts.readiness : score de forme 0-100 (optionnel). opts.force : ignorer l'adaptation.
 */
export function generateSession(profile, state, iso, opts = {}) {
  const plan = state.plan || buildWeek(profile);
  const day = plan.week[weekday(iso)];
  const minutes = profile.sessionMinutes || 45;
  const r = rng(`${iso}:${day.focus}:${profile.createdAt || ''}`);
  const progression = state.progression || { ex: {}, variants: {} };
  const deload = isDeload(profile, iso);
  const wIdx = weekIndex(profile, iso);
  let type = day.type;
  let focus = day.focus;
  let title = day.title;
  let adjusted = null;

  const score = opts.readiness;
  if (!opts.force && score !== undefined && score !== null && type !== 'rest') {
    if (score < 40 && type !== 'mobility') {
      adjusted = 'recovery';
      type = 'mobility';
      focus = 'recovery';
      title = 'Récupération active (forme basse)';
    } else if (score < 65) {
      adjusted = 'light';
    }
  }
  if (type === 'rest') {
    return { id: iso, date: iso, type: 'rest', focus: 'rest', title: 'Repos', minutes: 0, blocks: [], deload, week: wIdx };
  }

  const wantMob = (profile.goals || []).includes('mobility') || (profile.goals || []).includes('wellbeing');
  const wu = warmup(type, profile, minutes, r);
  const cd = type === 'mobility' ? { name: 'Respiration', items: [] } : cooldown(type, profile, minutes, r, wantMob);
  const fixed = [...wu.items, ...cd.items].reduce((s, i) => s + itemMinutes(i), 0);
  const budget = Math.max(10, minutes - fixed);
  const variant = (day.variant || 0) + wIdx;

  let main;
  const custom = type === 'strength' ? customItems(focus, profile, progression, state) : null;
  if (custom) main = custom;
  else if (type === 'strength') main = strengthMain(focus, profile, progression, budget, variant);
  else if (type === 'muaythai') main = mtMain(focus, profile, progression, budget, r);
  else if (type === 'cardio') main = cardioMain(focus, profile, progression, budget, r);
  else main = mobilityMain(profile, adjusted === 'recovery' ? Math.min(budget, 25) : budget, r, new Set(wu.items.map((i) => i.exId)));

  // Finisher pour la perte de gras / cardio les jours de muscu si du temps reste
  const blocks = [wu, { name: type === 'mobility' ? 'Mobilité' : 'Bloc principal', items: main }];
  const goals = new Set(profile.goals || []);
  const spare = minutes - sessionMinutes({ blocks: [...blocks, cd] });
  if (type === 'strength' && ((goals.has('fatloss') || goals.has('cardio')) || spare >= 8) && minutes >= 40) {
    const fin = ['burpees', 'mountain_climbers', 'jumping_jacks', 'high_knees'].filter((id) => allowed(id, profile));
    if (fin.length >= 2) {
      blocks.push({ name: 'Finisher', items: [{ exId: fin[0], kind: 'interval', exercises: shuffle(fin, r).slice(0, 3), work: 30, restSec: 30, rounds: 2, title: 'Finisher brûle-graisse' }] });
    }
  }
  if (cd.items.length) blocks.push(cd);

  // Ajustements : décharge / forme moyenne
  const reduce = (factor, roundsMinus) => {
    blocks.forEach((b) => {
      if (b.name === 'Échauffement' || b.name === 'Retour au calme') return;
      b.items.forEach((it) => {
        if (it.kind === 'sets' || (it.kind === 'timed' && it.sets > 1)) it.sets = Math.max(1, Math.round(it.sets * factor));
        if (it.kind === 'rounds') it.rounds = Math.max(2, it.rounds - roundsMinus);
        if (it.kind === 'interval') it.rounds = Math.max(1, it.rounds - 1);
      });
    });
  };
  if (deload && type !== 'mobility') reduce(0.6, 2);
  else if (adjusted === 'light') reduce(0.75, 1);

  const session = {
    id: iso, date: iso, type, focus, title, deload, adjusted, week: wIdx, blocks,
  };
  session.custom = !!custom;
  // Une séance personnalisée garde tous les exercices choisis (pas de découpe automatique)
  if (!custom) fitToTime(session, adjusted === 'recovery' ? Math.min(minutes, 30) : minutes);
  session.minutes = sessionMinutes(session);
  return session;
}

/**
 * Séance de muscu personnalisée dans l'éditeur : state.custom.sessions[focus].items = [{ exId, sets }].
 * Les reps et charges continuent de progresser automatiquement, et une variante au poids du corps
 * débloquée par la progression (ex. pompes -> pompes diamant) remplace l'exercice d'origine.
 */
export function customItems(focus, profile, progression, state) {
  const list = state.custom?.sessions?.[focus]?.items;
  if (!list?.length) return null;
  const items = [];
  list.forEach(({ exId, sets }, i) => {
    let ex = EX[exId];
    if (!ex) return;
    const slot = `${ex.pattern}:bw`;
    const upgraded = progression?.variants?.[slot];
    if (upgraded && !ex.weighted && EX[upgraded]) {
      // on suit la chaîne de progression à partir de l'exercice choisi
      let cur = ex; let guard = 0;
      while (cur?.harder && guard < 6) { cur = EX[cur.harder]; guard += 1; if (cur?.id === upgraded) { ex = cur; break; } }
    }
    const item = makeSets(ex, profile, progression, { main: i < 3, slot });
    if (sets) item.sets = Math.max(1, Math.min(10, sets));
    items.push(item);
  });
  return items.length ? items : null;
}

/** Les séances possibles pour l'éditeur de semaine. */
export const SESSION_OPTIONS = [
  { type: 'rest', focus: 'rest' },
  ...['fullA', 'fullB', 'fullC', 'upper', 'lower', 'push', 'pull', 'legs', 'fighter'].map((f) => ({ type: 'strength', focus: f })),
  ...['technique', 'bag', 'pads', 'shadow', 'conditioning'].map((f) => ({ type: 'muaythai', focus: f })),
  ...['hiit', 'rope', 'zone2'].map((f) => ({ type: 'cardio', focus: f })),
  { type: 'mobility', focus: 'recovery' },
].map((o) => ({ ...o, title: FOCUS_TITLE[o.focus] }));

/** Remplace la séance d'un jour de la semaine (0 = lundi). */
export function setDay(plan, day, focus) {
  const opt = SESSION_OPTIONS.find((o) => o.focus === focus) || SESSION_OPTIONS[0];
  const week = plan.week.map((d) => ({ ...d }));
  week[day] = { type: opt.type, focus: opt.focus, title: opt.title };
  const counters = {};
  week.forEach((d) => { if (d.type !== 'rest') { counters[d.focus] = (counters[d.focus] || 0) + 1; d.variant = counters[d.focus] - 1; } });
  return { ...plan, week, custom: true };
}

// Si la séance déborde du temps disponible : moins de séries, repos plus courts, puis moins d'exercices.
function fitToTime(session, minutes) {
  const limit = minutes * 1.12;
  const main = session.blocks.filter((b) => b.name !== 'Échauffement' && b.name !== 'Retour au calme');
  const over = () => sessionMinutes(session) > limit;
  for (let guard = 0; guard < 40 && over(); guard += 1) {
    const items = main.flatMap((b) => b.items);
    const bigSets = items.filter((i) => (i.kind === 'sets' || (i.kind === 'timed' && i.sets > 1)) && i.sets > 2).sort((a, b) => b.sets - a.sets);
    if (bigSets.length) { bigSets[0].sets -= 1; continue; }
    const longRest = items.filter((i) => i.kind === 'sets' && i.rest > 60);
    if (longRest.length) { longRest.forEach((i) => { i.rest = Math.max(60, i.rest - 30); }); continue; }
    const rounds = items.filter((i) => (i.kind === 'rounds' && i.rounds > 2) || (i.kind === 'interval' && i.rounds > 1));
    if (rounds.length) { rounds.forEach((i) => { i.rounds -= 1; }); continue; }
    const cd = session.blocks.find((b) => b.name === 'Retour au calme');
    if (cd && cd.items.length > 2) { cd.items.pop(); continue; }
    const wu = session.blocks.find((b) => b.name === 'Échauffement');
    if (wu && wu.items.length > 2) { wu.items.pop(); continue; }
    const biggest = main.find((b) => b.items.length > 2);
    if (biggest) { biggest.items.pop(); continue; }
    break;
  }
}

// Routines bien-être prêtes à l'emploi (lancées depuis l'onglet Bien-être)
export const ROUTINES = {
  morning: { title: 'Réveil en douceur', emoji: '🌅', items: ['cat_cow', 'world_greatest', 'thoracic_rot', 'hip_circles', 'arm_circles', 'quad_stretch'] },
  hips: { title: 'Hanches de Nak Muay', emoji: '🥊', items: ['leg_swings', 'hip_9090', 'pigeon', 'butterfly', 'hip_flexor_stretch', 'world_greatest', 'hamstring_stretch'] },
  back: { title: 'Dos libéré', emoji: '🧍', items: ['cat_cow', 'child_pose', 'thoracic_rot', 'bird_dog', 'cobra', 'hamstring_stretch'] },
  evening: { title: 'Avant de dormir', emoji: '🌙', items: ['child_pose', 'butterfly', 'pigeon', 'hamstring_stretch', 'thoracic_rot'] },
};

export function routineSession(key, profile) {
  const rt = ROUTINES[key];
  if (!rt) return null;
  const items = rt.items.filter((id) => allowed(id, profile)).map((id) => {
    const ex = EX[id];
    return timed(id, ex.pattern === 'warmup' ? ex.secs : 45, ex.id === 'bird_dog' ? { secs: 45 } : {});
  });
  const session = { id: `routine-${key}`, date: null, type: 'mobility', focus: 'recovery', title: rt.title, blocks: [{ name: 'Routine', items }] };
  session.minutes = sessionMinutes(session);
  return session;
}
