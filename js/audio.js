// Sons (Web Audio) et voix du coach (synthèse vocale du navigateur, gratuite et hors ligne selon l'appareil).
import { getState } from './store.js';

let ctx = null;
function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// À appeler sur un geste utilisateur (iOS exige un clic pour activer le son).
export function unlockAudio() {
  audio();
  if ('speechSynthesis' in window) {
    try { speechSynthesis.getVoices(); } catch { /* ignore */ }
  }
}

function soundOn() {
  return getState().settings.sound !== false;
}

export function beep(freq = 880, dur = 0.12, vol = 0.25, type = 'sine') {
  if (!soundOn()) return;
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur + 0.02);
}

// Cloche de ring de boxe : plusieurs harmoniques avec décroissance longue.
export function bell(times = 1) {
  if (!soundOn()) return;
  const a = audio();
  if (!a) return;
  for (let k = 0; k < times; k += 1) {
    const t0 = a.currentTime + k * 0.35;
    [1, 2.76, 5.4, 8.93].forEach((m, i) => {
      const o = a.createOscillator();
      const g = a.createGain();
      o.frequency.value = 620 * m;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.35 / (i + 1), t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6 / (i + 1));
      o.connect(g).connect(a.destination);
      o.start(t0);
      o.stop(t0 + 1.7);
    });
  }
}

export function clap() {
  beep(1500, 0.05, 0.3, 'square');
  setTimeout(() => beep(1500, 0.05, 0.3, 'square'), 140);
}

export function countdownBeep(n) {
  if (n > 0) beep(660, 0.12, 0.25);
  else beep(990, 0.35, 0.3);
}

export function success() {
  beep(660, 0.1, 0.2);
  setTimeout(() => beep(880, 0.1, 0.2), 110);
  setTimeout(() => beep(1320, 0.2, 0.2), 220);
}

let voices = { any: null, male: null };
function pickVoice(prefer) {
  if (!('speechSynthesis' in window)) return null;
  if (!voices.any) {
    const all = speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('fr'));
    const fr = all.filter((v) => v.lang === 'fr-FR');
    const list = fr.length ? fr : all;
    voices.any = list.find((v) => /google|natural|premium|enhanced/i.test(v.name)) || list[0] || null;
    // Voix masculines courantes selon les systèmes (macOS, Windows, Android, Chrome)
    voices.male = list.find((v) => /thomas|paul|henri|mathieu|nicolas|daniel|claude|antoine|gilles|male|homme/i.test(v.name)) || null;
  }
  return (prefer === 'male' && voices.male) || voices.any;
}
if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = () => { voices = { any: null, male: null }; pickVoice(); };
}

let lastSpoken = { text: '', at: 0 };
/**
 * Fait parler le coach.
 * opts.interrupt coupe la phrase en cours ; opts.queue la met en file d'attente ;
 * opts.minGap évite de répéter la même phrase trop souvent ; opts.pitch / opts.prefer règlent la voix.
 */
export function speak(text, {
  interrupt = false, queue = false, minGap = 0, rate = 1.08, pitch = 1, prefer = null,
} = {}) {
  if (!text || getState().settings.voice === false || !('speechSynthesis' in window)) return;
  const now = performance.now();
  if (minGap && lastSpoken.text === text && now - lastSpoken.at < minGap) return;
  if (!interrupt && !queue && speechSynthesis.speaking && now - lastSpoken.at < 1200) return;
  if (interrupt) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'fr-FR';
  const v = pickVoice(prefer);
  if (v) u.voice = v;
  u.rate = rate;
  u.pitch = pitch;
  speechSynthesis.speak(u);
  lastSpoken = { text, at: now };
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

// Garde l'écran allumé pendant les séances (si le navigateur le permet).
let wakeLock = null;
export async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch { /* non supporté */ }
}

export function vibrate(p = 60) {
  try { navigator.vibrate?.(p); } catch { /* ignore */ }
}
