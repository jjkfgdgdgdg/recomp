// Questionnaire d'accueil : on pose beaucoup de questions pour personnaliser le programme.
import { h, add, clear, chips, field, numInput, toast } from '../ui.js';
import { getState, update } from '../store.js';
import { GOALS } from '../engine/planner.js';
import { ACTIVITY, bmi } from '../engine/nutrition.js';
import { EQUIPMENT, INJURIES } from '../data/exercises.js';
import { DIETS } from '../data/meals.js';
import { DAY_SHORT, todayISO } from '../engine/dates.js';
import { regeneratePlan } from '../services.js';
import { navigate } from '../router.js';

const LEVELS = [
  { id: 0, label: 'Jamais pratiqué' },
  { id: 1, label: 'Débutant (< 6 mois)' },
  { id: 2, label: 'Intermédiaire (6 mois - 2 ans)' },
  { id: 3, label: 'Avancé (> 2 ans)' },
];

function defaults() {
  return {
    name: '', sex: 'male', age: null, height: null, weight: null, targetWeight: null, waist: null, neck: null, hip: null,
    goals: [], primaryGoal: null, liftLevel: 1, mtLevel: 0,
    tests: { push: null, squat: null, pull: null, plank: null, rope: null },
    days: [0, 2, 4], sessionMinutes: 45, equipment: [], injuries: [],
    sleep: 7, stress: 3, water: 1.5, meals: 3, diet: 'omni', activity: 'light', consent: false,
  };
}

