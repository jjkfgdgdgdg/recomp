// Écran « Progrès » : poids, séances, records, tests, historique.
import { h, clear, numInput, toast, fmt, modal, confirmBox } from '../ui.js';
import { getState, update } from '../store.js';
import { todayISO, shortDate, daysBetween, formatDuration } from '../engine/dates.js';
import { EX } from '../data/exercises.js';
import { TRACKERS } from '../pose/trackers.js';
import { TYPE_META } from '../engine/planner.js';
import { streak, latestWeight } from '../services.js';
import { emptyState } from './common.js';
import { award } from '../game/service.js';
import { SPLIT } from '../game/leveling.js';

export function renderProgress(root) {
  const s = getState();
  clear(root);
  root.append(h('section', { class: 'page-head' }, h('h1', null, 'Mes progrès')));

  // ---- Statistiques
  const today = todayISO();
  const sessions = s.logs.sessions;
  const last7 = sessions.filter((x) => daysBetween(x.date, today) < 7);
  const last30 = sessions.filter((x) => daysBetween(x.date, today) < 30);
  const minutes = sessions.reduce((t, x) => t + (x.durationSec || 0), 0) / 60;
  root.append(h('section', { class: 'stats4' },
    stat(streak(), 'jours de série 🔥'),
    stat(last7.length, 'séances / 7 j'),
    stat(last30.length, 'séances / 30 j'),
    stat(Math.round(minutes / 60 * 10) / 10, 'heures au total')));

  // ---- Poids
  const lw = latestWeight();
  let w = lw?.weight ?? s.profile.weight;
  let waist = null;
  const weightCard = h('section', { class: 'card' },
    h('div', { class: 'card-title' }, '⚖️ Poids & tour de taille'),
    weightChart(s.logs.weights, s.profile.targetWeight),
    h('div', { class: 'row gap wrap end' },
      h('label', { class: 'field inline' }, h('span', { class: 'field-label' }, 'Poids (kg)'), numInput(w, { min: 30, max: 250, step: 0.1, onInput: (v) => { w = v; } })),
      h('label', { class: 'field inline' }, h('span', { class: 'field-label' }, 'Taille (cm)'), numInput(null, { min: 40, max: 200, placeholder: 'option', onInput: (v) => { waist = v; } })),
      h('button', {
        class: 'btn primary',
        onclick: () => {
          if (!(w >= 30 && w <= 250)) { toast('Poids invalide'); return; }
          const firstToday = !getState().logs.weights.some((x) => x.date === today);
          update((st) => {
            const list = st.logs.weights.filter((x) => x.date !== today);
            list.push({ date: today, weight: w, waist: waist || null });
            st.logs.weights = list.sort((a, b) => a.date.localeCompare(b.date));
          });
          toast('Pesée enregistrée ✅');
          if (firstToday) award(10, SPLIT.life, 'Pesée');
          renderProgress(root);
        },
      }, 'Enregistrer')),
    weightSummary(s.logs.weights, s.profile),
    h('p', { class: 'small muted' }, 'Pèse-toi le matin, à jeun, après être passé aux toilettes. Regarde la tendance sur 2-3 semaines, pas le chiffre d’un jour.'));
  root.append(weightCard);

  // ---- Records caméra
  const recs = Object.entries(s.records);
  root.append(h('section', { class: 'card' },
    h('div', { class: 'card-title' }, '🏆 Records (validés par la caméra)'),
    recs.length ? h('div', { class: 'list' }, recs.map(([id, r]) => h('div', { class: 'list-row' },
      h('span', null, TRACKERS[id]?.label || id), h('span', { class: 'muted small' }, shortDate(r.date)),
      h('b', null, TRACKERS[id]?.mode === 'hold' ? `${r.holdSec} s` : `${r.reps} reps`))))
      : h('p', { class: 'muted small' }, 'Fais une série avec le coach caméra pour établir tes premiers records.')));

  // ---- Tests
  const tests = s.logs.tests;
  if (tests.length) {
    const keys = [['push', 'Pompes'], ['squat', 'Squats 1 min'], ['pull', 'Tractions'], ['plank', 'Gainage (s)']];
    root.append(h('section', { class: 'card' },
      h('div', { class: 'card-title' }, '🎯 Tests de niveau'),
      h('div', { class: 'list' }, keys.map(([k, label]) => {
        const vals = tests.filter((t) => t[k] !== null && t[k] !== undefined);
        if (!vals.length) return null;
        const first = vals[0][k]; const last = vals[vals.length - 1][k];
        return h('div', { class: 'list-row' }, h('span', null, label), h('span', { class: 'muted small' }, `départ ${first}`),
          h('b', null, `${last}`, last > first ? h('span', { class: 'up' }, ` +${last - first}`) : null));
      })),
      daysBetween(tests[tests.length - 1].date, today) >= 28
        ? h('p', { class: 'pill info' }, '⏰ Ça fait 4 semaines : refais tes tests dans l’onglet Coach !') : null));
  }

  // ---- Historique
  root.append(h('h2', { class: 'section-title' }, 'Historique des séances'));
  if (!sessions.length) {
    root.append(emptyState('📅', 'Aucune séance pour l’instant', 'Ta première séance apparaîtra ici.'));
  } else {
    root.append(h('div', { class: 'card list' }, [...sessions].reverse().slice(0, 30).map((x) => h('button', {
      class: 'list-row clickable',
      onclick: () => sessionDetail(x, () => renderProgress(root)),
    },
    h('span', null, TYPE_META[x.type]?.emoji || '✅', ' ', x.title),
    h('span', { class: 'muted small' }, shortDate(x.date)),
    h('b', null, formatDuration(x.durationSec || 0))))));
  }
}

