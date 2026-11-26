import { Fragment } from 'preact';
import { IconCopy } from '../components/Icons';
import { Bar, Tickets } from '../components/ui';
import { addDays, formatLong, formatMonth, relativeDay, weekStart } from '../lib/dates';
import { toast } from '../lib/effects';
import { ACHIEVEMENTS, fmt, formatMinutes, streakUnit, weeklyReport, type Derived } from '../lib/logic';
import type { DateKey, State } from '../lib/types';

const WEEKS = 18;

function Heatmap({ byDay, today }: { byDay: Map<DateKey, number>; today: DateKey }) {
  const first = addDays(weekStart(today), -(WEEKS - 1) * 7);
  let max = 0;
  let active = 0;
  for (let d = first; d <= today; d = addDays(d, 1)) {
    const v = byDay.get(d) ?? 0;
    max = Math.max(max, v);
    if (v > 0) active++;
  }
  const cells = [];
  let lastMonth = '';
  for (let w = 0; w < WEEKS; w++) {
    const ws = addDays(first, w * 7);
    const month = ws.slice(0, 7);
    cells.push(
      <span class="m" key={`m${w}`}>
        {month !== lastMonth ? formatMonth(ws) : ''}
      </span>,
    );
    lastMonth = month;
    for (let i = 0; i < 7; i++) {
      const d = addDays(ws, i);
      const v = byDay.get(d) ?? 0;
      const level = v === 0 || max === 0 ? 0 : Math.max(1, Math.ceil((v / max) * 4));
      const future = d > today;
      cells.push(
        <span
          key={d}
          class={`c${d === today ? ' today' : ''}${future ? ' future' : ''}`}
          data-l={level}
          title={future ? undefined : `${formatLong(d)} : ${fmt(v)} tickets`}
        />,
      );
    }
  }
  return (
    <div class="section">
      <div class="heatmap-wrap" role="img" aria-label={`Calendrier des tickets gagnés : ${active} jours actifs sur les ${WEEKS} dernières semaines`}>
        <div class="heatmap">
          {cells}
        </div>
      </div>
      <div class="row" style={{ justifyContent: 'space-between' }}>
        <span class="muted small">
          {active} jour{active > 1 ? 's' : ''} actif{active > 1 ? 's' : ''} sur {WEEKS} semaines (lundi en haut)
        </span>
        <span class="heat-legend" aria-hidden="true">
          Moins
          {[0, 1, 2, 3, 4].map((l) => (
            <i key={l} style={{ background: `var(--heat-${l})` }} />
          ))}
          Plus
        </span>
      </div>
    </div>
  );
}

type Event = { key: string; date: DateKey; at: number; emoji: string; label: string; amount: number };

function history(state: State): Event[] {
  const habits = new Map(state.habits.map((h) => [h.id, h]));
  const events: Event[] = [
    ...state.completions.map((c) => {
      const h = habits.get(c.habitId);
      return { key: c.id, date: c.date, at: c.at, emoji: h?.emoji ?? '✅', label: h?.name ?? 'Habitude supprimée', amount: c.points };
    }),
    ...state.focus.map((f) => ({ key: f.id, date: f.date, at: f.at, emoji: '🎯', label: `Focus ${f.minutes} min`, amount: f.points })),
    ...state.purchases.map((p) => ({ key: p.id, date: p.date, at: p.at, emoji: p.emoji, label: p.name, amount: -p.cost })),
  ];
  return events.sort((a, b) => (a.date === b.date ? b.at - a.at : a.date < b.date ? 1 : -1)).slice(0, 20);
}

