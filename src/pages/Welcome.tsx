import { useState } from 'preact/hooks';
import { frequencyLabel } from '../lib/logic';
import { uid } from '../lib/state';
import { dispatch } from '../lib/store';
import { HABIT_TEMPLATES, REWARD_TEMPLATES } from '../lib/templates';
import type { DateKey } from '../lib/types';

export function Welcome({ today }: { today: DateKey }) {
  const [habits, setHabits] = useState(new Set([0, 2, 4]));
  const [rewards, setRewards] = useState(new Set([0, 1, 3]));
  const toggle = (set: Set<number>, i: number) => {
    const next = new Set(set);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    return next;
  };

  function begin(empty = false) {
    dispatch({
      type: 'onboard',
      habits: empty ? [] : HABIT_TEMPLATES.filter((_, i) => habits.has(i)).map((t) => ({ ...t, id: uid(), createdAt: today })),
      rewards: empty ? [] : REWARD_TEMPLATES.filter((_, i) => rewards.has(i)).map((t) => ({ ...t, id: uid() })),
    });
    location.hash = empty ? '#habitudes' : '#aujourdhui';
  }

  return (
    <div class="welcome">
      <h1>
        Coche tes habitudes. Gagne des <em>tickets</em>. Offre-toi tes récompenses.
      </h1>
      <div class="steps">
        <div>
          <b>✅</b>Tu fais ce que tu t’es promis
        </div>
        <div>
          <b>🎟️</b>Tu gagnes des tickets (plus avec les séries 🔥)
        </div>
        <div>
          <b>🎁</b>Tu les échanges, sans culpabiliser
        </div>
      </div>

      <section class="section">
        <div class="section-title">
          <h2>1. Choisis tes habitudes</h2>
          <span class="muted small">{habits.size} choisies</span>
        </div>
        <div class="pick-grid">
          {HABIT_TEMPLATES.map((t, i) => (
            <button
              class="chip"
              key={t.name}
              aria-pressed={habits.has(i)}
              title={frequencyLabel(t.frequency)}
              onClick={() => setHabits(toggle(habits, i))}
            >
              {t.emoji} {t.name} <small>{t.points}</small>
            </button>
          ))}
        </div>
      </section>

      <section class="section">
        <div class="section-title">
          <h2>2. Choisis tes récompenses</h2>
          <span class="muted small">{rewards.size} choisies</span>
        </div>
        <div class="pick-grid">
          {REWARD_TEMPLATES.map((t, i) => (
            <button class="chip" key={t.name} aria-pressed={rewards.has(i)} onClick={() => setRewards(toggle(rewards, i))}>
              {t.emoji} {t.name} <small>{t.cost}</small>
            </button>
          ))}
        </div>
        <p class="muted small" style={{ margin: 0 }}>
          Tout se modifie ensuite : noms, prix, nombre de tickets, jours…
        </p>
      </section>

      <div class="section">
        <button class="btn block" style={{ minHeight: '52px', fontSize: '1.05rem' }} disabled={habits.size === 0} onClick={() => begin()}>
          C’est parti
        </button>
        <button class="btn ghost" onClick={() => begin(true)}>
          Je préfère tout créer moi-même
        </button>
      </div>
    </div>
  );
}
