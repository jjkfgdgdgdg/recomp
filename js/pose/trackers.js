// Analyse des mouvements : compteur de répétitions + corrections, à partir des points du squelette.
// Aucune IA générative : des angles, des seuils et des machines à états.
import {
  SIDE, LM, angle, dist, mid, fromVertical, fromHorizontal, avgVis, bestSide, Ema, Cycle,
} from './geometry.js';

const GOOD = 'good'; const WARN = 'warn'; const BAD = 'bad';

class BaseTracker {
  constructor(mode = 'reps') {
    this.mode = mode;
    this.reps = 0; // répétitions valides
    this.partial = 0; // répétitions incomplètes / mal exécutées
    this.holdSec = 0;
    this.activeSec = 0;
    this.errors = {}; // message -> nombre
    this.events = [];
    this.repFlags = new Set();
    this.lastT = null;
    this.ready = false;
    this.repScores = [];
  }

  begin(t) {
    this.events = [];
    const dt = this.lastT === null ? 0 : Math.min(0.25, Math.max(0, (t - this.lastT) / 1000));
    this.lastT = t;
    return dt;
  }

  addError(msg) {
    this.errors[msg] = (this.errors[msg] || 0) + 1;
  }

  valid(msg = null, score = 100) {
    this.reps += 1;
    this.repScores.push(score);
    this.events.push({ type: 'rep', valid: true, count: this.reps, msg });
  }

  invalid(msg) {
    this.partial += 1;
    this.repScores.push(40);
    this.addError(msg);
    this.events.push({ type: 'rep', valid: false, count: this.reps, msg });
  }

  notReady(msg, joints = {}) {
    this.ready = false;
    return this.out({ feedback: { text: msg, level: WARN }, joints });
  }

  out(o) {
    return {
      mode: this.mode,
      ready: this.ready,
      reps: this.reps,
      partial: this.partial,
      holdSec: this.holdSec,
      events: this.events,
      joints: {},
      feedback: null,
      metric: null,
      progress: 0,
      ...o,
    };
  }

  summary() {
    const total = this.reps + this.partial;
    const score = this.mode === 'hold'
      ? (this.activeSec > 0 ? Math.round((this.holdSec / this.activeSec) * 100) : 0)
      : total ? Math.round(this.repScores.reduce((a, b) => a + b, 0) / this.repScores.length) : 0;
    const topErrors = Object.entries(this.errors).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([msg, n]) => ({ msg, n }));
    return {
      reps: this.reps, partial: this.partial, holdSec: Math.round(this.holdSec), activeSec: Math.round(this.activeSec), score, topErrors,
    };
  }
}

function color(joints, ids, level) {
  ids.forEach((i) => { joints[i] = level; });
}

// ---------------------------------------------------------------------------
// Pompes (vue de profil)
// ---------------------------------------------------------------------------
export class PushupTracker extends BaseTracker {
  constructor({ knee = false } = {}) {
    super('reps');
    this.knee = knee;
    this.elbow = new Ema(0.55);
    this.line = new Ema(0.45);
    this.cycle = new Cycle({ rest: 150, target: 100, partial: 132, lockout: true });
    this.badFrames = 0;
  }

