// Routeur minimal basé sur le hash (#/today, #/session/2026-01-01, ...).
const routes = [];
let cleanup = null;

export function route(pattern, handler) {
  const keys = [];
  const re = new RegExp(`^${pattern.replace(/:([a-zA-Z]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}$`);
  routes.push({ re, keys, handler });
}

export function navigate(hash, { replace = false } = {}) {
  if (replace) history.replaceState(null, '', hash);
  else if (location.hash !== hash) { location.hash = hash; return; }
  resolve();
}

export function currentPath() {
  return (location.hash || '#/today').slice(1).split('?')[0];
}

export function query() {
  const q = (location.hash.split('?')[1] || '');
  return Object.fromEntries(new URLSearchParams(q));
}

export function resolve() {
  const path = currentPath();
  if (typeof cleanup === 'function') {
    try { cleanup(); } catch (e) { console.error(e); }
  }
  cleanup = null;
  for (const r of routes) {
    const m = path.match(r.re);
    if (m) {
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      cleanup = r.handler({ ...params, ...query() }, path);
      return;
    }
  }
  navigate('#/today', { replace: true });
}

export function startRouter() {
  window.addEventListener('hashchange', resolve);
  resolve();
}
