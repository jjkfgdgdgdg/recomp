// Vérifie que tous les fichiers de l'app sont mis en cache par le service worker (mode hors ligne).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

test('le service worker précache tous les fichiers JS et CSS', () => {
  const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
  const files = [...walk(join(ROOT, 'js')), ...walk(join(ROOT, 'css'))].map((f) => `./${relative(ROOT, f)}`);
  files.forEach((f) => assert.ok(sw.includes(`'${f}'`), `${f} absent de sw.js`));
});

test('les fichiers listés dans le service worker existent', () => {
  const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
  const list = [...sw.matchAll(/'(\.\/[^']+)'/g)].map((m) => m[1]).filter((f) => f !== './');
  list.forEach((f) => assert.ok(existsSync(join(ROOT, f)), `${f} n'existe pas`));
});

test('les fichiers MediaPipe sont présents', () => {
  ['vendor/mediapipe/vision_bundle.mjs', 'vendor/mediapipe/wasm/vision_wasm_internal.js', 'vendor/mediapipe/wasm/vision_wasm_internal.wasm',
    'vendor/mediapipe/models/pose_landmarker_lite.task', 'vendor/mediapipe/models/pose_landmarker_full.task']
    .forEach((f) => assert.ok(existsSync(join(ROOT, f)), f));
});
