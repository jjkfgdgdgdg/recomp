// Fonctions métier partagées par les écrans.
import { getState, update } from './store.js';
import { buildWeek, generateSession, routineSession } from './engine/planner.js';
import { nutritionTargets } from './engine/nutrition.js';
import { readinessScore } from './engine/readiness.js';
import { todayISO, addDays, weekday, formatDuration } from './engine/dates.js';
import { EX } from './data/exercises.js';

export function regeneratePlan(state) {
  const { week, reasons } = buildWeek(state.profile);
  state.plan = { week, reasons, generatedAt: todayISO() };
}

export function ensurePlan() {
  const s = getState();
  if (s.profile && !s.plan) update((st) => regeneratePlan(st));
  return getState().plan;
}

export function checkinFor(iso) {
  return getState().logs.checkins[iso] || null;
}

export function saveCheckin(iso, data) {
  const score = readinessScore(data);
  update((s) => { s.logs.checkins[iso] = { ...data, score }; });
  return score;
}

export function sessionFor(iso, { force = false } = {}) {
  const s = getState();
  ensurePlan();
  const ck = s.logs.checkins[iso];
  const override = s.overrides?.[iso];
  return generateSession(s.profile, s, iso, { readiness: ck?.score, force: force || override === 'force' });
}

export function sessionById(id) {
  if (id.startsWith('routine-')) return routineSession(id.slice(8), getState().profile);
  return sessionFor(id);
}

export function sessionLogFor(iso) {
  return getState().logs.sessions.find((x) => x.date === iso && !x.routine) || null;
}

export function plannedType(iso) {
  const plan = getState().plan;
  return plan ? plan.week[weekday(iso)].type : 'rest';
}

export function streak(today = todayISO()) {
  const s = getState();
  const active = new Set(s.logs.sessions.map((x) => x.date));
  let n = 0;
  let d = today;
  if (!active.has(d)) d = addDays(d, -1);
  for (let i = 0; i < 400; i += 1) {
    if (active.has(d)) n += 1;
    else if (plannedType(d) !== 'rest') break;
    d = addDays(d, -1);
    if (s.profile?.planStart && d < s.profile.planStart) break;
  }
  return n;
}

export function nutrition() {
  const s = getState();
  return nutritionTargets(currentProfile(), s.plan?.week);
}

// Profil avec le dernier poids enregistré
export function currentProfile() {
  const s = getState();
  const w = latestWeight();
  return w ? { ...s.profile, weight: w.weight } : s.profile;
}

export function latestWeight() {
  const ws = getState().logs.weights;
  return ws.length ? ws[ws.length - 1] : null;
}

export function prescription(item) {
  const ex = EX[item.exId];
  if (item.kind === 'sets') {
    const reps = item.reps ? (item.reps[0] === item.reps[1] ? `${item.reps[0]}` : `${item.reps[0]}-${item.reps[1]}`) : '?';
    const side = item.unilateral ? ' /côté' : '';
    const w = item.weighted ? (item.weight ? ` · ${item.weight} kg` : ' · charge à choisir') : '';
    return `${item.sets} × ${reps} reps${side}${w}`;
  }
  if (item.kind === 'timed') {
    const t = item.secs >= 120 ? formatDuration(item.secs).replace(':00', ' min') : `${item.secs} s`;
    const side = item.unilateral || ex?.unilateral ? ' /côté' : '';
    return item.sets > 1 ? `${item.sets} × ${t}${side}` : `${t}${side}`;
  }
  if (item.kind === 'rounds') return `${item.rounds} rounds × ${formatDuration(item.work)} · repos ${item.restSec} s`;
  if (item.kind === 'interval') return `${item.rounds} tour${item.rounds > 1 ? 's' : ''} · ${item.work} s effort / ${item.restSec} s récup`;
  return '';
}

export function itemTitle(item) {
  if (item.kind === 'interval') return item.title || 'Circuit';
  return EX[item.exId]?.name || item.exId;
}

export function weekDoneCount(iso = todayISO()) {
  const s = getState();
  const monday = addDays(iso, -weekday(iso));
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  return {
    days,
    done: days.map((d) => s.logs.sessions.some((x) => x.date === d)),
    planned: days.map((d) => plannedType(d)),
  };
}

export function waterFor(iso) {
  return getState().logs.water[iso] || 0;
}

export function addWater(iso, ml) {
  update((s) => { s.logs.water[iso] = Math.max(0, (s.logs.water[iso] || 0) + ml); });
}
