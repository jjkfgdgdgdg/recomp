// Combats de boss : plus l'exercice est bien fait (validé par la caméra), plus tu infliges de dégâts.
import { testValue } from '../engine/progression.js';

export const RANK_MULT = { E: 0.8, D: 1, C: 1.25, B: 1.5, A: 1.8, S: 2.2 };
export const BASE_DMG = 10;

// Boss originaux. phases : un exercice par phase (tracker caméra).
export const BOSSES = [
  {
    id: 'slime', name: 'Slime de la Flemme', rank: 'E', minLevel: 1, shape: 'slime', color: '#6ee7a0', color2: '#22a36a',
    lore: 'Une flaque gluante qui grossit à chaque « je commencerai lundi ». Il colle au canapé et à ta motivation.',
    phases: [
      { tracker: 'squat', move: 'Squats', attack: 'Chaque squat propre l’écrase un peu plus.' },
      { tracker: 'pushup', move: 'Pompes', attack: 'Achève-le à coups de pompes.' },
    ],
    attack: { every: 16, window: 6, need: 2, name: 'Jet de glu' },
  },
  {
    id: 'golem', name: 'Golem de Fonte', rank: 'D', minLevel: 4, shape: 'golem', color: '#94a3b8', color2: '#475569',
    lore: 'Un tas de vieilles haltères rouillées qui a pris vie. Lent, mais il frappe fort.',
    phases: [
      { tracker: 'pushup', move: 'Pompes', attack: 'Fissure sa carapace avec des pompes complètes.' },
      { tracker: 'squat', move: 'Squats', attack: 'Squats profonds pour l’ébranler.' },
      { tracker: 'plank', move: 'Gainage', attack: 'Tiens le gainage : ton bouclier qui le use.' },
    ],
    attack: { every: 14, window: 6, need: 2, name: 'Poing de fonte' },
  },
  {
    id: 'ogre', name: 'Ogre du Ring', rank: 'C', minLevel: 8, shape: 'ogre', color: '#f59e0b', color2: '#b45309', mt: true,
    lore: 'Il a des gants de boxe plus gros que ta tête. Il punit chaque garde baissée.',
    phases: [
      { tracker: 'guard', move: 'Shadow boxing', attack: 'Frappe, frappe, mais garde les mains au visage !' },
      { tracker: 'kicks', move: 'Coups de pied', attack: 'Kicks à hauteur de hanche pour le faire tomber.' },
      { tracker: 'knees', move: 'Coups de genou', attack: 'Genoux puissants pour finir le combat.' },
    ],
    attack: { every: 13, window: 5, need: 2, name: 'Uppercut d’ogre' },
  },
  {
    id: 'hydra', name: 'Hydre du Canapé', rank: 'C', minLevel: 12, shape: 'hydra', color: '#a78bfa', color2: '#6d28d9',
    lore: 'Trois têtes : Netflix, Scroll et Grignotage. Coupe-en une, il en reste deux.',
    phases: [
      { tracker: 'squat', move: 'Squats', attack: 'Première tête : squats !' },
      { tracker: 'lunge', move: 'Fentes', attack: 'Deuxième tête : fentes !' },
      { tracker: 'jacks', move: 'Jumping jacks', attack: 'Dernière tête : jumping jacks à fond !' },
    ],
    attack: { every: 12, window: 5, need: 3, name: 'Morsure triple' },
  },
  {
    id: 'specter', name: 'Spectre du Doute', rank: 'B', minLevel: 20, shape: 'specter', color: '#7dd3fc', color2: '#0369a1',
    lore: 'Il murmure « t’y arriveras jamais ». Il n’a de prise que sur ceux qui s’arrêtent.',
    phases: [
      { tracker: 'burpee', move: 'Burpees', attack: 'Burpees : montre-lui que tu ne t’arrêtes pas.' },
      { tracker: 'plank', move: 'Gainage', attack: 'Gainage : résiste à ses murmures.' },
      { tracker: 'pushup', move: 'Pompes', attack: 'Pompes pour le dissiper.' },
    ],
    attack: { every: 11, window: 5, need: 3, name: 'Murmure glacé' },
  },
  {
    id: 'titan', name: 'Titan d’Acier', rank: 'A', minLevel: 35, shape: 'titan', color: '#e2e8f0', color2: '#64748b',
    lore: 'Forgé dans les salles de muscu oubliées. Il ne respecte que la constance.',
    phases: [
      { tracker: 'pushup', move: 'Pompes', attack: 'Pompes parfaites ou rien.' },
      { tracker: 'squat', move: 'Squats', attack: 'Squats lourds de volonté.' },
      { tracker: 'burpee', move: 'Burpees', attack: 'Burpees pour briser son armure.' },
      { tracker: 'plank', move: 'Gainage', attack: 'Gainage jusqu’au bout.' },
    ],
    attack: { every: 10, window: 5, need: 3, name: 'Marteau-pilon' },
  },
  {
    id: 'dragon', name: 'Dragon des Excuses', rank: 'S', minLevel: 50, shape: 'dragon', color: '#f87171', color2: '#991b1b',
    lore: 'Le boss final. Il crache « pas le temps », « trop fatigué », « demain ». Il ne craint qu’une chose : l’action.',
    phases: [
      { tracker: 'burpee', move: 'Burpees', attack: 'Burpees : traverse ses flammes.' },
      { tracker: 'pushup', move: 'Pompes', attack: 'Pompes : brise ses écailles.' },
      { tracker: 'squat', move: 'Squats', attack: 'Squats : fais trembler la terre.' },
      { tracker: 'kicks', move: 'Coups de pied', attack: 'Kicks dans ses ailes !' },
      { tracker: 'plank', move: 'Gainage', attack: 'Gainage final : il ne reste que toi.' },
    ],
    attack: { every: 9, window: 5, need: 4, name: 'Souffle d’excuses' },
  },
];

