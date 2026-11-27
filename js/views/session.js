// Lecteur de séance guidée : exercice par exercice, repos automatiques, saisie des reps, progression.
import { h, add, clear, icon, ring, stepper, toast, confirmBox } from '../ui.js';
import { getState, update } from '../store.js';
import { EX } from '../data/exercises.js';
import { applyResult } from '../engine/progression.js';
import { formatDuration, todayISO } from '../engine/dates.js';
import { sessionById, prescription, itemTitle } from '../services.js';
import { TRACKERS } from '../pose/trackers.js';
import {
  speak, beep, unlockAudio, keepAwake, countdownBeep, success, stopSpeaking,
} from '../audio.js';
import { PhaseTimer, roundSteps, intervalSteps } from '../timer.js';
import { roundConfig } from '../data/muaythai.js';
import { openCoach } from './coachOverlay.js';
import { exerciseModal, sessionList, typeBadge } from './common.js';
import { navigate } from '../router.js';
import { say } from '../voice.js';
import { award } from '../game/service.js';
import { sessionXp, SPLIT } from '../game/leveling.js';

const NO_RPE = new Set(['mobility', 'warmup', 'breath', 'endurance', 'muaythai']);
const AUTO_BLOCKS = new Set(['Échauffement', 'Retour au calme', 'Routine', 'Mobilité', 'Respiration']);

