import { useEffect, useMemo, useState } from 'preact/hooks';
import { IconChart, IconGear, IconGift, IconList, IconTimer, IconToday } from './components/Icons';
import { Bar, Tickets, Toasts } from './components/ui';
import { runtime } from './lib/cloud';
import { todayKey } from './lib/dates';
import { confetti, keepScreenOn, play, setSoundEnabled, toast } from './lib/effects';
import { advance, formatClock, remainingMs } from './lib/focus';
import { ACHIEVEMENTS, derive, unlockedNow } from './lib/logic';
import { dispatch, getState, getTimer, setTimer, useAppState, useCloudStatus, useTimer } from './lib/store';
import { Focus } from './pages/Focus';
import { Habits } from './pages/Habits';
import { Progress } from './pages/Progress';
import { Rewards } from './pages/Rewards';
import { Settings } from './pages/Settings';
import { Today } from './pages/Today';
import { Welcome } from './pages/Welcome';

const TABS = [
  { id: 'aujourdhui', label: 'Aujourd’hui', Icon: IconToday },
  { id: 'habitudes', label: 'Habitudes', Icon: IconList },
  { id: 'focus', label: 'Focus', Icon: IconTimer },
  { id: 'recompenses', label: 'Boutique', Icon: IconGift },
  { id: 'progres', label: 'Progrès', Icon: IconChart },
] as const;
const ROUTES = new Set<string>([...TABS.map((t) => t.id), 'reglages']);

function useRoute(): string {
  const read = () => {
    const h = location.hash.slice(1);
    return ROUTES.has(h) ? h : 'aujourdhui';
  };
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => {
      setRoute(read());
      scrollTo(0, 0);
    };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return route;
}

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Fait tourner le minuteur focus, quel que soit l'onglet affiché */
function useFocusEngine() {
  const timer = useTimer();
  useEffect(() => {
    if (!timer.running) return;
    const tick = () => {
      const s = getState();
      const { timer: next, events } = advance(getTimer(), Date.now(), s.settings.breakMinutes);
      if (!events.length) return;
      for (const e of events) {
        if (e.type === 'focusDone') {
          const pts = getState().settings.focusPoints;
          dispatch({ type: 'focusDone', minutes: e.minutes, points: pts, date: todayKey(e.at, s.settings.dayEndHour), now: e.at });
          play('bell');
          toast('🎯', `Session terminée : +${pts} tickets`, `Pause de ${s.settings.breakMinutes} min, tu l’as méritée.`, 5000);
        } else {
          play('bell');
          void keepScreenOn(false);
          toast('☕', 'Pause terminée', 'Prêt pour une nouvelle session ?', 5000);
        }
      }
      setTimer(next);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timer.running, timer.phase, timer.endsAt]);
  return timer;
}

export function App() {
  const state = useAppState();
  const cloud = useCloudStatus();
  const route = useRoute();
  const timer = useFocusEngine();
  const now = useNow(timer.phase !== 'idle' ? 1000 : 30_000);
  const today = todayKey(now, state.settings.dayEndHour);
  const derived = useMemo(() => derive(state, today), [state, today]);

  useEffect(() => setSoundEnabled(state.settings.sound), [state.settings.sound]);

  // Annonce les nouveaux succès et les passages de niveau
  useEffect(() => {
    if (!state.onboarded) return;
    const ids = unlockedNow(state, derived);
    const fresh = ids.filter((id) => !state.unlocked.includes(id));
    const level = derived.level.level;
    const levelUp = level > state.lastLevel;
    if (!fresh.length && !levelUp) return;
    for (const id of fresh.slice(-2)) {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (a) toast(a.emoji, `Succès débloqué : ${a.title}`, a.description, 4500);
    }
    if (levelUp) {
      play('level');
      confetti(160);
      toast('🏆', `Niveau ${level} atteint !`, `Te voilà « ${derived.level.title} ».`, 5000);
    }
    dispatch({ type: 'announce', unlocked: [...new Set([...state.unlocked, ...ids])], level: Math.max(level, state.lastLevel) });
  }, [derived]);

  // Le compte à rebours s'affiche dans l'onglet du navigateur
  useEffect(() => {
    document.title =
      timer.phase === 'idle' ? 'Recomp' : `${formatClock(remainingMs(timer, now))} · ${timer.phase === 'focus' ? 'Focus' : 'Pause'} — Recomp`;
  }, [timer, now]);

  const waitingForCloud = !state.onboarded && runtime() !== null && cloud === 'connecting';

  let page;
  if (waitingForCloud) {
    page = (
      <div class="loading">
        <span style={{ fontSize: '2.4rem' }}>🎟️</span>
        <span>Récupération de tes tickets…</span>
      </div>
    );
  } else if (!state.onboarded) {
    page = <Welcome today={today} />;
  } else if (route === 'habitudes') page = <Habits state={state} derived={derived} today={today} />;
  else if (route === 'focus') page = <Focus state={state} today={today} now={now} />;
  else if (route === 'recompenses') page = <Rewards state={state} derived={derived} today={today} />;
  else if (route === 'progres') page = <Progress state={state} derived={derived} today={today} />;
  else if (route === 'reglages') page = <Settings state={state} today={today} />;
  else page = <Today key={today} state={state} derived={derived} today={today} />;

  const ready = state.onboarded && !waitingForCloud;

  return (
    <>
      <div class="app">
        <header class="topbar">
          <a class="brand" href="#aujourdhui" style={{ color: 'inherit', textDecoration: 'none' }}>
            Re<b>comp</b>
          </a>
          {ready && (
            <>
              <a class="level-chip" href="#progres" style={{ color: 'inherit', textDecoration: 'none' }} aria-label={`Niveau ${derived.level.level}`}>
                <span>
                  Niv. {derived.level.level} · {derived.level.title}
                </span>
                <Bar value={derived.level.progress} />
              </a>
              <a href="#recompenses" style={{ textDecoration: 'none' }} aria-label="Voir mes récompenses">
                <Tickets n={derived.totals.balance} />
              </a>
              <a class="icon-btn" href="#reglages" aria-label="Réglages" aria-current={route === 'reglages' ? 'page' : undefined}>
                <IconGear />
              </a>
            </>
          )}
        </header>
        <main>{page}</main>
      </div>
      {ready && (
        <div class="tabbar">
          <nav aria-label="Navigation principale">
            {TABS.map(({ id, label, Icon }) => (
              <a key={id} href={`#${id}`} aria-current={route === id ? 'page' : undefined}>
                <Icon />
                <span>{label}</span>
                {id === 'focus' && timer.phase !== 'idle' && <i class="tab-dot" aria-label="Minuteur en cours" />}
              </a>
            ))}
          </nav>
        </div>
      )}
      <Toasts />
    </>
  );
}
