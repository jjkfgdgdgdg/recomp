// Idées de repas simples, classées par moment et compatibles avec des régimes.
// tags : régimes compatibles. 'all' = omnivore uniquement (contient de la viande/poisson).
// Régimes : omni, vege (végétarien), vegan, halal, nopork, nolactose

const M = (name, tags, protein, extra = '') => ({ name, tags, protein, extra });
// tags : liste de régimes compatibles

const ALL = ['omni', 'vege', 'vegan', 'halal', 'nopork', 'nolactose'];
const MEAT_HALAL = ['omni', 'halal', 'nopork', 'nolactose'];

export const MEALS = {
  breakfast: [
    M('Flocons d’avoine + lait + banane + beurre de cacahuète', ['omni', 'vege', 'halal', 'nopork'], 20),
    M('Flocons d’avoine + boisson soja + fruits rouges + graines', ALL, 18),
    M('Omelette 3 œufs + pain complet + fruit', ['omni', 'vege', 'halal', 'nopork', 'nolactose'], 24),
    M('Skyr / fromage blanc + muesli + miel', ['omni', 'vege', 'halal', 'nopork'], 25),
    M('Tartines pain complet + houmous + tofu brouillé', ALL, 22),
    M('Pancakes avoine-banane-œufs', ['omni', 'vege', 'halal', 'nopork', 'nolactose'], 20),
  ],
  lunch: [
    M('Poulet + riz + légumes verts + huile d’olive', MEAT_HALAL, 40),
    M('Saumon + pommes de terre + haricots verts', ['omni', 'halal', 'nopork', 'nolactose'], 35),
    M('Bœuf haché 5 % + pâtes complètes + sauce tomate', MEAT_HALAL, 38),
    M('Chili sin carne (haricots rouges, lentilles) + riz', ALL, 28),
    M('Dahl de lentilles corail + riz basmati', ALL, 24),
    M('Bowl quinoa + tofu mariné + avocat + légumes', ALL, 28),
    M('Omelette + patate douce + salade', ['omni', 'vege', 'halal', 'nopork', 'nolactose'], 26),
    M('Thon + riz + maïs + crudités', ['omni', 'halal', 'nopork', 'nolactose'], 35),
  ],
  snack: [
    M('Fruit + poignée d’amandes', ALL, 6),
    M('Skyr + fruit', ['omni', 'vege', 'halal', 'nopork'], 18),
    M('Pain complet + beurre de cacahuète', ALL, 10),
    M('Œufs durs (2) + fruit', ['omni', 'vege', 'halal', 'nopork', 'nolactose'], 13),
    M('Edamame ou pois chiches grillés', ALL, 12),
    M('Banane + lait (ou boisson soja) avant la séance', ALL, 9),
  ],
  dinner: [
    M('Dinde / poulet + semoule + légumes rôtis', MEAT_HALAL, 38),
    M('Poisson blanc + riz + ratatouille', ['omni', 'halal', 'nopork', 'nolactose'], 32),
    M('Curry pois chiches + épinards + riz', ALL, 20),
    M('Pâtes complètes + lentilles + sauce tomate + parmesan', ['omni', 'vege', 'halal', 'nopork'], 26),
    M('Tofu sauté + nouilles + légumes', ALL, 26),
    M('Steak haché + purée maison + salade', MEAT_HALAL, 35),
    M('Œufs + patates + légumes en poêlée', ['omni', 'vege', 'halal', 'nopork', 'nolactose'], 24),
  ],
};

export const DIETS = [
  { id: 'omni', label: 'Je mange de tout' },
  { id: 'vege', label: 'Végétarien' },
  { id: 'vegan', label: 'Végan' },
  { id: 'halal', label: 'Halal' },
  { id: 'nopork', label: 'Sans porc' },
  { id: 'nolactose', label: 'Sans lactose' },
];

export function mealIdeas(diet, mealsPerDay, seed = 0) {
  const pick = (arr, i) => {
    const ok = arr.filter((m) => m.tags.includes(diet || 'omni'));
    const list = ok.length ? ok : arr;
    return list[(seed + i) % list.length];
  };
  const plan = [
    { slot: 'Petit-déjeuner', meal: pick(MEALS.breakfast, 0) },
    { slot: 'Déjeuner', meal: pick(MEALS.lunch, 1) },
    { slot: 'Dîner', meal: pick(MEALS.dinner, 2) },
  ];
  const n = Math.max(2, Math.min(6, mealsPerDay || 3));
  if (n === 2) plan.splice(0, 1);
  for (let i = 3; i < n; i += 1) plan.splice(i === 3 ? 2 : plan.length, 0, { slot: 'Collation', meal: pick(MEALS.snack, i + seed) });
  return plan;
}
