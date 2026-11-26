// Démonstrations animées : des squelettes synthétiques (même format que MediaPipe) pour montrer
// le bon mouvement. Aussi utilisés par les tests des compteurs de reps.

const rad = (d) => (d * Math.PI) / 180;
const L = { upper: 0.13, fore: 0.13, thigh: 0.2, shin: 0.2, torso: 0.3, neck: 0.07 };

export function blank() {
  return Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, v: 0.1 }));
}

function setBoth(pts, iL, iR, p, vR = 0.2, dx = 0.012) {
  pts[iL] = { x: p.x, y: p.y, v: 0.98 };
  pts[iR] = { x: p.x + dx, y: p.y - dx * 0.4, v: vR };
}

// Cinématique inverse à 2 segments : renvoie l'articulation du milieu (coude / genou).
export function ik(a, c, l1, l2, bend = 1) {
  const dx = c.x - a.x; const dy = c.y - a.y;
  let d = Math.hypot(dx, dy);
  const max = l1 + l2 - 1e-6;
  if (d > max) d = max;
  if (d < 1e-6) return { x: a.x + l1, y: a.y };
  const ang = Math.atan2(dy, dx);
  const cos = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const off = Math.acos(Math.max(-1, Math.min(1, cos))) * bend;
  return { x: a.x + l1 * Math.cos(ang + off), y: a.y + l1 * Math.sin(ang + off) };
}

/**
 * Silhouette de profil (côté gauche visible, regard vers la droite si face=1).
 * p = { hip, shoulder, wrist, ankle, head?, elbowBend, kneeBend, wrist2, ankle2 }
 */
export function sidePose(p) {
  const pts = blank();
  const sh = p.shoulder; const hip = p.hip;
  const el = ik(sh, p.wrist, L.upper, L.fore, p.elbowBend ?? -1);
  const wr = clampReach(sh, el, p.wrist, L.fore);
  const kn = ik(hip, p.ankle, L.thigh, L.shin, p.kneeBend ?? 1);
  const an = clampReach(hip, kn, p.ankle, L.shin);
  const dirX = sh.x - hip.x; const dirY = sh.y - hip.y; const len = Math.hypot(dirX, dirY) || 1;
  const head = p.head || { x: sh.x + (dirX / len) * L.neck * 1.3 + (p.face ?? 1) * 0.02, y: sh.y + (dirY / len) * L.neck * 1.3 };
  setBoth(pts, 11, 12, sh); setBoth(pts, 23, 24, hip);
  setBoth(pts, 13, 14, el); setBoth(pts, 15, 16, wr);
  setBoth(pts, 25, 26, kn); setBoth(pts, 27, 28, an);
  const face = p.face ?? 1;
  setBoth(pts, 31, 32, { x: an.x + 0.06 * face * (p.toeDir ?? 1), y: an.y + (p.toeDrop ?? 0.015) });
  setBoth(pts, 29, 30, { x: an.x - 0.02 * face, y: an.y + 0.01 });
  pts[0] = { ...head, v: 0.95 };
  // Membres opposés (second bras / seconde jambe) si fournis
  if (p.wrist2) {
    const el2 = ik(sh, p.wrist2, L.upper, L.fore, p.elbowBend2 ?? p.elbowBend ?? -1);
    pts[14] = { ...el2, v: 0.6 }; pts[16] = { ...clampReach(sh, el2, p.wrist2, L.fore), v: 0.6 };
    pts[12] = { ...sh, v: 0.6 };
  }
  if (p.ankle2) {
    const kn2 = ik(hip, p.ankle2, L.thigh, L.shin, p.kneeBend2 ?? p.kneeBend ?? 1);
    const an2 = clampReach(hip, kn2, p.ankle2, L.shin);
    pts[24] = { ...hip, v: 0.6 }; pts[26] = { ...kn2, v: 0.6 }; pts[28] = { ...an2, v: 0.6 };
    pts[32] = { x: an2.x + 0.06 * face * (p.toeDir2 ?? 1), y: an2.y + 0.015, v: 0.6 };
    pts[30] = { x: an2.x - 0.02 * face, y: an2.y + 0.01, v: 0.6 };
  }
  return pts;
}

