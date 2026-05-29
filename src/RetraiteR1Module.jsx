import React, { useState, useEffect, useMemo } from "react";
import { collection, doc, setDoc, onSnapshot, deleteDoc } from "firebase/firestore";

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

const LOGO_URL = "/logo blanc sans texte.png";

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
const fmt = (n) => Number(n || 0).toLocaleString("fr-CH", { maximumFractionDigits: 0 });
const fmtEUR = (n) => Number(n || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 });

// ============================================================
// SECTION 1 — HELPERS DE PROJECTION (CŒUR DES CALCULS)
// ============================================================

// AVS Suisse — Avec gestion 13e rente 2026, anticipation, ajournement
function calcAVS(person, options = {}) {
  const annees = Number(person.avsAnneesCotisation || 0);
  const renteMaxBase = 2520; // CHF/mois en 2026
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

  // Ajustement anticipation / ajournement (options.scenario peut être 'normal' | 'anticipe' | 'ajourne')
  const scenario = options.scenario || "normal";
  let coefficient = 1;
  let anneesShift = options.anneesShift || 0;
  if (scenario === "anticipe" && anneesShift > 0) {
    coefficient = 1 - 0.068 * anneesShift; // -6.8% par année anticipée
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

// LPP — Capitalisation et taux de conversion
function calcLPP(person, ageDepart = 65) {
  const avoirActuel = Number(person.lppAvoirActuel || 0);
  const cotisationAnnuelle = Number(person.lppCotisationAnnuelle || 0);
  const tauxRendement = Number(person.lppTauxRendement || 1.25) / 100;
  const age = Number(person.age || 40);
  const annees = Math.max(0, ageDepart - age);

  let capitalAge65 = avoirActuel;
  if (tauxRendement > 0) {
    capitalAge65 = avoirActuel * Math.pow(1 + tauxRendement, annees) +
                   cotisationAnnuelle * ((Math.pow(1 + tauxRendement, annees) - 1) / tauxRendement);
  } else {
    capitalAge65 = avoirActuel + cotisationAnnuelle * annees;
  }
  if (person.lppCapitalProjete && Number(person.lppCapitalProjete) > 0) {
    capitalAge65 = Number(person.lppCapitalProjete);
  }
  const librePassage = Number(person.lppLibrePassage || 0);
  const lpProj = librePassage * Math.pow(1 + tauxRendement, annees);
  capitalAge65 += lpProj;
  const tauxConversion = Number(person.lppTauxConversion || 5.0) / 100;
  const renteAnnuelle = capitalAge65 * tauxConversion;
  return {
    capitalAge65: Math.round(capitalAge65),
    renteAnnuelle: Math.round(renteAnnuelle),
    renteMensuelle: Math.round(renteAnnuelle / 12),
    librePassageProj: Math.round(lpProj),
    tauxConversion: tauxConversion * 100,
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
  if (tauxRendement > 0) {
    capital3a = avoir3a * Math.pow(1 + tauxRendement, annees) +
                cotisationAnnuelle * ((Math.pow(1 + tauxRendement, annees) - 1) / tauxRendement);
  } else {
    capital3a = avoir3a + cotisationAnnuelle * annees;
  }
  const avoir3b = Number(person.troisPAvoir3b || 0);
  const capital3b = avoir3b * Math.pow(1 + tauxRendement, annees);
  return {
    capital3a: Math.round(capital3a),
    capital3b: Math.round(capital3b),
    capitalTotal: Math.round(capital3a + capital3b),
  };
}

// Pensions françaises
function calcPensionsFR(person, options = {}) {
  const trimAcquis = Number(person.frTrimestresAcquis || 0);
  const trimRequis = Number(person.frTrimestresRequis || 172);
  const sam = Number(person.frSAM || 0);

  // Scenario: 'taux_plein' attend l'âge taux plein (annule décote), 'tot' part au plus tôt avec décote
  const scenario = options.scenario || "normal";
  let trimRetenus = trimAcquis;
  if (scenario === "taux_plein") {
    trimRetenus = trimRequis; // suppose qu'on attend pour cumuler
  }
  const tauxPlein = trimRetenus >= trimRequis ? 0.50 : 0.50 * (trimRetenus / trimRequis);

  // Décote sur AGIRC-ARRCO si départ anticipé sans taux plein (10% pendant 3 ans)
  let coefAgirc = 1;
  if (scenario === "tot" && trimAcquis < trimRequis) {
    coefAgirc = 0.90;
  }
  let pensionCnavAnnuelle = sam * tauxPlein;
  if (person.frPensionCnavEstimee && Number(person.frPensionCnavEstimee) > 0 && scenario !== "taux_plein") {
    pensionCnavAnnuelle = Number(person.frPensionCnavEstimee) * 12;
  }
  const points = Number(person.frPointsAgircArrco || 0);
  const valeurPoint = 1.4159;
  const pensionAgircAnnuelle = points * valeurPoint * coefAgirc;
  const totalAnnuel = pensionCnavAnnuelle + pensionAgircAnnuelle;
  return {
    pensionCnavAnnuelle: Math.round(pensionCnavAnnuelle),
    pensionCnavMensuelle: Math.round(pensionCnavAnnuelle / 12),
    pensionAgircAnnuelle: Math.round(pensionAgircAnnuelle),
    pensionAgircMensuelle: Math.round(pensionAgircAnnuelle / 12),
    totalAnnuel: Math.round(totalAnnuel),
    totalMensuel: Math.round(totalAnnuel / 12),
    tauxPlein: trimRetenus >= trimRequis,
    scenario,
    coefAgirc,
  };
}

// Synthèse globale d'une personne
function calcSyntheseRetraite(person, hypotheses) {
  const ageDepart = Number(person.objAgeDepart || 65);
  const tauxChange = Number(hypotheses.tauxChangeEurChf || 0.95);
  const avs = calcAVS(person);
  const lpp = calcLPP(person, ageDepart);
  const troisP = calc3eP(person, ageDepart);
  const pensionsFR = calcPensionsFR(person);
  const pensionsFRChfAnnuelle = pensionsFR.totalAnnuel * tauxChange;
  const pensionsFRChfMensuelle = pensionsFR.totalMensuel * tauxChange;
  const revenuRenteAnnuel = avs.renteAnnuelle + lpp.renteAnnuelle + pensionsFRChfAnnuelle;
  const partLPPCapital = Number(person.lppPartCapitalPct || 0) / 100;
  const capitalLPPSorti = lpp.capitalAge65 * partLPPCapital;
  const renteLPPAjustee = lpp.renteAnnuelle * (1 - partLPPCapital);
  const revenuRenteAjuste = avs.renteAnnuelle + renteLPPAjustee + pensionsFRChfAnnuelle;
  const capitalTotal = troisP.capitalTotal + capitalLPPSorti;
  const trainVie = Number(person.objTrainVie || 0);
  const objectifAnnuel = trainVie * 12;
  const ecart = objectifAnnuel - revenuRenteAjuste;
  const ecartPct = objectifAnnuel > 0 ? (ecart / objectifAnnuel) * 100 : 0;
  return {
    ageDepart, avs, lpp, troisP, pensionsFR,
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

// ============================================================
// PHASE 1 — NOUVEAUX HELPERS (différenciants clés)
// ============================================================

// ─── Module 4 : Arbitrage transfrontalier santé / fiscalité ───
// Pour un frontalier qui prend sa retraite en France, 4 stratégies possibles :
//   1) LAMal maintenue (option franco-suisse)
//   2) CMU (sécurité sociale française) + CSG/CRDS/CASA sur pensions
//   3) Hybride : LAMal puis CMU (basculement à un âge donné)
//   4) Refus de la retraite française (reste salarié CH et conserve LAMal)
// Le calcul retourne la matrice de coûts sur la durée résiduelle de vie.
function calcArbitrageSante(person, hypotheses) {
  const ageDepart = Number(person.objAgeDepart || 65);
  const ageFin = Number(person.objAgeFinConsommation || 90);
  const dureeRetraite = Math.max(1, ageFin - ageDepart);
  const tauxChange = Number(hypotheses.tauxChangeEurChf || 0.95);

  // Pensions perçues (CHF/an)
  const avs = calcAVS(person);
  const lpp = calcLPP(person, ageDepart);
  const pensionsFR = calcPensionsFR(person);
  const pensionsFRChf = pensionsFR.totalAnnuel * tauxChange;
  const renteAnnuelleTotale = avs.renteAnnuelle + lpp.renteAnnuelle + pensionsFRChf;

  // Hypothèses santé (annuel CHF par personne)
  const primeLAMal = Number(hypotheses.primeLAMalAnnuelle || 9600); // 800 CHF/mois moyen retraité
  const primeCMU = Number(hypotheses.primeCMUAnnuelle || 0); // CMU = gratuite (cotisation sur revenus si dépassement)
  const tauxCSGCRDSCASA = Number(hypotheses.tauxCSGCRDSCASA || 9.1) / 100; // 9.1% max sur pensions
  const cotisationCMUSubsidiaire = Number(hypotheses.cotisationCMUSubsidiaire || 0);

  // Scénario A : LAMal maintenue tout du long
  const coutLAMal = primeLAMal * dureeRetraite;
  // CSG/CRDS appliquée seulement sur la pension française (LAMal n'exonère pas la pension FR)
  const csgSurPensionFR_LAMal = (pensionsFR.totalAnnuel * tauxChange) * (tauxCSGCRDSCASA * 0.3) * dureeRetraite; // ~30% du taux plein en LAMal
  const totalA = coutLAMal + csgSurPensionFR_LAMal;

  // Scénario B : CMU + CSG/CRDS/CASA sur toutes pensions (FR + suisses)
  const coutCMU = (primeCMU + cotisationCMUSubsidiaire) * dureeRetraite;
  const csgGlobale = renteAnnuelleTotale * tauxCSGCRDSCASA * dureeRetraite;
  const totalB = coutCMU + csgGlobale;

  // Scénario C : Hybride — LAMal jusqu'à 70 ans puis CMU
  const ageBascule = Number(hypotheses.ageBasculeHybride || 70);
  const dureeLAMal = Math.max(0, Math.min(dureeRetraite, ageBascule - ageDepart));
  const dureeCMU = Math.max(0, dureeRetraite - dureeLAMal);
  const coutHybride =
    primeLAMal * dureeLAMal +
    (pensionsFR.totalAnnuel * tauxChange) * (tauxCSGCRDSCASA * 0.3) * dureeLAMal +
    (primeCMU + cotisationCMUSubsidiaire) * dureeCMU +
    renteAnnuelleTotale * tauxCSGCRDSCASA * dureeCMU;
  const totalC = coutHybride;

  // Scénario D : Refus retraite FR (différer indéfiniment, ou la refuser)
  // Pas de CSG/CRDS sur pensions françaises (puisque non liquidée), reste LAMal
  const totalD = coutLAMal; // simplifié : pas de pensions FR → pas de CSG dessus
  // Mais perte des pensions FR pendant la durée
  const perteRevenuD = pensionsFRChf * dureeRetraite;

  const scenarios = [
    { id: "A", label: "LAMal maintenue", cout: totalA, detail: "Prime LAMal + CSG limitée sur pension FR", recommandePour: "Patrimoine élevé, peu de pension FR" },
    { id: "B", label: "CMU + CSG/CRDS", cout: totalB, detail: "CMU gratuite mais 9.1% sur toutes pensions", recommandePour: "Pensions globales faibles" },
    { id: "C", label: "Hybride (LAMal→CMU)", cout: totalC, detail: `Bascule à ${ageBascule} ans`, recommandePour: "Compromis prudent" },
    { id: "D", label: "Refus retraite FR", cout: totalD + perteRevenuD, detail: `Perte ${fmt(perteRevenuD)} CHF de pension`, recommandePour: "Très rares cas" },
  ];

  const meilleur = scenarios.reduce((a, b) => (b.cout < a.cout ? b : a));
  const pire = scenarios.reduce((a, b) => (b.cout > a.cout ? b : a));
  const gainStrategie = pire.cout - meilleur.cout;

  return {
    scenarios,
    meilleur,
    pire,
    gainStrategie: Math.round(gainStrategie),
    dureeRetraite,
    ageDepart,
    ageFin,
    hypotheses: { primeLAMal, primeCMU, tauxCSGCRDSCASA: tauxCSGCRDSCASA * 100, ageBascule },
  };
}

// ─── Module 3 : Double scénario retraite française ───
// Présente côte à côte : départ au plus tôt vs taux plein
function calcDoubleScenarioFR(person, hypotheses) {
  if (!person.frACarriereFrance) return null;

  const ageMinLegal = 64; // depuis réforme 2023
  const ageTauxPlein = Number(person.frAgeTauxPlein || 67);
  const ageFin = Number(person.objAgeFinConsommation || 90);
  const tauxChange = Number(hypotheses.tauxChangeEurChf || 0.95);

  const totScenario = calcPensionsFR(person, { scenario: "tot" });
  const pleinScenario = calcPensionsFR(person, { scenario: "taux_plein" });

  // Cumuls jusqu'à 90 ans (en EUR)
  const cumulTot = totScenario.totalAnnuel * Math.max(0, ageFin - ageMinLegal);
  const cumulPlein = pleinScenario.totalAnnuel * Math.max(0, ageFin - ageTauxPlein);
  const differentielCumule = cumulPlein - cumulTot;

  return {
    tot: {
      ...totScenario,
      ageDepart: ageMinLegal,
      cumulEur: Math.round(cumulTot),
      cumulChf: Math.round(cumulTot * tauxChange),
    },
    plein: {
      ...pleinScenario,
      ageDepart: ageTauxPlein,
      cumulEur: Math.round(cumulPlein),
      cumulChf: Math.round(cumulPlein * tauxChange),
    },
    differentielCumuleEur: Math.round(differentielCumule),
    differentielCumuleChf: Math.round(differentielCumule * tauxChange),
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

  // Impôt forfaitaire sur capital LPP (taux moyen FR/CH variable, on prend ~10% par défaut)
  const tauxImpotCapital = Number(hypotheses.tauxImpotCapitalLPP || 8) / 100;
  // Impôt sur la rente (intégrée au revenu, marginal ~25%)
  const tauxImpotRente = Number(hypotheses.tauxImpotRenteLPP || 25) / 100;

  // Scénario 1 : 100% Rente
  const renteCumulee = renteAnnuellePleine * dureeRetraite;
  const impotsRente = renteCumulee * tauxImpotRente;
  const netRente = renteCumulee - impotsRente;

  // Scénario 2 : 50/50 (50% rente, 50% capital)
  const cap50 = capital * 0.5;
  const rente50Annuelle = (capital * 0.5) * tauxConv;
  const rente50Cumulee = rente50Annuelle * dureeRetraite;
  const impotCap50 = cap50 * tauxImpotCapital;
  const impotRente50 = rente50Cumulee * tauxImpotRente;
  const netMixte = (cap50 - impotCap50) + (rente50Cumulee - impotRente50);

  // Scénario 3 : 100% Capital
  const impotCapTotal = capital * tauxImpotCapital;
  const netCapital = capital - impotCapTotal;

  return {
    capital,
    renteAnnuellePleine: Math.round(renteAnnuellePleine),
    dureeRetraite,
    scenarios: [
      {
        id: "rente",
        label: "100% Rente viagère",
        capitalPercu: 0,
        rentePercue: Math.round(renteAnnuellePleine),
        impots: Math.round(impotsRente),
        netTotal: Math.round(netRente),
        avantages: "Revenu garanti à vie, protection longévité",
        inconvenients: "Imposition annuelle élevée, pas de transmission",
      },
      {
        id: "mixte",
        label: "50% Rente / 50% Capital",
        capitalPercu: Math.round(cap50 - impotCap50),
        rentePercue: Math.round(rente50Annuelle),
        impots: Math.round(impotCap50 + impotRente50),
        netTotal: Math.round(netMixte),
        avantages: "Équilibre sécurité + flexibilité",
        inconvenients: "Compromis sur les deux dimensions",
      },
      {
        id: "capital",
        label: "100% Capital",
        capitalPercu: Math.round(netCapital),
        rentePercue: 0,
        impots: Math.round(impotCapTotal),
        netTotal: Math.round(netCapital),
        avantages: "Liquidité totale, transmissible, fiscalité unique",
        inconvenients: "Risque de longévité, gestion à la charge",
      },
    ],
    hypotheses: { tauxImpotCapital: tauxImpotCapital * 100, tauxImpotRente: tauxImpotRente * 100 },
  };
}

// ─── Chiffrage du GAIN TOTAL du conseil (matérialiser la valeur ajoutée) ───
function calcGainTotal(data) {
  // 1) Gain choix âge AVS — différence entre anticiper et attendre 65 ans
  const avsAnticipe = calcAVS(data.client, { scenario: "anticipe", anneesShift: 2 });
  const avsNormal = calcAVS(data.client);
  const annees65a90 = 25;
  const annees63a90 = 27;
  const cumulAnticipe = avsAnticipe.renteAnnuelle * annees63a90;
  const cumulNormal = avsNormal.renteAnnuelle * annees65a90;
  const gainAgeAVS = Math.max(0, cumulNormal - cumulAnticipe);

  // 2) Gain stratégie maladie
  const arbitrage = calcArbitrageSante(data.client, data);
  const gainStrategieMaladie = arbitrage.gainStrategie;

  // 3) Économies de change (partenaire B-Sharpe ou équivalent vs banque classique)
  const tauxChange = Number(data.tauxChangeEurChf || 0.95);
  const flowAnnuelEur = Number(data.client.revenusFR || 0) +
                        calcPensionsFR(data.client).totalAnnuel;
  const economieChange = flowAnnuelEur * 0.015; // ~1.5% économie sur frais de change
  const economiesChange = Math.round(economieChange * (Number(data.economiesPartenairesAnneesEstimees || 20)));

  // 4) Économies de frais (banque dédiée frontalier vs banque standard)
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

  // Actions immédiates (T+0)
  actions.push({
    annee: anneeActuelle, mois: "Q1",
    action: "Demander le relevé du compte individuel (CI) AVS",
    destinataire: "Caisse cantonale de compensation",
    importance: "haute",
    statut: "à faire",
  });
  actions.push({
    annee: anneeActuelle, mois: "Q1",
    action: "Demander une attestation détaillée de la caisse de pension LPP",
    destinataire: "Institution de prévoyance",
    importance: "haute",
    statut: "à faire",
  });
  if (data.client.frACarriereFrance) {
    actions.push({
      annee: anneeActuelle, mois: "Q1",
      action: "Télécharger le RIS sur info-retraite.fr et le transmettre au conseiller",
      destinataire: "info-retraite.fr (CNAV)",
      importance: "haute",
      statut: "à faire",
    });
  }
  if (Number(data.client.lppPotentielRachat) > 0 && Number(data.client.lppRachats3Ans) === 0) {
    actions.push({
      annee: anneeActuelle, mois: "Q4",
      action: `Étudier rachat LPP (potentiel CHF ${fmt(data.client.lppPotentielRachat)})`,
      destinataire: "Caisse de pension",
      importance: "haute",
      statut: "à faire",
    });
  }
  if (data.client.lppAvoirsOublies) {
    actions.push({
      annee: anneeActuelle, mois: "Q2",
      action: "Recherche d'avoirs LPP oubliés",
      destinataire: "Centrale du 2e pilier + Institution supplétive",
      importance: "moyenne",
      statut: "à faire",
    });
  }

  // Actions à 12 mois avant retraite
  if (anneeDepart > anneeActuelle) {
    actions.push({
      annee: anneeDepart - 1, mois: "Q1",
      action: "Annoncer la sortie LPP à la caisse de pension (préavis 12 mois)",
      destinataire: "Caisse de pension",
      importance: "haute",
      statut: "à faire",
    });
    actions.push({
      annee: anneeDepart - 1, mois: "Q3",
      action: "Déposer la demande de rente AVS (3 mois avant l'âge ordinaire)",
      destinataire: "Caisse de compensation",
      importance: "haute",
      statut: "à faire",
    });
    if (data.client.frACarriereFrance) {
      actions.push({
        annee: anneeDepart - 1, mois: "Q2",
        action: "Liquider les pensions FR via demande unique (info-retraite.fr)",
        destinataire: "CNAV + AGIRC-ARRCO",
        importance: "haute",
        statut: "à faire",
      });
    }
    actions.push({
      annee: anneeDepart - 1, mois: "Q4",
      action: "Décider du basculement LAMal → CMU ou statut quasi-résident",
      destinataire: "Conseiller + fiduciaire",
      importance: "haute",
      statut: "à faire",
    });
  }

  // Actions à 3 mois avant retraite
  if (anneeDepart > anneeActuelle) {
    actions.push({
      annee: anneeDepart, mois: "Q1",
      action: "Décider de l'échelonnement des retraits 3a (sur 2-3 ans pour fractionner l'impôt)",
      destinataire: "Banque(s) 3a",
      importance: "moyenne",
      statut: "à faire",
    });
    actions.push({
      annee: anneeDepart, mois: "Q1",
      action: "Souscrire une assurance accident privée (LAA cesse à la retraite)",
      destinataire: "Assureur privé",
      importance: "moyenne",
      statut: "à faire",
    });
  }

  // Actions de suivi récurrentes
  actions.push({
    annee: anneeDepart + 1, mois: "Q1",
    action: "Réviser le portefeuille en allocation de retraite (4 poches)",
    destinataire: "Conseiller",
    importance: "moyenne",
    statut: "à faire",
  });
  actions.push({
    annee: anneeDepart + 1, mois: "Q4",
    action: "Première déclaration d'impôt en tant que retraité — vérifier convention CH-FR",
    destinataire: "Fiduciaire",
    importance: "haute",
    statut: "à faire",
  });

  // Actions succession
  if (!data.succTestament) {
    actions.push({
      annee: anneeActuelle, mois: "Q2",
      action: "Rédiger ou actualiser le testament avec choix de loi applicable",
      destinataire: "Notaire",
      importance: "moyenne",
      statut: "à faire",
    });
  }

  return actions.sort((a, b) => {
    if (a.annee !== b.annee) return a.annee - b.annee;
    return a.mois.localeCompare(b.mois);
  });
}

// ============================================================
// PHASE 2 — HELPERS DE PROJECTION AVANCÉS
// ============================================================

// ─── Projection annuelle 2026 → 2050 (tableau ligne-à-ligne) ───
function calcProjectionAnnuelle(data) {
  const ageActuel = Number(data.client.age || 50);
  const ageDepart = Number(data.client.objAgeDepart || 65);
  const ageFin = Number(data.client.objAgeFinConsommation || 90);
  const anneeActuelle = new Date().getFullYear();
  const anneeDepart = anneeActuelle + (ageDepart - ageActuel);
  const anneeFin = anneeActuelle + (ageFin - ageActuel);
  const tauxRdt = Number(data.tauxRendement || 1.5) / 100;
  const inflation = Number(data.tauxInflation || 1.5) / 100;
  const tauxChange = Number(data.tauxChangeEurChf || 0.95);

  const synth = calcSyntheseRetraite(data.client, data);
  const lpp = calcLPP(data.client, ageDepart);
  const tp = calc3eP(data.client, ageDepart);
  const trainVieInitial = Number(data.client.objTrainVie || 0) * 12;

  const salaireAnnuel = Number(data.client.revenusNet || 0);
  const epargneAnnuelle = Number(data.client.fluxEpargneMensuel || 0) * 12;
  const chargesActuelles = (Number(data.budCoutVieMensuel || 0) + Number(data.budAssuranceMaladie || 0) + Number(data.budAutresAssurances || 0)) * 12 + Number(data.budChargeFiscale || 0);

  // Patrimoine de départ
  const patFinancierInitial = Number(data.patComptesCourants || 0) + Number(data.patEpargne || 0) + Number(data.patDepotsTitres || 0);
  const patImmoInitial = Number(data.immoResidencePrincipaleValeur || 0) - Number(data.immoResidencePrincipaleHypotheque || 0);

  const rows = [];
  let patLiquide = patFinancierInitial;
  let patImmo = patImmoInitial;
  let capital3a = tp.capital3a;
  let capital3b = tp.capital3b;
  let capitalLPP = lpp.capitalAge65;
  let trainVie = trainVieInitial;

  for (let annee = anneeActuelle; annee <= Math.min(anneeFin, anneeActuelle + 30); annee++) {
    const age = ageActuel + (annee - anneeActuelle);
    const enRetraite = age >= ageDepart;
    let salaires = enRetraite ? 0 : salaireAnnuel;
    let rentes = 0, capitalsLib = 0, charges = chargesActuelles * Math.pow(1 + inflation, annee - anneeActuelle);
    let trainVieAnnee = trainVie * Math.pow(1 + inflation, annee - anneeActuelle);

    if (enRetraite) {
      // Rentes : AVS + LPP (rente partielle) + Pensions FR
      const partRente = 1 - Number(data.client.lppPartCapitalPct || 0) / 100;
      rentes = synth.avs.renteAnnuelle + (lpp.renteAnnuelle * partRente) + synth.pensionsFRChfAnnuelle;
      if (age === ageDepart) {
        // Année de bascule : capital LPP, 3a/3b libérés
        capitalsLib = capitalLPP * Number(data.client.lppPartCapitalPct || 0) / 100 + capital3a + capital3b;
        capitalLPP = capitalLPP * (1 - Number(data.client.lppPartCapitalPct || 0) / 100);
        capital3a = 0; capital3b = 0;
      }
      // Charges retraite : 75% des charges actives
      charges *= 0.75;
    }

    const fluxNet = salaires + rentes - charges - trainVieAnnee + (enRetraite ? 0 : epargneAnnuelle);
    // Le flux d'épargne avant retraite augmente le patrimoine liquide
    patLiquide = patLiquide * (1 + tauxRdt) + fluxNet + capitalsLib;
    patImmo = patImmo * (1 + inflation * 0.5);
    if (!enRetraite) {
      capital3a *= (1 + tauxRdt);
      capital3b *= (1 + tauxRdt);
    }

    rows.push({
      annee, age, enRetraite,
      salaires: Math.round(salaires),
      rentes: Math.round(rentes),
      charges: Math.round(charges),
      trainVie: Math.round(trainVieAnnee),
      epargne: enRetraite ? 0 : epargneAnnuelle,
      capitalsLib: Math.round(capitalsLib),
      patLiquide: Math.round(patLiquide),
      patImmo: Math.round(patImmo),
      patTotal: Math.round(patLiquide + patImmo),
    });
  }
  return rows;
}

// ─── Pré-allocation par horizon de consommation (4 poches) ───
function calcAllocationPoches(data) {
  const tp = calc3eP(data.client, Number(data.client.objAgeDepart || 65));
  const lpp = calcLPP(data.client, Number(data.client.objAgeDepart || 65));
  const liq = Number(data.patComptesCourants || 0) + Number(data.patEpargne || 0);
  const titres = Number(data.patDepotsTitres || 0);
  const partLPPCapital = Number(data.client.lppPartCapitalPct || 0) / 100;
  const capitalLPPSorti = lpp.capitalAge65 * partLPPCapital;

  const capitalDisponible = liq + titres + tp.capitalTotal + capitalLPPSorti;

  // Répartition standard : 15% / 25% / 30% / 30%
  return [
    { id: "court", label: "Court terme", horizon: "0–3 ans", pct: 15, montant: Math.round(capitalDisponible * 0.15), color: C.bad, support: "Liquidités, comptes courants" },
    { id: "moyen", label: "Moyen terme", horizon: "4–8 ans", pct: 25, montant: Math.round(capitalDisponible * 0.25), color: C.warn, support: "Obligations courtes, fonds défensifs" },
    { id: "long", label: "Long terme", horizon: "9–15 ans", pct: 30, montant: Math.round(capitalDisponible * 0.30), color: C.france, support: "Mixte actions/obligations" },
    { id: "trèsLong", label: "Très long terme", horizon: "> 15 ans", pct: 30, montant: Math.round(capitalDisponible * 0.30), color: C.ok, support: "Actions, immobilier, fonds dynamiques" },
  ];
}

// ─── Heatmap train de vie par âge de départ (58 → 70) ───
function calcHeatmapAges(data) {
  const ages = [58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70];
  const tauxChange = Number(data.tauxChangeEurChf || 0.95);
  const ageFin = Number(data.client.objAgeFinConsommation || 90);
  const rows = ages.map((age) => {
    const personne = { ...data.client, objAgeDepart: age };
    const avs = age < 65
      ? calcAVS(personne, { scenario: "anticipe", anneesShift: 65 - age })
      : age > 65
        ? calcAVS(personne, { scenario: "ajourne", anneesShift: Math.min(5, age - 65) })
        : calcAVS(personne);
    const lpp = calcLPP(personne, age);
    const tp = calc3eP(personne, age);
    const pensionsFR = calcPensionsFR(personne).totalAnnuel * tauxChange;
    const dureeRetraite = Math.max(1, ageFin - age);

    // Train de vie en rente : revenu mensuel rente uniquement
    const renteAnnuelle = avs.renteAnnuelle + lpp.renteAnnuelle + pensionsFR;
    const trainDeVieRente = Math.round(renteAnnuelle / 12);

    // Train de vie en capital : ajoute capital étalé sur durée résiduelle
    const capital = tp.capitalTotal + lpp.capitalAge65 * 0.5;
    const trainDeVieCapital = Math.round((renteAnnuelle + capital / dureeRetraite) / 12);

    return { age, trainDeVieRente, trainDeVieCapital, dureeRetraite };
  });
  const maxVal = Math.max(...rows.map(r => Math.max(r.trainDeVieRente, r.trainDeVieCapital)));
  return { rows, maxVal };
}

// ─── Calcul mensuel détaillé du train de vie ───
function calcTrainDeVieMensuel(data) {
  const synth = calcSyntheseRetraite(data.client, data);
  const revenuBrut = synth.revenuRenteMensuel;
  const cotSociales = Math.round(revenuBrut * 0.06); // CSG/CRDS simplifié
  const impotMensuel = Math.round((Number(data.budChargeFiscale || 0) / 12) * 0.6); // 60% de l'impôt actuel à la retraite
  const revenuNet = revenuBrut - cotSociales - impotMensuel;
  const chargesFixes = Number(data.budAssuranceMaladie || 0) + Number(data.budAutresAssurances || 0);
  const trainVieDispo = revenuNet - chargesFixes;
  // Avant 90 ans : on peut consommer capital + train de vie
  const tp = calc3eP(data.client, Number(data.client.objAgeDepart || 65));
  const lpp = calcLPP(data.client, Number(data.client.objAgeDepart || 65));
  const dureeRetraite = Math.max(1, Number(data.client.objAgeFinConsommation || 90) - Number(data.client.objAgeDepart || 65));
  const capitalDisponible = tp.capitalTotal + lpp.capitalAge65 * Number(data.client.lppPartCapitalPct || 0) / 100;
  const consoCapitalMensuel = Math.round(capitalDisponible / dureeRetraite / 12);
  const trainVieAvant90 = trainVieDispo + consoCapitalMensuel;
  const trainVieApres90 = revenuNet - chargesFixes; // rente seule, capital épuisé
  return {
    revenuBrut, cotSociales, impotMensuel, revenuNet, chargesFixes,
    consoCapitalMensuel, trainVieAvant90, trainVieApres90,
    patImmoRestant: Number(data.immoResidencePrincipaleValeur || 0) - Number(data.immoResidencePrincipaleHypotheque || 0),
  };
}

// ─── Cartographie des droits de retraite (tableau Qui/Quoi/Type/Institut) ───
function calcCartographieDroits(data) {
  const ageDepart = Number(data.client.objAgeDepart || 65);
  const avs = calcAVS(data.client);
  const lpp = calcLPP(data.client, ageDepart);
  const tp = calc3eP(data.client, ageDepart);
  const pensionsFR = calcPensionsFR(data.client);
  const tauxChange = Number(data.tauxChangeEurChf || 0.95);

  const lignes = [
    { qui: `${data.client.prenom}`, intitule: "Rente AVS", type: "Rente viagère", institut: data.client.avsCaisse || "Caisse de compensation", montant: `CHF ${fmt(avs.renteMensuelle)} /mois`, ageDebut: 65 },
    { qui: `${data.client.prenom}`, intitule: "Rente LPP", type: "Rente / Capital", institut: data.client.lppCaisse || "Caisse de pension", montant: `CHF ${fmt(lpp.renteMensuelle)} /mois`, ageDebut: ageDepart },
    { qui: `${data.client.prenom}`, intitule: "Capital 3a", type: "Capital", institut: "Banque(s) / Assurance(s) 3a", montant: `CHF ${fmt(tp.capital3a)}`, ageDebut: ageDepart },
  ];
  if (Number(tp.capital3b) > 0) {
    lignes.push({ qui: `${data.client.prenom}`, intitule: "Capital 3b", type: "Capital libre", institut: "Assurance-vie", montant: `CHF ${fmt(tp.capital3b)}`, ageDebut: ageDepart });
  }
  if (data.client.frACarriereFrance) {
    lignes.push({ qui: `${data.client.prenom}`, intitule: "Pension CNAV (base FR)", type: "Rente viagère", institut: data.client.frRegimeBase || "CNAV", montant: `${fmtEUR(pensionsFR.pensionCnavMensuelle)} € /mois`, ageDebut: Number(data.client.frAgeTauxPlein || 67) });
    lignes.push({ qui: `${data.client.prenom}`, intitule: "AGIRC-ARRCO (complémentaire)", type: "Rente viagère", institut: "AGIRC-ARRCO", montant: `${fmtEUR(pensionsFR.pensionAgircMensuelle)} € /mois`, ageDebut: Number(data.client.frAgeTauxPlein || 67) });
  }
  if (data.isCouple && data.conjoint.prenom) {
    const avsC = calcAVS(data.conjoint);
    const lppC = calcLPP(data.conjoint, Number(data.conjoint.objAgeDepart || 65));
    const tpC = calc3eP(data.conjoint, Number(data.conjoint.objAgeDepart || 65));
    if (avsC.renteMensuelle > 0) lignes.push({ qui: data.conjoint.prenom, intitule: "Rente AVS", type: "Rente viagère", institut: data.conjoint.avsCaisse || "Caisse de compensation", montant: `CHF ${fmt(avsC.renteMensuelle)} /mois`, ageDebut: 65 });
    if (lppC.renteMensuelle > 0) lignes.push({ qui: data.conjoint.prenom, intitule: "Rente LPP", type: "Rente / Capital", institut: data.conjoint.lppCaisse || "Caisse de pension", montant: `CHF ${fmt(lppC.renteMensuelle)} /mois`, ageDebut: Number(data.conjoint.objAgeDepart || 65) });
    if (tpC.capitalTotal > 0) lignes.push({ qui: data.conjoint.prenom, intitule: "Capital 3e pilier", type: "Capital", institut: "Banque(s) / Assurance(s)", montant: `CHF ${fmt(tpC.capitalTotal)}`, ageDebut: Number(data.conjoint.objAgeDepart || 65) });
    if (data.conjoint.frACarriereFrance) {
      const pFR = calcPensionsFR(data.conjoint);
      lignes.push({ qui: data.conjoint.prenom, intitule: "Pensions FR cumulées", type: "Rente viagère", institut: "CNAV + AGIRC-ARRCO", montant: `${fmtEUR(pFR.totalMensuel)} € /mois`, ageDebut: Number(data.conjoint.frAgeTauxPlein || 67) });
    }
  }
  return lignes;
}

// ============================================================
// STATE INITIAL — Avec nouveaux champs Phase 1
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
  frSAM: "", frAgeTauxPlein: "",
  frPensionCnavEstimee: "", frPointsAgircArrco: "",
  frAutresRegimes: "", frLacunesARegulariser: "",
  frDecisionRetraiteFR: "Accepter",
  frAssuranceMaladie: "LAMal",
  objAgeDepart: "65", objPriorite: "train_vie",
  objTrainVie: "", objDepartProgressif: false,
  objProjets: "", objPreferenceSortie: "Mixte",
  objAgeFinConsommation: "90", objToleranceRisque: "Équilibré",
});

const stateInitial = () => ({
  templateId: "planification-retraite",
  hiddenSlides: [],
  dateRapport: new Date().toISOString().split('T')[0],
  isCouple: true,

  client: {
    prenom: "Jean", nom: "Dupont", dateNaissance: "15.06.1965", age: "61", nationalite: "Français",
    permisG: true, permisType: "G (Frontalier)",
    statutMatrimonial: "Marié(e)", regimeMatrimonial: "Participation aux acquêts",
    adresse: "12 rue du Lac, 74000 Annecy", domicileFiscal: "France (74)", santeGenerale: "Bonne",
    statutPro: "Cadre", employeur: "Rolex SA", tauxOccupation: "100",
    revenusBrut: "135000", revenusNet: "105000", dateFinActivite: "65",
    autresRevenus: "0", revenusFR: "0", fluxEpargneMensuel: "1500",
    avsNumero: "756.1234.5678.90", avsAnneesCotisation: "35", avsLacunes: "Études en France",
    avsCaisse: "CCGC", avsRenteEstimee: "2150", avsAnticipation: false,
    avsAjournement: false, avs13eRente: true, avsCotisationsArretAnticipe: "0",
    lppCaisse: "Fondation LPP X", lppAvoirActuel: "485000", lppCotisationAnnuelle: "18500",
    lppTauxRendement: "1.5", lppTauxConversion: "5.2",
    lppCapitalProjete: "620000", lppRenteProjete: "2686",
    lppLibrePassage: "45000", lppAvoirsOublies: true,
    lppPotentielRachat: "85000", lppRachats3Ans: "25000", lppEPL: "0", lppMisesEnGage: "",
    lppChoixSortie: "Mixte", lppPartCapitalPct: "50",
    lppTauxCouverture: "108",
    troisPAvoir3a: "115000", troisPCotisationAnnuelle: "7258",
    troisPTauxRendement: "3", troisPNbComptes: "2",
    troisPAvoir3b: "40000", troisPCotisation3b: "2400",
    troisPStrategieEchelonnement: "Retrait espacé sur 2 ans.",
    troisPClausesBeneficiaires: "Conjoint puis enfants.",
    frACarriereFrance: true,
    frRegimeBase: "CNAV (salariés)", frTrimestresAcquis: "62", frTrimestresRequis: "172",
    frSAM: "34000", frAgeTauxPlein: "67",
    frPensionCnavEstimee: "450", frPointsAgircArrco: "1850",
    frAutresRegimes: "", frLacunesARegulariser: "3 trimestres en 1988",
    frDecisionRetraiteFR: "Accepter",
    frAssuranceMaladie: "LAMal",
    objAgeDepart: "65", objPriorite: "train_vie",
    objTrainVie: "9000", objDepartProgressif: true,
    objProjets: "Achat d'un camping-car et voyage en Asie", objPreferenceSortie: "Mixte",
    objAgeFinConsommation: "90", objToleranceRisque: "Équilibré",
  },
  conjoint: {
    prenom: "Marie", nom: "Dupont", dateNaissance: "22.11.1968", age: "58", nationalite: "Française",
    permisG: false, permisType: "Citoyen FR/UE",
    statutMatrimonial: "Marié(e)", regimeMatrimonial: "Participation aux acquêts",
    adresse: "12 rue du Lac, 74000 Annecy", domicileFiscal: "France (74)", santeGenerale: "Bonne",
    statutPro: "Salarié", employeur: "Hôpital local", tauxOccupation: "80",
    revenusBrut: "45000", revenusNet: "35000", dateFinActivite: "2032",
    autresRevenus: "0", revenusFR: "45000", fluxEpargneMensuel: "500",
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
    frACarriereFrance: true,
    frRegimeBase: "CNAV (salariés)", frTrimestresAcquis: "130", frTrimestresRequis: "170",
    frSAM: "28000", frAgeTauxPlein: "67",
    frPensionCnavEstimee: "1100", frPointsAgircArrco: "3200",
    frAutresRegimes: "", frLacunesARegulariser: "",
    frDecisionRetraiteFR: "Accepter",
    frAssuranceMaladie: "LAMal",
    objAgeDepart: "64", objPriorite: "train_vie",
    objTrainVie: "", objDepartProgressif: false,
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
  immoProjets: "Revente de la résidence principale dans 5 ans pour plus petit.",
  immoBiensFrance: "Appartement locatif à Lyon (250k€).",

  patComptesCourants: "45000", patEpargne: "85000", patDepotsTitres: "125000",
  patCredits: "15000", patLeasings: "0", patParticipations: "0",
  patComptesFrance: "Livret A et LDD",

  budCoutVieMensuel: "6500", budAssuranceMaladie: "820",
  budAutresAssurances: "350", budChargeFiscale: "18500",
  budChargesImmo: "12000", budPensionsVersees: "0",

  fiscDerniereTaxation: "2024", fiscImpositionSource: true,
  fiscQuasiResident: true, fiscRevenuImposable: "125000",
  fiscFortuneImposable: "350000", fiscImpotsFrance: "2500",

  risqueCouvertureDeces: "Capital LPP 250k + 3a 115k",
  risqueCouvertureInvalidite: "Rente 54k/an",
  risqueLacunesConjoint: "Baisse de revenu pour Marie (-60%)",
  risqueClausesBeneficiaires: "Standard",
  risqueLAARetraite: "À souscrire",

  succTestament: true, succPacteSuccessoral: false,
  succContratMariage: false, succMandatInaptitude: false,
  succDonations: "30k€ à chaque enfant", succObjectifsTransmission: "Protéger le conjoint en priorité",
  succLoiApplicable: "France",

  tauxRendement: "3", tauxInflation: "1.5",
  tauxChangeEurChf: "0.95", paysResidenceRetraite: "France",
  scenarios: ["Âge cible", "Arrêt anticipé -3 ans", "Rente vs Capital"],

  // ─── NOUVEAUX CHAMPS PHASE 1 ───
  // Arbitrage santé / fiscalité
  primeLAMalAnnuelle: "9600",
  primeCMUAnnuelle: "0",
  cotisationCMUSubsidiaire: "0",
  tauxCSGCRDSCASA: "9.1",
  ageBasculeHybride: "70",
  arbitrageSanteRetenu: "A", // A | B | C | D
  arbitrageSanteCommentaire: "",
  // 3 scénarios LPP
  tauxImpotCapitalLPP: "8",
  tauxImpotRenteLPP: "25",
  // Économies partenaires (gain total)
  economiesFraisAnnuelles: "800",
  economiesPartenairesAnneesEstimees: "20",
  partenairesDescription: "B-Sharpe (change), Banque du Léman (frais), Notaire spécialisé",

  docsRecus: {},
  conseiller: "Alexandre Dupuis", titreConseiller: "Conseiller Financier",
  telephone: "+41 22 555 12 34", email: "a.dupuis@wallswiss.ch",
  notesConseiller: "Client très organisé. Crainte fiscalité sur le capital.",
  pointsAttention: "Attention au rachat LPP de 25k (blocage de 3 ans pour le capital).",
});

// ────────────────────── STYLES PARTAGÉS ──────────────────────
const S = {
  label: { display: "block", fontSize: 11, fontWeight: 600, color: C.gray, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" },
  input: { width: "100%", padding: "10px 12px", border: `1.5px solid ${C.mediumGray}`, fontSize: 13, fontFamily: "'Montserrat', sans-serif", color: C.black, background: C.white, outline: "none", boxSizing: "border-box", borderRadius: "0px" },
  select: { width: "100%", padding: "10px 12px", border: `1.5px solid ${C.mediumGray}`, fontSize: 13, fontFamily: "'Montserrat', sans-serif", color: C.black, background: C.white, outline: "none", cursor: "pointer", boxSizing: "border-box", borderRadius: "0px" },
  fg: { marginBottom: 16 },
  card: { background: C.white, padding: 24, border: `1px solid ${C.mediumGray}`, borderRadius: "0px", marginBottom: 16 },
  cardTitle: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.primary, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 },
  dot: { width: 8, height: 2, background: C.gold, flexShrink: 0 },
  btnP: { background: C.primary, color: C.white, border: "none", padding: "12px 28px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", borderRadius: "0px" },
  btnS: { background: C.white, color: C.primary, border: `2px solid ${C.primary}`, padding: "10px 24px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 600, borderRadius: "0px" },
  sectionBadge: (color) => ({ display: "inline-block", background: color, color: C.white, padding: "4px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }),
};

function Field({ label, value, onChange, type = "text", placeholder = "", select = null, textarea = false, suffix = "", colSpan = 1, step = null }) {
  return (
    <div style={{ ...S.fg, gridColumn: `span ${colSpan}` }}>
      <label style={S.label}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {select ? (
          <select style={S.select} value={value || ""} onChange={(e) => onChange(e.target.value)}>
            {select.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : textarea ? (
          <textarea style={{ ...S.input, minHeight: 70, resize: "vertical" }} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
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
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", cursor: "pointer", borderBottom: `1px solid ${C.lightGray}` }}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 3, accentColor: C.primary, width: 16, height: 16 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: C.darkGray, fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{hint}</div>}
      </div>
    </label>
  );
}

// ============================================================
// PANNEAUX WIZARD (existants)
// ============================================================
function PanneauIdentite({ p, setP, titre, couleur }) {
  return (
    <div style={S.card}>
      <div style={{ ...S.cardTitle, color: couleur }}>
        <div style={{ ...S.dot, background: couleur }} /> {titre}
      </div>
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
      <div style={{ ...S.cardTitle, color: couleur }}>
        <div style={{ ...S.dot, background: couleur }} /> {titre}
      </div>
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
      <div style={{ ...S.cardTitle, color: couleur }}>
        <div style={{ ...S.dot, background: couleur }} /> {titre}
      </div>
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
      <div style={{ ...S.cardTitle, color: couleur }}>
        <div style={{ ...S.dot, background: couleur }} /> {titre} — 1er Pilier AVS
      </div>
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
  return (
    <div style={S.card}>
      <div style={{ ...S.cardTitle, color: couleur }}>
        <div style={{ ...S.dot, background: couleur }} /> {titre} — 2e Pilier LPP
      </div>
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
      <div style={{ ...S.cardTitle, color: couleur }}>
        <div style={{ ...S.dot, background: couleur }} /> {titre} — 3e Pilier
      </div>
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
      <div style={{ ...S.cardTitle, color: couleur }}>
        <div style={{ ...S.dot, background: couleur }} /> {titre} — Volet français
      </div>
      <CheckRow label="A déjà eu une carrière professionnelle en France" checked={p.frACarriereFrance} onChange={(v) => setP({ ...p, frACarriereFrance: v })} />
      {p.frACarriereFrance && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <Field label="Régime de base" value={p.frRegimeBase} onChange={(v) => setP({ ...p, frRegimeBase: v })} select={["CNAV (salariés)", "MSA (agriculteurs)", "SSI (indépendants)", "Régime spécial"]} />
            <Field label="Trimestres acquis" value={p.frTrimestresAcquis} onChange={(v) => setP({ ...p, frTrimestresAcquis: v })} type="number" />
            <Field label="Trimestres requis pour taux plein" value={p.frTrimestresRequis} onChange={(v) => setP({ ...p, frTrimestresRequis: v })} type="number" placeholder="172" />
            <Field label="Âge du taux plein" value={p.frAgeTauxPlein} onChange={(v) => setP({ ...p, frAgeTauxPlein: v })} type="number" suffix="ans" />
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
      <div style={S.cardTitle}><div style={S.dot} /> Fiscalité</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Année de la dernière décision de taxation" value={data.fiscDerniereTaxation} onChange={(v) => u("fiscDerniereTaxation", v)} placeholder="Ex: 2024" />
        <Field label="Revenu imposable CH" value={data.fiscRevenuImposable} onChange={(v) => u("fiscRevenuImposable", v)} type="number" suffix="CHF" />
        <Field label="Fortune imposable CH" value={data.fiscFortuneImposable} onChange={(v) => u("fiscFortuneImposable", v)} type="number" suffix="CHF" />
        <Field label="Impôts français (foncier, IFI)" value={data.fiscImpotsFrance} onChange={(v) => u("fiscImpotsFrance", v)} type="number" suffix="EUR/an" />
      </div>
      <CheckRow label="Imposition à la source en Suisse" checked={data.fiscImpositionSource} onChange={(v) => u("fiscImpositionSource", v)} />
      <CheckRow label="Statut de quasi-résident demandé / acquis" checked={data.fiscQuasiResident} onChange={(v) => u("fiscQuasiResident", v)} hint="Conditions : ≥ 90% des revenus imposables en CH." />
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
      <div style={S.cardTitle}><div style={S.dot} /> Hypothèses de l'étude</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Taux de rendement du patrimoine" value={data.tauxRendement} onChange={(v) => u("tauxRendement", v)} type="number" step="0.5" suffix="% /an" />
        <Field label="Taux d'inflation / indexation" value={data.tauxInflation} onChange={(v) => u("tauxInflation", v)} type="number" step="0.1" suffix="% /an" />
        <Field label="Taux de change EUR / CHF retenu" value={data.tauxChangeEurChf} onChange={(v) => u("tauxChangeEurChf", v)} type="number" step="0.01" suffix="CHF par EUR" />
        <Field label="Pays de résidence prévu à la retraite" value={data.paysResidenceRetraite} onChange={(v) => u("paysResidenceRetraite", v)} select={["Suisse", "France", "Autre UE", "Hors UE"]} />
      </div>
      <Field label="Notes du conseiller" value={data.notesConseiller} onChange={(v) => u("notesConseiller", v)} textarea />
      <Field label="Points d'attention spécifiques pour le R2" value={data.pointsAttention} onChange={(v) => u("pointsAttention", v)} textarea />
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

// ============================================================
// PANNEAUX WIZARD — PHASE 1 (nouveaux)
// ============================================================

function PanneauArbitrageSante({ data, setData }) {
  const u = (k, v) => setData({ ...data, [k]: v });
  const arbitrage = useMemo(() => calcArbitrageSante(data.client, data), [data]);
  return (
    <div style={S.card}>
      <div style={S.cardTitle}>
        <div style={S.dot} /> Arbitrage transfrontalier santé / fiscalité
      </div>
      <p style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.6, marginTop: 0 }}>
        Pour un frontalier qui prend sa retraite en France, le choix du système maladie est <strong>l'un des plus impactants</strong> de la planification. Cette section calcule le coût total sur la durée de retraite des 4 stratégies possibles.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Prime LAMal annuelle (à la retraite)" value={data.primeLAMalAnnuelle} onChange={(v) => u("primeLAMalAnnuelle", v)} type="number" suffix="CHF/an" />
        <Field label="Cotisation CMU subsidiaire" value={data.cotisationCMUSubsidiaire} onChange={(v) => u("cotisationCMUSubsidiaire", v)} type="number" suffix="EUR/an" />
        <Field label="Taux CSG/CRDS/CASA" value={data.tauxCSGCRDSCASA} onChange={(v) => u("tauxCSGCRDSCASA", v)} type="number" step="0.1" suffix="%" />
        <Field label="Âge de bascule LAMal→CMU (scénario hybride)" value={data.ageBasculeHybride} onChange={(v) => u("ageBasculeHybride", v)} type="number" suffix="ans" />
        <Field label="Stratégie retenue" value={data.arbitrageSanteRetenu} onChange={(v) => u("arbitrageSanteRetenu", v)} select={["A", "B", "C", "D"]} />
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: C.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Matrice des scénarios (sur {arbitrage.dureeRetraite} ans)</div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, fontSize: 12 }}>
        <thead>
          <tr style={{ background: C.primary, color: C.white }}>
            <th style={{ padding: "8px 10px", textAlign: "left" }}>Scénario</th>
            <th style={{ padding: "8px 10px", textAlign: "left" }}>Description</th>
            <th style={{ padding: "8px 10px", textAlign: "right" }}>Coût total</th>
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
                <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: isMeilleur ? C.ok : C.darkGray }}>CHF {fmt(s.cout)}</td>
                <td style={{ padding: "8px 10px", textAlign: "center" }}>
                  <input type="radio" name="arbitrageSante" checked={data.arbitrageSanteRetenu === s.id} onChange={() => u("arbitrageSanteRetenu", s.id)} style={{ accentColor: C.primary }} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop: 12, background: "rgba(16,185,129,0.08)", padding: 12, borderLeft: `4px solid ${C.ok}`, fontSize: 12, color: C.darkGray }}>
        <strong style={{ color: C.ok }}>Recommandation :</strong> Scénario <strong>{arbitrage.meilleur.label}</strong>. Gain par rapport au pire scénario : <strong>CHF {fmt(arbitrage.gainStrategie)}</strong>.
      </div>
      <Field label="Commentaire / réserve sur le choix retenu" value={data.arbitrageSanteCommentaire} onChange={(v) => u("arbitrageSanteCommentaire", v)} textarea placeholder="Ex: stratégie à valider par fiduciaire, rattrapages de cotisations à prévoir…" />
    </div>
  );
}

function PanneauEconomiesPartenaires({ data, setData }) {
  const u = (k, v) => setData({ ...data, [k]: v });
  const gain = useMemo(() => calcGainTotal(data), [data]);
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Économies via partenaires & gain total du conseil</div>
      <p style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.6, marginTop: 0 }}>
        Le chiffrage du <strong>gain total</strong> matérialise la valeur de votre conseil en euros : meilleur choix AVS, meilleure stratégie santé, économies de change et de frais bancaires (via partenaires recommandés).
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Économies frais bancaires annuelles" value={data.economiesFraisAnnuelles} onChange={(v) => u("economiesFraisAnnuelles", v)} type="number" suffix="CHF/an" />
        <Field label="Durée d'estimation des économies" value={data.economiesPartenairesAnneesEstimees} onChange={(v) => u("economiesPartenairesAnneesEstimees", v)} type="number" suffix="ans" />
      </div>
      <Field label="Partenaires recommandés" value={data.partenairesDescription} onChange={(v) => u("partenairesDescription", v)} textarea placeholder="Ex: B-Sharpe (change), Banque du Léman (frais)…" />

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
        Capital LPP projeté : <strong>CHF {fmt(scenarios.capital)}</strong>. Comparaison des 3 stratégies de sortie sur {scenarios.dureeRetraite} ans de retraite.
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
              <div style={{ marginTop: 6, fontSize: 10, color: C.gray }}><strong>+</strong> {sc.avantages}</div>
              <div style={{ fontSize: 10, color: C.gray }}><strong>−</strong> {sc.inconvenients}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// WIZARD R1 — Avec nouveaux steps Phase 1
// ============================================================
function WizardR1({ data, setData, appSettings, onPreview, onSave }) {
  const [step, setStep] = useState(0);
  const setClient = (p) => setData({ ...data, client: p });
  const setConjoint = (p) => setData({ ...data, conjoint: p });

  const labels = [
    "Démarrage", "Identité", "Objectifs", "Professionnel",
    "AVS", "LPP", "3e P", "Scénarios LPP",
    "Immo + Pat.", "Budget", "Volet FR", "Arbitrage Santé",
    "Fiscalité", "Risques + Succ.", "Hypothèses", "Plan actions + Gain",
    "Aperçu"
  ];

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div style={S.card}>
            <div style={S.cardTitle}><div style={S.dot} /> Démarrage du R1</div>
            <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.6, marginTop: 0 }}>
              Check-list <strong>WallSwiss R1 — Frontaliers / franco-suisses</strong>. 17 sections, dont les <strong>4 modules différenciants</strong> : matrice santé/fiscalité, double scénario FR, 3 scénarios LPP, chiffrage du gain total.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Date du rendez-vous" value={data.dateRapport} onChange={(v) => setData({ ...data, dateRapport: v })} type="date" />
            </div>
            <CheckRow label="Couple" checked={data.isCouple} onChange={(v) => setData({ ...data, isCouple: v })} />
            <div style={{ background: C.lightGray, padding: 16, marginTop: 16, borderLeft: `4px solid ${C.gold}`, fontSize: 12, color: C.darkGray, lineHeight: 1.6 }}>
              <strong>Confidentialité.</strong> Données utilisées uniquement pour la planification, conservées selon LPD/RGPD, hébergées chez Google Firestore (région européenne).
            </div>
          </div>
        );
      case 1:
        return (<>
          <PanneauIdentite p={data.client} setP={setClient} titre="Client principal" couleur={C.primary} />
          {data.isCouple && <PanneauIdentite p={data.conjoint} setP={setConjoint} titre="Conjoint(e)" couleur={C.gold} />}
          <PanneauEnfants enfants={data.enfants} setEnfants={(e) => setData({ ...data, enfants: e })} />
        </>);
      case 2:
        return (<>
          <PanneauObjectifs p={data.client} setP={setClient} titre="Objectifs — Client" couleur={C.primary} />
          {data.isCouple && <PanneauObjectifs p={data.conjoint} setP={setConjoint} titre="Objectifs — Conjoint(e)" couleur={C.gold} />}
        </>);
      case 3:
        return (<>
          <PanneauPro p={data.client} setP={setClient} titre="Pro — Client" couleur={C.primary} />
          {data.isCouple && <PanneauPro p={data.conjoint} setP={setConjoint} titre="Pro — Conjoint(e)" couleur={C.gold} />}
        </>);
      case 4:
        return (<>
          <PanneauAVS p={data.client} setP={setClient} titre="Client" couleur={C.primary} />
          {data.isCouple && <PanneauAVS p={data.conjoint} setP={setConjoint} titre="Conjoint(e)" couleur={C.gold} />}
        </>);
      case 5:
        return (<>
          <PanneauLPP p={data.client} setP={setClient} titre="Client" couleur={C.primary} />
          {data.isCouple && <PanneauLPP p={data.conjoint} setP={setConjoint} titre="Conjoint(e)" couleur={C.gold} />}
        </>);
      case 6:
        return (<>
          <Panneau3eP p={data.client} setP={setClient} titre="Client" couleur={C.primary} />
          {data.isCouple && <Panneau3eP p={data.conjoint} setP={setConjoint} titre="Conjoint(e)" couleur={C.gold} />}
        </>);
      case 7:
        return <PanneauScenariosLPP data={data} setData={setData} />;
      case 8:
        return (<>
          <PanneauImmobilier data={data} setData={setData} />
          <PanneauPatFinancier data={data} setData={setData} />
        </>);
      case 9:
        return <PanneauBudget data={data} setData={setData} />;
      case 10:
        return (<>
          <PanneauFR p={data.client} setP={setClient} titre="Client" couleur={C.france} />
          {data.isCouple && <PanneauFR p={data.conjoint} setP={setConjoint} titre="Conjoint(e)" couleur={C.france} />}
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
        return (<>
          <PanneauHypotheses data={data} setData={setData} />
          <PanneauConseiller data={data} setData={setData} appSettings={appSettings} />
        </>);
      case 15:
        return (<>
          <PanneauEconomiesPartenaires data={data} setData={setData} />
          <PanneauPlanActions data={data} />
        </>);
      case 16:
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
  const gain = useMemo(() => calcGainTotal(data), [data]);
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Synthèse rapide avant génération</div>
      <div style={{ display: "grid", gridTemplateColumns: data.isCouple ? "1fr 1fr" : "1fr", gap: 16, marginBottom: 16 }}>
        <CarteSynthese titre={`${data.client.prenom} ${data.client.nom}`.trim() || "Client"} synth={synthClient} couleur={C.primary} />
        {data.isCouple && <CarteSynthese titre={`${data.conjoint.prenom} ${data.conjoint.nom}`.trim() || "Conjoint(e)"} synth={synthConjoint} couleur={C.gold} />}
      </div>
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
        <div style={{ color: C.gray }}>AVS / mois</div><div style={{ fontWeight: 700, textAlign: "right" }}>CHF {fmt(synth.avs.renteMensuelle)}</div>
        <div style={{ color: C.gray }}>LPP rente / mois</div><div style={{ fontWeight: 700, textAlign: "right" }}>CHF {fmt(synth.lpp.renteMensuelle)}</div>
        <div style={{ color: C.gray }}>Pensions FR / mois</div><div style={{ fontWeight: 700, textAlign: "right" }}>CHF {fmt(synth.pensionsFRChfMensuelle)}</div>
        <div style={{ color: C.gray }}>3e P. (capital)</div><div style={{ fontWeight: 700, textAlign: "right" }}>CHF {fmt(synth.troisP.capitalTotal)}</div>
      </div>
      <div style={{ height: 1, background: C.lightGray, margin: "12px 0" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
        <div style={{ color: C.primary, fontWeight: 600 }}>Revenu rente / mois</div><div style={{ fontWeight: 800, textAlign: "right", color: C.primary }}>CHF {fmt(synth.revenuRenteAjusteMensuel)}</div>
        <div style={{ color: C.gray }}>Objectif</div><div style={{ fontWeight: 700, textAlign: "right" }}>CHF {fmt(synth.objectifMensuel)}</div>
        <div style={{ color: ecartColor, fontWeight: 600 }}>Écart</div><div style={{ fontWeight: 800, textAlign: "right", color: ecartColor }}>{synth.ecart > 0 ? "-" : "+"} CHF {fmt(Math.abs(synth.ecartMensuel))} / mois</div>
      </div>
    </div>
  );
}

function PanneauPlanActions({ data }) {
  const actions = useMemo(() => generatePlanActions(data), [data]);
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Plan d'actions calendaire (généré automatiquement)</div>
      <p style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.6, marginTop: 0 }}>
        Ce plan est dérivé des données saisies : démarches AVS, LPP, retraite FR, succession… avec destinataire et priorité.
      </p>
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
                <td style={{ padding: "8px 10px", color: C.darkGray, fontWeight: 600 }}>{a.annee} · {a.mois}</td>
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
// SLIDES PDF — Format A4 portrait (794 × 1123 px)
// ============================================================
const PAGE_W = 794;
const PAGE_H = 1123;

const pageBase = {
  width: `${PAGE_W}px`, height: `${PAGE_H}px`, position: "relative",
  overflow: "hidden", fontFamily: "'Montserrat', sans-serif",
  background: C.white, textAlign: "left", boxSizing: "border-box",
};

function PageHeader({ data, num, titreSection }) {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 60, background: C.white, borderBottom: `1px solid ${C.mediumGray}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", zIndex: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ background: C.primary, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={LOGO_URL} alt="WS" className="pdf-image" style={{ width: 18, height: 18, objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: C.gold, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>Planification retraite</div>
          <div style={{ fontSize: 11, color: C.primary, fontWeight: 700 }}>{titreSection}</div>
        </div>
      </div>
      <div style={{ fontSize: 10, color: C.gray, fontWeight: 600 }}>{num}</div>
    </div>
  );
}

function PageFooter({ data }) {
  const fullName = data.isCouple && data.conjoint.prenom
    ? `${data.client.prenom} ${(data.client.nom || "").toUpperCase()} & ${data.conjoint.prenom} ${(data.conjoint.nom || "").toUpperCase()}`
    : `${data.client.prenom} ${(data.client.nom || "").toUpperCase()}`;
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 32, background: C.primary, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", zIndex: 10 }}>
      <span style={{ color: C.white, fontSize: 9, fontWeight: 600, letterSpacing: "0.08em" }}>PLANIFICATION RETRAITE — {fullName}</span>
      <span style={{ color: C.gold, fontSize: 9, fontWeight: 600 }}>WallSwiss · Confidentiel</span>
    </div>
  );
}

function SlideCouverture({ data }) {
  const fullName = data.isCouple && data.conjoint.prenom
    ? `${data.client.prenom} ${(data.client.nom || "").toUpperCase()} & ${data.conjoint.prenom} ${(data.conjoint.nom || "").toUpperCase()}`
    : `${data.client.prenom} ${(data.client.nom || "").toUpperCase()}`;
  const dateStr = data.dateRapport ? new Date(data.dateRapport).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : "";
  return (
    <div style={{ ...pageBase, background: `linear-gradient(180deg, ${C.primary} 0%, ${C.primaryDark} 100%)` }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 8, background: C.gold }} />
      <div style={{ padding: "80px 60px 40px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box" }}>
        <div>
          <div style={{ background: C.white, width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 60 }}>
            <img src={LOGO_URL} alt="WallSwiss" className="pdf-image" style={{ width: 44, height: 44, objectFit: "contain", filter: "invert(1) sepia(1) saturate(5) hue-rotate(345deg) brightness(0.5)" }} />
          </div>
          <div style={{ color: C.gold, fontSize: 12, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 20 }}>Étude personnalisée</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", color: C.white, fontSize: 56, fontWeight: 700, lineHeight: 1.05, marginBottom: 16 }}>
            Planification<br/><em style={{ color: C.gold, fontStyle: "italic" }}>de votre retraite</em>
          </div>
          <div style={{ width: 60, height: 4, background: C.gold, marginTop: 32, marginBottom: 32 }} />
          <div style={{ color: C.white, fontSize: 16, fontWeight: 300, lineHeight: 1.6, opacity: 0.9, maxWidth: 480 }}>
            Une étude croisée Suisse / France pour bâtir votre stratégie de revenu à la retraite, en cohérence avec votre situation de frontalier(ère) ou franco-suisse.
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

function SlideSommaire({ data }) {
  const parts = [
    {
      titre: "Partie 1 — Diagnostic & droits",
      sections: [
        { num: "1.1", titre: "Profil & objectifs" },
        { num: "1.2", titre: "Cartographie de vos droits à la retraite" },
        { num: "1.3", titre: "Vue d'ensemble — Revenu projeté" },
        { num: "1.4", titre: "Temple des revenus retraite" },
      ]
    },
    {
      titre: "Partie 2 — Prévoyance suisse",
      sections: [
        { num: "2.1", titre: "1er pilier — AVS (anticipation / ajournement)" },
        { num: "2.2", titre: "2e pilier — LPP (capitalisation)" },
        { num: "2.3", titre: "3e pilier — 3a + 3b" },
        { num: "2.4", titre: "3 scénarios de sortie LPP" },
      ]
    },
    {
      titre: "Partie 3 — Volet français & arbitrage",
      sections: [
        { num: "3.1", titre: "Pensions FR — Tôt vs Taux plein" },
        { num: "3.2", titre: "Arbitrage santé / fiscalité (LAMal/CMU/CSG)" },
        ...(data.isCouple && data.conjoint?.prenom ? [{ num: "3.3", titre: `Vue complète conjoint — ${data.conjoint.prenom}` }] : [])
      ]
    },
    {
      titre: "Partie 4 — Projection patrimoniale",
      sections: [
        { num: "4.1", titre: "Patrimoine global aujourd'hui" },
        { num: "4.2", titre: "Pré-allocation par horizon (4 poches)" },
        { num: "4.3", titre: "Projection annuelle 2026 → 2050" },
        { num: "4.4", titre: "Évolution graphique du patrimoine" },
        { num: "4.5", titre: "Heatmap — Train de vie par âge de départ" },
        { num: "4.6", titre: "Calcul mensuel du train de vie" },
      ]
    },
    {
      titre: "Partie 5 — Stratégie & exécution",
      sections: [
        { num: "5.1", titre: "Leviers d'optimisation" },
        { num: "5.2", titre: "Fiche sortie en capital" },
        { num: "5.3", titre: "Plan d'actions calendaire" },
        { num: "5.4", titre: "Gain total du conseil" },
      ]
    },
    {
      titre: "Partie 6 — Annexes",
      sections: [
        { num: "6.1", titre: "Hypothèses retenues" },
        { num: "6.2", titre: "Documents à fournir pour le R2" },
        { num: "6.3", titre: "Espace notes" },
        { num: "6.4", titre: "Avertissement légal" },
        { num: "6.5", titre: "Contact & prochaines étapes" },
      ]
    },
  ];
  return (
    <div style={pageBase}>
      <PageHeader data={data} num="" titreSection="Sommaire" />
      <div style={{ padding: "90px 50px 50px", height: "100%", boxSizing: "border-box", overflow: "hidden" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 4 }}>Table des matières</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700 }}>Sommaire <em style={{ color: C.gold }}>du rapport</em></div>
        </div>
        {parts.map((part, pi) => (
          <div key={pi} style={{ marginBottom: 10 }}>
            <div style={{ background: C.primary, color: C.white, padding: "5px 10px", fontSize: 10, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>{part.titre}</div>
            {part.sections.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", padding: "4px 10px", borderBottom: `1px solid ${C.lightGray}`, fontSize: 11 }}>
                <div style={{ width: 30, color: C.gold, fontWeight: 800, fontSize: 10 }}>{s.num}</div>
                <div style={{ flex: 1, color: C.darkGray, fontWeight: 500 }}>{s.titre}</div>
              </div>
            ))}
          </div>
        ))}
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
      </div>
    </div>
  );
}

function SlideProfil({ data, num }) {
  const c = data.client;
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Profil & Objectifs" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 32 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 1</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Votre <em style={{ color: C.gold }}>profil</em> et vos <em style={{ color: C.gold }}>objectifs</em></div>
        </div>
        <p style={{ fontSize: 11, color: C.darkGray, lineHeight: 1.55, marginBottom: 14, textAlign: "justify" }}>
          Cette synthèse rappelle votre situation personnelle, professionnelle et vos priorités de retraite. Le <strong>train de vie cible</strong> est défini comme votre <em>revenu mensuel net</em> après impôts, charges fixes (assurance maladie, logement, énergie) et remboursements de crédits — c'est <strong>le montant réellement disponible</strong> pour vos dépenses libres, voyages, loisirs et projets. Vos objectifs guident l'ensemble du plan : un train de vie cible élevé pousse vers des leviers d'épargne et de rendement, un âge de départ fixe contraint le calendrier. Lorsque les deux ne sont pas compatibles, nous mettons en évidence l'arbitrage à effectuer.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: data.isCouple ? "1fr 1fr" : "1fr", gap: 16, marginBottom: 24 }}>
          <CarteProfil p={c} couleur={C.primary} />
          {data.isCouple && <CarteProfil p={data.conjoint} couleur={C.gold} />}
        </div>
        <div style={{ background: C.lightGray, padding: 24, borderLeft: `4px solid ${C.primary}` }}>
          <div style={{ fontSize: 11, color: C.primary, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Votre vision de la retraite</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 12 }}>
            <div>
              <div style={{ color: C.gray, marginBottom: 4 }}>Âge de départ visé</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.primaryDark }}>{c.objAgeDepart || "—"} ans</div>
            </div>
            <div>
              <div style={{ color: C.gray, marginBottom: 4 }}>Train de vie cible</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.primaryDark }}>CHF {fmt(c.objTrainVie)}<span style={{ fontSize: 11, color: C.gray, fontWeight: 500 }}> /mois</span></div>
            </div>
            <div>
              <div style={{ color: C.gray, marginBottom: 4 }}>Priorité affichée</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.primaryDark }}>{c.objPriorite === "age_fixe" ? "Âge fixe de départ" : "Maintien du train de vie"}</div>
            </div>
            <div>
              <div style={{ color: C.gray, marginBottom: 4 }}>Préférence rente / capital</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.primaryDark }}>{c.objPreferenceSortie}</div>
            </div>
          </div>
          {c.objProjets && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.mediumGray}`, fontSize: 12, color: C.darkGray, lineHeight: 1.6 }}>
              <strong style={{ color: C.primary }}>Projets :</strong> {c.objProjets}
            </div>
          )}
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

function Bar({ label, value, max, color, isCapital = false }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: C.darkGray, fontWeight: 600 }}>{label}</span>
        <span style={{ color: color, fontWeight: 800 }}>CHF {fmt(value)}{isCapital ? "" : " /an"}</span>
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
      <svg viewBox="0 0 48 48" style={{ width: 180, height: 180, transform: "rotate(-90deg)" }}>
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
  const totalRevenu = synthClient.revenuRenteAjuste || 1;
  const partAvs = (synthClient.avs.renteAnnuelle / totalRevenu) * 100;
  const partLpp = (synthClient.lpp.renteAnnuelle * (1 - Number(data.client.lppPartCapitalPct || 0) / 100) / totalRevenu) * 100;
  const partFr = (synthClient.pensionsFRChfAnnuelle / totalRevenu) * 100;

  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Vue d'ensemble" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 2</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Votre <em style={{ color: C.gold }}>retraite</em> en un coup d'œil</div>
        </div>
        <p style={{ fontSize: 11, color: C.darkGray, lineHeight: 1.55, marginBottom: 14, textAlign: "justify" }}>
          Cette page consolide en une vue unique l'<strong>ensemble de vos revenus de retraite projetés</strong> à l'âge de départ choisi. Les rentes (AVS, LPP, pensions FR) constituent la base récurrente, tandis que le 3e pilier représente un <em>capital disponible</em> à consommer ou transmettre. La barre de progression visualise votre taux de couverture de l'objectif. Toute zone rouge indique un <strong>écart à combler</strong> via les leviers présentés en section 5 (rachat LPP, maximisation du 3a, ajustement de l'âge de départ, optimisation du choix rente/capital).
        </p>
        <div style={{ background: C.primary, color: C.white, padding: 22, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Revenu mensuel projeté à {synthClient.ageDepart} ans</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, justifyContent: "space-between" }}>
            <div style={{ fontSize: 38, fontWeight: 900 }}>CHF {fmt(synthClient.revenuRenteAjusteMensuel)}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Objectif fixé : <strong>CHF {fmt(synthClient.objectifMensuel)}</strong> /mois</div>
          </div>
          <div style={{ marginTop: 12, height: 8, background: "rgba(255,255,255,0.2)", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${Math.min(100, (synthClient.revenuRenteAjusteMensuel / Math.max(1, synthClient.objectifMensuel)) * 100)}%`, background: C.gold }} />
          </div>
        </div>
        {synthClient.ecart > 0 && (
          <div style={{ background: "#FEF3F2", borderLeft: `4px solid ${C.bad}`, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <Icons.Alert size={20} color={C.bad} />
            <div style={{ fontSize: 12, color: "#991B1B" }}>
              <strong>Écart constaté :</strong> il manque <strong>CHF {fmt(Math.abs(synthClient.ecartMensuel))} / mois</strong> ({synthClient.ecartPct}%) pour atteindre votre objectif.
            </div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: C.gray, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Décomposition annuelle</div>
            <Bar label="1er pilier — AVS" value={synthClient.avs.renteAnnuelle} max={synthClient.revenuRenteAjuste || 1} color={C.swiss} />
            <Bar label="2e pilier — LPP (rente)" value={synthClient.lpp.renteAnnuelle * (1 - Number(data.client.lppPartCapitalPct || 0) / 100)} max={synthClient.revenuRenteAjuste || 1} color={C.primary} />
            <Bar label="3e pilier (capital)" value={synthClient.troisP.capitalTotal} max={Math.max(synthClient.troisP.capitalTotal, synthClient.revenuRenteAjuste, 1)} color={C.gold} isCapital />
            <Bar label="Pensions françaises (CHF)" value={synthClient.pensionsFRChfAnnuelle} max={synthClient.revenuRenteAjuste || 1} color={C.france} />
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
          <div style={{ marginTop: 24, padding: 16, background: C.lightGray, borderLeft: `4px solid ${C.gold}` }}>
            <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Conjoint(e) — {data.conjoint.prenom}</div>
            <div style={{ fontSize: 13, color: C.darkGray }}>
              Revenu rente projeté : <strong>CHF {fmt(synthConjoint.revenuRenteAjusteMensuel)} / mois</strong> à {synthConjoint.ageDepart} ans · Capital 3e P. : <strong>CHF {fmt(synthConjoint.troisP.capitalTotal)}</strong>
            </div>
          </div>
        )}
      </div>
      <PageFooter data={data} />
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

function SlideAVS({ data, num }) {
  const avsC = calcAVS(data.client);
  const avsAnticipe = calcAVS(data.client, { scenario: "anticipe", anneesShift: 2 });
  const avsAjourne = calcAVS(data.client, { scenario: "ajourne", anneesShift: 2 });
  const annees = Math.max(1, 90 - Number(data.client.objAgeDepart || 65));
  const cumulNormal = avsC.renteAnnuelle * annees;
  const cumulAnticipe = avsAnticipe.renteAnnuelle * (annees + 2);
  const cumulAjourne = avsAjourne.renteAnnuelle * Math.max(1, annees - 2);

  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="1er Pilier — AVS" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.swiss}`, paddingLeft: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.swiss, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Volet Suisse · Section 3</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Le <em style={{ color: C.swiss }}>1er pilier</em> — AVS</div>
        </div>
        <p style={{ fontSize: 11, color: C.darkGray, lineHeight: 1.6, marginBottom: 16, textAlign: "justify" }}>
          L'AVS couvre les besoins vitaux. Une carrière complète exige <strong>44 années de cotisation</strong>. La rente maximale 2026 ≈ <strong>CHF 2'520/mois</strong>, la minimale ≈ <strong>CHF 1'260/mois</strong>. <strong>13e rente AVS</strong> versée dès décembre 2026 (réforme AVS21).
        </p>

        {/* Comparatif Anticipation / Normal / Ajournement */}
        <div style={{ marginBottom: 16, fontSize: 11, color: C.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Comparatif des 3 options — cumul jusqu'à 90 ans</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { titre: "Anticipée (-2 ans)", rente: avsAnticipe.renteMensuelle, cumul: cumulAnticipe, color: C.warn },
            { titre: "Normale (65 ans)", rente: avsC.renteMensuelle, cumul: cumulNormal, color: C.swiss },
            { titre: "Ajournée (+2 ans)", rente: avsAjourne.renteMensuelle, cumul: cumulAjourne, color: C.ok },
          ].map((s, i) => (
            <div key={i} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${s.color}`, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: s.color, marginBottom: 6 }}>{s.titre}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.primaryDark }}>CHF {fmt(s.rente)}<span style={{ fontSize: 9, color: C.gray, fontWeight: 500 }}> /mois</span></div>
              <div style={{ fontSize: 10, color: C.gray, marginTop: 4 }}>Cumul : <strong>CHF {fmt(s.cumul)}</strong></div>
            </div>
          ))}
        </div>

        {/* Détail du calcul AVS — Décomposition étape par étape */}
        {(() => {
          const anneesCot = Number(data.client.avsAnneesCotisation || 0);
          const echelle = Math.min(44, anneesCot);
          const tauxCompletion = (echelle / 44 * 100).toFixed(1);
          const revenuBrut = Number(data.client.revenusBrut || 0);
          const ramApprox = revenuBrut; // approximation : revenu actuel ≈ RAM
          const renteMin = 1260, renteMax = 2520, seuilSup = 88200;
          // Formule simplifiée : rente échelle 44 selon RAM
          let renteEch44;
          if (ramApprox >= seuilSup) renteEch44 = renteMax;
          else if (ramApprox <= 15120) renteEch44 = renteMin;
          else renteEch44 = renteMin + (renteMax - renteMin) * ((ramApprox - 15120) / (seuilSup - 15120));
          const renteEchClient = renteEch44 * (echelle / 44);
          const renteCalculee = avsC.renteMensuelle;
          const treize = avsC.treizieme;
          const totalAnnuel = avsC.renteAnnuelle;
          return (
            <>
              <div style={{ marginBottom: 10, fontSize: 11, color: C.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Décomposition du calcul AVS — {data.client.prenom}
              </div>
              <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 14, marginBottom: 10 }}>
                <table style={{ width: "100%", fontSize: 10.5, borderCollapse: "collapse" }}>
                  <tbody>
                    <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}>
                      <td style={{ padding: "6px 8px", color: C.gray, width: 28 }}><strong style={{ color: C.swiss }}>1.</strong></td>
                      <td style={{ padding: "6px 8px", color: C.darkGray }}>Années de cotisation</td>
                      <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: C.primary }}>{anneesCot} / 44 ans</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}>
                      <td style={{ padding: "6px 8px", color: C.gray }}><strong style={{ color: C.swiss }}>2.</strong></td>
                      <td style={{ padding: "6px 8px", color: C.darkGray }}>Échelle applicable <span style={{ color: C.gray, fontSize: 9 }}>(échelle 44 = rente pleine)</span></td>
                      <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: C.primary }}>Échelle {echelle} <span style={{ color: C.gray, fontWeight: 500 }}>({tauxCompletion}%)</span></td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}>
                      <td style={{ padding: "6px 8px", color: C.gray }}><strong style={{ color: C.swiss }}>3.</strong></td>
                      <td style={{ padding: "6px 8px", color: C.darkGray }}>Revenu annuel moyen déterminant (RAM) <span style={{ color: C.gray, fontSize: 9 }}>(estim.)</span></td>
                      <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: C.primary }}>CHF {fmt(ramApprox)}</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}>
                      <td style={{ padding: "6px 8px", color: C.gray }}><strong style={{ color: C.swiss }}>4.</strong></td>
                      <td style={{ padding: "6px 8px", color: C.darkGray }}>Rente échelle 44 selon RAM <span style={{ color: C.gray, fontSize: 9 }}>(formule légale : min CHF 1'260 / max CHF 2'520)</span></td>
                      <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: C.primary }}>CHF {fmt(renteEch44)} /mois</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}>
                      <td style={{ padding: "6px 8px", color: C.gray }}><strong style={{ color: C.swiss }}>5.</strong></td>
                      <td style={{ padding: "6px 8px", color: C.darkGray }}>Application de l'échelle <span style={{ color: C.gray, fontSize: 9 }}>(rente éch. 44 × {tauxCompletion}%)</span></td>
                      <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: C.primary }}>CHF {fmt(renteEchClient)} /mois</td>
                    </tr>
                    <tr style={{ borderBottom: `2px solid ${C.swiss}`, background: "rgba(218,41,28,0.05)" }}>
                      <td style={{ padding: "8px", color: C.swiss, fontWeight: 900 }}>=</td>
                      <td style={{ padding: "8px", color: C.swiss, fontWeight: 800 }}>Rente mensuelle retenue {data.client.avsRenteEstimee ? <span style={{ color: C.gray, fontSize: 9, fontWeight: 500 }}>(estimation client validée)</span> : <span style={{ color: C.gray, fontSize: 9, fontWeight: 500 }}>(calcul indicatif)</span>}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontWeight: 900, color: C.swiss, fontSize: 14 }}>CHF {fmt(renteCalculee)} /mois</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}>
                      <td style={{ padding: "6px 8px", color: C.gray }}><strong style={{ color: C.gold }}>6.</strong></td>
                      <td style={{ padding: "6px 8px", color: C.darkGray }}>× 12 mois</td>
                      <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: C.primary }}>CHF {fmt(renteCalculee * 12)} /an</td>
                    </tr>
                    {data.client.avs13eRente && (
                      <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}>
                        <td style={{ padding: "6px 8px", color: C.gray }}><strong style={{ color: C.gold }}>7.</strong></td>
                        <td style={{ padding: "6px 8px", color: C.darkGray }}>+ 13e rente AVS (réforme AVS21 dès déc. 2026, +8.3%)</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: C.gold }}>+ CHF {fmt(treize)}</td>
                      </tr>
                    )}
                    <tr style={{ background: C.swiss, color: C.white }}>
                      <td style={{ padding: "10px 8px", fontWeight: 900 }}>=</td>
                      <td style={{ padding: "10px 8px", fontWeight: 900 }}>RENTE AVS ANNUELLE TOTALE</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 900, fontSize: 15, color: C.white }}>CHF {fmt(totalAnnuel)} /an</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div style={{ background: C.lightGray, padding: 10, fontSize: 9.5, color: C.darkGray, lineHeight: 1.5, borderLeft: `3px solid ${C.swiss}` }}>
                  <strong style={{ color: C.swiss }}>Identification</strong><br/>
                  N° AVS : <strong>{data.client.avsNumero || "—"}</strong><br/>
                  Caisse : <strong>{data.client.avsCaisse || "—"}</strong><br/>
                  Lacunes : <strong>{data.client.avsLacunes || "Aucune"}</strong>
                </div>
                <div style={{ background: "rgba(165,149,104,0.1)", padding: 10, fontSize: 9.5, color: C.darkGray, lineHeight: 1.5, borderLeft: `3px solid ${C.gold}` }}>
                  <strong style={{ color: C.gold }}>Bonus de la formule légale</strong><br/>
                  Bonifications <em>éducatives</em> ajoutées au RAM (par enfant).<br/>
                  Splitting pour couples mariés (50/50 des revenus).<br/>
                  Bonifications <em>d'assistance</em> si soutien à un proche.
                </div>
              </div>
            </>
          );
        })()}

        <div style={{ background: "rgba(218,41,28,0.05)", padding: 10, borderLeft: `4px solid ${C.swiss}`, fontSize: 9.5, color: C.darkGray, lineHeight: 1.5 }}>
          <strong>Le conseil WallSwiss :</strong> L'anticipation entraîne une perte définitive de <strong>6.8% par année anticipée</strong> (max 2 ans, soit -13.6%). L'ajournement (1 à 5 ans) ajoute +5.2% à +31.5%, mais nécessite environ 12 ans de versement pour être amorti. <em>Chiffres non opposables à la caisse — exiger l'extrait du compte individuel (CI) pour validation.</em>
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

function SlideLPP({ data, num }) {
  const lpp = calcLPP(data.client, Number(data.client.objAgeDepart || 65));
  const age = Number(data.client.age || 40);
  const ageDepart = Number(data.client.objAgeDepart || 65);
  const annees = Math.max(1, ageDepart - age);
  const avoirActuel = Number(data.client.lppAvoirActuel || 0);
  const cotis = Number(data.client.lppCotisationAnnuelle || 0);
  const taux = Number(data.client.lppTauxRendement || 1.25) / 100;
  const points = [];
  for (let y = 0; y <= annees; y += Math.max(1, Math.floor(annees / 8))) {
    const k = taux > 0 ? avoirActuel * Math.pow(1 + taux, y) + cotis * ((Math.pow(1 + taux, y) - 1) / taux) : avoirActuel + cotis * y;
    points.push({ age: age + y, val: Math.round(k) });
  }
  if (points[points.length - 1].age !== ageDepart) {
    points.push({ age: ageDepart, val: lpp.capitalAge65 });
  }
  const maxV = Math.max(...points.map(p => p.val), 1);
  const svgW = 600, svgH = 200, padL = 60, padR = 20, padT = 20, padB = 30;
  const w = svgW - padL - padR, h = svgH - padT - padB;
  const getX = (i) => padL + (i / (points.length - 1)) * w;
  const getY = (v) => padT + h - (v / maxV) * h;
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.val)}`).join(' ');
  const areaPath = `${path} L ${getX(points.length - 1)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`;

  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="2e Pilier — LPP" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.primary}`, paddingLeft: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Volet Suisse · Section 4</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Le <em style={{ color: C.primary }}>2e pilier</em> — LPP</div>
        </div>
        <p style={{ fontSize: 11, color: C.darkGray, lineHeight: 1.55, marginBottom: 12, textAlign: "justify" }}>
          La LPP — Prévoyance Professionnelle Obligatoire — vise à compléter l'AVS pour permettre le <strong>maintien du niveau de vie habituel</strong> (env. 60% du dernier salaire AVS+LPP confondus). Le mécanisme est en deux temps : <strong>(1) accumulation</strong> d'un capital tout au long de la carrière via cotisations employeur+salarié et rendement de la caisse ; <strong>(2) conversion</strong> à l'âge de retraite en rente viagère via un <em>taux de conversion</em> appliqué au capital. La <strong>réforme LPP21</strong> abaisse progressivement ce taux à 6.0% (vs 6.8% aujourd'hui pour la partie obligatoire) — un facteur clé à anticiper.
        </p>
        <div style={{ background: C.primary, color: C.white, padding: 20, marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Avoir actuel</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>CHF {fmt(avoirActuel)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Capital projeté à {ageDepart} ans</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>CHF {fmt(lpp.capitalAge65)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Rente projetée</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>CHF {fmt(lpp.renteMensuelle)}<span style={{ fontSize: 11, fontWeight: 400 }}> /mois</span></div>
          </div>
        </div>
        <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.gray, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, textAlign: "center" }}>Évolution projetée du capital LPP</div>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", height: svgH }}>
            {[0, 0.5, 1].map(pct => {
              const y = padT + h - pct * h;
              return (
                <g key={pct}>
                  <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke={C.lightGray} strokeDasharray="3 3" />
                  <text x={padL - 8} y={y + 4} fontSize="10" fill={C.gray} textAnchor="end">CHF {fmt(Math.round(maxV * pct))}</text>
                </g>
              );
            })}
            {points.map((p, i) => (
              <text key={i} x={getX(i)} y={svgH - 8} fontSize="10" fill={C.gray} textAnchor="middle">{p.age} ans</text>
            ))}
            <path d={areaPath} fill="rgba(105,33,2,0.08)" />
            <path d={path} fill="none" stroke={C.primary} strokeWidth="2.5" />
            {points.map((p, i) => (
              <circle key={i} cx={getX(i)} cy={getY(p.val)} r="4" fill={C.primary} />
            ))}
          </svg>
        </div>
        <div style={{ background: "rgba(105,33,2,0.06)", padding: 12, fontSize: 10.5, color: C.darkGray, lineHeight: 1.55, borderLeft: `4px solid ${C.primary}` }}>
          <strong style={{ color: C.primary }}>Le conseil WallSwiss.</strong> Avant tout retrait, vérifiez trois éléments : <strong>(1)</strong> le délai de blocage de 3 ans après un rachat (sinon perte de la déduction fiscale et imposition à la sortie) ; <strong>(2)</strong> le taux de couverture de votre caisse (un taux &lt; 100% expose à un sous-financement) ; <strong>(3)</strong> le règlement spécifique de votre caisse — certaines offrent un taux de conversion plus favorable que le minimum LPP, et la sortie partielle en capital peut être limitée à un pourcentage déterminé.
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

function Slide3eP({ data, num }) {
  const tp = calc3eP(data.client, Number(data.client.objAgeDepart || 65));
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="3e Pilier" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Volet Suisse · Section 5</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Le <em style={{ color: C.gold }}>3e pilier</em></div>
        </div>
        <p style={{ fontSize: 11, color: C.darkGray, lineHeight: 1.55, marginBottom: 12, textAlign: "justify" }}>
          Le 3e pilier complète les 1er et 2e piliers pour viser <strong>100% de votre revenu d'actif</strong> à la retraite et combler les lacunes (carrière incomplète, années à l'étranger, ratio LPP insuffisant). Deux formes distinctes : le <strong>3a lié</strong> (déductible fiscalement, blocage jusqu'à 5 ans avant l'âge ordinaire) et le <strong>3b libre</strong> (sans contrainte mais sans déduction). <strong>Plafonds 2026 :</strong> CHF 7'258 avec caisse de pension, CHF 36'288 (20% du revenu) sans. <em>Pour un frontalier : déduction du 3a conditionnée au statut de quasi-résident (≥ 90% des revenus imposables en Suisse) — validation indispensable par fiduciaire chaque année fiscale.</em>
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${C.gold}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.gold, fontWeight: 800, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>3a — Lié</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.primaryDark, marginBottom: 4 }}>CHF {fmt(tp.capital3a)}</div>
            <div style={{ fontSize: 11, color: C.gray }}>Projection à {data.client.objAgeDepart} ans</div>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${C.darkGray}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.darkGray, fontWeight: 800, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>3b — Libre</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.primaryDark, marginBottom: 4 }}>CHF {fmt(tp.capital3b)}</div>
            <div style={{ fontSize: 11, color: C.gray }}>Projection à {data.client.objAgeDepart} ans</div>
          </div>
        </div>
        <div style={{ background: C.primary, color: C.white, padding: 18, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Capital 3e pilier total projeté</div>
          <div style={{ fontSize: 30, fontWeight: 900 }}>CHF {fmt(tp.capitalTotal)}</div>
        </div>
        {data.client.troisPStrategieEchelonnement && (
          <div style={{ marginTop: 12, background: C.lightGray, padding: 14, borderLeft: `4px solid ${C.gold}`, fontSize: 11, color: C.darkGray, lineHeight: 1.6 }}>
            <strong style={{ color: C.gold }}>Stratégie d'échelonnement :</strong> {data.client.troisPStrategieEchelonnement}
          </div>
        )}
        <div style={{ marginTop: 10, background: "rgba(165,149,104,0.1)", padding: 12, fontSize: 10.5, color: C.darkGray, lineHeight: 1.55, borderLeft: `4px solid ${C.gold}` }}>
          <strong style={{ color: C.gold }}>Le conseil WallSwiss.</strong> Pour optimiser le retrait des comptes 3a : <strong>(1)</strong> ouvrir <em>plusieurs comptes 3a</em> chez plusieurs prestataires et les clôturer sur des années fiscales différentes (étalement = baisse de la progressivité d'impôt) ; <strong>(2)</strong> retirer le 3a au plus tôt 5 ans avant l'âge AVS ; <strong>(3)</strong> vérifier la <em>clause bénéficiaire</em> (assurance ou banque) pour la transmission au conjoint et aux enfants. Un 3a chez votre banque + un 3a en assurance + un 3a en placement collectif permet d'allier flexibilité et performance.
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ─── PHASE 1 SLIDE — Double scénario retraite française ───
function SlideDoubleScenarioFR({ data, num }) {
  const double = calcDoubleScenarioFR(data.client, data);
  if (!double) {
    return (
      <div style={pageBase}>
        <PageHeader data={data} num={num} titreSection="Volet français" />
        <div style={{ padding: "120px 50px 60px", height: "100%", boxSizing: "border-box" }}>
          <div style={{ background: C.lightGray, padding: 60, textAlign: "center", borderLeft: `4px solid ${C.france}` }}>
            <div style={{ fontSize: 14, color: C.darkGray }}>Aucune carrière française renseignée pour le client.</div>
          </div>
        </div>
        <PageFooter data={data} />
      </div>
    );
  }
  const tauxChange = Number(data.tauxChangeEurChf || 0.95);
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Volet français — Double scénario" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.france}`, paddingLeft: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.france, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Volet France · Section 6</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Vos <em style={{ color: C.france }}>pensions FR</em> — Tôt vs Taux plein</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.55, marginBottom: 12, textAlign: "justify" }}>
          La <strong>réforme française de 2023</strong> a relevé l'âge légal à 64 ans (vs 62) et le nombre de trimestres requis pour le taux plein à 172 (43 années). Pour les pluripensionnés franco-suisses, deux stratégies s'opposent. <strong>Départ au plus tôt</strong> : liquidation dès l'âge légal, avec une <em>décote</em> proportionnelle au nombre de trimestres manquants (jusqu'à -25% sur la pension de base, -10% pendant 3 ans sur l'AGIRC-ARRCO). <strong>Taux plein</strong> : on attend d'avoir cumulé tous les trimestres (ou l'âge automatique de 67 ans) pour percevoir la pension <em>complète sans décote</em>. La convention bilatérale CH-FR permet la <strong>totalisation des périodes</strong> — vos années cotisées en Suisse comptent dans le calcul des trimestres FR.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {[
            { titre: "Départ au plus tôt", sub: `${double.tot.ageDepart} ans (âge légal)`, sc: double.tot, color: C.warn },
            { titre: "Taux plein", sub: `${double.plein.ageDepart} ans`, sc: double.plein, color: C.ok },
          ].map((opt, i) => (
            <div key={i} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${opt.color}`, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: opt.color, marginBottom: 4 }}>{opt.titre}</div>
              <div style={{ fontSize: 10, color: C.gray, marginBottom: 12 }}>{opt.sub}</div>
              <table style={{ width: "100%", fontSize: 11 }}>
                <tbody>
                  <tr><td style={{ color: C.gray, padding: "4px 0" }}>CNAV (base)</td><td style={{ textAlign: "right", fontWeight: 700 }}>{fmtEUR(opt.sc.pensionCnavMensuelle)} €/mois</td></tr>
                  <tr><td style={{ color: C.gray, padding: "4px 0" }}>AGIRC-ARRCO</td><td style={{ textAlign: "right", fontWeight: 700 }}>{fmtEUR(opt.sc.pensionAgircMensuelle)} €/mois</td></tr>
                  <tr><td style={{ color: C.gray, padding: "4px 0", borderTop: `1px solid ${C.lightGray}` }}><strong>Total mensuel</strong></td><td style={{ textAlign: "right", fontWeight: 900, color: opt.color, borderTop: `1px solid ${C.lightGray}` }}>{fmtEUR(opt.sc.totalMensuel)} €/mois</td></tr>
                  <tr><td style={{ color: C.gray, padding: "4px 0", fontSize: 10 }}>Cumul jusqu'à 90 ans</td><td style={{ textAlign: "right", fontWeight: 700, fontSize: 10 }}>{fmtEUR(opt.sc.cumulEur)} €</td></tr>
                  {opt.sc.coefAgirc < 1 && (
                    <tr><td colSpan={2} style={{ color: C.bad, padding: "4px 0", fontSize: 9 }}>⚠ Décote AGIRC -{Math.round((1 - opt.sc.coefAgirc) * 100)}%</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div style={{ background: double.recommandation === "taux_plein" ? "#F0FDF4" : "#FEF3F2", borderLeft: `4px solid ${double.recommandation === "taux_plein" ? C.ok : C.warn}`, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: double.recommandation === "taux_plein" ? C.ok : C.warn, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            Recommandation : {double.recommandation === "taux_plein" ? "Attendre le taux plein" : "Partir au plus tôt"}
          </div>
          <div style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.5 }}>
            Différentiel cumulé : <strong>{fmtEUR(Math.abs(double.differentielCumuleEur))} €</strong> ({fmt(Math.abs(double.differentielCumuleChf))} CHF) {double.differentielCumuleEur > 0 ? "en faveur du taux plein" : "en faveur du départ anticipé"}.
          </div>
        </div>

        <div style={{ background: C.lightGray, padding: 12, fontSize: 11, color: C.darkGray, lineHeight: 1.6 }}>
          <strong>Méthode :</strong> CNAV = SAM × taux × (trimestres / requis). AGIRC-ARRCO = points × valeur (1.4159 € en 2024) × coef. décote. Trimestres acquis : <strong>{data.client.frTrimestresAcquis} / {data.client.frTrimestresRequis}</strong>.
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ─── PHASE 1 SLIDE — Arbitrage transfrontalier santé / fiscalité ───
function SlideArbitrageSante({ data, num }) {
  const arbitrage = calcArbitrageSante(data.client, data);
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Arbitrage santé / fiscalité" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Cœur de la valeur ajoutée · Section 7</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>L'<em style={{ color: C.gold }}>arbitrage</em> santé / fiscalité</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.55, marginBottom: 12, textAlign: "justify" }}>
          Pour un frontalier qui prend sa retraite en France, le choix du système d'assurance maladie est <strong>l'arbitrage le plus structurant</strong> de toute la planification — il peut représenter plusieurs <strong>dizaines de milliers de francs</strong> sur la durée de retraite. Trois régimes possibles : <strong>LAMal</strong> (sécurité sociale suisse maintenue à titre dérogatoire), <strong>CMU</strong> (sécurité sociale française), ou le <strong>régime général français avec CSG-CRDS-CASA</strong> jusqu'à 9.1% prélevés sur l'ensemble de vos pensions. La décision est <em>définitive</em> dans les 3 mois suivant la liquidation de la retraite française.
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginBottom: 14 }}>
          <thead>
            <tr style={{ background: C.primary, color: C.white }}>
              <th style={{ padding: "8px 10px", textAlign: "left" }}>Scénario</th>
              <th style={{ padding: "8px 10px", textAlign: "left" }}>Description</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>Coût total sur la période</th>
            </tr>
          </thead>
          <tbody>
            {arbitrage.scenarios.map((s) => {
              const isMeilleur = s.id === arbitrage.meilleur.id;
              const isPire = s.id === arbitrage.pire.id;
              return (
                <tr key={s.id} style={{ borderBottom: `1px solid ${C.lightGray}`, background: isMeilleur ? "rgba(16,185,129,0.08)" : isPire ? "rgba(239,68,68,0.05)" : "transparent" }}>
                  <td style={{ padding: "10px", fontWeight: 800, color: isMeilleur ? C.ok : isPire ? C.bad : C.darkGray }}>
                    {isMeilleur && "★ "}{s.id} — {s.label}
                  </td>
                  <td style={{ padding: "10px", color: C.gray, fontSize: 10 }}>{s.detail}<br/><em style={{ color: C.darkGray }}>{s.recommandePour}</em></td>
                  <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: isMeilleur ? C.ok : isPire ? C.bad : C.darkGray }}>CHF {fmt(s.cout)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ background: C.ok, color: C.white, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Stratégie recommandée</div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{arbitrage.meilleur.label}</div>
          <div style={{ fontSize: 12, marginTop: 6, opacity: 0.9 }}>Gain par rapport au pire scénario : <strong>CHF {fmt(arbitrage.gainStrategie)}</strong></div>
        </div>

        <div style={{ background: C.lightGray, padding: 11, fontSize: 9.5, color: C.darkGray, lineHeight: 1.55, borderLeft: `4px solid ${C.gold}`, marginBottom: 10 }}>
          <strong>Hypothèses :</strong> prime LAMal {fmt(arbitrage.hypotheses.primeLAMal)} CHF/an · prime CMU {fmt(arbitrage.hypotheses.primeCMU)} CHF/an · taux CSG/CRDS/CASA {arbitrage.hypotheses.tauxCSGCRDSCASA.toFixed(1)}% · âge de bascule hybride {arbitrage.hypotheses.ageBascule} ans.<br/>
          <strong>Réserve :</strong> Les rattrapages de cotisations CMU peuvent intervenir rétroactivement (jusqu'à 5 ans). Le taux CSG/CRDS dépend du revenu fiscal de référence (RFR) — exonération possible si RFR &lt; seuils, taux réduit ou taux plein.
        </div>
        <div style={{ background: "rgba(105,33,2,0.06)", padding: 11, fontSize: 9.5, color: C.darkGray, lineHeight: 1.55, borderLeft: `4px solid ${C.primary}` }}>
          <strong style={{ color: C.primary }}>Le conseil WallSwiss.</strong> Le scénario optimal dépend de 4 paramètres : <strong>(1)</strong> ratio pensions FR / pensions CH (plus la part FR est importante, plus la CMU+CSG devient pénalisante) ; <strong>(2)</strong> revenu fiscal de référence (RFR) — éligibilité à l'exonération CSG ; <strong>(3)</strong> existence ou non d'une mutuelle complémentaire en LAMal ; <strong>(4)</strong> votre projet de mobilité (déménagement éventuel hors France change la donne). Ce choix doit être réévalué chaque année si votre RFR évolue.
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ─── PHASE 1 SLIDE — 3 scénarios de sortie LPP ───
function Slide3ScenariosLPP({ data, num }) {
  const sc = calc3ScenariosLPP(data.client, data);
  const max = Math.max(...sc.scenarios.map(s => s.netTotal));
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="3 scénarios sortie LPP" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.primary}`, paddingLeft: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Volet Suisse · Section 8</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Sortie <em style={{ color: C.gold }}>LPP</em> — Rente, 50/50 ou Capital</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.55, marginBottom: 12, textAlign: "justify" }}>
          Capital LPP projeté : <strong>CHF {fmt(sc.capital)}</strong>. La décision <em>rente / capital / mixte</em> est l'<strong>un des choix les plus impactants</strong> du départ à la retraite : elle est <strong>irréversible</strong> et engage votre situation financière pour 25 à 30 ans. Trois dimensions à équilibrer : <strong>(1) sécurité</strong> (rente = revenu garanti à vie), <strong>(2) flexibilité</strong> (capital = liberté d'usage et de placement), <strong>(3) transmission</strong> (capital = transmissible aux héritiers, rente = perdue ou réversion partielle). Les chiffres ci-dessous intègrent la <strong>fiscalité différenciée</strong> : capital taxé à forfait ~{sc.hypotheses.tauxImpotCapital}% / rente imposée au taux marginal ~{sc.hypotheses.tauxImpotRente}%.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          {sc.scenarios.map((s) => {
            const isMax = s.netTotal === max;
            return (
              <div key={s.id} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${isMax ? C.ok : C.gold}`, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: isMax ? C.ok : C.primary, marginBottom: 10, minHeight: 30 }}>
                  {isMax && "★ "}{s.label}
                </div>
                <div style={{ fontSize: 10, color: C.gray, lineHeight: 1.7 }}>
                  <div>Capital perçu : <strong style={{ color: C.darkGray }}>CHF {fmt(s.capitalPercu)}</strong></div>
                  <div>Rente / an : <strong style={{ color: C.darkGray }}>CHF {fmt(s.rentePercue)}</strong></div>
                  <div>Impôts : <strong style={{ color: C.bad }}>CHF {fmt(s.impots)}</strong></div>
                </div>
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.lightGray}` }}>
                  <div style={{ fontSize: 9, color: C.gray, textTransform: "uppercase", letterSpacing: "0.05em" }}>NET TOTAL</div>
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
          <strong>Le conseil :</strong> Le choix dépend de votre situation patrimoniale, de votre tolérance au risque de longévité, et de vos objectifs de transmission. La sortie mixte (50/50) reste la stratégie la plus équilibrée pour la majorité des frontaliers.
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

function LignePat({ label, valeur, pos = false, bold = false }) {
  return (
    <tr style={{ borderBottom: `1px solid ${C.lightGray}`, background: bold ? "rgba(105,33,2,0.04)" : "transparent" }}>
      <td style={{ padding: "10px 0", color: bold ? C.primary : C.darkGray, fontWeight: bold ? 700 : 500 }}>{label}</td>
      <td style={{ padding: "10px 0", textAlign: "right", color: valeur < 0 ? C.bad : C.primary, fontWeight: bold ? 900 : 700 }}>{valeur < 0 ? "- " : ""}CHF {fmt(Math.abs(valeur))}</td>
    </tr>
  );
}

function SlidePatrimoine({ data, num }) {
  const immoBrut = Number(data.immoResidencePrincipaleValeur || 0);
  const hypo = Number(data.immoResidencePrincipaleHypotheque || 0);
  const immoNet = immoBrut - hypo;
  const liq = Number(data.patComptesCourants || 0) + Number(data.patEpargne || 0);
  const titres = Number(data.patDepotsTitres || 0);
  const credits = Number(data.patCredits || 0) + Number(data.patLeasings || 0);
  const tp = calc3eP(data.client, Number(data.client.objAgeDepart || 65));
  const lpp = calcLPP(data.client, Number(data.client.objAgeDepart || 65));
  const fortuneTotale = immoNet + liq + titres + tp.capitalTotal + lpp.capitalAge65 - credits;
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Patrimoine global" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 9</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Votre <em style={{ color: C.gold }}>patrimoine</em> aujourd'hui</div>
        </div>
        <div style={{ background: C.primary, color: C.white, padding: 22, textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Fortune nette estimée (projection retraite)</div>
          <div style={{ fontSize: 36, fontWeight: 900 }}>CHF {fmt(fortuneTotale)}</div>
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
      </div>
      <PageFooter data={data} />
    </div>
  );
}

function SlideLeviers({ data, num }) {
  const synth = calcSyntheseRetraite(data.client, data);
  const leviers = [];
  if (synth.ecart > 0) leviers.push({ titre: "Combler l'écart de revenu", desc: `Il manque CHF ${fmt(synth.ecartMensuel)} /mois.`, action: "Voir leviers ci-dessous." });
  if (Number(data.client.lppPotentielRachat) > 0) leviers.push({ titre: "Rachat LPP", desc: `Potentiel : CHF ${fmt(data.client.lppPotentielRachat)}.`, action: "Optimisation fiscale immédiate." });
  if (Number(data.client.troisPCotisationAnnuelle || 0) < 7258) {
    const manque = 7258 - Number(data.client.troisPCotisationAnnuelle || 0);
    leviers.push({ titre: "Maximiser le 3a", desc: `Plafond 2026 : CHF 7'258.`, action: `Augmenter de CHF ${fmt(manque)} /an.` });
  }
  if (data.client.frACarriereFrance && !calcPensionsFR(data.client).tauxPlein) {
    leviers.push({ titre: "Atteindre le taux plein FR", desc: "Trimestres acquis en-dessous du seuil.", action: "Régularisation ou différer la liquidation." });
  }
  if (data.client.lppAvoirsOublies) leviers.push({ titre: "Recherche avoirs LPP oubliés", desc: "Risque identifié.", action: "Demande à la Centrale du 2e pilier." });
  if (Number(data.client.objAgeDepart || 65) < 65) leviers.push({ titre: "Arrêt anticipé", desc: `Départ à ${data.client.objAgeDepart} ans.`, action: "Anticiper cotisations AVS et impact rente." });

  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Leviers d'optimisation" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 10</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Vos <em style={{ color: C.gold }}>leviers</em> d'optimisation</div>
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
      <PageFooter data={data} />
    </div>
  );
}

function LigneHypo({ label, valeur }) {
  return (
    <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}>
      <td style={{ padding: "10px 16px", color: C.darkGray, fontWeight: 500 }}>{label}</td>
      <td style={{ padding: "10px 16px", textAlign: "right", color: C.primary, fontWeight: 700 }}>{valeur}</td>
    </tr>
  );
}

function SlideHypotheses({ data, num }) {
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Hypothèses de l'étude" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 11</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Les <em style={{ color: C.gold }}>hypothèses</em> retenues</div>
        </div>
        <p style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.6, marginBottom: 16, textAlign: "justify" }}>
          Toute projection repose sur un cadre d'hypothèses, <strong>validées ensemble</strong>. Sources des données : caisse de compensation (AVS), caisse de pension (LPP), compagnies 3A. 3A assurance valorisée à la valeur de rachat annoncée ; 3A banque à valeur actuelle + rendement.
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
          </tbody>
        </table>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ─── PHASE 1 SLIDE — Plan d'actions calendaire ───