  update(pts, t) {
    this.begin(t);
    const sd = bestSide(pts, ['sh', 'el', 'wr', 'hip', this.knee ? 'kn' : 'an']);
    const s = SIDE[sd];
    const footId = this.knee ? s.kn : s.an;
    const need = [s.sh, s.el, s.wr, s.hip, footId];
    if (avgVis(pts, need) < 0.55) return this.notReady('Place-toi de profil : tout ton corps doit être visible');
    const sh = pts[s.sh]; const el = pts[s.el]; const wr = pts[s.wr]; const hip = pts[s.hip]; const foot = pts[footId];
    const tilt = fromHorizontal(sh, foot);
    if (tilt > 50 || wr.y < sh.y - 0.02) {
      this.cycle.state = 'rest';
      return this.notReady('Mets-toi en position de pompe, de profil à la caméra');
    }
    this.ready = true;
    const e = this.elbow.next(angle(sh, el, wr));
    const ln = this.line.next(angle(sh, hip, foot));
    const dx = foot.x - sh.x;
    const lineY = Math.abs(dx) > 1e-6 ? sh.y + (foot.y - sh.y) * ((hip.x - sh.x) / dx) : hip.y;
    const dev = (hip.y - lineY) / (dist(sh, foot) || 1);
    let issue = null;
    if (ln < 160) issue = dev > 0 ? 'sag' : 'pike';
    const issueText = issue === 'sag' ? 'Hanches trop basses : gaine les abdos et serre les fessiers' : 'Fesses trop hautes : aligne ton corps';

    if (this.cycle.state === 'work' && issue) {
      this.badFrames += 1;
      if (this.badFrames >= 4) this.repFlags.add(issue);
    }
    const ev = this.cycle.update(e);
    if (ev) {
      if (ev.type === 'full') {
        if (this.repFlags.size) this.invalid([...this.repFlags][0] === 'sag' ? 'Hanches trop basses' : 'Fesses trop hautes');
        else this.valid(null, ev.peak < 90 ? 100 : 90);
      } else if (ev.type === 'partial') {
        this.invalid('Descends plus bas (coudes à 90°)');
      } else if (ev.type === 'incomplete') {
        this.invalid('Tends complètement les bras en haut');
      }
      this.repFlags.clear();
      this.badFrames = 0;
    }

    const joints = {};
    const depthOk = this.cycle.state === 'rest' || this.cycle.reachedTarget() || e <= 100;
    color(joints, [s.sh, s.el, s.wr], depthOk ? GOOD : WARN);
    const lineLevel = ln >= 165 ? GOOD : ln >= 155 ? WARN : BAD;
    color(joints, [s.hip, footId, this.knee ? s.hip : s.kn], lineLevel);
    let feedback = null;
    if (issue && ln < 158) feedback = { text: issueText, level: BAD };
    else if (this.cycle.state === 'work' && !this.cycle.reachedTarget()) feedback = { text: 'Descends… poitrine vers le sol', level: WARN };
    else if (this.cycle.state === 'work') feedback = { text: 'Bien bas ! Pousse !', level: GOOD };
    return this.out({
      joints, feedback, metric: { label: 'Coudes', value: Math.round(e), unit: '°' }, progress: this.cycle.progress(e),
      extra: { line: Math.round(ln) },
    });
  }
}

// ---------------------------------------------------------------------------
// Squat (profil conseillé, face accepté)
// ---------------------------------------------------------------------------
export class SquatTracker extends BaseTracker {
  constructor({ jump = false } = {}) {
    super('reps');
    this.jump = jump;
    this.metricEma = new Ema(0.55);
    this.thigh = new Ema(0.1);
    this.cycle = new Cycle({ rest: 155, target: jump ? 115 : 100, partial: 135 });
    this.flagFrames = {};
  }

  flag(key, cond) {
    this.flagFrames[key] = cond ? (this.flagFrames[key] || 0) + 1 : 0;
    if (this.flagFrames[key] >= 4 && this.cycle.state === 'work') this.repFlags.add(key);
  }

