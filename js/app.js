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

load();

const view = document.getElementById('view');
const tabbar = document.getElementById('tabbar');
const topbar = document.getElementById('topbar');

const TABS = [
  { path: '/today', label: 'Accueil', icon: 'home', also: ['/wellness', '/timer'] },
  { path: '/plan', label: 'Programme', icon: 'calendar' },
  { path: '/arena', label: 'Arène', icon: 'sword', also: ['/coach'] },
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
    h('a', { href: '#/profile', class: `icon-btn${path === '/profile' ? ' on' : ''}`, 'aria-label': 'Profil et réglages' }, icon('user')));
}

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

if (!getState().profile && currentPath() !== '/onboarding') {
  history.replaceState(null, '', '#/onboarding');
}
startRouter();
if (getState().profile) setTimeout(() => checkTitles(), 800);

// Service worker : fonctionnement hors ligne + installation sur l'écran d'accueil
if ('serviceWorker' in navigator && location.protocol !== 'file:' && !navigator.webdriver) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW', e));
  });
}
