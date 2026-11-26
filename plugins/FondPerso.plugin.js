/**
 * @name FondPerso
 * @author recomp
 * @description Mets ton propre fond d'écran sur Discord (lien d'image ou fichier de ton PC), avec flou, assombrissement et transparence réglables depuis les paramètres du plugin.
 * @version 1.0.0
 */

"use strict";

const NOM = "FondPerso";
const STYLE_REGLAGES = "FondPerso-reglages";
const STYLE_IMAGE = "FondPerso-image";
const TAILLE_MAX_FICHIER = 10 * 1024 * 1024; // 10 Mo

const DEGRADE_DEMO = "linear-gradient(135deg, #3a1c71 0%, #d76d77 55%, #ffaf7b 100%)";

const DEFAUTS = {
    image: "",            // lien https://… ou data:image/… (fichier local), vide = dégradé de démo
    flou: 0,              // en pixels
    assombrir: 35,        // en %
    opacitePanneaux: 35,  // en %
    ajustement: "cover"   // cover | contain | stretch | tile
};

const AJUSTEMENTS = {
    cover: {label: "Remplir l'écran", taille: "cover", repetition: "no-repeat"},
    contain: {label: "Image entière", taille: "contain", repetition: "no-repeat"},
    stretch: {label: "Étirer", taille: "100% 100%", repetition: "no-repeat"},
    tile: {label: "Mosaïque", taille: "auto", repetition: "repeat"}
};

// Même mécanique que themes/FondPerso.theme.css
const REGLES_CSS = `
.theme-dark, .theme-darker, .theme-midnight { --fp-teinte: 0 0 0; }
.theme-light { --fp-teinte: 255 255 255; }

html { background: #000 !important; }
body, #app-mount { background: transparent !important; }
body::before {
    content: "";
    position: fixed;
    inset: calc(var(--fp-flou) * -2);
    z-index: -1;
    pointer-events: none;
    background-image: var(--fp-image);
    background-position: var(--fp-position);
    background-size: var(--fp-taille);
    background-repeat: var(--fp-repetition);
    filter: blur(var(--fp-flou)) brightness(calc(1 - var(--fp-assombrir)));
}

:is(.theme-dark, .theme-light, .theme-darker, .theme-midnight) {
    --background-base-lowest: transparent !important;
    --background-tertiary: transparent !important;
    --bg-base-tertiary: transparent !important;

    --background-base-lower: rgb(var(--fp-teinte) / var(--fp-opacite-panneaux)) !important;
    --background-secondary: rgb(var(--fp-teinte) / var(--fp-opacite-panneaux)) !important;
    --background-secondary-alt: rgb(var(--fp-teinte) / var(--fp-opacite-panneaux)) !important;
    --bg-base-secondary: rgb(var(--fp-teinte) / var(--fp-opacite-panneaux)) !important;

    --background-base-low: rgb(var(--fp-teinte) / calc(var(--fp-opacite-panneaux) * 0.5)) !important;
    --background-primary: rgb(var(--fp-teinte) / calc(var(--fp-opacite-panneaux) * 0.5)) !important;
    --bg-base-primary: rgb(var(--fp-teinte) / calc(var(--fp-opacite-panneaux) * 0.5)) !important;
    --chat-background-default: rgb(var(--fp-teinte) / calc(var(--fp-opacite-panneaux) * 0.5)) !important;
}
`;

const CSS_PANNEAU = `
.fp-panneau { display: flex; flex-direction: column; gap: 18px; color: var(--text-default, #dbdee1); font-size: 14px; }
.fp-titre { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-muted, #949ba4); margin-bottom: 8px; }
.fp-apercu { height: 150px; border-radius: 8px; background-color: #000; background-position: center; background-size: cover; border: 1px solid var(--border-subtle, #3f4147); }
.fp-ligne { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.fp-champ { flex: 1; min-width: 200px; padding: 9px 10px; border-radius: 6px; font-size: 14px; color: var(--text-default, #dbdee1); background: var(--input-background-default, #1e1f22); border: 1px solid var(--input-border-default, #3f4147); outline: none; }
.fp-champ:focus { border-color: var(--brand-500, #5865f2); }
.fp-bouton { padding: 8px 14px; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; color: #fff; background: var(--brand-500, #5865f2); }
.fp-bouton:hover { filter: brightness(1.1); }
.fp-bouton.fp-secondaire { color: var(--text-default, #dbdee1); background: var(--background-mod-strong, #4e5058); }
.fp-note { font-size: 12px; color: var(--text-muted, #949ba4); margin-top: 6px; }
.fp-curseur-entete { display: flex; justify-content: space-between; margin-bottom: 6px; }
.fp-valeur { font-variant-numeric: tabular-nums; color: var(--text-strong, #f2f3f5); }
.fp-curseur { width: 100%; accent-color: var(--brand-500, #5865f2); }
.fp-choix { padding: 8px 10px; border-radius: 6px; font-size: 14px; color: var(--text-default, #dbdee1); background: var(--input-background-default, #1e1f22); border: 1px solid var(--input-border-default, #3f4147); }
`;

