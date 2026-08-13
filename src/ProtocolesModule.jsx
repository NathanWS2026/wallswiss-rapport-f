import React, { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   MODULE PROTOCOLES DE SOUSCRIPTION — WallSwiss (fichier autonome)
   ▸ PDF attendus dans  public/procedures/  (noms d'origine conservés) :
       protocole bankzweiplus.pdf
       protocole2epilier LIBERTY.pdf
       protocole2epilier PICTET.pdf
       protocole3epilier PICTET.pdf
       Accord-transfert-avoirs-prevoyance.docx
   ▸ Aucune dépendance : liseuse PDF intégrée (pdf.js chargé via CDN).
   ═══════════════════════════════════════════════════════════════════════════ */

const C = {
  bgSoft: "#F5F5F7", card: "#FFFFFF",
  text: "#1D1D1F", muted: "#6E6E73", dim: "#86868B",
  line: "rgba(0,0,0,0.08)", line2: "rgba(0,0,0,0.13)",
  accent: "#692102", accentDark: "#4D1801", accentSoft: "rgba(105,33,2,0.10)",
  gold: "#9B8B5C",
};
const F = {
  ui: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  serif: "'Times New Roman', Times, serif",
};

/* ── Les 4 protocoles + le document à faire signer ── */
const PROTOCOLES_LIST = [
  {
    id: "zweiplus", emoji: "🏦", cat: "Banque", kind: "pdf",
    title: "Compte Investment Depot — bank zweiplus",
    partenaire: "bank zweiplus sa",
    file: "protocole bankzweiplus.pdf", etapes: 10,
    desc: "Ouverture complète du compte : courrier de bienvenue, demande d'ouverture (données personnelles, ayant droit économique, origine des fonds, statut fiscal US/PPE), e-banking, plan de versement, stratégie d'investissement et signatures.",
  },
  {
    id: "2p-pictet", emoji: "🏛️", cat: "Libre passage · 2e pilier", kind: "pdf",
    title: "Libre passage 2e pilier — Fondation Pictet",
    partenaire: "Fondation Pictet de libre passage",
    file: "protocole2epilier PICTET.pdf", etapes: 8,
    desc: "Éligibilité, profil de risque en 8 questions, sélection du portefeuille, informations du preneur, pièce d'identité, informations conseiller (contact + commission d'entrée) et soumission signée du dossier.",
  },
  {
    id: "2p-liberty", emoji: "🏛️", cat: "Libre passage · 2e pilier", kind: "pdf",
    title: "Libre passage 2e pilier — Liberty",
    partenaire: "Liberty Fondation de libre passage · BSR Black Swan Resilience SA",
    file: "protocole2epilier LIBERTY.pdf", etapes: 7,
    desc: "Profil d'investissement, contrôle du risque en 10 points, ouverture du compte (origine des avoirs, décision d'investissement, produit et frais, ordre de transfert), services Liberty Connect, données personnelles et confirmation d'identité.",
  },
  {
    id: "3p-pictet", emoji: "🛡️", cat: "Prévoyance · 3e pilier A", kind: "pdf",
    title: "Prévoyance individuelle 3e pilier A — Fondation Pictet",
    partenaire: "Fondation Pictet en faveur de la prévoyance individuelle",
    file: "protocole3epilier PICTET.pdf", etapes: 7,
    desc: "Éligibilité, profil de risque en 7 questions, tolérance au risque et sélection du portefeuille, informations du preneur de prévoyance, pièce d'identité, informations conseiller et soumission signée.",
  },
  {
    id: "accord-transfert", emoji: "✍️", cat: "Document à faire signer", kind: "letter",
    title: "Accord pour le transfert des avoirs de prévoyance",
    partenaire: "Toutes institutions · LPP et libre passage",
    file: "Accord-transfert-avoirs-prevoyance.docx", etapes: null,
    desc: "Lettre type à faire signer au client avant toute demande de transfert d'avoirs entre institutions. À utiliser systématiquement : sans cet accord écrit, les institutions renvoient le dossier et le traitement est retardé.",
  },
];

/* ── Raisons d'utilisation du document d'accord ── */
const ACCORD_RAISONS = [
  { t: "Preuve écrite du consentement du client", d: "Le document formalise l'accord explicite du client sur le transfert, condition indispensable avant toute démarche auprès des institutions concernées (Institution supplétive, fondations de libre passage, etc.)." },
  { t: "Exigence des institutions de prévoyance", d: "La plupart des institutions n'exécutent aucun transfert sans autorisation signée du titulaire du compte." },
  { t: "Gain de temps dans le traitement des dossiers", d: "En l'absence de ce document, les institutions renvoient systématiquement le dossier en demandant l'accord du client, ce qui génère des allers-retours évitables et retarde inutilement le traitement." },
  { t: "Protection du cabinet", d: "En cas de contestation ultérieure, ce document atteste que le client a été informé et a validé la démarche en toute connaissance de cause." },
];

/* ── Chargeur pdf.js (CDN) ── */
function loadPdfJs() {
  if (typeof window !== "undefined" && window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.async = true;
    s.onload = () => {
      try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; } catch (e) {}
      resolve(window.pdfjsLib);
    };
    s.onerror = () => reject(new Error("Impossible de charger pdf.js"));
    document.head.appendChild(s);
  });
}

