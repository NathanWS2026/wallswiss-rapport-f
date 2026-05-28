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

function calcAVS(person) {
  const annees = Number(person.avsAnneesCotisation || 0);
  const renteMaxBase = 2520;
  const renteMinBase = 1260;
  const tauxCompletion = Math.min(annees / 44, 1);
  if (person.avsRenteEstimee && Number(person.avsRenteEstimee) > 0) {
    const renteMensuelle = Number(person.avsRenteEstimee);
    const renteAnnuelle = renteMensuelle * 12;
    const treizieme = person.avs13eRente !== false ? renteMensuelle : 0;
    return { renteMensuelle, renteAnnuelle: renteAnnuelle + treizieme, treizieme, tauxCompletion, source: "Estimation client" };
  }
  const revenuMoyen = Number(person.revenusBrut || 0);
  let renteBase = renteMinBase + (renteMaxBase - renteMinBase) * tauxCompletion;
  if (revenuMoyen > 0 && revenuMoyen < 88200) {
    renteBase = Math.max(renteMinBase, renteBase * (revenuMoyen / 88200));
  }
  const renteMensuelle = Math.round(renteBase);
  const treizieme = person.avs13eRente !== false ? renteMensuelle : 0;
  return { renteMensuelle, renteAnnuelle: renteMensuelle * 12 + treizieme, treizieme, tauxCompletion, source: "Estimation indicative" };
}

function calcLPP(person, ageDepart = 65) {
  const avoirActuel = Number(person.lppAvoirActuel || 0);
  const cotisationAnnuelle = Number(person.lppCotisationAnnuelle || 0);
  const tauxRendement = Number(person.lppTauxRendement || 1.25) / 100;
  const age = Number(person.age || 40);
  const annees = Math.max(0, ageDepart - age);
  let capitalAge65 = avoirActuel;
  if (tauxRendement > 0) {
    capitalAge65 = avoirActuel * Math.pow(1 + tauxRendement, annees) + cotisationAnnuelle * ((Math.pow(1 + tauxRendement, annees) - 1) / tauxRendement);
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
  return { capitalAge65: Math.round(capitalAge65), renteAnnuelle: Math.round(renteAnnuelle), renteMensuelle: Math.round(renteAnnuelle / 12), librePassageProj: Math.round(lpProj), tauxConversion: tauxConversion * 100 };
}

function calc3eP(person, ageDepart = 65) {
  const avoir3a = Number(person.troisPAvoir3a || 0);
  const cotisationAnnuelle = Number(person.troisPCotisationAnnuelle || 0);
  const tauxRendement = Number(person.troisPTauxRendement || 3) / 100;
  const age = Number(person.age || 40);
  const annees = Math.max(0, ageDepart - age);
  let capital3a = avoir3a;
  if (tauxRendement > 0) {
    capital3a = avoir3a * Math.pow(1 + tauxRendement, annees) + cotisationAnnuelle * ((Math.pow(1 + tauxRendement, annees) - 1) / tauxRendement);
  } else {
    capital3a = avoir3a + cotisationAnnuelle * annees;
  }
  const avoir3b = Number(person.troisPAvoir3b || 0);
  const capital3b = avoir3b * Math.pow(1 + tauxRendement, annees);
  return { capital3a: Math.round(capital3a), capital3b: Math.round(capital3b), capitalTotal: Math.round(capital3a + capital3b) };
}

function calcPensionsFR(person) {
  const trimAcquis = Number(person.frTrimestresAcquis || 0);
  const trimRequis = Number(person.frTrimestresRequis || 172);
  const sam = Number(person.frSAM || 0);
  const tauxPlein = trimAcquis >= trimRequis ? 0.50 : 0.50 * (trimAcquis / trimRequis);
  let pensionCnavAnnuelle = sam * tauxPlein;
  if (person.frPensionCnavEstimee && Number(person.frPensionCnavEstimee) > 0) {
    pensionCnavAnnuelle = Number(person.frPensionCnavEstimee) * 12;
  }
  const points = Number(person.frPointsAgircArrco || 0);
  const valeurPoint = 1.4159;
  const pensionAgircAnnuelle = points * valeurPoint;
  const totalAnnuel = pensionCnavAnnuelle + pensionAgircAnnuelle;
  return { pensionCnavAnnuelle: Math.round(pensionCnavAnnuelle), pensionCnavMensuelle: Math.round(pensionCnavAnnuelle / 12), pensionAgircAnnuelle: Math.round(pensionAgircAnnuelle), pensionAgircMensuelle: Math.round(pensionAgircAnnuelle / 12), totalAnnuel: Math.round(totalAnnuel), totalMensuel: Math.round(totalAnnuel / 12), tauxPlein: trimAcquis >= trimRequis };
}

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
  return { ageDepart, avs, lpp, troisP, pensionsFR, pensionsFRChfAnnuelle: Math.round(pensionsFRChfAnnuelle), pensionsFRChfMensuelle: Math.round(pensionsFRChfMensuelle), revenuRenteAnnuel: Math.round(revenuRenteAnnuel), revenuRenteMensuel: Math.round(revenuRenteAnnuel / 12), revenuRenteAjuste: Math.round(revenuRenteAjuste), revenuRenteAjusteMensuel: Math.round(revenuRenteAjuste / 12), capitalLPPSorti: Math.round(capitalLPPSorti), capitalTotal: Math.round(capitalTotal), objectifAnnuel: Math.round(objectifAnnuel), objectifMensuel: trainVie, ecart: Math.round(ecart), ecartMensuel: Math.round(ecart / 12), ecartPct: ecartPct.toFixed(1) };
}

