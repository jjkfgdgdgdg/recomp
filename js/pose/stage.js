// Scène caméra réutilisable : vidéo + canvas du squelette + boucle de détection MediaPipe.
import { h } from '../ui.js';
import { getDetector, startCamera, stopCamera } from './detector.js';
import { normalize } from './geometry.js';
import { getState } from '../store.js';

/**
 * createStage({ onPose(lm, pts, now), onNoPose(now), onFps(fps) })
 * -> { el, video, canvas, ctx, start(), stop(), flip(), facing }
 */
export function createStage({ onPose, onNoPose, onFps } = {}) {
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
  const api = { el, video, canvas, ctx, facing: 'user' };

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
    if (now - fpsT > 1000) { onFps?.(frames); frames = 0; fpsT = now; }
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
    detector = await getDetector(getState().settings.model || 'lite');
    window.addEventListener('resize', fit);
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
  };

  return api;
}

export function cameraErrorMessage(err) {
  if (err?.name === 'NotAllowedError') return 'Accès caméra refusé. Autorise la caméra dans les réglages du navigateur.';
  if (err?.name === 'NotFoundError') return 'Aucune caméra trouvée sur cet appareil.';
  return err?.message || 'Impossible de démarrer la caméra.';
}
