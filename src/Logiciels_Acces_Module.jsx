import React, { useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   TOUS MES LOGICIELS & ACCÈS — WallSwiss
   Point d'entrée unique vers les outils du cabinet.
   Aucun identifiant ni mot de passe n'est stocké dans l'application.
   Les outils internes s'ouvrent dans l'app via la prop onOpenModule.
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


const Ic = {
  copy: (s = 15, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  grid: (s = 20, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  lock: (s = 18, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
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

const SECTIONS = [
  {
    id: "pilotage", titre: "Pilotage commercial", desc: "Le socle quotidien : relation client, agenda, messagerie.",
    outils: [
      { nom: "Salesforce", desc: "CRM du cabinet : clients, opportunités, suivi des dossiers.", emoji: "📇", tag: "CRM", type: "url", url: "https://wallswiss.my.salesforce.com/?ec=302&startURL=%2Fvisualforce%2Fsession%3Furl%3Dhttps%253A%252F%252Fwallswiss.lightning.force.com%252Flightning%252Fpage%252Fchatter" },
      { nom: "Calendly", desc: "Prise de rendez-vous en ligne, synchronisée avec Outlook.", emoji: "📅", tag: "Agenda", type: "url", url: "https://calendly.com/" },
      { nom: "Outlook", desc: "Messagerie professionnelle et calendrier WallSwiss.", emoji: "✉️", tag: "Messagerie", type: "url", url: "https://outlook.cloud.microsoft/mail/" },
      { nom: "Canva", desc: "Création des visuels et supports à la charte du cabinet.", emoji: "🎨", tag: "Design", type: "url", url: "https://www.canva.com/" },
    ],
  },
  {
    id: "internes", titre: "Outils WallSwiss intégrés", desc: "Modules développés en interne, accessibles sans quitter l'application.",
    outils: [
      { nom: "Générateur de rapport financier", desc: "Compte-titres, prévoyance, LPP, assurance vie et PER.", emoji: "📊", tag: "App", type: "module", module: "rapport" },
      { nom: "Générateur de planification retraite", desc: "Formules Basic, Couple et Premium.", emoji: "🧓", tag: "App", type: "module", module: "retraiteR1" },
      { nom: "Simulateur Quasi-Résident / TOU", desc: "Test des 90 %, comparaison source contre taxation ordinaire.", emoji: "🧮", tag: "App", type: "module", module: "quasiResident" },
      { nom: "Simulateur d'intérêts composés", desc: "Projection de capital avec versements, frais et scénarios.", emoji: "📈", tag: "App", type: "module", module: "interetsComposes" },
      { nom: "Recherche & Mandats LPP", desc: "Génération des mandats et envoi en signature électronique.", emoji: "🏛️", tag: "App", type: "module", module: "rechercheLpp" },
      { nom: "Protocoles de souscription", desc: "Parcours pas à pas par produit et par partenaire.", emoji: "📋", tag: "App", type: "module", module: "protocoles" },
      { nom: "Base documentaire", desc: "Mails types du cabinet.", emoji: "📁", tag: "App", type: "module", module: "mails" },
      { nom: "Documents administratifs", desc: "Formulaires, mandats et courriers à télécharger.", emoji: "🗂️", tag: "App", type: "module", module: "ressources" },
      { nom: "Annuaire partenaires", desc: "Contacts banques, assureurs, fondations de libre passage.", emoji: "📒", tag: "App", type: "module", module: "annuaire" },
      { nom: "Académie WallSwiss", desc: "Bibliothèque de formation et liseuse intégrée.", emoji: "🎓", tag: "App", type: "module", module: "academie" },
      { nom: "Hub Marketing & Leads", desc: "Campagnes, scripts d'appel et créatives.", emoji: "📣", tag: "App", type: "module", module: "marketing" },
      { nom: "Mes demandes", desc: "Congés, notes de frais, matériel, absences.", emoji: "📨", tag: "App", type: "module", module: "tickets" },
      { nom: "Boîte à idées", desc: "Proposer une amélioration pour le cabinet.", emoji: "💡", tag: "App", type: "module", module: "idees" },
    ],
  },
  {
    id: "ia", titre: "Intelligence artificielle & création", desc: "Outils de productivité. Ne jamais y déposer de données client identifiables.",
    outils: [
      { nom: "ChatGPT", desc: "Assistant de rédaction et de synthèse.", emoji: "🤖", tag: "Assistant", type: "url", url: "https://chatgpt.com/" },
      { nom: "Fathom", desc: "Comptes rendus automatiques de réunion.", emoji: "🎙️", tag: "Réunions", type: "url", url: "https://fathom.video/" },
      { nom: "Adobe", desc: "Suite de création et retouche de documents.", emoji: "🖌️", tag: "Création", type: "url", url: "https://www.adobe.com/" },
    ],
  },
  {
    id: "partenaires", titre: "Portails partenaires", desc: "Espaces de souscription et de suivi chez nos partenaires.",
    outils: [
      { nom: "Swissquote", desc: "Dépôt-titres et portefeuilles modèles.", emoji: "🏦", tag: "Banque", type: "url", url: "https://www.swissquote.ch/" },
      { nom: "Liechtenstein Life", desc: "Prévoyance individuelle 3e pilier, application Prosperity.", emoji: "🛡️", tag: "Prévoyance", type: "url", url: "https://www.liechtensteinlife.com/" },
      { nom: "myAFA", desc: "Registre des intermédiaires d'assurance et recertification.", emoji: "🎓", tag: "Conformité", type: "url", url: "https://www.vbv.ch/" },
    ],
  },
];

export default function Logiciels_Acces_Module({ onOpenModule }) {
  const [q, setQ] = useState("");
  const [toast, setToast] = useState("");

  const ouvrir = (o) => {
    if (o.type === "module") { if (onOpenModule) onOpenModule(o.module); return; }
    if (typeof window !== "undefined") window.open(o.url, "_blank", "noopener,noreferrer");
  };
  const copier = (e, o) => {
    e.stopPropagation();
    if (!o.url) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(o.url);
    setToast("Lien " + o.nom + " copié");
    setTimeout(() => setToast(""), 2200);
  };

  const ql = q.trim().toLowerCase();
  const sections = SECTIONS
    .map((s) => ({ ...s, outils: s.outils.filter((o) => !ql || (o.nom + " " + o.desc + " " + o.tag).toLowerCase().includes(ql)) }))
    .filter((s) => s.outils.length);
  const total = SECTIONS.reduce((a, s) => a + s.outils.length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bgSoft, fontFamily: F.ui }}>
      <EnteteModule icone={Ic.grid(20, C.accent)} titre="Tous mes logiciels & accès">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Rechercher parmi ${total} outils...`}
          style={{ width: 300, maxWidth: "100%", padding: "10px 16px", borderRadius: 980, border: `1px solid ${C.line2}`, fontSize: 13.5, fontFamily: F.ui, color: C.text, outline: "none", background: C.card, boxSizing: "border-box" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 4px ${C.accentSoft}`; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.line2; e.currentTarget.style.boxShadow = "none"; }} />
      </EnteteModule>

      <main style={{ flex: 1, overflowY: "auto", padding: "28px 40px 70px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, background: C.amberSoft, borderLeft: `3px solid ${C.amber}`, borderRadius: "0 12px 12px 0", padding: "14px 18px", marginBottom: 28 }}>
            <span style={{ color: C.amber, flexShrink: 0, marginTop: 1 }}>{Ic.lock(18, C.amber)}</span>
            <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.6 }}>
              <b>Sécurité des accès.</b> Aucun identifiant ni mot de passe n'est enregistré dans cette application. Utilisez le gestionnaire de mots de passe de l'équipe (1Password ou Bitwarden) et ne partagez jamais un mot de passe en clair par message, e-mail ou document. En cas de doute ou de tentative de phishing, prévenez immédiatement contact@wallswiss.ch.
            </div>
          </div>

          {sections.map((s) => (
            <div key={s.id} style={{ marginBottom: 34 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 15.5, fontWeight: 800, color: C.text }}>{s.titre}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: C.accent, background: C.accentSoft, padding: "2px 9px", borderRadius: 980 }}>{s.outils.length}</span>
                </div>
                <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>{s.desc}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 15 }}>
                {s.outils.map((o) => {
                  const interne = o.type === "module";
                  return (
                    <div key={o.nom} onClick={() => ouvrir(o)}
                      style={{ position: "relative", display: "flex", alignItems: "center", gap: 14, background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "15px 16px", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 10px 26px rgba(0,0,0,.05)", transition: "transform .18s, box-shadow .18s, border-color .18s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 18px 40px rgba(0,0,0,.12)"; e.currentTarget.style.borderColor = C.accent; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04), 0 10px 26px rgba(0,0,0,.05)"; e.currentTarget.style.borderColor = C.line; }}>
                      <div style={{ width: 46, height: 46, borderRadius: 13, background: interne ? `linear-gradient(135deg, ${C.accent}, ${C.accentDark})` : C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{o.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.nom}</span>
                          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: interne ? "#fff" : C.accent, background: interne ? C.accent : C.accentSoft, padding: "2px 6px", borderRadius: 980, flexShrink: 0 }}>{o.tag}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.45 }}>{o.desc}</div>
                      </div>
                      {o.url ? (
                        <button onClick={(e) => copier(e, o)} title="Copier le lien"
                          style={{ width: 30, height: 30, borderRadius: 9, border: `1px solid ${C.line2}`, background: C.card, color: C.dim, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = C.accent; e.currentTarget.style.borderColor = C.accent; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = C.dim; e.currentTarget.style.borderColor = C.line2; }}>
                          {Ic.copy(14, "currentColor")}
                        </button>
                      ) : <span style={{ color: C.accent, fontSize: 17, flexShrink: 0 }}>→</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {sections.length === 0 && (
            <div style={{ padding: 50, textAlign: "center", color: C.dim, fontSize: 13.5, background: C.card, border: `1px dashed ${C.line2}`, borderRadius: 16 }}>
              Aucun outil ne correspond à « {q} ».
            </div>
          )}
        </div>
      </main>

      {toast && <div style={{ position: "fixed", bottom: 34, right: 34, background: C.accent, color: "#fff", padding: "11px 22px", fontSize: 13.5, fontWeight: 600, borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,.18)", zIndex: 3000 }}>{toast}</div>}
    </div>
  );
}
