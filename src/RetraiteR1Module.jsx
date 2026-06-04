import React, { useState, useEffect, useMemo } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, onSnapshot, deleteDoc } from "firebase/firestore";

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// ────────────────────── CONSTANTES DESIGN ──────────────────────
const C = {
  primary: "#692102",
  primaryDark: "#4D1801",
  gold: "#A59568",
  white: "#FFFFFF",
  black: "#1A1A1A",
  gray: "#6B7280",
  lightGray: "#F3F2EF",
  mediumGray: "#E5E3DE",
  darkGray: "#374151",
  swiss: "#DA291C",
  france: "#0055A4",
  ok: "#10B981",
  warn: "#F59E0B",
  bad: "#EF4444",
};

const LOGO_COLOR = "/favicon.png"; // logo couleur (rouge + jaune) — fonds clairs
const LOGO_WHITE = "/blanc.png";   // logo blanc — fonds foncés

// ────────────────────── LOGO ──────────────────────
// Utilise les fichiers fournis. variant="white" sur fonds foncés, "color" sur fonds clairs.
// Repli SVG (rouge/or) si l'image est introuvable, pour ne jamais avoir un logo invisible.
function Logo({ size = 32, variant = "color", style }) {
  const [err, setErr] = useState(false);
  const src = variant === "white" ? LOGO_WHITE : LOGO_COLOR;
  if (err) {
    const w = variant === "white" ? "#FFFFFF" : C.swiss;
    const s = variant === "white" ? "#FFFFFF" : C.gold;
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={{ display: "block", ...style }}>
        <path d="M12 16 L20 46 L28 26 L34 46 L44 16" stroke={w} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
        <path d="M52 20 C46 16 40 18 40 24 C40 30 52 30 52 36 C52 42 46 44 40 40" stroke={s} strokeWidth="5" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  return <img src={src} className="pdf-image" alt="WallSwiss" onError={() => setErr(true)} style={{ width: size, height: size, objectFit: "contain", display: "block", ...style }} />;
}

// ────────────────────── ICÔNES ──────────────────────
const Icons = {
  Check: ({ size = 16, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Alert: ({ size = 16, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>,
  Plus: ({ size = 16, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>,
  Trash: ({ size = 16, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Download: ({ size = 16, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
  Eye: ({ size = 16, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  Edit: ({ size = 16, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  ChevronRight: ({ size = 16, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevronLeft: ({ size = 16, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  Mail: ({ size = 16, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>,
  User: ({ size = 16, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Users: ({ size = 16, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

// ────────────────────── FORMATTERS ──────────────────────
const fmt = (n) => Number(n || 0).toLocaleString("fr-CH", { maximumFractionDigits: 0 }).replace(/’/g, "'");
const fmtEUR = (n) => Number(n || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 });

// Montant insécable : empêche que "CHF 2'520 /mois" se coupe en fin de ligne.
function Money({ value, prefix = "CHF", suffix = "", color, bold = false }) {
  return (
    <span style={{ whiteSpace: "nowrap", color, fontWeight: bold ? 800 : "inherit" }}>
      {prefix} {fmt(value)}{suffix ? " " + suffix : ""}
    </span>
  );
}

// Texte libre : préserve les retours à la ligne ET les espaces saisis dans les <textarea>.
function MultiLine({ text, style }) {
  if (!text) return null;
  return <span style={{ whiteSpace: "pre-line", ...style }}>{text}</span>;
}

// Part de la LPP prise en capital (0 → 1) en respectant le choix de sortie.
function partCapitalLPP(person) {
  const choix = person.lppChoixSortie || "Mixte";
  if (choix === "Capital") return 1;
  if (choix === "Rente") return 0;
  const p = Number(person.lppPartCapitalPct || 0) / 100;
  return Math.max(0, Math.min(1, p));
}

// ============================================================
// SECTION 1 — HELPERS DE PROJECTION (CŒUR DES CALCULS)
// ============================================================

// AVS Suisse — 13e rente 2026, anticipation, ajournement
function calcAVS(person, options = {}) {
  const annees = Number(person.avsAnneesCotisation || 0);
  const renteMaxBase = 2520; // CHF/mois 2026
  const renteMinBase = 1260;
  const tauxCompletion = Math.min(annees / 44, 1);

  let renteMensuelle;
  let source;
  if (person.avsRenteEstimee && Number(person.avsRenteEstimee) > 0) {
    renteMensuelle = Number(person.avsRenteEstimee);
    source = "Estimation client";
  } else {
    const revenuMoyen = Number(person.revenusBrut || 0);
    let renteBase = renteMinBase + (renteMaxBase - renteMinBase) * tauxCompletion;
    if (revenuMoyen > 0 && revenuMoyen < 88200) {
      renteBase = Math.max(renteMinBase, renteBase * (revenuMoyen / 88200));
    }
    renteMensuelle = Math.round(renteBase);
    source = "Estimation indicative";
  }

  const scenario = options.scenario || "normal";
  let coefficient = 1;
  let anneesShift = options.anneesShift || 0;
  if (scenario === "anticipe" && anneesShift > 0) {
    coefficient = 1 - 0.068 * anneesShift; // -6.8% / année anticipée
  } else if (scenario === "ajourne" && anneesShift > 0) {
    const taux = { 1: 0.052, 2: 0.108, 3: 0.171, 4: 0.241, 5: 0.315 };
    coefficient = 1 + (taux[anneesShift] || 0);
  }
  renteMensuelle = Math.round(renteMensuelle * coefficient);
  const treizieme = person.avs13eRente !== false ? renteMensuelle : 0;
  return {
    renteMensuelle,
    renteAnnuelle: renteMensuelle * 12 + treizieme,
    treizieme,
    tauxCompletion,
    source,
    coefficient,
    scenario,
    anneesShift,
  };
}

// LPP — Capitalisation & conversion. annees=0 si déjà à l'âge de départ (déblocage immédiat).
function calcLPP(person, ageDepart = 65) {
  const avoirActuel = Number(person.lppAvoirActuel || 0);
  const cotisationAnnuelle = Number(person.lppCotisationAnnuelle || 0);
  const tauxRendement = Number(person.lppTauxRendement || 1.25) / 100;
  const age = Number(person.age || 40);
  const annees = Math.max(0, ageDepart - age);

  let capitalAge65 = avoirActuel;
  if (annees > 0 && tauxRendement > 0) {
    capitalAge65 = avoirActuel * Math.pow(1 + tauxRendement, annees) +
                   cotisationAnnuelle * ((Math.pow(1 + tauxRendement, annees) - 1) / tauxRendement);
  } else if (annees > 0) {
    capitalAge65 = avoirActuel + cotisationAnnuelle * annees;
  }
  // Si déjà à l'âge de départ (annees === 0) : pas de capitalisation, capital = avoir actuel.
  if (person.lppCapitalProjete && Number(person.lppCapitalProjete) > 0) {
    capitalAge65 = Number(person.lppCapitalProjete);
  }
  const librePassage = Number(person.lppLibrePassage || 0);
  const lpProj = annees > 0 ? librePassage * Math.pow(1 + tauxRendement, annees) : librePassage;
  capitalAge65 += lpProj;
  const tauxConversion = Number(person.lppTauxConversion || 5.0) / 100;
  const renteAnnuelle = capitalAge65 * tauxConversion;
  return {
    capitalAge65: Math.round(capitalAge65),
    renteAnnuelle: Math.round(renteAnnuelle),
    renteMensuelle: Math.round(renteAnnuelle / 12),
    librePassageProj: Math.round(lpProj),
    tauxConversion: tauxConversion * 100,
    annees,
    immediat: annees === 0,
  };
}

// Rente LPP réellement perçue selon le choix rente/capital, et capital sorti.
function lppEffectif(person, ageDepart) {
  const lpp = calcLPP(person, ageDepart);
  const part = partCapitalLPP(person);
  return {
    ...lpp,
    partCapital: part,
    capitalSorti: Math.round(lpp.capitalAge65 * part),
    renteAnnuelleEff: Math.round(lpp.renteAnnuelle * (1 - part)),
    renteMensuelleEff: Math.round((lpp.renteAnnuelle * (1 - part)) / 12),
  };
}

// 3e Pilier
function calc3eP(person, ageDepart = 65) {
  const avoir3a = Number(person.troisPAvoir3a || 0);
  const cotisationAnnuelle = Number(person.troisPCotisationAnnuelle || 0);
  const tauxRendement = Number(person.troisPTauxRendement || 3) / 100;
  const age = Number(person.age || 40);
  const annees = Math.max(0, ageDepart - age);
  let capital3a = avoir3a;
  if (annees > 0 && tauxRendement > 0) {
    capital3a = avoir3a * Math.pow(1 + tauxRendement, annees) +
                cotisationAnnuelle * ((Math.pow(1 + tauxRendement, annees) - 1) / tauxRendement);
  } else if (annees > 0) {
    capital3a = avoir3a + cotisationAnnuelle * annees;
  }
  const avoir3b = Number(person.troisPAvoir3b || 0);
  const capital3b = annees > 0 ? avoir3b * Math.pow(1 + tauxRendement, annees) : avoir3b;
  return {
    capital3a: Math.round(capital3a),
    capital3b: Math.round(capital3b),
    capitalTotal: Math.round(capital3a + capital3b),
  };
}

// Impôt sur retrait en capital du 3e pilier (prestation en capital, imposition séparée).
function calc3ePImpot(capital3a, hypotheses) {
  const taux = Number(hypotheses.tauxImpotCapital3a || 6) / 100;
  return Math.round(capital3a * taux);
}

// Pensions françaises — décote / taux plein corrigés (réforme 2023)
function calcPensionsFR(person, options = {}) {
  const trimAcquis = Number(person.frTrimestresAcquis || 0);
  const trimRequis = Number(person.frTrimestresRequis || 172);
  const sam = Number(person.frSAM || 0);
  const scenario = options.scenario || "normal"; // "tot" | "taux_plein" | "normal"

  // Taux plein : on suppose l'attente jusqu'à validation (durée ou âge automatique 67 ans).
  const trimRetenus = scenario === "taux_plein" ? Math.max(trimAcquis, trimRequis) : trimAcquis;
  const trimManquants = Math.max(0, trimRequis - trimRetenus);

  // Décote : 1,25 % du taux plein par trimestre manquant, plafond 20 trimestres (-25%).
  const trimDecote = Math.min(20, trimManquants);
  const decote = scenario === "taux_plein" ? 0 : trimDecote * 0.0125;
  const tauxLiquidation = 0.50 * (1 - decote);
  // Proratisation par la durée d'assurance.
  const prorata = Math.min(1, trimRequis > 0 ? trimRetenus / trimRequis : 0);

  let pensionCnavAnnuelle = sam * tauxLiquidation * prorata;

  // Estimation RIS fournie : base "taux courant" ; rehaussée si scénario taux plein.
  if (person.frPensionCnavEstimee && Number(person.frPensionCnavEstimee) > 0) {
    const baseMensuelle = Number(person.frPensionCnavEstimee);
    if (scenario === "taux_plein" && trimAcquis > 0 && trimAcquis < trimRequis) {
      const decoteActuelle = Math.min(20, Math.max(0, trimRequis - trimAcquis)) * 0.0125;
      const tauxActuel = 0.50 * (1 - decoteActuelle);
      const facteur = tauxActuel > 0 ? 0.50 / tauxActuel : 1;
      pensionCnavAnnuelle = baseMensuelle * 12 * facteur;
    } else {
      pensionCnavAnnuelle = baseMensuelle * 12;
    }
  }

  // AGIRC-ARRCO : minoration temporaire -10% (3 ans) si liquidation sans taux plein.
  const points = Number(person.frPointsAgircArrco || 0);
  const valeurPoint = 1.4159;
  const coefAgirc = (scenario !== "taux_plein" && trimManquants > 0) ? 0.90 : 1;
  const pensionAgircAnnuelle = points * valeurPoint * coefAgirc;

  const totalAnnuel = pensionCnavAnnuelle + pensionAgircAnnuelle;
  return {
    pensionCnavAnnuelle: Math.round(pensionCnavAnnuelle),
    pensionCnavMensuelle: Math.round(pensionCnavAnnuelle / 12),
    pensionAgircAnnuelle: Math.round(pensionAgircAnnuelle),
    pensionAgircMensuelle: Math.round(pensionAgircAnnuelle / 12),
    totalAnnuel: Math.round(totalAnnuel),
    totalMensuel: Math.round(totalAnnuel / 12),
    tauxPlein: trimManquants === 0,
    decotePct: +(decote * 100).toFixed(2),
    trimManquants,
    scenario,
    coefAgirc,
  };
}

// Synthèse globale d'une personne — rente LPP cohérente avec le choix rente/capital
function calcSyntheseRetraite(person, hypotheses) {
  const ageDepart = Number(person.objAgeDepart || 65);
  const tauxChange = Number(hypotheses.tauxChangeEurChf || 0.95);
  let avsScenario = "normal"; let avsAnneesShift = 0;
  if (ageDepart < 65) { avsScenario = "anticipe"; avsAnneesShift = Math.min(2, 65 - ageDepart); }
  else if (ageDepart > 65) { avsScenario = "ajourne"; avsAnneesShift = Math.min(5, ageDepart - 65); }
  const avs = calcAVS(person, { scenario: avsScenario, anneesShift: avsAnneesShift });
  const lpp = calcLPP(person, ageDepart);
  const troisP = calc3eP(person, ageDepart);
  const pensionsFR = calcPensionsFR(person);
  const pensionsFRChfAnnuelle = pensionsFR.totalAnnuel * tauxChange;
  const pensionsFRChfMensuelle = pensionsFR.totalMensuel * tauxChange;
  const partCap = partCapitalLPP(person);
  const capitalLPPSorti = lpp.capitalAge65 * partCap;
  const renteLPPAjustee = lpp.renteAnnuelle * (1 - partCap);
  const revenuRenteAnnuel = avs.renteAnnuelle + lpp.renteAnnuelle + pensionsFRChfAnnuelle;
  const revenuRenteAjuste = avs.renteAnnuelle + renteLPPAjustee + pensionsFRChfAnnuelle;
  const capitalTotal = troisP.capitalTotal + capitalLPPSorti;
  const trainVie = Number(person.objTrainVie || 0);
  const objectifAnnuel = trainVie * 12;
  const ecart = objectifAnnuel - revenuRenteAjuste;
  const ecartPct = objectifAnnuel > 0 ? (ecart / objectifAnnuel) * 100 : 0;
  return {
    ageDepart, avs, lpp, troisP, pensionsFR, partCap,
    renteLPPAjusteeAnnuelle: Math.round(renteLPPAjustee),
    renteLPPAjusteeMensuelle: Math.round(renteLPPAjustee / 12),
    pensionsFRChfAnnuelle: Math.round(pensionsFRChfAnnuelle),
    pensionsFRChfMensuelle: Math.round(pensionsFRChfMensuelle),
    revenuRenteAnnuel: Math.round(revenuRenteAnnuel),
    revenuRenteMensuel: Math.round(revenuRenteAnnuel / 12),
    revenuRenteAjuste: Math.round(revenuRenteAjuste),
    revenuRenteAjusteMensuel: Math.round(revenuRenteAjuste / 12),
    capitalLPPSorti: Math.round(capitalLPPSorti),
    capitalTotal: Math.round(capitalTotal),
    objectifAnnuel: Math.round(objectifAnnuel),
    objectifMensuel: trainVie,
    ecart: Math.round(ecart),
    ecartMensuel: Math.round(ecart / 12),
    ecartPct: ecartPct.toFixed(1),
  };
}

// Synthèse consolidée du ménage (mode "commune")
function calcSyntheseMenage(data) {
  const a = calcSyntheseRetraite(data.client, data);
  const b = (data.isCouple && data.conjoint && data.conjoint.prenom) ? calcSyntheseRetraite(data.conjoint, data) : null;
  const add = (x, y) => Math.round((x || 0) + (y || 0));
  return {
    a, b,
    revenuRenteMensuel: add(a.revenuRenteAjusteMensuel, b ? b.revenuRenteAjusteMensuel : 0),
    avsMensuel: add(a.avs.renteMensuelle, b ? b.avs.renteMensuelle : 0),
    lppMensuel: add(a.renteLPPAjusteeMensuelle, b ? b.renteLPPAjusteeMensuelle : 0),
    frMensuel: add(a.pensionsFRChfMensuelle, b ? b.pensionsFRChfMensuelle : 0),
    capitalTotal: add(a.capitalTotal, b ? b.capitalTotal : 0),
    objectifMensuel: add(a.objectifMensuel, b ? b.objectifMensuel : 0),
    ecartMensuel: add(a.ecartMensuel, b ? b.ecartMensuel : 0),
  };
}

// ============================================================
// MODULES DIFFÉRENCIANTS
// ============================================================

// ─── Arbitrage santé / fiscalité — montants ANNUELS (sur 1 an) ───
function calcArbitrageSante(person, hypotheses) {
  const ageDepart = Number(person.objAgeDepart || 65);
  const ageFin = Number(person.objAgeFinConsommation || 90);
  const dureeRetraite = Math.max(1, ageFin - ageDepart);
  const tauxChange = Number(hypotheses.tauxChangeEurChf || 0.95);

  const avs = calcAVS(person);
  const lppE = lppEffectif(person, ageDepart);
  const pensionsFR = calcPensionsFR(person);
  const pensionsFRChf = pensionsFR.totalAnnuel * tauxChange;
  const renteAnnuelleTotale = avs.renteAnnuelle + lppE.renteAnnuelleEff + pensionsFRChf;

  const primeLAMal = Number(hypotheses.primeLAMalAnnuelle || 9600);
  const primeCMU = Number(hypotheses.primeCMUAnnuelle || 0);
  const tauxCSG = Number(hypotheses.tauxCSGCRDSCASA || 9.1) / 100;
  const cotCMU = Number(hypotheses.cotisationCMUSubsidiaire || 0);

  // Coûts ANNUELS
  const csgLAMal = pensionsFRChf * (tauxCSG * 0.3); // CSG limitée sur pension FR en LAMal
  const totalA = primeLAMal + csgLAMal;
  const csgB = renteAnnuelleTotale * tauxCSG;
  const totalB = primeCMU + cotCMU + csgB;
  const totalC = (totalA + totalB) / 2; // hybride : coût moyen annuel indicatif
  const totalD = primeLAMal + pensionsFRChf; // refus retraite FR : LAMal + perte de la pension FR (par an)

  const scenarios = [
    { id: "A", label: "LAMal maintenue", coutAnnuel: totalA, detail: "Prime LAMal + CSG limitée sur pension FR", recommandePour: "Patrimoine élevé, peu de pension FR" },
    { id: "B", label: "CMU + CSG/CRDS", coutAnnuel: totalB, detail: "CMU gratuite mais 9.1% sur toutes pensions", recommandePour: "Pensions globales faibles" },
    { id: "C", label: "Hybride (LAMal→CMU)", coutAnnuel: totalC, detail: "Coût annuel moyen sur la transition", recommandePour: "Compromis prudent" },
    { id: "D", label: "Refus retraite FR", coutAnnuel: totalD, detail: "LAMal + perte de la pension FR annuelle", recommandePour: "Très rares cas" },
  ].map((s) => ({ ...s, coutAnnuel: Math.round(s.coutAnnuel) }));

  const meilleur = scenarios.reduce((a, b) => (b.coutAnnuel < a.coutAnnuel ? b : a));
  const pire = scenarios.reduce((a, b) => (b.coutAnnuel > a.coutAnnuel ? b : a));
  const gainAnnuel = pire.coutAnnuel - meilleur.coutAnnuel;

  return {
    scenarios, meilleur, pire,
    gainAnnuel: Math.round(gainAnnuel),
    gainStrategie: Math.round(gainAnnuel * dureeRetraite), // cumul (pour le « gain total »)
    dureeRetraite, ageDepart, ageFin,
    hypotheses: { primeLAMal, primeCMU, tauxCSGCRDSCASA: tauxCSG * 100 },
  };
}

// ─── Double scénario retraite française : départ au plus tôt vs taux plein ───
function calcDoubleScenarioFR(person, hypotheses) {
  if (!person.frACarriereFrance) return null;
  const ageMinLegal = Number(person.frAgeMinLegal || 64);
  const ageTauxPlein = Number(person.frAgeTauxPlein || 67);
  const ageFin = Number(person.objAgeFinConsommation || 90);
  const tauxChange = Number(hypotheses.tauxChangeEurChf || 0.95);

  const totScenario = calcPensionsFR(person, { scenario: "tot" });
  const pleinScenario = calcPensionsFR(person, { scenario: "taux_plein" });

  const cumulTot = totScenario.totalAnnuel * Math.max(0, ageFin - ageMinLegal);
  const cumulPlein = pleinScenario.totalAnnuel * Math.max(0, ageFin - ageTauxPlein);
  const differentielCumule = cumulPlein - cumulTot;

  // Point mort : nombre d'années après le taux plein pour rattraper les années perçues en plus au plus tôt
  const ecartAnnuel = pleinScenario.totalAnnuel - totScenario.totalAnnuel;
  const dejaPercuTot = totScenario.totalAnnuel * Math.max(0, ageTauxPlein - ageMinLegal);
  const pointMortAns = ecartAnnuel > 0 ? Math.round(dejaPercuTot / ecartAnnuel) : null;

  return {
    tot: { ...totScenario, ageDepart: ageMinLegal, cumulEur: Math.round(cumulTot), cumulChf: Math.round(cumulTot * tauxChange) },
    plein: { ...pleinScenario, ageDepart: ageTauxPlein, cumulEur: Math.round(cumulPlein), cumulChf: Math.round(cumulPlein * tauxChange) },
    differentielCumuleEur: Math.round(differentielCumule),
    differentielCumuleChf: Math.round(differentielCumule * tauxChange),
    pointMortAge: pointMortAns != null ? ageTauxPlein + pointMortAns : null,
    recommandation: differentielCumule > 0 ? "taux_plein" : "tot",
  };
}

// ─── 3 scénarios de sortie LPP : 100% rente / 50-50 / 100% capital ───
function calc3ScenariosLPP(person, hypotheses) {
  const ageDepart = Number(person.objAgeDepart || 65);
  const ageFin = Number(person.objAgeFinConsommation || 90);
  const dureeRetraite = Math.max(1, ageFin - ageDepart);
  const lpp = calcLPP(person, ageDepart);
  const capital = lpp.capitalAge65;
  const tauxConv = (Number(person.lppTauxConversion || 5)) / 100;
  const renteAnnuellePleine = capital * tauxConv;

  const tauxImpotCapital = Number(hypotheses.tauxImpotCapitalLPP || 8) / 100;
  const tauxImpotRente = Number(hypotheses.tauxImpotRenteLPP || 25) / 100;

  const renteCumulee = renteAnnuellePleine * dureeRetraite;
  const impotsRente = renteCumulee * tauxImpotRente;
  const netRente = renteCumulee - impotsRente;

  const cap50 = capital * 0.5;
  const rente50Annuelle = (capital * 0.5) * tauxConv;
  const rente50Cumulee = rente50Annuelle * dureeRetraite;
  const impotCap50 = cap50 * tauxImpotCapital;
  const impotRente50 = rente50Cumulee * tauxImpotRente;
  const netMixte = (cap50 - impotCap50) + (rente50Cumulee - impotRente50);

  const impotCapTotal = capital * tauxImpotCapital;
  const netCapital = capital - impotCapTotal;

  return {
    capital,
    renteAnnuellePleine: Math.round(renteAnnuellePleine),
    dureeRetraite,
    scenarios: [
      { id: "rente", label: "100% Rente viagère", capitalPercu: 0, rentePercue: Math.round(renteAnnuellePleine), impots: Math.round(impotsRente), netTotal: Math.round(netRente), avantages: "Revenu garanti à vie, protection longévité", inconvenients: "Imposition annuelle élevée, pas de transmission" },
      { id: "mixte", label: "50% Rente / 50% Capital", capitalPercu: Math.round(cap50 - impotCap50), rentePercue: Math.round(rente50Annuelle), impots: Math.round(impotCap50 + impotRente50), netTotal: Math.round(netMixte), avantages: "Équilibre sécurité + flexibilité", inconvenients: "Compromis sur les deux dimensions" },
      { id: "capital", label: "100% Capital", capitalPercu: Math.round(netCapital), rentePercue: 0, impots: Math.round(impotCapTotal), netTotal: Math.round(netCapital), avantages: "Liquidité totale, transmissible, fiscalité unique", inconvenients: "Risque de longévité, gestion à la charge" },
    ],
    hypotheses: { tauxImpotCapital: tauxImpotCapital * 100, tauxImpotRente: tauxImpotRente * 100 },
  };
}

// ─── Comparatif fiscal transfrontalier (NOUVEAU) : net-net rente vs capital, CH vs FR ───
function calcFiscaliteComparative(person, data) {
  const ageDepart = Number(person.objAgeDepart || 65);
  const ageFin = Number(person.objAgeFinConsommation || 90);
  const duree = Math.max(1, ageFin - ageDepart);
  const lpp = calcLPP(person, ageDepart);
  const capital = lpp.capitalAge65;
  const tauxConv = Number(person.lppTauxConversion || 5) / 100;
  const renteAnnuelle = capital * tauxConv;

  // CAPITAL — imposition Suisse (prestation en capital, barème séparé réduit)
  const tCapCH = Number(data.fiscTauxCapitalCH || 7) / 100;
  const impotCapCH = capital * tCapCH;
  // CAPITAL — imposition France (résident FR : PFL 7,5% art.163 bis CGI + prélèvements sociaux)
  const tCapFR = Number(data.fiscTauxCapitalFR || 7.5) / 100;
  const tPSCapFR = Number(data.fiscTauxPSCapitalFR || 0) / 100;
  const impotCapFR = capital * (tCapFR + tPSCapFR);

  // RENTE — imposition annuelle (barème) puis cumul sur la durée
  const tRenteCH = Number(data.fiscTauxRenteCH || 20) / 100;
  const renteNetteAnCH = renteAnnuelle * (1 - tRenteCH);
  const tRenteFR = Number(data.fiscTauxRenteFR || 17) / 100;
  const renteNetteAnFR = renteAnnuelle * (1 - tRenteFR);

  return {
    capital, renteAnnuelle: Math.round(renteAnnuelle), duree,
    capitalCH: { tauxPct: +(tCapCH * 100).toFixed(1), impot: Math.round(impotCapCH), net: Math.round(capital - impotCapCH) },
    capitalFR: { tauxPct: +((tCapFR + tPSCapFR) * 100).toFixed(1), impot: Math.round(impotCapFR), net: Math.round(capital - impotCapFR) },
    renteCH: { tauxPct: +(tRenteCH * 100).toFixed(1), annuelleNette: Math.round(renteNetteAnCH), cumuleeNette: Math.round(renteNetteAnCH * duree) },
    renteFR: { tauxPct: +(tRenteFR * 100).toFixed(1), annuelleNette: Math.round(renteNetteAnFR), cumuleeNette: Math.round(renteNetteAnFR * duree) },
    meilleurCapital: (capital - impotCapCH) >= (capital - impotCapFR) ? "Suisse" : "France",
  };
}

// ─── Projection d'une solution (capital → rente + tableau de rendement) ───
function projetteSolution(sol) {
  const capital = Number(sol.capital || 0);
  const tauxConv = Number(sol.tauxConversion || 0) / 100;
  const rendement = Number(sol.tauxRendement || 0) / 100;
  const duree = Math.max(1, Number(sol.dureeAnnees || 25));
  const renteAnnuelle = (sol.renteAnnuelle && Number(sol.renteAnnuelle) > 0) ? Number(sol.renteAnnuelle) : capital * tauxConv;
  const rows = [];
  let val = capital;
  const N = Math.min(duree, 30);
  for (let y = 1; y <= N; y++) {
    val = val * (1 + rendement) - renteAnnuelle;
    rows.push({ annee: y, capital: Math.max(0, Math.round(val)), rente: Math.round(renteAnnuelle) });
  }
  const epuiseAn = rows.findIndex(r => r.capital <= 0);
  return {
    capital,
    renteAnnuelle: Math.round(renteAnnuelle),
    renteMensuelle: Math.round(renteAnnuelle / 12),
    rows,
    epuisement: epuiseAn >= 0 ? rows[epuiseAn].annee : null,
  };
}

// ─── Chiffrage du GAIN TOTAL du conseil ───
function calcGainTotal(data) {
  const avsAnticipe = calcAVS(data.client, { scenario: "anticipe", anneesShift: 2 });
  const avsNormal = calcAVS(data.client);
  const cumulAnticipe = avsAnticipe.renteAnnuelle * 27;
  const cumulNormal = avsNormal.renteAnnuelle * 25;
  const gainAgeAVS = Math.max(0, cumulNormal - cumulAnticipe);

  const arbitrage = calcArbitrageSante(data.client, data);
  const gainStrategieMaladie = arbitrage.gainStrategie;

  const flowAnnuelEur = Number(data.client.revenusFR || 0) + calcPensionsFR(data.client).totalAnnuel;
  const economieChange = flowAnnuelEur * 0.015;
  const economiesChange = Math.round(economieChange * (Number(data.economiesPartenairesAnneesEstimees || 20)));
  const economiesFrais = Number(data.economiesFraisAnnuelles || 800) * Number(data.economiesPartenairesAnneesEstimees || 20);

  const total = gainAgeAVS + gainStrategieMaladie + economiesChange + economiesFrais;
  return {
    gainAgeAVS: Math.round(gainAgeAVS),
    gainStrategieMaladie: Math.round(gainStrategieMaladie),
    economiesChange: Math.round(economiesChange),
    economiesFrais: Math.round(economiesFrais),
    total: Math.round(total),
  };
}

// ─── Plan d'actions calendaire (généré automatiquement) ───
function generatePlanActions(data) {
  const ageActuel = Number(data.client.age || 50);
  const ageDepart = Number(data.client.objAgeDepart || 65);
  const anneeActuelle = new Date().getFullYear();
  const anneeDepart = anneeActuelle + (ageDepart - ageActuel);
  const actions = [];
  actions.push({ annee: anneeActuelle, mois: "Q1", action: "Demander le relevé du compte individuel (CI) AVS", destinataire: "Caisse cantonale de compensation", importance: "haute" });
  actions.push({ annee: anneeActuelle, mois: "Q1", action: "Demander une attestation détaillée de la caisse de pension LPP", destinataire: "Institution de prévoyance", importance: "haute" });
  if (data.client.frACarriereFrance) actions.push({ annee: anneeActuelle, mois: "Q1", action: "Télécharger le RIS sur info-retraite.fr et le transmettre au conseiller", destinataire: "info-retraite.fr (CNAV)", importance: "haute" });
  if (Number(data.client.lppPotentielRachat) > 0 && Number(data.client.lppRachats3Ans) === 0) actions.push({ annee: anneeActuelle, mois: "Q4", action: "Étudier rachat LPP (potentiel CHF " + fmt(data.client.lppPotentielRachat) + ")", destinataire: "Caisse de pension", importance: "haute" });
  if (data.client.lppAvoirsOublies) actions.push({ annee: anneeActuelle, mois: "Q2", action: "Recherche d'avoirs LPP oubliés", destinataire: "Centrale du 2e pilier + Institution supplétive", importance: "moyenne" });
  if (anneeDepart > anneeActuelle) {
    actions.push({ annee: anneeDepart - 1, mois: "Q1", action: "Annoncer la sortie LPP à la caisse de pension (préavis 12 mois)", destinataire: "Caisse de pension", importance: "haute" });
    actions.push({ annee: anneeDepart - 1, mois: "Q3", action: "Déposer la demande de rente AVS (min. 3 mois avant l'âge ordinaire)", destinataire: "Caisse de compensation", importance: "haute" });
    if (data.client.frACarriereFrance) actions.push({ annee: anneeDepart - 1, mois: "Q2", action: "Liquider les pensions FR via demande unique (info-retraite.fr)", destinataire: "CNAV + AGIRC-ARRCO", importance: "haute" });
    actions.push({ annee: anneeDepart - 1, mois: "Q4", action: "Décider du basculement LAMal → CMU ou statut quasi-résident", destinataire: "Conseiller + fiduciaire", importance: "haute" });
    actions.push({ annee: anneeDepart, mois: "Q1", action: "Décider de l'échelonnement des retraits 3a (sur 2-3 ans pour fractionner l'impôt)", destinataire: "Banque(s) 3a", importance: "moyenne" });
    actions.push({ annee: anneeDepart, mois: "Q1", action: "Souscrire une assurance accident privée (LAA cesse à la retraite)", destinataire: "Assureur privé", importance: "moyenne" });
  } else {
    actions.push({ annee: anneeActuelle, mois: "Q1", action: "Annoncer la sortie LPP / le retrait en capital à la caisse", destinataire: "Caisse de pension", importance: "haute" });
    actions.push({ annee: anneeActuelle, mois: "Q1", action: "Déposer la demande de rente AVS", destinataire: "Caisse de compensation", importance: "haute" });
  }
  actions.push({ annee: anneeDepart + 1, mois: "Q1", action: "Réviser le portefeuille en allocation de retraite (4 poches)", destinataire: "Conseiller", importance: "moyenne" });
  actions.push({ annee: anneeDepart + 1, mois: "Q4", action: "Première déclaration d'impôt en tant que retraité — vérifier convention CH-FR", destinataire: "Fiduciaire", importance: "haute" });
  if (!data.succTestament) actions.push({ annee: anneeActuelle, mois: "Q2", action: "Rédiger ou actualiser le testament avec choix de loi applicable", destinataire: "Notaire", importance: "moyenne" });
  return actions.sort((a, b) => (a.annee !== b.annee ? a.annee - b.annee : a.mois.localeCompare(b.mois)));
}

// ─── Projection annuelle (avec évènements patrimoniaux + montant libre) ───
function calcProjectionAnnuelle(data) {
  const ageActuel = Number(data.client.age || 50);
  const ageDepart = Number(data.client.objAgeDepart || 65);
  const ageFin = Number(data.client.objAgeFinConsommation || 90);
  const anneeActuelle = new Date().getFullYear();
  const tauxRdt = Number(data.tauxRendement || 1.5) / 100;
  const inflation = Number(data.tauxInflation || 1.5) / 100;

  const synth = calcSyntheseRetraite(data.client, data);
  const lpp = calcLPP(data.client, ageDepart);
  const tp = calc3eP(data.client, ageDepart);
  const partCap = partCapitalLPP(data.client);
  const trainVieInitial = Number(data.client.objTrainVie || 0) * 12;

  const salaireAnnuel = Number(data.client.revenusNet || 0);
  const epargneAnnuelle = Number(data.client.fluxEpargneMensuel || 0) * 12;
  const chargesActuelles = (Number(data.budCoutVieMensuel || 0) + Number(data.budAssuranceMaladie || 0) + Number(data.budAutresAssurances || 0)) * 12 + Number(data.budChargeFiscale || 0);

  let patFinancierInitial = Number(data.patComptesCourants || 0) + Number(data.patEpargne || 0) + Number(data.patDepotsTitres || 0);
  if (data.useCapitalLibre && Number(data.patCapitalLibre) > 0) patFinancierInitial = Number(data.patCapitalLibre);
  let patImmoInitial = Number(data.immoResidencePrincipaleValeur || 0) - Number(data.immoResidencePrincipaleHypotheque || 0);

  const events = data.immoEvents || [];

  const rows = [];
  let patLiquide = patFinancierInitial, patImmo = patImmoInitial;
  let capital3a = tp.capital3a, capital3b = tp.capital3b, capitalLPP = lpp.capitalAge65;
  let trainVie = trainVieInitial;

  const maxYears = Math.min(40, Math.max(1, ageFin - ageActuel));
  for (let annee = anneeActuelle; annee <= anneeActuelle + maxYears; annee++) {
    const age = ageActuel + (annee - anneeActuelle);
    const enRetraite = age >= ageDepart;
    let salaires = enRetraite ? 0 : salaireAnnuel;
    let rentes = 0, capitalsLib = 0;
    let charges = chargesActuelles * Math.pow(1 + inflation, annee - anneeActuelle);
    let trainVieAnnee = trainVie * Math.pow(1 + inflation, annee - anneeActuelle);

    if (enRetraite) {
      rentes = synth.avs.renteAnnuelle + lpp.renteAnnuelle * (1 - partCap) + synth.pensionsFRChfAnnuelle;
      if (age === ageDepart) {
        capitalsLib = capitalLPP * partCap + capital3a + capital3b;
        capitalLPP = capitalLPP * (1 - partCap); capital3a = 0; capital3b = 0;
      }
      charges *= 0.75;
    }

    let evtCash = 0; const evtLabels = [];
    events.filter(e => Number(e.annee) === annee).forEach(e => {
      const montant = Number(e.montantNet || 0);
      if (e.type === "vente") { evtCash += montant; patImmo = Math.max(0, patImmo - Number(e.valeurBien || montant)); }
      else if (e.type === "achat") { evtCash -= montant; patImmo += Number(e.valeurBien || montant); }
      else { evtCash += montant; }
      if (e.libelle) evtLabels.push(e.libelle);
    });

    const fluxNet = salaires + rentes - charges - trainVieAnnee + (enRetraite ? 0 : epargneAnnuelle);
    // Le rendement ne s'applique qu'à un solde positif (évite l'explosion d'un découvert)
    patLiquide = (patLiquide > 0 ? patLiquide * (1 + tauxRdt) : patLiquide) + fluxNet + capitalsLib + evtCash;
    patImmo = patImmo * (1 + inflation * 0.5);
    if (!enRetraite) { capital3a *= (1 + tauxRdt); capital3b *= (1 + tauxRdt); }

    rows.push({
      annee, age, enRetraite,
      salaires: Math.round(salaires), rentes: Math.round(rentes),
      charges: Math.round(charges), trainVie: Math.round(trainVieAnnee),
      epargne: enRetraite ? 0 : epargneAnnuelle,
      capitalsLib: Math.round(capitalsLib + evtCash), evtLabels,
      patLiquide: Math.round(patLiquide), patImmo: Math.round(patImmo), patTotal: Math.round(patLiquide + patImmo),
    });
  }
  return rows;
}

// ─── Pré-allocation par horizon (4 poches) ───
function calcAllocationPoches(data) {
  const tp = calc3eP(data.client, Number(data.client.objAgeDepart || 65));
  const lpp = calcLPP(data.client, Number(data.client.objAgeDepart || 65));
  const liq = Number(data.patComptesCourants || 0) + Number(data.patEpargne || 0);
  const titres = Number(data.patDepotsTitres || 0);
  const capitalLPPSorti = lpp.capitalAge65 * partCapitalLPP(data.client);
  let capitalDisponible = liq + titres + tp.capitalTotal + capitalLPPSorti;
  if (data.useCapitalLibre && Number(data.patCapitalLibre) > 0) capitalDisponible = Number(data.patCapitalLibre) + tp.capitalTotal + capitalLPPSorti;
  return [
    { id: "court", label: "Court terme", horizon: "0–3 ans", pct: 15, montant: Math.round(capitalDisponible * 0.15), color: C.bad, support: "Liquidités, comptes courants" },
    { id: "moyen", label: "Moyen terme", horizon: "4–8 ans", pct: 25, montant: Math.round(capitalDisponible * 0.25), color: C.warn, support: "Obligations courtes, fonds défensifs" },
    { id: "long", label: "Long terme", horizon: "9–15 ans", pct: 30, montant: Math.round(capitalDisponible * 0.30), color: C.france, support: "Mixte actions/obligations" },
    { id: "tresLong", label: "Très long terme", horizon: "> 15 ans", pct: 30, montant: Math.round(capitalDisponible * 0.30), color: C.ok, support: "Actions, immobilier, fonds dynamiques" },
  ];
}

// ─── Heatmap train de vie par âge de départ ───
function calcHeatmapAges(data) {
  const ages = [58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70];
  const tauxChange = Number(data.tauxChangeEurChf || 0.95);
  const ageFin = Number(data.client.objAgeFinConsommation || 90);
  const rows = ages.map((age) => {
    const personne = { ...data.client, objAgeDepart: age };
    const avs = age < 65 ? calcAVS(personne, { scenario: "anticipe", anneesShift: 65 - age })
      : age > 65 ? calcAVS(personne, { scenario: "ajourne", anneesShift: Math.min(5, age - 65) })
        : calcAVS(personne);
    const lpp = calcLPP(personne, age);
    const tp = calc3eP(personne, age);
    const pensionsFR = calcPensionsFR(personne).totalAnnuel * tauxChange;
    const dureeRetraite = Math.max(1, ageFin - age);
    const renteAnnuelle = avs.renteAnnuelle + lpp.renteAnnuelle + pensionsFR;
    const trainDeVieRente = Math.round(renteAnnuelle / 12);
    const capital = tp.capitalTotal + lpp.capitalAge65 * 0.5;
    const trainDeVieCapital = Math.round((renteAnnuelle + capital / dureeRetraite) / 12);
    return { age, trainDeVieRente, trainDeVieCapital, dureeRetraite };
  });
  const maxVal = Math.max(...rows.map(r => Math.max(r.trainDeVieRente, r.trainDeVieCapital)));
  return { rows, maxVal };
}

// ─── Train de vie mensuel détaillé ───
function calcTrainDeVieMensuel(data) {
  const synth = calcSyntheseRetraite(data.client, data);
  const revenuBrut = synth.revenuRenteAjusteMensuel;
  const cotSociales = Math.round(revenuBrut * 0.06);
  const impotMensuel = Math.round((Number(data.budChargeFiscale || 0) / 12) * 0.6);
  const revenuNet = revenuBrut - cotSociales - impotMensuel;
  const chargesFixes = Number(data.budAssuranceMaladie || 0) + Number(data.budAutresAssurances || 0);
  const trainVieDispo = revenuNet - chargesFixes;
  const tp = calc3eP(data.client, Number(data.client.objAgeDepart || 65));
  const lpp = calcLPP(data.client, Number(data.client.objAgeDepart || 65));
  const dureeRetraite = Math.max(1, Number(data.client.objAgeFinConsommation || 90) - Number(data.client.objAgeDepart || 65));
  const capitalDisponible = tp.capitalTotal + lpp.capitalAge65 * partCapitalLPP(data.client);
  const consoCapitalMensuel = Math.round(capitalDisponible / dureeRetraite / 12);
  return {
    revenuBrut, cotSociales, impotMensuel, revenuNet, chargesFixes,
    consoCapitalMensuel,
    trainVieAvant90: trainVieDispo + consoCapitalMensuel,
    trainVieApres90: revenuNet - chargesFixes,
    patImmoRestant: Number(data.immoResidencePrincipaleValeur || 0) - Number(data.immoResidencePrincipaleHypotheque || 0),
  };
}

// ─── Cartographie des droits (respecte le choix rente/capital + FR détaillé pour les 2) ───
function calcCartographieDroits(data) {
  const lignes = [];
  const addPersonne = (p, isClient) => {
    const ageDepart = Number(p.objAgeDepart || 65);
    const avs = calcAVS(p);
    const lppE = lppEffectif(p, ageDepart);
    const tp = calc3eP(p, ageDepart);
    const prenom = p.prenom || (isClient ? "Client" : "Conjoint(e)");
    if (avs.renteMensuelle > 0) lignes.push({ qui: prenom, intitule: "Rente AVS", type: "Rente viagère", institut: p.avsCaisse || "Caisse de compensation", montant: "CHF " + fmt(avs.renteMensuelle) + " /mois", ageDebut: 65 });
    // LPP selon le choix de sortie
    if (lppE.partCapital >= 0.999) {
      lignes.push({ qui: prenom, intitule: "Capital LPP", type: "Capital", institut: p.lppCaisse || "Caisse de pension", montant: "CHF " + fmt(lppE.capitalAge65), ageDebut: ageDepart });
    } else if (lppE.partCapital <= 0.001) {
      lignes.push({ qui: prenom, intitule: "Rente LPP", type: "Rente viagère", institut: p.lppCaisse || "Caisse de pension", montant: "CHF " + fmt(lppE.renteMensuelle) + " /mois", ageDebut: ageDepart });
    } else {
      lignes.push({ qui: prenom, intitule: "Rente LPP (part)", type: "Rente viagère", institut: p.lppCaisse || "Caisse de pension", montant: "CHF " + fmt(lppE.renteMensuelleEff) + " /mois", ageDebut: ageDepart });
      lignes.push({ qui: prenom, intitule: "Capital LPP (part)", type: "Capital", institut: p.lppCaisse || "Caisse de pension", montant: "CHF " + fmt(lppE.capitalSorti), ageDebut: ageDepart });
    }
    if (Number(tp.capital3a) > 0) lignes.push({ qui: prenom, intitule: "Capital 3a", type: "Capital", institut: "Banque(s) / Assurance(s) 3a", montant: "CHF " + fmt(tp.capital3a), ageDebut: ageDepart });
    if (Number(tp.capital3b) > 0) lignes.push({ qui: prenom, intitule: "Capital 3b", type: "Capital libre", institut: "Assurance-vie", montant: "CHF " + fmt(tp.capital3b), ageDebut: ageDepart });
    if (p.frACarriereFrance) {
      const pFR = calcPensionsFR(p);
      lignes.push({ qui: prenom, intitule: "Pension CNAV (base FR)", type: "Rente viagère", institut: p.frRegimeBase || "CNAV", montant: fmtEUR(pFR.pensionCnavMensuelle) + " € /mois", ageDebut: Number(p.frAgeTauxPlein || 67) });
      lignes.push({ qui: prenom, intitule: "AGIRC-ARRCO (complément.)", type: "Rente viagère", institut: "AGIRC-ARRCO", montant: fmtEUR(pFR.pensionAgircMensuelle) + " € /mois", ageDebut: Number(p.frAgeTauxPlein || 67) });
      lignes.push({ qui: prenom, intitule: "Pensions FR cumulées", type: "Rente viagère", institut: "CNAV + AGIRC-ARRCO", montant: fmtEUR(pFR.totalMensuel) + " € /mois", ageDebut: Number(p.frAgeTauxPlein || 67) });
    }
  };
  addPersonne(data.client, true);
  if (data.isCouple && data.conjoint && data.conjoint.prenom) addPersonne(data.conjoint, false);
  return lignes;
}

// ============================================================
// STATE INITIAL
// ============================================================
const personneVide = () => ({
  prenom: "", nom: "", dateNaissance: "", age: "", nationalite: "Suisse",
  permisG: false, permisType: "",
  statutMatrimonial: "Marié(e)", regimeMatrimonial: "",
  adresse: "", domicileFiscal: "", santeGenerale: "Bonne",
  statutPro: "Salarié", employeur: "", tauxOccupation: "100",
  revenusBrut: "", revenusNet: "", dateFinActivite: "",
  autresRevenus: "", revenusFR: "", fluxEpargneMensuel: "",
  avsNumero: "", avsAnneesCotisation: "", avsLacunes: "",
  avsCaisse: "", avsRenteEstimee: "", avsAnticipation: false,
  avsAjournement: false, avs13eRente: true, avsCotisationsArretAnticipe: "",
  lppCaisse: "", lppAvoirActuel: "", lppCotisationAnnuelle: "",
  lppTauxRendement: "1.25", lppTauxConversion: "5.0",
  lppCapitalProjete: "", lppRenteProjete: "",
  lppLibrePassage: "0", lppAvoirsOublies: false,
  lppPotentielRachat: "", lppRachats3Ans: "0", lppEPL: "0", lppMisesEnGage: "",
  lppChoixSortie: "Mixte", lppPartCapitalPct: "50",
  lppTauxCouverture: "",
  troisPAvoir3a: "", troisPCotisationAnnuelle: "",
  troisPTauxRendement: "3", troisPNbComptes: "1",
  troisPAvoir3b: "", troisPCotisation3b: "",
  troisPStrategieEchelonnement: "",
  troisPClausesBeneficiaires: "",
  frACarriereFrance: false,
  frRegimeBase: "CNAV", frTrimestresAcquis: "", frTrimestresRequis: "172",
  frSAM: "", frAgeMinLegal: "64", frAgeTauxPlein: "67",
  frPensionCnavEstimee: "", frPointsAgircArrco: "",
  frAutresRegimes: "", frLacunesARegulariser: "",
  frDecisionRetraiteFR: "Accepter",
  frAssuranceMaladie: "LAMal",
  objAgeDepart: "65", objPriorite: "train_vie",
  objTrainVie: "", objDepartProgressif: false,
  objProjets: "", objPreferenceSortie: "Mixte",
  objAgeFinConsommation: "90", objToleranceRisque: "Équilibré",
});

const solutionVide = () => ({
  id: Date.now() + Math.floor(Math.random() * 1000), actif: true,
  nom: "", categorie: "Prévoyance", beneficiaire: "Client",
  capital: "", tauxConversion: "0", tauxRendement: "0", renteAnnuelle: "",
  dureeAnnees: "25", avantages: "", inconvenients: "",
});

const catalogueSolutions = () => ([
  { ...solutionVide(), id: 1001, actif: true, nom: "Rente viagère LPP", categorie: "Prévoyance 2e pilier", capital: "300000", tauxConversion: "5.0", tauxRendement: "0", dureeAnnees: "25", avantages: "Revenu garanti à vie\nProtection contre le risque de longévité\nAucune gestion à charge", inconvenients: "Capital non transmissible (hors réversion)\nImposition annuelle au barème\nRente figée (peu indexée)" },
  { ...solutionVide(), id: 1002, actif: false, nom: "Retrait en capital + portefeuille géré", categorie: "Capital / placement", capital: "300000", tauxConversion: "0", tauxRendement: "3.5", renteAnnuelle: "18000", dureeAnnees: "25", avantages: "Liquidité et flexibilité totales\nCapital transmissible aux héritiers\nFiscalité unique avantageuse à la sortie", inconvenients: "Risque de marché et de longévité\nDiscipline de retraits nécessaire\nGestion à organiser" },
  { ...solutionVide(), id: 1003, actif: false, nom: "Assurance-vie luxembourgeoise", categorie: "Enveloppe transfrontalière", capital: "150000", tauxConversion: "0", tauxRendement: "3", renteAnnuelle: "0", dureeAnnees: "30", avantages: "Neutralité fiscale (résident FR/CH)\nProtection du capital (triangle de sécurité)\nTransmission optimisée", inconvenients: "Frais d'enveloppe\nHorizon long recommandé" },
  { ...solutionVide(), id: 1004, actif: false, nom: "3a échelonné (retraits fractionnés)", categorie: "3e pilier", capital: "115000", tauxConversion: "0", tauxRendement: "0", renteAnnuelle: "0", dureeAnnees: "3", avantages: "Fractionnement de l'impôt sur 2-3 ans\nDisponibilité dès 5 ans avant l'âge AVS", inconvenients: "Nécessite plusieurs comptes 3a\nPlanification fiscale fine" },
  { ...solutionVide(), id: 1005, actif: false, nom: "Immobilier locatif (rendement)", categorie: "Immobilier", capital: "250000", tauxConversion: "0", tauxRendement: "3.5", renteAnnuelle: "10000", dureeAnnees: "30", avantages: "Revenu locatif récurrent\nProtection contre l'inflation\nEffet de levier possible", inconvenients: "Illiquidité\nGestion locative\nFiscalité foncière FR (IFI)" },
]);

const stateInitial = () => ({
  templateId: "planification-retraite",
  hiddenSlides: [],
  dateRapport: new Date().toISOString().split('T')[0],
  isCouple: true,
  coupleProjectionMode: "separee", // "separee" | "commune"
  showCitations: true, // pages d'intercalaires / citations (pages de garde entre sections)

  // Type & présentation de l'étude (adapte titre / en-têtes)
  studyType: "retraite", // retraite | patrimoine | prevoyance | fiscalite
  studyTitle: "Planification de votre retraite",
  studySubtitle: "Une étude croisée Suisse / France pour bâtir votre stratégie de revenu à la retraite, en cohérence avec votre situation de frontalier(ère) ou franco-suisse.",
  studyAudience: "Frontaliers / Franco-suisses",
  confidentialiteTexte: "Document strictement confidentiel. Données traitées selon la LPD suisse et le RGPD. Reproduction et diffusion soumises à autorisation écrite de WallSwiss SA.",

  client: {
    prenom: "Jean", nom: "Dupont", dateNaissance: "15.06.1966", age: "60", nationalite: "Français",
    permisG: true, permisType: "G (Frontalier)",
    statutMatrimonial: "Marié(e)", regimeMatrimonial: "Participation aux acquêts",
    adresse: "12 rue du Lac, 74000 Annecy", domicileFiscal: "France (74)", santeGenerale: "Bonne",
    statutPro: "Cadre", employeur: "Rolex SA", tauxOccupation: "100",
    revenusBrut: "135000", revenusNet: "105000", dateFinActivite: "60",
    autresRevenus: "0", revenusFR: "0", fluxEpargneMensuel: "1500",
    avsNumero: "756.1234.5678.90", avsAnneesCotisation: "35", avsLacunes: "Études en France",
    avsCaisse: "CCGC", avsRenteEstimee: "2150", avsAnticipation: false,
    avsAjournement: false, avs13eRente: true, avsCotisationsArretAnticipe: "0",
    lppCaisse: "Fondation LPP X", lppAvoirActuel: "620000", lppCotisationAnnuelle: "18500",
    lppTauxRendement: "1.5", lppTauxConversion: "5.2",
    lppCapitalProjete: "620000", lppRenteProjete: "2686",
    lppLibrePassage: "45000", lppAvoirsOublies: true,
    lppPotentielRachat: "85000", lppRachats3Ans: "25000", lppEPL: "0", lppMisesEnGage: "",
    lppChoixSortie: "Capital", lppPartCapitalPct: "100",
    lppTauxCouverture: "108",
    troisPAvoir3a: "115000", troisPCotisationAnnuelle: "7258",
    troisPTauxRendement: "3", troisPNbComptes: "2",
    troisPAvoir3b: "40000", troisPCotisation3b: "2400",
    troisPStrategieEchelonnement: "Retrait espacé sur 2 ans pour fractionner l'impôt.",
    troisPClausesBeneficiaires: "Conjoint puis enfants.",
    frACarriereFrance: true,
    frRegimeBase: "CNAV (salariés)", frTrimestresAcquis: "62", frTrimestresRequis: "172",
    frSAM: "34000", frAgeMinLegal: "64", frAgeTauxPlein: "67",
    frPensionCnavEstimee: "450", frPointsAgircArrco: "1850",
    frAutresRegimes: "", frLacunesARegulariser: "3 trimestres en 1988",
    frDecisionRetraiteFR: "Accepter",
    frAssuranceMaladie: "LAMal",
    objAgeDepart: "60", objPriorite: "train_vie",
    objTrainVie: "9000", objDepartProgressif: true,
    objProjets: "Achat d'un camping-car et voyage en Asie.", objPreferenceSortie: "Capital",
    objAgeFinConsommation: "90", objToleranceRisque: "Équilibré",
  },
  conjoint: {
    prenom: "Marie", nom: "Dupont", dateNaissance: "22.11.1961", age: "64", nationalite: "Française",
    permisG: false, permisType: "Citoyen FR/UE",
    statutMatrimonial: "Marié(e)", regimeMatrimonial: "Participation aux acquêts",
    adresse: "12 rue du Lac, 74000 Annecy", domicileFiscal: "France (74)", santeGenerale: "Bonne",
    statutPro: "Salarié", employeur: "Hôpital local", tauxOccupation: "80",
    revenusBrut: "45000", revenusNet: "35000", dateFinActivite: "2026",
    autresRevenus: "0", revenusFR: "45000", fluxEpargneMensuel: "500",
    avsNumero: "", avsAnneesCotisation: "20", avsLacunes: "",
    avsCaisse: "", avsRenteEstimee: "1450", avsAnticipation: false,
    avsAjournement: false, avs13eRente: true, avsCotisationsArretAnticipe: "",
    lppCaisse: "Caisse Hôpital", lppAvoirActuel: "180000", lppCotisationAnnuelle: "9000",
    lppTauxRendement: "1.25", lppTauxConversion: "5.0",
    lppCapitalProjete: "190000", lppRenteProjete: "",
    lppLibrePassage: "0", lppAvoirsOublies: false,
    lppPotentielRachat: "", lppRachats3Ans: "0", lppEPL: "0", lppMisesEnGage: "",
    lppChoixSortie: "Rente", lppPartCapitalPct: "0",
    lppTauxCouverture: "",
    troisPAvoir3a: "35000", troisPCotisationAnnuelle: "3000",
    troisPTauxRendement: "3", troisPNbComptes: "1",
    troisPAvoir3b: "", troisPCotisation3b: "",
    troisPStrategieEchelonnement: "",
    troisPClausesBeneficiaires: "",
    frACarriereFrance: true,
    frRegimeBase: "CNAV (salariés)", frTrimestresAcquis: "130", frTrimestresRequis: "170",
    frSAM: "28000", frAgeMinLegal: "64", frAgeTauxPlein: "67",
    frPensionCnavEstimee: "1100", frPointsAgircArrco: "3200",
    frAutresRegimes: "", frLacunesARegulariser: "",
    frDecisionRetraiteFR: "Accepter",
    frAssuranceMaladie: "LAMal",
    objAgeDepart: "64", objPriorite: "train_vie",
    objTrainVie: "4000", objDepartProgressif: false,
    objProjets: "", objPreferenceSortie: "Rente",
    objAgeFinConsommation: "90", objToleranceRisque: "Prudent",
  },

  enfants: [
    { prenom: "Lucas", dateNaissance: "14.05.2001", aCharge: true, finEntretien: "2026" },
    { prenom: "Emma", dateNaissance: "08.09.2004", aCharge: true, finEntretien: "2029" }
  ],

  immoResidencePrincipaleValeur: "850000",
  immoResidencePrincipaleHypotheque: "320000",
  immoResidencePrincipaleTauxInt: "1.45",
  immoResidencePrincipaleTypeHypo: "Fixe",
  immoAmortissement: "Indirect",
  immoSecondaires: [],
  immoBiensLocatifs: [],
  immoProjets: "Revente de la résidence principale dans 5 ans pour un bien plus petit.",
  immoBiensFrance: "Appartement locatif à Lyon (250k€).",
  // Évènements patrimoniaux datés (vente / achat / donation)
  immoEvents: [
    { id: 1, annee: String(new Date().getFullYear() + 5), type: "vente", libelle: "Vente résidence principale", montantNet: "530000", valeurBien: "850000" },
  ],
  // Montant de base libre (écrase le calcul auto du patrimoine financier de départ)
  useCapitalLibre: false,
  patCapitalLibre: "",

  patComptesCourants: "45000", patEpargne: "85000", patDepotsTitres: "125000",
  patCredits: "15000", patLeasings: "0", patParticipations: "0",
  patComptesFrance: "Livret A et LDD",

  budCoutVieMensuel: "6500", budAssuranceMaladie: "820",
  budAutresAssurances: "350", budChargeFiscale: "18500",
  budChargesImmo: "12000", budPensionsVersees: "0",

  fiscDerniereTaxation: "2024", fiscImpositionSource: true,
  fiscQuasiResident: true, fiscRevenuImposable: "125000",
  fiscFortuneImposable: "350000", fiscImpotsFrance: "2500",
  // Paramètres du comparatif fiscal transfrontalier
  fiscTauxCapitalCH: "7", fiscTauxCapitalFR: "7.5", fiscTauxPSCapitalFR: "0",
  fiscTauxRenteCH: "20", fiscTauxRenteFR: "17",
  tauxImpotCapital3a: "6",

  risqueCouvertureDeces: "Capital LPP 250k + 3a 115k",
  risqueCouvertureInvalidite: "Rente 54k/an",
  risqueLacunesConjoint: "Baisse de revenu pour le conjoint (-60%)",
  risqueClausesBeneficiaires: "Standard",
  risqueLAARetraite: "À souscrire",

  succTestament: true, succPacteSuccessoral: false,
  succContratMariage: false, succMandatInaptitude: false,
  succDonations: "30k€ à chaque enfant", succObjectifsTransmission: "Protéger le conjoint en priorité.",
  succLoiApplicable: "France",

  tauxRendement: "3", tauxInflation: "1.5",
  tauxChangeEurChf: "0.95", paysResidenceRetraite: "France",
  scenarios: ["Âge cible", "Arrêt anticipé -3 ans", "Rente vs Capital"],

  primeLAMalAnnuelle: "9600", primeCMUAnnuelle: "0", cotisationCMUSubsidiaire: "0",
  tauxCSGCRDSCASA: "9.1", ageBasculeHybride: "70",
  arbitrageSanteRetenu: "A", arbitrageSanteCommentaire: "",
  tauxImpotCapitalLPP: "8", tauxImpotRenteLPP: "25",
  economiesFraisAnnuelles: "800", economiesPartenairesAnneesEstimees: "20",
  partenairesDescription: "B-Sharpe (change), Banque du Léman (frais), Notaire spécialisé",

  // Onglet Solutions (catalogue éditable)
  solutions: catalogueSolutions(),

  docsRecus: {},
  conseiller: "Alexandre Dupuis", titreConseiller: "Conseiller Financier",
  telephone: "+41 22 555 12 34", email: "a.dupuis@wallswiss.ch",
  notesConseiller: "Client très organisé. Crainte fiscalité sur le capital.",
  pointsAttention: "Attention au rachat LPP de 25k (blocage de 3 ans pour le capital).",
});

// ────────────────────── STYLES PARTAGÉS ──────────────────────
const S = {
  label: { display: "block", fontSize: 11, fontWeight: 600, color: C.gray, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" },
  input: { width: "100%", padding: "10px 12px", border: "1.5px solid " + C.mediumGray, fontSize: 13, fontFamily: "'Montserrat', sans-serif", color: C.black, background: C.white, outline: "none", boxSizing: "border-box", borderRadius: "0px" },
  select: { width: "100%", padding: "10px 12px", border: "1.5px solid " + C.mediumGray, fontSize: 13, fontFamily: "'Montserrat', sans-serif", color: C.black, background: C.white, outline: "none", cursor: "pointer", boxSizing: "border-box", borderRadius: "0px" },
  fg: { marginBottom: 16 },
  card: { background: C.white, padding: 24, border: "1px solid " + C.mediumGray, borderRadius: "0px", marginBottom: 16 },
  cardTitle: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.primary, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 },
  dot: { width: 8, height: 2, background: C.gold, flexShrink: 0 },
  btnP: { background: C.primary, color: C.white, border: "none", padding: "12px 28px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", borderRadius: "0px" },
  btnS: { background: C.white, color: C.primary, border: "2px solid " + C.primary, padding: "10px 24px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 600, borderRadius: "0px" },
  sectionBadge: (color) => ({ display: "inline-block", background: color, color: C.white, padding: "4px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }),
};

function Field({ label, value, onChange, type = "text", placeholder = "", select = null, textarea = false, suffix = "", colSpan = 1, step = null }) {
  return (
    <div style={{ ...S.fg, gridColumn: "span " + colSpan }}>
      <label style={S.label}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {select ? (
          <select style={S.select} value={value || ""} onChange={(e) => onChange(e.target.value)}>
            {select.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : textarea ? (
          <textarea style={{ ...S.input, minHeight: 70, resize: "vertical", whiteSpace: "pre-wrap" }} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        ) : (
          <input style={S.input} type={type} step={step} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        )}
        {suffix && <span style={{ fontSize: 11, color: C.gray, whiteSpace: "nowrap" }}>{suffix}</span>}
      </div>
    </div>
  );
}

function CheckRow({ label, checked, onChange, hint = "" }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", cursor: "pointer", borderBottom: "1px solid " + C.lightGray }}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 3, accentColor: C.primary, width: 16, height: 16 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: C.darkGray, fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{hint}</div>}
      </div>
    </label>
  );
}

// ============================================================
// PANNEAUX WIZARD
// ============================================================
function PanneauIdentite({ p, setP, titre, couleur }) {
  return (
    <div style={S.card}>
      <div style={{ ...S.cardTitle, color: couleur }}><div style={{ ...S.dot, background: couleur }} /> {titre}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Prénom" value={p.prenom} onChange={(v) => setP({ ...p, prenom: v })} />
        <Field label="Nom" value={p.nom} onChange={(v) => setP({ ...p, nom: v })} />
        <Field label="Date de naissance" value={p.dateNaissance} onChange={(v) => setP({ ...p, dateNaissance: v })} placeholder="JJ.MM.AAAA" />
        <Field label="Âge" value={p.age} onChange={(v) => setP({ ...p, age: v })} type="number" suffix="ans" />
        <Field label="Nationalité" value={p.nationalite} onChange={(v) => setP({ ...p, nationalite: v })} />
        <Field label="Statut matrimonial" value={p.statutMatrimonial} onChange={(v) => setP({ ...p, statutMatrimonial: v })} select={["Célibataire", "Marié(e)", "Pacsé(e)", "Divorcé(e)", "Veuf/Veuve", "Union libre"]} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Régime matrimonial" value={p.regimeMatrimonial} onChange={(v) => setP({ ...p, regimeMatrimonial: v })} select={["", "Participation aux acquêts", "Séparation de biens", "Communauté de biens"]} />
        <Field label="Permis / statut" value={p.permisType} onChange={(v) => setP({ ...p, permisType: v })} select={["", "G (Frontalier)", "B", "C", "Citoyen suisse", "Citoyen FR/UE"]} />
        <Field label="Adresse" value={p.adresse} onChange={(v) => setP({ ...p, adresse: v })} colSpan={2} />
        <Field label="Domicile fiscal" value={p.domicileFiscal} onChange={(v) => setP({ ...p, domicileFiscal: v })} placeholder="Ex: France (74)" />
        <Field label="Santé générale" value={p.santeGenerale} onChange={(v) => setP({ ...p, santeGenerale: v })} select={["Bonne", "Moyenne", "À surveiller"]} />
      </div>
    </div>
  );
}

function PanneauPro({ p, setP, titre, couleur }) {
  return (
    <div style={S.card}>
      <div style={{ ...S.cardTitle, color: couleur }}><div style={{ ...S.dot, background: couleur }} /> {titre}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Statut" value={p.statutPro} onChange={(v) => setP({ ...p, statutPro: v })} select={["Salarié", "Indépendant", "Cadre", "Sans activité", "Retraité partiel"]} />
        <Field label="Taux d'occupation" value={p.tauxOccupation} onChange={(v) => setP({ ...p, tauxOccupation: v })} type="number" suffix="%" />
        <Field label="Employeur" value={p.employeur} onChange={(v) => setP({ ...p, employeur: v })} colSpan={2} />
        <Field label="Revenu annuel brut" value={p.revenusBrut} onChange={(v) => setP({ ...p, revenusBrut: v })} type="number" suffix="CHF" />
        <Field label="Revenu annuel net" value={p.revenusNet} onChange={(v) => setP({ ...p, revenusNet: v })} type="number" suffix="CHF" />
        <Field label="Date de fin d'activité souhaitée" value={p.dateFinActivite} onChange={(v) => setP({ ...p, dateFinActivite: v })} placeholder="JJ.MM.AAAA ou âge" />
        <Field label="Capacité d'épargne mensuelle" value={p.fluxEpargneMensuel} onChange={(v) => setP({ ...p, fluxEpargneMensuel: v })} type="number" suffix="CHF/mois" />
        <Field label="Autres revenus (locatifs, rentes)" value={p.autresRevenus} onChange={(v) => setP({ ...p, autresRevenus: v })} type="number" suffix="CHF/an" />
        <Field label="Revenus / pensions de source française" value={p.revenusFR} onChange={(v) => setP({ ...p, revenusFR: v })} type="number" suffix="EUR/an" />
      </div>
    </div>
  );
}

function PanneauObjectifs({ p, setP, titre, couleur }) {
  return (
    <div style={S.card}>
      <div style={{ ...S.cardTitle, color: couleur }}><div style={{ ...S.dot, background: couleur }} /> {titre}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Âge de départ souhaité" value={p.objAgeDepart} onChange={(v) => setP({ ...p, objAgeDepart: v })} type="number" suffix="ans" />
        <Field label="Priorité affichée" value={p.objPriorite} onChange={(v) => setP({ ...p, objPriorite: v })} select={["train_vie", "age_fixe"]} />
        <Field label="Train de vie cible (mensuel net)" value={p.objTrainVie} onChange={(v) => setP({ ...p, objTrainVie: v })} type="number" suffix="CHF/mois" />
        <Field label="Préférence rente / capital" value={p.objPreferenceSortie} onChange={(v) => setP({ ...p, objPreferenceSortie: v })} select={["Rente", "Capital", "Mixte"]} />
        <Field label="Âge de fin de consommation" value={p.objAgeFinConsommation} onChange={(v) => setP({ ...p, objAgeFinConsommation: v })} type="number" suffix="ans" />
        <Field label="Tolérance au risque" value={p.objToleranceRisque} onChange={(v) => setP({ ...p, objToleranceRisque: v })} select={["Prudent", "Équilibré", "Dynamique", "Offensif"]} />
      </div>
      <CheckRow label="Départ progressif envisagé (temps partiel avant retraite complète)" checked={p.objDepartProgressif} onChange={(v) => setP({ ...p, objDepartProgressif: v })} />
      <Field label="Projets spécifiques (voyages, achats, donations, déménagement…)" value={p.objProjets} onChange={(v) => setP({ ...p, objProjets: v })} textarea />
    </div>
  );
}

function PanneauAVS({ p, setP, titre, couleur }) {
  return (
    <div style={S.card}>
      <div style={{ ...S.cardTitle, color: couleur }}><div style={{ ...S.dot, background: couleur }} /> {titre} — 1er Pilier AVS</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="N° AVS" value={p.avsNumero} onChange={(v) => setP({ ...p, avsNumero: v })} placeholder="756.XXXX.XXXX.XX" />
        <Field label="Caisse de compensation" value={p.avsCaisse} onChange={(v) => setP({ ...p, avsCaisse: v })} />
        <Field label="Années de cotisation" value={p.avsAnneesCotisation} onChange={(v) => setP({ ...p, avsAnneesCotisation: v })} type="number" suffix="ans (sur 44)" />
        <Field label="Rente AVS estimée" value={p.avsRenteEstimee} onChange={(v) => setP({ ...p, avsRenteEstimee: v })} type="number" suffix="CHF/mois" />
        <Field label="Lacunes identifiées" value={p.avsLacunes} onChange={(v) => setP({ ...p, avsLacunes: v })} textarea colSpan={2} placeholder="Ex: 2 années jeunesse, période à l'étranger…" />
      </div>
      <CheckRow label="Inclure la 13e rente AVS (premier versement décembre 2026)" checked={p.avs13eRente} onChange={(v) => setP({ ...p, avs13eRente: v })} hint="Réforme AVS21 : +8.3% sur la rente annuelle dès décembre 2026." />
      <CheckRow label="Anticipation de la rente envisagée" checked={p.avsAnticipation} onChange={(v) => setP({ ...p, avsAnticipation: v })} hint="Réduction de 6.8% par année anticipée (max 2 ans)." />
      <CheckRow label="Ajournement de la rente envisagé" checked={p.avsAjournement} onChange={(v) => setP({ ...p, avsAjournement: v })} hint="Supplément de +5.2% à +31.5% (1 à 5 ans)." />
      <Field label="Cotisations AVS prévues en cas d'arrêt anticipé (sans activité lucrative)" value={p.avsCotisationsArretAnticipe} onChange={(v) => setP({ ...p, avsCotisationsArretAnticipe: v })} type="number" suffix="CHF/an" />
    </div>
  );
}

function PanneauLPP({ p, setP, titre, couleur }) {
  const part = partCapitalLPP(p);
  return (
    <div style={S.card}>
      <div style={{ ...S.cardTitle, color: couleur }}><div style={{ ...S.dot, background: couleur }} /> {titre} — 2e Pilier LPP</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Caisse de pension" value={p.lppCaisse} onChange={(v) => setP({ ...p, lppCaisse: v })} />
        <Field label="Taux de couverture de la caisse" value={p.lppTauxCouverture} onChange={(v) => setP({ ...p, lppTauxCouverture: v })} type="number" suffix="%" />
        <Field label="Avoir LPP actuel" value={p.lppAvoirActuel} onChange={(v) => setP({ ...p, lppAvoirActuel: v })} type="number" suffix="CHF" />
        <Field label="Cotisations annuelles (employeur + salarié)" value={p.lppCotisationAnnuelle} onChange={(v) => setP({ ...p, lppCotisationAnnuelle: v })} type="number" suffix="CHF/an" />
        <Field label="Taux de rendement supposé caisse" value={p.lppTauxRendement} onChange={(v) => setP({ ...p, lppTauxRendement: v })} type="number" step="0.25" suffix="% /an" />
        <Field label="Taux de conversion appliqué" value={p.lppTauxConversion} onChange={(v) => setP({ ...p, lppTauxConversion: v })} type="number" step="0.1" suffix="%" />
        <Field label="Capital LPP projeté à l'âge de référence" value={p.lppCapitalProjete} onChange={(v) => setP({ ...p, lppCapitalProjete: v })} type="number" suffix="CHF" />
        <Field label="Rente LPP projetée" value={p.lppRenteProjete} onChange={(v) => setP({ ...p, lppRenteProjete: v })} type="number" suffix="CHF/mois" />
        <Field label="Avoirs de libre-passage" value={p.lppLibrePassage} onChange={(v) => setP({ ...p, lppLibrePassage: v })} type="number" suffix="CHF" />
        <Field label="Potentiel de rachat LPP" value={p.lppPotentielRachat} onChange={(v) => setP({ ...p, lppPotentielRachat: v })} type="number" suffix="CHF" />
        <Field label="Rachats LPP des 3 dernières années" value={p.lppRachats3Ans} onChange={(v) => setP({ ...p, lppRachats3Ans: v })} type="number" suffix="CHF" />
        <Field label="EPL / Mises en gage (montant)" value={p.lppEPL} onChange={(v) => setP({ ...p, lppEPL: v })} type="number" suffix="CHF" />
        <Field label="Choix de sortie" value={p.lppChoixSortie} onChange={(v) => setP({ ...p, lppChoixSortie: v })} select={["Rente", "Capital", "Mixte"]} />
        <Field label="Part prise en capital (si Mixte)" value={p.lppPartCapitalPct} onChange={(v) => setP({ ...p, lppPartCapitalPct: v })} type="number" suffix="%" />
      </div>
      <div style={{ background: "rgba(105,33,2,0.06)", padding: 10, marginTop: 8, fontSize: 11, color: C.darkGray, borderLeft: `3px solid ${couleur}` }}>
        Choix actuel : <strong>{p.lppChoixSortie}</strong> → part en capital retenue pour les calculs : <strong>{Math.round(part * 100)}%</strong>{part >= 0.999 ? " (aucune rente LPP affichée)" : part <= 0.001 ? " (100% rente)" : ""}.
      </div>
      <CheckRow label="Vérifier la présence d'avoirs LPP oubliés (Fondation institution supplétive)" checked={p.lppAvoirsOublies} onChange={(v) => setP({ ...p, lppAvoirsOublies: v })} />
      <div style={{ background: "rgba(165,149,104,0.1)", padding: 12, marginTop: 12, borderLeft: `4px solid ${C.gold}`, fontSize: 11, color: C.darkGray }}>
        <Icons.Alert size={14} color={C.gold} /> <strong>Attention :</strong> Délai de blocage de 3 ans entre un rachat LPP et un retrait en capital.
      </div>
    </div>
  );
}

function Panneau3eP({ p, setP, titre, couleur }) {
  return (
    <div style={S.card}>
      <div style={{ ...S.cardTitle, color: couleur }}><div style={{ ...S.dot, background: couleur }} /> {titre} — 3e Pilier</div>
      <div style={{ fontSize: 11, color: C.gray, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginBottom: 8 }}>3a — Lié</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Avoir 3a (somme des comptes/polices)" value={p.troisPAvoir3a} onChange={(v) => setP({ ...p, troisPAvoir3a: v })} type="number" suffix="CHF" />
        <Field label="Nombre de comptes 3a" value={p.troisPNbComptes} onChange={(v) => setP({ ...p, troisPNbComptes: v })} type="number" />
        <Field label="Cotisation annuelle 3a en cours" value={p.troisPCotisationAnnuelle} onChange={(v) => setP({ ...p, troisPCotisationAnnuelle: v })} type="number" suffix="CHF/an" />
        <Field label="Rendement net supposé" value={p.troisPTauxRendement} onChange={(v) => setP({ ...p, troisPTauxRendement: v })} type="number" step="0.5" suffix="%" />
      </div>
      <Field label="Stratégie d'échelonnement des retraits 3a" value={p.troisPStrategieEchelonnement} onChange={(v) => setP({ ...p, troisPStrategieEchelonnement: v })} textarea />
      <div style={{ fontSize: 11, color: C.gray, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginBottom: 8, marginTop: 16 }}>3b — Libre</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Avoir 3b (assurance-vie libre)" value={p.troisPAvoir3b} onChange={(v) => setP({ ...p, troisPAvoir3b: v })} type="number" suffix="CHF" />
        <Field label="Cotisation annuelle 3b en cours" value={p.troisPCotisation3b} onChange={(v) => setP({ ...p, troisPCotisation3b: v })} type="number" suffix="CHF/an" />
      </div>
      <Field label="Clauses bénéficiaires (3a + 3b)" value={p.troisPClausesBeneficiaires} onChange={(v) => setP({ ...p, troisPClausesBeneficiaires: v })} textarea />
    </div>
  );
}

function PanneauFR({ p, setP, titre, couleur }) {
  return (
    <div style={S.card}>
      <div style={{ ...S.cardTitle, color: couleur }}><div style={{ ...S.dot, background: couleur }} /> {titre} — Volet français</div>
      <CheckRow label="A déjà eu une carrière professionnelle en France" checked={p.frACarriereFrance} onChange={(v) => setP({ ...p, frACarriereFrance: v })} />
      {p.frACarriereFrance && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <Field label="Régime de base" value={p.frRegimeBase} onChange={(v) => setP({ ...p, frRegimeBase: v })} select={["CNAV (salariés)", "MSA (agriculteurs)", "SSI (indépendants)", "Régime spécial"]} />
            <Field label="Trimestres acquis" value={p.frTrimestresAcquis} onChange={(v) => setP({ ...p, frTrimestresAcquis: v })} type="number" />
            <Field label="Trimestres requis pour taux plein" value={p.frTrimestresRequis} onChange={(v) => setP({ ...p, frTrimestresRequis: v })} type="number" placeholder="172" />
            <Field label="Âge légal minimal (départ au plus tôt)" value={p.frAgeMinLegal} onChange={(v) => setP({ ...p, frAgeMinLegal: v })} type="number" suffix="ans" />
            <Field label="Âge du taux plein automatique" value={p.frAgeTauxPlein} onChange={(v) => setP({ ...p, frAgeTauxPlein: v })} type="number" suffix="ans" />
            <Field label="SAM — Salaire annuel moyen (25 meilleures années)" value={p.frSAM} onChange={(v) => setP({ ...p, frSAM: v })} type="number" suffix="EUR/an" />
            <Field label="Pension CNAV estimée (RIS)" value={p.frPensionCnavEstimee} onChange={(v) => setP({ ...p, frPensionCnavEstimee: v })} type="number" suffix="EUR/mois" />
            <Field label="Points AGIRC-ARRCO" value={p.frPointsAgircArrco} onChange={(v) => setP({ ...p, frPointsAgircArrco: v })} type="number" />
            <Field label="Autres régimes (IRCANTEC, spéciaux…)" value={p.frAutresRegimes} onChange={(v) => setP({ ...p, frAutresRegimes: v })} />
          </div>
          <Field label="Lacunes à régulariser (envoyer bulletins à la Carsat)" value={p.frLacunesARegulariser} onChange={(v) => setP({ ...p, frLacunesARegulariser: v })} textarea />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Décision retraite française" value={p.frDecisionRetraiteFR} onChange={(v) => setP({ ...p, frDecisionRetraiteFR: v })} select={["Accepter", "Différer", "Refuser"]} />
            <Field label="Stratégie assurance maladie à la retraite" value={p.frAssuranceMaladie} onChange={(v) => setP({ ...p, frAssuranceMaladie: v })} select={["LAMal maintenue", "CMU + CSG/CRDS", "À déterminer"]} />
          </div>
          <div style={{ background: "rgba(0,85,164,0.08)", padding: 10, marginTop: 8, borderLeft: `3px solid ${C.france}`, fontSize: 11, color: C.darkGray }}>
            <strong>Astuce :</strong> Le RIS (Relevé Individuel de Situation) est téléchargeable sur <strong>info-retraite.fr</strong>.
          </div>
        </>
      )}
    </div>
  );
}

function PanneauEnfants({ enfants, setEnfants }) {
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Enfants & personnes à charge</div>
      {enfants.length === 0 && <div style={{ fontSize: 12, color: C.gray, fontStyle: "italic", padding: "8px 0" }}>Aucun enfant renseigné.</div>}
      {enfants.map((enf, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 130px 32px", gap: 12, marginBottom: 12, alignItems: "end" }}>
          <Field label="Prénom" value={enf.prenom} onChange={(v) => { const a = [...enfants]; a[i].prenom = v; setEnfants(a); }} />
          <Field label="Date de naissance" value={enf.dateNaissance} onChange={(v) => { const a = [...enfants]; a[i].dateNaissance = v; setEnfants(a); }} placeholder="JJ.MM.AAAA" />
          <Field label="À charge" value={enf.aCharge ? "Oui" : "Non"} onChange={(v) => { const a = [...enfants]; a[i].aCharge = v === "Oui"; setEnfants(a); }} select={["Oui", "Non"]} />
          <Field label="Fin d'entretien" value={enf.finEntretien} onChange={(v) => { const a = [...enfants]; a[i].finEntretien = v; setEnfants(a); }} placeholder="Ex: 2030" />
          <button onClick={() => setEnfants(enfants.filter((_, idx) => idx !== i))} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#EF4444", padding: 8 }}><Icons.Trash size={18} /></button>
        </div>
      ))}
      <button onClick={() => setEnfants([...enfants, { prenom: "", dateNaissance: "", aCharge: true, finEntretien: "" }])} style={{ ...S.btnS, padding: "8px 16px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        <Icons.Plus size={14} /> Ajouter un enfant
      </button>
    </div>
  );
}

function PanneauImmobilier({ data, setData }) {
  const u = (k, v) => setData({ ...data, [k]: v });
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Patrimoine immobilier</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.darkGray, marginBottom: 8, textTransform: "uppercase" }}>Résidence principale</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Valeur vénale" value={data.immoResidencePrincipaleValeur} onChange={(v) => u("immoResidencePrincipaleValeur", v)} type="number" suffix="CHF" />
        <Field label="Hypothèque restante" value={data.immoResidencePrincipaleHypotheque} onChange={(v) => u("immoResidencePrincipaleHypotheque", v)} type="number" suffix="CHF" />
        <Field label="Taux d'intérêt" value={data.immoResidencePrincipaleTauxInt} onChange={(v) => u("immoResidencePrincipaleTauxInt", v)} type="number" step="0.05" suffix="%" />
        <Field label="Type d'hypothèque" value={data.immoResidencePrincipaleTypeHypo} onChange={(v) => u("immoResidencePrincipaleTypeHypo", v)} select={["Fixe", "SARON", "Variable"]} />
        <Field label="Mode d'amortissement" value={data.immoAmortissement} onChange={(v) => u("immoAmortissement", v)} select={["Direct", "Indirect"]} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.darkGray, margin: "16px 0 8px", textTransform: "uppercase" }}>Biens en France</div>
      <Field label="Biens immobiliers situés en France" value={data.immoBiensFrance} onChange={(v) => u("immoBiensFrance", v)} textarea />
      <Field label="Projets immobiliers" value={data.immoProjets} onChange={(v) => u("immoProjets", v)} textarea />
    </div>
  );
}

// NOUVEAU — Évènements patrimoniaux datés + montant de base libre
function PanneauPatrimoineEvents({ data, setData }) {
  const events = data.immoEvents || [];
  const setEvents = (e) => setData({ ...data, immoEvents: e });
  const upd = (i, k, v) => { const a = [...events]; a[i] = { ...a[i], [k]: v }; setEvents(a); };
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Évènements patrimoniaux & montant de base</div>
      <p style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.6, marginTop: 0 }}>
        Saisissez les évènements qui modifient le patrimoine (vente d'un bien, achat, donation reçue) à une année donnée. La projection les intègre automatiquement (encaissement net, retrait du bien de l'actif immobilier).
      </p>
      <CheckRow label="Baser la projection sur un capital de départ libre (écrase le calcul automatique du patrimoine financier)" checked={data.useCapitalLibre} onChange={(v) => setData({ ...data, useCapitalLibre: v })} />
      {data.useCapitalLibre && (
        <Field label="Capital financier de départ (montant libre)" value={data.patCapitalLibre} onChange={(v) => setData({ ...data, patCapitalLibre: v })} type="number" suffix="CHF" />
      )}
      <div style={{ fontSize: 11, fontWeight: 700, color: C.darkGray, margin: "12px 0 8px", textTransform: "uppercase" }}>Évènements</div>
      {events.length === 0 && <div style={{ fontSize: 12, color: C.gray, fontStyle: "italic" }}>Aucun évènement.</div>}
      {events.map((e, i) => (
        <div key={e.id || i} style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 110px 1fr 1fr 32px", gap: 10, marginBottom: 10, alignItems: "end" }}>
          <Field label="Libellé" value={e.libelle} onChange={(v) => upd(i, "libelle", v)} placeholder="Vente résidence" />
          <Field label="Année" value={e.annee} onChange={(v) => upd(i, "annee", v)} type="number" />
          <Field label="Type" value={e.type} onChange={(v) => upd(i, "type", v)} select={["vente", "achat", "donation"]} />
          <Field label="Encaissement net" value={e.montantNet} onChange={(v) => upd(i, "montantNet", v)} type="number" suffix="CHF" />
          <Field label="Valeur du bien" value={e.valeurBien} onChange={(v) => upd(i, "valeurBien", v)} type="number" suffix="CHF" />
          <button onClick={() => setEvents(events.filter((_, idx) => idx !== i))} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.bad, padding: 8 }}><Icons.Trash size={18} /></button>
        </div>
      ))}
      <button onClick={() => setEvents([...events, { id: Date.now(), annee: String(new Date().getFullYear() + 1), type: "vente", libelle: "", montantNet: "", valeurBien: "" }])} style={{ ...S.btnS, padding: "8px 16px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        <Icons.Plus size={14} /> Ajouter un évènement
      </button>
    </div>
  );
}

function PanneauPatFinancier({ data, setData }) {
  const u = (k, v) => setData({ ...data, [k]: v });
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Patrimoine financier & engagements</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Comptes courants" value={data.patComptesCourants} onChange={(v) => u("patComptesCourants", v)} type="number" suffix="CHF" />
        <Field label="Épargne / dépôts" value={data.patEpargne} onChange={(v) => u("patEpargne", v)} type="number" suffix="CHF" />
        <Field label="Dépôts-titres / portefeuille" value={data.patDepotsTitres} onChange={(v) => u("patDepotsTitres", v)} type="number" suffix="CHF" />
        <Field label="Crédits en cours" value={data.patCredits} onChange={(v) => u("patCredits", v)} type="number" suffix="CHF" />
        <Field label="Leasings" value={data.patLeasings} onChange={(v) => u("patLeasings", v)} type="number" suffix="CHF" />
        <Field label="Participations / sociétés" value={data.patParticipations} onChange={(v) => u("patParticipations", v)} type="number" suffix="CHF" />
      </div>
      <Field label="Comptes & placements détenus en France" value={data.patComptesFrance} onChange={(v) => u("patComptesFrance", v)} textarea />
    </div>
  );
}

function PanneauBudget({ data, setData }) {
  const u = (k, v) => setData({ ...data, [k]: v });
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Budget & charges courantes</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Coût de la vie mensuel actuel" value={data.budCoutVieMensuel} onChange={(v) => u("budCoutVieMensuel", v)} type="number" suffix="CHF/mois" />
        <Field label="Assurance maladie (mensuel)" value={data.budAssuranceMaladie} onChange={(v) => u("budAssuranceMaladie", v)} type="number" suffix="CHF/mois" />
        <Field label="Autres assurances (mensuel)" value={data.budAutresAssurances} onChange={(v) => u("budAutresAssurances", v)} type="number" suffix="CHF/mois" />
        <Field label="Charge fiscale (annuelle)" value={data.budChargeFiscale} onChange={(v) => u("budChargeFiscale", v)} type="number" suffix="CHF/an" />
        <Field label="Charges immobilières" value={data.budChargesImmo} onChange={(v) => u("budChargesImmo", v)} type="number" suffix="CHF/an" />
        <Field label="Pensions versées (ex-conjoint, etc.)" value={data.budPensionsVersees} onChange={(v) => u("budPensionsVersees", v)} type="number" suffix="CHF/an" />
      </div>
    </div>
  );
}

function PanneauFiscalite({ data, setData }) {
  const u = (k, v) => setData({ ...data, [k]: v });
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Fiscalité & comparatif transfrontalier</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Année de la dernière décision de taxation" value={data.fiscDerniereTaxation} onChange={(v) => u("fiscDerniereTaxation", v)} placeholder="Ex: 2024" />
        <Field label="Revenu imposable CH" value={data.fiscRevenuImposable} onChange={(v) => u("fiscRevenuImposable", v)} type="number" suffix="CHF" />
        <Field label="Fortune imposable CH" value={data.fiscFortuneImposable} onChange={(v) => u("fiscFortuneImposable", v)} type="number" suffix="CHF" />
        <Field label="Impôts français (foncier, IFI)" value={data.fiscImpotsFrance} onChange={(v) => u("fiscImpotsFrance", v)} type="number" suffix="EUR/an" />
      </div>
      <CheckRow label="Imposition à la source en Suisse" checked={data.fiscImpositionSource} onChange={(v) => u("fiscImpositionSource", v)} />
      <CheckRow label="Statut de quasi-résident demandé / acquis" checked={data.fiscQuasiResident} onChange={(v) => u("fiscQuasiResident", v)} hint="Conditions : ≥ 90% des revenus imposables en CH." />
      <div style={{ fontSize: 11, fontWeight: 700, color: C.darkGray, margin: "14px 0 8px", textTransform: "uppercase" }}>Taux retenus pour le comparatif fiscal (page dédiée)</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Impôt capital LPP — Suisse" value={data.fiscTauxCapitalCH} onChange={(v) => u("fiscTauxCapitalCH", v)} type="number" step="0.5" suffix="%" />
        <Field label="Impôt capital LPP — France (PFL)" value={data.fiscTauxCapitalFR} onChange={(v) => u("fiscTauxCapitalFR", v)} type="number" step="0.5" suffix="%" />
        <Field label="Prélèvements sociaux capital — France" value={data.fiscTauxPSCapitalFR} onChange={(v) => u("fiscTauxPSCapitalFR", v)} type="number" step="0.5" suffix="%" />
        <Field label="Impôt rente — Suisse (marginal)" value={data.fiscTauxRenteCH} onChange={(v) => u("fiscTauxRenteCH", v)} type="number" step="0.5" suffix="%" />
        <Field label="Impôt rente — France (barème + CSG)" value={data.fiscTauxRenteFR} onChange={(v) => u("fiscTauxRenteFR", v)} type="number" step="0.5" suffix="%" />
        <Field label="Impôt retrait capital 3a" value={data.tauxImpotCapital3a} onChange={(v) => u("tauxImpotCapital3a", v)} type="number" step="0.5" suffix="%" />
      </div>
    </div>
  );
}

function PanneauRisques({ data, setData }) {
  const u = (k, v) => setData({ ...data, [k]: v });
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Prévoyance risques (décès / invalidité)</div>
      <Field label="Couvertures décès (LPP, 3a, assurances)" value={data.risqueCouvertureDeces} onChange={(v) => u("risqueCouvertureDeces", v)} textarea />
      <Field label="Couvertures invalidité" value={data.risqueCouvertureInvalidite} onChange={(v) => u("risqueCouvertureInvalidite", v)} textarea />
      <Field label="Lacunes pour le conjoint / les enfants" value={data.risqueLacunesConjoint} onChange={(v) => u("risqueLacunesConjoint", v)} textarea />
      <Field label="Clauses bénéficiaires en place" value={data.risqueClausesBeneficiaires} onChange={(v) => u("risqueClausesBeneficiaires", v)} textarea />
      <Field label="Couverture accident (LAA) après arrêt d'activité" value={data.risqueLAARetraite} onChange={(v) => u("risqueLAARetraite", v)} />
    </div>
  );
}

function PanneauSuccession({ data, setData }) {
  const u = (k, v) => setData({ ...data, [k]: v });
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Succession & aspects juridiques</div>
      <CheckRow label="Testament rédigé" checked={data.succTestament} onChange={(v) => u("succTestament", v)} />
      <CheckRow label="Pacte successoral" checked={data.succPacteSuccessoral} onChange={(v) => u("succPacteSuccessoral", v)} />
      <CheckRow label="Contrat de mariage" checked={data.succContratMariage} onChange={(v) => u("succContratMariage", v)} />
      <CheckRow label="Mandat pour cause d'inaptitude / directives anticipées" checked={data.succMandatInaptitude} onChange={(v) => u("succMandatInaptitude", v)} />
      <Field label="Donations déjà faites ou envisagées" value={data.succDonations} onChange={(v) => u("succDonations", v)} textarea />
      <Field label="Objectifs de transmission" value={data.succObjectifsTransmission} onChange={(v) => u("succObjectifsTransmission", v)} textarea />
      <Field label="Loi applicable choisie (Règlement UE 650/2012)" value={data.succLoiApplicable} onChange={(v) => u("succLoiApplicable", v)} select={["Suisse", "France", "À déterminer"]} />
    </div>
  );
}

function PanneauHypotheses({ data, setData }) {
  const u = (k, v) => setData({ ...data, [k]: v });
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Présentation & hypothèses de l'étude</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Type d'étude" value={data.studyType} onChange={(v) => u("studyType", v)} select={["retraite", "patrimoine", "prevoyance", "fiscalite"]} />
        <Field label="Public visé" value={data.studyAudience} onChange={(v) => u("studyAudience", v)} />
        <Field label="Titre du rapport (page de garde)" value={data.studyTitle} onChange={(v) => u("studyTitle", v)} colSpan={2} />
        <Field label="Sous-titre / accroche" value={data.studySubtitle} onChange={(v) => u("studySubtitle", v)} textarea colSpan={2} />
      </div>
      {data.isCouple && (
        <Field label="Mode de projection (couple)" value={data.coupleProjectionMode === "commune" ? "Commune (synthèse ménage)" : "Séparée (Mr puis Mme)"} onChange={(v) => u("coupleProjectionMode", v.startsWith("Commune") ? "commune" : "separee")} select={["Séparée (Mr puis Mme)", "Commune (synthèse ménage)"]} />
      )}
      <div style={{ fontSize: 11, fontWeight: 700, color: C.darkGray, margin: "12px 0 8px", textTransform: "uppercase" }}>Hypothèses financières</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Taux de rendement du patrimoine" value={data.tauxRendement} onChange={(v) => u("tauxRendement", v)} type="number" step="0.5" suffix="% /an" />
        <Field label="Taux d'inflation / indexation" value={data.tauxInflation} onChange={(v) => u("tauxInflation", v)} type="number" step="0.1" suffix="% /an" />
        <Field label="Taux de change EUR / CHF retenu" value={data.tauxChangeEurChf} onChange={(v) => u("tauxChangeEurChf", v)} type="number" step="0.01" suffix="CHF par EUR" />
        <Field label="Pays de résidence prévu à la retraite" value={data.paysResidenceRetraite} onChange={(v) => u("paysResidenceRetraite", v)} select={["Suisse", "France", "Autre UE", "Hors UE"]} />
      </div>
      <Field label="Texte de confidentialité (pied de page / mentions)" value={data.confidentialiteTexte} onChange={(v) => u("confidentialiteTexte", v)} textarea />
      <Field label="Notes du conseiller" value={data.notesConseiller} onChange={(v) => u("notesConseiller", v)} textarea />
      <Field label="Points d'attention spécifiques" value={data.pointsAttention} onChange={(v) => u("pointsAttention", v)} textarea />
    </div>
  );
}

function PanneauConseiller({ data, setData, appSettings }) {
  const u = (k, v) => setData({ ...data, [k]: v });
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Votre signature de planification</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Nom complet" value={data.conseiller} onChange={(v) => u("conseiller", v)} />
        <Field label="Titre" value={data.titreConseiller} onChange={(v) => u("titreConseiller", v)} />
        <Field label="Téléphone" value={data.telephone} onChange={(v) => u("telephone", v)} />
        <Field label="Email" value={data.email} onChange={(v) => u("email", v)} />
      </div>
      <button onClick={() => setData({
        ...data,
        conseiller: `${appSettings?.agentFirstName || ""} ${appSettings?.agentLastName || ""}`.trim() || data.conseiller,
        titreConseiller: appSettings?.agentTitle || data.titreConseiller,
        telephone: appSettings?.agentPhone || data.telephone,
        email: appSettings?.agentEmail || data.email,
      })} style={{ ...S.btnS, padding: "8px 16px", fontSize: 11, marginTop: 8 }}>
        Pré-remplir depuis mon profil
      </button>
    </div>
  );
}

// ─── Arbitrage santé — affichage ANNUEL (1 an) ───
function PanneauArbitrageSante({ data, setData }) {
  const u = (k, v) => setData({ ...data, [k]: v });
  const arbitrage = useMemo(() => calcArbitrageSante(data.client, data), [data]);
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Arbitrage transfrontalier santé / fiscalité</div>
      <p style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.6, marginTop: 0 }}>
        Coût <strong>annuel</strong> de chaque stratégie d'assurance maladie à la retraite (le choix est l'un des plus impactants pour un frontalier résidant en France).
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Prime LAMal annuelle (retraite)" value={data.primeLAMalAnnuelle} onChange={(v) => u("primeLAMalAnnuelle", v)} type="number" suffix="CHF/an" />
        <Field label="Cotisation CMU subsidiaire" value={data.cotisationCMUSubsidiaire} onChange={(v) => u("cotisationCMUSubsidiaire", v)} type="number" suffix="EUR/an" />
        <Field label="Taux CSG/CRDS/CASA" value={data.tauxCSGCRDSCASA} onChange={(v) => u("tauxCSGCRDSCASA", v)} type="number" step="0.1" suffix="%" />
        <Field label="Stratégie retenue" value={data.arbitrageSanteRetenu} onChange={(v) => u("arbitrageSanteRetenu", v)} select={["A", "B", "C", "D"]} />
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: C.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Coût annuel par scénario</div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, fontSize: 12 }}>
        <thead>
          <tr style={{ background: C.primary, color: C.white }}>
            <th style={{ padding: "8px 10px", textAlign: "left" }}>Scénario</th>
            <th style={{ padding: "8px 10px", textAlign: "left" }}>Description</th>
            <th style={{ padding: "8px 10px", textAlign: "right" }}>Coût / an</th>
            <th style={{ padding: "8px 10px", textAlign: "center" }}>Choix</th>
          </tr>
        </thead>
        <tbody>
          {arbitrage.scenarios.map((s) => {
            const isMeilleur = s.id === arbitrage.meilleur.id;
            return (
              <tr key={s.id} style={{ borderBottom: `1px solid ${C.lightGray}`, background: isMeilleur ? "rgba(16,185,129,0.08)" : "transparent" }}>
                <td style={{ padding: "8px 10px", fontWeight: 700, color: isMeilleur ? C.ok : C.darkGray }}>{s.id} — {s.label}</td>
                <td style={{ padding: "8px 10px", color: C.gray }}>{s.detail}</td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: isMeilleur ? C.ok : C.darkGray, whiteSpace: "nowrap" }}>CHF {fmt(s.coutAnnuel)}</td>
                <td style={{ padding: "8px 10px", textAlign: "center" }}>
                  <input type="radio" name="arbitrageSante" checked={data.arbitrageSanteRetenu === s.id} onChange={() => u("arbitrageSanteRetenu", s.id)} style={{ accentColor: C.primary }} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop: 12, background: "rgba(16,185,129,0.08)", padding: 12, borderLeft: `4px solid ${C.ok}`, fontSize: 12, color: C.darkGray }}>
        <strong style={{ color: C.ok }}>Recommandation :</strong> Scénario <strong>{arbitrage.meilleur.label}</strong>. Économie annuelle vs pire scénario : <strong>CHF {fmt(arbitrage.gainAnnuel)} / an</strong>.
      </div>
      <Field label="Commentaire / réserve sur le choix retenu" value={data.arbitrageSanteCommentaire} onChange={(v) => u("arbitrageSanteCommentaire", v)} textarea placeholder="Ex: stratégie à valider par fiduciaire…" />
    </div>
  );
}

function PanneauEconomiesPartenaires({ data, setData }) {
  const u = (k, v) => setData({ ...data, [k]: v });
  const gain = useMemo(() => calcGainTotal(data), [data]);
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Économies via partenaires & gain total du conseil</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Économies frais bancaires annuelles" value={data.economiesFraisAnnuelles} onChange={(v) => u("economiesFraisAnnuelles", v)} type="number" suffix="CHF/an" />
        <Field label="Durée d'estimation des économies" value={data.economiesPartenairesAnneesEstimees} onChange={(v) => u("economiesPartenairesAnneesEstimees", v)} type="number" suffix="ans" />
      </div>
      <Field label="Partenaires recommandés" value={data.partenairesDescription} onChange={(v) => u("partenairesDescription", v)} textarea />
      <div style={{ marginTop: 12, background: C.primary, color: C.white, padding: 16 }}>
        <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Chiffrage consolidé du gain total</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
          <div>Gain choix âge AVS</div><div style={{ textAlign: "right", fontWeight: 700 }}>CHF {fmt(gain.gainAgeAVS)}</div>
          <div>Gain stratégie maladie</div><div style={{ textAlign: "right", fontWeight: 700 }}>CHF {fmt(gain.gainStrategieMaladie)}</div>
          <div>Économies de change (partenaires)</div><div style={{ textAlign: "right", fontWeight: 700 }}>CHF {fmt(gain.economiesChange)}</div>
          <div>Économies frais bancaires</div><div style={{ textAlign: "right", fontWeight: 700 }}>CHF {fmt(gain.economiesFrais)}</div>
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,0.2)", margin: "12px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 18, fontWeight: 900 }}>
          <span>TOTAL ESTIMÉ</span><span style={{ color: C.gold }}>CHF {fmt(gain.total)}</span>
        </div>
      </div>
    </div>
  );
}

function PanneauScenariosLPP({ data, setData }) {
  const u = (k, v) => setData({ ...data, [k]: v });
  const scenarios = useMemo(() => calc3ScenariosLPP(data.client, data), [data]);
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> 3 scénarios de sortie LPP — Comparaison chiffrée</div>
      <p style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.6, marginTop: 0 }}>
        Capital LPP projeté : <strong>CHF {fmt(scenarios.capital)}</strong>. Comparaison sur {scenarios.dureeRetraite} ans de retraite.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Taux d'impôt forfaitaire sur capital LPP" value={data.tauxImpotCapitalLPP} onChange={(v) => u("tauxImpotCapitalLPP", v)} type="number" step="0.5" suffix="%" />
        <Field label="Taux d'impôt marginal sur rente" value={data.tauxImpotRenteLPP} onChange={(v) => u("tauxImpotRenteLPP", v)} type="number" step="0.5" suffix="%" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
        {scenarios.scenarios.map((sc) => {
          const isMax = sc.netTotal === Math.max(...scenarios.scenarios.map(s => s.netTotal));
          return (
            <div key={sc.id} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${isMax ? C.ok : C.gold}`, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: isMax ? C.ok : C.primary, marginBottom: 8 }}>{sc.label}</div>
              <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.8 }}>
                <div>Capital perçu : <strong>CHF {fmt(sc.capitalPercu)}</strong></div>
                <div>Rente / an : <strong>CHF {fmt(sc.rentePercue)}</strong></div>
                <div>Impôts totaux : <strong style={{ color: C.bad }}>CHF {fmt(sc.impots)}</strong></div>
              </div>
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.lightGray}`, fontSize: 13, fontWeight: 800, color: isMax ? C.ok : C.primary }}>
                Net : CHF {fmt(sc.netTotal)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// NOUVEAU — Onglet Solutions (catalogue éditable)
function PanneauSolutions({ data, setData }) {
  const sols = data.solutions || [];
  const setSols = (s) => setData({ ...data, solutions: s });
  const upd = (i, k, v) => { const a = [...sols]; a[i] = { ...a[i], [k]: v }; setSols(a); };
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Solutions recommandées (catalogue éditable)</div>
      <p style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.6, marginTop: 0 }}>
        Activez et personnalisez les solutions à présenter. Chaque solution active génère une projection capital → rente et un tableau de rendement dans le rapport.
      </p>
      {sols.map((sol, i) => {
        const proj = projetteSolution(sol);
        return (
          <div key={sol.id} style={{ border: `1px solid ${C.mediumGray}`, borderLeft: `4px solid ${sol.actif ? C.gold : C.mediumGray}`, padding: 16, marginBottom: 14, background: sol.actif ? C.white : "rgba(0,0,0,0.015)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={!!sol.actif} onChange={(e) => upd(i, "actif", e.target.checked)} style={{ accentColor: C.primary, width: 16, height: 16 }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: sol.actif ? C.primary : C.gray }}>{sol.nom || "Nouvelle solution"}</span>
              </label>
              <button onClick={() => setSols(sols.filter((_, idx) => idx !== i))} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.bad }}><Icons.Trash size={16} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 10 }}>
              <Field label="Nom de la solution" value={sol.nom} onChange={(v) => upd(i, "nom", v)} />
              <Field label="Catégorie" value={sol.categorie} onChange={(v) => upd(i, "categorie", v)} />
              <Field label="Bénéficiaire" value={sol.beneficiaire} onChange={(v) => upd(i, "beneficiaire", v)} select={["Client", "Conjoint(e)", "Ménage"]} />
              <Field label="Capital alloué" value={sol.capital} onChange={(v) => upd(i, "capital", v)} type="number" suffix="CHF" />
              <Field label="Taux de conversion (→rente)" value={sol.tauxConversion} onChange={(v) => upd(i, "tauxConversion", v)} type="number" step="0.1" suffix="%" />
              <Field label="Rendement annuel" value={sol.tauxRendement} onChange={(v) => upd(i, "tauxRendement", v)} type="number" step="0.5" suffix="%" />
              <Field label="Rente annuelle (si fixe)" value={sol.renteAnnuelle} onChange={(v) => upd(i, "renteAnnuelle", v)} type="number" suffix="CHF" />
              <Field label="Durée de projection" value={sol.dureeAnnees} onChange={(v) => upd(i, "dureeAnnees", v)} type="number" suffix="ans" />
              <div style={{ alignSelf: "end", fontSize: 11, color: C.primary, fontWeight: 700, paddingBottom: 18 }}>
                ≈ Rente projetée : CHF {fmt(proj.renteMensuelle)} /mois
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Avantages (1 par ligne)" value={sol.avantages} onChange={(v) => upd(i, "avantages", v)} textarea />
              <Field label="Inconvénients (1 par ligne)" value={sol.inconvenients} onChange={(v) => upd(i, "inconvenients", v)} textarea />
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setSols([...sols, solutionVide()])} style={{ ...S.btnS, padding: "8px 16px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 6 }}><Icons.Plus size={14} /> Solution vierge</button>
        <button onClick={() => setSols([...sols, ...catalogueSolutions()])} style={{ ...S.btnS, padding: "8px 16px", fontSize: 11 }}>Recharger le catalogue</button>
      </div>
    </div>
  );
}

function PanneauPlanActions({ data }) {
  const actions = useMemo(() => generatePlanActions(data), [data]);
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Plan d'actions calendaire (généré automatiquement)</div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, fontSize: 12 }}>
        <thead>
          <tr style={{ background: C.primary, color: C.white }}>
            <th style={{ padding: "8px 10px", textAlign: "left" }}>Date</th>
            <th style={{ padding: "8px 10px", textAlign: "left" }}>Action</th>
            <th style={{ padding: "8px 10px", textAlign: "left" }}>Destinataire</th>
            <th style={{ padding: "8px 10px", textAlign: "center" }}>Priorité</th>
          </tr>
        </thead>
        <tbody>
          {actions.map((a, i) => {
            const color = a.importance === "haute" ? C.bad : a.importance === "moyenne" ? C.warn : C.ok;
            return (
              <tr key={i} style={{ borderBottom: `1px solid ${C.lightGray}` }}>
                <td style={{ padding: "8px 10px", color: C.darkGray, fontWeight: 600, whiteSpace: "nowrap" }}>{a.annee} · {a.mois}</td>
                <td style={{ padding: "8px 10px", color: C.darkGray }}>{a.action}</td>
                <td style={{ padding: "8px 10px", color: C.gray, fontStyle: "italic" }}>{a.destinataire}</td>
                <td style={{ padding: "8px 10px", textAlign: "center" }}>
                  <span style={{ display: "inline-block", padding: "2px 8px", background: color, color: C.white, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{a.importance}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// WIZARD R1
// ============================================================
function WizardR1({ data, setData, appSettings, onPreview, onSave }) {
  const [step, setStep] = useState(0);
  const setClient = (p) => setData({ ...data, client: p });
  const setConjoint = (p) => setData({ ...data, conjoint: p });

  const labels = [
    "Démarrage", "Identité", "Objectifs", "Professionnel",
    "AVS", "LPP", "3e P", "Scénarios LPP",
    "Immo + Pat.", "Budget", "Volet FR", "Arbitrage Santé",
    "Fiscalité", "Risques + Succ.", "Solutions", "Hypothèses",
    "Plan + Gain", "Aperçu"
  ];

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div style={S.card}>
            <div style={S.cardTitle}><div style={S.dot} /> Démarrage du R1</div>
            <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.6, marginTop: 0 }}>
              Check-list <strong>WallSwiss R1</strong>. Renseignez le type d'étude, le mode couple, puis parcourez les sections.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Date du rendez-vous" value={data.dateRapport} onChange={(v) => setData({ ...data, dateRapport: v })} type="date" />
              <Field label="Type d'étude" value={data.studyType} onChange={(v) => setData({ ...data, studyType: v })} select={["retraite", "patrimoine", "prevoyance", "fiscalite"]} />
            </div>
            <CheckRow label="Couple" checked={data.isCouple} onChange={(v) => setData({ ...data, isCouple: v })} />
            {data.isCouple && (
              <Field label="Mode de projection" value={data.coupleProjectionMode === "commune" ? "Commune (synthèse ménage)" : "Séparée (Mr puis Mme)"} onChange={(v) => setData({ ...data, coupleProjectionMode: v.startsWith("Commune") ? "commune" : "separee" })} select={["Séparée (Mr puis Mme)", "Commune (synthèse ménage)"]} />
            )}
            <CheckRow label="Afficher les pages d'intercalaires (citations / pages de garde entre les sections)" checked={data.showCitations !== false} onChange={(v) => setData({ ...data, showCitations: v })} hint="Pages de transition élégantes pour changer de sujet. Décochez pour un rapport plus compact." />
            <div style={{ background: C.lightGray, padding: 16, marginTop: 16, borderLeft: `4px solid ${C.gold}`, fontSize: 12, color: C.darkGray, lineHeight: 1.6 }}>
              <strong>Confidentialité.</strong> Données utilisées uniquement pour la planification, conservées selon LPD/RGPD.
            </div>
          </div>
        );
      case 1:
        return (<>
          <PanneauIdentite p={data.client} setP={setClient} titre="Monsieur — Client principal" couleur={C.primary} />
          {data.isCouple && <PanneauIdentite p={data.conjoint} setP={setConjoint} titre="Madame — Conjoint(e)" couleur={C.gold} />}
          <PanneauEnfants enfants={data.enfants} setEnfants={(e) => setData({ ...data, enfants: e })} />
        </>);
      case 2:
        return (<>
          <PanneauObjectifs p={data.client} setP={setClient} titre="Vision retraite — Monsieur" couleur={C.primary} />
          {data.isCouple && <PanneauObjectifs p={data.conjoint} setP={setConjoint} titre="Vision retraite — Madame" couleur={C.gold} />}
        </>);
      case 3:
        return (<>
          <PanneauPro p={data.client} setP={setClient} titre="Pro — Monsieur" couleur={C.primary} />
          {data.isCouple && <PanneauPro p={data.conjoint} setP={setConjoint} titre="Pro — Madame" couleur={C.gold} />}
        </>);
      case 4:
        return (<>
          <PanneauAVS p={data.client} setP={setClient} titre="Monsieur" couleur={C.primary} />
          {data.isCouple && <PanneauAVS p={data.conjoint} setP={setConjoint} titre="Madame" couleur={C.gold} />}
        </>);
      case 5:
        return (<>
          <PanneauLPP p={data.client} setP={setClient} titre="Monsieur" couleur={C.primary} />
          {data.isCouple && <PanneauLPP p={data.conjoint} setP={setConjoint} titre="Madame" couleur={C.gold} />}
        </>);
      case 6:
        return (<>
          <Panneau3eP p={data.client} setP={setClient} titre="Monsieur" couleur={C.primary} />
          {data.isCouple && <Panneau3eP p={data.conjoint} setP={setConjoint} titre="Madame" couleur={C.gold} />}
        </>);
      case 7:
        return <PanneauScenariosLPP data={data} setData={setData} />;
      case 8:
        return (<>
          <PanneauImmobilier data={data} setData={setData} />
          <PanneauPatFinancier data={data} setData={setData} />
          <PanneauPatrimoineEvents data={data} setData={setData} />
        </>);
      case 9:
        return <PanneauBudget data={data} setData={setData} />;
      case 10:
        return (<>
          <PanneauFR p={data.client} setP={setClient} titre="Monsieur" couleur={C.france} />
          {data.isCouple && <PanneauFR p={data.conjoint} setP={setConjoint} titre="Madame" couleur={C.france} />}
        </>);
      case 11:
        return <PanneauArbitrageSante data={data} setData={setData} />;
      case 12:
        return <PanneauFiscalite data={data} setData={setData} />;
      case 13:
        return (<>
          <PanneauRisques data={data} setData={setData} />
          <PanneauSuccession data={data} setData={setData} />
        </>);
      case 14:
        return <PanneauSolutions data={data} setData={setData} />;
      case 15:
        return (<>
          <PanneauHypotheses data={data} setData={setData} />
          <PanneauConseiller data={data} setData={setData} appSettings={appSettings} />
        </>);
      case 16:
        return (<>
          <PanneauEconomiesPartenaires data={data} setData={setData} />
          <PanneauPlanActions data={data} />
          <RecapEtAction data={data} onPreview={onPreview} onSave={onSave} />
        </>);
      case 17:
        return <RecapEtAction data={data} onPreview={onPreview} onSave={onSave} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 24 }}>
        {labels.map((l, i) => (
          <div key={i} onClick={() => setStep(i)} style={{
            padding: "8px 10px", fontSize: 10,
            fontWeight: step === i ? 700 : 600,
            color: step === i ? C.white : step > i ? C.primary : C.gray,
            background: step === i ? C.primary : step > i ? "rgba(105,33,2,0.06)" : C.white,
            border: `1px solid ${step === i ? C.primary : step > i ? "rgba(105,33,2,0.1)" : C.mediumGray}`,
            cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.2s", whiteSpace: "nowrap"
          }}>{i + 1}. {l}</div>
        ))}
      </div>
      {renderStep()}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <button style={{ ...S.btnS, opacity: step === 0 ? 0.3 : 1, pointerEvents: step === 0 ? "none" : "auto" }} onClick={() => setStep(s => s - 1)}>← Précédent</button>
        {step < labels.length - 1 && <button style={S.btnP} onClick={() => setStep(s => s + 1)}>Étape suivante →</button>}
      </div>
    </div>
  );
}

function RecapEtAction({ data, onPreview, onSave }) {
  const synthClient = useMemo(() => calcSyntheseRetraite(data.client, data), [data]);
  const synthConjoint = useMemo(() => data.isCouple ? calcSyntheseRetraite(data.conjoint, data) : null, [data]);
  const menage = useMemo(() => calcSyntheseMenage(data), [data]);
  const gain = useMemo(() => calcGainTotal(data), [data]);
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Synthèse rapide avant génération</div>
      <div style={{ display: "grid", gridTemplateColumns: data.isCouple ? "1fr 1fr" : "1fr", gap: 16, marginBottom: 16 }}>
        <CarteSynthese titre={`${data.client.prenom} ${data.client.nom}`.trim() || "Monsieur"} synth={synthClient} couleur={C.primary} />
        {data.isCouple && <CarteSynthese titre={`${data.conjoint.prenom} ${data.conjoint.nom}`.trim() || "Madame"} synth={synthConjoint} couleur={C.gold} />}
      </div>
      {data.isCouple && data.coupleProjectionMode === "commune" && (
        <div style={{ background: C.darkGray, color: C.white, padding: 14, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.gold, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Ménage — revenu rente consolidé</span>
          <span style={{ fontSize: 20, fontWeight: 900 }}>CHF {fmt(menage.revenuRenteMensuel)} /mois</span>
        </div>
      )}
      <div style={{ background: C.primary, color: C.white, padding: 16, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: C.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Gain total estimé du conseil</span>
        <span style={{ fontSize: 22, fontWeight: 900 }}>CHF {fmt(gain.total)}</span>
      </div>
      <div style={{ background: C.lightGray, padding: 16, fontSize: 12, color: C.darkGray, lineHeight: 1.6 }}>
        <strong>Hypothèses :</strong> rendement {data.tauxRendement}% — inflation {data.tauxInflation}% — change EUR/CHF {data.tauxChangeEurChf} — résidence retraite : {data.paysResidenceRetraite}.
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
        <button style={S.btnS} onClick={onPreview}>Aperçu rapport</button>
        <button style={S.btnP} onClick={onSave}>Enregistrer & ouvrir</button>
      </div>
    </div>
  );
}

function CarteSynthese({ titre, synth, couleur }) {
  if (!synth) return null;
  const ecartColor = synth.ecart > 0 ? C.bad : C.ok;
  return (
    <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 20, borderTop: `4px solid ${couleur}` }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: couleur, marginBottom: 12 }}>{titre}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
        <div style={{ color: C.gray }}>AVS / mois</div><div style={{ fontWeight: 700, textAlign: "right", whiteSpace: "nowrap" }}>CHF {fmt(synth.avs.renteMensuelle)}</div>
        <div style={{ color: C.gray }}>LPP rente / mois</div><div style={{ fontWeight: 700, textAlign: "right", whiteSpace: "nowrap" }}>CHF {fmt(synth.renteLPPAjusteeMensuelle)}</div>
        <div style={{ color: C.gray }}>Pensions FR / mois</div><div style={{ fontWeight: 700, textAlign: "right", whiteSpace: "nowrap" }}>CHF {fmt(synth.pensionsFRChfMensuelle)}</div>
        <div style={{ color: C.gray }}>3e P. + capital LPP</div><div style={{ fontWeight: 700, textAlign: "right", whiteSpace: "nowrap" }}>CHF {fmt(synth.capitalTotal)}</div>
      </div>
      <div style={{ height: 1, background: C.lightGray, margin: "12px 0" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
        <div style={{ color: C.primary, fontWeight: 600 }}>Revenu rente / mois</div><div style={{ fontWeight: 800, textAlign: "right", color: C.primary, whiteSpace: "nowrap" }}>CHF {fmt(synth.revenuRenteAjusteMensuel)}</div>
        <div style={{ color: C.gray }}>Objectif</div><div style={{ fontWeight: 700, textAlign: "right", whiteSpace: "nowrap" }}>CHF {fmt(synth.objectifMensuel)}</div>
        <div style={{ color: ecartColor, fontWeight: 600 }}>Écart</div><div style={{ fontWeight: 800, textAlign: "right", color: ecartColor, whiteSpace: "nowrap" }}>{synth.ecart > 0 ? "-" : "+"} CHF {fmt(Math.abs(synth.ecartMensuel))} /mois</div>
      </div>
    </div>
  );
}

// ============================================================
// SLIDES PDF — A4 portrait (794 × 1123 px)
// ============================================================
const PAGE_W = 794;
const PAGE_H = 1123;

const pageBase = {
  width: `${PAGE_W}px`, height: `${PAGE_H}px`, position: "relative",
  overflow: "hidden", fontFamily: "'Montserrat', sans-serif",
  background: C.white, textAlign: "left", boxSizing: "border-box",
};

const STUDY_LABELS = {
  retraite: "Planification retraite",
  patrimoine: "Étude patrimoniale",
  prevoyance: "Étude de prévoyance",
  fiscalite: "Étude fiscale",
};

function PageHeader({ data, num, titreSection }) {
  const typeLabel = STUDY_LABELS[data.studyType] || "Planification";
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 60, background: C.white, borderBottom: `2px solid ${C.primary}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", zIndex: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ background: C.primary, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 3 }}>
          <Logo size={22} variant="white" />
        </div>
        <div>
          <div style={{ fontSize: 9, color: C.gold, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>WallSwiss · {typeLabel}</div>
          <div style={{ fontSize: 11, color: C.primary, fontWeight: 700 }}>{titreSection}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 8, color: C.gray, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>Confidentiel</span>
        {num ? <span style={{ fontSize: 11, color: C.white, background: C.primary, padding: "3px 9px", fontWeight: 700, borderRadius: 2 }}>{num}</span> : null}
      </div>
    </div>
  );
}

function PageFooter({ data, num }) {
  const fullName = data.isCouple && data.conjoint.prenom
    ? `${data.client.prenom} ${(data.client.nom || "").toUpperCase()} & ${data.conjoint.prenom} ${(data.conjoint.nom || "").toUpperCase()}`
    : `${data.client.prenom} ${(data.client.nom || "").toUpperCase()}`;
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10 }}>
      <div style={{ background: C.lightGray, padding: "3px 40px", fontSize: 7.5, color: C.gray, lineHeight: 1.3, borderTop: `1px solid ${C.mediumGray}` }}>
        {data.confidentialiteTexte || "Document confidentiel — usage strictement privé."}
      </div>
      <div style={{ height: 30, background: C.primary, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Logo size={14} variant="white" />
          <span style={{ color: C.white, fontSize: 9, fontWeight: 600, letterSpacing: "0.06em" }}>WallSwiss — {fullName}</span>
        </span>
        <span style={{ color: C.gold, fontSize: 9, fontWeight: 700 }}>{num ? `Page ${num}` : "Confidentiel"}</span>
      </div>
    </div>
  );
}

function SlideCouverture({ data }) {
  const fullName = data.isCouple && data.conjoint.prenom
    ? `${data.client.prenom} ${(data.client.nom || "").toUpperCase()} & ${data.conjoint.prenom} ${(data.conjoint.nom || "").toUpperCase()}`
    : `${data.client.prenom} ${(data.client.nom || "").toUpperCase()}`;
  const dateStr = data.dateRapport ? new Date(data.dateRapport).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : "";
  const titre = data.studyTitle || (STUDY_LABELS[data.studyType] || "Planification");
  const titreParts = titre.split(" ");
  const titre1 = titreParts.slice(0, Math.ceil(titreParts.length / 2)).join(" ");
  const titre2 = titreParts.slice(Math.ceil(titreParts.length / 2)).join(" ");
  return (
    <div style={{ ...pageBase, background: `linear-gradient(180deg, ${C.primary} 0%, ${C.primaryDark} 100%)` }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 8, background: C.gold }} />
      <div style={{ padding: "80px 60px 40px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box" }}>
        <div>
          <div style={{ background: C.white, width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 60, borderRadius: 4 }}>
            <Logo size={48} variant="color" />
          </div>
          <div style={{ color: C.gold, fontSize: 12, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 20 }}>Étude personnalisée · {data.studyAudience || ""}</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", color: C.white, fontSize: 52, fontWeight: 700, lineHeight: 1.05, marginBottom: 16 }}>
            {titre1}<br/><em style={{ color: C.gold, fontStyle: "italic" }}>{titre2}</em>
          </div>
          <div style={{ width: 60, height: 4, background: C.gold, marginTop: 32, marginBottom: 32 }} />
          <div style={{ color: C.white, fontSize: 15, fontWeight: 300, lineHeight: 1.6, opacity: 0.92, maxWidth: 500, whiteSpace: "pre-line" }}>
            {data.studySubtitle}
          </div>
        </div>
        <div>
          <div style={{ borderTop: `1px solid rgba(255,255,255,0.2)`, paddingTop: 24 }}>
            <div style={{ color: C.gold, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>Préparé pour</div>
            <div style={{ color: C.white, fontSize: 24, fontWeight: 700, marginBottom: 24 }}>{fullName}</div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 32 }}>
              <div>
                <div style={{ color: C.gold, fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Date</div>
                <div style={{ color: C.white, fontSize: 13, fontWeight: 500 }}>{dateStr}</div>
              </div>
              <div>
                <div style={{ color: C.gold, fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Votre conseiller</div>
                <div style={{ color: C.white, fontSize: 13, fontWeight: 500 }}>{data.conseiller || "—"}</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>{data.titreConseiller}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideSommaire({ data, parts }) {
  return (
    <div style={pageBase}>
      <PageHeader data={data} num="" titreSection="Sommaire" />
      <div style={{ padding: "78px 44px 70px", height: "100%", boxSizing: "border-box", overflow: "hidden" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 4 }}>Table des matières</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, color: C.primary, fontWeight: 700 }}>Sommaire <em style={{ color: C.gold }}>du rapport</em></div>
        </div>
        <div style={{ columnCount: 2, columnGap: 24 }}>
          {parts.map((part, pi) => (
            <div key={pi} style={{ marginBottom: 9, breakInside: "avoid" }}>
              <div style={{ background: C.primary, color: C.white, padding: "4px 9px", fontSize: 9.5, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>{part.titre}</div>
              {part.sections.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", padding: "3px 8px", borderBottom: `1px solid ${C.lightGray}`, fontSize: 10 }}>
                  <div style={{ width: 26, color: C.gold, fontWeight: 800, fontSize: 9 }}>{s.num}</div>
                  <div style={{ flex: 1, color: C.darkGray, fontWeight: 500 }}>{s.titre}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

function CarteProfil({ p, couleur }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 20, borderTop: `4px solid ${couleur}` }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: couleur, marginBottom: 4 }}>{p.prenom} {(p.nom || "").toUpperCase()}</div>
      <div style={{ fontSize: 11, color: C.gray, marginBottom: 16 }}>{p.age} ans · {p.nationalite} · {p.permisType || "—"}</div>
      <div style={{ fontSize: 12, lineHeight: 1.8, color: C.darkGray }}>
        <div><strong style={{ color: C.gray }}>Statut :</strong> {p.statutMatrimonial}</div>
        <div><strong style={{ color: C.gray }}>Profession :</strong> {p.statutPro} {p.employeur && `— ${p.employeur}`}</div>
        <div><strong style={{ color: C.gray }}>Revenu :</strong> CHF {fmt(p.revenusBrut)} /an brut ({p.tauxOccupation}%)</div>
        <div><strong style={{ color: C.gray }}>Domicile fiscal :</strong> {p.domicileFiscal || "—"}</div>
        <div><strong style={{ color: C.gray }}>Départ visé :</strong> {p.objAgeDepart} ans · train de vie CHF {fmt(p.objTrainVie)} /mois</div>
      </div>
    </div>
  );
}

function BlocVision({ p, couleur, titre }) {
  return (
    <div style={{ background: C.lightGray, padding: 18, borderLeft: `4px solid ${couleur}` }}>
      <div style={{ fontSize: 11, color: couleur, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{titre}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12 }}>
        <div><div style={{ color: C.gray, marginBottom: 2 }}>Âge de départ</div><div style={{ fontSize: 18, fontWeight: 800, color: C.primaryDark }}>{p.objAgeDepart || "—"} ans</div></div>
        <div><div style={{ color: C.gray, marginBottom: 2 }}>Train de vie cible</div><div style={{ fontSize: 18, fontWeight: 800, color: C.primaryDark, whiteSpace: "nowrap" }}>CHF {fmt(p.objTrainVie)}<span style={{ fontSize: 10, color: C.gray, fontWeight: 500 }}> /mois</span></div></div>
        <div><div style={{ color: C.gray, marginBottom: 2 }}>Priorité</div><div style={{ fontSize: 12, fontWeight: 700, color: C.primaryDark }}>{p.objPriorite === "age_fixe" ? "Âge fixe" : "Train de vie"}</div></div>
        <div><div style={{ color: C.gray, marginBottom: 2 }}>Rente / capital</div><div style={{ fontSize: 12, fontWeight: 700, color: C.primaryDark }}>{p.objPreferenceSortie}</div></div>
      </div>
      {p.objProjets && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.mediumGray}`, fontSize: 11, color: C.darkGray, lineHeight: 1.6 }}>
          <strong style={{ color: couleur }}>Projets :</strong> <MultiLine text={p.objProjets} />
        </div>
      )}
    </div>
  );
}

function SlideProfil({ data, num }) {
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Profil & Objectifs" />
      <div style={{ padding: "80px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 1</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Votre <em style={{ color: C.gold }}>profil</em> et vos <em style={{ color: C.gold }}>objectifs</em></div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.5, marginBottom: 14, textAlign: "justify" }}>
          Le <strong>train de vie cible</strong> correspond au revenu mensuel net réellement disponible après impôts, charges fixes et crédits. Les objectifs de chacun guident le plan : un train de vie élevé pousse vers des leviers d'épargne et de rendement, un âge de départ fixe contraint le calendrier.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: data.isCouple ? "1fr 1fr" : "1fr", gap: 14, marginBottom: 16 }}>
          <CarteProfil p={data.client} couleur={C.primary} />
          {data.isCouple && <CarteProfil p={data.conjoint} couleur={C.gold} />}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: data.isCouple ? "1fr 1fr" : "1fr", gap: 14 }}>
          <BlocVision p={data.client} couleur={C.primary} titre={`Vision retraite — Monsieur (${data.client.prenom})`} />
          {data.isCouple && <BlocVision p={data.conjoint} couleur={C.gold} titre={`Vision retraite — Madame (${data.conjoint.prenom})`} />}
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function Bar({ label, value, max, color, isCapital = false }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: C.darkGray, fontWeight: 600 }}>{label}</span>
        <span style={{ color: color, fontWeight: 800, whiteSpace: "nowrap" }}>CHF {fmt(value)}{isCapital ? "" : " /an"}</span>
      </div>
      <div style={{ height: 8, background: C.lightGray, position: "relative" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function Donut({ parts }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  let offset = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox="0 0 48 48" style={{ width: 170, height: 170, transform: "rotate(-90deg)" }}>
        <circle r="16" cx="24" cy="24" fill="transparent" stroke={C.lightGray} strokeWidth="10" />
        {parts.map((p, i) => {
          const len = (p.value / total) * 100;
          const dash = `${len} 100`;
          const dashOff = `-${offset}`;
          offset += len;
          return <circle key={i} r="16" cx="24" cy="24" fill="transparent" stroke={p.color} strokeWidth="10" strokeDasharray={dash} strokeDashoffset={dashOff} pathLength="100" />;
        })}
      </svg>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
        {parts.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, background: p.color }} />
            <span style={{ color: C.darkGray, fontWeight: 600 }}>{p.label}</span>
            <span style={{ color: C.gray }}>{p.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideVueEnsemble({ data, num }) {
  const synthClient = calcSyntheseRetraite(data.client, data);
  const synthConjoint = data.isCouple ? calcSyntheseRetraite(data.conjoint, data) : null;
  const menage = data.isCouple ? calcSyntheseMenage(data) : null;
  const commune = data.isCouple && data.coupleProjectionMode === "commune";
  const totalRevenu = synthClient.revenuRenteAjuste || 1;
  const partAvs = (synthClient.avs.renteAnnuelle / totalRevenu) * 100;
  const partLpp = (synthClient.renteLPPAjusteeAnnuelle / totalRevenu) * 100;
  const partFr = (synthClient.pensionsFRChfAnnuelle / totalRevenu) * 100;
  const revenuAffiche = commune ? menage.revenuRenteMensuel : synthClient.revenuRenteAjusteMensuel;
  const objectifAffiche = commune ? menage.objectifMensuel : synthClient.objectifMensuel;

  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Vue d'ensemble" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 2 {commune ? "· Projection commune (ménage)" : "· Monsieur"}</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Votre <em style={{ color: C.gold }}>retraite</em> en un coup d'œil</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.5, marginBottom: 12, textAlign: "justify" }}>
          Consolidation des revenus de retraite projetés. Les rentes (AVS, LPP, pensions FR) forment la base récurrente ; le 3e pilier et la part LPP en capital constituent un <em>capital disponible</em>. La part LPP affichée en rente respecte votre choix de sortie ({Math.round(synthClient.partCap * 100)}% en capital).
        </p>
        <div style={{ background: C.primary, color: C.white, padding: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Revenu mensuel projeté {commune ? "du ménage" : `à ${synthClient.ageDepart} ans`}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, justifyContent: "space-between" }}>
            <div style={{ fontSize: 36, fontWeight: 900, whiteSpace: "nowrap" }}>CHF {fmt(revenuAffiche)}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Objectif : <strong>CHF {fmt(objectifAffiche)}</strong> /mois</div>
          </div>
          <div style={{ marginTop: 12, height: 8, background: "rgba(255,255,255,0.2)", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${Math.min(100, (revenuAffiche / Math.max(1, objectifAffiche)) * 100)}%`, background: C.gold }} />
          </div>
        </div>
        {!commune && synthClient.ecart > 0 && (
          <div style={{ background: "#FEF3F2", borderLeft: `4px solid ${C.bad}`, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <Icons.Alert size={18} color={C.bad} />
            <div style={{ fontSize: 11.5, color: "#991B1B" }}>
              <strong>Écart constaté :</strong> il manque <strong>CHF {fmt(Math.abs(synthClient.ecartMensuel))} /mois</strong> ({synthClient.ecartPct}%) pour atteindre l'objectif.
            </div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: C.gray, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Décomposition (Monsieur)</div>
            <Bar label="1er pilier — AVS" value={synthClient.avs.renteAnnuelle} max={totalRevenu} color={C.swiss} />
            <Bar label="2e pilier — LPP (rente)" value={synthClient.renteLPPAjusteeAnnuelle} max={totalRevenu} color={C.primary} />
            <Bar label="3e pilier + capital LPP" value={synthClient.capitalTotal} max={Math.max(synthClient.capitalTotal, totalRevenu, 1)} color={C.gold} isCapital />
            <Bar label="Pensions françaises (CHF)" value={synthClient.pensionsFRChfAnnuelle} max={totalRevenu} color={C.france} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.gray, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, textAlign: "center" }}>Répartition des rentes</div>
            <Donut parts={[
              { label: "AVS", value: partAvs, color: C.swiss },
              { label: "LPP", value: partLpp, color: C.primary },
              { label: "FR", value: partFr, color: C.france }
            ]} />
          </div>
        </div>
        {data.isCouple && synthConjoint && (
          <div style={{ marginTop: 18, padding: 14, background: C.lightGray, borderLeft: `4px solid ${C.gold}` }}>
            <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Madame — {data.conjoint.prenom}</div>
            <div style={{ fontSize: 12.5, color: C.darkGray }}>
              Revenu rente projeté : <strong>CHF {fmt(synthConjoint.revenuRenteAjusteMensuel)} /mois</strong> à {synthConjoint.ageDepart} ans · Capital (3e P. + LPP) : <strong>CHF {fmt(synthConjoint.capitalTotal)}</strong>
              {commune && <> · <strong style={{ color: C.primary }}>Cumul ménage : CHF {fmt(menage.revenuRenteMensuel)} /mois</strong></>}
            </div>
          </div>
        )}
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function CartePilier({ titre, couleur, data }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${couleur}`, padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: couleur, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>{titre}</div>
      {data.map(([k, v], i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < data.length - 1 ? `1px solid ${C.lightGray}` : "none", fontSize: 12 }}>
          <span style={{ color: C.gray, fontWeight: 500 }}>{k}</span>
          <span style={{ color: couleur, fontWeight: 700, textAlign: "right", maxWidth: "60%" }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function SlideCartographieDroits({ data, num }) {
  const lignes = calcCartographieDroits(data);
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Cartographie de vos droits" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Inventaire complet</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Vos <em style={{ color: C.gold }}>droits</em> à la retraite répertoriés</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.5, marginBottom: 12, textAlign: "justify" }}>
          Inventaire des droits acquis et institutions concernées. Les lignes LPP respectent le <strong>choix rente / capital</strong> de chaque personne : une sortie en capital n'affiche pas de rente LPP, mais le capital correspondant.
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
          <thead>
            <tr style={{ background: C.primary, color: C.white }}>
              <th style={{ padding: "8px 10px", textAlign: "left" }}>Qui</th>
              <th style={{ padding: "8px 10px", textAlign: "left" }}>Intitulé</th>
              <th style={{ padding: "8px 10px", textAlign: "left" }}>Type</th>
              <th style={{ padding: "8px 10px", textAlign: "left" }}>Institut</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>Montant</th>
              <th style={{ padding: "8px 10px", textAlign: "center" }}>Dès</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.lightGray}`, background: i % 2 === 0 ? C.white : "rgba(105,33,2,0.02)" }}>
                <td style={{ padding: "7px 10px", color: C.primary, fontWeight: 700 }}>{l.qui}</td>
                <td style={{ padding: "7px 10px", color: C.darkGray, fontWeight: 600 }}>{l.intitule}</td>
                <td style={{ padding: "7px 10px", color: C.gray, fontStyle: "italic" }}>{l.type}</td>
                <td style={{ padding: "7px 10px", color: C.gray, fontSize: 10 }}>{l.institut}</td>
                <td style={{ padding: "7px 10px", textAlign: "right", color: C.primary, fontWeight: 700, whiteSpace: "nowrap" }}>{l.montant}</td>
                <td style={{ padding: "7px 10px", textAlign: "center", color: C.darkGray, whiteSpace: "nowrap" }}>{l.ageDebut} ans</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 14, background: C.lightGray, padding: 12, borderLeft: `4px solid ${C.gold}`, fontSize: 10.5, color: C.darkGray, lineHeight: 1.6 }}>
          <strong>Prestations à déclencher :</strong> {lignes.length} · <strong>Bénéficiaires :</strong> {data.isCouple ? 2 : 1}. Chacune nécessite une demande formelle — voir le <em>Plan d'actions calendaire</em>.
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlideTemple({ data, num }) {
  const buildPiliers = (p) => {
    const ageDepart = Number(p.objAgeDepart || 65);
    const avs = calcAVS(p);
    const lppE = lppEffectif(p, ageDepart);
    const tp = calc3eP(p, ageDepart);
    const pensionsFR = calcPensionsFR(p);
    const lppMontant = lppE.partCapital >= 0.999
      ? `CHF ${fmt(lppE.capitalAge65)} capital`
      : lppE.partCapital <= 0.001
        ? `CHF ${fmt(lppE.renteMensuelle)}/mois`
        : `CHF ${fmt(lppE.renteMensuelleEff)}/mois + ${fmt(lppE.capitalSorti)} cap.`;
    return [
      { num: "I", titre: "AVS", sub: "1er pilier", montant: `CHF ${fmt(avs.renteMensuelle)}/mois`, age: 65, color: C.swiss },
      { num: "II", titre: "LPP", sub: "2e pilier", montant: lppMontant, age: ageDepart, color: C.primary },
      { num: "III", titre: "3e Pilier", sub: "Privé", montant: `CHF ${fmt(tp.capitalTotal)} capital`, age: ageDepart, color: C.gold },
      { num: "IV", titre: "Pensions FR", sub: "Volet français", montant: `${fmtEUR(pensionsFR.totalMensuel)} €/mois`, age: Number(p.frAgeTauxPlein || 67), color: C.france },
    ];
  };
  const piliers = buildPiliers(data.client);
  const pilConj = data.isCouple && data.conjoint.prenom ? buildPiliers(data.conjoint) : null;
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Temple de vos rentes" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Architecture des revenus</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Le <em style={{ color: C.gold }}>temple</em> de vos rentes</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.5, marginBottom: 16, textAlign: "justify" }}>
          Chaque colonne représente une source de revenu et son montant projeté. La LPP s'affiche en <strong>capital</strong> lorsque la sortie en capital est retenue (et non en rente).
        </p>
        <div style={{ fontSize: 11, fontWeight: 800, color: C.primary, marginBottom: 6 }}>Monsieur — {data.client.prenom}</div>
        <div style={{ width: "90%", margin: "0 auto", height: 12, background: `linear-gradient(180deg, ${C.gold} 0%, ${C.primaryDark} 100%)` }} />
        <div style={{ width: "94%", margin: "0 auto 8px", height: 6, background: C.primary }} />
        <div style={{ width: "90%", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          {piliers.map((p, i) => (
            <div key={i} style={{ background: C.white, border: `2px solid ${p.color}`, borderTop: `7px solid ${p.color}`, padding: 12, textAlign: "center", minHeight: 150, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: p.color, fontWeight: 900 }}>{p.num}</div>
                <div style={{ fontSize: 11, color: C.primary, fontWeight: 800 }}>{p.titre}</div>
                <div style={{ fontSize: 8.5, color: C.gray, textTransform: "uppercase" }}>{p.sub}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: p.color, fontWeight: 800 }}>{p.montant}</div>
                <div style={{ fontSize: 8.5, color: C.gray }}>dès {p.age} ans</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ width: "95%", margin: "8px auto 0", height: 10, background: C.primary }} />
        <div style={{ width: "98%", margin: "0 auto", height: 6, background: `linear-gradient(180deg, ${C.primaryDark} 0%, ${C.gold} 100%)` }} />

        {pilConj && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.gold, marginBottom: 6 }}>Madame — {data.conjoint.prenom}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
              {pilConj.map((p, i) => (
                <div key={i} style={{ background: C.lightGray, borderLeft: `3px solid ${p.color}`, padding: 8 }}>
                  <div style={{ fontSize: 9, color: C.gray, fontWeight: 700, textTransform: "uppercase" }}>{p.titre}</div>
                  <div style={{ fontSize: 10, color: p.color, fontWeight: 800 }}>{p.montant}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ marginTop: 16, background: C.lightGray, padding: 12, borderLeft: `4px solid ${C.gold}`, fontSize: 10.5, color: C.darkGray, lineHeight: 1.6 }}>
          <strong>Lecture :</strong> Les piliers se complètent — AVS pour le minimum vital, LPP pour le niveau de vie (en rente ou capital), 3e pilier pour les lacunes, pensions FR pour la carrière française.
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlideWallswiss({ data }) {
  return (
    <div style={{ ...pageBase, background: `linear-gradient(180deg, ${C.lightGray} 0%, ${C.white} 100%)` }}>
      <PageHeader data={data} num="" titreSection="Votre Partenaire" />
      <div style={{ padding: "70px 40px 50px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ background: C.white, width: 56, height: 56, margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
            <Logo size={34} variant="color" />
          </div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>WallSwiss</div>
          <div style={{ color: C.gold, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", marginTop: 4 }}>L'excellence patrimoniale franco-suisse</div>
        </div>
        <div style={{ background: C.white, padding: 14, borderLeft: `4px solid ${C.primary}`, marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 10, color: C.primary, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Notre mission</div>
          <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.55, margin: 0, textAlign: "justify" }}>
            Accompagner les <strong>frontaliers, pluripensionnés franco-suisses et résidents</strong> de Suisse romande dans la structuration globale de leur patrimoine et la préparation de leur retraite. Notre approche transforme la <strong>complexité réglementaire</strong> en <strong>opportunités d'optimisation concrètes</strong>, mesurables et opposables.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[{ val: "15+", lbl: "années d'expertise" }, { val: "100%", lbl: "indépendance" }, { val: "350+", lbl: "familles accompagnées" }, { val: "EUR/CHF", lbl: "double maîtrise" }].map((c, i) => (
            <div key={i} style={{ background: C.primary, color: C.white, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.gold }}>{c.val}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{c.lbl}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            { icon: <Icons.Users size={14} color={C.gold} />, t: "Double Compétence", d: "Maîtrise des systèmes croisés (AVS/LPP vs CNAV/AGIRC-ARRCO) et de la fiscalité (impôt source, quasi-résident, IFI). Évite double imposition et rattrapages." },
            { icon: <Icons.Check size={14} color={C.gold} />, t: "Indépendance Absolue", d: "Libres de toute attache bancaire ou assurantielle, en architecture ouverte. Les meilleures solutions du marché, sans rétrocession cachée." },
            { icon: <Icons.Eye size={14} color={C.gold} />, t: "Ingénierie Patrimoniale", d: "Structuration immobilière (SCI, démembrement), succession transfrontalière (loi UE 650/2012), 3a/3b multi-comptes, assurance-vie lux." },
            { icon: <Icons.Alert size={14} color={C.gold} />, t: "Suivi & Pérennité", d: "Le cadre légal évolue (AVS21, LPP21, réforme FR 2023). Veille réglementaire active et révision annuelle de votre dossier." },
          ].map((c, i) => (
            <div key={i} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 10 }}>
              <div style={{ fontSize: 10, color: C.primary, fontWeight: 800, textTransform: "uppercase", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>{c.icon} {c.t}</div>
              <div style={{ fontSize: 9, color: C.gray, lineHeight: 1.45, textAlign: "justify" }}>{c.d}</div>
            </div>
          ))}
        </div>
        <div style={{ background: C.primary, color: C.white, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: C.gold, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10, textAlign: "center" }}>Notre accompagnement de A à Z</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", gap: 8, alignItems: "flex-start" }}>
            <div><div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}><span style={{ color: C.gold }}>1.</span> Audit (R1)</div><div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>Cartographie complète : civil, prévoyance, patrimoine, fiscalité, objectifs.</div></div>
            <div style={{ color: C.gold, fontSize: 16, alignSelf: "center" }}>→</div>
            <div><div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}><span style={{ color: C.gold }}>2.</span> Stratégie (R2)</div><div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>Scénarios, leviers, chiffrage du gain total, recommandations.</div></div>
            <div style={{ color: C.gold, fontSize: 16, alignSelf: "center" }}>→</div>
            <div><div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}><span style={{ color: C.gold }}>3.</span> Action & Suivi</div><div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>Implémentation, démarches assistées, bilan de révision annuel.</div></div>
          </div>
        </div>
        <div style={{ background: C.gold, color: C.white, padding: 12, flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Nos valeurs</div>
          <div style={{ fontSize: 9.5, lineHeight: 1.55 }}>
            <div style={{ marginBottom: 6 }}><strong>Transparence.</strong> Honoraires clairs, aucune rétrocession dissimulée.</div>
            <div style={{ marginBottom: 6 }}><strong>Exigence.</strong> Chaque recommandation est justifiée et chiffrée.</div>
            <div style={{ marginBottom: 6 }}><strong>Engagement.</strong> Conseillers dédiés, joignables, disponibles.</div>
            <div><strong>Long terme.</strong> Une relation de confiance, pas une transaction.</div>
          </div>
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

function SlideAVS({ data, num }) {
  const avsC = calcAVS(data.client);
  const avsAnticipe = calcAVS(data.client, { scenario: "anticipe", anneesShift: 2 });
  const avsAjourne = calcAVS(data.client, { scenario: "ajourne", anneesShift: 2 });
  const annees = Math.max(1, 90 - Number(data.client.objAgeDepart || 65));
  const cumulNormal = avsC.renteAnnuelle * annees;
  const cumulAnticipe = avsAnticipe.renteAnnuelle * (annees + 2);
  const cumulAjourne = avsAjourne.renteAnnuelle * Math.max(1, annees - 2);
  const anneesCot = Number(data.client.avsAnneesCotisation || 0);
  const echelle = Math.min(44, anneesCot);
  const tauxCompletion = (echelle / 44 * 100).toFixed(1);
  const ramApprox = Number(data.client.revenusBrut || 0);
  const renteMin = 1260, renteMax = 2520, seuilSup = 88200;
  let renteEch44;
  if (ramApprox >= seuilSup) renteEch44 = renteMax;
  else if (ramApprox <= 15120) renteEch44 = renteMin;
  else renteEch44 = renteMin + (renteMax - renteMin) * ((ramApprox - 15120) / (seuilSup - 15120));
  const renteEchClient = renteEch44 * (echelle / 44);
  const renteCalculee = avsC.renteMensuelle;

  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="1er Pilier — AVS" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.swiss}`, paddingLeft: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.swiss, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Volet Suisse · Section 3</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Le <em style={{ color: C.swiss }}>1er pilier</em> — AVS</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.55, marginBottom: 14, textAlign: "justify" }}>
          Carrière complète = <strong>44 années</strong>. Rente max 2026 ≈ <strong>CHF 2'520/mois</strong>, min ≈ <strong>CHF 1'260/mois</strong>. <strong>13e rente AVS</strong> dès décembre 2026 (réforme AVS21).
        </p>
        <div style={{ marginBottom: 12, fontSize: 11, color: C.gray, fontWeight: 700, textTransform: "uppercase" }}>Comparatif des 3 options — cumul jusqu'à 90 ans</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[
            { titre: "Anticipée (-2 ans)", rente: avsAnticipe.renteMensuelle, cumul: cumulAnticipe, color: C.warn },
            { titre: "Normale (65 ans)", rente: avsC.renteMensuelle, cumul: cumulNormal, color: C.swiss },
            { titre: "Ajournée (+2 ans)", rente: avsAjourne.renteMensuelle, cumul: cumulAjourne, color: C.ok },
          ].map((s, i) => (
            <div key={i} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${s.color}`, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: s.color, marginBottom: 6 }}>{s.titre}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.primaryDark, whiteSpace: "nowrap" }}>CHF {fmt(s.rente)}<span style={{ fontSize: 9, color: C.gray, fontWeight: 500 }}> /mois</span></div>
              <div style={{ fontSize: 10, color: C.gray, marginTop: 4 }}>Cumul : <strong>CHF {fmt(s.cumul)}</strong></div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 8, fontSize: 11, color: C.gray, fontWeight: 700, textTransform: "uppercase" }}>Décomposition du calcul AVS — {data.client.prenom}</div>
        <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 12, marginBottom: 10 }}>
          <table style={{ width: "100%", fontSize: 10.5, borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}><td style={{ padding: "5px 8px", color: C.swiss, fontWeight: 700, width: 22 }}>1.</td><td style={{ padding: "5px 8px", color: C.darkGray }}>Années de cotisation</td><td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 700, color: C.primary, whiteSpace: "nowrap" }}>{anneesCot} / 44 ans</td></tr>
              <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}><td style={{ padding: "5px 8px", color: C.swiss, fontWeight: 700 }}>2.</td><td style={{ padding: "5px 8px", color: C.darkGray }}>Échelle applicable</td><td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 700, color: C.primary, whiteSpace: "nowrap" }}>Échelle {echelle} ({tauxCompletion}%)</td></tr>
              <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}><td style={{ padding: "5px 8px", color: C.swiss, fontWeight: 700 }}>3.</td><td style={{ padding: "5px 8px", color: C.darkGray }}>Revenu annuel moyen (RAM) estimé</td><td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 700, color: C.primary, whiteSpace: "nowrap" }}>CHF {fmt(ramApprox)}</td></tr>
              <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}><td style={{ padding: "5px 8px", color: C.swiss, fontWeight: 700 }}>4.</td><td style={{ padding: "5px 8px", color: C.darkGray }}>Rente échelle 44 selon RAM</td><td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 700, color: C.primary, whiteSpace: "nowrap" }}>CHF {fmt(renteEch44)} /mois</td></tr>
              <tr style={{ borderBottom: `2px solid ${C.swiss}`, background: "rgba(218,41,28,0.05)" }}><td style={{ padding: "7px 8px", color: C.swiss, fontWeight: 900 }}>=</td><td style={{ padding: "7px 8px", color: C.swiss, fontWeight: 800 }}>Rente mensuelle retenue {data.client.avsRenteEstimee ? "(estim. client)" : "(indicatif)"}</td><td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 900, color: C.swiss, fontSize: 13, whiteSpace: "nowrap" }}>CHF {fmt(renteCalculee)} /mois</td></tr>
              {data.client.avs13eRente && (
                <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}><td style={{ padding: "5px 8px", color: C.gold, fontWeight: 700 }}>+</td><td style={{ padding: "5px 8px", color: C.darkGray }}>13e rente AVS (dès déc. 2026)</td><td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 700, color: C.gold, whiteSpace: "nowrap" }}>+ CHF {fmt(avsC.treizieme)}</td></tr>
              )}
              <tr style={{ background: C.swiss, color: C.white }}><td style={{ padding: "8px", fontWeight: 900 }}>=</td><td style={{ padding: "8px", fontWeight: 900 }}>RENTE AVS ANNUELLE TOTALE</td><td style={{ padding: "8px", textAlign: "right", fontWeight: 900, fontSize: 14, whiteSpace: "nowrap" }}>CHF {fmt(avsC.renteAnnuelle)} /an</td></tr>
            </tbody>
          </table>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div style={{ background: C.lightGray, padding: 10, fontSize: 9.5, color: C.darkGray, lineHeight: 1.55, borderLeft: `3px solid ${C.swiss}` }}>
            <strong style={{ color: C.swiss }}>Identification</strong><br/>
            N° AVS : <strong>{data.client.avsNumero || "—"}</strong><br/>
            Caisse : <strong>{data.client.avsCaisse || "—"}</strong><br/>
            Années cotisées : <strong>{data.client.avsAnneesCotisation || "—"} / 44</strong><br/>
            Lacunes : <strong><MultiLine text={data.client.avsLacunes || "Aucune"} /></strong>
          </div>
          <div style={{ background: "rgba(165,149,104,0.1)", padding: 10, fontSize: 9.5, color: C.darkGray, lineHeight: 1.55, borderLeft: `3px solid ${C.gold}` }}>
            <strong style={{ color: C.gold }}>Bonus de la formule légale</strong><br/>
            Bonifications <em>éducatives</em> (par enfant) ajoutées au RAM<br/>
            <em>Splitting</em> 50/50 des revenus pour les couples mariés<br/>
            Bonifications <em>d'assistance</em> (soutien à un proche)
          </div>
        </div>
        <div style={{ background: "rgba(218,41,28,0.05)", padding: 10, borderLeft: `4px solid ${C.swiss}`, fontSize: 9.5, color: C.darkGray, lineHeight: 1.5 }}>
          <strong>Le conseil WallSwiss :</strong> L'anticipation coûte <strong>6.8%/an</strong> (max 2 ans, -13.6%). L'ajournement (1 à 5 ans) ajoute +5.2% à +31.5% mais nécessite ~12 ans pour être amorti. <em>Exiger l'extrait du CI pour validation — chiffres non opposables.</em>
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlideLPP({ data, num }) {
  const ageDepart = Number(data.client.objAgeDepart || 65);
  const lppE = lppEffectif(data.client, ageDepart);
  const part = lppE.partCapital;
  const isCapital = part >= 0.999;
  const age = Number(data.client.age || 40);
  const annees = Math.max(0, ageDepart - age);
  const avoirActuel = Number(data.client.lppAvoirActuel || 0);
  const cotis = Number(data.client.lppCotisationAnnuelle || 0);
  const taux = Number(data.client.lppTauxRendement || 1.25) / 100;
  const points = [];
  if (annees > 0) {
    for (let y = 0; y <= annees; y += Math.max(1, Math.floor(annees / 8))) {
      const k = taux > 0 ? avoirActuel * Math.pow(1 + taux, y) + cotis * ((Math.pow(1 + taux, y) - 1) / taux) : avoirActuel + cotis * y;
      points.push({ age: age + y, val: Math.round(k) });
    }
    if (points[points.length - 1].age !== ageDepart) points.push({ age: ageDepart, val: lppE.capitalAge65 });
  }
  const maxV = Math.max(...points.map(p => p.val), 1);
  const svgW = 600, svgH = 180, padL = 60, padR = 20, padT = 20, padB = 30;
  const w = svgW - padL - padR, h = svgH - padT - padB;
  const getX = (i) => padL + (i / Math.max(1, points.length - 1)) * w;
  const getY = (v) => padT + h - (v / maxV) * h;
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.val)}`).join(' ');
  const areaPath = points.length ? `${path} L ${getX(points.length - 1)} ${getY(0)} L ${getX(0)} ${getY(0)} Z` : "";

  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="2e Pilier — LPP" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.primary}`, paddingLeft: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Volet Suisse · Section 4</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Le <em style={{ color: C.primary }}>2e pilier</em> — LPP {isCapital ? "(sortie capital)" : ""}</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.5, marginBottom: 12, textAlign: "justify" }}>
          {isCapital ? (
            <>Vous avez opté pour une <strong>sortie en capital</strong> de votre 2e pilier. Le capital est <strong>versé en une fois</strong> à la retraite : vous en disposez librement (placement, transmission, projets), avec une <strong>imposition unique avantageuse</strong> à la sortie plutôt qu'une imposition annuelle de rente. {lppE.immediat && <strong>Le déblocage intervient cette année (départ à {ageDepart} ans) : il n'y a plus de phase d'accumulation.</strong>}</>
          ) : (
            <>La LPP complète l'AVS pour maintenir le niveau de vie (env. 60% du dernier salaire). Accumulation d'un capital puis <strong>conversion</strong> en rente viagère via le <em>taux de conversion</em>. La réforme LPP21 abaisse ce taux — facteur clé à anticiper.</>
          )}
        </p>
        <div style={{ background: C.primary, color: C.white, padding: 18, marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div><div style={{ fontSize: 10, color: C.gold, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Avoir actuel</div><div style={{ fontSize: 20, fontWeight: 900 }}>CHF {fmt(avoirActuel)}</div></div>
          <div><div style={{ fontSize: 10, color: C.gold, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Capital à {ageDepart} ans</div><div style={{ fontSize: 20, fontWeight: 900 }}>CHF {fmt(lppE.capitalAge65)}</div></div>
          <div><div style={{ fontSize: 10, color: C.gold, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{isCapital ? "Capital perçu" : "Rente projetée"}</div><div style={{ fontSize: 20, fontWeight: 900, whiteSpace: "nowrap" }}>{isCapital ? `CHF ${fmt(lppE.capitalSorti)}` : <>CHF {fmt(lppE.renteMensuelleEff)}<span style={{ fontSize: 10, fontWeight: 400 }}> /mois</span></>}</div></div>
        </div>
        {annees > 0 ? (
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.gray, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, textAlign: "center" }}>Évolution projetée du capital LPP</div>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", height: svgH }}>
              {[0, 0.5, 1].map(pct => { const y = padT + h - pct * h; return (<g key={pct}><line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke={C.lightGray} strokeDasharray="3 3" /><text x={padL - 8} y={y + 4} fontSize="10" fill={C.gray} textAnchor="end">CHF {fmt(Math.round(maxV * pct))}</text></g>); })}
              {points.map((p, i) => (<text key={i} x={getX(i)} y={svgH - 8} fontSize="10" fill={C.gray} textAnchor="middle">{p.age} ans</text>))}
              <path d={areaPath} fill="rgba(105,33,2,0.08)" />
              <path d={path} fill="none" stroke={C.primary} strokeWidth="2.5" />
              {points.map((p, i) => (<circle key={i} cx={getX(i)} cy={getY(p.val)} r="4" fill={C.primary} />))}
            </svg>
          </div>
        ) : (
          <div style={{ background: "rgba(105,33,2,0.06)", border: `1px solid ${C.mediumGray}`, padding: 16, marginBottom: 14, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.primary, marginBottom: 4 }}>Déblocage immédiat — aucune phase d'accumulation</div>
            <div style={{ fontSize: 11, color: C.darkGray, lineHeight: 1.6 }}>Le départ étant fixé à {ageDepart} ans (âge actuel), le capital de <strong>CHF {fmt(lppE.capitalAge65)}</strong> est disponible dès cette année. La projection se base sur l'avoir constaté, sans capitalisation future.</div>
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {[["Caisse", data.client.lppCaisse || "—"], ["Taux couverture", (data.client.lppTauxCouverture || "—") + "%"], ["Taux conversion", lppE.tauxConversion.toFixed(1) + "%"], ["Libre-passage", "CHF " + fmt(data.client.lppLibrePassage)], ["Potentiel rachat", "CHF " + fmt(data.client.lppPotentielRachat)], ["Rachats 3 ans", "CHF " + fmt(data.client.lppRachats3Ans)]].map(([k, v], i) => (
            <div key={i} style={{ background: C.lightGray, padding: "6px 10px", fontSize: 9.5 }}><span style={{ color: C.gray }}>{k} : </span><strong style={{ color: C.primary }}>{v}</strong></div>
          ))}
        </div>
        {isCapital ? (
          <div style={{ background: "rgba(165,149,104,0.12)", padding: 12, fontSize: 10.5, color: C.darkGray, lineHeight: 1.55, borderLeft: `4px solid ${C.gold}` }}>
            <strong style={{ color: C.gold }}>Le conseil WallSwiss — sortie en capital.</strong> Vos priorités : <strong>(1) Fiscalité</strong> — le capital est imposé <em>une seule fois</em> à un taux réduit séparé (vs imposition annuelle de la rente au barème) ; échelonnez si possible avec les retraits 3a sur plusieurs années. <strong>(2) Succession</strong> — le capital reste <em>transmissible</em> à vos héritiers, contrairement à la rente (perdue au décès hors réversion). <strong>(3) Gestion</strong> — placez selon l'allocation par horizon (4 poches) pour piloter le risque de longévité. <strong>(4) Délai de blocage</strong> de 3 ans après un rachat LPP avant retrait en capital.
          </div>
        ) : (
          <div style={{ background: "rgba(105,33,2,0.06)", padding: 12, fontSize: 10.5, color: C.darkGray, lineHeight: 1.55, borderLeft: `4px solid ${C.primary}` }}>
            <strong style={{ color: C.primary }}>Le conseil WallSwiss — sortie en rente.</strong> La rente garantit un <strong>revenu à vie</strong> et couvre le risque de longévité. Vérifiez : <strong>(1)</strong> le taux de conversion de votre règlement (parfois &gt; minimum LPP) ; <strong>(2)</strong> le taux de couverture de la caisse (un taux &lt; 100% expose à un sous-financement) ; <strong>(3)</strong> la réversion au conjoint (60% en général).
          </div>
        )}
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function Slide3eP({ data, num }) {
  const tp = calc3eP(data.client, Number(data.client.objAgeDepart || 65));
  const impot3a = calc3ePImpot(tp.capital3a, data);
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="3e Pilier" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Volet Suisse · Section 5</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Le <em style={{ color: C.gold }}>3e pilier</em></div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.5, marginBottom: 12, textAlign: "justify" }}>
          Le 3e pilier complète les 1er et 2e piliers. <strong>3a lié</strong> (déductible, blocage jusqu'à 5 ans avant l'âge ordinaire) et <strong>3b libre</strong>. Plafonds 2026 : CHF 7'258 avec caisse de pension. <em>Frontalier : déduction 3a conditionnée au statut de quasi-résident.</em>
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${C.gold}`, padding: 18 }}>
            <div style={{ fontSize: 11, color: C.gold, fontWeight: 800, marginBottom: 4, textTransform: "uppercase" }}>3a — Lié</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: C.primaryDark }}>CHF {fmt(tp.capital3a)}</div>
            <div style={{ fontSize: 11, color: C.gray }}>Projection à {data.client.objAgeDepart} ans</div>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${C.darkGray}`, padding: 18 }}>
            <div style={{ fontSize: 11, color: C.darkGray, fontWeight: 800, marginBottom: 4, textTransform: "uppercase" }}>3b — Libre</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: C.primaryDark }}>CHF {fmt(tp.capital3b)}</div>
            <div style={{ fontSize: 11, color: C.gray }}>Projection à {data.client.objAgeDepart} ans</div>
          </div>
        </div>
        <div style={{ background: C.primary, color: C.white, padding: 16, textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Capital 3e pilier total projeté</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>CHF {fmt(tp.capitalTotal)}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div style={{ background: "#FEF3F2", borderLeft: `4px solid ${C.bad}`, padding: 12, fontSize: 11, color: C.darkGray }}>
            <strong style={{ color: C.bad }}>Impôt estimé sur retrait 3a :</strong><br/>
            <span style={{ fontSize: 18, fontWeight: 900, color: C.bad }}>CHF {fmt(impot3a)}</span> <span style={{ fontSize: 10, color: C.gray }}>(taux {data.tauxImpotCapital3a}%)</span><br/>
            <span style={{ fontSize: 10, color: C.gray }}>Net après impôt : CHF {fmt(tp.capital3a - impot3a)}</span>
          </div>
          {data.client.troisPStrategieEchelonnement && (
            <div style={{ background: C.lightGray, padding: 12, borderLeft: `4px solid ${C.gold}`, fontSize: 11, color: C.darkGray, lineHeight: 1.6 }}>
              <strong style={{ color: C.gold }}>Échelonnement :</strong> <MultiLine text={data.client.troisPStrategieEchelonnement} />
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div style={{ background: C.lightGray, padding: 10, fontSize: 9.5, color: C.darkGray, lineHeight: 1.6, borderLeft: `3px solid ${C.gold}` }}>
            <strong style={{ color: C.gold }}>Caractéristiques 3a</strong><br/>
            Nombre de comptes : <strong>{data.client.troisPNbComptes || 1}</strong><br/>
            Cotisation annuelle : <strong>CHF {fmt(data.client.troisPCotisationAnnuelle)}</strong><br/>
            Plafond 2026 : <strong>CHF 7'258</strong> (avec caisse LPP)<br/>
            Rendement supposé : <strong>{data.client.troisPTauxRendement}%</strong>
          </div>
          <div style={{ background: C.lightGray, padding: 10, fontSize: 9.5, color: C.darkGray, lineHeight: 1.6, borderLeft: `3px solid ${C.darkGray}` }}>
            <strong style={{ color: C.darkGray }}>3b & clause bénéficiaire</strong><br/>
            Avoir 3b : <strong>CHF {fmt(tp.capital3b)}</strong> · Cotis. 3b : <strong>CHF {fmt(data.client.troisPCotisation3b)}</strong><br/>
            Bénéficiaires : <strong><MultiLine text={data.client.troisPClausesBeneficiaires || "Standard (conjoint puis enfants)"} /></strong>
          </div>
        </div>
        <div style={{ background: "rgba(165,149,104,0.1)", padding: 12, fontSize: 10.5, color: C.darkGray, lineHeight: 1.55, borderLeft: `4px solid ${C.gold}` }}>
          <strong style={{ color: C.gold }}>Le conseil WallSwiss.</strong> Optimiser les retraits 3a : <strong>(1)</strong> plusieurs comptes 3a clôturés sur des <em>années fiscales différentes</em> (baisse de la progressivité) ; <strong>(2)</strong> retrait au plus tôt 5 ans avant l'âge AVS ; <strong>(3)</strong> vérifier la <em>clause bénéficiaire</em> pour la transmission.
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function Slide3ScenariosLPP({ data, num }) {
  const sc = calc3ScenariosLPP(data.client, data);
  const max = Math.max(...sc.scenarios.map(s => s.netTotal));
  const choix = partCapitalLPP(data.client);
  const choixLabel = choix >= 0.999 ? "100% Capital" : choix <= 0.001 ? "100% Rente viagère" : "50% Rente / 50% Capital";
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="3 scénarios sortie LPP" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.primary}`, paddingLeft: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Volet Suisse · Section 8</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Sortie <em style={{ color: C.gold }}>LPP</em> — Rente, 50/50 ou Capital</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.5, marginBottom: 12, textAlign: "justify" }}>
          Capital LPP projeté : <strong>CHF {fmt(sc.capital)}</strong>. Décision <strong>irréversible</strong> à équilibrer entre <strong>sécurité</strong> (rente à vie), <strong>flexibilité</strong> (capital) et <strong>transmission</strong> (capital). Chiffres nets après fiscalité différenciée : capital ~{sc.hypotheses.tauxImpotCapital}% / rente ~{sc.hypotheses.tauxImpotRente}%.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          {sc.scenarios.map((s) => {
            const isMax = s.netTotal === max;
            return (
              <div key={s.id} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${isMax ? C.ok : C.gold}`, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: isMax ? C.ok : C.primary, marginBottom: 10, minHeight: 30 }}>{isMax && "★ "}{s.label}</div>
                <div style={{ fontSize: 10, color: C.gray, lineHeight: 1.7 }}>
                  <div>Capital perçu : <strong style={{ color: C.darkGray }}>CHF {fmt(s.capitalPercu)}</strong></div>
                  <div>Rente / an : <strong style={{ color: C.darkGray }}>CHF {fmt(s.rentePercue)}</strong></div>
                  <div>Impôts : <strong style={{ color: C.bad }}>CHF {fmt(s.impots)}</strong></div>
                </div>
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.lightGray}` }}>
                  <div style={{ fontSize: 9, color: C.gray, textTransform: "uppercase" }}>NET TOTAL</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: isMax ? C.ok : C.primary }}>CHF {fmt(s.netTotal)}</div>
                </div>
                <div style={{ marginTop: 10, fontSize: 9, color: C.darkGray, lineHeight: 1.4 }}>
                  <div style={{ color: C.ok }}><strong>+</strong> {s.avantages}</div>
                  <div style={{ color: C.bad, marginTop: 3 }}><strong>−</strong> {s.inconvenients}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ background: C.lightGray, padding: 12, fontSize: 10, color: C.darkGray, lineHeight: 1.6, borderLeft: `4px solid ${C.primary}` }}>
          <strong>Votre choix retenu : {choixLabel}.</strong> Il n'existe pas de réponse unique : le « net total » le plus élevé n'est pas toujours le meilleur choix. Privilégiez la <strong>rente</strong> si la sécurité du revenu à vie prime ; le <strong>capital</strong> si la flexibilité, la transmission ou un projet le justifient. La décision doit refléter votre tolérance au risque de longévité et vos objectifs patrimoniaux — voir aussi le comparatif fiscal transfrontalier.
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlideDoubleScenarioFR({ data, num }) {
  const double = calcDoubleScenarioFR(data.client, data);
  if (!double) {
    return (
      <div style={pageBase}>
        <PageHeader data={data} num={num} titreSection="Volet français" />
        <div style={{ padding: "120px 50px 70px", height: "100%", boxSizing: "border-box" }}>
          <div style={{ background: C.lightGray, padding: 60, textAlign: "center", borderLeft: `4px solid ${C.france}` }}>
            <div style={{ fontSize: 14, color: C.darkGray }}>Aucune carrière française renseignée pour le client.</div>
          </div>
        </div>
        <PageFooter data={data} num={num} />
      </div>
    );
  }
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Volet français — Double scénario" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.france}`, paddingLeft: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.france, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Volet France · Section 6</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Vos <em style={{ color: C.france }}>pensions FR</em> — Tôt vs Taux plein</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.5, marginBottom: 12, textAlign: "justify" }}>
          Réforme 2023 : âge légal {double.tot.ageDepart} ans, {data.client.frTrimestresRequis} trimestres pour le taux plein. <strong>Départ au plus tôt</strong> : liquidation avec <em>décote</em> ({Math.min(20, double.tot.trimManquants)} trim. manquants → -{double.tot.decotePct}% sur le taux de base, -10% temporaire sur l'AGIRC-ARRCO). <strong>Taux plein</strong> : pension <em>complète sans décote</em>. La convention CH-FR permet la <strong>totalisation des périodes</strong>.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
          {[
            { titre: "Départ au plus tôt", sub: `${double.tot.ageDepart} ans (âge légal)`, sc: double.tot, color: C.warn },
            { titre: "Taux plein", sub: `${double.plein.ageDepart} ans`, sc: double.plein, color: C.ok },
          ].map((opt, i) => (
            <div key={i} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${opt.color}`, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: opt.color, marginBottom: 4 }}>{opt.titre}</div>
              <div style={{ fontSize: 10, color: C.gray, marginBottom: 12 }}>{opt.sub}</div>
              <table style={{ width: "100%", fontSize: 11 }}>
                <tbody>
                  <tr><td style={{ color: C.gray, padding: "4px 0" }}>CNAV (base)</td><td style={{ textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{fmtEUR(opt.sc.pensionCnavMensuelle)} €/mois</td></tr>
                  <tr><td style={{ color: C.gray, padding: "4px 0" }}>AGIRC-ARRCO</td><td style={{ textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{fmtEUR(opt.sc.pensionAgircMensuelle)} €/mois</td></tr>
                  <tr><td style={{ color: C.gray, padding: "4px 0", borderTop: `1px solid ${C.lightGray}` }}><strong>Total mensuel</strong></td><td style={{ textAlign: "right", fontWeight: 900, color: opt.color, borderTop: `1px solid ${C.lightGray}`, whiteSpace: "nowrap" }}>{fmtEUR(opt.sc.totalMensuel)} €/mois</td></tr>
                  <tr><td style={{ color: C.gray, padding: "4px 0", fontSize: 10 }}>Cumul jusqu'à 90 ans</td><td style={{ textAlign: "right", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap" }}>{fmtEUR(opt.sc.cumulEur)} €</td></tr>
                  {opt.sc.coefAgirc < 1 && (<tr><td colSpan={2} style={{ color: C.bad, padding: "4px 0", fontSize: 9 }}>⚠ Décote AGIRC -{Math.round((1 - opt.sc.coefAgirc) * 100)}% (3 ans)</td></tr>)}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <div style={{ background: double.recommandation === "taux_plein" ? "#F0FDF4" : "#FEF3F2", borderLeft: `4px solid ${double.recommandation === "taux_plein" ? C.ok : C.warn}`, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: double.recommandation === "taux_plein" ? C.ok : C.warn, textTransform: "uppercase", marginBottom: 6 }}>
            Recommandation : {double.recommandation === "taux_plein" ? "Attendre le taux plein" : "Partir au plus tôt"}
          </div>
          <div style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.5 }}>
            Différentiel cumulé : <strong>{fmtEUR(Math.abs(double.differentielCumuleEur))} €</strong> ({fmt(Math.abs(double.differentielCumuleChf))} CHF) {double.differentielCumuleEur > 0 ? "en faveur du taux plein" : "en faveur du départ anticipé"}.
            {double.pointMortAge ? <> Point mort estimé vers <strong>{double.pointMortAge} ans</strong>.</> : null}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: C.lightGray, padding: 12, fontSize: 10, color: C.darkGray, lineHeight: 1.65, borderLeft: `3px solid ${C.france}` }}>
            <strong style={{ color: C.france }}>Votre carrière française</strong><br/>
            Régime de base : <strong>{data.client.frRegimeBase}</strong><br/>
            Trimestres : <strong>{data.client.frTrimestresAcquis} / {data.client.frTrimestresRequis}</strong> · SAM : <strong>{fmtEUR(data.client.frSAM)} €</strong><br/>
            Points AGIRC-ARRCO : <strong>{fmtEUR(data.client.frPointsAgircArrco)}</strong><br/>
            {data.client.frAutresRegimes ? <>Autres régimes : <strong>{data.client.frAutresRegimes}</strong><br/></> : null}
            {data.client.frLacunesARegulariser ? <>Lacunes à régulariser : <strong><MultiLine text={data.client.frLacunesARegulariser} /></strong></> : <>Aucune lacune signalée.</>}
          </div>
          <div style={{ background: C.lightGray, padding: 12, fontSize: 10, color: C.darkGray, lineHeight: 1.65 }}>
            <strong>Méthode de calcul</strong><br/>
            CNAV = SAM × taux (50% − décote 1,25 %/trim. manquant, plafond 20) × (trim. retenus / requis).<br/>
            AGIRC-ARRCO = points × 1,4159 € × coefficient de décote.<br/>
            <em>Totalisation CH-FR :</em> les années cotisées en Suisse comptent pour atteindre le taux plein.
          </div>
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlideArbitrageSante({ data, num }) {
  const arbitrage = calcArbitrageSante(data.client, data);
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Arbitrage santé / fiscalité" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Cœur de la valeur ajoutée · Section 7</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>L'<em style={{ color: C.gold }}>arbitrage</em> santé / fiscalité</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.5, marginBottom: 12, textAlign: "justify" }}>
          Pour un frontalier retraité en France, le choix du système maladie est <strong>l'arbitrage le plus structurant</strong>. Trois régimes : <strong>LAMal</strong> (maintien dérogatoire), <strong>CMU</strong> (sécurité sociale française), ou régime avec <strong>CSG-CRDS-CASA</strong> jusqu'à 9.1% sur les pensions. Décision <em>définitive</em> dans les 3 mois suivant la liquidation. Les montants ci-dessous sont exprimés <strong>par année</strong>.
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginBottom: 14 }}>
          <thead>
            <tr style={{ background: C.primary, color: C.white }}>
              <th style={{ padding: "8px 10px", textAlign: "left" }}>Scénario</th>
              <th style={{ padding: "8px 10px", textAlign: "left" }}>Description</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>Coût / an</th>
            </tr>
          </thead>
          <tbody>
            {arbitrage.scenarios.map((s) => {
              const isMeilleur = s.id === arbitrage.meilleur.id;
              const isPire = s.id === arbitrage.pire.id;
              return (
                <tr key={s.id} style={{ borderBottom: `1px solid ${C.lightGray}`, background: isMeilleur ? "rgba(16,185,129,0.08)" : isPire ? "rgba(239,68,68,0.05)" : "transparent" }}>
                  <td style={{ padding: "10px", fontWeight: 800, color: isMeilleur ? C.ok : isPire ? C.bad : C.darkGray }}>{isMeilleur && "★ "}{s.id} — {s.label}</td>
                  <td style={{ padding: "10px", color: C.gray, fontSize: 10 }}>{s.detail}<br/><em style={{ color: C.darkGray }}>{s.recommandePour}</em></td>
                  <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: isMeilleur ? C.ok : isPire ? C.bad : C.darkGray, whiteSpace: "nowrap" }}>CHF {fmt(s.coutAnnuel)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ background: C.ok, color: C.white, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Stratégie recommandée</div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{arbitrage.meilleur.label}</div>
          <div style={{ fontSize: 12, marginTop: 6, opacity: 0.9 }}>Économie annuelle vs pire scénario : <strong>CHF {fmt(arbitrage.gainAnnuel)} / an</strong></div>
        </div>
        <div style={{ background: "rgba(105,33,2,0.06)", padding: 11, fontSize: 9.5, color: C.darkGray, lineHeight: 1.55, borderLeft: `4px solid ${C.primary}` }}>
          <strong style={{ color: C.primary }}>Le conseil WallSwiss.</strong> Le scénario optimal dépend de : <strong>(1)</strong> ratio pensions FR / CH ; <strong>(2)</strong> revenu fiscal de référence (éligibilité à l'exonération CSG) ; <strong>(3)</strong> existence d'une mutuelle complémentaire ; <strong>(4)</strong> projet de mobilité. À réévaluer chaque année selon votre RFR. <em>Hypothèses : prime LAMal {fmt(arbitrage.hypotheses.primeLAMal)} CHF/an · CSG/CRDS/CASA {arbitrage.hypotheses.tauxCSGCRDSCASA.toFixed(1)}%.</em>
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

// NOUVEAU — Comparatif fiscal transfrontalier
function SlideFiscaliteCompare({ data, num }) {
  const f = calcFiscaliteComparative(data.client, data);
  const renteGagnante = f.renteCH.cumuleeNette >= f.renteFR.cumuleeNette ? "Suisse" : "France";
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Fiscalité transfrontalière" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Comparatif net-net · Section 9</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Fiscalité <em style={{ color: C.gold }}>transfrontalière</em> — CH vs FR</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.5, marginBottom: 12, textAlign: "justify" }}>
          Comparaison <strong>nette d'impôt</strong> du déblocage du capital LPP (<strong>CHF {fmt(f.capital)}</strong>) selon le lieu d'imposition, et de la rente viagère équivalente (<strong>CHF {fmt(f.renteAnnuelle)}/an</strong>) cumulée sur {f.duree} ans. La résidence fiscale au moment du retrait change radicalement le résultat.
        </p>

        <div style={{ fontSize: 11, color: C.gray, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Capital LPP — imposition Suisse vs France</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          {[
            { pays: "Suisse", d: f.capitalCH, color: C.swiss, best: f.meilleurCapital === "Suisse" },
            { pays: "France", d: f.capitalFR, color: C.france, best: f.meilleurCapital === "France" },
          ].map((b, i) => (
            <div key={i} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${b.color}`, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: b.color, marginBottom: 8 }}>{b.best && "★ "}Résident {b.pays}</div>
              <div style={{ fontSize: 11, color: C.gray, lineHeight: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Capital brut</span><strong style={{ color: C.darkGray }}>CHF {fmt(f.capital)}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Impôt ({b.d.tauxPct}%)</span><strong style={{ color: C.bad }}>− CHF {fmt(b.d.impot)}</strong></div>
              </div>
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.lightGray}` }}>
                <div style={{ fontSize: 9, color: C.gray, textTransform: "uppercase" }}>Capital net</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: b.color }}>CHF {fmt(b.d.net)}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: C.gray, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Rente viagère équivalente — net cumulé sur {f.duree} ans</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginBottom: 14 }}>
          <thead>
            <tr style={{ background: C.primary, color: C.white }}>
              <th style={{ padding: "8px 10px", textAlign: "left" }}>Lieu d'imposition</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>Taux</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>Rente nette / an</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>Cumul net ({f.duree} ans)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}`, background: renteGagnante === "Suisse" ? "rgba(16,185,129,0.06)" : "transparent" }}>
              <td style={{ padding: "8px 10px", fontWeight: 700, color: C.swiss }}>Rente — Suisse</td>
              <td style={{ padding: "8px 10px", textAlign: "right" }}>{f.renteCH.tauxPct}%</td>
              <td style={{ padding: "8px 10px", textAlign: "right", whiteSpace: "nowrap" }}>CHF {fmt(f.renteCH.annuelleNette)}</td>
              <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 800, whiteSpace: "nowrap" }}>CHF {fmt(f.renteCH.cumuleeNette)}</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}`, background: renteGagnante === "France" ? "rgba(16,185,129,0.06)" : "transparent" }}>
              <td style={{ padding: "8px 10px", fontWeight: 700, color: C.france }}>Rente — France</td>
              <td style={{ padding: "8px 10px", textAlign: "right" }}>{f.renteFR.tauxPct}%</td>
              <td style={{ padding: "8px 10px", textAlign: "right", whiteSpace: "nowrap" }}>CHF {fmt(f.renteFR.annuelleNette)}</td>
              <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 800, whiteSpace: "nowrap" }}>CHF {fmt(f.renteFR.cumuleeNette)}</td>
            </tr>
          </tbody>
        </table>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 12 }}>
          <div style={{ background: C.lightGray, padding: 12, borderLeft: `4px solid ${C.gold}` }}>
            <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>Meilleur capital net</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: C.primary }}>Résident {f.meilleurCapital} — CHF {fmt(Math.max(f.capitalCH.net, f.capitalFR.net))}</div>
          </div>
          <div style={{ background: C.lightGray, padding: 12, borderLeft: `4px solid ${C.gold}` }}>
            <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>Capital net vs rente cumulée nette</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.primary }}>Capital : CHF {fmt(Math.max(f.capitalCH.net, f.capitalFR.net))} · Rente : CHF {fmt(Math.max(f.renteCH.cumuleeNette, f.renteFR.cumuleeNette))}</div>
          </div>
        </div>
        <div style={{ background: "rgba(105,33,2,0.06)", padding: 11, fontSize: 9.5, color: C.darkGray, lineHeight: 1.55, borderLeft: `4px solid ${C.primary}` }}>
          <strong style={{ color: C.primary }}>Lecture & réserves.</strong> Le capital LPP versé à un résident suisse est imposé à un barème séparé réduit ({f.capitalCH.tauxPct}%). Versé à un résident français, il peut relever du PFL de 7,5% (art. 163 bis CGI) sous conditions, plus d'éventuels prélèvements sociaux. La rente est imposée annuellement au barème (revenu). <em>Taux paramétrables — à valider avec la fiduciaire et selon le canton / la situation familiale ; non opposable.</em>
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

// NOUVEAU — Solutions recommandées
function SlideSolutions({ data, num }) {
  const actives = (data.solutions || []).filter(s => s.actif).slice(0, 4);
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Solutions recommandées" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Recommandations</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Vos <em style={{ color: C.gold }}>solutions</em> retenues</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.5, marginBottom: 12, textAlign: "justify" }}>
          Sélection personnalisée des solutions à mettre en œuvre. Pour chacune : capital alloué, rente projetée, évolution dans le temps et principaux avantages.
        </p>
        {actives.length === 0 && <div style={{ background: C.lightGray, padding: 40, textAlign: "center", color: C.gray, fontStyle: "italic" }}>Aucune solution activée.</div>}
        {actives.map((sol, i) => {
          const proj = projetteSolution(sol);
          const sample = [5, 10, 15, 20].filter(y => y <= proj.rows.length);
          return (
            <div key={sol.id} style={{ border: `1px solid ${C.mediumGray}`, borderLeft: `4px solid ${C.gold}`, padding: 12, marginBottom: 10, display: "grid", gridTemplateColumns: "1.1fr 1.1fr 1.4fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>{sol.categorie} · {sol.beneficiaire}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.primary, marginBottom: 6 }}>{sol.nom}</div>
                <div style={{ fontSize: 10, color: C.gray, lineHeight: 1.7 }}>
                  <div>Capital : <strong style={{ color: C.darkGray }}>CHF {fmt(proj.capital)}</strong></div>
                  <div>Rente : <strong style={{ color: C.primary }}>CHF {fmt(proj.renteMensuelle)} /mois</strong></div>
                  {proj.epuisement ? <div style={{ color: C.bad }}>Capital épuisé an {proj.epuisement}</div> : <div style={{ color: C.ok }}>Capital préservé sur {sol.dureeAnnees} ans</div>}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: C.gray, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Projection capital restant</div>
                <table style={{ width: "100%", fontSize: 9.5, borderCollapse: "collapse" }}>
                  <tbody>
                    {sample.map(y => (
                      <tr key={y} style={{ borderBottom: `1px solid ${C.lightGray}` }}>
                        <td style={{ padding: "2px 4px", color: C.gray }}>An {y}</td>
                        <td style={{ padding: "2px 4px", textAlign: "right", fontWeight: 700, color: C.primary, whiteSpace: "nowrap" }}>CHF {fmt(proj.rows[y - 1].capital)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: 9, color: C.darkGray, lineHeight: 1.5 }}>
                <div style={{ color: C.ok, fontWeight: 700, marginBottom: 2 }}>Avantages</div>
                <div style={{ color: C.darkGray }}><MultiLine text={sol.avantages} /></div>
                <div style={{ color: C.bad, fontWeight: 700, margin: "4px 0 2px" }}>Points d'attention</div>
                <div style={{ color: C.darkGray }}><MultiLine text={sol.inconvenients} /></div>
              </div>
            </div>
          );
        })}
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function LignePat({ label, valeur, pos = false, bold = false }) {
  return (
    <tr style={{ borderBottom: `1px solid ${C.lightGray}`, background: bold ? "rgba(105,33,2,0.04)" : "transparent" }}>
      <td style={{ padding: "10px 0", color: bold ? C.primary : C.darkGray, fontWeight: bold ? 700 : 500 }}>{label}</td>
      <td style={{ padding: "10px 0", textAlign: "right", color: valeur < 0 ? C.bad : C.primary, fontWeight: bold ? 900 : 700, whiteSpace: "nowrap" }}>{valeur < 0 ? "- " : ""}CHF {fmt(Math.abs(valeur))}</td>
    </tr>
  );
}

function SlidePatrimoine({ data, num }) {
  const immoBrut = Number(data.immoResidencePrincipaleValeur || 0);
  const hypo = Number(data.immoResidencePrincipaleHypotheque || 0);
  const immoNet = immoBrut - hypo;
  let liq = Number(data.patComptesCourants || 0) + Number(data.patEpargne || 0);
  if (data.useCapitalLibre && Number(data.patCapitalLibre) > 0) liq = Number(data.patCapitalLibre);
  const titres = Number(data.patDepotsTitres || 0);
  const credits = Number(data.patCredits || 0) + Number(data.patLeasings || 0);
  const tp = calc3eP(data.client, Number(data.client.objAgeDepart || 65));
  const lpp = calcLPP(data.client, Number(data.client.objAgeDepart || 65));
  const fortuneTotale = immoNet + liq + titres + tp.capitalTotal + lpp.capitalAge65 - credits;
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Patrimoine global" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 10</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Votre <em style={{ color: C.gold }}>patrimoine</em> aujourd'hui</div>
        </div>
        <div style={{ background: C.primary, color: C.white, padding: 20, textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Fortune nette estimée (projection retraite)</div>
          <div style={{ fontSize: 34, fontWeight: 900 }}>CHF {fmt(fortuneTotale)}</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <tbody>
            <LignePat label="Résidence principale (valeur)" valeur={immoBrut} pos />
            <LignePat label="Hypothèque restante" valeur={-hypo} />
            <LignePat label="Immobilier net" valeur={immoNet} pos bold />
            <LignePat label="Comptes & épargne (liquide)" valeur={liq} pos />
            <LignePat label="Portefeuille titres" valeur={titres} pos />
            <LignePat label="Capital LPP projeté" valeur={lpp.capitalAge65} pos />
            <LignePat label="Capital 3e pilier projeté" valeur={tp.capitalTotal} pos />
            <LignePat label="Crédits / Leasings" valeur={-credits} />
          </tbody>
        </table>
        {(data.immoEvents || []).length > 0 && (
          <div style={{ marginTop: 16, background: C.lightGray, padding: 12, borderLeft: `4px solid ${C.gold}`, fontSize: 11, color: C.darkGray }}>
            <strong>Évènements patrimoniaux pris en compte :</strong>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {(data.immoEvents || []).map((e, i) => (
                <li key={i}>{e.annee} — {e.type} {e.libelle ? `(${e.libelle})` : ""} : encaissement net CHF {fmt(e.montantNet)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlideHorizons({ data, num }) {
  const poches = calcAllocationPoches(data);
  const total = poches.reduce((s, p) => s + p.montant, 0) || 1;
  let offset = 0;
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Pré-allocation par horizon" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Allocation patrimoine</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Les <em style={{ color: C.gold }}>4 poches</em> de consommation</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.5, marginBottom: 14, textAlign: "justify" }}>
          On segmente le capital en <strong>4 poches temporelles</strong> alignées sur les besoins : disponibilité immédiate des liquidités, durée qui travaille pour la part longue, clarté de la stratégie. Capital disponible total : <strong>CHF {fmt(total)}</strong>.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24, marginBottom: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <svg viewBox="0 0 48 48" style={{ width: 200, height: 200, transform: "rotate(-90deg)" }}>
              <circle r="16" cx="24" cy="24" fill="transparent" stroke={C.lightGray} strokeWidth="12" />
              {poches.map((p, i) => { const len = (p.montant / total) * 100; const dash = `${len} 100`; const dashOff = `-${offset}`; offset += len; return <circle key={i} r="16" cx="24" cy="24" fill="transparent" stroke={p.color} strokeWidth="12" strokeDasharray={dash} strokeDashoffset={dashOff} pathLength="100" />; })}
              <circle r="9" cx="24" cy="24" fill={C.white} />
            </svg>
            <div style={{ textAlign: "center", marginTop: -118, fontFamily: "'Times New Roman', Times, serif", color: C.primary, position: "relative", zIndex: 2 }}>
              <div style={{ fontSize: 10, color: C.gray, textTransform: "uppercase" }}>Total</div>
              <div style={{ fontSize: 17, fontWeight: 900 }}>CHF {fmt(Math.round(total / 1000))}k</div>
            </div>
          </div>
          <div>
            {poches.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: i < poches.length - 1 ? `1px solid ${C.lightGray}` : "none" }}>
                <div style={{ width: 6, height: 50, background: p.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: p.color }}>{p.label} <span style={{ fontSize: 10, color: C.gray, fontWeight: 500 }}>({p.horizon})</span></div>
                  <div style={{ fontSize: 10, color: C.gray, marginTop: 2 }}>{p.support}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: p.color, whiteSpace: "nowrap" }}>CHF {fmt(p.montant)}</div>
                  <div style={{ fontSize: 10, color: C.gray }}>{p.pct}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: C.lightGray, padding: 14, borderLeft: `4px solid ${C.primary}`, fontSize: 11, color: C.darkGray, lineHeight: 1.6 }}>
          <strong>Le principe :</strong> chaque poche est calibrée pour un horizon précis. La poche court terme sécurise vos dépenses immédiates ; la poche très long terme bénéficie du temps pour absorber la volatilité.
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlideProjectionAnnuelle({ data, num }) {
  const proj = calcProjectionAnnuelle(data);
  const sample = proj.filter((_, i) => i % 2 === 0).slice(0, 14);
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Projection annuelle" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.primary}`, paddingLeft: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Trajectoire patrimoniale</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, color: C.primary, fontWeight: 700, margin: 0 }}>Votre <em style={{ color: C.gold }}>projection</em> année par année</div>
        </div>
        <p style={{ fontSize: 10, color: C.darkGray, lineHeight: 1.5, marginBottom: 12, textAlign: "justify" }}>
          Flux et patrimoine jusqu'à l'âge de fin de consommation : salaires (jusqu'au départ), rentes (AVS+LPP+FR), libération des capitaux (LPP/3a/3b), train de vie indexé ({data.tauxInflation}%), charges, et capitalisation au taux retenu ({data.tauxRendement}%). Les <strong>évènements patrimoniaux</strong> (ventes) sont intégrés dans la colonne « Capitaux ». <em>1 année sur 2 affichée.</em>
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
          <thead>
            <tr style={{ background: C.primary, color: C.white }}>
              <th style={{ padding: "5px 4px", textAlign: "center" }}>Année</th>
              <th style={{ padding: "5px 4px", textAlign: "center" }}>Âge</th>
              <th style={{ padding: "5px 4px", textAlign: "right" }}>Salaires</th>
              <th style={{ padding: "5px 4px", textAlign: "right" }}>Rentes</th>
              <th style={{ padding: "5px 4px", textAlign: "right" }}>Capitaux</th>
              <th style={{ padding: "5px 4px", textAlign: "right" }}>Train de vie</th>
              <th style={{ padding: "5px 4px", textAlign: "right" }}>Charges</th>
              <th style={{ padding: "5px 4px", textAlign: "right", borderLeft: `2px solid ${C.gold}` }}>Pat. liquide</th>
              <th style={{ padding: "5px 4px", textAlign: "right" }}>Pat. immo</th>
              <th style={{ padding: "5px 4px", textAlign: "right", background: C.gold }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sample.map((r) => (
              <tr key={r.annee} style={{ borderBottom: `1px solid ${C.lightGray}`, background: r.enRetraite ? "rgba(165,149,104,0.06)" : C.white }}>
                <td style={{ padding: "5px 4px", textAlign: "center", fontWeight: 700, color: r.enRetraite ? C.gold : C.darkGray }}>{r.annee}</td>
                <td style={{ padding: "5px 4px", textAlign: "center", color: C.gray }}>{r.age}</td>
                <td style={{ padding: "5px 4px", textAlign: "right", color: C.darkGray }}>{r.salaires > 0 ? fmt(r.salaires) : "—"}</td>
                <td style={{ padding: "5px 4px", textAlign: "right", color: C.darkGray }}>{r.rentes > 0 ? fmt(r.rentes) : "—"}</td>
                <td style={{ padding: "5px 4px", textAlign: "right", color: C.gold, fontWeight: r.capitalsLib !== 0 ? 700 : 400 }}>{r.capitalsLib !== 0 ? fmt(r.capitalsLib) : "—"}</td>
                <td style={{ padding: "5px 4px", textAlign: "right", color: C.bad }}>-{fmt(r.trainVie)}</td>
                <td style={{ padding: "5px 4px", textAlign: "right", color: C.gray }}>-{fmt(r.charges)}</td>
                <td style={{ padding: "5px 4px", textAlign: "right", color: C.primary, fontWeight: 700, borderLeft: `2px solid ${C.gold}` }}>{fmt(r.patLiquide)}</td>
                <td style={{ padding: "5px 4px", textAlign: "right", color: C.gray }}>{fmt(r.patImmo)}</td>
                <td style={{ padding: "5px 4px", textAlign: "right", color: C.primaryDark, fontWeight: 900 }}>{fmt(r.patTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 12, fontSize: 9, color: C.gray, fontStyle: "italic", display: "flex", gap: 14 }}>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: "rgba(165,149,104,0.3)", marginRight: 4, verticalAlign: "middle" }} /> Années en retraite</span>
          <span>Montants en CHF — Échantillon 1 an sur 2</span>
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlideEvolutionPatrimoine({ data, num }) {
  const proj = calcProjectionAnnuelle(data);
  const sample = proj.filter((_, i) => i % 3 === 0).slice(0, 12);
  const maxP = Math.max(...sample.map(r => r.patTotal), 1);
  const svgW = 700, svgH = 280, padL = 50, padR = 20, padT = 30, padB = 50;
  const chartW = svgW - padL - padR, chartH = svgH - padT - padB;
  const barW = chartW / sample.length * 0.7;
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Évolution du patrimoine" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Visualisation graphique</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Votre <em style={{ color: C.gold }}>patrimoine</em> dans le temps</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.5, marginBottom: 14, textAlign: "justify" }}>
          Décomposition empilée entre <strong>part liquide</strong> (qui finance le train de vie) et <strong>part immobilière</strong>. Le pic de liquidité correspond à la bascule (libération LPP + 3a + éventuelles ventes). Tant que la barre liquide reste positive à votre âge cible, la stratégie est viable.
        </p>
        <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 16 }}>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", height: svgH }}>
            {[0, 0.25, 0.5, 0.75, 1].map(pct => { const y = padT + chartH - pct * chartH; return (<g key={pct}><line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke={C.lightGray} strokeDasharray="3 3" /><text x={padL - 8} y={y + 4} fontSize="9" fill={C.gray} textAnchor="end">{fmt(Math.round(maxP * pct / 1000))}k</text></g>); })}
            {sample.map((r, i) => {
              const x = padL + (i / sample.length) * chartW + (chartW / sample.length - barW) / 2;
              const hImmo = (r.patImmo / maxP) * chartH;
              const hLiq = (Math.max(0, r.patLiquide) / maxP) * chartH;
              return (<g key={r.annee}><rect x={x} y={padT + chartH - hImmo} width={barW} height={hImmo} fill={C.gold} /><rect x={x} y={padT + chartH - hImmo - hLiq} width={barW} height={hLiq} fill={C.primary} /><text x={x + barW / 2} y={svgH - 30} fontSize="9" fill={C.gray} textAnchor="middle">{r.annee}</text><text x={x + barW / 2} y={svgH - 18} fontSize="8" fill={C.gray} textAnchor="middle">{r.age}a</text></g>);
            })}
          </svg>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 12, fontSize: 11 }}>
            <span><span style={{ display: "inline-block", width: 14, height: 14, background: C.primary, marginRight: 6, verticalAlign: "middle" }} /> Patrimoine liquide</span>
            <span><span style={{ display: "inline-block", width: 14, height: 14, background: C.gold, marginRight: 6, verticalAlign: "middle" }} /> Patrimoine immobilier</span>
          </div>
        </div>
        <div style={{ marginTop: 16, background: C.lightGray, padding: 14, borderLeft: `4px solid ${C.primary}`, fontSize: 11, color: C.darkGray, lineHeight: 1.6 }}>
          <strong>Lecture :</strong> La part immobilière constitue un patrimoine de réserve transmissible. La vente d'un bien (si planifiée) réinjecte de la liquidité au moment choisi.
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlideHeatmap({ data, num }) {
  const hm = calcHeatmapAges(data);
  const getColor = (v) => {
    const ratio = v / hm.maxVal;
    if (ratio > 0.85) return "#0F766E";
    if (ratio > 0.70) return "#15803D";
    if (ratio > 0.55) return "#65A30D";
    if (ratio > 0.40) return "#CA8A04";
    if (ratio > 0.25) return "#EA580C";
    return "#DC2626";
  };
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Heatmap train de vie / âge" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Aide à la décision</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Quand <em style={{ color: C.gold }}>partir</em> à la retraite ?</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.5, marginBottom: 14, textAlign: "justify" }}>
          Pour chaque âge de départ (58 → 70 ans), le train de vie mensuel maximal soutenable jusqu'à l'âge de fin de consommation, selon deux stratégies : <strong>rente</strong> (sécurité, longévité couverte) ou <strong>capital étalé</strong> (train de vie supérieur, risque de longévité).
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: C.primary, color: C.white }}>
              <th style={{ padding: "9px 12px", textAlign: "left" }}>Âge de départ</th>
              <th style={{ padding: "9px 12px", textAlign: "center" }}>Durée retraite</th>
              <th style={{ padding: "9px 12px", textAlign: "center" }}>Train de vie en RENTE</th>
              <th style={{ padding: "9px 12px", textAlign: "center" }}>Train de vie en CAPITAL</th>
            </tr>
          </thead>
          <tbody>
            {hm.rows.map((r) => (
              <tr key={r.age} style={{ borderBottom: `1px solid ${C.lightGray}` }}>
                <td style={{ padding: "7px 12px", fontWeight: 700, color: C.primary }}>{r.age} ans</td>
                <td style={{ padding: "7px 12px", textAlign: "center", color: C.gray }}>{r.dureeRetraite} ans</td>
                <td style={{ padding: "7px 12px", textAlign: "center", background: getColor(r.trainDeVieRente), color: C.white, fontWeight: 800, whiteSpace: "nowrap" }}>CHF {fmt(r.trainDeVieRente)} /mois</td>
                <td style={{ padding: "7px 12px", textAlign: "center", background: getColor(r.trainDeVieCapital), color: C.white, fontWeight: 800, whiteSpace: "nowrap" }}>CHF {fmt(r.trainDeVieCapital)} /mois</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 4, fontSize: 9 }}>
          {["Faible", "Modeste", "Correct", "Bon", "Très bon", "Excellent"].map((l, i) => { const colors = ["#DC2626", "#EA580C", "#CA8A04", "#65A30D", "#15803D", "#0F766E"]; return <span key={i} style={{ padding: "4px 8px", background: colors[i], color: C.white, fontWeight: 700 }}>{l}</span>; })}
        </div>
        <div style={{ marginTop: 12, background: C.lightGray, padding: 12, borderLeft: `4px solid ${C.gold}`, fontSize: 11, color: C.darkGray, lineHeight: 1.5 }}>
          <strong>Le conseil :</strong> La colonne « Capital » suppose une consommation linéaire du patrimoine. C'est plus élevé que la rente seule mais expose au risque de longévité.
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlideTrainDeVieMensuel({ data, num }) {
  const tv = calcTrainDeVieMensuel(data);
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Train de vie mensuel détaillé" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Du brut au net consommable</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Votre <em style={{ color: C.gold }}>train de vie</em> réel</div>
        </div>
        <p style={{ fontSize: 11, color: C.darkGray, lineHeight: 1.6, marginBottom: 16, textAlign: "justify" }}>
          Du <strong>revenu brut</strong> au <strong>train de vie net consommable</strong>, avant et après 90 ans (épuisement du capital).
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 16 }}>
          <tbody>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}><td style={{ padding: "11px 16px", color: C.darkGray, fontWeight: 600 }}>Revenus bruts mensuels (AVS + LPP + FR)</td><td style={{ padding: "11px 16px", textAlign: "right", color: C.primary, fontWeight: 700, whiteSpace: "nowrap" }}>CHF {fmt(tv.revenuBrut)}</td></tr>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}><td style={{ padding: "11px 16px", color: C.gray, paddingLeft: 32 }}>− Contributions sociales (CSG/CRDS est.)</td><td style={{ padding: "11px 16px", textAlign: "right", color: C.bad, whiteSpace: "nowrap" }}>− CHF {fmt(tv.cotSociales)}</td></tr>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}><td style={{ padding: "11px 16px", color: C.gray, paddingLeft: 32 }}>− Imposition mensuelle</td><td style={{ padding: "11px 16px", textAlign: "right", color: C.bad, whiteSpace: "nowrap" }}>− CHF {fmt(tv.impotMensuel)}</td></tr>
            <tr style={{ borderBottom: `2px solid ${C.primary}`, background: "rgba(105,33,2,0.04)" }}><td style={{ padding: "11px 16px", color: C.primary, fontWeight: 800 }}>= Revenus nets</td><td style={{ padding: "11px 16px", textAlign: "right", color: C.primary, fontWeight: 900, fontSize: 14, whiteSpace: "nowrap" }}>CHF {fmt(tv.revenuNet)}</td></tr>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}><td style={{ padding: "11px 16px", color: C.gray, paddingLeft: 32 }}>− Charges fixes (assurances)</td><td style={{ padding: "11px 16px", textAlign: "right", color: C.bad, whiteSpace: "nowrap" }}>− CHF {fmt(tv.chargesFixes)}</td></tr>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}><td style={{ padding: "11px 16px", color: C.gray, paddingLeft: 32 }}>+ Consommation du capital (étalée)</td><td style={{ padding: "11px 16px", textAlign: "right", color: C.ok, fontWeight: 700, whiteSpace: "nowrap" }}>+ CHF {fmt(tv.consoCapitalMensuel)}</td></tr>
          </tbody>
        </table>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div style={{ background: C.ok, color: C.white, padding: 18 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Train de vie AVANT 90 ans</div>
            <div style={{ fontSize: 24, fontWeight: 900, whiteSpace: "nowrap" }}>CHF {fmt(tv.trainVieAvant90)}<span style={{ fontSize: 12, fontWeight: 500 }}> /mois</span></div>
            <div style={{ fontSize: 10, opacity: 0.9, marginTop: 4 }}>Rente + consommation patrimoine</div>
          </div>
          <div style={{ background: C.warn, color: C.white, padding: 18 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Train de vie APRÈS 90 ans</div>
            <div style={{ fontSize: 24, fontWeight: 900, whiteSpace: "nowrap" }}>CHF {fmt(tv.trainVieApres90)}<span style={{ fontSize: 12, fontWeight: 500 }}> /mois</span></div>
            <div style={{ fontSize: 10, opacity: 0.9, marginTop: 4 }}>Rente seule (capital épuisé)</div>
          </div>
        </div>
        <div style={{ background: C.lightGray, padding: 12, fontSize: 11, color: C.darkGray, borderLeft: `4px solid ${C.gold}`, lineHeight: 1.6 }}>
          <strong>Patrimoine immobilier restant à 90 ans :</strong> CHF {fmt(tv.patImmoRestant)} — réserve de transmission ou de soutien (EMS, perte d'autonomie).
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlideLeviers({ data, num }) {
  const synth = calcSyntheseRetraite(data.client, data);
  const leviers = [];
  if (synth.ecart > 0) leviers.push({ titre: "Combler l'écart de revenu", desc: `Il manque CHF ${fmt(synth.ecartMensuel)} /mois.`, action: "Voir leviers ci-dessous." });
  if (Number(data.client.lppPotentielRachat) > 0) leviers.push({ titre: "Rachat LPP", desc: `Potentiel : CHF ${fmt(data.client.lppPotentielRachat)}.`, action: "Optimisation fiscale immédiate (hors année de retrait capital)." });
  if (Number(data.client.troisPCotisationAnnuelle || 0) < 7258) {
    const manque = 7258 - Number(data.client.troisPCotisationAnnuelle || 0);
    leviers.push({ titre: "Maximiser le 3a", desc: `Plafond 2026 : CHF 7'258.`, action: `Augmenter de CHF ${fmt(manque)} /an.` });
  }
  if (data.client.frACarriereFrance && !calcPensionsFR(data.client).tauxPlein) leviers.push({ titre: "Atteindre le taux plein FR", desc: "Trimestres en-dessous du seuil.", action: "Régularisation ou différer la liquidation." });
  if (data.client.lppAvoirsOublies) leviers.push({ titre: "Recherche avoirs LPP oubliés", desc: "Risque identifié.", action: "Demande à la Centrale du 2e pilier." });
  if (Number(data.client.objAgeDepart || 65) < 65) leviers.push({ titre: "Arrêt anticipé", desc: `Départ à ${data.client.objAgeDepart} ans.`, action: "Anticiper cotisations AVS et impact rente." });
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Leviers d'optimisation" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 11</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Vos <em style={{ color: C.gold }}>leviers</em> d'optimisation</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {leviers.slice(0, 6).map((l, i) => (
            <div key={i} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderLeft: `4px solid ${C.gold}`, padding: 16, display: "flex", gap: 16 }}>
              <div style={{ background: C.primary, color: C.white, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.primaryDark, marginBottom: 4 }}>{l.titre}</div>
                <div style={{ fontSize: 11, color: C.gray, marginBottom: 6 }}>{l.desc}</div>
                <div style={{ fontSize: 11, color: C.darkGray }}><strong style={{ color: C.gold }}>Action :</strong> {l.action}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlideFicheCapital({ data, num }) {
  const ageDepart = Number(data.client.objAgeDepart || 65);
  const lpp = calcLPP(data.client, ageDepart);
  const tp = calc3eP(data.client, ageDepart);
  const part = partCapitalLPP(data.client);
  const capitalLPPSorti = lpp.capitalAge65 * part;
  const anneeDepart = new Date().getFullYear() + (ageDepart - Number(data.client.age || 50));
  const nbComptes = Number(data.client.troisPNbComptes || 1);
  const lignes = [];
  if (capitalLPPSorti > 0) lignes.push({ pilier: "2e pilier — LPP (part capital)", montant: capitalLPPSorti, quand: lpp.immediat ? "Immédiat" : "T-12 mois (annonce caisse)", institut: data.client.lppCaisse || "Caisse de pension", dateEffet: `${anneeDepart}` });
  for (let i = 1; i <= nbComptes; i++) {
    lignes.push({ pilier: `3a — Compte n°${i}`, montant: tp.capital3a / nbComptes, quand: "T-3 mois", institut: `Banque 3a #${i}`, dateEffet: `${anneeDepart + i - 1}` });
  }
  if (Number(tp.capital3b) > 0) lignes.push({ pilier: "3b — Assurance-vie", montant: tp.capital3b, quand: "À tout moment", institut: "Assureur 3b", dateEffet: `${anneeDepart}` });
  const total = lignes.reduce((s, l) => s + l.montant, 0);
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Fiche sortie en capital" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Mode opératoire</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Vos <em style={{ color: C.gold }}>capitaux</em> à libérer</div>
        </div>
        <p style={{ fontSize: 11, color: C.darkGray, lineHeight: 1.6, marginBottom: 16, textAlign: "justify" }}>
          Pour chaque capital : <strong>montant, échéance, institut, date d'effet</strong>. L'échelonnement sur plusieurs années fiscales optimise l'impôt.
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: C.primary, color: C.white }}>
              <th style={{ padding: "10px", textAlign: "left" }}>Source</th>
              <th style={{ padding: "10px", textAlign: "right" }}>Montant</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Demande</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Auprès de</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Effet</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.lightGray}`, background: i % 2 === 0 ? C.white : "rgba(165,149,104,0.03)" }}>
                <td style={{ padding: "9px 10px", color: C.darkGray, fontWeight: 600 }}>{l.pilier}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", color: C.primary, fontWeight: 700, whiteSpace: "nowrap" }}>CHF {fmt(l.montant)}</td>
                <td style={{ padding: "9px 10px", color: C.gold, fontWeight: 600, fontSize: 10 }}>{l.quand}</td>
                <td style={{ padding: "9px 10px", color: C.gray, fontStyle: "italic", fontSize: 10 }}>{l.institut}</td>
                <td style={{ padding: "9px 10px", textAlign: "center", color: C.darkGray, fontWeight: 700 }}>{l.dateEffet}</td>
              </tr>
            ))}
            <tr style={{ background: C.primary, color: C.white }}>
              <td style={{ padding: "12px 10px", fontWeight: 900 }}>TOTAL CAPITAUX</td>
              <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 900, fontSize: 16, color: C.gold, whiteSpace: "nowrap" }}>CHF {fmt(Math.round(total))}</td>
              <td colSpan={3}></td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: 14, background: "rgba(239,68,68,0.05)", padding: 12, borderLeft: `4px solid ${C.bad}`, fontSize: 10.5, color: C.darkGray, lineHeight: 1.5 }}>
          <strong>Alerte fiscale :</strong> Les retraits en capital sont taxés séparément, à taux privilégié, mais <strong>cumulés dans la même année</strong>. Échelonner sur plusieurs années fiscales réduit l'impôt total — voir le comparatif fiscal transfrontalier.
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlidePlanActions({ data, num }) {
  const actions = generatePlanActions(data).slice(0, 20);
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Plan d'actions calendaire" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.primary}`, paddingLeft: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 12 · De l'analyse à l'exécution</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Votre <em style={{ color: C.gold }}>plan d'actions</em></div>
        </div>
        <p style={{ fontSize: 11, color: C.darkGray, lineHeight: 1.5, marginBottom: 12, textAlign: "justify" }}>
          Chaque démarche à entreprendre, son destinataire et sa priorité — feuille de route de l'audit (R1) à la liquidation.
        </p>
        <div style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: 9, color: C.gray }}>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.bad, marginRight: 4, verticalAlign: "middle" }} /> Haute</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.warn, marginRight: 4, verticalAlign: "middle" }} /> Moyenne</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.ok, marginRight: 4, verticalAlign: "middle" }} /> Basse</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
          <thead>
            <tr style={{ background: C.primary, color: C.white }}>
              <th style={{ padding: "6px 8px", textAlign: "left", width: 80 }}>Échéance</th>
              <th style={{ padding: "6px 8px", textAlign: "left" }}>Action</th>
              <th style={{ padding: "6px 8px", textAlign: "left", width: 180 }}>Destinataire</th>
              <th style={{ padding: "6px 8px", textAlign: "center", width: 16 }}></th>
            </tr>
          </thead>
          <tbody>
            {actions.map((a, i) => {
              const color = a.importance === "haute" ? C.bad : a.importance === "moyenne" ? C.warn : C.ok;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${C.lightGray}` }}>
                  <td style={{ padding: "6px 8px", color: C.darkGray, fontWeight: 700, fontSize: 10, whiteSpace: "nowrap" }}>{a.annee} · {a.mois}</td>
                  <td style={{ padding: "6px 8px", color: C.darkGray }}>{a.action}</td>
                  <td style={{ padding: "6px 8px", color: C.gray, fontStyle: "italic" }}>{a.destinataire}</td>
                  <td style={{ padding: "6px 8px", textAlign: "center" }}><span style={{ display: "inline-block", width: 12, height: 12, background: color }} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ marginTop: 12, background: "rgba(165,149,104,0.1)", padding: 10, fontSize: 10, color: C.darkGray, borderLeft: `3px solid ${C.gold}` }}>
          <strong>Alerte délais :</strong> La sortie LPP doit être annoncée à la caisse <strong>12 mois avant</strong>. La rente AVS se demande au moins 3 mois avant l'âge ordinaire.
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlideGainTotal({ data, num }) {
  const gain = calcGainTotal(data);
  const arbitrage = calcArbitrageSante(data.client, data);
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Gain total du conseil" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 13 · Valeur du conseil chiffrée</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Le <em style={{ color: C.gold }}>gain total</em> matérialisé</div>
        </div>
        <p style={{ fontSize: 11, color: C.darkGray, lineHeight: 1.6, marginBottom: 16, textAlign: "justify" }}>
          Gain consolidé sur la période : bonnes décisions retraite, choix santé/fiscalité optimal, et économies via nos partenaires (change, frais bancaires).
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 16 }}>
          <tbody>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}><td style={{ padding: "12px 16px", color: C.darkGray, fontWeight: 600 }}>Gain choix âge AVS optimal</td><td style={{ padding: "12px 16px", textAlign: "right", color: C.primary, fontWeight: 700, whiteSpace: "nowrap" }}>CHF {fmt(gain.gainAgeAVS)}</td></tr>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}><td style={{ padding: "12px 16px", color: C.darkGray, fontWeight: 600 }}>Gain stratégie maladie ({arbitrage.meilleur.label})</td><td style={{ padding: "12px 16px", textAlign: "right", color: C.primary, fontWeight: 700, whiteSpace: "nowrap" }}>CHF {fmt(gain.gainStrategieMaladie)}</td></tr>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}><td style={{ padding: "12px 16px", color: C.darkGray, fontWeight: 600 }}>Économies de change (partenaire dédié)</td><td style={{ padding: "12px 16px", textAlign: "right", color: C.primary, fontWeight: 700, whiteSpace: "nowrap" }}>CHF {fmt(gain.economiesChange)}</td></tr>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}><td style={{ padding: "12px 16px", color: C.darkGray, fontWeight: 600 }}>Économies frais bancaires</td><td style={{ padding: "12px 16px", textAlign: "right", color: C.primary, fontWeight: 700, whiteSpace: "nowrap" }}>CHF {fmt(gain.economiesFrais)}</td></tr>
            <tr style={{ background: C.primary, color: C.white }}><td style={{ padding: "16px", fontWeight: 900, fontSize: 16 }}>TOTAL GAIN ESTIMÉ</td><td style={{ padding: "16px", textAlign: "right", fontWeight: 900, fontSize: 22, color: C.gold, whiteSpace: "nowrap" }}>CHF {fmt(gain.total)}</td></tr>
          </tbody>
        </table>
        <div style={{ background: C.lightGray, padding: 14, fontSize: 11, color: C.darkGray, lineHeight: 1.6, borderLeft: `4px solid ${C.gold}` }}>
          <strong>Partenaires recommandés :</strong> <MultiLine text={data.partenairesDescription || "B-Sharpe (change), Banque du Léman (frais)."} /><br/>
          <strong>Période d'estimation :</strong> {data.economiesPartenairesAnneesEstimees} ans · Économies frais annuelles : CHF {fmt(data.economiesFraisAnnuelles)}.
        </div>
        <div style={{ marginTop: 14, background: "rgba(255,255,255,0.7)", padding: 12, fontSize: 10, color: C.gray, fontStyle: "italic", borderLeft: `3px solid ${C.mediumGray}` }}>
          Réserve : Estimations basées sur les hypothèses validées. Les chiffres réels dépendront de l'évolution des taux, de la fiscalité et des règlements de caisse. Non opposable juridiquement.
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function LigneHypo({ label, valeur }) {
  return (
    <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}>
      <td style={{ padding: "10px 16px", color: C.darkGray, fontWeight: 500 }}>{label}</td>
      <td style={{ padding: "10px 16px", textAlign: "right", color: C.primary, fontWeight: 700, whiteSpace: "nowrap" }}>{valeur}</td>
    </tr>
  );
}

function SlideHypotheses({ data, num }) {
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Hypothèses de l'étude" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 14</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Les <em style={{ color: C.gold }}>hypothèses</em> retenues</div>
        </div>
        <p style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.6, marginBottom: 16, textAlign: "justify" }}>
          Toute projection repose sur un cadre d'hypothèses <strong>validées ensemble</strong>. Sources : caisse de compensation (AVS), caisse de pension (LPP), compagnies 3A.
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 16 }}>
          <thead>
            <tr style={{ background: C.primary, color: C.white }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Hypothèse</th>
              <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>Valeur</th>
            </tr>
          </thead>
          <tbody>
            <LigneHypo label="Taux de rendement du patrimoine" valeur={`${data.tauxRendement} % /an`} />
            <LigneHypo label="Taux d'inflation / indexation" valeur={`${data.tauxInflation} % /an`} />
            <LigneHypo label="Taux de change EUR / CHF" valeur={`${data.tauxChangeEurChf} CHF par 1 €`} />
            <LigneHypo label="Pays de résidence retraite" valeur={data.paysResidenceRetraite} />
            <LigneHypo label="Âge de fin de consommation" valeur={`${data.client.objAgeFinConsommation || 90} ans`} />
            <LigneHypo label="13e rente AVS (déc. 2026)" valeur={data.client.avs13eRente ? "Oui (+8.3%)" : "Non"} />
            <LigneHypo label="Prime LAMal annuelle retenue" valeur={`CHF ${fmt(data.primeLAMalAnnuelle)} /an`} />
            <LigneHypo label="Taux CSG/CRDS/CASA" valeur={`${data.tauxCSGCRDSCASA} %`} />
            <LigneHypo label="Impôt capital LPP — CH / FR" valeur={`${data.fiscTauxCapitalCH}% / ${data.fiscTauxCapitalFR}%`} />
            <LigneHypo label="Impôt rente — CH / FR" valeur={`${data.fiscTauxRenteCH}% / ${data.fiscTauxRenteFR}%`} />
            <LigneHypo label="Mode de projection couple" valeur={data.isCouple ? (data.coupleProjectionMode === "commune" ? "Commune (ménage)" : "Séparée") : "—"} />
          </tbody>
        </table>
        {data.pointsAttention && (
          <div style={{ background: C.lightGray, padding: 12, borderLeft: `4px solid ${C.gold}`, fontSize: 11, color: C.darkGray, lineHeight: 1.6 }}>
            <strong>Points d'attention :</strong> <MultiLine text={data.pointsAttention} />
          </div>
        )}
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlideConjoint({ data, num }) {
  if (!data.isCouple || !data.conjoint.prenom) return null;
  const synth = calcSyntheseRetraite(data.conjoint, data);
  const lppE = lppEffectif(data.conjoint, Number(data.conjoint.objAgeDepart || 65));
  const tp = calc3eP(data.conjoint, Number(data.conjoint.objAgeDepart || 65));
  const isCapital = lppE.partCapital >= 0.999;
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection={`Madame — Vue complète`} />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Volet Madame · projection séparée</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>{data.conjoint.prenom} {(data.conjoint.nom || "").toUpperCase()}</div>
        </div>
        <CarteProfil p={data.conjoint} couleur={C.gold} />
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${C.swiss}`, padding: 14 }}>
            <div style={{ fontSize: 10, color: C.swiss, fontWeight: 800, marginBottom: 4 }}>AVS</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.primary, whiteSpace: "nowrap" }}>CHF {fmt(synth.avs.renteMensuelle)}</div>
            <div style={{ fontSize: 10, color: C.gray }}>/mois à 65 ans</div>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${C.primary}`, padding: 14 }}>
            <div style={{ fontSize: 10, color: C.primary, fontWeight: 800, marginBottom: 4 }}>LPP</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.primary, whiteSpace: "nowrap" }}>{isCapital ? `CHF ${fmt(lppE.capitalSorti)}` : <>CHF {fmt(lppE.renteMensuelleEff)}</>}</div>
            <div style={{ fontSize: 10, color: C.gray }}>{isCapital ? "capital" : `/mois — Cap. ${fmt(lppE.capitalAge65)}`}</div>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${C.gold}`, padding: 14 }}>
            <div style={{ fontSize: 10, color: C.gold, fontWeight: 800, marginBottom: 4 }}>3e Pilier</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.primary, whiteSpace: "nowrap" }}>CHF {fmt(tp.capitalTotal)}</div>
            <div style={{ fontSize: 10, color: C.gray }}>capital projeté</div>
          </div>
        </div>
        {data.conjoint.frACarriereFrance && (
          <div style={{ marginTop: 16, background: C.france, color: C.white, padding: 16 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Pensions françaises cumulées</div>
            <div style={{ fontSize: 20, fontWeight: 900, whiteSpace: "nowrap" }}>{fmtEUR(synth.pensionsFR.totalMensuel)} €/mois <span style={{ fontSize: 12, opacity: 0.85 }}>(≈ CHF {fmt(synth.pensionsFRChfMensuelle)}/mois)</span></div>
            <div style={{ fontSize: 10, opacity: 0.9, marginTop: 4 }}>CNAV {fmtEUR(synth.pensionsFR.pensionCnavMensuelle)} € + AGIRC-ARRCO {fmtEUR(synth.pensionsFR.pensionAgircMensuelle)} € · Trim. {data.conjoint.frTrimestresAcquis}/{data.conjoint.frTrimestresRequis} · {synth.pensionsFR.tauxPlein ? "Taux plein" : "Décote applicable"}</div>
          </div>
        )}
        <div style={{ marginTop: 16, background: C.primary, color: C.white, padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Revenu rente Madame à {synth.ageDepart} ans</span>
          <span style={{ fontSize: 24, fontWeight: 900, whiteSpace: "nowrap" }}>CHF {fmt(synth.revenuRenteAjusteMensuel)} /mois</span>
        </div>
        <div style={{ marginTop: 14, background: C.lightGray, padding: 12, borderLeft: `4px solid ${C.gold}`, fontSize: 11, color: C.darkGray, lineHeight: 1.6 }}>
          <strong>Vue couple :</strong> le décalage des âges de départ ({data.client.objAgeDepart} vs {data.conjoint.objAgeDepart} ans) permet un <strong>échelonnement naturel</strong> des liquidations, optimisant la fiscalité.
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlideNotes({ data, num }) {
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Notes personnelles" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Vos annotations</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Espace <em style={{ color: C.gold }}>notes</em></div>
        </div>
        <p style={{ fontSize: 11, color: C.gray, marginBottom: 20, fontStyle: "italic" }}>Notez vos questions et points à valider entre R1 et R2.</p>
        {Array.from({ length: 20 }).map((_, i) => (<div key={i} style={{ height: 28, borderBottom: `1px solid ${C.mediumGray}` }} />))}
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlideDisclaimer({ data, num }) {
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Avertissement légal" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.bad}`, paddingLeft: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.bad, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Limitations de responsabilité</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, color: C.primary, fontWeight: 700, margin: 0 }}>Avertissement <em style={{ color: C.bad }}>légal</em></div>
        </div>
        <div style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.65, textAlign: "justify" }}>
          <p><strong style={{ color: C.primary }}>1. Nature.</strong> Étude personnalisée à caractère <strong>indicatif</strong>, ne constituant ni conseil juridique ni conseil fiscal individualisé au sens des réglementations applicables.</p>
          <p><strong style={{ color: C.primary }}>2. Sources.</strong> Chiffres basés sur les informations transmises et des hypothèses validées. Toute inexactitude se répercute sur les projections.</p>
          <p><strong style={{ color: C.primary }}>3. Non-garantie.</strong> Les rendements ne sont pas garantis. Taux de conversion LPP, valeur du point AGIRC-ARRCO, rente AVS évoluent selon les réformes.</p>
          <p><strong style={{ color: C.primary }}>4. Non opposable.</strong> Les estimations AVS/LPP <strong>ne sont pas opposables</strong> aux institutions. Seules leurs décisions formelles font foi.</p>
          <p><strong style={{ color: C.primary }}>5. Évolutions.</strong> Le cadre franco-suisse (sécurité sociale, fiscalité, quasi-résident, LAMal/CMU) évolue. Revue annuelle recommandée.</p>
          <p><strong style={{ color: C.primary }}>6. Indépendance.</strong> WallSwiss SA opère en architecture ouverte, sans obligation de distribution envers une institution particulière.</p>
          <p><strong style={{ color: C.primary }}>7. Données.</strong> <MultiLine text={data.confidentialiteTexte} /></p>
        </div>
        <div style={{ marginTop: 20, padding: 14, background: C.lightGray, borderLeft: `4px solid ${C.gold}`, fontSize: 10, color: C.gray, fontStyle: "italic", textAlign: "center" }}>
          Document confidentiel établi le {data.dateRapport ? new Date(data.dateRapport).toLocaleDateString('fr-FR') : "—"} par {data.conseiller || "—"}.
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlideDocuments({ data, num }) {
  const docsSuisse = ["Pièce d'identité + permis G", "Certificat AVS + extrait du CI", "Certificat LPP récent + règlement de caisse", "Attestation potentiel de rachat LPP", "Attestations libre-passage", "Relevés et attestations 3a (banque + assurance)", "Polices d'assurance-vie 3b", "Fiches de salaire + certificat annuel", "Dernière décision de taxation", "Contrats hypothécaires", "Estimations / actes immobiliers", "Relevés bancaires et dépôts-titres", "Police d'assurance maladie"];
  const docsFrance = ["Relevé de carrière / RIS (info-retraite.fr)", "Relevé de points AGIRC-ARRCO", "Bulletins France Travail pour périodes manquantes", "Avis d'imposition français", "Justificatif de quasi-résident"];
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Documents à fournir" />
      <div style={{ padding: "78px 50px 70px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 15 — Préparation du R2</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Les <em style={{ color: C.gold }}>documents</em> à transmettre</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ background: C.swiss, color: C.white, padding: "8px 12px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", marginBottom: 8 }}>Volet suisse</div>
            {docsSuisse.map((d, i) => (<div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.lightGray}`, fontSize: 10.5, color: C.darkGray }}><div style={{ width: 12, height: 12, border: `1.5px solid ${C.swiss}`, flexShrink: 0, marginTop: 1 }} /><span>{d}</span></div>))}
          </div>
          <div>
            <div style={{ background: C.france, color: C.white, padding: "8px 12px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", marginBottom: 8 }}>Volet français</div>
            {docsFrance.map((d, i) => (<div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.lightGray}`, fontSize: 10.5, color: C.darkGray }}><div style={{ width: 12, height: 12, border: `1.5px solid ${C.france}`, flexShrink: 0, marginTop: 1 }} /><span>{d}</span></div>))}
            <div style={{ background: C.lightGray, padding: 12, marginTop: 16, fontSize: 10, color: C.gray, lineHeight: 1.5, borderLeft: `3px solid ${C.gold}` }}><strong>Astuce :</strong> Le RIS est téléchargeable sur <strong>info-retraite.fr</strong>.</div>
          </div>
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlideContact({ data, num }) {
  return (
    <div style={{ ...pageBase, background: `linear-gradient(180deg, ${C.lightGray} 0%, ${C.white} 100%)` }}>
      <PageHeader data={data} num={num} titreSection="Prochaines étapes" />
      <div style={{ padding: "110px 50px 70px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><div style={{ background: C.primary, width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}><Logo size={34} variant="white" /></div></div>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>Votre planification</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 34, color: C.primary, fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>Construisons<br/><em style={{ color: C.gold }}>la suite ensemble</em></div>
          <div style={{ width: 60, height: 4, background: C.gold, margin: "0 auto" }} />
        </div>
        <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Votre interlocuteur dédié</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, marginBottom: 4 }}>{data.conseiller || "—"}</div>
          <div style={{ fontSize: 12, color: C.gray, marginBottom: 24, textTransform: "uppercase" }}>{data.titreConseiller}</div>
          <div style={{ height: 1, background: C.lightGray, marginBottom: 20 }} />
          <div style={{ fontSize: 13, color: C.darkGray, lineHeight: 2 }}>
            <div><strong style={{ color: C.gray }}>T</strong>&nbsp;&nbsp;{data.telephone || "—"}</div>
            <div><strong style={{ color: C.gray }}>E</strong>&nbsp;&nbsp;{data.email || "—"}</div>
            <div><strong style={{ color: C.gray }}>A</strong>&nbsp;&nbsp;WallSwiss · Nyon, Suisse</div>
          </div>
        </div>
      </div>
      <PageFooter data={data} num={num} />
    </div>
  );
}

function SlideCitation({ data, num, citation, auteur, contexte }) {
  return (
    <div style={{ ...pageBase, background: `linear-gradient(135deg, ${C.primaryDark} 0%, ${C.primary} 100%)` }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: C.gold }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 6, background: C.gold }} />
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 80, boxSizing: "border-box", position: "relative" }}>
        <div style={{ position: "absolute", top: 80, left: 80, fontSize: 180, color: "rgba(165,149,104,0.15)", fontFamily: "'Times New Roman', Times, serif", lineHeight: 0.8 }}>“</div>
        <div style={{ color: C.gold, fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 24 }}>{contexte}</div>
        <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.white, fontWeight: 400, fontStyle: "italic", lineHeight: 1.4, textAlign: "center", maxWidth: 600, marginBottom: 32, position: "relative", zIndex: 2 }}>« {citation} »</div>
        <div style={{ width: 60, height: 2, background: C.gold, marginBottom: 16 }} />
        <div style={{ color: C.gold, fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>— {auteur}</div>
      </div>
      <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase" }}>WallSwiss · {num}</div>
    </div>
  );
}

