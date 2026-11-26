// Bibliothèque d'exercices.
// equip : liste des équipements possibles (au moins un requis). 'none' = poids du corps.
// avoid : zones douloureuses pour lesquelles l'exercice est déconseillé.
// pattern : schéma moteur utilisé par le générateur de séances.
// base : test de référence pour calculer les répétitions de départ ('push' | 'squat' | 'pull' | 'plank'), scale = ratio.
// track : identifiant du suivi caméra (voir js/pose/trackers.js).
// load : charge de départ conseillée en fraction du poids de corps (par haltère pour les exercices aux haltères).

export const EQUIPMENT = [
  { id: 'none', label: 'Poids du corps' },
  { id: 'dumbbells', label: 'Haltères' },
  { id: 'pullup_bar', label: 'Barre de traction' },
  { id: 'bands', label: 'Élastiques' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'bench', label: 'Banc' },
  { id: 'rope', label: 'Corde à sauter' },
  { id: 'bag', label: 'Sac de frappe' },
  { id: 'pads', label: 'Pattes d’ours / partenaire' },
  { id: 'gym', label: 'Salle de sport complète' },
];

export const INJURIES = [
  { id: 'shoulder', label: 'Épaules' },
  { id: 'elbow', label: 'Coudes' },
  { id: 'wrist', label: 'Poignets' },
  { id: 'lowback', label: 'Bas du dos' },
  { id: 'knee', label: 'Genoux' },
  { id: 'ankle', label: 'Chevilles' },
  { id: 'neck', label: 'Cou' },
];

const E = (o) => ({
  equip: ['none'], avoid: [], level: 1, type: 'reps', cues: [], muscles: [], weighted: false, ...o,
});

