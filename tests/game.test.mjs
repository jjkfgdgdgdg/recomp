// Tests du système de jeu (niveaux, quêtes, boss) et des démos animées.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyGame, xpForLevel, levelInfo, rankFor, grantXp, statValue, newTitles,
} from '../js/game/leveling.js';
import { dailyQuests, questProgress, baseQuests, penaltyQuest } from '../js/game/quests.js';
import {
  BOSSES, bossHp, repDamage, comboMult, grade, bossXp, phaseTarget,
} from '../js/game/bosses.js';
import { DEMOS, EXERCISE_DEMO } from '../js/pose/demos.js';
import { EX } from '../js/data/exercises.js';
import { TRACKERS } from '../js/pose/trackers.js';
import { buildWeek } from '../js/engine/planner.js';
import { weeklyVolume } from '../js/data/muscles.js';
import { GUIDES } from '../js/data/guides.js';
import { techFor } from '../js/data/technique.js';

const profile = {
  name: 'T', sex: 'male', age: 22, height: 178, weight: 70, goals: ['muscle', 'muaythai'], primaryGoal: 'muscle', liftLevel: 1, mtLevel: 1,
  tests: { push: 20, squat: 40, pull: 2, plank: 60 }, days: [0, 2, 4], sessionMinutes: 45, equipment: [], injuries: [], createdAt: 'x', planStart: '2026-11-23',
};
const emptyLogs = () => ({ sessions: [], weights: [], checkins: {}, water: {}, coach: [], tests: [], breath: [] });
const stateWith = (extra = {}) => ({ profile, plan: buildWeek(profile), logs: emptyLogs(), game: { ...emptyGame(), startedAt: '2026-11-20' }, ...extra });

test('niveaux : courbe croissante et calcul du niveau', () => {
  assert.ok(xpForLevel(2) > xpForLevel(1));
  assert.equal(levelInfo(0).level, 1);
  assert.equal(levelInfo(xpForLevel(1)).level, 2);
  assert.equal(levelInfo(xpForLevel(1) + xpForLevel(2) + 5).level, 3);
  assert.equal(rankFor(1).id, 'E');
  assert.equal(rankFor(10).id, 'D');
  assert.equal(rankFor(70).id, 'S');
});

test('XP : montée de niveau et répartition dans les stats', () => {
  const { game, levelsGained } = grantXp(emptyGame(), 400, { str: 0.75, end: 0.25 }, 'test');
  assert.ok(levelsGained.length >= 2);
  assert.equal(game.statXp.str, 300);
  assert.equal(game.statXp.end, 100);
  assert.ok(statValue(game.statXp.str) > statValue(game.statXp.end));
});

test('titres : première séance débloque « Premier pas »', () => {
  const s = stateWith();
  s.logs.sessions.push({ date: '2026-11-25', type: 'strength' });
  const t = newTitles(s.game, s, 1).map((x) => x.id);
  assert.ok(t.includes('first_step'));
});

test('quêtes : déterministes, adaptées, sans exercice contre-indiqué', () => {
  const s = stateWith();
  const a = dailyQuests(s, '2026-11-25');
  const b = dailyQuests(s, '2026-11-25');
  assert.deepEqual(a.map((q) => q.id), b.map((q) => q.id));
  assert.ok(a.some((q) => q.id === 'water'));
  assert.ok(a.some((q) => q.kind === 'session' || q.kind === 'breath'));
  assert.equal(baseQuests(s, '2026-11-25').filter((q) => q.tracker).length, 3);
  const injured = stateWith({ profile: { ...profile, injuries: ['wrist', 'knee'] } });
  for (let d = 10; d < 30; d += 1) {
    baseQuests(injured, `2026-11-${d}`).forEach((q) => assert.ok(!['pushups', 'squats', 'lunges', 'burpees'].includes(q.id), `${q.id} interdit`));
  }
});

test('quêtes : la progression vient de la caméra, des séances et des saisies, sans double comptage', () => {
  const s = stateWith();
  const q = { id: 'pushups', tracker: 'pushup', unit: 'reps', exIds: ['pushup'], target: 30 };
  s.logs.coach.push({ date: '2026-11-25', trackerId: 'pushup', reps: 12 });
  s.logs.sessions.push({ date: '2026-11-25', exercises: [{ exId: 'pushup', sets: [{ reps: 10 }, { reps: 8, coach: { score: 100 } }] }] });
  s.game.quests['2026-11-25'] = { manual: { pushups: 5 } };
  assert.equal(questProgress(s, '2026-11-25', q), 12 + 10 + 5);
});

test('quête de pénalité si les quêtes de la veille sont ratées', () => {
  const s = stateWith();
  assert.ok(penaltyQuest(s, '2026-11-25'), 'pénalité attendue');
  assert.equal(penaltyQuest(s, '2026-11-20'), null, 'pas de pénalité avant le début du jeu');
  assert.equal(dailyQuests(s, '2026-11-25')[0].id, 'penalty');
});

