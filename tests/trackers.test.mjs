// Tests des compteurs de répétitions sur des mouvements simulés (squelettes synthétiques).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PushupTracker, SquatTracker, PlankTracker, JacksTracker, curlTracker, kickTracker, GuardTracker,
} from '../js/pose/trackers.js';

const rad = (d) => (d * Math.PI) / 180;

function blank() {
  return Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, v: 0.1 }));
}

function setBoth(pts, iL, iR, p, vR = 0.2) {
  pts[iL] = { ...p, v: 0.98 };
  pts[iR] = { x: p.x + 0.01, y: p.y, v: vR };
}

// Pompe vue de profil : e = angle des coudes, sag = affaissement des hanches (+ = vers le sol)
function pushupFrame(e, sag = 0) {
  const pts = blank();
  const U = 0.13; const wr = { x: 0.3, y: 0.85 };
  const d = Math.sqrt(2 * U * U - 2 * U * U * Math.cos(rad(e)));
  const sh = { x: 0.3, y: wr.y - d };
  const off = Math.sqrt(Math.max(0, U * U - (d / 2) ** 2));
  const el = { x: 0.3 + off, y: wr.y - d / 2 };
  const an = { x: 1.0, y: 0.82 };
  const lerp = (t) => ({ x: sh.x + (an.x - sh.x) * t, y: sh.y + (an.y - sh.y) * t });
  const hip = lerp(0.55); hip.y += sag;
  const kn = lerp(0.78); kn.y += sag / 2;
  setBoth(pts, 11, 12, sh); setBoth(pts, 13, 14, el); setBoth(pts, 15, 16, wr);
  setBoth(pts, 23, 24, hip); setBoth(pts, 25, 26, kn); setBoth(pts, 27, 28, an);
  pts[0] = { x: 0.22, y: sh.y - 0.02, v: 0.9 };
  return pts;
}

// Squat vue de profil : k = angle des genoux
function squatFrame(k, lean = 20) {
  const pts = blank();
  const S = 0.2; const T = 0.2; const L = 0.3;
  const an = { x: 0.5, y: 0.92 };
  const phi = rad((180 - k) * 0.35);
  const kn = { x: an.x + S * Math.sin(phi), y: an.y - S * Math.cos(phi) };
  // direction genou->cheville
  const dx = (an.x - kn.x) / S; const dy = (an.y - kn.y) / S;
  const a = rad(k);
  // rotation dans le sens qui envoie la hanche vers l'arrière (x négatif)
  const hx = dx * Math.cos(a) + dy * Math.sin(a);
  const hy = -dx * Math.sin(a) + dy * Math.cos(a);
  const hip = { x: kn.x + T * hx, y: kn.y + T * hy };
  const l = rad(k > 165 ? 3 : lean);
  const sh = { x: hip.x + L * Math.sin(l), y: hip.y - L * Math.cos(l) };
  setBoth(pts, 11, 12, sh); setBoth(pts, 23, 24, hip); setBoth(pts, 25, 26, kn); setBoth(pts, 27, 28, an);
  setBoth(pts, 13, 14, { x: sh.x + 0.1, y: sh.y + 0.05 }); setBoth(pts, 15, 16, { x: sh.x + 0.2, y: sh.y + 0.05 });
  pts[0] = { x: sh.x + 0.03, y: sh.y - 0.08, v: 0.9 };
  return pts;
}

function run(tracker, frames) {
  let out;
  frames.forEach((f, i) => { out = tracker.update(f, i * 33); });
  return out;
}

function reps(fn, from, to, n, framesPerHalf = 15, ...args) {
  const frames = [];
  for (let i = 0; i < 10; i += 1) frames.push(fn(from, ...args));
  for (let r = 0; r < n; r += 1) {
    for (let i = 0; i <= framesPerHalf; i += 1) frames.push(fn(from + ((to - from) * i) / framesPerHalf, ...args));
    for (let i = 0; i <= framesPerHalf; i += 1) frames.push(fn(to + ((from - to) * i) / framesPerHalf, ...args));
  }
  for (let i = 0; i < 10; i += 1) frames.push(fn(from, ...args));
  return frames;
}

