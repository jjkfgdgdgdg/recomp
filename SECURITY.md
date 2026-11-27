# Sécurité

## Signaler une faille

Merci de **ne pas ouvrir d'issue publique** pour une faille de sécurité.
Utilise plutôt le signalement privé de GitHub : onglet **Security → Report a vulnerability** de ce dépôt.
Tu recevras une réponse dès que possible.

## Ce que fait Recomp pour protéger ses utilisateurs

- **Aucune donnée envoyée** : profil, historique, photos et vidéo de la caméra restent sur l'appareil.
  Il n'y a ni serveur, ni compte, ni publicité, ni traceur.
- **Content Security Policy** : seul le code de l'application peut s'exécuter (aucun script externe ou injecté).
- **Données importées nettoyées** (fichier de sauvegarde, liens de défi) : textes filtrés, tailles limitées, dates vérifiées.
- **Liens de défi** protégés par une somme de contrôle : un lien modifié à la main est refusé
  (ce n'est pas une signature cryptographique : c'est un jeu entre amis, pas un classement officiel).
- **Application PC** (Electron) : isolation du contexte, bac à sable, pas d'accès Node.js pour la page,
  navigation externe bloquée, seules les autorisations caméra et notifications sont accordées.
- **Application Android** : trafic non chiffré interdit, seules les autorisations caméra et notifications.
- **Aucun secret dans le dépôt** : la clé de signature Android est stockée dans les *secrets* GitHub,
  jamais dans le code (voir le README). Un test automatique vérifie qu'aucune clé n'est publiée par erreur.
- **Constructions automatiques** avec des droits minimaux ; les secrets ne sont jamais exposés aux pull requests.
  Chaque version publiée est accompagnée d'un fichier `SHA256SUMS.txt` pour vérifier les téléchargements.
- **Mises à jour de sécurité** des dépendances proposées automatiquement par Dependabot.
