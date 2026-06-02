// ============================================================
// FormulaireLPP.jsx — v3
// Remplissage du PDF officiel SF-F5-FR + utilitaires.
// Coordonnées CALIBRÉES par détection d'image (OpenCV)
// sur le PDF officiel rendu à 200 DPI.
// ============================================================
//
// EXPORTS PRINCIPAUX :
//   - genererSFF5Bytes(client, opts)  → Uint8Array du SF-F5 rempli
//   - combinerPDFs([bytes1, bytes2])  → fusionne plusieurs PDFs
//   - telechargerPDF(bytes, nom)      → déclenche le téléchargement
//   - bytesToBlobUrl(bytes)           → URL pour <iframe>
//
// PRÉREQUIS :
//   - npm install pdf-lib
//   - public/SF-F5-FR.pdf accessible à fetch("/SF-F5-FR.pdf")
// ============================================================

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE_H = 841.89;

// Conversion: centre vertical d'une case (mesuré depuis le haut)
// → y baseline pdf-lib pour que le texte soit centré dans la case.
// Texte baseline = centre - 3pt (texte rendu 3pt au-dessus de la baseline visuellement).
const y = (centerTop) => PAGE_H - centerTop - 3;

// X de départ du texte : marge de 6pt à gauche de la case (cases commencent à x=328)
const X_FIELD = 334;

// Couleur du texte (bleu marine sombre, lisible sur PDF clair)
const INK = rgb(0.05, 0.15, 0.35);

// ────────────────────────────────────────────────────────────
// PAGE 1 — Coordonnées des centres mesurées par OpenCV
// ────────────────────────────────────────────────────────────
const CENTRES_P1 = {
  nom1:             411.9,
  nom2:             439.8,
  autresNoms:       467.7,
  prenom1:          511.1,
  prenom2:          539.0,
  autresPrenoms:    566.5,
  dateNaissance:    610.0,
  avsNumero:        637.9,
  adresse1:         676.3,
  adresse2:         700.2,
  adresse3:         724.1,
  adresse4:         747.9,
  telephoneEmail:   786.9,
};

// PAGE 2
const CENTRES_P2 = {
  remarquesLigne1:  73.6,   // 1ère ligne de la zone Remarques
  remarquesLigne2:  97.5,
  remarquesLigne3: 121.3,
  remarquesLigne4: 145.2,
  remarquesLigne5: 169.2,
  remarquesLigne6: 192.9,
  remarquesLigne7: 216.8,
  lieuDate:         422.3,
  // Signature: non remplie (signée à la main / Yousign)
};

// PAGE 3 (décès)
const CENTRES_P3 = {
  dateDeces:        91.6,
  nom1:            151.7,
  nom2:            179.6,
  prenom1:         218.8,
  prenom2:         246.5,
  dateNaissance:   285.8,
  degreParente:    313.7,
  adresse1:        352.0,
  adresse2:        375.7,
  adresse3:        399.7,
  adresse4:        423.6,
  telephoneEmail:  462.8,
};

// ────────────────────────────────────────────────────────────
// Checkboxes — centres mesurés par OpenCV (carré ~11pt)
// ────────────────────────────────────────────────────────────
const COCHES = {
  moiMeme:       { centerX: 332.2, centerTop: 241.9 },
  divorce:       { centerX: 332.2, centerTop: 271.7 },
  autrePersonne: { centerX: 332.2, centerTop: 285.8 },
  deces:         { centerX: 332.2, centerTop: 299.8 },
};

// ────────────────────────────────────────────────────────────
// Construction des listes de champs par page
// ────────────────────────────────────────────────────────────
const champsPage1 = (c) => [
  { text: c.nom,                  x: X_FIELD, y: y(CENTRES_P1.nom1) },
  { text: c.nomNaissance,         x: X_FIELD, y: y(CENTRES_P1.nom2) },
  { text: c.autresNoms,           x: X_FIELD, y: y(CENTRES_P1.autresNoms) },
  { text: c.prenom,               x: X_FIELD, y: y(CENTRES_P1.prenom1) },
  { text: c.deuxiemePrenom,       x: X_FIELD, y: y(CENTRES_P1.prenom2) },
  { text: c.autresPrenoms,        x: X_FIELD, y: y(CENTRES_P1.autresPrenoms) },
  { text: c.dateNaissance,        x: X_FIELD, y: y(CENTRES_P1.dateNaissance) },
  { text: c.avsNumero,            x: X_FIELD, y: y(CENTRES_P1.avsNumero) },
  { text: c.adresseLignes?.[0],   x: X_FIELD, y: y(CENTRES_P1.adresse1) },
  { text: c.adresseLignes?.[1],   x: X_FIELD, y: y(CENTRES_P1.adresse2) },
  { text: c.adresseLignes?.[2],   x: X_FIELD, y: y(CENTRES_P1.adresse3) },
  { text: c.adresseLignes?.[3],   x: X_FIELD, y: y(CENTRES_P1.adresse4) },
  { text: c.telephoneEmail,       x: X_FIELD, y: y(CENTRES_P1.telephoneEmail) },
];

const champsPage2 = (c) => [
  { text: c.remarques,            x: X_FIELD, y: y(CENTRES_P2.remarquesLigne1) },
  { text: c.lieuDate,             x: X_FIELD, y: y(CENTRES_P2.lieuDate) },
];

