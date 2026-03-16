import React, { useState, useEffect } from "react";

const C = {
  primary: "#692102",
  primaryDark: "#4D1801", 
  sidebar: "#2D0E01", 
  gold: "#A59568",
  white: "#FFFFFF",
  black: "#1A1A1A",
  gray: "#6B7280",
  lightGray: "#F3F2EF",
  mediumGray: "#E5E3DE",
  darkGray: "#374151",
};

const LOGO_URL = "/logo blanc sans texte.png";
const APP_VERSION = "v1.5.0";

const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

function computeProjections(data) {
  const initial = Number(data.montantInvestissement || 100000);
  const fee = Number(data.fraisSouscription || 3);
  const net = initial - (initial * fee / 100);
  const rP = Number(data.tauxPessimiste || 3) / 100;
  const rR = Number(data.tauxRealiste || 6) / 100;
  const rO = Number(data.tauxOptimiste || 9) / 100;
  const years = [0, 3, 5, 8, 10, 15];
  return years.map(y => ({
    year: y,
    pessimiste: Math.round(net * Math.pow(1 + rP, y)),
    realiste: Math.round(net * Math.pow(1 + rR, y)),
    optimiste: Math.round(net * Math.pow(1 + rO, y)),
  }));
}

function computeProjectionsPrevoyance(data) {
  const monthly = Number(data.capaciteEpargne || 500);
  const annual = monthly * 12;
  const age = Number(data.age || 40);
  const duration = Math.max(1, 65 - age); // Projection jusqu'à la retraite (65 ans)
  
  const rP = Number(data.tauxPessimistePrev || 2) / 100;
  const rR = Number(data.tauxRealistePrev || 4) / 100;
  const rO = Number(data.tauxOptimistePrev || 6) / 100;
  const taxMarginalRate = 0.30; 
  
  // Création d'étapes harmonieuses pour le graphique
  const step = Math.max(1, Math.floor(duration / 4));
  let years = [];
  for(let i = 0; i <= duration; i+=step) { years.push(i); }
  if (years[years.length-1] !== duration) years.push(duration);
  const uniqueYears = [...new Set(years)].sort((a,b) => a - b);
  
  return uniqueYears.map(y => {
    const invested = annual * y;
    const months = y * 12;
    
    // Calcul des intérêts composés mensuels
    const calcCap = (rate) => {
      if (rate === 0 || months === 0) return invested;
      const rM = rate / 12;
      return monthly * ((Math.pow(1 + rM, months) - 1) / rM);
    };
    
    return {
      year: y,
      age: age + y,
      invested: Math.round(invested),
      pessimiste: Math.round(calcCap(rP)),
      realiste: Math.round(calcCap(rR)),
      optimiste: Math.round(calcCap(rO)),
      taxSavings: data.optiFiscale ? Math.round(invested * taxMarginalRate) : 0
    };
  });
}

function fmt(n) { return Number(n).toLocaleString("fr-CH"); }

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
    console.error("Erreur CORS lors de la récupération de l'image :", url, error);
    return url; 
  }
};

// ────────────────────── SLIDE COMPONENTS ──────────────────────

const slideBase = {
  width: "100%",
  aspectRatio: "16/9",
  position: "relative",
  overflow: "hidden",
  fontFamily: "'Montserrat', sans-serif",
  background: C.white,
  textAlign: "left",
};

const footer = (name) => (
  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: C.primary, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px" }}>
    <span style={{ color: C.white, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>À L'ATTENTION DE {name}</span>
  </div>
);

const accentBar = () => (
  <div style={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", background: C.primary }} />
);

const logoCorner = () => (
  <div style={{ position: "absolute", top: 48, right: 64, zIndex: 10 }}>
    <div style={{ background: C.primary, width: "52px", height: "52px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0px", boxShadow: "0 4px 15px rgba(0,0,0,0.15)" }}>
      <img src={LOGO_URL} alt="WallSwiss" className="pdf-image" style={{ width: "28px", height: "28px", objectFit: "contain", display: "block" }} />
    </div>
  </div>
);

const ReportTitle = ({ title, highlight, subtitle, color = C.primary }) => (
  <div style={{ borderLeft: `5px solid ${C.gold}`, paddingLeft: "24px", marginBottom: "36px", fontFamily: "'Montserrat', sans-serif", textAlign: "left" }}>
    {subtitle && (
      <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 10 }}>
        {subtitle}
      </div>
    )}
    <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 34, fontWeight: 700, color: color, margin: 0, lineHeight: 1.15 }}>
      {title} {highlight && <em style={{ color: C.gold }}>{highlight}</em>}
    </div>
  </div>
);

const EditableText = ({ value, onChange, editMode, style }) => {
  if (editMode) {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...style, width: "100%", background: "rgba(105,33,2,0.03)", border: `1px dashed ${C.gold}`, borderRadius: "0px", padding: "6px", outline: "none", resize: "vertical", fontFamily: "'Montserrat', sans-serif", display: "block", boxSizing: "border-box", textAlign: "left" }}
      />
    );
  }
  return <p style={{ ...style, whiteSpace: "pre-wrap", textAlign: "justify" }}>{value}</p>;
};