function clampReach(origin, mid, target, len) {
  const dx = target.x - mid.x; const dy = target.y - mid.y; const d = Math.hypot(dx, dy) || 1;
  return { x: mid.x + (dx / d) * len, y: mid.y + (dy / d) * len };
}

// ---------------------------------------------------------------- Générateurs de profil
export function pushupFrame(e, sag = 0) {
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
  setBoth(pts, 31, 32, { x: an.x + 0.01, y: an.y + 0.04 }); setBoth(pts, 29, 30, { x: an.x + 0.03, y: an.y - 0.01 });
  pts[0] = { x: 0.22, y: sh.y - 0.02, v: 0.9 };
  return pts;
}

export function squatFrame(k, lean = 20) {
  const pts = blank();
  const S = 0.2; const T = 0.2; const Lt = 0.3;
  const an = { x: 0.5, y: 0.92 };
  const phi = rad((180 - k) * 0.35);
  const kn = { x: an.x + S * Math.sin(phi), y: an.y - S * Math.cos(phi) };
  const dx = (an.x - kn.x) / S; const dy = (an.y - kn.y) / S;
  const a = rad(k);
  const hx = dx * Math.cos(a) + dy * Math.sin(a);
  const hy = -dx * Math.sin(a) + dy * Math.cos(a);
  const hip = { x: kn.x + T * hx, y: kn.y + T * hy };
  const l = rad(k > 165 ? 3 : lean);
  const sh = { x: hip.x + Lt * Math.sin(l), y: hip.y - Lt * Math.cos(l) };
  setBoth(pts, 11, 12, sh); setBoth(pts, 23, 24, hip); setBoth(pts, 25, 26, kn); setBoth(pts, 27, 28, an);
  const reach = Math.min(1, (180 - k) / 90);
  setBoth(pts, 13, 14, { x: sh.x + 0.05 + 0.07 * reach, y: sh.y + 0.12 - 0.08 * reach });
  setBoth(pts, 15, 16, { x: sh.x + 0.08 + 0.17 * reach, y: sh.y + 0.24 - 0.22 * reach });
  setBoth(pts, 31, 32, { x: an.x + 0.07, y: an.y + 0.015 }); setBoth(pts, 29, 30, { x: an.x - 0.02, y: an.y + 0.01 });
  pts[0] = { x: sh.x + 0.03, y: sh.y - 0.08, v: 0.9 };
  return pts;
}

const GROUND = 0.9;

export function lungeFrame(t) {
  // t : 0 debout -> 1 en bas
  const hip = { x: 0.5, y: GROUND - 0.39 + 0.17 * t };
  const front = { x: 0.62, y: GROUND };
  const back = { x: 0.32 - 0.04 * t, y: GROUND - 0.01 };
  return sidePose({
    hip, shoulder: { x: hip.x + 0.01, y: hip.y - L.torso }, wrist: { x: hip.x + 0.03, y: hip.y + 0.02 },
    ankle: front, kneeBend: -1, ankle2: back, kneeBend2: -1, toeDir2: 1,
  });
}

export function bridgeFrame(t) {
  const sh = { x: 0.25, y: GROUND - 0.03 };
  const ankle = { x: 0.68, y: GROUND };
  const hip = { x: 0.5, y: GROUND - 0.04 - 0.08 * t };
  return sidePose({
    hip, shoulder: sh, head: { x: 0.17, y: GROUND - 0.04 }, wrist: { x: 0.42, y: GROUND }, elbowBend: 1,
    ankle, kneeBend: -1, face: -1,
  });
}

export function hingeFrame(t) {
  // Soulevé de terre roumain : buste de vertical à ~80°, genoux légèrement fléchis
  const hip = { x: 0.5 - 0.06 * t, y: GROUND - 0.4 + 0.02 * t };
  const ang = rad(5 + 75 * t);
  const sh = { x: hip.x + L.torso * Math.sin(ang), y: hip.y - L.torso * Math.cos(ang) };
  return sidePose({
    hip, shoulder: sh, wrist: { x: sh.x + 0.01, y: sh.y + L.upper + L.fore - 0.01 }, elbowBend: 1,
    ankle: { x: 0.52, y: GROUND }, kneeBend: -1,
  });
}

