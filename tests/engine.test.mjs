// Tests du moteur de programme, de nutrition et de progression.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWeek, generateSession, routineSession, ROUTINES } from '../js/engine/planner.js';
import { bmr, nutritionTargets, bodyFatNavy } from '../js/engine/nutrition.js';
import { applyResult, defaultTarget, emptyProgression } from '../js/engine/progression.js';
import { readinessScore } from '../js/engine/readiness.js';
import { EX, EXERCISES, EQUIPMENT, INJURIES } from '../js/data/exercises.js';
import { mealIdeas } from '../js/data/meals.js';
import { rng } from '../js/engine/random.js';
import { addDays } from '../js/engine/dates.js';

const base = {
  name: 'Test', sex: 'male', age: 22, height: 178, weight: 70, goals: ['muscle', 'muaythai'], primaryGoal: 'muscle',
  liftLevel: 1, mtLevel: 1, tests: { push: 18, squat: 40, pull: 2, plank: 60 }, days: [0, 1, 3, 4], sessionMinutes: 45,
  equipment: [], injuries: [], activity: 'light', diet: 'omni', meals: 3, createdAt: 'x', planStart: '2026-11-23',
};

const allItems = (s) => s.blocks.flatMap((b) => b.items);
const allExIds = (s) => allItems(s).flatMap((i) => (i.exercises ? i.exercises : [i.exId]));

function stateFor(profile) {
  return { plan: buildWeek(profile), progression: emptyProgression() };
}

test('métabolisme de base (Mifflin-St Jeor)', () => {
  assert.equal(bmr({ sex: 'male', weight: 70, height: 178, age: 22 }), 1708);
  assert.equal(bmr({ sex: 'female', weight: 60, height: 165, age: 30 }), 1320);
});

test('nutrition : surplus pour la prise de muscle, déficit pour la perte de gras', () => {
  const week = buildWeek(base).week;
  const bulk = nutritionTargets(base, week);
  assert.ok(bulk.kcal > bulk.tdee);
  assert.ok(bulk.protein >= 70 * 1.8);
  const cut = nutritionTargets({ ...base, primaryGoal: 'fatloss', goals: ['fatloss'] }, week);
  assert.ok(cut.kcal < cut.tdee);
  assert.ok(cut.kcal >= cut.bmr, 'jamais sous le métabolisme de base');
  const teen = nutritionTargets({ ...base, age: 15, primaryGoal: 'fatloss', goals: ['fatloss'] }, week);
  assert.ok(teen.kcal >= teen.tdee, 'pas de déficit pour un mineur');
});

test('masse grasse US Navy plausible', () => {
  const bf = bodyFatNavy({ sex: 'male', height: 178, waist: 80, neck: 38 });
  assert.ok(bf > 8 && bf < 20, `bf=${bf}`);
  assert.equal(bodyFatNavy({ sex: 'male', height: 178 }), null);
});

test('semaine : muscu + Muay Thai alternés sur les jours choisis', () => {
  const { week } = buildWeek({ ...base, days: [0, 1, 2, 4, 5] });
  const types = week.map((d) => d.type);
  [0, 1, 2, 4, 5].forEach((d) => assert.notEqual(types[d], 'rest'));
  [3, 6].forEach((d) => assert.equal(types[d], 'rest'));
  assert.ok(types.includes('strength'));
  assert.ok(types.includes('muaythai'));
});

test('semaine : 7 jours => au moins une séance de récupération', () => {
  const { week } = buildWeek({ ...base, days: [0, 1, 2, 3, 4, 5, 6] });
  assert.ok(week.some((d) => d.type === 'mobility'));
});

test('blessure aux poignets : aucune pompe ni exercice à risque', () => {
  const p = { ...base, injuries: ['wrist'] };
  const st = stateFor(p);
  for (let i = 0; i < 7; i += 1) {
    const s = generateSession(p, st, addDays('2026-11-23', i));
    allExIds(s).forEach((id) => assert.ok(!EX[id].avoid.includes('wrist'), `${id} interdit`));
  }
});

test('sans matériel : aucun exercice qui en demande', () => {
  const st = stateFor(base);
  for (let i = 0; i < 14; i += 1) {
    const s = generateSession(base, st, addDays('2026-11-23', i));
    allExIds(s).forEach((id) => assert.ok(EX[id].equip.includes('none'), `${id} demande du matériel`));
  }
});

test('avec haltères et objectif muscle : exercices chargés avec charge conseillée', () => {
  const p = { ...base, equipment: ['dumbbells'] };
  const s = generateSession(p, stateFor(p), '2026-11-23');
  const weighted = allItems(s).filter((i) => i.weighted);
  assert.ok(weighted.length >= 2);
  weighted.forEach((i) => assert.ok(i.weight > 0, `${i.exId} sans charge`));
});

