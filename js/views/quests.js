// Carte des quêtes du jour (accueil) + mini-fiche du héros.
import { h, toast, fmt } from '../ui.js';
import { getState, update } from '../store.js';
import { questStatus } from '../game/quests.js';
import { SPLIT, TITLES } from '../game/leveling.js';
import { award, bump, playerSummary } from '../game/service.js';
import { line, say } from '../voice.js';
import { addWater } from '../services.js';
import { openCoach } from './coachOverlay.js';
import { navigate } from '../router.js';

export function playerMini() {
  const ps = playerSummary();
  const title = TITLES.find((t) => t.id === ps.game.equippedTitle);
  return h('a', { class: 'player-mini', href: '#/hero', style: { '--rank': ps.rank.color } },
    h('div', { class: 'pm-rank' }, ps.rank.id),
    h('div', { class: 'pm-main' },
      h('div', { class: 'row between' }, h('b', null, `Niveau ${ps.level}`), h('span', { class: 'muted small' }, title ? `${title.emoji} ${title.name}` : ps.rank.desc)),
      h('div', { class: 'xpbar' }, h('div', { class: 'xpbar-fill', style: { width: `${ps.progress * 100}%` } })),
      h('div', { class: 'muted small' }, `${ps.into} / ${ps.next} XP`)));
}

function fmtVal(q, v) {
  if (q.unit === 'ml') return `${fmt(v / 1000, 2)} / ${fmt(q.target / 1000, 2)} L`;
  if (!q.unit) return v >= q.target ? 'Fait' : 'À faire';
  return `${Math.min(v, 99999)} / ${q.target} ${q.unit === 'reps' ? '' : q.unit}`.trim();
}

const QUEST_SPLIT = { pushups: { str: 1 }, squats: { str: 0.7, end: 0.3 }, plank: { str: 0.5, men: 0.5 }, jacks: { end: 1 }, lunges: { str: 0.7, agi: 0.3 }, burpees: { end: 0.6, str: 0.4 }, kicks: { agi: 0.7, tec: 0.3 }, knees: { agi: 0.7, end: 0.3 } };

export function questsCard(iso, rerender) {
  const s = getState();
  const st = questStatus(s, iso);
  const ensure = (st2) => {
    st2.game.quests[iso] = st2.game.quests[iso] || { manual: {}, xpGiven: {}, claimed: false };
    return st2.game.quests[iso];
  };
  const addManual = (q, n) => {
    update((st2) => { const d = ensure(st2); d.manual[q.id] = Math.max(0, (d.manual[q.id] || 0) + n); });
    rerender();
  };
  const claim = (item) => {
    update((st2) => { ensure(st2).xpGiven[item.q.id] = true; });
    say('quest', { interrupt: true });
    award(item.q.xp, QUEST_SPLIT[item.q.id] || (item.q.kind === 'water' ? SPLIT.water : SPLIT.life), `Quête : ${item.q.label}`);
    rerender();
  };
  const openChest = () => {
    const ps = playerSummary();
    update((st2) => { ensure(st2).claimed = true; });
    bump('questDays');
    award(100 + ps.level * 5, { men: 0.5, str: 0.2, end: 0.2, agi: 0.1 }, 'Toutes les quêtes du jour');
    toast('🎁 Coffre ouvert : bonus de discipline !');
    rerender();
  };
  const penalty = st.items.find((i) => i.q.penalty);
  const doneCount = st.items.filter((i) => i.done).length;
  const allClaimed = st.items.every((i) => i.claimed);

  return h('section', { class: 'card quests' },
    h('div', { class: 'row between' },
      h('div', { class: 'card-title' }, '📜 Quêtes du jour'),
      h('span', { class: 'muted small' }, `${doneCount}/${st.items.length}`)),
    penalty && !penalty.done ? h('div', { class: 'penalty' },
      h('b', null, '⚠️ Quête de pénalité'),
      h('p', { class: 'small' }, line('penalty')),
      h('p', { class: 'small muted' }, `Ratées hier : ${penalty.q.missed.join(', ')}`)) : null,
    st.items.map((item) => {
      const { q, value, done, claimed } = item;
      const pct = Math.min(100, (value / q.target) * 100);
      const controls = [];
      if (!done) {
        if (q.tracker) {
          (q.steps || [5, 10]).forEach((n) => controls.push(h('button', { class: 'btn small ghost', onclick: () => addManual(q, n) }, `+${n}`)));
          controls.push(h('button', {
            class: 'btn small cam', 'aria-label': `Faire ${q.label} avec la caméra`,
            onclick: () => openCoach({
              trackerId: q.tracker, title: `Quête : ${q.label}`,
              target: q.unit === 's' ? { secs: Math.max(10, q.target - value) } : { reps: Math.max(1, q.target - value) },
              onDone: () => rerender(),
            }),
          }, '📷'));
        } else if (q.kind === 'water') {
          controls.push(h('button', { class: 'btn small ghost', onclick: () => { addWater(iso, 250); rerender(); } }, '+250 ml'));
        } else if (q.kind === 'manual') {
          (q.steps || [10]).forEach((n) => controls.push(h('button', { class: 'btn small ghost', onclick: () => addManual(q, n) }, `+${n} min`)));
        } else if (q.kind === 'session') {
          controls.push(h('button', { class: 'btn small ghost', onclick: () => navigate(`#/session/${iso}`) }, 'Go'));
        } else if (q.kind === 'breath') {
          controls.push(h('button', { class: 'btn small ghost', onclick: () => navigate('#/wellness') }, 'Go'));
        }
      } else if (!claimed) {
        controls.push(h('button', { class: 'btn small primary pulse', onclick: () => claim(item) }, `+${q.xp} XP`));
      } else {
        controls.push(h('span', { class: 'q-done' }, '✓'));
      }
      return h('div', { class: `quest${done ? ' done' : ''}${q.penalty ? ' pen' : ''}` },
        h('span', { class: 'q-emoji' }, q.emoji),
        h('div', { class: 'q-main' },
          h('div', { class: 'row between' }, h('b', null, q.label), h('span', { class: 'small muted' }, fmtVal(q, value))),
          h('div', { class: 'bar' }, h('div', { class: 'bar-fill', style: { width: `${pct}%` } }))),
        h('div', { class: 'q-ctrl' }, controls));
    }),
    st.allDone && allClaimed && !st.bonusClaimed
      ? h('button', { class: 'btn primary big chest', onclick: openChest }, '🎁 Ouvrir le coffre du jour')
      : st.bonusClaimed ? h('p', { class: 'small muted center' }, '✅ Toutes les quêtes sont faites. Reviens demain !')
        : h('p', { class: 'small muted' }, 'Les reps faites en séance ou avec le coach caméra comptent automatiquement. Les boutons + servent si tu les fais sans l’app.'));
}
