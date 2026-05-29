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
};

const LOGO_URL = "/logo blanc sans texte.png";

// ────────────────────── ICÔNES MINIMALES ──────────────────────
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

// ────────────────────── HELPERS DE PROJECTION ──────────────────────

// AVS Suisse — Rente maximale 2026: ~2'520 CHF/mois (incl. ajustement),
// Rente minimale: ~1'260 CHF/mois. 44 années requises pour rente complète.
// 13e rente AVS dès décembre 2026.
function calcAVS(person) {
  const annees = Number(person.avsAnneesCotisation || 0);
  const renteMaxBase = 2520; // CHF/mois en 2026
  const renteMinBase = 1260;
  const tauxCompletion = Math.min(annees / 44, 1);

  // Si rente estimée fournie par le client, on l'utilise
  if (person.avsRenteEstimee && Number(person.avsRenteEstimee) > 0) {
    const renteMensuelle = Number(person.avsRenteEstimee);
    const renteAnnuelle = renteMensuelle * 12;
    const treizieme = person.avs13eRente !== false ? renteMensuelle : 0;
    return {
      renteMensuelle,
      renteAnnuelle: renteAnnuelle + treizieme,
      treizieme,
      tauxCompletion,
      source: "Estimation client"
    };
  }

  // Sinon calcul approximatif basé sur années + revenu
  const revenuMoyen = Number(person.revenusBrut || 0);
  let renteBase = renteMinBase + (renteMaxBase - renteMinBase) * tauxCompletion;
  if (revenuMoyen > 0 && revenuMoyen < 88200) {
    renteBase = Math.max(renteMinBase, renteBase * (revenuMoyen / 88200));
  }
  const renteMensuelle = Math.round(renteBase);
  const treizieme = person.avs13eRente !== false ? renteMensuelle : 0;
  return {
    renteMensuelle,
    renteAnnuelle: renteMensuelle * 12 + treizieme,
    treizieme,
    tauxCompletion,
    source: "Estimation indicative"
  };
}