test('durée de séance respectée (± 35 %)', () => {
  for (const minutes of [20, 30, 45, 60, 90]) {
    const p = { ...base, sessionMinutes: minutes, days: [0, 1, 2, 3, 4, 5, 6], goals: ['muscle', 'muaythai', 'cardio', 'mobility'] };
    const st = stateFor(p);
    for (let i = 0; i < 7; i += 1) {
      const s = generateSession(p, st, addDays('2026-11-23', i));
      if (s.type === 'rest') continue;
      assert.ok(s.minutes >= minutes * 0.6 && s.minutes <= minutes * 1.35, `${s.title} ${minutes} min -> ${s.minutes} min`);
    }
  }
});

test('semaine 5 = décharge (moins de séries)', () => {
  const st = stateFor(base);
  const normal = generateSession(base, st, '2026-11-23');
  const deload = generateSession(base, st, addDays('2026-11-23', 28));
  assert.equal(deload.deload, true);
  const sets = (s) => allItems(s).filter((i) => i.kind === 'sets').reduce((t, i) => t + i.sets, 0);
  assert.ok(sets(deload) < sets(normal));
});

test('forme très basse => récupération active, forme moyenne => séance allégée', () => {
  const st = stateFor(base);
  const low = generateSession(base, st, '2026-11-23', { readiness: 25 });
  assert.equal(low.type, 'mobility');
  const mid = generateSession(base, st, '2026-11-23', { readiness: 55 });
  assert.equal(mid.adjusted, 'light');
  const forced = generateSession(base, st, '2026-11-23', { readiness: 25, force: true });
  assert.equal(forced.type, 'strength');
});

test('score de forme', () => {
  assert.ok(readinessScore({ sleep: 8, energy: 5, soreness: 1, stress: 1 }) >= 95);
  assert.ok(readinessScore({ sleep: 4, energy: 1, soreness: 5, stress: 5 }) <= 5);
  assert.ok(readinessScore({ sleep: 8, energy: 5, soreness: 1, stress: 1, pain: true }) <= 75);
});

test('progression : reps en haut de fourchette => objectif augmenté', () => {
  const ex = EX.pushup;
  const t = defaultTarget(ex, base);
  const hi = t.reps[1];
  const { progression, message } = applyResult(emptyProgression(), 'pushup', { sets: [{ reps: hi }, { reps: hi }, { reps: hi }], rpe: 'ok' }, base);
  assert.deepEqual(progression.ex.pushup.reps, [t.reps[0] + 1, hi + 1]);
  assert.ok(message);
});

test('progression : charge +incrément quand c’est facile', () => {
  const p = { ...base, equipment: ['dumbbells'] };
  const { progression } = applyResult(emptyProgression(), 'goblet_squat', { sets: [{ reps: 12, weight: 12 }, { reps: 12, weight: 12 }], rpe: 'easy' }, p);
  assert.equal(progression.ex.goblet_squat.weight, 14);
});

test('progression : au plafond => variante plus dure débloquée', () => {
  const prog = { ex: { pushup: { reps: [16, 20], fails: 0 } }, variants: {} };
  const { progression } = applyResult(prog, 'pushup', { sets: [{ reps: 20 }, { reps: 21 }, { reps: 20 }], rpe: 'ok', slot: 'h_push:bw' }, { ...base, liftLevel: 2 });
  assert.equal(progression.variants['h_push:bw'], 'diamond_pushup');
});

test('progression : deux échecs => on régresse', () => {
  let prog = { ex: { pushup: { reps: [10, 13], fails: 0 } }, variants: {} };
  const res = { sets: [{ reps: 6 }, { reps: 5 }], rpe: 'hard' };
  prog = applyResult(prog, 'pushup', res, base).progression;
  prog = applyResult(prog, 'pushup', res, base).progression;
  assert.deepEqual(prog.ex.pushup.reps, [9, 12]);
});

test('routines bien-être générées', () => {
  Object.keys(ROUTINES).forEach((k) => {
    const s = routineSession(k, base);
    assert.ok(s.blocks[0].items.length >= 4);
  });
});

test('idées de repas respectent le régime', () => {
  const vegan = mealIdeas('vegan', 4, 3);
  assert.equal(vegan.length, 4);
  vegan.forEach((m) => assert.ok(m.meal.tags.includes('vegan')));
});

