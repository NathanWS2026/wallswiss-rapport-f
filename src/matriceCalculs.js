/* =====================================================================================
   WallSwiss — matriceCalculs.js
   -------------------------------------------------------------------------------------
   MOTEUR DE CALCUL (source unique de vérité). Aucune dépendance React / Firebase / design.
   Le module RetraiteR1Module.jsx importe ces fonctions :

     import {
       fmt, fmtEUR, partCapitalLPP, calcAVS, calcLPP, lppEffectif, calc3eP, calc3ePImpot,
       calcPensionsFR, calcSyntheseRetraite, calcSyntheseMenage, calcArbitrageSante,
       calcDoubleScenarioFR, calc3ScenariosLPP, calcFiscaliteComparative, projetteSolution,
       calcGainTotal, generatePlanActions, calcProjectionAnnuelle, calcAllocationPoches,
       calcHeatmapAges, calcTrainDeVieMensuel, calcCartographieDroits
     } from "./matriceCalculs";

   Corrections 2026 intégrées (sources officielles) :
     1. calcAVS            : revenu rente max 88 200 -> 90 720   (ahv-iv.ch, échelle 44)
     2. calcPensionsFR     : point AGIRC-ARRCO 1.4159 -> 1.4386  (agirc-arrco.fr)
     3. calcPensionsFR     : malus 0.90 -> 1 (supprimé 01/04/2024, service-public A15237)
     4. calcSyntheseMenage : plafond AVS couple marié 3 780 CHF/mois (ahv-iv.ch mémento 3.01)
     5. change EUR/CHF      : défaut 0.95 -> 0.92 (BNS) dans tous les replis
   ===================================================================================== */

// ────────────────────── FORMATTERS ──────────────────────
export const fmt = (n) => Number(n || 0).toLocaleString("fr-CH", { maximumFractionDigits: 0 }).replace(/’/g, "'");
export const fmtEUR = (n) => Number(n || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 });

// Part de la LPP prise en capital (0 → 1) en respectant le choix de sortie.
export function partCapitalLPP(person) {
  const choix = person.lppChoixSortie || "Mixte";
  if (choix === "Capital") return 1;
  if (choix === "Rente") return 0;
  const p = Number(person.lppPartCapitalPct || 0) / 100;
  return Math.max(0, Math.min(1, p));
}

