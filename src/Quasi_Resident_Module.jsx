import React, { useState, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   SIMULATEUR QUASI-RÉSIDENT / TOU — WallSwiss
   Comparateur pédagogique Impôt à la source / DRIS / Taxation Ordinaire
   Ultérieure, conforme au protocole interne (procédure 3.7.2.1).

   Aucun barème fiscal officiel n'est codé en dur. Le taux d'imposition
   ordinaire est saisi par le conseiller depuis le simulateur officiel de
   l'administration fiscale cantonale, sur la base du revenu déterminant
   mondial calculé ici. Rien ne devient périmé au changement d'année.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Tokens et styles, portée locale au module ── */
const C = {
  primary: "#692102", primaryDark: "#4D1801", gold: "#A59568",
  white: "#FFFFFF", black: "#1A1A1A", gray: "#6B7280",
  lightGray: "#F3F2EF", mediumGray: "#E5E3DE", darkGray: "#374151",
  bg: "#FFFFFF", bgSoft: "#F5F5F7", card: "#FFFFFF", cardSoft: "#F5F5F7",
  text: "#1D1D1F", muted: "#6E6E73", dim: "#86868B",
  line: "rgba(0,0,0,0.08)", line2: "rgba(0,0,0,0.13)",
  accent: "#692102", accentDark: "#4D1801", accentSoft: "rgba(105,33,2,0.10)",
  green: "#047857", greenSoft: "rgba(4,120,87,.09)",
  amber: "#B45309", amberSoft: "rgba(180,83,9,.09)",
  red: "#B91C1C", redSoft: "rgba(185,28,28,.09)",
};
const F = {
  ui: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  serif: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif",
  mono: "'SF Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
};
const S = {
  label: { display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, fontFamily: F.ui },
  input: { width: "100%", padding: "10px 13px", border: `1px solid ${C.line2}`, fontSize: 13.5, fontFamily: F.ui, color: C.text, background: C.card, outline: "none", boxSizing: "border-box", borderRadius: 11 },
  select: { width: "100%", padding: "10px 13px", border: `1px solid ${C.line2}`, fontSize: 13.5, fontFamily: F.ui, color: C.text, background: C.card, outline: "none", cursor: "pointer", boxSizing: "border-box", borderRadius: 11 },
  card: { background: C.card, padding: 22, boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 28px rgba(0,0,0,0.05)", border: `1px solid ${C.line}`, borderRadius: 18 },
  cardTitle: { fontSize: 12.5, fontWeight: 700, color: C.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 10, fontFamily: F.ui },
  dot: { width: 9, height: 9, borderRadius: "50%", background: C.accent, flexShrink: 0 },
  btnP: { background: C.accent, color: "#fff", border: "none", padding: "11px 22px", cursor: "pointer", fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, borderRadius: 980, boxShadow: "0 2px 8px rgba(105,33,2,.28)" },
  btnS: { background: C.card, color: C.accent, border: `1px solid ${C.line2}`, padding: "10px 20px", cursor: "pointer", fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, borderRadius: 980 },
};

const fmt = (n) => Math.round(Number(n) || 0).toLocaleString("fr-CH");
const num = (v, d = 0) => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? d : n; };

const Ic = {
  reset: (s = 15, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
  calc: (s = 20, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8" y2="11"/><line x1="12" y1="11" x2="12" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="16" y1="15" x2="16" y2="18"/></svg>,
  copy: (s = 15, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
};

function Encadre({ ton, titre, children }) {
  const map = { ok: [C.green, C.greenSoft], warn: [C.amber, C.amberSoft], ko: [C.red, C.redSoft], info: [C.accent, C.accentSoft] };
  const [col, bg] = map[ton] || map.info;
  return (
    <div style={{ background: bg, borderLeft: `3px solid ${col}`, borderRadius: "0 10px 10px 0", padding: "12px 15px" }}>
      {titre && <div style={{ fontSize: 12, fontWeight: 800, color: col, marginBottom: 5 }}>{titre}</div>}
      <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}


function EnteteModule({ icone, titre, children }) {
  return (
    <header className="no-print" style={{ background: C.white, borderBottom: `1px solid ${C.line}`, position: "sticky", top: 0, zIndex: 60, flexShrink: 0 }}>
      <div style={{ padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: C.accentSoft, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>{icone}</div>
          <div>
            <div style={{ color: C.dim, fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>Module ouvert</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>{titre}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>{children}</div>
      </div>
    </header>
  );
}

/* ── Référentiels métier ── */
const REVENUS_CH = [
  { k: "salaireCH", l: "Salaire brut suisse (titulaire)" },
  { k: "salaireCHConjoint", l: "Salaire brut suisse (conjoint)" },
  { k: "allocations", l: "Allocations familiales perçues en Suisse" },
  { k: "autresCH", l: "Autres revenus de source suisse" },
];
const REVENUS_HORS_CH = [
  { k: "salaireEtranger", l: "Salaire étranger (titulaire)" },
  { k: "salaireEtrangerConjoint", l: "Salaire étranger (conjoint)" },
  { k: "revenusFonciers", l: "Revenus fonciers hors Suisse" },
  { k: "valeurLocative", l: "Valeur locative du bien hors Suisse" },
  { k: "dividendes", l: "Dividendes, intérêts, revenus mobiliers" },
  { k: "pensionsPercues", l: "Pensions alimentaires perçues" },
  { k: "autresHorsCH", l: "Autres revenus hors Suisse" },
];
const DEDUCTIONS = [
  { k: "pilier3a", l: "Pilier 3a (cotisations versées)", tou: true },
  { k: "rachatLpp", l: "Rachats LPP (2e pilier)", tou: true },
  { k: "fraisGarde", l: "Frais de garde des enfants par des tiers", tou: true },
  { k: "pensionVersee", l: "Pensions alimentaires versées", tou: true },
  { k: "fraisFormation", l: "Frais de formation et de perfectionnement", tou: true },
  { k: "interetsPassifs", l: "Intérêts passifs et intérêts hypothécaires", tou: true },
  { k: "entretienImmeuble", l: "Frais d'entretien d'immeuble", tou: true },
  { k: "fraisMedicaux", l: "Frais médicaux importants et frais de handicap", tou: true },
  { k: "primesMaladie", l: "Primes d'assurance maladie effectives", tou: false },
  { k: "fraisPro", l: "Frais professionnels effectifs (transport, repas)", tou: false },
  { k: "autresDeductions", l: "Autres déductions justifiées", tou: false },
];
const HONORAIRES = [
  { k: "qrFrontCel", l: "Quasi-résident frontalier, célibataire", montant: 290 },
  { k: "qrFrontCouple", l: "Quasi-résident frontalier, couple", montant: 340 },
  { k: "resCel", l: "Résident, célibataire", montant: 195 },
  { k: "resCouple", l: "Résident, couple", montant: 230 },
  { k: "rectifSimple", l: "Rectification simple (DRIS)", montant: 100 },
  { k: "libre", l: "Montant personnalisé", montant: 0 },
];
const CANTONS = {
  GE: { nom: "Genève", note: "Déclaration TOU possible via e-démarches. Le double dossier France + TOU est envisageable pour les frontaliers." },
  VD: { nom: "Vaud", note: "Régime des 8 cantons (accord du 11.04.1983) : pas de DRIS ni de TOU en standard, attestation 2041-AS signée par l'employeur. Vérifier le seuil de télétravail (40 % max)." },
  VS: { nom: "Valais", note: "Même régime des 8 cantons que Vaud : attestation 2041-AS, contrôle annuel du seuil de télétravail (40 % max)." },
  AUTRE: { nom: "Autre canton", note: "Vérifier le régime applicable au canton de travail avant tout dépôt." },
};

function LigneMontant({ label, value, onChange, badge }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0", borderBottom: `1px solid ${C.lightGray}` }}>
      <span style={{ flex: 1, fontSize: 12.5, color: C.darkGray, lineHeight: 1.35 }}>
        {label}
        {badge && <span style={{ marginLeft: 7, fontSize: 9, fontWeight: 800, letterSpacing: ".05em", color: C.accent, background: C.accentSoft, padding: "2px 6px", borderRadius: 980, verticalAlign: "middle" }}>{badge}</span>}
      </span>
      <div style={{ position: "relative", width: 132, flexShrink: 0 }}>
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0" style={{ ...S.input, padding: "8px 40px 8px 11px", textAlign: "right", fontVariantNumeric: "tabular-nums" }} />
        <span style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", fontSize: 11, fontWeight: 600, color: C.dim, pointerEvents: "none" }}>CHF</span>
      </div>
    </div>
  );
}

export default function Quasi_Resident_Module() {
  const [canton, setCanton] = useState("GE");
  const [statut, setStatut] = useState("Frontalier");
  const [famille, setFamille] = useState("Célibataire");
  const [annee, setAnnee] = useState(String(new Date().getFullYear() - 1));
  const [rCH, setRCH] = useState({});
  const [rHors, setRHors] = useState({});
  const [ded, setDed] = useState({});
  const [isPreleve, setIsPreleve] = useState("");
  const [modeImpot, setModeImpot] = useState("taux");
  const [tauxEffectif, setTauxEffectif] = useState("");
  const [impotDirect, setImpotDirect] = useState("");
  const [prorata, setProrata] = useState(true);
  const [honoraireKey, setHonoraireKey] = useState("qrFrontCel");
  const [honoraireLibre, setHonoraireLibre] = useState("");
  const [toast, setToast] = useState("");

  const totalCH = useMemo(() => REVENUS_CH.reduce((a, r) => a + num(rCH[r.k]), 0), [rCH]);
  const totalHors = useMemo(() => REVENUS_HORS_CH.reduce((a, r) => a + num(rHors[r.k]), 0), [rHors]);
  const totalMondial = totalCH + totalHors;
  const totalDed = useMemo(() => DEDUCTIONS.reduce((a, d) => a + num(ded[d.k]), 0), [ded]);

  const ratio = totalMondial > 0 ? (totalCH / totalMondial) * 100 : 0;
  const eligible = totalMondial > 0 && ratio >= 90;

  const revenuDeterminant = Math.max(0, totalMondial - totalDed);
  const partCH = totalMondial > 0 ? totalCH / totalMondial : 1;
  const dedImputables = prorata ? totalDed * partCH : totalDed;
  const revenuImposableCH = Math.max(0, totalCH - dedImputables);

  const impotTOU = modeImpot === "montant" ? num(impotDirect) : revenuImposableCH * (num(tauxEffectif) / 100);
  const honoraire = honoraireKey === "libre" ? num(honoraireLibre) : ((HONORAIRES.find((h) => h.k === honoraireKey) || {}).montant || 0);
  const source = num(isPreleve);
  const ecart = source - impotTOU;
  const gainNet = ecart - honoraire;
  const pretAComparer = source > 0 && impotTOU > 0;

  let verdict;
  if (totalMondial === 0) verdict = { ton: "info", titre: "Saisissez les revenus du foyer", txt: "Le test des 90 % et la comparaison chiffrée s'affichent dès que les revenus suisses et hors Suisse sont renseignés." };
  else if (!eligible) verdict = { ton: "ko", titre: "Non éligible à la taxation ordinaire ultérieure", txt: `Les revenus de source suisse représentent ${ratio.toFixed(1)} % des revenus mondiaux du foyer, sous le seuil légal de 90 %. La TOU ne peut pas être demandée. Orienter le client vers une rectification simple (DRIS) si les conditions sont réunies.` };
  else if (!pretAComparer) verdict = { ton: "warn", titre: "Éligible, comparaison à compléter", txt: "Le foyer passe le test des 90 %. Renseignez l'impôt à la source prélevé et l'estimation d'impôt ordinaire pour obtenir le verdict chiffré." };
  else if (gainNet > honoraire) verdict = { ton: "ok", titre: "TOU favorable", txt: `L'économie estimée dépasse largement les honoraires. Gain net estimé de CHF ${fmt(gainNet)} pour le client.` };
  else if (gainNet > 0) verdict = { ton: "warn", titre: "Gain marginal, arbitrage nécessaire", txt: `Le gain net estimé n'est que de CHF ${fmt(gainNet)} après honoraires. Vérifier que la charge documentaire et le caractère irréversible du choix se justifient.` };
  else verdict = { ton: "ko", titre: "TOU défavorable", txt: `La taxation ordinaire coûterait CHF ${fmt(Math.abs(gainNet))} de plus au client que l'impôt à la source, honoraires compris. Ne pas déposer.` };

  const checklist = useMemo(() => {
    const l = [
      "Certificat de salaire suisse " + annee + " de tous les employeurs (titulaire et conjoint)",
      "Attestation-quittance de l'impôt à la source " + annee,
      "Copie du permis de travail ou de la pièce d'identité",
      "IBAN suisse (commençant par CH)",
    ];
    if (canton === "GE") l.push("Formulaire original DRIS / TOU ou accès e-démarches");
    if (canton === "VD" || canton === "VS") l.push("Attestation 2041-AS signée par l'employeur suisse");
    if (statut === "Frontalier") l.push("Avis d'imposition français N-1 (indispensable pour le plafond PER et la composition du foyer)", "Toutes les fiches de paie étrangères de " + annee);
    if (famille !== "Célibataire") l.push("Livret de famille complet et montant exact des allocations familiales perçues en Suisse");
    if (num(ded.pilier3a) > 0) l.push("Attestation de cotisations 3e pilier A " + annee);
    if (num(ded.rachatLpp) > 0) l.push("Attestation de rachat LPP " + annee);
    if (num(ded.fraisGarde) > 0) l.push("Justificatifs des frais de garde par des tiers");
    if (num(ded.pensionVersee) > 0) l.push("Jugement ou convention et preuves de versement des pensions alimentaires");
    if (num(ded.interetsPassifs) > 0) l.push("Attestations d'intérêts passifs et tableaux d'amortissement au 31.12." + annee);
    if (num(ded.entretienImmeuble) > 0) l.push("Acte notarié, taxe foncière, décompte de charges et factures d'entretien");
    if (num(ded.fraisMedicaux) > 0) l.push("Justificatifs de frais médicaux importants et décomptes assurance");
    if (num(ded.primesMaladie) > 0) l.push("Justificatifs des primes d'assurance maladie et complémentaire");
    return l;
  }, [canton, statut, famille, annee, ded]);

  const copierChecklist = () => {
    const txt = "Check-list dossier " + (statut === "Frontalier" ? "quasi-résident" : "résident") + " " + annee + " (" + CANTONS[canton].nom + ")\n\n" + checklist.map((x) => "- " + x).join("\n");
    if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(txt);
    setToast("Check-list copiée");
    setTimeout(() => setToast(""), 2500);
  };
  const reset = () => { setRCH({}); setRHors({}); setDed({}); setIsPreleve(""); setTauxEffectif(""); setImpotDirect(""); };
  const jaugeCol = !totalMondial ? C.dim : eligible ? C.green : C.red;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bgSoft, fontFamily: F.ui }}>
      <EnteteModule icone={Ic.calc(20, C.accent)} titre="Simulateur Quasi-Résident / TOU">
        <button onClick={reset} style={{ ...S.btnS, display: "inline-flex", alignItems: "center", gap: 8 }}>{Ic.reset(15, C.accent)} Vider la simulation</button>
      </EnteteModule>

      <main style={{ flex: 1, overflowY: "auto", padding: "26px 40px 70px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr minmax(320px, 380px)", gap: 24, alignItems: "start" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>

            <div style={S.card}>
              <div style={S.cardTitle}><div style={S.dot} /> 1 · Profil du dossier</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
                <div>
                  <label style={S.label}>Canton de travail</label>
                  <select value={canton} onChange={(e) => setCanton(e.target.value)} style={S.select}>
                    {Object.entries(CANTONS).map(([k, v]) => <option key={k} value={k}>{v.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Statut</label>
                  <select value={statut} onChange={(e) => setStatut(e.target.value)} style={S.select}><option>Frontalier</option><option>Résident suisse</option></select>
                </div>
                <div>
                  <label style={S.label}>Situation familiale</label>
                  <select value={famille} onChange={(e) => setFamille(e.target.value)} style={S.select}><option>Célibataire</option><option>Marié(e) / partenariat</option><option>Célibataire avec enfants</option></select>
                </div>
                <div>
                  <label style={S.label}>Année fiscale</label>
                  <input value={annee} onChange={(e) => setAnnee(e.target.value)} style={S.input} />
                </div>
              </div>
              <div style={{ marginTop: 14 }}><Encadre ton={canton === "GE" ? "info" : "warn"} titre={CANTONS[canton].nom}>{CANTONS[canton].note}</Encadre></div>
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}><div style={S.dot} /> 2 · Revenus bruts du foyer</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 26 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: C.green, marginBottom: 8 }}>Revenus de source suisse</div>
                  {REVENUS_CH.map((r) => <LigneMontant key={r.k} label={r.l} value={rCH[r.k] || ""} onChange={(v) => setRCH((p) => ({ ...p, [r.k]: v }))} />)}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 11, fontSize: 13, fontWeight: 800, color: C.green }}><span>Total Suisse</span><span>CHF {fmt(totalCH)}</span></div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: C.amber, marginBottom: 8 }}>Revenus hors Suisse</div>
                  {REVENUS_HORS_CH.map((r) => <LigneMontant key={r.k} label={r.l} value={rHors[r.k] || ""} onChange={(v) => setRHors((p) => ({ ...p, [r.k]: v }))} />)}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 11, fontSize: 13, fontWeight: 800, color: C.amber }}><span>Total hors Suisse</span><span>CHF {fmt(totalHors)}</span></div>
                </div>
              </div>
              <div style={{ marginTop: 18 }}>
                <Encadre ton="info" titre="Ce qui compte dans les revenus hors Suisse">
                  Salaires étrangers, revenus fonciers, valeur locative du bien détenu à l'étranger, dividendes et intérêts, pensions alimentaires perçues. Les revenus du conjoint entrent dans le calcul, même s'il ne travaille pas en Suisse.
                </Encadre>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}><div style={S.dot} /> 3 · Déductions effectives</div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: -10, marginBottom: 14, lineHeight: 1.55 }}>
                Les lignes marquées TOU ne sont accessibles qu'en taxation ordinaire ultérieure. C'est là que se joue l'intérêt réel du dossier.
              </div>
              {DEDUCTIONS.map((d) => <LigneMontant key={d.k} label={d.l} badge={d.tou ? "TOU" : null} value={ded[d.k] || ""} onChange={(v) => setDed((p) => ({ ...p, [d.k]: v }))} />)}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, fontSize: 13.5, fontWeight: 800, color: C.accent }}><span>Total des déductions</span><span>CHF {fmt(totalDed)}</span></div>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 16, cursor: "pointer" }}>
                <input type="checkbox" checked={prorata} onChange={(e) => setProrata(e.target.checked)} style={{ marginTop: 2, width: 15, height: 15, accentColor: C.accent }} />
                <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>Répartir les déductions au prorata des revenus suisses ({(partCH * 100).toFixed(1)} %). Décocher pour imputer la totalité des déductions au revenu imposable en Suisse.</span>
              </label>
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}><div style={S.dot} /> 4 · Comparaison chiffrée</div>

              <div style={{ marginBottom: 18 }}>
                <label style={S.label}>Impôt à la source effectivement prélevé en {annee}</label>
                <div style={{ position: "relative", maxWidth: 260 }}>
                  <input type="number" value={isPreleve} onChange={(e) => setIsPreleve(e.target.value)} placeholder="0" style={{ ...S.input, paddingRight: 46, fontWeight: 700, fontSize: 15 }} />
                  <span style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", fontSize: 11.5, fontWeight: 600, color: C.dim }}>CHF</span>
                </div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>À reprendre sur l'attestation-quittance ou le certificat de salaire.</div>
              </div>

              <div style={{ background: C.cardSoft, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: C.accent, marginBottom: 4 }}>Revenu déterminant mondial</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>CHF {fmt(revenuDeterminant)}</div>
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>
                  Revenus mondiaux moins déductions. C'est ce montant qu'il faut saisir dans le simulateur officiel de l'administration fiscale cantonale pour obtenir le taux d'imposition applicable.
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: C.muted }}>Revenu imposable en Suisse : <b style={{ color: C.text }}>CHF {fmt(revenuImposableCH)}</b></div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {[["taux", "Saisir un taux effectif"], ["montant", "Saisir un montant d'impôt"]].map(([k, l]) => {
                  const on = modeImpot === k;
                  return <button key={k} onClick={() => setModeImpot(k)} style={{ flex: 1, padding: "9px 0", borderRadius: 11, cursor: "pointer", fontSize: 12.5, fontWeight: 700, border: `1px solid ${on ? C.accent : C.line2}`, background: on ? C.accentSoft : C.card, color: on ? C.accent : C.muted }}>{l}</button>;
                })}
              </div>

              {modeImpot === "taux" ? (
                <div>
                  <label style={S.label}>Taux d'imposition effectif obtenu du simulateur officiel</label>
                  <div style={{ position: "relative", maxWidth: 200 }}>
                    <input type="number" step="0.1" value={tauxEffectif} onChange={(e) => setTauxEffectif(e.target.value)} placeholder="0.0" style={{ ...S.input, paddingRight: 40, fontWeight: 700, fontSize: 15 }} />
                    <span style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 600, color: C.dim }}>%</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 6, lineHeight: 1.5 }}>Taux cantonal et communal cumulé, déterminé sur le revenu mondial et appliqué au revenu imposable en Suisse.</div>
                </div>
              ) : (
                <div>
                  <label style={S.label}>Impôt ordinaire estimé (montant total)</label>
                  <div style={{ position: "relative", maxWidth: 260 }}>
                    <input type="number" value={impotDirect} onChange={(e) => setImpotDirect(e.target.value)} placeholder="0" style={{ ...S.input, paddingRight: 46, fontWeight: 700, fontSize: 15 }} />
                    <span style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", fontSize: 11.5, fontWeight: 600, color: C.dim }}>CHF</span>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 18 }}>
                <Encadre ton="warn" titre="Aucun barème n'est calculé par l'application">
                  Le module ne remplace pas le simulateur officiel de l'administration fiscale. Les barèmes évoluent chaque année : le taux ou le montant d'impôt ordinaire doit toujours provenir de la source officielle du canton concerné.
                </Encadre>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}><div style={S.dot} /> 5 · Check-list documentaire du dossier</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {checklist.map((x, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, marginTop: 7, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: C.darkGray, lineHeight: 1.55 }}>{x}</span>
                  </div>
                ))}
              </div>
              <button onClick={copierChecklist} style={{ ...S.btnS, marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", fontSize: 12.5 }}>{Ic.copy(14, C.accent)} Copier la check-list</button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 20 }}>

            <div style={S.card}>
              <div style={S.cardTitle}><div style={S.dot} /> Test de la règle des 90 %</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: jaugeCol, letterSpacing: "-0.03em", lineHeight: 1 }}>{totalMondial ? ratio.toFixed(1) : "0"}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: jaugeCol }}>%</span>
                <span style={{ fontSize: 12, color: C.muted, marginLeft: "auto" }}>seuil 90 %</span>
              </div>
              <div style={{ position: "relative", height: 10, background: C.lightGray, borderRadius: 980, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ width: `${Math.min(100, ratio)}%`, height: "100%", background: jaugeCol, borderRadius: 980, transition: "width .25s" }} />
                <div style={{ position: "absolute", left: "90%", top: -3, width: 2, height: 16, background: C.text, opacity: .55 }} />
              </div>
              <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5, marginTop: 10 }}>Revenus suisses CHF {fmt(totalCH)} sur un total mondial de CHF {fmt(totalMondial)}.</div>
            </div>

            <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "20px 22px 4px" }}><div style={S.cardTitle}><div style={S.dot} /> Résultat de la comparaison</div></div>
              <div style={{ padding: "0 22px 8px" }}>
                {[["Impôt à la source prélevé", source], ["Impôt ordinaire estimé (TOU)", impotTOU]].map(([l, v], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.lightGray}`, fontSize: 12.5 }}>
                    <span style={{ color: C.muted }}>{l}</span>
                    <span style={{ fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>CHF {fmt(v)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.lightGray}`, fontSize: 13 }}>
                  <span style={{ color: C.muted, fontWeight: 600 }}>{ecart >= 0 ? "Récupération brute" : "Surcoût brut"}</span>
                  <span style={{ fontWeight: 800, color: ecart >= 0 ? C.green : C.red, fontVariantNumeric: "tabular-nums" }}>{ecart >= 0 ? "+" : ""}{fmt(ecart)}</span>
                </div>

                <div style={{ padding: "14px 0 6px" }}>
                  <label style={S.label}>Honoraires du cabinet</label>
                  <select value={honoraireKey} onChange={(e) => setHonoraireKey(e.target.value)} style={{ ...S.select, fontSize: 12.5 }}>
                    {HONORAIRES.map((h) => <option key={h.k} value={h.k}>{h.l}{h.montant ? ` · CHF ${h.montant}` : ""}</option>)}
                  </select>
                  {honoraireKey === "libre" && <input type="number" value={honoraireLibre} onChange={(e) => setHonoraireLibre(e.target.value)} placeholder="Montant CHF" style={{ ...S.input, marginTop: 8, fontSize: 12.5 }} />}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", fontSize: 12.5, borderBottom: `1px solid ${C.lightGray}` }}>
                  <span style={{ color: C.muted }}>Honoraires</span>
                  <span style={{ fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>- CHF {fmt(honoraire)}</span>
                </div>
              </div>

              <div style={{ background: pretAComparer ? (gainNet > 0 ? C.greenSoft : C.redSoft) : C.cardSoft, padding: "16px 22px", borderTop: `1px solid ${C.line}` }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>Gain net estimé pour le client</div>
                <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-0.02em", color: !pretAComparer ? C.dim : gainNet > 0 ? C.green : C.red }}>
                  {pretAComparer ? `${gainNet >= 0 ? "+" : "-"} CHF ${fmt(Math.abs(gainNet))}` : "En attente"}
                </div>
              </div>
            </div>

            <Encadre ton={verdict.ton} titre={verdict.titre}>{verdict.txt}</Encadre>

            <Encadre ton="warn" titre="Rappels internes obligatoires">
              Le choix de la TOU est irréversible pour l'année concernée. Ne jamais s'engager sur un montant de remboursement devant le client. Faire valider par écrit sa compréhension des trois options avant tout dépôt. Aucun dépôt sans dossier complet et paiement reçu.
            </Encadre>

            <Encadre ton="info" titre="Si la TOU n'est pas retenue">
              La rectification simple (DRIS) reste possible pour les corrections limitées : barème, enfants à charge, erreurs techniques. Depuis 2021 son périmètre est très restreint. Délai légal : demande à déposer avant le 31 mars de l'année suivante.
            </Encadre>
          </div>
        </div>
      </main>

      {toast && <div style={{ position: "fixed", bottom: 34, right: 34, background: C.green, color: "#fff", padding: "11px 22px", fontSize: 13.5, fontWeight: 600, borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,.18)", zIndex: 3000 }}>{toast}</div>}
    </div>
  );
}