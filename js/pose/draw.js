// Dessin du squelette sur un canvas superposé à la vidéo.
import { BONES, JOINTS, vis } from './geometry.js';

const COLORS = {
  good: '#22c55e',
  warn: '#f59e0b',
  bad: '#ef4444',
  none: 'rgba(255,255,255,0.9)',
};
const RANK = { none: 0, good: 1, warn: 2, bad: 3 };

function worst(a, b) {
  return RANK[a || 'none'] >= RANK[b || 'none'] ? (a || 'none') : (b || 'none');
}

export function drawSkeleton(ctx, landmarks, joints = {}, opts = {}) {
  const { width: w, height: h } = ctx.canvas;
  ctx.clearRect(0, 0, w, h);
  if (!landmarks) return;
  const lw = Math.max(3, Math.round(Math.min(w, h) / 110));
  const minVis = opts.minVis ?? 0.3;
  ctx.lineCap = 'round';
  // Contour sombre pour la lisibilité sur n'importe quel fond
  for (const pass of ['shadow', 'color']) {
    for (const [a, b] of BONES) {
      const p = landmarks[a]; const q = landmarks[b];
      if (!p || !q || vis(p) < minVis || vis(q) < minVis) continue;
      const c = worst(joints[a], joints[b]);
      ctx.strokeStyle = pass === 'shadow' ? 'rgba(0,0,0,0.55)' : COLORS[c];
      ctx.lineWidth = pass === 'shadow' ? lw + 4 : lw;
      ctx.beginPath();
      ctx.moveTo(p.x * w, p.y * h);
      ctx.lineTo(q.x * w, q.y * h);
      ctx.stroke();
    }
  }
  for (const i of JOINTS) {
    const p = landmarks[i];
    if (!p || vis(p) < minVis) continue;
    const c = joints[i] || 'none';
    const r = i === 0 ? lw * 1.6 : lw * 1.25;
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, r, 0, Math.PI * 2);
    ctx.fillStyle = COLORS[c];
    ctx.fill();
  }
}