// ============================================================
// SOMMAIRE DYNAMIQUE
// ============================================================
function sommaireParts(data) {
  const couple = data.isCouple && data.conjoint && data.conjoint.prenom;
  const fr = data.client.frACarriereFrance;
  return [
    { titre: "Partie 1 — Diagnostic & droits", sections: [
      { num: "1.1", titre: "Profil & objectifs (Mr & Mme)" },
      { num: "1.2", titre: "Cartographie de vos droits" },
      { num: "1.3", titre: "Vue d'ensemble — Revenu projeté" },
      { num: "1.4", titre: "Temple des revenus retraite" },
    ]},
    { titre: "Partie 2 — Prévoyance suisse", sections: [
      { num: "2.1", titre: "1er pilier — AVS" },
      { num: "2.2", titre: "2e pilier — LPP" },
      { num: "2.3", titre: "3e pilier — 3a + 3b" },
      { num: "2.4", titre: "3 scénarios de sortie LPP" },
    ]},
    { titre: "Partie 3 — Volet FR & fiscalité", sections: [
      ...(fr ? [{ num: "3.1", titre: "Pensions FR — Tôt vs Taux plein" }] : []),
      { num: "3.2", titre: "Arbitrage santé / fiscalité" },
      { num: "3.3", titre: "Fiscalité transfrontalière (CH vs FR)" },
      ...(couple ? [{ num: "3.4", titre: `Vue complète — ${data.conjoint.prenom}` }] : []),
    ]},
    { titre: "Partie 4 — Patrimoine", sections: [
      { num: "4.1", titre: "Patrimoine global" },
      { num: "4.2", titre: "Pré-allocation par horizon" },
      { num: "4.3", titre: "Projection annuelle" },
      { num: "4.4", titre: "Évolution du patrimoine" },
      { num: "4.5", titre: "Heatmap — Âge de départ" },
      { num: "4.6", titre: "Train de vie mensuel" },
    ]},
    { titre: "Partie 5 — Stratégie & exécution", sections: [
      { num: "5.1", titre: "Solutions recommandées" },
      { num: "5.2", titre: "Leviers d'optimisation" },
      { num: "5.3", titre: "Fiche sortie en capital" },
      { num: "5.4", titre: "Plan d'actions calendaire" },
      { num: "5.5", titre: "Gain total du conseil" },
    ]},
    { titre: "Partie 6 — Annexes", sections: [
      { num: "6.1", titre: "Hypothèses retenues" },
      { num: "6.2", titre: "Documents pour le R2" },
      { num: "6.3", titre: "Espace notes" },
      { num: "6.4", titre: "Avertissement légal" },
      { num: "6.5", titre: "Contact & prochaines étapes" },
    ]},
  ];
}

