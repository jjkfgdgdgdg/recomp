// Guides de l'Académie (textes originaux). Structure : sections avec paragraphes et listes.

export const GUIDES = [
  {
    id: 'muscle-rules', emoji: '💪', title: 'Les 8 règles pour prendre du muscle', cat: 'Muscle', minutes: 5,
    intro: 'Prendre du muscle, ce n’est pas compliqué : c’est surtout régulier. Voici ce qui compte vraiment, par ordre d’importance.',
    sections: [
      { h: '1. La surcharge progressive', p: ['Ton corps ne s’adapte que si on lui demande un peu plus qu’avant : une rep de plus, un peu plus de charge, une variante plus dure, ou plus de contrôle. Recomp le fait automatiquement après chaque séance quand tu indiques ton ressenti.'] },
      { h: '2. S’approcher de l’échec', p: ['Une série efficace se termine quand il ne te reste que 1 à 3 reps « en réserve ». Si tu finis toutes tes séries en pouvant en faire 10 de plus, le muscle n’a aucune raison de grossir.'] },
      { h: '3. Assez de volume', p: ['Vise 10 à 20 séries par muscle et par semaine. En dessous de 6, la progression est lente ; au-dessus de 25, tu récupères mal. La carte musculaire de l’Académie te montre où tu en es.'] },
      { h: '4. Fréquence : 2 fois par semaine', p: ['Travailler chaque muscle au moins 2 fois par semaine donne de meilleurs résultats qu’une grosse séance unique. C’est pour ça que les débutants commencent en full body.'] },
      { h: '5. Protéines tous les jours', p: ['1,6 à 2,2 g par kilo de poids de corps, répartis sur 3-4 repas. Exemple pour 70 kg : 110 à 150 g par jour.'] },
      { h: '6. Un léger surplus calorique', p: ['Pour construire, il faut un peu plus d’énergie que tu n’en dépenses : +200 à +300 kcal par jour suffisent. Viser +1 kg par semaine = surtout du gras.'] },
      { h: '7. Le sommeil', p: ['7 à 9 heures. Le muscle se construit pendant la récupération, et le manque de sommeil fait baisser la force et augmenter la faim.'] },
      { h: '8. La patience', p: ['Un débutant peut gagner environ 0,5 à 1 kg de muscle par mois les premiers mois, puis moins. Prends des photos et des mesures toutes les 4 semaines : le miroir quotidien ment.'] },
    ],
  },
  {
    id: 'sets-reps', emoji: '🔢', title: 'Séries, reps, repos : comment choisir', cat: 'Muscle', minutes: 4,
    intro: 'Pas besoin d’un calcul savant : quelques repères suffisent.',
    sections: [
      { h: 'Combien de reps ?', list: ['Force : 3 à 6 reps, charges lourdes', 'Muscle : 6 à 15 reps (la zone la plus pratique)', 'Endurance musculaire : 15 à 30 reps', 'Toutes les fourchettes de 6 à 30 reps font grossir le muscle si tu t’approches de l’échec'] },
      { h: 'Combien de repos ?', list: ['Exercices lourds (squat, développé, tractions) : 2 à 3 min', 'Exercices d’isolation (curl, extensions) : 60 à 90 s', 'Circuits cardio : 20 à 40 s'] },
      { h: 'Le tempo', p: ['Descente contrôlée en 2-3 secondes, remontée dynamique. Pas de rebond en bas.'] },
      { h: 'La double progression', p: ['Tu as une fourchette, par exemple 8-12 reps. Tant que tu n’atteins pas 12 reps sur toutes les séries, tu gardes la charge. Quand c’est fait : +2 kg (ou une variante plus dure) et tu repars à 8. C’est exactement la logique de Recomp.'] },
    ],
  },
  {
    id: 'bodyweight', emoji: '🏠', title: 'Prendre du muscle sans matériel', cat: 'Muscle', minutes: 4,
    intro: 'Oui, on peut construire un physique solide au poids du corps. Il faut juste rendre les exercices plus durs au fil du temps.',
    sections: [
      { h: 'Les leviers de difficulté', list: ['Changer l’angle : pompes surélevées → pompes → pieds surélevés', 'Changer le bras de levier : pompes diamant, archer', 'Ralentir : 4 secondes de descente', 'Ajouter des pauses en bas', 'Passer sur une jambe : squat bulgare, pistol', 'Ajouter un sac à dos chargé de livres ou de bouteilles'] },
      { h: 'Les chaînes de progression', list: ['Pompes : genoux → classiques → diamant → pieds surélevés → archer', 'Squats : sur chaise → classiques → bulgares → pistol', 'Tirage : rowing sous une table → négatives → tractions'] },
      { h: 'Le piège à éviter', p: ['Faire 100 pompes faciles tous les jours n’apporte pas grand-chose au-delà d’un certain point. Quand tu dépasses 20 reps propres, passe à la variante suivante.'] },
    ],
  },
  {
    id: 'nutrition', emoji: '🍽️', title: 'Manger pour le muscle', cat: 'Nutrition', minutes: 6,
    intro: 'La nutrition, c’est 50 % du résultat. Pas besoin d’être parfait, juste régulier.',
    sections: [
      { h: 'Les calories', p: ['Recomp calcule ton besoin (métabolisme de base × activité + séances) et ajuste selon ton objectif. Regarde ta courbe de poids : si elle stagne 2 semaines en prise de muscle, ajoute ~150 kcal ; si elle monte trop vite, retire-les.'] },
      { h: 'Les protéines : la priorité', list: ['Viande, poisson, œufs, skyr, fromage blanc, tofu, tempeh, lentilles, pois chiches, seitan', '20 à 40 g par repas', 'Une portion = environ la taille de ta paume'] },
      { h: 'Les glucides : ton carburant', p: ['Riz, pâtes, pommes de terre, avoine, pain complet, fruits. Ils remplissent tes réserves pour l’entraînement et le combat. Mets-en surtout autour des séances.'] },
      { h: 'Les lipides : pour tes hormones', p: ['Huile d’olive, noix, avocat, poissons gras, œufs. Ne descends pas sous 0,7 g/kg.'] },
      { h: 'Avant et après la séance', list: ['1-2 h avant : un repas normal, ou une banane + un yaourt', 'Après : protéines + glucides dans les 2 heures (le fameux « shaker » n’est pas obligatoire, un vrai repas suffit)'] },
      { h: 'Petit budget', list: ['Œufs, lentilles, flocons d’avoine, riz, thon en boîte, poulet entier, fromage blanc, bananes, légumes surgelés : tout ce qu’il faut pour pas cher'] },
    ],
  },
  {
    id: 'supplements', emoji: '🧪', title: 'Compléments : ce qui marche vraiment', cat: 'Nutrition', minutes: 3,
    intro: 'L’immense majorité des compléments ne sert à rien. Voici les rares qui ont fait leurs preuves.',
    sections: [
      { h: 'Utile', list: ['Créatine monohydrate : 3 à 5 g par jour, tous les jours, à n’importe quel moment. Le complément le plus étudié pour la force et le muscle', 'Protéine en poudre (whey ou végétale) : juste pratique pour atteindre tes protéines, pas magique', 'Caféine avant l’effort : améliore un peu la performance (pas après 14 h)', 'Vitamine D en hiver si tu vois peu le soleil (demande à ton médecin)'] },
      { h: 'Inutile ou presque', list: ['BCAA (si tu manges assez de protéines)', 'Brûleurs de graisse', 'Boosters de testostérone', 'La plupart des « pre-workout » hors caféine'] },
      { h: 'Important', p: ['Moins de 18 ans : mise d’abord tout sur l’alimentation, le sommeil et l’entraînement. Demande l’avis d’un médecin avant tout complément.'] },
    ],
  },
  {
    id: 'recovery', emoji: '😴', title: 'Récupérer pour progresser', cat: 'Récupération', minutes: 4,
    intro: 'L’entraînement crée le stimulus. La récupération crée le muscle.',
    sections: [
      { h: 'Les signes que tu récupères mal', list: ['Performances qui baissent plusieurs séances de suite', 'Sommeil agité, irritabilité', 'Courbatures qui ne passent pas', 'Douleurs articulaires'] },
      { h: 'Ce que fait Recomp pour toi', list: ['Le check-in du matin ajuste la séance à ta forme', 'Une semaine de décharge toutes les 5 semaines', 'Pas deux grosses séances jambes d’affilée'] },
      { h: 'Tes outils', list: ['Sommeil 7-9 h', 'Marche quotidienne', 'Mobilité et respiration (onglet Bien-être)', 'Hydratation', 'Protéines suffisantes'] },
    ],
  },
  {
    id: 'mt-basics', emoji: '🥊', title: 'Muay Thai : les 8 armes', cat: 'Muay Thai', minutes: 7,
    intro: 'On appelle le Muay Thai « l’art des 8 membres » : poings, coudes, genoux et tibias. Voici les bases à maîtriser.',
    sections: [
      { h: 'La garde', list: ['Pieds un peu plus larges que les épaules, pied gauche devant (droitier)', 'Poids réparti, talon arrière légèrement décollé', 'Mains au niveau des tempes, coudes serrés qui protègent les côtes', 'Menton rentré, regard vers l’adversaire'] },
      { h: 'Les coups de poing', list: ['Jab (1) : direct du bras avant, rapide, pour mesurer la distance', 'Cross (2) : direct du bras arrière, la hanche et le pied arrière pivotent', 'Crochet (3/4) : coude à hauteur du poing, rotation du buste', 'Uppercut (5/6) : de bas en haut, en fléchissant légèrement les jambes'] },
      { h: 'Le teep', p: ['Coup de pied avant qui repousse : monte le genou, puis pousse avec la plante du pied vers le ventre de l’adversaire. Parfait pour garder la distance.'] },
      { h: 'Le roundhouse (middle / low / high kick)', list: ['Pivote sur l’avant du pied d’appui (le talon tourne vers la cible)', 'La hanche tourne et « lance » la jambe', 'Frappe avec le tibia, pas le pied', 'Le bras du côté qui frappe descend, l’autre protège le visage', 'Reviens en garde par le même chemin'] },
      { h: 'Les genoux et les coudes', p: ['Le genou se donne en tirant l’adversaire vers soi (clinch) et en projetant les hanches vers l’avant. Le coude est une arme courte : horizontal, descendant ou remontant, à très courte distance.'] },
      { h: 'La défense', list: ['Check : lever le genou vers le coude pour bloquer un kick avec le tibia', 'Parade : dévier un direct avec la paume', 'Esquive : bouger la tête hors de la ligne', 'Reculer en pivotant plutôt qu’en ligne droite'] },
      { h: 'Pour progresser seul', list: ['Shadow boxing 3 × 3 min avec le minuteur et les combinaisons annoncées', 'Le coach caméra vérifie ta garde', 'Inscris-toi dans un club pour le travail avec partenaire : rien ne remplace un vrai coach'] },
    ],
  },
  {
    id: 'mt-conditioning', emoji: '🔥', title: 'La condition physique du combattant', cat: 'Muay Thai', minutes: 4,
    intro: 'Un round de 3 minutes paraît court… jusqu’à ce qu’on en fasse un. Voici comment construire ton cardio de combat.',
    sections: [
      { h: 'Les 3 piliers', list: ['Endurance de base : footing ou vélo doux 30-45 min, 1-2 fois par semaine', 'Cardio intermittent : rounds de shadow, de sac, corde à sauter', 'Force et puissance : squats, pompes, tirages, gainage, renforcement de la nuque'] },
      { h: 'La corde à sauter', p: ['Le meilleur outil du boxeur : coordination, appuis légers, mollets et cardio. Commence par 3 × 1 min, vise 3 × 3 min.'] },
      { h: 'Récupérer entre les rounds', p: ['Respire avec des expirations longues (3 s inspire, 6 s expire). Le cœur redescend plus vite. La routine « Récup entre rounds » est dans Bien-être.'] },
    ],
  },
  {
    id: 'warmup-injury', emoji: '🩹', title: 'Échauffement et prévention des blessures', cat: 'Santé', minutes: 3,
    intro: '5 à 10 minutes d’échauffement réduisent les risques et améliorent tes performances.',
    sections: [
      { h: 'Un bon échauffement', list: ['2-3 min de cardio léger (corde, jumping jacks)', 'Mobilité des articulations utilisées (épaules, hanches, chevilles)', '1-2 séries légères du premier exercice'] },
      { h: 'Douleur ou courbature ?', list: ['Courbature : diffuse, dans le muscle, 24-72 h après, s’améliore en bougeant', 'Douleur à surveiller : vive, articulaire, localisée, pendant l’effort → stop et avis médical si elle persiste'] },
      { h: 'Les règles d’or', list: ['Technique avant charge', 'Augmente progressivement (pas +50 % d’un coup)', 'Dors, mange, hydrate-toi', 'Déclare tes douleurs dans ton profil : Recomp adapte les exercices'] },
    ],
  },
  {
    id: 'plateau', emoji: '📉', title: 'Je stagne : que faire ?', cat: 'Muscle', minutes: 3,
    intro: 'Tout le monde stagne un jour. Voici la check-list dans l’ordre.',
    sections: [
      { h: 'Check-list', list: ['Est-ce que je dors assez ?', 'Est-ce que je mange assez (le poids monte-t-il un peu) ?', 'Est-ce que je m’approche vraiment de l’échec ?', 'Est-ce que je note mes séances pour progresser (Recomp le fait) ?', 'Ai-je fait une décharge récemment ?', 'Ma technique est-elle propre (coach caméra) ?'] },
      { h: 'Solutions', list: ['Change de variante pour 4-6 semaines', 'Ajoute 2-4 séries par semaine au muscle en retard', 'Fais une semaine légère puis repars'] },
    ],
  },
  {
    id: 'myths', emoji: '🚫', title: '7 mythes à oublier', cat: 'Savoir', minutes: 3,
    intro: 'Ce qu’on entend souvent en salle… et qui est faux.',
    sections: [
      { h: 'Les mythes', list: [
        '« On peut perdre du gras du ventre en faisant des abdos » : faux, on ne choisit pas où on perd le gras',
        '« Les femmes vont devenir énormes avec des poids » : faux, gagner du muscle est lent pour tout le monde',
        '« Il faut avoir mal pour progresser » : faux, la courbature n’est pas un indicateur de progrès',
        '« Il faut manger toutes les 2 heures » : faux, le total de la journée compte bien plus',
        '« Le cardio fait fondre les muscles » : faux, en quantité raisonnable il aide la récupération',
        '« Il faut s’étirer avant la muscu » : un échauffement dynamique est plus utile que des étirements longs',
        '« Plus c’est long, mieux c’est » : 45-60 min bien utilisées suffisent largement',
      ] },
    ],
  },
  {
    id: 'track', emoji: '📏', title: 'Mesurer ses progrès', cat: 'Savoir', minutes: 2,
    intro: 'Le poids seul ne dit pas tout, surtout en recomposition.',
    sections: [
      { h: 'Ce qu’il faut suivre', list: ['Poids : 3 à 7 fois par semaine, le matin, et regarder la moyenne', 'Tour de taille : toutes les 2 semaines', 'Photos : de face, profil et dos, même lumière, toutes les 4 semaines', 'Performances : reps et charges (Recomp les enregistre)', 'Tests de niveau caméra toutes les 4 semaines'] },
    ],
  },
];

export const GUIDE = Object.fromEntries(GUIDES.map((g) => [g.id, g]));
