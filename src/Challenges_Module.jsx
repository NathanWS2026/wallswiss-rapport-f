import React, { useState, useEffect, useMemo } from "react";
import { collection, addDoc, onSnapshot, updateDoc, doc } from "firebase/firestore";

/* ═══════════════════════════════════════════════════════════════════════════
   CHALLENGES — WallSwiss
   Un challenge annonce sa période, sa règle de comptage et sa récompense AVANT
   de démarrer. Chaque agent met à jour son score, le classement est en direct.
   Firestore : artifacts/{appId}/public/data/challenges et .../challenges_scores
   ═══════════════════════════════════════════════════════════════════════════ */

const C = {
  primary: "#692102", gold: "#A59568",
  text: "#1D1D1F", muted: "#6E6E73", dim: "#86868B",
  card: "#FFFFFF", bgSoft: "#F5F5F7",
  line: "rgba(0,0,0,0.08)", line2: "rgba(0,0,0,0.13)",
  accent: "#692102", accentSoft: "rgba(105,33,2,0.10)",
  green: "#047857", amber: "#B45309",
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
  trophy: (s = 20, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M17 5h2a2 2 0 0 1 0 4h-2M7 5H5a2 2 0 0 0 0 4h2" />
    </svg>
  ),
  plus: (s = 15, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
  ),
};

