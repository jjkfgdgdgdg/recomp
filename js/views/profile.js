// Écran « Profil & réglages » : résumé, réglages, sauvegarde des données.
import { h, clear, chips, toast, confirmBox } from '../ui.js';
import { getState, update, exportData, importData, resetAll } from '../store.js';
import { GOALS } from '../engine/planner.js';
import { EQUIPMENT, INJURIES } from '../data/exercises.js';
import { DAY_SHORT, todayISO } from '../engine/dates.js';
import { navigate } from '../router.js';
import { speak, unlockAudio } from '../audio.js';
import { PERSONAS, say } from '../voice.js';

const LEVEL = ['Jamais', 'Débutant', 'Intermédiaire', 'Avancé'];

export function renderProfile(root) {
  const s = getState();
  const p = s.profile;
  clear(root);
  root.append(h('section', { class: 'page-head' }, h('h1', null, 'Profil & réglages')));

  root.append(h('section', { class: 'card' },
    h('div', { class: 'row between' },
      h('div', null, h('h2', null, p.name || 'Mon profil'), h('div', { class: 'muted small' }, `${p.age} ans · ${p.height} cm · ${p.weight} kg au départ`)),
      h('button', { class: 'btn ghost small', onclick: () => navigate('#/onboarding') }, 'Modifier')),
    h('dl', { class: 'kv' },
      h('dt', null, 'Objectifs'), h('dd', null, GOALS.filter((g) => p.goals.includes(g.id)).map((g) => `${g.emoji} ${g.label}${g.id === p.primaryGoal ? ' (n°1)' : ''}`).join(', ')),
      h('dt', null, 'Niveau'), h('dd', null, `Muscu : ${LEVEL[p.liftLevel]} · Muay Thai : ${LEVEL[p.mtLevel]}`),
      h('dt', null, 'Jours'), h('dd', null, `${p.days.map((d) => DAY_SHORT[d]).join(', ')} · ${p.sessionMinutes} min`),
      h('dt', null, 'Matériel'), h('dd', null, p.equipment.length ? EQUIPMENT.filter((e) => p.equipment.includes(e.id)).map((e) => e.label).join(', ') : 'Poids du corps'),
      h('dt', null, 'Zones sensibles'), h('dd', null, p.injuries.length ? INJURIES.filter((e) => p.injuries.includes(e.id)).map((e) => e.label).join(', ') : 'Aucune'),
      h('dt', null, 'Tests'), h('dd', null, `Pompes ${p.tests.push ?? '?'} · Squats ${p.tests.squat ?? '?'} · Tractions ${p.tests.pull ?? '?'} · Gainage ${p.tests.plank ?? '?'} s`))));

  // ---- Réglages
  const set = (k, v) => update((st) => { st.settings[k] = v; });
  root.append(h('section', { class: 'card' },
    h('div', { class: 'card-title' }, '⚙️ Réglages'),
    toggleRow('Voix du coach', 'Annonces, corrections et combinaisons à voix haute', s.settings.voice, (v) => { set('voice', v); if (v) { unlockAudio(); speak('Voix du coach activée'); } }),
    h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Personnalité du coach'),
      chips(Object.entries(PERSONAS).map(([id, p]) => ({ id, label: `${p.emoji} ${p.label}` })), s.settings.persona || 'calm', {
        multi: false,
        onChange: (v) => { set('persona', v); unlockAudio(); say('start', { interrupt: true }); },
      }),
      h('span', { class: 'hint' }, 'Hardcore : répliques sans pitié, voix grave. Les répliques sont originales (pas la voix d\u2019une personne réelle).')),
    toggleRow('Compter les reps à voix haute', 'Le coach dit 1, 2, 3…', s.settings.voiceCounts !== false, (v) => set('voiceCounts', v)),
    toggleRow('Sons (bips, cloche)', null, s.settings.sound, (v) => set('sound', v)),
    h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Modèle de détection du squelette'),
      chips([{ id: 'lite', label: '⚡ Rapide (conseillé sur téléphone)' }, { id: 'full', label: '🎯 Précis (PC / téléphone récent)' }], s.settings.model, { multi: false, onChange: (v) => set('model', v) }))));

  // ---- Installer
  root.append(h('section', { class: 'card soft' },
    h('div', { class: 'card-title' }, '📲 Installer l\u2019app (téléphone, tablette, PC)'),
    h('p', { class: 'small muted' }, 'Une seule adresse pour tous tes appareils. Installation en un clic, fonctionne hors connexion.'),
    h('button', { class: 'btn ghost', onclick: () => navigate('#/install') }, 'Installer / envoyer sur un autre appareil')));

  // ---- Données
  const fileInput = h('input', {
    type: 'file', accept: 'application/json,.json', hidden: true,
    onchange: async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        importData(await f.text());
        toast('Données importées ✅');
        navigate('#/today');
      } catch (err) {
        toast(`Import impossible : ${err.message}`);
      }
    },
  });
  root.append(h('section', { class: 'card' },
    h('div', { class: 'card-title' }, '💾 Mes données'),
    h('p', { class: 'small muted' }, 'Tout est stocké uniquement sur cet appareil. Exporte une sauvegarde de temps en temps (ou pour changer de téléphone).'),
    h('div', { class: 'row gap wrap' },
      h('button', {
        class: 'btn ghost',
        onclick: () => {
          const blob = new Blob([exportData()], { type: 'application/json' });
          const a = h('a', { href: URL.createObjectURL(blob), download: `recomp-sauvegarde-${todayISO()}.json` });
          document.body.append(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        },
      }, 'Exporter'),
      h('button', { class: 'btn ghost', onclick: () => fileInput.click() }, 'Importer'),
      fileInput,
      h('button', {
        class: 'btn danger',
        onclick: async () => {
          if (await confirmBox('Tout effacer (profil, historique, progrès) ? Cette action est définitive.', { danger: true, ok: 'Tout effacer' })) {
            resetAll();
            navigate('#/onboarding');
          }
        },
      }, 'Tout effacer'))));

  root.append(h('section', { class: 'about small muted' },
    h('p', null, 'Recomp · 100 % gratuit, sans compte, sans publicité, sans IA payante. Détection du squelette : MediaPipe Pose (Google, Apache 2.0), exécutée localement.'),
    h('p', null, '⚠️ Cette application ne remplace pas un avis médical. En cas de douleur, arrête l’exercice.')));
}

function toggleRow(label, hint, value, onChange) {
  const input = h('input', { type: 'checkbox', role: 'switch', checked: !!value, onchange: (e) => onChange(e.target.checked) });
  return h('label', { class: 'toggle-row' },
    h('span', null, h('b', null, label), hint ? h('span', { class: 'small muted block' }, hint) : null),
    h('span', { class: 'switch' }, input, h('span', { class: 'slider' })));
}
