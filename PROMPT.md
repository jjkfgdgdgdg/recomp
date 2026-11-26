# Prompt — Application « Recomp »

> Ce prompt décrit l'application à construire. Il sert de cahier des charges : on peut le relire, le modifier,
> et le redonner tel quel à un développeur (ou à une IA) pour faire évoluer l'app.

---

## Rôle

Tu es un développeur web senior **et** un coach diplômé en préparation physique, musculation et Muay Thai.
Construis **Recomp**, une application web de sport et de bien-être **100 % gratuite**, **sans clé API**,
**sans serveur**, **sans IA payante**, qui crée et adapte automatiquement le programme de l'utilisateur
à partir de ses réponses, et qui **corrige ses mouvements en direct grâce à un squelette dessiné sur lui via la caméra**.

## Contraintes non négociables

1. **Zéro coût** : aucune API payante, aucun abonnement, aucun backend. Tout tourne dans le navigateur.
2. **Pas d'IA générative / pas de clé API** : toute « l'intelligence » est faite de **règles écrites à la main**
   (formules scientifiques, tables de progression, arbres de décision). La seule « IA » est un modèle de vision
   gratuit et local (**MediaPipe Pose Landmarker**, Google, licence Apache 2.0) inclus dans le dépôt.
3. **Vie privée** : la vidéo de la caméra ne quitte jamais le téléphone/PC. Les données sont stockées en local
   (`localStorage`) avec export/import JSON pour la sauvegarde.
4. **Fonctionne sur téléphone** (mobile-first), installable comme une app (PWA), utilisable hors ligne.
5. **Tout en français**, ton motivant et direct (tutoiement).
6. **Hébergeable gratuitement** (GitHub Pages, Cloudflare Pages, Netlify…). Aucune étape de build obligatoire.

## 1. Questionnaire d'accueil (l'app pose BEAUCOUP de questions)

Questionnaire en plusieurs étapes, avec barre de progression, modifiable à tout moment depuis le profil :

- **Identité** : prénom, sexe, âge.
- **Corps** : taille, poids, poids visé (optionnel), tour de taille et tour de cou (optionnels → estimation du % de gras, méthode US Navy).
- **Mode de vie** : activité quotidienne (sédentaire → très actif), heures de sommeil, niveau de stress (1-5),
  eau bue par jour, nombre de repas par jour, régime (omnivore, végétarien, végan, halal, sans porc, sans lactose).
- **Objectifs** (choix multiple + un objectif principal) : prise de muscle, Muay Thai, perte de gras, force,
  cardio/endurance, souplesse/mobilité, bien-être/anti-stress.