  update(pts, t) {
    this.begin(t);
    const need = [LM.lHip, LM.rHip, LM.lKnee, LM.rKnee, LM.lAnkle, LM.rAnkle, LM.lShoulder, LM.rShoulder];
    const sd = bestSide(pts, ['sh', 'hip', 'kn', 'an']);
    const s = SIDE[sd];
    if (avgVis(pts, [s.sh, s.hip, s.kn, s.an]) < 0.55) return this.notReady('Recule : je dois voir tout ton corps, des épaules aux pieds');
    this.ready = true;
    const sh = pts[s.sh]; const hip = pts[s.hip]; const kn = pts[s.kn]; const an = pts[s.an];
    const shoulderW = dist(pts[LM.lShoulder], pts[LM.rShoulder]);
    const torso = dist(mid(pts[LM.lShoulder], pts[LM.rShoulder]), mid(pts[LM.lHip], pts[LM.rHip])) || 1;
    const front = avgVis(pts, need) > 0.6 && shoulderW / torso > 0.45;

    const kneeAngle = front
      ? (angle(pts[LM.lHip], pts[LM.lKnee], pts[LM.lAnkle]) + angle(pts[LM.rHip], pts[LM.rKnee], pts[LM.rAnkle])) / 2
      : angle(hip, kn, an);
    const hipsY = front ? (pts[LM.lHip].y + pts[LM.rHip].y) / 2 : hip.y;
    const kneesY = front ? (pts[LM.lKnee].y + pts[LM.rKnee].y) / 2 : kn.y;
    const thighV = kneesY - hipsY;
    if (kneeAngle > 160) this.thigh.next(thighV);
    const stand = this.thigh.value || thighV || 1;
    const ratio = Math.max(0, Math.min(1.2, thighV / stand));
    // Métrique "pseudo-angle" : de face l'angle 2D du genou est trompeur, on utilise la descente des hanches.
    const pseudo = 60 + 120 * Math.min(1, ratio);
    const raw = front ? pseudo : Math.min(kneeAngle, pseudo + 15);
    const m = this.metricEma.next(raw);

    const lean = fromVertical(hip, sh);
    this.flag('lean', !front && lean > 55 && m < 120);
    let valgus = false;
    if (front) {
      const kd = Math.abs(pts[LM.lKnee].x - pts[LM.rKnee].x);
      const ad = Math.abs(pts[LM.lAnkle].x - pts[LM.rAnkle].x);
      valgus = m < 130 && ad > 0 && kd < ad * 0.75;
      this.flag('valgus', valgus);
    }

    const ev = this.cycle.update(m);
    if (ev) {
      if (ev.type === 'full') {
        if (this.repFlags.has('valgus')) this.invalid('Genoux qui rentrent : pousse-les vers l’extérieur');
        else if (this.repFlags.has('lean')) this.invalid('Buste trop penché : poitrine fière');
        else this.valid(null, ev.peak < 95 ? 100 : 90);
      } else if (ev.type === 'partial') {
        this.invalid(this.jump ? 'Descends un peu plus avant de sauter' : 'Plus bas : cuisses parallèles au sol');
      }
      this.repFlags.clear();
      this.flagFrames = {};
    }

    const joints = {};
    const depthOk = this.cycle.state === 'rest' || this.cycle.reachedTarget() || m <= this.cycle.target * this.cycle.sign;
    color(joints, front ? [LM.lHip, LM.rHip, LM.lKnee, LM.rKnee, LM.lAnkle, LM.rAnkle] : [s.hip, s.kn, s.an], depthOk ? GOOD : WARN);
    color(joints, front ? [LM.lShoulder, LM.rShoulder] : [s.sh], lean > 55 && !front ? BAD : lean > 45 && !front ? WARN : GOOD);
    if (valgus) color(joints, [LM.lKnee, LM.rKnee], BAD);
    let feedback = null;
    if (valgus) feedback = { text: 'Pousse les genoux vers l’extérieur', level: BAD };
    else if (!front && lean > 55 && m < 130) feedback = { text: 'Redresse le buste', level: BAD };
    else if (this.cycle.state === 'work' && !this.cycle.reachedTarget()) feedback = { text: 'Descends… cuisses parallèles au sol', level: WARN };
    else if (this.cycle.state === 'work') feedback = { text: this.jump ? 'Explose vers le haut !' : 'Bonne profondeur ! Remonte', level: GOOD };
    return this.out({
      joints, feedback, metric: { label: front ? 'Profondeur' : 'Genoux', value: front ? Math.round((1 - Math.min(1, ratio)) * 100) : Math.round(m), unit: front ? '%' : '°' },
      progress: this.cycle.progress(m),
    });
  }
}

// ---------------------------------------------------------------------------
// Fentes (profil)
// ---------------------------------------------------------------------------
export class LungeTracker extends BaseTracker {
  constructor() {
    super('reps');
    this.ema = new Ema(0.55);
    this.cycle = new Cycle({ rest: 155, target: 105, partial: 135 });
  }

