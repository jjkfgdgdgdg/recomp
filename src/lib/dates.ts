import type { DateKey } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

export function toKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(k: DateKey): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(k: DateKey, n: number): DateKey {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

/** Date du jour, en tenant compte de l'heure à laquelle la journée bascule. */
export function todayKey(now: number = Date.now(), dayEndHour = 0): DateKey {
  return toKey(new Date(now - dayEndHour * 3_600_000));
}

/** 0 = lundi … 6 = dimanche */
export function weekday(k: DateKey): number {
  return (fromKey(k).getDay() + 6) % 7;
}

/** Lundi de la semaine de k */
export function weekStart(k: DateKey): DateKey {
  return addDays(k, -weekday(k));
}

export function daysBetween(a: DateKey, b: DateKey): number {
  return Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86_400_000);
}

const longFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const shortFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'short' });

export function formatLong(k: DateKey): string {
  return longFmt.format(fromKey(k));
}

export function formatShort(k: DateKey): string {
  return shortFmt.format(fromKey(k));
}

export function formatMonth(k: DateKey): string {
  return monthFmt.format(fromKey(k)).replace('.', '');
}

/** « aujourd'hui », « hier » ou la date en toutes lettres */
export function relativeDay(k: DateKey, today: DateKey): string {
  const diff = daysBetween(k, today);
  if (diff === 0) return "aujourd'hui";
  if (diff === 1) return 'hier';
  if (diff === 2) return 'avant-hier';
  return formatLong(k);
}

export const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const DAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
