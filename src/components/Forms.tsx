import { useState } from 'preact/hooks';
import { DAY_LETTERS, DAY_NAMES } from '../lib/dates';
import { streakSteps } from '../lib/logic';
import { uid } from '../lib/state';
import { EMOJI_CHOICES, REWARD_EMOJIS } from '../lib/templates';
import type { DateKey, Frequency, Habit, Reward } from '../lib/types';
import { Sheet } from './ui';

const POINT_PRESETS = [5, 10, 15, 20, 30, 50];
const COST_PRESETS = [30, 60, 120, 300, 500, 1000];

function EmojiPicker({ value, choices, onChange }: { value: string; choices: string[]; onChange(e: string): void }) {
  return (
    <div class="field">
      <span>Icône</span>
      <div class="emoji-grid">
        {choices.map((e) => (
          <button type="button" key={e} aria-pressed={value === e} onClick={() => onChange(e)}>
            {e}
          </button>
        ))}
      </div>
      <input
        id="emoji-custom"
        class="input"
        style={{ maxWidth: '160px' }}
        value={value}
        maxLength={4}
        aria-label="Ou tape ton propre emoji"
        onInput={(e) => onChange((e.currentTarget as HTMLInputElement).value)}
      />
    </div>
  );
}

const FREQ_TYPES: { type: Frequency['type']; label: string }[] = [
  { type: 'daily', label: 'Tous les jours' },
  { type: 'days', label: 'Certains jours' },
  { type: 'weekly', label: 'X fois / semaine' },
  { type: 'once', label: 'Une fois' },
];

