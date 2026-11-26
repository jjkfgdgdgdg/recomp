import { joinDocs, META, splitState, stableStringify, type Docs } from './sync';
import type { State } from './types';

/**
 * Synchronisation avec le stockage de claude.ai, quand l'appli y est publiée.
 * Ailleurs (fichier local, GitHub Pages…), `window.claude` n'existe pas et tout reste sur l'appareil.
 * Règle de conflit : la version modifiée le plus récemment gagne.
 */
export type CloudStatus = 'local' | 'connecting' | 'synced' | 'saving' | 'offline' | 'error' | 'full';

interface DocSnap {
  id: string;
  exists: boolean;
  data(): Record<string, unknown> | undefined;
}
interface DocRef {
  set(data: Record<string, unknown>): Promise<void>;
  delete(): Promise<void>;
}
interface Collection {
  doc(id: string): DocRef;
  onSnapshot(
    next: (s: { docs: DocSnap[]; metadata: { fromCache: boolean; hasPendingWrites: boolean } }) => void,
    error?: (e: { code: string }) => void,
  ): () => void;
}
interface ClaudeRuntime {
  use(name: string): Promise<unknown>;
}

export function runtime(): ClaudeRuntime | null {
  const c = (globalThis as { claude?: ClaudeRuntime }).claude;
  return c && typeof c.use === 'function' ? c : null;
}

export interface CloudHandle {
  schedule(): void;
}

export async function connectCloud(opts: {
  getState(): State;
  onRemote(state: State): void;
  onStatus(status: CloudStatus): void;
}): Promise<CloudHandle | null> {
  const claude = runtime();
  if (!claude) {
    opts.onStatus('local');
    return null;
  }
  opts.onStatus('connecting');
  const [db, user] = (await Promise.all([claude.use('db'), claude.use('user')])) as [
    { collection(path: string): Collection } | null,
    { id(): Promise<string | null> } | null,
  ];
  const id = db && user ? await user.id().catch(() => null) : null;
  if (!db || !id) {
    opts.onStatus('local');
    return null;
  }

  const col = db.collection(`data/users/${id}`);
  /** Ce que le serveur contient, document par document (JSON trié) */
  const remote = new Map<string, string>();
  let ready = false;
  let writing = false;
  let again = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const offlineTimer = setTimeout(() => {
    if (!ready) opts.onStatus('offline');
  }, 10_000);

  async function flush() {
    if (!ready) return;
    if (writing) {
      again = true;
      return;
    }
    writing = true;
    try {
      do {
        again = false;
        const docs = splitState(opts.getState());
        // Les mois d'abord, « meta » en dernier : un autre appareil ne voit jamais un meta plus récent que l'historique.
        const keys = [...Object.keys(docs).filter((k) => k !== META), META];
        for (const key of keys) {
          const json = stableStringify(docs[key]);
          if (remote.get(key) === json) continue;
          opts.onStatus('saving');
          await col.doc(key).set(docs[key]);
          remote.set(key, json);
        }
        for (const key of [...remote.keys()]) {
          if (key in docs) continue;
          await col.doc(key).delete();
          remote.delete(key);
        }
      } while (again);
      opts.onStatus('synced');
    } catch (e) {
      opts.onStatus((e as { code?: string })?.code === 'quota_exceeded' ? 'full' : 'error');
    } finally {
      writing = false;
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(flush, 700);
  }

  col.onSnapshot(
    (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const docs: Docs = {};
      for (const d of snap.docs) if (d.exists) docs[d.id] = d.data() ?? {};
      remote.clear();
      for (const [k, v] of Object.entries(docs)) remote.set(k, stableStringify(v));

      const fromServer = joinDocs(docs);
      const local = opts.getState();
      if (fromServer && fromServer.updatedAt > local.updatedAt) opts.onRemote(fromServer);

      if (!snap.metadata.fromCache) {
        const first = !ready;
        ready = true;
        clearTimeout(offlineTimer);
        if (!writing) opts.onStatus('synced');
        // Des changements faits sur cet appareil avant la connexion ? On les envoie.
        if (first && (!fromServer || fromServer.updatedAt < local.updatedAt) && local.updatedAt > 0) schedule();
      }
    },
    () => {
      clearTimeout(offlineTimer);
      opts.onStatus('error');
    },
  );

  return { schedule };
}

/** Propose un fichier au téléchargement (sur claude.ai via la capacité « downloads », sinon par un lien classique). */
export async function saveFile(filename: string, data: string): Promise<'saved' | 'declined' | 'unavailable'> {
  const claude = runtime();
  if (claude) {
    const dl = (await claude.use('downloads')) as { save(r: { filename: string; data: string }): Promise<unknown> } | null;
    if (!dl) return 'unavailable';
    try {
      await dl.save({ filename, data });
      return 'saved';
    } catch (e) {
      return (e as { code?: string })?.code === 'declined' ? 'declined' : 'unavailable';
    }
  }
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'saved';
}
