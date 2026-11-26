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

## Nouveautés V2 : mode RPG ⚔️

- **Niveaux, rangs E → S, 5 stats** (Force, Endurance, Agilité, Technique, Mental) et **titres** à débloquer.
- **Quêtes quotidiennes** adaptées à ton niveau, coffre bonus, et **quête de pénalité** si tu zappes.
- **Combats de boss** : chaque rep propre validée par la caméra inflige des dégâts. Technique parfaite = critiques,
  enchaînements = combo jusqu'à ×2. Le boss attaque : enchaîne vite des reps pour esquiver !
- **Coach Hardcore** : une personnalité vocale sans pitié (répliques originales), à activer dans Profil → Réglages.
- **Académie** : ~90 fiches d'exercices avec démo animée, erreurs, respiration, variantes et vidéos,
  12 guides (muscle, nutrition, compléments, Muay Thai…) et carte musculaire de la semaine.

## Ce que fait l'app

| Onglet | Contenu |
| --- | --- |
| **Questionnaire** | ~40 questions : âge, taille, poids, objectifs, niveau, tests (pompes, squats, tractions, gainage), jours dispo, matériel, douleurs, sommeil, stress, alimentation |
| **Aujourd'hui** | Check-in de forme (sommeil, énergie, courbatures, stress) → score /100 → séance adaptée automatiquement. Séance du jour, calories/macros, hydratation |
| **Programme** | Semaine type (muscu + Muay Thai + cardio + mobilité), explication des choix, nutrition détaillée, idées de repas selon ton régime |
| **Séance guidée** | Exercice par exercice, minuteur de repos, saisie des reps et de la charge, ressenti → **progression automatique** (reps, charge, variante plus dure) |
| **Coach caméra** | Squelette en direct + compteur + corrections : pompes, squats, fentes, gainage, pont fessier, curl, développé épaules, jumping jacks, montées de genoux, burpees/sprawls, **coups de pied, coups de genou, shadow boxing avec contrôle de la garde**. Tests de niveau filmés qui recalibrent le programme |
| **Minuteur Muay Thai** | Rounds/repos avec cloche, et **coach vocal qui annonce des combinaisons** (« jab, cross, low kick ! ») adaptées à ton niveau |
| **Arène** | Combats de boss à la caméra + coach caméra libre + tests de niveau |
| **Académie** | Bibliothèque d'exercices avec démos animées, guides, carte musculaire |
| **Héros** | Niveau, rang, radar des stats, titres, trophées ; accès aux progrès (poids, records, historique) |
| **Bien-être** | Respiration guidée (cohérence cardiaque, carrée, 4-7-8), routines de mobilité, suivi du sommeil |

## Mettre l'app en ligne (une seule fois, 5 minutes, gratuit)

L'app est un site statique : il suffit de l'héberger en **HTTPS** (obligatoire pour la caméra et l'installation).
Ensuite, **la même adresse marche sur téléphone, tablette et PC**.

### Option A — GitHub Pages (le plus simple, dépôt public)
1. Fusionne la pull request dans `main`.
2. Dépôt → *Settings* → *General* → tout en bas *Change visibility* → **Public**
   (le code ne contient aucune donnée perso ; tes données restent sur tes appareils).
3. *Settings* → *Pages* → *Build and deployment* → *Deploy from a branch* → `main` / `(root)` → *Save*.
4. 1-2 minutes plus tard : **`https://jjkfgdgdgdg.github.io/recomp/`**

### Option B — Cloudflare Pages ou Netlify (gratuit, le dépôt peut rester privé)
1. Crée un compte gratuit sur [pages.cloudflare.com](https://pages.cloudflare.com) ou [netlify.com](https://www.netlify.com) (connexion avec GitHub).
2. *Ajouter un site* → *Importer depuis GitHub* → `recomp`, branche `main`.
3. Commande de build : **aucune** · Dossier publié : **`/`** (racine). Les fichiers `netlify.toml` et `_headers` sont déjà prêts.
4. Tu obtiens une adresse en `https://…pages.dev` ou `https://…netlify.app`. Chaque fusion dans `main` met l'app à jour.

## Installer l'app sur tes appareils

Ouvre l'adresse de l'app, puis :

| Appareil | Comment |
| --- | --- |
| **Android** | Bouton **Installer** dans l'app (bandeau sur l'accueil ou icône ⬇ en haut), ou Chrome ⋮ → *Installer l'application* |
| **iPhone / iPad** | Safari → bouton *Partager* → *Sur l'écran d'accueil* |
| **PC Windows / Linux** | Chrome ou Edge → icône d'installation dans la barre d'adresse (ou bouton **Installer** dans l'app). Recomp arrive dans le menu Démarrer |
| **Mac** | Chrome/Edge : icône d'installation · Safari (Sonoma+) : *Fichier → Ajouter au Dock* |

- **Du PC vers le téléphone** : page *Installer* de l'app → *Partager le lien*, ou dans Chrome/Edge clic droit → *Créer un code QR pour cette page* et scanne-le.
- **Transférer tes données** : *Profil → Mes données → Exporter* sur l'ancien appareil, puis *Importer* sur le nouveau.
- **Mises à jour** : automatiques ; un bandeau propose de recharger quand une nouvelle version est prête.
- Une fois installée, l'app fonctionne **hors connexion** (le modèle du squelette est mis en cache au premier usage de la caméra).

### Juste sur ton ordinateur, sans hébergement

```bash
npm start          # puis ouvre http://localhost:8080
```

(Node.js 18+ suffit, aucune dépendance. La caméra fonctionne sur `localhost`, pas sur l'adresse réseau du PC depuis un téléphone.)

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
js/game/       → XP/niveaux/stats/titres, quêtes, boss, monstres SVG
js/pose/       → détection (MediaPipe), géométrie, compteurs de reps, dessin du squelette
js/views/      → écrans
js/data/       → exercices (~90), technique, guides, muscles, combinaisons de Muay Thai, idées de repas
js/voice.js    → personnalités du coach (bienveillant / Hardcore)
vendor/        → MediaPipe Tasks Vision 0.10.35 + modèles Pose Landmarker (Apache 2.0)
tests/         → tests (node --test)
```

```bash
npm test           # tests automatiques (aussi lancés par GitHub Actions sur chaque pull request)
```

Checklist des tests à faire à la main sur de vrais appareils : [`TESTS-MANUELS.md`](TESTS-MANUELS.md).

Si tu ajoutes un fichier JS, ajoute-le aussi à la liste `SHELL` de `sw.js` (un test le vérifie) et change `VERSION`.

---

⚠️ Recomp ne remplace pas un avis médical. En cas de douleur, arrête l'exercice et consulte.