export function renderSession(root, { id }) {
  const state = getState();
  let run = state.active && state.active.id === id ? state.active : null;
  const session = run ? run.session : sessionById(id);
  if (!session || session.type === 'rest') {
    navigate('#/today', { replace: true });
    return null;
  }
  const items = session.blocks.flatMap((b) => b.items.map((it) => ({ ...it, block: b.name })));
  let timer = null; // intervalle ou PhaseTimer en cours
  let leadTimer = null;
  let disposed = false;

  const stopTimers = () => {
    if (timer?.stop) timer.stop();
    else if (timer) clearInterval(timer);
    timer = null;
    clearInterval(leadTimer);
  };

  const saveRun = () => update((s) => { s.active = run; });

  // ------------------------------------------------------------------ Aperçu
  function overview() {
    stopTimers();
    clear(root);
    add(root, h('section', { class: 'page-head' },
      h('button', { class: 'link small', onclick: () => history.back() }, '← Retour'),
      h('div', { class: 'row between' }, typeBadge(session.type), h('span', { class: 'muted small' }, `~${session.minutes} min · ${items.length} exercices`)),
      h('h1', null, session.title),
      session.deload ? h('div', { class: 'pill info' }, '🔋 Semaine de décharge : volume réduit') : null,
      session.adjusted === 'light' ? h('div', { class: 'pill warn' }, '⚖️ Séance allégée selon ta forme') : null),
    sessionList(session),
    h('div', { class: 'sticky-cta' },
      run ? h('button', { class: 'btn ghost', onclick: async () => { if (await confirmBox('Recommencer la séance depuis le début ?')) { run = null; update((s) => { s.active = null; }); start(); } } }, 'Recommencer') : null,
      h('button', { class: 'btn primary big grow', onclick: () => start() }, run ? `Reprendre (exercice ${run.idx + 1}/${items.length}) ▶` : 'C’est parti ▶')));
  }

  function start() {
    unlockAudio();
    keepAwake(true);
    if (!run) {
      run = { id, session, startedAt: Date.now(), idx: 0, setIdx: 0, results: {}, messages: [] };
      saveRun();
    }
    say('start', { interrupt: true });
    showItem();
  }

  // ------------------------------------------------------------------ Squelette d'écran
  function frame(item, content, { showNav = true } = {}) {
    stopTimers();
    clear(root);
    const ex = EX[item.exId];
    const pct = Math.round((run.idx / items.length) * 100);
    const cuesOpen = h('details', { class: 'cues-box' },
      h('summary', null, 'Consignes'),
      h('ol', { class: 'cues' }, (item.kind === 'interval' ? item.exercises.map((x) => `${EX[x]?.name} : ${EX[x]?.cues[0] || ''}`) : ex?.cues || []).map((c) => h('li', null, c))));
    add(root, h('section', { class: 'player' },
      h('div', { class: 'player-top' },
        h('button', { class: 'icon-btn', 'aria-label': 'Quitter', onclick: () => quit() }, icon('close')),
        h('div', { class: 'progress-top grow' }, h('div', { class: 'progress-top-fill', style: { width: `${pct}%` } })),
        h('span', { class: 'muted small' }, `${run.idx + 1}/${items.length}`)),
      h('div', { class: 'muted small upper' }, item.block),
      h('div', { class: 'row between' },
        h('h1', { class: 'ex-title' }, itemTitle(item)),
        ex ? h('button', { class: 'icon-btn', 'aria-label': 'Détails', onclick: () => exerciseModal(item.kind === 'interval' ? item.exercises[0] : item.exId) }, icon('info')) : null),
      h('div', { class: 'presc' }, prescription(item)),
      ex?.cues?.length ? cuesOpen : null,
      content,
      showNav ? h('div', { class: 'row between player-nav' },
        h('button', { class: 'btn ghost small', disabled: run.idx === 0, onclick: () => { run.idx -= 1; run.setIdx = 0; saveRun(); showItem(); } }, '← Précédent'),
        h('button', { class: 'btn ghost small', onclick: () => nextItem(true) }, 'Passer →')) : null));
  }

  async function quit() {
    stopTimers();
    stopSpeaking();
    keepAwake(false);
    toast('Séance sauvegardée : tu pourras la reprendre');
    navigate('#/today');
  }

  function showItem() {
    if (disposed) return;
    if (run.idx >= items.length) { finishScreen(); return; }
    const item = items[run.idx];
    if (!run.results[run.idx]) run.results[run.idx] = { sets: [] };
    if (item.kind === 'sets') setsScreen(item);
    else if (item.kind === 'timed') timedScreen(item);
    else if (item.kind === 'rounds') roundsScreen(item);
    else if (item.kind === 'interval') intervalScreen(item);
    else nextItem();
  }

  function nextItem(skipped = false) {
    if (skipped) {
      run.results[run.idx] = { ...(run.results[run.idx] || { sets: [] }), skipped: true };
      if (!AUTO_BLOCKS.has(items[run.idx]?.block)) say('skip', { interrupt: true });
    }
    run.idx += 1;
    run.setIdx = 0;
    saveRun();
    showItem();
  }

  function needsRpe(item) {
    const ex = EX[item.exId];
    return ex && !NO_RPE.has(ex.pattern) && !AUTO_BLOCKS.has(item.block) && (item.kind === 'sets' || item.kind === 'timed');
  }

  function afterExercise(item) {
    if (needsRpe(item) && run.results[run.idx].sets.length) rpeScreen(item);
    else nextItem();
  }

  // ------------------------------------------------------------------ Séries de répétitions
  function setsScreen(item) {
    const res = run.results[run.idx];
    const setIdx = run.setIdx;
    const [lo, hi] = item.reps || [8, 12];
    const prev = res.sets[res.sets.length - 1];
    let reps = prev?.reps ?? hi;
    let weight = prev?.weight ?? item.weight ?? 0;
    const ex = EX[item.exId];
    const tracker = item.track && TRACKERS[item.track];
    const dots = h('div', { class: 'set-dots' }, Array.from({ length: item.sets }, (_, i) => h('span', { class: i < setIdx ? 'done' : i === setIdx ? 'cur' : '' })));
    const content = h('div', { class: 'stack' },
      h('div', { class: 'set-head' }, h('b', null, `Série ${setIdx + 1} / ${item.sets}`), dots),
      h('div', { class: 'target' }, 'Objectif : ', h('b', null, lo === hi ? `${hi} reps` : `${lo} à ${hi} reps`), item.unilateral ? ' par côté' : '',
        item.weighted ? h('span', null, ' · ', item.weight ? h('b', null, `${item.weight} kg`) : 'charge pour ~' + hi + ' reps propres') : null),
      h('div', { class: 'inputs' },
        h('div', { class: 'input-col' }, h('span', { class: 'muted small' }, 'Reps faites'), stepper(reps, { min: 0, max: 200, onChange: (v) => { reps = v; } })),
        item.weighted ? h('div', { class: 'input-col' }, h('span', { class: 'muted small' }, 'Charge (kg)'), stepper(weight, { min: 0, max: 400, step: ex?.inc || 2, onChange: (v) => { weight = v; } })) : null),
      tracker ? h('button', {
        class: 'btn cam big',
        onclick: () => openCoach({
          trackerId: item.track, exId: item.exId, title: `${ex.name} · série ${setIdx + 1}`, target: { reps: hi },
          onDone: (sum) => { if (sum) completeSet(sum.reps, weight, sum); },
        }),
      }, icon('camera'), ' Faire la série avec la caméra') : null,
      h('button', { class: 'btn primary big', onclick: () => completeSet(reps, weight) }, icon('check'), ' Série terminée'));
    frame(item, content);
  }

  function completeSet(reps, weight, coach) {
    const item = items[run.idx];
    const res = run.results[run.idx];
    res.sets.push({ reps, weight: item.weighted ? weight : undefined, coach: coach ? { partial: coach.partial, score: coach.score } : undefined });
    run.setIdx += 1;
    saveRun();
    if (run.setIdx < item.sets) {
      restScreen(item.rest || 60, `Série ${run.setIdx + 1} / ${item.sets} : ${itemTitle(item)}`, () => showItem());
    } else {
      afterExercise(item);
    }
  }

  // ------------------------------------------------------------------ Exercices minutés
  function timedScreen(item) {
    const setIdx = run.setIdx;
    const ex = EX[item.exId];
    const both = item.unilateral || ex?.unilateral;
    const total = item.secs * (both ? 2 : 1);
    let remaining = total;
    let running = false;
    let last = 0;
    let prevWhole = Math.ceil(remaining);
    const r = ring(1, 200, 14, formatDuration(remaining));
    const sideEl = h('div', { class: 'muted' }, both ? 'Côté gauche' : '');
    const playBtn = h('button', { class: 'btn primary big', onclick: () => toggle() }, icon('play'), ' Démarrer');
    const tracker = item.track && TRACKERS[item.track];
    const isLong = item.secs >= 600;

    const tick = () => {
      const now = performance.now();
      remaining -= (now - last) / 1000;
      last = now;
      const whole = Math.ceil(remaining);
      if (whole !== prevWhole) {
        prevWhole = whole;
        if (whole <= 3 && whole > 0) countdownBeep(whole);
        if (both && Math.abs(remaining - total / 2) < 0.5 && sideEl.textContent !== 'Côté droit') {
          sideEl.textContent = 'Côté droit';
          beep(990, 0.25);
          speak('Change de côté', { interrupt: true });
        }
        if (whole === 30 && total >= 120) speak('Encore 30 secondes');
      }
      r.set(remaining / total, formatDuration(remaining));
      if (remaining <= 0) {
        clearInterval(timer);
        timer = null;
        countdownBeep(0);
        done(item.secs);
      }
    };
    const toggle = () => {
      if (running) {
        running = false;
        clearInterval(timer);
        timer = null;
        add(clear(playBtn), icon('play'), ' Reprendre');
      } else {
        running = true;
        last = performance.now();
        timer = setInterval(tick, 200);
        add(clear(playBtn), icon('pause'), ' Pause');
        if (remaining === total) speak(itemTitle(item), { interrupt: true });
      }
    };
    const done = (secs) => {
      const res = run.results[run.idx];
      res.sets.push({ secs: Math.round(secs) });
      run.setIdx += 1;
      saveRun();
      if (run.setIdx < (item.sets || 1)) restScreen(item.rest || 20, `${itemTitle(item)} · ${run.setIdx + 1}/${item.sets}`, () => showItem(), item.rest <= 15);
      else afterExercise(item);
    };

    const content = h('div', { class: 'stack center' },
      item.sets > 1 ? h('div', { class: 'set-head' }, h('b', null, `Série ${setIdx + 1} / ${item.sets}`)) : null,
      r, sideEl,
      playBtn,
      tracker && TRACKERS[item.track].mode !== 'guard' ? h('button', {
        class: 'btn cam',
        onclick: () => {
          if (running) toggle();
          openCoach({
            trackerId: item.track, exId: item.exId, title: itemTitle(item),
            target: TRACKERS[item.track].mode === 'hold' ? { secs: item.secs } : {},
            onDone: (sum) => { if (sum) done(TRACKERS[item.track].mode === 'hold' ? sum.holdSec : item.secs); },
          });
        },
      }, icon('camera'), TRACKERS[item.track].mode === 'hold' ? ' Chrono contrôlé par la caméra' : ' Compter avec la caméra') : null,
      h('button', { class: 'btn ghost', onclick: () => { stopTimers(); done(isLong ? item.secs : total - Math.max(0, remaining)); } }, isLong ? 'J’ai fini mon cardio ✓' : 'Terminé ✓'));
    frame(item, content);

    // Enchaînement automatique pour l'échauffement, les étirements et les routines
    if (AUTO_BLOCKS.has(item.block) && !isLong) {
      let lead = 5;
      const leadEl = h('div', { class: 'lead-count' }, `Départ dans ${lead}…`);
      content.prepend(leadEl);
      leadTimer = setInterval(() => {
        lead -= 1;
        if (lead > 0) leadEl.textContent = `Départ dans ${lead}…`;
        else {
          clearInterval(leadTimer);
          leadEl.remove();
          if (!running) toggle();
        }
      }, 1000);
      speak(`Prochain : ${itemTitle(item)}`, { interrupt: true });
    }
  }

  // ------------------------------------------------------------------ Rounds (Muay Thai)
  function roundsScreen(item) {
    const prof = getState().profile;
    const cfg = roundConfig(prof.mtLevel ?? 0);
    const stepLabel = h('div', { class: 'phase-label' }, 'Prêt ?');
    const time = h('div', { class: 'phase-time' }, formatDuration(item.work));
    const combo = h('div', { class: 'combo' }, item.combos ? 'Les combinaisons seront annoncées à voix haute' : '');
    const playBtn = h('button', { class: 'btn primary big', onclick: () => { unlockAudio(); pt.toggle(); } }, icon('play'), ' Lancer les rounds');
    const box = h('div', { class: 'phase-box' }, stepLabel, time, combo);
    const pt = new PhaseTimer(roundSteps({ rounds: item.rounds, work: item.work, rest: item.restSec }), {
      combos: item.combos, mtLevel: prof.mtLevel ?? 1, comboEvery: cfg.comboEvery,
      onTick: ({ step, remaining, running }) => {
        stepLabel.textContent = step.label;
        time.textContent = formatDuration(remaining);
        box.className = `phase-box k-${step.kind}`;
        add(clear(playBtn), icon(running ? 'pause' : 'play'), running ? ' Pause' : ' Reprendre');
      },
      onCombo: (t) => { combo.textContent = t; combo.classList.remove('pop'); void combo.offsetWidth; combo.classList.add('pop'); },
      onStep: (st) => { if (st.kind !== 'work') combo.textContent = st.kind === 'rest' ? 'Respire, secoue les épaules, bois une gorgée' : ''; },
      onDone: () => { run.results[run.idx].sets.push({ rounds: item.rounds }); saveRun(); setTimeout(() => nextItem(), 1500); },
    });
    const content = h('div', { class: 'stack center' },
      box, playBtn,
      h('button', { class: 'btn ghost small', onclick: () => pt.skip() }, 'Passer l’étape'),
      item.track ? h('button', {
        class: 'btn cam',
        onclick: () => {
          pt.pause();
          openCoach({
            trackerId: item.track, exId: item.exId, title: itemTitle(item),
            rounds: { rounds: item.rounds, work: item.work, rest: item.restSec, combos: item.combos, mtLevel: prof.mtLevel ?? 1, comboEvery: cfg.comboEvery },
            onDone: (sum) => { if (sum) { run.results[run.idx].sets.push({ rounds: item.rounds, guard: sum.score }); saveRun(); nextItem(); } },
          });
        },
      }, icon('camera'), ' Shadow avec caméra (contrôle de garde)') : null);
    frame(item, content);
    timer = pt;
  }

  // ------------------------------------------------------------------ Intervalles (HIIT, circuits)
  function intervalScreen(item) {
    const label = h('div', { class: 'phase-label' }, 'Prêt ?');
    const time = h('div', { class: 'phase-time' }, formatDuration(item.work));
    const nextEl = h('div', { class: 'muted' }, '');
    const box = h('div', { class: 'phase-box' }, label, time, nextEl);
    const playBtn = h('button', { class: 'btn primary big', onclick: () => { unlockAudio(); pt.toggle(); } }, icon('play'), ' Démarrer le circuit');
    const pt = new PhaseTimer(intervalSteps({ exercises: item.exercises, rounds: item.rounds, work: item.work, restSec: item.restSec }), {
      onTick: ({ step, remaining, running }) => {
        label.textContent = step.kind === 'work' ? step.label : step.kind === 'rest' ? 'Récup' : step.label;
        time.textContent = formatDuration(remaining);
        nextEl.textContent = step.kind === 'work' ? `Tour ${step.round}/${step.of}` : step.next ? `Prochain : ${step.next}` : '';
        box.className = `phase-box k-${step.kind}`;
        add(clear(playBtn), icon(running ? 'pause' : 'play'), running ? ' Pause' : ' Reprendre');
      },
      onDone: () => { run.results[run.idx].sets.push({ rounds: item.rounds }); saveRun(); setTimeout(() => nextItem(), 1500); },
    });
    const content = h('div', { class: 'stack center' },
      box, playBtn,
      h('button', { class: 'btn ghost small', onclick: () => pt.skip() }, 'Passer l’étape'),
      h('div', { class: 'small muted' }, item.exercises.map((x) => EX[x]?.name).join(' → ')));
    frame(item, content);
    timer = pt;
  }

  // ------------------------------------------------------------------ Repos
  function restScreen(secs, nextLabel, then, short = false) {
    stopTimers();
    clear(root);
    let remaining = secs;
    let total = secs;
    let last = performance.now();
    let prevWhole = Math.ceil(secs);
    const r = ring(1, 220, 14, formatDuration(remaining));
    if (!short) {
      if (Math.random() < 0.4) say('rest', { interrupt: true });
      else speak(`Repos, ${Math.round(secs)} secondes`);
    }
    const go = () => { stopTimers(); then(); };
    add(root, h('section', { class: 'player rest' },
      h('div', { class: 'upper muted small' }, 'Repos'),
      r,
      h('div', { class: 'muted' }, 'Ensuite : ', h('b', null, nextLabel)),
      h('div', { class: 'row gap' },
        h('button', { class: 'btn ghost', onclick: () => { remaining += 15; total += 15; } }, '+15 s'),
        h('button', { class: 'btn primary', onclick: go }, 'Passer le repos')),
      h('p', { class: 'small muted' }, 'Respire profondément, bois une gorgée, secoue les muscles.')));
    timer = setInterval(() => {
      const now = performance.now();
      remaining -= (now - last) / 1000;
      last = now;
      const whole = Math.ceil(remaining);
      if (whole !== prevWhole) {
        prevWhole = whole;
        if (whole <= 3 && whole > 0) countdownBeep(whole);
        if (whole === 10 && !short) speak('Prépare-toi');
      }
      r.set(remaining / total, formatDuration(remaining));
      if (remaining <= 0) { countdownBeep(0); go(); }
    }, 200);
  }

  // ------------------------------------------------------------------ Ressenti
  function rpeScreen(item) {
    stopTimers();
    clear(root);
    const choose = (rpe) => {
      const res = run.results[run.idx];
      res.rpe = rpe;
      let message = null;
      update((s) => {
        const out = applyResult(s.progression, item.exId, { sets: res.sets, rpe, slot: item.slot }, s.profile);
        s.progression = out.progression;
        message = out.message;
      });
      if (message) { run.messages.push(message); toast(message, 3500); }
      nextItem();
    };
    add(root, h('section', { class: 'player center' },
      h('h2', null, `${itemTitle(item)} : c’était comment ?`),
      h('p', { class: 'muted' }, 'Ta réponse règle automatiquement ta prochaine séance.'),
      h('div', { class: 'rpe' },
        h('button', { class: 'rpe-btn', onclick: () => choose('easy') }, h('span', null, '😌'), 'Facile', h('small', null, 'j’en avais encore 3+')),
        h('button', { class: 'rpe-btn', onclick: () => choose('ok') }, h('span', null, '💪'), 'Correct', h('small', null, 'dur mais propre')),
        h('button', { class: 'rpe-btn', onclick: () => choose('hard') }, h('span', null, '🥵'), 'Très dur', h('small', null, 'à la limite')))));
  }

  // ------------------------------------------------------------------ Fin
  function finishScreen() {
    stopTimers();
    clear(root);
    keepAwake(false);
    success();
    const durationSec = Math.round((Date.now() - run.startedAt) / 1000);
    const exercises = items.map((it, i) => ({ exId: it.exId, kind: it.kind, ...run.results[i] })).filter((x) => x.sets?.length);
    const totalReps = exercises.reduce((s, x) => s + x.sets.reduce((t, st) => t + (st.reps || 0), 0), 0);
    const volume = exercises.reduce((s, x) => s + x.sets.reduce((t, st) => t + (st.reps || 0) * (st.weight || 0), 0), 0);
    let feeling = 3;
    say('finish', { interrupt: true });
    const save = () => {
      const log = {
        id: `${id}-${run.startedAt}`, date: todayISO(), plannedFor: session.date, routine: id.startsWith('routine-'),
        title: session.title, type: session.type, durationSec, exercises, totalReps, volume, feeling, messages: run.messages,
        completedAt: new Date().toISOString(),
      };
      update((s) => {
        s.logs.sessions.push(log);
        s.active = null;
      });
      award(sessionXp(log), SPLIT[session.type] || SPLIT.strength, log.routine ? 'Routine' : 'Séance terminée');
      toast('Séance enregistrée 🔥');
      navigate('#/today');
    };
    add(root, h('section', { class: 'player center finish' },
      h('div', { class: 'finish-emoji' }, '🏆'),
      h('h1', null, 'Séance terminée !'),
      h('div', { class: 'stats3' },
        h('div', null, h('b', null, formatDuration(durationSec)), h('span', null, 'durée')),
        h('div', null, h('b', null, exercises.length), h('span', null, 'exercices')),
        h('div', null, h('b', null, totalReps), h('span', null, 'reps'))),
      volume ? h('p', { class: 'muted' }, `Volume soulevé : ${Math.round(volume)} kg`) : null,
      run.messages.length ? h('div', { class: 'card soft left' }, h('b', null, '📈 Ta progression'), h('ul', { class: 'bullets small' }, run.messages.map((m) => h('li', null, m)))) : null,
      h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Ressenti global'),
        h('div', { class: 'feel' }, ['😫', '😕', '🙂', '😀', '🤩'].map((e, i) => {
          const b = h('button', { class: `feel-btn${i === 2 ? ' on' : ''}`, onclick: () => { feeling = i + 1; b.parentElement.querySelectorAll('.feel-btn').forEach((x) => x.classList.remove('on')); b.classList.add('on'); } }, e);
          return b;
        }))),
      h('button', { class: 'btn primary big', onclick: save }, 'Enregistrer la séance')));
  }

  overview();
  return () => { disposed = true; stopTimers(); keepAwake(false); };
}