test('pompes complètes : 5 reps valides', () => {
  const t = new PushupTracker();
  const out = run(t, reps(pushupFrame, 170, 80, 5));
  assert.equal(out.ready, true);
  assert.equal(out.reps, 5);
  assert.equal(out.partial, 0);
});

test('pompes pas assez basses : comptées comme partielles', () => {
  const t = new PushupTracker();
  const out = run(t, reps(pushupFrame, 170, 118, 4));
  assert.equal(out.reps, 0);
  assert.equal(out.partial, 4);
  assert.ok(t.summary().topErrors[0].msg.includes('plus bas'));
});

test('pompes avec hanches qui tombent : non validées', () => {
  const t = new PushupTracker();
  const out = run(t, reps(pushupFrame, 170, 80, 3, 15, 0.09));
  assert.equal(out.reps, 0);
  assert.equal(out.partial, 3);
  assert.ok(Object.keys(t.errors)[0].includes('Hanches'));
});

test('pompes : debout = pas en position', () => {
  const t = new PushupTracker();
  const out = run(t, Array.from({ length: 10 }, () => squatFrame(175)));
  assert.equal(out.ready, false);
  assert.equal(out.reps, 0);
});

test('squats profonds : comptés', () => {
  const t = new SquatTracker();
  const out = run(t, reps(squatFrame, 175, 80, 6));
  assert.equal(out.reps, 6);
  assert.equal(out.partial, 0);
});

test('demi-squats : partiels', () => {
  const t = new SquatTracker();
  const out = run(t, reps(squatFrame, 175, 125, 3));
  assert.equal(out.reps, 0);
  assert.equal(out.partial, 3);
});

test('squats buste trop penché : signalés', () => {
  const t = new SquatTracker();
  const out = run(t, reps(squatFrame, 175, 80, 2, 15, 65));
  assert.equal(out.reps, 0);
  assert.equal(out.partial, 2);
});

test('gainage : le chrono avance seulement si aligné', () => {
  const good = new PlankTracker();
  const frames = Array.from({ length: 90 }, () => pushupFrame(90));
  run(good, frames);
  assert.ok(good.holdSec > 2.5, `hold=${good.holdSec}`);
  const bad = new PlankTracker();
  run(bad, Array.from({ length: 90 }, () => pushupFrame(90, 0.12)));
  assert.ok(bad.holdSec < 1, `hold=${bad.holdSec}`);
});

function frontFrame({ armsUp = false, legsOpen = false, elbowL = 170, elbowR = 170, kickL = 0, handsGuard = false }) {
  const pts = blank();
  const set = (i, x, y) => { pts[i] = { x, y, v: 0.97 }; };
  set(0, 0.5, 0.15);
  set(11, 0.42, 0.28); set(12, 0.58, 0.28);
  set(23, 0.45, 0.55); set(24, 0.55, 0.55);
  const feetX = legsOpen ? 0.2 : 0.06;
  set(25, 0.5 - feetX * 0.6, 0.72); set(26, 0.5 + feetX * 0.6, 0.72);
  set(27, 0.5 - feetX, 0.9); set(28, 0.5 + feetX, 0.9);
  if (kickL) {
    // jambe gauche levée sur le côté : cheville à hauteur kickL (0 = au sol, 1 = hanche)
    const ay = 0.9 - (0.9 - 0.55) * kickL;
    set(25, 0.3, 0.55 + (0.72 - 0.55) * (1 - kickL)); set(27, 0.12, ay);
  }
  if (armsUp) {
    set(13, 0.36, 0.14); set(14, 0.64, 0.14); set(15, 0.38, 0.02); set(16, 0.62, 0.02);
  } else if (handsGuard) {
    set(13, 0.38, 0.33); set(14, 0.62, 0.33); set(15, 0.44, 0.17); set(16, 0.56, 0.17);
  } else {
    // curl : coude fixe, avant-bras qui tourne
    set(13, 0.41, 0.42); set(14, 0.59, 0.42);
    const fl = 0.13;
    const wl = rad(180 - elbowL); const wrr = rad(180 - elbowR);
    set(15, 0.41 + Math.sin(wl) * 0.02, 0.42 + fl * Math.cos(wl)); set(16, 0.59 - Math.sin(wrr) * 0.02, 0.42 + fl * Math.cos(wrr));
    pts[15].x = 0.41; pts[15].y = 0.42 + fl * Math.cos(rad(180 - elbowL));
    pts[15].z = 0;
    // place le poignet devant (x) pour obtenir l'angle voulu
    pts[15] = { x: 0.41 + fl * Math.sin(rad(180 - elbowL)) * 0.001, y: 0.42 + fl * Math.cos(rad(180 - elbowL)), v: 0.97 };
    pts[16] = { x: 0.59, y: 0.42 + fl * Math.cos(rad(180 - elbowR)), v: 0.97 };
  }
  return pts;
}