export const EXERCISES = [
  // ---------- Poussée horizontale ----------
  E({ id: 'incline_pushup', name: 'Pompes surélevées (mains sur un support)', pattern: 'h_push', muscles: ['Pectoraux', 'Triceps', 'Épaules'], avoid: ['wrist'], level: 1, base: 'push', scale: 1.5, track: 'pushup', harder: 'pushup',
    cues: ['Mains sur une chaise, un lit ou un banc', 'Corps gainé de la tête aux pieds', 'Poitrine vers le support, coudes à 45°'] }),
  E({ id: 'knee_pushup', name: 'Pompes sur les genoux', pattern: 'h_push', muscles: ['Pectoraux', 'Triceps'], avoid: ['wrist'], level: 1, base: 'push', scale: 1.6, track: 'knee_pushup', harder: 'pushup',
    cues: ['Genoux au sol, hanches alignées avec les épaules', 'Descends la poitrine près du sol', 'Coudes à 45° du corps'] }),
  E({ id: 'pushup', name: 'Pompes', pattern: 'h_push', muscles: ['Pectoraux', 'Triceps', 'Épaules', 'Abdos'], avoid: ['wrist'], level: 1, base: 'push', scale: 1, track: 'pushup', harder: 'diamond_pushup', easier: 'knee_pushup',
    cues: ['Mains sous les épaules, un peu plus larges', 'Corps droit comme une planche, fessiers serrés', 'Descends jusqu’à ce que les coudes passent sous 90°', 'Remonte en tendant complètement les bras'] }),
  E({ id: 'diamond_pushup', name: 'Pompes diamant', pattern: 'h_push', muscles: ['Triceps', 'Pectoraux'], avoid: ['wrist', 'elbow'], level: 2, base: 'push', scale: 0.6, track: 'pushup', harder: 'decline_pushup', easier: 'pushup',
    cues: ['Pouces et index forment un losange sous la poitrine', 'Coudes serrés le long du corps', 'Gainage total'] }),
  E({ id: 'decline_pushup', name: 'Pompes pieds surélevés', pattern: 'h_push', muscles: ['Haut des pectoraux', 'Épaules', 'Triceps'], avoid: ['wrist', 'shoulder'], level: 2, base: 'push', scale: 0.7, harder: 'archer_pushup', easier: 'diamond_pushup',
    cues: ['Pieds sur une chaise ou un banc', 'Ne laisse pas les hanches tomber', 'Contrôle la descente (2 s)'] }),
  E({ id: 'archer_pushup', name: 'Pompes archer', pattern: 'h_push', muscles: ['Pectoraux', 'Triceps', 'Épaules'], avoid: ['wrist', 'shoulder'], level: 3, base: 'push', scale: 0.35, easier: 'decline_pushup',
    cues: ['Mains très écartées', 'Descends vers une main, l’autre bras reste tendu', 'Alterne les côtés'] }),
  E({ id: 'db_floor_press', name: 'Développé au sol aux haltères', pattern: 'h_push', muscles: ['Pectoraux', 'Triceps'], equip: ['dumbbells', 'gym'], level: 1, weighted: true, load: 0.12, inc: 2, harder: 'db_bench_press',
    cues: ['Allongé au sol, genoux pliés', 'Les coudes touchent le sol en douceur', 'Pousse en expirant'] }),
  E({ id: 'db_bench_press', name: 'Développé couché haltères', pattern: 'h_push', muscles: ['Pectoraux', 'Triceps', 'Épaules'], equip: ['bench', 'gym'], needs: ['dumbbells'], avoid: ['shoulder'], level: 1, weighted: true, load: 0.14, inc: 2,
    cues: ['Omoplates serrées et basses', 'Descends les haltères au niveau de la poitrine', 'Pieds bien ancrés'] }),
  E({ id: 'bench_press', name: 'Développé couché barre', pattern: 'h_push', muscles: ['Pectoraux', 'Triceps', 'Épaules'], equip: ['gym'], avoid: ['shoulder'], level: 2, weighted: true, load: 0.5, inc: 2.5,
    cues: ['Omoplates serrées, légère cambrure naturelle', 'Barre au niveau du bas des pectoraux', 'Toujours avec un pareur si lourd'] }),
  E({ id: 'dips', name: 'Dips aux barres parallèles', pattern: 'h_push', track: 'dips', muscles: ['Pectoraux', 'Triceps'], equip: ['gym'], avoid: ['shoulder', 'elbow', 'wrist'], level: 2, base: 'push', scale: 0.5,
    cues: ['Buste légèrement penché', 'Descends jusqu’à 90° aux coudes', 'Épaules loin des oreilles'] }),

  // ---------- Poussée verticale ----------
  E({ id: 'pike_pushup', name: 'Pompes piquées (pike)', pattern: 'v_push', track: 'pike', muscles: ['Épaules', 'Triceps'], avoid: ['wrist', 'shoulder', 'neck'], level: 2, base: 'push', scale: 0.5,
    cues: ['Fesses en l’air, corps en V inversé', 'Descends le sommet du crâne vers le sol devant les mains', 'Coudes vers l’arrière'] }),
  E({ id: 'db_shoulder_press', name: 'Développé épaules haltères', pattern: 'v_push', muscles: ['Épaules', 'Triceps'], equip: ['dumbbells', 'gym'], avoid: ['shoulder'], level: 1, weighted: true, load: 0.08, inc: 2, track: 'press',
    cues: ['Debout ou assis, abdos serrés', 'Haltères au niveau des épaules', 'Pousse au-dessus de la tête jusqu’à bras tendus', 'Ne cambre pas le bas du dos'] }),
  E({ id: 'kb_press', name: 'Développé kettlebell un bras', pattern: 'v_push', muscles: ['Épaules', 'Triceps', 'Abdos'], equip: ['kettlebell'], avoid: ['shoulder'], level: 2, weighted: true, load: 0.12, inc: 2, unilateral: true,
    cues: ['Kettlebell en position rack', 'Fessiers et abdos serrés', 'Bras tendu au-dessus de la tête, biceps près de l’oreille'] }),
  E({ id: 'band_press', name: 'Développé épaules élastique', pattern: 'v_push', muscles: ['Épaules', 'Triceps'], equip: ['bands'], avoid: ['shoulder'], level: 1, track: 'press',
    cues: ['Pieds sur l’élastique', 'Pousse au-dessus de la tête', 'Redescends lentement'] }),

  // ---------- Tirage horizontal ----------
  E({ id: 'table_row', name: 'Rowing australien (sous une table solide)', pattern: 'h_pull', track: 'row', muscles: ['Dos', 'Biceps', 'Arrière d’épaules'], level: 1, base: 'pull', scale: 2.5, min: 6,
    cues: ['Allongé sous une table très stable, mains au bord', 'Corps gainé, tire la poitrine vers la table', 'Serre les omoplates en haut', 'Vérifie que la table ne bascule pas !'] }),
  E({ id: 'inverted_row', name: 'Rowing inversé à la barre basse', pattern: 'h_pull', track: 'row', muscles: ['Dos', 'Biceps'], equip: ['pullup_bar', 'gym'], level: 1, base: 'pull', scale: 2.5, min: 6,
    cues: ['Barre à hauteur de hanches', 'Corps droit, tire la poitrine vers la barre', 'Contrôle la descente'] }),
  E({ id: 'db_row', name: 'Rowing haltère un bras', pattern: 'h_pull', track: 'row', muscles: ['Dos', 'Biceps'], equip: ['dumbbells', 'gym'], level: 1, weighted: true, load: 0.18, inc: 2, unilateral: true,
    cues: ['Main et genou en appui sur un banc ou une chaise', 'Dos plat', 'Tire le coude vers la hanche'] }),
  E({ id: 'band_row', name: 'Rowing élastique', pattern: 'h_pull', track: 'row', muscles: ['Dos', 'Biceps'], equip: ['bands'], level: 1,
    cues: ['Élastique accroché devant toi', 'Tire vers le nombril', 'Serre les omoplates 1 seconde'] }),
  E({ id: 'kb_row', name: 'Rowing kettlebell', pattern: 'h_pull', track: 'row', muscles: ['Dos', 'Biceps'], equip: ['kettlebell'], avoid: ['lowback'], level: 1, weighted: true, load: 0.16, inc: 2, unilateral: true,
    cues: ['Buste penché, dos plat', 'Tire le coude vers l’arrière', 'Ne tourne pas le buste'] }),
  E({ id: 'cable_row', name: 'Tirage horizontal à la poulie', pattern: 'h_pull', track: 'row', muscles: ['Dos', 'Biceps'], equip: ['gym'], level: 1, weighted: true, load: 0.45, inc: 2.5,
    cues: ['Dos droit, poitrine sortie', 'Tire vers le bas du ventre', 'Ne te balance pas'] }),

  // ---------- Tirage vertical ----------
  E({ id: 'negative_pullup', name: 'Tractions négatives', pattern: 'v_pull', muscles: ['Dos', 'Biceps'], equip: ['pullup_bar', 'gym'], avoid: ['shoulder', 'elbow'], level: 1, min: 3, max: 8, reps: [3, 6], cap: 8, harder: 'pullup',
    cues: ['Saute ou monte sur une chaise menton au-dessus de la barre', 'Descends le plus lentement possible (4-5 s)', 'Bras tendus en bas, puis recommence'] }),
  E({ id: 'band_pulldown', name: 'Tirage vertical élastique', pattern: 'v_pull', muscles: ['Dos', 'Biceps'], equip: ['bands'], level: 1,
    cues: ['Élastique accroché en hauteur', 'Tire les coudes vers les hanches', 'Poitrine sortie'] }),
  E({ id: 'lat_pulldown', name: 'Tirage vertical à la poulie', pattern: 'v_pull', muscles: ['Dos', 'Biceps'], equip: ['gym'], level: 1, weighted: true, load: 0.45, inc: 2.5, harder: 'pullup',
    cues: ['Prise un peu plus large que les épaules', 'Tire la barre vers le haut de la poitrine', 'Ne tire pas avec le cou'] }),
  E({ id: 'pullup', name: 'Tractions', pattern: 'v_pull', track: 'pullup', muscles: ['Dos', 'Biceps', 'Avant-bras'], equip: ['pullup_bar', 'gym'], avoid: ['shoulder', 'elbow'], level: 2, base: 'pull', scale: 0.7, min: 2, easier: 'negative_pullup', harder: 'chinup_slow',
    cues: ['Bras tendus en bas, épaules engagées', 'Menton au-dessus de la barre', 'Pas d’élan'] }),
  E({ id: 'chinup_slow', name: 'Tractions supination tempo lent', pattern: 'v_pull', track: 'pullup', muscles: ['Dos', 'Biceps'], equip: ['pullup_bar', 'gym'], avoid: ['shoulder', 'elbow'], level: 3, base: 'pull', scale: 0.55, min: 2, easier: 'pullup',
    cues: ['Paumes vers toi', 'Monte en 1 s, descends en 3 s', 'Amplitude complète'] }),

  // ---------- Squat ----------
  E({ id: 'box_squat', name: 'Squat sur chaise', pattern: 'squat', muscles: ['Quadriceps', 'Fessiers'], level: 1, base: 'squat', scale: 0.4, track: 'squat', harder: 'squat',
    cues: ['Assieds-toi juste en touchant la chaise', 'Poids sur les talons', 'Relève-toi sans élan'] }),
  E({ id: 'squat', name: 'Squats', pattern: 'squat', muscles: ['Quadriceps', 'Fessiers', 'Ischios'], avoid: ['knee'], level: 1, base: 'squat', scale: 0.45, track: 'squat', harder: 'bulgarian_split_squat', easier: 'box_squat',
    cues: ['Pieds largeur d’épaules, pointes légèrement ouvertes', 'Descends jusqu’à ce que les cuisses soient parallèles au sol', 'Genoux dans l’axe des pieds', 'Buste fier, talons au sol'] }),
  E({ id: 'goblet_squat', name: 'Goblet squat', pattern: 'squat', muscles: ['Quadriceps', 'Fessiers', 'Abdos'], equip: ['dumbbells', 'kettlebell', 'gym'], avoid: ['knee'], level: 1, weighted: true, load: 0.18, inc: 2, track: 'squat',
    cues: ['Charge tenue contre la poitrine', 'Coudes entre les genoux en bas', 'Buste droit'] }),
  E({ id: 'jump_squat', name: 'Squats sautés', pattern: 'squat', muscles: ['Quadriceps', 'Fessiers', 'Mollets'], avoid: ['knee', 'ankle'], level: 2, base: 'squat', scale: 0.3, track: 'jump_squat', power: true,
    cues: ['Descends en squat contrôlé', 'Explose vers le haut', 'Réception douce, genoux souples'] }),
  E({ id: 'bulgarian_split_squat', name: 'Squat bulgare', pattern: 'squat', track: 'lunge', muscles: ['Quadriceps', 'Fessiers'], avoid: ['knee'], level: 2, base: 'squat', scale: 0.25, unilateral: true, harder: 'pistol_squat', easier: 'squat',
    cues: ['Pied arrière posé sur une chaise', 'Descends à la verticale', 'Genou avant au-dessus du pied'] }),
  E({ id: 'pistol_squat', name: 'Pistol squat (assisté si besoin)', pattern: 'squat', muscles: ['Quadriceps', 'Fessiers', 'Équilibre'], avoid: ['knee', 'ankle'], level: 3, base: 'squat', scale: 0.12, min: 3, unilateral: true, easier: 'bulgarian_split_squat',
    cues: ['Tiens-toi à un cadre de porte au début', 'Jambe libre tendue devant', 'Descends lentement'] }),
  E({ id: 'barbell_squat', name: 'Squat barre', pattern: 'squat', muscles: ['Quadriceps', 'Fessiers', 'Dos'], equip: ['gym'], avoid: ['knee', 'lowback'], level: 2, weighted: true, load: 0.6, inc: 2.5, track: 'squat',
    cues: ['Barre sur les trapèzes', 'Gaine fort avant de descendre', 'Cuisses parallèles au sol'] }),
  E({ id: 'wall_sit', name: 'Chaise contre le mur', pattern: 'squat', track: 'wall_sit', muscles: ['Quadriceps'], type: 'time', level: 1, secs: 30,
    cues: ['Dos collé au mur', 'Genoux à 90°', 'Respire calmement'] }),

  // ---------- Charnière de hanche ----------
  E({ id: 'glute_bridge', name: 'Pont fessier', pattern: 'hinge', muscles: ['Fessiers', 'Ischios'], level: 1, track: 'bridge', harder: 'single_leg_bridge',
    cues: ['Allongé sur le dos, pieds près des fesses', 'Pousse dans les talons', 'Serre les fessiers 1 s en haut, sans cambrer'] }),
  E({ id: 'single_leg_bridge', name: 'Pont fessier une jambe', pattern: 'hinge', muscles: ['Fessiers', 'Ischios'], level: 2, unilateral: true, track: 'bridge', easier: 'glute_bridge',
    cues: ['Une jambe tendue en l’air', 'Bassin bien horizontal', 'Monte en poussant dans le talon'] }),
  E({ id: 'hip_thrust', name: 'Hip thrust', pattern: 'hinge', muscles: ['Fessiers', 'Ischios'], equip: ['bench', 'gym'], level: 1, weighted: true, load: 0.5, inc: 2.5, track: 'bridge',
    cues: ['Haut du dos sur le banc', 'Menton rentré', 'Hanches en extension complète en haut'] }),
  E({ id: 'db_rdl', name: 'Soulevé de terre roumain haltères', pattern: 'hinge', track: 'hinge', muscles: ['Ischios', 'Fessiers', 'Dos'], equip: ['dumbbells', 'gym'], avoid: ['lowback'], level: 1, weighted: true, load: 0.15, inc: 2,
    cues: ['Genoux légèrement fléchis', 'Pousse les fesses vers l’arrière, dos plat', 'Haltères proches des jambes'] }),
  E({ id: 'kb_swing', name: 'Kettlebell swing', pattern: 'hinge', track: 'swing', muscles: ['Fessiers', 'Ischios', 'Cardio'], equip: ['kettlebell'], avoid: ['lowback'], level: 2, weighted: true, load: 0.16, inc: 4, power: true,
    cues: ['C’est les hanches qui propulsent, pas les bras', 'Dos plat', 'Fessiers serrés en haut'] }),
  E({ id: 'deadlift', name: 'Soulevé de terre', pattern: 'hinge', track: 'hinge', muscles: ['Dos', 'Fessiers', 'Ischios'], equip: ['gym'], avoid: ['lowback'], level: 2, weighted: true, load: 0.8, inc: 5,
    cues: ['Barre au-dessus du milieu du pied', 'Dos neutre, gainage maximal', 'Pousse le sol avec les jambes'] }),
  E({ id: 'good_morning', name: 'Good morning poids du corps', pattern: 'hinge', track: 'hinge', muscles: ['Ischios', 'Bas du dos'], avoid: ['lowback'], level: 1,
    cues: ['Mains derrière la tête', 'Penche-toi en poussant les fesses en arrière', 'Dos bien plat'] }),

  // ---------- Fentes ----------
  E({ id: 'reverse_lunge', name: 'Fentes arrière', pattern: 'lunge', muscles: ['Quadriceps', 'Fessiers'], avoid: ['knee'], level: 1, base: 'squat', scale: 0.25, unilateral: true, track: 'lunge',
    cues: ['Grand pas en arrière', 'Le genou arrière frôle le sol', 'Buste droit, pousse sur le talon avant'] }),
  E({ id: 'walking_lunge', name: 'Fentes marchées', pattern: 'lunge', muscles: ['Quadriceps', 'Fessiers'], avoid: ['knee'], level: 1, base: 'squat', scale: 0.25, unilateral: true, track: 'lunge',
    cues: ['Avance en fente, genou arrière près du sol', 'Genou avant au-dessus de la cheville', 'Garde l’équilibre'] }),
  E({ id: 'db_lunge', name: 'Fentes avec haltères', pattern: 'lunge', muscles: ['Quadriceps', 'Fessiers'], equip: ['dumbbells', 'gym'], avoid: ['knee'], level: 1, weighted: true, load: 0.08, inc: 2, unilateral: true, track: 'lunge',
    cues: ['Haltères le long du corps', 'Descends verticalement', 'Alterne les jambes'] }),
  E({ id: 'step_up', name: 'Montées sur banc', pattern: 'lunge', muscles: ['Quadriceps', 'Fessiers'], equip: ['bench', 'gym'], level: 1, unilateral: true,
    cues: ['Pose tout le pied sur le banc', 'Monte en poussant sur la jambe du haut', 'Redescends en contrôle'] }),

  // ---------- Gainage / abdos ----------
  E({ id: 'plank', name: 'Gainage planche', pattern: 'core', muscles: ['Abdos', 'Lombaires', 'Épaules'], type: 'time', level: 1, base: 'plank', scale: 0.6, track: 'plank',
    cues: ['Avant-bras au sol, coudes sous les épaules', 'Corps aligné : ni fesses en l’air ni ventre qui tombe', 'Serre fessiers et abdos, respire'] }),
  E({ id: 'side_plank', name: 'Gainage latéral', pattern: 'core', track: 'plank', muscles: ['Obliques', 'Abdos'], type: 'time', avoid: ['shoulder'], level: 1, base: 'plank', scale: 0.35, unilateral: true,
    cues: ['Coude sous l’épaule', 'Hanches hautes, corps aligné', 'Fais les deux côtés'] }),
  E({ id: 'dead_bug', name: 'Dead bug', pattern: 'core', muscles: ['Abdos profonds'], level: 1,
    cues: ['Sur le dos, bas du dos plaqué au sol', 'Tends bras et jambe opposés lentement', 'Expire en tendant'] }),
  E({ id: 'bird_dog', name: 'Bird dog', pattern: 'core', muscles: ['Lombaires', 'Abdos', 'Fessiers'], level: 1,
    cues: ['À quatre pattes', 'Tends bras et jambe opposés', 'Bassin immobile, tiens 2 s'] }),
  E({ id: 'hollow_hold', name: 'Hollow body', pattern: 'core', muscles: ['Abdos'], type: 'time', avoid: ['lowback'], level: 2, base: 'plank', scale: 0.3,
    cues: ['Bas du dos plaqué au sol', 'Bras et jambes tendus, décollés', 'Forme de banane'] }),
  E({ id: 'mountain_climbers', name: 'Mountain climbers', pattern: 'core', track: 'mountain', muscles: ['Abdos', 'Cardio'], type: 'time', avoid: ['wrist'], level: 1, secs: 30,
    cues: ['Position de pompe', 'Ramène les genoux vers la poitrine en alternant', 'Hanches basses'] }),
  E({ id: 'leg_raises', name: 'Relevés de jambes', pattern: 'core', track: 'leg_raise', muscles: ['Abdos', 'Fléchisseurs de hanche'], avoid: ['lowback'], level: 2,
    cues: ['Allongé, mains sous les fesses', 'Monte les jambes tendues', 'Redescends sans toucher le sol'] }),
  E({ id: 'russian_twist', name: 'Russian twist', pattern: 'core', muscles: ['Obliques'], avoid: ['lowback'], level: 1,
    cues: ['Assis, buste incliné, pieds décollés si possible', 'Tourne les épaules, pas seulement les bras', 'Chaque côté = 1 rep'] }),
  E({ id: 'hanging_knee_raise', name: 'Relevés de genoux suspendu', pattern: 'core', track: 'knee_raise', muscles: ['Abdos'], equip: ['pullup_bar', 'gym'], avoid: ['shoulder'], level: 2,
    cues: ['Suspendu à la barre', 'Monte les genoux vers la poitrine', 'Pas de balancier'] }),

  // ---------- Bras / mollets ----------
  E({ id: 'db_curl', name: 'Curl biceps haltères', pattern: 'biceps', muscles: ['Biceps'], equip: ['dumbbells', 'gym'], avoid: ['elbow'], level: 1, weighted: true, load: 0.07, inc: 1, track: 'curl',
    cues: ['Coudes collés au corps', 'Monte en tournant les paumes vers le haut', 'Descends lentement, bras tendus'] }),
  E({ id: 'hammer_curl', name: 'Curl marteau', pattern: 'biceps', muscles: ['Biceps', 'Avant-bras'], equip: ['dumbbells', 'gym'], avoid: ['elbow'], level: 1, weighted: true, load: 0.08, inc: 1, track: 'curl',
    cues: ['Paumes face à face', 'Coudes immobiles', 'Pas d’élan'] }),
  E({ id: 'band_curl', name: 'Curl élastique', pattern: 'biceps', muscles: ['Biceps'], equip: ['bands'], avoid: ['elbow'], level: 1, track: 'curl',
    cues: ['Pieds sur l’élastique', 'Coudes collés', 'Serre en haut'] }),
  E({ id: 'chair_dips', name: 'Dips sur chaise', pattern: 'triceps', track: 'dips', muscles: ['Triceps'], avoid: ['shoulder', 'wrist', 'elbow'], level: 1, base: 'push', scale: 1,
    cues: ['Mains au bord d’une chaise stable', 'Coudes vers l’arrière', 'Descends jusqu’à 90°'] }),
  E({ id: 'db_triceps_ext', name: 'Extension triceps haltère', pattern: 'triceps', track: 'press', muscles: ['Triceps'], equip: ['dumbbells', 'gym'], avoid: ['elbow', 'shoulder'], level: 1, weighted: true, load: 0.1, inc: 1,
    cues: ['Haltère tenu à deux mains au-dessus de la tête', 'Coudes pointés vers le haut', 'Descends derrière la tête'] }),
  E({ id: 'band_triceps', name: 'Extension triceps élastique', pattern: 'triceps', muscles: ['Triceps'], equip: ['bands'], avoid: ['elbow'], level: 1,
    cues: ['Élastique accroché en hauteur', 'Coudes collés', 'Tends complètement les bras'] }),
  E({ id: 'calf_raise', name: 'Mollets debout', pattern: 'calves', track: 'calf', muscles: ['Mollets'], avoid: ['ankle'], level: 1,
    cues: ['Sur une marche si possible', 'Monte sur la pointe des pieds', 'Descends lentement sous le niveau de la marche'] }),

  // ---------- Cardio ----------
  E({ id: 'jumping_jacks', name: 'Jumping jacks', pattern: 'cardio', muscles: ['Cardio'], type: 'time', avoid: ['ankle'], level: 1, secs: 40, track: 'jacks',
    cues: ['Saute en écartant bras et jambes', 'Mains au-dessus de la tête', 'Reste léger sur les pointes'] }),
  E({ id: 'high_knees', name: 'Montées de genoux', pattern: 'cardio', muscles: ['Cardio', 'Fléchisseurs de hanche'], type: 'time', avoid: ['knee', 'ankle'], level: 1, secs: 30, track: 'high_knees',
    cues: ['Genoux au moins à hauteur des hanches', 'Bras actifs', 'Rythme rapide'] }),
  E({ id: 'burpees', name: 'Burpees', pattern: 'cardio', muscles: ['Corps entier', 'Cardio'], avoid: ['wrist', 'knee'], level: 2, track: 'burpee', power: true,
    cues: ['Mains au sol, pieds en arrière', 'Poitrine au sol (ou pompe)', 'Ramène les pieds et saute'] }),
  E({ id: 'skater_jumps', name: 'Sauts du patineur', pattern: 'cardio', muscles: ['Fessiers', 'Cardio'], type: 'time', avoid: ['knee', 'ankle'], level: 2, secs: 30,
    cues: ['Saute latéralement d’une jambe à l’autre', 'Réception amortie', 'Buste légèrement penché'] }),
  E({ id: 'jump_rope', name: 'Corde à sauter', pattern: 'cardio', track: 'jumps', muscles: ['Cardio', 'Mollets', 'Coordination'], equip: ['rope'], type: 'time', avoid: ['ankle'], level: 1, secs: 60,
    cues: ['Petits sauts sur l’avant du pied', 'Coudes près du corps, ce sont les poignets qui tournent', 'Regard devant'] }),
  E({ id: 'zone2', name: 'Cardio doux (footing, vélo ou marche rapide)', pattern: 'endurance', muscles: ['Cœur', 'Endurance'], type: 'time', level: 1, secs: 1500,
    cues: ['Rythme où tu peux encore parler en phrases complètes', 'Dehors si possible : marche rapide, footing léger ou vélo', 'C’est la base de l’endurance et de la récupération'] }),
  E({ id: 'shadow_run',name: 'Shadow boxing léger (échauffement)', pattern: 'cardio', muscles: ['Cardio', 'Épaules'], type: 'time', level: 1, secs: 60, track: 'guard',
    cues: ['Garde haute, sautille', 'Coups légers et rapides', 'Respire à chaque coup'] }),

  // ---------- Muay Thai ----------
  E({ id: 'mt_stance', name: 'Garde & déplacements', pattern: 'muaythai', muscles: ['Technique'], type: 'time', level: 1, secs: 120, track: 'guard',
    cues: ['Pieds largeur d’épaules, pied arrière légèrement ouvert', 'Mains au niveau des tempes, coudes serrés', 'Avance, recule, pivote sans croiser les pieds'] }),
  E({ id: 'mt_shadow', name: 'Shadow boxing (combinaisons annoncées)', pattern: 'muaythai', muscles: ['Technique', 'Cardio'], type: 'round', level: 1, track: 'guard',
    cues: ['Exécute les combinaisons annoncées', 'Reviens toujours en garde', 'Expire à chaque coup'] }),
  E({ id: 'mt_bag', name: 'Rounds au sac de frappe', pattern: 'muaythai', muscles: ['Puissance', 'Cardio'], equip: ['bag'], type: 'round', level: 1, avoid: ['wrist'],
    cues: ['Bandes et gants obligatoires', 'Frappe avec les hanches', 'Garde haute entre les combinaisons'] }),
  E({ id: 'mt_pads', name: 'Rounds aux pattes d’ours', pattern: 'muaythai', muscles: ['Technique', 'Puissance'], equip: ['pads'], type: 'round', level: 1,
    cues: ['Écoute les annonces du partenaire', 'Précision avant puissance', 'Respire'] }),
  E({ id: 'mt_kicks', name: 'Coups de pied (roundhouse)', pattern: 'muaythai_drill', muscles: ['Hanches', 'Jambes'], avoid: ['knee', 'ankle'], level: 1, unilateral: true, track: 'kicks',
    cues: ['Pivote sur l’avant du pied d’appui', 'Frappe avec le tibia, la hanche tourne', 'Le bras du même côté descend, l’autre protège le visage'] }),
  E({ id: 'mt_teeps', name: 'Teeps (coups de pied avant)', pattern: 'muaythai_drill', muscles: ['Hanches', 'Abdos'], avoid: ['knee'], level: 1, unilateral: true, track: 'kicks',
    cues: ['Monte le genou d’abord', 'Pousse avec la plante du pied', 'Reviens vite en garde'] }),
  E({ id: 'mt_knees', name: 'Coups de genou', pattern: 'muaythai_drill', muscles: ['Abdos', 'Hanches'], avoid: ['knee'], level: 1, unilateral: true, track: 'knees',
    cues: ['Tire les mains vers le bas (clinch imaginaire)', 'Pousse les hanches vers l’avant', 'Sur la pointe du pied d’appui'] }),
  E({ id: 'mt_sprawl', name: 'Sprawls', pattern: 'muaythai_drill', muscles: ['Corps entier', 'Cardio'], avoid: ['wrist', 'lowback'], level: 2, track: 'burpee',
    cues: ['Lance les jambes en arrière, hanches au sol', 'Remonte vite en garde', 'Comme un burpee sans saut'] }),
  E({ id: 'mt_check', name: 'Blocages de jambe (checks)', pattern: 'muaythai_drill', muscles: ['Équilibre', 'Technique'], level: 1, unilateral: true,
    cues: ['Lève le genou vers le coude du même côté', 'Tibia tourné vers l’extérieur', 'Reste en équilibre et repose vite'] }),
  E({ id: 'neck_iso', name: 'Renforcement de la nuque (isométrique)', pattern: 'neck', muscles: ['Cou'], type: 'time', avoid: ['neck'], level: 1, secs: 20,
    cues: ['Main contre le front, pousse sans bouger la tête', 'Puis côtés et arrière', 'Intensité modérée, jamais de douleur'] }),

  // ---------- Mobilité / étirements ----------
  E({ id: 'world_greatest', name: 'World’s greatest stretch', pattern: 'mobility', muscles: ['Hanches', 'Dos', 'Ischios'], type: 'time', level: 1, secs: 60,
    cues: ['Fente avant, main au sol', 'Coude vers la cheville puis bras vers le ciel', 'Alterne les côtés'] }),
  E({ id: 'hip_9090', name: 'Hanches 90/90', pattern: 'mobility', muscles: ['Hanches'], type: 'time', avoid: ['knee'], level: 1, secs: 60,
    cues: ['Assis, les deux genoux à 90°', 'Penche le buste au-dessus de la jambe avant', 'Change de côté sans les mains si possible'] }),
  E({ id: 'cat_cow', name: 'Chat-vache', pattern: 'mobility', muscles: ['Dos'], type: 'time', level: 1, secs: 45,
    cues: ['À quatre pattes', 'Arrondis puis creuse le dos lentement', 'Suis ta respiration'] }),
  E({ id: 'thoracic_rot', name: 'Rotations thoraciques', pattern: 'mobility', muscles: ['Haut du dos'], type: 'time', level: 1, secs: 45,
    cues: ['Allongé sur le côté, genoux pliés', 'Ouvre le bras du dessus vers l’arrière', 'Suis ta main du regard'] }),
  E({ id: 'hamstring_stretch', name: 'Étirement ischios', pattern: 'mobility', muscles: ['Ischios'], type: 'time', level: 1, secs: 45,
    cues: ['Jambe tendue sur un support bas', 'Penche-toi dos plat', 'Pas de douleur, juste une tension'] }),
  E({ id: 'hip_flexor_stretch', name: 'Étirement psoas', pattern: 'mobility', muscles: ['Fléchisseurs de hanche'], type: 'time', avoid: ['knee'], level: 1, secs: 45,
    cues: ['Genou arrière au sol', 'Serre le fessier arrière', 'Avance doucement le bassin'] }),
  E({ id: 'pigeon', name: 'Posture du pigeon', pattern: 'mobility', muscles: ['Fessiers', 'Hanches'], type: 'time', avoid: ['knee'], level: 1, secs: 60,
    cues: ['Jambe avant pliée devant toi', 'Jambe arrière tendue', 'Respire et relâche'] }),
  E({ id: 'butterfly', name: 'Papillon (adducteurs)', pattern: 'mobility', muscles: ['Adducteurs'], type: 'time', level: 1, secs: 45,
    cues: ['Plantes de pied l’une contre l’autre', 'Dos droit', 'Laisse descendre les genoux'] }),
  E({ id: 'shoulder_cars', name: 'Cercles d’épaules contrôlés', pattern: 'mobility', muscles: ['Épaules'], type: 'time', level: 1, secs: 45,
    cues: ['Bras tendu, fais le plus grand cercle possible', 'Lentement, sans bouger le buste', 'Change de bras'] }),
  E({ id: 'chest_stretch', name: 'Étirement pectoraux au mur', pattern: 'mobility', muscles: ['Pectoraux', 'Épaules'], type: 'time', level: 1, secs: 45,
    cues: ['Avant-bras contre un mur', 'Tourne le buste à l’opposé', 'Fais les deux côtés'] }),
  E({ id: 'child_pose', name: 'Posture de l’enfant', pattern: 'mobility', muscles: ['Dos', 'Hanches'], type: 'time', level: 1, secs: 60,
    cues: ['Fesses sur les talons, bras devant', 'Front au sol', 'Respire dans le dos'] }),
  E({ id: 'cobra', name: 'Cobra', pattern: 'mobility', muscles: ['Abdos', 'Dos'], type: 'time', avoid: ['lowback'], level: 1, secs: 30,
    cues: ['Allongé sur le ventre', 'Pousse doucement sur les mains', 'Épaules basses'] }),
  E({ id: 'ankle_mob', name: 'Mobilité chevilles', pattern: 'mobility', muscles: ['Chevilles'], type: 'time', level: 1, secs: 45,
    cues: ['Fente face au mur', 'Avance le genou vers le mur, talon au sol', 'Alterne'] }),
  E({ id: 'quad_stretch', name: 'Étirement quadriceps', pattern: 'mobility', muscles: ['Quadriceps'], type: 'time', level: 1, secs: 45,
    cues: ['Debout, attrape ta cheville derrière toi', 'Genoux serrés', 'Bassin en rétroversion'] }),

  E({ id: 'breath_coherence', name: 'Cohérence cardiaque (respiration 5-5)', pattern: 'breath', muscles: ['Système nerveux'], type: 'time', level: 1, secs: 300,
    cues: ['Assis ou allongé, dos droit', 'Inspire 5 secondes par le nez', 'Expire 5 secondes lentement', 'Laisse le rythme calmer ton cœur'] }),

  // ---------- Échauffement ----------
  E({ id: 'arm_circles', name: 'Moulinets de bras', pattern: 'warmup', muscles: ['Épaules'], type: 'time', level: 1, secs: 30, cues: ['Petits puis grands cercles', 'Avant puis arrière'] }),
  E({ id: 'leg_swings', name: 'Balancés de jambes', pattern: 'warmup', muscles: ['Hanches'], type: 'time', level: 1, secs: 40, cues: ['Tiens-toi à un mur', 'Avant-arrière puis latéral', 'Amplitude progressive'] }),
  E({ id: 'hip_circles', name: 'Cercles de hanches', pattern: 'warmup', muscles: ['Hanches'], type: 'time', level: 1, secs: 30, cues: ['Mains sur les hanches', 'Grands cercles dans les deux sens'] }),
  E({ id: 'inchworm', name: 'Inchworm', pattern: 'warmup', muscles: ['Ischios', 'Épaules'], type: 'time', avoid: ['wrist', 'lowback'], level: 1, secs: 40, cues: ['Penche-toi, marche avec les mains jusqu’en planche', 'Reviens en marchant avec les pieds'] }),
  E({ id: 'bw_squat_warm', name: 'Squats lents d’échauffement', pattern: 'warmup', muscles: ['Jambes'], type: 'time', avoid: ['knee'], level: 1, secs: 40, track: 'squat', cues: ['Amplitude progressive', 'Respire'] }),
];

export const EX = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export function exerciseAllowed(ex, profile) {
  const equip = new Set(['none', ...(profile.equipment || [])]);
  const hasGym = equip.has('gym');
  const okEquip = ex.equip.some((q) => equip.has(q) || (hasGym && q !== 'bag' && q !== 'pads' && q !== 'rope'));
  const okNeeds = !ex.needs || ex.needs.every((q) => equip.has(q) || hasGym);
  const injuries = new Set(profile.injuries || []);
  const okBody = !ex.avoid.some((z) => injuries.has(z));
  return okEquip && okNeeds && okBody;
}
