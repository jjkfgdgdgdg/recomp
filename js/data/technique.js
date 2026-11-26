// Fiches techniques : erreurs fréquentes, respiration, conseils (par schéma moteur, avec précisions par exercice).

export const PATTERN_TECH = {
  h_push: {
    mistakes: ['Hanches qui s’affaissent ou fesses en l’air', 'Coudes écartés à 90° du corps (épaules en danger)', 'Descente incomplète : la poitrine doit presque toucher', 'Tête qui plonge vers le sol'],
    breath: 'Inspire en descendant, expire en poussant.',
    tips: ['Visse les mains dans le sol pour engager les épaules', 'Coudes à environ 45° du buste', 'Contrôle la descente sur 2 secondes'],
  },
  v_push: {
    mistakes: ['Cambrer le bas du dos pour pousser', 'Ne pas tendre complètement les bras en haut', 'Pousser la charge devant le visage au lieu d’au-dessus'],
    breath: 'Inspire et gaine en bas, expire en poussant.',
    tips: ['Serre les fessiers pour protéger le dos', 'La tête passe « à travers la fenêtre » des bras en haut'],
  },
  h_pull: {
    mistakes: ['Tirer avec les bras sans serrer les omoplates', 'Tourner le buste pour aider', 'Hausser les épaules vers les oreilles'],
    breath: 'Expire en tirant, inspire en relâchant.',
    tips: ['Pense « coude vers la hanche »', 'Marque 1 seconde de pause en contraction'],
  },
  v_pull: {
    mistakes: ['Utiliser l’élan (kipping) au lieu des muscles', 'Amplitude partielle : bras pas tendus en bas', 'Menton qui force pour passer la barre'],
    breath: 'Expire en montant, inspire en descendant.',
    tips: ['Commence chaque rep en abaissant les épaules', 'Les négatives lentes (4-5 s) font progresser très vite'],
  },
  squat: {
    mistakes: ['Genoux qui rentrent vers l’intérieur', 'Talons qui décollent', 'Amplitude trop courte (demi-squat)', 'Dos qui s’arrondit en bas'],
    breath: 'Inspire et gaine avant de descendre, expire en remontant.',
    tips: ['Pousse les genoux dans l’axe des pieds', 'Garde la poitrine fière', 'Si les talons décollent : écarte un peu les pieds et travaille la mobilité des chevilles'],
  },
  hinge: {
    mistakes: ['Dos rond', 'Plier les genoux comme un squat au lieu de pousser les fesses en arrière', 'Charge qui s’éloigne des jambes'],
    breath: 'Inspire et gaine en haut, expire en remontant.',
    tips: ['Imagine fermer une porte avec tes fesses', 'Serre fort les fessiers en haut, sans cambrer'],
  },
  lunge: {
    mistakes: ['Buste qui penche vers l’avant', 'Genou avant qui rentre vers l’intérieur', 'Pas trop court : le talon avant décolle'],
    breath: 'Inspire en descendant, expire en remontant.',
    tips: ['Descends à la verticale comme dans un ascenseur', 'Pousse dans le talon avant pour remonter'],
  },
  core: {
    mistakes: ['Bas du dos qui se creuse', 'Bloquer sa respiration', 'Fesses trop hautes en gainage'],
    breath: 'Respire calmement et en continu, ventre gainé.',
    tips: ['Rentre légèrement le nombril et serre les fessiers', 'Mieux vaut 20 s parfaites que 60 s mal alignées'],
  },
  biceps: {
    mistakes: ['Balancer le buste pour monter la charge', 'Coudes qui avancent', 'Descente trop rapide'],
    breath: 'Expire en montant, inspire en descendant.',
    tips: ['Coudes collés aux côtes', 'Descente en 2-3 secondes : c’est là que le muscle travaille le plus'],
  },
  triceps: {
    mistakes: ['Coudes qui s’écartent', 'Amplitude partielle', 'Épaules qui remontent'],
    breath: 'Expire en tendant les bras.',
    tips: ['Garde les coudes fixes', 'Tends complètement en fin de mouvement'],
  },
  calves: {
    mistakes: ['Rebondir sans contrôle', 'Amplitude réduite'],
    breath: 'Respire normalement.',
    tips: ['Pause 1 s en haut et 1 s étiré en bas', 'Les mollets aiment les séries longues (15-25 reps)'],
  },
  cardio: {
    mistakes: ['Atterrir talons en premier', 'Rythme trop rapide au début puis effondrement'],
    breath: 'Respire par le nez au début, puis bouche si besoin, sans bloquer.',
    tips: ['Reste léger sur l’avant du pied', 'Garde une intensité que tu peux tenir jusqu’au bout de l’intervalle'],
  },
  muaythai: {
    mistakes: ['Baisser la garde en frappant', 'Frapper avec le bras seul, sans rotation des hanches', 'Rester planté sans bouger les pieds'],
    breath: 'Expire fort et court à chaque coup (« tss »).',
    tips: ['Reviens toujours en garde après une combinaison', 'Le pied d’appui pivote sur les kicks et les crosses'],
  },
  muaythai_drill: {
    mistakes: ['Lâcher la garde pendant le coup de pied', 'Ne pas pivoter sur le pied d’appui', 'Monter la jambe sans engager la hanche'],
    breath: 'Expire à l’impact.',
    tips: ['Commence lentement et précis, la vitesse viendra', 'Frappe une cible imaginaire à hauteur précise'],
  },
  mobility: {
    mistakes: ['Forcer dans la douleur', 'Bloquer la respiration', 'Rebondir'],
    breath: 'Expire longuement pour relâcher le muscle.',
    tips: ['Cherche une tension douce (4/10)', 'Chaque expiration, va un peu plus loin'],
  },
  warmup: { mistakes: ['Aller trop vite d’entrée'], breath: 'Respiration libre.', tips: ['Amplitude progressive'] },
  endurance: { mistakes: ['Partir trop vite'], breath: 'Tu dois pouvoir parler en phrases complètes.', tips: ['30 à 45 min, 2 fois par semaine, améliore la récupération entre les séances'] },
  breath: { mistakes: ['Forcer l’inspiration'], breath: 'Inspire par le nez, expire lentement.', tips: ['Pratique 3 fois par jour pour un effet anti-stress durable'] },
  neck: { mistakes: ['Pousser fort d’un coup'], breath: 'Respire calmement.', tips: ['Progressif et sans douleur : c’est de la prévention'] },
};

