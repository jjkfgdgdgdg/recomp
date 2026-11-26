// Outils géométriques pour les 33 points MediaPipe Pose.

export const LM = {
  nose: 0, lEar: 7, rEar: 8,
  lShoulder: 11, rShoulder: 12, lElbow: 13, rElbow: 14, lWrist: 15, rWrist: 16,
  lHip: 23, rHip: 24, lKnee: 25, rKnee: 26, lAnkle: 27, rAnkle: 28,
  lHeel: 29, rHeel: 30, lFoot: 31, rFoot: 32,
};

export const SIDE = {
  L: { sh: 11, el: 13, wr: 15, hip: 23, kn: 25, an: 27, heel: 29, foot: 31, ear: 7 },
  R: { sh: 12, el: 14, wr: 16, hip: 24, kn: 26, an: 28, heel: 30, foot: 32, ear: 8 },
};

// Liaisons du squelette dessiné (corps uniquement + tête simplifiée).
export const BONES = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
  [27, 29], [29, 31], [27, 31], [28, 30], [30, 32], [28, 32],
  [15, 17], [15, 19], [16, 18], [16, 20],
];
export const JOINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 31, 32];

export function vis(p) {
  if (!p) return 0;
  return p.v ?? p.visibility ?? 1;
}

export function angle(a, b, c) {
  const abx = a.x - b.x; const aby = a.y - b.y;
  const cbx = c.x - b.x; const cby = c.y - b.y;
  const m = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
  if (!m) return 180;
  const cos = Math.max(-1, Math.min(1, (abx * cbx + aby * cby) / m));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function mid(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, v: Math.min(vis(a), vis(b)) };
}

// Angle (0-90°) entre le segment a->b et la verticale.
export function fromVertical(a, b) {
  const dx = Math.abs(b.x - a.x); const dy = Math.abs(b.y - a.y);
  return (Math.atan2(dx, dy) * 180) / Math.PI;
}

export function fromHorizontal(a, b) {
  return 90 - fromVertical(a, b);
}

export function avgVis(pts, ids) {
  return ids.reduce((s, i) => s + vis(pts[i]), 0) / ids.length;
}

export function bestSide(pts, keys = ['sh', 'el', 'wr', 'hip', 'kn', 'an']) {
  const l = avgVis(pts, keys.map((k) => SIDE.L[k]));
  const r = avgVis(pts, keys.map((k) => SIDE.R[k]));
  return l >= r ? 'L' : 'R';
}

// Convertit les points normalisés MediaPipe en repère isotrope (x corrigé par le ratio largeur/hauteur).
export function normalize(landmarks, aspect = 1) {
  return landmarks.map((p) => ({ x: p.x * aspect, y: p.y, z: p.z, v: p.visibility ?? 1 }));
}

export class Ema {
  constructor(alpha = 0.5) { this.alpha = alpha; this.value = null; }

  next(v) {
    if (v === null || v === undefined || Number.isNaN(v)) return this.value;
    this.value = this.value === null ? v : this.alpha * v + (1 - this.alpha) * this.value;
    return this.value;
  }

  reset() { this.value = null; }
}

/**
 * Cycle de répétition avec hystérésis.
 * rest = valeur de la position de départ, target = valeur à atteindre pour une rep complète,
 * partial = valeur minimale pour une rep partielle. Fonctionne dans les deux sens (angle qui baisse ou qui monte).
 * update(v) renvoie null ou { type: 'full' | 'partial' | 'incomplete', peak }.
 */
export class Cycle {
  constructor({ rest, target, partial, lockout = false, leave = 0.2 }) {
    this.sign = target > rest ? -1 : 1;
    this.rest = rest * this.sign;
    this.target = target * this.sign;
    this.partial = partial * this.sign;
    this.leave = this.rest + (this.target - this.rest) * leave;
    this.lockout = lockout;
    this.state = 'rest';
    this.peak = null;
    this.rebound = null;
  }

  get range() { return this.rest - this.target; }

  // Progression de 0 (départ) à 1 (cible) — utile pour une jauge.
  progress(v) {
    const x = v * this.sign;
    return Math.max(0, Math.min(1, (this.rest - x) / this.range));
  }

  reachedTarget() {
    return this.peak !== null && this.peak <= this.target;
  }

  update(v) {
    if (v === null || v === undefined) return null;
    const x = v * this.sign;
    if (this.state === 'rest') {
      if (x < this.leave) {
        this.state = 'work';
        this.peak = x;
        this.rebound = x;
      }
      return null;
    }
    if (x < this.peak) {
      this.peak = x;
      this.rebound = x;
    } else {
      this.rebound = Math.max(this.rebound, x);
    }
    if (x >= this.rest) {
      const peak = this.peak;
      this.state = 'rest';
      this.peak = null;
      if (peak <= this.target) return { type: 'full', peak: peak * this.sign };
      if (peak <= this.partial) return { type: 'partial', peak: peak * this.sign };
      return null;
    }
    // Remontée incomplète puis nouvelle descente (bras pas tendus en haut, par ex.)
    if (this.lockout && this.peak <= this.partial
      && this.rebound - this.peak > this.range * 0.45
      && x < this.rebound - this.range * 0.25) {
      const peak = this.peak;
      this.peak = x;
      this.rebound = x;
      return { type: 'incomplete', peak: peak * this.sign };
    }
    return null;
  }
}