  update(pts, t) {
    this.begin(t);
    const ids = [LM.lHip, LM.lKnee, LM.lAnkle, LM.rHip, LM.rKnee, LM.rAnkle];
    if (avgVis(pts, ids) < 0.5) return this.notReady('Recule et mets-toi de profil : je dois voir tes deux jambes');
    this.ready = true;
    const kl = angle(pts[LM.lHip], pts[LM.lKnee], pts[LM.lAnkle]);
    const kr = angle(pts[LM.rHip], pts[LM.rKnee], pts[LM.rAnkle]);
    const m = this.ema.next(Math.min(kl, kr));
    const sh = mid(pts[LM.lShoulder], pts[LM.rShoulder]);
    const hp = mid(pts[LM.lHip], pts[LM.rHip]);
    const lean = fromVertical(hp, sh);
    if (lean > 30 && this.cycle.state === 'work') this.repFlags.add('lean');
    const ev = this.cycle.update(m);
    if (ev) {
      if (ev.type === 'full') {
        if (this.repFlags.has('lean')) this.invalid('Garde le buste bien droit');
        else this.valid();
      } else if (ev.type === 'partial') this.invalid('Descends plus : genou arrière près du sol');
      this.repFlags.clear();
    }
    const joints = {};
    const ok = this.cycle.state === 'rest' || this.cycle.reachedTarget();
    color(joints, [LM.lHip, LM.lKnee, LM.lAnkle, LM.rHip, LM.rKnee, LM.rAnkle], ok ? GOOD : WARN);
    color(joints, [LM.lShoulder, LM.rShoulder], lean > 30 ? BAD : lean > 20 ? WARN : GOOD);
    let feedback = null;
    if (lean > 30) feedback = { text: 'Buste droit !', level: BAD };
    else if (this.cycle.state === 'work' && !this.cycle.reachedTarget()) feedback = { text: 'Descends le genou arrière', level: WARN };
    return this.out({ joints, feedback, metric: { label: 'Genou', value: Math.round(m), unit: '°' }, progress: this.cycle.progress(m) });
  }
}

// ---------------------------------------------------------------------------
// Jumping jacks (de face)
// ---------------------------------------------------------------------------
export class JacksTracker extends BaseTracker {
  constructor() {
    super('reps');
    this.state = 'closed';
    this.armsTop = false;
  }

  update(pts, t) {
    this.begin(t);
    const ids = [LM.nose, LM.lShoulder, LM.rShoulder, LM.lWrist, LM.rWrist, LM.lAnkle, LM.rAnkle];
    if (avgVis(pts, ids) < 0.5) return this.notReady('Mets-toi de face, tout le corps visible');
    this.ready = true;
    const shW = dist(pts[LM.lShoulder], pts[LM.rShoulder]) || 0.1;
    const ankleD = Math.abs(pts[LM.lAnkle].x - pts[LM.rAnkle].x);
    const shY = (pts[LM.lShoulder].y + pts[LM.rShoulder].y) / 2;
    const wrY = Math.max(pts[LM.lWrist].y, pts[LM.rWrist].y); // la main la plus basse
    const armsOverhead = wrY < pts[LM.nose].y;
    const armsUp = wrY < shY;
    const armsDown = Math.min(pts[LM.lWrist].y, pts[LM.rWrist].y) > shY + shW * 0.3;
    const legsOpen = ankleD > shW * 1.15;
    const legsClosed = ankleD < shW * 0.9;
    if (this.state === 'closed' && legsOpen && armsUp) {
      this.state = 'open';
      this.armsTop = armsOverhead;
    } else if (this.state === 'open') {
      if (armsOverhead) this.armsTop = true;
      if (legsClosed && armsDown) {
        this.state = 'closed';
        if (this.armsTop) this.valid();
        else this.invalid('Monte les mains au-dessus de la tête');
      }
    }
    const joints = {};
    color(joints, [LM.lWrist, LM.rWrist, LM.lElbow, LM.rElbow], this.state === 'open' && !armsOverhead ? WARN : GOOD);
    color(joints, [LM.lAnkle, LM.rAnkle, LM.lKnee, LM.rKnee], GOOD);
    const feedback = this.state === 'open' && !armsOverhead ? { text: 'Mains plus hautes !', level: WARN } : null;
    return this.out({ joints, feedback, metric: { label: 'Écart', value: Math.round((ankleD / shW) * 100), unit: '%' }, progress: legsOpen ? 1 : 0 });
  }
}

// ---------------------------------------------------------------------------
// Gainage planche (profil) — le chrono ne tourne que si le corps est aligné
// ---------------------------------------------------------------------------
export class PlankTracker extends BaseTracker {
  constructor() {
    super('hold');
    this.line = new Ema(0.4);
    this.graceSec = 0;
  }

