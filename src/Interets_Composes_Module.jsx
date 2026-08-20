import React, { useState, useMemo, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   SIMULATEUR D'INTÉRÊTS COMPOSÉS — WallSwiss
   Capitalisation mensuelle, versements indexables, droits d'entrée prélevés
   sur chaque versement, frais de gestion déduits du taux, trois scénarios
   simultanés, graphique SVG, tableau annuel et export PDF à la charte.
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

const PDF_W = 900;
const PDF_H = 1272;

const pdfPage = {
  width: PDF_W, height: PDF_H, boxSizing: "border-box", background: "#fff",
  display: "flex", flexDirection: "column", overflow: "hidden", position: "relative",
};
const pdfBandeau = {
  background: C.primary, padding: "26px 48px", display: "flex",
  alignItems: "center", justifyContent: "space-between", flexShrink: 0, boxSizing: "border-box",
};
const pdfCorps = { flex: 1, padding: "30px 48px 26px", boxSizing: "border-box", overflow: "hidden", display: "flex", flexDirection: "column" };
const pdfPied = {
  background: C.primary, height: 34, display: "flex", alignItems: "center",
  justifyContent: "space-between", padding: "0 48px", flexShrink: 0, boxSizing: "border-box",
};
const pdfEtiquette = {
  fontSize: 10, color: C.gold, fontWeight: 700, textTransform: "uppercase",
  letterSpacing: ".1em", marginBottom: 10,
};

const fmt = (n) => Math.round(Number(n) || 0).toLocaleString("fr-CH");
const num = (v, d = 0) => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? d : n; };