function SlidePlanActions({ data, num }) {
  const actions = generatePlanActions(data);
  const limited = actions.slice(0, 20);
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Plan d'actions calendaire" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.primary}`, paddingLeft: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 12 · De l'analyse à l'exécution</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Votre <em style={{ color: C.gold }}>plan d'actions</em></div>
        </div>
        <p style={{ fontSize: 11, color: C.darkGray, lineHeight: 1.5, marginBottom: 12, textAlign: "justify" }}>
          Le tableau ci-dessous liste <strong>chaque démarche</strong> à entreprendre, son destinataire et sa priorité. Il sert de feuille de route opérationnelle, de l'audit (R1) à la liquidation effective de la retraite.
        </p>
        <div style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: 9, color: C.gray }}>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.bad, marginRight: 4, verticalAlign: "middle" }}/> Haute</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.warn, marginRight: 4, verticalAlign: "middle" }}/> Moyenne</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.ok, marginRight: 4, verticalAlign: "middle" }}/> Basse</span>
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
            {limited.map((a, i) => {
              const color = a.importance === "haute" ? C.bad : a.importance === "moyenne" ? C.warn : C.ok;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${C.lightGray}` }}>
                  <td style={{ padding: "6px 8px", color: C.darkGray, fontWeight: 700, fontSize: 10 }}>{a.annee} · {a.mois}</td>
                  <td style={{ padding: "6px 8px", color: C.darkGray }}>{a.action}</td>
                  <td style={{ padding: "6px 8px", color: C.gray, fontStyle: "italic" }}>{a.destinataire}</td>
                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    <span style={{ display: "inline-block", width: 12, height: 12, background: color }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ marginTop: 12, background: "rgba(165,149,104,0.1)", padding: 10, fontSize: 10, color: C.darkGray, borderLeft: `3px solid ${C.gold}` }}>
          <strong>Alerte délais :</strong> La demande de prestation LPP doit être annoncée à la caisse de pension <strong>12 mois avant</strong> la date prévue de retrait. La rente AVS se demande au moins 3 mois avant l'âge ordinaire.
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ─── PHASE 1 SLIDE — Gain total du conseil ───
function SlideGainTotal({ data, num }) {
  const gain = calcGainTotal(data);
  const arbitrage = calcArbitrageSante(data.client, data);
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Gain total du conseil" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 13 · Valeur du conseil chiffrée</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Le <em style={{ color: C.gold }}>gain total</em> matérialisé</div>
        </div>
        <p style={{ fontSize: 11, color: C.darkGray, lineHeight: 1.6, marginBottom: 16, textAlign: "justify" }}>
          Le tableau suivant chiffre le <strong>gain consolidé</strong> que notre conseil vous fait gagner sur la période. Il combine les bonnes décisions retraite, le choix optimal santé/fiscalité et les économies obtenues via nos partenaires (change, frais bancaires).
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 16 }}>
          <tbody>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}>
              <td style={{ padding: "12px 16px", color: C.darkGray, fontWeight: 600 }}>Gain choix âge AVS optimal</td>
              <td style={{ padding: "12px 16px", textAlign: "right", color: C.primary, fontWeight: 700 }}>CHF {fmt(gain.gainAgeAVS)}</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}>
              <td style={{ padding: "12px 16px", color: C.darkGray, fontWeight: 600 }}>Gain stratégie maladie ({arbitrage.meilleur.label})</td>
              <td style={{ padding: "12px 16px", textAlign: "right", color: C.primary, fontWeight: 700 }}>CHF {fmt(gain.gainStrategieMaladie)}</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}>
              <td style={{ padding: "12px 16px", color: C.darkGray, fontWeight: 600 }}>Économies de change (partenaire dédié)</td>
              <td style={{ padding: "12px 16px", textAlign: "right", color: C.primary, fontWeight: 700 }}>CHF {fmt(gain.economiesChange)}</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}>
              <td style={{ padding: "12px 16px", color: C.darkGray, fontWeight: 600 }}>Économies frais bancaires</td>
              <td style={{ padding: "12px 16px", textAlign: "right", color: C.primary, fontWeight: 700 }}>CHF {fmt(gain.economiesFrais)}</td>
            </tr>
            <tr style={{ background: C.primary, color: C.white }}>
              <td style={{ padding: "16px", fontWeight: 900, fontSize: 16 }}>TOTAL GAIN ESTIMÉ</td>
              <td style={{ padding: "16px", textAlign: "right", fontWeight: 900, fontSize: 22, color: C.gold }}>CHF {fmt(gain.total)}</td>
            </tr>
          </tbody>
        </table>
        <div style={{ background: C.lightGray, padding: 14, fontSize: 11, color: C.darkGray, lineHeight: 1.6, borderLeft: `4px solid ${C.gold}` }}>
          <strong>Partenaires recommandés :</strong> {data.partenairesDescription || "B-Sharpe (solution de change frontalier), Banque du Léman (offre dédiée frontaliers)."}<br/>
          <strong>Période d'estimation :</strong> {data.economiesPartenairesAnneesEstimees} ans · Économies frais annuelles : CHF {fmt(data.economiesFraisAnnuelles)}.
        </div>
        <div style={{ marginTop: 14, background: "rgba(255,255,255,0.7)", padding: 12, fontSize: 10, color: C.gray, fontStyle: "italic", borderLeft: `3px solid ${C.mediumGray}` }}>
          Réserve : Ces estimations reposent sur les hypothèses validées en début d'étude. Les chiffres réels dépendront de l'évolution des taux, de la fiscalité et des règlements de caisse. Non opposable juridiquement.
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

function SlideDocuments({ data, num }) {
  const docsSuisse = [
    "Pièce d'identité + permis G",
    "Certificat AVS + extrait du CI",
    "Certificat LPP récent + règlement de caisse",
    "Attestation potentiel de rachat LPP",
    "Attestations libre-passage",
    "Relevés et attestations 3a (banque + assurance)",
    "Polices d'assurance-vie 3b",
    "Fiches de salaire (3 mois) + certificat annuel",
    "Dernière déclaration & décision de taxation",
    "Contrats hypothécaires",
    "Estimations / actes immobiliers",
    "Relevés bancaires et dépôts-titres",
    "Police d'assurance maladie",
  ];
  const docsFrance = [
    "Relevé de carrière / RIS (info-retraite.fr)",
    "Relevé de points AGIRC-ARRCO",
    "Bulletins France Travail pour périodes manquantes",
    "Avis d'imposition français",
    "Justificatif de quasi-résident",
  ];
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Documents à fournir" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 14 — Préparation du R2</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Les <em style={{ color: C.gold }}>documents</em> à transmettre</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ background: C.swiss, color: C.white, padding: "8px 12px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", marginBottom: 8 }}>Volet suisse</div>
            {docsSuisse.map((d, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.lightGray}`, fontSize: 10.5, color: C.darkGray }}>
                <div style={{ width: 12, height: 12, border: `1.5px solid ${C.swiss}`, flexShrink: 0, marginTop: 1 }} />
                <span>{d}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ background: C.france, color: C.white, padding: "8px 12px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", marginBottom: 8 }}>Volet français</div>
            {docsFrance.map((d, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.lightGray}`, fontSize: 10.5, color: C.darkGray }}>
                <div style={{ width: 12, height: 12, border: `1.5px solid ${C.france}`, flexShrink: 0, marginTop: 1 }} />
                <span>{d}</span>
              </div>
            ))}
            <div style={{ background: C.lightGray, padding: 12, marginTop: 16, fontSize: 10, color: C.gray, lineHeight: 1.5, borderLeft: `3px solid ${C.gold}` }}>
              <strong>Astuce :</strong> Le RIS est téléchargeable sur <strong>info-retraite.fr</strong>.
            </div>
          </div>
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

function SlideContact({ data, num }) {
  return (
    <div style={{ ...pageBase, background: `linear-gradient(180deg, ${C.lightGray} 0%, ${C.white} 100%)` }}>
      <PageHeader data={data} num={num} titreSection="Prochaines étapes" />
      <div style={{ padding: "120px 50px 60px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>Votre planification</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 36, color: C.primary, fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>Construisons<br/><em style={{ color: C.gold }}>la suite ensemble</em></div>
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
        <div style={{ marginTop: 30, textAlign: "center", fontSize: 9, color: C.gray, lineHeight: 1.5, maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
          <strong>Avertissement :</strong> Ce rapport est établi sur la base des informations fournies par le client et selon le cadre réglementaire en vigueur à la date d'édition. Les rendements ne sont pas garantis. WallSwiss SA décline toute responsabilité quant à l'évolution future des paramètres légaux, fiscaux et financiers.
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

function SlideWallswiss({ data }) {
  return (
    <div style={{ ...pageBase, background: `linear-gradient(180deg, ${C.lightGray} 0%, ${C.white} 100%)` }}>
      <PageHeader data={data} num="" titreSection="Votre Partenaire" />
      <div style={{ padding: "70px 40px 40px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>

        {/* En-tête identité */}
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ background: C.white, width: 56, height: 56, margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
            <img src={LOGO_URL} alt="WallSwiss" className="pdf-image" style={{ width: 30, height: 30, objectFit: "contain" }} />
          </div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>WallSwiss</div>
          <div style={{ color: C.gold, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", marginTop: 4 }}>L'excellence patrimoniale franco-suisse</div>
        </div>

        {/* Mission */}
        <div style={{ background: C.white, padding: 14, borderLeft: `4px solid ${C.primary}`, marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 10, color: C.primary, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Notre mission</div>
          <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.55, margin: 0, textAlign: "justify" }}>
            Accompagner les <strong>frontaliers, pluripensionnés franco-suisses et résidents</strong> de Suisse romande dans la structuration globale de leur patrimoine et la préparation de leur retraite. Notre approche transforme la <strong>complexité réglementaire</strong> (AVS, LPP, CNAV, AGIRC-ARRCO, fiscalité croisée, LAMal/CMU) en <strong>opportunités d'optimisation concrètes</strong>, mesurables et opposables.
          </p>
        </div>

        {/* Chiffres clés */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            { val: "15+", lbl: "années d'expertise" },
            { val: "100%", lbl: "indépendance" },
            { val: "350+", lbl: "familles accompagnées" },
            { val: "EUR/CHF", lbl: "double maîtrise" },
          ].map((c, i) => (
            <div key={i} style={{ background: C.primary, color: C.white, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.gold }}>{c.val}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{c.lbl}</div>
            </div>
          ))}
        </div>

        {/* 4 compétences distinctives */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            { icon: <Icons.Users size={14} color={C.gold} />, t: "Double Compétence", d: "Maîtrise exhaustive des systèmes de prévoyance croisés (AVS/LPP vs CNAV/AGIRC-ARRCO) et de la fiscalité (impôt source, quasi-résident, IFI, exit tax). Évite la double imposition et les rattrapages de cotisations." },
            { icon: <Icons.Check size={14} color={C.gold} />, t: "Indépendance Absolue", d: "Libres de toute attache bancaire ou assurantielle, nous opérons en architecture ouverte. Nous sélectionnons les meilleures solutions du marché dans votre seul intérêt, sans rétrocession cachée." },
            { icon: <Icons.Eye size={14} color={C.gold} />, t: "Ingénierie Patrimoniale", d: "Structuration immobilière (SCI, démembrement, SCPI), optimisation successorale transfrontalière (choix de loi UE 650/2012, donations, contrats Assurance-Vie luxembourgeois), 3a/3b multi-comptes." },
            { icon: <Icons.Alert size={14} color={C.gold} />, t: "Suivi & Pérennité", d: "Le cadre légal évolue (AVS21, LPP21, réforme retraite FR 2023, conventions fiscales). Veille réglementaire active et révision annuelle de votre dossier — votre plan reste toujours optimal." },
          ].map((c, i) => (
            <div key={i} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 10 }}>
              <div style={{ fontSize: 10, color: C.primary, fontWeight: 800, textTransform: "uppercase", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                {c.icon} {c.t}
              </div>
              <div style={{ fontSize: 9, color: C.gray, lineHeight: 1.45, textAlign: "justify" }}>{c.d}</div>
            </div>
          ))}
        </div>

        {/* Notre accompagnement A→Z (3 phases) */}
        <div style={{ background: C.primary, color: C.white, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: C.gold, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10, textAlign: "center" }}>Notre accompagnement de A à Z</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", gap: 8, alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ fontSize: 14, color: C.gold, fontWeight: 900 }}>1.</div>
                <div style={{ fontSize: 10, fontWeight: 700 }}>Audit (R1)</div>
              </div>
              <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>Cartographie complète : situation civile, droits de prévoyance, patrimoine, fiscalité, objectifs.</div>
            </div>
            <div style={{ color: C.gold, fontSize: 16, alignSelf: "center" }}>→</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ fontSize: 14, color: C.gold, fontWeight: 900 }}>2.</div>
                <div style={{ fontSize: 10, fontWeight: 700 }}>Stratégie (R2)</div>
              </div>
              <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>Modélisation des scénarios, identification des leviers, chiffrage du gain total, recommandations.</div>
            </div>
            <div style={{ color: C.gold, fontSize: 16, alignSelf: "center" }}>→</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ fontSize: 14, color: C.gold, fontWeight: 900 }}>3.</div>
                <div style={{ fontSize: 10, fontWeight: 700 }}>Action & Suivi</div>
              </div>
              <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>Implémentation des solutions, démarches assistées auprès des caisses, bilan de révision annuel.</div>
            </div>
          </div>
        </div>

        {/* Nos domaines d'expertise + Valeurs */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10, flex: 1 }}>
          <div style={{ background: C.white, padding: 12, border: `1px solid ${C.mediumGray}` }}>
            <div style={{ fontSize: 10, color: C.primary, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Nos domaines d'expertise</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 9, color: C.darkGray }}>
              {[
                "Planification retraite croisée",
                "Optimisation LPP (rachats, sortie)",
                "Arbitrage LAMal / CMU / CSG",
                "Statut quasi-résident",
                "3e pilier multi-comptes",
                "Structuration immobilière (SCI)",
                "Succession transfrontalière",
                "Assurances-vie luxembourgeoises",
                "Donations & pactes successoraux",
                "Conventions CH-FR (CDI, sécurité sociale)",
              ].map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 5, padding: "2px 0" }}>
                  <span style={{ color: C.gold, fontWeight: 900 }}>·</span> <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: C.gold, color: C.white, padding: 12 }}>
            <div style={{ fontSize: 10, color: C.white, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, opacity: 0.95 }}>Nos valeurs</div>
            <div style={{ fontSize: 9.5, lineHeight: 1.55 }}>
              <div style={{ marginBottom: 6 }}><strong>Transparence.</strong> Honoraires clairs, aucune rétrocession dissimulée.</div>
              <div style={{ marginBottom: 6 }}><strong>Exigence.</strong> Chaque recommandation est justifiée et chiffrée.</div>
              <div style={{ marginBottom: 6 }}><strong>Engagement.</strong> Conseillers dédiés, joignables, disponibles.</div>
              <div><strong>Long terme.</strong> Une relation de confiance, pas une transaction.</div>
            </div>
          </div>
        </div>

      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ============================================================
// PHASE 2 — SLIDES VISUELLES SUPPLÉMENTAIRES
// ============================================================

// ─── Page de transition à citation ───
function SlideCitation({ data, num, citation, auteur, contexte }) {
  return (
    <div style={{ ...pageBase, background: `linear-gradient(135deg, ${C.primaryDark} 0%, ${C.primary} 100%)` }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: C.gold }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 6, background: C.gold }} />
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 80, boxSizing: "border-box", position: "relative" }}>
        <div style={{ position: "absolute", top: 80, left: 80, fontSize: 180, color: "rgba(165,149,104,0.15)", fontFamily: "'Times New Roman', Times, serif", lineHeight: 0.8 }}>"</div>
        <div style={{ position: "absolute", bottom: 100, right: 80, fontSize: 180, color: "rgba(165,149,104,0.15)", fontFamily: "'Times New Roman', Times, serif", lineHeight: 0.8, transform: "rotate(180deg)" }}>"</div>
        <div style={{ color: C.gold, fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 24 }}>{contexte}</div>
        <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 30, color: C.white, fontWeight: 400, fontStyle: "italic", lineHeight: 1.4, textAlign: "center", maxWidth: 600, marginBottom: 32, position: "relative", zIndex: 2 }}>
          « {citation} »
        </div>
        <div style={{ width: 60, height: 2, background: C.gold, marginBottom: 16 }} />
        <div style={{ color: C.gold, fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>— {auteur}</div>
      </div>
      <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase" }}>WallSwiss · {num}</div>
    </div>
  );
}

// ─── Cartographie des droits de retraite ───
function SlideCartographieDroits({ data, num }) {
  const lignes = calcCartographieDroits(data);
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Cartographie de vos droits" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Inventaire complet</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Vos <em style={{ color: C.gold }}>droits</em> à la retraite répertoriés</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.55, marginBottom: 12, textAlign: "justify" }}>
          Cette cartographie est le <strong>point de départ de toute planification</strong>. Elle inventorie l'ensemble de vos droits acquis et institutions concernées — un frontalier franco-suisse a typiquement <strong>4 à 7 prestations différentes</strong> à déclencher, chacune avec son calendrier propre et son interlocuteur. Une <strong>seule prestation oubliée</strong> peut représenter plusieurs milliers de francs perdus chaque année. Pour chaque ligne : bénéficiaire, type (rente viagère / capital / capital libre), institut, montant projeté et âge d'ouverture des droits.
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
                <td style={{ padding: "8px 10px", color: C.primary, fontWeight: 700 }}>{l.qui}</td>
                <td style={{ padding: "8px 10px", color: C.darkGray, fontWeight: 600 }}>{l.intitule}</td>
                <td style={{ padding: "8px 10px", color: C.gray, fontStyle: "italic" }}>{l.type}</td>
                <td style={{ padding: "8px 10px", color: C.gray, fontSize: 10 }}>{l.institut}</td>
                <td style={{ padding: "8px 10px", textAlign: "right", color: C.primary, fontWeight: 700 }}>{l.montant}</td>
                <td style={{ padding: "8px 10px", textAlign: "center", color: C.darkGray }}>{l.ageDebut} ans</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 14, background: C.lightGray, padding: 12, borderLeft: `4px solid ${C.gold}`, fontSize: 10.5, color: C.darkGray, lineHeight: 1.6 }}>
          <strong>Nombre total de prestations à déclencher :</strong> {lignes.length} · <strong>Bénéficiaires :</strong> {data.isCouple ? 2 : 1}. Chacune nécessite une demande formelle auprès de l'institut concerné — voir le <em>Plan d'actions calendaire</em>.
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ─── Schéma "temple" des entrées ───
function SlideTemple({ data, num }) {
  const ageDepart = Number(data.client.objAgeDepart || 65);
  const avs = calcAVS(data.client);
  const lpp = calcLPP(data.client, ageDepart);
  const tp = calc3eP(data.client, ageDepart);
  const pensionsFR = calcPensionsFR(data.client);
  const tauxChange = Number(data.tauxChangeEurChf || 0.95);
  const piliers = [
    { num: "I", titre: "AVS", sub: "1er pilier", montant: `CHF ${fmt(avs.renteMensuelle)}/mois`, age: 65, color: C.swiss },
    { num: "II", titre: "LPP", sub: "2e pilier", montant: `CHF ${fmt(lpp.renteMensuelle)}/mois`, age: ageDepart, color: C.primary },
    { num: "III", titre: "3e Pilier", sub: "Privé", montant: `CHF ${fmt(tp.capitalTotal)} capital`, age: ageDepart, color: C.gold },
    { num: "IV", titre: "Pensions FR", sub: "Volet français", montant: `${fmtEUR(pensionsFR.totalMensuel)} €/mois`, age: Number(data.client.frAgeTauxPlein || 67), color: C.france },
  ];
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Temple de vos revenus retraite" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Architecture des revenus</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Le <em style={{ color: C.gold }}>temple</em> de vos rentes</div>
        </div>
        <p style={{ fontSize: 11, color: C.darkGray, lineHeight: 1.6, marginBottom: 24, textAlign: "justify" }}>
          Visualisation en piliers de l'ensemble de vos sources de revenus à la retraite. Chaque colonne représente une source, son institut et son montant projeté à l'âge de déclenchement.
        </p>

        {/* Toit du temple */}
        <div style={{ width: "85%", margin: "0 auto", height: 14, background: `linear-gradient(180deg, ${C.gold} 0%, ${C.primaryDark} 100%)`, marginBottom: 0 }} />
        <div style={{ width: "90%", margin: "0 auto -4px", height: 8, background: C.primary, marginBottom: 8 }} />

        {/* Piliers */}
        <div style={{ width: "85%", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          {piliers.map((p, i) => (
            <div key={i} style={{ background: C.white, border: `2px solid ${p.color}`, borderTop: `8px solid ${p.color}`, padding: 16, textAlign: "center", minHeight: 200, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 32, color: p.color, fontWeight: 900, marginBottom: 4 }}>{p.num}</div>
                <div style={{ fontSize: 12, color: C.primary, fontWeight: 800, marginBottom: 2 }}>{p.titre}</div>
                <div style={{ fontSize: 9, color: C.gray, textTransform: "uppercase", letterSpacing: "0.05em" }}>{p.sub}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: p.color, fontWeight: 800, marginBottom: 4 }}>{p.montant}</div>
                <div style={{ fontSize: 9, color: C.gray }}>dès {p.age} ans</div>
              </div>
            </div>
          ))}
        </div>

        {/* Socle */}
        <div style={{ width: "92%", margin: "0 auto", height: 12, background: C.primary, marginTop: 8 }} />
        <div style={{ width: "95%", margin: "0 auto", height: 8, background: `linear-gradient(180deg, ${C.primaryDark} 0%, ${C.gold} 100%)` }} />

        <div style={{ marginTop: 24, background: C.lightGray, padding: 14, borderLeft: `4px solid ${C.gold}`, fontSize: 11, color: C.darkGray, lineHeight: 1.6 }}>
          <strong>Lecture :</strong> Les 4 piliers se complètent. L'AVS couvre le minimum vital, la LPP le maintien du niveau de vie, le 3e pilier comble les lacunes, et les pensions FR matérialisent vos années de carrière française. <strong>Aucun ne suffit à lui seul.</strong>
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ─── Pré-allocation par horizon (4 poches + camembert) ───
function SlideHorizons({ data, num }) {
  const poches = calcAllocationPoches(data);
  const total = poches.reduce((s, p) => s + p.montant, 0) || 1;
  let offset = 0;
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Pré-allocation par horizon" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Allocation patrimoine</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Les <em style={{ color: C.gold }}>4 poches</em> de consommation</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.55, marginBottom: 14, textAlign: "justify" }}>
          La <strong>pré-allocation par horizon</strong> est une technique éprouvée de gestion de patrimoine de retraite. Plutôt que d'investir l'ensemble du capital de manière uniforme, on segmente en <strong>4 poches temporelles</strong> alignées sur les besoins réels de consommation. Cette approche apporte trois bénéfices : <strong>(1)</strong> elle garantit la disponibilité immédiate des liquidités sans déranger les placements longs en cas de baisse des marchés ; <strong>(2)</strong> elle laisse la durée travailler en faveur de la part long-terme — donc une exposition plus dynamique sans stress ; <strong>(3)</strong> elle clarifie mentalement la stratégie. Votre capital disponible total : <strong>CHF {fmt(total)}</strong>, réparti comme suit.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 24, marginBottom: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <svg viewBox="0 0 48 48" style={{ width: 220, height: 220, transform: "rotate(-90deg)" }}>
              <circle r="16" cx="24" cy="24" fill="transparent" stroke={C.lightGray} strokeWidth="12" />
              {poches.map((p, i) => {
                const len = (p.montant / total) * 100;
                const dash = `${len} 100`;
                const dashOff = `-${offset}`;
                offset += len;
                return <circle key={i} r="16" cx="24" cy="24" fill="transparent" stroke={p.color} strokeWidth="12" strokeDasharray={dash} strokeDashoffset={dashOff} pathLength="100" />;
              })}
              <circle r="9" cx="24" cy="24" fill={C.white} />
            </svg>
            <div style={{ textAlign: "center", marginTop: -130, fontFamily: "'Times New Roman', Times, serif", color: C.primary, position: "relative", zIndex: 2 }}>
              <div style={{ fontSize: 10, color: C.gray, letterSpacing: "0.1em", textTransform: "uppercase" }}>Total</div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>CHF {fmt(Math.round(total / 1000))}k</div>
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
                  <div style={{ fontSize: 16, fontWeight: 900, color: p.color }}>CHF {fmt(p.montant)}</div>
                  <div style={{ fontSize: 10, color: C.gray }}>{p.pct}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.lightGray, padding: 14, borderLeft: `4px solid ${C.primary}`, fontSize: 11, color: C.darkGray, lineHeight: 1.6 }}>
          <strong>Le principe :</strong> chaque poche est calibrée pour un horizon précis. La <strong>poche court terme</strong> sécurise vos dépenses immédiates (0–3 ans). La <strong>poche très long terme</strong> bénéficie du temps pour absorber la volatilité et générer de la performance.
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ─── Projection annuelle 2026-2050 ───
function SlideProjectionAnnuelle({ data, num }) {
  const proj = calcProjectionAnnuelle(data);
  const sample = proj.filter((_, i) => i % 2 === 0).slice(0, 14); // 1 année sur 2
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Projection annuelle" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.primary}`, paddingLeft: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Trajectoire patrimoniale</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Votre <em style={{ color: C.gold }}>projection</em> année par année</div>
        </div>
        <p style={{ fontSize: 10, color: C.darkGray, lineHeight: 1.5, marginBottom: 12, textAlign: "justify" }}>
          Trajectoire complète des flux et du patrimoine de l'année courante jusqu'à votre âge de fin de consommation. Chaque ligne intègre les <strong>salaires</strong> (jusqu'au départ), les <strong>rentes</strong> (AVS+LPP+FR à partir du départ), la <strong>libération des capitaux</strong> (LPP partiel, 3a, 3b à la bascule), le <strong>train de vie</strong> indexé à l'inflation ({data.tauxInflation}%), les <strong>charges courantes</strong> (assurances, fiscalité, immobilier) et la <strong>capitalisation du patrimoine liquide</strong> au taux retenu ({data.tauxRendement}%). Les années surlignées en or correspondent à la période de retraite. <em>Échantillon : 1 année sur 2 affichée pour la lisibilité.</em>
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
                <td style={{ padding: "5px 4px", textAlign: "right", color: C.gold, fontWeight: r.capitalsLib > 0 ? 700 : 400 }}>{r.capitalsLib > 0 ? fmt(r.capitalsLib) : "—"}</td>
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
      <PageFooter data={data} />
    </div>
  );
}

// ─── Évolution graphique du patrimoine (histogramme empilé) ───
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
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Visualisation graphique</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Votre <em style={{ color: C.gold }}>patrimoine</em> dans le temps</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.55, marginBottom: 14, textAlign: "justify" }}>
          Décomposition empilée de votre patrimoine total entre <strong>la part liquide</strong> (comptes, titres, capitaux libérés) qui finance directement votre train de vie, et <strong>la part immobilière</strong> (résidence principale, locatifs) — généralement illiquide mais qui constitue un patrimoine de réserve et de transmission. Le pic de patrimoine liquide se situe à l'âge de bascule (libération LPP + 3a). La décroissance ensuite est le résultat de la consommation différentielle (train de vie supérieur aux rentes). <strong>Tant que la barre liquide reste au-dessus de zéro à votre âge cible</strong>, votre stratégie est viable.
        </p>
        <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 16 }}>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", height: svgH }}>
            {[0, 0.25, 0.5, 0.75, 1].map(pct => {
              const y = padT + chartH - pct * chartH;
              return (
                <g key={pct}>
                  <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke={C.lightGray} strokeDasharray="3 3" />
                  <text x={padL - 8} y={y + 4} fontSize="9" fill={C.gray} textAnchor="end">{fmt(Math.round(maxP * pct / 1000))}k</text>
                </g>
              );
            })}
            {sample.map((r, i) => {
              const x = padL + (i / sample.length) * chartW + (chartW / sample.length - barW) / 2;
              const hImmo = (r.patImmo / maxP) * chartH;
              const hLiq = (r.patLiquide / maxP) * chartH;
              return (
                <g key={r.annee}>
                  <rect x={x} y={padT + chartH - hImmo} width={barW} height={hImmo} fill={C.gold} />
                  <rect x={x} y={padT + chartH - hImmo - hLiq} width={barW} height={hLiq} fill={C.primary} />
                  <text x={x + barW / 2} y={svgH - 30} fontSize="9" fill={C.gray} textAnchor="middle">{r.annee}</text>
                  <text x={x + barW / 2} y={svgH - 18} fontSize="8" fill={C.gray} textAnchor="middle">{r.age}a</text>
                </g>
              );
            })}
          </svg>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 12, fontSize: 11 }}>
            <span><span style={{ display: "inline-block", width: 14, height: 14, background: C.primary, marginRight: 6, verticalAlign: "middle" }} /> Patrimoine liquide</span>
            <span><span style={{ display: "inline-block", width: 14, height: 14, background: C.gold, marginRight: 6, verticalAlign: "middle" }} /> Patrimoine immobilier</span>
          </div>
        </div>
        <div style={{ marginTop: 16, background: C.lightGray, padding: 14, borderLeft: `4px solid ${C.primary}`, fontSize: 11, color: C.darkGray, lineHeight: 1.6 }}>
          <strong>Lecture :</strong> Le patrimoine liquide reste au-dessus de zéro tout au long de la projection — votre stratégie est viable jusqu'à {data.client.objAgeFinConsommation || 90} ans avec une marge de sécurité. La part immobilière constitue un patrimoine de réserve transmissible.
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ─── Heatmap train de vie par âge de départ (58→70) ───
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
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Aide à la décision</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Quand <em style={{ color: C.gold }}>partir</em> à la retraite ?</div>
        </div>
        <p style={{ fontSize: 10.5, color: C.darkGray, lineHeight: 1.55, marginBottom: 14, textAlign: "justify" }}>
          Cette <strong>matrice de décision</strong> répond à la question centrale : "<em>Quel âge dois-je viser pour vivre comme je le souhaite ?</em>". Pour chaque âge de départ (58 → 70 ans), le tableau affiche le <strong>train de vie mensuel maximal soutenable</strong> jusqu'à votre âge cible de fin de consommation, selon deux stratégies de sortie : <strong>rente</strong> (sécurité maximale, longévité couverte) ou <strong>capital étalé</strong> (consommation linéaire, train de vie supérieur mais risque de longévité). Le dégradé visuel facilite la comparaison : plus la couleur tend vers le vert, plus le train de vie projeté est confortable.
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: C.primary, color: C.white }}>
              <th style={{ padding: "10px 12px", textAlign: "left" }}>Âge de départ</th>
              <th style={{ padding: "10px 12px", textAlign: "center" }}>Durée retraite</th>
              <th style={{ padding: "10px 12px", textAlign: "center" }}>Train de vie en RENTE</th>
              <th style={{ padding: "10px 12px", textAlign: "center" }}>Train de vie en CAPITAL</th>
            </tr>
          </thead>
          <tbody>
            {hm.rows.map((r) => (
              <tr key={r.age} style={{ borderBottom: `1px solid ${C.lightGray}` }}>
                <td style={{ padding: "8px 12px", fontWeight: 700, color: C.primary }}>{r.age} ans</td>
                <td style={{ padding: "8px 12px", textAlign: "center", color: C.gray }}>{r.dureeRetraite} ans</td>
                <td style={{ padding: "8px 12px", textAlign: "center", background: getColor(r.trainDeVieRente), color: C.white, fontWeight: 800 }}>CHF {fmt(r.trainDeVieRente)} /mois</td>
                <td style={{ padding: "8px 12px", textAlign: "center", background: getColor(r.trainDeVieCapital), color: C.white, fontWeight: 800 }}>CHF {fmt(r.trainDeVieCapital)} /mois</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 4, fontSize: 9 }}>
          {["Faible", "Modeste", "Correct", "Bon", "Très bon", "Excellent"].map((l, i) => {
            const colors = ["#DC2626", "#EA580C", "#CA8A04", "#65A30D", "#15803D", "#0F766E"];
            return <span key={i} style={{ padding: "4px 8px", background: colors[i], color: C.white, fontWeight: 700 }}>{l}</span>;
          })}
        </div>
        <div style={{ marginTop: 12, background: C.lightGray, padding: 12, borderLeft: `4px solid ${C.gold}`, fontSize: 11, color: C.darkGray, lineHeight: 1.5 }}>
          <strong>Le conseil :</strong> La colonne « Capital » suppose une consommation linéaire du patrimoine sur la durée. C'est généralement <strong>40 à 60% plus élevé</strong> que la rente seule mais expose au risque de longévité.
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ─── Calcul mensuel détaillé du train de vie ───
function SlideTrainDeVieMensuel({ data, num }) {
  const tv = calcTrainDeVieMensuel(data);
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Train de vie mensuel détaillé" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Du brut au net consommable</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Votre <em style={{ color: C.gold }}>train de vie</em> réel</div>
        </div>
        <p style={{ fontSize: 11, color: C.darkGray, lineHeight: 1.6, marginBottom: 16, textAlign: "justify" }}>
          Décomposition du chemin entre vos <strong>revenus bruts</strong> et votre <strong>train de vie net consommable</strong>. Différenciation avant et après 90 ans (épuisement du capital).
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 16 }}>
          <tbody>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}>
              <td style={{ padding: "12px 16px", color: C.darkGray, fontWeight: 600 }}>Revenus bruts mensuels (AVS + LPP + FR)</td>
              <td style={{ padding: "12px 16px", textAlign: "right", color: C.primary, fontWeight: 700 }}>CHF {fmt(tv.revenuBrut)}</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}>
              <td style={{ padding: "12px 16px", color: C.gray, paddingLeft: 32 }}>− Contributions sociales (CSG/CRDS estimées)</td>
              <td style={{ padding: "12px 16px", textAlign: "right", color: C.bad }}>− CHF {fmt(tv.cotSociales)}</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}>
              <td style={{ padding: "12px 16px", color: C.gray, paddingLeft: 32 }}>− Imposition mensuelle</td>
              <td style={{ padding: "12px 16px", textAlign: "right", color: C.bad }}>− CHF {fmt(tv.impotMensuel)}</td>
            </tr>
            <tr style={{ borderBottom: `2px solid ${C.primary}`, background: "rgba(105,33,2,0.04)" }}>
              <td style={{ padding: "12px 16px", color: C.primary, fontWeight: 800 }}>= Revenus nets</td>
              <td style={{ padding: "12px 16px", textAlign: "right", color: C.primary, fontWeight: 900, fontSize: 14 }}>CHF {fmt(tv.revenuNet)}</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}>
              <td style={{ padding: "12px 16px", color: C.gray, paddingLeft: 32 }}>− Charges fixes (assurance maladie, autres)</td>
              <td style={{ padding: "12px 16px", textAlign: "right", color: C.bad }}>− CHF {fmt(tv.chargesFixes)}</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.lightGray}` }}>
              <td style={{ padding: "12px 16px", color: C.gray, paddingLeft: 32 }}>+ Consommation du capital (étalée)</td>
              <td style={{ padding: "12px 16px", textAlign: "right", color: C.ok, fontWeight: 700 }}>+ CHF {fmt(tv.consoCapitalMensuel)}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div style={{ background: C.ok, color: C.white, padding: 18 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Train de vie AVANT 90 ans</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>CHF {fmt(tv.trainVieAvant90)}<span style={{ fontSize: 12, fontWeight: 500 }}> /mois</span></div>
            <div style={{ fontSize: 10, opacity: 0.9, marginTop: 4 }}>Rente + consommation patrimoine</div>
          </div>
          <div style={{ background: C.warn, color: C.white, padding: 18 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Train de vie APRÈS 90 ans</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>CHF {fmt(tv.trainVieApres90)}<span style={{ fontSize: 12, fontWeight: 500 }}> /mois</span></div>
            <div style={{ fontSize: 10, opacity: 0.9, marginTop: 4 }}>Rente seule (capital épuisé)</div>
          </div>
        </div>

        <div style={{ background: C.lightGray, padding: 12, fontSize: 11, color: C.darkGray, borderLeft: `4px solid ${C.gold}`, lineHeight: 1.6 }}>
          <strong>Patrimoine immobilier restant à 90 ans :</strong> CHF {fmt(tv.patImmoRestant)} — réserve de transmission ou de soutien en cas d'événement majeur (EMS, perte d'autonomie).
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ─── Fiche résumé sortie en capital ───
function SlideFicheCapital({ data, num }) {
  const ageDepart = Number(data.client.objAgeDepart || 65);
  const lpp = calcLPP(data.client, ageDepart);
  const tp = calc3eP(data.client, ageDepart);
  const partLPPCapital = Number(data.client.lppPartCapitalPct || 0) / 100;
  const capitalLPPSorti = lpp.capitalAge65 * partLPPCapital;
  const anneeDepart = new Date().getFullYear() + (ageDepart - Number(data.client.age || 50));
  const lignes = [
    { pilier: "2e pilier — LPP (part capital)", montant: capitalLPPSorti, quand: `T-12 mois (annonce caisse)`, institut: data.client.lppCaisse || "Caisse de pension", dateEffet: `${anneeDepart}` },
    { pilier: "3a — Compte n°1", montant: tp.capital3a * (1 / Number(data.client.troisPNbComptes || 1)), quand: `T-3 mois`, institut: "Banque 3a #1", dateEffet: `${anneeDepart}` },
  ];
  if (Number(data.client.troisPNbComptes || 1) > 1) {
    for (let i = 2; i <= Number(data.client.troisPNbComptes); i++) {
      lignes.push({ pilier: `3a — Compte n°${i}`, montant: tp.capital3a / Number(data.client.troisPNbComptes), quand: `T-3 mois`, institut: `Banque 3a #${i}`, dateEffet: `${anneeDepart + i - 1}` });
    }
  }
  if (Number(tp.capital3b) > 0) {
    lignes.push({ pilier: "3b — Assurance-vie", montant: tp.capital3b, quand: "À tout moment", institut: "Assureur 3b", dateEffet: `${anneeDepart}` });
  }
  const total = lignes.reduce((s, l) => s + l.montant, 0);
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Fiche sortie en capital" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Mode opératoire</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Vos <em style={{ color: C.gold }}>capitaux</em> à libérer</div>
        </div>
        <p style={{ fontSize: 11, color: C.darkGray, lineHeight: 1.6, marginBottom: 16, textAlign: "justify" }}>
          Pour chaque capital à percevoir : <strong>montant projeté, échéance de la demande, institut concerné, date d'effet</strong>. L'échelonnement sur plusieurs années optimise la charge fiscale.
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: C.primary, color: C.white }}>
              <th style={{ padding: "10px", textAlign: "left" }}>Source du capital</th>
              <th style={{ padding: "10px", textAlign: "right" }}>Montant</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Quand faire la demande</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Auprès de</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Date d'effet</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.lightGray}`, background: i % 2 === 0 ? C.white : "rgba(165,149,104,0.03)" }}>
                <td style={{ padding: "10px", color: C.darkGray, fontWeight: 600 }}>{l.pilier}</td>
                <td style={{ padding: "10px", textAlign: "right", color: C.primary, fontWeight: 700 }}>CHF {fmt(l.montant)}</td>
                <td style={{ padding: "10px", color: C.gold, fontWeight: 600, fontSize: 10 }}>{l.quand}</td>
                <td style={{ padding: "10px", color: C.gray, fontStyle: "italic", fontSize: 10 }}>{l.institut}</td>
                <td style={{ padding: "10px", textAlign: "center", color: C.darkGray, fontWeight: 700 }}>{l.dateEffet}</td>
              </tr>
            ))}
            <tr style={{ background: C.primary, color: C.white }}>
              <td style={{ padding: "12px 10px", fontWeight: 900 }}>TOTAL CAPITAUX</td>
              <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 900, fontSize: 16, color: C.gold }}>CHF {fmt(Math.round(total))}</td>
              <td colSpan={3}></td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: 14, background: "rgba(239,68,68,0.05)", padding: 12, borderLeft: `4px solid ${C.bad}`, fontSize: 10.5, color: C.darkGray, lineHeight: 1.5 }}>
          <strong>Alerte fiscale :</strong> Les retraits en capital sont taxés séparément du revenu, à un taux privilégié, mais <strong>cumulés dans la même année</strong>. Échelonner sur plusieurs années fiscales = baisse significative de l'impôt total. L'effet est particulièrement marqué entre comptes 3a et capital LPP.
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ─── Slide conjoint (vue complète) ───
function SlideConjoint({ data, num }) {
  if (!data.isCouple || !data.conjoint.prenom) return null;
  const synth = calcSyntheseRetraite(data.conjoint, data);
  const lpp = calcLPP(data.conjoint, Number(data.conjoint.objAgeDepart || 65));
  const tp = calc3eP(data.conjoint, Number(data.conjoint.objAgeDepart || 65));
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection={`${data.conjoint.prenom} — Vue complète`} />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Volet conjoint</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>{data.conjoint.prenom} {(data.conjoint.nom || "").toUpperCase()}</div>
        </div>
        <CarteProfil p={data.conjoint} couleur={C.gold} />
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${C.swiss}`, padding: 14 }}>
            <div style={{ fontSize: 10, color: C.swiss, fontWeight: 800, marginBottom: 4 }}>AVS</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.primary }}>CHF {fmt(synth.avs.renteMensuelle)}</div>
            <div style={{ fontSize: 10, color: C.gray }}>/mois à 65 ans</div>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${C.primary}`, padding: 14 }}>
            <div style={{ fontSize: 10, color: C.primary, fontWeight: 800, marginBottom: 4 }}>LPP</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.primary }}>CHF {fmt(lpp.renteMensuelle)}</div>
            <div style={{ fontSize: 10, color: C.gray }}>/mois — Cap. {fmt(lpp.capitalAge65)}</div>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${C.gold}`, padding: 14 }}>
            <div style={{ fontSize: 10, color: C.gold, fontWeight: 800, marginBottom: 4 }}>3e Pilier</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.primary }}>CHF {fmt(tp.capitalTotal)}</div>
            <div style={{ fontSize: 10, color: C.gray }}>capital projeté</div>
          </div>
        </div>
        {data.conjoint.frACarriereFrance && (
          <div style={{ marginTop: 16, background: C.france, color: C.white, padding: 16 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Pensions françaises</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{fmtEUR(synth.pensionsFR.totalMensuel)} €/mois <span style={{ fontSize: 12, opacity: 0.85 }}>(soit CHF {fmt(synth.pensionsFRChfMensuelle)}/mois)</span></div>
            <div style={{ fontSize: 10, opacity: 0.9, marginTop: 4 }}>Trimestres {data.conjoint.frTrimestresAcquis}/{data.conjoint.frTrimestresRequis} · {synth.pensionsFR.tauxPlein ? "Taux plein" : "Décote applicable"}</div>
          </div>
        )}
        <div style={{ marginTop: 16, background: C.primary, color: C.white, padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Revenu rente conjoint(e) à {synth.ageDepart} ans</span>
          <span style={{ fontSize: 24, fontWeight: 900 }}>CHF {fmt(synth.revenuRenteAjusteMensuel)} /mois</span>
        </div>
        <div style={{ marginTop: 14, background: C.lightGray, padding: 12, borderLeft: `4px solid ${C.gold}`, fontSize: 11, color: C.darkGray, lineHeight: 1.6 }}>
          <strong>Vue couple consolidée :</strong> les revenus des deux conjoints se complètent. Le décalage des âges de départ ({data.client.objAgeDepart} vs {data.conjoint.objAgeDepart} ans) permet un <strong>échelonnement naturel</strong> des liquidations, optimisant la fiscalité.
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ─── Page Notes lignées ───
function SlideNotes({ data, num }) {
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Notes personnelles" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Vos annotations</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Espace <em style={{ color: C.gold }}>notes</em></div>
        </div>
        <p style={{ fontSize: 11, color: C.gray, marginBottom: 24, fontStyle: "italic" }}>Utilisez cet espace pour noter vos questions, vos points d'attention ou les éléments à valider entre R1 et R2.</p>
        {Array.from({ length: 22 }).map((_, i) => (
          <div key={i} style={{ height: 28, borderBottom: `1px solid ${C.mediumGray}`, marginBottom: 0 }} />
        ))}
      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ─── Page Avertissement / Disclaimer légal ───
function SlideDisclaimer({ data, num }) {
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Avertissement légal" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.bad}`, paddingLeft: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.bad, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Limitations de responsabilité</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, color: C.primary, fontWeight: 700, margin: 0 }}>Avertissement <em style={{ color: C.bad }}>légal</em></div>
        </div>
        <div style={{ fontSize: 11, color: C.darkGray, lineHeight: 1.7, textAlign: "justify" }}>
          <p><strong style={{ color: C.primary }}>1. Nature du document.</strong> Le présent rapport constitue une étude personnalisée à caractère <strong>indicatif</strong>. Il a vocation à éclairer vos décisions patrimoniales mais ne constitue ni un conseil juridique, ni un conseil fiscal individualisé au sens des réglementations applicables.</p>
          <p><strong style={{ color: C.primary }}>2. Sources et données.</strong> Les chiffres présentés reposent sur les informations transmises par le client (déclarations, certificats des caisses, attestations des compagnies 3A) et sur des hypothèses validées en début d'étude. Toute inexactitude des données fournies se répercute mécaniquement sur les projections.</p>
          <p><strong style={{ color: C.primary }}>3. Non-garantie des rendements.</strong> Les rendements futurs des placements (1er, 2e et 3e piliers, patrimoine financier) ne sont jamais garantis. Les chiffres tels que <em>taux de conversion LPP</em>, <em>valeur du point AGIRC-ARRCO</em> ou <em>rente AVS maximale</em> évoluent dans le temps et selon les réformes.</p>
          <p><strong style={{ color: C.primary }}>4. Caractère non opposable.</strong> Les estimations de rentes AVS et LPP <strong>ne sont pas opposables</strong> aux caisses de compensation ni aux institutions de prévoyance. Seules les décisions formelles de ces institutions, à la date effective de liquidation, font foi.</p>
          <p><strong style={{ color: C.primary }}>5. Évolutions réglementaires.</strong> Le cadre franco-suisse (convention de sécurité sociale, fiscalité transfrontalière, statut de quasi-résident, règles d'affiliation maladie LAMal/CMU) est susceptible d'évolutions. Une revue régulière du dossier est recommandée — annuelle au minimum.</p>
          <p><strong style={{ color: C.primary }}>6. Indépendance.</strong> WallSwiss SA opère en architecture ouverte et n'est lié par aucune obligation de distribution envers une institution financière particulière. Les recommandations de partenaires (change, banque, notaire) reposent uniquement sur leur adéquation à la situation du client.</p>
          <p><strong style={{ color: C.primary }}>7. Protection des données.</strong> Les données collectées sont traitées dans le respect de la LPD suisse et du RGPD européen. Hébergement Google Firestore — région européenne. Vous disposez d'un droit d'accès, de rectification et de suppression à tout moment auprès de votre conseiller.</p>
        </div>
        <div style={{ marginTop: 24, padding: 14, background: C.lightGray, borderLeft: `4px solid ${C.gold}`, fontSize: 10, color: C.gray, fontStyle: "italic", textAlign: "center" }}>
          Document confidentiel établi le {data.dateRapport ? new Date(data.dateRapport).toLocaleDateString('fr-FR') : "—"} par {data.conseiller || "—"}. Reproduction et diffusion soumises à autorisation.
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
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
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
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

  const slides = [
    <SlideCouverture data={data} />,
    <SlideSommaire data={data} />,
    <SlideWallswiss data={data} />,
    <SlideCitation data={data} num="03" citation="L'épargne est le meilleur des héritages que l'on peut laisser à ses enfants." auteur="Sénèque" contexte="Avant-propos" />,
    <SlideProfil data={data} num="04" />,
    <SlideCartographieDroits data={data} num="05" />,
    <SlideVueEnsemble data={data} num="06" />,
    <SlideTemple data={data} num="07" />,
    <SlideCitation data={data} num="08" citation="La vie, c'est ce qui vous arrive pendant que vous êtes occupés à faire d'autres projets." auteur="John Lennon" contexte="Volet prévoyance suisse" />,
    <SlideAVS data={data} num="09" />,
    <SlideLPP data={data} num="10" />,
    <Slide3eP data={data} num="11" />,
    <Slide3ScenariosLPP data={data} num="12" />,
    <SlideCitation data={data} num="13" citation="Personne ne peut revenir en arrière et faire un nouveau départ, mais chacun peut partir maintenant et faire une nouvelle fin." auteur="Mahatma Gandhi" contexte="Volet français" />,
    <SlideDoubleScenarioFR data={data} num="14" />,
    <SlideArbitrageSante data={data} num="15" />,
    ...(data.isCouple && data.conjoint?.prenom ? [<SlideConjoint data={data} num="16" />] : []),
    <SlidePatrimoine data={data} num={data.isCouple ? "17" : "16"} />,
    <SlideHorizons data={data} num={data.isCouple ? "18" : "17"} />,
    <SlideProjectionAnnuelle data={data} num={data.isCouple ? "19" : "18"} />,
    <SlideEvolutionPatrimoine data={data} num={data.isCouple ? "20" : "19"} />,
    <SlideHeatmap data={data} num={data.isCouple ? "21" : "20"} />,
    <SlideTrainDeVieMensuel data={data} num={data.isCouple ? "22" : "21"} />,
    <SlideCitation data={data} num={data.isCouple ? "23" : "22"} citation="Le futur appartient à ceux qui croient à la beauté de leurs rêves." auteur="Eleanor Roosevelt" contexte="Stratégie & action" />,
    <SlideLeviers data={data} num={data.isCouple ? "24" : "23"} />,
    <SlideFicheCapital data={data} num={data.isCouple ? "25" : "24"} />,
    <SlidePlanActions data={data} num={data.isCouple ? "26" : "25"} />,
    <SlideGainTotal data={data} num={data.isCouple ? "27" : "26"} />,
    <SlideHypotheses data={data} num={data.isCouple ? "28" : "27"} />,
    <SlideDocuments data={data} num={data.isCouple ? "29" : "28"} />,
    <SlideNotes data={data} num={data.isCouple ? "30" : "29"} />,
    <SlideDisclaimer data={data} num={data.isCouple ? "31" : "30"} />,
    <SlideContact data={data} num={data.isCouple ? "32" : "31"} />,
  ];

  const pdfFilename = `Planification_Retraite_${(data.client.prenom || "").trim()}_${(data.client.nom || "Client").trim()}.pdf`.replace(/\s+/g, '_');

  const handleDownloadPDF = async () => {
    setIsPdfLoading(true);
    const element = document.getElementById('r1-printable');
    if (!element) { setIsPdfLoading(false); return; }
    const images = element.querySelectorAll('img.pdf-image');
    await Promise.all(Array.from(images).map(async (img) => {
      if (img.src && !img.src.startsWith('data:')) {
        const base64 = await getBase64Image(img.src);
        img.src = base64;
      }
    }));
    await new Promise(r => setTimeout(r, 300));
    try {
      await requirePdfLibs();
      const html2canvas = window.html2canvas;
      const jsPDFClass = window.jspdf.jsPDF;
      const pages = element.querySelectorAll('.pdf-page');
      const pdfW = PAGE_W / 96;
      const pdfH = PAGE_H / 96;
      const pdf = new jsPDFClass({ unit: 'in', format: [pdfW, pdfH], orientation: 'portrait' });
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2, useCORS: true, backgroundColor: '#ffffff',
          width: PAGE_W, height: PAGE_H, windowWidth: PAGE_W, windowHeight: PAGE_H, logging: false,
        });
        const img = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage([pdfW, pdfH], 'portrait');
        pdf.addImage(img, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST');
      }
      pdf.save(pdfFilename);
    } catch (e) { console.error("Erreur PDF:", e); }
    finally { setIsPdfLoading(false); }
  };

  const openEmailModal = () => {
    setEmailForm({
      to: data.client.emailClient || "",
      subject: `Votre planification retraite — WallSwiss`,
      body: `Bonjour ${data.client.prenom || ""},\n\nVeuillez trouver ci-joint votre rapport de planification retraite, préparé suite à notre rendez-vous du ${new Date(data.dateRapport).toLocaleDateString('fr-FR')}.\n\nBien à vous,\n${data.conseiller}`
    });
    setShowEmailModal(true);
  };

  const handleConfirmEmail = async () => {
    const webhookUrl = appSettings?.reportWebhookUrl?.trim();
    if (!webhookUrl) { alert("Configurez l'URL du Webhook dans Paramètres."); return; }
    setShowEmailModal(false);
    setIsEmailing(true);
    const element = document.getElementById('r1-printable');
    const images = element.querySelectorAll('img.pdf-image');
    await Promise.all(Array.from(images).map(async (img) => {
      if (img.src && !img.src.startsWith('data:')) {
        const base64 = await getBase64Image(img.src);
        img.src = base64;
      }
    }));
    await new Promise(r => setTimeout(r, 300));
    try {
      await requirePdfLibs();
      const html2canvas = window.html2canvas;
      const jsPDFClass = window.jspdf.jsPDF;
      const pages = element.querySelectorAll('.pdf-page');
      const pdfW = PAGE_W / 96, pdfH = PAGE_H / 96;
      const pdf = new jsPDFClass({ unit: 'in', format: [pdfW, pdfH], orientation: 'portrait' });
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], { scale: 1.5, useCORS: true, backgroundColor: '#ffffff', width: PAGE_W, height: PAGE_H, windowWidth: PAGE_W, windowHeight: PAGE_H, logging: false });
        const img = canvas.toDataURL('image/jpeg', 0.85);
        if (i > 0) pdf.addPage([pdfW, pdfH], 'portrait');
        pdf.addImage(img, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST');
      }
      const raw = pdf.output('datauristring');
      const pureBase64 = raw.includes('base64,') ? raw.substring(raw.indexOf('base64,') + 7) : raw;
      const response = await fetch(webhookUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailForm.to, subject: emailForm.subject, body: emailForm.body, pdfBase64: pureBase64, filename: pdfFilename })
      });
      if (!response.ok) throw new Error(`Webhook ${response.status}`);
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000);
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
          <button onClick={handleDownloadPDF} disabled={isPdfLoading || isEmailing} style={{ background: C.white, color: C.primaryDark, border: "none", padding: "6px 12px", cursor: "pointer", fontSize: 10, fontWeight: 700, opacity: isPdfLoading ? 0.7 : 1 }}>
            {isPdfLoading ? "GÉNÉRATION..." : "TÉLÉCHARGER PDF"}
          </button>
          <button onClick={openEmailModal} disabled={isEmailing} style={{ background: emailSuccess ? C.ok : C.gold, color: C.white, border: "none", padding: "6px 12px", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
            {isEmailing ? "ENVOI..." : emailSuccess ? "ENVOYÉ" : "EMAIL"}
          </button>
          <span style={{ color: C.gold, fontSize: 11 }}>{currentSlide + 1} / {slides.length}</span>
          <button onClick={onClose} style={{ background: "transparent", color: C.gray, border: "none", padding: "6px 12px", cursor: "pointer", fontSize: 11 }}>FERMER ✕</button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 60px", position: "relative" }}>
        <button onClick={() => setCurrentSlide(s => Math.max(0, s - 1))} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.08)", color: C.white, border: "none", width: 40, height: 40, cursor: "pointer", fontSize: 20 }}>‹</button>
        <div style={{ width: PAGE_W * 0.65, height: PAGE_H * 0.65, position: "relative", boxShadow: "0 8px 40px rgba(0,0,0,0.5)", overflow: "hidden", backgroundColor: C.white }}>
          <div style={{ width: PAGE_W, height: PAGE_H, transform: "scale(0.65)", transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
            {slides[currentSlide]}
          </div>
        </div>
        <button onClick={() => setCurrentSlide(s => Math.min(slides.length - 1, s + 1))} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.08)", color: C.white, border: "none", width: 40, height: 40, cursor: "pointer", fontSize: 20 }}>›</button>
      </div>

      <div style={{ background: C.black, padding: "8px 24px", display: "flex", gap: 4, overflowX: "auto", flexShrink: 0 }}>
        {slides.map((_, i) => (
          <div key={i} onClick={() => setCurrentSlide(i)} style={{ width: 36, height: 28, background: i === currentSlide ? C.primary : "rgba(255,255,255,0.06)", border: i === currentSlide ? `1px solid ${C.gold}` : "1px solid rgba(255,255,255,0.04)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: i === currentSlide ? C.white : "rgba(255,255,255,0.35)", fontWeight: 600 }}>
            {i + 1}
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", left: "-9999px", top: 0, zIndex: -1000, opacity: 1, pointerEvents: "none" }}>
        <div id="r1-printable" style={{ width: `${PAGE_W}px`, background: C.white }}>
          {slides.map((Sl, i) => (
            <div key={i} className="pdf-page" style={{ width: `${PAGE_W}px`, height: `${PAGE_H}px`, position: "relative", overflow: "hidden", display: "block" }}>
              {Sl}
            </div>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.95)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
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
export default function RetraiteR1Module({ user, db, appId, appSettings }) {
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState(stateInitial());
  const [preview, setPreview] = useState(null);
  const [planifs, setPlanifs] = useState([]);

  useEffect(() => {
    if (!user || !db) return;
    const ref = collection(db, 'artifacts', appId, 'public', 'data', 'planifications_retraite');
    const unsub = onSnapshot(ref, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      const adminEmail = "admin@wallswiss.ch";
      const filtered = user.email === adminEmail ? list : list.filter(r => r.agentId === user.uid);
      setPlanifs(filtered.sort((a, b) => (b.id || 0) - (a.id || 0)));
    });
    return () => unsub();
  }, [user, db, appId]);

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
    const newPlanif = {
      ...data, id: newId,
      agentId: user ? user.uid : "demo",
      agentEmail: user ? user.email : "demo@wallswiss.ch",
      dateCreation: data.dateCreation || new Date().toISOString(),
    };
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
          <div>
            <div style={{ color: C.gray, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Module ouvert</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>Planification Retraite — R1 Frontaliers / Franco-suisses</div>
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
                <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, margin: 0 }}>Vos planifications retraite</h2>
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
                        <div style={{ fontSize: 10, color: C.gold, marginBottom: 2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Gain total estimé du conseil</div>
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
            <p style={{ color: C.gray, fontSize: 13, marginBottom: 24 }}>17 sections — dont les 4 modules différenciants (arbitrage santé, double scénario FR, 3 scénarios LPP, gain total).</p>
            <WizardR1 data={data} setData={setData} appSettings={appSettings} onPreview={() => setPreview(data)} onSave={handleSave} />
          </div>
        )}
      </main>

      {preview && <PreviewR1 data={preview} appSettings={appSettings} onClose={() => setPreview(null)} onEdit={(e) => { handleEdit(e, preview); setPreview(null); }} onDelete={async (e) => { await handleDelete(e, preview.id); setPreview(null); }} />}
    </div>
  );
}