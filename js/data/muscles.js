// Groupes musculaires et calcul du volume hebdomadaire (séries par muscle).
import { EX } from './exercises.js';
import { daysBetween } from '../engine/dates.js';

export const GROUPS = [
  { id: 'chest', label: 'Pectoraux' },
  { id: 'shoulders', label: 'Épaules' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'forearms', label: 'Avant-bras' },
  { id: 'back', label: 'Dos' },
  { id: 'abs', label: 'Abdos' },
  { id: 'obliques', label: 'Obliques' },
  { id: 'lowerback', label: 'Lombaires' },
  { id: 'glutes', label: 'Fessiers' },
  { id: 'quads', label: 'Quadriceps' },
  { id: 'hamstrings', label: 'Ischios' },
  { id: 'calves', label: 'Mollets' },
];

const LABEL_TO_GROUP = {
  Pectoraux: 'chest', 'Haut des pectoraux': 'chest',
  Épaules: 'shoulders', 'Arrière d’épaules': 'shoulders',
  Triceps: 'triceps', Biceps: 'biceps', 'Avant-bras': 'forearms',
  Dos: 'back', 'Haut du dos': 'back',
  Abdos: 'abs', 'Abdos profonds': 'abs', Obliques: 'obliques',
  Lombaires: 'lowerback', 'Bas du dos': 'lowerback',
  Fessiers: 'glutes', Quadriceps: 'quads', Ischios: 'hamstrings', Mollets: 'calves', Jambes: 'quads',
};

/** Groupes travaillés par un exercice : le premier muscle compte pour 1 série, les suivants pour 0,5. */
export function exerciseGroups(exId) {
  const ex = EX[exId];
  if (!ex) return [];
  const out = [];
  ex.muscles.forEach((m, i) => {
    const g = LABEL_TO_GROUP[m];
    if (g && !out.some((o) => o.group === g)) out.push({ group: g, weight: i === 0 ? 1 : 0.5 });
  });
  return out;
}

/** Séries par groupe musculaire sur les 7 derniers jours. */
export function weeklyVolume(state, today) {
  const vol = Object.fromEntries(GROUPS.map((g) => [g.id, 0]));
  const add = (exId, sets) => exerciseGroups(exId).forEach(({ group, weight }) => { vol[group] += sets * weight; });
  (state.logs.sessions || []).filter((s) => daysBetween(s.date, today) < 7 && daysBetween(s.date, today) >= 0).forEach((s) => {
    (s.exercises || []).forEach((e) => {
      const ex = EX[e.exId];
      if (!ex || ['mobility', 'warmup', 'breath', 'endurance', 'cardio'].includes(ex.pattern)) return;
      add(e.exId, (e.sets || []).length);
    });
  });
  const TRACK_EX = { pushup: 'pushup', knee_pushup: 'knee_pushup', squat: 'squat', lunge: 'reverse_lunge', bridge: 'glute_bridge', curl: 'db_curl', press: 'db_shoulder_press', plank: 'plank', jump_squat: 'jump_squat', burpee: 'burpees' };
  (state.logs.coach || []).filter((c) => daysBetween(c.date, today) < 7 && daysBetween(c.date, today) >= 0).forEach((c) => {
    if (TRACK_EX[c.trackerId] && ((c.reps || 0) >= 5 || (c.holdSec || 0) >= 20)) add(TRACK_EX[c.trackerId], 1);
  });
  Object.keys(vol).forEach((k) => { vol[k] = Math.round(vol[k] * 10) / 10; });
  return vol;
}

export function volumeLevel(sets) {
  if (sets < 4) return { id: 'none', label: 'Peu travaillé' };
  if (sets < 10) return { id: 'low', label: 'Entretien' };
  if (sets <= 20) return { id: 'good', label: 'Zone de croissance' };
  return { id: 'high', label: 'Beaucoup (attention récup)' };
}