// LPP — Calcul approximatif avec capitalisation jusqu'à l'âge de référence
function calcLPP(person, ageDepart = 65) {
  const avoirActuel = Number(person.lppAvoirActuel || 0);
  const cotisationAnnuelle = Number(person.lppCotisationAnnuelle || 0);
  const tauxRendement = Number(person.lppTauxRendement || 1.25) / 100;
  const age = Number(person.age || 40);
  const annees = Math.max(0, ageDepart - age);

  // Capitalisation: FV = PV*(1+r)^n + PMT * [(1+r)^n - 1] / r
  let capitalAge65 = avoirActuel;
  if (tauxRendement > 0) {
    capitalAge65 = avoirActuel * Math.pow(1 + tauxRendement, annees) +
                   cotisationAnnuelle * ((Math.pow(1 + tauxRendement, annees) - 1) / tauxRendement);
  } else {
    capitalAge65 = avoirActuel + cotisationAnnuelle * annees;
  }

  // Si le client a déjà une estimation, on l'utilise
  if (person.lppCapitalProjete && Number(person.lppCapitalProjete) > 0) {
    capitalAge65 = Number(person.lppCapitalProjete);
  }

  // Ajout des libres-passages
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

// 3e Pilier (3A + 3B)
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

// Pensions françaises (CNAV + AGIRC-ARRCO)
function calcPensionsFR(person) {
  const trimAcquis = Number(person.frTrimestresAcquis || 0);
  const trimRequis = Number(person.frTrimestresRequis || 172);
  const sam = Number(person.frSAM || 0); // Salaire annuel moyen

  // CNAV: 50% du SAM si taux plein, sinon proratisé
  const tauxPlein = trimAcquis >= trimRequis ? 0.50 : 0.50 * (trimAcquis / trimRequis);
  let pensionCnavAnnuelle = sam * tauxPlein;
  if (person.frPensionCnavEstimee && Number(person.frPensionCnavEstimee) > 0) {
    pensionCnavAnnuelle = Number(person.frPensionCnavEstimee) * 12;
  }

  // AGIRC-ARRCO: points × valeur du point (1.4159 € en 2024)
  const points = Number(person.frPointsAgircArrco || 0);
  const valeurPoint = 1.4159;
  const pensionAgircAnnuelle = points * valeurPoint;

  const totalAnnuel = pensionCnavAnnuelle + pensionAgircAnnuelle;

  return {
    pensionCnavAnnuelle: Math.round(pensionCnavAnnuelle),
    pensionCnavMensuelle: Math.round(pensionCnavAnnuelle / 12),
    pensionAgircAnnuelle: Math.round(pensionAgircAnnuelle),
    pensionAgircMensuelle: Math.round(pensionAgircAnnuelle / 12),
    totalAnnuel: Math.round(totalAnnuel),
    totalMensuel: Math.round(totalAnnuel / 12),
    tauxPlein: trimAcquis >= trimRequis,
  };
}

// Synthèse globale d'une personne — Tous revenus retraite confondus (CHF)
function calcSyntheseRetraite(person, hypotheses) {
  const ageDepart = Number(person.objAgeDepart || 65);
  const tauxChange = Number(hypotheses.tauxChangeEurChf || 0.95);

  const avs = calcAVS(person);
  const lpp = calcLPP(person, ageDepart);
  const troisP = calc3eP(person, ageDepart);
  const pensionsFR = calcPensionsFR(person);

  // Conversion pensions FR en CHF
  const pensionsFRChfAnnuelle = pensionsFR.totalAnnuel * tauxChange;
  const pensionsFRChfMensuelle = pensionsFR.totalMensuel * tauxChange;

  // Revenu annuel rente seule (AVS + LPP + pensions FR)
  const revenuRenteAnnuel = avs.renteAnnuelle + lpp.renteAnnuelle + pensionsFRChfAnnuelle;

  // Capital disponible (3e pilier + part LPP en capital éventuelle)
  const partLPPCapital = Number(person.lppPartCapitalPct || 0) / 100;
  const capitalLPPSorti = lpp.capitalAge65 * partLPPCapital;
  const renteLPPAjustee = lpp.renteAnnuelle * (1 - partLPPCapital);
  const revenuRenteAjuste = avs.renteAnnuelle + renteLPPAjustee + pensionsFRChfAnnuelle;

  const capitalTotal = troisP.capitalTotal + capitalLPPSorti;

  // Train de vie souhaité (mensuel CHF)
  const trainVie = Number(person.objTrainVie || 0);
  const objectifAnnuel = trainVie * 12;

  const ecart = objectifAnnuel - revenuRenteAjuste;
  const ecartPct = objectifAnnuel > 0 ? (ecart / objectifAnnuel) * 100 : 0;

  return {
    ageDepart,
    avs,
    lpp,
    troisP,
    pensionsFR,
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

// ────────────────────── STATE INITIAL ──────────────────────

const personneVide = () => ({
  // A - Identité
  prenom: "", nom: "", dateNaissance: "", age: "", nationalite: "Suisse",
  permisG: false, permisType: "",
  statutMatrimonial: "Marié(e)", regimeMatrimonial: "",
  adresse: "", domicileFiscal: "", santeGenerale: "Bonne",

  // C - Pro
  statutPro: "Salarié", employeur: "", tauxOccupation: "100",
  revenusBrut: "", revenusNet: "", dateFinActivite: "",
  autresRevenus: "", revenusFR: "", fluxEpargneMensuel: "",

  // D - AVS
  avsNumero: "", avsAnneesCotisation: "", avsLacunes: "",
  avsCaisse: "", avsRenteEstimee: "", avsAnticipation: false,
  avsAjournement: false, avs13eRente: true, avsCotisationsArretAnticipe: "",

  // E - LPP
  lppCaisse: "", lppAvoirActuel: "", lppCotisationAnnuelle: "",
  lppTauxRendement: "1.25", lppTauxConversion: "5.0",
  lppCapitalProjete: "", lppRenteProjete: "",
  lppLibrePassage: "0", lppAvoirsOublies: false,
  lppPotentielRachat: "", lppRachats3Ans: "0", lppEPL: "0", lppMisesEnGage: "",
  lppChoixSortie: "Mixte", lppPartCapitalPct: "50",
  lppTauxCouverture: "",

  // F - 3e Pilier
  troisPAvoir3a: "", troisPCotisationAnnuelle: "",
  troisPTauxRendement: "3", troisPNbComptes: "1",
  troisPAvoir3b: "", troisPCotisation3b: "",
  troisPStrategieEchelonnement: "",
  troisPClausesBeneficiaires: "",

  // J - Volet français
  frACarriereFrance: false,
  frRegimeBase: "CNAV", frTrimestresAcquis: "", frTrimestresRequis: "172",
  frSAM: "", frAgeTauxPlein: "",
  frPensionCnavEstimee: "", frPointsAgircArrco: "",
  frAutresRegimes: "", frLacunesARegulariser: "",
  frDecisionRetraiteFR: "Accepter",
  frAssuranceMaladie: "LAMal",

  // B - Objectifs (par personne pour simplifier — souvent communs)
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

  // Personnes
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

  // Enfants
  enfants: [
    { prenom: "Lucas", dateNaissance: "14.05.2001", aCharge: true, finEntretien: "2026" },
    { prenom: "Emma", dateNaissance: "08.09.2004", aCharge: true, finEntretien: "2029" }
  ],

  // G - Immobilier (commun au couple)
  immoResidencePrincipaleValeur: "850000",
  immoResidencePrincipaleHypotheque: "320000",
  immoResidencePrincipaleTauxInt: "1.45",
  immoResidencePrincipaleTypeHypo: "Fixe",
  immoAmortissement: "Indirect",
  immoSecondaires: [],
  immoBiensLocatifs: [],
  immoProjets: "Revente de la résidence principale dans 5 ans pour plus petit.",
  immoBiensFrance: "Appartement locatif à Lyon (250k€).",

  // H - Patrimoine financier
  patComptesCourants: "45000", patEpargne: "85000", patDepotsTitres: "125000",
  patCredits: "15000", patLeasings: "0", patParticipations: "0",
  patComptesFrance: "Livret A et LDD",

  // I - Budget
  budCoutVieMensuel: "6500", budAssuranceMaladie: "820",
  budAutresAssurances: "350", budChargeFiscale: "18500",
  budChargesImmo: "12000", budPensionsVersees: "0",

  // K - Fiscalité
  fiscDerniereTaxation: "2024", fiscImpositionSource: true,
  fiscQuasiResident: true, fiscRevenuImposable: "125000",
  fiscFortuneImposable: "350000", fiscImpotsFrance: "2500",

  // L - Risques
  risqueCouvertureDeces: "Capital LPP 250k + 3a 115k",
  risqueCouvertureInvalidite: "Rente 54k/an",
  risqueLacunesConjoint: "Baisse de revenu pour Marie (-60%)",
  risqueClausesBeneficiaires: "Standard",
  risqueLAARetraite: "À souscrire",

  // M - Succession
  succTestament: true, succPacteSuccessoral: false,
  succContratMariage: false, succMandatInaptitude: false,
  succDonations: "30k€ à chaque enfant", succObjectifsTransmission: "Protéger le conjoint en priorité",
  succLoiApplicable: "France",

  // N - Hypothèses validées
  tauxRendement: "3", tauxInflation: "1.5",
  tauxChangeEurChf: "0.95", paysResidenceRetraite: "France",
  scenarios: ["Âge cible", "Arrêt anticipé -3 ans", "Rente vs Capital"],

  // Documents reçus
  docsRecus: {},

  // Conseiller
  conseiller: "Alexandre Dupuis", titreConseiller: "Conseiller Financier",
  telephone: "+41 22 555 12 34", email: "a.dupuis@wallswiss.ch",

  // Notes
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

// ────────────────────── COMPOSANT FIELD RÉUTILISABLE ──────────────────────
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

// ────────────────────── PANNEAU PERSONNE (commun A + C) ──────────────────────
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
      <CheckRow label="Inclure la 13e rente AVS (premier versement décembre 2026)" checked={p.avs13eRente} onChange={(v) => setP({ ...p, avs13eRente: v })} hint="Mécanisme d'ajustement par lequel les rentiers AVS perçoivent une 13e rente annuelle." />
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
        <Icons.Alert size={14} color={C.gold} /> <strong>Attention :</strong> Délai de blocage de 3 ans entre un rachat LPP et un retrait en capital. Vérifier la date des derniers rachats.
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
      <Field label="Stratégie d'échelonnement des retraits 3a (sur plusieurs comptes & années)" value={p.troisPStrategieEchelonnement} onChange={(v) => setP({ ...p, troisPStrategieEchelonnement: v })} textarea />
      <div style={{ fontSize: 11, color: C.gray, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginBottom: 8, marginTop: 16 }}>3b — Libre</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Avoir 3b (assurance-vie libre, valeur de rachat)" value={p.troisPAvoir3b} onChange={(v) => setP({ ...p, troisPAvoir3b: v })} type="number" suffix="CHF" />
        <Field label="Cotisation annuelle 3b en cours" value={p.troisPCotisation3b} onChange={(v) => setP({ ...p, troisPCotisation3b: v })} type="number" suffix="CHF/an" />
      </div>
      <Field label="Clauses bénéficiaires (3a + 3b)" value={p.troisPClausesBeneficiaires} onChange={(v) => setP({ ...p, troisPClausesBeneficiaires: v })} textarea />
    </div>
  );
}

// ────────────────────── PANNEAUX COMMUNS AU FOYER ──────────────────────
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
      <Field label="Biens immobiliers situés en France" value={data.immoBiensFrance} onChange={(v) => u("immoBiensFrance", v)} textarea placeholder="Type, valeur, taxe foncière, IFI éventuel…" />
      <Field label="Projets immobiliers" value={data.immoProjets} onChange={(v) => u("immoProjets", v)} textarea placeholder="Ex: revente RP, achat secondaire en France…" />
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
      <div style={{ background: "rgba(218,41,28,0.05)", padding: 12, marginTop: 12, borderLeft: `4px solid ${C.swiss}`, fontSize: 11, color: C.darkGray }}>
        <Icons.Alert size={14} color={C.swiss} /> <strong>Bi-juridiction :</strong> les règles successorales franco-suisses peuvent différer. Penser au choix explicite de loi applicable.
      </div>
    </div>
  );
}

function PanneauHypotheses({ data, setData }) {
  const u = (k, v) => setData({ ...data, [k]: v });
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Hypothèses de l'étude — à valider avec le client</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Taux de rendement du patrimoine" value={data.tauxRendement} onChange={(v) => u("tauxRendement", v)} type="number" step="0.5" suffix="% /an" />
        <Field label="Taux d'inflation / indexation" value={data.tauxInflation} onChange={(v) => u("tauxInflation", v)} type="number" step="0.1" suffix="% /an" />
        <Field label="Taux de change EUR / CHF retenu" value={data.tauxChangeEurChf} onChange={(v) => u("tauxChangeEurChf", v)} type="number" step="0.01" suffix="CHF par EUR" />
        <Field label="Pays de résidence prévu à la retraite" value={data.paysResidenceRetraite} onChange={(v) => u("paysResidenceRetraite", v)} select={["Suisse", "France", "Autre UE", "Hors UE"]} />
      </div>
      <Field label="Notes du conseiller (profil, priorités, points d'attention)" value={data.notesConseiller} onChange={(v) => u("notesConseiller", v)} textarea />
      <Field label="Points d'attention spécifiques pour le R2" value={data.pointsAttention} onChange={(v) => u("pointsAttention", v)} textarea placeholder="Ex: vérifier rachat LPP &lt; 3 ans, statut quasi-résident, CMU↔LAMal…" />
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

// ────────────────────── WIZARD PRINCIPAL ──────────────────────
function WizardR1({ data, setData, appSettings, onPreview, onSave }) {
  const [step, setStep] = useState(0);

  const setClient = (p) => setData({ ...data, client: p });
  const setConjoint = (p) => setData({ ...data, conjoint: p });

  const labels = [
    "Démarrage", "Identité (A)", "Objectifs (B)", "Professionnel (C)",
    "AVS (D)", "LPP (E)", "3e P (F)", "Immo + Pat. (G+H)",
    "Budget (I)", "France (J)", "Fiscalité (K)", "Risques + Succ. (L+M)",
    "Hypothèses (N)", "Aperçu"
  ];

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div style={S.card}>
            <div style={S.cardTitle}><div style={S.dot} /> Démarrage du R1</div>
            <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.6, marginTop: 0 }}>
              Ce module suit la check-list interne <strong>WallSwiss R1 — Frontaliers / franco-suisses</strong>. Vous allez parcourir 14 sections (A → N) pour collecter l'ensemble des informations nécessaires à la planification de retraite croisée Suisse / France.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Date du rendez-vous" value={data.dateRapport} onChange={(v) => setData({ ...data, dateRapport: v })} type="date" />
            </div>
            <CheckRow label="Couple (saisir aussi le conjoint en parallèle)" checked={data.isCouple} onChange={(v) => setData({ ...data, isCouple: v })} hint="Recommandé si carrière professionnelle, prévoyance ou patrimoine partiellement partagés." />
            <div style={{ background: C.lightGray, padding: 16, marginTop: 16, borderLeft: `4px solid ${C.gold}`, fontSize: 12, color: C.darkGray, lineHeight: 1.6 }}>
              <strong>Confidentialité.</strong> Les données seront utilisées uniquement pour la planification, conservées selon la LPD/RGPD, hébergées chez Google Firestore (région européenne).
            </div>
          </div>
        );
      case 1:
        return (
          <>
            <PanneauIdentite p={data.client} setP={setClient} titre="Client principal" couleur={C.primary} />
            {data.isCouple && <PanneauIdentite p={data.conjoint} setP={setConjoint} titre="Conjoint(e)" couleur={C.gold} />}
            <PanneauEnfants enfants={data.enfants} setEnfants={(e) => setData({ ...data, enfants: e })} />
          </>
        );
      case 2:
        return (
          <>
            <PanneauObjectifs p={data.client} setP={setClient} titre="Objectifs — Client" couleur={C.primary} />
            {data.isCouple && <PanneauObjectifs p={data.conjoint} setP={setConjoint} titre="Objectifs — Conjoint(e)" couleur={C.gold} />}
          </>
        );
      case 3:
        return (
          <>
            <PanneauPro p={data.client} setP={setClient} titre="Pro — Client" couleur={C.primary} />
            {data.isCouple && <PanneauPro p={data.conjoint} setP={setConjoint} titre="Pro — Conjoint(e)" couleur={C.gold} />}
          </>
        );
      case 4:
        return (
          <>
            <PanneauAVS p={data.client} setP={setClient} titre="Client" couleur={C.primary} />
            {data.isCouple && <PanneauAVS p={data.conjoint} setP={setConjoint} titre="Conjoint(e)" couleur={C.gold} />}
          </>
        );
      case 5:
        return (
          <>
            <PanneauLPP p={data.client} setP={setClient} titre="Client" couleur={C.primary} />
            {data.isCouple && <PanneauLPP p={data.conjoint} setP={setConjoint} titre="Conjoint(e)" couleur={C.gold} />}
          </>
        );
      case 6:
        return (
          <>
            <Panneau3eP p={data.client} setP={setClient} titre="Client" couleur={C.primary} />
            {data.isCouple && <Panneau3eP p={data.conjoint} setP={setConjoint} titre="Conjoint(e)" couleur={C.gold} />}
          </>
        );
      case 7:
        return (
          <>
            <PanneauImmobilier data={data} setData={setData} />
            <PanneauPatFinancier data={data} setData={setData} />
          </>
        );
      case 8:
        return <PanneauBudget data={data} setData={setData} />;
      case 9:
        return (
          <>
            <PanneauFR p={data.client} setP={setClient} titre="Client" couleur={C.france} />
            {data.isCouple && <PanneauFR p={data.conjoint} setP={setConjoint} titre="Conjoint(e)" couleur={C.france} />}
          </>
        );
      case 10:
        return <PanneauFiscalite data={data} setData={setData} />;
      case 11:
        return (
          <>
            <PanneauRisques data={data} setData={setData} />
            <PanneauSuccession data={data} setData={setData} />
          </>
        );
      case 12:
        return (
          <>
            <PanneauHypotheses data={data} setData={setData} />
            <PanneauConseiller data={data} setData={setData} appSettings={appSettings} />
          </>
        );
      case 13:
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
            padding: "8px 10px",
            fontSize: 10,
            fontWeight: step === i ? 700 : 600,
            color: step === i ? C.white : step > i ? C.primary : C.gray,
            background: step === i ? C.primary : step > i ? "rgba(105,33,2,0.06)" : C.white,
            border: `1px solid ${step === i ? C.primary : step > i ? "rgba(105,33,2,0.1)" : C.mediumGray}`,
            cursor: "pointer",
            letterSpacing: "0.04em",
            transition: "all 0.2s",
            whiteSpace: "nowrap"
          }}>
            {i + 1}. {l}
          </div>
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

  return (
    <div style={S.card}>
      <div style={S.cardTitle}><div style={S.dot} /> Synthèse rapide avant génération</div>

      <div style={{ display: "grid", gridTemplateColumns: data.isCouple ? "1fr 1fr" : "1fr", gap: 16, marginBottom: 16 }}>
        <CarteSynthese titre={`${data.client.prenom} ${data.client.nom}`.trim() || "Client"} synth={synthClient} couleur={C.primary} />
        {data.isCouple && <CarteSynthese titre={`${data.conjoint.prenom} ${data.conjoint.nom}`.trim() || "Conjoint(e)"} synth={synthConjoint} couleur={C.gold} />}
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
  const ecartColor = synth.ecart > 0 ? "#EF4444" : "#10B981";
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
          <Field label="Lacunes à régulariser (salaires, trimestres, France Travail)" value={p.frLacunesARegulariser} onChange={(v) => setP({ ...p, frLacunesARegulariser: v })} textarea />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Décision retraite française" value={p.frDecisionRetraiteFR} onChange={(v) => setP({ ...p, frDecisionRetraiteFR: v })} select={["Accepter", "Différer", "Refuser"]} />
            <Field label="Stratégie assurance maladie à la retraite" value={p.frAssuranceMaladie} onChange={(v) => setP({ ...p, frAssuranceMaladie: v })} select={["LAMal maintenue", "CMU + CSG/CRDS", "À déterminer"]} />
          </div>
        </>
      )}
    </div>
  );
}


