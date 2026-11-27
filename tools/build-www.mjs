// Copie l'application web dans www/ (utilisé par les applis PC et Android).
import { cp, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'www');
const FILES = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'icons', 'vendor'];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (const f of FILES) {
  await cp(join(ROOT, f), join(OUT, f), { recursive: true });
}
console.log(`Application web copiée dans ${OUT}`);
