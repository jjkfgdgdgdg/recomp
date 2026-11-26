// Photos de progression : stockées UNIQUEMENT sur l'appareil (IndexedDB), jamais envoyées.
// Fonction optionnelle : désactivée par défaut, l'utilisateur doit l'activer lui-même.
const DB_NAME = 'recomp-photos';
const STORE = 'photos';

function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('Stockage photo indisponible sur ce navigateur')); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    let result;
    Promise.resolve(fn(store)).then((r) => { result = r; });
    t.oncomplete = () => { db.close(); resolve(result); };
    t.onerror = () => { db.close(); reject(t.error); };
  });
}

function req2promise(r) {
  return new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
}

async function loadImage(file) {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* repli ci-dessous */ }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image illisible'));
    img.src = URL.createObjectURL(file);
  });
}

function draw(img, maxSide) {
  const w = img.width; const hgt = img.height;
  const s = Math.min(1, maxSide / Math.max(w, hgt));
  const c = document.createElement('canvas');
  c.width = Math.round(w * s); c.height = Math.round(hgt * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c;
}

/** Compresse et enregistre une photo. meta = { date, pose } */
export async function addPhoto(file, meta) {
  const img = await loadImage(file);
  const big = draw(img, 1280);
  const blob = await new Promise((res) => big.toBlob(res, 'image/jpeg', 0.85));
  const thumb = draw(img, 260).toDataURL('image/jpeg', 0.7);
  const rec = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, date: meta.date, pose: meta.pose, blob, thumb, w: big.width, h: big.height,
  };
  await tx('readwrite', (st) => req2promise(st.put(rec)));
  return rec;
}

export async function listPhotos() {
  const all = await tx('readonly', (st) => req2promise(st.getAll()));
  return (all || []).sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date)));
}

export async function deletePhoto(id) {
  await tx('readwrite', (st) => req2promise(st.delete(id)));
}

export async function clearPhotos() {
  await tx('readwrite', (st) => req2promise(st.clear()));
}

export function photoUrl(rec) {
  return URL.createObjectURL(rec.blob);
}