export function rowFrame(t) {
  const hip = { x: 0.45, y: GROUND - 0.36 };
  const ang = rad(70);
  const sh = { x: hip.x + L.torso * Math.sin(ang), y: hip.y - L.torso * Math.cos(ang) };
  const wrist = { x: sh.x - 0.02 - 0.06 * t, y: sh.y + 0.25 - 0.15 * t };
  return sidePose({ hip, shoulder: sh, wrist, elbowBend: 1, ankle: { x: 0.5, y: GROUND }, kneeBend: -1, ankle2: { x: 0.38, y: GROUND }, kneeBend2: -1 });
}

export function plankFrame() {
  // gainage sur les avant-bras
  const elbow = { x: 0.3, y: GROUND };
  const sh = { x: 0.3, y: GROUND - 0.12 };
  const an = { x: 0.98, y: GROUND - 0.02 };
  const hip = { x: sh.x + (an.x - sh.x) * 0.55, y: sh.y + (an.y - sh.y) * 0.55 };
  const pts = sidePose({ hip, shoulder: sh, wrist: { x: 0.43, y: GROUND }, ankle: an, kneeBend: 1, head: { x: 0.21, y: sh.y - 0.02 } });
  pts[13] = { ...elbow, v: 0.98 };
  pts[15] = { x: 0.43, y: GROUND, v: 0.98 };
  pts[31] = { x: an.x + 0.01, y: GROUND + 0.03, v: 0.98 };
  return pts;
}

export function calfFrame(t) {
  const lift = 0.05 * t;
  const hip = { x: 0.5, y: GROUND - 0.4 - lift };
  return sidePose({ hip, shoulder: { x: 0.5, y: hip.y - L.torso }, wrist: { x: 0.52, y: hip.y + 0.02 }, ankle: { x: 0.5, y: GROUND - lift }, kneeBend: -1, toeDrop: 0.015 + lift });
}

export function pikeFrame(t) {
  const wr = { x: 0.32, y: GROUND };
  const an = { x: 0.78, y: GROUND };
  const hip = { x: 0.6, y: GROUND - 0.42 };
  const head = { x: 0.34, y: GROUND - 0.2 + 0.14 * t };
  const sh = { x: 0.4 - 0.02 * t, y: GROUND - 0.25 + 0.1 * t };
  return sidePose({ hip, shoulder: sh, head, wrist: wr, elbowBend: 1, ankle: an, kneeBend: -1, face: -1 });
}

export function legRaiseFrame(t) {
  const hip = { x: 0.5, y: GROUND - 0.03 };
  const ang = rad(90 - 85 * t);
  const ankle = { x: hip.x + 0.39 * Math.sin(ang) * 1.0, y: hip.y - 0.39 * Math.cos(ang) };
  return sidePose({ hip, shoulder: { x: 0.2, y: GROUND - 0.03 }, head: { x: 0.12, y: GROUND - 0.05 }, wrist: { x: 0.45, y: GROUND }, elbowBend: 1, ankle, kneeBend: -1 });
}

export function teepFrame(t) {
  const hip = { x: 0.45, y: GROUND - 0.4 };
  const sh = { x: 0.42, y: hip.y - L.torso };
  const chamber = Math.min(1, t * 2);
  const ext = Math.max(0, t * 2 - 1);
  const ankle = { x: hip.x + 0.1 * chamber + 0.25 * ext, y: GROUND - 0.25 * chamber - 0.12 * ext };
  return sidePose({
    hip, shoulder: sh, wrist: { x: sh.x + 0.1, y: sh.y - 0.05 }, elbowBend: 1,
    ankle, kneeBend: -1, ankle2: { x: 0.42, y: GROUND }, kneeBend2: -1,
  });
}