function el(tag, props = {}, ...enfants) {
    const noeud = document.createElement(tag);
    for (const [cle, valeur] of Object.entries(props)) {
        if (cle.startsWith("on")) noeud.addEventListener(cle.slice(2).toLowerCase(), valeur);
        else if (cle === "className") noeud.className = valeur;
        else noeud.setAttribute(cle, valeur);
    }
    for (const enfant of enfants) noeud.append(enfant);
    return noeud;
}

// Valeur CSS de l'image : url("…") échappée, ou dégradé de démo si aucune image
function valeurImage(image) {
    if (!image) return DEGRADE_DEMO;
    const echappee = image.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/[\r\n]/g, "");
    return `url("${echappee}")`;
}

function lienValide(texte) {
    return /^https?:\/\/\S+$/i.test(texte) || /^data:image\//i.test(texte);
}

module.exports = class FondPerso {
    constructor(meta) {
        this.meta = meta;
        this.reglages = {...DEFAUTS};
        this.minuteurSauvegarde = null;
    }

    start() {
        const sauvegarde = BdApi.Data.load(NOM, "reglages");
        this.reglages = {...DEFAUTS, ...(sauvegarde || {})};
        if (!AJUSTEMENTS[this.reglages.ajustement]) this.reglages.ajustement = DEFAUTS.ajustement;
        this.appliquerImage();
        this.appliquerReglages();
        if (!sauvegarde) {
            BdApi.UI.showToast("FondPerso activé : choisis ton image dans les paramètres du plugin ⚙️", {type: "info", timeout: 7000});
        }
    }

    stop() {
        clearTimeout(this.minuteurSauvegarde);
        BdApi.DOM.removeStyle(STYLE_REGLAGES);
        BdApi.DOM.removeStyle(STYLE_IMAGE);
    }

    sauvegarder() {
        clearTimeout(this.minuteurSauvegarde);
        this.minuteurSauvegarde = setTimeout(() => BdApi.Data.save(NOM, "reglages", this.reglages), 400);
    }

    // L'image (parfois plusieurs Mo) est dans sa propre balise <style> :
    // bouger un curseur ne la recharge pas.
    appliquerImage() {
        BdApi.DOM.addStyle(STYLE_IMAGE, `:root { --fp-image: ${valeurImage(this.reglages.image)}; }`);
    }

    appliquerReglages() {
        const r = this.reglages;
        const ajustement = AJUSTEMENTS[r.ajustement];
        const variables = `:root {
    --fp-flou: ${Number(r.flou)}px;
    --fp-assombrir: ${Number(r.assombrir) / 100};
    --fp-opacite-panneaux: ${Number(r.opacitePanneaux) / 100};
    --fp-position: center;
    --fp-taille: ${ajustement.taille};
    --fp-repetition: ${ajustement.repetition};
}`;
        BdApi.DOM.addStyle(STYLE_REGLAGES, variables + REGLES_CSS);
    }

    changerImage(image) {
        this.reglages.image = image;
        this.appliquerImage();
        this.sauvegarder();
    }

    getSettingsPanel() {
        const apercu = el("div", {className: "fp-apercu"});
        const majApercu = () => {
            apercu.style.backgroundImage = valeurImage(this.reglages.image);
        };
        majApercu();

        // --- Image ---
        const champLien = el("input", {
            className: "fp-champ",
            type: "text",
            placeholder: "https://i.imgur.com/ton-image.png"
        });
        champLien.value = this.reglages.image.startsWith("data:") ? "" : this.reglages.image;

        const validerLien = () => {
            const lien = champLien.value.trim();
            if (!lien) return;
            if (!lienValide(lien)) {
                BdApi.UI.showToast("Ce n'est pas un lien d'image valide (il doit commencer par https://)", {type: "error"});
                return;
            }
            this.changerImage(lien);
            majApercu();
            BdApi.UI.showToast("Fond d'écran appliqué", {type: "success"});
        };
        champLien.addEventListener("keydown", e => {
            if (e.key === "Enter") validerLien();
        });

        const selecteurFichier = el("input", {type: "file", accept: "image/*", style: "display:none"});
        selecteurFichier.addEventListener("change", () => {
            const fichier = selecteurFichier.files && selecteurFichier.files[0];
            selecteurFichier.value = "";
            if (!fichier) return;
            if (fichier.size > TAILLE_MAX_FICHIER) {
                BdApi.UI.showToast("Image trop lourde (10 Mo maximum)", {type: "error"});
                return;
            }
            const lecteur = new FileReader();
            lecteur.onload = () => {
                this.changerImage(String(lecteur.result));
                champLien.value = "";
                majApercu();
                BdApi.UI.showToast(`« ${fichier.name} » appliqué`, {type: "success"});
            };
            lecteur.onerror = () => BdApi.UI.showToast("Impossible de lire ce fichier", {type: "error"});
            lecteur.readAsDataURL(fichier);
        });

        const sectionImage = el("div", {},
            el("div", {className: "fp-titre"}, "Image de fond"),
            apercu,
            el("div", {className: "fp-ligne", style: "margin-top:10px"},
                champLien,
                el("button", {className: "fp-bouton", onClick: validerLien}, "Appliquer le lien")
            ),
            el("div", {className: "fp-ligne", style: "margin-top:8px"},
                el("button", {className: "fp-bouton", onClick: () => selecteurFichier.click()}, "Choisir une image sur mon PC…"),
                el("button", {
                    className: "fp-bouton fp-secondaire",
                    onClick: () => {
                        this.changerImage("");
                        champLien.value = "";
                        majApercu();
                    }
                }, "Retirer l'image"),
                selecteurFichier
            ),
            el("div", {className: "fp-note"},
                "Évite les liens d'images Discord : ils expirent au bout de quelques heures. Préfère imgur ou un fichier de ton PC. Les GIF animés fonctionnent."
            )
        );

        // --- Curseurs ---
        const curseur = (cle, titre, min, max, unite) => {
            const valeur = el("span", {className: "fp-valeur"}, `${this.reglages[cle]} ${unite}`);
            const entree = el("input", {className: "fp-curseur", type: "range", min: String(min), max: String(max), step: "1"});
            entree.value = String(this.reglages[cle]);
            entree.addEventListener("input", () => {
                this.reglages[cle] = Number(entree.value);
                valeur.textContent = `${entree.value} ${unite}`;
                this.appliquerReglages();
            });
            entree.addEventListener("change", () => this.sauvegarder());
            return {
                noeud: el("div", {}, el("div", {className: "fp-curseur-entete"}, el("span", {}, titre), valeur), entree),
                remettre: () => {
                    entree.value = String(this.reglages[cle]);
                    valeur.textContent = `${this.reglages[cle]} ${unite}`;
                }
            };
        };

        const curseurs = [
            curseur("flou", "Flou de l'image", 0, 30, "px"),
            curseur("assombrir", "Assombrir l'image (lisibilité du texte)", 0, 90, "%"),
            curseur("opacitePanneaux", "Opacité des panneaux", 0, 100, "%")
        ];

        // --- Ajustement ---
        const choixAjustement = el("select", {className: "fp-choix"},
            ...Object.entries(AJUSTEMENTS).map(([cle, a]) => el("option", {value: cle}, a.label))
        );
        choixAjustement.value = this.reglages.ajustement;
        choixAjustement.addEventListener("change", () => {
            this.reglages.ajustement = choixAjustement.value;
            this.appliquerReglages();
            this.sauvegarder();
        });

        const reinitialiser = el("button", {
            className: "fp-bouton fp-secondaire",
            onClick: () => {
                const image = this.reglages.image;
                this.reglages = {...DEFAUTS, image};
                curseurs.forEach(c => c.remettre());
                choixAjustement.value = this.reglages.ajustement;
                this.appliquerReglages();
                this.sauvegarder();
                BdApi.UI.showToast("Réglages réinitialisés (l'image est conservée)", {type: "info"});
            }
        }, "Réinitialiser les réglages");

        return el("div", {className: "fp-panneau"},
            el("style", {}, CSS_PANNEAU),
            sectionImage,
            el("div", {},
                el("div", {className: "fp-titre"}, "Réglages"),
                el("div", {style: "display:flex;flex-direction:column;gap:14px"}, ...curseurs.map(c => c.noeud))
            ),
            el("div", {className: "fp-ligne"},
                el("span", {}, "Ajustement de l'image :"),
                choixAjustement
            ),
            el("div", {}, reinitialiser)
        );
    }
};
