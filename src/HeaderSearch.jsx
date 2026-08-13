import React, { useState, useEffect, useRef, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   RECHERCHE GLOBALE (header) — WallSwiss
   ▸ Parcourt toute l'arborescence du sommaire + les modules de l'application.
   ▸ Raccourci clavier ⌘K / Ctrl+K, navigation ↑ ↓, Entrée pour ouvrir, Échap pour fermer.
   ▸ Props : menu (WS_MENU du hub), onNavigate(node, path, crumbs), onOpenHub(id), onHome()
   ═══════════════════════════════════════════════════════════════════════════ */

const C = {
  card: "#FFFFFF", bgSoft: "#F5F5F7",
  text: "#1D1D1F", muted: "#6E6E73", dim: "#86868B",
  line: "rgba(0,0,0,0.08)", line2: "rgba(0,0,0,0.13)",
  accent: "#692102", accentDark: "#4D1801", accentSoft: "rgba(105,33,2,0.10)",
};
const F = {
  ui: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  mono: "'SF Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
};

/* Emoji contextuel (même logique que les cartes du sommaire) */
const EMOJI_MAP = [
  [/cong[eé]|vacance/i, "🌴"], [/fiscal|imp[oô]t|d[eé]claration|taxe/i, "🧾"],
  [/rapport|reporting/i, "📊"], [/libre[ -]?passage|\blpp\b|2e?\s*pilier|mandat/i, "🏛️"],
  [/pr[eé]voyance|3e?\s*pilier|\bpilier\b/i, "🛡️"], [/retraite/i, "🧓"], [/assurance/i, "📜"],
  [/banque|swissquote|zweiplus|compte[- ]?titre|\btitres?\b|sarasin|pictet|lombard/i, "🏦"],
  [/investiss|private equity|\bscpi\b|bourse|march[eé]/i, "📈"],
  [/crm|salesforce|annuaire|contact/i, "📇"], [/\bmails?\b|e-?mail|courriel/i, "✉️"],
  [/protocole|souscription/i, "📋"], [/document|administratif|base documentaire/i, "📁"],
  [/formation|cours|acad[eé]mie|connaissance|\bkyc\b|compliance|\biaf\b|\bafa\b/i, "🎓"],
  [/marketing|campagne|\blead|publicit|publication/i, "📣"], [/linkedin/i, "💼"], [/whatsapp/i, "💬"],
  [/r[eé]seaux|banni[eè]re|social/i, "🌐"], [/logo|charte|graphique/i, "🎨"],
  [/incident|cyber|signaler|conflit|sensible/i, "⚠️"], [/\brh\b|absence|maladie/i, "🧑‍💼"],
  [/agenda|calendly|calendrier/i, "📅"], [/facture/i, "💳"],
  [/simulateur|calcul|int[eé]r[êe]ts|commission|quasi|\btou\b|\bqr\b/i, "🧮"],
  [/id[eé]e/i, "💡"], [/challenge|d[eé]fi|concours/i, "🏆"], [/[eé]v[eé]nement|sondage|photo/i, "🎉"],
  [/r[eè]gles|proc[eé]dure/i, "📋"], [/outils?|tracker|analyse/i, "🛠️"], [/reprise|gestion/i, "🔄"],
  [/d[eé]but|onboarding/i, "👋"], [/entreprise|cr[eé]ation/i, "🏢"],
  [/lettre|en-t[êe]te|recommandation/i, "📝"], [/service|pr[eé]sentation/i, "🗂️"],
  [/param[eè]tre|r[eé]glage|int[eé]gration/i, "⚙️"],
];
function emojiFor(node) {
  const t = String((node && node.title) || "") + " " + String((node && node.num) || "");
  for (const pair of EMOJI_MAP) { if (pair[0].test(t)) return pair[1]; }
  if (node && node.action && node.action.type === "module") return "🚀";
  if (node && node.action && node.action.type === "url") return "🔗";
  if (node && node.children && node.children.length) return "📂";
  return "📄";
}

const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function flatten(nodes, trail, depth, out) {
  for (const n of nodes || []) {
    out.push({
      key: "n:" + n.id, id: n.id, num: n.num, title: n.title, node: n, depth,
      path: [...trail.map((t) => t.title), n.title],
      crumbs: trail.map((t) => ({ id: t.id, title: t.title })),
      isParent: !!(n.children && n.children.length),
      emoji: emojiFor(n),
    });
    if (n.children) flatten(n.children, [...trail, n], depth + 1, out);
  }
  return out;
}

export default function HeaderSearch({ menu, onNavigate, onOpenHub, onHome }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");

  const items = useMemo(() => {
    const list = flatten(menu || [], [], 0, []);
    const extras = [
      { key: "x:home", id: "__home", title: "Accueil — sommaire orbital", path: ["Accueil"], crumbs: [], depth: 0, emoji: "✦", home: true },
      { key: "x:settings", id: "__settings", title: "Paramètres & Intégrations", path: ["Configuration"], crumbs: [], depth: 0, emoji: "⚙️", node: { title: "Paramètres & Intégrations", action: { type: "module", module: "settings" } } },
      { key: "x:tickets", id: "__tickets", title: "Mes demandes (congés, frais, matériel)", path: ["Espace personnel"], crumbs: [], depth: 0, emoji: "📝", node: { title: "Mes demandes", action: { type: "module", module: "tickets" } } },
    ];
    return [...list, ...extras];
  }, [menu]);

  const results = useMemo(() => {
    const ql = norm(q).trim();
    if (!ql) return items.filter((i) => i.depth === 0 && !i.home).slice(0, 9);
    const terms = ql.split(/\s+/).filter(Boolean);
    const scored = [];
    for (const it of items) {
      const t = norm(it.title);
      const p = norm(it.path.join(" "));
      const n = String(it.num || "");
      let ok = true, score = 0;
      for (const term of terms) {
        if (t.startsWith(term)) score += 100;
        else if (n.startsWith(term)) score += 90;
        else if (t.includes(term)) score += 55;
        else if (p.includes(term)) score += 22;
        else { ok = false; break; }
      }
      if (!ok) continue;
      if (it.node && it.node.action) score += 14;
      score -= it.depth * 4;
      scored.push({ it, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 14).map((s) => s.it);
  }, [q, items]);

  useEffect(() => { setIdx(0); }, [q, open]);

  /* Raccourci global ⌘K / Ctrl+K */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        if (inputRef.current) inputRef.current.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* Clic à l'extérieur */
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const choose = (it) => {
    if (!it) return;
    setOpen(false); setQ("");
    if (inputRef.current) inputRef.current.blur();
    if (it.home) { onHome && onHome(); return; }
    const hasAction = it.node && it.node.action;
    if (!hasAction && it.isParent && onOpenHub) { onOpenHub(it.id); return; }
    onNavigate && onNavigate(it.node, it.path, it.crumbs);
  };

  const onInputKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setIdx((i) => Math.min(results.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); choose(results[idx]); }
    else if (e.key === "Escape") { e.preventDefault(); setOpen(false); if (inputRef.current) inputRef.current.blur(); }
  };

  return (
    <div ref={boxRef} style={{ position: "relative", flex: 1, maxWidth: 460, margin: "0 auto", fontFamily: F.ui }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span style={{ position: "absolute", left: 13, display: "flex", color: open ? C.accent : C.dim, pointerEvents: "none", transition: "color .15s" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </span>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onInputKey}
          placeholder="Rechercher une section, un outil, une procédure…"
          style={{
            width: "100%", boxSizing: "border-box", padding: "8px 62px 8px 36px", borderRadius: 980,
            border: `1px solid ${open ? C.accent : C.line2}`, background: open ? "#fff" : C.bgSoft,
            font: `500 13px ${F.ui}`, color: C.text, outline: "none",
            boxShadow: open ? "0 4px 16px rgba(105,33,2,.10)" : "none", transition: "all .15s",
          }}
        />
        {q ? (
          <button onClick={() => { setQ(""); if (inputRef.current) inputRef.current.focus(); }} title="Effacer"
            style={{ position: "absolute", right: 10, width: 20, height: 20, borderRadius: 980, border: "none", background: C.line, color: C.muted, cursor: "pointer", font: `700 11px ${F.ui}`, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>×</button>
        ) : (
          <span style={{ position: "absolute", right: 11, font: `600 10.5px ${F.mono}`, color: C.dim, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 6, padding: "2px 6px", pointerEvents: "none" }}>{isMac ? "⌘K" : "Ctrl K"}</span>
        )}
      </div>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, boxShadow: "0 18px 50px rgba(0,0,0,.16)", overflow: "hidden", zIndex: 400 }}>
          <div style={{ padding: "9px 15px", borderBottom: `1px solid ${C.line}`, font: `700 10px ${F.ui}`, letterSpacing: ".08em", textTransform: "uppercase", color: C.dim, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{q.trim() ? `${results.length} résultat${results.length > 1 ? "s" : ""}` : "Sections principales"}</span>
            <span style={{ fontSize: 9.5, letterSpacing: ".04em", textTransform: "none", fontWeight: 600 }}>↑ ↓ naviguer · ↵ ouvrir · esc fermer</span>
          </div>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {results.length === 0 && (
              <div style={{ padding: "26px 16px", textAlign: "center", color: C.dim, font: `500 13px ${F.ui}` }}>Aucun résultat pour « {q} »</div>
            )}
            {results.map((it, i) => {
              const on = i === idx;
              const isModule = it.node && it.node.action && it.node.action.type === "module";
              const isUrl = it.node && it.node.action && it.node.action.type === "url";
              const trail = it.path.slice(0, -1).join(" › ");
              return (
                <div key={it.key} onMouseEnter={() => setIdx(i)} onClick={() => choose(it)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 15px", cursor: "pointer", background: on ? C.accentSoft : "transparent", borderLeft: `3px solid ${on ? C.accent : "transparent"}` }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, background: on ? "#fff" : C.bgSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{it.emoji}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", font: `600 13px ${F.ui}`, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {it.num ? <span style={{ color: C.accent, fontWeight: 700, marginRight: 6, fontFamily: F.mono, fontSize: 11 }}>{it.num}</span> : null}
                      {it.title}
                    </span>
                    {trail && <span style={{ display: "block", font: `500 11px ${F.ui}`, color: C.dim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{trail}</span>}
                  </span>
                  {isModule && <span style={{ flexShrink: 0, font: `800 8.5px ${F.ui}`, letterSpacing: ".06em", textTransform: "uppercase", color: "#fff", background: C.accent, padding: "2px 6px", borderRadius: 980 }}>App</span>}
                  {isUrl && <span style={{ flexShrink: 0, color: C.dim, fontSize: 12 }}>↗</span>}
                  {!isModule && !isUrl && it.isParent && <span style={{ flexShrink: 0, font: `600 10.5px ${F.ui}`, color: C.dim }}>{it.node.children.length} sous-menus</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
