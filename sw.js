// Service worker : met l'app en cache pour qu'elle marche hors connexion.
// Pense à changer VERSION à chaque mise à jour de l'app.
const VERSION = 'recomp-v2.0.0';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/app.js',
  './js/audio.js',
  './js/router.js',
  './js/services.js',
  './js/store.js',
  './js/timer.js',
  './js/ui.js',
  './js/data/exercises.js',
  './js/data/meals.js',
  './js/data/muaythai.js',
  './js/engine/dates.js',
  './js/engine/nutrition.js',
  './js/engine/planner.js',
  './js/engine/progression.js',
  './js/engine/random.js',
  './js/engine/readiness.js',
  './js/pose/detector.js',
  './js/pose/draw.js',
  './js/pose/geometry.js',
  './js/pose/trackers.js',
  './js/views/coach.js',
  './js/views/coachOverlay.js',
  './js/views/common.js',
  './js/views/onboarding.js',
  './js/views/plan.js',
  './js/views/profile.js',
  './js/views/progress.js',
  './js/views/session.js',
  './js/views/timer.js',
  './js/views/today.js',
  './js/views/wellness.js',
  './js/voice.js',
  './js/data/guides.js',
  './js/data/muscles.js',
  './js/data/technique.js',
  './js/game/bosses.js',
  './js/game/leveling.js',
  './js/game/monster.js',
  './js/game/quests.js',
  './js/game/service.js',
  './js/pose/demos.js',
  './js/pose/stage.js',
  './js/views/academy.js',
  './js/views/arena.js',
  './js/views/bossFight.js',
  './js/views/demo.js',
  './js/views/hero.js',
  './js/views/library.js',
  './js/views/musclemap.js',
  './js/views/quests.js',
];
const VENDOR_CACHE = 'recomp-vendor-mediapipe-0.10.35';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== VENDOR_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Gros fichiers MediaPipe (modèle + wasm) : cache d'abord, ils ne changent jamais pour une version donnée.
  if (url.pathname.includes('/vendor/')) {
    event.respondWith(
      caches.open(VENDOR_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  // App : réponse immédiate depuis le cache, mise à jour en arrière-plan.
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const hit = await cache.match(request, { ignoreSearch: true });
      const network = fetch(request)
        .then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        })
        .catch(() => hit || (request.mode === 'navigate' ? cache.match('./index.html') : undefined));
      return hit || network;
    }),
  );
});
