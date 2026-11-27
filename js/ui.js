// Mini-bibliothèque d'interface : création d'éléments, icônes, toasts, fenêtres.

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') {
        Object.entries(v).forEach(([prop, val]) => {
          if (prop.startsWith('--')) el.style.setProperty(prop, val); else el.style[prop] = val;
        });
      }
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') el.innerHTML = v; // uniquement pour du contenu statique interne
      else if (k in el && k !== 'list' && typeof v !== 'string') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

// Échappe le texte avant de l'insérer dans du HTML/SVG construit à la main (protection contre l'injection)
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Ajoute des enfants à un élément en ignorant null / undefined / false et en aplatissant les listes.
 *  À utiliser à la place de el.append(...) (qui afficherait « null » ou « [object …] »). */
export function add(parent, ...children) {
  append(parent, children);
  return parent;
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  camera: '<path d="M3 8a2 2 0 0 1 2-2h2.2l1.6-2.2h6.4L16.8 6H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  leaf: '<path d="M5 19c8 1 14-5 14-15C9 4 4 9 5 19z"/><path d="M5 19 13 11"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/>',
  pause: '<path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z" fill="currentColor"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>',
  back: '<path d="M15 5 8 12l7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  flip: '<path d="M4 8h12l-3-3M20 16H8l3 3"/>',
  volume: '<path d="M4 9.5v5h4l5 4v-13l-5 4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  mute: '<path d="M4 9.5v5h4l5 4v-13l-5 4z" fill="currentColor"/><path d="M17 9.5l5 5M22 9.5l-5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  drop: '<path d="M12 3s6.5 7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10 12 3 12 3z"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2.5M9.5 2.5h5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  settings: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  flame: '<path d="M12 22c4 0 7-2.8 7-7 0-3.5-2.2-5.7-3.6-7.4-.4 1.9-1.4 3-2.6 3.4.4-3.2-1-6.5-4.3-8.5.3 3.3-1.4 5.3-2.9 7C4.5 11.4 5 13 5 15c0 4.2 3 7 7 7z"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
  sword: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5A2.5 2.5 0 0 1 6.5 19H20v3H6.5"/>',
  shield: '<path d="M12 2.5 20 6v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/>',
};

export function icon(name, size = 22) {
  const span = document.createElement('span');
  span.className = 'icon';
  span.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  return span;
}

let toastTimer = null;
export function toast(msg, ms = 2600) {
  let el = document.getElementById('toast');
  if (!el) {
    el = h('div', { id: 'toast', role: 'status', 'aria-live': 'polite' });
    document.body.append(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

export function modal(content, { title, onClose, wide } = {}) {
  const close = () => {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 200);
    document.removeEventListener('keydown', onKey);
    onClose?.();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const box = h('div', { class: `sheet${wide ? ' wide' : ''}`, role: 'dialog', 'aria-modal': 'true' },
    h('div', { class: 'sheet-head' },
      h('h2', null, title || ''),
      h('button', { class: 'icon-btn', 'aria-label': 'Fermer', onclick: close }, icon('close'))),
    h('div', { class: 'sheet-body' }, content));
  const overlay = h('div', { class: 'overlay', onclick: (e) => { if (e.target === overlay) close(); } }, box);
  document.body.append(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  document.addEventListener('keydown', onKey);
  return { close, box };
}

export function confirmBox(message, { ok = 'Confirmer', cancel = 'Annuler', danger = false } = {}) {
  return new Promise((resolve) => {
    let done = false;
    const m = modal(h('div', null,
      h('p', null, message),
      h('div', { class: 'row gap end' },
        h('button', { class: 'btn ghost', onclick: () => { done = true; m.close(); resolve(false); } }, cancel),
        h('button', { class: `btn ${danger ? 'danger' : 'primary'}`, onclick: () => { done = true; m.close(); resolve(true); } }, ok))),
    { title: 'Confirmation', onClose: () => { if (!done) resolve(false); } });
  });
}

export function chips(options, selected, { multi = true, onChange } = {}) {
  const set = new Set(Array.isArray(selected) ? selected : selected !== undefined && selected !== null ? [selected] : []);
  const wrap = h('div', { class: 'chips', role: multi ? 'group' : 'radiogroup' });
  const render = () => {
    clear(wrap);
    options.forEach((o) => {
      const on = set.has(o.id);
      wrap.append(h('button', {
        type: 'button',
        class: `chip${on ? ' on' : ''}`,
        'aria-pressed': String(on),
        onclick: () => {
          if (multi) { if (on) set.delete(o.id); else set.add(o.id); } else { set.clear(); set.add(o.id); }
          render();
          onChange?.(multi ? [...set] : o.id);
        },
      }, o.emoji ? `${o.emoji} ` : '', o.label));
    });
  };
  render();
  return wrap;
}

export function stepper(value, { min = 0, max = 999, step = 1, onChange, suffix = '' } = {}) {
  let v = value;
  const out = h('span', { class: 'stepper-val' });
  const show = () => { out.textContent = `${v}${suffix}`; };
  const set = (nv) => { v = Math.max(min, Math.min(max, Math.round(nv * 100) / 100)); show(); onChange?.(v); };
  show();
  return h('div', { class: 'stepper' },
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Moins', onclick: () => set(v - step) }, icon('minus', 18)),
    out,
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Plus', onclick: () => set(v + step) }, icon('plus', 18)));
}

export function ring(progress, size = 120, stroke = 10, label = '') {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const wrap = h('div', { class: 'ring', style: { width: `${size}px`, height: `${size}px` } });
  wrap.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--track)" stroke-width="${stroke}" fill="none"/>
    <circle class="ring-fg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--accent)" stroke-width="${stroke}" fill="none"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.max(0, Math.min(1, progress)))}"
      transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
  const lbl = h('div', { class: 'ring-label' }, label);
  wrap.append(lbl);
  wrap.set = (p, text) => {
    wrap.querySelector('.ring-fg').setAttribute('stroke-dashoffset', String(c * (1 - Math.max(0, Math.min(1, p)))));
    if (text !== undefined) lbl.textContent = text;
  };
  return wrap;
}

export function bar(value, max, cls = '') {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return h('div', { class: `bar ${cls}` }, h('div', { class: 'bar-fill', style: { width: `${pct}%` } }));
}

export function field(label, input, hint) {
  return h('label', { class: 'field' }, h('span', { class: 'field-label' }, label), input, hint ? h('span', { class: 'hint' }, hint) : null);
}

export function numInput(value, { min, max, step = 1, placeholder = '', onInput } = {}) {
  return h('input', {
    type: 'number', inputmode: 'decimal', class: 'input', value: value ?? '', min, max, step, placeholder,
    oninput: (e) => onInput?.(e.target.value === '' ? null : Number(e.target.value)),
  });
}

export function fmt(n, d = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return '–';
  return Number(n).toLocaleString('fr-FR', { maximumFractionDigits: d, minimumFractionDigits: 0 });
}