const btnRond = { width: 32, height: 32, borderRadius: 9, border: `1px solid ${C.line2}`, background: "#fff", color: C.text, font: `700 15px ${F.ui}`, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" };
const btnPlein = { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 980, border: "none", background: C.accent, color: "#fff", font: `700 12.5px ${F.ui}`, textDecoration: "none", cursor: "pointer" };
const btnLeger = { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 980, border: `1px solid ${C.line2}`, background: "#fff", color: C.accent, font: `700 13px ${F.ui}`, cursor: "pointer" };

/* ── Liseuse PDF ── */
function ProtocoleReader({ proto, onClose }) {
  const [status, setStatus] = useState("loading");
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.25);
  const pdfRef = useRef(null);
  const canvasRef = useRef(null);
  const url = "/procedures/" + encodeURIComponent(proto.file);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading"); setPage(1); pdfRef.current = null;
    (async () => {
      try {
        const lib = await loadPdfJs();
        const doc = await lib.getDocument(url).promise;
        if (cancelled) return;
        pdfRef.current = doc; setNumPages(doc.numPages); setStatus("ok");
      } catch (e) { if (!cancelled) setStatus("error"); }
    })();
    return () => { cancelled = true; };
  }, [proto.id]);

  useEffect(() => {
    if (status !== "ok" || !pdfRef.current || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const p = await pdfRef.current.getPage(page);
        if (cancelled) return;
        const viewport = p.getViewport({ scale });
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width; canvas.height = viewport.height;
        await p.render({ canvasContext: ctx, viewport }).promise;
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, [status, page, scale]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)", background: C.bgSoft }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: C.card, borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
        <button onClick={onClose} style={btnLeger}>‹ Protocoles</button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: F.ui }}>{proto.emoji} {proto.title}</div>
        </div>
        {status === "ok" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(2)))} style={btnRond}>−</button>
            <span style={{ fontSize: 12, color: C.muted, width: 44, textAlign: "center", fontFamily: F.ui }}>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale((s) => Math.min(2.4, +(s + 0.2).toFixed(2)))} style={btnRond}>+</button>
            <div style={{ width: 1, height: 22, background: C.line2, margin: "0 4px" }} />
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={{ ...btnRond, opacity: page <= 1 ? 0.4 : 1 }}>‹</button>
            <span style={{ fontSize: 12.5, color: C.text, fontWeight: 600, minWidth: 74, textAlign: "center", fontFamily: F.ui }}>{page} / {numPages || "…"}</span>
            <button onClick={() => setPage((p) => Math.min(numPages, p + 1))} disabled={page >= numPages} style={{ ...btnRond, opacity: page >= numPages ? 0.4 : 1 }}>›</button>
          </div>
        )}
        <a href={url} download={proto.file} target="_blank" rel="noreferrer" style={btnPlein}>Télécharger</a>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", justifyContent: "center" }}>
        {status === "loading" && <div style={{ color: C.muted, font: `600 14px ${F.ui}`, marginTop: 40 }}>Chargement du protocole…</div>}
        {status === "ok" && (
          <div style={{ boxShadow: "0 12px 40px rgba(0,0,0,.14)", borderRadius: 8, overflow: "hidden", alignSelf: "flex-start", background: "#fff" }}>
            <canvas ref={canvasRef} style={{ display: "block", maxWidth: "100%" }} />
          </div>
        )}
        {status === "error" && (
          <div style={{ maxWidth: 520, marginTop: 30, background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "22px 24px", textAlign: "center", height: "fit-content", fontFamily: F.ui }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>📄</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 8 }}>Document indisponible</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>Le fichier <b>{proto.file}</b> n'a pas pu être chargé. Vérifiez qu'il est bien présent dans le dossier <b>public/procedures/</b>.</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Vue lettre : accord de transfert des avoirs ── */
function AccordView({ proto, onClose }) {
  const url = "/procedures/" + encodeURIComponent(proto.file);
  const champ = { background: "rgba(155,139,92,.16)", borderBottom: `1px solid ${C.gold}`, padding: "0 3px", color: C.accentDark, fontWeight: 600 };
  const para = { fontFamily: F.serif, fontSize: 15, lineHeight: 1.7, color: "#1A1A1A", margin: "0 0 14px", textAlign: "justify" };
  const Ch = ({ children }) => <span style={champ}>{children}</span>;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)", background: C.bgSoft }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: C.card, borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
        <button onClick={onClose} style={btnLeger}>‹ Protocoles</button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: F.ui }}>✍️ {proto.title}</div>
        </div>
        <button onClick={() => window.print()} style={btnLeger}>Imprimer</button>
        <a href={url} download={proto.file} style={btnPlein}>Télécharger le modèle Word</a>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "26px 24px 60px", fontFamily: F.ui }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(280px, 1fr)", gap: 24, alignItems: "start" }}>

          {/* La lettre */}
          <div style={{ background: "#fff", border: `1px solid ${C.line}`, boxShadow: "0 12px 40px rgba(0,0,0,.10)", padding: "44px 52px 40px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: C.accent }}>WS · The WallSwiss Partner's SA</div>
            <div style={{ height: 2, background: C.accent, margin: "10px 0 26px" }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 22 }}>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 8.5, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: C.muted, marginBottom: 7 }}>Expéditeur</div>
                <div style={{ fontFamily: F.serif, fontSize: 14, lineHeight: 1.65, color: "#1A1A1A" }}>
                  <Ch>[Prénom NOM du client]</Ch><br /><Ch>[Adresse]</Ch><br /><Ch>[NPA Ville, Pays]</Ch>
                </div>
              </div>
              <div style={{ background: "#FBF7F4", padding: "12px 14px" }}>
                <div style={{ fontFamily: F.ui, fontSize: 8.5, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: C.accent, marginBottom: 7 }}>Destinataire</div>
                <div style={{ fontFamily: F.serif, fontSize: 14, lineHeight: 1.65, color: "#1A1A1A" }}>
                  À l'attention de <Ch>[Institution / Fondation concernée]</Ch><br /><Ch>[Adresse de l'institution]</Ch>
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right", fontFamily: F.serif, fontSize: 14, color: "#1A1A1A", marginBottom: 24 }}>
              <Ch>[Ville]</Ch>, le <Ch>[date]</Ch>
            </div>

            <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 800, color: C.accent, marginBottom: 20 }}>
              Objet : Accord pour le transfert de mes avoirs de prévoyance
            </div>

            <p style={para}>Madame, Monsieur,</p>
            <p style={para}>
              Par la présente, je confirme être pleinement informé, conscient et d'accord avec le transfert de l'intégralité de mes avoirs de prévoyance actuellement détenus auprès de <Ch>[institution actuelle]</Ch> vers un compte de libre passage ouvert auprès de <Ch>[nouvelle institution / fondation]</Ch>.
            </p>
            <p style={para}>Je donne expressément mon accord afin que ce transfert soit effectué conformément aux démarches entreprises pour mon dossier.</p>
            <p style={para}>Je vous remercie de bien vouloir prendre en compte la présente autorisation et de procéder au transfert de mes avoirs dans les meilleurs délais.</p>
            <p style={{ ...para, marginBottom: 34 }}>Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p>

            <div style={{ fontFamily: F.ui, fontSize: 8.5, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>Signature</div>
            <div style={{ height: 1, background: "#C9C4BE", marginBottom: 8 }} />
            <div style={{ fontFamily: F.serif, fontSize: 14, color: "#1A1A1A" }}><Ch>[Prénom NOM du client]</Ch></div>

            <div style={{ marginTop: 40, paddingTop: 10, borderTop: `1px solid ${C.line}`, textAlign: "center", fontFamily: F.ui, fontSize: 8.5, color: C.dim }}>
              WS - The WallSwiss Partner's SA · Route de Saint-Cergue 295, 1260 Nyon · +41 (0)77 941 18 77 · contact@wallswiss.ch · FINMA F01496591
            </div>
          </div>

          {/* Pourquoi ce document */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 0 }}>
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ height: 4, background: C.accent }} />
              <div style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 }}>Pourquoi ce document est indispensable</div>
                <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, marginBottom: 16 }}>À utiliser systématiquement dans tout dossier impliquant un transfert d'avoirs LPP ou de libre passage entre institutions.</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  {ACCORD_RAISONS.map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: 11 }}>
                      <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, background: C.accentSoft, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", font: `800 11px ${F.ui}` }}>{i + 1}</span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{r.t}</span>
                        <span style={{ display: "block", fontSize: 12.5, color: C.muted, lineHeight: 1.55 }}>{r.d}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ background: "rgba(155,139,92,.10)", border: `1px solid rgba(155,139,92,.35)`, borderRadius: 14, padding: "13px 16px" }}>
              <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.6 }}>
                <b>Mode d'emploi :</b> téléchargez le modèle Word, remplacez les champs surlignés, faites signer le client, puis joignez la lettre au dossier envoyé à l'institution.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Galerie ── */
