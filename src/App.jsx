import { useState } from "react";

const C = {
  primary: "#692102",
  primaryDark: "#4A1801",
  gold: "#A59568",
  white: "#FFFFFF",
  black: "#1A1A1A",
  gray: "#6B7280",
  lightGray: "#F3F2EF",
  mediumGray: "#E5E3DE",
  darkGray: "#374151",
};

const LOGO_URL = "https://wallswiss.ch/wp-content/uploads/2026/03/logo-blanc-sans-texte.png";

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

function fmt(n) { return Number(n).toLocaleString("fr-CH"); }

// ────────────────────── SLIDE COMPONENTS ──────────────────────

const slideBase = {
  width: "100%",
  aspectRatio: "16/9",
  position: "relative",
  overflow: "hidden",
  fontFamily: "'Montserrat', sans-serif",
  background: C.white,
};

const footer = (name) => (
  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 36, background: C.primary, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
    <span style={{ color: C.white, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>A L'ATTENTION DE {name}</span>
  </div>
);

const accentBar = () => (
  <div style={{ position: "absolute", top: 0, left: 0, width: 5, height: "100%", background: C.primary }} />
);

const logoCorner = () => (
  <div style={{ position: "absolute", top: 48, right: 56, display: "flex", alignItems: "center", gap: 8, zIndex: 10 }}>
    <div style={{ background: C.primary, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "2px", boxShadow: "0 2px 10px rgba(0,0,0,0.15)" }}>
      <img src={LOGO_URL} alt="WallSwiss" style={{ height: "44px" }} />
    </div>
  </div>
);

const ReportTitle = ({ title, highlight, subtitle, color = C.primary }) => (
  <div style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: "16px", marginBottom: "28px", fontFamily: "'Montserrat', sans-serif" }}>
    {subtitle && (
      <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
        {subtitle}
      </div>
    )}
    <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, fontWeight: 700, color: color, margin: 0, lineHeight: 1.15 }}>
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
        style={{ ...style, width: "100%", background: "rgba(105,33,2,0.03)", border: `1px dashed ${C.gold}`, borderRadius: "2px", padding: "6px", outline: "none", resize: "vertical", fontFamily: "'Montserrat', sans-serif", display: "block", boxSizing: "border-box" }}
      />
    );
  }
  return <p style={{ ...style, whiteSpace: "pre-wrap" }}>{value}</p>;
};