export function Progress({ state, derived, today }: { state: State; derived: Derived; today: DateKey }) {
  const { level, totals } = derived;
  const unlocked = new Set(state.unlocked);
  const habits = state.habits.filter((h) => !h.archived && h.frequency.type !== 'once');
  const focusMinutes = state.focus.reduce((s, f) => s + f.minutes, 0);
  const events = history(state);

  async function copyReport() {
    const text = weeklyReport(state, derived, today);
    try {
      await navigator.clipboard.writeText(text);
      toast('📋', 'Bilan copié', 'Colle-le dans Discord avec Ctrl+V.');
    } catch {
      const area = document.getElementById('report-text') as HTMLTextAreaElement | null;
      area?.select();
      toast('📋', 'Sélectionne le texte et copie-le', 'La copie automatique est bloquée ici.');
    }
  }

  return (
    <div class="page">
      <h1 style={{ fontSize: '1.7rem', fontWeight: 800 }}>Progrès</h1>

      <section class="card level-card">
        <div class="level-badge" aria-hidden="true">
          {level.level}
        </div>
        <h2>
          Niveau {level.level} · {level.title}
        </h2>
        <Bar value={level.progress} />
        <span class="muted small">
          {fmt(level.current)} / {fmt(level.needed)} XP avant le niveau {level.level + 1}. Chaque ticket gagné compte comme 1 XP, même si tu le dépenses.
        </span>
      </section>

      <section class="kpis">
        <div class="kpi">
          <span class="label">Solde</span>
          <strong>{fmt(totals.balance)}</strong>
          <span class="muted small">tickets</span>
        </div>
        <div class="kpi">
          <span class="label">Coches</span>
          <strong>{fmt(state.completions.length)}</strong>
          <span class="muted small">au total</span>
        </div>
        <div class="kpi">
          <span class="label">Jours parfaits</span>
          <strong>{derived.perfectDays}</strong>
          <span class="muted small">record : {derived.bestPerfectRun} d’affilée</span>
        </div>
        <div class="kpi">
          <span class="label">Focus</span>
          <strong>{formatMinutes(focusMinutes)}</strong>
          <span class="muted small">{state.focus.length} sessions</span>
        </div>
      </section>

      <section class="card section">
        <div class="section-title">
          <h2>Tickets gagnés par jour</h2>
          <Tickets n={totals.earned} ghost />
        </div>
        <Heatmap byDay={derived.byDay} today={today} />
      </section>

      <section class="card section">
        <div class="section-title">
          <h2>Bilan pour Discord</h2>
        </div>
        <p class="muted small" style={{ margin: 0 }}>
          Ton résumé des 7 derniers jours, déjà mis en forme : colle-le dans un salon pour te motiver avec tes potes.
        </p>
        <textarea id="report-text" class="input" readOnly rows={6} style={{ resize: 'none', fontSize: '0.85rem' }} value={weeklyReport(state, derived, today)} />
        <button class="btn" onClick={copyReport}>
          <IconCopy /> Copier mon bilan
        </button>
      </section>

      {habits.length > 0 && (
        <section class="card section">
          <h2 style={{ fontSize: '1.05rem' }}>Séries</h2>
          <div style={{ overflowX: 'auto' }}>
            <table class="streak-table">
              <thead>
                <tr>
                  <th>Habitude</th>
                  <th>En cours</th>
                  <th>Record</th>
                </tr>
              </thead>
              <tbody>
                {habits.map((h) => {
                  const s = derived.streaks.get(h.id) ?? { current: 0, best: 0 };
                  return (
                    <tr key={h.id}>
                      <td>
                        {h.emoji} {h.name}
                      </td>
                      <td class={s.current > 0 ? 'flame' : 'muted'}>
                        {s.current > 0 ? `🔥 ${s.current} ${streakUnit(h.frequency, s.current)}` : '—'}
                      </td>
                      <td>
                        {s.best} {streakUnit(h.frequency, s.best)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section class="section">
        <div class="section-title">
          <h2>Succès</h2>
          <span class="muted small">
            {ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).length} / {ACHIEVEMENTS.length}
          </span>
        </div>
        <div class="badges">
          {ACHIEVEMENTS.map((a) => (
            <div class={`badge${unlocked.has(a.id) ? '' : ' off'}`} key={a.id}>
              <span class="e" aria-hidden="true">
                {a.emoji}
              </span>
              <b>{a.title}</b>
              <span>{a.description}</span>
            </div>
          ))}
        </div>
      </section>

      {events.length > 0 && (
        <section class="section">
          <h2 style={{ fontSize: '1.05rem' }}>Historique</h2>
          <ul class="card history" style={{ paddingBlock: '4px' }}>
            {events.map((e, i) => (
              <Fragment key={e.key}>
                {(i === 0 || events[i - 1].date !== e.date) && (
                  <li class="day">
                    {relativeDay(e.date, today)}
                  </li>
                )}
                <li>
                  <span aria-hidden="true">{e.emoji}</span>
                  <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{e.label}</span>
                  <span class={`amount ${e.amount >= 0 ? 'plus' : 'minus'}`}>
                    {e.amount >= 0 ? '+' : '−'}
                    {fmt(Math.abs(e.amount))}
                  </span>
                </li>
              </Fragment>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
