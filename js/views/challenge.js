// Défis entre amis par lien : créer, relever, partager le classement. Aucun serveur.
import { h, clear, modal, chips, toast, field, numInput } from '../ui.js';
import { getState, update } from '../store.js';
import {
  CHALLENGES, CHALLENGE, newChallenge, addScore, mergeChallenges, ranking, encodeChallenge, decodeChallenge, cleanName,
} from '../game/challenges.js';
import { TRACKERS } from '../pose/trackers.js';
import { todayISO, shortDate } from '../engine/dates.js';
import { appUrl } from '../install.js';
import { award, bump } from '../game/service.js';
import { openCoach } from './coachOverlay.js';
import { navigate } from '../router.js';

const fmtVal = (c, v) => (c.unit === 's' ? `${v} s` : `${v}`);

function myName() {
  return getState().profile?.name || getState().settings?.challengeName || '';
}

function saveChallenge(ch) {
  update((s) => {
    s.challenges = s.challenges || {};
    s.challenges[ch.id] = mergeChallenges(s.challenges[ch.id], ch);
  });
  return getState().challenges[ch.id];
}

export function challengeLink(ch) {
  return `${appUrl()}#/challenge?c=${encodeChallenge(ch)}`;
}

async function share(ch) {
  const c = CHALLENGE[ch.c];
  const top = ranking(ch)[0];
  const url = challengeLink(ch);
  const text = `👊 Défi Recomp : ${c.label} ! ${top ? `${top.name} est en tête avec ${fmtVal(c, top.value)}.` : ''} Tu fais mieux ?`;
  try {
    if (navigator.share) { await navigator.share({ title: 'Défi Recomp', text, url }); return; }
  } catch { return; }
  try { await navigator.clipboard.writeText(`${text} ${url}`); toast('Lien du défi copié 📋 Colle-le dans WhatsApp, Snap, SMS…'); } catch { toast(url, 8000); }
}

/** Faire le défi (caméra ou saisie manuelle), puis enregistrer le score. */
function attempt(ch, after) {
  const c = CHALLENGE[ch.c];
  const t = TRACKERS[c.tracker];
  const askName = (done) => {
    const existing = myName();
    if (existing) { done(existing); return; }
    let name = '';
    const m = modal(h('div', { class: 'stack' },
      field('Ton prénom ou pseudo (visible par tes amis)', h('input', { class: 'input', maxlength: 20, oninput: (e) => { name = e.target.value; } })),
      h('button', { class: 'btn primary', onclick: () => { if (!name.trim()) return; update((s) => { s.settings.challengeName = cleanName(name); }); m.close(); done(cleanName(name)); } }, 'Continuer')),
    { title: 'Qui relève le défi ?' });
  };
  const record = (name, value, cam) => {
    const before = ranking(ch);
    const updated = saveChallenge(addScore(ch, { name, value, cam, date: todayISO() }));
    const after2 = ranking(updated);
    const me = after2.find((x) => x.name.toLowerCase() === name.toLowerCase());
    bump('challenges');
    award(cam ? 40 : 20, { str: 0.4, end: 0.3, men: 0.3 }, 'Défi entre amis');
    if (me?.rank === 1 && after2.length >= 2 && (before[0]?.name.toLowerCase() !== name.toLowerCase() || before.length < 2)) {
      award(60, { men: 0.5, str: 0.5 }, 'En tête du défi !');
      if (after2.length >= 3) bump('challengeWins');
      toast('👑 Tu prends la tête du défi !');
    }
    after?.(updated);
  };
  const m = modal(h('div', { class: 'stack' },
    h('p', null, `${c.emoji} ${c.label}${c.secs ? ' : le chrono démarre après le compte à rebours.' : ' : va jusqu’au bout, puis appuie sur Terminer.'}`),
    h('p', { class: 'small muted' }, t.place),
    h('button', {
      class: 'btn primary big',
      onclick: () => {
        m.close();
        askName((name) => openCoach({
          trackerId: c.tracker, title: `Défi : ${c.label}`, test: true, timeLimit: c.secs || null, target: {},
          onDone: (sum) => { if (sum) record(name, c.unit === 's' ? sum.holdSec : sum.reps, true); },
        }));
      },
    }, '📷 Avec la caméra (score validé ✅)'),
    h('button', {
      class: 'btn ghost',
      onclick: () => {
        m.close();
        askName((name) => {
          let v = null;
          const m2 = modal(h('div', { class: 'stack' },
            field(c.unit === 's' ? 'Ton temps (secondes)' : 'Ton nombre de reps', numInput(null, { min: 0, max: 2000, onInput: (x) => { v = x; } })),
            h('p', { class: 'small muted' }, 'Score déclaré : il apparaîtra sans le badge ✅ « validé caméra ».'),
            h('button', { class: 'btn primary', onclick: () => { if (v === null) return; m2.close(); record(name, v, false); } }, 'Enregistrer')),
          { title: 'Score déclaré' });
        });
      },
    }, '✍️ Sans caméra (score déclaré)')),
  { title: 'Relever le défi' });
}