const nb = (v, d = 0) => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? d : n; };
const fmt = (n) => (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("fr-CH");
const jour = (s) => { if (!s) return ""; try { return new Date(s).toLocaleDateString("fr-CH", { day: "2-digit", month: "short" }); } catch { return s; } };
const prenom = (u) => {
  if (!u) return "Agent";
  const base = String(u.email || "").split("@")[0] || "agent";
  return base.charAt(0).toUpperCase() + base.slice(1);
};
const joursRestants = (fin) => {
  if (!fin) return null;
  const f = new Date(fin + "T23:59:59").getTime();
  if (isNaN(f)) return null;
  return Math.ceil((f - Date.now()) / 86400000);
};

function Podium({ rangs }) {
  const trois = rangs.slice(0, 3);
  if (trois.length === 0) return null;
  const meds = ["#C9A227", "#9CA3AF", "#A9713B"];
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
      {trois.map((r, i) => (
        <div key={r.uid || i} style={{ flex: "1 1 150px", minWidth: 150, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px 16px", background: i === 0 ? C.accentSoft : C.bgSoft }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: meds[i], color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nom}</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: i === 0 ? C.accent : C.text, lineHeight: 1 }}>{fmt(r.valeur)}</div>
        </div>
      ))}
    </div>
  );
}

function Classement({ rangs, unite, moiUid }) {
  if (rangs.length === 0) {
    return <div style={{ fontSize: 13.5, color: C.muted, padding: "14px 0" }}>Personne n&apos;a encore inscrit de score. Soyez le premier.</div>;
  }
  const max = Math.max(...rangs.map((r) => r.valeur), 1);
  return (
    <div>
      {rangs.map((r, i) => {
        const moi = r.uid === moiUid;
        return (
          <div key={r.uid || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 11, background: moi ? C.accentSoft : "transparent", marginBottom: 4 }}>
            <span style={{ width: 24, fontSize: 12.5, fontWeight: 700, color: C.dim, fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
            <span style={{ flex: "0 0 150px", fontSize: 13.5, fontWeight: moi ? 700 : 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nom}{moi ? " (vous)" : ""}</span>
            <span style={{ flex: 1, height: 8, background: C.bgSoft, borderRadius: 980, overflow: "hidden" }}>
              <span style={{ display: "block", width: `${Math.round((r.valeur / max) * 100)}%`, height: "100%", background: moi ? C.accent : C.gold, borderRadius: 980 }} />
            </span>
            <span style={{ flex: "0 0 92px", textAlign: "right", fontSize: 13.5, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>{fmt(r.valeur)} {unite || ""}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Challenges_Module({ db, appId, user }) {
  const [challenges, setChallenges] = useState([]);
  const [scores, setScores] = useState([]);
  const [erreur, setErreur] = useState("");
  const [creation, setCreation] = useState(false);
  const [f, setF] = useState({ titre: "", description: "", metrique: "", unite: "", objectif: "", debut: "", fin: "", recompense: "" });
  const [monScore, setMonScore] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const u = (k, v) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!db || !appId) return;
    const unsub = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "challenges"),
      (snap) => { const all = []; snap.forEach((d) => all.push({ _id: d.id, ...d.data() })); setChallenges(all); setErreur(""); },
      (e) => { console.warn("[Challenges]", e); setErreur("Les challenges ne peuvent pas être chargés pour le moment."); }
    );
    return () => unsub();
  }, [db, appId]);

  useEffect(() => {
    if (!db || !appId) return;
    const unsub = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "challenges_scores"),
      (snap) => { const all = []; snap.forEach((d) => all.push({ _id: d.id, ...d.data() })); setScores(all); },
      (e) => console.warn("[Challenges] scores", e)
    );
    return () => unsub();
  }, [db, appId]);

  const actifs = useMemo(() => challenges.filter((c) => !c.termine).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), [challenges]);
  const termines = useMemo(() => challenges.filter((c) => c.termine).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), [challenges]);
  const courant = actifs[0] || null;

  const rangsDe = (ch) => scores
    .filter((s) => s.challengeId === (ch && ch._id))
    .map((s) => ({ uid: s.uid, nom: s.nom || "Agent", valeur: nb(s.valeur) }))
    .sort((a, b) => b.valeur - a.valeur);

  const rangs = useMemo(() => (courant ? rangsDe(courant) : []), [scores, courant]); // eslint-disable-line react-hooks/exhaustive-deps
  const totalCollectif = rangs.reduce((a, r) => a + r.valeur, 0);
  const objectif = nb(courant && courant.objectif);
  const pct = objectif > 0 ? Math.min(100, Math.round((totalCollectif / objectif) * 100)) : 0;
  const restant = courant ? joursRestants(courant.fin) : null;

  useEffect(() => {
    if (!courant || !user) { setMonScore(""); return; }
    const s = scores.find((x) => x.challengeId === courant._id && x.uid === user.uid);
    setMonScore(s ? String(s.valeur) : "");
  }, [courant, scores, user]);

  const enregistrerScore = async () => {
    if (!db || !user || !courant) { setToast("Connexion requise."); return; }
    const val = nb(monScore, -1);
    if (val < 0) { setToast("Entrez un nombre valide."); return; }
    setBusy(true);
    try {
      const exist = scores.find((x) => x.challengeId === courant._id && x.uid === user.uid);
      if (exist) {
        await updateDoc(doc(db, "artifacts", appId, "public", "data", "challenges_scores", exist._id), { valeur: val, updatedAt: Date.now() });
      } else {
        await addDoc(collection(db, "artifacts", appId, "public", "data", "challenges_scores"), {
          challengeId: courant._id, uid: user.uid, nom: prenom(user), valeur: val, createdAt: Date.now(), updatedAt: Date.now(),
        });
      }
      setToast("Score mis à jour.");
    } catch (e) { console.error("[Challenges] score", e); setToast("La mise à jour a échoué."); }
    finally { setBusy(false); }
  };

  const creer = async () => {
    if (!f.titre.trim()) { setToast("Donnez un titre au challenge."); return; }
    if (!f.metrique.trim()) { setToast("Précisez ce qui est compté."); return; }
    if (!db || !user) { setToast("Connexion requise."); return; }
    setBusy(true);
    try {
      await addDoc(collection(db, "artifacts", appId, "public", "data", "challenges"), {
        ...f, titre: f.titre.trim(), termine: false,
        createdAt: Date.now(), createdByUid: user.uid || null, createdByName: prenom(user),
      });
      setF({ titre: "", description: "", metrique: "", unite: "", objectif: "", debut: "", fin: "", recompense: "" });
      setCreation(false); setToast("Challenge lancé.");
    } catch (e) { console.error("[Challenges] création", e); setToast("La création a échoué."); }
    finally { setBusy(false); }
  };

  const cloturer = async (ch) => {
    if (!db) return;
    try { await updateDoc(doc(db, "artifacts", appId, "public", "data", "challenges", ch._id), { termine: true, termineAt: Date.now() }); }
    catch (e) { console.error("[Challenges] clôture", e); setToast("La clôture a échoué."); }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const kpi = (titre, valeur, sub) => (
    <div style={{ flex: "1 1 140px", minWidth: 140, border: `1px solid ${C.line}`, borderRadius: 14, padding: "13px 16px", background: C.bgSoft }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: C.dim, marginBottom: 6 }}>{titre}</div>
      <div style={{ fontSize: 19, fontWeight: 800, color: C.text, lineHeight: 1.1 }}>{valeur}</div>
      {sub && <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bgSoft, fontFamily: F.ui }}>
      <div style={{ background: C.card, borderBottom: `1px solid ${C.line}`, padding: "18px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: C.accentSoft, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>{Ic.trophy(20, C.accent)}</div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.dim }}>Mon espace</div>
            <div style={{ fontFamily: F.serif, fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Challenges en cours</div>
          </div>
        </div>
        <button onClick={() => setCreation((v) => !v)} style={{ ...S.btnP, display: "inline-flex", alignItems: "center", gap: 8 }}>
          {Ic.plus(15, "#fff")} {creation ? "Annuler" : "Lancer un challenge"}
        </button>
      </div>

      <main style={{ flex: 1, overflowY: "auto", padding: "26px 40px 70px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          {erreur && (
            <div style={{ background: "rgba(180,83,9,.07)", borderLeft: `3px solid ${C.amber}`, padding: "13px 17px", borderRadius: 8, fontSize: 13, color: C.text, marginBottom: 20 }}>{erreur}</div>
          )}

          {creation && (
            <div style={{ ...S.card, marginBottom: 22 }}>
              <div style={{ fontFamily: F.serif, fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 16 }}>Nouveau challenge</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={S.label}>Titre</label>
                  <input value={f.titre} onChange={(e) => u("titre", e.target.value)} placeholder="Challenge rendez-vous du mois" style={S.input} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={S.label}>Règle de comptage</label>
                  <input value={f.metrique} onChange={(e) => u("metrique", e.target.value)} placeholder="Rendez-vous R1 tenus, hors annulations" style={S.input} />
                </div>
                <div><label style={S.label}>Unité</label><input value={f.unite} onChange={(e) => u("unite", e.target.value)} placeholder="RDV" style={S.input} /></div>
                <div><label style={S.label}>Objectif collectif</label><input value={f.objectif} onChange={(e) => u("objectif", e.target.value)} placeholder="60" style={S.input} /></div>
                <div><label style={S.label}>Début</label><input type="date" value={f.debut} onChange={(e) => u("debut", e.target.value)} style={S.input} /></div>
                <div><label style={S.label}>Fin</label><input type="date" value={f.fin} onChange={(e) => u("fin", e.target.value)} style={S.input} /></div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={S.label}>Récompense</label>
                  <input value={f.recompense} onChange={(e) => u("recompense", e.target.value)} placeholder="Annoncée avant le départ, jamais décidée après coup" style={S.input} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={S.label}>Précisions</label>
                  <input value={f.description} onChange={(e) => u("description", e.target.value)} placeholder="Ce qui compte, ce qui ne compte pas" style={S.input} />
                </div>
              </div>
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
                <button onClick={creer} disabled={busy} style={{ ...S.btnP, opacity: busy ? 0.7 : 1, cursor: busy ? "wait" : "pointer" }}>{busy ? "Création..." : "Lancer le challenge"}</button>
              </div>
            </div>
          )}

          {!courant && !erreur && (
            <div style={{ ...S.card, textAlign: "center", padding: "44px 30px" }}>
              <div style={{ width: 58, height: 58, borderRadius: 16, background: C.bgSoft, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: C.accent }}>{Ic.trophy(26, C.accent)}</div>
              <div style={{ fontFamily: F.serif, fontSize: 19, fontWeight: 700, color: C.text }}>Aucun challenge en cours</div>
              <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.7, maxWidth: 460, margin: "10px auto 0" }}>
                Un challenge annonce sa période, sa règle de comptage et sa récompense avant de démarrer. Lancez-en un et l&apos;équipe suit son classement en direct.
              </p>
            </div>
          )}

          {courant && (
            <div style={{ ...S.card, marginBottom: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: F.serif, fontSize: 22, fontWeight: 700, color: C.text }}>{courant.titre}</div>
                  {courant.metrique && <div style={{ fontSize: 13.5, color: C.muted, marginTop: 5 }}>On compte : {courant.metrique}</div>}
                  {courant.description && <div style={{ fontSize: 12.5, color: C.dim, marginTop: 4 }}>{courant.description}</div>}
                </div>
                {restant !== null && (
                  <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: restant < 0 ? C.amber : C.accent, background: restant < 0 ? "rgba(180,83,9,.09)" : C.accentSoft, padding: "6px 13px", borderRadius: 980 }}>
                    {restant < 0 ? "Terminé" : restant === 0 ? "Dernier jour" : `${restant} jours restants`}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                {kpi("Période", `${jour(courant.debut) || "?"} → ${jour(courant.fin) || "?"}`, null)}
                {kpi("Total équipe", `${fmt(totalCollectif)} ${courant.unite || ""}`, `${rangs.length} participant${rangs.length > 1 ? "s" : ""}`)}
                {objectif > 0 && kpi("Objectif", `${fmt(objectif)} ${courant.unite || ""}`, `${pct} % atteint`)}
                {courant.recompense && kpi("Récompense", courant.recompense, null)}
              </div>

              {objectif > 0 && (
                <div style={{ marginBottom: 22 }}>
                  <div style={{ height: 11, background: C.bgSoft, borderRadius: 980, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? C.green : C.accent, borderRadius: 980, transition: "width .4s ease" }} />
                  </div>
                </div>
              )}

              <Podium rangs={rangs} />
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.dim, margin: "6px 0 10px" }}>Classement</div>
              <Classement rangs={rangs} unite={courant.unite} moiUid={user && user.uid} />

              <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${C.line}`, display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: "0 1 200px" }}>
                  <label style={S.label}>Mon score {courant.unite ? `(${courant.unite})` : ""}</label>
                  <input value={monScore} onChange={(e) => setMonScore(e.target.value)} placeholder="0" style={S.input} />
                </div>
                <button onClick={enregistrerScore} disabled={busy} style={{ ...S.btnP, opacity: busy ? 0.7 : 1, cursor: busy ? "wait" : "pointer" }}>Mettre à jour</button>
                {user && courant.createdByUid === user.uid && (
                  <button onClick={() => cloturer(courant)} style={S.btnS}>Clôturer le challenge</button>
                )}
              </div>
            </div>
          )}

          {actifs.length > 1 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.dim, margin: "30px 0 12px" }}>Autres challenges ouverts</div>
              {actifs.slice(1).map((ch) => {
                const r = rangsDe(ch);
                return (
                  <div key={ch._id} style={{ ...S.card, marginBottom: 14, padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{ch.titre}</div>
                      <div style={{ fontSize: 12.5, color: C.muted }}>{r.length} participant{r.length > 1 ? "s" : ""} · {jour(ch.debut)} → {jour(ch.fin)}</div>
                    </div>
                    {r[0] && <div style={{ fontSize: 12.5, color: C.accent, fontWeight: 600, marginTop: 6 }}>En tête : {r[0].nom} ({fmt(r[0].valeur)} {ch.unite || ""})</div>}
                  </div>
                );
              })}
            </>
          )}

          {termines.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.dim, margin: "34px 0 12px" }}>Palmarès</div>
              {termines.map((ch) => {
                const r = rangsDe(ch);
                return (
                  <div key={ch._id} style={{ ...S.card, marginBottom: 14, padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: r.length ? 10 : 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{ch.titre}</div>
                      <div style={{ fontSize: 12.5, color: C.dim }}>{jour(ch.debut)} → {jour(ch.fin)}</div>
                    </div>
                    {r.slice(0, 3).map((x, i) => (
                      <div key={x.uid || i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", color: i === 0 ? C.accent : C.muted, fontWeight: i === 0 ? 700 : 500 }}>
                        <span>{i + 1}. {x.nom}</span><span>{fmt(x.valeur)} {ch.unite || ""}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}

          <div style={{ marginTop: 30, fontSize: 12, color: C.dim, lineHeight: 1.7 }}>
            Règle du jeu : la période, la règle de comptage et la récompense sont annoncées avant le départ. Les scores déclarés sont recoupés avec Salesforce en fin de challenge.
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
