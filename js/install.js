// Installation de l'app (PWA) sur téléphone, tablette et PC + détection des mises à jour.
import { isNativeApp } from './platform.js';

let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn(installState()));

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Chrome / Edge / Android : on garde l'événement pour proposer notre propre bouton « Installer »
    e.preventDefault();
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

export function onInstallChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isStandalone() {
  return isNativeApp || window.matchMedia?.('(display-mode: standalone)').matches
    || window.matchMedia?.('(display-mode: window-controls-overlay)').matches
    || navigator.standalone === true;
}

/** Plate-forme détectée, pour afficher les bonnes instructions. */
export function platform() {
  const ua = navigator.userAgent || '';
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (/iPhone|iPod/.test(ua)) return 'iphone';
  if (/iPad/.test(ua) || iPadOS) return 'ipad';
  if (/Android/.test(ua)) return 'android';
  if (/Windows/.test(ua)) return 'windows';
  if (/Macintosh|Mac OS X/.test(ua)) return 'mac';
  if (/Linux|CrOS/.test(ua)) return 'linux';
  return 'other';
}

export function browser() {
  const ua = navigator.userAgent || '';
  if (/Edg\//.test(ua)) return 'edge';
  if (/SamsungBrowser/.test(ua)) return 'samsung';
  if (/Firefox|FxiOS/.test(ua)) return 'firefox';
  if (/CriOS|Chrome/.test(ua)) return 'chrome';
  if (/Safari/.test(ua)) return 'safari';
  return 'other';
}

export function installState() {
  return {
    installed: isStandalone(),
    canPrompt: !!deferredPrompt,
    platform: platform(),
    browser: browser(),
    secure: window.isSecureContext,
  };
}

/** Ouvre la fenêtre d'installation native si possible. Renvoie 'accepted' | 'dismissed' | 'unavailable'. */
export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable';
  const e = deferredPrompt;
  deferredPrompt = null;
  e.prompt();
  const choice = await e.userChoice.catch(() => ({ outcome: 'dismissed' }));
  notify();
  return choice.outcome;
}

// ---------------------------------------------------------------- Service worker & mises à jour
let updateReady = null;
const updateListeners = new Set();

export function onUpdateReady(fn) {
  updateListeners.add(fn);
  if (updateReady) fn(updateReady);
  return () => updateListeners.delete(fn);
}

export function registerServiceWorker() {
  // Dans les applis PC / Android, les fichiers sont déjà sur l'appareil : pas besoin de service worker
  if (isNativeApp || !('serviceWorker' in navigator) || location.protocol === 'file:' || navigator.webdriver) return;
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      const hadController = !!navigator.serviceWorker.controller;
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        sw?.addEventListener('statechange', () => {
          // Nouvelle version installée alors qu'une ancienne contrôlait déjà la page : on propose de recharger
          if (sw.state === 'activated' && hadController) {
            updateReady = () => location.reload();
            updateListeners.forEach((fn) => fn(updateReady));
          }
        });
      });
      // Vérifie les mises à jour quand l'app revient au premier plan
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
    } catch (e) {
      console.warn('SW', e);
    }
  });
}

/** Lien de l'app à partager vers un autre appareil (sans le #/route). */
export function appUrl() {
  // Dans les applis natives, on partage l'adresse du site web (sinon le lien ne s'ouvrirait pas chez un ami)
  if (isNativeApp) return WEB_URL;
  return `${location.origin}${location.pathname.replace(/index\.html$/, '')}`;
}

// Adresse publique du site (GitHub Pages par défaut). À changer si l'app est hébergée ailleurs.
export const WEB_URL = 'https://jjkfgdgdgdg.github.io/recomp/';
