// Écran « Rappels » : agenda (le plus fiable) + notifications de l'app.
import { h, add, clear, toast } from '../ui.js';
import { update } from '../store.js';
import {
  reminderSettings, downloadIcs, googleCalendarUrl, enableNotifications, disableNotifications, notificationsSupported, showNotification, trainingDays,
} from '../reminders.js';
import { installState, appUrl } from '../install.js';
import { getState } from '../store.js';
import { DAY_SHORT } from '../engine/dates.js';

export function renderReminders(root) {
  const draw = () => {
    const r = reminderSettings();
    const st = installState();
    const days = trainingDays();
    const ios = ['iphone', 'ipad'].includes(st.platform);
    const set = (k, v) => update((s) => { s.settings.reminders = { ...reminderSettings(), [k]: v }; });
    const gUrl = googleCalendarUrl(getState(), r.session, appUrl());
    clear(root);
    add(root,
      h('section', { class: 'page-head' },
        h('button', { class: 'link small', onclick: () => history.back() }, '← Retour'),
        h('h1', null, '⏰ Rappels'),
        h('p', { class: 'muted' }, 'Gratuits, sans compte ni serveur.')),
      h('section', { class: 'card' },
        h('div', { class: 'card-title' }, 'Heures des rappels'),
        h('div', { class: 'grid2' },
          h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Séance'), h('input', { class: 'input', type: 'time', value: r.session, onchange: (e) => { set('session', e.target.value || '18:00'); draw(); } })),
          h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Quêtes du jour'), h('input', { class: 'input', type: 'time', value: r.quests, onchange: (e) => { set('quests', e.target.value || '20:30'); draw(); } }))),
        h('p', { class: 'small muted' }, days.length ? `Jours d’entraînement : ${days.map((d) => DAY_SHORT[d]).join(', ')}` : 'Aucun jour d’entraînement dans ton programme.')),
      h('section', { class: 'card' },
        h('div', { class: 'card-title' }, '📅 Dans ton agenda (recommandé)'),
        h('p', { class: 'small' }, 'Le plus fiable sur tous les appareils, même app fermée et sans internet : tes séances et tes quêtes s’ajoutent à l’agenda du téléphone, avec une alarme.'),
        h('div', { class: 'row gap wrap' },
          h('button', { class: 'btn primary', onclick: () => { downloadIcs(); toast(ios ? 'Ouvre le fichier puis « Tout ajouter »' : 'Fichier agenda téléchargé : ouvre-le pour l’ajouter'); } }, ios ? '📅 Ajouter à mon calendrier iPhone' : '📅 Fichier agenda (.ics)'),
          gUrl ? h('a', { class: 'btn ghost', href: gUrl, target: '_blank', rel: 'noopener' }, 'Google Agenda (séances)') : null),
        h('ul', { class: 'bullets small muted' },
          h('li', null, 'iPhone / Mac : ouvre le fichier .ics → « Ajouter tout ».'),
          h('li', null, 'Android : bouton « Google Agenda » ; ou ouvre le .ics avec ton appli d’agenda (Samsung, Outlook…).'),
          h('li', null, 'PC : double-clique le .ics (Outlook, Calendrier Windows/Mac) ou importe-le dans Google Agenda.'),
          h('li', null, 'Si tu changes tes jours ou tes heures, réimporte le fichier (et supprime l’ancien événement).'))),
      h('section', { class: 'card' },
        h('div', { class: 'card-title' }, '🔔 Notifications de l’app'),
        !notificationsSupported()
          ? h('p', { class: 'small muted' }, 'Ce navigateur ne gère pas les notifications. Utilise les rappels d’agenda ci-dessus.')
          : h('div', { class: 'stack' },
            h('p', { class: 'small' }, r.notify ? '✅ Activées.' : 'Une notification à l’heure de ta séance (si elle n’est pas faite) et le soir s’il reste des quêtes.'),
            h('p', { class: 'small muted' }, ios
              ? 'Sur iPhone, les notifications des applis web sont limitées : préfère les rappels d’agenda.'
              : 'Elles arrivent à coup sûr quand l’app est ouverte. App fermée, ça dépend du navigateur (souvent OK sur Android et PC avec l’app installée). Pour être sûr à 100 %, ajoute aussi l’agenda.'),
            h('div', { class: 'row gap wrap' },
              r.notify
                ? h('button', { class: 'btn ghost', onclick: () => { disableNotifications(); draw(); } }, 'Désactiver')
                : h('button', {
                  class: 'btn primary',
                  onclick: async () => {
                    const res = await enableNotifications();
                    toast(res === 'granted' ? 'Notifications activées 🔔' : res === 'denied' ? 'Notifications refusées : autorise-les dans les réglages du navigateur' : 'Notifications indisponibles');
                    draw();
                  },
                }, 'Activer les notifications'),
              r.notify ? h('button', { class: 'btn ghost', onclick: () => showNotification('🔔 Test Recomp', 'Les rappels fonctionnent !', 'recomp-test') }, 'Tester') : null))),
    );
  };
  draw();
}