// Slide 1 — Cover
function SlideCover({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={{ ...slideBase, background: C.white, display: "flex" }}>
      <div style={{ width: "35%", height: "100%", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "40px 30px" }}>
        <div style={{ background: C.primary, padding: "14px 20px", display: "inline-flex", borderRadius: "2px", alignSelf: "flex-start" }}>
          <img src={LOGO_URL} alt="WallSwiss" style={{ height: "30px" }} />
        </div>
        <div>
          <div style={{ width: 40, height: 3, background: C.gold, marginBottom: 16 }} />
          <div style={{ color: C.primary, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>Analyse Patrimoniale</div>
          <div style={{ color: C.gray, fontSize: 10, marginTop: 8 }}>{new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>
      <div style={{ width: "65%", height: "100%", background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`, position: "relative", padding: "60px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 6, background: C.gold }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: "45%", height: "100%", background: "rgba(255,255,255,0.03)" }} />
        <div style={{ fontFamily: "'Times New Roman', Times, serif", color: C.white, fontSize: 56, fontWeight: 700, lineHeight: 1.1, position: "relative", zIndex: 2 }}>
          Rapport<br /><em style={{ color: C.gold, fontStyle: "italic" }}>Financier</em>
        </div>
        <div style={{ marginTop: 40, borderLeft: `2px solid rgba(255,255,255,0.2)`, paddingLeft: 20, position: "relative", zIndex: 2 }}>
          <div style={{ color: C.white, fontSize: 18, fontWeight: 600 }}>{data.conseiller || "Louis Borne"}</div>
          <div style={{ color: C.gold, fontSize: 12, fontWeight: 500, marginTop: 4 }}>{data.titreConseiller || "Planificatrice financière"}</div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 2 — Table des matières
function SlideTOC({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const items = [
    { title: "Qui sommes-nous ? Notre philosophie", page: 3 },
    { title: "Notre cabinet en chiffres", page: 4 },
    { title: "Résumé de votre situation personnelle", page: 5 },
    { title: "Pourquoi Swissquote est une banque fiable", page: 6 },
    { title: "Avantages WallSwiss BY Swissquote", page: 7 },
    { title: "Solution — Compte Titre", page: 8 },
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
      <div style={{ padding: "48px 56px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Table des matières" subtitle="STRUCTURE DE VOTRE PRÉSENTATION" />
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 64, rowGap: 16, alignContent: "center", maxWidth: 900 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-end", width: "100%", paddingBottom: 4 }}>
              <span style={{ color: C.darkGray, fontSize: 13, fontWeight: 600, paddingBottom: 2 }}>
                {item.title}
              </span>
              <div style={{ flex: 1, borderBottom: `2px dotted ${C.mediumGray}`, margin: "0 12px", position: "relative", top: -6 }} />
              <span style={{ color: C.primary, fontSize: 14, fontWeight: 700, flexShrink: 0, paddingBottom: 2 }}>
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

// Slide 3 — Philosophie (Nouveau "Qui sommes-nous")
function SlidePhilosophy({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={{ ...slideBase, display: "flex", alignItems: "stretch" }}>
      <div style={{ width: "35%", background: `url("https://wallswiss.ch/wp-content/uploads/2026/03/660942a0ceb2ea252752e568_section-bg-scaled.jpg") center/cover`, position: "relative" }} />
      <div style={{ flex: 1, padding: "48px 56px", position: "relative", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {logoCorner()}
        <ReportTitle title="Qui sommes-nous ?" />
        
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 20, color: C.primaryDark, textTransform: "uppercase", marginBottom: 4 }}>NOTRE PHILOSOPHIE.</div>
          <div style={{ fontSize: 13, color: C.gold, marginBottom: 16 }}>Votre cabinet de planification financière à Genève.</div>
          <EditableText editMode={editMode} value={data.texts?.philosophyP1} onChange={v => onTextChange("philosophyP1", v)} style={{ fontSize: 11.5, lineHeight: 1.6, color: C.darkGray, margin: "0 0 12px" }} />
          <EditableText editMode={editMode} value={data.texts?.philosophyP2} onChange={v => onTextChange("philosophyP2", v)} style={{ fontSize: 11.5, lineHeight: 1.6, color: C.darkGray, margin: "0 0 12px" }} />
          <EditableText editMode={editMode} value={data.texts?.philosophyP3} onChange={v => onTextChange("philosophyP3", v)} style={{ fontSize: 11.5, lineHeight: 1.6, color: C.darkGray, margin: 0 }} />
        </div>

        <div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 20, color: C.primaryDark, textTransform: "uppercase", marginBottom: 4 }}>NOTRE MISSION</div>
          <div style={{ fontSize: 13, color: C.gold, marginBottom: 16 }}>Vos projets financiers avec expertise et transparence</div>
          <EditableText editMode={editMode} value={data.texts?.missionP1} onChange={v => onTextChange("missionP1", v)} style={{ fontSize: 11.5, lineHeight: 1.6, color: C.darkGray, margin: "0 0 12px" }} />
          <EditableText editMode={editMode} value={data.texts?.missionP2} onChange={v => onTextChange("missionP2", v)} style={{ fontSize: 11.5, lineHeight: 1.6, color: C.darkGray, margin: 0 }} />
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 4 — Qui sommes-nous (Chiffres)
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
      <div style={{ padding: "48px 56px", height: "100%", boxSizing: "border-box", display: "flex", gap: "40px" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <ReportTitle title="Notre cabinet" highlight="en chiffres" subtitle="QUI SOMMES-NOUS ?" />
          <div style={{ color: C.gray, fontSize: 13, marginBottom: 16 }}>Votre cabinet de planification financière à Genève.</div>
          <EditableText editMode={editMode} value={data.texts?.aboutDesc} onChange={v => onTextChange("aboutDesc", v)} style={{ fontSize: 12, lineHeight: 1.7, color: C.darkGray, marginBottom: 32 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {stats.map((s, i) => (
              <div key={i} style={{ background: C.primary, padding: "16px 12px", textAlign: "center" }}>
                <div style={{ color: C.white, fontSize: 18, fontWeight: 800 }}>{s.val}</div>
                <div style={{ color: C.gold, fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ width: "35%", height: "100%", borderRadius: "4px", overflow: "hidden" }}>
          <img src="https://wallswiss.ch/wp-content/uploads/2026/03/imgi_15_uri_ifs3A2F2FM2FZZBVIKww_AjRDCaKNkRtfABGR-02n7Jd8caaieOpDwE.jpg" alt="Equipe WallSwiss" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 5 — Situation personnelle (Restaurée)
function SlideSituation({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "48px 56px 24px 56px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Résumé de" highlight="votre situation personnelle" subtitle="ANALYSE PATRIMONIALE" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, flex: 1, minHeight: 0, marginTop: -8 }}>
          
          {/* Colonne Gauche */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Block Identité */}
            <div>
              <div style={{ background: C.primary, color: C.white, padding: "8px 16px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Civilité & Statut</div>
              <div style={{ border: `1px solid ${C.mediumGray}`, borderTop: "none", padding: "6px 16px" }}>
                {[
                  ["Âge", `${data.age || "-"} ans`],
                  ["Profession", data.profession || "À renseigner"],
                  ["Nationalité", data.nationalite || "À renseigner"],
                  ["Statut civil", data.statut || "À renseigner"],
                ].map(([k, v], i, arr) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.lightGray}` : "none", fontSize: 11 }}>
                    <span style={{ color: C.gray, fontWeight: 500 }}>{k}</span>
                    <span style={{ fontWeight: 700, color: C.primary }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Block Financier */}
            <div>
              <div style={{ background: C.primary, color: C.white, padding: "8px 16px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Données Financières</div>
              <div style={{ border: `1px solid ${C.mediumGray}`, borderTop: "none", padding: "6px 16px" }}>
                {[
                  ["Revenus annuels bruts", data.revenus ? `CHF ${fmt(data.revenus)}.-` : "À renseigner"],
                  ["Capacité d'épargne / mois", data.capaciteEpargne ? `CHF ${fmt(data.capaciteEpargne)}.-` : "À renseigner"],
                  ["Fortune globale estimée", data.fortuneGlobale ? `CHF ${fmt(data.fortuneGlobale)}.-` : "À renseigner"],
                ].map(([k, v], i, arr) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.lightGray}` : "none", fontSize: 11 }}>
                    <span style={{ color: C.gray, fontWeight: 500 }}>{k}</span>
                    <span style={{ fontWeight: 700, color: C.primary }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Colonne Droite */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Block Objectifs */}
            <div>
              <div style={{ background: C.gold, color: C.white, padding: "8px 16px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Vos objectifs prioritaires</div>
              <div style={{ border: `1px solid ${C.mediumGray}`, borderTop: "none", padding: "8px 16px", minHeight: "100px" }}>
                {(data.objectifs && data.objectifs.length > 0 ? data.objectifs : ["Aucun objectif spécifique renseigné"]).map((obj, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "4px 0" }}>
                    <div style={{ width: 5, height: 5, background: C.gold, marginTop: 5, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: C.darkGray, lineHeight: 1.4, fontWeight: 500 }}>{obj}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Block Profil */}
            <div>
              <div style={{ background: C.gold, color: C.white, padding: "8px 16px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Profil d'investisseur</div>
              <div style={{ border: `1px solid ${C.mediumGray}`, borderTop: "none", padding: "6px 16px" }}>
                {[
                  ["Horizon de placement", data.horizonPlacement || "Moyen / Long terme"],
                  ["Tolérance au risque", data.profilRisque || "Équilibré"],
                ].map(([k, v], i, arr) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.lightGray}` : "none", fontSize: 11 }}>
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
      <div style={{ padding: "48px 56px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Pourquoi Swissquote est une banque fiable" subtitle="PARTENAIRE BANCAIRE" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, maxWidth: 720 }}>
          {points.map((p, i) => (
            <div key={i} style={{ background: C.lightGray, padding: "14px 20px", fontSize: 12.5, lineHeight: 1.7, color: C.darkGray, borderLeft: `3px solid ${C.gold}` }}>
              {p}
            </div>
          ))}
          <div style={{ background: C.lightGray, padding: "14px 20px", fontSize: 12.5, lineHeight: 1.7, borderLeft: `3px solid ${C.primary}` }}>
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
      <div style={{ padding: "48px 56px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Avantages WallSwiss BY Swissquote" highlight="pour l'investissement" subtitle="CONDITIONS EXCLUSIVES" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
          {avantages.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ color: C.primary, fontSize: 18, marginTop: -4 }}>•</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.darkGray }}>{a.title}</div>
                <div style={{ fontSize: 10, color: C.gray, lineHeight: 1.4, marginTop: 2 }}>{a.desc}</div>
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
function SlideDivider({ data, number, title }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={{ ...slideBase, background: C.lightGray, display: "flex" }}>
      {/* Panneau gauche avec losange décoratif */}
      <div style={{ width: "35%", background: `linear-gradient(150deg, ${C.primary} 0%, ${C.primaryDark} 100%)`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", right: -35, width: 70, height: 70, background: C.lightGray, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, transform: "rotate(45deg)" }}>
          <div style={{ width: 56, height: 56, background: C.primary, border: `2px solid ${C.gold}`, transform: "rotate(-45deg)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
            <img src={LOGO_URL} alt="WallSwiss" style={{ height: 26 }} />
          </div>
        </div>
      </div>

      {/* Contenu principal à droite */}
      <div style={{ flex: 1, padding: "0 80px", display: "flex", flexDirection: "column", justifyContent: "center", zIndex: 1 }}>
        <div style={{ color: C.gray, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>
          La stratégie recommandée
        </div>
        <div style={{ fontFamily: "'Times New Roman', Times, serif", color: C.primary, fontSize: 42, fontWeight: 700, lineHeight: 1.1 }}>
          Solution d'investissement
        </div>
        <div style={{ fontFamily: "'Times New Roman', Times, serif", color: C.gold, fontSize: 42, fontStyle: "italic", marginBottom: 32 }}>
          {title}
        </div>

        <div style={{ width: 40, height: 2, background: C.primary, marginBottom: 24 }} />

        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ width: 3, background: C.gold, flexShrink: 0 }} />
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", color: C.darkGray, fontSize: 12, maxWidth: 450, lineHeight: 1.7 }}>
            « L'investissement est un voyage à long terme. La clé est de rester concentré sur sa destination finale et de s'entourer des meilleurs partenaires. »
          </div>
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
      <div style={{ padding: "48px 56px", height: "100%", boxSizing: "border-box", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
        <div>
          <ReportTitle title="La solution" highlight="compte titre" subtitle="STRATÉGIE" />
          <EditableText editMode={editMode} value={data.texts?.solution1} onChange={v => onTextChange("solution1", v)} style={{ fontSize: 12, lineHeight: 1.8, color: C.darkGray, margin: "0 0 12px" }} />
          <EditableText editMode={editMode} value={data.texts?.solution2} onChange={v => onTextChange("solution2", v)} style={{ fontSize: 12, lineHeight: 1.8, color: C.darkGray, margin: "0 0 12px" }} />
          <EditableText editMode={editMode} value={data.texts?.solution3} onChange={v => onTextChange("solution3", v)} style={{ fontSize: 12, lineHeight: 1.8, color: C.darkGray, margin: 0 }} />
        </div>
        <div>
          <div style={{ background: C.primary, padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ color: C.white, fontSize: 15, fontWeight: 800, textAlign: "center", marginBottom: 16 }}>Couteau Suisse<br/>de l'épargne</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%" }}>
              {bubbles.map((b, i) => (
                <div key={i} style={{ background: C.gold, padding: "10px 12px", textAlign: "center", fontSize: 10, fontWeight: 600, color: C.white, lineHeight: 1.4 }}>{b}</div>
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
      <div style={{ padding: "24px 40px 48px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ border: `2px solid ${C.gold}`, padding: "16px 24px", boxSizing: "border-box", background: C.white }}>
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 22, fontWeight: 700, color: C.primary }}>NS (CH) FUNDS — Swiss Excellence DPM CHF</div>
            <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>Fonds actions suisses — Synthèse institutionnelle</div>
          </div>
          <div style={{ width: "100%", height: 1, background: C.gold, margin: "8px 0 12px 0" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 36px", fontSize: 11 }}>
            <div>
              <div style={{ fontWeight: 700, color: C.gold, marginBottom: 4, fontSize: 12 }}>Positionnement</div>
              {["Fonds actions 100% Suisse", "Devise : CHF", "Benchmark : SLI Swiss Leader Index TR", "Objectif : Surperformance du marché suisse"].map((t,i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 2 }}><span style={{ color: C.gold }}>—</span><span>{t}</span></div>
              ))}
              <div style={{ fontWeight: 700, color: C.gold, marginTop: 8, marginBottom: 4, fontSize: 12 }}>Performance</div>
              {["Performance annualisée : 4,5%", "YTD 2025 : +8,40%", "Benchmark : +7,99%"].map((t,i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 2 }}><span style={{ color: C.gold }}>—</span><span>{t}</span></div>
              ))}
              <div style={{ fontWeight: 700, color: C.gold, marginTop: 8, marginBottom: 4, fontSize: 12 }}>Structure de frais</div>
              {["Management fee : 1,50%", "Performance fee : 10%"].map((t,i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 2 }}><span style={{ color: C.gold }}>—</span><span>{t}</span></div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: C.gold, marginBottom: 4, fontSize: 12 }}>Profil de risque</div>
              {["Volatilité annualisée : 13,2%", "Sharpe ratio : 0,26", "Beta : 0,99", "Corrélation indice : 0,99"].map((t,i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 2 }}><span style={{ color: C.gold }}>—</span><span>{t}</span></div>
              ))}
              <div style={{ fontWeight: 700, color: C.gold, marginTop: 8, marginBottom: 4, fontSize: 12 }}>Principales positions</div>
              {["Roche — 6,86%", "Novartis — 6,59%", "Nestlé — 5,89%", "UBS — 5,51%"].map((t,i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 2 }}><span style={{ color: C.gold }}>—</span><span>{t}</span></div>
              ))}
              <div style={{ fontWeight: 700, color: C.gold, marginTop: 8, marginBottom: 4, fontSize: 12 }}>Lecture stratégique WallSwiss</div>
              {["Exposition domestique CHF", "Qualité suisse défensive", "ESG intégré", "Complément idéal d'une allocation internationale USD"].map((t,i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 2 }}><span style={{ color: C.primary, fontWeight: 700 }}>&#10003;</span><span>{t}</span></div>
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

  // SVG Chart variables
  const svgW = 400; const svgH = 220;
  const padL = 45; const padR = 15; const padT = 10; const padB = 25;
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
      <div style={{ padding: "48px 56px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Vos objectifs sur le" highlight="compte titre" subtitle="SIMULATION FINANCIÈRE" />
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 32, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", paddingRight: 20 }}>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: C.darkGray, margin: "0 0 16px", textAlign: "left" }}>
              Ici, nous vous conseillons d'optimiser votre trésorerie actuelle avec un compte titre chez <strong>SwissQuote</strong> sur la solution de placement avec un dépôt initial de <strong>CHF {fmt(montant)}.-</strong>
            </p>
            <p style={{ fontSize: 13, color: C.gray, margin: "0 0 32px", textAlign: "left" }}>
              Nous appliquons des frais de souscription de {frais}% du montant investi soit {fmt(montant * frais / 100)}.-
            </p>
            
            {/* Legend */}
            <div style={{ display: "flex", gap: 16, marginBottom: 16, alignSelf: "center", fontSize: 11, fontWeight: 600 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#9CA3AF" }} /> Pessimiste</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: C.gold }} /> Réaliste</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: C.primaryDark }} /> Optimiste</div>
            </div>

            {/* Line chart SVG */}
            <div style={{ width: "100%", height: 220 }}>
              <svg width="100%" height="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: "visible" }}>
                {/* Y Axis Grid */}
                {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                  const y = padT + h - (pct * h);
                  const val = gridMax * pct;
                  return (
                    <g key={pct}>
                      <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="#E5E7EB" strokeWidth="1" />
                      <text x={padL - 8} y={y + 3} fontSize="10" fill="#6B7280" textAnchor="end">{val === 0 ? "0" : val}</text>
                    </g>
                  );
                })}
                {/* X Axis Labels */}
                {rows.map((r, i) => (
                  <text key={i} x={getX(i)} y={svgH - 5} fontSize="10" fill="#6B7280" textAnchor="middle">N+{r.year}</text>
                ))}
                {/* Lines */}
                <path d={dP} fill="none" stroke="#9CA3AF" strokeWidth="2.5" />
                <path d={dR} fill="none" stroke={C.gold} strokeWidth="2.5" />
                <path d={dO} fill="none" stroke={C.primaryDark} strokeWidth="2.5" />
                {/* Points */}
                {rows.map((r, i) => (
                  <g key={i}>
                    <circle cx={getX(i)} cy={getY(r.pessimiste)} r="3.5" fill="#9CA3AF" />
                    <circle cx={getX(i)} cy={getY(r.realiste)} r="3.5" fill={C.gold} />
                    <circle cx={getX(i)} cy={getY(r.optimiste)} r="3.5" fill={C.primaryDark} />
                  </g>
                ))}
              </svg>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ color: C.gold, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12, textAlign: "center" }}>PROJECTIONS FINANCIÈRES*</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "center" }}>
              <thead>
                <tr style={{ background: C.primary, color: C.white }}>
                  <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 600 }}>Années</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 600 }}>Pessimiste {data.tauxPessimiste || 3}%</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 600 }}>Réaliste {data.tauxRealiste || 6}%</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 600 }}>Optimiste {data.tauxOptimiste || 9}%</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.lightGray : C.white }}>
                    <td style={{ padding: "9px 14px", fontWeight: 700, color: C.primary, textAlign: "center" }}>N+{r.year}</td>
                    <td style={{ padding: "9px 14px", textAlign: "center" }}>{fmt(r.pessimiste)}</td>
                    <td style={{ padding: "9px 14px", textAlign: "center" }}>{fmt(r.realiste)}</td>
                    <td style={{ padding: "9px 14px", textAlign: "center", fontWeight: 600, color: C.primary }}>{fmt(r.optimiste)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 8, color: C.gray, marginTop: 8, lineHeight: 1.5, fontStyle: "italic", textAlign: "center" }}>
              *L'illustration présentée ne constitue pas un indicateur fiable quant aux performances futures. Elle a seulement pour but d'illustrer les mécanismes de votre investissement.
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
      <div style={{ padding: "48px 56px", height: "100%", boxSizing: "border-box" }}>
        <ReportTitle title="Avantages tarifaires WallSwiss —" highlight="WS Premium" subtitle="TARIFICATION" />
        <div style={{ fontSize: 12, color: C.gray, marginBottom: 28 }}>Conditions préférentielles "WS Premium" — présentation synthétique</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
          {[
            { label: "Droits de garde", value: "0,10% de 0 à 1 M CHF", badge: "max 200 CHF", sub: "Puis 0,03% au-delà de 1 M (pricing sur-mesure possible > 1 M)." },
            { label: "Frais d'achat AMC", value: "0,25%", badge: "min 50 CHF / transaction", sub: "" },
            { label: "Taux de change", value: "0,40% jusqu'à 100 000 CHF", badge: "0,20% au-delà", sub: "" },
          ].map((item, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr", border: `1px solid ${C.mediumGray}`, overflow: "hidden" }}>
              <div style={{ background: C.lightGray, padding: "16px 20px", display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.darkGray }}>{item.label}</span>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.primary }}>{item.value}</span>
                {item.badge && <span style={{ marginLeft: 12, fontSize: 10, fontWeight: 700, color: C.primary, border: `1px solid ${C.primary}`, padding: "2px 8px", textTransform: "uppercase" }}>{item.badge}</span>}
                {item.sub && <div style={{ fontSize: 10, color: C.gray, marginTop: 4 }}>{item.sub}</div>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 9, color: C.gray, marginTop: 16, fontStyle: "italic" }}>Tarification indicative à valider selon profil client, volume et configuration de portefeuille.</div>
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
      <div style={{ padding: "48px 56px", height: "100%", boxSizing: "border-box" }}>
        <ReportTitle title="Profil 2 —" highlight="Patrimoine en croissance" subtitle="COMPARATIF BANCAIRE" />
        <div style={{ fontSize: 12, color: C.gray, marginBottom: 24 }}>Portefeuille 300 kCHF ; change annuel 60 kCHF ; achats d'AMC 20 kCHF/an.</div>
        <table style={{ width: "100%", maxWidth: 640, borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ padding: "12px 16px", textAlign: "left", color: C.primary, fontWeight: 700, borderBottom: `2px solid ${C.primary}` }}>Banque</th>
              <th style={{ padding: "12px 16px", textAlign: "right", color: C.primary, fontWeight: 700, borderBottom: `2px solid ${C.primary}` }}>Garde (an)</th>
              <th style={{ padding: "12px 16px", textAlign: "right", color: C.primary, fontWeight: 700, borderBottom: `2px solid ${C.primary}` }}>Change (an)</th>
              <th style={{ padding: "12px 16px", textAlign: "right", color: C.primary, fontWeight: 700, borderBottom: `2px solid ${C.primary}` }}>AMC (an)</th>
              <th style={{ padding: "12px 16px", textAlign: "right", color: C.primary, fontWeight: 700, borderBottom: `2px solid ${C.primary}` }}>Total (an)</th>
            </tr>
          </thead>
          <tbody>
            {[
              { bank: "WallSwiss / Swissquote", garde: 200, change: 240, amc: 50, total: 490 },
              { bank: "Raiffeisen", garde: 750, change: 750, amc: 180, total: 1680 },
              { bank: "UBS", garde: 1050, change: 1020, amc: 200, total: 2270 },
            ].map((r, i) => (
              <tr key={i} style={{ background: i === 0 ? "rgba(105,33,2,0.04)" : "transparent" }}>
                <td style={{ padding: "12px 16px", fontWeight: i === 0 ? 700 : 500, color: i === 0 ? C.primary : C.black, borderBottom: `1px solid ${C.lightGray}` }}>{r.bank}</td>
                <td style={{ padding: "12px 16px", textAlign: "right", color: C.primary, fontWeight: 600, borderBottom: `1px solid ${C.lightGray}` }}>{r.garde}</td>
                <td style={{ padding: "12px 16px", textAlign: "right", color: C.primary, fontWeight: 600, borderBottom: `1px solid ${C.lightGray}` }}>{r.change}</td>
                <td style={{ padding: "12px 16px", textAlign: "right", color: C.gold, fontWeight: 600, borderBottom: `1px solid ${C.lightGray}` }}>{r.amc}</td>
                <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: i === 0 ? C.primary : C.black, borderBottom: `1px solid ${C.lightGray}` }}>{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: 9, color: C.gray, marginTop: 16, fontStyle: "italic" }}>Hypothèses : tarifs publics/partenaires ; à valider selon profil & package.</div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 14 — Application SwissQuote
