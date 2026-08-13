import React, { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   MODULE PROTOCOLES DE SOUSCRIPTION — WallSwiss (fichier autonome)
   ▸ Fichier à placer dans  src/ProtocolesModule.jsx  (à côté de App.jsx)
   ▸ PDF attendus dans  public/procedures/  (noms d'origine conservés) :
       protocole bankzweiplus.pdf
       protocole2epilier LIBERTY.pdf
       protocole2epilier PICTET.pdf
       protocole3epilier PICTET.pdf
   ▸ Aucune dépendance : liseuse PDF intégrée (pdf.js chargé via CDN).
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Tokens (copie de la charte coquille « Aurora » de App.jsx) ── */
const C = {
  bgSoft: "#F5F5F7", card: "#FFFFFF",
  text: "#1D1D1F", muted: "#6E6E73", dim: "#86868B",
  line: "rgba(0,0,0,0.08)", line2: "rgba(0,0,0,0.13)",
  accent: "#692102", accentDark: "#4D1801", accentSoft: "rgba(105,33,2,0.10)",
};
const F = {
  ui: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

/* ── Les 4 protocoles ── */
const PROTOCOLES_LIST = [
  {
    id: "zweiplus", emoji: "🏦", cat: "Banque",
    title: "Compte Investment Depot — bank zweiplus",
    partenaire: "bank zweiplus sa",
    file: "protocole bankzweiplus.pdf", etapes: 10,
    desc: "Ouverture complète du compte : courrier de bienvenue, demande d'ouverture (données personnelles, ayant droit économique, origine des fonds, statut fiscal US/PPE), e-banking, plan de versement, stratégie d'investissement et signatures.",
  },
  {
    id: "2p-pictet", emoji: "🏛️", cat: "Libre passage · 2e pilier",
    title: "Libre passage 2e pilier — Fondation Pictet",
    partenaire: "Fondation Pictet de libre passage",
    file: "protocole2epilier PICTET.pdf", etapes: 8,
    desc: "Éligibilité, profil de risque en 8 questions, sélection du portefeuille, informations du preneur, pièce d'identité, informations conseiller (contact + commission d'entrée) et soumission signée du dossier.",
  },
  {
    id: "2p-liberty", emoji: "🏛️", cat: "Libre passage · 2e pilier",
    title: "Libre passage 2e pilier — Liberty",
    partenaire: "Liberty Fondation de libre passage · BSR Black Swan Resilience SA",
    file: "protocole2epilier LIBERTY.pdf", etapes: 7,
    desc: "Profil d'investissement, contrôle du risque en 10 points, ouverture du compte (origine des avoirs, décision d'investissement, produit et frais, ordre de transfert), services Liberty Connect, données personnelles et confirmation d'identité.",
  },
  {
    id: "3p-pictet", emoji: "🛡️", cat: "Prévoyance · 3e pilier A",
    title: "Prévoyance individuelle 3e pilier A — Fondation Pictet",
    partenaire: "Fondation Pictet en faveur de la prévoyance individuelle",
    file: "protocole3epilier PICTET.pdf", etapes: 7,
    desc: "Éligibilité, profil de risque en 7 questions, tolérance au risque et sélection du portefeuille, informations du preneur de prévoyance, pièce d'identité, informations conseiller et soumission signée.",
  },
];

/* ── Chargeur pdf.js (CDN, identique à la liseuse Académie) ── */
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

/* ── Liseuse PDF ── */
function ProtocoleReader({ proto, onClose }) {
  const [status, setStatus] = useState("loading"); // loading | ok | error
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
      } catch (e) {
        if (!cancelled) setStatus("error");
      }
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
        <button onClick={onClose} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 980, border: `1px solid ${C.line2}`, background: "#fff", color: C.accent, font: `700 13px ${F.ui}`, cursor: "pointer" }}>‹ Protocoles</button>
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
        <a href={url} download={proto.file} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 980, border: "none", background: C.accent, color: "#fff", font: `700 12.5px ${F.ui}`, textDecoration: "none", cursor: "pointer" }}>Télécharger</a>
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

/* ── Galerie des protocoles ── */
export default function ProtocolesModule() {
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState("");

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
            <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>Guides pas-à-pas illustrés (captures d'écran) pour chaque partenaire · liseuse intégrée</div>
          </div>
        </div>
        <div style={{ margin: "18px 0 26px", maxWidth: 420 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un protocole (Pictet, Liberty, zweiplus…)" style={{ width: "100%", padding: "11px 15px", borderRadius: 12, border: `1px solid ${C.line2}`, font: `14px ${F.ui}`, color: C.text, outline: "none", boxSizing: "border-box", background: "#fff" }} />
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
                  style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: "20px 22px", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 10px 26px rgba(0,0,0,.05)", transition: "transform .18s, box-shadow .18s, border-color .18s", display: "flex", gap: 16 }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 18px 40px rgba(0,0,0,.12)"; e.currentTarget.style.borderColor = C.accent; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04), 0 10px 26px rgba(0,0,0,.05)"; e.currentTarget.style.borderColor = C.line; }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{p.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text, lineHeight: 1.3, marginBottom: 3 }}>{p.title}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: C.accent, marginBottom: 7 }}>{p.partenaire}</div>
                    <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.55, marginBottom: 10 }}>{p.desc}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "#fff", background: C.accent, padding: "3px 9px", borderRadius: 980 }}>{p.etapes} étapes</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, background: C.bgSoft, border: `1px solid ${C.line}`, padding: "3px 9px", borderRadius: 980 }}>PDF illustré</span>
                      <span style={{ marginLeft: "auto", color: C.accent, fontSize: 12.5, fontWeight: 700 }}>Ouvrir →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {shown.length === 0 && <div style={{ padding: 40, textAlign: "center", color: C.dim, fontSize: 13 }}>Aucun protocole ne correspond à « {q} ».</div>}
      </div>
    </div>
  );
}