export function HabitForm({ habit, today, onSave, onDelete, onClose }: {
  habit?: Habit;
  today: DateKey;
  onSave(h: Habit): void;
  onDelete?(): void;
  onClose(): void;
}) {
  const [name, setName] = useState(habit?.name ?? '');
  const [emoji, setEmoji] = useState(habit?.emoji ?? '✨');
  const [points, setPoints] = useState(habit?.points ?? 10);
  const [freq, setFreq] = useState<Frequency>(habit?.frequency ?? { type: 'daily' });
  const [days, setDays] = useState<number[]>(habit?.frequency.type === 'days' ? habit.frequency.days : [0, 1, 2, 3, 4]);
  const [times, setTimes] = useState(habit?.frequency.type === 'weekly' ? habit.frequency.times : 3);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const frequency: Frequency =
    freq.type === 'days' ? { type: 'days', days: [...days].sort() } : freq.type === 'weekly' ? { type: 'weekly', times } : { type: freq.type };
  const valid = name.trim().length > 0 && points > 0 && (frequency.type !== 'days' || days.length > 0);
  const steps = streakSteps(frequency);

  return (
    <Sheet title={habit ? 'Modifier l’habitude' : 'Nouvelle habitude'} onClose={onClose}>
      <form
        class="section"
        style={{ gap: '18px' }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSave({
            id: habit?.id ?? uid(),
            createdAt: habit?.createdAt ?? today,
            name: name.trim(),
            emoji: emoji.trim() || '✨',
            points,
            frequency,
          });
        }}
      >
        <label class="field">
          <span>Nom</span>
          <input
            id="habit-name"
            class="input"
            value={name}
            maxLength={60}
            placeholder="Ex. : Lire 20 minutes"
            autoFocus={!habit}
            onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
          />
        </label>

        <EmojiPicker value={emoji} choices={EMOJI_CHOICES} onChange={setEmoji} />

        <div class="field">
          <span>Tickets gagnés</span>
          <div class="seg">
            {POINT_PRESETS.map((p) => (
              <button type="button" key={p} aria-pressed={points === p} onClick={() => setPoints(p)}>
                {p}
              </button>
            ))}
            <input
              id="habit-points"
              class="input"
              type="number"
              min={1}
              max={1000}
              style={{ width: '92px' }}
              value={points}
              aria-label="Nombre de tickets"
              onInput={(e) => setPoints(Math.max(0, Math.min(1000, Number((e.currentTarget as HTMLInputElement).value) || 0)))}
            />
          </div>
          <small class="muted">Mets plus de tickets aux habitudes difficiles.</small>
        </div>

        <div class="field">
          <span>Quand ?</span>
          <div class="seg">
            {FREQ_TYPES.map((f) => (
              <button type="button" key={f.type} aria-pressed={freq.type === f.type} onClick={() => setFreq({ type: f.type } as Frequency)}>
                {f.label}
              </button>
            ))}
          </div>
          {freq.type === 'days' && (
            <div class="seg days" role="group" aria-label="Jours">
              {DAY_LETTERS.map((l, i) => (
                <button
                  type="button"
                  key={i}
                  aria-label={DAY_NAMES[i]}
                  aria-pressed={days.includes(i)}
                  onClick={() => setDays(days.includes(i) ? days.filter((d) => d !== i) : [...days, i])}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
          {freq.type === 'weekly' && (
            <div class="seg" role="group" aria-label="Nombre de fois par semaine">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button type="button" key={n} aria-pressed={times === n} onClick={() => setTimes(n)}>
                  {n}×
                </button>
              ))}
            </div>
          )}
          {steps.length > 0 && (
            <small class="muted">
              Bonus de série : ×1,2 dès {steps[0][0]}, ×1,5 dès {steps[1][0]}, ×2 dès {steps[2][0]}{' '}
              {frequency.type === 'weekly' ? 'semaines réussies' : 'jours'} d’affilée.
            </small>
          )}
          {frequency.type === 'once' && <small class="muted">Une tâche ponctuelle : elle disparaît une fois cochée.</small>}
        </div>

        <div class="row">
          <button class="btn" type="submit" disabled={!valid} style={{ flex: 1 }}>
            {habit ? 'Enregistrer' : 'Ajouter l’habitude'}
          </button>
          {onDelete &&
            (confirmDelete ? (
              <button class="btn danger" type="button" onClick={onDelete}>
                Confirmer la suppression
              </button>
            ) : (
              <button class="btn secondary" type="button" onClick={() => setConfirmDelete(true)}>
                Supprimer
              </button>
            ))}
        </div>
        {confirmDelete && <small class="muted">Les tickets déjà gagnés avec cette habitude sont conservés.</small>}
      </form>
    </Sheet>
  );
}

export function RewardForm({ reward, onSave, onDelete, onClose }: {
  reward?: Reward;
  onSave(r: Reward): void;
  onDelete?(): void;
  onClose(): void;
}) {
  const [name, setName] = useState(reward?.name ?? '');
  const [emoji, setEmoji] = useState(reward?.emoji ?? '🎁');
  const [cost, setCost] = useState(reward?.cost ?? 120);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const valid = name.trim().length > 0 && cost > 0;

  return (
    <Sheet title={reward ? 'Modifier la récompense' : 'Nouvelle récompense'} onClose={onClose}>
      <form
        class="section"
        style={{ gap: '18px' }}
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSave({ id: reward?.id ?? uid(), name: name.trim(), emoji: emoji.trim() || '🎁', cost });
        }}
      >
        <label class="field">
          <span>Ce que tu t’offres</span>
          <input
            id="reward-name"
            class="input"
            value={name}
            maxLength={60}
            placeholder="Ex. : 1 h de jeu vidéo"
            autoFocus={!reward}
            onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
          />
        </label>
        <EmojiPicker value={emoji} choices={REWARD_EMOJIS} onChange={setEmoji} />
        <div class="field">
          <span>Prix en tickets</span>
          <div class="seg">
            {COST_PRESETS.map((p) => (
              <button type="button" key={p} aria-pressed={cost === p} onClick={() => setCost(p)}>
                {p}
              </button>
            ))}
            <input
              id="reward-cost"
              class="input"
              type="number"
              min={1}
              max={100000}
              style={{ width: '100px' }}
              value={cost}
              aria-label="Prix en tickets"
              onInput={(e) => setCost(Math.max(0, Math.min(100000, Number((e.currentTarget as HTMLInputElement).value) || 0)))}
            />
          </div>
          <small class="muted">Repère : une bonne journée rapporte souvent entre 80 et 150 tickets.</small>
        </div>
        <div class="row">
          <button class="btn" type="submit" disabled={!valid} style={{ flex: 1 }}>
            {reward ? 'Enregistrer' : 'Ajouter la récompense'}
          </button>
          {onDelete &&
            (confirmDelete ? (
              <button class="btn danger" type="button" onClick={onDelete}>
                Confirmer
              </button>
            ) : (
              <button class="btn secondary" type="button" onClick={() => setConfirmDelete(true)}>
                Supprimer
              </button>
            ))}
        </div>
      </form>
    </Sheet>
  );
}