// Précisions spécifiques à certains exercices
export const EX_TECH = {
  pushup: { mistakes: ['Mains trop en avant des épaules'], tips: ['Trop dur ? Pompes sur les genoux ou mains surélevées : même muscles, moins de charge'] },
  squat: { tips: ['Profondeur minimale : cuisses parallèles au sol. Plus bas si ta mobilité le permet'] },
  plank: { tips: ['Ta tête prolonge ta colonne : regarde le sol entre tes mains'] },
  pullup: { tips: ['Pas encore de traction ? 3 séries de 3-5 négatives, 3 fois par semaine : la 1re traction arrive vite'] },
  kb_swing: { mistakes: ['Squatter au lieu de pousser les hanches', 'Lever la kettlebell avec les bras'] },
  mt_kicks: { tips: ['Vise avec le tibia, pas le pied', 'Le bras du côté qui frappe descend pour l’équilibre, l’autre protège le visage'] },
  mt_teeps: { tips: ['C’est un coup qui repousse : pense « pousser une porte avec le pied »'] },
  mt_knees: { tips: ['Les orteils du pied qui frappe pointent vers le bas', 'Les hanches avancent, le buste recule légèrement'] },
  burpees: { tips: ['Version facile : sans pompe et sans saut. Version dure : pompe complète + saut genoux à la poitrine'] },
};

export function techFor(ex) {
  const base = PATTERN_TECH[ex.pattern] || PATTERN_TECH.core;
  const extra = EX_TECH[ex.id] || {};
  return {
    mistakes: [...(extra.mistakes || []), ...base.mistakes],
    breath: extra.breath || base.breath,
    tips: [...(extra.tips || []), ...base.tips],
  };
}

// Catégories pour la bibliothèque
export const CATEGORIES = [
  { id: 'chest', label: 'Pectoraux', emoji: '🫸', patterns: ['h_push'] },
  { id: 'back', label: 'Dos', emoji: '🔙', patterns: ['h_pull', 'v_pull'] },
  { id: 'shoulders', label: 'Épaules', emoji: '🙌', patterns: ['v_push'] },
  { id: 'arms', label: 'Bras', emoji: '💪', patterns: ['biceps', 'triceps'] },
  { id: 'legs', label: 'Jambes', emoji: '🦵', patterns: ['squat', 'lunge', 'hinge', 'calves'] },
  { id: 'core', label: 'Abdos', emoji: '🧱', patterns: ['core', 'neck'] },
  { id: 'cardio', label: 'Cardio', emoji: '🫀', patterns: ['cardio', 'endurance'] },
  { id: 'mt', label: 'Muay Thai', emoji: '🥊', patterns: ['muaythai', 'muaythai_drill'] },
  { id: 'mobility', label: 'Mobilité', emoji: '🤸', patterns: ['mobility', 'warmup', 'breath'] },
];

export function youtubeSearch(name) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} technique tuto`)}`;
}
