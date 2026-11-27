// Chargement de MediaPipe Pose Landmarker (fichiers inclus dans le dépôt, exécution 100 % locale).
const BASE = new URL('../../vendor/mediapipe/', import.meta.url).href;

let current = null; // { model, promise }

export async function getDetector(model = 'lite') {
  if (model !== 'full') model = 'lite';
  if (current && current.model === model) return current.promise;
  if (current) {
    try { (await current.promise).close(); } catch { /* ignore */ }
  }
  const promise = (async () => {
    const { PoseLandmarker } = await import(`${BASE}vision_bundle.mjs`);
    const fileset = {
      wasmLoaderPath: `${BASE}wasm/vision_wasm_internal.js`,
      wasmBinaryPath: `${BASE}wasm/vision_wasm_internal.wasm`,
    };
    const options = (delegate) => ({
      baseOptions: { modelAssetPath: `${BASE}models/pose_landmarker_${model}.task`, delegate },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    try {
      return await PoseLandmarker.createFromOptions(fileset, options('GPU'));
    } catch (err) {
      console.warn('GPU indisponible, passage au CPU', err);
      return PoseLandmarker.createFromOptions(fileset, options('CPU'));
    }
  })();
  current = { model, promise };
  promise.catch(() => { if (current?.promise === promise) current = null; });
  return promise;
}

export async function startCamera(video, facingMode = 'user') {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Caméra non disponible : ouvre l’app en HTTPS (ou sur localhost) dans un navigateur récent.');
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    // 4:3 = tout le capteur, donc le champ le plus large et le plus haut (on voit mieux tête et pieds).
    // Le 16:9 rogne le haut et le bas de l'image, et donc souvent les jambes.
    video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
  });
  video.srcObject = stream;
  video.setAttribute('playsinline', '');
  video.muted = true;
  await video.play();
  if (!video.videoWidth) {
    await new Promise((res) => { video.onloadedmetadata = res; });
  }
  return stream;
}

export function stopCamera(stream) {
  stream?.getTracks().forEach((t) => t.stop());
}