  update(pts, t) {
    const dt = this.begin(t);
    const sd = bestSide(pts, ['sh', 'hip', 'an']);
    const s = SIDE[sd];
    if (avgVis(pts, [s.sh, s.hip, s.an, s.el]) < 0.55) return this.notReady('Place-toi de profil, tout le corps visible');
    const sh = pts[s.sh]; const hip = pts[s.hip]; const an = pts[s.an];
    const tilt = fromHorizontal(sh, an);
    if (tilt > 35) return this.notReady('Mets-toi en position de gainage (de profil)');
    this.ready = true;
    this.activeSec += dt;
    const ln = this.line.next(angle(sh, hip, an));
    const dx = an.x - sh.x;
    const lineY = Math.abs(dx) > 1e-6 ? sh.y + (an.y - sh.y) * ((hip.x - sh.x) / dx) : hip.y;
    const dev = (hip.y - lineY) / (dist(sh, an) || 1);
    const good = ln >= 163;
    let feedback;
    if (good) {
      this.holdSec += dt;
      this.graceSec = 0;
      feedback = { text: 'Parfait, tiens bon !', level: GOOD };
    } else {
      this.graceSec += dt;
      if (this.graceSec < 0.6) this.holdSec += dt; // petite tolérance
      const msg = dev > 0 ? 'Remonte les hanches, serre les abdos' : 'Descends les fesses, corps aligné';
      feedback = { text: msg, level: ln < 155 ? BAD : WARN };
      if (this.graceSec > 0.6 && Math.floor((this.graceSec - dt) / 2) !== Math.floor(this.graceSec / 2)) {
        this.addError(msg);
        this.events.push({ type: 'cue', msg });
      }
    }
    const joints = {};
    color(joints, [s.sh, s.el, s.wr], GOOD);
    color(joints, [s.hip, s.kn, s.an], good ? GOOD : ln < 155 ? BAD : WARN);
    return this.out({ joints, feedback, metric: { label: 'Alignement', value: Math.round(ln), unit: '°' }, progress: good ? 1 : 0 });
  }
}

// ---------------------------------------------------------------------------
// Mouvements bilatéraux (curl, développé, genoux, kicks) : un cycle par côté
// ---------------------------------------------------------------------------
class BilateralTracker extends BaseTracker {
  constructor(cfg) {
    super('reps');
    this.cfg = cfg;
    this.sides = {
      L: { ema: new Ema(0.55), cycle: new Cycle(cfg.cycle), flags: new Set(), lastRep: -1e9 },
      R: { ema: new Ema(0.55), cycle: new Cycle(cfg.cycle), flags: new Set(), lastRep: -1e9 },
    };
    this.lastMerged = -1e9;
  }

  update(pts, t) {
    this.begin(t);
    const joints = {};
    let feedback = null;
    let anyVisible = false;
    let metric = null;
    let progress = 0;
    for (const sd of ['L', 'R']) {
      const s = SIDE[sd];
      const st = this.sides[sd];
      if (avgVis(pts, this.cfg.need.map((k) => s[k])) < 0.5) continue;
      anyVisible = true;
      const raw = this.cfg.metric(pts, s, sd);
      const v = st.ema.next(raw);
      const flag = this.cfg.check ? this.cfg.check(pts, s, sd, v) : null;
      if (flag && st.cycle.state === 'work') st.flags.add(flag);
      const ev = st.cycle.update(v);
      if (ev) this.handle(ev, st, t, sd);
      const lvl = flag ? BAD : st.cycle.state === 'work' && !st.cycle.reachedTarget() ? WARN : GOOD;
      color(joints, this.cfg.color.map((k) => s[k]), lvl);
      if (flag) feedback = { text: flag, level: BAD };
      const p = st.cycle.progress(v);
      if (p >= progress) {
        progress = p;
        metric = this.cfg.label ? { label: this.cfg.label, value: Math.round(this.cfg.display ? this.cfg.display(v) : v), unit: this.cfg.unit || '°' } : null;
      }
    }
    if (!anyVisible) return this.notReady(this.cfg.placement);
    this.ready = true;
    if (!feedback && this.cfg.live) feedback = this.cfg.live(pts, this);
    return this.out({ joints, feedback, metric, progress });
  }

  handle(ev, st, t, sd) {
    const flags = [...st.flags];
    st.flags.clear();
    if (ev.type !== 'full') {
      this.invalid(this.cfg.partialMsg);
      return;
    }
    if (flags.length) {
      this.invalid(flags[0]);
      return;
    }
    // Les deux bras ensemble (curl simultané) = 1 seule rep
    const other = this.sides[sd === 'L' ? 'R' : 'L'];
    st.lastRep = t;
    if (this.cfg.merge && Math.abs(t - other.lastRep) < 700 && t - this.lastMerged > 700) {
      this.lastMerged = t;
      return;
    }
    this.valid();
  }
}

