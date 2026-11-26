// Utilitaires de dates (format local AAAA-MM-JJ, lundi = 0).
export const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const DAY_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const pad = (n) => String(n).padStart(2, '0');

export function toISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function todayISO(now = new Date()) {
  return toISO(now);
}

export function weekday(iso) {
  return (fromISO(iso).getDay() + 6) % 7;
}

export function addDays(iso, n) {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function daysBetween(aIso, bIso) {
  return Math.round((fromISO(bIso) - fromISO(aIso)) / 86400000);
}

export function mondayOf(iso) {
  return addDays(iso, -weekday(iso));
}

export function prettyDate(iso) {
  const d = fromISO(iso);
  return `${DAY_NAMES[weekday(iso)]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function shortDate(iso) {
  const d = fromISO(iso);
  return `${d.getDate()}/${pad(d.getMonth() + 1)}`;
}

export function formatDuration(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${pad(s)}`;
}
