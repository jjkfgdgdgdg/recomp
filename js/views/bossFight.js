// Combat de boss : chaque rep bien faite (validée par la caméra) inflige des dégâts.
// Qualité de la rep × combo × force = dégâts. Le boss attaque régulièrement : enchaîne des reps pour esquiver.
import { h, add, icon, clear, toast } from '../ui.js';
import { drawSkeleton } from '../pose/draw.js';
import { TRACKERS, UPPER_ONLY } from '../pose/trackers.js';
import { legsIssue } from '../pose/geometry.js';
import { createStage, cameraErrorMessage } from '../pose/stage.js';
import {
  speak, beep, bell, success, unlockAudio, keepAwake, stopSpeaking, vibrate, countdownBeep,
} from '../audio.js';
import { say, voiceParams } from '../voice.js';
import { getState, update } from '../store.js';
import { todayISO, formatDuration } from '../engine/dates.js';
import {
  BOSS, MODE, bossHp, phaseTarget, repDamage, holdDamage, hitDamage, playerMaxHp, bossAttackDamage, grade, bossXp, comboMult, eventHp,
} from '../game/bosses.js';
import { monsterSvg } from '../game/monster.js';
import { award, bump, playerSummary } from '../game/service.js';

const GRACE = 8; // secondes sans attaque au début de chaque phase
const BREAK = 12; // pause entre deux phases pour se replacer