// ────────────────────── SLIDES PDF — FORMAT A4 PORTRAIT ──────────────────────
// Dimensions A4 à 96 DPI : 794 × 1123 px.

const PAGE_W = 794;
const PAGE_H = 1123;

const pageBase = {
  width: `${PAGE_W}px`,
  height: `${PAGE_H}px`,
  position: "relative",
  overflow: "hidden",
  fontFamily: "'Montserrat', sans-serif",
  background: C.white,
  textAlign: "left",
  boxSizing: "border-box",
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

// ─── Slide 1 — Couverture ──────────────────────
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

// ─── Slide 2 — Profil & Objectifs ──────────────
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
              <strong style={{ color: C.primary }}>Projets spécifiques :</strong> {c.objProjets}
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

// ─── Slide 3 — Vue d'ensemble (objectif vs projeté) ──────────────
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
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 2</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Votre <em style={{ color: C.gold }}>retraite</em> en un coup d'œil</div>
        </div>
        <div style={{ background: C.primary, color: C.white, padding: 24, marginBottom: 16 }}>
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
          <div style={{ background: "#FEF3F2", borderLeft: `4px solid #EF4444`, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <Icons.Alert size={20} color="#EF4444" />
            <div style={{ fontSize: 12, color: "#991B1B" }}>
              <strong>Écart constaté :</strong> il manque <strong>CHF {fmt(Math.abs(synthClient.ecartMensuel))} / mois</strong> ({synthClient.ecartPct}%) pour atteindre votre objectif. Des leviers d'optimisation sont présentés plus loin.
            </div>
          </div>
        )}
        {synthClient.ecart <= 0 && synthClient.objectifMensuel > 0 && (
          <div style={{ background: "#F0FDF4", borderLeft: `4px solid #10B981`, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <Icons.Check size={20} color="#10B981" />
            <div style={{ fontSize: 12, color: "#065F46" }}>
              <strong>Objectif atteint :</strong> votre revenu projeté couvre votre train de vie cible avec un <strong>excédent de CHF {fmt(Math.abs(synthClient.ecartMensuel))} / mois</strong>.
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

// ─── Slide 4 — Détail AVS (1er pilier) ──────────────
function SlideAVS({ data, num }) {
  const avsC = calcAVS(data.client);
  const avsCJ = data.isCouple ? calcAVS(data.conjoint) : null;
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="1er Pilier — AVS" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.swiss}`, paddingLeft: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: C.swiss, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Volet Suisse · Section 3</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Le <em style={{ color: C.swiss }}>1er pilier</em> — Prévoyance étatique (AVS)</div>
        </div>
        <p style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.6, marginBottom: 24, textAlign: "justify" }}>
          L'AVS couvre les besoins vitaux à la retraite. Une carrière complète exige <strong>44 années de cotisation</strong>. La rente maximale 2026 s'élève à environ <strong>CHF 2'520 / mois</strong> et la minimale à <strong>CHF 1'260 / mois</strong>. Dès <strong>décembre 2026</strong>, une <strong>13e rente AVS</strong> sera versée chaque année.
        </p>
        <CartePilier titre={`${data.client.prenom} ${(data.client.nom || "").toUpperCase()}`} couleur={C.primary} data={[
          ["N° AVS", data.client.avsNumero || "—"],
          ["Caisse de compensation", data.client.avsCaisse || "—"],
          ["Années cotisées", `${data.client.avsAnneesCotisation || 0} / 44`],
          ["Taux de complétion", `${Math.round(avsC.tauxCompletion * 100)}%`],
          ["Rente mensuelle estimée", `CHF ${fmt(avsC.renteMensuelle)} /mois`],
          ["13e rente annuelle", data.client.avs13eRente ? `CHF ${fmt(avsC.treizieme)}` : "Non incluse"],
          ["Rente annuelle totale", `CHF ${fmt(avsC.renteAnnuelle)} /an`],
          ["Lacunes signalées", data.client.avsLacunes || "Aucune"]
        ]} />
        {data.isCouple && avsCJ && (
          <div style={{ marginTop: 16 }}>
            <CartePilier titre={`${data.conjoint.prenom} ${(data.conjoint.nom || "").toUpperCase()}`} couleur={C.gold} data={[
              ["Années cotisées", `${data.conjoint.avsAnneesCotisation || 0} / 44`],
              ["Rente mensuelle estimée", `CHF ${fmt(avsCJ.renteMensuelle)} /mois`],
              ["Rente annuelle totale", `CHF ${fmt(avsCJ.renteAnnuelle)} /an`]
            ]} />
          </div>
        )}
        <div style={{ marginTop: 16, background: C.lightGray, padding: 14, borderLeft: `4px solid ${C.swiss}`, fontSize: 11, color: C.darkGray, lineHeight: 1.6 }}>
          <strong>Points d'attention :</strong> Pour préserver vos droits, les éventuelles lacunes (jeunesse, périodes à l'étranger) doivent être identifiées. Une demande de <strong>relevé du compte individuel (CI)</strong> auprès de la Caisse cantonale de compensation permet de valider les périodes prises en compte.
        </div>
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

// ─── Slide 5 — Détail LPP avec graphique de capitalisation ──────────────
function SlideLPP({ data, num }) {
  const lpp = calcLPP(data.client, Number(data.client.objAgeDepart || 65));
  const age = Number(data.client.age || 40);
  const ageDepart = Number(data.client.objAgeDepart || 65);
  const annees = Math.max(1, ageDepart - age);
  const avoirActuel = Number(data.client.lppAvoirActuel || 0);
  const cotis = Number(data.client.lppCotisationAnnuelle || 0);
  const taux = Number(data.client.lppTauxRendement || 1.25) / 100;

  // Points de capitalisation
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
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Le <em style={{ color: C.primary }}>2e pilier</em> — Prévoyance professionnelle</div>
        </div>
        <p style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.6, marginBottom: 16, textAlign: "justify" }}>
          La LPP vise le maintien de votre niveau de vie. Avec l'AVS, elle représente en moyenne <strong>60% de votre dernier salaire</strong>. Le <strong>taux de conversion</strong> appliqué à votre capital de retraite définit votre rente annuelle.
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
          <div style={{ fontSize: 11, color: C.gray, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, textAlign: "center" }}>Évolution projetée de votre capital LPP</div>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 11 }}>
          <div style={{ background: C.lightGray, padding: 12 }}>
            <div style={{ color: C.gray, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Choix de sortie</div>
            <div style={{ color: C.primaryDark, fontWeight: 700, fontSize: 13 }}>{data.client.lppChoixSortie} {data.client.lppChoixSortie === "Mixte" && `(${data.client.lppPartCapitalPct}% capital)`}</div>
          </div>
          <div style={{ background: C.lightGray, padding: 12 }}>
            <div style={{ color: C.gray, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Potentiel de rachat</div>
            <div style={{ color: C.primaryDark, fontWeight: 700, fontSize: 13 }}>CHF {fmt(data.client.lppPotentielRachat)}</div>
          </div>
        </div>
        {Number(data.client.lppRachats3Ans) > 0 && (
          <div style={{ marginTop: 12, background: "#FEF3F2", borderLeft: `4px solid #EF4444`, padding: "10px 14px", fontSize: 11, color: "#991B1B" }}>
            <strong>Délai de blocage :</strong> Vous avez effectué CHF {fmt(data.client.lppRachats3Ans)} de rachats sur les 3 dernières années — un retrait en capital sera bloqué pendant cette période.
          </div>
        )}
      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ─── Slide 6 — Détail 3e Pilier ──────────────
function Slide3eP({ data, num }) {
  const tp = calc3eP(data.client, Number(data.client.objAgeDepart || 65));
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="3e Pilier — Prévoyance privée" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Volet Suisse · Section 5</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Le <em style={{ color: C.gold }}>3e pilier</em> — Pour combler les lacunes</div>
        </div>
        <p style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.6, marginBottom: 24, textAlign: "justify" }}>
          Le 3e pilier complète le 1er et 2e pour viser <strong>100% de votre revenu d'actif</strong>. Le pilier 3A permet en plus de réduire chaque année votre revenu imposable. Le plafond 2026 (avec caisse de pension) est de <strong>CHF 7'258</strong>.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${C.gold}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.gold, fontWeight: 800, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>3a — Lié (fiscalement déductible)</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.primaryDark, marginBottom: 4 }}>CHF {fmt(tp.capital3a)}</div>
            <div style={{ fontSize: 11, color: C.gray }}>Projection à {data.client.objAgeDepart} ans</div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.lightGray}`, fontSize: 11, color: C.darkGray, lineHeight: 1.6 }}>
              <div>Avoir actuel : <strong>CHF {fmt(data.client.troisPAvoir3a)}</strong></div>
              <div>Cotisation : <strong>CHF {fmt(data.client.troisPCotisationAnnuelle)} /an</strong></div>
              <div>Nb comptes : <strong>{data.client.troisPNbComptes || 1}</strong></div>
            </div>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${C.darkGray}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.darkGray, fontWeight: 800, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>3b — Libre (flexible)</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.primaryDark, marginBottom: 4 }}>CHF {fmt(tp.capital3b)}</div>
            <div style={{ fontSize: 11, color: C.gray }}>Projection à {data.client.objAgeDepart} ans</div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.lightGray}`, fontSize: 11, color: C.darkGray, lineHeight: 1.6 }}>
              <div>Avoir actuel : <strong>CHF {fmt(data.client.troisPAvoir3b)}</strong></div>
              <div>Cotisation : <strong>CHF {fmt(data.client.troisPCotisation3b)} /an</strong></div>
            </div>
          </div>
        </div>
        <div style={{ background: C.primary, color: C.white, padding: 18, marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Capital 3e pilier total projeté</div>
          <div style={{ fontSize: 30, fontWeight: 900 }}>CHF {fmt(tp.capitalTotal)}</div>
        </div>
        {data.client.troisPStrategieEchelonnement && (
          <div style={{ background: C.lightGray, padding: 14, borderLeft: `4px solid ${C.gold}`, fontSize: 11, color: C.darkGray, lineHeight: 1.6 }}>
            <strong style={{ color: C.gold }}>Stratégie d'échelonnement des retraits 3a :</strong> {data.client.troisPStrategieEchelonnement}
          </div>
        )}
      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ─── Slide 7 — Volet français ──────────────
function SlideFR({ data, num }) {
  if (!data.client.frACarriereFrance) {
    return (
      <div style={pageBase}>
        <PageHeader data={data} num={num} titreSection="Volet français" />
        <div style={{ padding: "120px 50px 60px", height: "100%", boxSizing: "border-box" }}>
          <div style={{ background: C.lightGray, padding: 60, textAlign: "center", borderLeft: `4px solid ${C.france}` }}>
            <div style={{ fontSize: 14, color: C.darkGray }}>Aucune carrière professionnelle française renseignée pour le client.</div>
          </div>
        </div>
        <PageFooter data={data} />
      </div>
    );
  }
  const fr = calcPensionsFR(data.client);
  const tauxChange = Number(data.tauxChangeEurChf || 0.95);

  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Volet français" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.france}`, paddingLeft: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: C.france, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Volet France · Section 6</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Vos <em style={{ color: C.france }}>pensions françaises</em></div>
        </div>
        <p style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.6, marginBottom: 24, textAlign: "justify" }}>
          Grâce à la convention de sécurité sociale franco-suisse et aux règlements UE, vos périodes d'activité française sont totalisées pour ouvrir vos droits à pension. Deux régimes principaux : la <strong>{data.client.frRegimeBase}</strong> (base) et l'<strong>AGIRC-ARRCO</strong> (complémentaire).
        </p>
        <div style={{ background: fr.tauxPlein ? "#F0FDF4" : "#FEF3F2", borderLeft: `4px solid ${fr.tauxPlein ? "#10B981" : "#F59E0B"}`, padding: 14, marginBottom: 16, fontSize: 12, color: C.darkGray }}>
          <strong>{fr.tauxPlein ? "✓ Taux plein atteint" : "⚠ Taux plein non atteint"}</strong> — Trimestres acquis : <strong>{data.client.frTrimestresAcquis}</strong> sur <strong>{data.client.frTrimestresRequis}</strong> requis ({((Number(data.client.frTrimestresAcquis || 0) / Number(data.client.frTrimestresRequis || 172)) * 100).toFixed(1)}%).
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${C.france}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.france, fontWeight: 800, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Régime de base — {data.client.frRegimeBase}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.primaryDark, marginBottom: 4 }}>{fmtEUR(fr.pensionCnavMensuelle)} €<span style={{ fontSize: 11, fontWeight: 500, color: C.gray }}> /mois</span></div>
            <div style={{ fontSize: 11, color: C.gray }}>SAM retenu : {fmtEUR(data.client.frSAM)} € /an</div>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderTop: `4px solid ${C.france}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.france, fontWeight: 800, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>AGIRC-ARRCO (complémentaire)</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.primaryDark, marginBottom: 4 }}>{fmtEUR(fr.pensionAgircMensuelle)} €<span style={{ fontSize: 11, fontWeight: 500, color: C.gray }}> /mois</span></div>
            <div style={{ fontSize: 11, color: C.gray }}>Points : {fmtEUR(data.client.frPointsAgircArrco)} × 1.4159 €</div>
          </div>
        </div>
        <div style={{ background: C.france, color: C.white, padding: 18, marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Total pensions FR</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{fmtEUR(fr.totalMensuel)} € /mois</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Équivalent CHF (×{tauxChange})</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>CHF {fmt(fr.totalMensuel * tauxChange)} /mois</div>
          </div>
        </div>
        <div style={{ background: C.lightGray, padding: 14, fontSize: 11, color: C.darkGray, lineHeight: 1.6, borderLeft: `4px solid ${C.france}` }}>
          <strong>Stratégies retenues :</strong>
          <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
            <li>Retraite française : <strong>{data.client.frDecisionRetraiteFR}</strong></li>
            <li>Assurance maladie à la retraite : <strong>{data.client.frAssuranceMaladie}</strong></li>
            <li>Pays de résidence prévu : <strong>{data.paysResidenceRetraite}</strong></li>
          </ul>
        </div>
        {data.client.frLacunesARegulariser && (
          <div style={{ marginTop: 12, background: "#FEF3F2", borderLeft: `4px solid #F59E0B`, padding: "10px 14px", fontSize: 11, color: "#92400E" }}>
            <strong>Lacunes à régulariser :</strong> {data.client.frLacunesARegulariser}
          </div>
        )}
      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ─── Slide 8 — Patrimoine global ──────────────
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
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 7</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Votre <em style={{ color: C.gold }}>patrimoine</em> aujourd'hui</div>
        </div>
        <div style={{ background: C.primary, color: C.white, padding: 22, textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Fortune nette estimée (projection retraite)</div>
          <div style={{ fontSize: 36, fontWeight: 900 }}>CHF {fmt(fortuneTotale)}</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <tbody>
            <LignePat label="Immobilier — Résidence principale (valeur)" valeur={immoBrut} pos />
            <LignePat label="Immobilier — Hypothèque restante" valeur={-hypo} />
            <LignePat label="Immobilier net" valeur={immoNet} pos bold />
            <LignePat label="Comptes & épargne (liquide)" valeur={liq} pos />
            <LignePat label="Portefeuille titres" valeur={titres} pos />
            <LignePat label="Capital LPP projeté" valeur={lpp.capitalAge65} pos />
            <LignePat label="Capital 3e pilier projeté" valeur={tp.capitalTotal} pos />
            <LignePat label="Crédits / Leasings" valeur={-credits} />
          </tbody>
        </table>
        {data.immoBiensFrance && (
          <div style={{ marginTop: 16, background: C.lightGray, padding: 14, borderLeft: `4px solid ${C.france}`, fontSize: 11, color: C.darkGray, lineHeight: 1.6 }}>
            <strong style={{ color: C.france }}>Biens immobiliers en France :</strong> {data.immoBiensFrance}
          </div>
        )}
        {data.patComptesFrance && (
          <div style={{ marginTop: 12, background: C.lightGray, padding: 14, borderLeft: `4px solid ${C.france}`, fontSize: 11, color: C.darkGray, lineHeight: 1.6 }}>
            <strong style={{ color: C.france }}>Comptes & placements en France :</strong> {data.patComptesFrance}
          </div>
        )}
      </div>
      <PageFooter data={data} />
    </div>
  );
}