export default function ProtocolesModule() {
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState("");

  if (open && open.kind === "letter") return <AccordView proto={open} onClose={() => setOpen(null)} />;
  if (open) return <ProtocoleReader proto={open} onClose={() => setOpen(null)} />;

  const ql = q.trim().toLowerCase();
  const shown = PROTOCOLES_LIST.filter((p) => !ql || (p.title + " " + p.partenaire + " " + p.cat + " " + p.desc).toLowerCase().includes(ql));
  const cats = [...new Set(shown.map((p) => p.cat))];

  return (
    <div style={{ flex: 1, minHeight: "calc(100vh - 60px)", overflowY: "auto", padding: "26px 40px 60px", boxSizing: "border-box", background: "radial-gradient(1100px 700px at 50% -6%, #FFFFFF, #EEF0F3)", fontFamily: F.ui }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
          <div style={{ width: 58, height: 58, borderRadius: 18, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, boxShadow: "0 12px 28px rgba(105,33,2,.28)", flexShrink: 0 }}>📋</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: C.text }}>Protocoles de souscription</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>Guides pas-à-pas illustrés et documents à faire signer · liseuse intégrée</div>
          </div>
        </div>
        <div style={{ margin: "18px 0 26px", maxWidth: 420 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (Pictet, Liberty, zweiplus, accord…)" style={{ width: "100%", padding: "11px 15px", borderRadius: 12, border: `1px solid ${C.line2}`, font: `14px ${F.ui}`, color: C.text, outline: "none", boxSizing: "border-box", background: "#fff" }} />
        </div>

        {cats.map((cat) => (
          <div key={cat} style={{ marginBottom: 30 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 13 }}>
              <span style={{ fontSize: 15.5, fontWeight: 800, color: C.text }}>{cat}</span>
              <span style={{ fontSize: 11.5, color: C.accent, background: C.accentSoft, padding: "2px 8px", borderRadius: 980, fontWeight: 700 }}>{shown.filter((p) => p.cat === cat).length}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 16 }}>
              {shown.filter((p) => p.cat === cat).map((p) => (
                <div key={p.id} onClick={() => setOpen(p)}
                  style={{ background: C.card, border: `1px solid ${p.kind === "letter" ? "rgba(155,139,92,.45)" : C.line}`, borderRadius: 18, padding: "20px 22px", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 10px 26px rgba(0,0,0,.05)", transition: "transform .18s, box-shadow .18s, border-color .18s", display: "flex", gap: 16 }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 18px 40px rgba(0,0,0,.12)"; e.currentTarget.style.borderColor = C.accent; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04), 0 10px 26px rgba(0,0,0,.05)"; e.currentTarget.style.borderColor = p.kind === "letter" ? "rgba(155,139,92,.45)" : C.line; }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: p.kind === "letter" ? "rgba(155,139,92,.16)" : C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{p.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text, lineHeight: 1.3, marginBottom: 3 }}>{p.title}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: C.accent, marginBottom: 7 }}>{p.partenaire}</div>
                    <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.55, marginBottom: 10 }}>{p.desc}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {p.etapes ? <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "#fff", background: C.accent, padding: "3px 9px", borderRadius: 980 }}>{p.etapes} étapes</span> : null}
                      <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: p.kind === "letter" ? "#fff" : C.muted, background: p.kind === "letter" ? C.gold : C.bgSoft, border: p.kind === "letter" ? "none" : `1px solid ${C.line}`, padding: "3px 9px", borderRadius: 980 }}>{p.kind === "letter" ? "Modèle Word" : "PDF illustré"}</span>
                      <span style={{ marginLeft: "auto", color: C.accent, fontSize: 12.5, fontWeight: 700 }}>Ouvrir →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {shown.length === 0 && <div style={{ padding: 40, textAlign: "center", color: C.dim, fontSize: 13 }}>Aucun résultat pour « {q} ».</div>}
      </div>
    </div>
  );
}
