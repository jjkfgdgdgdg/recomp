import { useEffect, useState } from 'preact/hooks';

// ------------------------------------------------------------------ Notifications à l'écran

export interface Toast {
  id: number;
  emoji: string;
  title: string;
  text?: string;
}

let toasts: Toast[] = [];
let nextId = 1;
const toastListeners = new Set<() => void>();

export function toast(emoji: string, title: string, text?: string, ms = 3200) {
  const t = { id: nextId++, emoji, title, text };
  toasts = [...toasts.slice(-2), t];
  toastListeners.forEach((l) => l());
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    toastListeners.forEach((l) => l());
  }, ms);
}

export function useToasts(): Toast[] {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    toastListeners.add(l);
    return () => {
      toastListeners.delete(l);
    };
  }, []);
  return toasts;
}

// ------------------------------------------------------------------ Sons (synthétisés, aucun fichier)

let ctx: AudioContext | null = null;
let soundOn = true;

export function setSoundEnabled(on: boolean) {
  soundOn = on;
}

/** À appeler pendant un clic : les navigateurs n'autorisent le son qu'après une interaction. */
export function unlockAudio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.12) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export type Sound = 'check' | 'buy' | 'level' | 'bell';

export function play(sound: Sound) {
  if (!soundOn || !ctx || ctx.state !== 'running') return;
  switch (sound) {
    case 'check':
      tone(880, 0, 0.12, 'triangle');
      tone(1320, 0.07, 0.18, 'triangle');
      break;
    case 'buy':
      tone(1046, 0, 0.1, 'square', 0.06);
      tone(1568, 0.08, 0.3, 'square', 0.06);
      break;
    case 'level':
      [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.25, 'triangle'));
      break;
    case 'bell':
      tone(660, 0, 1.2, 'sine', 0.18);
      tone(990, 0.02, 1.0, 'sine', 0.08);
      tone(660, 0.6, 1.2, 'sine', 0.15);
      break;
  }
}

// ------------------------------------------------------------------ Confettis

const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function confetti(count = 120) {
  if (reduceMotion()) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  document.body.appendChild(canvas);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = (canvas.width = innerWidth * dpr);
  const h = (canvas.height = innerHeight * dpr);
  const g = canvas.getContext('2d');
  if (!g) return canvas.remove();
  const style = getComputedStyle(document.documentElement);
  const colors = ['--ticket', '--accent', '--good', '--flame'].map((v) => style.getPropertyValue(v).trim() || '#f2a900');
  const parts = Array.from({ length: count }, () => ({
    x: w / 2 + (Math.random() - 0.5) * w * 0.3,
    y: h * 0.35,
    vx: (Math.random() - 0.5) * 18 * dpr,
    vy: (-Math.random() * 16 - 6) * dpr,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.4,
    s: (Math.random() * 6 + 5) * dpr,
    c: colors[Math.floor(Math.random() * colors.length)],
  }));
  const t0 = performance.now();
  const frame = (t: number) => {
    g.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.vy += 0.55 * dpr;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.r);
      g.fillStyle = p.c;
      g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      g.restore();
    }
    if (t - t0 < 2600) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ Écran allumé pendant le focus

let lock: { release(): Promise<void> } | null = null;

export async function keepScreenOn(on: boolean) {
  try {
    if (on && !lock) {
      const nav = navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<{ release(): Promise<void> }> } };
      lock = (await nav.wakeLock?.request('screen')) ?? null;
    } else if (!on && lock) {
      await lock.release();
      lock = null;
    }
  } catch {
    lock = null;
  }
}