function LignePat({ label, valeur, pos = false, bold = false }) {
  return (
    <tr style={{ borderBottom: `1px solid ${C.lightGray}`, background: bold ? "rgba(105,33,2,0.04)" : "transparent" }}>
      <td style={{ padding: "10px 0", color: bold ? C.primary : C.darkGray, fontWeight: bold ? 700 : 500 }}>{label}</td>
      <td style={{ padding: "10px 0", textAlign: "right", color: valeur < 0 ? "#EF4444" : C.primary, fontWeight: bold ? 900 : 700 }}>{valeur < 0 ? "- " : ""}CHF {fmt(Math.abs(valeur))}</td>
    </tr>
  );
}

// ─── Slide 9 — Leviers & axes de travail ──────────────
function SlideLeviers({ data, num }) {
  const synth = calcSyntheseRetraite(data.client, data);
  const leviers = [];

  if (synth.ecart > 0) {
    leviers.push({ titre: "Combler l'écart de revenu", desc: `Il manque CHF ${fmt(synth.ecartMensuel)} /mois pour atteindre votre train de vie cible de CHF ${fmt(synth.objectifMensuel)}.`, action: "Plusieurs leviers à modéliser ci-dessous." });
  }
  if (Number(data.client.lppPotentielRachat) > 0) {
    leviers.push({ titre: "Rachat LPP", desc: `Potentiel de rachat identifié : CHF ${fmt(data.client.lppPotentielRachat)}.`, action: "Optimisation fiscale immédiate (déduction du revenu imposable) et amélioration de la rente future." });
  }
  if (Number(data.client.troisPCotisationAnnuelle || 0) < 7258) {
    const manque = 7258 - Number(data.client.troisPCotisationAnnuelle || 0);
    leviers.push({ titre: "Maximiser le 3a", desc: `Vous cotisez CHF ${fmt(data.client.troisPCotisationAnnuelle)} par an. Plafond 2026 : CHF 7'258.`, action: `Augmenter de CHF ${fmt(manque)} /an pour optimiser la déduction fiscale.` });
  }
  if (data.client.frACarriereFrance && !calcPensionsFR(data.client).tauxPlein) {
    leviers.push({ titre: "Atteindre le taux plein FR", desc: "Vos trimestres acquis sont en-dessous du seuil requis.", action: "Étudier la régularisation des périodes manquantes ou différer la liquidation pour limiter la décote." });
  }
  if (data.client.lppAvoirsOublies) {
    leviers.push({ titre: "Recherche d'avoirs LPP oubliés", desc: "Vous avez identifié un risque d'avoirs oubliés.", action: "Demande à la Centrale du 2e pilier et Fondation institution supplétive — service WallSwiss dédié." });
  }
  if (Number(data.client.objAgeDepart || 65) < 65) {
    leviers.push({ titre: "Arrêt anticipé", desc: `Vous visez un départ à ${data.client.objAgeDepart} ans, soit avant l'âge de référence.`, action: "Anticiper les cotisations AVS sans activité lucrative et l'impact sur la rente (-6.8% /an d'anticipation)." });
  }
  if (Number(data.client.lppRachats3Ans) > 0) {
    leviers.push({ titre: "Délai de blocage LPP", desc: `Vous avez effectué CHF ${fmt(data.client.lppRachats3Ans)} de rachats récents.`, action: "Un retrait en capital sera bloqué pendant 3 ans — sécuriser le calendrier." });
  }

  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Leviers & axes de travail" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 8</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Vos <em style={{ color: C.gold }}>leviers</em> d'optimisation</div>
        </div>
        <p style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.6, marginBottom: 20 }}>
          Sur la base de votre situation, voici les axes prioritaires à modéliser en détail lors du second rendez-vous (R2).
        </p>
        {leviers.length === 0 ? (
          <div style={{ background: C.lightGray, padding: 40, textAlign: "center", color: C.gray, fontStyle: "italic" }}>
            Aucun levier critique identifié à ce stade. La situation paraît équilibrée.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {leviers.slice(0, 6).map((l, i) => (
              <div key={i} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, borderLeft: `4px solid ${C.gold}`, padding: 16, display: "flex", gap: 16 }}>
                <div style={{ background: C.primary, color: C.white, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.primaryDark, marginBottom: 4 }}>{l.titre}</div>
                  <div style={{ fontSize: 11, color: C.gray, marginBottom: 6, lineHeight: 1.5 }}>{l.desc}</div>
                  <div style={{ fontSize: 11, color: C.darkGray, lineHeight: 1.5 }}><strong style={{ color: C.gold }}>Action :</strong> {l.action}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ─── Slide 10 — Hypothèses validées ──────────────
function SlideHypotheses({ data, num }) {
  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Hypothèses de l'étude" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 9</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Les <em style={{ color: C.gold }}>hypothèses</em> retenues</div>
        </div>
        <p style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.6, marginBottom: 24, textAlign: "justify" }}>
          Toute projection repose sur un cadre d'hypothèses. Ces paramètres ont été <strong>discutés et validés ensemble</strong> lors de notre rendez-vous. Ils sont déterminants pour les chiffres présentés et peuvent être ajustés selon vos préférences.
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 24 }}>
          <thead>
            <tr style={{ background: C.primary, color: C.white }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Hypothèse</th>
              <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>Valeur retenue</th>
            </tr>
          </thead>
          <tbody>
            <LigneHypo label="Taux de rendement du patrimoine" valeur={`${data.tauxRendement} % /an`} />
            <LigneHypo label="Taux d'inflation / indexation" valeur={`${data.tauxInflation} % /an`} />
            <LigneHypo label="Taux de change EUR / CHF" valeur={`${data.tauxChangeEurChf} CHF par 1 €`} />
            <LigneHypo label="Pays de résidence prévu à la retraite" valeur={data.paysResidenceRetraite} />
            <LigneHypo label="Âge de fin de consommation du patrimoine" valeur={`${data.client.objAgeFinConsommation || 90} ans`} />
            <LigneHypo label="Inclusion de la 13e rente AVS" valeur={data.client.avs13eRente ? "Oui (dès déc. 2026)" : "Non"} />
          </tbody>
        </table>
        <div style={{ background: C.lightGray, padding: 16, borderLeft: `4px solid ${C.primary}` }}>
          <div style={{ fontSize: 11, color: C.primary, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Scénarios à modéliser au R2</div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 12, color: C.darkGray, lineHeight: 1.8 }}>
            {(data.scenarios || []).map((s, i) => (
              <li key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: C.gold, fontWeight: 900 }}>✓</span> {s}
              </li>
            ))}
          </ul>
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

