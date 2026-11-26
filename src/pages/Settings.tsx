import { useState } from 'preact/hooks';
import { Stepper } from '../components/ui';
import type { CloudStatus } from '../lib/cloud';
import { runtime, saveFile } from '../lib/cloud';
import { toast } from '../lib/effects';
import { migrate } from '../lib/state';
import { dispatch, useCloudStatus } from '../lib/store';
import type { DateKey, State } from '../lib/types';

const STATUS: Record<CloudStatus, { text: string; tone: 'ok' | 'warn' | 'bad' | '' }> = {
  local: { text: 'Enregistré sur cet appareil', tone: '' },
  connecting: { text: 'Connexion à ton compte…', tone: 'warn' },
  synced: { text: 'Synchronisé avec ton compte Claude', tone: 'ok' },
  saving: { text: 'Enregistrement…', tone: 'warn' },
  offline: { text: 'Hors ligne : tes changements seront envoyés plus tard', tone: 'warn' },
  error: { text: 'Synchronisation impossible pour le moment', tone: 'bad' },
  full: { text: 'Espace de stockage plein : exporte une sauvegarde', tone: 'bad' },
};

export function Settings({ state, today }: { state: State; today: DateKey }) {
  const cloud = useCloudStatus();
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState('');
  const s = state.settings;
  const status = STATUS[cloud];

  async function exportData() {
    const result = await saveFile(`recomp-sauvegarde-${today}.json`, JSON.stringify(state, null, 2));
    if (result === 'saved') toast('💾', 'Sauvegarde exportée');
    else if (result === 'unavailable') toast('⚠️', 'Export impossible ici', 'Ouvre l’appli dans un navigateur pour exporter.');
  }

  function importData(file: File | undefined) {
    setImportError('');
    if (!file) return;
    file
      .text()
      .then((text) => {
        const next = migrate(JSON.parse(text));
        if (!next) throw new Error('format');
        dispatch({ type: 'replace', state: next });
        toast('📥', 'Sauvegarde importée', `${next.habits.length} habitudes, ${next.completions.length} coches.`);
      })
      .catch(() => setImportError('Ce fichier n’est pas une sauvegarde Recomp. Choisis un fichier « recomp-sauvegarde-….json ».'));
  }

  return (
    <div class="page">
      <h1 style={{ fontSize: '1.7rem', fontWeight: 800 }}>Réglages</h1>

      <section class="card section">
        <label class="field">
          <span>Ton pseudo</span>
          <input
            id="settings-name"
            class="input"
            value={s.name}
            maxLength={32}
            placeholder="Affiché dans ton bilan Discord"
            onChange={(e) => dispatch({ type: 'settings', patch: { name: (e.currentTarget as HTMLInputElement).value } })}
          />
        </label>
        <div class="switch-row">
          <div>
            <div style={{ fontWeight: 700 }}>Fin de journée</div>
            <div class="muted small">Tu te couches tard ? Avant cette heure, tes coches comptent encore pour la veille.</div>
          </div>
          <Stepper
            id="settings-day-end"
            value={s.dayEndHour}
            min={0}
            max={5}
            unit="h"
            onChange={(v) => dispatch({ type: 'settings', patch: { dayEndHour: v } })}
          />
        </div>
        <div class="switch-row">
          <div>
            <div style={{ fontWeight: 700 }}>Sons</div>
            <div class="muted small">Petit « ding » quand tu coches, cloche à la fin du focus.</div>
          </div>
          <button class="chip" aria-pressed={s.sound} onClick={() => dispatch({ type: 'settings', patch: { sound: !s.sound } })}>
            {s.sound ? 'Activés' : 'Coupés'}
          </button>
        </div>
      </section>

      <section class="card section">
        <h2 style={{ fontSize: '1.05rem' }}>Tes données</h2>
        <span class={`status ${status.tone}`}>
          <i aria-hidden="true" />
          {status.text}
        </span>
        <p class="muted small" style={{ margin: 0 }}>
          {runtime()
            ? 'Tes données sont liées à ton compte et privées : personne d’autre ne peut les voir, même si tu partages le lien.'
            : 'Tes données restent dans ce navigateur. Exporte une sauvegarde de temps en temps pour ne rien perdre.'}
        </p>
        <div class="row">
          <button class="btn secondary" onClick={exportData}>
            Exporter une sauvegarde
          </button>
          <label class="btn secondary">
            Importer
            <input type="file" accept="application/json,.json" hidden onChange={(e) => importData((e.currentTarget as HTMLInputElement).files?.[0])} />
          </label>
        </div>
        {importError && (
          <p class="small" style={{ margin: 0, color: 'var(--danger)' }}>
            {importError}
          </p>
        )}
      </section>

      <section class="card section">
        <h2 style={{ fontSize: '1.05rem' }}>Repartir de zéro</h2>
        <p class="muted small" style={{ margin: 0 }}>
          Efface tes habitudes, récompenses, tickets et succès. Exporte une sauvegarde avant si tu veux pouvoir revenir en arrière.
        </p>
        {confirmReset ? (
          <div class="row">
            <button
              class="btn danger"
              onClick={() => {
                dispatch({ type: 'reset' });
                setConfirmReset(false);
                location.hash = '#aujourdhui';
                toast('🧽', 'Tout a été effacé');
              }}
            >
              Oui, tout effacer
            </button>
            <button class="btn secondary" onClick={() => setConfirmReset(false)}>
              Annuler
            </button>
          </div>
        ) : (
          <button class="btn secondary" style={{ alignSelf: 'flex-start' }} onClick={() => setConfirmReset(true)}>
            Tout effacer…
          </button>
        )}
      </section>

      <p class="muted small" style={{ textAlign: 'center', margin: 0 }}>
        Recomp 1.0 · fait pour toi
      </p>
    </div>
  );
}
