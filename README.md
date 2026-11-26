# Discord personnalisé : fond d'écran + plugins

Ce dépôt contient de quoi mettre **ton propre fond d'écran** sur Discord (PC) et t'explique comment ajouter des **plugins** avec BetterDiscord.

| Fichier | À quoi il sert |
|---|---|
| [`plugins/FondPerso.plugin.js`](plugins/FondPerso.plugin.js) | Plugin BetterDiscord : tu choisis ton image (lien ou fichier de ton PC) et tu règles flou, assombrissement et transparence depuis les paramètres, sans toucher au code. **Recommandé.** |
| [`themes/FondPerso.theme.css`](themes/FondPerso.theme.css) | La même chose sous forme de thème CSS : tu colles le lien de ton image dans le fichier. Fonctionne avec BetterDiscord **et** Vencord. |

> Utilise **soit** le plugin, **soit** le thème, pas les deux en même temps.

---

## Étape 1 : installer BetterDiscord

1. Va sur **https://betterdiscord.app** et télécharge l'installateur pour ton système (Windows, macOS ou Linux).
2. **Ferme complètement Discord** (clic droit sur l'icône près de l'horloge, puis *Quitter Discord*).
3. Lance l'installateur, accepte la licence, choisis **Install BetterDiscord**, puis coche ta version de Discord (en général *Discord Stable*).
4. Relance Discord. Dans **Paramètres utilisateur** (la roue dentée en bas à gauche), une nouvelle section **BetterDiscord** apparaît avec *Plugins* et *Thèmes*.

## Étape 2 : mettre ton fond d'écran

### Option A : le plugin (le plus simple)

1. Télécharge [`FondPerso.plugin.js`](plugins/FondPerso.plugin.js) (bouton *Download raw file* sur GitHub).
2. Dans Discord : **Paramètres → Plugins → Ouvrir le dossier des plugins**, puis glisse le fichier dedans.
3. Active **FondPerso** avec l'interrupteur, puis clique sur la **roue dentée ⚙️** du plugin.
4. Dans le panneau de réglages :
   - **Choisir une image sur mon PC…** pour prendre une image ou un GIF de ton ordinateur (10 Mo maximum), ou
   - colle un lien direct d'image puis **Appliquer le lien**.
   - Règle ensuite le **flou**, l'**assombrissement** (pour que le texte reste lisible), l'**opacité des panneaux** et l'**ajustement** (remplir, image entière, étirer, mosaïque). Tout s'applique en direct et est sauvegardé.

### Option B : le thème

1. Télécharge [`FondPerso.theme.css`](themes/FondPerso.theme.css) et ouvre-le avec le Bloc-notes.
2. Remplace la ligne `--fp-image: linear-gradient(...)` par le lien de ton image :
   ```css
   --fp-image: url("https://i.imgur.com/TON_IMAGE.png");
   ```
   Tu peux aussi changer `--fp-flou`, `--fp-assombrir` et `--fp-opacite-panneaux` juste en dessous (chaque ligne est commentée).
3. Dans Discord : **Paramètres → Thèmes → Ouvrir le dossier des thèmes**, glisse le fichier dedans et active **FondPerso**. Chaque fois que tu enregistres le fichier, Discord se met à jour tout seul.

### Où héberger ton image ?

- Le lien doit mener **directement à l'image** (il finit par `.png`, `.jpg` ou `.gif`). Sur imgur, fais clic droit sur l'image puis *Copier l'adresse de l'image* : le lien commence par `https://i.imgur.com/`.
- **N'utilise pas un lien d'image envoyée sur Discord** : depuis 2024 ces liens expirent au bout de quelques heures et ton fond disparaîtrait.
- Avec le plugin, le plus fiable reste **un fichier de ton PC** : rien à héberger.

## Étape 3 : ajouter d'autres plugins

BetterDiscord sert surtout à ça : des centaines de plugins (traduction des messages, zoom sur les images, volume au-delà de 200 %, affichage des permissions, etc.).

1. Va sur **https://betterdiscord.app/plugins** (ou **/themes** pour d'autres thèmes) et trie par popularité.
2. Télécharge le fichier `.plugin.js`, mets-le dans le dossier des plugins comme à l'étape 2, puis active-le.
3. Beaucoup de plugins ont une roue dentée ⚙️ pour les régler.

> ⚠️ **Sécurité** : un plugin est du code qui a accès à ton compte. Installe uniquement des plugins venant du site officiel **betterdiscord.app** ou d'un dépôt GitHub connu. **N'installe jamais un fichier `.plugin.js` que quelqu'un t'envoie en message privé** : c'est la méthode classique pour voler des comptes Discord.

---

## Alternative : Vencord

[Vencord](https://vencord.dev) est un autre mod de Discord, très populaire. Plus de 100 plugins sont **déjà intégrés** : tu les actives dans les paramètres, sans fichier à télécharger.

- Le **thème** `FondPerso.theme.css` fonctionne avec Vencord : **Paramètres → Thèmes → Ouvrir le dossier des thèmes**, puis active-le.
- Le **plugin** `FondPerso.plugin.js` est réservé à BetterDiscord et ne fonctionne pas sous Vencord.
- Vencord n'affiche que les images de certains sites. Héberge ton image sur **i.imgur.com**, **i.ibb.co**, **files.catbox.moe** ou **GitHub**.
- N'installe pas BetterDiscord et Vencord en même temps.

## Dépannage

| Problème | Solution |
|---|---|
| BetterDiscord a disparu après une mise à jour de Discord | Relance l'installateur de BetterDiscord et choisis **Repair**. |
| L'image ne s'affiche pas | Vérifie que c'est un **lien direct** vers l'image (voir « Où héberger ton image ? »). Avec le plugin, essaie plutôt un fichier de ton PC. |
| Le texte est difficile à lire | Monte **Assombrir l'image** ou **Opacité des panneaux** (ou `--fp-assombrir` / `--fp-opacite-panneaux` dans le thème). |
| Certaines zones restent opaques après une mise à jour de Discord | Discord renomme parfois ses variables de couleur. Le thème devra être mis à jour. |
| Je veux tout enlever | Désactive le plugin ou le thème. Pour retirer BetterDiscord, relance l'installateur et choisis **Uninstall**. |

## À savoir

- Ça marche uniquement sur **Discord pour ordinateur** (Windows, macOS, Linux). L'application mobile ne peut pas être modifiée.
- Les mods comme BetterDiscord et Vencord sont **contraires aux conditions d'utilisation de Discord**. En pratique, les bannissements pour un simple thème ou des plugins visuels sont très rares, mais le risque n'est pas nul.
- Le fond d'écran n'est visible que **pour toi**. Les autres utilisateurs voient Discord normalement.
