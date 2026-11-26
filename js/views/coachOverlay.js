// Coach caméra plein écran : vidéo + squelette + compteur + corrections vocales.
import { h, icon, clear, toast } from '../ui.js';
import { getDetector, startCamera, stopCamera } from '../pose/detector.js';
import { drawSkeleton } from '../pose/draw.js';
import { normalize } from '../pose/geometry.js';
import { TRACKERS } from '../pose/trackers.js';
import {
  speak, beep, success, unlockAudio, keepAwake, stopSpeaking, vibrate, countdownBeep,
} from '../audio.js';
import { getState, update } from '../store.js';
import { PhaseTimer, roundSteps } from '../timer.js';
import { formatDuration, todayISO } from '../engine/dates.js';

/**
 * opts = {
 *   trackerId, title, exId,
 *   target: { reps } | { secs },
 *   rounds: { rounds, work, rest, combos, mtLevel } (shadow boxing),
 *   test: bool (test de niveau : jusqu'à l'échec), timeLimit: secondes (arrêt automatique),
 *   onDone(summary | null)
 * }
 */
export function openCoach(opts) {
  const def = TRACKERS[opts.trackerId];
  if (!def) { toast('Exercice non compatible caméra'); return; }
  unlockAudio();
  const settings = getState().settings;
  let facing = 'user';
  let stream = null;
  let detector = null;
  let tracker = null;
  let preview = def.make();
  let running = false; // boucle de détection
  let active = false; // comptage actif
  let finished = false;
  let raf = null;
  let lastVideoTime = -1;
  let lastBadSpoken = 0;
  let countdownTimer = null;
  let phaseTimer = null;
  let startedAt = 0;
  let frames = 0; let fpsT = performance.now(); let fps = 0;
  let noPoseSince = null;
  let limitTimer = null;
  let lastLimitWhole = null;

  const video = h('video', { class: 'coach-video', playsinline: true, muted: true, autoplay: true });
  const canvas = h('canvas', { class: 'coach-canvas' });
  const ctx = canvas.getContext('2d');
  const inner = h('div', { class: 'coach-inner' }, video, canvas);
  const stage = h('div', { class: 'coach-stage' }, inner);

  const countEl = h('div', { class: 'hud-count' }, '0');
  const targetEl = h('div', { class: 'hud-target' }, '');
  const partialEl = h('div', { class: 'hud-partial' }, '');
  const metricEl = h('div', { class: 'hud-metric' }, '');
  const gaugeFill = h('div', { class: 'gauge-fill' });
  const gauge = h('div', { class: 'hud-gauge', title: 'Amplitude' }, gaugeFill);
  gauge.hidden = true;
  const feedbackEl = h('div', { class: 'hud-feedback' }, 'Chargement…');
  const bigMsg = h('div', { class: 'hud-big' }, '');
  const comboEl = h('div', { class: 'hud-combo' }, '');
  const fpsEl = h('div', { class: 'hud-fps' }, '');
  const hud = h('div', { class: 'coach-hud' },
    h('div', { class: 'hud-topleft' }, h('div', { class: 'hud-countwrap' }, countEl, targetEl), partialEl, metricEl),
    gauge, comboEl, bigMsg, feedbackEl, fpsEl);

  const voiceBtn = h('button', { class: 'icon-btn light', 'aria-label': 'Voix du coach', onclick: () => toggleVoice() }, icon(settings.voice ? 'volume' : 'mute'));
  const startBtn = h('button', { class: 'btn primary big', disabled: true }, 'Chargement du coach…');
  startBtn.onclick = () => startCountdown();
  const finishBtn = h('button', { class: 'btn light', onclick: () => finish() }, 'Terminer');
  finishBtn.hidden = true;
  const bottom = h('div', { class: 'coach-bottom' }, startBtn, finishBtn);

  const placeCard = h('div', { class: 'coach-place' },
    h('div', { class: 'place-title' }, '📱 Comment te placer'),
    h('p', null, def.place),
    h('p', { class: 'muted small' }, `Vue conseillée : ${def.view}. Lumière de face, pas de contre-jour. La vidéo reste sur ton appareil.`));

  const root = h('div', { class: 'coach', role: 'dialog', 'aria-label': `Coach caméra : ${opts.title || def.label}` },
    h('div', { class: 'coach-top' },
      h('button', { class: 'icon-btn light', 'aria-label': 'Fermer', onclick: () => close(null) }, icon('close')),
      h('div', { class: 'coach-title' }, opts.title || def.label),
      h('button', { class: 'icon-btn light', 'aria-label': 'Changer de caméra', onclick: () => flip() }, icon('flip')),
      voiceBtn),
    stage, hud, placeCard, bottom);
  document.body.append(root);
  document.body.classList.add('no-scroll');
  keepAwake(true);

  const targetReps = opts.target?.reps;
  const targetSecs = opts.target?.secs;
  if (def.mode === 'hold') targetEl.textContent = targetSecs ? `/ ${targetSecs} s` : 's';
  else if (def.mode === 'guard') targetEl.textContent = 'coups';
  else targetEl.textContent = opts.test ? 'max' : targetReps ? `/ ${targetReps}` : 'reps';

  function toggleVoice() {
    update((s) => { s.settings.voice = !s.settings.voice; });
    clear(voiceBtn).append(icon(getState().settings.voice ? 'volume' : 'mute'));
    if (!getState().settings.voice) stopSpeaking();
  }

  function fit() {
    if (!video.videoWidth) return;
    const box = stage.getBoundingClientRect();
    const s = Math.min(box.width / video.videoWidth, box.height / video.videoHeight);
    inner.style.width = `${Math.floor(video.videoWidth * s)}px`;
    inner.style.height = `${Math.floor(video.videoHeight * s)}px`;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    inner.classList.toggle('mirror', facing === 'user');
  }
  window.addEventListener('resize', fit);

  async function init() {
    try {
      feedbackEl.textContent = 'Démarrage de la caméra…';
      stream = await startCamera(video, facing);
      fit();
      feedbackEl.textContent = 'Chargement du squelette (la 1re fois peut prendre quelques secondes)…';
      detector = await getDetector(getState().settings.model || 'lite');
      startBtn.disabled = false;
      startBtn.textContent = opts.rounds ? 'Lancer les rounds' : 'Je suis en place, go !';
      feedbackEl.textContent = 'Place-toi dans l’image';
      running = true;
      loop();
    } catch (err) {
      console.error(err);
      const msg = err?.name === 'NotAllowedError'
        ? 'Accès caméra refusé. Autorise la caméra dans les réglages du navigateur.'
        : err?.message || 'Impossible de démarrer la caméra.';
      feedbackEl.textContent = msg;
      feedbackEl.className = 'hud-feedback bad';
      startBtn.textContent = 'Réessayer';
      startBtn.disabled = false;
      startBtn.onclick = () => { startBtn.onclick = () => startCountdown(); init(); };
    }
  }

  async function flip() {
    facing = facing === 'user' ? 'environment' : 'user';
    stopCamera(stream);
    try {
      stream = await startCamera(video, facing);
      lastVideoTime = -1;
      fit();
    } catch {
      facing = 'user';
      toast('Une seule caméra disponible');
      stream = await startCamera(video, facing);
      fit();
    }
  }

  function startCountdown() {
    unlockAudio();
    placeCard.hidden = true;
    startBtn.hidden = true;
    finishBtn.hidden = false;
    if (opts.rounds) { startRounds(); return; }
    let n = 5;
    bigMsg.textContent = n;
    speak('En position', { interrupt: true });
    countdownTimer = setInterval(() => {
      n -= 1;
      if (n > 0) {
        bigMsg.textContent = n;
        if (n <= 3) { countdownBeep(n); speak(String(n), { interrupt: true }); }
      } else {
        clearInterval(countdownTimer);
        bigMsg.textContent = 'GO !';
        countdownBeep(0);
        speak('C’est parti !', { interrupt: true });
        setTimeout(() => { bigMsg.textContent = ''; }, 700);
        begin();
      }
    }, 1000);
  }

  function begin() {
    tracker = def.make();
    active = true;
    gauge.hidden = def.mode !== 'reps';
    startedAt = performance.now();
    if (opts.timeLimit) {
      limitTimer = setInterval(() => {
        const left = opts.timeLimit - (performance.now() - startedAt) / 1000;
        targetEl.textContent = `⏱ ${Math.max(0, Math.ceil(left))} s`;
        if (left <= 3 && left > 0 && Math.ceil(left) !== lastLimitWhole) { lastLimitWhole = Math.ceil(left); countdownBeep(lastLimitWhole); }
        if (left <= 0) { clearInterval(limitTimer); success(); speak('Temps écoulé !', { interrupt: true }); finish(); }
      }, 200);
    }
  }

  function startRounds() {
    const r = opts.rounds;
    tracker = def.make();
    phaseTimer = new PhaseTimer(roundSteps({ rounds: r.rounds, work: r.work, rest: r.rest, prep: 8 }), {
      combos: r.combos, mtLevel: r.mtLevel, comboEvery: r.comboEvery,
      onStep: (st) => {
        active = st.kind === 'work';
        if (active && !startedAt) startedAt = performance.now();
        comboEl.textContent = '';
      },
      onCombo: (text) => {
        comboEl.textContent = text;
        comboEl.classList.remove('pop');
        void comboEl.offsetWidth;
        comboEl.classList.add('pop');
      },
      onTick: ({ step, remaining }) => {
        bigMsg.textContent = step.kind === 'work' ? '' : `${step.label} · ${formatDuration(remaining)}`;
        targetEl.textContent = step.kind === 'work' ? `${step.label} · ${formatDuration(remaining)}` : step.label;
      },
      onDone: () => finish(),
    });
    phaseTimer.start();
  }

  function loop() {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (video.readyState < 2 || !detector) return;
    if (video.currentTime === lastVideoTime) return;
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
    if (now - fpsT > 1000) { fps = frames; frames = 0; fpsT = now; fpsEl.textContent = `${fps} img/s`; }
    const lm = result?.landmarks?.[0];
    if (!lm) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (noPoseSince === null) noPoseSince = now;
      if (now - noPoseSince > 600) setFeedback({ text: 'Je ne te vois pas : recule et mets tout ton corps dans l’image', level: 'warn' });
      return;
    }
    noPoseSince = null;
    const pts = normalize(lm, video.videoWidth / video.videoHeight);
    const st = active ? tracker.update(pts, now) : preview.update(pts, now);
    drawSkeleton(ctx, lm, st.joints);
    render(st);
    if (active) handleEvents(st);
  }

  function setFeedback(fb) {
    if (!fb) { feedbackEl.textContent = ''; feedbackEl.className = 'hud-feedback empty'; return; }
    feedbackEl.textContent = fb.text;
    feedbackEl.className = `hud-feedback ${fb.level}`;
  }

  function render(st) {
    if (!active) {
      setFeedback(st.ready ? { text: 'Position OK ✅', level: 'good' } : st.feedback);
      return;
    }
    if (def.mode === 'hold') {
      countEl.textContent = Math.floor(st.holdSec);
    } else if (def.mode === 'guard') {
      countEl.textContent = st.extra ? st.extra.punches + st.extra.kicks : st.reps;
      partialEl.textContent = st.extra ? `👊 ${st.extra.punches} · 🦵 ${st.extra.kicks}` : '';
    } else {
      countEl.textContent = st.reps;
      partialEl.textContent = st.partial ? `✗ ${st.partial} incomplète${st.partial > 1 ? 's' : ''}` : '';
    }
    metricEl.textContent = st.metric ? `${st.metric.label} ${st.metric.value}${st.metric.unit}` : '';
    gaugeFill.style.height = `${Math.round((st.progress || 0) * 100)}%`;
    gauge.classList.toggle('full', (st.progress || 0) >= 0.99);
    setFeedback(st.feedback);
    if (st.feedback?.level === 'bad' && performance.now() - lastBadSpoken > 4000) {
      lastBadSpoken = performance.now();
      speak(st.feedback.text, { minGap: 4000 });
    }
    if (def.mode === 'hold' && targetSecs && st.holdSec >= targetSecs && !finished) {
      success();
      speak('Objectif atteint, bravo !', { interrupt: true });
      finish();
    }
  }

  function handleEvents(st) {
    for (const ev of st.events) {
      if (ev.type === 'rep' && ev.valid) {
        beep(880, 0.08, 0.2);
        vibrate(40);
        countEl.classList.remove('pop');
        void countEl.offsetWidth;
        countEl.classList.add('pop');
        if (getState().settings.voiceCounts !== false) speak(String(ev.count), { interrupt: true });
        if (targetReps && !opts.test && ev.count >= targetReps && !finished) {
          success();
          setTimeout(() => speak('Série terminée, bravo !', { interrupt: true }), 500);
          setTimeout(() => finish(), 900);
        }
      } else if (ev.type === 'rep' && !ev.valid) {
        beep(220, 0.18, 0.25, 'triangle');
        speak(ev.msg, { interrupt: true, minGap: 2500 });
      } else if (ev.type === 'cue') {
        speak(ev.msg, { minGap: 3500 });
      }
    }
  }

  function finish() {
    if (finished) return;
    finished = true;
    active = false;
    clearInterval(countdownTimer);
    clearInterval(limitTimer);
    phaseTimer?.stop();
    if (!tracker) { close(null); return; }
    const summary = {
      ...tracker.summary(),
      trackerId: opts.trackerId,
      exId: opts.exId || null,
      durationSec: Math.round((performance.now() - (startedAt || performance.now())) / 1000),
      date: todayISO(),
      test: !!opts.test,
    };
    const rec = saveCoachLog(summary);
    showSummary(summary, rec);
  }

  function showSummary(s, rec) {
    finishBtn.hidden = true;
    const isHold = def.mode === 'hold';
    const isGuard = def.mode === 'guard';
    const main = isHold ? `${s.holdSec} s` : isGuard ? `${s.punches + s.kicks} coups` : `${s.reps} reps`;
    const nothing = isHold || isGuard ? s.activeSec === 0 : s.reps + s.partial === 0;
    feedbackEl.hidden = true;
    gauge.hidden = true;
    const card = h('div', { class: 'coach-summary' },
      h('div', { class: 'sum-emoji' }, s.score >= 85 ? '🏆' : s.score >= 60 ? '💪' : '📈'),
      h('div', { class: 'sum-main' }, main),
      rec ? h('div', { class: 'badge gold' }, '🎉 Nouveau record perso !') : null,
      h('div', { class: 'sum-grid' },
        isGuard ? [
          h('div', null, h('b', null, `${s.score}%`), h('span', null, 'garde haute')),
          h('div', null, h('b', null, s.punches), h('span', null, 'coups de poing')),
          h('div', null, h('b', null, s.kicks), h('span', null, 'coups de pied')),
        ] : isHold ? [
          h('div', null, h('b', null, `${s.score}%`), h('span', null, 'du temps bien aligné')),
          h('div', null, h('b', null, `${s.activeSec} s`), h('span', null, 'en position')),
        ] : [
          h('div', null, h('b', null, s.reps), h('span', null, 'valides')),
          h('div', null, h('b', null, s.partial), h('span', null, 'incomplètes')),
          h('div', null, h('b', null, `${s.score}%`), h('span', null, 'technique')),
        ]),
      s.topErrors.length ? h('div', { class: 'sum-errors' },
        h('div', { class: 'muted small' }, 'À corriger :'),
        s.topErrors.map((e) => h('div', { class: 'err' }, `• ${e.msg} (${e.n}×)`)))
        : nothing ? h('p', { class: 'muted' }, 'Rien de détecté. Vérifie que tout ton corps est dans l\u2019image et suis les conseils de placement.')
          : h('p', { class: 'muted' }, 'Aucune erreur détectée, technique propre ! 👌'),
      h('div', { class: 'row gap' },
        h('button', { class: 'btn ghost light', onclick: () => restart() }, 'Recommencer'),
        h('button', { class: 'btn primary', onclick: () => close(s) }, 'Valider')));
    root.append(card);
    root.summaryCard = card;
  }

  function restart() {
    root.summaryCard?.remove();
    feedbackEl.hidden = false;
    finished = false;
    tracker = null;
    preview = def.make();
    countEl.textContent = '0';
    partialEl.textContent = '';
    startedAt = 0;
    startCountdown();
  }

  function close(result) {
    running = false;
    active = false;
    cancelAnimationFrame(raf);
    clearInterval(countdownTimer);
    clearInterval(limitTimer);
    phaseTimer?.stop();
    stopCamera(stream);
    stopSpeaking();
    keepAwake(false);
    window.removeEventListener('resize', fit);
    root.remove();
    document.body.classList.remove('no-scroll');
    opts.onDone?.(result);
  }

  init();
  return { close: () => close(null) };
}

function saveCoachLog(s) {
  let record = false;
  update((state) => {
    state.logs.coach.push({
      date: s.date, trackerId: s.trackerId, exId: s.exId, reps: s.reps, partial: s.partial, holdSec: s.holdSec,
      score: s.score, punches: s.punches, kicks: s.kicks, topErrors: s.topErrors, durationSec: s.durationSec, test: s.test,
    });
    if (state.logs.coach.length > 500) state.logs.coach.splice(0, state.logs.coach.length - 500);
    const prev = state.records[s.trackerId] || {};
    const value = TRACKERS[s.trackerId].mode === 'hold' ? s.holdSec : s.reps;
    const prevValue = TRACKERS[s.trackerId].mode === 'hold' ? prev.holdSec || 0 : prev.reps || 0;
    if (value > 0 && value > prevValue) {
      record = prevValue > 0;
      state.records[s.trackerId] = { reps: s.reps, holdSec: s.holdSec, date: s.date };
    }
  });
  return record;
}