export function renderOnboarding(root, params = {}) {
  const existing = getState().profile;
  const draft = existing ? { ...defaults(), ...structuredClone(existing), consent: true } : defaults();
  let step = params.step ? Number(params.step) : 0;

  const steps = [
    {
      title: 'Bienvenue sur Recomp 👋',
      sub: 'Ton coach sport & bien-être 100 % gratuit. Je vais te poser pas mal de questions pour construire un programme fait pour toi.',
      body: () => [
        h('ul', { class: 'bullets' },
          h('li', null, '💪 Programme musculation + Muay Thai généré automatiquement'),
          h('li', null, '📷 Coach caméra : un squelette sur toi qui compte tes reps et corrige ta posture'),
          h('li', null, '🍽️ Calories, protéines et eau calculées pour ton objectif'),
          h('li', null, '🔒 Tout reste sur ton téléphone : aucune donnée envoyée, aucun compte')),
        h('label', { class: 'check' },
          h('input', { type: 'checkbox', checked: draft.consent, onchange: (e) => { draft.consent = e.target.checked; } }),
          h('span', null, 'Je comprends que Recomp ne remplace pas un avis médical. J’arrête un exercice en cas de douleur.')),
      ],
      valid: () => draft.consent || 'Coche la case pour continuer',
    },
    {
      title: 'Faisons connaissance',
      body: () => [
        field('Ton prénom', h('input', { class: 'input', value: draft.name, placeholder: 'Ex. Alex', maxlength: 30, oninput: (e) => { draft.name = e.target.value.trim(); } })),
        field('Sexe (pour les calculs de métabolisme)', chips([{ id: 'male', label: 'Homme' }, { id: 'female', label: 'Femme' }], draft.sex, { multi: false, onChange: (v) => { draft.sex = v; } })),
        field('Âge', numInput(draft.age, { min: 12, max: 90, placeholder: 'ans', onInput: (v) => { draft.age = v; } })),
      ],
      valid: () => (draft.age >= 12 && draft.age <= 90) || 'Indique ton âge (12 à 90 ans)',
    },
    {
      title: 'Ton corps aujourd’hui',
      sub: 'Les mesures servent à calculer tes besoins. Le tour de taille et de cou sont optionnels (estimation du % de gras).',
      body: () => [
        h('div', { class: 'grid2' },
          field('Taille (cm)', numInput(draft.height, { min: 120, max: 230, placeholder: '178', onInput: (v) => { draft.height = v; } })),
          field('Poids (kg)', numInput(draft.weight, { min: 30, max: 250, step: 0.1, placeholder: '72', onInput: (v) => { draft.weight = v; } })),
          field('Poids visé (kg)', numInput(draft.targetWeight, { min: 30, max: 250, step: 0.1, placeholder: 'optionnel', onInput: (v) => { draft.targetWeight = v; } })),
          field('Tour de taille (cm)', numInput(draft.waist, { min: 40, max: 200, placeholder: 'au nombril', onInput: (v) => { draft.waist = v; } })),
          field('Tour de cou (cm)', numInput(draft.neck, { min: 20, max: 70, placeholder: 'optionnel', onInput: (v) => { draft.neck = v; } })),
          draft.sex === 'female' ? field('Tour de hanches (cm)', numInput(draft.hip, { min: 50, max: 200, placeholder: 'optionnel', onInput: (v) => { draft.hip = v; } })) : null),
      ],
      valid: () => {
        if (!(draft.height >= 120 && draft.height <= 230)) return 'Indique ta taille en cm';
        if (!(draft.weight >= 30 && draft.weight <= 250)) return 'Indique ton poids en kg';
        return true;
      },
    },
    {
      title: 'Tes objectifs',
      sub: 'Choisis tout ce qui t’intéresse, puis ton objectif n°1.',
      body: () => {
        const prim = h('div');
        const renderPrim = () => {
          clear(prim);
          const opts = GOALS.filter((g) => draft.goals.includes(g.id));
          if (!opts.length) return;
          if (!draft.goals.includes(draft.primaryGoal)) draft.primaryGoal = opts[0].id;
          add(prim, field('Objectif principal', chips(opts, draft.primaryGoal, { multi: false, onChange: (v) => { draft.primaryGoal = v; } })));
        };
        renderPrim();
        return [
          chips(GOALS, draft.goals, { onChange: (v) => { draft.goals = v; renderPrim(); } }),
          prim,
        ];
      },
      valid: () => (draft.goals.length ? true : 'Choisis au moins un objectif'),
    },
    {
      title: 'Ton expérience',
      body: () => [
        field('Musculation / renforcement', chips(LEVELS, draft.liftLevel, { multi: false, onChange: (v) => { draft.liftLevel = v; } })),
        field('Muay Thai / sports de combat', chips(LEVELS, draft.mtLevel, { multi: false, onChange: (v) => { draft.mtLevel = v; } })),
      ],
      valid: () => true,
    },
    {
      title: 'Tests de niveau',
      sub: 'Réponds au mieux (laisse vide si tu ne sais pas). Tu pourras refaire ces tests avec la caméra pour plus de précision.',
      body: () => [
        h('div', { class: 'grid2' },
          field('Pompes d’affilée (max)', numInput(draft.tests.push, { min: 0, max: 150, placeholder: 'ex. 15', onInput: (v) => { draft.tests.push = v; } })),
          field('Squats en 1 minute', numInput(draft.tests.squat, { min: 0, max: 120, placeholder: 'ex. 35', onInput: (v) => { draft.tests.squat = v; } })),
          field('Tractions (max)', numInput(draft.tests.pull, { min: 0, max: 60, placeholder: '0 si aucune', onInput: (v) => { draft.tests.pull = v; } })),
          field('Gainage planche (secondes)', numInput(draft.tests.plank, { min: 0, max: 600, placeholder: 'ex. 60', onInput: (v) => { draft.tests.plank = v; } })),
          field('Corde à sauter sans t’arrêter (min)', numInput(draft.tests.rope, { min: 0, max: 60, step: 0.5, placeholder: 'optionnel', onInput: (v) => { draft.tests.rope = v; } }))),
      ],
      valid: () => true,
    },
    {
      title: 'Ta disponibilité',
      body: () => [
        field('Jours d’entraînement', chips(DAY_SHORT.map((d, i) => ({ id: i, label: d })), draft.days, { onChange: (v) => { draft.days = v.map(Number).sort((a, b) => a - b); } }),
          'Conseil : laisse au moins 1 jour de repos par semaine.'),
        field('Durée par séance', chips([20, 30, 45, 60, 75, 90].map((m) => ({ id: m, label: `${m} min` })), draft.sessionMinutes, { multi: false, onChange: (v) => { draft.sessionMinutes = v; } })),
      ],
      valid: () => (draft.days.length ? true : 'Choisis au moins un jour'),
    },
    {
      title: 'Ton matériel',
      sub: 'Rien ? Aucun souci : tout peut se faire au poids du corps.',
      body: () => [chips(EQUIPMENT.filter((e) => e.id !== 'none'), draft.equipment, { onChange: (v) => { draft.equipment = v; } })],
      valid: () => true,
    },
    {
      title: 'Douleurs ou blessures ?',
      sub: 'Les exercices risqués pour ces zones seront retirés et remplacés.',
      body: () => [
        chips(INJURIES, draft.injuries, { onChange: (v) => { draft.injuries = v; } }),
        h('p', { class: 'muted small' }, 'Douleur forte, récente ou qui ne passe pas : consulte un médecin ou un kiné avant de t’entraîner.'),
      ],
      valid: () => true,
    },
    {
      title: 'Ton mode de vie',
      body: () => [
        field('Activité en dehors du sport', chips(ACTIVITY.map((a) => ({ id: a.id, label: a.label })), draft.activity, { multi: false, onChange: (v) => { draft.activity = v; } })),
        h('div', { class: 'grid2' },
          field('Sommeil moyen (heures)', numInput(draft.sleep, { min: 3, max: 12, step: 0.5, onInput: (v) => { draft.sleep = v; } })),
          field('Eau bue par jour (litres)', numInput(draft.water, { min: 0, max: 8, step: 0.25, onInput: (v) => { draft.water = v; } })),
          field('Repas par jour', numInput(draft.meals, { min: 2, max: 6, onInput: (v) => { draft.meals = v; } }))),
        field('Niveau de stress', chips([1, 2, 3, 4, 5].map((n) => ({ id: n, label: ['😌 1', '🙂 2', '😐 3', '😟 4', '😫 5'][n - 1] })), draft.stress, { multi: false, onChange: (v) => { draft.stress = v; } })),
        field('Alimentation', chips(DIETS, draft.diet, { multi: false, onChange: (v) => { draft.diet = v; } })),
      ],
      valid: () => true,
    },
    {
      title: 'C’est prêt !',
      body: () => {
        const b = draft.weight && draft.height ? bmi(draft.weight, draft.height) : null;
        const warn = [];
        if (draft.age < 16) warn.push('Moins de 16 ans : programme orienté technique et poids du corps, pas de régime. Demande l’avis d’un adulte / médecin.');
        if (b && b < 17.5) warn.push('Ton IMC est bas : pas de déficit calorique, on vise la prise de muscle. Un avis médical est conseillé.');
        if (b && b >= 35) warn.push('IMC élevé : on privilégie les exercices à faible impact pour protéger tes articulations.');
        return [
          h('div', { class: 'recap' },
            h('div', null, h('b', null, draft.name || 'Toi'), `, ${draft.age} ans · ${draft.height} cm · ${draft.weight} kg`),
            h('div', null, 'Objectifs : ', GOALS.filter((g) => draft.goals.includes(g.id)).map((g) => g.emoji + ' ' + g.label).join(', ')),
            h('div', null, `${draft.days.length} séances / semaine · ${draft.sessionMinutes} min`),
            h('div', null, 'Matériel : ', draft.equipment.length ? EQUIPMENT.filter((e) => draft.equipment.includes(e.id)).map((e) => e.label).join(', ') : 'poids du corps')),
          warn.map((w) => h('div', { class: 'alert' }, '⚠️ ', w)),
          h('p', { class: 'muted' }, 'Le programme s’adaptera tout seul : tes reps, ta forme du jour et tes tests le font évoluer chaque semaine.'),
        ];
      },
      valid: () => true,
    },
  ];

  if (draft.age && draft.age < 16) draft.equipment = draft.equipment.filter((e) => e !== 'gym');

  const render = () => {
    clear(root);
    const st = steps[step];
    const progress = Math.round((step / (steps.length - 1)) * 100);
    const error = h('div', { class: 'form-error', role: 'alert' });
    add(root, h('section', { class: 'onboarding' },
      h('div', { class: 'progress-top' }, h('div', { class: 'progress-top-fill', style: { width: `${progress}%` } })),
      h('div', { class: 'muted small' }, `Étape ${step + 1} / ${steps.length}`),
      h('h1', null, st.title),
      st.sub ? h('p', { class: 'lead' }, st.sub) : null,
      h('div', { class: 'stack' }, st.body()),
      error,
      h('div', { class: 'row gap onb-nav' },
        step > 0 ? h('button', { class: 'btn ghost', onclick: () => { step -= 1; render(); } }, 'Retour')
          : existing ? h('button', { class: 'btn ghost', onclick: () => navigate('#/profile') }, 'Annuler') : h('span'),
        h('button', {
          class: 'btn primary',
          onclick: () => {
            const ok = st.valid();
            if (ok !== true) { error.textContent = ok; return; }
            if (step < steps.length - 1) { step += 1; render(); window.scrollTo(0, 0); } else finish();
          },
        }, step === steps.length - 1 ? (existing ? 'Mettre à jour mon programme' : 'Générer mon programme 🚀') : 'Continuer'))));
  };

  const finish = () => {
    const profile = { ...draft };
    delete profile.consent;
    if (profile.age < 16) profile.equipment = profile.equipment.filter((e) => e !== 'gym');
    update((s) => {
      const isNew = !s.profile;
      profile.createdAt = s.profile?.createdAt || new Date().toISOString();
      profile.planStart = s.profile?.planStart || todayISO();
      s.profile = profile;
      if (isNew || !s.logs.weights.length) s.logs.weights.push({ date: todayISO(), weight: profile.weight, waist: profile.waist || null });
      const t = profile.tests;
      if (t.push !== null || t.squat !== null || t.pull !== null || t.plank !== null) {
        s.logs.tests.push({ date: todayISO(), ...t, source: 'questionnaire' });
      }
      regeneratePlan(s);
    });
    toast(existing ? 'Programme mis à jour ✅' : 'Ton programme est prêt 🔥');
    navigate(existing ? '#/plan' : '#/today');
  };

  render();
}