export const BOSS = Object.fromEntries(BOSSES.map((b) => [b.id, b]));

export const MODE = {
  pushup: 'reps', squat: 'reps', lunge: 'reps', jacks: 'reps', burpee: 'reps', kicks: 'reps', knees: 'reps', plank: 'hold', guard: 'guard',
};

/** Objectif « équivalent » d'une phase, adapté au joueur. */
export function phaseTarget(phase, profile, level, rank) {
  const m = RANK_MULT[rank] * (1 + Math.min(0.6, level * 0.01));
  const t = phase.tracker;
  if (t === 'pushup') return { reps: Math.max(6, Math.round(Math.max(6, testValue(profile, 'push') * 0.8) * m)) };
  if (t === 'squat') return { reps: Math.max(10, Math.round(Math.max(12, testValue(profile, 'squat') * 0.6) * m)) };
  if (t === 'lunge') return { reps: Math.round(16 * m) };
  if (t === 'jacks') return { reps: Math.round(30 * m) };
  if (t === 'burpee') return { reps: Math.round(8 * m) };
  if (t === 'kicks' || t === 'knees') return { reps: Math.round(20 * m) };
  if (t === 'plank') return { secs: Math.max(20, Math.round(Math.max(20, testValue(profile, 'plank') * 0.6) * m)) };
  if (t === 'guard') return { hits: Math.round(40 * m) };
  return { reps: Math.round(15 * m) };
}

export function phaseHp(phase, profile, level, rank) {
  const t = phaseTarget(phase, profile, level, rank);
  if (t.secs) return Math.round(t.secs * BASE_DMG * 0.5);
  if (t.hits) return Math.round(t.hits * 7);
  return Math.round(t.reps * BASE_DMG);
}

export function bossHp(boss, profile, level) {
  return boss.phases.map((ph) => phaseHp(ph, profile, level, boss.rank));
}

export function comboMult(combo) {
  return 1 + Math.min(1, combo / 20);
}

/**
 * Dégâts d'une répétition.
 * - rep valide : 10 × qualité × combo × force ; critique possible sur une rep parfaite
 * - rep ratée (amplitude/posture) : 2 dégâts et le combo retombe à 0
 */
export function repDamage({ valid, score = 100, combo = 0, str = 1, tec = 1, random = Math.random, manual = false }) {
  if (!valid) return { dmg: 2, crit: false, miss: true };
  const quality = Math.max(0.5, Math.min(1, score / 100));
  let dmg = BASE_DMG * quality * comboMult(combo) * (1 + (str - 1) * 0.02);
  if (manual) dmg *= 0.6;
  const critChance = manual ? 0 : (score >= 100 ? 0.15 : 0.05) + (tec - 1) * 0.01;
  const crit = random() < critChance;
  if (crit) dmg *= 2;
  return { dmg: Math.round(dmg), crit, miss: false };
}

export function holdDamage(dt, good, str = 1) {
  return good ? BASE_DMG * 0.5 * dt * (1 + (str - 1) * 0.02) : 0;
}

export function hitDamage(what, combo = 0, agi = 1) {
  const base = what === 'kick' ? 15 : 6;
  return Math.round(base * comboMult(combo) * (1 + (agi - 1) * 0.02));
}

export function playerMaxHp(end = 1) {
  return 100 + (end - 1) * 6;
}

export function bossAttackDamage(boss) {
  return Math.round(12 * RANK_MULT[boss.rank]);
}

export function grade({ won, accuracy, hpLeftPct }) {
  if (!won) return 'F';
  const s = accuracy * 0.7 + hpLeftPct * 0.3;
  if (s >= 0.9) return 'S';
  if (s >= 0.75) return 'A';
  if (s >= 0.55) return 'B';
  return 'C';
}

export function bossXp(boss, won, g) {
  const base = { E: 150, D: 250, C: 400, B: 600, A: 900, S: 1400 }[boss.rank];
  if (!won) return Math.round(base * 0.2);
  const mult = { S: 1.5, A: 1.25, B: 1.1, C: 1, F: 0 }[g] ?? 1;
  return Math.round(base * mult);
}

export function bossUnlocked(boss, level) {
  return level >= boss.minLevel;
}
