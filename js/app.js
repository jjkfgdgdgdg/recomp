// Point d'entrée : coquille de l'app (en-tête + navigation) et routes.
import { h, clear, icon } from './ui.js';
import { load, getState } from './store.js';
import { route, startRouter, navigate, currentPath } from './router.js';
import { ensurePlan } from './services.js';
import { renderOnboarding } from './views/onboarding.js';
import { renderToday } from './views/today.js';
import { renderPlan } from './views/plan.js';
import { renderSession } from './views/session.js';
import { renderCoach } from './views/coach.js';
import { renderProgress } from './views/progress.js';
import { renderWellness } from './views/wellness.js';
import { renderProfile } from './views/profile.js';
import { renderTimer } from './views/timer.js';
import { renderArena } from './views/arena.js';
import { renderHero } from './views/hero.js';
import { renderAcademy, renderGuide } from './views/academy.js';
import { renderLibrary, renderExercise } from './views/library.js';
import { ensureGame, checkTitles } from './game/service.js';
import { renderInstall } from './views/install.js';
import { renderChallenge, renderChallenges } from './views/challenge.js';
import { renderEditor } from './views/editor.js';
import { renderReminders } from './views/reminders.js';
import { startReminderLoop } from './reminders.js';
import { registerServiceWorker, onUpdateReady, installState, onInstallChange } from './install.js';

load();

const view = document.getElementById('view');
const tabbar = document.getElementById('tabbar');
const topbar = document.getElementById('topbar');

const TABS = [
  { path: '/today', label: 'Accueil', icon: 'home', also: ['/wellness', '/timer'] },
  { path: '/plan', label: 'Programme', icon: 'calendar', also: ['/editor'] },
  { path: '/arena', label: 'Arène', icon: 'sword', also: ['/coach', '/challenge'] },
  { path: '/academy', label: 'Académie', icon: 'book', also: ['/library', '/exercise', '/guide'] },
  { path: '/hero', label: 'Héros', icon: 'shield', also: ['/progress'] },
];

function renderTabs(path) {
  clear(tabbar);
  TABS.forEach((t) => {
    const on = path.startsWith(t.path) || (t.also || []).some((p) => path.startsWith(p));
    tabbar.append(h('a', { href: `#${t.path}`, class: `tab${on ? ' on' : ''}`, 'aria-current': on ? 'page' : null }, icon(t.icon), h('span', null, t.label)));
  });
}

function renderTop(path) {
  clear(topbar);
  topbar.append(
    h('a', { href: '#/today', class: 'brand', 'aria-label': 'Accueil Recomp' }, h('span', { class: 'brand-mark' }, 'R'), 'Recomp'),
    h('div', { class: 'row' },
      installState().installed ? null : h('a', { href: '#/install', class: `icon-btn${path === '/install' ? ' on' : ''}`, 'aria-label': 'Installer l\u2019app', title: 'Installer l\u2019app' }, icon('download')),
      h('a', { href: '#/profile', class: `icon-btn${path === '/profile' ? ' on' : ''}`, 'aria-label': 'Profil et réglages' }, icon('user'))));
}
onInstallChange(() => { if (!document.body.classList.contains('bare')) renderTop(currentPath()); });

// Enveloppe chaque écran : vérifie le profil, gère la coquille, remonte en haut.
function screen(render, { shell = true, needsProfile = true } = {}) {
  return (params, path) => {
    const s = getState();
    if (needsProfile && !s.profile) {
      navigate('#/onboarding', { replace: true });
      return null;
    }
    if (s.profile) { ensurePlan(); ensureGame(); }
    document.body.classList.toggle('bare', !shell);
    if (shell) { renderTabs(path); renderTop(path); }
    clear(view);
    window.scrollTo(0, 0);
    try {
      return render(view, params);
    } catch (err) {
      console.error(err);
      view.append(h('div', { class: 'card alert' }, h('b', null, 'Oups, une erreur est survenue.'), h('p', { class: 'small' }, String(err?.message || err)),
        h('button', { class: 'btn ghost', onclick: () => navigate('#/today') }, 'Retour à l’accueil')));
      return null;
    }
  };
}

route('/onboarding', screen(renderOnboarding, { shell: false, needsProfile: false }));
route('/today', screen(renderToday));
route('/plan', screen(renderPlan));
route('/session/:id', screen(renderSession, { shell: false }));
route('/coach', screen(renderCoach));
route('/progress', screen(renderProgress));
route('/wellness', screen(renderWellness));
route('/profile', screen(renderProfile));
route('/timer', screen(renderTimer));
route('/arena', screen(renderArena));
route('/hero', screen(renderHero));
route('/academy', screen(renderAcademy));
route('/guide/:id', screen(renderGuide));
route('/library', screen(renderLibrary));
route('/exercise/:id', screen(renderExercise));
route('/install', screen(renderInstall, { needsProfile: false }));
route('/challenge', screen(renderChallenge, { needsProfile: false }));
route('/challenges', screen(renderChallenges));
route('/editor', screen(renderEditor));
route('/reminders', screen(renderReminders));

if (!getState().profile && !['/onboarding', '/challenge', '/install'].includes(currentPath())) {
  history.replaceState(null, '', '#/onboarding');
}
startRouter();
if (getState().profile) setTimeout(() => checkTitles(), 800);

// Service worker : fonctionnement hors ligne, installation, et bandeau de mise à jour
registerServiceWorker();
startReminderLoop();
onUpdateReady((reload) => {
  if (document.getElementById('update-bar')) return;
  document.body.append(h('div', { id: 'update-bar', role: 'status' },
    h('span', null, '✨ Nouvelle version de Recomp disponible'),
    h('button', { class: 'btn small primary', onclick: reload }, 'Mettre à jour')));
});