const Ic = {
  chart: (s = 20, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  down: (s = 16, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  reset: (s = 15, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
};

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

function projeterInteretsComposes({ initial, mensuel, annees, tauxBrut, fraisEntree, fraisGestion, indexation }) {
  const feeIn = num(fraisEntree) / 100;
  const rNet = (num(tauxBrut) - num(fraisGestion)) / 100;
  const rM = rNet / 12;
  const nbAnnees = Math.max(1, Math.round(num(annees, 1)));

  let capital = num(initial) * (1 - feeIn);
  let verse = num(initial);
  let mens = num(mensuel);

  const rows = [{ annee: 0, verse: verse, capital: capital, gain: capital - verse, mensuel: mens }];
  for (let y = 1; y <= nbAnnees; y++) {
    for (let k = 0; k < 12; k++) {
      capital = capital * (1 + rM) + mens * (1 - feeIn);
      verse += mens;
    }
    rows.push({ annee: y, verse: verse, capital: capital, gain: capital - verse, mensuel: mens });
    mens = mens * (1 + num(indexation) / 100);
  }
  return rows;
}

function Champ({ label, value, onChange, suffixe, step, aide }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={S.label}>{label}</label>
      <div style={{ position: "relative" }}>
        <input type="number" step={step || "any"} value={value} onChange={(e) => onChange(e.target.value)}
          style={{ ...S.input, paddingRight: suffixe ? 54 : 13 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 4px ${C.accentSoft}`; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.line2; e.currentTarget.style.boxShadow = "none"; }} />
        {suffixe && <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12.5, fontWeight: 600, color: C.dim, pointerEvents: "none" }}>{suffixe}</span>}
      </div>
      {aide && <div style={{ fontSize: 11, color: C.dim, marginTop: 5, lineHeight: 1.45 }}>{aide}</div>}
    </div>
  );
}

function Graphique({ series, hauteur = 300, fixe = false }) {
  const W = 720, H = hauteur;
  const padL = 74, padR = 22, padT = 18, padB = 34;
  const w = W - padL - padR, h = H - padT - padB;
  const nb = series[0] ? series[0].rows.length : 0;
  if (nb < 2) return null;

  const maxVal = Math.max(...series.flatMap((s) => s.rows.map((r) => r.capital)));
  const step = Math.pow(10, Math.floor(Math.log10(Math.max(1, maxVal / 4))));
  const gridMax = Math.max(step, Math.ceil(maxVal / step) * step);

  const getX = (i) => padL + (i / (nb - 1)) * w;
  const getY = (v) => padT + h - (Math.max(0, v) / gridMax) * h;
  const path = (rows, key) => rows.map((r, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(r[key]).toFixed(1)}`).join(" ");

  const lastIdx = nb - 1;
  const xLabels = [];
  const pas = Math.max(1, Math.round((nb - 1) / 8));
  for (let i = 0; i <= lastIdx; i += pas) xLabels.push(i);
  if (xLabels[xLabels.length - 1] !== lastIdx) xLabels.push(lastIdx);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={fixe ? W : undefined} height={fixe ? H : undefined} style={fixe ? { display: "block", width: W, height: H } : { width: "100%", height: "auto", display: "block", overflow: "visible" }}>
      {[0, 0.25, 0.5, 0.75, 1].map((p) => {
        const y = padT + h - p * h;
        return (
          <g key={p}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray={p === 0 ? "0" : "4 4"} />
            <text x={padL - 10} y={y + 4} fontSize="10.5" fill={C.dim} textAnchor="end" fontFamily={F.ui}>{fmt(gridMax * p)}</text>
          </g>
        );
      })}
      {xLabels.map((i) => (
        <text key={i} x={getX(i)} y={H - 10} fontSize="10.5" fill={C.dim} textAnchor="middle" fontFamily={F.ui}>{series[0].rows[i].annee} an{series[0].rows[i].annee > 1 ? "s" : ""}</text>
      ))}
      <path d={`${path(series[1].rows, "capital")} L ${getX(lastIdx)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`} fill="rgba(105,33,2,0.06)" />
      <path d={path(series[0].rows, "verse")} fill="none" stroke={C.gray} strokeWidth="2" strokeDasharray="6 4" />
      {series.map((s, k) => <path key={k} d={path(s.rows, "capital")} fill="none" stroke={s.couleur} strokeWidth={k === 1 ? 3.2 : 2.2} />)}
      {series.map((s, k) => <circle key={"p" + k} cx={getX(lastIdx)} cy={getY(s.rows[lastIdx].capital)} r={k === 1 ? 5 : 4} fill={s.couleur} stroke="#fff" strokeWidth="2" />)}
    </svg>
  );
}

function chargerScript(src) {
  return new Promise((resolve, reject) => {
    const existant = document.querySelector(`script[data-ws-pdf="${src}"]`);
    if (existant) { existant.addEventListener("load", () => resolve()); existant.addEventListener("error", () => reject(new Error("Script indisponible"))); return; }
    const s = document.createElement("script");
    s.src = src;
    s.setAttribute("data-ws-pdf", src);
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Script indisponible : " + src));
    document.body.appendChild(s);
  });
}

async function requirePdfLibs() {
  if (!window.html2canvas) await chargerScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
  if (!(window.jspdf && window.jspdf.jsPDF)) await chargerScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const jsPDF = window.jspdf && window.jspdf.jsPDF;
  if (!window.html2canvas || !jsPDF) throw new Error("Librairies PDF indisponibles");
  return { html2canvas: window.html2canvas, jsPDF };
}

export default function Interets_Composes_Module({ appSettings, logoUrl }) {
  const [f, setF] = useState({ client: "", devise: "CHF", initial: "50000", mensuel: "500", annees: "20", indexation: "0", fraisEntree: "3", fraisGestion: "0", tauxA: "3", tauxB: "6", tauxC: "9" });
  const [pdfBusy, setPdfBusy] = useState(false);
  const printRef = useRef(null);
  const u = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const series = useMemo(() => {
    const base = { initial: f.initial, mensuel: f.mensuel, annees: f.annees, fraisEntree: f.fraisEntree, fraisGestion: f.fraisGestion, indexation: f.indexation };
    return [
      { nom: "Prudent", taux: num(f.tauxA), couleur: "#9CA3AF", rows: projeterInteretsComposes({ ...base, tauxBrut: f.tauxA }) },
      { nom: "Réaliste", taux: num(f.tauxB), couleur: C.primary, rows: projeterInteretsComposes({ ...base, tauxBrut: f.tauxB }) },
      { nom: "Optimiste", taux: num(f.tauxC), couleur: C.gold, rows: projeterInteretsComposes({ ...base, tauxBrut: f.tauxC }) },
    ];
  }, [f.initial, f.mensuel, f.annees, f.indexation, f.fraisEntree, f.fraisGestion, f.tauxA, f.tauxB, f.tauxC]);

  const last = series[1].rows[series[1].rows.length - 1];
  const totalVerse = last.verse, capitalCible = last.capital, gainCible = last.gain;
  const multiple = totalVerse > 0 ? capitalCible / totalVerse : 0;
  const dev = f.devise;
  const nbAns = Math.max(1, Math.round(num(f.annees, 1)));

  const lignes = useMemo(() => {
    const rows = series[1].rows;
    if (nbAns <= 16) return rows;
    const out = [rows[0]];
    const pas = Math.max(1, Math.round(nbAns / 12));
    for (let i = pas; i < nbAns; i += pas) out.push(rows[i]);
    out.push(rows[nbAns]);
    return out;
  }, [series, nbAns]);

  const partInterets = capitalCible > 0 ? Math.round((gainCible / capitalCible) * 100) : 0;
  const dateJour = useMemo(() => new Date().toLocaleDateString("fr-CH", { year: "numeric", month: "long", day: "numeric" }), []);

  const reset = () => setF({ client: "", devise: "CHF", initial: "50000", mensuel: "500", annees: "20", indexation: "0", fraisEntree: "3", fraisGestion: "0", tauxA: "3", tauxB: "6", tauxC: "9" });

  const exportPdf = async () => {
    const el = printRef.current;
    if (!el) return;
    setPdfBusy(true);
    try {
      const { html2canvas, jsPDF } = await requirePdfLibs();
      const nom = (f.client || "Client").trim().replace(/\s+/g, "_") || "Client";
      const pages = Array.from(el.querySelectorAll("[data-pdf-page]"));
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2, useCORS: true, backgroundColor: "#FFFFFF", logging: false,
          width: PDF_W, height: PDF_H, windowWidth: PDF_W, windowHeight: PDF_H,
          scrollX: 0, scrollY: 0,
        });
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 210, 297, undefined, "FAST");
      }
      pdf.save(`Simulation_Interets_Composes_${nom}.pdf`);
    } catch (e) { console.error("Export PDF:", e); } finally { setPdfBusy(false); }
  };

  const kpi = (titre, valeur, sub, couleur) => (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px 18px", flex: "1 1 150px", minWidth: 150 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.dim, marginBottom: 7 }}>{titre}</div>
      <div style={{ fontSize: 21, fontWeight: 800, color: couleur || C.text, lineHeight: 1.1 }}>{valeur}</div>
      {sub && <div style={{ fontSize: 11.5, color: C.muted, marginTop: 5 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bgSoft, fontFamily: F.ui }}>
      <EnteteModule icone={Ic.chart(20, C.accent)} titre="Simulateur d'intérêts composés">
        <button onClick={reset} style={{ ...S.btnS, display: "inline-flex", alignItems: "center", gap: 8 }}>{Ic.reset(15, C.accent)} Réinitialiser</button>
        <button onClick={exportPdf} disabled={pdfBusy} style={{ ...S.btnP, display: "inline-flex", alignItems: "center", gap: 8, opacity: pdfBusy ? 0.7 : 1, cursor: pdfBusy ? "wait" : "pointer" }}>{Ic.down(15, "#fff")} {pdfBusy ? "Génération..." : "Export PDF client"}</button>
      </EnteteModule>

      <main style={{ flex: 1, overflowY: "auto", padding: "28px 40px 70px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(300px, 350px) 1fr", gap: 26, alignItems: "start" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={S.card}>
              <div style={S.cardTitle}><div style={S.dot} /> Paramètres de base</div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Nom du client (pour le PDF)</label>
                <input value={f.client} onChange={(e) => u("client", e.target.value)} placeholder="Jean DUPONT" style={S.input} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Devise</label>
                <select value={f.devise} onChange={(e) => u("devise", e.target.value)} style={S.select}><option>CHF</option><option>EUR</option><option>USD</option></select>
              </div>
              <Champ label="Capital initial" value={f.initial} onChange={(v) => u("initial", v)} suffixe={dev} />
              <Champ label="Versement mensuel" value={f.mensuel} onChange={(v) => u("mensuel", v)} suffixe={dev} />
              <Champ label="Durée de placement" value={f.annees} onChange={(v) => u("annees", v)} suffixe="ans" step="1" />
              <Champ label="Indexation annuelle des versements" value={f.indexation} onChange={(v) => u("indexation", v)} suffixe="%" step="0.5" aide="Augmentation automatique du versement chaque année. Laisser à 0 pour un versement constant." />
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}><div style={S.dot} /> Frais</div>
              <Champ label="Droits d'entrée (sur chaque versement)" value={f.fraisEntree} onChange={(v) => u("fraisEntree", v)} suffixe="%" step="0.5" />
              <Champ label="Frais de gestion annuels" value={f.fraisGestion} onChange={(v) => u("fraisGestion", v)} suffixe="%" step="0.1" aide="Déduits du rendement brut. Mettre 0 si les taux saisis sont déjà nets de frais." />
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}><div style={S.dot} /> Scénarios de rendement</div>
              {[["tauxA", "Prudent", "#9CA3AF"], ["tauxB", "Réaliste", C.primary], ["tauxC", "Optimiste", C.gold]].map(([k, lbl, col]) => (
                <div key={k} style={{ marginBottom: 14 }}>
                  <label style={{ ...S.label, display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: col, flexShrink: 0 }} /> {lbl}</label>
                  <div style={{ position: "relative" }}>
                    <input type="number" step="0.5" value={f[k]} onChange={(e) => u(k, e.target.value)} style={{ ...S.input, paddingRight: 44 }} />
                    <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12.5, fontWeight: 600, color: C.dim }}>%</span>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.5, marginTop: 4 }}>Rendements bruts annuels. Le scénario Réaliste sert de référence dans le tableau et les indicateurs.</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {kpi("Total versé", `${dev} ${fmt(totalVerse)}`, `sur ${nbAns} an${nbAns > 1 ? "s" : ""}`)}
              {kpi("Capital estimé", `${dev} ${fmt(capitalCible)}`, `scénario ${series[1].taux}%`, C.primary)}
              {kpi("Intérêts générés", `${dev} ${fmt(gainCible)}`, gainCible >= 0 ? "gain cumulé" : "perte cumulée", gainCible >= 0 ? C.green : C.red)}
              {kpi("Multiplicateur", `x ${multiple.toFixed(2)}`, "capital / versements")}
            </div>

            <div style={S.card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}><div style={S.dot} /> Évolution du capital</div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11.5, fontWeight: 600, color: C.muted }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 0, borderTop: `2px dashed ${C.gray}` }} /> Versements</span>
                  {series.map((s) => <span key={s.nom} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: s.couleur }} /> {s.nom} ({s.taux}%)</span>)}
                </div>
              </div>
              <Graphique series={series} />
            </div>

            <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "20px 24px 14px" }}>
                <div style={{ ...S.cardTitle, marginBottom: 6 }}><div style={S.dot} /> Détail année par année</div>
                <div style={{ fontSize: 12, color: C.muted }}>Colonnes de capital pour les trois scénarios, versements cumulés en référence.</div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: C.accent, color: "#fff" }}>
                      <th style={{ padding: "11px 14px", textAlign: "left", fontWeight: 600 }}>Année</th>
                      <th style={{ padding: "11px 14px", textAlign: "right", fontWeight: 600 }}>Versé</th>
                      {series.map((s) => <th key={s.nom} style={{ padding: "11px 14px", textAlign: "right", fontWeight: 600 }}>{s.nom}<br /><span style={{ fontSize: 10, opacity: .8 }}>{s.taux}%</span></th>)}
                      <th style={{ padding: "11px 14px", textAlign: "right", fontWeight: 600 }}>Gain réaliste</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((r, i) => {
                      const idx = r.annee, g = series[1].rows[idx].gain;
                      return (
                        <tr key={idx} style={{ background: i % 2 === 0 ? C.cardSoft : C.white }}>
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: C.accent, borderBottom: `1px solid ${C.line}` }}>{idx === 0 ? "Départ" : `N+${idx}`}</td>
                          <td style={{ padding: "10px 14px", textAlign: "right", color: C.muted, borderBottom: `1px solid ${C.line}` }}>{fmt(r.verse)}</td>
                          {series.map((s) => <td key={s.nom} style={{ padding: "10px 14px", textAlign: "right", fontWeight: s.nom === "Réaliste" ? 700 : 500, color: s.nom === "Réaliste" ? C.accent : C.darkGray, borderBottom: `1px solid ${C.line}` }}>{fmt(s.rows[idx].capital)}</td>)}
                          <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: g >= 0 ? C.green : C.red, borderBottom: `1px solid ${C.line}` }}>{g >= 0 ? "+" : ""}{fmt(g)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "14px 24px 20px", fontSize: 10.5, color: C.dim, fontStyle: "italic", lineHeight: 1.5 }}>
                Simulation à but illustratif, sans valeur contractuelle. Les performances passées ne préjugent pas des performances futures. Les montants ne tiennent pas compte de la fiscalité applicable au client.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Gabarit PDF hors écran, pages A4 fixes */}
      <div style={{ position: "fixed", top: 0, left: 0, zIndex: -1000, pointerEvents: "none", overflow: "hidden" }} aria-hidden="true">
        <div ref={printRef} style={{ width: PDF_W, background: "#fff", boxSizing: "border-box", fontFamily: F.ui, color: C.black }}>

          {/* ── PAGE 1 ── */}
          <div data-pdf-page="1" style={{ ...pdfPage }}>
            <div style={pdfBandeau}>
              <div>
                <div style={{ color: C.gold, fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 6 }}>Simulation financière</div>
                <div style={{ fontFamily: "'Times New Roman', Times, serif", color: "#fff", fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>Intérêts composés</div>
              </div>
              {logoUrl && <img src={logoUrl} alt="" className="pdf-image" style={{ height: 42, objectFit: "contain", filter: "brightness(0) invert(1)" }} />}
            </div>

            <div style={pdfCorps}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `2px solid ${C.gold}`, paddingBottom: 14, marginBottom: 26 }}>
                <div>
                  <div style={{ fontSize: 10, color: C.gray, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700 }}>À l&apos;attention de</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.primary, marginTop: 4 }}>{f.client || "Client"}</div>
                </div>
                <div style={{ textAlign: "right", fontSize: 11, color: C.gray }}>
                  <div>{dateJour}</div>
                  {appSettings && (appSettings.agentFirstName || appSettings.agentLastName) && <div style={{ marginTop: 4, color: C.darkGray, fontWeight: 600 }}>{appSettings.agentFirstName} {appSettings.agentLastName}</div>}
                </div>
              </div>

              <div style={{ display: "flex", gap: 20, marginBottom: 28 }}>
                <div style={{ flex: 1, border: `1px solid ${C.mediumGray}`, padding: "14px 18px", boxSizing: "border-box" }}>
                  <div style={pdfEtiquette}>Hypothèses</div>
                  {[["Capital initial", `${dev} ${fmt(f.initial)}`], ["Versement mensuel", `${dev} ${fmt(f.mensuel)}`], ["Durée", `${nbAns} ans`], ["Indexation annuelle", `${num(f.indexation)} %`], ["Droits d'entrée", `${num(f.fraisEntree)} %`], ["Frais de gestion", `${num(f.fraisGestion)} % / an`]].map(([k, v], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12, borderBottom: i < 5 ? `1px solid ${C.lightGray}` : "none" }}>
                      <span style={{ color: C.gray }}>{k}</span><span style={{ fontWeight: 700, color: C.primary }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, border: `1px solid ${C.mediumGray}`, padding: "14px 18px", boxSizing: "border-box" }}>
                  <div style={pdfEtiquette}>Résultat scénario réaliste</div>
                  {[["Total versé", `${dev} ${fmt(totalVerse)}`], ["Capital estimé", `${dev} ${fmt(capitalCible)}`], ["Intérêts générés", `${dev} ${fmt(gainCible)}`], ["Multiplicateur", `x ${multiple.toFixed(2)}`]].map(([k, v], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", fontSize: 12, borderBottom: i < 3 ? `1px solid ${C.lightGray}` : "none" }}>
                      <span style={{ color: C.gray }}>{k}</span><span style={{ fontWeight: 700, color: C.primary }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={pdfEtiquette}>Évolution du capital</div>
              <div style={{ border: `1px solid ${C.mediumGray}`, padding: 14, marginBottom: 26, boxSizing: "border-box" }}>
                <Graphique series={series} hauteur={340} fixe />
              </div>

              <div style={{ display: "flex", gap: 26, fontSize: 11, color: C.darkGray, marginBottom: 26 }}>
                {series.map((s) => (
                  <div key={s.nom} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 22, height: 3, background: s.couleur, display: "inline-block" }} />
                    <span><strong style={{ color: C.primary }}>{s.nom}</strong> {s.taux} % : {dev} {fmt(s.rows[s.rows.length - 1].capital)}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "auto" }}>
              <div style={pdfEtiquette}>Lecture de la simulation</div>
              <div style={{ display: "flex", gap: 20 }}>
                {[
                  ["Effort d'épargne", `${dev} ${fmt(totalVerse)}`, `${fmt(num(f.mensuel))} par mois pendant ${nbAns} ans`],
                  ["Intérêts générés", `${dev} ${fmt(gainCible)}`, "Scénario réaliste, net de frais"],
                  ["Part des intérêts", `${partInterets} %`, "du capital final estimé"],
                ].map(([t, v, sub], i) => (
                  <div key={i} style={{ flex: 1, borderLeft: `3px solid ${C.gold}`, padding: "6px 0 6px 14px", boxSizing: "border-box" }}>
                    <div style={{ fontSize: 9.5, color: C.gray, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700 }}>{t}</div>
                    <div style={{ fontSize: 19, fontWeight: 700, color: C.primary, margin: "6px 0 4px" }}>{v}</div>
                    <div style={{ fontSize: 10, color: C.gray, lineHeight: 1.4 }}>{sub}</div>
                  </div>
                ))}
              </div>
              </div>
            </div>

            <div style={pdfPied}>
              <span style={{ color: "#fff", fontSize: 9.5, fontWeight: 700, letterSpacing: ".08em" }}>WALLSWISS · RUE KLEBERG 14 · 1201 GENÈVE</span>
              <span style={{ color: C.gold, fontSize: 9.5, fontWeight: 700 }}>PAGE 1 / 2</span>
            </div>
          </div>

          {/* ── PAGE 2 ── */}
          <div data-pdf-page="2" style={{ ...pdfPage }}>
            <div style={{ ...pdfBandeau, paddingTop: 20, paddingBottom: 20 }}>
              <div style={{ fontFamily: "'Times New Roman', Times, serif", color: "#fff", fontSize: 22, fontWeight: 700 }}>Projection annuelle</div>
              <div style={{ color: C.gold, fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>{f.client || "Client"}</div>
            </div>

            <div style={pdfCorps}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, tableLayout: "fixed" }}>
                <thead>
                  <tr style={{ background: C.primary, color: "#fff" }}>
                    <th style={{ padding: "9px 10px", textAlign: "left", width: "16%" }}>Année</th>
                    <th style={{ padding: "9px 10px", textAlign: "right", width: "21%" }}>Versé</th>
                    {series.map((s) => <th key={s.nom} style={{ padding: "9px 10px", textAlign: "right", width: "21%" }}>{s.nom} {s.taux}%</th>)}
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((r, i) => (
                    <tr key={r.annee} style={{ background: i % 2 === 0 ? C.lightGray : "#fff" }}>
                      <td style={{ padding: "11px 10px", fontWeight: 700, color: C.primary, borderBottom: `1px solid ${C.mediumGray}` }}>{r.annee === 0 ? "Départ" : `N+${r.annee}`}</td>
                      <td style={{ padding: "11px 10px", textAlign: "right", color: C.gray, borderBottom: `1px solid ${C.mediumGray}` }}>{fmt(r.verse)}</td>
                      {series.map((s) => <td key={s.nom} style={{ padding: "11px 10px", textAlign: "right", fontWeight: s.nom === "Réaliste" ? 700 : 400, color: s.nom === "Réaliste" ? C.primary : C.darkGray, borderBottom: `1px solid ${C.mediumGray}` }}>{fmt(s.rows[r.annee].capital)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>

              <p style={{ fontSize: 9.5, color: C.gray, marginTop: 22, lineHeight: 1.6, fontStyle: "italic" }}>
                Cette simulation est fournie à titre purement illustratif et ne constitue ni un conseil en investissement, ni une garantie de rendement. Les performances passées ne préjugent pas des performances futures. Les montants présentés ne tiennent pas compte de la fiscalité applicable à la situation personnelle du client. Les droits d&apos;entrée sont prélevés sur chaque versement, les frais de gestion sont déduits du rendement annuel brut.
              </p>

              <div style={{ marginTop: "auto", paddingTop: 18, borderTop: `2px solid ${C.gold}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 9.5, color: C.gray, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 6 }}>Votre conseiller</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>
                    {appSettings && (appSettings.agentFirstName || appSettings.agentLastName) ? `${appSettings.agentFirstName || ""} ${appSettings.agentLastName || ""}`.trim() : "WS - The WallSwiss Partner's SA"}
                  </div>
                  {appSettings && appSettings.agentEmail && <div style={{ fontSize: 11, color: C.gray, marginTop: 3 }}>{appSettings.agentEmail}</div>}
                  {appSettings && appSettings.agentPhone && <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{appSettings.agentPhone}</div>}
                </div>
                <div style={{ textAlign: "right", fontSize: 10.5, color: C.gray, lineHeight: 1.6 }}>
                  <div>Document établi le {dateJour}</div>
                  <div>WS - The WallSwiss Partner&apos;s SA</div>
                  <div>Rue Kléberg 14, 1201 Genève</div>
                </div>
              </div>
            </div>

            <div style={pdfPied}>
              <span style={{ color: "#fff", fontSize: 9.5, fontWeight: 700, letterSpacing: ".08em" }}>WALLSWISS · RUE KLEBERG 14 · 1201 GENÈVE</span>
              <span style={{ color: C.gold, fontSize: 9.5, fontWeight: 700 }}>PAGE 2 / 2</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
