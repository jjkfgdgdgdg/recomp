// Score de forme quotidien (0-100) calculé à partir du check-in. Règles simples et transparentes.

/**
 * checkin = { sleep: heures, energy: 1-5, soreness: 1-5 (5 = très courbaturé), stress: 1-5, pain: bool }
 */
export function readinessScore(c) {
  if (!c) return null;
  const sleep = clamp(((Number(c.sleep) || 7) - 4) / 4, 0, 1) * 30;
  const energy = ((clamp(Number(c.energy) || 3, 1, 5) - 1) / 4) * 30;
  const soreness = ((5 - clamp(Number(c.soreness) || 2, 1, 5)) / 4) * 20;
  const stress = ((5 - clamp(Number(c.stress) || 2, 1, 5)) / 4) * 20;
  let score = sleep + energy + soreness + stress;
  if (c.pain) score -= 25;
  return Math.round(clamp(score, 0, 100));
}

export function readinessAdvice(score) {
  if (score === null || score === undefined) return null;
  if (score >= 80) return { level: 'top', label: 'En pleine forme', text: 'Feu vert : séance complète, vise un record aujourd’hui !' };
  if (score >= 65) return { level: 'good', label: 'Bonne forme', text: 'Séance normale. Écoute ton corps.' };
  if (score >= 40) return { level: 'mid', label: 'Forme moyenne', text: 'Séance allégée automatiquement (moins de séries). La régularité compte plus que l’intensité.' };
  return { level: 'low', label: 'Fatigue élevée', text: 'Récupération active à la place : mobilité, respiration, sommeil. Tu reviendras plus fort demain.' };
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
