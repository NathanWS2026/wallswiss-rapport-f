// ============================================================
// FORMULAIRE LPP — Remplissage du PDF officiel SF-F5-FR
// "Recherche d'avoirs de la prévoyance professionnelle"
// (Centrale du 2e pilier / Fonds de garantie LPP)
// ============================================================
//
// POURQUOI CE FICHIER ?
// Votre code actuel (PreviewR1.handleDownloadPDF) génère un PDF
// custom à partir de slides React avec html2canvas + jsPDF.
// Il NE TOUCHE PAS au fichier SF-F5-FR.pdf.
//
// De plus, le PDF officiel n'a aucun champ AcroForm interactif
// (vérifié : c'est un PDF "à plat"). La seule façon de le remplir
// est de SUPERPOSER du texte à des coordonnées (x, y) précises
// au-dessus du PDF original — c'est ce que fait pdf-lib ci-dessous.
//
// INSTALLATION
//   npm install pdf-lib
// (ou via CDN : voir requirePdfLib() plus bas)
//
// PLACEMENT DU PDF ORIGINAL
// Placez SF-F5-FR.pdf dans /public/ de votre app
// → accessible via fetch("/SF-F5-FR.pdf")
//
// USAGE
//   import { genererFormulaireLPP } from "./FormulaireLPP";
//   await genererFormulaireLPP(data.client);
// ============================================================

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Hauteur d'une page A4 en points (origine pdf-lib = bas-gauche)
const PAGE_H = 841.89;
// Conversion : top (depuis le haut, comme dans Figma/PDF reader)
// → y (depuis le bas, comme dans pdf-lib)
const y = (top) => PAGE_H - top - 2;

// X de départ pour tous les champs texte (cohérent sur les 3 pages)
const X_FIELD = 340;

// ────────────────────────────────────────────────────────────
// Mapping des champs : { dataKey, page, x, y, maxLen }
// (positions calibrées sur SF-F5-FR_07-2021)
// ────────────────────────────────────────────────────────────
const champsPage1 = (c) => [
  // Cases à cocher "La demande concerne" — case "moi-même" (~ x=343, top=239)
  // Pour cocher, on dessine une croix au lieu d'écrire un texte (voir cocherCase ci-dessous)
  // Section 1 — Informations de la personne
  { text: c.nom || "",                        x: X_FIELD, y: y(411.1) }, // Nom
  { text: c.nomNaissance || "",               x: X_FIELD, y: y(438.9) }, // 2e nom (nom de naissance)
  { text: c.autresNoms || "",                 x: X_FIELD, y: y(466.8) }, // Autres noms
  { text: c.prenom || "",                     x: X_FIELD, y: y(510.3) }, // Prénom
  { text: c.deuxiemePrenom || "",             x: X_FIELD, y: y(538.2) }, // 2e prénom
  { text: c.autresPrenoms || "",              x: X_FIELD, y: y(565.7) }, // Autres prénoms
  { text: c.dateNaissance || "",              x: X_FIELD, y: y(609.2) }, // Date naissance
  { text: c.avsNumero || "",                  x: X_FIELD, y: y(637.1) }, // N° AVS
  // Adresse multi-lignes (4 cases empilées, ~24pt entre chaque)
  { text: (c.adresseLignes?.[0]) || c.adresse || "",  x: X_FIELD, y: y(677.3) },
  { text: (c.adresseLignes?.[1]) || "",       x: X_FIELD, y: y(701.3) },
  { text: (c.adresseLignes?.[2]) || "",       x: X_FIELD, y: y(725.3) },
  { text: (c.adresseLignes?.[3]) || "",       x: X_FIELD, y: y(749.3) },
  { text: c.telephoneEmail || c.email || "",  x: X_FIELD, y: y(776.7) }, // Tél / e-mail
];

const champsPage2 = (c) => [
  // Section 2 — Remarques (zone multi-lignes, top ≈ 60→320)
  { text: c.remarques || "",                  x: X_FIELD, y: y(75) },
  // Section 3 — Confirmation
  { text: c.lieuDate || "",                   x: X_FIELD, y: y(421.6) }, // Lieu et date
  // Signature : on ne pré-remplit pas (le client signe à la main)
];

// Page 3 — uniquement en cas de décès
const champsPage3 = (c) => {
  if (!c.estDeces) return [];
  return [
    { text: c.dateDeces || "",                x: X_FIELD, y: y(90.7) },
    { text: c.survivant?.nom || "",           x: X_FIELD, y: y(150.8) },
    { text: c.survivant?.nomNaissance || "",  x: X_FIELD, y: y(178.7) },
    { text: c.survivant?.prenom || "",        x: X_FIELD, y: y(217.8) },
    { text: c.survivant?.deuxiemePrenom || "",x: X_FIELD, y: y(245.7) },
    { text: c.survivant?.dateNaissance || "", x: X_FIELD, y: y(284.9) },
    { text: c.survivant?.degreParente || "",  x: X_FIELD, y: y(312.7) },
    { text: c.survivant?.adresse?.[0] || "",  x: X_FIELD, y: y(350.8) },
    { text: c.survivant?.adresse?.[1] || "",  x: X_FIELD, y: y(374.8) },
    { text: c.survivant?.adresse?.[2] || "",  x: X_FIELD, y: y(398.8) },
    { text: c.survivant?.adresse?.[3] || "",  x: X_FIELD, y: y(422.8) },
    { text: c.survivant?.telephoneEmail || "",x: X_FIELD, y: y(442.6) },
  ];
};

