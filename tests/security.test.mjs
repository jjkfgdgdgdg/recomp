// Tests de protection : aucun secret publié, CSP active, données importées nettoyées, applis natives verrouillées.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { sanitize } from '../js/store.js';
import { decodeChallenge } from '../js/game/challenges.js';

const ROOT = new URL('..', import.meta.url).pathname;

function trackedFiles() {
  try {
    return execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

test('aucune clé privée ni fichier de signature dans le dépôt', () => {
  const files = trackedFiles();
  const forbidden = ['.keystore', '.jks', '.p12', '.pem', '.key'];
  files.forEach((f) => {
    assert.ok(!forbidden.includes(extname(f).toLowerCase()), `fichier sensible publié : ${f}`);
    assert.ok(!/(^|\/)\.env(\.|$)/.test(f), `fichier .env publié : ${f}`);
  });
  const textFiles = files.filter((f) => !f.startsWith('vendor/') && /\.(js|mjs|cjs|json|md|yml|yaml|gradle|xml|properties|html|txt)$/.test(f));
  textFiles.forEach((f) => {
    const content = readFileSync(join(ROOT, f), 'utf8');
    assert.ok(!/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(content), `clé privée dans ${f}`);
    assert.ok(!/ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}/.test(content), `jeton d'accès dans ${f}`);
  });
});

test('Content Security Policy présente et stricte', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const m = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/);
  assert.ok(m, 'CSP absente');
  const csp = m[1];
  assert.match(csp, /script-src 'self' 'wasm-unsafe-eval'/);
  assert.ok(!/script-src[^;]*'unsafe-eval'/.test(csp.replace("'wasm-unsafe-eval'", '')), 'unsafe-eval interdit');
  assert.ok(!/script-src[^;]*'unsafe-inline'/.test(csp), 'scripts inline interdits');
  assert.match(csp, /object-src 'none'/);
  assert.ok(!/<script(?![^>]*src=)[^>]*>/.test(html), 'pas de script inline dans index.html');
});

test('données importées nettoyées (HTML, clés dangereuses, nombres)', () => {
  const dirty = JSON.parse('{"name":"<img src=x onerror=alert(1)>","__proto__":{"admin":true},"n":1e999,"list":["<b>ok</b>"]}');
  const clean = sanitize(dirty);
  assert.equal(clean.name, 'img src=x onerror=alert(1)');
  assert.equal(clean.admin, undefined);
  assert.equal(({}).admin, undefined);
  assert.equal(clean.list[0], 'bok/b');
  assert.equal(sanitize({ n: Infinity }).n, 0);
});

test('lien de défi trop long refusé', () => {
  assert.throws(() => decodeChallenge('a'.repeat(7000)));
});

test('appli PC verrouillée (isolation, bac à sable, pas de Node dans la page)', () => {
  const main = readFileSync(join(ROOT, 'desktop/main.cjs'), 'utf8');
  assert.match(main, /contextIsolation: true/);
  assert.match(main, /sandbox: true/);
  assert.match(main, /nodeIntegration: false/);
  assert.match(main, /setPermissionRequestHandler/);
  assert.match(main, /setWindowOpenHandler/);
  assert.match(main, /content-security-policy/);
});

test('appli Android : trafic non chiffré interdit, pas de clé dans le build', () => {
  const manifest = join(ROOT, 'android/app/src/main/AndroidManifest.xml');
  if (!existsSync(manifest)) return;
  assert.match(readFileSync(manifest, 'utf8'), /usesCleartextTraffic="false"/);
  const gradle = readFileSync(join(ROOT, 'android/app/build.gradle'), 'utf8');
  assert.match(gradle, /System\.getenv\('RECOMP_KEYSTORE_PATH'\)/);
  assert.ok(!/storePassword\s+['"]/.test(gradle), 'mot de passe en clair dans build.gradle');
});

test('workflows GitHub : droits minimaux et secrets jamais exposés aux pull requests', () => {
  const dir = join(ROOT, '.github/workflows');
  ['tests.yml', 'build-apps.yml'].forEach((f) => {
    const p = join(dir, f);
    if (!existsSync(p)) return;
    const y = readFileSync(p, 'utf8');
    assert.match(y, /^permissions:\s*\n\s+contents: read/m, `${f} : droits par défaut en lecture seule`);
    assert.ok(!/pull_request_target/.test(y), `${f} : pull_request_target interdit`);
  });
});
