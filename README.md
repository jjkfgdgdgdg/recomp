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

## Nouveautés V3

- **27 exercices suivis par la caméra** (56 fiches compatibles) : + tractions, dips, rowing, soulevé de terre roumain,
  kettlebell swing, pompes piquées, mountain climbers, relevés de jambes / de genoux, chaise, mollets, corde à sauter.
- **Tempo des reps** : durée de la descente et de la montée, pause entre les reps, cadence ; alerte « contrôle la descente »,
  mode **tempo lent** (2 s au retour) pour la prise de muscle.
- **Boss de la semaine** : un boss + un modificateur différent chaque lundi, adapté à ton niveau, XP ×2.
- **Défis entre amis par lien** : fais ton score, envoie le lien (WhatsApp, Snap, SMS…), tes amis répondent. Sans compte, sans serveur.
- **Éditeur de programme** : change la séance de chaque jour, remplace / ajoute / retire des exercices, règle les séries.
- **Photos de progression** (optionnel, désactivé par défaut) : stockées uniquement sur ton appareil, comparateur avant / après.
- **Rappels** : séances et quêtes dans l'agenda du téléphone (.ics / Google Agenda) + notifications de l'app.

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

**Tout reste gratuit, pour toujours** : Recomp n'a **aucun serveur à payer**.
- L'app est un simple site statique (HTML/JS) → hébergement gratuit (GitHub Pages, Cloudflare Pages ou Netlify).
- Les **défis entre amis** passent par le **lien** partagé (le classement est dans le lien) → pas de base de données.
- Les **rappels** passent par l'**agenda** du téléphone et les notifications du navigateur → pas de serveur d'envoi.
- Les **données et photos** restent sur chaque appareil (export / import pour changer de téléphone).

Il suffit d'héberger le site en **HTTPS** (obligatoire pour la caméra et l'installation).
Ensuite, **la même adresse marche sur téléphone, tablette et PC**.

### Option A — GitHub Pages (recommandé, le dépôt est public)
1. Dépôt → *Settings* → *Pages* → *Build and deployment* → **Source : GitHub Actions** (une seule fois).
2. C'est tout : à chaque modification de `main`, le workflow **« Mettre le site en ligne »** lance les tests
   puis publie le site (seulement s'ils passent). Pour le lancer tout de suite : onglet *Actions* →
   *Mettre le site en ligne* → *Run workflow*.
3. Le site est sur **`https://jjkfgdgdgdg.github.io/recomp/`** (HTTPS, donc caméra et installation OK).

### Option B — Cloudflare Pages ou Netlify (gratuit, le dépôt peut rester privé)
1. Crée un compte gratuit sur [pages.cloudflare.com](https://pages.cloudflare.com) ou [netlify.com](https://www.netlify.com) (connexion avec GitHub).
2. *Ajouter un site* → *Importer depuis GitHub* → `recomp`, branche `main`.
3. Commande de build : **aucune** · Dossier publié : **`/`** (racine). Les fichiers `netlify.toml` et `_headers` sont déjà prêts.
4. Tu obtiens une adresse en `https://…pages.dev` ou `https://…netlify.app`. Chaque fusion dans `main` met l'app à jour.

## Applications PC et téléphone (fichiers à installer)

En plus du site web, Recomp existe en **vraies applications**, construites automatiquement et gratuitement par GitHub Actions :

| Appareil | Fichier | Particularités |
| --- | --- | --- |
| **Windows** | `Recomp-Setup-x.y.z.exe` (installation) ou `Recomp-Portable-x.y.z.exe` | Fenêtre dédiée, raccourci bureau / menu Démarrer, webcam |
| **Android** | `Recomp-x.y.z-android.apk` | Voix du coach native, **rappels programmés même appli fermée**, écran toujours allumé en séance |
| **Mac** | `Recomp-x.y.z-mac.dmg` | Intel et Apple Silicon |
| **Linux** | `Recomp-x.y.z-linux.AppImage` | — |
| **iPhone / iPad** | — | Apple interdit l'installation hors App Store sans compte payant (99 $/an) : utilise l'app web ajoutée à l'écran d'accueil (Safari → Partager → « Sur l'écran d'accueil »), elle fonctionne hors connexion |

**Publier une nouvelle version** (une fois la PR fusionnée) : onglet **Actions** → **Construire les applis** → **Run workflow**
→ indique un numéro (ex. `3.1.0`). 15 à 25 minutes plus tard, les fichiers sont dans l'onglet **Releases**
(avec `SHA256SUMS.txt` pour vérifier les téléchargements). Dans l'app : *Installer* → *Ouvrir la page des téléchargements*.

**Premier lancement** (les applis ne sont pas signées par un éditeur payant, c'est normal) :
- Windows : « Windows a protégé votre ordinateur » → *Informations complémentaires* → *Exécuter quand même*.
- Android : autorise ton navigateur à « installer des applis inconnues ».
- Mac : clic droit sur Recomp → *Ouvrir*.

**Clé de signature Android (recommandé)** : pour que chaque mise à jour s'installe par-dessus l'ancienne sans perdre
tes données, ajoute ta clé privée dans *Settings → Secrets and variables → Actions* (`ANDROID_KEYSTORE_BASE64`,
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`). **Ne mets jamais cette clé dans le dépôt.**
Sans clé, l'APK est signé avec une clé de test (une mise à jour demandera alors de réinstaller).

Construire soi-même : `npm ci` puis `npm run desktop` (lancer l'appli PC), `npm run dist:win` / `dist:mac` / `dist:linux`,
ou `npm run android:apk` (nécessite le SDK Android).

## Protections

Le dépôt est public : voir [`SECURITY.md`](SECURITY.md) pour le détail et pour signaler une faille. En bref :
aucune donnée envoyée, Content Security Policy stricte, données importées et liens de défi nettoyés,
applis PC/Android verrouillées, aucun secret dans le code (test automatique), workflows aux droits minimaux,
mises à jour de sécurité Dependabot, empreintes SHA-256 des fichiers publiés.
Code source visible mais **tous droits réservés** (voir [`LICENSE`](LICENSE)).

À activer une fois dans GitHub (*Settings*) pour renforcer encore :
- *Code security* → **Secret scanning** + **Push protection**, **Dependabot alerts**, **Private vulnerability reporting** ;
- *Branches* → règle pour `main` : **Require a pull request** + **Require status checks** (« test »).

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

> Plus tard, si tu veux un **classement en ligne en direct** (sans renvoyer de lien), il faudra un petit serveur.
> Il existe des offres gratuites (Cloudflare Workers + D1, Supabase…) mais elles demandent de créer un compte :
> ce n'est pas nécessaire pour utiliser l'app.

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
desktop/       → application PC (Electron) ; android/ → application Android (Capacitor)
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
