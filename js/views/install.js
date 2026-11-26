// Page « Installer Recomp » : installation sur téléphone / tablette / PC, envoi vers un autre appareil, transfert des données.
import { h, clear, toast, icon } from '../ui.js';
import { update } from '../store.js';
import {
  installState, promptInstall, onInstallChange, appUrl,
} from '../install.js';
import { navigate } from '../router.js';

const GUIDES = [
  {
    id: 'iphone', emoji: '📱', title: 'iPhone / iPad', match: ['iphone', 'ipad'],
    steps: [
      'Ouvre le lien de l’app dans Safari (ou Chrome sur iOS 16.4+).',
      'Touche le bouton Partager (carré avec une flèche vers le haut).',
      'Choisis « Sur l’écran d’accueil », puis « Ajouter ».',
      'Lance Recomp depuis l’icône : plein écran, comme une vraie app.',
    ],
    camera: 'Caméra refusée ? Réglages → Safari → Caméra → « Autoriser » (ou « Demander »).',
  },
  {
    id: 'android', emoji: '🤖', title: 'Android', match: ['android'],
    steps: [
      'Ouvre le lien dans Chrome (ou Samsung Internet).',
      'Touche le bouton « Installer » ci-dessus, ou menu ⋮ → « Installer l’application » / « Ajouter à l’écran d’accueil ».',
      'L’icône Recomp apparaît avec tes autres applis.',
    ],
    camera: 'Caméra refusée ? Touche le cadenas à gauche de l’adresse → Autorisations → Caméra.',
  },
  {
    id: 'pc', emoji: '💻', title: 'PC Windows / Linux / Chromebook', match: ['windows', 'linux'],
    steps: [
      'Ouvre le lien dans Chrome ou Edge.',
      'Clique sur l’icône d’installation (écran avec une flèche) à droite de la barre d’adresse, ou menu ⋮ → « Installer Recomp ».',
      'Recomp s’ouvre dans sa propre fenêtre et apparaît dans le menu Démarrer / la barre des tâches.',
      'Webcam : place l’ordinateur portable au sol ou sur une chaise basse pour que tout ton corps soit filmé.',
    ],
    camera: 'Caméra refusée ? Clique sur l’icône caméra (ou le cadenas) dans la barre d’adresse → Autoriser.',
  },
  {
    id: 'mac', emoji: '🍎', title: 'Mac', match: ['mac'],
    steps: [
      'Chrome ou Edge : icône d’installation dans la barre d’adresse → « Installer ».',
      'Safari (macOS Sonoma ou plus récent) : menu Fichier → « Ajouter au Dock ».',
    ],
    camera: 'Caméra refusée ? Réglages Système → Confidentialité et sécurité → Caméra → autorise ton navigateur.',
  },
];