function buildSlides(data) {
  let n = 0;
  const N = () => String(++n).padStart(2, "0");
  const couple = data.isCouple && data.conjoint && data.conjoint.prenom;
  const fr = data.client.frACarriereFrance;
  const slides = [];
  slides.push(<SlideCouverture data={data} />);
  slides.push(<SlideSommaire data={data} parts={sommaireParts(data)} />);
  slides.push(<SlideWallswiss data={data} />);
  if (data.showCitations !== false) slides.push(<SlideCitation data={data} num={N()} citation="L'épargne est le meilleur des héritages que l'on peut laisser à ses enfants." auteur="Sénèque" contexte="Avant-propos" />);
  slides.push(<SlideProfil data={data} num={N()} />);
  slides.push(<SlideCartographieDroits data={data} num={N()} />);
  slides.push(<SlideVueEnsemble data={data} num={N()} />);
  slides.push(<SlideTemple data={data} num={N()} />);
  if (data.showCitations !== false) slides.push(<SlideCitation data={data} num={N()} citation="La vie, c'est ce qui vous arrive pendant que vous êtes occupés à faire d'autres projets." auteur="John Lennon" contexte="Volet prévoyance suisse" />);
  slides.push(<SlideAVS data={data} num={N()} />);
  slides.push(<SlideLPP data={data} num={N()} />);
  slides.push(<Slide3eP data={data} num={N()} />);
  slides.push(<Slide3ScenariosLPP data={data} num={N()} />);
  if (data.showCitations !== false) slides.push(<SlideCitation data={data} num={N()} citation="Personne ne peut revenir en arrière et faire un nouveau départ, mais chacun peut partir maintenant et faire une nouvelle fin." auteur="Mahatma Gandhi" contexte="Volet français & fiscalité" />);
  if (fr) slides.push(<SlideDoubleScenarioFR data={data} num={N()} />);
  slides.push(<SlideArbitrageSante data={data} num={N()} />);
  slides.push(<SlideFiscaliteCompare data={data} num={N()} />);
  if (couple) slides.push(<SlideConjoint data={data} num={N()} />);
  slides.push(<SlidePatrimoine data={data} num={N()} />);
  slides.push(<SlideHorizons data={data} num={N()} />);
  slides.push(<SlideProjectionAnnuelle data={data} num={N()} />);
  slides.push(<SlideEvolutionPatrimoine data={data} num={N()} />);
  slides.push(<SlideHeatmap data={data} num={N()} />);
  slides.push(<SlideTrainDeVieMensuel data={data} num={N()} />);
  if (data.showCitations !== false) slides.push(<SlideCitation data={data} num={N()} citation="Le futur appartient à ceux qui croient à la beauté de leurs rêves." auteur="Eleanor Roosevelt" contexte="Stratégie & action" />);
  slides.push(<SlideSolutions data={data} num={N()} />);
  slides.push(<SlideLeviers data={data} num={N()} />);
  slides.push(<SlideFicheCapital data={data} num={N()} />);
  slides.push(<SlidePlanActions data={data} num={N()} />);
  slides.push(<SlideGainTotal data={data} num={N()} />);
  slides.push(<SlideHypotheses data={data} num={N()} />);
  slides.push(<SlideDocuments data={data} num={N()} />);
  slides.push(<SlideNotes data={data} num={N()} />);
  slides.push(<SlideDisclaimer data={data} num={N()} />);
  slides.push(<SlideContact data={data} num={N()} />);
  return slides;
}