// ─── Slide 11 — Documents à fournir ──────────────
function SlideDocuments({ data, num }) {
  const docsSuisse = [
    "Pièce d'identité et permis de séjour (G)",
    "Certificat AVS + extrait du compte individuel (CI)",
    "Certificat de prévoyance LPP le plus récent + règlement de la caisse",
    "Attestation du potentiel de rachat LPP",
    "Attestations des comptes / polices de libre-passage",
    "Relevés et attestations 3a (banque + assurance) avec valeurs de rachat",
    "Polices d'assurance-vie 3b",
    "Fiches de salaire récentes (3 derniers mois) + dernier certificat de salaire",
    "Dernière déclaration d'impôt et décision de taxation",
    "Contrats hypothécaires et décomptes d'intérêts",
    "Estimations ou actes des biens immobiliers",
    "Baux et décomptes de charges des biens locatifs",
    "Relevés bancaires (comptes et dépôts-titres)",
    "Contrats de crédit / leasing",
    "Police d'assurance maladie",
    "Testament, pacte successoral ou contrat de mariage (le cas échéant)",
  ];
  const docsFrance = [
    "Relevé de carrière / RIS (régime de base)",
    "Relevé de points AGIRC-ARRCO (et IRCANTEC le cas échéant)",
    "Bulletins de salaire et attestations France Travail pour les périodes manquantes",
    "Avis d'imposition français",
    "Décompte d'impôt à la source / justificatif de quasi-résident",
  ];

  return (
    <div style={pageBase}>
      <PageHeader data={data} num={num} titreSection="Documents à fournir" />
      <div style={{ padding: "100px 50px 60px", height: "100%", boxSizing: "border-box" }}>
        <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Section 10 — Préparation du R2</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>Les <em style={{ color: C.gold }}>documents</em> à transmettre</div>
        </div>
        <p style={{ fontSize: 11, color: C.darkGray, lineHeight: 1.5, marginBottom: 16 }}>
          Cette liste vous permet de réunir tous les éléments justificatifs avant le 2e rendez-vous. Vous pouvez nous les transmettre par e-mail ou via votre espace client sécurisé.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ background: C.swiss, color: C.white, padding: "8px 12px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Volet suisse</div>
            {docsSuisse.map((d, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.lightGray}`, fontSize: 10.5, color: C.darkGray }}>
                <div style={{ width: 12, height: 12, border: `1.5px solid ${C.swiss}`, flexShrink: 0, marginTop: 1 }} />
                <span>{d}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ background: C.france, color: C.white, padding: "8px 12px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Volet français</div>
            {docsFrance.map((d, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.lightGray}`, fontSize: 10.5, color: C.darkGray }}>
                <div style={{ width: 12, height: 12, border: `1.5px solid ${C.france}`, flexShrink: 0, marginTop: 1 }} />
                <span>{d}</span>
              </div>
            ))}
            <div style={{ background: C.lightGray, padding: 12, marginTop: 16, fontSize: 10, color: C.gray, lineHeight: 1.5, borderLeft: `3px solid ${C.gold}` }}>
              <strong>Astuce :</strong> Le relevé de carrière (RIS) est téléchargeable depuis votre compte personnel sur <strong>info-retraite.fr</strong>.
            </div>
          </div>
        </div>
      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ─── Slide 12 — Contact final ──────────────
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
          <div style={{ fontSize: 12, color: C.gray, marginBottom: 24, textTransform: "uppercase", letterSpacing: "0.05em" }}>{data.titreConseiller}</div>
          <div style={{ height: 1, background: C.lightGray, marginBottom: 20 }} />
          <div style={{ fontSize: 13, color: C.darkGray, lineHeight: 2 }}>
            <div><strong style={{ color: C.gray }}>T</strong>&nbsp;&nbsp;{data.telephone || "—"}</div>
            <div><strong style={{ color: C.gray }}>E</strong>&nbsp;&nbsp;{data.email || "—"}</div>
            <div><strong style={{ color: C.gray }}>A</strong>&nbsp;&nbsp;WallSwiss · Nyon, Suisse</div>
          </div>
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
      <div style={{ padding: "80px 50px 50px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ background: C.white, width: 64, height: 64, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <img src={LOGO_URL} alt="WallSwiss" className="pdf-image" style={{ width: 36, height: 36, objectFit: "contain" }} />
          </div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, color: C.primary, fontWeight: 700, margin: 0 }}>WallSwiss</div>
          <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 6 }}>L'excellence patrimoniale franco-suisse</div>
        </div>

        <div style={{ background: C.white, padding: 20, borderLeft: `4px solid ${C.primary}`, boxShadow: "0 4px 16px rgba(0,0,0,0.04)", marginBottom: 20 }}>
          <p style={{ fontSize: 11.5, color: C.darkGray, lineHeight: 1.6, margin: 0, textAlign: "justify" }}>
            Spécialistes de la planification financière et successorale pour les frontaliers et résidents suisses, nous vous accompagnons dans la structuration globale de votre patrimoine. Forts d'une maîtrise pointue des réglementations croisées franco-suisses, nous transformons la complexité juridique et fiscale en opportunités concrètes. Notre mission : vous offrir une vision claire, optimiser vos flux financiers, protéger vos proches et pérenniser vos actifs avec une sérénité totale.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 14 }}>
            <div style={{ fontSize: 11, color: C.primary, fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}><Icons.Users size={16} color={C.gold} /> Double Compétence</div>
            <div style={{ fontSize: 10, color: C.gray, lineHeight: 1.5 }}>Maîtrise exhaustive des systèmes de prévoyance (AVS/LPP vs CNAV/AGIRC-ARRCO) et de la fiscalité (impôt source, quasi-résident, IFI) pour éviter la double imposition.</div>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 14 }}>
            <div style={{ fontSize: 11, color: C.primary, fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}><Icons.Check size={16} color={C.gold} /> Indépendance Absolue</div>
            <div style={{ fontSize: 10, color: C.gray, lineHeight: 1.5 }}>Libres de toute attache bancaire ou assurantielle, nous opérons en architecture ouverte. Nous sélectionnons les meilleures solutions du marché dans votre seul intérêt.</div>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 14 }}>
            <div style={{ fontSize: 11, color: C.primary, fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}><Icons.Eye size={16} color={C.gold} /> Ingénierie Patrimoniale</div>
            <div style={{ fontSize: 10, color: C.gray, lineHeight: 1.5 }}>De la structuration immobilière (SCI, démembrement) à l'optimisation successorale transfrontalière (choix de loi applicable, donations), nous couvrons tous vos enjeux.</div>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 14 }}>
            <div style={{ fontSize: 11, color: C.primary, fontWeight: 800, textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}><Icons.Alert size={16} color={C.gold} /> Suivi & Pérennité</div>
            <div style={{ fontSize: 10, color: C.gray, lineHeight: 1.5 }}>Le cadre légal évolue sans cesse. Nous assurons une veille réglementaire active et adaptons pro-activement votre stratégie à chaque étape de votre vie.</div>
          </div>
        </div>

        <div style={{ flex: 1, background: C.primary, color: C.white, padding: "16px 20px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -20, top: -20, opacity: 0.05, transform: "scale(2)" }}>
            <Icons.Check size={120} />
          </div>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12, textAlign: "center", position: "relative", zIndex: 2 }}>Notre accompagnement de A à Z</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, position: "relative", zIndex: 2 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 16, color: C.gold, fontWeight: 900 }}>1.</div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>Audit (R1)</div>
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>Cartographie complète de votre patrimoine, droits de prévoyance et objectifs de vie.</div>
            </div>
            <div style={{ color: C.gold, marginTop: 4 }}>→</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 16, color: C.gold, fontWeight: 900 }}>2.</div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>Stratégie (R2)</div>
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>Modélisation mathématique des scénarios, identification des leviers et recommandations.</div>
            </div>
            <div style={{ color: C.gold, marginTop: 4 }}>→</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 16, color: C.gold, fontWeight: 900 }}>3.</div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>Action & Suivi</div>
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>Implémentation des solutions, aide aux démarches et bilan de révision annuel.</div>
            </div>
          </div>
        </div>

      </div>
      <PageFooter data={data} />
    </div>
  );
}