// AVS Suisse — 13e rente 2026, anticipation, ajournement
export function calcAVS(person, options = {}) {
  const annees = Number(person.avsAnneesCotisation || 0);
  const renteMaxBase = 2520; // CHF/mois 2026
  const renteMinBase = 1260;
  const REVENU_RENTE_MAX = 90720; // [CORR.1] 3 × 30'240 (était 88'200). Source : ahv-iv.ch, échelle 44
  const tauxCompletion = Math.min(annees / 44, 1);
  let renteMensuelle;
  let source;
  if (person.avsRenteEstimee && Number(person.avsRenteEstimee) > 0) {
    renteMensuelle = Number(person.avsRenteEstimee);
    source = "Estimation client";
  } else {
    const revenuMoyen = Number(person.revenusBrut || 0);
    let renteBase = renteMinBase + (renteMaxBase - renteMinBase) * tauxCompletion;
    if (revenuMoyen > 0 && revenuMoyen < REVENU_RENTE_MAX) {
      renteBase = Math.max(renteMinBase, renteBase * (revenuMoyen / REVENU_RENTE_MAX));
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
export function calcLPP(person, ageDepart = 65) {
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
export function lppEffectif(person, ageDepart) {
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
export function calc3eP(person, ageDepart = 65) {
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
export function calc3ePImpot(capital3a, hypotheses) {
  const taux = Number(hypotheses.tauxImpotCapital3a || 6) / 100;
  return Math.round(capital3a * taux);
}

// Pensions françaises — décote / taux plein (réforme 2023) — [CORR.2 & 3]
export function calcPensionsFR(person, options = {}) {
  const trimAcquis = Number(person.frTrimestresAcquis || 0);
  const trimRequis = Number(person.frTrimestresRequis || 172);
  const sam = Number(person.frSAM || 0);
  const scenario = options.scenario || "normal";
  const trimRetenus = scenario === "taux_plein" ? Math.max(trimAcquis, trimRequis) : trimAcquis;
  const trimManquants = Math.max(0, trimRequis - trimRetenus);
  const trimDecote = Math.min(20, trimManquants);
  const decote = scenario === "taux_plein" ? 0 : trimDecote * 0.0125;
  const tauxLiquidation = 0.50 * (1 - decote);
  const prorata = Math.min(1, trimRequis > 0 ? trimRetenus / trimRequis : 0);
  let pensionCnavAnnuelle = sam * tauxLiquidation * prorata;
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
  const points = Number(person.frPointsAgircArrco || 0);
  const valeurPoint = 1.4386; // [CORR.2] valeur de service 2025/2026 (était 1.4159). Source : agirc-arrco.fr
  // [CORR.3] malus -10% (coeff. de solidarité) SUPPRIMÉ au 01/04/2024. Source : service-public.gouv.fr/A15237.
  // Frontalier : totalisation CH-FR => taux plein le plus souvent (coef 1). Minoration définitive éventuelle : via RIS.
  const coefAgirc = 1;
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
export function calcSyntheseRetraite(person, hypotheses) {
  const ageDepart = Number(person.objAgeDepart || 65);
  const tauxChange = Number(hypotheses.tauxChangeEurChf || 0.92); // [CORR.5] BNS ~0,92 (était 0.95)
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

// Synthèse consolidée du ménage — [CORR.4] plafond AVS couple marié (150 % = 3 780 CHF/mois)
export function calcSyntheseMenage(data) {
  const a = calcSyntheseRetraite(data.client, data);
  const b = (data.isCouple && data.conjoint && data.conjoint.prenom) ? calcSyntheseRetraite(data.conjoint, data) : null;
  const add = (x, y) => Math.round((x || 0) + (y || 0));

  // Plafonnement AVS couple marié : somme des 2 rentes limitée à 150 % de la rente max
  // (2026 : 1,5 × 2 520 = 3 780 CHF/mois). Source : ahv-iv.ch (mémento 3.01, rente de couple).
  const PLAFOND_COUPLE_AVS = 3780;
  const estCoupleMarie = !!b
    && data.client.statutMatrimonial === "Marié(e)"
    && data.conjoint.statutMatrimonial === "Marié(e)";
  let avsMensuel = add(a.avs.renteMensuelle, b ? b.avs.renteMensuelle : 0);
  let reductionAVS = 0;
  if (estCoupleMarie && avsMensuel > PLAFOND_COUPLE_AVS) {
    reductionAVS = avsMensuel - PLAFOND_COUPLE_AVS;
    avsMensuel = PLAFOND_COUPLE_AVS;
  }
  return {
    a, b,
    revenuRenteMensuel: add(a.revenuRenteAjusteMensuel, b ? b.revenuRenteAjusteMensuel : 0) - reductionAVS,
    avsMensuel,
    avsPlafonne: reductionAVS > 0,
    reductionAVS,
    lppMensuel: add(a.renteLPPAjusteeMensuelle, b ? b.renteLPPAjusteeMensuelle : 0),
    frMensuel: add(a.pensionsFRChfMensuelle, b ? b.pensionsFRChfMensuelle : 0),
    capitalTotal: add(a.capitalTotal, b ? b.capitalTotal : 0),
    objectifMensuel: add(a.objectifMensuel, b ? b.objectifMensuel : 0),
    ecartMensuel: add(a.ecartMensuel, b ? b.ecartMensuel : 0) + reductionAVS,
  };
}

// ─── Arbitrage santé / fiscalité — montants ANNUELS (sur 1 an) ───
export function calcArbitrageSante(person, hypotheses) {
  const ageDepart = Number(person.objAgeDepart || 65);
  const ageFin = Number(person.objAgeFinConsommation || 90);
  const dureeRetraite = Math.max(1, ageFin - ageDepart);
  const tauxChange = Number(hypotheses.tauxChangeEurChf || 0.92); // [CORR.5]
  const avs = calcAVS(person);
  const lppE = lppEffectif(person, ageDepart);
  const pensionsFR = calcPensionsFR(person);
  const pensionsFRChf = pensionsFR.totalAnnuel * tauxChange;
  const renteAnnuelleTotale = avs.renteAnnuelle + lppE.renteAnnuelleEff + pensionsFRChf;
  const primeLAMal = Number(hypotheses.primeLAMalAnnuelle || 9600);
  const primeCMU = Number(hypotheses.primeCMUAnnuelle || 0);
  const tauxCSG = Number(hypotheses.tauxCSGCRDSCASA || 9.1) / 100;
  const cotCMU = Number(hypotheses.cotisationCMUSubsidiaire || 0);
  const csgLAMal = pensionsFRChf * (tauxCSG * 0.3);
  const totalA = primeLAMal + csgLAMal;
  const csgB = renteAnnuelleTotale * tauxCSG;
  const totalB = primeCMU + cotCMU + csgB;
  const totalC = (totalA + totalB) / 2;
  const totalD = primeLAMal + pensionsFRChf;
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
    gainStrategie: Math.round(gainAnnuel * dureeRetraite),
    dureeRetraite, ageDepart, ageFin,
    hypotheses: { primeLAMal, primeCMU, tauxCSGCRDSCASA: tauxCSG * 100 },
  };
}

// ─── Double scénario retraite française : départ au plus tôt vs taux plein ───
export function calcDoubleScenarioFR(person, hypotheses) {
  if (!person.frACarriereFrance) return null;
  const ageMinLegal = Number(person.frAgeMinLegal || 64);
  const ageTauxPlein = Number(person.frAgeTauxPlein || 67);
  const ageFin = Number(person.objAgeFinConsommation || 90);
  const tauxChange = Number(hypotheses.tauxChangeEurChf || 0.92); // [CORR.5]
  const totScenario = calcPensionsFR(person, { scenario: "tot" });
  const pleinScenario = calcPensionsFR(person, { scenario: "taux_plein" });
  const cumulTot = totScenario.totalAnnuel * Math.max(0, ageFin - ageMinLegal);
  const cumulPlein = pleinScenario.totalAnnuel * Math.max(0, ageFin - ageTauxPlein);
  const differentielCumule = cumulPlein - cumulTot;
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
export function calc3ScenariosLPP(person, hypotheses) {
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

// ─── Comparatif fiscal transfrontalier : net-net rente vs capital, CH vs FR ───
export function calcFiscaliteComparative(person, data) {
  const ageDepart = Number(person.objAgeDepart || 65);
  const ageFin = Number(person.objAgeFinConsommation || 90);
  const duree = Math.max(1, ageFin - ageDepart);
  const lpp = calcLPP(person, ageDepart);
  const capital = lpp.capitalAge65;
  const tauxConv = Number(person.lppTauxConversion || 5) / 100;
  const renteAnnuelle = capital * tauxConv;
  const tCapCH = Number(data.fiscTauxCapitalCH || 7) / 100;
  const impotCapCH = capital * tCapCH;
  const tCapFR = Number(data.fiscTauxCapitalFR || 7.5) / 100;
  const tPSCapFR = Number(data.fiscTauxPSCapitalFR || 0) / 100;
  const impotCapFR = capital * (tCapFR + tPSCapFR);
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
export function projetteSolution(sol) {
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
export function calcGainTotal(data) {
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
export function generatePlanActions(data) {
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
export function calcProjectionAnnuelle(data) {
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

// ─── Pré-allocation par horizon (4 poches) ─── (couleurs en hex, pas de dépendance design)
export function calcAllocationPoches(data) {
  const tp = calc3eP(data.client, Number(data.client.objAgeDepart || 65));
  const lpp = calcLPP(data.client, Number(data.client.objAgeDepart || 65));
  const liq = Number(data.patComptesCourants || 0) + Number(data.patEpargne || 0);
  const titres = Number(data.patDepotsTitres || 0);
  const capitalLPPSorti = lpp.capitalAge65 * partCapitalLPP(data.client);
  let capitalDisponible = liq + titres + tp.capitalTotal + capitalLPPSorti;
  if (data.useCapitalLibre && Number(data.patCapitalLibre) > 0) capitalDisponible = Number(data.patCapitalLibre) + tp.capitalTotal + capitalLPPSorti;
  return [
    { id: "court", label: "Court terme", horizon: "0–3 ans", pct: 15, montant: Math.round(capitalDisponible * 0.15), color: "#EF4444", support: "Liquidités, comptes courants" },
    { id: "moyen", label: "Moyen terme", horizon: "4–8 ans", pct: 25, montant: Math.round(capitalDisponible * 0.25), color: "#F59E0B", support: "Obligations courtes, fonds défensifs" },
    { id: "long", label: "Long terme", horizon: "9–15 ans", pct: 30, montant: Math.round(capitalDisponible * 0.30), color: "#0055A4", support: "Mixte actions/obligations" },
    { id: "tresLong", label: "Très long terme", horizon: "> 15 ans", pct: 30, montant: Math.round(capitalDisponible * 0.30), color: "#10B981", support: "Actions, immobilier, fonds dynamiques" },
  ];
}

// ─── Heatmap train de vie par âge de départ ───
export function calcHeatmapAges(data) {
  const ages = [58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70];
  const tauxChange = Number(data.tauxChangeEurChf || 0.92); // [CORR.5]
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
export function calcTrainDeVieMensuel(data) {
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

// ─── Cartographie des droits ───
export function calcCartographieDroits(data) {
  const lignes = [];
  const addPersonne = (p, isClient) => {
    const ageDepart = Number(p.objAgeDepart || 65);
    const avs = calcAVS(p);
    const lppE = lppEffectif(p, ageDepart);
    const tp = calc3eP(p, ageDepart);
    const prenom = p.prenom || (isClient ? "Client" : "Conjoint(e)");
    if (avs.renteMensuelle > 0) lignes.push({ qui: prenom, intitule: "Rente AVS", type: "Rente viagère", institut: p.avsCaisse || "Caisse de compensation", montant: "CHF " + fmt(avs.renteMensuelle) + " /mois", ageDebut: 65 });
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