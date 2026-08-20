import React, { useState, useEffect, useMemo } from "react";
import { collection, addDoc, onSnapshot, updateDoc, doc } from "firebase/firestore";

/* ═══════════════════════════════════════════════════════════════════════════
   SONDAGES INTERNES — WallSwiss
   Un sondage ouvert à la fois par sujet, vote unique par agent, résultats en
   direct. Stockage Firestore : artifacts/{appId}/public/data/sondages et
   .../sondages_votes. Dégradation propre si Firestore est indisponible.
   ═══════════════════════════════════════════════════════════════════════════ */

const C = {
  primary: "#692102", gold: "#A59568",
  text: "#1D1D1F", muted: "#6E6E73", dim: "#86868B",
  card: "#FFFFFF", bgSoft: "#F5F5F7",
  line: "rgba(0,0,0,0.08)", line2: "rgba(0,0,0,0.13)",
  accent: "#692102", accentSoft: "rgba(105,33,2,0.10)",
  green: "#047857", greenSoft: "rgba(4,120,87,.09)",
  amber: "#B45309",
};
const F = {
  ui: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  serif: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif",
};
const S = {
  card: { background: C.card, padding: 22, boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 28px rgba(0,0,0,0.05)", border: `1px solid ${C.line}`, borderRadius: 18 },
  input: { width: "100%", padding: "10px 13px", border: `1px solid ${C.line2}`, fontSize: 13.5, fontFamily: F.ui, color: C.text, background: C.card, outline: "none", boxSizing: "border-box", borderRadius: 11 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, fontFamily: F.ui },
  btnP: { background: C.accent, color: "#fff", border: "none", padding: "11px 22px", cursor: "pointer", fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, borderRadius: 980, boxShadow: "0 2px 8px rgba(105,33,2,.28)" },
  btnS: { background: C.card, color: C.accent, border: `1px solid ${C.line2}`, padding: "10px 20px", cursor: "pointer", fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, borderRadius: 980 },
};

const Ic = {
  poll: (s = 20, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  plus: (s = 15, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
  ),
  check: (s = 15, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
  ),
};

const dateFr = (ts) => {
  if (!ts) return "";
  try { return new Date(ts).toLocaleDateString("fr-CH", { day: "2-digit", month: "long", year: "numeric" }); } catch { return ""; }
};
const prenom = (u) => {
  if (!u) return "Agent";
  const base = String(u.email || "").split("@")[0] || "agent";
  return base.charAt(0).toUpperCase() + base.slice(1);
};

function Barre({ label, votes, total, gagnant, aVote, onVote }) {
  const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
  if (!aVote) {
    return (
      <button onClick={onVote}
        style={{ display: "block", width: "100%", textAlign: "left", background: C.bgSoft, border: `1px solid ${C.line}`, borderRadius: 12, padding: "13px 16px", cursor: "pointer", fontFamily: F.ui, fontSize: 14, color: C.text, fontWeight: 500, marginBottom: 9 }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = "#fff"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.background = C.bgSoft; }}>
        {label}
      </button>
    );
  }
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
        <span style={{ color: C.text, fontWeight: gagnant ? 700 : 500 }}>{label}</span>
        <span style={{ color: gagnant ? C.accent : C.muted, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{pct} % · {votes}</span>
      </div>
      <div style={{ height: 9, background: C.bgSoft, borderRadius: 980, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: gagnant ? C.accent : C.gold, borderRadius: 980, transition: "width .35s ease" }} />
      </div>
    </div>
  );
}

function CarteSondage({ s, votes, user, onVote, onClore }) {
  const mien = votes.find((v) => v.uid === (user && user.uid));
  const total = votes.length;
  const compte = (s.options || []).map((_, i) => votes.filter((v) => v.choix === i).length);
  const max = Math.max(0, ...compte);
  const aVote = !!mien || !!s.closed;
  const peutClore = user && s.createdByUid === user.uid && !s.closed;

  return (
    <div style={{ ...S.card, marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: F.serif, fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{s.question}</div>
          <div style={{ fontSize: 11.5, color: C.dim, marginTop: 5 }}>
            Proposé par {s.createdByName || "un agent"} · {dateFr(s.createdAt)}
            {s.closed && <span style={{ color: C.amber, fontWeight: 700 }}> · clôturé</span>}
          </div>
        </div>
        <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: C.accent, background: C.accentSoft, padding: "5px 11px", borderRadius: 980 }}>
          {total} vote{total > 1 ? "s" : ""}
        </span>
      </div>

      {(s.options || []).map((o, i) => (
        <Barre key={i} label={o} votes={compte[i]} total={total} gagnant={aVote && max > 0 && compte[i] === max}
          aVote={aVote} onVote={() => onVote(s, i)} />
      ))}

      {mien && !s.closed && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: C.green, fontWeight: 600 }}>
          {Ic.check(14, C.green)} Votre vote est enregistré. Vous pouvez le changer en revotant.
        </div>
      )}
      {!mien && !s.closed && (
        <div style={{ marginTop: 12, fontSize: 12.5, color: C.dim }}>Choisissez une réponse pour voir les résultats.</div>
      )}
      {peutClore && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
          <button onClick={() => onClore(s)} style={S.btnS}>Clôturer ce sondage</button>
        </div>
      )}
    </div>
  );
}