// ============================================================
// MODALE D'APERÇU + GÉNÉRATION PDF
// ============================================================
const getBase64Image = async (url) => {
  try {
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) { return url; }
};

const requirePdfLibs = async () => {
  if (window.html2canvas && window.jspdf) return;
  const loadScript = (src) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src; script.onload = resolve; script.onerror = reject;
    document.body.appendChild(script);
  });
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
};

function PreviewR1({ data, onClose, onEdit, onDelete, appSettings }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: "", subject: "", body: "" });

  const slides = useMemo(() => buildSlides(data), [data]);
  const pdfFilename = `Planification_${(data.client.prenom || "").trim()}_${(data.client.nom || "Client").trim()}.pdf`.replace(/\s+/g, '_');

  const generatePdf = async (scale, quality) => {
    await requirePdfLibs();
    const html2canvas = window.html2canvas;
    const jsPDFClass = window.jspdf.jsPDF;
    const element = document.getElementById('r1-printable');
    const pages = element.querySelectorAll('.pdf-page');
    const pdfW = PAGE_W / 96, pdfH = PAGE_H / 96;
    const pdf = new jsPDFClass({ unit: 'in', format: [pdfW, pdfH], orientation: 'portrait' });
    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], { scale, useCORS: true, backgroundColor: '#ffffff', width: PAGE_W, height: PAGE_H, windowWidth: PAGE_W, windowHeight: PAGE_H, logging: false });
      const img = canvas.toDataURL('image/jpeg', quality);
      if (i > 0) pdf.addPage([pdfW, pdfH], 'portrait');
      pdf.addImage(img, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST');
    }
    return pdf;
  };

  const handleDownloadPDF = async () => {
    setIsPdfLoading(true);
    await new Promise(r => setTimeout(r, 200));
    try { const pdf = await generatePdf(2, 0.95); pdf.save(pdfFilename); }
    catch (e) { console.error("Erreur PDF:", e); }
    finally { setIsPdfLoading(false); }
  };

  const openEmailModal = () => {
    setEmailForm({
      to: data.client.emailClient || "",
      subject: `Votre planification — WallSwiss`,
      body: `Bonjour ${data.client.prenom || ""},\n\nVeuillez trouver ci-joint votre rapport de planification, préparé suite à notre rendez-vous du ${new Date(data.dateRapport).toLocaleDateString('fr-FR')}.\n\nBien à vous,\n${data.conseiller}`
    });
    setShowEmailModal(true);
  };

  const handleConfirmEmail = async () => {
    const webhookUrl = appSettings?.reportWebhookUrl?.trim();
    if (!webhookUrl) { alert("Configurez l'URL du Webhook dans Paramètres."); return; }
    setShowEmailModal(false);
    setIsEmailing(true);
    try {
      const pdf = await generatePdf(1.5, 0.85);
      const raw = pdf.output('datauristring');
      const pureBase64 = raw.includes('base64,') ? raw.substring(raw.indexOf('base64,') + 7) : raw;
      const response = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailForm.to, subject: emailForm.subject, body: emailForm.body, pdfBase64: pureBase64, filename: pdfFilename }) });
      if (!response.ok) throw new Error(`Webhook ${response.status}`);
      setEmailSuccess(true); setTimeout(() => setEmailSuccess(false), 3000);
    } catch (e) { console.error(e); alert("Erreur d'envoi : " + e.message); }
    finally { setIsEmailing(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, display: "flex", flexDirection: "column" }}>
      <div style={{ background: C.black, padding: "10px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <span style={{ color: C.white, fontSize: 12, fontWeight: 600 }}>APERÇU — {data.client.prenom} {(data.client.nom || "").toUpperCase()}</span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {onEdit && <button onClick={onEdit} style={{ background: "rgba(255,255,255,0.1)", color: C.white, border: "none", padding: "6px 12px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>ÉDITER</button>}
          {onDelete && <button onClick={onDelete} style={{ background: "transparent", color: "#FCA5A5", border: "1px solid rgba(252,165,165,0.3)", padding: "6px 12px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>SUPPRIMER</button>}
          <button onClick={handleDownloadPDF} disabled={isPdfLoading || isEmailing} style={{ background: C.white, color: C.primaryDark, border: "none", padding: "6px 12px", cursor: "pointer", fontSize: 10, fontWeight: 700, opacity: isPdfLoading ? 0.7 : 1 }}>{isPdfLoading ? "GÉNÉRATION..." : "TÉLÉCHARGER PDF"}</button>
          <button onClick={openEmailModal} disabled={isEmailing} style={{ background: emailSuccess ? C.ok : C.gold, color: C.white, border: "none", padding: "6px 12px", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>{isEmailing ? "ENVOI..." : emailSuccess ? "ENVOYÉ" : "EMAIL"}</button>
          <span style={{ color: C.gold, fontSize: 11 }}>{currentSlide + 1} / {slides.length}</span>
          <button onClick={onClose} style={{ background: "transparent", color: C.gray, border: "none", padding: "6px 12px", cursor: "pointer", fontSize: 11 }}>FERMER ✕</button>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 60px", position: "relative" }}>
        <button onClick={() => setCurrentSlide(s => Math.max(0, s - 1))} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.08)", color: C.white, border: "none", width: 40, height: 40, cursor: "pointer", fontSize: 20 }}>‹</button>
        <div style={{ width: PAGE_W * 0.65, height: PAGE_H * 0.65, position: "relative", boxShadow: "0 8px 40px rgba(0,0,0,0.5)", overflow: "hidden", backgroundColor: C.white }}>
          <div style={{ width: PAGE_W, height: PAGE_H, transform: "scale(0.65)", transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>{slides[currentSlide]}</div>
        </div>
        <button onClick={() => setCurrentSlide(s => Math.min(slides.length - 1, s + 1))} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.08)", color: C.white, border: "none", width: 40, height: 40, cursor: "pointer", fontSize: 20 }}>›</button>
      </div>
      <div style={{ background: C.black, padding: "8px 24px", display: "flex", gap: 4, overflowX: "auto", flexShrink: 0 }}>
        {slides.map((_, i) => (
          <div key={i} onClick={() => setCurrentSlide(i)} style={{ width: 36, height: 28, background: i === currentSlide ? C.primary : "rgba(255,255,255,0.06)", border: i === currentSlide ? `1px solid ${C.gold}` : "1px solid rgba(255,255,255,0.04)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: i === currentSlide ? C.white : "rgba(255,255,255,0.35)", fontWeight: 600 }}>{i + 1}</div>
        ))}
      </div>
      <div style={{ position: "absolute", left: "-9999px", top: 0, zIndex: -1000, opacity: 1, pointerEvents: "none" }}>
        <div id="r1-printable" style={{ width: `${PAGE_W}px`, background: C.white }}>
          {slides.map((Sl, i) => (
            <div key={i} className="pdf-page" style={{ width: `${PAGE_W}px`, height: `${PAGE_H}px`, position: "relative", overflow: "hidden", display: "block" }}>{Sl}</div>
          ))}
        </div>
      </div>
      {isPdfLoading && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.95)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700 }}>Génération du rapport...</div>
          <div style={{ fontSize: 12, color: C.gray, marginTop: 8 }}>Capture haute définition en cours</div>
        </div>
      )}
      {isEmailing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.95)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700 }}>Envoi de l'email...</div>
        </div>
      )}
      {showEmailModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.white, width: 500, padding: 32 }}>
            <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 22, color: C.primary, marginTop: 0 }}>Envoyer le rapport par email</h3>
            <Field label="Destinataire" value={emailForm.to} onChange={(v) => setEmailForm({ ...emailForm, to: v })} type="email" />
            <Field label="Objet" value={emailForm.subject} onChange={(v) => setEmailForm({ ...emailForm, subject: v })} />
            <Field label="Message" value={emailForm.body} onChange={(v) => setEmailForm({ ...emailForm, body: v })} textarea />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
              <button onClick={() => setShowEmailModal(false)} style={S.btnS}>Annuler</button>
              <button onClick={handleConfirmEmail} style={S.btnP}>Confirmer l'envoi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL EXPORTÉ