// ---------------------------------------------------------------- Vue de face
export function frontFrame({ armsUp = false, legsOpen = false, elbowL = 170, elbowR = 170, kickL = 0, handsGuard = false, armsT = null, legsT = null, kneeL = 0, kneeR = 0, press = null, jabR = 0 }) {
  const pts = blank();
  const set = (i, x, y) => { pts[i] = { x, y, v: 0.97 }; };
  set(0, 0.5, 0.15);
  set(11, 0.42, 0.28); set(12, 0.58, 0.28);
  set(23, 0.45, 0.55); set(24, 0.55, 0.55);
  const spread = legsT !== null ? 0.06 + 0.14 * legsT : legsOpen ? 0.2 : 0.06;
  set(25, 0.5 - spread * 0.6, 0.72); set(26, 0.5 + spread * 0.6, 0.72);
  set(27, 0.5 - spread, 0.9); set(28, 0.5 + spread, 0.9);
  set(31, 0.5 - spread - 0.02, 0.93); set(32, 0.5 + spread + 0.02, 0.93);
  if (kickL) {
    const ay = 0.9 - (0.9 - 0.55) * kickL;
    set(25, 0.3, 0.55 + (0.72 - 0.55) * (1 - kickL)); set(27, 0.12 + 0.3 * (1 - kickL), ay); set(31, 0.08 + 0.3 * (1 - kickL), ay + 0.02);
  }
  if (kneeL) { set(25, 0.45, 0.72 - 0.2 * kneeL); set(27, 0.44, 0.9 - 0.2 * kneeL); set(31, 0.44, 0.93 - 0.2 * kneeL); }
  if (kneeR) { set(26, 0.55, 0.72 - 0.2 * kneeR); set(28, 0.56, 0.9 - 0.2 * kneeR); set(32, 0.56, 0.93 - 0.2 * kneeR); }
  if (armsT !== null) {
    // jumping jacks : bras de 15° à 165° (sur les côtés)
    const a = rad(15 + 150 * armsT);
    set(13, 0.42 - 0.13 * Math.sin(a), 0.28 + 0.13 * Math.cos(a)); set(15, 0.42 - 0.26 * Math.sin(a), 0.28 + 0.26 * Math.cos(a));
    set(14, 0.58 + 0.13 * Math.sin(a), 0.28 + 0.13 * Math.cos(a)); set(16, 0.58 + 0.26 * Math.sin(a), 0.28 + 0.26 * Math.cos(a));
  } else if (armsUp) {
    set(13, 0.36, 0.14); set(14, 0.64, 0.14); set(15, 0.38, 0.02); set(16, 0.62, 0.02);
  } else if (press !== null) {
    // développé : coudes sous les poignets en bas, bras tendus au-dessus de la tête en haut
    set(13, 0.32 + 0.04 * press, 0.3 - 0.14 * press); set(14, 0.68 - 0.04 * press, 0.3 - 0.14 * press);
    set(15, 0.33, 0.17 - 0.14 * press); set(16, 0.67, 0.17 - 0.14 * press);
  } else if (handsGuard) {
    set(13, 0.38, 0.33); set(14, 0.62 - 0.08 * jabR, 0.33 - 0.06 * jabR); set(15, 0.44, 0.17); set(16, 0.56 - 0.02 * jabR, 0.17 + 0.05 * jabR);
    if (jabR) { pts[16] = { x: 0.6 - 0.1 * jabR, y: 0.24, v: 0.97 }; pts[14] = { x: 0.62 - 0.03 * jabR, y: 0.3 - 0.03 * jabR, v: 0.97 }; }
  } else {
    const fl = 0.13;
    set(13, 0.41, 0.42); set(14, 0.59, 0.42);
    pts[15] = { x: 0.41 + fl * Math.sin(rad(180 - elbowL)) * 0.001, y: 0.42 + fl * Math.cos(rad(180 - elbowL)), v: 0.97 };
    pts[16] = { x: 0.59, y: 0.42 + fl * Math.cos(rad(180 - elbowR)), v: 0.97 };
  }
  return pts;
}

// ---------------------------------------------------------------- Catalogue des démos
// Chaque démo : { view, frames: (t:0..1 sur un cycle) -> points, cycle: secondes, cue: (t) -> texte, angle? }
const pingpong = (t) => (t < 0.5 ? t * 2 : 2 - t * 2);
const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);
const hold = (t, a = 0.15) => ease(Math.min(1, Math.max(0, (pingpong(t) - a / 2) / (1 - a))));