// Slide 1 — Cover
function SlideCover({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const dateObj = data.dateRapport ? new Date(data.dateRapport) : new Date();
  const formattedDate = dateObj.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div style={{ ...slideBase, background: C.white, display: "flex" }}>
      <div style={{ width: "35%", height: "100%", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 40px" }}>
        <div style={{ background: C.primary, width: "72px", height: "72px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0px" }}>
          <img src={LOGO_URL} alt="WallSwiss" className="pdf-image" style={{ width: "40px", height: "40px", objectFit: "contain", display: "block" }} />
        </div>
        <div>
          <div style={{ width: 48, height: 4, background: C.gold, marginBottom: 20 }} />
          <div style={{ color: C.primary, fontSize: 13, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>Analyse Patrimoniale</div>
          <div style={{ color: C.gray, fontSize: 12, marginTop: 10 }}>{formattedDate}</div>
        </div>
      </div>
      <div style={{ width: "65%", height: "100%", background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`, position: "relative", padding: "80px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 8, background: C.gold }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: "45%", height: "100%", background: "rgba(255,255,255,0.03)" }} />
        <div style={{ fontFamily: "'Times New Roman', Times, serif", color: C.white, fontSize: 64, fontWeight: 700, lineHeight: 1.1, position: "relative", zIndex: 2 }}>
          Rapport<br /><em style={{ color: C.gold, fontStyle: "italic" }}>Financier</em>
        </div>
        <div style={{ marginTop: 48, borderLeft: `3px solid rgba(255,255,255,0.2)`, paddingLeft: 24, position: "relative", zIndex: 2 }}>
          <div style={{ color: C.white, fontSize: 22, fontWeight: 600 }}>{data.conseiller || "Louis Borne"}</div>
          <div style={{ color: C.gold, fontSize: 14, fontWeight: 500, marginTop: 6 }}>{data.titreConseiller || "Planificatrice financière"}</div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 2 — Table des matières SwissQuote
function SlideTOC({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const items = [
    { title: "Qui sommes-nous ? Notre philosophie", page: 3 },
    { title: "Notre cabinet en chiffres", page: 4 },
    { title: "Résumé de votre situation personnelle", page: 5 },
    { title: "Pourquoi Swissquote est une banque fiable", page: 6 },
    { title: "Avantages WallSwiss BY Swissquote", page: 7 },
    { title: "Solution — Compte Titre", page: 9 },
    { title: "Fonds NS (CH) Swiss Excellence DPM", page: 10 },
    { title: "Projections financières", page: 11 },
    { title: "Avantages tarifaires WS Premium", page: 12 },
    { title: "Comparatif bancaire", page: 13 },
    { title: "Votre application de suivi", page: 14 },
    { title: "Synthèse & Contact", page: 15 },
  ];
  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Table des matières" subtitle="STRUCTURE DE VOTRE PRÉSENTATION" />
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 80, rowGap: 24, alignContent: "center", maxWidth: 1000, margin: "0" }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-end", width: "100%", paddingBottom: 6 }}>
              <span style={{ color: C.darkGray, fontSize: 15, fontWeight: 600, paddingBottom: 2 }}>
                {item.title}
              </span>
              <div style={{ flex: 1, borderBottom: `2px dotted ${C.mediumGray}`, margin: "0 16px", position: "relative", top: -8 }} />
              <span style={{ color: C.primary, fontSize: 16, fontWeight: 700, flexShrink: 0, paddingBottom: 2 }}>
                {String(item.page).padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 3 — Philosophie
function SlidePhilosophy({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={{ ...slideBase, display: "flex", alignItems: "stretch" }}>
      <div style={{ width: "35%", position: "relative", overflow: "hidden" }}>
         <img src="/image page3.jpg" alt="Fond" className="pdf-image" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ flex: 1, padding: "56px 80px", position: "relative", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {logoCorner()}
        <ReportTitle title="Qui sommes-nous ?" />
        
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 22, color: C.primaryDark, textTransform: "uppercase", marginBottom: 6 }}>NOTRE PHILOSOPHIE.</div>
          <div style={{ fontSize: 14, color: C.gold, marginBottom: 16, fontWeight: 500 }}>Votre cabinet de planification financière à Genève.</div>
          <EditableText editMode={editMode} value={data.texts?.philosophyP1} onChange={v => onTextChange("philosophyP1", v)} style={{ fontSize: 13, lineHeight: 1.7, color: C.darkGray, margin: "0 0 12px" }} />
          <EditableText editMode={editMode} value={data.texts?.philosophyP2} onChange={v => onTextChange("philosophyP2", v)} style={{ fontSize: 13, lineHeight: 1.7, color: C.darkGray, margin: "0 0 12px" }} />
          <EditableText editMode={editMode} value={data.texts?.philosophyP3} onChange={v => onTextChange("philosophyP3", v)} style={{ fontSize: 13, lineHeight: 1.7, color: C.darkGray, margin: 0 }} />
        </div>

        <div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 22, color: C.primaryDark, textTransform: "uppercase", marginBottom: 6 }}>NOTRE MISSION</div>
          <div style={{ fontSize: 14, color: C.gold, marginBottom: 16, fontWeight: 500 }}>Vos projets financiers avec expertise et transparence</div>
          <EditableText editMode={editMode} value={data.texts?.missionP1} onChange={v => onTextChange("missionP1", v)} style={{ fontSize: 13, lineHeight: 1.7, color: C.darkGray, margin: "0 0 12px" }} />
          <EditableText editMode={editMode} value={data.texts?.missionP2} onChange={v => onTextChange("missionP2", v)} style={{ fontSize: 13, lineHeight: 1.7, color: C.darkGray, margin: 0 }} />
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 4 — Qui sommes-nous
function SlideAbout({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const stats = [
    { val: "+2000", label: "CLIENTS" },
    { val: "ACCRÉDITÉ", label: "FINMA" },
    { val: "+10M CHF", label: "SOUS GESTION" },
    { val: "+20", label: "COLLABORATEURS" },
    { val: "+50", label: "PARTENAIRES" },
    { val: "100%", label: "SOLUTIONS PRAGMATIQUES" },
  ];
  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "56px 64px 56px 80px", height: "100%", boxSizing: "border-box", display: "flex", gap: "64px" }}>
        <div style={{ flex: 1.2, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <ReportTitle title="Notre cabinet" highlight="en chiffres" subtitle="QUI SOMMES-NOUS ?" />
          <div style={{ color: C.gray, fontSize: 14, marginBottom: 16, fontWeight: 500 }}>Votre cabinet de planification financière à Genève.</div>
          <EditableText editMode={editMode} value={data.texts?.aboutDesc} onChange={v => onTextChange("aboutDesc", v)} style={{ fontSize: 13.5, lineHeight: 1.8, color: C.darkGray, marginBottom: 40 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {stats.map((s, i) => (
              <div key={i} style={{ background: C.primary, padding: "20px 12px", textAlign: "center", borderRadius: "0px", boxShadow: "0 4px 12px rgba(105,33,2,0.15)" }}>
                <div style={{ color: C.white, fontSize: 22, fontWeight: 800 }}>{s.val}</div>
                <div style={{ color: C.gold, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, height: "100%", borderRadius: "0px", overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.1)" }}>
          <img src="/geneva.jpg" alt="Equipe WallSwiss" className="pdf-image" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 5 — Situation personnelle
function SlideSituation({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "48px 80px 80px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Résumé de" highlight="votre situation personnelle" subtitle="ANALYSE PATRIMONIALE" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, flex: 1, minHeight: 0, marginTop: 8 }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 24, justifyContent: "flex-start" }}>
            <div>
              <div style={{ background: C.primary, color: C.white, padding: "12px 20px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", borderRadius: "0px" }}>Civilité & Statut</div>
              <div style={{ border: `1px solid ${C.mediumGray}`, borderTop: "none", padding: "10px 20px", borderRadius: "0px", background: C.white }}>
                {[
                  ["Âge", `${data.age || "-"} ans`],
                  ["Profession", data.profession || "À renseigner"],
                  ["Nationalité", data.nationalite || "À renseigner"],
                  ["Statut civil", data.statut || "À renseigner"],
                ].map(([k, v], i, arr) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.lightGray}` : "none", fontSize: 12.5 }}>
                    <span style={{ color: C.gray, fontWeight: 500 }}>{k}</span>
                    <span style={{ fontWeight: 700, color: C.primary }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <div style={{ background: C.primary, color: C.white, padding: "12px 20px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", borderRadius: "0px" }}>Données Financières</div>
              <div style={{ border: `1px solid ${C.mediumGray}`, borderTop: "none", padding: "10px 20px", borderRadius: "0px", background: C.white }}>
                {[
                  ["Revenus annuels bruts", data.revenus ? `CHF ${fmt(data.revenus)}.-` : "À renseigner"],
                  ["Capacité d'épargne / mois", data.capaciteEpargne ? `CHF ${fmt(data.capaciteEpargne)}.-` : "À renseigner"],
                  ["Fortune globale estimée", data.fortuneGlobale ? `CHF ${fmt(data.fortuneGlobale)}.-` : "À renseigner"],
                ].map(([k, v], i, arr) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.lightGray}` : "none", fontSize: 12.5 }}>
                    <span style={{ color: C.gray, fontWeight: 500 }}>{k}</span>
                    <span style={{ fontWeight: 700, color: C.primary }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24, justifyContent: "flex-start" }}>
            <div>
              <div style={{ background: C.gold, color: C.white, padding: "12px 20px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", borderRadius: "0px" }}>Vos objectifs prioritaires</div>
              <div style={{ border: `1px solid ${C.mediumGray}`, borderTop: "none", padding: "16px 20px", background: C.white, borderRadius: "0px", minHeight: "120px" }}>
                {(data.objectifs && data.objectifs.length > 0 ? data.objectifs : ["Aucun objectif spécifique renseigné"]).map((obj, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "6px 0" }}>
                    <div style={{ width: 6, height: 6, background: C.gold, marginTop: 6, flexShrink: 0, borderRadius: "0px" }} />
                    <span style={{ fontSize: 12.5, color: C.darkGray, lineHeight: 1.5, fontWeight: 500 }}>{obj}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ background: C.gold, color: C.white, padding: "12px 20px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", borderRadius: "0px" }}>Profil d'investisseur</div>
              <div style={{ border: `1px solid ${C.mediumGray}`, borderTop: "none", padding: "10px 20px", borderRadius: "0px", background: C.white }}>
                {[
                  ["Horizon de placement", data.horizonPlacement || "Moyen / Long terme"],
                  ["Tolérance au risque", data.profilRisque || "Équilibré"],
                ].map(([k, v], i, arr) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.lightGray}` : "none", fontSize: 12.5 }}>
                    <span style={{ color: C.gray, fontWeight: 500 }}>{k}</span>
                    <span style={{ fontWeight: 700, color: C.primary }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 6 — Pourquoi Swissquote
function SlideSwissquote({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const points = [
    "Swissquote est une banque suisse spécialisée dans l'investissement et les services financiers en ligne.",
    "Elle est réglementée en Suisse et supervisée par la FINMA, ce qui implique un cadre de contrôle strict.",
    "C'est un établissement reconnu, avec une structure solide et une présence bien établie sur le marché suisse.",
    "Les clients bénéficient d'une plateforme complète pour investir, tout en restant dans un environnement bancaire sécurisé.",
  ];
  return (
    <div style={slideBase}>
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Pourquoi Swissquote est une banque fiable" subtitle="PARTENAIRE BANCAIRE" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 20, maxWidth: 860 }}>
          {points.map((p, i) => (
            <div key={i} style={{ background: C.lightGray, padding: "20px 28px", fontSize: 14, lineHeight: 1.7, color: C.darkGray, borderLeft: `4px solid ${C.gold}`, textAlign: "justify", borderRadius: "0px" }}>
              {p}
            </div>
          ))}
          <div style={{ background: "rgba(105,33,2,0.04)", padding: "20px 28px", fontSize: 14, lineHeight: 1.7, borderLeft: `4px solid ${C.primary}`, borderRadius: "0px", marginTop: 12 }}>
            <EditableText editMode={editMode} value={data.texts?.swissquoteIntro} onChange={v => onTextChange("swissquoteIntro", v)} style={{ color: C.primary, fontWeight: 700, margin: 0 }} />
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 7 — Avantages WallSwiss BY Swissquote
function SlideAdvantages({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const avantages = [
    { title: "Sécurité & réglementation suisses", desc: "Banque suisse régulée par la FINMA, avec garantie des dépôts jusqu'à 100'000 CHF. Bilan consolidé à 80 Mds CHF : et ratios Bâle III de Swissquote, bien qu'ils aient fluctué, sont historiquement restés élevés, démontrant une capitalisation qui excède les exigences réglementaires." },
    { title: "Univers d'investissement le plus large", desc: "Accès à plus de 3 millions de produits (actions, ETF, fonds, obligations, dérivés, forex/CFD, crypto, etc.)." },
    { title: "Heures étendues & Swiss DOTS", desc: "Trading sur Swiss DOTS de 08:00 à 22:00, conditions forfaitaires chez certains émetteurs, accès à SIX et aux marchés US/UE." },
    { title: "ETF compétitifs", desc: "Plus de 9'000 ETF disponibles." },
    { title: "Tarification optimisée", desc: "Tarifs négociés sur une sélection de valeurs clés pour des portefeuilles essentiels." },
    { title: "Crypto de niveau bancaire", desc: "Achat/vente, staking, garde institutionnelle et échange crypto propriétaire (SQX) opérés par une banque suisse." },
    { title: "Thématiques & produits structurés", desc: "Themes Trading, transactions thématiques en 1 clic et offre/partenariats d'AMCs pour professionnels/institutionnels." },
    { title: "Plateformes & outils", desc: "Application multi-actifs (titres & crypto), interface intuitive, centre de formation (cours, webinars, e-books)." },
    { title: "Support multilingue & équipe dédiée", desc: "Assistance client dédiée, équipe institutionnelle dédiée." },
    { title: "Change compétitif", desc: "Conditions de change très compétitives." },
  ];
  return (
    <div style={slideBase}>
      {logoCorner()}
      <div style={{ padding: "48px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Avantages WallSwiss BY Swissquote" highlight="pour l'investissement" subtitle="CONDITIONS EXCLUSIVES" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 40px", flex: 1, alignContent: "center" }}>
          {avantages.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ color: C.primary, fontSize: 20, marginTop: -4 }}>•</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.darkGray }}>{a.title}</div>
                <div style={{ fontSize: 11.5, color: C.gray, lineHeight: 1.5, marginTop: 4, textAlign: "justify" }}>{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 8 — Section divider
function SlideDivider({ data, number, title, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={{ ...slideBase, background: C.lightGray, display: "flex" }}>
      <div style={{ width: "35%", background: `linear-gradient(150deg, ${C.primary} 0%, ${C.primaryDark} 100%)`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", right: -40, width: 80, height: 80, background: C.lightGray, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, transform: "rotate(45deg)" }}>
          <div style={{ width: 64, height: 64, background: C.primary, border: `2px solid ${C.gold}`, transform: "rotate(-45deg)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
            <img src={LOGO_URL} alt="WallSwiss" className="pdf-image" style={{ height: 32 }} />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "0 100px", display: "flex", flexDirection: "column", justifyContent: "center", zIndex: 1 }}>
        <div style={{ color: C.gray, fontSize: 13, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16 }}>
          La stratégie recommandée
        </div>
        <div style={{ fontFamily: "'Times New Roman', Times, serif", color: C.primary, fontSize: 56, fontWeight: 700, lineHeight: 1.1 }}>
          Solution d'investissement
        </div>
        <div style={{ fontFamily: "'Times New Roman', Times, serif", color: C.gold, fontSize: 56, fontStyle: "italic", marginBottom: 40 }}>
          {title}
        </div>

        <div style={{ width: 48, height: 3, background: C.primary, marginBottom: 32 }} />

        <div style={{ display: "flex", gap: 20 }}>
          <div style={{ width: 4, background: C.gold, flexShrink: 0 }} />
          <EditableText editMode={editMode} value={data.texts?.dividerQuote} onChange={v => onTextChange("dividerQuote", v)} style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", color: C.darkGray, fontSize: 14, maxWidth: 500, lineHeight: 1.8, textAlign: "justify" }} />
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 9 — La solution compte titre
function SlideCompteTitre({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const bubbles = ["Épargne en cas de coup dur", "Financer un projet", "Disponibilité de l'épargne", "Complément de revenu pour la retraite", "Cadre fiscal avantageux", "Optimisation de la transmission"];
  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
        <div>
          <ReportTitle title="La solution" highlight="compte titre" subtitle="STRATÉGIE" />
          <EditableText editMode={editMode} value={data.texts?.solution1} onChange={v => onTextChange("solution1", v)} style={{ fontSize: 13.5, lineHeight: 1.8, color: C.darkGray, margin: "0 0 16px" }} />
          <EditableText editMode={editMode} value={data.texts?.solution2} onChange={v => onTextChange("solution2", v)} style={{ fontSize: 13.5, lineHeight: 1.8, color: C.darkGray, margin: "0 0 16px" }} />
          <EditableText editMode={editMode} value={data.texts?.solution3} onChange={v => onTextChange("solution3", v)} style={{ fontSize: 13.5, lineHeight: 1.8, color: C.darkGray, margin: 0 }} />
        </div>
        <div>
          <div style={{ background: C.primary, padding: 32, display: "flex", flexDirection: "column", alignItems: "center", borderRadius: "0px", boxShadow: "0 10px 30px rgba(105,33,2,0.15)" }}>
            <div style={{ color: C.white, fontSize: 18, fontWeight: 800, textAlign: "center", marginBottom: 24 }}>Couteau Suisse<br/>de l'épargne</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%" }}>
              {bubbles.map((b, i) => (
                <div key={i} style={{ background: C.gold, padding: "16px 14px", textAlign: "center", fontSize: 11.5, fontWeight: 600, color: C.white, lineHeight: 1.5, borderRadius: "0px" }}>{b}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 10 — NS (CH) FUNDS
function SlideFund({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      <div style={{ padding: "32px 80px 48px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ border: `3px solid ${C.gold}`, padding: "24px 32px", boxSizing: "border-box", background: C.white }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, fontWeight: 700, color: C.primary }}>NS (CH) FUNDS — Swiss Excellence DPM CHF</div>
            <div style={{ fontSize: 12, color: C.gray, marginTop: 6 }}>Fonds actions suisses — Synthèse institutionnelle</div>
          </div>
          <div style={{ width: "100%", height: 2, background: C.gold, margin: "16px 0 24px 0" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 48px", fontSize: 12 }}>
            <div>
              <div style={{ fontWeight: 700, color: C.gold, marginBottom: 8, fontSize: 13, textTransform: "uppercase" }}>Positionnement</div>
              {["Fonds actions 100% Suisse", "Devise : CHF", "Benchmark : SLI Swiss Leader Index TR", "Objectif : Surperformance du marché suisse"].map((t,i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}><span style={{ color: C.gold }}>—</span><span style={{ color: C.darkGray }}>{t}</span></div>
              ))}
              <div style={{ fontWeight: 700, color: C.gold, marginTop: 16, marginBottom: 8, fontSize: 13, textTransform: "uppercase" }}>Performance</div>
              {["Performance annualisée : 4,5%", "YTD 2025 : +8,40%", "Benchmark : +7,99%"].map((t,i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}><span style={{ color: C.gold }}>—</span><span style={{ color: C.darkGray }}>{t}</span></div>
              ))}
              <div style={{ fontWeight: 700, color: C.gold, marginTop: 16, marginBottom: 8, fontSize: 13, textTransform: "uppercase" }}>Structure de frais</div>
              {["Management fee : 1,50%", "Performance fee : 10%"].map((t,i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}><span style={{ color: C.gold }}>—</span><span style={{ color: C.darkGray }}>{t}</span></div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: C.gold, marginBottom: 8, fontSize: 13, textTransform: "uppercase" }}>Profil de risque</div>
              {["Volatilité annualisée : 13,2%", "Sharpe ratio : 0,26", "Beta : 0,99", "Corrélation indice : 0,99"].map((t,i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}><span style={{ color: C.gold }}>—</span><span style={{ color: C.darkGray }}>{t}</span></div>
              ))}
              <div style={{ fontWeight: 700, color: C.gold, marginTop: 16, marginBottom: 8, fontSize: 13, textTransform: "uppercase" }}>Principales positions</div>
              {["Roche — 6,86%", "Novartis — 6,59%", "Nestlé — 5,89%", "UBS — 5,51%"].map((t,i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}><span style={{ color: C.gold }}>—</span><span style={{ color: C.darkGray }}>{t}</span></div>
              ))}
              <div style={{ fontWeight: 700, color: C.gold, marginTop: 16, marginBottom: 8, fontSize: 13, textTransform: "uppercase" }}>Lecture stratégique WallSwiss</div>
              {["Exposition domestique CHF", "Qualité suisse défensive", "ESG intégré", "Complément idéal d'une allocation internationale USD"].map((t,i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}><span style={{ color: C.primary, fontWeight: 800 }}>✓</span><span style={{ color: C.darkGray }}>{t}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 11 — Projections
function SlideProjections({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const rows = computeProjections(data);
  const montant = Number(data.montantInvestissement || 100000);
  const frais = Number(data.fraisSouscription || 3);

  const svgW = 420; const svgH = 220;
  const padL = 50; const padR = 15; const padT = 10; const padB = 25;
  const w = svgW - padL - padR; const h = svgH - padT - padB;
  const maxVal = rows[rows.length-1].optimiste;
  const gridMax = Math.ceil(maxVal / 20000) * 20000 || 80000;
  
  const getX = (i) => padL + (i / (rows.length - 1)) * w;
  const getY = (val) => padT + h - (val / gridMax) * h;

  const dP = rows.map((r, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(r.pessimiste)}`).join(' ');
  const dR = rows.map((r, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(r.realiste)}`).join(' ');
  const dO = rows.map((r, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(r.optimiste)}`).join(' ');

  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "48px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Vos objectifs sur le" highlight="compte titre" subtitle="SIMULATION FINANCIÈRE" />
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 40, alignItems: "center", minHeight: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", paddingRight: 20 }}>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: C.darkGray, margin: "0 0 16px", textAlign: "justify" }}>
              Ici, nous vous conseillons d'optimiser votre trésorerie actuelle avec un compte titre chez <strong>SwissQuote</strong> sur la solution de placement avec un dépôt initial de <strong>CHF {fmt(montant)}.-</strong>
            </p>
            <p style={{ fontSize: 13, color: C.gray, margin: "0 0 32px", textAlign: "justify" }}>
              Nous appliquons des frais de souscription de {frais}% du montant investi soit {fmt(montant * frais / 100)}.-
            </p>
            
            <div style={{ display: "flex", gap: 20, marginBottom: 20, alignSelf: "center", fontSize: 12, fontWeight: 600 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: "50%", background: "#9CA3AF" }} /> Pessimiste</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: "50%", background: C.gold }} /> Réaliste</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: "50%", background: C.primaryDark }} /> Optimiste</div>
            </div>

            <div style={{ width: 420, height: 220, alignSelf: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width={420} height={220} viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: "visible" }}>
                {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                  const y = padT + h - (pct * h);
                  const val = gridMax * pct;
                  return (
                    <g key={pct}>
                      <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="#E5E7EB" strokeWidth="1" />
                      <text x={padL - 10} y={y + 4} fontSize="11" fill="#6B7280" textAnchor="end">{val === 0 ? "0" : val}</text>
                    </g>
                  );
                })}
                {rows.map((r, i) => (
                  <text key={i} x={getX(i)} y={svgH - 2} fontSize="11" fill="#6B7280" textAnchor="middle">N+{r.year}</text>
                ))}
                <path d={dP} fill="none" stroke="#9CA3AF" strokeWidth="3" />
                <path d={dR} fill="none" stroke={C.gold} strokeWidth="3" />
                <path d={dO} fill="none" stroke={C.primaryDark} strokeWidth="3" />
                {rows.map((r, i) => (
                  <g key={i}>
                    <circle cx={getX(i)} cy={getY(r.pessimiste)} r="4.5" fill="#9CA3AF" />
                    <circle cx={getX(i)} cy={getY(r.realiste)} r="4.5" fill={C.gold} />
                    <circle cx={getX(i)} cy={getY(r.optimiste)} r="4.5" fill={C.primaryDark} />
                  </g>
                ))}
              </svg>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16, textAlign: "center" }}>PROJECTIONS FINANCIÈRES*</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
              <thead>
                <tr style={{ background: C.primary, color: C.white }}>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600 }}>Années</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600 }}>Pessimiste<br/>({data.tauxPessimiste || 3}%)</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600 }}>Réaliste<br/>({data.tauxRealiste || 6}%)</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600 }}>Optimiste<br/>({data.tauxOptimiste || 9}%)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.lightGray : C.white }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: C.primary, textAlign: "center", borderBottom: "1px solid #E5E3DE" }}>N+{r.year}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid #E5E3DE" }}>{fmt(r.pessimiste)}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid #E5E3DE" }}>{fmt(r.realiste)}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700, color: C.primary, borderBottom: "1px solid #E5E3DE" }}>{fmt(r.optimiste)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 9, color: C.gray, marginTop: 12, lineHeight: 1.5, fontStyle: "italic", textAlign: "center", maxWidth: "90%" }}>
              *L'illustration présentée ne constitue pas un indicator fiable quant aux performances futures. Elle a seulement pour but d'illustrer les mécanismes de votre investissement.
            </p>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 12 — Avantages tarifaires
function SlideTarifs({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Avantages tarifaires WallSwiss —" highlight="WS Premium" subtitle="TARIFICATION" />
        <div style={{ fontSize: 14, color: C.gray, marginBottom: 40 }}>Conditions préférentielles "WS Premium" — présentation synthétique</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 800 }}>
          {[
            { label: "Droits de garde", value: "0,10% de 0 à 1 M CHF", badge: "max 200 CHF", sub: "Puis 0,03% au-delà de 1 M (pricing sur-mesure possible > 1 M)." },
            { label: "Frais d'achat AMC", value: "0,25%", badge: "min 50 CHF / transaction", sub: "" },
            { label: "Taux de change", value: "0,40% jusqu'à 100 000 CHF", badge: "0,20% au-delà", sub: "" },
          ].map((item, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "200px 1fr", border: `1px solid ${C.mediumGray}`, overflow: "hidden", borderRadius: "0px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              <div style={{ background: C.lightGray, padding: "20px 24px", display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.darkGray }}>{item.label}</span>
              </div>
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div>
                  <span style={{ fontSize: 18, fontWeight: 800, color: C.primary }}>{item.value}</span>
                  {item.badge && <span style={{ marginLeft: 16, fontSize: 11, fontWeight: 700, color: C.primary, border: `1px solid ${C.primary}`, padding: "3px 10px", textTransform: "uppercase", borderRadius: "0px" }}>{item.badge}</span>}
                </div>
                {item.sub && <div style={{ fontSize: 11, color: C.gray, marginTop: 6 }}>{item.sub}</div>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: C.gray, marginTop: 24, fontStyle: "italic" }}>Tarification indicative à valider selon profil client, volume et configuration de portefeuille.</div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 13 — Comparatif bancaire
function SlideComparatif({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Profil 2 —" highlight="Patrimoine en croissance" subtitle="COMPARATIF BANCAIRE" />
        <div style={{ fontSize: 14, color: C.gray, marginBottom: 32 }}>Portefeuille 300 kCHF ; change annuel 60 kCHF ; achats d'AMC 20 kCHF/an.</div>
        <table style={{ width: "100%", maxWidth: 800, borderCollapse: "collapse", fontSize: 13, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
          <thead>
            <tr>
              <th style={{ padding: "16px 20px", textAlign: "left", color: C.primary, fontWeight: 700, borderBottom: `2px solid ${C.primary}`, background: C.white }}>Banque</th>
              <th style={{ padding: "16px 20px", textAlign: "right", color: C.primary, fontWeight: 700, borderBottom: `2px solid ${C.primary}`, background: C.white }}>Garde (an)</th>
              <th style={{ padding: "16px 20px", textAlign: "right", color: C.primary, fontWeight: 700, borderBottom: `2px solid ${C.primary}`, background: C.white }}>Change (an)</th>
              <th style={{ padding: "16px 20px", textAlign: "right", color: C.primary, fontWeight: 700, borderBottom: `2px solid ${C.primary}`, background: C.white }}>AMC (an)</th>
              <th style={{ padding: "16px 20px", textAlign: "right", color: C.primary, fontWeight: 700, borderBottom: `2px solid ${C.primary}`, background: C.white }}>Total (an)</th>
            </tr>
          </thead>
          <tbody>
            {[
              { bank: "WallSwiss / Swissquote", garde: 200, change: 240, amc: 50, total: 490 },
              { bank: "Raiffeisen", garde: 750, change: 750, amc: 180, total: 1680 },
              { bank: "UBS", garde: 1050, change: 1020, amc: 200, total: 2270 },
            ].map((r, i) => (
              <tr key={i} style={{ background: i === 0 ? "rgba(105,33,2,0.05)" : C.white }}>
                <td style={{ padding: "16px 20px", fontWeight: i === 0 ? 700 : 500, color: i === 0 ? C.primary : C.black, borderBottom: `1px solid ${C.lightGray}` }}>{r.bank}</td>
                <td style={{ padding: "16px 20px", textAlign: "right", color: C.primary, fontWeight: 600, borderBottom: `1px solid ${C.lightGray}` }}>{r.garde}</td>
                <td style={{ padding: "16px 20px", textAlign: "right", color: C.primary, fontWeight: 600, borderBottom: `1px solid ${C.lightGray}` }}>{r.change}</td>
                <td style={{ padding: "16px 20px", textAlign: "right", color: C.gold, fontWeight: 600, borderBottom: `1px solid ${C.lightGray}` }}>{r.amc}</td>
                <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 700, color: i === 0 ? C.primary : C.black, borderBottom: `1px solid ${C.lightGray}` }}>{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: 10, color: C.gray, marginTop: 20, fontStyle: "italic" }}>Hypothèses : tarifs publics/partenaires ; à valider selon profil & package.</div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 14 — Application SwissQuote
function SlideApp({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
        <div>
          <ReportTitle title="Votre application de suivi" highlight="SwissQuote" subtitle="CENTRALISEZ L'ENSEMBLE DE VOS FINANCES EN UN SEUL ENDROIT" />
          <EditableText editMode={editMode} value={data.texts?.appP1} onChange={v => onTextChange("appP1", v)} style={{ fontSize: 13.5, lineHeight: 1.8, color: C.darkGray, margin: "0 0 20px", textAlign: "justify" }} />
          <EditableText editMode={editMode} value={data.texts?.appP2} onChange={v => onTextChange("appP2", v)} style={{ fontSize: 13.5, lineHeight: 1.8, color: C.darkGray, margin: 0, textAlign: "justify" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", height: "100%" }}>
          <img src="/imgi_10_width_799.webp" alt="Swissquote App Desktop" className="pdf-image" style={{ width: "85%", objectFit: "contain", borderRadius: "0px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", zIndex: 1 }} />
          <img src="/imgi_9_width_400.webp" alt="Swissquote App Mobile" className="pdf-image" style={{ width: "35%", objectFit: "contain", position: "absolute", bottom: "8%", right: "2%", borderRadius: "0px", boxShadow: "0 15px 40px rgba(0,0,0,0.3)", zIndex: 2 }} />
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 15 — Contact
function SlideContact({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={{ ...slideBase, background: C.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", opacity: 0.03, pointerEvents: "none", zIndex: 1 }}>
         <img src={LOGO_URL} alt="" className="pdf-image" style={{ width: "800px", filter: "invert(1)" }} />
      </div>

      <div style={{ zIndex: 2, display: "flex", width: "100%", padding: "0 80px", gap: "80px", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16 }}>SYNTHÈSE & CONTACT</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 48, fontWeight: 700, color: C.primary, lineHeight: 1.1, marginBottom: 24 }}>
            Prêt à concrétiser<br/><em style={{ color: C.gold }}>vos projets ?</em>
          </div>
          <div style={{ width: 48, height: 4, background: C.gold, marginBottom: 32 }} />
          <EditableText editMode={editMode} value={data.texts?.contactDesc} onChange={v => onTextChange("contactDesc", v)} style={{ fontSize: 14, lineHeight: 1.8, color: C.darkGray, margin: 0, maxWidth: 480 }} />
        </div>

        <div style={{ width: 420, border: `1px solid ${C.mediumGray}`, padding: "56px 48px", position: "relative", background: C.white, boxShadow: "0 10px 40px rgba(0,0,0,0.05)", borderRadius: "0px" }}>
          <div style={{ position: "absolute", top: -12, left: 40, background: C.white, padding: "0 16px", color: C.gold, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            VOTRE INTERLOCUTEUR DÉDIÉ
          </div>
          
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 32, fontWeight: 700, color: C.primary, marginBottom: 6 }}>{data.conseiller || "Louis Borne"}</div>
          <div style={{ color: C.gray, fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 40 }}>{data.titreConseiller || "Conseillère en Gestion de Patrimoine"}</div>
          
          <div style={{ display: "grid", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: "0px", background: "rgba(105,33,2,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, fontWeight: 700, fontSize: 15 }}>T</div>
              <span style={{ fontSize: 15, color: C.darkGray, fontWeight: 600 }}>{data.telephone || "+41.76.231.92.75"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: "0px", background: "rgba(105,33,2,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, fontWeight: 700, fontSize: 15 }}>E</div>
              <span style={{ fontSize: 15, color: C.darkGray, fontWeight: 600 }}>{data.email || "l.borne@wallswiss.ch"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: "0px", background: "rgba(105,33,2,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, fontWeight: 700, fontSize: 15 }}>A</div>
              <span style={{ fontSize: 15, color: C.darkGray, fontWeight: 600 }}>Rue Kleberg 14, 1201 Genève</span>
            </div>
          </div>
        </div>
      </div>
      
      {footer(fullName)}
    </div>
  );
}

// ────────────────────── SLIDES PRÉVOYANCE 3A/3B ──────────────────────

function SlideTOCPrevoyance({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const items = [
    { title: "Qui sommes-nous ? Notre philosophie", page: 3 },
    { title: "Notre cabinet en chiffres", page: 4 },
    { title: "Résumé de votre situation personnelle", page: 5 },
    { title: "Le système des 3 piliers suisses", page: 6 },
    { title: "Avantages de la Prévoyance 3A/3B", page: 7 },
    { title: "Solution — Prévoyance & Assurance Vie", page: 9 }, 
    { title: "Couvertures de risque et garanties", page: 10 },
    { title: "Stratégie : Fonds de placement", page: 11 },
  ];
  
  let nextPage = 12;
  if (data.profilRisque === "Dynamique") {
      items.push({ title: "Détail Stratégie Dynamique & Performances", page: nextPage++ });
  }
  items.push({ title: "Comprendre la Valeur de Rachat", page: nextPage++ });
  
  if(data.optiFiscale) {
      items.push({ title: "Impact & Optimisation Fiscale", page: nextPage++ });
  }
  items.push({ title: "Projections financières et capitalisation", page: nextPage++ });
  items.push({ title: "Synthèse & Contact", page: nextPage });

  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Table des matières" subtitle="STRUCTURE DE VOTRE PRÉSENTATION" />
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 80, rowGap: 24, alignContent: "center", maxWidth: 1000, margin: "0" }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-end", width: "100%", paddingBottom: 6 }}>
              <span style={{ color: C.darkGray, fontSize: 15, fontWeight: 600, paddingBottom: 2 }}>
                {item.title}
              </span>
              <div style={{ flex: 1, borderBottom: `2px dotted ${C.mediumGray}`, margin: "0 16px", position: "relative", top: -8 }} />
              <span style={{ color: C.primary, fontSize: 16, fontWeight: 700, flexShrink: 0, paddingBottom: 2 }}>
                {String(item.page).padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlidePrevoyanceIntro({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Le système des 3 piliers" highlight="en Suisse" subtitle="FONDATIONS DE VOTRE AVENIR" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32, flex: 1, alignItems: "center" }}>
          <div style={{ background: C.lightGray, padding: 32, borderTop: `4px solid ${C.darkGray}`, height: "100%", borderRadius: "0px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: C.darkGray, opacity: 0.2, marginBottom: -20 }}>1</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.primary, marginBottom: 16 }}>Prévoyance Étatique</div>
            <div style={{ fontWeight: 700, color: C.darkGray, fontSize: 13, marginBottom: 8 }}>AVS / AI / APG</div>
            <EditableText editMode={editMode} value={data.texts?.prevIntroP1} onChange={v => onTextChange("prevIntroP1", v)} style={{ fontSize: 12, color: C.gray, lineHeight: 1.6, textAlign: "justify", margin: 0 }} />
          </div>
          <div style={{ background: C.lightGray, padding: 32, borderTop: `4px solid ${C.gold}`, height: "100%", borderRadius: "0px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: C.gold, opacity: 0.2, marginBottom: -20 }}>2</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.primary, marginBottom: 16 }}>Prévoyance Professionnelle</div>
            <div style={{ fontWeight: 700, color: C.darkGray, fontSize: 13, marginBottom: 8 }}>LPP / LAA</div>
            <EditableText editMode={editMode} value={data.texts?.prevIntroP2} onChange={v => onTextChange("prevIntroP2", v)} style={{ fontSize: 12, color: C.gray, lineHeight: 1.6, textAlign: "justify", margin: 0 }} />
          </div>
          <div style={{ background: "rgba(105,33,2,0.04)", padding: 32, borderTop: `4px solid ${C.primary}`, height: "100%", borderRadius: "0px", display: "flex", flexDirection: "column", boxShadow: "0 10px 30px rgba(105,33,2,0.1)" }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: C.primary, opacity: 0.2, marginBottom: -20 }}>3</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.primary, marginBottom: 16 }}>Prévoyance Privée</div>
            <div style={{ fontWeight: 700, color: C.darkGray, fontSize: 13, marginBottom: 8 }}>Pilier 3A (lié) & 3B (libre)</div>
            <EditableText editMode={editMode} value={data.texts?.prevIntroP3} onChange={v => onTextChange("prevIntroP3", v)} style={{ fontSize: 12, color: C.primaryDark, lineHeight: 1.6, textAlign: "justify", fontWeight: 500, margin: 0 }} />
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlidePrevoyanceAvantages({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {logoCorner()}
      <div style={{ padding: "48px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Avantages de la Prévoyance" highlight="3A et 3B" subtitle="VOS BÉNÉFICES DIRECTS" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 48px", flex: 1, alignContent: "center" }}>
          {[
            { title: "Économies d'impôts massives (3A)", desc: "Les versements au pilier 3A sont entièrement déductibles du revenu imposable, permettant d'économiser un mois de salaire en impôts sur quelques années." },
            { title: "Sécurité et Protection de la famille", desc: "En cas de décès ou d'invalidité, le capital ou une rente est garanti pour protéger vos proches et maintenir leur niveau de vie." },
            { title: "Rendement supérieur", desc: "Contrairement à un compte épargne classique, la prévoyance investie dans des fonds permet de lutter contre l'inflation et de capitaliser." },
            { title: "Flexibilité du 3B", desc: "Le pilier 3B offre une épargne totalement libre, sans plafond de versement, disponible pour financer un projet (immobilier, études, etc.)." },
            { title: "Financement immobilier", desc: "Les avoirs du pilier 3A ou 3B peuvent être mis en nantissement ou retirés pour financer l'achat de votre résidence principale." },
            { title: "Exonération fiscale (3B)", desc: "Les plus-values générées dans le cadre d'une assurance-vie 3B (sous conditions) sont souvent exonérées d'impôts sur le revenu." },
          ].map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", background: C.white, padding: "16px 20px", border: `1px solid ${C.lightGray}`, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
              <div style={{ background: "rgba(165,149,104,0.15)", color: C.gold, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>✓</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.primary, marginBottom: 4 }}>{a.title}</div>
                <div style={{ fontSize: 11.5, color: C.gray, lineHeight: 1.5, textAlign: "justify" }}>{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlidePrevoyanceSolution({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
        <div>
          <ReportTitle title="La solution" highlight="Prévoyance" subtitle="STRATÉGIE RECOMMANDÉE" />
          <EditableText editMode={editMode} value={data.texts?.prevoyanceSol1} onChange={v => onTextChange("prevoyanceSol1", v)} style={{ fontSize: 13.5, lineHeight: 1.8, color: C.darkGray, margin: "0 0 16px" }} />
          <EditableText editMode={editMode} value={data.texts?.prevoyanceSol2} onChange={v => onTextChange("prevoyanceSol2", v)} style={{ fontSize: 13.5, lineHeight: 1.8, color: C.darkGray, margin: "0 0 16px" }} />
          <EditableText editMode={editMode} value={data.texts?.prevoyanceSol3} onChange={v => onTextChange("prevoyanceSol3", v)} style={{ fontSize: 13.5, lineHeight: 1.8, color: C.darkGray, margin: 0 }} />
        </div>
        <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
           <img src="/geneva.jpg" alt="Famille Suisse" className="pdf-image" style={{ width: "100%", height: "80%", objectFit: "cover", boxShadow: "0 10px 40px rgba(0,0,0,0.15)" }} />
           <div style={{ position: "absolute", bottom: "5%", left: "-10%", background: C.primary, color: C.white, padding: "24px 32px", boxShadow: "0 8px 24px rgba(105,33,2,0.3)" }}>
              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Sérénité absolue</div>
              <div style={{ fontSize: 12, lineHeight: 1.5, opacity: 0.9 }}>Préparez votre avenir et celui<br/>de vos proches dès aujourd'hui.</div>
           </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlidePrevoyanceCouvertures({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Vos garanties &" highlight="Couvertures de risque" subtitle="PROTECTION DE LA FAMILLE ET DU PROJET" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 24 }}>
          <div style={{ display: "flex", gap: 24, alignItems: "stretch" }}>
            <div style={{ background: C.primary, width: 8, flexShrink: 0 }} />
            <div style={{ background: C.lightGray, padding: 24, flex: 1, boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.primary, marginBottom: 8 }}>Libération du paiement des primes (LPP)</div>
              <EditableText editMode={editMode} value={data.texts?.prevCouvP1} onChange={v => onTextChange("prevCouvP1", v)} style={{ fontSize: 13, color: C.darkGray, lineHeight: 1.5, textAlign: "justify", margin: 0 }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "stretch" }}>
            <div style={{ background: C.gold, width: 8, flexShrink: 0 }} />
            <div style={{ background: C.lightGray, padding: 24, flex: 1, boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.gold, marginBottom: 8 }}>Capital en cas de décès</div>
              <EditableText editMode={editMode} value={data.texts?.prevCouvP2} onChange={v => onTextChange("prevCouvP2", v)} style={{ fontSize: 13, color: C.darkGray, lineHeight: 1.5, textAlign: "justify", margin: 0 }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "stretch" }}>
            <div style={{ background: C.darkGray, width: 8, flexShrink: 0 }} />
            <div style={{ background: C.lightGray, padding: 24, flex: 1, boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.darkGray, marginBottom: 8 }}>Rentes Invalidité & Couvertures complémentaires</div>
              <EditableText editMode={editMode} value={data.texts?.prevCouvP3} onChange={v => onTextChange("prevCouvP3", v)} style={{ fontSize: 13, color: C.darkGray, lineHeight: 1.5, textAlign: "justify", margin: 0 }} />
            </div>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlidePrevoyanceFonds({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const compagnie = data.compagniePrevoyance || "Liechtenstein Life";
  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Stratégie de placement :" highlight="Vos Fonds" subtitle={`PARTENAIRE : ${compagnie.toUpperCase()}`} />
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "center" }}>
          <div>
            <EditableText editMode={editMode} value={data.texts?.prevFondsIntro} onChange={v => onTextChange("prevFondsIntro", v)} style={{ fontSize: 14, color: C.darkGray, lineHeight: 1.7, marginBottom: 24, textAlign: "justify" }} />
            <div style={{ borderLeft: `3px solid ${C.gold}`, paddingLeft: 16, marginBottom: 24 }}>
              <div style={{ fontWeight: 700, color: C.primary, fontSize: 15, marginBottom: 4 }}>Profil de gestion sélectionné</div>
              <div style={{ color: C.gold, fontWeight: 600, fontSize: 13 }}>{data.profilRisque || "Équilibré"}</div>
            </div>
            <div style={{ color: C.primary, fontWeight: 700, fontSize: 13, marginBottom: 8, textTransform: "uppercase" }}>Votre stratégie d'investissement :</div>
            <EditableText editMode={editMode} value={data.texts?.strategieFonds} onChange={v => onTextChange("strategieFonds", v)} style={{ fontSize: 13, color: C.darkGray, lineHeight: 1.6 }} />
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 280 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.primary, marginBottom: 12 }}>{compagnie}</div>
            <div style={{ fontSize: 12, color: C.gray, textAlign: "center", lineHeight: 1.5 }}>
              Architecture ouverte et sélection<br/>des meilleurs gérants mondiaux.
            </div>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlidePrevoyanceFondsDynamique({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  
  // 💡 API : À remplacer par un fetch vers votre fournisseur de données réelles
  const fundPerformanceAPI = {
    "IE00B5BMR087": { name: "iShares Core S&P 500 UCITS ETF", "3m": "+8.2%", "1y": "+24.5%", "3y": "+35.1%", "5y": "+85.4%", "10y": "+210.3%", "10y_ann": "+12.0%" },
    "IE00B53SZB19": { name: "iShares NASDAQ 100 UCITS ETF", "3m": "+10.1%", "1y": "+38.2%", "3y": "+45.6%", "5y": "+120.8%", "10y": "+340.5%", "10y_ann": "+16.0%" },
    "CH0237935637": { name: "iShares Core SPI (CH)", "3m": "+4.5%", "1y": "+8.9%", "3y": "+15.2%", "5y": "+32.1%", "10y": "+75.4%", "10y_ann": "+5.8%" },
    "DE000A0S9GB0": { name: "Xtrackers DAX UCITS ETF", "3m": "+6.2%", "1y": "+14.5%", "3y": "+22.4%", "5y": "+45.7%", "10y": "+95.2%", "10y_ann": "+6.9%" },
    "LU0328475792": { name: "Pictet - Water", "3m": "+3.1%", "1y": "+11.2%", "3y": "+18.5%", "5y": "+42.3%", "10y": "+105.6%", "10y_ann": "+7.5%" }
  };

  const funds = [
    { isin: "IE00B5BMR087", weight: 30 },
    { isin: "IE00B53SZB19", weight: 25 },
    { isin: "CH0237935637", weight: 15 },
    { isin: "DE000A0S9GB0", weight: 15 },
    { isin: "LU0328475792", weight: 15 }
  ];

  return (
    <div style={slideBase}>
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Détail Stratégie" highlight="Dynamique" subtitle="RÉPARTITION ET PERFORMANCES HISTORIQUES" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 13, color: C.darkGray, marginBottom: 24 }}>Analyse des fonds sous-jacents composant votre portefeuille dynamique. Les rendements ci-dessous sont connectables en temps réel.</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "left", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
            <thead>
              <tr style={{ background: C.primary, color: C.white }}>
                <th style={{ padding: "12px 16px" }}>ISIN</th>
                <th style={{ padding: "12px 16px" }}>Nom du Fonds</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Poids</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>3 Mois</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>1 An</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>3 Ans</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>5 Ans</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>10 Ans (Cumul)</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Moy. Annuelle</th>
              </tr>
            </thead>
            <tbody>
              {funds.map((f, i) => {
                const apiData = fundPerformanceAPI[f.isin] || {};
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.lightGray : C.white, borderBottom: `1px solid ${C.mediumGray}` }}>
                    <td style={{ padding: "12px 16px", color: C.gray, fontFamily: "monospace" }}>{f.isin}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: C.primaryDark }}>{apiData.name}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 800, color: C.primary }}>{f.weight}%</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", color: C.darkGray }}>{apiData["3m"]}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", color: C.darkGray }}>{apiData["1y"]}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", color: C.darkGray }}>{apiData["3y"]}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", color: C.darkGray }}>{apiData["5y"]}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700, color: C.darkGray }}>{apiData["10y"]}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 800, color: C.primary }}>{apiData["10y_ann"]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlidePrevoyanceRachat({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Comprendre la" highlight="Valeur de Rachat" subtitle="MÉCANISME DU PRODUIT RETRAITE" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 64 }}>
          <div style={{ flex: 1 }}>
             <EditableText editMode={editMode} value={data.texts?.prevRachatP1} onChange={v => onTextChange("prevRachatP1", v)} style={{ fontSize: 14, lineHeight: 1.8, color: C.darkGray, textAlign: "justify", marginBottom: 24 }} />
             <ul style={{ paddingLeft: 20, margin: "0 0 24px 0", color: C.darkGray, fontSize: 13.5, lineHeight: 1.8 }}>
               <li><strong>Mise en place des garanties :</strong> Une part de vos premiers versements est allouée à la création de votre bouclier financier (capital décès, libération des primes).</li>
               <li><strong>Fondation du capital :</strong> Le reste est investi sur les marchés pour commencer à générer vos futurs rendements exponentiels.</li>
             </ul>
             <EditableText editMode={editMode} value={data.texts?.prevRachatP2} onChange={v => onTextChange("prevRachatP2", v)} style={{ fontSize: 14, lineHeight: 1.8, color: C.primary, textAlign: "justify", fontWeight: 600, margin: 0 }} />
          </div>
          <div style={{ width: 400, background: C.lightGray, padding: 32, borderLeft: `4px solid ${C.gold}` }}>
            <div style={{ textAlign: "left", color: C.primary, fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Motifs de retrait anticipé (3A)</div>
            <div style={{ fontSize: 13, color: C.darkGray, lineHeight: 1.6, marginBottom: 12 }}>Bien que conçu pour la retraite, le capital peut être débloqué avant terme sous certaines conditions légales :</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 10 }}><span style={{ color: C.gold, fontWeight: 800 }}>✓</span><span style={{ fontSize: 12.5, color: C.darkGray }}>Achat de la résidence principale</span></div>
              <div style={{ display: "flex", gap: 10 }}><span style={{ color: C.gold, fontWeight: 800 }}>✓</span><span style={{ fontSize: 12.5, color: C.darkGray }}>Départ définitif de la Suisse</span></div>
              <div style={{ display: "flex", gap: 10 }}><span style={{ color: C.gold, fontWeight: 800 }}>✓</span><span style={{ fontSize: 12.5, color: C.darkGray }}>Lancement d'une activité indépendante</span></div>
            </div>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlidePrevoyanceFiscalite({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Impact & Optimisation" highlight="Fiscale" subtitle="LE LEVIER DU PILIER 3A" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 64 }}>
          <div style={{ flex: 1 }}>
             <EditableText editMode={editMode} value={data.texts?.prevFiscP1} onChange={v => onTextChange("prevFiscP1", v)} style={{ fontSize: 14, lineHeight: 1.8, color: C.darkGray, textAlign: "justify", marginBottom: 24 }} />
             <EditableText editMode={editMode} value={data.texts?.prevFiscP2} onChange={v => onTextChange("prevFiscP2", v)} style={{ fontSize: 14, lineHeight: 1.8, color: C.darkGray, textAlign: "justify", margin: 0 }} />
          </div>
          <div style={{ width: 400, background: C.white, border: `2px solid ${C.gold}`, padding: 32, boxShadow: "0 15px 35px rgba(0,0,0,0.05)" }}>
            <div style={{ textAlign: "center", color: C.primary, fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 24 }}>Mécanisme de déduction</div>
            
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${C.lightGray}`, paddingBottom: 12, marginBottom: 12 }}>
              <span style={{ color: C.gray, fontSize: 13 }}>Revenu imposable initial</span>
              <span style={{ color: C.darkGray, fontWeight: 600, fontSize: 13 }}>CHF {fmt(data.revenus || 120000)}.-</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${C.lightGray}`, paddingBottom: 12, marginBottom: 12 }}>
              <span style={{ color: C.gold, fontSize: 13, fontWeight: 600 }}>Versement Pilier 3A Max (2025)</span>
              <span style={{ color: C.gold, fontWeight: 700, fontSize: 13 }}>- CHF 7'258.-</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `2px solid ${C.primary}`, paddingBottom: 12, marginBottom: 16 }}>
              <span style={{ color: C.primary, fontSize: 13, fontWeight: 700 }}>Nouveau revenu imposable</span>
              <span style={{ color: C.primary, fontWeight: 800, fontSize: 14 }}>CHF {fmt(Number(data.revenus || 120000) - 7258)}.-</span>
            </div>
            
            <div style={{ background: "rgba(105,33,2,0.05)", padding: 16, textAlign: "center", marginTop: 24 }}>
               <div style={{ fontSize: 11, color: C.gray, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 8 }}>Économie d'impôt estimée par an</div>
               <div style={{ fontSize: 28, color: C.primary, fontWeight: 900 }}>~ CHF {fmt(Math.round(7258 * 0.30))}.-</div>
            </div>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlideProjectionsPrevoyance({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const rows = computeProjectionsPrevoyance(data);
  const annual = Number(data.capaciteEpargne || 500) * 12;

  // SVG Chart variables
  const svgW = 480; const svgH = 240;
  const padL = 60; const padR = 20; const padT = 20; const padB = 30;
  const w = svgW - padL - padR; const h = svgH - padT - padB;
  const maxVal = rows[rows.length-1].optimiste;
  const gridMax = Math.ceil(maxVal / 50000) * 50000 || 150000;
  
  const getX = (i) => padL + (i / (rows.length - 1)) * w;
  const getY = (val) => padT + h - (val / gridMax) * h;

  const dInvested = rows.map((r, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(r.invested)}`).join(' ');
  const dPessimiste = rows.map((r, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(r.pessimiste)}`).join(' ');
  const dRealiste = rows.map((r, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(r.realiste)}`).join(' ');
  const dOptimiste = rows.map((r, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(r.optimiste)}`).join(' ');

  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "48px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Croissance de votre" highlight="Capital Prévoyance" subtitle={`PROJECTION JUSQU'À 65 ANS (${Math.max(1, 65 - (Number(data.age)||40))} ANS)`} />
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "center", minHeight: 0 }}>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
             <p style={{ fontSize: 13, lineHeight: 1.6, color: C.darkGray, margin: "0 0 16px", textAlign: "justify" }}>
              En investissant <strong>CHF {fmt(data.capaciteEpargne || 500)}.- / mois</strong>, voici la projection de votre capital à la retraite ({data.tauxPessimistePrev}% / {data.tauxRealistePrev}% / {data.tauxOptimistePrev}%), en tenant compte de l'effet des intérêts composés.
            </p>

            <div style={{ width: svgW, height: svgH, alignSelf: "center", background: C.white, border: `1px solid ${C.lightGray}`, padding: "10px 0" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: "visible" }}>
                {/* Y Axis */}
                {[0, 0.33, 0.66, 1].map(pct => {
                  const y = padT + h - (pct * h);
                  const val = Math.round(gridMax * pct);
                  return (
                    <g key={pct}>
                      <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
                      <text x={padL - 10} y={y + 4} fontSize="11" fill="#6B7280" textAnchor="end">{fmt(val)}</text>
                    </g>
                  );
                })}
                {/* X Axis */}
                {rows.map((r, i) => (
                  <text key={i} x={getX(i)} y={svgH - 5} fontSize="11" fill="#6B7280" textAnchor="middle">{r.age} ans</text>
                ))}
                
                {/* Area under realiste */}
                <path d={`${dRealiste} L ${getX(rows.length-1)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`} fill="rgba(105,33,2,0.05)" />
                
                {/* Lines */}
                <path d={dInvested} fill="none" stroke={C.gray} strokeWidth="2" strokeDasharray="6 4" />
                <path d={dPessimiste} fill="none" stroke="#9CA3AF" strokeWidth="2" />
                <path d={dRealiste} fill="none" stroke={C.primary} strokeWidth="3" />
                <path d={dOptimiste} fill="none" stroke={C.gold} strokeWidth="2" />
                
                {/* Points Realiste */}
                {rows.map((r, i) => (
                  <g key={i}>
                    <circle cx={getX(i)} cy={getY(r.invested)} r="3" fill={C.gray} />
                    <circle cx={getX(i)} cy={getY(r.realiste)} r="5" fill={C.primary} stroke={C.white} strokeWidth="2" />
                  </g>
                ))}
              </svg>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 16, alignSelf: "center", fontSize: 11, fontWeight: 600 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 2, background: C.gray, borderBottom: "2px dashed" }} /> Total Versé</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#9CA3AF" }} /> Pessimiste</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: C.primary }} /> Réaliste</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: C.gold }} /> Optimiste</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
              <thead>
                <tr style={{ background: C.primary, color: C.white }}>
                  <th style={{ padding: "10px 8px", fontWeight: 600 }}>Âge</th>
                  <th style={{ padding: "10px 8px", fontWeight: 600 }}>Versé</th>
                  <th style={{ padding: "10px 8px", fontWeight: 600 }}>Pessimiste</th>
                  <th style={{ padding: "10px 8px", fontWeight: 600 }}>Réaliste</th>
                  <th style={{ padding: "10px 8px", fontWeight: 600 }}>Optimiste</th>
                </tr>
              </thead>
              <tbody>
                {rows.filter(r => r.year > 0).map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.lightGray : C.white }}>
                    <td style={{ padding: "10px 8px", fontWeight: 700, color: C.primary, borderBottom: "1px solid #E5E3DE" }}>{r.age} ans</td>
                    <td style={{ padding: "10px 8px", color: C.darkGray, borderBottom: "1px solid #E5E3DE" }}>{fmt(r.invested)}</td>
                    <td style={{ padding: "10px 8px", color: C.darkGray, borderBottom: "1px solid #E5E3DE" }}>{fmt(r.pessimiste)}</td>
                    <td style={{ padding: "10px 8px", fontWeight: 700, color: C.primary, borderBottom: "1px solid #E5E3DE" }}>{fmt(r.realiste)}</td>
                    <td style={{ padding: "10px 8px", fontWeight: 700, color: C.gold, borderBottom: "1px solid #E5E3DE" }}>{fmt(r.optimiste)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.optiFiscale && (
              <div style={{ marginTop: 12, background: "rgba(165,149,104,0.1)", padding: "8px 16px", border: `1px solid ${C.gold}`, color: C.primaryDark, fontSize: 11, fontWeight: 700 }}>
                Gain Fiscal Cumulé à 65 ans : ~ CHF {fmt(rows[rows.length-1].taxSavings)}.-
              </div>
            )}
            <p style={{ fontSize: 9, color: C.gray, marginTop: 12, lineHeight: 1.5, fontStyle: "italic", textAlign: "center" }}>
              *Simulation non garantie à but illustratif. Les performances passées ne préjugent pas des résultats futurs.
            </p>
          </div>

        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// ────────────────────── PREVIEW MODAL ──────────────────────

function ReportPreview({ data, onClose, onUpdateData }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const handleTextChange = (key, value) => {
    onUpdateData({ ...data, texts: { ...data.texts, [key]: value } });
  };

  const requireHtml2Pdf = async () => {
    if (window.html2pdf) return window.html2pdf;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve(window.html2pdf);
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  const handleDownloadPDF = async () => {
    setIsPdfLoading(true);

    const element = document.getElementById('report-printable');
    if (!element) {
        setIsPdfLoading(false);
        return;
    }

    const images = element.querySelectorAll('img.pdf-image');
    const imagePromises = Array.from(images).map(async (img) => {
        if (img.src && !img.src.startsWith('data:')) {
            const base64 = await getBase64Image(img.src);
            img.src = base64;
        }
    });

    await Promise.all(imagePromises);

    setTimeout(async () => {
      const textareas = element.querySelectorAll('textarea');
      const replacements = [];
      textareas.forEach((textarea) => {
        const div = document.createElement('div');
        div.style.cssText = window.getComputedStyle(textarea).cssText;
        div.style.height = 'auto';
        div.style.whiteSpace = 'pre-wrap';
        div.style.border = 'none';
        div.style.background = 'transparent';
        div.style.resize = 'none';
        div.style.textAlign = 'justify'; 
        div.innerText = textarea.value;
        textarea.parentNode.insertBefore(div, textarea);
        textarea.style.display = 'none';
        replacements.push({ textarea, div });
      });

      try {
        const html2pdf = await requireHtml2Pdf();
        
        window.scrollTo(0, 0);
        
        await html2pdf()
          .set({
            margin: 0,
            filename: `Rapport_${data.nom || 'Client'}.pdf`,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              scrollY: 0,
              scrollX: 0,
              x: 0, 
              y: 0, 
              windowWidth: 1280,
              logging: false
            },
            pagebreak: { mode: ['css', 'legacy'] },
            jsPDF: { unit: 'in', format: [13.33334, 7.5], orientation: 'landscape' }
          })
          .from(element)
          .save();
      } catch(e) {
        console.error("Erreur PDF:", e);
      } finally {
        replacements.forEach(({ textarea, div }) => {
          textarea.style.display = '';
          div.remove();
        });
        setIsPdfLoading(false);
      }
    }, 500); 
  };

  const slidesSwissquote = [
    <SlideCover data={data} />,
    <SlideTOC data={data} />,
    <SlidePhilosophy data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideAbout data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideSituation data={data} />,
    <SlideSwissquote data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideAdvantages data={data} />,
    <SlideDivider data={data} number={8} title="Compte Titre" editMode={editMode} onTextChange={handleTextChange} />,
    <SlideCompteTitre data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideFund data={data} />,
    <SlideProjections data={data} />,
    <SlideTarifs data={data} />,
    <SlideComparatif data={data} />,
    <SlideApp data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideContact data={data} editMode={editMode} onTextChange={handleTextChange} />,
  ];

  const slidesPrevoyance = [
    <SlideCover data={data} />,
    <SlideTOCPrevoyance data={data} />,
    <SlidePhilosophy data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideAbout data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideSituation data={data} />,
    <SlidePrevoyanceIntro data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlidePrevoyanceAvantages data={data} />,
    <SlideDivider data={data} number={8} title="Prévoyance 3A/3B" editMode={editMode} onTextChange={handleTextChange} />,
    <SlidePrevoyanceSolution data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlidePrevoyanceCouvertures data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlidePrevoyanceFonds data={data} editMode={editMode} onTextChange={handleTextChange} />,
  ];

  if (data.profilRisque === "Dynamique") {
      slidesPrevoyance.push(<SlidePrevoyanceFondsDynamique data={data} />);
  }
  slidesPrevoyance.push(<SlidePrevoyanceRachat data={data} editMode={editMode} onTextChange={handleTextChange} />);

  if (data.optiFiscale) {
      slidesPrevoyance.push(<SlidePrevoyanceFiscalite data={data} editMode={editMode} onTextChange={handleTextChange} />);
  }
  slidesPrevoyance.push(<SlideProjectionsPrevoyance data={data} />);
  slidesPrevoyance.push(<SlideContact data={data} editMode={editMode} onTextChange={handleTextChange} />);

  const slides = data.templateId === "prevoyance" ? slidesPrevoyance : slidesSwissquote;

  return (
    <div className="preview-modal-container" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="no-print" style={{ background: C.black, padding: "10px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <span style={{ color: C.white, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em" }}>APERCU — {data.prenom} {(data.nom||"").toUpperCase()}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={handleDownloadPDF} disabled={isPdfLoading} style={{ background: C.white, color: C.black, border: "none", padding: "6px 12px", cursor: isPdfLoading ? "wait" : "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 10, fontWeight: 700, borderRadius: "0px", opacity: isPdfLoading ? 0.7 : 1, transition: "0.2s" }}>
            {isPdfLoading ? "⏳ GÉNÉRATION EN COURS..." : "📥 TÉLÉCHARGER PDF"}
          </button>
          <button onClick={() => setEditMode(!editMode)} style={{ background: editMode ? C.gold : "transparent", border: `1px solid ${C.gold}`, color: editMode ? C.white : C.gold, padding: "6px 12px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 10, fontWeight: 700, borderRadius: "0px", transition: "0.2s" }}>
            {editMode ? "✓ TERMINER L'ÉDITION" : "✎ ÉDITER LES TEXTES"}
          </button>
          <span style={{ color: C.gold, fontSize: 11, marginLeft: 8 }}>{currentSlide + 1} / {slides.length}</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", color: C.white, border: "none", padding: "6px 16px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 11, fontWeight: 600 }}>FERMER</button>
        </div>
      </div>
      <div className="no-print" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 60px", position: "relative", minHeight: 0 }}>
        <button onClick={() => setCurrentSlide(s => Math.max(0, s - 1))} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: currentSlide === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)", color: currentSlide === 0 ? "rgba(255,255,255,0.2)" : C.white, border: "none", width: 40, height: 40, cursor: currentSlide === 0 ? "default" : "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>&#8249;</button>
        
        <div style={{ width: 960, height: 540, position: "relative", boxShadow: "0 8px 40px rgba(0,0,0,0.5)", overflow: "hidden", backgroundColor: C.white }}>
          <div style={{ width: 1280, height: 720, transform: "scale(0.75)", transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
            {slides[currentSlide]}
            <div style={{ position: "absolute", bottom: 0, right: 40, height: 40, display: "flex", alignItems: "center", zIndex: 20 }}>
              <span style={{ color: C.white, fontSize: 11, fontWeight: 700 }}>{currentSlide + 1}</span>
            </div>
          </div>
        </div>

        <button onClick={() => setCurrentSlide(s => Math.min(slides.length - 1, s + 1))} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: currentSlide === slides.length - 1 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)", color: currentSlide === slides.length - 1 ? "rgba(255,255,255,0.2)" : C.white, border: "none", width: 40, height: 40, cursor: currentSlide === slides.length - 1 ? "default" : "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>&#8250;</button>
      </div>
      <div className="no-print" style={{ background: C.black, padding: "8px 24px", display: "flex", gap: 4, overflowX: "auto", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        {slides.map((_, i) => (
          <div key={i} onClick={() => setCurrentSlide(i)} style={{ width: 48, height: 28, background: i === currentSlide ? C.primary : "rgba(255,255,255,0.06)", border: i === currentSlide ? `1px solid ${C.gold}` : "1px solid rgba(255,255,255,0.04)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: i === currentSlide ? C.white : "rgba(255,255,255,0.35)", fontWeight: 600, flexShrink: 0 }}>
            {i + 1}
          </div>
        ))}
      </div>

      <div style={{ position: "fixed", top: 0, left: 0, zIndex: -1000, opacity: 0.001, pointerEvents: "none" }}>
        <div id="report-printable" style={{ width: "1280px", height: `${slides.length * 720}px`, display: "block", background: C.white, overflow: "hidden" }}>
          {slides.map((SlideComponent, index) => (
            <div key={index} className="pdf-slide" style={{ width: "1280px", height: "720px", position: "relative", overflow: "hidden", backgroundColor: "#FFFFFF", margin: 0, padding: 0, boxSizing: "border-box" }}>
              {SlideComponent}
              <div style={{ position: "absolute", bottom: 0, right: 40, height: 40, display: "flex", alignItems: "center", zIndex: 20 }}>
                <span style={{ color: C.white, fontSize: 11, fontWeight: 700 }}>{index + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isPdfLoading && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.95)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 32, fontWeight: 700, color: C.primary, marginBottom: 16 }}>
            Génération du rapport en cours...
          </div>
          <div style={{ fontSize: 13, color: C.gray, fontWeight: 500, fontFamily: "'Montserrat', sans-serif" }}>
            Veuillez patienter pendant la capture haute définition...
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────── MAIN APP / LAYOUT ──────────────────────

const S = {
  label: { display: "block", fontSize: 11, fontWeight: 600, color: C.gray, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" },
  input: { width: "100%", padding: "10px 12px", border: `1.5px solid ${C.mediumGray}`, fontSize: 13, fontFamily: "'Montserrat', sans-serif", color: C.black, background: C.white, outline: "none", boxSizing: "border-box", borderRadius: "0px" },
  select: { width: "100%", padding: "10px 12px", border: `1.5px solid ${C.mediumGray}`, fontSize: 13, fontFamily: "'Montserrat', sans-serif", color: C.black, background: C.white, outline: "none", cursor: "pointer", boxSizing: "border-box", borderRadius: "0px" },
  fg: { marginBottom: 16 },
  card: { background: C.white, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", border: `1px solid ${C.mediumGray}`, borderRadius: "0px" },
  cardTitle: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.primary, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 },
  dot: { width: 8, height: 2, background: C.gold, flexShrink: 0 },
  btnP: { background: C.primary, color: C.white, border: "none", padding: "12px 28px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", borderRadius: "0px" },
  btnS: { background: C.white, color: C.primary, border: `2px solid ${C.primary}`, padding: "10px 24px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 600, borderRadius: "0px" },
};

export default function WallSwissApp() {
  const initialTexts = {
    philosophyP1: "Une approche unique et indépendante\nContrairement aux grandes institutions notre cabinet indépendant vous propose des solutions dans votre intérêt unique.",
    philosophyP2: "Notre démarche, très rigoureuse, est conduite en étroite collaboration avec vous.",
    philosophyP3: "Elle est orientée sur une bonne compréhension de vos désirs et de vos objectifs. C'est ainsi que chaque décision d'importance sera inscrite dans le contexte de votre situation matérielle globale.",
    missionP1: "Nous croyons que chaque étape de votre vie mérite une attention particulière et des solutions sur mesure.",
    missionP2: "Que vous souhaitiez optimiser votre prévoyance, investir intelligemment ou préparer votre retraite, nous sommes là pour vous guider.",
    aboutDesc: "Indépendants et engagés, nous accompagnons nos clients dans la structuration, l'optimisation et la transmission de leur patrimoine. Notre approche sur-mesure s'appuie sur une expertise pointue du marché suisse et un réseau de partenaires de premier plan pour vous offrir des solutions pragmatiques, transparentes et performantes.",
    swissquoteIntro: "En résumé, c'est une solution sérieuse, transparente et adaptée pour investir avec un acteur suisse de référence.",
    solution1: "Le compte-titres est une solution d'investissement flexible et performante, idéale pour faire fructifier votre capital en Suisse.",
    solution2: "Contrairement à d'autres solutions d'épargne, le compte-titres ne présente aucune contrainte de durée et permet d'accéder à un large choix d'actifs : actions, obligations, ETF, fonds d'investissement et produits dérivés.",
    solution3: "En Suisse, il offre une fiscalité attractive, notamment en matière de plus-values mobilières et d'absence de prélèvements sociaux, tout en permettant une gestion libre ou déléguée.",
    prevoyanceSol1: "L'assurance-vie liée à des fonds de placement est le véhicule idéal pour combiner croissance du capital et sécurité pour vos proches.",
    prevoyanceSol2: "En choisissant une solution en architecture ouverte, vous accédez aux meilleurs gérants mondiaux tout en bénéficiant des avantages exclusifs du cadre de l'assurance-vie (protection du preneur d'assurance, désignation libre des bénéficiaires).",
    prevoyanceSol3: "Cette stratégie permet une optimisation fiscale maximale aujourd'hui, tout en garantissant une transmission simplifiée et optimisée de votre patrimoine demain.",
    strategieFonds: "Investissement diversifié et orienté sur les actions mondiales de qualité, avec une couverture du risque de change si nécessaire. Focus sur la croissance à long terme.",
    contactDesc: "Gérer son patrimoine nécessite une approche personnalisée et stratégique. En optimisant sa fiscalité, en sécurisant son épargne et en faisant des choix d'investissement éclairés, il est possible de construire un patrimoine pérenne et adapté à vos projets de vie.",
    dividerQuote: "« L'investissement est un voyage à long terme. La clé est de rester concentré sur sa destination finale et de s'entourer des meilleurs partenaires. »",
    appP1: "Effectuez des opérations de trading, d'investissement et bancaires en toute sécurité et à des tarifs avantageux, grâce au principal acteur suisse de la banque en ligne.",
    appP2: "Nos plateformes intuitives vous invitent à explorer un monde riche en opportunités. Et accédez à une vaste gamme d'informations et de programmes de formation.",
    prevIntroP1: "Couvre les besoins vitaux. Obligatoire pour toute personne domiciliée ou exerçant une activité lucrative en Suisse.",
    prevIntroP2: "Maintien du niveau de vie antérieur. Obligatoire pour les salariés dépassant un certain seuil de revenu.",
    prevIntroP3: "Comble les lacunes de prévoyance (qui s'élèvent souvent à 40% du dernier salaire) et permet de réaliser des économies d'impôts majeures.",
    prevCouvP1: "En cas d'incapacité de gain (maladie ou accident), la compagnie prend le relais et paie vos primes. Votre capital retraite continue de se construire sans que vous n'ayez à débourser un centime.",
    prevCouvP2: "En cas de coup dur prématuré, un capital garanti est immédiatement versé à vos bénéficiaires (conjoint, enfants) pour les mettre à l'abri du besoin et assumer les charges courantes (hypothèque, études).",
    prevCouvP3: "Selon vos besoins, il est possible d'ajouter des rentes en cas d'invalidité pour compenser la perte de revenus, garantissant le maintien absolu de votre niveau de vie.",
    prevFondsIntro: "Pour contrer l'inflation et maximiser votre capital à la retraite, votre épargne est investie sur les marchés financiers au travers de fonds de placement de premier ordre, sélectionnés via notre partenaire",
    prevRachatP1: "Une solution de prévoyance liée à des fonds est un puissant levier conçu pour le long terme (jusqu'à l'âge de la retraite). Les premières années de votre plan constituent le socle de votre sécurité :",
    prevRachatP2: "La valeur de votre contrat (valeur de rachat) se construit ainsi progressivement. Un retrait lors des toutes premières années ne reflète pas encore le plein potentiel de croissance de votre investissement à terme.",
    prevFiscP1: "Le système fiscal suisse encourage fortement la prévoyance individuelle. Chaque franc investi dans votre pilier 3A vient réduire directement votre revenu imposable.",
    prevFiscP2: "Pour un contribuable moyen, cela représente un retour sur investissement immédiat et garanti par l'État pouvant aller de 20% à 35% du montant versé, indépendamment des performances des marchés financiers."
  };

  const [activeModule, setActiveModule] = useState("hub"); 
  const [rapportPage, setRapportPage] = useState("dashboard"); 
  const [step, setStep] = useState(0);

  const [reports, setReports] = useState([{
    id: 1,
    templateId: "swissquote",
    dateRapport: new Date().toISOString().split('T')[0],
    nom: "MULLER", prenom: "Thomas", age: "42", profession: "Directeur Marketing", nationalite: "Suisse", statut: "Marié(e)", revenus: "145000",
    capaciteEpargne: "3000", fortuneGlobale: "650000", profilRisque: "Dynamique", horizonPlacement: "Long terme (> 8 ans)",
    objectifs: ["Préparer la retraite", "Financer un projet immobilier", "Améliorer la fiscalité des placements"], objectifCustom: "",
    montantInvestissement: "200000", fraisSouscription: "2.5",
    tauxPessimiste: "4", tauxRealiste: "7", tauxOptimiste: "10",
    compagniePrevoyance: "Liechtenstein Life", optiFiscale: true,
    tauxPessimistePrev: "2", tauxRealistePrev: "4", tauxOptimistePrev: "6",
    conseiller: "Louis Borne", titreConseiller: "Planificatrice financière",
    telephone: "+41.76.231.92.75", email: "l.borne@wallswiss.ch",
    texts: initialTexts
  }]);
  const [preview, setPreview] = useState(null);
  
  const [form, setForm] = useState({
    templateId: "swissquote",
    dateRapport: new Date().toISOString().split('T')[0],
    nom: "", prenom: "", age: "", profession: "", nationalite: "France", statut: "Célibataire", revenus: "",
    capaciteEpargne: "", fortuneGlobale: "", profilRisque: "Équilibré", horizonPlacement: "Moyen terme (3 - 8 ans)",
    objectifs: [], objectifCustom: "",
    montantInvestissement: "100000", fraisSouscription: "3",
    tauxPessimiste: "3", tauxRealiste: "6", tauxOptimiste: "9",
    compagniePrevoyance: "Liechtenstein Life", optiFiscale: true,
    tauxPessimistePrev: "2", tauxRealistePrev: "4", tauxOptimistePrev: "6",
    conseiller: "Louis Borne", titreConseiller: "Planificatrice financière",
    telephone: "+41.76.231.92.75", email: "l.borne@wallswiss.ch",
    texts: initialTexts
  });

  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const uText = (k, v) => setForm(p => ({ ...p, texts: { ...p.texts, [k]: v } }));
  const toggleObj = (o) => setForm(p => ({ ...p, objectifs: p.objectifs.includes(o) ? p.objectifs.filter(x => x !== o) : [...p.objectifs, o] }));
  const addCustomObj = () => { if (form.objectifCustom.trim()) { setForm(p => ({ ...p, objectifs: [...p.objectifs, p.objectifCustom.trim()], objectifCustom: "" })); } };
  const handleSave = () => { setReports(p => [...p, { ...form, id: Date.now() }]); setPreview(form); setRapportPage("dashboard"); setStep(0); };
  const resetForm = () => setForm({ templateId: "swissquote", dateRapport: new Date().toISOString().split('T')[0], nom: "", prenom: "", age: "", profession: "", nationalite: "France", statut: "Célibataire", revenus: "", capaciteEpargne: "", fortuneGlobale: "", profilRisque: "Équilibré", horizonPlacement: "Moyen terme (3 - 8 ans)", objectifs: [], objectifCustom: "", montantInvestissement: "100000", fraisSouscription: "3", tauxPessimiste: "3", tauxRealiste: "6", tauxOptimiste: "9", compagniePrevoyance: "Liechtenstein Life", optiFiscale: true, tauxPessimistePrev: "2", tauxRealistePrev: "4", tauxOptimistePrev: "6", conseiller: "Louis Borne", titreConseiller: "Planificatrice financière", telephone: "+41.76.231.92.75", email: "l.borne@wallswiss.ch", texts: initialTexts });

  const handlePreviewUpdate = (newData) => {
    setPreview(newData);
    if (newData.id) {
      setReports(prev => prev.map(r => r.id === newData.id ? newData : r));
    } else {
      setForm(newData);
    }
  };

  const defObj = ["Sécuriser son épargne", "Obtenir une réduction d'impôt (via l'optimisation fiscale Suisse)", "Améliorer la fiscalité des placements", "Mettre en place des sécurités (fonds d'urgence)", "Maintenir un standing de vie", "Préparer la retraite", "Optimiser la transmission de patrimoine", "Financer un projet immobilier"];
  const stepLabels = ["Modèles", "Client", "Objectifs", "Investissement", "Conseiller", "Textes", "Aperçu"];

  const renderStep = () => {
    switch(step) {
      case 0: return (
        <div>
          <div style={S.cardTitle}><div style={S.dot} /> Choix du modèle de présentation</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { id: "swissquote", title: "Compte Titre SwissQuote", desc: "Stratégie d'investissement flexible et performante en Suisse.", active: true },
              { id: "prevoyance", title: "Prévoyance (3A/3B)", desc: "Optimisation fiscale et préparation retraite avec assurance vie.", active: true },
              { id: "assurance", title: "Assurance Vie", desc: "Protection et transmission de patrimoine (Bientôt disponible).", active: false },
              { id: "immobilier", title: "Immobilier", desc: "Investissements et rendements immobiliers (Bientôt disponible).", active: false },
            ].map(tpl => (
              <div key={tpl.id} onClick={() => tpl.active && u("templateId", tpl.id)} style={{ border: `2px solid ${form.templateId === tpl.id ? C.primary : C.mediumGray}`, padding: 20, cursor: tpl.active ? "pointer" : "not-allowed", opacity: tpl.active ? 1 : 0.5, background: form.templateId === tpl.id ? "rgba(105,33,2,0.04)" : C.white, display: "flex", flexDirection: "column", gap: 8, borderRadius: "0px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: C.primary }}>{tpl.title}</span>
                  {form.templateId === tpl.id && <span style={{ color: C.gold, fontSize: 16 }}>&#10003;</span>}
                </div>
                <span style={{ fontSize: 12, color: C.gray, lineHeight: 1.5 }}>{tpl.desc}</span>
              </div>
            ))}
          </div>
        </div>
      );
      case 1: return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={S.card}>
            <div style={S.cardTitle}><div style={S.dot} /> Identité</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={S.fg}><label style={S.label}>Prénom</label><input style={S.input} value={form.prenom} onChange={e=>u("prenom",e.target.value)} placeholder="Philippe"/></div>
              <div style={S.fg}><label style={S.label}>Nom</label><input style={S.input} value={form.nom} onChange={e=>u("nom",e.target.value)} placeholder="EVEQUE"/></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={S.fg}><label style={S.label}>Date du rapport</label><input style={S.input} type="date" value={form.dateRapport || ""} onChange={e=>u("dateRapport",e.target.value)}/></div>
              <div style={S.fg}><label style={S.label}>Âge</label><input style={S.input} type="number" value={form.age} onChange={e=>u("age",e.target.value)} placeholder="40"/></div>
            </div>
            <div style={S.fg}><label style={S.label}>Nationalité</label><input style={S.input} value={form.nationalite} onChange={e=>u("nationalite",e.target.value)}/></div>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}><div style={S.dot} /> Situation Financière</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={S.fg}><label style={S.label}>Profession</label><input style={S.input} value={form.profession} onChange={e=>u("profession",e.target.value)} placeholder="Caméraman"/></div>
              <div style={S.fg}><label style={S.label}>Statut</label><select style={S.select} value={form.statut} onChange={e=>u("statut",e.target.value)}>{["Célibataire","Marié(e)","Divorcé(e)","Veuf/Veuve","Pacsé(e)","Union libre"].map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
            <div style={S.fg}><label style={S.label}>Revenus annuels bruts (CHF)</label><input style={S.input} type="number" value={form.revenus} onChange={e=>u("revenus",e.target.value)} placeholder="120000"/></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={S.fg}><label style={S.label}>{form.templateId === "prevoyance" ? "Montant mensuel souhaité (3P)" : "Épargne mensuelle globale"}</label><input style={S.input} type="number" value={form.capaciteEpargne} onChange={e=>u("capaciteEpargne",e.target.value)} placeholder="500"/></div>
              <div style={S.fg}><label style={S.label}>Fortune globale</label><input style={S.input} type="number" value={form.fortuneGlobale} onChange={e=>u("fortuneGlobale",e.target.value)} placeholder="450000"/></div>
            </div>
          </div>
        </div>
      );
      case 2: return (
        <div style={S.card}>
          <div style={S.cardTitle}><div style={S.dot} /> Objectifs du client</div>
          <p style={{ fontSize: 12, color: C.gray, marginBottom: 16, marginTop: 0 }}>Sélectionnez les objectifs correspondant à la situation de votre client.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {defObj.map(obj => {
              const active = form.objectifs.includes(obj);
              return (
                <div key={obj} onClick={()=>toggleObj(obj)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: `1.5px solid ${active ? C.primary : C.mediumGray}`, background: active ? "rgba(105,33,2,0.04)" : "transparent", cursor: "pointer", fontSize: 12, fontWeight: 500, borderRadius: "0px" }}>
                  <div style={{ width: 16, height: 16, border: `2px solid ${active ? C.primary : C.mediumGray}`, background: active ? C.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: "0px" }}>
                    {active && <span style={{ color: C.white, fontSize: 10, fontWeight: 700 }}>&#10003;</span>}
                  </div>
                  <span style={{ color: active ? C.primary : C.darkGray }}>{obj}</span>
                </div>
              );
            })}
          </div>
          <div style={{ height: 1, background: C.mediumGray, margin: "20px 0" }} />
          <div style={{ display: "flex", gap: 10 }}>
            <input style={{ ...S.input, flex: 1 }} value={form.objectifCustom} onChange={e=>u("objectifCustom",e.target.value)} placeholder="Ajouter un objectif personnalisé..." onKeyDown={e=>e.key==="Enter"&&addCustomObj()} />
            <button style={{ ...S.btnS, padding: "8px 16px", whiteSpace: "nowrap" }} onClick={addCustomObj}>+ Ajouter</button>
          </div>
          {form.objectifs.filter(o=>!defObj.includes(o)).length > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {form.objectifs.filter(o=>!defObj.includes(o)).map((o,i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 10px", background: "rgba(105,33,2,0.06)", color: C.primary, fontSize: 11, fontWeight: 600, borderRadius: "0px" }}>
                  {o} <span style={{ cursor: "pointer", opacity: 0.5 }} onClick={()=>toggleObj(o)}>x</span>
                </span>
              ))}
            </div>
          )}
        </div>
      );
      case 3: return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={S.card}>
            <div style={S.cardTitle}><div style={S.dot} /> Paramètres d'investissement</div>
            
            {form.templateId === "prevoyance" ? (
              <>
                <div style={S.fg}>
                  <label style={S.label}>Compagnie partenaire</label>
                  <select style={S.select} value={form.compagniePrevoyance} onChange={e=>u("compagniePrevoyance",e.target.value)}>
                    <option>Liechtenstein Life</option>
                    <option>Groupe Mutuel</option>
                  </select>
                </div>
                <div style={S.fg}>
                  <label style={{...S.label, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 8, color: C.primary}}>
                    <input type="checkbox" checked={form.optiFiscale} onChange={e=>u("optiFiscale",e.target.checked)} style={{width: 16, height: 16}} /> 
                    Inclure la slide Optimisation Fiscale (3A)
                  </label>
                </div>
                
                <div style={{ height: 1, background: C.mediumGray, margin: "16px 0" }} />
                
                <div style={{...S.fg, margin: 0}}>
                  <label style={S.label}>Profil de risque du portefeuille</label>
                  <select style={S.select} value={form.profilRisque} onChange={e=>u("profilRisque",e.target.value)}>
                    {["Prudent", "Équilibré", "Dynamique", "Offensif"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div style={S.fg}><label style={S.label}>Montant initial (CHF)</label><input style={S.input} type="number" value={form.montantInvestissement} onChange={e=>u("montantInvestissement",e.target.value)}/></div>
                <div style={S.fg}><label style={S.label}>Frais de souscription (%)</label><input style={S.input} type="number" step="0.5" value={form.fraisSouscription} onChange={e=>u("fraisSouscription",e.target.value)}/></div>
                
                <div style={{ height: 1, background: C.mediumGray, margin: "16px 0" }} />
                
                <div style={S.fg}><label style={S.label}>Horizon de placement</label><select style={S.select} value={form.horizonPlacement} onChange={e=>u("horizonPlacement",e.target.value)}>{["Court terme (< 3 ans)", "Moyen terme (3 - 8 ans)", "Long terme (> 8 ans)"].map(s=><option key={s}>{s}</option>)}</select></div>
                <div style={{...S.fg, margin: 0}}><label style={S.label}>Profil de risque</label><select style={S.select} value={form.profilRisque} onChange={e=>u("profilRisque",e.target.value)}>{["Prudent", "Équilibré", "Dynamique", "Offensif"].map(s=><option key={s}>{s}</option>)}</select></div>
              </>
            )}
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}><div style={S.dot} /> Scénarios de rendement</div>
            {form.templateId === "prevoyance" ? (
              <>
                <div style={S.fg}><label style={S.label}>Taux pessimiste net (%)</label><input style={S.input} type="number" step="0.5" value={form.tauxPessimistePrev} onChange={e=>u("tauxPessimistePrev",e.target.value)}/></div>
                <div style={S.fg}><label style={S.label}>Taux réaliste net (%)</label><input style={S.input} type="number" step="0.5" value={form.tauxRealistePrev} onChange={e=>u("tauxRealistePrev",e.target.value)}/></div>
                <div style={S.fg}><label style={S.label}>Taux optimiste net (%)</label><input style={S.input} type="number" step="0.5" value={form.tauxOptimistePrev} onChange={e=>u("tauxOptimistePrev",e.target.value)}/></div>
                <div style={S.fg}><label style={S.label}>Mensualité investie (CHF)</label><input style={S.input} type="number" value={form.capaciteEpargne} onChange={e=>u("capaciteEpargne",e.target.value)} placeholder="500"/></div>
              </>
            ) : (
              <>
                <div style={S.fg}><label style={S.label}>Taux pessimiste (%)</label><input style={S.input} type="number" step="0.5" value={form.tauxPessimiste} onChange={e=>u("tauxPessimiste",e.target.value)}/></div>
                <div style={S.fg}><label style={S.label}>Taux réaliste (%)</label><input style={S.input} type="number" step="0.5" value={form.tauxRealiste} onChange={e=>u("tauxRealiste",e.target.value)}/></div>
                <div style={S.fg}><label style={S.label}>Taux optimiste (%)</label><input style={S.input} type="number" step="0.5" value={form.tauxOptimiste} onChange={e=>u("tauxOptimiste",e.target.value)}/></div>
                <div style={{ background: C.lightGray, padding: 14, marginTop: 16, borderRadius: "0px" }}>
                  <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>Montant net investi</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>CHF {fmt((form.montantInvestissement||0)-(form.montantInvestissement||0)*(form.fraisSouscription||0)/100)}.-</div>
                </div>
              </>
            )}
          </div>
        </div>
      );
      case 4: return (
        <div style={{ ...S.card, maxWidth: 560 }}>
          <div style={S.cardTitle}><div style={S.dot} /> Informations du conseiller</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={S.fg}><label style={S.label}>Nom complet</label><input style={S.input} value={form.conseiller} onChange={e=>u("conseiller",e.target.value)}/></div>
            <div style={S.fg}><label style={S.label}>Titre</label><input style={S.input} value={form.titreConseiller} onChange={e=>u("titreConseiller",e.target.value)}/></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={S.fg}><label style={S.label}>Téléphone</label><input style={S.input} value={form.telephone} onChange={e=>u("telephone",e.target.value)}/></div>
            <div style={S.fg}><label style={S.label}>Email</label><input style={S.input} value={form.email} onChange={e=>u("email",e.target.value)}/></div>
          </div>
        </div>
      );
      case 5: return (
        <div style={{ display: "grid", gap: 20 }}>
          <div style={S.card}>
            <div style={S.cardTitle}><div style={S.dot} /> Personnalisation des textes</div>
            <p style={{ fontSize: 12, color: C.gray, marginBottom: 16, marginTop: 0 }}>Modifiez les textes par défaut qui apparaîtront dans les diapositives.</p>
            
            <div style={S.fg}><label style={S.label}>Page "Qui sommes-nous" - Description</label>
            <textarea style={{...S.input, minHeight: 80, resize: "vertical"}} value={form.texts.aboutDesc} onChange={e=>uText("aboutDesc", e.target.value)} /></div>
            
            {form.templateId === "swissquote" && (
              <>
                <div style={S.fg}><label style={S.label}>Page "Pourquoi SwissQuote" - Conclusion</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.swissquoteIntro} onChange={e=>uText("swissquoteIntro", e.target.value)} /></div>

                <div style={{ height: 1, background: C.mediumGray, margin: "20px 0" }} />
                <div style={{marginBottom: 12, color: C.primary, fontWeight: 700, fontSize: 12}}>PAGE "SOLUTION COMPTE TITRE"</div>
                <div style={S.fg}><label style={S.label}>Paragraphe 1 (Introduction)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.solution1} onChange={e=>uText("solution1", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 2 (Avantages)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.solution2} onChange={e=>uText("solution2", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 3 (Fiscalité)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.solution3} onChange={e=>uText("solution3", e.target.value)} /></div>
              </>
            )}

            {form.templateId === "prevoyance" && (
              <>
                <div style={{ height: 1, background: C.mediumGray, margin: "20px 0" }} />
                <div style={{marginBottom: 12, color: C.primary, fontWeight: 700, fontSize: 12}}>PAGE "SOLUTION PRÉVOYANCE"</div>
                <div style={S.fg}><label style={S.label}>Paragraphe 1 (Introduction)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.prevoyanceSol1} onChange={e=>uText("prevoyanceSol1", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 2 (Avantages)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.prevoyanceSol2} onChange={e=>uText("prevoyanceSol2", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 3 (Fiscalité & Transmission)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.prevoyanceSol3} onChange={e=>uText("prevoyanceSol3", e.target.value)} /></div>
                
                <div style={{ height: 1, background: C.mediumGray, margin: "20px 0" }} />
                <div style={{marginBottom: 12, color: C.primary, fontWeight: 700, fontSize: 12}}>PAGE "FONDS DE PLACEMENT"</div>
                <div style={S.fg}><label style={S.label}>Stratégie d'investissement personnalisée</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.strategieFonds} onChange={e=>uText("strategieFonds", e.target.value)} /></div>
              </>
            )}

            <div style={{ height: 1, background: C.mediumGray, margin: "20px 0" }} />
            <div style={S.fg}><label style={S.label}>Page "Contact" - Mot de la fin</label>
            <textarea style={{...S.input, minHeight: 80, resize: "vertical"}} value={form.texts.contactDesc} onChange={e=>uText("contactDesc", e.target.value)} /></div>
          </div>
        </div>
      );
      case 6: return (
        <div style={S.card}>
          <div style={S.cardTitle}><div style={S.dot} /> Résumé avant génération</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div style={{ background: C.lightGray, padding: 18, borderRadius: "0px" }}>
              <div style={{ fontSize: 10, color: C.gray, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Client</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>{form.prenom} {form.nom}</div>
              <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>{form.age} ans — {form.profession}</div>
              <div style={{ fontSize: 12, color: C.gray }}>{form.statut} — {form.nationalite}</div>
            </div>
            <div style={{ background: C.lightGray, padding: 18, borderRadius: "0px" }}>
              <div style={{ fontSize: 10, color: C.gray, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Investissement</div>
              {form.templateId === "prevoyance" ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>CHF {fmt(form.capaciteEpargne)}.- / mois</div>
                  <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>{form.compagniePrevoyance}</div>
                  <div style={{ fontSize: 12, color: C.gray }}>Opti. Fiscale: {form.optiFiscale ? "Oui" : "Non"}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>CHF {fmt(form.montantInvestissement)}.-</div>
                  <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>Frais: {form.fraisSouscription}%</div>
                  <div style={{ fontSize: 12, color: C.gray }}>{form.tauxPessimiste}% / {form.tauxRealiste}% / {form.tauxOptimiste}%</div>
                </>
              )}
            </div>
            <div style={{ background: C.lightGray, padding: 18, borderRadius: "0px" }}>
              <div style={{ fontSize: 10, color: C.gray, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Objectifs</div>
              <div style={{ fontSize: 12, color: C.darkGray }}>{form.objectifs.length} objectif{form.objectifs.length>1?"s":""}</div>
              <div style={{ fontSize: 11, color: C.gray, marginTop: 4, lineHeight: 1.5 }}>{form.objectifs.slice(0,3).join(" / ")}{form.objectifs.length>3?" ...":""}</div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 28 }}>
            <button style={S.btnS} onClick={()=>setPreview(form)}>Aperçu du rapport</button>
            <button style={S.btnP} onClick={handleSave}>Générer et sauvegarder</button>
          </div>
        </div>
      );
    }
  };

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", display: "flex", height: "100%", width: "100%", overflow: "hidden", background: C.lightGray, color: C.black }}>
      <style>{`
        html, body, #root { 
          margin: 0; 
          padding: 0; 
          background-color: ${C.lightGray};
          height: 100%;
          width: 100%;
          overflow: hidden; 
        }
        input:focus, select:focus, textarea:focus { border-color: ${C.primary} !important; }
        ::placeholder { color: #B0ADA6; }
        button:hover { opacity: 0.9; }
        
        ::-webkit-scrollbar { width: 6px; height: 6px; } 
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }
        
        .print-only { display: none; }
        @media print {
          body { margin: 0; padding: 0; background: white; overflow: visible; height: auto; }
          .no-print, aside { display: none !important; }
          .print-only { display: block !important; }
          .preview-modal-container { position: absolute; left: 0; top: 0; background: white !important; width: 100vw; }
          @page { size: 16in 9in; margin: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* ────────────────── MENU LATÉRAL (SIDEBAR) ────────────────── */}
      <aside className="no-print" style={{ width: "260px", background: C.sidebar, color: C.white, display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "2px 0 10px rgba(0,0,0,0.1)", zIndex: 110 }}>
        <div style={{ padding: "32px 24px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ background: C.white, padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={LOGO_URL} alt="WallSwiss" style={{ height: "20px", filter: "invert(1) sepia(1) saturate(5) hue-rotate(345deg) brightness(0.5)" }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 18, fontWeight: 700, letterSpacing: "0.08em" }}>WALLSWISS</div>
            <div style={{ color: C.gold, fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Espace Conseiller</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "24px 0", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.1em", padding: "0 24px", marginBottom: 8, textTransform: "uppercase" }}>Général</div>
          
          <button 
            onClick={() => setActiveModule("hub")} 
            style={{ width: "100%", textAlign: "left", background: activeModule === "hub" ? "rgba(255,255,255,0.1)" : "transparent", color: activeModule === "hub" ? C.white : "rgba(255,255,255,0.6)", border: "none", borderLeft: `3px solid ${activeModule === "hub" ? C.gold : "transparent"}`, padding: "12px 24px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: activeModule === "hub" ? 600 : 500, transition: "0.2s" }}
          >
            🏠 Hub d'accueil
          </button>
          
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.1em", padding: "0 24px", margin: "16px 0 8px", textTransform: "uppercase" }}>Modules</div>
          
          <button 
            onClick={() => setActiveModule("rapport")} 
            style={{ width: "100%", textAlign: "left", background: activeModule === "rapport" ? "rgba(255,255,255,0.1)" : "transparent", color: activeModule === "rapport" ? C.white : "rgba(255,255,255,0.6)", border: "none", borderLeft: `3px solid ${activeModule === "rapport" ? C.gold : "transparent"}`, padding: "12px 24px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: activeModule === "rapport" ? 600 : 500, transition: "0.2s" }}
          >
            📄 Rapport Financier
          </button>
        </nav>

        <div style={{ padding: "24px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          {APP_VERSION}
        </div>
      </aside>

      {/* ────────────────── CONTENU PRINCIPAL ────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", position: "relative" }}>
        
        {/* VUE HUB D'ACCUEIL */}
        {activeModule === "hub" && (
          <div style={{ padding: "60px 80px", maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
            <h1 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 36, color: C.primary, marginBottom: 8, marginTop: 0 }}>Bonjour, {form.conseiller.split(' ')[0] || "Conseiller"}</h1>
            <p style={{ color: C.gray, fontSize: 15, marginBottom: 48 }}>Sélectionnez un module ci-dessous pour démarrer vos tâches.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
              {/* Carte Module Rapport */}
              <div 
                onClick={() => setActiveModule("rapport")}
                style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", borderRadius: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ background: "rgba(105,33,2,0.06)", width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <span style={{ fontSize: 24 }}>📄</span>
                </div>
                <h3 style={{ fontSize: 18, color: C.primary, marginBottom: 8, marginTop: 0 }}>Rapport Financier</h3>
                <p style={{ color: C.gray, fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>Générez des rapports d'analyse patrimoniale professionnels et personnalisés pour vos clients en quelques clics.</p>
                <span style={{ color: C.gold, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ouvrir le module &rarr;</span>
              </div>

              {/* Autres modules en placeholder */}
              {[
                { title: "Simulateurs Financiers", desc: "Calculez des projections d'assurance vie, prévoyance et immobilier.", icon: "📊" },
                { title: "CRM Clients", desc: "Gérez votre portefeuille clients et suivez l'historique de vos rendez-vous.", icon: "👥" }
              ].map((mod, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.5)", border: `1px dashed ${C.mediumGray}`, padding: 32, cursor: "not-allowed", opacity: 0.6 }}>
                  <div style={{ background: C.lightGray, width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                    <span style={{ fontSize: 24, filter: "grayscale(100%)" }}>{mod.icon}</span>
                  </div>
                  <h3 style={{ fontSize: 18, color: C.darkGray, marginBottom: 8, marginTop: 0 }}>{mod.title}</h3>
                  <p style={{ color: C.gray, fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>{mod.desc}</p>
                  <span style={{ color: C.gray, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", background: C.mediumGray, padding: "4px 8px" }}>Bientôt disponible</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VUE MODULE RAPPORT FINANCIER */}
        {activeModule === "rapport" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            
            {/* Header interne du module Rapport */}
            <header className="no-print" style={{ background: C.white, borderBottom: `1px solid ${C.mediumGray}`, position: "sticky", top: 0, zIndex: 100 }}>
              <div style={{ padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: C.gray, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Module ouvert</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>Rapport Financier</div>
                </div>
                <nav style={{ display: "flex", gap: 8 }}>
                  {[["dashboard","Tableau de bord"],["create","Créer un rapport"]].map(([p,l]) => (
                    <button 
                      key={p} 
                      onClick={()=>{setRapportPage(p);if(p==="create")setStep(0);}} 
                      style={{ background: rapportPage===p ? "rgba(105,33,2,0.06)" : "transparent", color: rapportPage===p ? C.primary : C.gray, border: "none", padding: "8px 16px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: rapportPage===p?700:500, borderRadius: "0px", transition: "0.2s" }}
                    >
                      {l}
                    </button>
                  ))}
                </nav>
              </div>
            </header>

            <main style={{ flex: 1, padding: "40px", boxSizing: "border-box" }}>
              {rapportPage === "dashboard" && (
                reports.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "80px 40px" }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 16, opacity: 0.2 }}><rect x="3" y="3" width="18" height="18" stroke={C.primary} strokeWidth="1.5"/><line x1="7" y1="8" x2="17" y2="8" stroke={C.primary} strokeWidth="1"/><line x1="7" y1="12" x2="14" y2="12" stroke={C.primary} strokeWidth="1"/><line x1="7" y1="16" x2="11" y2="16" stroke={C.primary} strokeWidth="1"/></svg>
                    <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, color: C.primary, marginBottom: 8 }}>Aucun rapport créé</div>
                    <p style={{ color: C.gray, fontSize: 13, marginBottom: 24, maxWidth: 380, margin: "0 auto 24px" }}>Commencez par créer votre premier rapport financier personnalisé.</p>
                    <button style={S.btnP} onClick={()=>{setRapportPage("create");resetForm();}}>+ Créer un rapport</button>
                  </div>
                ) : (
                  <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                      <div>
                        <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, fontWeight: 700, color: C.primary, margin: 0 }}>Mes rapports récents</h2>
                        <p style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>Vous avez {reports.length} rapport{reports.length>1?"s":""} enregistré{reports.length>1?"s":""}.</p>
                      </div>
                      <button style={S.btnP} onClick={()=>{setRapportPage("create");resetForm();}}>+ Nouveau rapport</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
                      {reports.map((r,i) => (
                        <div key={i} style={{ ...S.card, cursor: "pointer", position: "relative", overflow: "hidden", padding: "24px 28px", transition: "transform 0.2s" }} onClick={()=>setPreview(r)} onMouseEnter={(e)=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={(e)=>e.currentTarget.style.transform="translateY(0)"}>
                          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: C.gold }} />
                          <div style={{ fontSize: 10, color: C.gray, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, marginTop: 4 }}>Dossier Client</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: C.primary, marginBottom: 6 }}>{r.prenom} {(r.nom||"").toUpperCase()}</div>
                          <div style={{ fontSize: 13, color: C.darkGray, marginBottom: 16 }}>{r.profession} — {r.age} ans</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: `1px solid ${C.lightGray}` }}>
                            <div>
                              <div style={{ fontSize: 10, color: C.gray, marginBottom: 2 }}>
                                {r.templateId === "prevoyance" ? "Épargne simulée" : "Montant simulé"}
                              </div>
                              <div style={{ fontSize: 13, color: C.primary, fontWeight: 600 }}>
                                {r.templateId === "prevoyance" 
                                  ? `CHF ${fmt(r.capaciteEpargne || 500)}.-/mois` 
                                  : `CHF ${fmt(r.montantInvestissement||100000)}.-`
                                }
                              </div>
                            </div>
                            <span style={{ fontSize: 11, color: C.gold, fontWeight: 700, background: "rgba(165,149,104,0.1)", padding: "6px 12px" }}>OUVRIR &rarr;</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}

              {rapportPage === "create" && (
                <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>
                  <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, fontWeight: 700, color: C.primary, margin: "0 0 4px" }}>Générateur de rapport</h2>
                  <p style={{ color: C.gray, fontSize: 13, marginBottom: 32 }}>Suivez les étapes pour configurer la proposition patrimoniale de votre client.</p>
                  
                  <div style={{ display: "flex", gap: 4, marginBottom: 32, background: "transparent" }}>
                    {stepLabels.map((l,i) => (
                      <div key={i} onClick={()=>setStep(i)} style={{ flex: 1, textAlign: "center", padding: "12px 6px", fontSize: 11, fontWeight: step===i?700:600, color: step===i?C.white:step>i?C.primary:C.gray, background: step===i?C.primary:step>i?"rgba(105,33,2,0.06)":C.white, border: `1px solid ${step===i?C.primary:step>i?"rgba(105,33,2,0.1)":C.mediumGray}`, cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.2s", borderRadius: "0px", position: "relative" }}>
                        {l}
                      </div>
                    ))}
                  </div>
                  
                  {renderStep()}
                  
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
                    <button style={{ ...S.btnS, opacity: step===0?0:1, pointerEvents: step===0?"none":"auto" }} onClick={()=>setStep(s=>s-1)}>&larr; Précédent</button>
                    {step < 6 && <button style={S.btnP} onClick={()=>setStep(s=>s+1)}>Étape Suivante &rarr;</button>}
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      {preview && <ReportPreview data={preview} onClose={()=>setPreview(null)} onUpdateData={handlePreviewUpdate} />}
    </div>
  );
}