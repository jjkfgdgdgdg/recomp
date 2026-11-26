# Recomp 🎟️

**Coche tes habitudes. Gagne des tickets. Offre-toi tes récompenses.**

Recomp transforme tes bonnes habitudes en monnaie. Chaque habitude cochée rapporte des tickets, comme à la borne d'une salle d'arcade. Ces tickets s'échangent contre les récompenses que **tu** choisis : une heure de jeu vidéo, une pizza, une grasse matinée, un nouveau jeu… Plus besoin de culpabiliser : tu as payé ta récompense.

## Ce que fait l'appli

| Écran | À quoi il sert |
|---|---|
| **Aujourd'hui** | Ta liste du jour. Un tap pour cocher, un autre pour décocher. Tu peux rattraper un oubli jusqu'à 6 jours en arrière. |
| **Habitudes** | Crée tes habitudes : tous les jours, certains jours (ex. en semaine), X fois par semaine, ou une tâche unique. Tu choisis combien de tickets chacune rapporte. |
| **Focus** | Un minuteur de concentration (25 min par défaut, puis une pause). Chaque session terminée rapporte des tickets. Il reste juste même si tu changes d'onglet ou fermes l'appli. |
| **Récompenses** | Ta vitrine de lots, avec une barre qui montre combien il te manque. Un clic pour échanger, un second pour confirmer. Tu peux annuler un échange par erreur. |
| **Progrès** | Ton niveau, un calendrier de tes 18 dernières semaines, tes séries, tes succès, ton historique et un **bilan de la semaine à copier dans Discord**. |

### Les règles du jeu

- **Séries 🔥** : enchaîne une habitude sans la rater et ses tickets sont multipliés : **×1,2** dès 3 jours, **×1,5** dès 7 jours, **×2** dès 30 jours. Pour les habitudes « X fois par semaine », ça compte en semaines réussies (2, 4 et 12).
- **Journée parfaite ⭐** : toutes tes habitudes quotidiennes et du jour sont cochées.
- **Niveaux** : chaque ticket gagné compte comme 1 XP, même si tu le dépenses. Le niveau 2 arrive à 100 XP, le 5 à 1 000, le 10 à 4 500. Les titres vont de *Recrue* à *Mythique*.
- **13 succès** à débloquer : premières séries, semaine parfaite, sessions focus, premier lot échangé…
- **Fin de journée réglable** : si tu te couches à 2 h, règle la fin de journée à 3 h et tes coches de la nuit compteront encore pour la veille.

## Utiliser l'appli

### Sur claude.ai (le plus simple)

L'appli est publiée sur claude.ai, comme une page privée : **https://claude.ai/artifact/RAkU83gfPvA7XAg2Hb7mk4**. Ouvre ce lien sur ton téléphone ou ton PC : tes données sont **liées à ton compte Claude** et se synchronisent entre tes appareils. Personne d'autre ne peut les voir, même si tu partages le lien.

### En local

Il faut [Node.js](https://nodejs.org) 20 ou plus récent.

```bash
npm install
npm run dev        # ouvre http://localhost:5173
```

Dans ce mode, les données restent dans le navigateur. Pense à faire **Réglages → Exporter une sauvegarde** de temps en temps.

### L'installer comme une vraie appli

Héberge le dossier `dist/` produit par `npm run build` sur n'importe quel hébergement statique (Netlify, Vercel, Cloudflare Pages, GitHub Pages si le dépôt est public…). Ouvre le site sur ton téléphone puis **« Ajouter à l'écran d'accueil »** : Recomp s'installe avec son icône et fonctionne même hors ligne.

## Pour les développeurs

```bash
npm test              # tests de la logique (séries, bonus, niveaux, minuteur, sauvegarde)
npm run typecheck     # vérification TypeScript
npm run build         # build de production dans dist/
npm run build:artifact  # page unique dans dist-artifact/recomp.html, à republier sur claude.ai après une modification
```

- **Stack** : [Preact](https://preactjs.com) + TypeScript + Vite, aucune autre dépendance. L'appli complète pèse environ 25 Ko compressés.
- **Logique** : `src/lib/` contient tout le calcul, écrit en fonctions pures et couvert par des tests. `logic.ts` gère les séries, bonus, niveaux et succès, `state.ts` les actions, `focus.ts` le minuteur.
- **Sauvegarde** : `store.ts` enregistre tout dans `localStorage`. Quand l'appli tourne sur claude.ai, `cloud.ts` synchronise aussi les données avec le stockage privé du compte. L'historique est découpé en un document par mois pour rester léger, et en cas de conflit la modification la plus récente gagne.
- **Hors ligne** : `public/sw.js` met l'appli en cache quand elle est hébergée normalement.