export function curlTracker() {
  return new BilateralTracker({
    need: ['sh', 'el', 'wr'],
    color: ['sh', 'el', 'wr'],
    cycle: { rest: 145, target: 60, partial: 95 },
    merge: true,
    label: 'Coude',
    metric: (pts, s) => angle(pts[s.sh], pts[s.el], pts[s.wr]),
    check: (pts, s) => (angle(pts[s.el], pts[s.sh], pts[s.hip]) > 35 && avgVis(pts, [s.hip]) > 0.5 ? 'Coudes collés au corps' : null),
    partialMsg: 'Monte jusqu’en haut et redescends bras tendus',
    placement: 'Mets-toi de face ou de 3/4, bras visibles',
  });
}

export function pressTracker() {
  return new BilateralTracker({
    need: ['sh', 'el', 'wr'],
    color: ['sh', 'el', 'wr'],
    cycle: { rest: 105, target: 155, partial: 135 },
    merge: true,
    label: 'Coude',
    metric: (pts, s) => {
      const e = angle(pts[s.sh], pts[s.el], pts[s.wr]);
      return pts[s.wr].y < pts[s.sh].y ? e : Math.min(e, 90);
    },
    partialMsg: 'Tends complètement les bras au-dessus de la tête',
    placement: 'Mets-toi de face, buste et bras visibles',
  });
}

// Hauteur d'un point par rapport à la hanche, normalisée par la longueur de la cuisse/jambe.
function heightAboveHip(pts, s, key, lenKeys) {
  const len = dist(pts[s[lenKeys[0]]], pts[s[lenKeys[1]]]) + (lenKeys[2] ? dist(pts[s[lenKeys[1]]], pts[s[lenKeys[2]]]) : 0);
  return 1 + (pts[s.hip].y - pts[s[key]].y) / (len || 0.1);
}

export function kneeStrikeTracker({ high = false } = {}) {
  return new BilateralTracker({
    need: ['hip', 'kn'],
    color: ['hip', 'kn', 'an'],
    cycle: high ? { rest: 0.45, target: 0.85, partial: 0.7 } : { rest: 0.45, target: 0.95, partial: 0.75 },
    merge: false,
    label: 'Genou',
    unit: '%',
    display: (v) => v * 100,
    metric: (pts, s) => heightAboveHip(pts, s, 'kn', ['hip', 'kn']),
    check: high ? null : (pts) => guardDown(pts, 2),
    partialMsg: high ? 'Genoux plus hauts, au niveau des hanches' : 'Monte le genou plus haut',
    placement: 'Mets-toi de face ou de profil, hanches et genoux visibles',
  });
}

export function kickTracker() {
  return new BilateralTracker({
    need: ['hip', 'kn', 'an'],
    color: ['hip', 'kn', 'an'],
    cycle: { rest: 0.35, target: 0.9, partial: 0.65 },
    merge: false,
    label: 'Pied',
    unit: '%',
    display: (v) => v * 100,
    metric: (pts, s) => heightAboveHip(pts, s, 'an', ['hip', 'kn', 'an']),
    check: (pts) => guardDown(pts, 1),
    partialMsg: 'Kick plus haut : vise au moins la hauteur des hanches',
    placement: 'Recule à 3 m, de face ou de 3/4, tout le corps visible',
  });
}

export function bridgeTracker() {
  return new BilateralTracker({
    need: ['sh', 'hip', 'kn'],
    color: ['sh', 'hip', 'kn'],
    cycle: { rest: 145, target: 166, partial: 156 },
    merge: true,
    label: 'Hanches',
    metric: (pts, s) => angle(pts[s.sh], pts[s.hip], pts[s.kn]),
    partialMsg: 'Monte les hanches plus haut, serre les fessiers',
    placement: 'Allonge-toi de profil à la caméra',
  });
}

// Main basse = poignet sous l'épaule et bras pas en train de frapper (un bras tendu vers l'avant
// garde le poignet près de la hauteur d'épaule ; un bras pendant le long du corps, non).
function isExtended(pts, s) {
  const e = angle(pts[s.sh], pts[s.el], pts[s.wr]);
  const upper = dist(pts[s.sh], pts[s.el]) || 0.1;
  return e > 140 && pts[s.wr].y < pts[s.sh].y + upper * 0.6;
}

function handDown(pts, s, extendedTooLong = false) {
  const punching = isExtended(pts, s) && !extendedTooLong;
  if (extendedTooLong) return true;
  return !punching && pts[s.wr].y > pts[s.sh].y + 0.02;
}