function board(ch) {
  const c = CHALLENGE[ch.c];
  const r = ranking(ch);
  const me = myName().toLowerCase();
  return h('div', { class: 'ch-board' }, r.length ? r.map((x) => h('div', { class: `ch-row${x.name.toLowerCase() === me ? ' me' : ''}` },
    h('span', { class: 'ch-rank' }, x.rank === 1 ? '👑' : x.rank === 2 ? '🥈' : x.rank === 3 ? '🥉' : `${x.rank}.`),
    h('span', { class: 'ch-name' }, x.name),
    h('b', null, fmtVal(c, x.value)),
    h('span', { class: 'small', title: x.cam ? 'Validé par la caméra' : 'Score déclaré' }, x.cam ? '✅' : '✍️'))) : h('p', { class: 'muted small' }, 'Aucun score pour l’instant.'));
}

// ---------------------------------------------------------------- Écran d'un défi reçu par lien
export function renderChallenge(root, params) {
  clear(root);
  let ch;
  try {
    ch = decodeChallenge(params.c);
  } catch (e) {
    root.append(h('section', { class: 'card alert' }, h('b', null, 'Lien de défi invalide'), h('p', { class: 'small' }, e.message), h('a', { class: 'btn ghost', href: '#/challenges' }, 'Mes défis')));
    return;
  }
  ch = saveChallenge(ch);
  const c = CHALLENGE[ch.c];
  const draw = (cur) => {
    clear(root);
    const hasProfile = !!getState().profile;
    root.append(
      h('section', { class: 'page-head' },
        h('div', { class: 'ch-emoji' }, c.emoji),
        h('h1', null, `Défi : ${c.label}`),
        h('p', { class: 'muted' }, `Lancé par ${cur.by} le ${shortDate(cur.t)}`)),
      h('section', { class: 'card' }, h('div', { class: 'card-title' }, '🏆 Classement'), board(cur)),
      h('div', { class: 'stack' },
        h('button', { class: 'btn primary big', onclick: () => attempt(cur, (u) => { draw(u); share(u); }) }, '💪 Relever le défi'),
        h('button', { class: 'btn ghost', onclick: () => share(cur) }, '📤 Renvoyer le classement à mes amis')),
      h('p', { class: 'small muted' }, 'Après ton essai, renvoie le lien : tes amis verront ton score et pourront te répondre. Tout passe par le lien, aucun compte nécessaire.'),
      !hasProfile ? h('section', { class: 'card soft' }, h('b', null, 'Nouveau sur Recomp ?'), h('p', { class: 'small' }, 'Crée ton programme gratuit en 2 minutes : muscu, Muay Thai, boss, coach caméra.'), h('button', { class: 'btn ghost', onclick: () => navigate('#/onboarding') }, 'Créer mon programme')) : null,
    );
  };
  draw(ch);
}

// ---------------------------------------------------------------- Liste de mes défis
export function challengesSection() {
  const wrap = h('section', { class: 'card' });
  const draw = () => {
    clear(wrap);
    const list = Object.values(getState().challenges || {}).sort((a, b) => (b.t || '').localeCompare(a.t || ''));
    wrap.append(
      h('div', { class: 'card-title' }, '👥 Défis entre amis'),
      h('p', { class: 'small muted' }, 'Lance un défi, envoie le lien sur WhatsApp ou Snap : tes potes font leur score et te renvoient le lien. Gratuit, sans compte, sans serveur.'),
      h('button', { class: 'btn primary', onclick: () => createModal(draw) }, '➕ Lancer un défi'),
      list.length ? h('div', { class: 'ch-list' }, list.slice(0, 10).map((ch) => {
        const c = CHALLENGE[ch.c];
        const top = ranking(ch)[0];
        return h('a', { class: 'ch-item', href: `#/challenge?c=${encodeChallenge(ch)}` },
          h('span', { class: 'tc-emoji' }, c.emoji),
          h('div', null, h('b', null, c.label), h('div', { class: 'small muted' }, `${ch.s.length} joueur${ch.s.length > 1 ? 's' : ''}${top ? ` · 👑 ${top.name} (${fmtVal(c, top.value)})` : ''}`)));
      })) : null);
  };
  draw();
  return wrap;
}

function createModal(redraw) {
  let type = CHALLENGES[0].id;
  const m = modal(h('div', { class: 'stack' },
    chips(CHALLENGES.map((c) => ({ id: c.id, label: `${c.emoji} ${c.label}` })), type, { multi: false, onChange: (v) => { type = v; } }),
    h('button', {
      class: 'btn primary big',
      onclick: () => {
        m.close();
        const name = myName() || 'Moi';
        const ch = saveChallenge(newChallenge(type, name, todayISO()));
        attempt(ch, (u) => { redraw(); share(u); });
      },
    }, 'Faire mon score et partager')),
  { title: 'Nouveau défi' });
}

export function renderChallenges(root) {
  clear(root);
  root.append(h('section', { class: 'page-head' }, h('h1', null, '👥 Défis'), h('p', { class: 'muted' }, 'Affronte tes amis à distance, sans compte.')), challengesSection());
}
