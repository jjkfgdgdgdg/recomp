// Section « Photos de progression » (optionnelle) : prise de photo, galerie, comparaison avant / après.
import { h, add, clear, chips, modal, toast, confirmBox } from '../ui.js';
import { getState, update } from '../store.js';
import { addPhoto, listPhotos, deletePhoto, clearPhotos, photoUrl } from '../photos.js';
import { todayISO, shortDate, daysBetween } from '../engine/dates.js';
import { award } from '../game/service.js';
import { saveFile } from '../native.js';
import { SPLIT } from '../game/leveling.js';

const POSES = [{ id: 'face', label: 'Face' }, { id: 'profil', label: 'Profil' }, { id: 'dos', label: 'Dos' }];

export function photosSection() {
  const wrap = h('section', { class: 'card photos' });
  const draw = async () => {
    clear(wrap);
    const enabled = getState().settings.photos === true;
    add(wrap, h('div', { class: 'card-title' }, '📸 Photos de progression'));
    if (!enabled) {
      add(wrap,
        h('p', { class: 'small' }, 'Optionnel : prends une photo toutes les 4 semaines pour voir ton corps changer. C’est souvent plus motivant que la balance.'),
        h('p', { class: 'small muted' }, '🔒 Les photos restent uniquement sur cet appareil. Elles ne sont jamais envoyées, ni incluses dans l’export, ni visibles par tes amis.'),
        h('button', { class: 'btn ghost', onclick: () => { update((s) => { s.settings.photos = true; }); draw(); } }, 'Activer les photos de progression'));
      return;
    }
    let pose = 'face';
    let photos = [];
    try { photos = await listPhotos(); } catch (e) { add(wrap, h('p', { class: 'small warn-text' }, e.message)); }
    const last = photos[photos.length - 1];
    const due = !last || daysBetween(last.date, todayISO()) >= 28;
    const onFile = async (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      try {
        await addPhoto(file, { date: todayISO(), pose });
        const firstToday = !photos.some((p) => p.date === todayISO());
        toast('Photo enregistrée sur ton appareil 📸');
        if (firstToday) award(15, SPLIT.life, 'Photo de progression');
        draw();
      } catch (err) {
        toast(`Photo impossible : ${err.message}`);
      }
    };
    const takeInput = h('input', { type: 'file', accept: 'image/*', capture: 'user', hidden: true, onchange: onFile });
    const pickInput = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: onFile });
    add(wrap,
      due ? h('div', { class: 'pill info' }, last ? '⏰ Ça fait 4 semaines : c’est le moment d’une nouvelle photo !' : 'Prends ta première photo « avant » 💪') : null,
      h('p', { class: 'small muted' }, 'Astuce : même endroit, même lumière, même heure (le matin), même tenue. Une photo de face, de profil et de dos.'),
      chips(POSES, pose, { multi: false, onChange: (v) => { pose = v; } }),
      h('div', { class: 'row gap wrap' },
        h('button', { class: 'btn primary', onclick: () => takeInput.click() }, '📷 Prendre une photo'),
        h('button', { class: 'btn ghost', onclick: () => pickInput.click() }, '🖼️ Choisir dans la galerie'),
        takeInput, pickInput));
    if (photos.length) {
      const byDate = {};
      photos.forEach((p) => { (byDate[p.date] = byDate[p.date] || []).push(p); });
      const dates = Object.keys(byDate).sort().reverse();
      add(wrap,
        photos.length >= 2 ? h('button', { class: 'btn ghost small', onclick: () => compareModal(photos) }, '↔️ Comparer avant / après') : null,
        h('div', { class: 'photo-days' }, dates.map((d) => h('div', { class: 'photo-day' },
          h('div', { class: 'small muted' }, `${shortDate(d)} · il y a ${daysBetween(d, todayISO())} j`),
          h('div', { class: 'photo-grid' }, byDate[d].map((p) => h('button', { class: 'photo-thumb', onclick: () => viewModal(p, draw), 'aria-label': `Photo ${p.pose} du ${shortDate(p.date)}` },
            h('img', { src: p.thumb, alt: '' }), h('span', null, p.pose))))))));
    }
    add(wrap, h('button', {
      class: 'link small danger-link',
      onclick: async () => {
        if (!(await confirmBox('Désactiver les photos et supprimer toutes celles enregistrées sur cet appareil ?', { danger: true, ok: 'Supprimer' }))) return;
        await clearPhotos().catch(() => {});
        update((s) => { s.settings.photos = false; });
        toast('Photos supprimées');
        draw();
      },
    }, 'Désactiver et supprimer toutes les photos'));
  };
  draw();
  return wrap;
}

function viewModal(p, redraw) {
  const url = photoUrl(p);
  const m = modal(h('div', { class: 'stack' },
    h('img', { class: 'photo-full', src: url, alt: `Photo ${p.pose}` }),
    h('div', { class: 'row gap wrap' },
      h('button', { class: 'btn ghost small', onclick: () => saveFile(`recomp-${p.date}-${p.pose}.jpg`, p.blob, 'image/jpeg') }, 'Télécharger'),
      h('button', {
        class: 'btn danger small',
        onclick: async () => { await deletePhoto(p.id); m.close(); toast('Photo supprimée'); redraw(); },
      }, 'Supprimer'))),
  { title: `${shortDate(p.date)} · ${p.pose}`, onClose: () => setTimeout(() => URL.revokeObjectURL(url), 1000) });
}

function compareModal(photos) {
  const poses = [...new Set(photos.map((p) => p.pose))];
  let pose = poses.includes('face') ? 'face' : poses[0];
  const box = h('div', { class: 'compare' });
  const urls = [];
  const draw = () => {
    clear(box);
    const list = photos.filter((p) => p.pose === pose);
    if (list.length < 2) { add(box, h('p', { class: 'small muted' }, 'Il faut au moins 2 photos de cette pose.')); return; }
    const before = list[0]; const after = list[list.length - 1];
    const ub = photoUrl(before); const ua = photoUrl(after);
    urls.push(ub, ua);
    const top = h('img', { class: 'cmp-after', src: ua, alt: 'Après' });
    const slider = h('input', { type: 'range', min: 0, max: 100, value: 50, class: 'cmp-range', 'aria-label': 'Comparer avant et après', oninput: (e) => { top.style.clipPath = `inset(0 0 0 ${e.target.value}%)`; } });
    top.style.clipPath = 'inset(0 0 0 50%)';
    add(box,
      h('div', { class: 'cmp-stage' }, h('img', { class: 'cmp-before', src: ub, alt: 'Avant' }), top,
        h('span', { class: 'cmp-label l' }, `Avant · ${shortDate(before.date)}`), h('span', { class: 'cmp-label r' }, `Après · ${shortDate(after.date)}`)),
      slider,
      h('p', { class: 'small muted center' }, `${daysBetween(before.date, after.date)} jours d’écart`));
  };
  draw();
  modal(h('div', { class: 'stack' }, chips(POSES.filter((p) => poses.includes(p.id)), pose, { multi: false, onChange: (v) => { pose = v; draw(); } }), box),
    { title: 'Avant / après', wide: true, onClose: () => setTimeout(() => urls.forEach((u) => URL.revokeObjectURL(u)), 1000) });
}