// Garde : vrai si au moins `minDown` main(s) sont basses (et ne frappent pas)
function guardDown(pts, minDown = 1) {
  let down = 0;
  for (const sd of ['L', 'R']) {
    const s = SIDE[sd];
    if (avgVis(pts, [s.sh, s.wr, s.el]) < 0.5) continue;
    if (handDown(pts, s)) down += 1;
  }
  return down >= minDown ? 'Garde haute : mains au visage !' : null;
}

// ---------------------------------------------------------------------------
// Burpees / sprawls (profil) : debout -> planche -> debout
// ---------------------------------------------------------------------------
export class BurpeeTracker extends BaseTracker {
  constructor() {
    super('reps');
    this.ema = new Ema(0.5);
    this.cycle = new Cycle({ rest: 35, target: 62, partial: 50, leave: 0.3 });
  }

  update(pts, t) {
    this.begin(t);
    const sh = mid(pts[LM.lShoulder], pts[LM.rShoulder]);
    const hp = mid(pts[LM.lHip], pts[LM.rHip]);
    if (sh.v < 0.5 || hp.v < 0.5) return this.notReady('Recule et mets-toi de profil, tout le corps visible');
    this.ready = true;
    const m = this.ema.next(fromVertical(hp, sh));
    const ev = this.cycle.update(m);
    if (ev) {
      if (ev.type === 'full') this.valid();
      else this.invalid('Va jusqu’en planche, poitrine vers le sol');
    }
    const joints = {};
    color(joints, [11, 12, 23, 24, 25, 26, 27, 28], GOOD);
    const feedback = this.cycle.state === 'work' && this.cycle.reachedTarget() ? { text: 'Relève-toi vite !', level: GOOD } : null;
    return this.out({ joints, feedback, metric: { label: 'Buste', value: Math.round(m), unit: '°' }, progress: this.cycle.progress(m) });
  }
}

// ---------------------------------------------------------------------------
// Shadow boxing : contrôle de la garde + comptage des coups de poing et de pied
// ---------------------------------------------------------------------------
export class GuardTracker extends BaseTracker {
  constructor() {
    super('guard');
    this.punch = { L: new Cycle({ rest: 105, target: 150, partial: 135 }), R: new Cycle({ rest: 105, target: 150, partial: 135 }) };
    this.kick = { L: new Cycle({ rest: 0.35, target: 0.85, partial: 0.6 }), R: new Cycle({ rest: 0.35, target: 0.85, partial: 0.6 }) };
    this.emaE = { L: new Ema(0.6), R: new Ema(0.6) };
    this.emaK = { L: new Ema(0.6), R: new Ema(0.6) };
    this.extSec = { L: 0, R: 0 };
    this.downSec = 0;
    this.guardSec = 0;
    this.punches = 0;
    this.kicks = 0;
    this.alerts = 0;
  }

  update(pts, t) {
    const dt = this.begin(t);
    const ids = [LM.nose, LM.lShoulder, LM.rShoulder, LM.lWrist, LM.rWrist, LM.lElbow, LM.rElbow];
    if (avgVis(pts, ids) < 0.5) return this.notReady('Mets-toi de face, buste et mains visibles');
    this.ready = true;
    this.activeSec += dt;
    const joints = {};
    let handsDown = 0;
    for (const sd of ['L', 'R']) {
      const s = SIDE[sd];
      const e = this.emaE[sd].next(angle(pts[s.sh], pts[s.el], pts[s.wr]));
      const ev = this.punch[sd].update(pts[s.wr].y < pts[s.hip].y ? e : 90);
      if (ev && ev.type === 'full') {
        this.punches += 1;
        this.events.push({ type: 'hit', what: 'punch' });
      }
      // Un coup de poing dure moins d'une seconde : un bras tendu plus longtemps n'est plus en garde.
      this.extSec[sd] = isExtended(pts, s) ? this.extSec[sd] + dt : 0;
      const down = handDown(pts, s, this.extSec[sd] > 1.2);
      if (down) handsDown += 1;
      color(joints, [s.sh, s.el, s.wr], down ? BAD : GOOD);
      if (avgVis(pts, [s.hip, s.kn, s.an]) > 0.5) {
        const h = this.emaK[sd].next(heightAboveHip(pts, s, 'an', ['hip', 'kn', 'an']));
        const kev = this.kick[sd].update(h);
        if (kev && kev.type === 'full') {
          this.kicks += 1;
          this.events.push({ type: 'hit', what: 'kick' });
        }
        color(joints, [s.hip, s.kn, s.an], GOOD);
      }
    }
    let feedback;
    if (handsDown) {
      this.downSec += dt;
      if (this.downSec > 0.8) {
        feedback = { text: 'Garde haute ! Mains au visage', level: BAD };
        if (this.downSec - dt <= 0.8) {
          this.alerts += 1;
          this.addError('Garde basse');
          this.events.push({ type: 'cue', msg: 'Garde haute !' });
        }
      } else {
        feedback = { text: 'Ramène la main', level: WARN };
      }
    } else {
      this.downSec = 0;
      this.guardSec += dt;
      feedback = { text: 'Bonne garde', level: GOOD };
    }
    this.holdSec = this.guardSec;
    this.reps = this.punches + this.kicks;
    const pct = this.activeSec > 0 ? Math.round((this.guardSec / this.activeSec) * 100) : 100;
    return this.out({ joints, feedback, metric: { label: 'Garde', value: pct, unit: '%' }, progress: pct / 100, extra: { punches: this.punches, kicks: this.kicks } });
  }

