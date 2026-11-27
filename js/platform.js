// Détection de l'environnement : site web, application PC (Electron) ou application Android (Capacitor).
const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';

export const isElectron = /Electron\//.test(ua);
export const isCapacitor = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
export const isNativeApp = isElectron || isCapacitor;

export function nativePlugin(name) {
  return isCapacitor ? window.Capacitor?.Plugins?.[name] || null : null;
}

// Page des téléchargements (applis PC et Android construites automatiquement par GitHub Actions)
export const DOWNLOADS_URL = 'https://github.com/jjkfgdgdgdg/recomp/releases/latest';