const personneVide = () => ({
  prenom: "", nom: "", dateNaissance: "", age: "", nationalite: "Suisse", permisG: false, permisType: "", statutMatrimonial: "Marié(e)", regimeMatrimonial: "", adresse: "", domicileFiscal: "", santeGenerale: "Bonne",
  statutPro: "Salarié", employeur: "", tauxOccupation: "100", revenusBrut: "", revenusNet: "", dateFinActivite: "", autresRevenus: "", revenusFR: "", fluxEpargneMensuel: "",
  avsNumero: "", avsAnneesCotisation: "", avsLacunes: "", avsCaisse: "", avsRenteEstimee: "", avsAnticipation: false, avsAjournement: false, avs13eRente: true, avsCotisationsArretAnticipe: "",
  lppCaisse: "", lppAvoirActuel: "", lppCotisationAnnuelle: "", lppTauxRendement: "1.25", lppTauxConversion: "5.0", lppCapitalProjete: "", lppRenteProjete: "", lppLibrePassage: "0", lppAvoirsOublies: false, lppPotentielRachat: "", lppRachats3Ans: "0", lppEPL: "0", lppMisesEnGage: "", lppChoixSortie: "Mixte", lppPartCapitalPct: "50", lppTauxCouverture: "",
  troisPAvoir3a: "", troisPCotisationAnnuelle: "", troisPTauxRendement: "3", troisPNbComptes: "1", troisPAvoir3b: "", troisPCotisation3b: "", troisPStrategieEchelonnement: "", troisPClausesBeneficiaires: "",
  frACarriereFrance: false, frRegimeBase: "CNAV", frTrimestresAcquis: "", frTrimestresRequis: "172", frSAM: "", frAgeTauxPlein: "", frPensionCnavEstimee: "", frPointsAgircArrco: "", frAutresRegimes: "", frLacunesARegulariser: "", frDecisionRetraiteFR: "Accepter", frAssuranceMaladie: "LAMal",
  objAgeDepart: "65", objPriorite: "train_vie", objTrainVie: "", objDepartProgressif: false, objProjets: "", objPreferenceSortie: "Mixte", objAgeFinConsommation: "90", objToleranceRisque: "Équilibré",
});

const stateInitial = () => ({
  templateId: "planification-retraite", hiddenSlides: [], dateRapport: new Date().toISOString().split('T')[0], isCouple: false,
  client: personneVide(), conjoint: personneVide(), enfants: [],
  immoResidencePrincipaleValeur: "", immoResidencePrincipaleHypotheque: "", immoResidencePrincipaleTauxInt: "", immoResidencePrincipaleTypeHypo: "Fixe", immoAmortissement: "Indirect", immoSecondaires: [], immoBiensLocatifs: [], immoProjets: "", immoBiensFrance: "",
  patComptesCourants: "", patEpargne: "", patDepotsTitres: "", patCredits: "", patLeasings: "", patParticipations: "", patComptesFrance: "",
  budCoutVieMensuel: "", budAssuranceMaladie: "", budAutresAssurances: "", budChargeFiscale: "", budChargesImmo: "", budPensionsVersees: "",
  fiscDerniereTaxation: "", fiscImpositionSource: false, fiscQuasiResident: false, fiscRevenuImposable: "", fiscFortuneImposable: "", fiscImpotsFrance: "",
  risqueCouvertureDeces: "", risqueCouvertureInvalidite: "", risqueLacunesConjoint: "", risqueClausesBeneficiaires: "", risqueLAARetraite: "",
  succTestament: false, succPacteSuccessoral: false, succContratMariage: false, succMandatInaptitude: false, succDonations: "", succObjectifsTransmission: "", succLoiApplicable: "Suisse",
  tauxRendement: "3", tauxInflation: "1.5", tauxChangeEurChf: "0.95", paysResidenceRetraite: "Suisse", scenarios: ["Âge cible", "Arrêt anticipé -3 ans", "Rente vs Capital"],
  docsRecus: {}, conseiller: "", titreConseiller: "Conseiller en planification financière", telephone: "", email: "",
  notesConseiller: "", pointsAttention: "",
});

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
