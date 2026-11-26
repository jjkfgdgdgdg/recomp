import { useState } from 'preact/hooks';
import { HabitForm } from '../components/Forms';
import { IconDown, IconEdit, IconPlus, IconUp } from '../components/Icons';
import { toast } from '../lib/effects';
import { frequencyLabel, streakUnit, type Derived } from '../lib/logic';
import { uid } from '../lib/state';
import { dispatch } from '../lib/store';
import { HABIT_TEMPLATES } from '../lib/templates';
import type { DateKey, Habit, State } from '../lib/types';

export function Habits({ state, derived, today }: { state: State; derived: Derived; today: DateKey }) {
  const [editing, setEditing] = useState<Habit | 'new' | null>(null);
  const habits = state.habits.filter((h) => !h.archived);
  const names = new Set(habits.map((h) => h.name));
  const suggestions = HABIT_TEMPLATES.filter((t) => !names.has(t.name));

  return (
    <div class="page">
      <div class="page-head">
        <h1>Mes habitudes</h1>
        <button class="btn" onClick={() => setEditing('new')}>
          <IconPlus /> Ajouter
        </button>
      </div>

      {habits.length === 0 ? (
        <div class="empty">
          <strong>Aucune habitude pour l’instant.</strong>
          <span>Crée la tienne ou pioche dans les idées ci-dessous.</span>
        </div>
      ) : (
        <ul class="habit-list">
          {habits.map((h, i) => {
            const s = derived.streaks.get(h.id);
            return (
              <li key={h.id} class="manage-row">
                <span class="emoji" aria-hidden="true">
                  {h.emoji}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{h.name}</div>
                  <div class="muted small">
                    {frequencyLabel(h.frequency)} · {h.points} tickets
                    {s && s.current > 0 && (
                      <span class="flame">
                        {' '}
                        · 🔥 {s.current} {streakUnit(h.frequency, s.current)}
                      </span>
                    )}
                  </div>
                </div>
                <div class="actions">
                  <button class="icon-btn" aria-label={`Monter ${h.name}`} disabled={i === 0} onClick={() => dispatch({ type: 'moveHabit', id: h.id, dir: -1 })}>
                    <IconUp />
                  </button>
                  <button
                    class="icon-btn"
                    aria-label={`Descendre ${h.name}`}
                    disabled={i === habits.length - 1}
                    onClick={() => dispatch({ type: 'moveHabit', id: h.id, dir: 1 })}
                  >
                    <IconDown />
                  </button>
                  <button class="icon-btn" aria-label={`Modifier ${h.name}`} onClick={() => setEditing(h)}>
                    <IconEdit />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {suggestions.length > 0 && (
        <section class="section">
          <div class="section-title">
            <h2>Idées d’habitudes</h2>
            <span class="muted small">Touche pour ajouter</span>
          </div>
          <div class="pick-grid">
            {suggestions.map((t) => (
              <button
                class="chip"
                key={t.name}
                onClick={() => {
                  dispatch({ type: 'saveHabit', habit: { ...t, id: uid(), createdAt: today } });
                  toast(t.emoji, `« ${t.name} » ajoutée`);
                }}
              >
                {t.emoji} {t.name} <small>{t.points}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      {editing && (
        <HabitForm
          habit={editing === 'new' ? undefined : editing}
          today={today}
          onClose={() => setEditing(null)}
          onSave={(habit) => {
            dispatch({ type: 'saveHabit', habit });
            toast(habit.emoji, editing === 'new' ? 'Habitude ajoutée' : 'Habitude enregistrée');
            setEditing(null);
          }}
          onDelete={
            editing === 'new'
              ? undefined
              : () => {
                  dispatch({ type: 'archiveHabit', id: editing.id });
                  setEditing(null);
                }
          }
        />
      )}
    </div>
  );
}
