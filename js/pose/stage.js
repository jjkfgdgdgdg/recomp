// Scène caméra réutilisable : vidéo + canvas du squelette + boucle de détection MediaPipe.
import { h } from '../ui.js';
import { getDetector, startCamera, stopCamera } from './detector.js';
import { normalize } from './geometry.js';
import { getState, update } from '../store.js';

// Modèle à charger : choix de l'utilisateur, ou « auto » = précis, sauf si l'appareil a déjà montré qu'il rame.
export function pickModel(settings = getState().settings) {
  if (settings.model === 'lite' || settings.model === 'full') return settings.model;
  return settings.autoModel === 'lite' ? 'lite' : 'full';
}

const SLOW_FPS = 10; // en dessous, le comptage des reps devient approximatif

/**
 * createStage({ onPose(lm, pts, now), onNoPose(now), onFps(fps), onModel(model) })
 * -> { el, video, canvas, ctx, start(), stop(), flip(), facing, model }
 */
export function createStage({ onPose, onNoPose, onFps, onModel } = {}) {
  const video = h('video', { class: 'coach-video', playsinline: true, muted: true, autoplay: true });
  const canvas = h('canvas', { class: 'coach-canvas' });
  const ctx = canvas.getContext('2d');
  const inner = h('div', { class: 'coach-inner' }, video, canvas);
  const el = h('div', { class: 'coach-stage' }, inner);
  let stream = null;
  let detector = null;
  let running = false;
  let raf = null;
  let lastVideoTime = -1;
  let frames = 0; let fpsT = performance.now();
  let slowSamples = 0; let fpsSamples = 0;
  const api = { el, video, canvas, ctx, facing: 'user', model: 'lite' };

  // Mode auto : si le modèle précis tourne trop lentement, on bascule sur le rapide (et on s'en souvient).
  function checkSpeed(fps) {
    fpsSamples += 1;
    if (fpsSamples <= 2 || api.model !== 'full' || getState().settings.model !== 'auto') return;
    slowSamples = fps < SLOW_FPS ? slowSamples + 1 : 0;
    if (slowSamples < 3) return;
    slowSamples = 0;
    update((s) => { s.settings.autoModel = 'lite'; });
    switchModel('lite');
  }

  async function switchModel(model) {
    detector = null; // la boucle attend le nouveau modèle
    api.model = model;
    onModel?.(model);
    try {
      detector = await getDetector(model);
      lastVideoTime = -1;
    } catch (e) {
      console.warn(e);
    }
  }

  function fit() {
    if (!video.videoWidth) return;
    const box = el.getBoundingClientRect();
    const s = Math.min(box.width / video.videoWidth, box.height / video.videoHeight);
    inner.style.width = `${Math.floor(video.videoWidth * s)}px`;
    inner.style.height = `${Math.floor(video.videoHeight * s)}px`;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    inner.classList.toggle('mirror', api.facing === 'user');
  }

  function loop() {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (video.readyState < 2 || !detector || video.currentTime === lastVideoTime) return;
    lastVideoTime = video.currentTime;
    const now = performance.now();
    let result;
    try {
      result = detector.detectForVideo(video, now);
    } catch (e) {
      console.warn(e);
      return;
    }
    frames += 1;
    if (now - fpsT > 1000) { onFps?.(frames); checkSpeed(frames); frames = 0; fpsT = now; }
    const lm = result?.landmarks?.[0];
    if (!lm) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onNoPose?.(now);
      return;
    }
    onPose?.(lm, normalize(lm, video.videoWidth / video.videoHeight), now);
  }

  api.start = async (onStatus) => {
    onStatus?.('Démarrage de la caméra…');
    stream = await startCamera(video, api.facing);
    fit();
    onStatus?.('Chargement du squelette (la 1re fois peut prendre quelques secondes)…');
    api.model = pickModel();
    try {
      detector = await getDetector(api.model);
    } catch (err) {
      if (api.model === 'lite') throw err;
      console.warn('Modèle précis indisponible, passage au rapide', err);
      api.model = 'lite';
      detector = await getDetector('lite');
    }
    onModel?.(api.model);
    window.addEventListener('resize', fit);
    video.addEventListener('resize', fit); // rotation portrait <-> paysage
    running = true;
    loop();
  };

  api.flip = async () => {
    const prev = api.facing;
    api.facing = prev === 'user' ? 'environment' : 'user';
    stopCamera(stream);
    try {
      stream = await startCamera(video, api.facing);
    } catch {
      api.facing = 'user';
      stream = await startCamera(video, api.facing);
      throw new Error('Une seule caméra disponible');
    } finally {
      lastVideoTime = -1;
      fit();
    }
  };

  api.stop = () => {
    running = false;
    cancelAnimationFrame(raf);
    stopCamera(stream);
    window.removeEventListener('resize', fit);
    video.removeEventListener('resize', fit);
  };

  return api;
}

export function cameraErrorMessage(err) {
  if (err?.name === 'NotAllowedError') return 'Accès caméra refusé. Autorise la caméra dans les réglages du navigateur.';
  if (err?.name === 'NotFoundError') return 'Aucune caméra trouvée sur cet appareil.';
  return err?.message || 'Impossible de démarrer la caméra.';
}