export function openBossFight(bossId, { manual = false, onDone, event = null } = {}) {
  const base = BOSS[bossId];
  if (!base) return;
  const mod = event?.modifier || {};
  // En événement, le boss est adapté au rang du joueur
  const boss = event ? { ...base, rank: event.rank, attack: { ...base.attack, every: Math.round(base.attack.every * (mod.attackFactor || 1)) } } : base;
  unlockAudio();
  const profile = getState().profile;
  const ps = playerSummary();
  const stats = ps.stats;
  const hps = event ? eventHp(base, profile, ps.level, event) : bossHp(boss, profile, ps.level);
  const totalHp = hps.reduce((a, b) => a + b, 0);
  const phaseHpLeft = [...hps];
  const vp = voiceParams();
  const talk = (t, o = {}) => speak(t, { ...vp, ...o });

  const f = {
    phase: 0, state: 'intro', tracker: null, combo: 0, maxCombo: 0, valid: 0, invalid: 0, dealt: 0,
    playerMax: playerMaxHp(stats.end), playerHp: playerMaxHp(stats.end), phaseStart: 0, startedAt: 0,
    attack: null, nextAttack: 0, lastHold: 0, lastGuard: 0, lastActive: 0, breakTimer: null, tick: null, phaseLogs: [],
  };
  f.phaseLogs = boss.phases.map(() => ({ reps: 0, partial: 0, holdSec: 0, punches: 0, kicks: 0 }));

  // ---------------------------------------------------------------- DOM
  const monster = h('div', { class: 'bf-monster' });
  monster.innerHTML = monsterSvg(boss, { size: 92 });
  const hpFill = h('div', { class: 'bf-hp-fill' });
  const hpGhost = h('div', { class: 'bf-hp-ghost' });
  const hpText = h('span', { class: 'bf-hp-text' }, '');
  const hpBar = h('div', { class: 'bf-hp' }, hpGhost, hpFill,
    hps.slice(0, -1).map((_, i) => h('i', { class: 'bf-seg', style: { left: `${(hps.slice(0, i + 1).reduce((a, b) => a + b, 0) / totalHp) * 100}%` } })), hpText);
  const phaseEl = h('div', { class: 'bf-phase' }, '');
  const bossPanel = h('div', { class: 'bf-boss' }, monster,
    h('div', { class: 'bf-bossinfo' },
      h('div', { class: 'bf-name' }, h('span', { class: `rank-badge r-${boss.rank}` }, boss.rank), boss.name),
      hpBar, phaseEl));
  const php = h('div', { class: 'bf-php-fill' });
  const phpText = h('span', null, '');
  const comboEl = h('div', { class: 'bf-combo' }, '');
  const playerPanel = h('div', { class: 'bf-player' },
    h('div', { class: 'bf-php' }, php, h('span', { class: 'bf-php-label' }, '❤️ ', phpText)), comboEl);
  const moveEl = h('div', { class: 'bf-move' }, '');
  const countEl = h('div', { class: 'bf-count' }, '');
  const dmgLayer = h('div', { class: 'bf-dmg-layer' });
  const warnEl = h('div', { class: 'bf-warn', hidden: true });
  const bigMsg = h('div', { class: 'hud-big' }, '');
  const feedbackEl = h('div', { class: 'hud-feedback empty' }, '');
  const flash = h('div', { class: 'bf-flash' });

  let legsSince = null;
  const stage = manual ? null : createStage({
    onPose: (lm, pts, now) => {
      if (!f.tracker) { drawSkeleton(stage.ctx, lm, {}); return; }
      const st = f.tracker.update(pts, now);
      drawSkeleton(stage.ctx, lm, st.joints);
      // Conseil si les jambes sortent de l'image (après ~0,8 s, pour ne pas clignoter)
      const issue = UPPER_ONLY.has(boss.phases[f.phase]?.tracker) ? null : legsIssue(lm);
      if (!issue) legsSince = null; else if (legsSince === null) legsSince = now;
      const legsFb = issue && now - legsSince > 800 ? { text: issue, level: 'warn' } : null;
      if (f.state === 'fight') { onStatus(st, now); setFeedback(st.feedback || legsFb); } else setFeedback(st.ready ? { text: 'Position OK ✅', level: 'good' } : legsFb || st.feedback);
    },
    onNoPose: () => { if (f.state === 'fight' || f.state === 'break') setFeedback({ text: 'Je ne te vois pas : recule !', level: 'warn' }); },
  });

  const manualBtn = h('button', { class: 'btn primary big bf-manual', hidden: true }, '');
  const startBtn = h('button', { class: 'btn primary big', disabled: !manual }, manual ? 'Commencer le combat ⚔️' : 'Chargement de la caméra…');
  startBtn.onclick = () => startFight();
  const quitBtn = h('button', { class: 'btn light', hidden: true, onclick: () => endFight(false, true) }, 'Abandonner');
  const skipBreakBtn = h('button', { class: 'btn light', hidden: true, onclick: () => beginPhase() }, 'Je suis prêt !');

  const intro = h('div', { class: 'coach-place bf-intro' },
    h('div', { class: 'place-title' }, `⚔️ ${boss.name}`),
    event ? h('div', { class: 'event-tag' }, `📅 Boss de la semaine · ${mod.emoji} ${mod.name} · XP ×${event.xpMult}`) : null,
    event ? h('p', { class: 'small' }, mod.desc) : null,
    h('p', { class: 'small' }, boss.lore),
    h('ol', { class: 'small bf-phases' }, boss.phases.map((p, i) => h('li', null, h('b', null, p.move), ` — ${describeTarget(phaseTarget(p, profile, ps.level, boss.rank))}`))),
    h('p', { class: 'small muted' }, manual
      ? 'Mode sans caméra : appuie sur le bouton à chaque rep. Dégâts réduits (pas de vérification de la technique).'
      : 'Plus ta technique est propre, plus tu fais mal. Enchaîne les reps parfaites pour monter le combo. Quand le boss attaque, fais vite les reps demandées pour esquiver !'));

  const root = h('div', { class: `coach boss-fight${manual ? ' manual' : ''}`, role: 'dialog', 'aria-label': `Combat : ${boss.name}` },
    h('div', { class: 'coach-top' },
      h('button', { class: 'icon-btn light', 'aria-label': 'Fermer', onclick: () => close() }, icon('close')),
      h('div', { class: 'coach-title' }, 'Combat de boss'),
      stage ? h('button', { class: 'icon-btn light', 'aria-label': 'Changer de caméra', onclick: () => stage.flip().catch((e) => toast(e.message)) }, icon('flip')) : h('span')),
    stage ? stage.el : h('div', { class: 'coach-stage bf-arena-bg' }),
    h('div', { class: 'coach-hud' }, bossPanel, playerPanel, dmgLayer, warnEl, bigMsg, h('div', { class: 'bf-movebox' }, moveEl, countEl), feedbackEl),
    flash, intro,
    h('div', { class: 'coach-bottom' }, startBtn, manualBtn, skipBreakBtn, quitBtn));
  document.body.append(root);
  document.body.classList.add('no-scroll');
  keepAwake(true);
  renderBars();

  if (stage) {
    stage.start((msg) => { feedbackEl.className = 'hud-feedback'; feedbackEl.textContent = msg; })
      .then(() => {
        startBtn.disabled = false;
        startBtn.textContent = 'Commencer le combat ⚔️';
        f.tracker = TRACKERS[boss.phases[0].tracker].make();
        setFeedback({ text: 'Place-toi pour la 1re phase', level: 'warn' });
      })
      .catch((err) => {
        setFeedback({ text: cameraErrorMessage(err), level: 'bad' });
        startBtn.disabled = false;
        startBtn.textContent = 'Combattre sans caméra';
        startBtn.onclick = () => { close(); openBossFight(bossId, { manual: true, onDone, event }); };
      });
  }

  // ---------------------------------------------------------------- Déroulé
  function describeTarget(t) {
    if (t.secs) return `≈ ${t.secs} s de gainage parfait`;
    if (t.hits) return `≈ ${t.hits} coups en gardant la garde`;
    return `≈ ${t.reps} reps parfaites`;
  }

  function startFight() {
    unlockAudio();
    intro.hidden = true;
    startBtn.hidden = true;
    quitBtn.hidden = false;
    f.startedAt = performance.now();
    say('start', { interrupt: true });
    bell(1);
    f.tick = setInterval(tick, 100);
    beginPhase(true);
  }

  function beginPhase(first = false) {
    clearInterval(f.breakTimer);
    skipBreakBtn.hidden = true;
    const ph = boss.phases[f.phase];
    f.state = 'fight';
    f.tracker = TRACKERS[ph.tracker].make();
    if (mod.tempo) f.tracker.setTempo?.(mod.tempo);
    f.phaseStart = performance.now();
    f.nextAttack = f.phaseStart + (GRACE + boss.attack.every) * 1000;
    f.attack = null;
    f.lastHold = 0; f.lastGuard = 0; f.lastActive = 0;
    bigMsg.textContent = '';
    phaseEl.textContent = `Phase ${f.phase + 1}/${boss.phases.length} · ${ph.move}`;
    moveEl.textContent = ph.attack;
    countEl.textContent = '';
    if (!first) { say('phase', { interrupt: true }); bell(1); }
    if (manual) setupManual(ph);
  }

  function setupManual(ph) {
    manualBtn.hidden = false;
    const mode = MODE[ph.tracker];
    manualBtn.onpointerdown = null; manualBtn.onpointerup = null; manualBtn.onclick = null;
    if (mode === 'hold') {
      manualBtn.textContent = 'Maintiens appuyé pendant ton gainage';
      let holding = false; let last = 0;
      manualBtn.onpointerdown = () => { holding = true; last = performance.now(); };
      const stop = () => { holding = false; };
      manualBtn.onpointerup = stop; manualBtn.onpointerleave = stop;
      f.manualHold = () => {
        if (!holding) return 0;
        const now = performance.now(); const dt = (now - last) / 1000; last = now; return dt;
      };
    } else {
      f.manualHold = null;
      manualBtn.textContent = mode === 'guard' ? '👊 +1 coup' : `✓ +1 ${ph.move.toLowerCase()}`;
      manualBtn.onclick = () => {
        if (f.state !== 'fight') return;
        // Une vraie rep prend au moins ~0,6 s : on ignore les tapotements trop rapides
        const now = performance.now();
        if (now - (f.lastTap || 0) < 600) return;
        f.lastTap = now;
        if (mode === 'guard') hitBoss(hitDamage('punch', f.combo, stats.agi) * 0.6, false, false, 'punch');
        else onRep({ valid: true, score: 80, manualRep: true });
      };
    }
  }

  // Appelé à chaque image en mode caméra
  function onStatus(st, now) {
    const mode = MODE[boss.phases[f.phase].tracker];
    const log = f.phaseLogs[f.phase];
    if (mode === 'reps') {
      st.events.forEach((ev) => { if (ev.type === 'rep') onRep(ev); });
      countEl.textContent = `${st.reps} ✓${st.partial ? `  ${st.partial} ✗` : ''}`;
      log.reps = st.reps; log.partial = st.partial;
    } else if (mode === 'hold') {
      const d = st.holdSec - f.lastHold;
      f.lastHold = st.holdSec;
      if (d > 0) {
        hitBoss(holdDamage(d, true, stats.str), false, true);
        if (f.attack) f.attack.progress += d;
      }
      countEl.textContent = `${Math.floor(st.holdSec)} s tenues`;
      log.holdSec = st.holdSec;
    } else if (mode === 'guard') {
      st.events.forEach((ev) => {
        if (ev.type === 'hit') {
          f.combo += 1;
          hitBoss(hitDamage(ev.what, f.combo, stats.agi), false, false, ev.what);
          if (f.attack) f.attack.progress += 1;
        }
        if (ev.type === 'cue') breakCombo();
      });
      const ex = st.extra || { punches: 0, kicks: 0 };
      countEl.textContent = `👊 ${ex.punches} · 🦵 ${ex.kicks} · garde ${st.metric?.value ?? 100}%`;
      log.punches = ex.punches; log.kicks = ex.kicks;
      if (f.attack) {
        const g = f.tracker.guardSec; const a = f.tracker.activeSec;
        if (f.lastActive) { f.attack.guard += g - f.lastGuard; f.attack.active += a - f.lastActive; }
        f.lastGuard = g; f.lastActive = a;
      } else { f.lastGuard = f.tracker.guardSec; f.lastActive = f.tracker.activeSec; }
    }
  }

  function onRep(ev) {
    if (f.state !== 'fight') return;
    if (ev.valid) {
      f.valid += 1;
      const r = repDamage({
        valid: true, score: ev.score ?? 100, combo: f.combo, str: stats.str, tec: stats.tec, manual: !!ev.manualRep, critMult: mod.critMult || 2, comboMax: mod.comboMax || 2,
      });
      f.combo += 1;
      f.maxCombo = Math.max(f.maxCombo, f.combo);
      if (f.attack) f.attack.progress += 1;
      beep(r.crit ? 1320 : 880, 0.07, 0.2);
      vibrate(r.crit ? 80 : 30);
      hitBoss(r.dmg, r.crit);
      if (f.combo > 0 && f.combo % 10 === 0) say('combo', { queue: true });
      else if (getState().settings.voiceCounts !== false && !ev.manualRep) talk(String(f.valid), { interrupt: true });
      if (manual) {
        const n = (f.phaseLogs[f.phase].reps += 1);
        countEl.textContent = `${n} rep${n > 1 ? 's' : ''}`;
      }
    } else {
      f.invalid += 1;
      const r = repDamage({ valid: false });
      hitBoss(r.dmg, false, false, null, true);
      breakCombo();
      beep(220, 0.15, 0.25, 'triangle');
      if (ev.msg) talk(ev.msg, { interrupt: true, minGap: 2500 });
    }
  }

  function breakCombo() {
    f.combo = 0;
    renderBars();
  }

  function hitBoss(dmg, crit = false, quiet = false, what = null, miss = false) {
    if (f.state !== 'fight' || dmg <= 0) return;
    phaseHpLeft[f.phase] = Math.max(0, phaseHpLeft[f.phase] - dmg);
    f.dealt += dmg;
    if (!quiet) {
      floatText(miss ? 'RATÉ' : `${crit ? 'CRITIQUE ' : ''}-${Math.round(dmg)}`, miss ? 'miss' : crit ? 'crit' : what === 'kick' ? 'kick' : '');
      monster.classList.remove('hit'); void monster.offsetWidth; monster.classList.add('hit');
    } else {
      f.quietAcc = (f.quietAcc || 0) + dmg;
      if (f.quietAcc >= 15) { floatText(`-${Math.round(f.quietAcc)}`, 'small'); f.quietAcc = 0; }
    }
    renderBars();
    if (phaseHpLeft[f.phase] <= 0) phaseDown();
  }

  function phaseDown() {
    f.attack = null;
    warnEl.hidden = true;
    if (f.phase >= boss.phases.length - 1) { endFight(true); return; }
    f.phase += 1;
    f.state = 'break';
    manualBtn.hidden = true;
    success();
    monster.classList.add('rage');
    const next = boss.phases[f.phase];
    if (stage) f.tracker = TRACKERS[next.tracker].make();
    let left = BREAK;
    bigMsg.textContent = `Phase ${f.phase + 1} : ${next.move}`;
    moveEl.textContent = `${TRACKERS[next.tracker].place}`;
    talk(`Phase ${f.phase + 1}. ${next.move}. Mets-toi en place.`, { interrupt: true });
    skipBreakBtn.hidden = false;
    f.breakTimer = setInterval(() => {
      left -= 1;
      countEl.textContent = `Reprise dans ${left} s`;
      if (left <= 3 && left > 0) countdownBeep(left);
      if (left <= 0) beginPhase();
    }, 1000);
  }

  function tick() {
    if (f.state !== 'fight') return;
    const now = performance.now();
    if (mod.timeLimit) {
      const left = mod.timeLimit - (now - f.startedAt) / 1000;
      phaseEl.textContent = `Phase ${f.phase + 1}/${boss.phases.length} · ${boss.phases[f.phase].move} · ⏱ ${formatDuration(Math.max(0, left))}`;
      if (left <= 0) { endFight(false); return; }
    }
    if (f.manualHold) {
      const d = f.manualHold();
      if (d > 0) { hitBoss(holdDamage(d, true, stats.str) * 0.6, false, true); if (f.attack) f.attack.progress += d; f.phaseLogs[f.phase].holdSec += d; countEl.textContent = `${Math.floor(f.phaseLogs[f.phase].holdSec)} s tenues`; }
    }
    const mode = MODE[boss.phases[f.phase].tracker];
    if (!f.attack && now >= f.nextAttack) {
      const need = mode === 'hold' ? Math.round(boss.attack.window * 0.75) : boss.attack.need;
      f.attack = { start: now, end: now + boss.attack.window * 1000, need, progress: 0, guard: 0, active: 0 };
      const how = mode === 'hold' ? `Tiens le gainage ${need} s pour bloquer !`
        : mode === 'guard' ? 'Garde haute et contre-attaque !'
          : `${need} ${boss.phases[f.phase].move.toLowerCase()} en ${boss.attack.window} s pour esquiver !`;
      warnEl.hidden = false;
      warnEl.textContent = `⚠️ ${boss.attack.name} ! ${how}`;
      beep(330, 0.25, 0.3, 'sawtooth');
      talk(`Attention ! ${how}`, { interrupt: true });
    }
    if (f.attack) {
      const a = f.attack;
      const left = Math.max(0, (a.end - now) / 1000);
      const okNow = mode === 'guard' ? (a.active > 0.5 && a.guard / a.active >= 0.7) : a.progress >= a.need;
      warnEl.dataset.left = `${left.toFixed(1)} s`;
      if (mode !== 'guard' && okNow) resolveAttack(true);
      else if (now >= a.end) resolveAttack(mode === 'guard' ? okNow : false);
    }
  }

  function resolveAttack(dodged) {
    f.attack = null;
    warnEl.hidden = true;
    f.nextAttack = performance.now() + boss.attack.every * 1000;
    if (dodged) {
      floatText('ESQUIVÉ !', 'dodge');
      say('dodge', { interrupt: true });
      hitBoss(8, false, true);
      return;
    }
    const dmg = bossAttackDamage(boss);
    f.playerHp = Math.max(0, f.playerHp - dmg);
    breakCombo();
    flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
    root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake');
    vibrate([80, 40, 80]);
    beep(120, 0.4, 0.35, 'square');
    floatText(`-${dmg} PV`, 'hurt');
    say('hit', { interrupt: true });
    renderBars();
    if (f.playerHp <= 0) endFight(false);
  }

  function floatText(text, cls) {
    const el = h('span', { class: `bf-dmg ${cls}`, style: { left: `${30 + Math.random() * 40}%`, top: `${18 + Math.random() * 14}%` } }, text);
    add(dmgLayer, el);
    setTimeout(() => el.remove(), 1100);
  }

  function renderBars() {
    const left = phaseHpLeft.reduce((a, b) => a + b, 0);
    const pct = (left / totalHp) * 100;
    hpFill.style.width = `${pct}%`;
    setTimeout(() => { hpGhost.style.width = `${pct}%`; }, 350);
    hpText.textContent = `${Math.ceil(left)} / ${totalHp}`;
    php.style.width = `${(f.playerHp / f.playerMax) * 100}%`;
    php.classList.toggle('low', f.playerHp / f.playerMax < 0.3);
    phpText.textContent = `${f.playerHp} / ${f.playerMax}`;
    comboEl.textContent = f.combo >= 2 ? `Combo ×${f.combo} · dégâts ×${comboMult(f.combo, mod.comboMax || 2).toFixed(2)}` : '';
    comboEl.classList.toggle('hot', f.combo >= 10);
  }

  function setFeedback(fb) {
    if (!fb) { feedbackEl.textContent = ''; feedbackEl.className = 'hud-feedback empty'; return; }
    feedbackEl.textContent = fb.text;
    feedbackEl.className = `hud-feedback ${fb.level}`;
  }

  // ---------------------------------------------------------------- Fin
  function endFight(won, abandoned = false) {
    if (f.state === 'end') return;
    f.state = 'end';
    clearInterval(f.tick);
    clearInterval(f.breakTimer);
    manualBtn.hidden = true;
    quitBtn.hidden = true;
    skipBreakBtn.hidden = true;
    warnEl.hidden = true;
    const timeSec = Math.round((performance.now() - (f.startedAt || performance.now())) / 1000);
    const accuracy = f.valid + f.invalid ? f.valid / (f.valid + f.invalid) : (won ? 1 : 0);
    let g = grade({ won, accuracy, hpLeftPct: f.playerHp / f.playerMax });
    if (manual && (g === 'S' || g === 'A')) g = 'B'; // sans caméra, la technique n'est pas vérifiée
    root.classList.add('ended');
    const xp = abandoned ? 0 : Math.round(bossXp(boss, won, g) * (event && won ? event.xpMult : 1));
    if (won) { monster.classList.add('dead'); bell(3); say('victory', { interrupt: true }); } else if (!abandoned) say('defeat', { interrupt: true });
    saveResult(won, g, timeSec, abandoned);
    if (xp) award(xp, boss.mt ? { agi: 0.4, end: 0.3, tec: 0.3 } : { str: 0.5, end: 0.3, tec: 0.2 }, won ? `Boss vaincu : ${boss.name}` : 'Combat de boss');
    if (won) bump('bossWins');
    const card = h('div', { class: 'coach-summary bf-result' },
      h('div', { class: 'bf-result-monster', html: monsterSvg(boss, { size: 110, className: won ? 'dead' : '' }) }),
      h('div', { class: 'sum-main' }, won ? 'VICTOIRE !' : abandoned ? 'Combat abandonné' : 'DÉFAITE'),
      won ? h('div', { class: `grade g-${g}` }, `Note ${g}`) : null,
      h('div', { class: 'sum-grid' },
        h('div', null, h('b', null, formatDuration(timeSec)), h('span', null, 'durée')),
        h('div', null, h('b', null, `${Math.round(accuracy * 100)}%`), h('span', null, 'précision')),
        h('div', null, h('b', null, `×${f.maxCombo}`), h('span', null, 'combo max'))),
      h('p', { class: 'muted small' }, `${Math.round(f.dealt)} dégâts infligés · ${f.valid} reps propres · ${f.invalid} ratées`),
      xp ? h('div', { class: 'badge gold' }, `+${xp} XP`) : null,
      h('div', { class: 'row gap' },
        h('button', { class: 'btn ghost light', onclick: () => { close(); openBossFight(bossId, { manual, onDone, event }); } }, 'Rejouer'),
        h('button', { class: 'btn primary', onclick: () => close() }, 'Retour à l’arène')));
    add(root, card);
  }

  function saveResult(won, g, timeSec, abandoned) {
    const date = todayISO();
    update((s) => {
      const b = s.game.bosses[bossId] || { wins: 0, losses: 0 };
      if (won) {
        b.wins += 1;
        const order = ['S', 'A', 'B', 'C'];
        if (!b.bestGrade || order.indexOf(g) < order.indexOf(b.bestGrade)) b.bestGrade = g;
        if (!b.bestTimeSec || timeSec < b.bestTimeSec) b.bestTimeSec = timeSec;
      } else if (!abandoned) b.losses += 1;
      s.game.bosses[bossId] = b;
      if (event) {
        const e = s.game.events?.[event.key] || { bossId, modifier: event.modifier.id, tries: 0, won: false };
        e.tries += 1;
        if (won && !e.won) { e.won = true; e.grade = g; e.timeSec = timeSec; s.game.counters.weeklyWins = (s.game.counters.weeklyWins || 0) + 1; }
        s.game.events = { ...(s.game.events || {}), [event.key]: e };
      }
      // Les reps du combat comptent pour les quêtes et l'historique caméra
      boss.phases.forEach((ph, i) => {
        const l = f.phaseLogs[i];
        if (!l.reps && !l.partial && !l.holdSec && !l.punches && !l.kicks) return;
        s.logs.coach.push({
          date, trackerId: ph.tracker, reps: Math.round(l.reps || 0), partial: l.partial || 0, holdSec: Math.round(l.holdSec || 0),
          punches: l.punches, kicks: l.kicks, score: 0, boss: bossId, manual, durationSec: 0, topErrors: [],
        });
      });
    });
    if (!manual) bump('validReps', f.valid);
  }

  function close() {
    clearInterval(f.tick);
    clearInterval(f.breakTimer);
    stage?.stop();
    stopSpeaking();
    keepAwake(false);
    root.remove();
    document.body.classList.remove('no-scroll');
    onDone?.();
  }
}