- **Expérience** : niveau en musculation (jamais / débutant / intermédiaire / avancé) et en Muay Thai.
- **Tests de niveau** : max pompes d'affilée, max squats en 1 min, max tractions, gainage max (secondes),
  saut à la corde (minutes sans s'arrêter). Les tests pompes/squats/gainage peuvent être faits **avec la caméra**.
- **Disponibilité** : jours d'entraînement dans la semaine, durée par séance (20 → 90 min).
- **Matériel** : poids du corps, haltères, barre de traction, élastiques, kettlebell, banc, corde à sauter,
  sac de frappe, gants/pattes d'ours, salle de sport complète.
- **Douleurs / blessures** : épaules, coudes, poignets, bas du dos, genoux, chevilles, cou → les exercices
  à risque sont exclus et remplacés automatiquement.

## 2. Moteur automatique (règles, pas d'IA)

### Nutrition
- Métabolisme de base : **Mifflin-St Jeor** ; dépense totale = métabolisme × facteur d'activité (+ dépense des séances).
- Calories cibles selon l'objectif principal : prise de muscle ≈ +10 % (surplus léger), perte de gras ≈ −20 %
  (plafonné), recomposition / Muay Thai ≈ maintien.
- Macros : protéines 1,8–2,2 g/kg, lipides ≈ 0,9 g/kg, glucides = le reste. Eau : 35 ml/kg + 0,5 L par séance.
- Idées de repas adaptées au régime alimentaire et au nombre de repas.

### Programme hebdomadaire
- Répartit sur les jours choisis des séances de : **musculation** (full body / haut / bas / push / pull selon
  la fréquence), **Muay Thai** (technique, shadow boxing, sac, conditionnement), **cardio** (corde, HIIT),
  **mobilité / récupération**. Proportions selon les objectifs.
- Pas deux grosses séances jambes d'affilée ; une séance mobilité si ≥ 5 jours.
- Chaque séance = échauffement → bloc principal → finisher → retour au calme (étirements), calibrée sur la durée choisie.
- Bibliothèque d'exercices (~70) avec muscles, matériel, niveau, contre-indications, consignes, régressions/progressions.

### Progression automatique
- Double progression : quand toutes les séries atteignent le haut de la fourchette de répétitions avec un effort
  « facile/correct » → on augmente (reps, charge +2,5 kg ou variante plus dure). Si échec → on garde ou on régresse.
- **Semaine de décharge** toutes les 5 semaines (volume −40 %). Re-test du niveau toutes les 4 semaines.

### Adaptation quotidienne (check-in)
- Chaque jour : sommeil, énergie, courbatures, stress, douleur → **score de forme (0-100)**.
- Score bas → séance allégée automatiquement (moins de séries, intensité réduite) ou remplacée par de la mobilité.

## 3. Coach caméra avec squelette (cœur de l'app)

- Détection de pose **en direct** (MediaPipe Pose, 33 points du corps), squelette dessiné sur la vidéo.
- **Couleur du squelette** : vert = bonne position, orange = à corriger, rouge = mauvaise position.
- **Compteur de répétitions automatique** (machine à états sur les angles des articulations, lissage, hystérésis).
- **Corrections en direct, à l'écran et à la voix** (synthèse vocale gratuite du navigateur) :
  - **Pompes** : descente suffisante (angle des coudes < 90°), corps gainé (épaule-hanche-cheville alignés),
    « hanches trop hautes / trop basses », « descends plus bas », « tends les bras en haut ».
  - **Squats** : profondeur (cuisses à l'horizontale), buste pas trop penché, montée complète.
  - **Fentes**, **jumping jacks**, **gainage/planche** (chrono qui ne tourne que si le corps est aligné),
    **curl biceps** (coudes collés), **développé épaules** (extension complète), **montées de genoux**,
    **pont fessier**, **squat sauté**.
  - **Muay Thai** : compteur de **coups de pied** (cheville au-dessus de la hanche) et de **coups de genou**,
    **contrôle de la garde** pendant le shadow boxing (alerte « Garde haute ! » quand les mains descendent).
- Répétitions **valides vs partielles** + **score de technique** par série, enregistrés dans l'historique.
- Indications de placement du téléphone pour chaque exercice (de profil / de face, distance).

## 4. Séance guidée

- Lecteur de séance : exercice par exercice, consignes, minuteur de repos automatique avec bips,
  saisie des reps réalisées + ressenti (facile / correct / dur) → alimente la progression.
- Bouton « Faire avec la caméra » sur les exercices compatibles (les reps sont remplies automatiquement).
- **Minuteur de rounds Muay Thai** (3 min / 1 min, cloche) avec **coach vocal qui annonce des combinaisons**
  aléatoires adaptées au niveau (ex. « Jab, cross, low kick »).

## 5. Bien-être

- Respiration guidée animée : cohérence cardiaque (5-5), respiration carrée (4-4-4-4), 4-7-8.
- Routines d'étirements / mobilité minutées. Conseils sommeil et récupération.
- Suivi de l'hydratation (boutons +250 ml), humeur, sommeil.

## 6. Suivi des progrès

- Courbe du poids (et tour de taille), séances réalisées, volume hebdomadaire, série de jours (streak),
  records personnels (ex. max pompes validées par la caméra), historique détaillé.

## 7. Technique

- HTML + CSS + JavaScript (modules ES), sans framework ni étape de build.
- MediaPipe Tasks Vision + modèle Pose Landmarker **inclus dans le dépôt** (pas de dépendance à un CDN).
- PWA : manifest + service worker (cache hors ligne). Stockage `localStorage`, export/import JSON.
- Logique métier (nutrition, planification, progression, compteurs de reps) en **fonctions pures testées**
  avec `node --test`.
- Accessible, lisible en mode sombre, utilisable d'une main sur téléphone.

## 8. Sécurité

- Avertissement : l'app ne remplace pas un médecin ; arrêter en cas de douleur.
- Exclusion automatique des exercices contre-indiqués selon les douleurs déclarées.
- Pas de déficit calorique extrême (plancher : métabolisme de base), alerte si IMC hors norme ou âge < 16 ans.