export const DEMOS = {
  pushup: { view: 'Profil', cycle: 3, frame: (t) => pushupFrame(170 - 85 * hold(t)), cue: (t) => (t < 0.5 ? 'Descends en contrôlant (2 s)' : 'Pousse fort, bras tendus'), joint: [11, 13, 15] },
  squat: { view: 'Profil', cycle: 3.2, frame: (t) => squatFrame(175 - 95 * hold(t)), cue: (t) => (t < 0.5 ? 'Fesses en arrière, descends' : 'Pousse dans les talons'), joint: [23, 25, 27] },
  jump_squat: { view: 'Profil', cycle: 2, frame: (t) => { const p = squatFrame(175 - 80 * hold(t)); if (t > 0.85) p.forEach((q) => { q.y -= 0.06 * Math.sin(((t - 0.85) / 0.15) * Math.PI); }); return p; }, cue: (t) => (t < 0.6 ? 'Descends' : 'Explose !'), joint: [23, 25, 27] },
  wall_sit: { view: 'Profil', cycle: 3, frame: () => squatFrame(92, 2), cue: () => 'Tiens, dos au mur, genoux à 90°', joint: [23, 25, 27] },
  lunge: { view: 'Profil', cycle: 3.2, frame: (t) => lungeFrame(hold(t)), cue: (t) => (t < 0.5 ? 'Genou arrière vers le sol' : 'Remonte, buste droit'), joint: [23, 25, 27] },
  bridge: { view: 'Profil', cycle: 2.8, frame: (t) => bridgeFrame(hold(t)), cue: (t) => (t < 0.5 ? 'Pousse dans les talons' : 'Redescends lentement'), joint: [11, 23, 25] },
  hinge: { view: 'Profil', cycle: 3.2, frame: (t) => hingeFrame(hold(t)), cue: (t) => (t < 0.5 ? 'Fesses en arrière, dos plat' : 'Hanches en avant, serre les fessiers'), joint: [11, 23, 25] },
  row: { view: 'Profil', cycle: 2.6, frame: (t) => rowFrame(hold(t)), cue: (t) => (t < 0.5 ? 'Tire le coude vers la hanche' : 'Redescends en contrôle'), joint: [11, 13, 15] },
  plank: { view: 'Profil', cycle: 3, frame: () => plankFrame(), cue: () => 'Corps aligné, serre abdos et fessiers', joint: [11, 23, 27] },
  calf: { view: 'Profil', cycle: 2, frame: (t) => calfFrame(hold(t)), cue: (t) => (t < 0.5 ? 'Monte sur la pointe' : 'Descends lentement') },
  pike: { view: 'Profil', cycle: 3, frame: (t) => pikeFrame(hold(t)), cue: (t) => (t < 0.5 ? 'Tête vers le sol devant les mains' : 'Pousse'), joint: [11, 13, 15] },
  leg_raise: { view: 'Profil', cycle: 3, frame: (t) => legRaiseFrame(hold(t)), cue: (t) => (t < 0.5 ? 'Monte les jambes tendues' : 'Redescends sans toucher le sol') },
  teep: { view: 'Profil', cycle: 1.8, frame: (t) => teepFrame(pingpong(t)), cue: (t) => (t < 0.25 ? 'Monte le genou' : t < 0.5 ? 'Pousse avec la plante du pied' : 'Reviens en garde') },
  jacks: { view: 'Face', cycle: 1.4, frame: (t) => frontFrame({ armsT: hold(t, 0.1), legsT: hold(t, 0.1) }), cue: (t) => (t < 0.5 ? 'Écarte bras et jambes' : 'Referme') },
  curl: { view: 'Face', cycle: 2.6, frame: (t) => { const e = 170 - 130 * hold(t); return frontFrame({ elbowL: e, elbowR: e }); }, cue: (t) => (t < 0.5 ? 'Monte, coudes collés' : 'Descends lentement'), joint: [11, 13, 15] },
  press: { view: 'Face', cycle: 2.6, frame: (t) => frontFrame({ press: hold(t) }), cue: (t) => (t < 0.5 ? 'Pousse au-dessus de la tête' : 'Redescends aux épaules'), joint: [11, 13, 15] },
  high_knees: { view: 'Face', cycle: 0.9, frame: (t) => frontFrame({ kneeL: t < 0.5 ? Math.sin(t * 2 * Math.PI) : 0, kneeR: t >= 0.5 ? Math.sin((t - 0.5) * 2 * Math.PI) : 0, handsGuard: true }), cue: () => 'Genoux à hauteur de hanches, rythme rapide' },
  knees: { view: 'Face', cycle: 1.6, frame: (t) => frontFrame({ kneeL: Math.sin(pingpong(t) * Math.PI / 2) * 1.2, handsGuard: true }), cue: (t) => (t < 0.5 ? 'Tire les mains, pousse la hanche' : 'Reviens en garde') },
  kicks: { view: 'Face', cycle: 1.6, frame: (t) => frontFrame({ kickL: hold(t, 0.1), handsGuard: true }), cue: (t) => (t < 0.5 ? 'Pivote, frappe avec le tibia' : 'Reviens vite en garde') },
  guard: { view: 'Face', cycle: 1.6, frame: (t) => frontFrame({ handsGuard: true, jabR: t < 0.35 ? Math.sin((t / 0.35) * Math.PI) : 0 }), cue: (t) => (t < 0.35 ? 'Jab : bras tendu, l’autre main protège' : 'Mains au visage, coudes serrés') },
  burpee: {
    view: 'Profil', cycle: 3.4,
    frame: (t) => {
      if (t < 0.2) return squatFrame(175 - 100 * ease(t / 0.2), 40);
      if (t < 0.4) return lerpPose(squatFrame(75, 45), pushupFrame(170), ease((t - 0.2) / 0.2));
      if (t < 0.6) return pushupFrame(170 - 80 * pingpong((t - 0.4) / 0.2));
      if (t < 0.8) return lerpPose(pushupFrame(170), squatFrame(75, 45), ease((t - 0.6) / 0.2));
      const p = squatFrame(75 + 100 * ease((t - 0.8) / 0.2), 30);
      if (t > 0.9) p.forEach((q) => { q.y -= 0.05 * Math.sin(((t - 0.9) / 0.1) * Math.PI); });
      return p;
    },
    cue: (t) => (t < 0.2 ? 'Mains au sol' : t < 0.4 ? 'Pieds en arrière' : t < 0.6 ? 'Pompe' : t < 0.8 ? 'Ramène les pieds' : 'Saute !'),
  },
};

