// Transforme le build Vite (dist/) en une seule page autonome pour la publier comme artifact sur claude.ai.
// Le CSS et le JS sont intégrés dans la page : l'hébergeur n'accepte pas de fichiers externes hors CDN.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
const html = readFileSync(new URL('index.html', dist), 'utf8');

const jsPath = html.match(/<script[^>]+src="\.?\/?(assets\/[^"]+\.js)"/)?.[1];
const cssPath = html.match(/<link[^>]+href="\.?\/?(assets\/[^"]+\.css)"/)?.[1];
if (!jsPath || !cssPath) throw new Error('Script ou feuille de style introuvable dans dist/index.html');

// Une séquence « </script » ou « <!-- » dans le JS fermerait la balise <script> trop tôt
const js = readFileSync(new URL(jsPath, dist), 'utf8').replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
const css = readFileSync(new URL(cssPath, dist), 'utf8');
const fonts = html.match(/<link[^>]+fonts\.googleapis\.com\/css2[^>]+>/)?.[0] ?? '';

const page = `<title>Recomp</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Coche tes habitudes, gagne des tickets, échange-les contre tes récompenses.">
${fonts}
<style>${css}</style>
<div id="app"></div>
<script type="module">${js}</script>
`;

const out = new URL('../dist-artifact/', import.meta.url);
mkdirSync(out, { recursive: true });
writeFileSync(new URL('recomp.html', out), page);
console.log(`dist-artifact/recomp.html (${(page.length / 1024).toFixed(1)} Ko)`);