test('jumping jacks : 4 reps', () => {
  const t = new JacksTracker();
  const frames = [];
  for (let r = 0; r < 4; r += 1) {
    for (let i = 0; i < 8; i += 1) frames.push(frontFrame({}));
    for (let i = 0; i < 8; i += 1) frames.push(frontFrame({ armsUp: true, legsOpen: true }));
  }
  for (let i = 0; i < 8; i += 1) frames.push(frontFrame({}));
  const out = run(t, frames);
  assert.equal(out.reps, 4);
});

test('curl : deux bras ensemble = une rep', () => {
  const t = curlTracker();
  const frames = [];
  const seq = (a, b, n) => { for (let i = 0; i <= n; i += 1) { const e = a + ((b - a) * i) / n; frames.push(frontFrame({ elbowL: e, elbowR: e })); } };
  for (let r = 0; r < 3; r += 1) { seq(170, 40, 20); seq(40, 170, 30); }
  const out = run(t, frames);
  assert.equal(out.reps, 3);
});

test('kicks : coup de pied à hauteur de hanche compté', () => {
  const t = kickTracker();
  const frames = [];
  for (let r = 0; r < 3; r += 1) {
    for (let i = 0; i <= 10; i += 1) frames.push(frontFrame({ handsGuard: true, kickL: i / 10 }));
    for (let i = 10; i >= 0; i -= 1) frames.push(frontFrame({ handsGuard: true, kickL: i / 10 }));
  }
  const out = run(t, frames);
  assert.equal(out.reps, 3);
});

test('shadow : garde basse détectée, garde haute validée', () => {
  const t = new GuardTracker();
  run(t, Array.from({ length: 60 }, () => frontFrame({ handsGuard: true })));
  assert.ok(t.summary().score >= 95);
  const low = new GuardTracker();
  run(low, Array.from({ length: 60 }, () => frontFrame({ elbowL: 170, elbowR: 100 })));
  assert.ok(low.summary().score < 30, `score=${low.summary().score}`);
  assert.ok(low.alerts >= 1);
});

test('shadow : bras tendus sur les côtés trop longtemps = garde basse', () => {
  const t = new GuardTracker();
  const frames = Array.from({ length: 90 }, () => {
    const pts = frontFrame({ handsGuard: true });
    // bras tendus à l'horizontale (comme une posture de yoga)
    pts[13] = { x: 0.3, y: 0.28, v: 0.97 }; pts[15] = { x: 0.18, y: 0.28, v: 0.97 };
    pts[14] = { x: 0.7, y: 0.28, v: 0.97 }; pts[16] = { x: 0.82, y: 0.28, v: 0.97 };
    return pts;
  });
  run(t, frames);
  assert.ok(t.alerts >= 1);
  assert.ok(t.summary().score < 60, `score=${t.summary().score}`);
});

test('pompes : bras pas tendus en haut = rep incomplète', () => {
  const t = new PushupTracker();
  const frames = [];
  for (let i = 0; i < 10; i += 1) frames.push(pushupFrame(170));
  const seg = (a, b, n = 12) => { for (let i = 0; i <= n; i += 1) frames.push(pushupFrame(a + ((b - a) * i) / n)); };
  seg(170, 80); seg(80, 135); seg(135, 80); seg(80, 170);
  const out = run(t, frames);
  assert.equal(out.partial, 1);
  assert.equal(out.reps, 1);
  assert.ok(Object.keys(t.errors).some((m) => m.includes('Tends')));
});

