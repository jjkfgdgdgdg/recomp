import { useEffect, useState } from 'preact/hooks';
import { RewardForm } from '../components/Forms';
import { IconEdit, IconPlus } from '../components/Icons';
import { Bar, Tickets } from '../components/ui';
import { relativeDay } from '../lib/dates';
import { confetti, play, toast, unlockAudio } from '../lib/effects';
import { fmt, type Derived } from '../lib/logic';
import { uid } from '../lib/state';
import { dispatch } from '../lib/store';
import { REWARD_TEMPLATES } from '../lib/templates';
import type { DateKey, Reward, State } from '../lib/types';

export function Rewards({ state, derived, today }: { state: State; derived: Derived; today: DateKey }) {
  const [editing, setEditing] = useState<Reward | 'new' | null>(null);
  const [arming, setArming] = useState<string | null>(null);
  const balance = derived.totals.balance;
  const rewards = state.rewards.filter((r) => !r.archived).sort((a, b) => a.cost - b.cost);
  const recent = [...state.purchases].sort((a, b) => b.at - a.at).slice(0, 8);
  const names = new Set(rewards.map((r) => r.name));
  const suggestions = REWARD_TEMPLATES.filter((t) => !names.has(t.name));

  // Le bouton « Échanger » demande une confirmation, qui s'annule seule au bout de 4 s
  useEffect(() => {
    if (!arming) return;
    const t = setTimeout(() => setArming(null), 4000);
    return () => clearTimeout(t);
  }, [arming]);

  function buy(r: Reward) {
    unlockAudio();
    if (arming !== r.id) return setArming(r.id);
    setArming(null);
    dispatch({ type: 'buy', rewardId: r.id, date: today, now: Date.now(), id: uid() });
    play('buy');
    confetti(90);
    toast(r.emoji, `${r.name} : c’est mérité !`, `−${fmt(r.cost)} tickets. Profite bien.`);
  }

  return (
    <div class="page">
      <div class="card balance-hero">
        <span class="label">Ton solde</span>
        <Tickets n={balance} big />
        <span class="muted small">
          {fmt(derived.totals.earned)} gagnés · {fmt(derived.totals.spent)} dépensés
        </span>
      </div>

      <div class="page-head">
        <h1>Récompenses</h1>
        <button class="btn" onClick={() => setEditing('new')}>
          <IconPlus /> Ajouter
        </button>
      </div>

      {rewards.length === 0 ? (
        <div class="empty">
          <strong>Ta vitrine de lots est vide.</strong>
          <span>Ajoute ce qui te motive vraiment : c’est ça qui donne envie de cocher tes habitudes.</span>
        </div>
      ) : (
        <ul class="prize-list">
          {rewards.map((r) => {
            const affordable = balance >= r.cost;
            return (
              <li key={r.id}>
                <div class={`prize${affordable ? '' : ' locked'}`}>
                  <div class="prize-body">
                    <span class="emoji" aria-hidden="true">
                      {r.emoji}
                    </span>
                    <span class="name">{r.name}</span>
                    <div style={{ gridColumn: 2 }}>
                      <Bar value={balance / r.cost} kind="ticket" />
                    </div>
                    <span class="need">{affordable ? 'Tu peux te l’offrir' : `Encore ${fmt(r.cost - Math.max(0, balance))} tickets`}</span>
                  </div>
                  <div class="prize-stub">
                    <span class="cost num">
                      {fmt(r.cost)}
                      <small>tickets</small>
                    </span>
                    <button class={arming === r.id ? 'confirm' : ''} disabled={!affordable} onClick={() => buy(r)}>
                      {arming === r.id ? 'Confirmer' : 'Échanger'}
                    </button>
                  </div>
                </div>
                <div class="prize-tools">
                  <button class="icon-btn" aria-label={`Modifier ${r.name}`} onClick={() => setEditing(r)}>
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
            <h2>Idées de récompenses</h2>
            <span class="muted small">Touche pour ajouter</span>
          </div>
          <div class="pick-grid">
            {suggestions.map((t) => (
              <button
                class="chip"
                key={t.name}
                onClick={() => {
                  dispatch({ type: 'saveReward', reward: { ...t, id: uid() } });
                  toast(t.emoji, `« ${t.name} » ajoutée`);
                }}
              >
                {t.emoji} {t.name} <small>{t.cost}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section class="section">
          <div class="section-title">
            <h2>Derniers échanges</h2>
          </div>
          <ul class="card history" style={{ paddingBlock: '6px' }}>
            {recent.map((p) => (
              <li key={p.id}>
                <span aria-hidden="true">{p.emoji}</span>
                <span style={{ minWidth: 0 }}>
                  {p.name}
                  <span class="muted small"> · {relativeDay(p.date, today)}</span>
                </span>
                <span class="row" style={{ gap: '6px', flexWrap: 'nowrap' }}>
                  <span class="amount minus">−{fmt(p.cost)}</span>
                  <button
                    class="btn ghost small"
                    style={{ minHeight: '32px' }}
                    onClick={() => {
                      dispatch({ type: 'cancelPurchase', id: p.id });
                      toast('↩️', 'Échange annulé', `${fmt(p.cost)} tickets rendus.`);
                    }}
                  >
                    Annuler
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {editing && (
        <RewardForm
          reward={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={(reward) => {
            dispatch({ type: 'saveReward', reward });
            toast(reward.emoji, editing === 'new' ? 'Récompense ajoutée' : 'Récompense enregistrée');
            setEditing(null);
          }}
          onDelete={
            editing === 'new'
              ? undefined
              : () => {
                  dispatch({ type: 'archiveReward', id: editing.id });
                  setEditing(null);
                }
          }
        />
      )}
    </div>
  );
}