const champsPage3 = (c) => {
  if (!c.estDeces || !c.survivant) return [];
  const s = c.survivant;
  return [
    { text: c.dateDeces,          x: X_FIELD, y: y(CENTRES_P3.dateDeces) },
    { text: s.nom,                x: X_FIELD, y: y(CENTRES_P3.nom1) },
    { text: s.nomNaissance,       x: X_FIELD, y: y(CENTRES_P3.nom2) },
    { text: s.prenom,             x: X_FIELD, y: y(CENTRES_P3.prenom1) },
    { text: s.deuxiemePrenom,     x: X_FIELD, y: y(CENTRES_P3.prenom2) },
    { text: s.dateNaissance,      x: X_FIELD, y: y(CENTRES_P3.dateNaissance) },
    { text: s.degreParente,       x: X_FIELD, y: y(CENTRES_P3.degreParente) },
    { text: s.adresse?.[0],       x: X_FIELD, y: y(CENTRES_P3.adresse1) },
    { text: s.adresse?.[1],       x: X_FIELD, y: y(CENTRES_P3.adresse2) },
    { text: s.adresse?.[2],       x: X_FIELD, y: y(CENTRES_P3.adresse3) },
    { text: s.adresse?.[3],       x: X_FIELD, y: y(CENTRES_P3.adresse4) },
    { text: s.telephoneEmail,     x: X_FIELD, y: y(CENTRES_P3.telephoneEmail) },
  ];
};

// ────────────────────────────────────────────────────────────
// Cocher une case (croix "X" centrée sur la case mesurée)
// ────────────────────────────────────────────────────────────
function cocherCase(page, font, cle) {
  const pos = COCHES[cle];
  if (!pos) return;
  // "X" en Helvetica 11 ≈ 7.3pt de large
  // → décaler de la moitié à gauche pour centrer
  const X_WIDTH = 7.3;
  page.drawText("X", {
    x: pos.centerX - X_WIDTH / 2,
    y: PAGE_H - pos.centerTop - 3,
    size: 11,
    font,
    color: INK,
  });
}

// ────────────────────────────────────────────────────────────
// Adaptateur : objet `client` (lppForm-like) → structure interne
// ────────────────────────────────────────────────────────────
export function adapterClientPourLPP(client) {
  // Découpe l'adresse en max 4 lignes (séparées par virgule, nouvelle ligne, etc.)
  // ou utilise un découpage manuel ville/pays
  let lignes;
  if (Array.isArray(client.adresseLignes)) {
    lignes = client.adresseLignes;
  } else {
    const parts = [
      client.adresse,
      [client.localite, client.pays].filter(Boolean).join(" "),
    ].filter(Boolean);
    lignes = parts;
  }
  const adresseLignes = (lignes || []).slice(0, 4);

  return {
    nom: (client.nom || "").toUpperCase(),
    nomNaissance: client.nomNaissance || "",
    autresNoms: client.autresNoms || "",
    prenom: client.prenom || "",
    deuxiemePrenom: client.deuxiemePrenom || "",
    autresPrenoms: client.autresPrenoms || "",
    dateNaissance: client.dateNaissance || "",
    avsNumero: client.avsNumero || client.avs || "",
    adresseLignes,
    telephoneEmail: [client.telephone, client.email].filter(Boolean).join(" / "),
    typeDemande: client.typeDemande || "moiMeme",
    remarques: client.remarques || "",
    lieuDate: client.lieuDate
      || `${client.localite || ""}${client.localite ? ", " : ""}${new Date().toLocaleDateString("fr-CH")}`,
    estDeces: !!client.estDeces,
    dateDeces: client.dateDeces || "",
    survivant: client.survivant || null,
  };
}

// ────────────────────────────────────────────────────────────
// Génère le SF-F5 rempli, retourne Uint8Array (sans téléchargement)
// ────────────────────────────────────────────────────────────
export async function genererSFF5Bytes(client, options = {}) {
  const { pdfTemplateUrl = "/SF-F5-FR.pdf" } = options;

  const existingPdfBytes = await fetch(pdfTemplateUrl).then(r => {
    if (!r.ok) throw new Error(`Impossible de charger ${pdfTemplateUrl} (HTTP ${r.status})`);
    return r.arrayBuffer();
  });

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  const c = adapterClientPourLPP(client);
  cocherCase(pages[0], font, c.typeDemande);

  const remplirPage = (page, champs) => {
    for (const f of champs) {
      if (!f.text) continue;
      page.drawText(String(f.text), {
        x: f.x,
        y: f.y,
        size: 10,
        font,
        color: INK,
      });
    }
  };

  remplirPage(pages[0], champsPage1(c));
  if (pages[1]) remplirPage(pages[1], champsPage2(c));
  if (pages[2]) remplirPage(pages[2], champsPage3(c));

  return await pdfDoc.save();
}

// ────────────────────────────────────────────────────────────
// Fusionne plusieurs PDFs en un seul
// ────────────────────────────────────────────────────────────
export async function combinerPDFs(pdfsByteArrays) {
  const merged = await PDFDocument.create();
  for (const bytes of pdfsByteArrays) {
    if (!bytes) continue;
    const src = await PDFDocument.load(bytes);
    const copiedPages = await merged.copyPages(src, src.getPageIndices());
    copiedPages.forEach((p) => merged.addPage(p));
  }
  return await merged.save();
}

// ────────────────────────────────────────────────────────────
// Téléchargement
// ────────────────────────────────────────────────────────────
export function telechargerPDF(bytes, filename = "document.pdf") {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// URL blob pour preview <iframe>
export function bytesToBlobUrl(bytes) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

// Base64 (pour envoi webhook)
export function bytesToBase64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

// Rétrocompat : génère + télécharge en un appel
export async function genererFormulaireLPP(client, options = {}) {
  const bytes = await genererSFF5Bytes(client, options);
  const nom = options.nomFichier
    || `SF-F5-FR_${(client.nom || "Client").replace(/\s+/g, "_")}.pdf`;
  telechargerPDF(bytes, nom);
  return bytes;
}
