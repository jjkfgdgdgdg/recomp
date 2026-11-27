// Garde-fou d'affichage : les écrans doivent utiliser add() (de ui.js) et pas el.append(),
// sinon un élément optionnel absent s'affiche « null » et une liste « [object HTMLElement] ».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

test('les écrans n’utilisent pas Element.append (affichage « null » / « [object …] »)', () => {
  const dir = join(ROOT, 'js', 'views');
  const offenders = [];
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.js'))) {
    readFileSync(join(dir, f), 'utf8').split('\n').forEach((line, i) => {
      if (/\.append\(/.test(line) && !/document\.body\.append\(/.test(line)) offenders.push(`${f}:${i + 1}`);
    });
  }
  assert.deepEqual(offenders, [], `remplace .append(...) par add(el, ...) : ${offenders.join(', ')}`);
});

// ---- Caméra : jambes et choix du modèle
const { legsIssue } = await import('../js/pose/geometry.js');
const { pickModel } = await import('../js/pose/stage.js');

function body({ kneeY = 0.7, ankleY = 0.9, legVis = 0.95 } = {}) {
  const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.3, z: 0, visibility: 0.95 }));
  [25, 26].forEach((i) => { lm[i] = { x: 0.5, y: kneeY, z: 0, visibility: legVis }; });
  [27, 28].forEach((i) => { lm[i] = { x: 0.5, y: ankleY, z: 0, visibility: legVis }; });
  return lm;
}

test('conseil de placement quand les jambes ne sont pas dans l’image', () => {
  assert.equal(legsIssue(body()), null);
  assert.match(legsIssue(body({ legVis: 0.1 })), /jambes/);
  assert.match(legsIssue(body({ kneeY: 1.15, ankleY: 1.4 })), /jambes/);
  assert.match(legsIssue(body({ ankleY: 1.08 })), /pieds/);
  assert.equal(legsIssue(null), null);
});

test('modèle du squelette : auto = précis, sauf appareil lent ou choix manuel', () => {
  assert.equal(pickModel({ model: 'auto' }), 'full');
  assert.equal(pickModel({ model: 'auto', autoModel: 'lite' }), 'lite');
  assert.equal(pickModel({ model: 'lite' }), 'lite');
  assert.equal(pickModel({ model: 'full', autoModel: 'lite' }), 'full');
  assert.equal(pickModel({}), 'full');
});

test('l’ancien réglage par défaut « rapide » passe en « auto », un choix manuel est gardé', async () => {
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
  const store = await import('../js/store.js');
  try {
    mem.set('recomp:v1', JSON.stringify({ settings: { model: 'lite' } }));
    assert.equal(store.load().settings.model, 'auto');
    mem.set('recomp:v1', JSON.stringify({ settings: { model: 'lite', modelPicked: true } }));
    assert.equal(store.load().settings.model, 'lite');
    mem.set('recomp:v1', JSON.stringify({ settings: { model: '../../x' } }));
    assert.equal(store.load().settings.model, 'auto');
  } finally {
    delete globalThis.localStorage;
    store.load();
  }
});