function SlideApp({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "48px 56px", height: "100%", boxSizing: "border-box", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
        <div>
          <ReportTitle title="Votre application de suivi" highlight="SwissQuote" subtitle="CENTRALISEZ L'ENSEMBLE DE VOS FINANCES EN UN SEUL ENDROIT" />
          <p style={{ fontSize: 12, lineHeight: 1.8, color: C.darkGray, margin: "0 0 12px" }}>
            Effectuez des opérations de trading, d'investissement et bancaires en <strong>toute sécurité</strong> et à des <strong>tarifs avantageux</strong>, grâce au principal acteur suisse de la banque en ligne.
          </p>
          <p style={{ fontSize: 12, lineHeight: 1.8, color: C.darkGray, margin: 0 }}>
            Nos plateformes intuitives vous invitent à explorer un monde riche en opportunités. Et accédez à une <strong>vaste gamme</strong> d'informations et de programmes de formation.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", height: "100%" }}>
          <img src="https://wallswiss.ch/wp-content/uploads/2026/03/imgi_10_width_799.webp" alt="Swissquote App Desktop" style={{ width: "85%", objectFit: "contain", borderRadius: "6px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", zIndex: 1 }} />
          <img src="https://wallswiss.ch/wp-content/uploads/2026/03/imgi_9_width_400.webp" alt="Swissquote App Mobile" style={{ width: "32%", objectFit: "contain", position: "absolute", bottom: "10%", right: "5%", borderRadius: "10px", boxShadow: "0 15px 40px rgba(0,0,0,0.3)", zIndex: 2 }} />
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
      
      {/* Décoration filigrane géante centrée */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", opacity: 0.03, pointerEvents: "none", zIndex: 1 }}>
         <img src={LOGO_URL} alt="" style={{ width: "800px", filter: "invert(1)" }} />
      </div>

      <div style={{ zIndex: 2, display: "flex", width: "100%", padding: "0 80px", gap: "80px", alignItems: "center" }}>
        
        {/* Panneau gauche */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>SYNTHÈSE & CONTACT</div>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 42, fontWeight: 700, color: C.primary, lineHeight: 1.1, marginBottom: 24 }}>
            Prêt à concrétiser<br/><em style={{ color: C.gold }}>vos projets ?</em>
          </div>
          <div style={{ width: 40, height: 3, background: C.gold, marginBottom: 24 }} />
          <EditableText editMode={editMode} value={data.texts?.contactDesc} onChange={v => onTextChange("contactDesc", v)} style={{ fontSize: 13, lineHeight: 1.8, color: C.darkGray, margin: 0, maxWidth: 450 }} />
        </div>

        {/* Panneau droit - Contact card */}
        <div style={{ width: 400, border: `1px solid ${C.mediumGray}`, padding: "48px", position: "relative", background: C.white, boxShadow: "0 10px 40px rgba(0,0,0,0.05)" }}>
          <div style={{ position: "absolute", top: -10, left: 32, background: C.white, padding: "0 16px", color: C.gold, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            VOTRE INTERLOCUTEUR DÉDIÉ
          </div>
          
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, fontWeight: 700, color: C.primary, marginBottom: 4 }}>{data.conseiller || "Louis Borne"}</div>
          <div style={{ color: C.gray, fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 32 }}>{data.titreConseiller || "Conseillère en Gestion de Patrimoine"}</div>
          
          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(105,33,2,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, fontWeight: 700, fontSize: 13 }}>T</div>
              <span style={{ fontSize: 14, color: C.darkGray, fontWeight: 600 }}>{data.telephone || "+41.76.231.92.75"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(105,33,2,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, fontWeight: 700, fontSize: 13 }}>E</div>
              <span style={{ fontSize: 14, color: C.darkGray, fontWeight: 600 }}>{data.email || "l.borne@wallswiss.ch"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(105,33,2,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, fontWeight: 700, fontSize: 13 }}>A</div>
              <span style={{ fontSize: 14, color: C.darkGray, fontWeight: 600 }}>Rue Kleberg 14, 1201 Genève</span>
            </div>
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

  // --- PDF LOGIC (Inspirée du CRM) ---
  const getPdfOptions = (filename) => ({
    margin: 0,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    pagebreak: { mode: ['css', 'legacy'] },
    html2canvas: { 
      scale: 2, 
      useCORS: true, 
      scrollY: 0,
      onclone: (doc) => {
        const el = doc.getElementById('report-printable');
        if (el) {
          // Réinitialise le positionnement caché pour le clone PDF
          el.style.position = 'static';
          el.style.left = 'auto';
          el.style.top = 'auto';
          // Convertit les textareas en divs pour un affichage propre dans le PDF
          doc.querySelectorAll('#report-printable textarea').forEach((textarea) => {
            const div = doc.createElement('div');
            // Récupère les styles de base du textarea
            div.style.cssText = window.getComputedStyle(textarea).cssText;
            div.style.height = 'auto';
            div.style.whiteSpace = 'pre-wrap';
            div.style.border = 'none';
            div.style.background = 'transparent';
            div.innerText = textarea.value;
            textarea.parentNode.replaceChild(div, textarea);
          });
        }
      }
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } // Format paysage
  });

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
    const element = document.getElementById('report-printable');
    if (!element) return;
    
    setIsPdfLoading(true);
    try {
      const html2pdf = await requireHtml2Pdf();
      await html2pdf()
        .set(getPdfOptions(`Rapport_${data.nom || 'Client'}.pdf`))
        .from(element)
        .save();
    } catch(e) {
      console.error("Erreur PDF:", e);
      alert("Erreur de chargement du moteur PDF.");
    } finally {
      setIsPdfLoading(false);
    }
  };
  // --- END PDF LOGIC ---

  const slides = [
    <SlideCover data={data} />,
    <SlideTOC data={data} />,
    <SlidePhilosophy data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideAbout data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideSituation data={data} />,
    <SlideSwissquote data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideAdvantages data={data} />,
    <SlideDivider data={data} number={6} title="Compte Titre" />,
    <SlideCompteTitre data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideFund data={data} />,
    <SlideProjections data={data} />,
    <SlideTarifs data={data} />,
    <SlideComparatif data={data} />,
    <SlideApp data={data} />,
    <SlideContact data={data} editMode={editMode} onTextChange={handleTextChange} />,
  ];

  return (
    <div className="preview-modal-container" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div className="no-print" style={{ background: C.black, padding: "10px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <span style={{ color: C.white, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em" }}>APERCU — {data.prenom} {(data.nom||"").toUpperCase()}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={handleDownloadPDF} disabled={isPdfLoading} style={{ background: C.white, color: C.black, border: "none", padding: "6px 12px", cursor: isPdfLoading ? "wait" : "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 10, fontWeight: 700, borderRadius: "2px", opacity: isPdfLoading ? 0.7 : 1, transition: "0.2s" }}>
            {isPdfLoading ? "⏳ GÉNÉRATION EN COURS..." : "📥 TÉLÉCHARGER PDF"}
          </button>
          <button onClick={() => setEditMode(!editMode)} style={{ background: editMode ? C.gold : "transparent", border: `1px solid ${C.gold}`, color: editMode ? C.white : C.gold, padding: "6px 12px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 10, fontWeight: 700, borderRadius: "2px", transition: "0.2s" }}>
            {editMode ? "✓ TERMINER L'ÉDITION" : "✎ ÉDITER LES TEXTES"}
          </button>
          <span style={{ color: C.gold, fontSize: 11, marginLeft: 8 }}>{currentSlide + 1} / {slides.length}</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", color: C.white, border: "none", padding: "6px 16px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 11, fontWeight: 600 }}>FERMER</button>
        </div>
      </div>
      {/* Slide area */}
      <div className="no-print" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 60px", position: "relative", minHeight: 0 }}>
        <button onClick={() => setCurrentSlide(s => Math.max(0, s - 1))} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: currentSlide === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)", color: currentSlide === 0 ? "rgba(255,255,255,0.2)" : C.white, border: "none", width: 40, height: 40, cursor: currentSlide === 0 ? "default" : "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>&#8249;</button>
        <div style={{ width: "100%", maxWidth: 960, boxShadow: "0 8px 40px rgba(0,0,0,0.5)", position: "relative" }}>
          {slides[currentSlide]}
          <div style={{ position: "absolute", bottom: 0, right: 32, height: 36, display: "flex", alignItems: "center", zIndex: 10 }}>
            <span style={{ color: C.white, fontSize: 10, fontWeight: 700 }}>{currentSlide + 1}</span>
          </div>
        </div>
        <button onClick={() => setCurrentSlide(s => Math.min(slides.length - 1, s + 1))} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: currentSlide === slides.length - 1 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)", color: currentSlide === slides.length - 1 ? "rgba(255,255,255,0.2)" : C.white, border: "none", width: 40, height: 40, cursor: currentSlide === slides.length - 1 ? "default" : "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>&#8250;</button>
      </div>
      {/* Thumbnails */}
      <div className="no-print" style={{ background: C.black, padding: "8px 24px", display: "flex", gap: 4, overflowX: "auto", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        {slides.map((_, i) => (
          <div key={i} onClick={() => setCurrentSlide(i)} style={{ width: 48, height: 28, background: i === currentSlide ? C.primary : "rgba(255,255,255,0.06)", border: i === currentSlide ? `1px solid ${C.gold}` : "1px solid rgba(255,255,255,0.04)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: i === currentSlide ? C.white : "rgba(255,255,255,0.35)", fontWeight: 600, flexShrink: 0 }}>
            {i + 1}
          </div>
        ))}
      </div>

      {/* VERSION IMPRIMABLE (Cachée hors écran pour html2pdf) */}
      <div id="report-printable" style={{ position: "absolute", left: "-9999px", top: 0 }}>
        {slides.map((SlideComponent, index) => (
          <div key={index} style={{ width: "1280px", height: "720px", position: "relative", overflow: "hidden", pageBreakAfter: "always", breakAfter: "page" }}>
            {/* Format forcé en 1280x720 pour assurer le ratio 16:9 régulier de la librairie PDF */}
            {SlideComponent}
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────── FORM / MAIN APP ──────────────────────

const S = {
  label: { display: "block", fontSize: 11, fontWeight: 600, color: C.gray, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" },
  input: { width: "100%", padding: "10px 12px", border: `1.5px solid ${C.mediumGray}`, fontSize: 13, fontFamily: "'Montserrat', sans-serif", color: C.black, background: C.white, outline: "none", boxSizing: "border-box" },
  select: { width: "100%", padding: "10px 12px", border: `1.5px solid ${C.mediumGray}`, fontSize: 13, fontFamily: "'Montserrat', sans-serif", color: C.black, background: C.white, outline: "none", cursor: "pointer", boxSizing: "border-box" },
  fg: { marginBottom: 16 },
  card: { background: C.white, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", border: `1px solid ${C.mediumGray}` },
  cardTitle: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.primary, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 },
  dot: { width: 8, height: 2, background: C.gold, flexShrink: 0 },
  btnP: { background: C.primary, color: C.white, border: "none", padding: "12px 28px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em" },
  btnS: { background: C.white, color: C.primary, border: `2px solid ${C.primary}`, padding: "10px 24px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 600 },
};

export default function WallSwissApp() {
  const [page, setPage] = useState("dashboard");
  const [step, setStep] = useState(0);
  const [reports, setReports] = useState([]);
  const [preview, setPreview] = useState(null);
  
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
    contactDesc: "Gérer son patrimoine nécessite une approche personnalisée et stratégique. En optimisant sa fiscalité, en sécurisant son épargne et en faisant des choix d'investissement éclairés, il est possible de construire un patrimoine pérenne et adapté à vos projets de vie."
  };

  const [form, setForm] = useState({
    templateId: "swissquote",
    nom: "", prenom: "", age: "", profession: "", nationalite: "France", statut: "Célibataire", revenus: "",
    capaciteEpargne: "", fortuneGlobale: "", profilRisque: "Équilibré", horizonPlacement: "Moyen terme (3 - 8 ans)",
    objectifs: [], objectifCustom: "",
    montantInvestissement: "100000", fraisSouscription: "3",
    tauxPessimiste: "3", tauxRealiste: "6", tauxOptimiste: "9",
    conseiller: "Louis Borne", titreConseiller: "Planificatrice financière",
    telephone: "+41.76.231.92.75", email: "l.borne@wallswiss.ch",
    texts: initialTexts
  });

  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const uText = (k, v) => setForm(p => ({ ...p, texts: { ...p.texts, [k]: v } }));
  const toggleObj = (o) => setForm(p => ({ ...p, objectifs: p.objectifs.includes(o) ? p.objectifs.filter(x => x !== o) : [...p.objectifs, o] }));
  const addCustomObj = () => { if (form.objectifCustom.trim()) { setForm(p => ({ ...p, objectifs: [...p.objectifs, p.objectifCustom.trim()], objectifCustom: "" })); } };
  const handleSave = () => { setReports(p => [...p, { ...form, id: Date.now() }]); setPreview(form); setPage("dashboard"); setStep(0); };
  const resetForm = () => setForm({ templateId: "swissquote", nom: "", prenom: "", age: "", profession: "", nationalite: "France", statut: "Célibataire", revenus: "", capaciteEpargne: "", fortuneGlobale: "", profilRisque: "Équilibré", horizonPlacement: "Moyen terme (3 - 8 ans)", objectifs: [], objectifCustom: "", montantInvestissement: "100000", fraisSouscription: "3", tauxPessimiste: "3", tauxRealiste: "6", tauxOptimiste: "9", conseiller: "Louis Borne", titreConseiller: "Planificatrice financière", telephone: "+41.76.231.92.75", email: "l.borne@wallswiss.ch", texts: initialTexts });

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
              { id: "assurance", title: "Assurance Vie", desc: "Protection et transmission de patrimoine (Bientôt disponible).", active: false },
              { id: "prevoyance", title: "Prévoyance (3A/3B)", desc: "Optimisation fiscale et retraite (Bientôt disponible).", active: false },
              { id: "immobilier", title: "Immobilier", desc: "Investissements et rendements immobiliers (Bientôt disponible).", active: false },
            ].map(tpl => (
              <div key={tpl.id} onClick={() => tpl.active && u("templateId", tpl.id)} style={{ border: `2px solid ${form.templateId === tpl.id ? C.primary : C.mediumGray}`, padding: 20, cursor: tpl.active ? "pointer" : "not-allowed", opacity: tpl.active ? 1 : 0.5, background: form.templateId === tpl.id ? "rgba(105,33,2,0.04)" : C.white, display: "flex", flexDirection: "column", gap: 8 }}>
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
              <div style={S.fg}><label style={S.label}>Âge</label><input style={S.input} type="number" value={form.age} onChange={e=>u("age",e.target.value)} placeholder="58"/></div>
              <div style={S.fg}><label style={S.label}>Nationalité</label><input style={S.input} value={form.nationalite} onChange={e=>u("nationalite",e.target.value)}/></div>
            </div>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}><div style={S.dot} /> Situation Financière</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={S.fg}><label style={S.label}>Profession</label><input style={S.input} value={form.profession} onChange={e=>u("profession",e.target.value)} placeholder="Caméraman"/></div>
              <div style={S.fg}><label style={S.label}>Statut</label><select style={S.select} value={form.statut} onChange={e=>u("statut",e.target.value)}>{["Célibataire","Marié(e)","Divorcé(e)","Veuf/Veuve","Pacsé(e)","Union libre"].map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
            <div style={S.fg}><label style={S.label}>Revenus annuels bruts (CHF)</label><input style={S.input} type="number" value={form.revenus} onChange={e=>u("revenus",e.target.value)} placeholder="120000"/></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={S.fg}><label style={S.label}>Épargne mensuelle</label><input style={S.input} type="number" value={form.capaciteEpargne} onChange={e=>u("capaciteEpargne",e.target.value)} placeholder="1500"/></div>
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
                <div key={obj} onClick={()=>toggleObj(obj)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: `1.5px solid ${active ? C.primary : C.mediumGray}`, background: active ? "rgba(105,33,2,0.04)" : "transparent", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
                  <div style={{ width: 16, height: 16, border: `2px solid ${active ? C.primary : C.mediumGray}`, background: active ? C.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 10px", background: "rgba(105,33,2,0.06)", color: C.primary, fontSize: 11, fontWeight: 600 }}>
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
            <div style={S.fg}><label style={S.label}>Montant initial (CHF)</label><input style={S.input} type="number" value={form.montantInvestissement} onChange={e=>u("montantInvestissement",e.target.value)}/></div>
            <div style={S.fg}><label style={S.label}>Frais de souscription (%)</label><input style={S.input} type="number" step="0.5" value={form.fraisSouscription} onChange={e=>u("fraisSouscription",e.target.value)}/></div>
            
            <div style={{ height: 1, background: C.mediumGray, margin: "16px 0" }} />
            
            <div style={S.fg}><label style={S.label}>Horizon de placement</label><select style={S.select} value={form.horizonPlacement} onChange={e=>u("horizonPlacement",e.target.value)}>{["Court terme (< 3 ans)", "Moyen terme (3 - 8 ans)", "Long terme (> 8 ans)"].map(s=><option key={s}>{s}</option>)}</select></div>
            <div style={{...S.fg, margin: 0}}><label style={S.label}>Profil de risque</label><select style={S.select} value={form.profilRisque} onChange={e=>u("profilRisque",e.target.value)}>{["Prudent", "Équilibré", "Dynamique", "Offensif"].map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}><div style={S.dot} /> Scénarios de rendement</div>
            <div style={S.fg}><label style={S.label}>Taux pessimiste (%)</label><input style={S.input} type="number" step="0.5" value={form.tauxPessimiste} onChange={e=>u("tauxPessimiste",e.target.value)}/></div>
            <div style={S.fg}><label style={S.label}>Taux réaliste (%)</label><input style={S.input} type="number" step="0.5" value={form.tauxRealiste} onChange={e=>u("tauxRealiste",e.target.value)}/></div>
            <div style={S.fg}><label style={S.label}>Taux optimiste (%)</label><input style={S.input} type="number" step="0.5" value={form.tauxOptimiste} onChange={e=>u("tauxOptimiste",e.target.value)}/></div>
            <div style={{ background: C.lightGray, padding: 14, marginTop: 16 }}>
              <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>Montant net investi</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>CHF {fmt((form.montantInvestissement||0)-(form.montantInvestissement||0)*(form.fraisSouscription||0)/100)}.-</div>
            </div>
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
            <div style={{ background: C.lightGray, padding: 18 }}>
              <div style={{ fontSize: 10, color: C.gray, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Client</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>{form.prenom} {form.nom}</div>
              <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>{form.age} ans — {form.profession}</div>
              <div style={{ fontSize: 12, color: C.gray }}>{form.statut} — {form.nationalite}</div>
            </div>
            <div style={{ background: C.lightGray, padding: 18 }}>
              <div style={{ fontSize: 10, color: C.gray, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Investissement</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>CHF {fmt(form.montantInvestissement)}.-</div>
              <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>Frais: {form.fraisSouscription}%</div>
              <div style={{ fontSize: 12, color: C.gray }}>{form.tauxPessimiste}% / {form.tauxRealiste}% / {form.tauxOptimiste}%</div>
            </div>
            <div style={{ background: C.lightGray, padding: 18 }}>
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
    <div style={{ fontFamily: "'Montserrat', sans-serif", background: C.lightGray, minHeight: "100vh", color: C.black }}>
      <style>{`
        input:focus, select:focus { border-color: ${C.primary} !important; }
        ::placeholder { color: #B0ADA6; }
        button:hover { opacity: 0.9; }
        ::-webkit-scrollbar { width: 5px; height: 5px; } ::-webkit-scrollbar-thumb { background: ${C.mediumGray}; }
        
        .print-only { display: none; }
        @media print {
          body { margin: 0; padding: 0; background: white; }
          header, main, .no-print { display: none !important; }
          .print-only { display: block !important; }
          .preview-modal-container { position: absolute; left: 0; top: 0; background: white !important; width: 100vw; }
          @page { size: 16in 9in; margin: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <header style={{ background: C.primary, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: C.primaryDark, padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "2px" }}>
              <img src={LOGO_URL} alt="WallSwiss" style={{ height: "16px" }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Times New Roman', Times, serif", color: C.white, fontSize: 18, fontWeight: 700, letterSpacing: "0.06em" }}>WALLSWISS</div>
              <div style={{ color: C.gold, fontSize: 9, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase" }}>Rapport Generator</div>
            </div>
          </div>
          <nav style={{ display: "flex", gap: 2 }}>
            {[["dashboard","Tableau de bord"],["create","Créer un rapport"]].map(([p,l]) => (
              <button key={p} onClick={()=>{setPage(p);if(p==="create")setStep(0);}} style={{ background: page===p ? "rgba(255,255,255,0.14)" : "transparent", color: page===p ? C.white : "rgba(255,255,255,0.55)", border: "none", padding: "8px 18px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 12, fontWeight: page===p?600:500, letterSpacing: "0.02em" }}>
                {l}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px" }}>
        {page === "dashboard" && (
          reports.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 40px" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 16, opacity: 0.2 }}><rect x="3" y="3" width="18" height="18" stroke={C.primary} strokeWidth="1.5"/><line x1="7" y1="8" x2="17" y2="8" stroke={C.primary} strokeWidth="1"/><line x1="7" y1="12" x2="14" y2="12" stroke={C.primary} strokeWidth="1"/><line x1="7" y1="16" x2="11" y2="16" stroke={C.primary} strokeWidth="1"/></svg>
              <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, color: C.primary, marginBottom: 8 }}>Aucun rapport créé</div>
              <p style={{ color: C.gray, fontSize: 13, marginBottom: 24, maxWidth: 380, margin: "0 auto 24px" }}>Commencez par créer votre premier rapport financier personnalisé.</p>
              <button style={S.btnP} onClick={()=>{setPage("create");resetForm();}}>+ Créer un rapport</button>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, fontWeight: 700, color: C.primary, margin: 0 }}>Mes rapports</h2>
                  <p style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>{reports.length} rapport{reports.length>1?"s":""}</p>
                </div>
                <button style={S.btnP} onClick={()=>{setPage("create");resetForm();}}>+ Nouveau rapport</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {reports.map((r,i) => (
                  <div key={i} style={{ ...S.card, cursor: "pointer", position: "relative", overflow: "hidden" }} onClick={()=>setPreview(r)}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: C.primary }} />
                    <div style={{ fontSize: 10, color: C.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, marginTop: 4 }}>Rapport Client</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.primary, marginBottom: 4 }}>{r.prenom} {(r.nom||"").toUpperCase()}</div>
                    <div style={{ fontSize: 12, color: C.gray, marginBottom: 14 }}>{r.profession} — {r.age} ans</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: `1px solid ${C.lightGray}` }}>
                      <span style={{ fontSize: 11, color: C.gray }}>CHF {fmt(r.montantInvestissement||100000)}.-</span>
                      <span style={{ fontSize: 10, color: C.primary, fontWeight: 600 }}>VOIR &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {page === "create" && (
          <div>
            <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, fontWeight: 700, color: C.primary, margin: "0 0 4px" }}>Nouveau rapport</h2>
            <p style={{ color: C.gray, fontSize: 13, marginBottom: 24 }}>Remplissez les informations pour générer un rapport personnalisé.</p>
            <div style={{ display: "flex", gap: 0, marginBottom: 28, background: C.white, border: `1px solid ${C.mediumGray}`, padding: 4 }}>
              {stepLabels.map((l,i) => (
                <div key={i} onClick={()=>setStep(i)} style={{ flex: 1, textAlign: "center", padding: "10px 6px", fontSize: 11, fontWeight: step===i?700:500, color: step===i?C.white:step>i?C.primary:C.gray, background: step===i?C.primary:"transparent", cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.2s" }}>
                  {l}
                </div>
              ))}
            </div>
            {renderStep()}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
              <button style={{ ...S.btnS, opacity: step===0?0.35:1, pointerEvents: step===0?"none":"auto" }} onClick={()=>setStep(s=>s-1)}>&larr; Précédent</button>
              {step < 6 && <button style={S.btnP} onClick={()=>setStep(s=>s+1)}>Suivant &rarr;</button>}
            </div>
          </div>
        )}
      </main>

      {preview && <ReportPreview data={preview} onClose={()=>setPreview(null)} onUpdateData={handlePreviewUpdate} />}
    </div>
  );
}