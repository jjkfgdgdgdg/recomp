# Recomp 🥊💪 — coach sport & bien-être 100 % gratuit

Application web (installable sur téléphone) qui crée **automatiquement** ton programme de **musculation**, de **Muay Thai**,
de cardio et de mobilité à partir de tes réponses, et qui **corrige tes mouvements en direct avec la caméra** :
un squelette se dessine sur toi, compte tes répétitions et te dit (à l'écran et à voix haute) si tu descends assez bas,
si ton dos est droit, si ta garde est haute…

- **Gratuit** : pas d'abonnement, pas de pub, pas de clé API, pas de serveur.
- **Sans IA payante** : le programme est généré par des règles écrites à la main (formules scientifiques, progressions).
  La détection du squelette utilise **MediaPipe Pose** (Google, gratuit, inclus dans le dépôt) qui tourne **sur ton téléphone**.
- **Privé** : la vidéo ne quitte jamais ton appareil. Tes données restent dans ton navigateur (export/import possible).

> Le cahier des charges complet (le « prompt » de l'app) est dans [`PROMPT.md`](PROMPT.md).

## Ce que fait l'app

| Onglet | Contenu |
| --- | --- |
| **Questionnaire** | ~40 questions : âge, taille, poids, objectifs, niveau, tests (pompes, squats, tractions, gainage), jours dispo, matériel, douleurs, sommeil, stress, alimentation |
| **Aujourd'hui** | Check-in de forme (sommeil, énergie, courbatures, stress) → score /100 → séance adaptée automatiquement. Séance du jour, calories/macros, hydratation |
| **Programme** | Semaine type (muscu + Muay Thai + cardio + mobilité), explication des choix, nutrition détaillée, idées de repas selon ton régime |
| **Séance guidée** | Exercice par exercice, minuteur de repos, saisie des reps et de la charge, ressenti → **progression automatique** (reps, charge, variante plus dure) |
| **Coach caméra** | Squelette en direct + compteur + corrections : pompes, squats, fentes, gainage, pont fessier, curl, développé épaules, jumping jacks, montées de genoux, burpees/sprawls, **coups de pied, coups de genou, shadow boxing avec contrôle de la garde**. Tests de niveau filmés qui recalibrent le programme |
| **Minuteur Muay Thai** | Rounds/repos avec cloche, et **coach vocal qui annonce des combinaisons** (« jab, cross, low kick ! ») adaptées à ton niveau |
| **Progrès** | Courbe de poids + moyenne 7 jours, ajustement calorique automatique, records, tests, historique |
| **Bien-être** | Respiration guidée (cohérence cardiaque, carrée, 4-7-8), routines de mobilité, suivi du sommeil |

## Utiliser l'app

### Sur ton téléphone (recommandé)

La caméra d'un navigateur ne fonctionne qu'en **HTTPS**. Il faut donc héberger l'app — gratuitement :

**Option A — GitHub Pages (le plus simple, nécessite un dépôt public)**
1. Fusionne cette branche dans `main`.
2. Dépôt → *Settings* → *Pages* → *Build and deployment* → *Deploy from a branch* → `main` / `(root)` → *Save*.
3. Après 1-2 minutes, l'app est en ligne sur `https://<ton-pseudo>.github.io/recomp/`.

> GitHub Pages n'est gratuit que pour les dépôts **publics**. Ton dépôt est privé : soit tu le passes en public
> (aucune donnée perso dedans), soit tu utilises l'option B.

**Option B — Cloudflare Pages ou Netlify (gratuit, marche avec un dépôt privé)**
1. Crée un compte gratuit sur [pages.cloudflare.com](https://pages.cloudflare.com) ou [netlify.com](https://www.netlify.com).
2. « Importer depuis GitHub » → choisis `recomp`.
3. Commande de build : *aucune* · Dossier publié : `/` (racine).

Ensuite, ouvre le lien sur ton téléphone puis :
- **Android (Chrome)** : menu ⋮ → *Installer l'application*.
- **iPhone (Safari)** : bouton *Partager* → *Sur l'écran d'accueil*.

Une fois installée, l'app fonctionne même hors connexion.

### Sur ton ordinateur

```bash
npm start          # puis ouvre http://localhost:8080
```

(Node.js 18+ suffit, aucune dépendance à installer. La caméra fonctionne sur `localhost`.)

## Conseils pour le coach caméra

- Pose le téléphone contre un mur ou une bouteille, à **2-3 m**, **de profil** pour pompes/squats/gainage, **de face** pour le shadow boxing.
- Bonne lumière, pas de fenêtre derrière toi, vêtements près du corps.
- Couleurs du squelette : **vert** = bonne position, **orange** = à corriger, **rouge** = mauvaise position.
- Si c'est lent : *Profil → Réglages → Modèle rapide*.

## Comment ça marche (sans IA payante)

- **Nutrition** : métabolisme de base Mifflin-St Jeor × activité + dépense des séances ; surplus léger (+10 %) pour le muscle,
  déficit modéré (−20 %, jamais sous le métabolisme de base) pour la perte de gras ; protéines 1,8–2,2 g/kg.
- **Programme** : répartition muscu / Muay Thai / cardio / mobilité selon tes objectifs et tes jours, full body pour les débutants,
  split pour les plus avancés, exercices filtrés selon ton matériel et tes douleurs, séance calibrée sur ta durée.
- **Progression** : double progression (reps puis charge), variantes plus dures débloquées (pompes genoux → pompes → diamant…),
  régression après deux échecs, semaine de décharge toutes les 5 semaines.
- **Caméra** : MediaPipe donne 33 points du corps ; l'app calcule des angles (coudes, genoux, hanches, alignement du corps)
  et utilise des machines à états avec hystérésis pour compter les reps et détecter les erreurs.

## Développement

```
index.html, css/, icons/, manifest.webmanifest, sw.js   → coquille PWA
js/engine/     → nutrition, planification, progression, forme (fonctions pures)
js/pose/       → détection (MediaPipe), géométrie, compteurs de reps, dessin du squelette
js/views/      → écrans
js/data/       → exercices (~90), combinaisons de Muay Thai, idées de repas
vendor/        → MediaPipe Tasks Vision 0.10.35 + modèles Pose Landmarker (Apache 2.0)
tests/         → tests (node --test)
```

```bash
npm test
```

Si tu ajoutes un fichier JS, ajoute-le aussi à la liste `SHELL` de `sw.js` (un test le vérifie) et change `VERSION`.

---

⚠️ Recomp ne remplace pas un avis médical. En cas de douleur, arrête l'exercice et consulte.