export default function Sondages_Module({ db, appId, user }) {
  const [sondages, setSondages] = useState([]);
  const [votes, setVotes] = useState([]);
  const [erreur, setErreur] = useState("");
  const [ouvertCreation, setOuvertCreation] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!db || !appId) return;
    const unsub = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "sondages"),
      (snap) => { const all = []; snap.forEach((d) => all.push({ _id: d.id, ...d.data() })); setSondages(all); setErreur(""); },
      (e) => { console.warn("[Sondages]", e); setErreur("Les sondages ne peuvent pas être chargés pour le moment."); }
    );
    return () => unsub();
  }, [db, appId]);

  useEffect(() => {
    if (!db || !appId) return;
    const unsub = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "sondages_votes"),
      (snap) => { const all = []; snap.forEach((d) => all.push({ _id: d.id, ...d.data() })); setVotes(all); },
      (e) => console.warn("[Sondages] votes", e)
    );
    return () => unsub();
  }, [db, appId]);

  const ouverts = useMemo(() => sondages.filter((s) => !s.closed).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), [sondages]);
  const clos = useMemo(() => sondages.filter((s) => s.closed).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), [sondages]);

  const voter = async (s, choix) => {
    if (!db || !user) { setToast("Connexion requise pour voter."); return; }
    const existant = votes.find((v) => v.sondageId === s._id && v.uid === user.uid);
    try {
      if (existant) {
        await updateDoc(doc(db, "artifacts", appId, "public", "data", "sondages_votes", existant._id), { choix, updatedAt: Date.now() });
      } else {
        await addDoc(collection(db, "artifacts", appId, "public", "data", "sondages_votes"), {
          sondageId: s._id, uid: user.uid, choix, createdAt: Date.now(),
        });
      }
      setToast("Vote enregistré.");
    } catch (e) { console.error("[Sondages] vote", e); setToast("Le vote n'a pas pu être enregistré."); }
  };

  const clore = async (s) => {
    if (!db) return;
    try { await updateDoc(doc(db, "artifacts", appId, "public", "data", "sondages", s._id), { closed: true, closedAt: Date.now() }); }
    catch (e) { console.error("[Sondages] clôture", e); setToast("La clôture a échoué."); }
  };

  const publier = async () => {
    const q = question.trim();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!q) { setToast("Écrivez la question."); return; }
    if (opts.length < 2) { setToast("Il faut au moins deux réponses possibles."); return; }
    if (!db || !user) { setToast("Connexion requise."); return; }
    setBusy(true);
    try {
      await addDoc(collection(db, "artifacts", appId, "public", "data", "sondages"), {
        question: q, options: opts, closed: false,
        createdAt: Date.now(), createdByUid: user.uid || null,
        createdByName: prenom(user), createdByEmail: user.email || "",
      });
      setQuestion(""); setOptions(["", ""]); setOuvertCreation(false);
      setToast("Sondage publié.");
    } catch (e) { console.error("[Sondages] création", e); setToast("La publication a échoué."); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bgSoft, fontFamily: F.ui }}>
      <div style={{ background: C.card, borderBottom: `1px solid ${C.line}`, padding: "18px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: C.accentSoft, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>{Ic.poll(20, C.accent)}</div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.dim }}>Vie d&apos;équipe</div>
            <div style={{ fontFamily: F.serif, fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Sondages</div>
          </div>
        </div>
        <button onClick={() => setOuvertCreation((v) => !v)} style={{ ...S.btnP, display: "inline-flex", alignItems: "center", gap: 8 }}>
          {Ic.plus(15, "#fff")} {ouvertCreation ? "Annuler" : "Proposer un sondage"}
        </button>
      </div>

      <main style={{ flex: 1, overflowY: "auto", padding: "26px 40px 70px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>

          {erreur && (
            <div style={{ background: "rgba(180,83,9,.07)", borderLeft: `3px solid ${C.amber}`, padding: "13px 17px", borderRadius: 8, fontSize: 13, color: C.text, marginBottom: 20 }}>
              {erreur} Les sondages restent diffusés par e-mail en attendant.
            </div>
          )}

          {ouvertCreation && (
            <div style={{ ...S.card, marginBottom: 22 }}>
              <div style={{ fontFamily: F.serif, fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 16 }}>Nouveau sondage</div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>La question</label>
                <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Quel format préférez-vous pour la réunion du lundi ?" style={S.input} />
              </div>
              <label style={S.label}>Les réponses possibles</label>
              {options.map((o, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input value={o} onChange={(e) => setOptions((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                    placeholder={`Réponse ${i + 1}`} style={S.input} />
                  {options.length > 2 && (
                    <button onClick={() => setOptions((p) => p.filter((_, j) => j !== i))}
                      style={{ ...S.btnS, padding: "10px 14px", flexShrink: 0 }}>Retirer</button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button onClick={() => setOptions((p) => [...p, ""])} style={{ ...S.btnS, marginTop: 4 }}>Ajouter une réponse</button>
              )}
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.line}`, display: "flex", gap: 10, alignItems: "center" }}>
                <button onClick={publier} disabled={busy} style={{ ...S.btnP, opacity: busy ? 0.7 : 1, cursor: busy ? "wait" : "pointer" }}>
                  {busy ? "Publication..." : "Publier le sondage"}
                </button>
                <span style={{ fontSize: 12, color: C.dim }}>Visible par toute l&apos;équipe, un vote par personne.</span>
              </div>
            </div>
          )}

          {ouverts.length === 0 && !erreur && (
            <div style={{ ...S.card, textAlign: "center", padding: "44px 30px" }}>
              <div style={{ width: 58, height: 58, borderRadius: 16, background: C.bgSoft, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: C.accent }}>{Ic.poll(26, C.accent)}</div>
              <div style={{ fontFamily: F.serif, fontSize: 19, fontWeight: 700, color: C.text }}>Aucun sondage en cours</div>
              <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.7, maxWidth: 430, margin: "10px auto 0" }}>
                Un sujet d&apos;organisation, d&apos;outil ou d&apos;événement à trancher ? Proposez le sondage, l&apos;équipe répond, le résultat est visible par tous.
              </p>
            </div>
          )}

          {ouverts.map((s) => (
            <CarteSondage key={s._id} s={s} votes={votes.filter((v) => v.sondageId === s._id)} user={user} onVote={voter} onClore={clore} />
          ))}

          {clos.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.dim, margin: "34px 0 14px" }}>Sondages clôturés</div>
              {clos.map((s) => (
                <CarteSondage key={s._id} s={s} votes={votes.filter((v) => v.sondageId === s._id)} user={user} onVote={voter} onClore={clore} />
              ))}
            </>
          )}

          <div style={{ marginTop: 30, fontSize: 12, color: C.dim, lineHeight: 1.7 }}>
            Les votes sont nominatifs côté technique mais les résultats sont présentés de façon agrégée. Une décision contraire au résultat d&apos;un sondage doit être expliquée à l&apos;équipe.
          </div>
        </div>
      </main>

      {toast && (
        <div style={{ position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", background: C.text, color: "#fff", padding: "12px 22px", borderRadius: 980, fontSize: 13.5, fontWeight: 500, boxShadow: "0 8px 28px rgba(0,0,0,.22)", zIndex: 50 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