  summary() {
    const pct = this.activeSec > 0 ? Math.round((this.guardSec / this.activeSec) * 100) : 0;
    return {
      ...super.summary(), score: pct, punches: this.punches, kicks: this.kicks, alerts: this.alerts,
    };
  }
}

// ---------------------------------------------------------------------------
// Registre
// ---------------------------------------------------------------------------
export const TRACKERS = {
  pushup: { label: 'Pompes', mode: 'reps', view: 'Profil', place: 'Pose le téléphone au sol, de profil, à environ 2 m. Tout ton corps doit être dans l’image.', make: () => new PushupTracker() },
  knee_pushup: { label: 'Pompes sur les genoux', mode: 'reps', view: 'Profil', place: 'Téléphone au sol, de profil, à 2 m.', make: () => new PushupTracker({ knee: true }) },
  squat: { label: 'Squats', mode: 'reps', view: 'Profil ou 3/4', place: 'Téléphone à hauteur de hanches, de profil (ou de 3/4), à 2-3 m.', make: () => new SquatTracker() },
  jump_squat: { label: 'Squats sautés', mode: 'reps', view: 'Profil ou face', place: 'Téléphone à hauteur de hanches, à 3 m.', make: () => new SquatTracker({ jump: true }) },
  lunge: { label: 'Fentes', mode: 'reps', view: 'Profil', place: 'De profil, à 2-3 m, les deux jambes visibles.', make: () => new LungeTracker() },
  jacks: { label: 'Jumping jacks', mode: 'reps', view: 'Face', place: 'De face, à 3 m, bras levés compris dans l’image.', make: () => new JacksTracker() },
  plank: { label: 'Gainage planche', mode: 'hold', view: 'Profil', place: 'Téléphone au sol, de profil, à 2 m.', make: () => new PlankTracker() },
  curl: { label: 'Curl biceps', mode: 'reps', view: 'Face ou 3/4', place: 'De face ou de 3/4, buste et bras visibles.', make: () => curlTracker() },
  press: { label: 'Développé épaules', mode: 'reps', view: 'Face', place: 'De face, mains au-dessus de la tête visibles.', make: () => pressTracker() },
  bridge: { label: 'Pont fessier', mode: 'reps', view: 'Profil', place: 'Allongé, de profil, téléphone au sol à 1,5 m.', make: () => bridgeTracker() },
  high_knees: { label: 'Montées de genoux', mode: 'reps', view: 'Face ou profil', place: 'À 2-3 m, hanches et genoux visibles.', make: () => kneeStrikeTracker({ high: true }) },
  burpee: { label: 'Burpees / sprawls', mode: 'reps', view: 'Profil', place: 'De profil, à 3 m, tout le corps visible.', make: () => new BurpeeTracker() },
  kicks: { label: 'Coups de pied', mode: 'reps', view: 'Face ou 3/4', place: 'Recule à 3 m, tout le corps visible.', make: () => kickTracker() },
  knees: { label: 'Coups de genou', mode: 'reps', view: 'Face ou 3/4', place: 'À 2-3 m, de face ou de 3/4.', make: () => kneeStrikeTracker() },
  guard: { label: 'Shadow boxing (garde)', mode: 'guard', view: 'Face', place: 'De face, à 2-3 m, du haut du corps jusqu’aux pieds si possible.', make: () => new GuardTracker() },
};
