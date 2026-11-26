import { migrate } from './state';
import type { Completion, FocusSession, Purchase, State } from './types';

/**
 * Découpage de l'état en documents pour le stockage en ligne :
 *  - « meta » : habitudes, récompenses, réglages…
 *  - « log-AAAA-MM » : l'historique d'un mois (coches, achats, sessions focus)
 * Chaque document reste petit, même après des années d'utilisation.
 */
export type Docs = Record<string, Record<string, unknown>>;

interface MonthLog {
  completions: Completion[];
  purchases: Purchase[];
  focus: FocusSession[];
}

export const META = 'meta';
const monthDoc = (date: string) => `log-${date.slice(0, 7)}`;

export function splitState(s: State): Docs {
  const { completions, purchases, focus, ...meta } = s;
  const docs: Docs = { [META]: meta };
  const month = (date: string): MonthLog => {
    const key = monthDoc(date);
    return (docs[key] ??= { completions: [], purchases: [], focus: [] }) as unknown as MonthLog;
  };
  for (const c of completions) month(c.date).completions.push(c);
  for (const p of purchases) month(p.date).purchases.push(p);
  for (const f of focus) month(f.date).focus.push(f);
  return docs;
}

export function joinDocs(docs: Docs): State | null {
  const meta = docs[META];
  if (!meta) return null;
  const all: MonthLog = { completions: [], purchases: [], focus: [] };
  for (const key of Object.keys(docs).sort()) {
    if (!key.startsWith('log-')) continue;
    const log = docs[key] as Partial<MonthLog>;
    all.completions.push(...(log.completions ?? []));
    all.purchases.push(...(log.purchases ?? []));
    all.focus.push(...(log.focus ?? []));
  }
  return migrate({ ...meta, ...all });
}

/** JSON avec les clés triées, pour comparer deux documents sans se soucier de l'ordre */
export function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .filter((k) => o[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(v) ?? 'null';
}
