// Lecteur de démonstration animée : un mannequin montre le mouvement parfait, en boucle.
import { h, icon, clear } from '../ui.js';
import { DEMOS } from '../pose/demos.js';
import { angle } from '../pose/geometry.js';

const SEGMENTS = [
  // [a, b, épaisseur relative]
  [11, 23, 1.25], [23, 25, 1.1], [25, 27, 1], [27, 31, 0.6], [11, 13, 0.85], [13, 15, 0.75],
];
const FAR = [[12, 24, 1.25], [24, 26, 1.1], [26, 28, 1], [28, 32, 0.6], [12, 14, 0.85], [14, 16, 0.75]];

function bounds(demo) {
  let minX = Infinity; let maxX = -Infinity; let minY = Infinity; let maxY = -Infinity;
  for (let i = 0; i <= 20; i += 1) {
    demo.frame(i / 20).forEach((p, idx) => {
      if (p.v < 0.15 && idx !== 0) return;
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    });
  }
  return { minX: minX - 0.08, maxX: maxX + 0.08, minY: minY - 0.1, maxY: maxY + 0.04 };
}

export function drawMannequin(ctx, pts, b, { showAngle = null, color = '#ff5a36' } = {}) {
  const { width: W, height: H } = ctx.canvas;
  const sx = W / (b.maxX - b.minX); const sy = H / (b.maxY - b.minY);
  const s = Math.min(sx, sy);
  const ox = (W - (b.maxX - b.minX) * s) / 2; const oy = (H - (b.maxY - b.minY) * s) / 2;
  const P = (p) => ({ x: ox + (p.x - b.minX) * s, y: oy + (p.y - b.minY) * s });
  ctx.clearRect(0, 0, W, H);
  // sol
  const groundY = oy + (b.maxY - 0.04 - b.minY) * s + 6;
  ctx.strokeStyle = 'rgba(148,163,184,.45)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.moveTo(8, groundY); ctx.lineTo(W - 8, groundY); ctx.stroke();
  ctx.setLineDash([]);
  const base = s * 0.045;
  const seg = (list, col) => {
    ctx.strokeStyle = col;
    ctx.lineCap = 'round';
    list.forEach(([a, c, k]) => {
      const pa = pts[a]; const pc = pts[c];
      if (!pa || !pc || pa.v < 0.15 || pc.v < 0.15) return;
      const A = P(pa); const C = P(pc);
      ctx.lineWidth = base * k;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(C.x, C.y); ctx.stroke();
    });
  };
  seg(FAR, 'rgba(148,163,184,.55)');
  seg(SEGMENTS, color);
  const head = P(pts[0]);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(head.x, head.y, base * 1.35, 0, Math.PI * 2); ctx.fill();
  // articulations
  [11, 13, 15, 23, 25, 27].forEach((i) => {
    const q = P(pts[i]);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(q.x, q.y, base * 0.28, 0, Math.PI * 2); ctx.fill();
  });
  if (showAngle) {
    const [a, m, c] = showAngle;
    const deg = Math.round(angle(pts[a], pts[m], pts[c]));
    const M = P(pts[m]);
    ctx.font = `700 ${Math.round(base * 0.9)}px system-ui, sans-serif`;
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`${deg}°`, M.x + base * 0.6, M.y - base * 0.4);
  }
}

export function demoPlayer(demoId, { size = 300, compact = false } = {}) {
  const demo = DEMOS[demoId];
  if (!demo) return null;
  const canvas = h('canvas', { class: 'demo-canvas', width: size * 2, height: Math.round(size * 1.3), 'aria-label': 'Démonstration animée du mouvement' });
  const ctx = canvas.getContext('2d');
  const cue = h('div', { class: 'demo-cue' }, '');
  const b = bounds(demo);
  let playing = true;
  let speed = 1;
  let t0 = performance.now();
  let offset = 0;
  const color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff5a36';
  const btn = h('button', { class: 'icon-btn small', 'aria-label': 'Pause', onclick: () => toggle() }, icon('pause', 18));
  const slow = h('button', { class: 'chip small', onclick: () => { speed = speed === 1 ? 0.5 : 1; slow.classList.toggle('on', speed !== 1); t0 = performance.now(); } }, 'Ralenti');
  const el = h('div', { class: `demo${compact ? ' compact' : ''}` },
    canvas,
    compact ? null : h('div', { class: 'demo-bar' }, btn, cue, slow),
    h('span', { class: 'demo-view' }, `Vue : ${demo.view}`));

  function toggle() {
    playing = !playing;
    if (playing) t0 = performance.now();
    clear(btn).append(icon(playing ? 'pause' : 'play', 18));
  }
  function frame() {
    if (!el.isConnected && el.dataset.started) return;
    el.dataset.started = '1';
    requestAnimationFrame(frame);
    if (!playing) return;
    const now = performance.now();
    offset += ((now - t0) / 1000) * speed;
    t0 = now;
    const t = (offset / demo.cycle) % 1;
    drawMannequin(ctx, demo.frame(t), b, { showAngle: compact ? null : demo.joint, color });
    const c = demo.cue(t);
    if (cue.textContent !== c) cue.textContent = c;
  }
  requestAnimationFrame(frame);
  return el;
}