test('boss : PV cohérents et dégâts selon la qualité', () => {
  BOSSES.forEach((b) => {
    const hp = bossHp(b, profile, 5);
    assert.equal(hp.length, b.phases.length);
    hp.forEach((x) => assert.ok(x > 0));
    b.phases.forEach((p) => assert.ok(TRACKERS[p.tracker], `${b.id}: tracker ${p.tracker}`));
  });
  const noCrit = () => 0.99;
  const perfect = repDamage({ valid: true, score: 100, combo: 0, random: noCrit });
  const ok = repDamage({ valid: true, score: 60, combo: 0, random: noCrit });
  const miss = repDamage({ valid: false });
  assert.ok(perfect.dmg > ok.dmg);
  assert.ok(ok.dmg > miss.dmg);
  assert.ok(miss.miss);
  const crit = repDamage({ valid: true, score: 100, combo: 0, random: () => 0 });
  assert.ok(crit.crit && crit.dmg === perfect.dmg * 2);
  const combo = repDamage({ valid: true, score: 100, combo: 20, random: noCrit });
  assert.equal(combo.dmg, perfect.dmg * 2);
  assert.equal(comboMult(40), 2);
  const manual = repDamage({ valid: true, score: 100, manual: true, random: () => 0 });
  assert.ok(manual.dmg < perfect.dmg && !manual.crit);
  assert.equal(grade({ won: false, accuracy: 1, hpLeftPct: 1 }), 'F');
  assert.equal(grade({ won: true, accuracy: 1, hpLeftPct: 1 }), 'S');
  assert.ok(bossXp(BOSSES[0], true, 'S') > bossXp(BOSSES[0], false, 'F'));
  assert.ok(phaseTarget(BOSSES[1].phases[0], profile, 5, 'D').reps >= 6);
});

test('démos : chaque démo produit 33 points valides', () => {
  Object.entries(DEMOS).forEach(([id, d]) => {
    for (let i = 0; i <= 10; i += 1) {
      const pts = d.frame(i / 10);
      assert.equal(pts.length, 33, id);
      pts.forEach((p) => assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), `${id} point invalide`));
    }
  });
  Object.entries(EXERCISE_DEMO).forEach(([ex, demo]) => {
    assert.ok(EX[ex], `exercice inconnu ${ex}`);
    assert.ok(DEMOS[demo], `démo inconnue ${demo}`);
  });
});

// Les démos montrent la bonne technique : le compteur de la caméra doit les valider.
function runDemo(demoId, trackerId, cycles = 3, fps = 30) {
  const d = DEMOS[demoId];
  const tr = TRACKERS[trackerId].make();
  const n = Math.round(d.cycle * fps);
  let out;
  let t = 0;
  for (let c = 0; c < cycles; c += 1) {
    for (let i = 0; i < n; i += 1) { out = tr.update(d.frame(i / n), t); t += 1000 / fps; }
  }
  for (let i = 0; i < 10; i += 1) { out = tr.update(d.frame(0), t); t += 1000 / fps; }
  return out;
}

for (const [demo, tracker] of [['pushup', 'pushup'], ['squat', 'squat'], ['lunge', 'lunge'], ['jacks', 'jacks'], ['curl', 'curl'], ['press', 'press'], ['bridge', 'bridge'], ['kicks', 'kicks'], ['knees', 'knees']]) {
  test(`démo ${demo} : validée par le compteur caméra`, () => {
    const out = runDemo(demo, tracker);
    assert.equal(out.reps, 3, `${demo}: ${out.reps} reps, ${out.partial} partielles`);
    assert.equal(out.partial, 0);
  });
}

test('démo burpee : validée par le compteur caméra', () => {
  const out = runDemo('burpee', 'burpee');
  assert.ok(out.reps >= 3, `reps=${out.reps}`);
});

test('volume musculaire hebdomadaire', () => {
  const s = stateWith();
  s.logs.sessions.push({ date: '2026-11-25', exercises: [{ exId: 'pushup', sets: [{}, {}, {}] }, { exId: 'squat', sets: [{}, {}] }] });
  const v = weeklyVolume(s, '2026-11-26');
  assert.equal(v.chest, 3);
  assert.equal(v.triceps, 1.5);
  assert.equal(v.quads, 2);
});

test('contenu : guides et fiches techniques complets', () => {
  assert.ok(GUIDES.length >= 10);
  GUIDES.forEach((g) => assert.ok(g.sections.length >= 1 && g.intro));
  Object.values(EX).forEach((e) => {
    const t = techFor(e);
    assert.ok(t.mistakes.length && t.breath && t.tips.length, e.id);
  });
});