// ────────────────────────────────────────────────────────────
// Cocher une case (croix au-dessus de la case existante)
// Coordonnées des cases (centre approximatif)
// ────────────────────────────────────────────────────────────
const COCHES = {
  moiMeme:     { page: 0, top: 240, x: 348 }, // "moi-même (seulement pages 1 et 2)"
  divorce:     { page: 0, top: 270, x: 348 },
  autrePersonne: { page: 0, top: 283, x: 348 },
  deces:       { page: 0, top: 297, x: 348 },
};

function cocherCase(page, font, cle) {
  const pos = COCHES[cle];
  if (!pos) return;
  // Dessiner une croix légère
  page.drawText("X", {
    x: pos.x,
    y: y(pos.top),
    size: 11,
    font,
    color: rgb(0.05, 0.15, 0.35),
  });
}

// ────────────────────────────────────────────────────────────
// Adaptateur : prend le `data.client` de votre module retraite
// et le transforme en structure attendue par le remplissage.
// ────────────────────────────────────────────────────────────
export function adapterClientPourLPP(client) {
  // Découpe l'adresse en lignes (max 4)
  const adresseLignes = (client.adresse || "")
    .split(/[,\n]/)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  return {
    nom: (client.nom || "").toUpperCase(),
    nomNaissance: client.nomNaissance || "",
    autresNoms: client.autresNoms || "",
    prenom: client.prenom || "",
    deuxiemePrenom: client.deuxiemePrenom || "",
    autresPrenoms: client.autresPrenoms || "",
    dateNaissance: client.dateNaissance || "",
    avsNumero: client.avsNumero || "",
    adresse: client.adresse || "",
    adresseLignes,
    telephoneEmail: [client.telephone, client.email].filter(Boolean).join(" / "),
    // Cases à cocher
    typeDemande: client.typeDemande || "moiMeme",
    // Page 2
    remarques: client.remarquesLPP || "",
    lieuDate: client.lieuDateSignature || `${client.domicileFiscal || ""}, ${new Date().toLocaleDateString("fr-CH")}`,
    // Page 3 (décès)
    estDeces: !!client.estDeces,
    dateDeces: client.dateDeces || "",
    survivant: client.survivant || null,
  };
}

// ────────────────────────────────────────────────────────────
// FONCTION PRINCIPALE
// Génère le PDF rempli et déclenche le téléchargement.
// ────────────────────────────────────────────────────────────
export async function genererFormulaireLPP(client, options = {}) {
  const {
    pdfTemplateUrl = "/SF-F5-FR.pdf",
    nomFichier = `SF-F5-FR_${(client.nom || "Client").replace(/\s+/g, "_")}.pdf`,
    telecharger = true,
  } = options;

  // 1) Charger le PDF original
  const existingPdfBytes = await fetch(pdfTemplateUrl).then(r => {
    if (!r.ok) throw new Error(`Impossible de charger ${pdfTemplateUrl} : HTTP ${r.status}`);
    return r.arrayBuffer();
  });

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  // 2) Adapter les données
  const c = adapterClientPourLPP(client);

  // 3) Cocher la bonne case
  cocherCase(pages[0], font, c.typeDemande);

  // 4) Remplir page par page
  const remplirPage = (page, champs) => {
    for (const f of champs) {
      if (!f.text) continue;
      page.drawText(String(f.text), {
        x: f.x,
        y: f.y,
        size: 10,
        font,
        color: rgb(0.05, 0.15, 0.35), // bleu marine sombre
      });
    }
  };

  remplirPage(pages[0], champsPage1(c));
  remplirPage(pages[1], champsPage2(c));
  remplirPage(pages[2], champsPage3(c));

  // 5) Sauvegarder
  const pdfBytes = await pdfDoc.save();

  if (telecharger) {
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomFichier;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Retourne aussi les bytes (utile pour envoi par webhook/email)
  return pdfBytes;
}

// ────────────────────────────────────────────────────────────
// VERSION BASE64 (pour envoi par votre webhook email existant)
// ────────────────────────────────────────────────────────────
export async function genererFormulaireLPPBase64(client, options = {}) {
  const bytes = await genererFormulaireLPP(client, { ...options, telecharger: false });
  // Convert Uint8Array → base64
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// ============================================================
// INTÉGRATION DANS VOTRE MODULE RetraiteR1Module
// ============================================================
//
// 1) Placez SF-F5-FR.pdf dans /public/SF-F5-FR.pdf
// 2) npm install pdf-lib
// 3) Dans RetraiteR1Module.jsx, importez :
//      import { genererFormulaireLPP } from "./FormulaireLPP";
//
// 4) Ajoutez un bouton dans le dashboard ou la preview, par ex :
//
//      <button
//        style={S.btnS}
//        onClick={() => genererFormulaireLPP(planif.client)}
//      >
//        Générer formulaire LPP "Recherche d'avoirs"
//      </button>
//
// 5) Si certains champs ne tombent pas exactement au bon endroit,
//    ajustez le paramètre `top` dans champsPage1 / champsPage2 /
//    champsPage3 ci-dessus (1 point = 1/72ème de pouce ≈ 0.35 mm).
//
// CALIBRAGE FIN — Pour ajuster, modifiez la constante `y(NNN)`
// où NNN est la position du label depuis le haut. Pour descendre
// un champ, augmentez NNN ; pour le monter, diminuez NNN.
//
// ============================================================