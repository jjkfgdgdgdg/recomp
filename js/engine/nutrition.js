// Calculs nutritionnels basés sur des formules reconnues (aucune IA).

export const ACTIVITY = [
  { id: 'sedentary', label: 'Sédentaire (bureau, peu de marche)', factor: 1.2 },
  { id: 'light', label: 'Un peu actif (marche régulière)', factor: 1.3 },
  { id: 'moderate', label: 'Actif (debout une bonne partie de la journée)', factor: 1.4 },
  { id: 'active', label: 'Très actif (travail physique)', factor: 1.55 },
];

// Dépense moyenne des séances (MET approximatifs).
const SESSION_MET = { strength: 5, muaythai: 8, cardio: 8, mobility: 2.5 };

export function bmi(weight, heightCm) {
  const h = heightCm / 100;
  return weight / (h * h);
}

// Mifflin-St Jeor
export function bmr({ sex, weight, height, age }) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(sex === 'female' ? base - 161 : base + 5);
}

// Estimation du % de masse grasse (méthode US Navy). Retourne null si mesures manquantes.
export function bodyFatNavy({ sex, height, waist, neck, hip }) {
  if (!waist || !neck || !height) return null;
  let bf;
  if (sex === 'female') {
    if (!hip || waist + hip - neck <= 0) return null;
    bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.221 * Math.log10(height)) - 450;
  } else {
    if (waist - neck <= 0) return null;
    bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
  }
  if (!Number.isFinite(bf)) return null;
  return Math.round(Math.max(3, Math.min(60, bf)) * 10) / 10;
}

export function weeklyTrainingKcal(weight, week, minutesPerSession) {
  if (!week) return 0;
  return week.reduce((sum, d) => {
    if (!d || d.type === 'rest') return sum;
    const met = SESSION_MET[d.type] ?? 5;
    return sum + met * weight * (minutesPerSession / 60);
  }, 0);
}

export function goalMode(profile) {
  const p = profile.primaryGoal;
  if (p === 'fatloss') return 'cut';
  if (p === 'muscle' || p === 'strength') {
    // Si beaucoup de gras à perdre, on privilégie une recomposition plutôt qu'un surplus.
    const b = bmi(profile.weight, profile.height);
    if (b >= 28) return 'recomp';
    return 'bulk';
  }
  return 'maintain';
}

export function nutritionTargets(profile, week) {
  const base = bmr(profile);
  const act = ACTIVITY.find((a) => a.id === profile.activity) || ACTIVITY[1];
  const train = weeklyTrainingKcal(profile.weight, week, profile.sessionMinutes || 45) / 7;
  const tdee = Math.round(base * act.factor + train);
  const mode = goalMode(profile);
  let kcal = tdee;
  let note = '';
  if (mode === 'bulk') {
    const add = Math.min(350, Math.round(tdee * 0.1));
    kcal = tdee + add;
    note = `Léger surplus (+${add} kcal) pour construire du muscle en limitant le gras.`;
  } else if (mode === 'cut') {
    const cut = Math.min(600, Math.round(tdee * 0.2));
    kcal = Math.max(Math.round(base * 1.05), tdee - cut);
    note = `Déficit modéré (−${tdee - kcal} kcal) pour perdre du gras sans perdre de muscle.`;
  } else if (mode === 'recomp') {
    kcal = Math.round(tdee * 0.92);
    note = 'Recomposition : léger déficit + protéines élevées pour perdre du gras et gagner du muscle.';
  } else {
    note = 'Maintien : énergie stable pour performer à l’entraînement.';
  }
  if (profile.age < 18) {
    kcal = Math.max(kcal, tdee);
    note = 'Moins de 18 ans : pas de déficit calorique, mange à ta faim et privilégie la qualité.';
  }
  // Protéines : sur le poids, ou sur un poids « ajusté » si IMC élevé.
  const b = bmi(profile.weight, profile.height);
  const refWeight = b > 30 ? 25 * (profile.height / 100) ** 2 : profile.weight;
  const perKg = mode === 'cut' || mode === 'recomp' ? 2.2 : mode === 'bulk' ? 2.0 : 1.8;
  const protein = Math.round(refWeight * perKg);
  let fat = Math.round(profile.weight * 0.9);
  fat = Math.max(fat, Math.round((kcal * 0.22) / 9));
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const trainingDays = week ? week.filter((d) => d && d.type !== 'rest').length : 3;
  const waterBase = profile.weight * 0.035;
  const water = Math.round((waterBase + 0.5 * (trainingDays / 7)) * 10) / 10;
  const waterTraining = Math.round((waterBase + 0.6) * 10) / 10;
  return {
    bmr: base, tdee, kcal, protein, fat, carbs, mode, note,
    water, waterTraining, waterMl: Math.round(waterBase * 1000),
    fiber: Math.round((kcal / 1000) * 14),
    bmi: Math.round(b * 10) / 10,
  };
}

export function bmiLabel(b) {
  if (b < 18.5) return 'Maigreur';
  if (b < 25) return 'Normal';
  if (b < 30) return 'Surpoids';
  return 'Obésité';
}

// Estimation du temps pour atteindre le poids visé (taux réalistes).
export function goalEta(profile) {
  if (!profile.targetWeight || profile.targetWeight === profile.weight) return null;
  const diff = profile.targetWeight - profile.weight;
  const ratePerWeek = diff < 0 ? Math.max(0.3, profile.weight * 0.006) : 0.25; // kg / semaine
  const weeks = Math.ceil(Math.abs(diff) / ratePerWeek);
  return { diff: Math.round(diff * 10) / 10, weeks, ratePerWeek: Math.round(ratePerWeek * 100) / 100 };
}
