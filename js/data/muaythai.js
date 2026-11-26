// Combinaisons de Muay Thai annoncées par le coach vocal, classées par niveau (1 à 3).
// Vocabulaire : jab (direct bras avant), cross (direct bras arrière), crochet, uppercut,
// teep (coup de pied avant), low / middle / high kick (coups de pied circulaires), genou, coude.

export const COMBOS = {
  1: [
    'Jab', 'Jab, cross', 'Jab, jab, cross', 'Jab, cross, crochet', 'Teep', 'Jab, teep',
    'Middle kick', 'Jab, cross, low kick', 'Genou', 'Jab, cross, genou', 'Cross, crochet',
    'Check', 'Recule, pivote', 'Teep avant, teep arrière',
  ],
  2: [
    'Jab, cross, crochet, low kick', 'Teep, jab, cross', 'Cross, crochet, middle kick',
    'Jab, uppercut, crochet', 'Jab, cross, high kick', 'Check, middle kick', 'Crochet, cross, genou',
    'Jab, cross, esquive, cross', 'Double jab, middle kick', 'Low kick, cross', 'Teep, middle kick',
    'Jab, coude arrière', 'Parade, cross, crochet', 'Genou, genou, coude',
  ],
  3: [
    'Jab, cross, crochet, cross, low kick', 'Feinte teep, high kick', 'Coude, coude, genou',
    'Switch kick', 'Jab, cross, esquive, crochet, middle kick', 'Superman punch, cross',
    'Teep, cross, crochet, high kick', 'Check, cross, crochet, low kick', 'Jab, crochet, uppercut, coude',
    'Low kick, crochet, cross, high kick', 'Esquive, uppercut, crochet, genou', 'Middle, middle, high kick',
    'Coude descendant, genou', 'Pas de côté, middle kick',
  ],
};

export const ENCOURAGEMENTS = [
  'Garde haute !', 'Respire !', 'Bouge tes pieds !', 'Reviens en garde après chaque coup !',
  'Expire en frappant !', 'Plus de hanches dans les kicks !', 'Reste relâché !', 'Menton rentré !',
];

export function roundConfig(mtLevel) {
  // mtLevel : 0 jamais, 1 débutant, 2 intermédiaire, 3 avancé
  if (mtLevel >= 3) return { round: 180, rest: 60, comboEvery: [3, 6] };
  if (mtLevel === 2) return { round: 180, rest: 60, comboEvery: [4, 7] };
  if (mtLevel === 1) return { round: 150, rest: 60, comboEvery: [5, 8] };
  return { round: 120, rest: 60, comboEvery: [6, 9] };
}

export function combosForLevel(mtLevel) {
  const lv = Math.max(1, Math.min(3, mtLevel || 1));
  const list = [...COMBOS[1]];
  if (lv >= 2) list.push(...COMBOS[2]);
  if (lv >= 3) list.push(...COMBOS[3]);
  return list;
}

export const MT_TIPS = [
  'Bande tes mains avant le sac : poignets et articulations des doigts protégés.',
  'Le low kick se donne avec le tibia, pas avec le pied.',
  'Après chaque combinaison, reviens en garde ou sors en pivot.',
  'La puissance vient de la rotation des hanches et du pivot du pied d’appui.',
  'En shadow, imagine un adversaire : il riposte, donc défends-toi aussi.',
];