test('profils aléatoires : aucune erreur, exercices valides, séances non vides', () => {
  const r = rng('fuzz');
  const goalsAll = ['muscle', 'muaythai', 'fatloss', 'strength', 'cardio', 'mobility', 'wellbeing'];
  for (let n = 0; n < 300; n += 1) {
    const goals = goalsAll.filter(() => r() < 0.4);
    if (!goals.length) goals.push('muscle');
    const days = [0, 1, 2, 3, 4, 5, 6].filter(() => r() < 0.55);
    if (!days.length) days.push(2);
    const p = {
      ...base,
      sex: r() < 0.5 ? 'male' : 'female',
      age: 14 + Math.floor(r() * 60),
      weight: 45 + Math.floor(r() * 80),
      goals,
      primaryGoal: goals[Math.floor(r() * goals.length)],
      liftLevel: Math.floor(r() * 4),
      mtLevel: Math.floor(r() * 4),
      tests: { push: r() < 0.3 ? null : Math.floor(r() * 50), squat: Math.floor(r() * 60), pull: Math.floor(r() * 15), plank: Math.floor(r() * 150) },
      days,
      sessionMinutes: [20, 30, 45, 60, 75, 90][Math.floor(r() * 6)],
      equipment: EQUIPMENT.map((e) => e.id).filter((id) => id !== 'none' && r() < 0.3),
      injuries: INJURIES.map((e) => e.id).filter(() => r() < 0.15),
    };
    const st = stateFor(p);
    for (let i = 0; i < 7; i += 1) {
      const iso = addDays('2026-11-23', i + n % 40);
      const s = generateSession(p, st, iso, { readiness: r() < 0.2 ? Math.floor(r() * 100) : undefined });
      if (s.type === 'rest') continue;
      const ids = allExIds(s);
      assert.ok(ids.length > 0, `séance vide ${JSON.stringify(p)}`);
      ids.forEach((id) => {
        assert.ok(EX[id], `exercice inconnu ${id}`);
        (p.injuries).forEach((z) => assert.ok(!EX[id].avoid.includes(z) || EX[id].pattern === 'warmup', `${id} contre-indiqué (${z})`));
      });
      allItems(s).forEach((it) => {
        if (it.kind === 'sets') assert.ok(it.reps && it.reps[0] > 0 && it.reps[1] >= it.reps[0], `reps ${it.exId} ${it.reps}`);
        if (it.kind === 'timed') assert.ok(it.secs > 0);
        if (it.kind === 'rounds') assert.ok(it.rounds >= 2);
      });
    }
  }
});

test('chaque exercice a des consignes et des liens valides', () => {
  EXERCISES.forEach((e) => {
    assert.ok(e.cues.length >= 1, `${e.id} sans consigne`);
    if (e.harder) assert.ok(EX[e.harder], `${e.id}.harder`);
    if (e.easier) assert.ok(EX[e.easier], `${e.id}.easier`);
  });
});

import { customItems, setDay, SESSION_OPTIONS } from '../js/engine/planner.js';

test('éditeur : séance de muscu personnalisée respectée et progression conservée', () => {
  const p = { ...base, equipment: ['dumbbells'] };
  const state = { plan: buildWeek(p), progression: emptyProgression(), custom: { sessions: { fullA: { items: [{ exId: 'pushup', sets: 5 }, { exId: 'db_curl', sets: 2 }, { exId: 'plank' }] } } } };
  const day = state.plan.week.findIndex((d) => d.focus === 'fullA');
  const iso = addDays('2026-11-23', day);
  const s = generateSession(p, state, iso);
  const main = s.blocks.find((b) => b.name === 'Bloc principal').items;
  assert.deepEqual(main.map((i) => i.exId), ['pushup', 'db_curl', 'plank']);
  assert.equal(main[0].sets, 5);
  assert.ok(s.custom);
  // une variante débloquée remplace l'exercice choisi
  state.progression = { ex: {}, variants: { 'h_push:bw': 'diamond_pushup' } };
  const items = customItems('fullA', p, state.progression, state);
  assert.equal(items[0].exId, 'diamond_pushup');
});

test('éditeur : changer la séance d’un jour', () => {
  const plan = buildWeek(base);
  const next = setDay(plan, 6, 'technique');
  assert.equal(next.week[6].type, 'muaythai');
  assert.equal(next.custom, true);
  assert.equal(setDay(next, 6, 'rest').week[6].type, 'rest');
  assert.ok(SESSION_OPTIONS.every((o) => o.title));
});

import { buildIcs, googleCalendarUrl } from '../js/reminders.js';

test('rappels : fichier agenda valide avec séances récurrentes et alarme', () => {
  const state = { profile: { ...base, sessionMinutes: 45 }, plan: buildWeek(base) };
  const ics = buildIcs(state, { session: '18:30', quests: '20:30' }, new Date('2026-11-26T10:00:00Z'), 'https://exemple.test/recomp/');
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.trim().endsWith('END:VCALENDAR'));
  assert.match(ics, /RRULE:FREQ=WEEKLY;BYDAY=MO,TU,TH,FR/);
  assert.match(ics, /DTSTART:\d{8}T183000/);
  assert.match(ics, /DURATION:PT45M/);
  assert.match(ics, /TRIGGER:-PT10M/);
  assert.match(ics, /RRULE:FREQ=DAILY/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2);
  const g = googleCalendarUrl(state, '18:30', 'https://exemple.test/');
  assert.ok(g.startsWith('https://calendar.google.com/calendar/render?'));
  assert.ok(decodeURIComponent(g).includes('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,TH,FR'));
});
