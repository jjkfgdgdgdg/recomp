// Application PC (Windows, Mac, Linux) : une fenêtre Electron qui affiche Recomp.
// Les fichiers sont servis par un protocole interne « app:// » sécurisé (caméra, modules JS et WebAssembly autorisés).
const {
  app, BrowserWindow, protocol, session, shell, Menu,
} = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');

const WWW = path.join(__dirname, '..', 'www');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.wasm': 'application/wasm', '.task': 'application/octet-stream',
};

// Protection : seul le code de l'app peut s'exécuter dans la fenêtre
const CSP = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob: mediastream:; connect-src 'self' data: blob:; worker-src 'self' blob:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; manifest-src 'self'";

protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, codeCache: true },
}]);

// Si la carte graphique n'est pas utilisable, le squelette (WebGL) passe par le rendu logiciel.
// Sans danger ici : la fenêtre n'affiche que le code de l'app (CSP, aucun site externe).
app.commandLine.appendSwitch('enable-unsafe-swiftshader');

// Une seule fenêtre Recomp à la fois
if (!app.requestSingleInstanceLock()) app.quit();

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 860,
    minWidth: 380,
    minHeight: 640,
    backgroundColor: '#0d0f14',
    title: 'Recomp',
    icon: path.join(WWW, 'icons', 'icon-512.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false },
  });
  win.once('ready-to-show', () => win.show());
  win.loadURL('app://recomp/index.html#/today');

  // Les liens externes (vidéos YouTube, Google Agenda…) s'ouvrent dans le navigateur
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-attach-webview', (e) => e.preventDefault());
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://')) {
      e.preventDefault();
      if (/^(https?|mailto):/i.test(url)) shell.openExternal(url);
    }
  });
}

app.whenReady().then(() => {
  if (process.platform === 'win32') app.setAppUserModelId('fr.recomp.app');
  Menu.setApplicationMenu(process.platform === 'darwin' ? Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' }]) : null);

  protocol.handle('app', async (request) => {
    const { pathname } = new URL(request.url);
    const file = path.normalize(path.join(WWW, decodeURIComponent(pathname)));
    if (!file.startsWith(WWW)) return new Response('Interdit', { status: 403 });
    try {
      const body = await fs.readFile(file);
      return new Response(body, {
        headers: {
          'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
          'content-security-policy': CSP,
          'x-content-type-options': 'nosniff',
        },
      });
    } catch {
      return new Response('Introuvable', { status: 404 });
    }
  });

  // Autorisations : caméra (coach) et notifications (rappels) uniquement
  const allowed = new Set(['media', 'notifications', 'fullscreen', 'clipboard-sanitized-write']);
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback, details) => {
    if (permission === 'media') return callback(!details.mediaTypes || details.mediaTypes.every((t) => t === 'video'));
    callback(allowed.has(permission));
  });
  session.defaultSession.setPermissionCheckHandler((wc, permission) => allowed.has(permission));

  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('second-instance', () => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