// ────────────────────── MODALE D'APERÇU + GÉNÉRATION PDF ──────────────────────

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
  } catch (error) {
    return url;
  }
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
    <SlideProfil data={data} num="01" />,
    <SlideVueEnsemble data={data} num="02" />,
    <SlideAVS data={data} num="03" />,
    <SlideLPP data={data} num="04" />,
    <Slide3eP data={data} num="05" />,
    <SlideFR data={data} num="06" />,
    <SlidePatrimoine data={data} num="07" />,
    <SlideLeviers data={data} num="08" />,
    <SlideHypotheses data={data} num="09" />,
    <SlideDocuments data={data} num="10" />,
    <SlideContact data={data} num="11" />,
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
      if (!html2canvas || !jsPDFClass) throw new Error("html2canvas/jsPDF non disponibles");

      const pages = element.querySelectorAll('.pdf-page');
      const pdfW = PAGE_W / 96; // pouces
      const pdfH = PAGE_H / 96;
      const pdf = new jsPDFClass({ unit: 'in', format: [pdfW, pdfH], orientation: 'portrait' });

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: PAGE_W,
          height: PAGE_H,
          windowWidth: PAGE_W,
          windowHeight: PAGE_H,
          logging: false,
        });
        const img = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage([pdfW, pdfH], 'portrait');
        pdf.addImage(img, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST');
      }
      pdf.save(pdfFilename);
    } catch (e) {
      console.error("Erreur PDF:", e);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const openEmailModal = () => {
    const fullName = data.isCouple ? `${data.client.prenom} ${(data.client.nom || "").toUpperCase()} & ${data.conjoint.prenom}` : `${data.client.prenom} ${(data.client.nom || "").toUpperCase()}`;
    setEmailForm({
      to: data.client.emailClient || "",
      subject: `Votre planification retraite — WallSwiss`,
      body: `Bonjour ${data.client.prenom || ""},\n\nVeuillez trouver ci-joint votre rapport de planification retraite, préparé suite à notre rendez-vous du ${new Date(data.dateRapport).toLocaleDateString('fr-FR')}.\n\nN'hésitez pas à me contacter pour toute question avant le R2.\n\nBien à vous,\n${data.conseiller}`
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
      if (!html2canvas || !jsPDFClass) throw new Error("html2canvas/jsPDF non disponibles");

      const pages = element.querySelectorAll('.pdf-page');
      const pdfW = PAGE_W / 96;
      const pdfH = PAGE_H / 96;
      const pdf = new jsPDFClass({ unit: 'in', format: [pdfW, pdfH], orientation: 'portrait' });

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 1.5,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: PAGE_W,
          height: PAGE_H,
          windowWidth: PAGE_W,
          windowHeight: PAGE_H,
          logging: false,
        });
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
    } catch (e) {
      console.error(e);
      alert("Erreur d'envoi : " + e.message);
    } finally {
      setIsEmailing(false);
    }
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
          <button onClick={openEmailModal} disabled={isEmailing} style={{ background: emailSuccess ? "#10B981" : C.gold, color: C.white, border: "none", padding: "6px 12px", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
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

      {/* Bloc caché pour la génération PDF */}
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
          <div style={{ fontSize: 12, color: C.gray, marginTop: 8 }}>Connexion au webhook Make.com</div>
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

// ────────────────────── COMPOSANT PRINCIPAL EXPORTÉ ──────────────────────

export default function RetraiteR1Module({ user, db, appId, appSettings }) {
  const [page, setPage] = useState("dashboard"); // dashboard | create
  const [data, setData] = useState(stateInitial());
  const [preview, setPreview] = useState(null);
  const [planifs, setPlanifs] = useState([]);

  // Charger les planifications depuis Firebase
  useEffect(() => {
    if (!user || !db) return;
    const ref = collection(db, 'artifacts', appId, 'public', 'data', 'planifications_retraite');
    const unsub = onSnapshot(ref, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      // Filtre par agent sauf admin
      const adminEmail = "admin@wallswiss.ch";
      const filtered = user.email === adminEmail ? list : list.filter(r => r.agentId === user.uid);
      setPlanifs(filtered.sort((a, b) => (b.id || 0) - (a.id || 0)));
    });
    return () => unsub();
  }, [user, db, appId]);

  // Pré-remplir le conseiller depuis appSettings au démarrage d'une nouvelle planif
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
      ...data,
      id: newId,
      agentId: user ? user.uid : "demo",
      agentEmail: user ? user.email : "demo@wallswiss.ch",
      dateCreation: data.dateCreation || new Date().toISOString(),
    };
    if (user && db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'planifications_retraite', newId.toString()), newPlanif);
      } catch (e) {
        console.error("Erreur sauvegarde", e);
      }
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
                <p style={{ color: C.gray, fontSize: 13, marginBottom: 24 }}>Démarrez votre premier dossier R1 de planification retraite.</p>
                <button style={S.btnP} onClick={() => { resetForm(); setPage("create"); }}>+ Nouveau R1</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
                {planifs.map(p => {
                  const synth = calcSyntheseRetraite(p.client, p);
                  return (
                    <div key={p.id} onClick={() => setPreview(p)} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 24, cursor: "pointer", position: "relative", borderTop: `4px solid ${C.gold}` }}>
                      <div style={{ fontSize: 10, color: C.gray, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Dossier R1</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: C.primary, marginBottom: 4 }}>
                        {p.client.prenom} {(p.client.nom || "").toUpperCase()}
                        {p.isCouple && p.conjoint?.prenom && <span style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}> & {p.conjoint.prenom}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: C.darkGray, marginBottom: 16 }}>{p.client.age} ans · départ à {p.client.objAgeDepart} ans</div>
                      <div style={{ background: C.lightGray, padding: 10, marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color: C.gray, marginBottom: 2 }}>Revenu rente projeté</div>
                        <div style={{ fontSize: 16, color: C.primary, fontWeight: 800 }}>CHF {fmt(synth.revenuRenteAjusteMensuel)} /mois</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={(e) => handleEdit(e, p)} style={{ flex: 1, background: C.white, border: `1px solid ${C.mediumGray}`, color: C.primary, padding: "6px 0", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>ÉDITER</button>
                        <button onClick={(e) => handleDelete(e, p.id)} style={{ flex: 1, background: C.white, border: `1px solid ${C.mediumGray}`, color: "#EF4444", padding: "6px 0", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>SUPPRIMER</button>
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
            <p style={{ color: C.gray, fontSize: 13, marginBottom: 24 }}>Parcourez les 14 sections de la check-list R1 frontaliers / franco-suisses.</p>
            <WizardR1 data={data} setData={setData} appSettings={appSettings} onPreview={() => setPreview(data)} onSave={handleSave} />
          </div>
        )}
      </main>

      {preview && <PreviewR1 data={preview} appSettings={appSettings} onClose={() => setPreview(null)} onEdit={(e) => { handleEdit(e, preview); setPreview(null); }} onDelete={async (e) => { await handleDelete(e, preview.id); setPreview(null); }} />}
    </div>
  );
}