function stat(v, label) {
  return h('div', { class: 'stat' }, h('b', null, fmt(v, 1)), h('span', null, label));
}

function weightSummary(weights, profile) {
  if (weights.length < 2) return null;
  const first = weights[0];
  const last = weights[weights.length - 1];
  const diff = Math.round((last.weight - first.weight) * 10) / 10;
  const days = Math.max(1, daysBetween(first.date, last.date));
  const perWeek = Math.round((diff / days) * 7 * 100) / 100;
  let advice = '';
  const goal = profile.primaryGoal;
  if (goal === 'muscle' || goal === 'strength') {
    if (days >= 14 && perWeek < 0.05) advice = 'Le poids stagne : ajoute ~150 kcal par jour (une banane + une poignée d’amandes).';
    else if (perWeek > 0.5) advice = 'Prise rapide : réduis un peu les calories pour limiter le gras.';
  } else if (goal === 'fatloss') {
    if (days >= 14 && perWeek > -0.1) advice = 'Le poids ne baisse plus : retire ~150 kcal par jour ou ajoute 2 000 pas.';
    else if (perWeek < -1) advice = 'Perte très rapide : mange un peu plus pour protéger tes muscles.';
  }
  return h('div', { class: 'small' },
    h('div', null, `Évolution : `, h('b', null, `${diff > 0 ? '+' : ''}${diff} kg`), ` en ${days} jours (${perWeek > 0 ? '+' : ''}${perWeek} kg/sem)`),
    advice ? h('div', { class: 'pill info' }, '🤖 Ajustement auto : ', advice) : null);
}

function weightChart(weights, target) {
  const W = 340; const H = 160; const P = 28;
  if (weights.length < 2) {
    return h('p', { class: 'muted small' }, weights.length ? `Première pesée : ${weights[0].weight} kg. Ajoute des pesées pour voir ta courbe.` : 'Aucune pesée.');
  }
  const pts = weights.slice(-60);
  const vals = pts.map((p) => p.weight);
  if (target) vals.push(target);
  const min = Math.floor(Math.min(...vals) - 1);
  const max = Math.ceil(Math.max(...vals) + 1);
  const t0 = pts[0].date;
  const span = Math.max(1, daysBetween(t0, pts[pts.length - 1].date));
  const x = (d) => P + (daysBetween(t0, d) / span) * (W - P - 8);
  const y = (v) => 8 + (1 - (v - min) / (max - min)) * (H - P);
  // Moyenne mobile 7 jours
  const avg = pts.map((p) => {
    const win = pts.filter((q) => daysBetween(q.date, p.date) >= 0 && daysBetween(q.date, p.date) < 7);
    return { date: p.date, v: win.reduce((s, q) => s + q.weight, 0) / win.length };
  });
  const path = (arr, key) => arr.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
  const svg = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Courbe de poids">
    <line x1="${P}" y1="${y(max)}" x2="${W - 8}" y2="${y(max)}" class="grid"/>
    <line x1="${P}" y1="${y(min)}" x2="${W - 8}" y2="${y(min)}" class="grid"/>
    <text x="2" y="${y(max) + 4}" class="axis">${max}</text>
    <text x="2" y="${y(min) + 4}" class="axis">${min}</text>
    ${target ? `<line x1="${P}" y1="${y(target)}" x2="${W - 8}" y2="${y(target)}" class="target"/><text x="${W - 60}" y="${y(target) - 4}" class="axis">objectif</text>` : ''}
    <path d="${path(avg, 'v')}" class="avg"/>
    <path d="${path(pts, 'weight')}" class="line"/>
    ${pts.map((p) => `<circle cx="${x(p.date).toFixed(1)}" cy="${y(p.weight).toFixed(1)}" r="3" class="dot"><title>${shortDate(p.date)} : ${p.weight} kg</title></circle>`).join('')}
    <text x="${P}" y="${H - 4}" class="axis">${shortDate(t0)}</text>
    <text x="${W - 40}" y="${H - 4}" class="axis">${shortDate(pts[pts.length - 1].date)}</text>
  </svg>`;
  const wrap = h('div', { class: 'chart-wrap' });
  wrap.innerHTML = svg;
  wrap.append(h('div', { class: 'legend small muted' }, h('span', { class: 'lg line' }), ' pesées  ', h('span', { class: 'lg avg' }), ' moyenne 7 jours'));
  return wrap;
}

function sessionDetail(x, rerender) {
  const m = modal(h('div', { class: 'stack' },
    h('div', { class: 'muted' }, `${shortDate(x.date)} · ${formatDuration(x.durationSec || 0)} · ${x.totalReps || 0} reps${x.volume ? ` · ${Math.round(x.volume)} kg soulevés` : ''}`),
    h('div', { class: 'list' }, (x.exercises || []).map((e) => h('div', { class: 'list-row' },
      h('span', null, EX[e.exId]?.name || e.exId),
      h('span', { class: 'small muted' }, e.sets.map((st) => (st.reps !== undefined ? `${st.reps}${st.weight ? `×${st.weight}kg` : ''}` : st.secs ? `${st.secs}s` : st.rounds ? `${st.rounds} rds` : '')).join(' · '))))),
    (x.messages || []).length ? h('ul', { class: 'bullets small' }, x.messages.map((mm) => h('li', null, mm))) : null,
    h('button', {
      class: 'btn danger small',
      onclick: async () => {
        if (!(await confirmBox('Supprimer cette séance de l’historique ?', { danger: true, ok: 'Supprimer' }))) return;
        update((s) => { s.logs.sessions = s.logs.sessions.filter((y) => y.id !== x.id); });
        m.close();
        rerender();
      },
    }, 'Supprimer')),
  { title: x.title });
}

