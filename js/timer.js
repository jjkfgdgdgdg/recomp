// Minuteur à étapes (rounds de Muay Thai, intervalles HIIT) avec cloche, bips et combinaisons annoncées.
import { bell, beep, clap, countdownBeep, speak } from './audio.js';
import { EX } from './data/exercises.js';
import { combosForLevel, ENCOURAGEMENTS } from './data/muaythai.js';

export function roundSteps({ rounds, work, rest, prep = 10, label = 'Round' }) {
  const steps = [{ kind: 'prep', secs: prep, label: 'En position' }];
  for (let r = 1; r <= rounds; r += 1) {
    steps.push({ kind: 'work', secs: work, label: `${label} ${r}/${rounds}`, round: r, bell: true });
    if (r < rounds) steps.push({ kind: 'rest', secs: rest, label: 'Repos', round: r, bell: true });
  }
  return steps;
}

export function intervalSteps({ exercises, rounds, work, restSec, prep = 10 }) {
  const steps = [{ kind: 'prep', secs: prep, label: 'Prépare-toi', next: EX[exercises[0]]?.name }];
  for (let r = 1; r <= rounds; r += 1) {
    exercises.forEach((id, i) => {
      steps.push({ kind: 'work', secs: work, label: EX[id]?.name || id, exId: id, round: r, of: rounds });
      const last = r === rounds && i === exercises.length - 1;
      if (!last) {
        const nextId = exercises[(i + 1) % exercises.length];
        steps.push({ kind: 'rest', secs: restSec, label: 'Récup', next: EX[nextId]?.name, round: r });
      }
    });
  }
  return steps;
}

export class PhaseTimer {
  /**
   * opts: { combos: bool, mtLevel, comboEvery: [min,max], onTick(state), onStep(step, index), onCombo(text), onDone() }
   */
  constructor(steps, opts = {}) {
    this.steps = steps;
    this.opts = opts;
    this.index = 0;
    this.remaining = steps[0]?.secs ?? 0;
    this.running = false;
    this.handle = null;
    this.last = null;
    this.nextCombo = null;
    this.comboList = opts.combos ? combosForLevel(opts.mtLevel ?? 1) : null;
    this.lastCombo = '';
    this.elapsedWork = 0;
  }

  get step() { return this.steps[this.index]; }

  get totalRemaining() {
    return this.remaining + this.steps.slice(this.index + 1).reduce((s, x) => s + x.secs, 0);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    if (this.index === 0 && this.remaining === this.steps[0].secs) this.enter(0, true);
    this.handle = setInterval(() => this.tick(), 100);
    this.emit();
  }

  pause() {
    this.running = false;
    clearInterval(this.handle);
    this.emit();
  }

  toggle() {
    if (this.running) this.pause(); else this.start();
  }

  stop() {
    this.running = false;
    clearInterval(this.handle);
  }

  skip() {
    if (this.index < this.steps.length - 1) this.enter(this.index + 1);
    else this.finish();
  }

  enter(i, first = false) {
    this.index = i;
    const st = this.steps[i];
    this.remaining = st.secs;
    this.prevWhole = Math.ceil(this.remaining);
    if (!first || st.kind !== 'prep') {
      if (st.kind === 'work') {
        if (st.bell) bell(1); else beep(990, 0.3, 0.3);
        speak(st.exId ? st.label : 'C’est parti !', { interrupt: true });
      } else if (st.kind === 'rest') {
        if (st.bell) bell(2); else beep(440, 0.3, 0.25);
        speak(st.next ? `Repos. Prochain : ${st.next}` : 'Repos, respire.', { interrupt: true });
      }
    } else if (st.kind === 'prep') {
      speak(st.next ? `Prépare-toi. Premier exercice : ${st.next}` : 'Mets-toi en garde', { interrupt: true });
    }
    this.nextCombo = st.kind === 'work' && this.comboList ? 3 + Math.random() * 2 : null;
    this.opts.onStep?.(st, i);
    this.emit();
  }

  tick() {
    if (!this.running) return;
    const now = performance.now();
    const dt = (now - this.last) / 1000;
    this.last = now;
    this.remaining -= dt;
    const st = this.step;
    if (st.kind === 'work') this.elapsedWork += dt;
    const whole = Math.ceil(this.remaining);
    if (whole !== this.prevWhole) {
      this.prevWhole = whole;
      if (whole <= 3 && whole > 0 && st.kind !== 'work') countdownBeep(whole);
      if (whole <= 3 && whole > 0 && st.kind === 'work' && !st.bell) countdownBeep(whole);
      if (st.kind === 'work' && st.bell && whole === 10) { clap(); speak('10 secondes, accélère !', { interrupt: true }); }
    }
    if (this.nextCombo !== null && st.kind === 'work') {
      const into = st.secs - this.remaining;
      if (into >= this.nextCombo && this.remaining > 4) {
        const [a, b] = this.opts.comboEvery || [4, 7];
        let text;
        if (Math.random() < 0.12) text = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
        else {
          do { text = this.comboList[Math.floor(Math.random() * this.comboList.length)]; } while (text === this.lastCombo && this.comboList.length > 1);
          this.lastCombo = text;
        }
        speak(text, { interrupt: true, rate: 1.15 });
        this.opts.onCombo?.(text);
        this.nextCombo = into + a + Math.random() * (b - a);
      }
    }
    if (this.remaining <= 0) {
      if (this.index < this.steps.length - 1) this.enter(this.index + 1);
      else this.finish();
      return;
    }
    this.emit();
  }

  finish() {
    this.stop();
    this.remaining = 0;
    bell(3);
    speak('Terminé ! Excellent travail.', { interrupt: true });
    this.emit();
    this.opts.onDone?.();
  }

  emit() {
    this.opts.onTick?.({
      step: this.step, index: this.index, remaining: Math.max(0, this.remaining), running: this.running,
      totalRemaining: this.totalRemaining,
    });
  }
}
