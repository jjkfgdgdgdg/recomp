// Minuteur de rounds Muay Thai autonome, avec coach vocal qui annonce les combinaisons.
import { h, add, clear, chips, icon } from '../ui.js';
import { getState } from '../store.js';
import { PhaseTimer, roundSteps } from '../timer.js';
import { roundConfig } from '../data/muaythai.js';
import { formatDuration } from '../engine/dates.js';
import { unlockAudio, keepAwake } from '../audio.js';
import { openCoach } from './coachOverlay.js';

export function renderTimer(root) {
  const prof = getState().profile;
  const def = roundConfig(prof.mtLevel ?? 0);
  const cfg = { rounds: 5, work: def.round, rest: def.rest, combos: true, level: Math.max(1, prof.mtLevel || 1) };
  let pt = null;
  clear(root);

  const label = h('div', { class: 'phase-label' }, 'Prêt ?');
  const time = h('div', { class: 'phase-time' }, formatDuration(cfg.work));
  const combo = h('div', { class: 'combo' }, '');
  const box = h('div', { class: 'phase-box big' }, label, time, combo);
  const playBtn = h('button', { class: 'btn primary big', onclick: () => play() }, icon('play'), ' Lancer');
  const settings = h('div', { class: 'stack' });

  const renderSettings = () => {
    clear(settings);
    add(settings,
      field('Rounds', chips([1, 2, 3, 4, 5, 6, 8, 10, 12].map((v) => ({ id: v, label: String(v) })), cfg.rounds, { multi: false, onChange: (v) => { cfg.rounds = v; reset(); } })),
      field('Durée du round', chips([60, 90, 120, 180, 240, 300].map((v) => ({ id: v, label: formatDuration(v) })), cfg.work, { multi: false, onChange: (v) => { cfg.work = v; reset(); } })),
      field('Repos', chips([15, 30, 45, 60, 90].map((v) => ({ id: v, label: `${v} s` })), cfg.rest, { multi: false, onChange: (v) => { cfg.rest = v; reset(); } })),
      field('Coach vocal (combinaisons)', chips([{ id: 0, label: 'Désactivé' }, { id: 1, label: 'Débutant' }, { id: 2, label: 'Intermédiaire' }, { id: 3, label: 'Avancé' }], cfg.combos ? cfg.level : 0, {
        multi: false, onChange: (v) => { cfg.combos = v > 0; cfg.level = v || 1; reset(); },
      })),
    );
  };

  const reset = () => {
    pt?.stop();
    pt = null;
    label.textContent = 'Prêt ?';
    time.textContent = formatDuration(cfg.work);
    combo.textContent = '';
    box.className = 'phase-box big';
    add(clear(playBtn), icon('play'), ' Lancer');
    keepAwake(false);
  };

  const play = () => {
    unlockAudio();
    if (!pt) {
      pt = new PhaseTimer(roundSteps({ rounds: cfg.rounds, work: cfg.work, rest: cfg.rest }), {
        combos: cfg.combos, mtLevel: cfg.level, comboEvery: roundConfig(cfg.level).comboEvery,
        onTick: ({ step, remaining, running }) => {
          label.textContent = step.label;
          time.textContent = formatDuration(remaining);
          box.className = `phase-box big k-${step.kind}`;
          add(clear(playBtn), icon(running ? 'pause' : 'play'), running ? ' Pause' : ' Reprendre');
        },
        onCombo: (t) => { combo.textContent = t; combo.classList.remove('pop'); void combo.offsetWidth; combo.classList.add('pop'); },
        onStep: (st) => { if (st.kind !== 'work') combo.textContent = ''; },
        onDone: () => { keepAwake(false); label.textContent = 'Terminé 🏆'; add(clear(playBtn), icon('refresh'), ' Recommencer'); pt = null; },
      });
      keepAwake(true);
    }
    pt.toggle();
  };

  renderSettings();
  add(root,
    h('section', { class: 'page-head' }, h('h1', null, '🥊 Minuteur de rounds'), h('p', { class: 'muted' }, 'Cloche, 10 dernières secondes signalées, et combinaisons annoncées à voix haute pendant le round.')),
    box,
    h('div', { class: 'row gap center' }, playBtn, h('button', { class: 'btn ghost', onclick: () => pt?.skip() }, 'Passer'), h('button', { class: 'btn ghost', onclick: reset }, 'Reset')),
    h('button', {
      class: 'btn cam',
      onclick: () => {
        reset();
        openCoach({
          trackerId: 'guard', title: 'Shadow boxing',
          rounds: { rounds: cfg.rounds, work: cfg.work, rest: cfg.rest, combos: cfg.combos, mtLevel: cfg.level, comboEvery: roundConfig(cfg.level).comboEvery },
        });
      },
    }, icon('camera'), ' Avec la caméra : contrôle de garde + compteur de coups'),
    h('section', { class: 'card' }, settings),
  );
  return () => { pt?.stop(); keepAwake(false); };
}

function field(label, el) {
  return h('div', { class: 'field' }, h('span', { class: 'field-label' }, label), el);
}
