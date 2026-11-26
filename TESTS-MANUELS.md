# Tests à faire sur de vrais appareils

Les tests automatiques (`npm test`) vérifient le moteur, les compteurs de reps sur des mouvements simulés, les quêtes,
les boss et les démos. Ce qui suit ne peut se vérifier **qu'avec un vrai corps devant une vraie caméra**.
Coche au fur et à mesure et note ce qui compte mal : les seuils se règlent facilement dans `js/pose/trackers.js`.

## 1. Installation
- [ ] Android (Chrome) : le bandeau « Installe Recomp » apparaît, le bouton ouvre la fenêtre d'installation, l'icône est sur l'écran d'accueil
- [ ] iPhone (Safari) : Partager → Sur l'écran d'accueil, l'app s'ouvre en plein écran
- [ ] PC (Chrome ou Edge) : installation depuis la barre d'adresse, l'app apparaît dans le menu Démarrer
- [ ] Mode avion : l'app s'ouvre et les écrans fonctionnent (après une première visite)
- [ ] Après une mise à jour du site : le bandeau « Nouvelle version disponible » apparaît
- [ ] Export sur un appareil → import sur un autre : profil, niveau et historique retrouvés

## 2. Coach caméra (le plus important)
Pour chaque exercice : fais 10 reps propres, puis 3 reps volontairement mauvaises.

| Exercice | Placement | 10 bonnes = 10 ✓ ? | Mauvaises détectées ? | Remarques |
| --- | --- | --- | --- | --- |
| Pompes | au sol, de profil, 2 m | | demi-pompe, hanches basses | |
| Pompes genoux | au sol, de profil | | | |
| Squats | hanches, de profil | | demi-squat, buste penché | |
| Squats | de face | | genoux qui rentrent | |
| Fentes | de profil | | | |
| Gainage | au sol, de profil | chrono qui avance | fesses hautes / ventre bas | |
| Pont fessier | au sol, de profil | | | |
| Curl biceps | de face | | coudes qui avancent | |
| Développé épaules | de face | | bras pas tendus | |
| Jumping jacks | de face, 3 m | | bras pas au-dessus de la tête | |
| Montées de genoux | de face | | | |
| Burpees | de profil, 3 m | | | |
| Coups de pied | de face, 3 m | | kick trop bas | |
| Coups de genou | de face | | | |
| Shadow (garde) | de face | garde % cohérente | mains basses → alerte | |
| Tractions | face ou dos, 2-3 m | | menton sous la barre | |
| Dips | de profil | | demi-dips | |
| Rowing haltère | de profil | | buste qui se balance | |
| Soulevé de terre roumain | de profil | | genoux trop pliés | |
| Pompes piquées | au sol, de profil | | | |
| Mountain climbers | au sol, de profil | (chaque jambe compte) | | |
| Relevés de jambes | allongé, de profil | | jambes pliées | |
| Chaise contre le mur | de profil | chrono qui avance | genoux pas à 90° | |
| Mollets | au sol, de profil, pieds visibles | | | |
| Corde à sauter | de face, 3 m | nombre de sauts | | |

- [ ] Fluidité : nombre d'images/s affiché (≥ 15 sur téléphone récent, sinon essayer le modèle « Rapide »)
- [ ] Caméra arrière (bouton ⇄) et caméra avant
- [ ] Lumière faible / contre-jour : le message « Je ne te vois pas » apparaît
- [ ] La voix compte les reps et corrige (Android, iPhone, PC)
- [ ] Coach Hardcore : voix plus grave sur ton appareil ? (dépend des voix installées)

- [ ] Tempo : une descente rapide déclenche « Contrôle la descente » ; en mode tempo lent, les reps rapides ne comptent pas
- [ ] Le résumé affiche les durées (retour, effort, pause) et le graphique des reps

## 3. Combats de boss
- [ ] Slime (rang E) : durée du combat raisonnable (vise 3 à 6 min)
- [ ] Les attaques du boss sont esquivables sans être trop faciles
- [ ] Les changements de phase laissent assez de temps pour se replacer (12 s, bouton « Je suis prêt »)
- [ ] Gainage contre le Golem : les dégâts montent quand tu tiens bien
- [ ] Ogre (shadow) : les coups comptent, la garde baissée fait mal
- [ ] Mode sans caméra : jouable mais moins rentable
- [ ] XP, trophée et note affichés à la fin

## 4. Programme, quêtes, progression
- [ ] Le questionnaire donne un programme cohérent pour toi (jours, durée, exercices)
- [ ] Les quêtes du jour ne sont ni trop faciles ni impossibles
- [ ] Les reps faites à la caméra font avancer les quêtes
- [ ] Quête de pénalité le lendemain d'une journée ratée
- [ ] Après une séance « facile », les objectifs augmentent la fois suivante
- [ ] Le check-in « fatigue élevée » remplace la séance par de la récupération

## 5. Nouveautés V3
- [ ] Boss de la semaine : modificateur appliqué (ex. Enragé attaque plus souvent), XP doublée, « Vaincu cette semaine »
- [ ] Défi : créer un défi, l'envoyer par WhatsApp/SMS, l'ouvrir sur le téléphone d'un ami, le relever, renvoyer le lien
- [ ] Éditeur : changer un jour, remplacer un exercice, vérifier que la séance du jour suit tes choix
- [ ] Photos : activer, prendre une photo, comparer avant / après, puis tout supprimer
- [ ] Rappels : importer le fichier agenda (iPhone et Android), recevoir l'alarme ; notifications sur Android / PC

## 6. Divers
- [ ] Minuteur de rounds : cloche, 10 dernières secondes, combinaisons annoncées
- [ ] Démos animées lisibles sur petit écran
- [ ] Liens « Voir des vidéos tuto » ouvrent YouTube
- [ ] Écran allumé pendant les séances (pas de mise en veille)