// ============================================================
export default function App({ appSettings }) {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState(stateInitial());
  const [preview, setPreview] = useState(null);
  const [planifs, setPlanifs] = useState([]);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const ref = collection(db, 'artifacts', appId, 'public', 'data', 'planifications_retraite');
    const unsub = onSnapshot(ref,
      (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        const adminEmail = "admin@wallswiss.ch";
        const filtered = user.email === adminEmail ? list : list.filter(r => r.agentId === user.uid);
        setPlanifs(filtered.sort((a, b) => (b.id || 0) - (a.id || 0)));
      },
      (err) => console.error("Firebase onSnapshot error:", err)
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (page === "create" && !data.id && !data.conseiller && appSettings) {
      setData(d => ({
        ...d,
        conseiller: `${appSettings.agentFirstName || ""} ${appSettings.agentLastName || ""}`.trim(),
        titreConseiller: appSettings.agentTitle || d.titreConseiller,
        telephone: appSettings.agentPhone || "",
        email: appSettings.agentEmail || "",
      }));
    }
  }, [page, appSettings, data.id, data.conseiller]);

  const handleSave = async () => {
    const newId = data.id || Date.now();
    const newPlanif = { ...data, id: newId, agentId: user ? user.uid : "demo", agentEmail: user ? user.email : "demo@wallswiss.ch", dateCreation: data.dateCreation || new Date().toISOString() };
    if (user && db) {
      try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'planifications_retraite', newId.toString()), newPlanif); }
      catch (e) { console.error("Erreur sauvegarde", e); }
    } else {
      setPlanifs(p => [newPlanif, ...p.filter(x => x.id !== newId)]);
    }
    setPreview(newPlanif);
    setPage("dashboard");
  };

  const handleDelete = async (e, id) => {
    if (e) e.stopPropagation();
    if (!confirm("Supprimer définitivement cette planification ?")) return;
    if (user && db) {
      try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'planifications_retraite', id.toString())); }
      catch (err) { console.error(err); }
    } else {
      setPlanifs(p => p.filter(r => r.id !== id));
    }
  };

  const handleEdit = (e, planif) => {
    if (e) e.stopPropagation();
    setData(planif);
    setPage("create");
  };

  const resetForm = () => setData(stateInitial());

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <header style={{ background: C.white, borderBottom: `1px solid ${C.mediumGray}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: C.primary, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 3 }}><Logo size={22} variant="white" /></div>
            <div>
              <div style={{ color: C.gray, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Module ouvert</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>{STUDY_LABELS[data.studyType] || "Planification"} — R1 Frontaliers / Franco-suisses</div>
            </div>
          </div>
          <nav style={{ display: "flex", gap: 8 }}>
            {[["dashboard", "Mes planifications"], ["create", "Nouveau R1"]].map(([p, l]) => (
              <button key={p} onClick={() => { setPage(p); if (p === "create" && !data.client.prenom) resetForm(); }} style={{ background: page === p ? "rgba(105,33,2,0.06)" : "transparent", color: page === p ? C.primary : C.gray, border: "none", padding: "8px 16px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: page === p ? 700 : 500 }}>{l}</button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, padding: 40, boxSizing: "border-box", overflowY: "auto", background: C.lightGray }}>
        {page === "dashboard" && (
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <div>
                <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, margin: 0 }}>Vos planifications</h2>
                <p style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>{planifs.length} dossier{planifs.length > 1 ? "s" : ""} enregistré{planifs.length > 1 ? "s" : ""}.</p>
              </div>
              <button style={S.btnP} onClick={() => { resetForm(); setPage("create"); }}>+ Nouveau R1</button>
            </div>
            {planifs.length === 0 ? (
              <div style={{ background: C.white, padding: 60, textAlign: "center", border: `1px solid ${C.mediumGray}` }}>
                <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 22, color: C.primary, marginBottom: 8 }}>Aucune planification créée</div>
                <p style={{ color: C.gray, fontSize: 13, marginBottom: 24 }}>Démarrez votre premier dossier R1.</p>
                <button style={S.btnP} onClick={() => { resetForm(); setPage("create"); }}>+ Nouveau R1</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
                {planifs.map(p => {
                  const synth = calcSyntheseRetraite(p.client, p);
                  const gain = calcGainTotal(p);
                  return (
                    <div key={p.id} onClick={() => setPreview(p)} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 24, cursor: "pointer", position: "relative", borderTop: `4px solid ${C.gold}` }}>
                      <div style={{ fontSize: 10, color: C.gray, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Dossier R1</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: C.primary, marginBottom: 4 }}>
                        {p.client.prenom} {(p.client.nom || "").toUpperCase()}
                        {p.isCouple && p.conjoint?.prenom && <span style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}> & {p.conjoint.prenom}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: C.darkGray, marginBottom: 16 }}>{p.client.age} ans · départ à {p.client.objAgeDepart} ans</div>
                      <div style={{ background: C.lightGray, padding: 10, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: C.gray, marginBottom: 2 }}>Revenu rente projeté</div>
                        <div style={{ fontSize: 16, color: C.primary, fontWeight: 800 }}>CHF {fmt(synth.revenuRenteAjusteMensuel)} /mois</div>
                      </div>
                      <div style={{ background: "rgba(165,149,104,0.12)", padding: 10, marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color: C.gold, marginBottom: 2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Gain total estimé</div>
                        <div style={{ fontSize: 16, color: C.primaryDark, fontWeight: 800 }}>CHF {fmt(gain.total)}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={(e) => handleEdit(e, p)} style={{ flex: 1, background: C.white, border: `1px solid ${C.mediumGray}`, color: C.primary, padding: "6px 0", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>ÉDITER</button>
                        <button onClick={(e) => handleDelete(e, p.id)} style={{ flex: 1, background: C.white, border: `1px solid ${C.mediumGray}`, color: C.bad, padding: "6px 0", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>SUPPRIMER</button>
                        <button onClick={(e) => { e.stopPropagation(); setPreview(p); }} style={{ flex: 1, background: C.gold, color: C.white, border: "none", padding: "6px 0", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>APERÇU</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {page === "create" && (
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, margin: "0 0 4px" }}>Collecte R1</h2>
            <p style={{ color: C.gray, fontSize: 13, marginBottom: 24 }}>18 étapes — projections Mr / Mme séparées ou communes, onglet Solutions, comparatif fiscal transfrontalier, arbitrage santé annuel.</p>
            <WizardR1 data={data} setData={setData} appSettings={appSettings} onPreview={() => setPreview(data)} onSave={handleSave} />
          </div>
        )}
      </main>

      {preview && <PreviewR1 data={preview} appSettings={appSettings} onClose={() => setPreview(null)} onEdit={(e) => { handleEdit(e, preview); setPreview(null); }} onDelete={async (e) => { await handleDelete(e, preview.id); setPreview(null); }} />}
    </div>
  );
}