export function lerpPose(a, b, t) {
  return a.map((p, i) => ({ x: p.x + (b[i].x - p.x) * t, y: p.y + (b[i].y - p.y) * t, v: Math.max(p.v, b[i].v) }));
}

// Quelle démo pour quel exercice
export const EXERCISE_DEMO = {
  pushup: 'pushup', knee_pushup: 'pushup', incline_pushup: 'pushup', diamond_pushup: 'pushup', decline_pushup: 'pushup', archer_pushup: 'pushup',
  db_floor_press: 'press', db_bench_press: 'press', bench_press: 'press', dips: 'pushup', chair_dips: 'pushup',
  pike_pushup: 'pike', db_shoulder_press: 'press', kb_press: 'press', band_press: 'press',
  table_row: 'row', inverted_row: 'row', db_row: 'row', band_row: 'row', kb_row: 'row', cable_row: 'row',
  box_squat: 'squat', squat: 'squat', goblet_squat: 'squat', barbell_squat: 'squat', jump_squat: 'jump_squat', wall_sit: 'wall_sit',
  bulgarian_split_squat: 'lunge', pistol_squat: 'squat', bw_squat_warm: 'squat',
  glute_bridge: 'bridge', single_leg_bridge: 'bridge', hip_thrust: 'bridge',
  db_rdl: 'hinge', kb_swing: 'hinge', deadlift: 'hinge', good_morning: 'hinge',
  reverse_lunge: 'lunge', walking_lunge: 'lunge', db_lunge: 'lunge', step_up: 'lunge',
  plank: 'plank', side_plank: 'plank', mountain_climbers: 'plank',
  leg_raises: 'leg_raise', hanging_knee_raise: 'leg_raise',
  db_curl: 'curl', hammer_curl: 'curl', band_curl: 'curl',
  db_triceps_ext: 'press', band_triceps: 'curl',
  calf_raise: 'calf',
  jumping_jacks: 'jacks', high_knees: 'high_knees', burpees: 'burpee', mt_sprawl: 'burpee', skater_jumps: 'jacks',
  shadow_run: 'guard', mt_stance: 'guard', mt_shadow: 'guard', mt_bag: 'guard', mt_pads: 'guard',
  mt_kicks: 'kicks', mt_teeps: 'teep', mt_knees: 'knees', mt_check: 'knees',
};
