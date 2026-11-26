import { render } from 'preact';
import { App } from './App';
import { runtime } from './lib/cloud';
import { startCloud } from './lib/store';
import './styles.css';

render(<App />, document.getElementById('app')!);
startCloud();

// Mode hors ligne et installation sur l'écran d'accueil, quand l'appli est hébergée normalement
// (pas sur claude.ai, où les service workers ne sont pas disponibles).
if (!runtime() && 'serviceWorker' in navigator && location.protocol.startsWith('http') && window.top === window.self) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