export function renderInstall(root) {
  let st = installState();
  const status = h('section', { class: 'card install-status' });

  const drawStatus = () => {
    st = installState();
    clear(status);
    if (st.installed) {
      status.append(h('div', { class: 'install-ok' }, '✅'), h('div', null, h('b', null, 'Recomp est installée sur cet appareil.'), h('p', { class: 'small muted' }, 'Elle fonctionne aussi hors connexion. Pour l’avoir sur un autre appareil, envoie-toi le lien ci-dessous.')));
      return;
    }
    if (!st.secure) {
      status.append(h('div', { class: 'alert' }, '⚠️ Cette page n’est pas en HTTPS : l’installation et la caméra ne marcheront pas. Utilise l’adresse en https:// (ou localhost sur PC).'));
      return;
    }
    if (st.canPrompt) {
      status.append(
        h('div', null, h('b', null, 'Installe Recomp en un clic'), h('p', { class: 'small muted' }, 'Icône sur ton écran d’accueil, plein écran, fonctionne hors connexion.')),
        h('button', {
          class: 'btn primary big',
          onclick: async () => {
            const r = await promptInstall();
            if (r === 'accepted') toast('Recomp est installée 🎉');
            drawStatus();
          },
        }, icon('download'), ' Installer l’app'));
      return;
    }
    const g = GUIDES.find((x) => x.match.includes(st.platform)) || GUIDES[2];
    const firefox = st.browser === 'firefox' && !['iphone', 'ipad'].includes(st.platform);
    status.append(
      h('div', null, h('b', null, `${g.emoji} Sur ton appareil (${g.title})`),
        firefox ? h('p', { class: 'small' }, 'Firefox ne sait pas installer les applis web : ouvre ce lien dans Chrome ou Edge (tu peux aussi utiliser Recomp directement dans Firefox, sans l’installer).') : null,
        h('ol', { class: 'small install-steps' }, g.steps.map((s) => h('li', null, s)))));
  };
  drawStatus();
  const off = onInstallChange(drawStatus);

  const url = appUrl();
  const share = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: 'Recomp', text: 'Mon coach sport & Muay Thai gratuit', url }); return; }
    } catch { return; }
    copy();
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); toast('Lien copié 📋'); } catch { toast(url, 6000); }
  };

  clear(root);
  root.append(
    h('section', { class: 'page-head' },
      h('button', { class: 'link small', onclick: () => history.back() }, '← Retour'),
      h('h1', null, '📲 Installer Recomp'),
      h('p', { class: 'muted' }, 'Gratuit, sans store, sans compte. Une seule adresse pour le téléphone, la tablette et le PC.')),
    status,
    h('section', { class: 'card' },
      h('div', { class: 'card-title' }, '🔗 Envoyer l’app sur un autre appareil'),
      h('div', { class: 'link-box' }, url),
      h('div', { class: 'row gap wrap' },
        h('button', { class: 'btn primary', onclick: share }, 'Partager le lien'),
        h('button', { class: 'btn ghost', onclick: copy }, 'Copier'),
        h('a', { class: 'btn ghost', href: `mailto:?subject=${encodeURIComponent('Recomp')}&body=${encodeURIComponent(url)}` }, 'Par e-mail')),
      h('p', { class: 'small muted' }, 'Du PC vers le téléphone : dans Chrome ou Edge, clic droit sur la page → « Créer un code QR pour cette page », puis scanne-le avec l’appareil photo du téléphone.')),
    h('h2', { class: 'section-title' }, 'Instructions par appareil'),
    GUIDES.map((g) => h('details', { class: 'card install-guide', open: g.match.includes(st.platform) || null },
      h('summary', null, `${g.emoji} ${g.title}`),
      h('ol', { class: 'small install-steps' }, g.steps.map((s) => h('li', null, s))),
      h('p', { class: 'small muted' }, g.camera))),
    h('section', { class: 'card soft' },
      h('div', { class: 'card-title' }, '💾 Retrouver mes données sur un autre appareil'),
      h('p', { class: 'small' }, 'Tes données restent sur chaque appareil (rien n’est envoyé sur internet). Pour les transférer :'),
      h('ol', { class: 'small install-steps' },
        h('li', null, 'Sur l’ancien appareil : Profil → Mes données → Exporter.'),
        h('li', null, 'Envoie-toi le fichier (e-mail, messagerie, clé USB…).'),
        h('li', null, 'Sur le nouvel appareil : Profil → Mes données → Importer.')),
      h('button', { class: 'btn ghost small', onclick: () => navigate('#/profile') }, 'Aller à Mes données')),
    h('section', { class: 'card soft small' },
      h('b', null, 'Bon à savoir'),
      h('ul', { class: 'bullets' },
        h('li', null, 'Les mises à jour arrivent toutes seules : un bandeau te propose de recharger quand une nouvelle version est prête.'),
        h('li', null, 'Le premier lancement du coach caméra télécharge le modèle du squelette (~17 Mo), ensuite il est en cache.'),
        h('li', null, 'Garde au moins 100 Mo libres sur l’appareil.'))),
  );
  return () => off();
}

/** Bandeau d'installation pour l'accueil (renvoie null si inutile). */
export function installBanner(settings, rerender) {
  const st = installState();
  if (st.installed || settings.installDismissed) return null;
  return h('section', { class: 'card install-banner' },
    h('div', null, h('b', null, '📲 Installe Recomp'), h('p', { class: 'small muted' }, 'Sur ton écran d’accueil ou ton PC : plein écran et hors connexion.')),
    h('div', { class: 'row gap' },
      h('button', {
        class: 'btn primary small',
        onclick: async () => {
          if (st.canPrompt) {
            const r = await promptInstall();
            if (r === 'accepted') toast('Recomp est installée 🎉');
            rerender();
          } else navigate('#/install');
        },
      }, 'Installer'),
      h('button', { class: 'btn ghost small', onclick: () => { update((s) => { s.settings.installDismissed = true; }); rerender(); } }, 'Plus tard')));
}
