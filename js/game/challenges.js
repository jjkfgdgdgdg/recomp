// Défis entre amis SANS serveur : le défi et les scores voyagent dans un lien à partager
// (WhatsApp, SMS, Snap…). Chaque ami ajoute son score et renvoie le lien. 100 % gratuit, aucun compte.
import { hashString } from '../engine/random.js';

export const CHALLENGES = [
  { id: 'push60', label: 'Pompes en 1 minute', emoji: '🫸', tracker: 'pushup', secs: 60, unit: 'reps' },
  { id: 'squat60', label: 'Squats en 1 minute', emoji: '🏋️', tracker: 'squat', secs: 60, unit: 'reps' },
  { id: 'jacks60', label: 'Jumping jacks en 1 minute', emoji: '⭐', tracker: 'jacks', secs: 60, unit: 'reps' },
  { id: 'burpee60', label: 'Burpees en 1 minute', emoji: '🔥', tracker: 'burpee', secs: 60, unit: 'reps' },
  { id: 'kicks60', label: 'Coups de pied en 1 minute', emoji: '🦵', tracker: 'kicks', secs: 60, unit: 'reps' },
  { id: 'pullmax', label: 'Max tractions', emoji: '🧗', tracker: 'pullup', secs: null, unit: 'reps' },
  { id: 'plankmax', label: 'Gainage le plus long', emoji: '🧱', tracker: 'plank', secs: null, unit: 's' },
  { id: 'wallsit', label: 'Chaise la plus longue', emoji: '🪑', tracker: 'wall_sit', secs: null, unit: 's' },
];
export const CHALLENGE = Object.fromEntries(CHALLENGES.map((c) => [c.id, c]));

const SALT = 'recomp-defi-v1';

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function newChallenge(type, creator, today, rand = Math.random) {
  if (!CHALLENGE[type]) throw new Error('Défi inconnu');
  return { v: 1, id: Math.floor(rand() * 36 ** 6).toString(36).padStart(6, '0'), c: type, t: today, by: cleanName(creator), s: [] };
}

export function cleanName(n) {
  return String(n || 'Anonyme').replace(/[<>"]/g, '').trim().slice(0, 20) || 'Anonyme';
}

/** Ajoute (ou améliore) le score d'un joueur. score = { name, value, cam: bool, date } */
export function addScore(ch, { name, value, cam, date }) {
  const n = cleanName(name);
  const v = Math.max(0, Math.round(Number(value) || 0));
  const out = { ...ch, s: ch.s.map((x) => [...x]) };
  const i = out.s.findIndex((x) => x[0].toLowerCase() === n.toLowerCase());
  const entry = [n, v, cam ? 1 : 0, date];
  if (i < 0) out.s.push(entry);
  else if (v > out.s[i][1] || (v === out.s[i][1] && cam && !out.s[i][2])) out.s[i] = entry;
  out.s = out.s.slice(0, 30);
  return out;
}

/** Fusionne deux versions du même défi (garde le meilleur score de chacun). */
export function mergeChallenges(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (a.id !== b.id) throw new Error('Défis différents');
  let out = { ...a, s: a.s.map((x) => [...x]) };
  b.s.forEach(([name, value, cam, date]) => { out = addScore(out, { name, value, cam: !!cam, date }); });
  return out;
}

export function ranking(ch) {
  return [...ch.s].sort((x, y) => y[1] - x[1] || (y[2] - x[2])).map(([name, value, cam, date], i) => ({ rank: i + 1, name, value, cam: !!cam, date }));
}

export function encodeChallenge(ch) {
  const json = JSON.stringify({ v: ch.v, id: ch.id, c: ch.c, t: ch.t, by: ch.by, s: ch.s });
  const sum = hashString(json + SALT).toString(36);
  return `${toBase64Url(json)}.${sum}`;
}

export function decodeChallenge(code) {
  if (String(code || '').length > 6000) throw new Error('Lien de défi trop long');
  const [data, sum] = String(code || '').split('.');
  if (!data || !sum) throw new Error('Lien de défi incomplet');
  const json = fromBase64Url(data);
  if (hashString(json + SALT).toString(36) !== sum) throw new Error('Lien de défi modifié ou abîmé');
  const ch = JSON.parse(json);
  if (ch.v !== 1 || !CHALLENGE[ch.c] || !Array.isArray(ch.s)) throw new Error('Défi non reconnu');
  ch.s = ch.s.filter((x) => Array.isArray(x) && x.length >= 2).map(([n, v, c, d]) => [cleanName(n), Math.max(0, Math.round(Number(v) || 0)), c ? 1 : 0, String(d || '').slice(0, 10)]);
  ch.by = cleanName(ch.by);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(ch.t))) ch.t = '2026-01-01';
  ch.id = String(ch.id || '').replace(/[^a-z0-9]/gi, '').slice(0, 12) || 'defi';
  ch.s = ch.s.slice(0, 30).map(([n, v, c, d]) => [n, v, c, /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '']);
  return ch;
}
