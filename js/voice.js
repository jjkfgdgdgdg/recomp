// Personnalités vocales du coach. Toutes les répliques sont originales.
// « Hardcore » = style sergent instructeur, discipline sans excuse, voix grave et rapide.
import { getState } from './store.js';
import { speak } from './audio.js';

export const PERSONAS = {
  calm: { label: 'Coach bienveillant', emoji: '🙂', desc: 'Encourageant et posé.', rate: 1.05, pitch: 1, prefer: null },
  hardcore: { label: 'Coach Hardcore', emoji: '🔥', desc: 'Zéro excuse, discipline maximale, voix grave. Pour les jours où tu as besoin qu’on te pousse.', rate: 1.12, pitch: 0.55, prefer: 'male' },
};

const LINES = {
  calm: {
    start: ['C’est parti, on y va tranquillement mais sûrement.', 'Belle décision de t’entraîner aujourd’hui.', 'Allez, on commence. Concentre-toi sur la technique.'],
    milestone: ['Super, continue comme ça.', 'Très bien, garde le rythme.', 'Tu fais du bon travail.'],
    bad: ['Pas grave, la prochaine sera meilleure.', 'Prends ton temps, amplitude complète.'],
    last: ['Plus que quelques-unes, tu y es presque.', 'Dernier effort !'],
    rest: ['Respire, tu l’as bien mérité.', 'Profite du repos pour boire un peu.'],
    finish: ['Bravo, séance terminée. Tu peux être fier de toi.', 'Excellent travail aujourd’hui.'],
    skip: ['Pas de souci, on passe à la suite.'],
    phase: ['Nouvelle phase. Tu gères.', 'Il change de tactique, adapte-toi.'],
    hit: ['Aïe ! Reprends ton rythme.', 'Tu as pris un coup, on se reconcentre.'],
    dodge: ['Esquivé, bien joué !'],
    victory: ['Victoire ! Superbe combat.', 'Boss vaincu, bravo !'],
    defeat: ['Il t’a eu cette fois. Tu reviendras plus fort.'],
    penalty: ['Les quêtes d’hier n’ont pas été finies. Une petite quête de rattrapage t’attend.'],
    levelup: ['Niveau supérieur, félicitations !'],
    combo: ['Joli combo !'],
    quest: ['Quête accomplie, bien joué.'],
  },
  hardcore: {
    start: [
      'Personne ne viendra faire ces reps à ta place. Au travail.',
      'Ton canapé t’a assez vu. Maintenant, on souffre.',
      'Aujourd’hui, tu ne négocies pas avec toi-même. Go.',
      'Le confort ne t’a jamais rien construit. Attaque.',
      'Tu voulais des résultats ? Ils sont de l’autre côté de la douleur. Avance.',
    ],
    milestone: [
      'Encore ! C’est tout ce que t’as ?',
      'Ta tête veut s’arrêter. Ton corps, lui, peut continuer.',
      'Chaque rep, c’est une promesse que tu tiens envers toi-même.',
      'Tu n’es pas fatigué. Tu es en train de devenir dur.',
      'Personne ne se souvient des séances faciles. Continue.',
      'C’est ici que les autres abandonnent. Pas toi.',
    ],
    bad: [
      'Celle-là ne compte pas. Refais-la proprement.',
      'Une rep bâclée, c’est un mensonge. Recommence.',
      'Je veux l’amplitude complète, pas la moitié du boulot.',
      'Tu triches avec la rep, tu triches avec toi-même.',
    ],
    last: ['Les dernières reps, c’est là que tu changes. Termine !', 'C’est maintenant que ça compte. Vide le réservoir !'],
    rest: ['Respire. Le repos est court et il se mérite.', 'Récupère. Mais garde la rage allumée.', 'Bois une gorgée. La guerre n’est pas finie.'],
    finish: [
      'Séance faite. Demain, on remet ça. Sans excuse.',
      'Tu as fait ce que tu n’avais pas envie de faire. Ça, c’est la discipline.',
      'Une bataille gagnée contre toi-même. Note-la.',
      'Ta version d’hier vient de prendre une claque. Bien.',
    ],
    skip: ['Tu sautes un exercice ? Demain, tu le fais en premier.', 'Fuir un exercice, c’est le rendre plus fort. Souviens-t’en.'],
    phase: ['Il veut te voir abandonner. Montre-lui le contraire.', 'Plus il devient fort, plus tu deviens dur.', 'Nouvelle phase. Même mentalité : on ne lâche rien.'],
    hit: ['Tu prends des coups ? Relève-toi et rends-les !', 'La douleur, c’est une info. Pas un ordre d’arrêter.', 'Tu as baissé ta garde. Ne recommence pas.'],
    dodge: ['Esquivé. Maintenant, punis-le !'],
    victory: ['Boss à terre. Personne ne t’a donné cette victoire, tu l’as arrachée.', 'Il est tombé. Et toi tu es encore debout. Retiens ça.'],
    defeat: ['Tu es tombé. Ok. Maintenant tu te relèves et tu reviens plus dur.', 'Défaite. Prends-la comme carburant.'],
    penalty: ['Hier, tu as laissé tomber tes quêtes. Aujourd’hui, tu paies la dette. Pas de discussion.'],
    levelup: ['Niveau supérieur. Et ce n’est que l’échauffement.', 'Tu as monté d’un niveau. Le prochain sera plus dur. Tant mieux.'],
    combo: ['Enchaîne ! Ne t’arrête surtout pas !', 'Voilà ! Continue de frapper !'],
    quest: ['Quête faite. Suivante.', 'Coché. On ne s’arrête pas là.'],
  },
};

export function persona() {
  return getState().settings?.persona === 'hardcore' ? 'hardcore' : 'calm';
}

export function line(event) {
  const p = persona();
  const list = LINES[p][event] || LINES.calm[event] || [];
  return list[Math.floor(Math.random() * list.length)] || '';
}

export function say(event, opts = {}) {
  const text = typeof event === 'string' && LINES.calm[event] ? line(event) : event;
  const p = PERSONAS[persona()];
  speak(text, { rate: p.rate, pitch: p.pitch, prefer: p.prefer, ...opts });
  return text;
}

// Paramètres vocaux de la personnalité active (pour les annonces simples : compte, combinaisons…)
export function voiceParams() {
  const p = PERSONAS[persona()];
  return { rate: p.rate, pitch: p.pitch, prefer: p.prefer };
}
