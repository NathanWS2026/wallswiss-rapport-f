import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithCustomToken, signInAnonymously, signOut, setPersistence, browserLocalPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, updateDoc, onSnapshot, addDoc, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
// Module Planification Retraite R1

import RetraiteR1Module from "./RetraiteR1Module";
import { genererSFF5Bytes, combinerPDFs, telechargerPDF, bytesToBlobUrl } from "./FormulaireLPP";
/* ═══════════════════════════════════════════════════════════════════════════
   NAVIGATION ORBITALE + BANDEAUX LIVE — fusionné ici (ex-fichier WallSwissNav).
   Portée isolée : les C/F/Icons/WS_MENU internes n'affectent PAS ceux de l'app.
   ▸ Bourse temps réel : renseignez twelveDataKey dans MARKET_CONFIG (plus bas dans ce bloc).
   ▸ Actus : NEWS_CONFIG.rssFeed / gnewsKey (plus bas dans ce bloc).
   ═══════════════════════════════════════════════════════════════════════════ */
const { LiveDataBars, HubSommaire } = (() => {
/* ── Tokens (copie de la charte coquille « Aurora ») ── */
const C = {
  white: "#FFFFFF", black: "#1A1A1A", gray: "#6B7280",
  bg: "#FFFFFF", bgSoft: "#F5F5F7", card: "#FFFFFF", cardSoft: "#F5F5F7",
  text: "#1D1D1F", muted: "#6E6E73", dim: "#86868B",
  line: "rgba(0,0,0,0.08)", line2: "rgba(0,0,0,0.13)",
  accent: "#692102", accentDark: "#4D1801", accentSoft: "rgba(105,33,2,0.10)",
  gold: "#A59568",
  green: "#0F9D58", red: "#D93025",
  gBlue: "#692102", gGreen: "#34A853", gRed: "#EA4335",
};
const F = {
  ui: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  serif: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif",
  mono: "'SF Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
};

/* ── Icônes nécessaires aux 7 sections ── */
const Icons = {
  Layers: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  User: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  CheckSquare: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  FileText: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>,
  PieChart: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>,
  BookContacts: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path><path d="M8 7h6"></path><path d="M8 11h8"></path></svg>,
  Target: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
};

/* ── Arborescence du sommaire (avec Marketing & Recherche LPP accessibles) ── */
const WS_MENU = [
  { id: "1", num: "1", title: "Logiciels WallSwiss", icon: "Layers", children: [
    { id: "1.1", num: "1.1", title: "CRM – Salesforce", action: { type: "url", url: "https://wallswiss.my.salesforce.com/" } },
    { id: "1.2", num: "1.2", title: "Générateur de rapport financier", action: { type: "module", module: "rapport" } },
    { id: "1.3", num: "1.3", title: "Générateur de planification retraite", action: { type: "module", module: "retraiteR1" } },
    { id: "1.4", num: "1.4", title: "Mon agenda – Calendly" },
    { id: "1.5", num: "1.5", title: "Simulateur Quasi-Résident / TOU" },
    { id: "1.6", num: "1.6", title: "Simulateur d'intérêts composés" },
    { id: "1.7", num: "1.7", title: "Générateur de factures" },
    { id: "1.9", num: "1.9", title: "Recherche & Mandats LPP", action: { type: "module", module: "rechercheLpp" } },
    { id: "1.10", num: "1.10", title: "Tous mes logiciels & accès" },
    { id: "1.8", num: "1.8", title: "Signaler un incident", children: [
      { id: "1.8.1", num: "1.8.1", title: "Cyber-incident" },
      { id: "1.8.2", num: "1.8.2", title: "Conflits d'intérêts" },
      { id: "1.8.3", num: "1.8.3", title: "Événements sensibles" },
      { id: "1.8.4", num: "1.8.4", title: "Problème RH" },
    ]},
  ]},
  { id: "2", num: "2", title: "Mon espace personnel", icon: "User", children: [
    { id: "2.1", num: "2.1", title: "Mes outils d'auto-analyse – Trackers" },
    { id: "2.2", num: "2.2", title: "Mon simulateur de commissions" },
    { id: "2.3", num: "2.3", title: "Mes demandes (congés, frais, matériel…)", action: { type: "module", module: "tickets" } },
    { id: "2.4", num: "2.4", title: "Les règles en entreprise" },
    { id: "2.5", num: "2.5", title: "Événements", children: [
      { id: "2.5.1", num: "2.5.1", title: "Sondages" },
      { id: "2.5.2", num: "2.5.2", title: "Photos : événements WallSwiss" },
    ]},
    { id: "2.6", num: "2.6", title: "Boîte à idées : ensemble, nous allons plus loin !", action: { type: "module", module: "idees" } },
    { id: "2.7", num: "2.7", title: "Challenges en cours" },
    { id: "2.8", num: "2.8", title: "Mes débuts chez WallSwiss" },
  ]},
  { id: "3", num: "3", title: "Procédures", icon: "CheckSquare", children: [
    { id: "3.1", num: "3.1", title: "Reprise de gestion" },
    { id: "3.2", num: "3.2", title: "Investissements", children: [
      { id: "3.2.1", num: "3.2.1", title: "Compte-titres" },
      { id: "3.2.2", num: "3.2.2", title: "Private Equity" },
      { id: "3.2.3", num: "3.2.3", title: "Assurance vie France" },
      { id: "3.2.4", num: "3.2.4", title: "Assurance vie Luxembourg" },
      { id: "3.2.5", num: "3.2.5", title: "Plan d'Épargne Retraite – PER" },
    ]},
    { id: "3.3", num: "3.3", title: "Planification retraite", children: [
      { id: "3.3.1", num: "3.3.1", title: "Formule BASIC" },
      { id: "3.3.2", num: "3.3.2", title: "Formule COUPLE" },
      { id: "3.3.3", num: "3.3.3", title: "Formule PREMIUM" },
    ]},
    { id: "3.4", num: "3.4", title: "Prévoyance individuelle", children: [
      { id: "3.4.1", num: "3.4.1", title: "Liechtenstein Life" },
      { id: "3.4.2", num: "3.4.2", title: "Rente Genevoise" },
      { id: "3.4.3", num: "3.4.3", title: "Autres compagnies" },
    ]},
    { id: "3.5", num: "3.5", title: "Banques", children: [
      { id: "3.5.1", num: "3.5.1", title: "Swissquote" },
      { id: "3.5.2", num: "3.5.2", title: "Bank Zweiplus" },
      { id: "3.5.3", num: "3.5.3", title: "Autres banques partenaires" },
    ]},
    { id: "3.6", num: "3.6", title: "Libre passage", children: [
      { id: "3.6.1", num: "3.6.1", title: "Lémania" },
      { id: "3.6.2", num: "3.6.2", title: "Liberty" },
      { id: "3.6.3", num: "3.6.3", title: "Pictet" },
      { id: "3.6.4", num: "3.6.4", title: "J. Safra Sarasin" },
    ]},
    { id: "3.7", num: "3.7", title: "Fiscalité", children: [
      { id: "3.7.1", num: "3.7.1", title: "Fiscalité française", children: [
        { id: "3.7.1.1", num: "3.7.1.1", title: "Check-list + mail" },
        { id: "3.7.1.2", num: "3.7.1.2", title: "Protocole déclaration simple" },
        { id: "3.7.1.3", num: "3.7.1.3", title: "Protocole déclaration + LMNP" },
      ]},
      { id: "3.7.2", num: "3.7.2", title: "Fiscalité suisse", children: [
        { id: "3.7.2.1", num: "3.7.2.1", title: "Résident – TOU" },
        { id: "3.7.2.2", num: "3.7.2.2", title: "Frontalier – QR" },
      ]},
    ]},
    { id: "3.8", num: "3.8", title: "Taxe annuelle FINMA (AFA)" },
  ]},
  { id: "4", num: "4", title: "Base documentaire", icon: "FileText", children: [
    { id: "4.1", num: "4.1", title: "Mails types", action: { type: "module", module: "mails" } },
    { id: "4.2", num: "4.2", title: "Documents administratifs", action: { type: "module", module: "ressources" } },
  ]},
  { id: "5", num: "5", title: "Académie WallSwiss – Base de connaissances", icon: "PieChart", children: [
    { id: "5.1", num: "5.1", title: "Cours AFA / IAF" },
    { id: "5.2", num: "5.2", title: "Formation commerciale", children: [
      { id: "5.2.1", num: "5.2.1", title: "Bibliothèque de formation (ebooks & PDF)", action: { type: "module", module: "academie" } },
      { id: "5.2.2", num: "5.2.2", title: "Mon E-book WallSwiss", action: { type: "module", module: "academie", doc: "mon-ebook" } },
      { id: "5.2.3", num: "5.2.3", title: "Entretien commercial & plan de conseil", action: { type: "module", module: "academie", doc: "fondamentaux" } },
      { id: "5.2.4", num: "5.2.4", title: "Objections (cold call & 42 objections)", action: { type: "module", module: "academie", doc: "42-objections" } },
      { id: "5.2.5", num: "5.2.5", title: "Vidéos de formation" },
    ]},
    { id: "5.3", num: "5.3", title: "France – PER" },
    { id: "5.4", num: "5.4", title: "France – Assurance vie" },
    { id: "5.5", num: "5.5", title: "Europe – Assurance vie Luxembourg" },
    { id: "5.6", num: "5.6", title: "France – SCPI" },
    { id: "5.7", num: "5.7", title: "Suisse – Libre passage" },
    { id: "5.8", num: "5.8", title: "Suisse – Prévoyance individuelle" },
    { id: "5.9", num: "5.9", title: "Suisse – Création d'entreprise" },
    { id: "5.10", num: "5.10", title: "France – Création d'entreprise" },
    { id: "5.11", num: "5.11", title: "Suisse – AVS (1er pilier)" },
    { id: "5.12", num: "5.12", title: "France – Calcul de la retraite française" },
    { id: "5.13", num: "5.13", title: "Utilisation de la calculette financière", action: { type: "module", module: "academie", doc: "notice-calc" } },
    { id: "5.14", num: "5.14", title: "Formation investissement" },
    { id: "5.15", num: "5.15", title: "Formation KYC" },
    { id: "5.16", num: "5.16", title: "Formation Compliance" },
    { id: "5.17", num: "5.17", title: "Intermédiaire non lié – Guide des obligations" },
  ]},
  { id: "6", num: "6", title: "Annuaires", icon: "BookContacts", action: { type: "module", module: "annuaire" } },
  { id: "7", num: "7", title: "Hub Marketing", icon: "Target", children: [
    { id: "7.0", num: "7.0", title: "Hub Campagnes & Scripts (Leads)", action: { type: "module", module: "marketing" } },
    { id: "7.1", num: "7.1", title: "Charte graphique + logo" },
    { id: "7.2", num: "7.2", title: "Carnet de recommandation" },
    { id: "7.3", num: "7.3", title: "Lettre à en-tête WallSwiss" },
    { id: "7.4", num: "7.4", title: "Bannières réseaux sociaux" },
    { id: "7.5", num: "7.5", title: "Organisation de mon WhatsApp Business" },
    { id: "7.6", num: "7.6", title: "Présentation des services" },
    { id: "7.7", num: "7.7", title: "Organisation LinkedIn Business" },
    { id: "7.8", num: "7.8", title: "Des publications pour mes réseaux" },
    { id: "7.9", num: "7.9", title: "Distribution des leads & statuts" },
  ]},
];

/* ════════════════ DONNÉES LIVE — CONFIG ════════════════ */
// Clé Twelve Data (gratuite, twelvedata.com) → indices + or EN DIRECT.
// Sans clé : EUR/CHF, USD/CHF (Frankfurter) et Bitcoin (CoinGecko) sont live ;
// SMI / S&P 500 / Nasdaq / Euro Stoxx 50 / Or = démo « ≈ » (léger mouvement).
const MARKET_CONFIG = { twelveDataKey: "" };
// Clé GNews (gratuite, gnews.io) → actus Suisse business en direct.
// Sans clé : flux RSS suisse via rss2json (remplaçable).
const NEWS_CONFIG = { gnewsKey: "", rssFeed: "https://www.allnews.ch/rss.xml" };

const WS_INSTRUMENTS = [
  { key: "SMI",    label: "SMI",           type: "index",  td: "SMI",      base: 12050 },
  { key: "SPX",    label: "S&P 500",       type: "index",  td: "SPX",      base: 5820  },
  { key: "IXIC",   label: "Nasdaq",        type: "index",  td: "IXIC",     base: 19150 },
  { key: "SX5E",   label: "Euro Stoxx 50", type: "index",  td: "STOXX50E", base: 5010  },
  { key: "EURCHF", label: "EUR/CHF",       type: "fx",     from: "EUR",    base: 0.935, dp: 4 },
  { key: "USDCHF", label: "USD/CHF",       type: "fx",     from: "USD",    base: 0.885, dp: 4 },
  { key: "XAU",    label: "Or (XAU/USD)",  type: "metal",  td: "XAU/USD",  base: 2410  },
  { key: "BTC",    label: "Bitcoin",       type: "crypto", cg: "bitcoin",  base: 65000 },
];
const WS_NEWS_FALLBACK = [
  { src: "BNS",         title: "La BNS maintient son taux directeur et surveille le franc fort" },
  { src: "Bourse",      title: "Le SMI ouvre en légère hausse, tiré par le luxe et la pharma" },
  { src: "Éco",         title: "Horlogerie suisse : les exportations repartent vers l'Asie" },
  { src: "Frontaliers", title: "Genève : nouveau record d'emplois frontaliers au 2e trimestre" },
  { src: "Immobilier",  title: "Taux hypothécaires : stabilisation attendue d'ici la fin d'année" },
  { src: "Marché",      title: "L'or reste recherché comme valeur refuge face à l'incertitude" },
];
const wsFmtNum = (v, dp) => Number(v).toLocaleString("fr-CH", { minimumFractionDigits: dp ?? (v < 100 ? 2 : 0), maximumFractionDigits: dp ?? (v < 100 ? 2 : 0) });

async function wsFetchMarket() {
  const out = {};
  WS_INSTRUMENTS.forEach((i) => (out[i.key] = { value: i.base, change: 0, demo: true }));
  if (MARKET_CONFIG.twelveDataKey) {
    try {
      const syms = WS_INSTRUMENTS.filter((i) => i.td).map((i) => i.td).join(",");
      const r = await fetch(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(syms)}&apikey=${MARKET_CONFIG.twelveDataKey}`);
      const j = await r.json();
      WS_INSTRUMENTS.filter((i) => i.td).forEach((i) => {
        const q = j[i.td] || (WS_INSTRUMENTS.filter((x) => x.td).length === 1 ? j : null);
        if (q && q.close) out[i.key] = { value: parseFloat(q.close), change: parseFloat(q.percent_change) || 0, demo: false };
      });
    } catch (e) {}
  }
  await Promise.all(WS_INSTRUMENTS.filter((i) => i.type === "fx").map(async (i) => {
    try {
      const f = (d) => d.toISOString().slice(0, 10);
      const end = new Date(), start = new Date(Date.now() - 6 * 864e5);
      const r = await fetch(`https://api.frankfurter.app/${f(start)}..${f(end)}?from=${i.from}&to=CHF`);
      const j = await r.json();
      const dates = Object.keys(j.rates || {}).sort();
      if (dates.length) {
        const last = j.rates[dates[dates.length - 1]].CHF;
        const prev = dates.length > 1 ? j.rates[dates[dates.length - 2]].CHF : last;
        out[i.key] = { value: last, change: prev ? ((last - prev) / prev) * 100 : 0, demo: false };
      }
    } catch (e) {}
  }));
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true");
    const j = await r.json();
    if (j.bitcoin) out.BTC = { value: j.bitcoin.usd, change: j.bitcoin.usd_24h_change || 0, demo: false };
  } catch (e) {}
  WS_INSTRUMENTS.forEach((i) => {
    if (out[i.key].demo) {
      const v = out[i.key].value * (1 + (Math.random() - 0.5) * 0.0018);
      out[i.key] = { value: v, change: ((v - i.base) / i.base) * 100, demo: true };
    }
  });
  return out;
}
async function wsFetchNews() {
  try {
    if (NEWS_CONFIG.gnewsKey) {
      const r = await fetch(`https://gnews.io/api/v4/top-headlines?category=business&country=ch&lang=fr&max=12&apikey=${NEWS_CONFIG.gnewsKey}`);
      const j = await r.json();
      const items = (j.articles || []).map((a) => ({ src: (a.source && a.source.name) || "News", title: a.title, url: a.url, ts: a.publishedAt }));
      if (items.length) return items;
    } else {
      const r = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(NEWS_CONFIG.rssFeed));
      const j = await r.json();
      const items = (j.items || []).map((a) => ({ src: (j.feed && j.feed.title) || "Éco", title: a.title, url: a.link, ts: a.pubDate }));
      if (items.length) return items;
    }
  } catch (e) {}
  return WS_NEWS_FALLBACK;
}

function useWsTickerStyles() {
  useEffect(() => {
    if (typeof document === "undefined" || document.getElementById("ws-ticker-style")) return;
    const s = document.createElement("style");
    s.id = "ws-ticker-style";
    s.textContent = `
      @keyframes wsScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      .ws-tk-vp { position:relative; flex:1; overflow:hidden;
        -webkit-mask-image:linear-gradient(90deg,transparent,#000 32px,#000 calc(100% - 32px),transparent);
                mask-image:linear-gradient(90deg,transparent,#000 32px,#000 calc(100% - 32px),transparent); }
      .ws-tk-track { display:inline-flex; align-items:center; height:100%; white-space:nowrap; will-change:transform; }
      .ws-tk-track.market { animation: wsScroll 46s linear infinite; }
      .ws-tk-track.news   { animation: wsScroll 60s linear infinite; }
      .ws-tk-vp:hover .ws-tk-track { animation-play-state: paused; }
    `;
    document.head.appendChild(s);
  }, []);
}

function MarketTicker() {
  useWsTickerStyles();
  const [quotes, setQuotes] = useState(() => { const o = {}; WS_INSTRUMENTS.forEach((i) => (o[i.key] = { value: i.base, change: 0, demo: true })); return o; });
  useEffect(() => {
    let alive = true;
    const run = () => wsFetchMarket().then((d) => alive && setQuotes(d));
    run(); const id = setInterval(run, 60000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  const strip = WS_INSTRUMENTS.map((i) => {
    const s = quotes[i.key] || { value: i.base, change: 0, demo: true };
    const up = s.change > 0.001, dn = s.change < -0.001;
    const col = up ? C.green : dn ? C.red : C.dim;
    const car = up ? "▲" : dn ? "▼" : "▬";
    const val = i.type === "crypto" ? "$" + wsFmtNum(s.value, 0) : wsFmtNum(s.value, i.dp);
    return (
      <span key={i.key} style={{ display: "inline-flex", alignItems: "baseline", gap: 8, padding: "0 20px", fontSize: 13, borderRight: `1px solid ${C.line}` }}>
        <span style={{ fontWeight: 700, color: C.text }}>{i.label}</span>
        <span style={{ fontVariantNumeric: "tabular-nums", color: C.muted, fontWeight: 600 }}>{val}</span>
        <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color: col, display: "inline-flex", alignItems: "center", gap: 3 }}>{car} {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}%</span>
        {s.demo && <span title="Donnée de démonstration — ajoutez une clé Twelve Data pour le direct" style={{ color: C.gold, fontWeight: 700, fontSize: 11, cursor: "help" }}>≈</span>}
      </span>
    );
  });
  return (
    <div style={{ display: "flex", alignItems: "stretch", height: 36, overflow: "hidden", borderBottom: `1px solid ${C.line}`, background: C.card }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0, padding: "0 16px", fontSize: 11, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", color: "#fff", background: C.accent }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#7CFFB2" }} /> Marchés
      </div>
      <div className="ws-tk-vp"><div className="ws-tk-track market">{strip}{strip}</div></div>
    </div>
  );
}

function NewsTicker() {
  useWsTickerStyles();
  const [items, setItems] = useState(WS_NEWS_FALLBACK);
  useEffect(() => {
    let alive = true;
    const run = () => wsFetchNews().then((d) => alive && setItems(d.slice(0, 14)));
    run(); const id = setInterval(run, 600000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  const timeAgo = (ts) => {
    if (!ts) return ""; const d = new Date(ts); if (isNaN(d)) return "";
    const m = Math.round((Date.now() - d) / 60000);
    if (m < 1) return "à l'instant"; if (m < 60) return m + " min";
    const h = Math.round(m / 60); if (h < 24) return h + " h"; return Math.round(h / 24) + " j";
  };
  const strip = items.map((a, k) => {
    const t = timeAgo(a.ts);
    const inner = (
      <>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.gold, flexShrink: 0 }} />
        <span style={{ color: C.accent, fontWeight: 700, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{a.src}</span>
        <span style={{ color: C.text, fontWeight: 500 }}>{a.title}</span>
        {t && <span style={{ color: C.dim, fontSize: 11 }}>· {t}</span>}
      </>
    );
    const st = { display: "inline-flex", alignItems: "center", gap: 10, padding: "0 22px", fontSize: 12.5, color: C.text, textDecoration: "none" };
    return a.url ? <a key={k} href={a.url} target="_blank" rel="noopener noreferrer" style={st}>{inner}</a> : <span key={k} style={st}>{inner}</span>;
  });
  return (
    <div style={{ display: "flex", alignItems: "stretch", height: 34, overflow: "hidden", borderBottom: `1px solid ${C.line}`, background: C.bgSoft }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0, padding: "0 16px", fontSize: 11, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", color: "#fff", background: C.accentDark }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#7CFFB2" }} /> Éco Suisse
      </div>
      <div className="ws-tk-vp"><div className="ws-tk-track news">{strip}{strip}</div></div>
    </div>
  );
}

/* Enveloppe à poser juste sous le <header> */
function LiveDataBars() {
  return (
    <div className="no-print" style={{ flexShrink: 0, zIndex: 150 }}>
      <MarketTicker />
      <NewsTicker />
    </div>
  );
}

/* ════════════════ HUB ORBITAL (7 sections → sous-menus en cartes) ════════════════ */
/* ── Emoji contextuel pour les cartes du sommaire (déduit du titre) ── */
const WS_EMOJI_MAP = [
  [/cong[eé]|vacance/i, "🌴"],
  [/fiscal|imp[oô]t|d[eé]claration|taxe/i, "🧾"],
  [/rapport|reporting/i, "📊"],
  [/libre[ -]?passage|\blpp\b|2e?\s*pilier|mandat/i, "🏛️"],
  [/pr[eé]voyance|3e?\s*pilier|\bpilier\b/i, "🛡️"],
  [/retraite/i, "🧓"],
  [/assurance/i, "📜"],
  [/banque|swissquote|zweiplus|compte[- ]?titre|\btitres?\b|sarasin|pictet|lombard/i, "🏦"],
  [/investiss|private equity|\bscpi\b|bourse|march[eé]/i, "📈"],
  [/crm|salesforce|annuaire|contact/i, "📇"],
  [/\bmails?\b|e-?mail|courriel/i, "✉️"],
  [/document|administratif|base documentaire/i, "📁"],
  [/formation|cours|acad[eé]mie|connaissance|\bkyc\b|compliance|\biaf\b|\bafa\b/i, "🎓"],
  [/marketing|campagne|\blead|publicit|publication/i, "📣"],
  [/linkedin/i, "💼"],
  [/whatsapp/i, "💬"],
  [/r[eé]seaux|banni[eè]re|social/i, "🌐"],
  [/logo|charte|graphique/i, "🎨"],
  [/incident|cyber|signaler|conflit|sensible/i, "⚠️"],
  [/\brh\b|absence|maladie/i, "🧑‍💼"],
  [/agenda|calendly|calendrier/i, "📅"],
  [/facture/i, "💳"],
  [/simulateur|calcul|int[eé]r[êe]ts|commission|quasi|\btou\b|\bqr\b/i, "🧮"],
  [/id[eé]e/i, "💡"],
  [/challenge|d[eé]fi|concours/i, "🏆"],
  [/[eé]v[eé]nement|sondage|photo/i, "🎉"],
  [/r[eè]gles|proc[eé]dure/i, "📋"],
  [/outils?|tracker|analyse/i, "🛠️"],
  [/reprise|gestion/i, "🔄"],
  [/d[eé]but|onboarding/i, "👋"],
  [/entreprise|cr[eé]ation/i, "🏢"],
  [/lettre|en-t[êe]te|recommandation/i, "📝"],
  [/service|pr[eé]sentation/i, "🗂️"],
];
function wsEmojiFor(node) {
  const t = String(node.title || "") + " " + String(node.num || "");
  for (const pair of WS_EMOJI_MAP) { if (pair[0].test(t)) return pair[1]; }
  if (node.action && node.action.type === "module") return "🚀";
  if (node.action && node.action.type === "url") return "🔗";
  if (node.children && node.children.length) return "📂";
  return "📄";
}

function wsFindChain(nodes, id, trail) {
  for (const n of (nodes || [])) {
    const t = trail.concat(n);
    if (n.id === id) return t;
    if (n.children) { const r = wsFindChain(n.children, id, t); if (r) return r; }
  }
  return null;
}
function HubSommaire({ onNavigate, onOpenModule, logoUrl, openTo }) {
  const [stack, setStack] = useState([]);
  const [tab, setTab] = useState("__all__");
  const _curId = stack.length ? stack[stack.length - 1].id : "root";
  useEffect(() => { setTab("__all__"); }, [_curId]);
  // Réouverture directe à un niveau donné (clic sur un fil d'Ariane d'une fiche).
  useEffect(() => {
    if (openTo && openTo.id) { const chain = wsFindChain(WS_MENU, openTo.id, []); if (chain && chain.length) { setStack(chain); setTab("__all__"); } }
  }, [openTo && openTo._n]);
  const goHome = () => setStack([]);
  const crumbTo = (idx) => setStack((s) => s.slice(0, idx + 1));
  const drill = (node) => setStack((s) => [...s, node]);
  const openLeaf = (node, path, crumbs) => onNavigate(node, path, crumbs || []);
  const onSat = (section) => { if (section.action) onNavigate(section, [section.title], []); else drill(section); };

  if (stack.length === 0) {
    const R = 250;
    return (
      <div style={{ flex: 1, minHeight: "calc(100vh - 60px)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", background: "radial-gradient(1100px 700px at 50% -6%, #FFFFFF, #EEF0F3)" }}>
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <div style={{ position: "relative", width: 660, height: 660, maxWidth: "92vw", maxHeight: "min(92vw, calc(100vh - 260px))" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 430, height: 430, borderRadius: "50%", border: `1px dashed ${C.line2}`, opacity: 0.6 }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 640, height: 640, borderRadius: "50%", border: `1px dashed ${C.line2}`, opacity: 0.5 }} />
            <svg viewBox="0 0 660 660" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              {WS_MENU.map((s, i) => { const a = (-90 + i * (360 / WS_MENU.length)) * Math.PI / 180; return <line key={s.id} x1={330} y1={330} x2={330 + R * Math.cos(a)} y2={330 + R * Math.sin(a)} stroke={C.line2} strokeWidth="1.4" strokeDasharray="3 5" opacity="0.5" />; })}
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 200, height: 200, borderRadius: "50%", background: "#fff", border: `1px solid ${C.line}`, boxShadow: "0 24px 60px rgba(0,0,0,0.10), inset 0 0 0 6px rgba(105,33,2,0.05)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 12 }}>
              <div style={{ width: 96, height: 96, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={logoUrl} alt="WallSwiss" style={{ width: 52, height: 52, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
              </div>
              <div style={{ position: "absolute", bottom: 26, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent }}>Sommaire</div>
            </div>
            {WS_MENU.map((s, i) => {
              const deg = -90 + i * (360 / WS_MENU.length);
              const kids = s.children ? s.children.length : 0;
              const Ico = s.icon ? Icons[s.icon] : null;
              return (
                <div key={s.id} onClick={() => onSat(s)}
                  style={{ position: "absolute", top: "50%", left: "50%", width: 132, textAlign: "center", cursor: "pointer", zIndex: 14, transform: `translate(-50%,-50%) rotate(${deg}deg) translate(${R}px) rotate(${-deg}deg)` }}
                  onMouseEnter={(e) => { const d = e.currentTarget.querySelector(".ws-disc"); if (d) { d.style.transform = "translateY(-5px) scale(1.07)"; d.style.background = C.accent; d.style.color = "#fff"; d.style.boxShadow = "0 18px 40px rgba(0,0,0,0.15)"; d.style.borderColor = C.accent; } }}
                  onMouseLeave={(e) => { const d = e.currentTarget.querySelector(".ws-disc"); if (d) { d.style.transform = "none"; d.style.background = "#fff"; d.style.color = C.accent; d.style.boxShadow = "0 10px 26px rgba(0,0,0,0.08)"; d.style.borderColor = C.line; } }}>
                  <div className="ws-disc" style={{ width: 78, height: 78, margin: "0 auto", borderRadius: 24, background: "#fff", border: `1px solid ${C.line}`, boxShadow: "0 10px 26px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, transition: "0.25s", position: "relative" }}>
                    {Ico && <Ico size={30} color="currentColor" />}
                    {kids > 0 && <span style={{ position: "absolute", top: -8, right: -8, minWidth: 22, height: 22, padding: "0 5px", borderRadius: 11, background: C.accent, color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(105,33,2,0.3)" }}>{kids}</span>}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: C.text, lineHeight: 1.25 }}>{s.title}</div>
                  <div style={{ fontSize: 10.5, color: C.dim, marginTop: 2 }}>{kids ? `${kids} sous-menus` : "Ouvrir"}</div>
                </div>
              );
            })}
          </div>
          <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", fontSize: 12, color: C.dim }}>Cliquez une section pour révéler ses sous-menus sur la couche suivante</div>
        </div>
      </div>
    );
  }

  const cur = stack[stack.length - 1];
  const allCards = cur.children || [];
  const subParents = allCards.filter((c) => c.children && c.children.length);
  const showTabs = subParents.length >= 2;
  const tabNode = showTabs && tab !== "__all__" ? subParents.find((s) => s.id === tab) : null;
  const cards = tabNode ? tabNode.children : allCards;
  const path = stack.map((n) => n.title);
  const cardPath = tabNode ? [...path, tabNode.title] : path;
  const crumbList = (tabNode ? [...stack, tabNode] : stack).map((n) => ({ id: n.id, title: n.title }));
  const headEmoji = wsEmojiFor(cur);
  const tabList = [{ id: "__all__", title: "Tout", emoji: "✨" }].concat(subParents.map((s) => ({ id: s.id, title: s.title, emoji: wsEmojiFor(s) })));

  return (
    <div style={{ flex: 1, minHeight: "calc(100vh - 60px)", overflowY: "auto", padding: "26px 40px 60px", boxSizing: "border-box", background: "radial-gradient(1100px 700px at 50% -6%, #FFFFFF, #EEF0F3)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Fil d'Ariane */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12.5, color: C.muted, marginBottom: 16 }}>
          <span onClick={goHome} style={{ cursor: "pointer", color: C.accent, fontWeight: 700 }}>✦ Accueil</span>
          {stack.map((n, idx) => (
            <React.Fragment key={n.id}>
              <span style={{ color: C.dim }}>›</span>
              {idx === stack.length - 1 && !tabNode ? <span style={{ color: C.text, fontWeight: 700 }}>{n.title}</span> : <span onClick={() => { crumbTo(idx); setTab("__all__"); }} style={{ cursor: "pointer", color: C.accent, fontWeight: 600 }}>{n.title}</span>}
            </React.Fragment>
          ))}
          {tabNode && (<><span style={{ color: C.dim }}>›</span><span style={{ color: C.text, fontWeight: 700 }}>{tabNode.title}</span></>)}
        </div>

        {/* En-tête de section */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
          <button onClick={() => (stack.length > 1 ? crumbTo(stack.length - 2) : goHome())}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 15px", borderRadius: 980, border: `1px solid ${C.line2}`, background: "#fff", color: C.accent, font: `700 12.5px ${F.ui}`, cursor: "pointer", flexShrink: 0, transition: "background .15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.accentSoft; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}>
            ‹ {stack.length > 1 ? "Retour" : "Orbite"}
          </button>
          <div style={{ width: 58, height: 58, borderRadius: 18, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, boxShadow: "0 12px 28px rgba(105,33,2,.28)", flexShrink: 0 }}>{headEmoji}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: C.text, lineHeight: 1.15 }}>{cur.title}</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{allCards.length} élément{allCards.length > 1 ? "s" : ""}{subParents.length ? ` · ${subParents.length} sous-catégorie${subParents.length > 1 ? "s" : ""}` : ""}</div>
          </div>
        </div>

        {/* Onglets par sous-catégorie (uniquement si pertinent) */}
        {showTabs && (
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 20 }}>
            {tabList.map((tb) => {
              const on = tab === tb.id;
              return (
                <button key={tb.id} onClick={() => setTab(tb.id)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 980, cursor: "pointer", font: `700 13px ${F.ui}`, border: `1px solid ${on ? C.accent : C.line2}`, background: on ? C.accent : "#fff", color: on ? "#fff" : C.muted, boxShadow: on ? "0 6px 16px rgba(105,33,2,.22)" : "none", transition: "all .16s" }}
                  onMouseEnter={(e) => { if (!on) { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; } }}
                  onMouseLeave={(e) => { if (!on) { e.currentTarget.style.borderColor = C.line2; e.currentTarget.style.color = C.muted; } }}>
                  <span style={{ fontSize: 15 }}>{tb.emoji}</span> {tb.title}
                </button>
              );
            })}
          </div>
        )}

        {/* Grille de cartes */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {cards.map((node) => {
            const isParent = node.children && node.children.length;
            const isModule = node.action && node.action.type === "module";
            const isUrl = node.action && node.action.type === "url";
            const emoji = wsEmojiFor(node);
            const sub = isParent ? `${node.children.length} sous-rubriques` : isModule ? "Ouvrir le module" : isUrl ? "Lien externe" : "Ouvrir la fiche";
            const arw = isParent ? "›" : isUrl ? "↗" : "→";
            const tint = isModule ? C.accent : C.text;
            return (
              <div key={node.id} onClick={() => (isParent ? drill(node) : openLeaf(node, [...cardPath, node.title], crumbList))}
                style={{ position: "relative", background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: "17px 18px", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 10px 26px rgba(0,0,0,.05)", transition: "transform .18s, box-shadow .18s, border-color .18s", display: "flex", alignItems: "center", gap: 15, overflow: "hidden" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 18px 40px rgba(0,0,0,.12)"; e.currentTarget.style.borderColor = C.accent; const ar = e.currentTarget.querySelector(".ws-arw"); if (ar) ar.style.transform = "translateX(4px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04), 0 10px 26px rgba(0,0,0,.05)"; e.currentTarget.style.borderColor = C.line; const ar = e.currentTarget.querySelector(".ws-arw"); if (ar) ar.style.transform = "none"; }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: isModule ? `linear-gradient(135deg, ${C.accent}, ${C.accentDark})` : C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 24 }}>{emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: tint, lineHeight: 1.25, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis" }}>{node.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11.5, color: C.dim }}>{sub}</span>
                    {isModule && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "#fff", background: C.accent, padding: "2px 6px", borderRadius: 980 }}>App</span>}
                  </div>
                </div>
                <span className="ws-arw" style={{ color: isModule ? C.accent : C.dim, fontSize: 17, flexShrink: 0, transition: "transform .18s" }}>{arw}</span>
              </div>
            );
          })}
          {cards.length === 0 && <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: C.dim, fontSize: 13 }}>Aucun élément dans cette rubrique.</div>}
        </div>
      </div>
    </div>
  );
}

  return { LiveDataBars, HubSommaire };
})();

// ────────────────────── FIREBASE SETUP ──────────────────────
let app, auth, db, storage, appId = "wallswiss-app";

// 👑 EMAIL DE L'ADMINISTRATEUR (Mettez votre propre email ici)
const ADMIN_EMAIL = "admin@wallswiss.ch";

// Configuration Firebase WallSwiss
const firebaseConfig = {
  apiKey: "AIzaSyD6siK4q7ovudou4pmwMxQU0-Mrl7H_foA",
  authDomain: "appws-3b512.firebaseapp.com",
  projectId: "appws-3b512",
  storageBucket: "appws-3b512.firebasestorage.app",
  messagingSenderId: "1063328233614",
  appId: "1:1063328233614:web:e15d8f9ba7811462b4f1df"
};

try {
  const isCanvasEnv = typeof __firebase_config !== 'undefined';
  const finalConfig = isCanvasEnv ? JSON.parse(__firebase_config) : firebaseConfig;

  if (finalConfig.apiKey !== "VOTRE_API_KEY" || isCanvasEnv) {
    app = initializeApp(finalConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    if (isCanvasEnv && typeof __app_id !== 'undefined') appId = __app_id;
  }
} catch (error) {
  console.error("Erreur d'initialisation Firebase:", error);
}

// ══════════════════════════════════════════════════════════════════
//  PALETTE — Direction artistique "WallSmart" (thème clair alpin)
//  · Les clés d'origine (primary, gold, white, black, gray, lightGray,
//    mediumGray, darkGray, sidebar, primaryDark) sont CONSERVÉES À
//    L'IDENTIQUE afin que les slides PDF (SlideCover, SlideTOC, …) ne
//    subissent AUCUN changement visuel : charte oxblood #692102,
//    Times New Roman, coins carrés.
//  · Les nouvelles clés (bg, card, text, muted, goldUI, …) pilotent la
//    coquille de l'outil (sidebar, en-têtes, cartes, boutons, formulaires,
//    hub, mails, marketing, LPP, paramètres) — tokens WallSmart.
// ══════════════════════════════════════════════════════════════════
const C = {
  // ── Marque / slides PDF (INCHANGÉ — protège les rapports clients) ──
  primary: "#692102",
  primaryDark: "#4D1801",
  sidebar: "#692102",
  gold: "#A59568",
  white: "#FFFFFF",
  black: "#1A1A1A",
  gray: "#6B7280",
  lightGray: "#F3F2EF",
  mediumGray: "#E5E3DE",
  darkGray: "#374151",
  // ── Coquille : thème "Aurora" — canvas blanc Apple/SaaS + accents Google ──
  bg: "#FFFFFF",
  bgSoft: "#F5F5F7",
  card: "#FFFFFF",
  cardSoft: "#F5F5F7",
  elev: "#FFFFFF",
  text: "#1D1D1F",
  muted: "#6E6E73",
  dim: "#86868B",
  line: "rgba(0,0,0,0.08)",
  line2: "rgba(0,0,0,0.13)",
  // Accent principal = Google Blue ; goldUI/goldDeep repointés (compat coquille)
  accent: "#692102",
  accentDark: "#4D1801",
  accentSoft: "rgba(105,33,2,0.10)",
  goldUI: "#692102",
  goldDeep: "#4D1801",
  goldSoft: "rgba(105,33,2,0.10)",
  champagne: "#1D1D1F",
  // Palette Google complète (blue / red / yellow / green)
  gBlue: "#692102",
  gRed: "#EA4335",
  gYellow: "#FBBC05",
  gGreen: "#34A853",
  green: "#34A853",
  greenSoft: "rgba(52,168,83,.12)",
  red: "#EA4335",
  redSoft: "rgba(234,67,53,.12)",
  radius: "18px",
};

// Familles typographiques modernes (coquille uniquement ; les slides
// conservent 'Times New Roman' / 'Montserrat' en littéral).
const F = {
  ui: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  serif: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif",
  mono: "'SF Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
};

const Icons = {
  Building: ({ size = 28, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>,
  Bank: ({ size = 28, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"></path><path d="M3 10h18"></path><path d="M5 6l7-3 7 3"></path><path d="M4 10v11"></path><path d="M20 10v11"></path><path d="M8 14v3"></path><path d="M12 14v3"></path><path d="M16 14v3"></path></svg>,
  TrendUp: ({ size = 28, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
  Shield: ({ size = 28, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
  Home: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  FileText: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Mail: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22 6 12 13 2 6"></polyline></svg>,
  Settings: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  User: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Users: ({ size = 24, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  PieChart: ({ size = 24, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>,
  ExternalLink: ({ size = 16, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>,
  Phone: ({ size = 16, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>,
  BookContacts: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path><path d="M8 7h6"></path><path d="M8 11h8"></path></svg>,
  Copy: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>,
  Inbox: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>,
  Target: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  ImageIcon: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
  PhoneCall: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/><path d="M14.05 2a9 9 0 0 1 8 7.94"/><path d="M14.05 6A5 5 0 0 1 18 10"/></svg>,
  Crosshair: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>,
  CheckSquare: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  Smile: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>,
  Frown: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>,
  CheckCircle: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  XCircle: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>,
  Check: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Layers: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Search: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
};

const LOGO_URL = "/logo blanc sans texte.png";
const APP_VERSION = "v2.3.0 (Aurora)";

const CAMPAIGNS_DATA = {
  '3p-meta': {
      id: '3p-meta',
      name: '3P Meta',
      title: 'Leads 3P (Optimisation)',
      subtitle: 'Campagne : "Aide Suisse - Optimisation Fiscale"',
      scripts: {
          intro: "« Bonjour [Prénom], c'est [Votre Prénom], je suis partenaire de Aide Suisse. Je vous contacte car nous avons bien reçu votre demande effectuée sur Facebook et/ou Instagram par rapport à la simulation pour la récupération des 4'800 CHF d'impôts sur Genève. Je vous appelle simplement pour vous communiquer les résultats de votre test d'éligibilité. Vous avez 2 minutes ? »",
          transition: "« Bonne nouvelle, votre profil montre un potentiel d'économie intéressant. Afin de mieux comprendre votre situation, j'aurais besoin de valider quelques points avec vous sur votre contexte professionnel et personnel actuel (Imposé à la source ? 3ème pilier ? Famille ?). »",
          closing: "« C'est très clair. Pour vous donner un chiffre final et surtout voir s'il y a des leviers intéressants pour optimiser votre situation, il est nécessaire de fixer un rendez-vous téléphonique pour une évaluation complète. On bloque un créneau ensemble pour ce rendez-vous demain soir ou jeudi midi ? »"
      }
  },
  'meta-lpp': {
      id: 'meta-lpp',
      name: 'LPP META',
      title: 'Leads LPP (Avoirs Oubliés)',
      subtitle: 'Campagne : "Pilah - Recherche 2ème Pilier"',
      scripts: {
          intro: "« Bonjour [Prénom], c'est [Votre Prénom] de la plateforme Pilah. Je vous appelle suite à votre demande sur Facebook concernant la recherche de vos avoirs LPP. Vous avez utilisé notre outil pour savoir si vous aviez des fonds de 2ème pilier oubliés en Suisse. Vous avez 2 minutes ? »",
          transition: "« Super. Pour vous expliquer, il y a des milliards de francs qui dorment actuellement dans les caisses de pension suisses. En moyenne, nos utilisateurs récupèrent 8'000 CHF. Pour savoir si vous êtes concerné, j'ai besoin de comprendre votre parcours. Vous avez travaillé environ combien de temps en Suisse jusqu'à présent ? »",
          closing: "« C'est très clair. Comme expliqué dans la vidéo, notre service s'occupe de toute la paperasse pour retrouver cet argent. Pour lancer la recherche 100% sécurisée, je vous propose de prendre un rendez-vous téléphonique d'une dizaine de minutes. Qu'est-ce qui vous arrange pour ce rendez-vous, demain soir ou jeudi midi ? »"
      }
  },
  'cmu-lamal-meta': {
      id: 'cmu-lamal-meta',
      name: 'CMU LAMal META',
      title: 'Leads Assurance (CMU/LAMal)',
      subtitle: 'Campagne : "Optimisation Assurance Frontalier"',
      scripts: {
          intro: "« Bonjour [Prénom], c'est [Votre Prénom], partenaire expert pour les frontaliers. Je vous contacte suite à votre simulation sur notre site concernant l'optimisation de votre assurance maladie. Vous cherchiez à savoir si vous payiez trop cher. Vous avez 2 minutes ? »",
          transition: "« Super. Beaucoup de frontaliers paient trop cher chaque mois sans le savoir, parfois jusqu'à 200 CHF de trop, car ils ont fait le mauvais choix initial ou n'ont pas révisé leur situation. Le but de mon appel est de valider votre situation actuelle (salarié, canton, composition familiale) pour voir de quel côté vous êtes le plus avantagé. »",
          closing: "« C'est très clair. Le droit d'option est un choix décisif. Pour faire un comparatif chiffré exact et vous montrer combien vous pourriez économiser, le mieux est de prendre un rendez-vous téléphonique avec l'un de nos experts. On fixe ce rendez-vous pour demain soir ou jeudi midi ? »"
      }
  },
  'compte-ch-meta': {
      id: 'compte-ch-meta',
      name: 'COMPTE CH META',
      title: 'Leads Change (Compte CH)',
      subtitle: 'Campagne : "Optimisation Taux de Change Frontalier"',
      scripts: {
          intro: "« Bonjour [Prénom], c'est [Votre Prénom], partenaire expert pour les frontaliers. Je vous appelle suite à votre demande sur Facebook concernant notre solution pour arrêter de vous faire plumer sur le taux de change de votre salaire. Vous avez 2 minutes ? »",
          transition: "« Parfait. Comme expliqué dans la vidéo, la majorité des frontaliers perdent de l'argent chaque mois à cause des marges cachées et des mauvais taux des banques classiques. Pour voir si notre solution de taux préférentiel s'applique à vous, vous percevez actuellement votre salaire sur un compte suisse ou directement en euros ? »",
          closing: "« C'est très clair. Pour vous montrer concrètement comment mettre en place ce taux préférentiel transparent et faire une simulation exacte sur votre salaire, le mieux est de prendre un rendez-vous téléphonique avec l'un de nos experts. On bloque un créneau pour demain soir ou jeudi midi ? »"
      }
  }
};

const MAILS_TYPES = [
  {
    id: "m1",
    titre: "Après un rendez-vous",
    categorie: "Rendez-vous",
    objet: "Suite à notre échange – WallSwiss",
    corps: `Chère Madame …, Cher Monsieur …,\n\nJe vous transfère ce mail à la suite de notre rendez-vous ensemble.\nC'était un réel plaisir d'avoir pu discuter avec vous de votre situation et d'explorer les potentielles améliorations à envisager.\nComme convenu, vous trouverez ci-dessous un récapitulatif de notre rendez-vous :\n- Planification financière\n- Fiscalité\n\nJe vous souhaite une excellente journée et me tiens à votre entière disposition pour toute information complémentaire.\n\nBien cordialement,`
  },
  {
    id: "m2",
    titre: "Documents manquants",
    categorie: "Suivi",
    objet: "Documents manquants – WallSwiss",
    corps: `Cher Monsieur,\nChère Madame,\n\nJ'espère que mon mail vous trouvera en pleine forme.\nJe me permets de revenir vers vous car il me manque certains documents / certaines informations par rapport à votre situation.\n\nPouvez-vous me faire parvenir les informations suivantes / les documents suivants s'il vous plait :\n- Copie de votre permis de travail (avec signature sous votre photo)\n- Certificat de salaire 2024\n- Numéro AVS\n- Numéro fiscal français\n- Copie de votre contrat de travail`
  },
  {
    id: "m3",
    titre: "Proposition de rendez-vous",
    categorie: "Rendez-vous",
    objet: "Proposition de rendez-vous – WallSwiss",
    corps: `[VERSION PRÉSENTIEL]\nJe vous confirme notre prochain échange le Jeudi 31 Juillet 2024 à 11h00 directement dans locaux situés au :\nRue Kléberg 14\n1201 Genève\nSuisse\n\n--- OU ---\n\n[VERSION VISIO]\nJe vous confirme notre prochain échange le Jeudi 31 Juillet 2023 à 11h00 directement par visioconférence Teams. Vous recevrez un lien de rendez-vous quelques minutes avant notre séance.`
  },
  {
    id: "m4",
    titre: "Présentation WallSwiss",
    categorie: "Divers",
    objet: "Présentation WallSwiss à destination des entreprises",
    pieceJointe: "Flyer présentation entreprise",
    corps: `Chère Madame…, Cher Monsieur…,\n\nJ'ai plaisir de vous faire parvenir ci-dessous un e-mail récapitulatif sur les solutions que nous pouvons vous proposer ainsi qu'à vos collaborateurs.\nN'hésitez pas à aller consulter notre site internet www.wallswiss.ch, pour vous apporter une vision complète des solutions que nous pouvons apporter.\n\nWallSwiss a décidé de mettre en place une campagne d'information au sein des entreprises de Suisse Romande, sous forme de permanences directement mise en place au sein de vos bureaux.\nCes permanences offrent l'opportunité à chacun de vos collaborateurs de pouvoir, sans même se déplacer, avoir un premier rendez-vous d'analyse personnalisé de leur situation.\n\nSuite aux nouvelles lois mises en place depuis le 1er Janvier 2023, de nombreuses nouvelles possibilités d'optimisation sont disponibles, notamment sur les différents points ci-dessous :\n- Déclaration fiscale Suisse et Française (imposition ordinaire, rectification simple, quasi-résident, LMNP, CMU ou CNTFS)\n- LPP (Libre-Passage)\n- Planification financière\n- Assurances choses/maladies\n- Investissements financiers (Private Equity, Crypto-monnaies, Compte Titres)\n- Stratégie immobilière\n\nNos permanences entreprises sont sans frais d'honoraires !\nChaque personne intéressée, suivant leur situation, aura la possibilité d'avoir un second rendez-vous individuel soit à notre cabinet, via visio-conférence ou directement à son domicile (sans frais d'honoraire également).\n\nBien évidemment, j'aurai le plaisir de répondre à toutes vos questions.`
  },
  {
    id: "m5",
    titre: "Contrôle CMU",
    categorie: "CMU / Fiscalité",
    objet: "Contrôle CMU – WallSwiss",
    corps: `Concernant les cotisations précédemment versées lors de votre affiliation à la CMU/CNTFS, nous pouvons revenir sur les 3 dernières années de manière rétroactive si vous avez trop payé :\n3 années de manière certaine, la 4ème et 5ème année au bon vouloir de la personne qui recevra votre dossier de rectification.\n\nCette vérification est entièrement gratuite.\n\nAfin de l'effectuer, il faut me faire parvenir vos 5 derniers avis d'imposition français ainsi que vos 5 derniers appels de cotisations CMU/CNTFS (ou tableau récapitulatif disponible dans votre espace personnel de l'URSSAF en ligne : onglet « mon compte » et « historique des déclarations »).\nUne fois que j'aurai réceptionné ces documents, je pourrai les analyser et vous faire un retour.`
  },
  {
    id: "m6",
    titre: "Modification IMPÔTS pour CMU",
    categorie: "CMU / Fiscalité",
    objet: "Correction CMU sur impôts FR – WallSwiss",
    corps: `Après vérification de vos documents concernant votre CMU, il y a plusieurs erreurs qui se sont glissées…\n\nPremière étape : vous connecter à votre espace Impot.gouv.fr et leur faire un message depuis votre messagerie privée leur indiquant que vous avez oublié de déclarer en case 6DD le montant de vos cotisations depuis vos revenus de 2020 ET leur joindre les attestations/appels de cotisations de votre CMU en tant que document justificatif pour chaque année afin qu'ils puissent vous faire parvenir des avis d'impôts français rectifiés.\nA noter : la règlementation du FISC français permet de rectifier uniquement les deux derniers avis d'impôts français.\n\nDeuxième étape : une fois les avis d'impôts français rectifiés reçus, me les faire parvenir par mail s'il vous plait, afin que je puisse vous indiquer précisément quel montant nous pourrons récupérer pour chaque année.`
  },
  {
    id: "m7",
    titre: "Rectification CMU — Facture",
    categorie: "CMU / Fiscalité",
    objet: "Correction CMU – WallSwiss",
    corps: `Après vérification de vos documents concernant votre CMU, il y a plusieurs erreurs qui se sont glissées…\nPour l'année :\n- Avis d'impôts 2023 sur revenus de 2023 : environ EUR ….-, qui vient directement réduire l'échéancier restant de l'année en cours\n- Avis d'impôts 2022 sur revenus de 2021 : environ EUR ….-\n- Avis d'impôts 2021 sur revenus de 2020 : environ EUR ….-\n- Avis d'impôts 2020 sur revenus de 2019 : environ EUR ….-\n- Avis d'impôts 2019 sur revenus de 2018 : environ EUR ….-\n\nSOIT UN TOTAL DE : EUR ….- d'erreurs.\n\nAttention : le calcul du retour est une estimation basée sur les documents et informations que vous nous avez transmis et sous réserve d'acceptation de l'URSAFF.\nConcernant le traitement du dossier cela peut varier entre 1 et 6 mois auprès de l'URSSAF. Le remboursement intervient directement sur votre compte de CMU/CNTFS et épongera quelques futures cotisations.\n\nVous trouverez ci-joint toutes les informations bancaires afin de réaliser le paiement des honoraires appliqués pour le traitement de votre rectification de CMU de CHF ….-/ par année rectifiée soit :\nYUH – Pierrick PEREIRA - ….- CHF\nCHXX XXX XXXX XXXX XXX\n\nVous pouvez également régler en espèce directement dans nos locaux également, auquel cas, merci de me prévenir de votre passage par avance.`
  },
  {
    id: "m8",
    titre: "Correction CSG-CRDS — 6DD",
    categorie: "CMU / Fiscalité",
    objet: "Correction CSG/CRDS – WallSwiss",
    corps: `Madame, Monsieur …,\n\nComme expliqué ce jour en étant affilié au CNTFS/LAMal, vous n'êtes pas redevable de la CSG-CRDS sur vos revenus du patrimoine à hauteur de vos parts de propriété.\n\nAfin de corriger cela, voici la marche à suivre :\n(A noter : vous pouvez rectifier uniquement les 2 derniers avis d'impôts français.)\n\n- Se connecter sur Accueil | impots.gouv.fr\n- Onglet messagerie\n- Ecrire\n- Je signale une erreur sur le calcul de mon impôt\n- Ma demande concerne l'impôt sur le revenu et les prélèvements sociaux\n- Sélectionner l'année concernée puis inscrire ce message :\n« Bonjour, J'ai oublié d'indiquer que je n'étais pas assujetti à un système de sécurité sociale Français, de ce fait je ne suis pas redevable de la CSG CRDS. En effet en tant que frontalier je suis affilié au CNTFS/LAMal. Vous trouverez en pièce jointe ma cotisation de l'année 20__. Merci de bien vouloir procéder à cette modification. »\n- Joindre en pièce jointe votre cotisation CMU/LAMal de l'année concernée + une copie de l'acte notarié pour le bien concerné si vous n'êtes pas propriétaire de celui-ci à 100%.\n\nJe reste naturellement à votre disposition si besoin,`
  },
  {
    id: "m9",
    titre: "3ème pilier — Simulation",
    categorie: "Prévoyance",
    objet: "3ème pilier – Simulation – WallSwiss",
    corps: `3A - PILIER\nConcernant le 3ème pilier A auprès de la compagnie LiechtensteinLife : Il est imposable à la sortie à 6,75%. La stratégie d'investissement est 100% modulable. Le capital décès est d'office toujours plus élevé que les primes cotisées pour votre ascendance/descendance sans testament particulier. C'est un placement de prévoyance Suisse qui fonctionne tel qu'une assurance vie pour la personne qui l'ouvre. Le capital est bloqué jusqu'à l'âge légal de la retraite mais il peut être retiré de manière anticipée pour 4 possibilités (attention, il faut le garder un certain temps pour avoir le rendement escompté bien évidement).\nIl est défiscalisable de vos impôts Suisses dans tous les cantons en tant que résident Suisse et dans certains cas en statut Quasi-Résident pour les frontaliers à hauteur de CHF 7'056.- par année. Il est indispensable pour combler les lacunes de votre retraite.\nUne fois la demande d'ouverture acceptée, la compagnie d'assurance vous communiquera par SMS votre identifiant et mot de passe pour activer votre police et avoir un accès à votre compte H24 comme un compte bancaire en toute transparence à travers l'application PROSPERITY.\nPour de plus amples informations : (Lien vers la brochure)\n\n3B - PILIER\nConcernant le 3ème pilier B auprès de la compagnie LiechtensteinLife : c'est un placement de prévoyance Suisse qui fonctionne tel qu'une assurance vie pour la personne qui l'ouvre. Il est entièrement flexible et peut-être retiré à tout moment (attention, il faut le garder un certain temps pour avoir le rendement escompté bien évidement). La stratégie d'investissement est 100% modulable. Le capital décès est d'office toujours plus élevé que les primes cotisées.\n(Il est défiscalisable de vos impôts Suisse dans certains cas en statut Quasi-Résident sur le Canton de Genève à hauteur de CHF 2'200.- pour une personne célibataire, CHF 3'300.- pour une personne mariée, auquel s'ajoute CHF 900.- par année par enfant. Il est indispensable pour combler les lacunes de votre retraite.) 🡪 INCLURE DANS LE MAIL UNIQUEMENT SI ELIGIBLE DEFISCALISATION\nUne fois la demande d'ouverture acceptée, la compagnie d'assurance vous communiquera par SMS votre identifiant et mot de passe pour activer votre police et avoir un accès à votre compte H24 comme un compte bancaire en toute transparence à travers l'application PROSPERITY.\nPour de plus amples informations : (Lien vers la brochure)\n\nEn terme de projection sur … années (vos 65 ans) en stratégie défensive, équilibrée et stratégie croissante avec une mensualité de CHF … .- :\n- Rendement 3.3% – Primes cotisées CHF 115'200.00 – Capital de sortie 65 ans CHF 169'108.10\n- Rendement 6% – Primes cotisées CHF 115'200.00 – Capital de sortie 65 ans CHF 269'991.55\n- Rendement 8.7% – Primes cotisées CHF 115'200.00 – Capital de sortie 65 ans CHF 444'587.15\n\n3P - KIDS\nConcernant le 3ème pilier Junior auprès de la compagnie LiechtensteinLife : c'est un placement de prévoyance suisse qui vous permet d'offrir à vos enfants un socle financier pour leur avenir. Vous pouvez le mettre en place jusqu'à ce que votre enfant atteigne 15 ans. Vous pouvez choisir librement le montant de vos contributions sans limitation maximale, ainsi que la durée jusqu'au 18 ou 25 ans de votre enfant et la fréquence des versements lors de sa mise en place.\nPour de plus amples informations : (Lien vers la brochure)\nUne fois la demande d'ouverture acceptée, la compagnie d'assurance vous communiquera par SMS votre identifiant et mot de passe pour activer votre police et accéder à votre compte 24h/24 via l'application PROSPERITY, comme pour un compte bancaire, en toute transparence.\nEn terme de projection sur … années en stratégie défensive, équilibrée et stratégie croissante avec une mensualité de CHF … .- :\n- Rendement 3.3% – Primes cotisées CHF 115'200.00 – Capital de sortie 65 ans CHF 169'108.10\n- Rendement 6% – Primes cotisées CHF 115'200.00 – Capital de sortie 65 ans CHF 269'991.55\n- Rendement 8.7% – Primes cotisées CHF 115'200.00 – Capital de sortie 65 ans CHF 444'587.15`
  },
  {
    id: "m10",
    titre: "3ème pilier — Documents ouverture",
    categorie: "Prévoyance",
    objet: "3ème pilier – Documents d'ouverture – WallSwiss",
    corps: `Pour la demande d'ouverture sont nécessaires les documents suivants :\n\n- Copie permis de travail/permis de séjour/carte d'identité Suisse,\n- Numéro AVS,\n- IBAN Suisse commençant par CH si mise en place d'une LSV,\n- Numéro fiscal français si frontalier.`
  },
  {
    id: "m11",
    titre: "Mise en place OP ou LSV",
    categorie: "Prévoyance",
    objet: "Mise en place cotisations 3ème pilier – WallSwiss",
    pieceJointe: "Formulaire LSV/OP",
    corps: `Cher Monsieur, Chère Madame,\n\nSuite à la demande d'ouverture de votre prévoyance individuelle réalisée ce jour, vous trouverez, ci-joint, les QR IBAN en deuxième page de la pièce jointe pour mettre en place depuis vos espaces e-Banking, l'ordre automatique de ….- CHF vers votre 3ème pilier B du 01 Septembre 2024.\n\nSi vous souhaitez mettre en place un prélèvement automatique : il suffit de le compléter, le signer de manière manuscrite et de renvoyer une copie par mail, à votre banque et à moi également. Nous pouvons parfois rencontrer des difficultés lors du premier prélèvement, auquel cas, je vous contacterai.\n\nJe vous souhaite une excellente journée et me tiens à votre entière disposition pour toute information complémentaire.\n\nBien cordialement,`
  },
  {
    id: "m12",
    titre: "3ème pilier — Confirmation maintien",
    categorie: "Prévoyance",
    objet: "Maintien 3ème pilier – WallSwiss",
    pieceJointe: "Mandat de gestion + copie pièce d'identité client",
    corps: `Cher Monsieur …,\n\nLa compagnie Liechtenstein Life me demande une validation de votre part concernant l'activation de votre 3ème pilier, pouvez-vous simplement me faire parvenir un mail avec un copié/collé du message ci-dessous, ainsi qu'une copie du mandat de gestion complété et signé de votre part que vous trouverez en pièce jointe s'il vous plait.\n\n« Bonjour,\nJe, soussignée …, affirme que je souhaite maintenir les mensualités de mon 3ème pilier A/B auprès de Liechtenstein Life que je possède actuellement et que le 3ème pilier A/B est fait de manière complémentaire aujourd'hui.\nMerci par avance de prendre en considération ma demande,\nMr Mme … »`
  },
  {
    id: "m13",
    titre: "Recherche LPP",
    categorie: "LPP",
    objet: "Recherche avoirs 2ème pilier – WallSwiss",
    pieceJointe: "Mandat de gestion WS + formulaire recherche à Berne + formulaire extrait compte Zurich",
    corps: `[VERSION 1]\nChère Madame …, Cher Monsieur …,\nLors de notre échange, vous m'avez fait part de votre désir de retrouver vos avoirs de deuxième pilier.\nA cet effet, je vous prie de me retourner les 3 documents ci-joint complétés et signés de votre part s'il vous plait ainsi qu'une copie de votre pièce d'identité.\nUne fois les formulaires réceptionnés, je me chargerai personnellement de traiter votre recherche d'avoirs.\nLe délai avant d'avoir un retour sur vos avoirs de 2ème pilier peut prendre jusqu'à 3 mois maximum. Je vous reviendrai dès réception du résultat.\nSi vous avez des questions ou besoin d'informations complémentaires, je suis à votre entière disposition !\n\n--- OU ---\n\n[VERSION 2]\nCher Julien,\nSuite à notre agréable entretien téléphonique, nous allons vous accompagner dans la recherche de l'ensemble de vos avoirs de 2ᵉ pilier.\nAfin que je puisse lancer officiellement la procédure, je vous remercie de bien vouloir me retourner les deux documents ci-joints, dûment complétés et signés, ainsi qu'une copie de votre pièce d'identité (ou une photographie lisible).\nPar ailleurs, si d'ici là vous retrouvez d'anciens relevés de caisse de pension ou attestations LPP, n'hésitez pas à m'en envoyer une simple photo par e-mail ou via WhatsApp. Ces éléments peuvent parfois accélérer ou faciliter la recherche.\nDès réception des documents, je me chargerai personnellement de traiter votre demande auprès des différentes institutions. Le délai de réponse pour retrouver vos avoirs de 2ᵉ pilier peut aller jusqu'à un mois. Je reviendrai vers vous dès que j'aurai obtenu les premiers résultats.\n\nÀ l'issue de cette recherche, nous prévoyons un appel afin :\n- de vérifier que vos périodes AVS ont été correctement cotisées ;\n- et de voir comment sécuriser vos avoirs LPP sur un compte nominatif (compte de libre passage), afin qu'ils soient clairement identifiés, suivis et optimisés pour la suite.`
  },
  {
    id: "m14",
    titre: "Recommandations",
    categorie: "Divers",
    objet: "Recommandations – WallSwiss",
    corps: `Cher Monsieur …, Chère Madame …,\n\nOffrez la possibilité à vos proches d'optimiser leur situation en leur partageant la philosophie WallSwiss !\nLaissez-nous ci-dessous leurs coordonnées afin que l'on puisse leur apporter les meilleurs conseils selon leur situation.\nVoici un petit aperçu condensé pour les recommandations qui sont notre plus belle rémunération :\n- Déclaration fiscale Suisse et Française (imposition ordinaire, rectification simple, quasi-résident, LMNP, CMU ou CNTFS)\n- LPP (Libre-Passage)\n- Prévoyance (1, 2, et 3 piliers)\n- Assurances choses/maladies\n- Investissements (Private Equity, Compte Titres, Gestion de fortune, Trust, CryptoMonnaie)\n- Financement immobilier / Stratégie immobilière\n\nChaque personne intéressée, suivant leur situation, aura la possibilité d'avoir un rendez-vous individuel soit à notre cabinet ou via visio-conférence (sans frais d'honoraire également).\n\nJe compte sur vous pour me faire un retour !\nJe vous souhaite une excellente journée et me tiens à votre entière disposition pour toute information complémentaire.\n\nBien cordialement,`
  },
  {
    id: "m15",
    titre: "Changement CMU vers LAMal",
    categorie: "CMU / Fiscalité",
    objet: "Changement vers la LAMal – WallSwiss",
    corps: `Bonjour Madame…, Bonjour Monsieur…,\n\nAfin de pouvoir réouvrir votre droit d'option, il vous faut soit bénéficier d'une période de chômage indemnisé en France (attention délai de carence) ou bien effectivement devenir résident Suisse pendant une période minimum de 6 mois.\nConcernant cette dernière démarche, il vous faudra obtenir une adresse en Suisse, puis se rendre à l'OCPM, afin de se déclarer en Suisse et faire une demande de Permis B sauf si vous êtes de nationalité Suisse, auquel cas vous ferez une demande de document d'entrée sur le territoire.\nD'un autre côté, il vous faudra déposer une demande de souscription LAMal résidente dont la prime s'élève en moyenne à CHF350/450.- mensuel pendant le délai d'instruction du dossier (environ 6 mois).\nVous pourrez ensuite faire une demande de radiation CMU/CNTFS, avec l'attestation de résidence Suisse + la police d'assurance LAMal. La CMU vous remboursera de manière rétroactive les sommes trop perçues pendant la période d'instruction du dossier, soit depuis votre 1er d'entrée sur le territoire Suisse.\n\nSi vous souhaitez revenir en France, il vous faut retourner à l'OCPM pour annoncer votre départ du territoire Suisse et récupérer le formulaire qui prouve votre départ du territoire.\nLa LAMal résidente sera ensuite basculée LAMal frontalière à l'aide d'un formulaire et le formulaire comme quoi vous avez quitté le territoire Suisse.\n\nJ'espère avoir pu répondre à vos interrogations et vous souhaite une excellente journée.\nJe me tiens à votre entière disposition pour toute information complémentaire.`
  },
  {
    id: "m16",
    titre: "Confirmation RDV — Call",
    categorie: "Rendez-vous",
    objet: "Confirmation rendez-vous – WallSwiss",
    corps: `Bonjour Madame…, Bonjour Monsieur …,\n\nComme convenu par téléphone, j'ai le plaisir de vous confirmer votre rendez-vous du Vendredi 15 Septembre 2024 à 13:00 à notre cabinet WallSwiss situé au :\nRue Kléberg, 14\n1201 Genève\nSuisse\n\nVous trouverez à votre disposition un parking extérieur avec des places bleues à disque (juste devant l'immeuble), des places blanches vers la gare routières et le parking souterrain de Manor si besoin.\nAfin de préparer votre échange dans les meilleures conditions, merci de préparer les éléments suivants :\n- Carte AVS,\n- Permis de travail/Pièce d'identité,\n- Dernier certificat de salaire,\n- Dernier certificat de prévoyance,\n- Dernière déclaration fiscale suisse et/ou française,\n- Et tout document nous permettant de faire un point sur vos différentes questions.\n\nUn de nos bureaux vous a été réservé par votre planificateur financier, Pierrick PEREIRA qui vous accueillera.\nAu besoin, vous pourrez directement joindre par mail votre conseillère à p.pereira@wallswiss.ch ou par téléphone au +41 77 941 18 77.\n\nNous comptons sur votre présence lors de ce premier rendez-vous sans honoraires !\nJe vous souhaite une excellente journée et me tiens à votre entière disposition pour toute information complémentaire.\nSi vous avez des personnes de votre entourage à qui vous souhaitez faire bénéficier de nos services, n'hésitez pas à nous les recommander, nous nous ferons un plaisir de les conseiller !`
  },
  {
    id: "m17",
    titre: "Confirmation RDV — Agent",
    categorie: "Rendez-vous",
    objet: "Confirmation rendez-vous – WallSwiss",
    corps: `Bonjour Madame…, Bonjour Monsieur …,\n\nComme convenu par téléphone, j'ai le plaisir de vous confirmer votre rendez-vous du Vendredi 15 Septembre 2024 à 13:00 à notre cabinet WallSwiss situé au :\nRue Kléberg, 14\n1201 Genève\nSuisse\n\nVous trouverez à votre disposition un parking extérieur avec des places bleues à disque (juste devant l'immeuble), des places blanches vers la gare routières et le parking souterrain de Manor si besoin.\nAfin de préparer notre échange dans les meilleures conditions, merci de préparer les éléments suivants :\n- Carte AVS,\n- Permis de travail/Pièce d'identité,\n- Dernier certificat de salaire,\n- Dernier certificat de prévoyance,\n- Dernière déclaration fiscale suisse et/ou française,\n- Et tout document nous permettant de faire un point sur vos différentes questions.\n\nAu besoin, vous pourrez directement joindre par mail votre conseillère à p.pereira@wallswiss.ch ou par téléphone au +41 77 941 18 77.\nNous comptons sur votre présence lors de ce premier rendez-vous sans honoraires !\nJe vous contacterai 24h avant le rendez-vous. En cas d'empêchement, merci de m'en avertir au plus tôt afin de permettre à une autre personne de disposer de ce créneau.\nJe vous souhaite une excellente journée et me tiens à votre entière disposition pour toute information complémentaire.`
  },
  {
    id: "m18",
    titre: "Confirmation traitement dossier",
    categorie: "CMU / Fiscalité",
    objet: "Confirmation traitement dossier – WallSwiss",
    corps: `Cher Monsieur …,\nChère Madame …,\n\nNous sommes ravis de vous confirmer le traitement et l'envoi, le …/…/2024, de votre dossier de rectification d'impôt par voie postale. Nous vous invitons également à faire la demande d'ouverture de votre espace e-démarche sur le site des impôts de Genève pour les prochaines années : https://ge.ch/ginainscriptions_pp/identity\n\n--- OU ---\n\nNous sommes ravis de vous confirmer le traitement, le …/…/2024, de votre dossier de rectification en ligne à travers votre espace e-démarche.\n\nConcernant le traitement du dossier par l'administration fiscale, cela sera probablement assez long (peut être supérieur à une année) mais vous pourrez consulter l'état de celui-ci sur votre espace e-démarche -> espace e-démarches fiscales.\nSi vous recevez une demande d'information complémentaire ou document complémentaire de la part de l'AFC, merci de nous transmettre le courrier afin que l'on puisse le traiter le plus rapidement possible.\n\nVous trouverez ci-joint toutes les informations bancaires afin de réaliser le paiement des honoraires appliqués pour le traitement de votre rectification d'impôt 2023 :\nBanque – Prénom NOM - ….- CHF\nCHXX XXXX XXXX XXXX XXXX X (IBAN SUISSE OBLIGATOIRE)\nVous pouvez également régler en espèce directement dans nos locaux également, auquel cas, merci de me prévenir de votre passage par avance (à inclure dans le mail si pas encore payé par le client)\n\nNous vous remercions pour la confiance accordée et restons à votre disposition pour toute demande complémentaire,`
  },
  {
    id: "m19",
    titre: "Relance documents — 1ère",
    categorie: "Suivi",
    objet: "Documents manquants – 1ère relance – WallSwiss",
    corps: `PREMIERE RELANCE – Déclaration fiscale Suisse 2023\n\nCher Monsieur …,\nChère Madame …,\n\nDans le cadre de la prise en charge de votre dossier d'impôts Suisse au sein de notre cabinet SwissKap, celui reste incomplet et ne nous permet pas d'avancer dans vos démarches.\nPourriez-vous nous faire parvenir dans les plus brefs délais les documents suivants s'il vous plait : (supprimer ce qui n'est pas nécessaire)\n\n- Formulaire original DRIS/TOU reçu par voie postale / Identifiant et mot de passe à votre espace e-démarche,\n- Certificat de salaire 2023, de tous vos employeurs suisses, (pour vous et votre conjoint(e)),\n- Toutes les fiches de paies françaises de 2023 de Mr/Mme,\n- IBAN Suisse commençant par CH,\n- Copie de toutes les pages de votre livret de famille si vous avez des enfants à charge,\n- Montant exact des allocations familiales perçues en Suisse en 2023,\n- Copie de votre permis de travail ou pièce d'identité,\n- Justifications des frais de perfectionnement ou de reconversion professionnelle\n- Attestations de primes payées à des institutions de prévoyance (3ème pilier)\n- Justificatifs des primes d'assurance maladie, complémentaire/mutuelle et frais médicaux importants/EMS\n- Justificatifs des frais de garde de vos enfants par des tiers\n- Attestations d'intérêts et soldes de tous vos comptes bancaires, postaux, garantie de loyer, portefeuille titres, cryptomonnaies et autres éléments de la fortune au 31.12.2023\n- Acte notarié\n- Taxe foncière\n- Décompte de charges PPE/charges de copropriété et justificatifs des frais d'entretien d'immeuble\n- Factures de travaux d'embellissements ou rénovation\n- Assurance habitation\n- Attestations des intérêts passifs et des soldes vos dettes au 31.12.2023 / Tableaux d'amortissement\n\nDans l'attente de votre retour, je reste à votre disposition pour toute question et vous souhaite une belle journée.`
  },
  {
    id: "m20",
    titre: "Relance documents — 2ème",
    categorie: "Suivi",
    objet: "Documents manquants – 2ème relance – WallSwiss",
    corps: `DEUXIEME RELANCE – Déclaration fiscale Suisse 2023\n\nCher Monsieur …,\nChère Madame …,\n\nDans le cadre de la prise en charge de votre dossier d'impôts Suisse au sein de notre cabinet WallSwiss, celui reste incomplet et ne nous permet pas d'avancer dans vos démarches.\nPourriez-vous nous faire parvenir dans les plus brefs délais les documents suivants s'il vous plait : (supprimer ce qui n'est pas nécessaire)\n\n- Formulaire original DRIS/TOU reçu par voie postale / Identifiant et mot de passe à votre espace e-démarche,\n- Certificat de salaire 2023, de tous vos employeurs suisses, (pour vous et votre conjoint(e)),\n- Toutes les fiches de paies françaises de 2023 de Mr/Mme,\n- IBAN Suisse commençant par CH,\n- Copie de toutes les pages de votre livret de famille si vous avez des enfants à charge,\n- Montant exact des allocations familiales perçues en Suisse en 2023,\n- Copie de votre permis de travail ou pièce d'identité,\n- Justifications des frais de perfectionnement ou de reconversion professionnelle\n- Attestations de primes payées à des institutions de prévoyance (3ème pilier)\n- Justificatifs des primes d'assurance maladie, complémentaire/mutuelle et frais médicaux importants/EMS\n- Justificatifs des frais de garde de vos enfants par des tiers\n- Attestations d'intérêts et soldes de tous vos comptes bancaires, postaux, garantie de loyer, portefeuille titres, cryptomonnaies et autres éléments de la fortune au 31.12.2023\n- Acte notarié\n- Taxe foncière\n- Décompte de charges PPE/charges de copropriété et justificatifs des frais d'entretien d'immeuble\n- Factures de travaux d'embellissements ou rénovation\n- Assurance habitation\n- Attestations des intérêts passifs et des soldes vos dettes au 31.12.2023 / Tableaux d'amortissement\n\nDans l'attente de votre retour, je reste à votre disposition pour toute question et vous souhaite une belle journée.`
  },
  {
    id: "m21",
    titre: "IMPÔT — Après RDV Rectification Simple",
    categorie: "CMU / Fiscalité",
    objet: "Documents nécessaires pour la rectification d'impôt",
    corps: `Cher Monsieur M'Barek,\n\nSuite à notre agréable rendez-vous de lundi à 18h00, je vous transmets la liste des documents nécessaires pour la constitution de votre dossier de rectification d'impôt suisse 2025 (revenus 2024), ce qui permettra une récupération d'imposition :\n\n- Formulaire original DRIS/TOU (si vous l'avez déjà reçu par voie postale),\n- Certificat de salaire 2024 de tous vos employeurs suisses, pour vous et votre conjoint(e),\n- Toutes les fiches de paie françaises de 2024 de Monsieur/Madame,\n- IBAN suisse (commençant par CH),\n- Copie de toutes les pages de votre livret de famille si vous avez des enfants à charge,\n- Montant exact des allocations familiales perçues en Suisse en 2024,\n- Copie de votre permis de travail ou pièce d'identité.\n\nVous pouvez réserver un créneau directement sur mon agenda via ce lien : Calendly - Pierrick Pereira, ou m'envoyer un e-mail dès que votre dossier est complet. Nous pourrons alors fixer un rendez-vous pour finaliser et transmettre votre dossier le jour même.\nPar ailleurs, nous pourrons également revoir la question de prévoyance individuelle abordée brièvement lors de notre échange, si nécessaire.\n\nEnfin, si vous avez des collègues dans le doute concernant leur fiscalité, pensez à moi ! C'est toujours un plaisir de recevoir des recommandations.\n\nBien à vous,\nPierrick Pereira`
  },
  {
    id: "m22",
    titre: "3ème pilier — Changement stratégie Dynamique",
    categorie: "Investissements",
    objet: "WallSwiss - Mise à jour sans frais de votre portefeuille de prévoyance (3e pilier)",
    corps: `Bonjour [Prénom Nom],\n\nComme nous tenons à cœur de suivre nos clients dans la durée, et que les promesses d'accompagnement n'ont de valeur que lorsqu'il y a accompagnement, nous vous proposons une mise à jour sans frais de votre portefeuille de prévoyance (3e pilier) afin de mieux traverser le contexte actuel (concentration « Mega-Tech » US, rotations sectorielles en Europe, volatilité des devises).\n\nCe qui change (simple et efficace)\nNous remplaçons votre poche thématique (eau) et le fonds résiduel par une construction plus robuste pour ce contexte :\n- 30 % iShares Core S&P 500 (USD, Acc)\n- 25 % iShares NASDAQ-100 (USD, Acc)\n- 15 % iShares Swiss Dividend (CHF)\n- 15 % Xetra-Gold (EUR)\n- 15 % Xtrackers STOXX Europe 600 (EUR)\n\nPourquoi c'est mieux pour votre 3e pilier\n- Diversification renforcée : ajout d'Europe « large/mid/small caps » et d'un ballast or pour amortir les chocs, tout en conservant les moteurs US et les défensifs suisses.\n- Moins de concentration thématique : on sort de la niche « eau » pour un panier Europe plus équilibré.\n- Coûts maîtrisés & liquidité élevée : ETFs UCITS en réplication physique, clairs et transparents.\n- Sans frais d'arbitrage dans votre enveloppe 3P et sans impact fiscal au sein du contrat.\n\nComment valider (en 10 secondes)\nRépondez simplement à cet e-mail :\n« Je confirme l'arbitrage vers la stratégie proposée pour mon 3e pilier. »\nÀ réception, vous recevrez une notification dans votre application de suivi pour valider, et nous exécuterons l'arbitrage immédiatement.\nN'hésitez pas à suivre l'actualités économiques sur : Articles | WallSwiss\n\nEnvie d'un check-up avant ?\nVotre conseiller est disponible pour un point de 15–20 minutes (téléphone/visio) afin de répondre à vos questions et, si besoin, ajuster finement les pondérations selon vos projets de prévoyance.\n\nMerci de votre confiance, nous restons à vos côtés.\nChaleureusement,`
  },
  {
    id: "m23",
    titre: "Webconférence — Invitation",
    categorie: "Événements",
    objet: "Intéressé par le Private Equity ? – Webconférence WallSwiss × Altaroc",
    corps: `Intéressé par le Private Equity ?\nParticipez à notre webconférence exclusive avec Altaroc, leader du Private Equity accessible.\n\nMercredi 9 avril à 18h\nEn ligne – Participation anonyme possible\n\nLors de cette session, vous découvrirez :\n- Comment fonctionne le Private Equity\n- Pourquoi de plus en plus d'investisseurs privés s'y intéressent\n- Comment y accéder simplement grâce à Altaroc\n\nAvec la participation de :\n- Antoine Duchiron, CFA – Senior Sales & Product Specialist chez Altaroc Suisse\n- Pierrick Pereira – Fondateur de WallSwiss\n\nInscription gratuite ici : https://app.livestorm.co/altaroc/webinar-private-equity-altaroc-wallswiss`
  },
  {
    id: "m24",
    titre: "Relance compte titre",
    categorie: "Investissements",
    objet: "Suivi chiffré – Évolution du compte-titres – WallSwiss",
    corps: `Madame XXXX,\n\nJe me permets de revenir vers vous afin de faire suite à notre dernier échange de juillet et de vous transmettre un suivi chiffré concernant l'évolution du compte-titres sur la période récente. L'idée est de vous montrer l'impact qu'aurait eu votre investissement si nous avions pu avancer dès le début du mois de juillet sur le projet d'accès à la gestion de fortune. Il s'agit simplement de vous illustrer, de façon factuelle, les retombées possibles si vous aviez investi votre capital de 250 000 CHF au 1er juillet 2025.\n\nJ'ai donc réalisé une simulation entre le 1er juillet 2025 et le 1er octobre 2025 : le point d'entrée était de 124,540 et le point de sortie de 135,820, soit une progression de 11,28 points, correspondant à +11,28 % sur trois mois.\n\nEn appliquant cette performance à votre projet d'investissement initial :\nPour votre placement envisagé de 250 000 CHF, après déduction des 3 % de frais d'entrée (7 500 CHF), soit un capital investi de 242 500 CHF, la valorisation au 1er octobre aurait atteint 269 854 CHF, soit une plus-value potentielle de 19 854 CHF en trois mois.\n\nVeuillez trouver ci-joint la fact sheet de la stratégie Dynamique : 51136809 | 135.96 / 137.33 USD\n\nCes résultats illustrent concrètement la dynamique positive du support que nous avions évoqué cet été. Je pense sincèrement qu'il serait dommage de passer à côté d'une opportunité aussi porteuse dans le contexte actuel.\n\nJe reste bien entendu à votre disposition pour en discuter, adapter la stratégie si besoin et répondre à toutes vos questions.\n\nBien cordialement,`
  },
  {
    id: "m25",
    titre: "Demande de relevé de compte (Lemania)",
    categorie: "LPP",
    objet: "Demande de relevé de compte – Fondation Lemania",
    corps: `Madame, Monsieur,

J'espère que vous allez bien.

Ma cliente, Madame [Nom Prénom], titulaire du compte n° [numéro de compte], aurait besoin de son relevé de compte.

Pourriez-vous, s'il vous plaît, nous le transmettre afin que nous puissions le lui faire suivre par la suite ?

Je vous remercie par avance pour votre retour et vous souhaite une excellente journée.

Cordialement,`
  },
  {
    id: "m26",
    titre: "Confirmation envoi de l'instruction",
    categorie: "LPP",
    objet: "Confirmation d'envoi de votre instruction de transfert – WallSwiss",
    corps: `Chère Madame / Cher Monsieur,

J'espère que vous allez bien.

Je vous confirme la bonne réception de vos documents signés afin d'établir le transfert de vos avoirs de second pilier auprès de votre compte de libre passage.

Nous procédons ce jour à l'envoi de vos pièces aux organismes concernés.

Je ne manquerai pas de revenir vers vous dès que vos fonds auront été regroupés.

Je reste bien entendu joignable en cas de besoin.

Excellente journée à vous.`
  },
  {
    id: "m27",
    titre: "Lancement recherche 2e pilier",
    categorie: "LPP",
    objet: "Lancement de votre recherche de 2ème pilier – WallSwiss",
    corps: `Bonjour Monsieur / Madame,

Je vous confirme la bonne réception des documents transmis dans le cadre de la recherche de vos avoirs de deuxième pilier auprès de la Centrale du 2e pilier à Berne.

La demande va être envoyée dès aujourd'hui. Nous reviendrons vers vous dès réception du retour de la Centrale. Veuillez noter que le délai de réponse peut varier entre 6 à 9 semaines.

Je vous souhaite une excellente journée.

Bien cordialement,`
  },
  {
    id: "m28",
    titre: "Post-RDV — Documents recherche LPP",
    categorie: "LPP",
    objet: "Documents à retourner pour votre recherche LPP – WallSwiss",
    pieceJointe: "Formulaire Berne + institution supplétive + mandat de gestion + pièce d'identité",
    corps: `Chère Madame / Cher Monsieur,

Je vous remercie pour votre confiance et la qualité de nos échanges de ce jour.

Comme convenu, vous trouverez ci-joint les documents à me retourner signés et complétés pour effectuer la recherche de vos fonds LPP :
- Formulaire de recherche auprès de la centrale de Berne
- Formulaire de recherche auprès de l'institution supplétive
- Mandat de gestion (cochez la case « recherche à la centrale de Berne »)
- Pièce d'identité recto/verso

Comme évoqué, notre cabinet œuvre dans l'optimisation patrimoniale globale et la planification retraite. Dans votre situation, il vous serait utile d'analyser toutes les solutions qui s'offrent à vous en tant qu'indépendant(e) pour améliorer vos revenus à la retraite et prévoir les années à venir sereinement. Je peux vous réserver une séance quand vous le souhaitez pour en discuter ensemble.

Je reste à votre entière disposition d'ici là si vous avez des questions complémentaires, et je reviens vers vous dès que nous avons un retour de la recherche LPP.

Cordiales salutations,`
  },
  {
    id: "m29",
    titre: "Reprogrammation de rendez-vous",
    categorie: "Rendez-vous",
    objet: "WallSwiss – Reprogrammation de votre rendez-vous",
    corps: `Cher Monsieur / Chère Madame,

Bonjour, j'espère que vous allez bien.

J'ai bien pris note de votre demande d'annulation de rendez-vous. Afin de reprogrammer celui-ci, comme évoqué lors de notre échange téléphonique, je vous invite à utiliser le lien de planification ci-joint :
[Lien de planification]

Je reste bien entendu à votre entière disposition si vous avez la moindre question ou si vous rencontrez des difficultés pour réserver un créneau.

Je vous souhaite une excellente journée.

Bien cordialement,`
  },
  {
    id: "m30",
    titre: "Relance — Devis en cours",
    categorie: "Relances",
    objet: "Suivi de votre situation – WallSwiss",
    corps: `Bonjour Monsieur / Madame,

J'espère que vous allez bien.

Je me permets de revenir vers vous car cela fait quelques mois que nous n'avons pas eu l'occasion d'échanger, et je souhaitais savoir si votre situation avait évolué depuis notre dernier contact.

Les projets, les objectifs ou encore la situation personnelle et professionnelle peuvent évoluer rapidement. Il est parfois utile de faire un point global sur votre situation.

Si vous le souhaitez, je serais ravi d'échanger quelques minutes avec vous afin de faire le point et, si nécessaire, organiser un rendez-vous ensemble.

N'hésitez pas à me communiquer vos disponibilités et je me ferai un plaisir de vous recontacter.

Dans l'attente de votre retour, je vous souhaite une excellente journée.

Bien cordialement,`
  },
  {
    id: "m31",
    titre: "Relance — Documents non reçus",
    categorie: "Relances",
    objet: "Relance – Documents à compléter et signer – WallSwiss",
    corps: `Bonjour Monsieur / Madame,

J'espère que vous allez bien.

Je me permets de revenir vers vous concernant notre rendez-vous du [DATE] ; à cette occasion, je vous ai fait parvenir plusieurs documents :
- Le mandat de gestion,
- Le formulaire de recherche de vos avoirs de 2e pilier,
- Et l'instruction de transfert permettant de regrouper vos fonds sur votre compte de libre passage ouvert auprès de la Fondation Lemania.

À ce jour, nous n'avons pas encore reçu les documents complétés et signés. Pourriez-vous me confirmer si vous les avez bien reçus ? Si besoin, je peux vous les renvoyer ou vous accompagner pour les remplir.

Je vous souhaite une excellente journée et reste à votre disposition.

Bien cordialement,`
  },
  {
    id: "m32",
    titre: "Retour de Berne",
    categorie: "LPP",
    objet: "Retour de la Centrale du 2e pilier (Berne) – WallSwiss",
    pieceJointe: "Résultat de la recherche 2e pilier (Centrale de Berne)",
    corps: `Bonjour Madame / Monsieur,

J'espère que vous allez bien.

Je vous contacte ce jour car nous avons bien reçu le retour de la recherche de vos avoirs de deuxième pilier auprès de la Centrale du 2e pilier à Berne.

Vous trouverez ce document en pièce jointe de ce mail.

Auriez-vous des disponibilités à me communiquer afin que je puisse vous programmer un rendez-vous pour faire le point sur les résultats obtenus et les éventuelles démarches à entreprendre ?

Je vous remercie par avance pour votre retour et vous souhaite une excellente journée.

Cordialement,`
  },
  {
    id: "m33",
    titre: "Suivi client + 6 mois",
    categorie: "Suivi",
    objet: "Suivi de votre situation à 6 mois – WallSwiss",
    corps: `Bonjour Monsieur / Madame,

J'espère que ce mail vous trouvera en pleine forme.

Comme vous le savez, chez WallSwiss nous accordons une importance particulière au suivi de nos clients, bien au-delà de la simple mise en place de solutions. Votre situation personnelle et vos objectifs peuvent évoluer et il est essentiel pour nous d'assurer que vos produits mis en place restent en adéquation avec vos besoins.

Si vous avez récemment eu des changements professionnels ou personnels, si vous avez des questions, ou tout simplement si vous souhaitez suivre vos contrats, nous vous proposons de reprendre rendez-vous avec votre conseiller, M. Haensler, pour faire un point complet sur votre situation.

Ce rendez-vous permettra notamment de :
- Revoir ensemble vos contrats actuels,
- Identifier si des ajustements sont nécessaires,
- Répondre à toutes vos interrogations,
- Vous assurer que votre stratégie patrimoniale reste optimisée.

N'hésitez pas à nous faire part de vos disponibilités ou à réserver directement un créneau via notre lien habituel :
[Lien de planification]

Nous restons naturellement à votre entière disposition si besoin.

Bien cordialement.`
  }
];

// ── Injection des polices : Montserrat conservé pour les SLIDES PDF ;
//    Inter ajouté pour la coquille (thème Aurora). ──
(function injectFonts(){
  if (typeof document === "undefined") return;
  const pre1 = document.createElement("link"); pre1.rel = "preconnect"; pre1.href = "https://fonts.googleapis.com"; document.head.appendChild(pre1);
  const pre2 = document.createElement("link"); pre2.rel = "preconnect"; pre2.href = "https://fonts.gstatic.com"; pre2.crossOrigin = "anonymous"; document.head.appendChild(pre2);
  const fontLink = document.createElement("link");
  fontLink.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap";
  fontLink.rel = "stylesheet";
  document.head.appendChild(fontLink);
})();

function computeProjections(data) {
  const initial = data.montantInvestissement !== "" && data.montantInvestissement !== undefined ? Number(data.montantInvestissement) : 100000;
  const fee = data.fraisSouscription !== "" && data.fraisSouscription !== undefined ? Number(data.fraisSouscription) : 3;
  const net = initial - (initial * fee / 100);
  const rP = Number(data.tauxPessimiste || 3) / 100;
  const rR = Number(data.tauxRealiste || 6) / 100;
  const rO = Number(data.tauxOptimiste || 9) / 100;

  let years = [0, 3, 5, 8, 10, 15];
  if (data.anneesProjection && data.anneesProjection.trim() !== "") {
    years = data.anneesProjection.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n >= 0);
    years = [...new Set(years)].sort((a,b) => a - b);
  }

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
  const duration = Math.max(1, 65 - age);

  const rP = Number(data.tauxPessimistePrev || 2) / 100;
  const rR = Number(data.tauxRealistePrev || 4) / 100;
  const rO = Number(data.tauxOptimistePrev || 6) / 100;
  const taxMarginalRate = 0.30;

  let uniqueYears;
  if (data.anneesProjection && data.anneesProjection.trim() !== "") {
    uniqueYears = data.anneesProjection.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n >= 0);
    uniqueYears = [...new Set(uniqueYears)].sort((a,b) => a - b);
  } else {
    const step = Math.max(1, Math.floor(duration / 4));
    let years = [];
    for(let i = 0; i <= duration; i+=step) { years.push(i); }
    if (years[years.length-1] !== duration) years.push(duration);
    uniqueYears = [...new Set(years)].sort((a,b) => a - b);
  }

  return uniqueYears.map(y => {
    const invested = annual * y;
    const months = y * 12;

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

function computeProjectionsLPP(data) {
  const initial = Number(data.capitalLibrePassage || 120000);
  const fee = data.fraisSouscriptionLpp !== "" && data.fraisSouscriptionLpp !== undefined ? Number(data.fraisSouscriptionLpp) : 1;
  const netInitial = initial - (initial * fee / 100);
  const age = Number(data.age || 40);
  const duration = Math.max(1, 65 - age);
  const rateClassic = 0.01;
  const rateSupletive = 0.0005; // 0.05% pour la Fondation Institutionnelle Supplétive
  const rateCLP = Number(data.tauxClp || 4) / 100;

  let uniqueYears;
  if (data.anneesProjection && data.anneesProjection.trim() !== "") {
    uniqueYears = data.anneesProjection.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n >= 0);
    uniqueYears = [...new Set(uniqueYears)].sort((a,b) => a - b);
  } else {
    uniqueYears = [...new Set([0, Math.round(duration*0.2), Math.round(duration*0.4), Math.round(duration*0.6), Math.round(duration*0.8), duration])].sort((a,b) => a - b);
  }

  return uniqueYears.map(y => ({
    year: y,
    age: age + y,
    supletive: Math.round(initial * Math.pow(1 + rateSupletive, y)),
    classic: Math.round(initial * Math.pow(1 + rateClassic, y)),
    clp: Math.round(netInitial * Math.pow(1 + rateCLP, y)),
    rateCLP,
    fee
  }));
}

function computeProjectionsAV(data, index = 1) {
  const initial = Number(index === 2 ? (data.montantInvestissement2 || 200000) : (data.montantInvestissement || 100000));
  const monthly = Number(index === 2 ? (data.capaciteEpargne2 || 1000) : (data.capaciteEpargne || 500));
  const duration = Math.min(30, Math.max(1, Number(data.dureeProjectionAv || 15))); // Permet d'aller jusqu'à 30 ans
  const fee = Number(data.fraisSouscription || 0) / 100;

  // Prise en compte financière stricte (droits d'entrée prélevés sur chaque versement)
  const netInitial = initial - (initial * fee);
  const netMonthly = monthly - (monthly * fee);

  const r1 = Number(data.tauxPessimiste || 3) / 100;
  const r2 = Number(data.tauxRealiste || 6) / 100;
  const r3 = Number(data.tauxOptimiste || 9) / 100;

  const rows = [];

  // Limite à 10 lignes maximum pour que le tableau reste lisible sur la slide
  let yearsToShow = [];
  if (data.anneesProjection && data.anneesProjection.trim() !== "") {
    yearsToShow = data.anneesProjection.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
    yearsToShow = [...new Set(yearsToShow)].sort((a,b) => a - b);
  } else if (duration <= 10) {
    for(let i = 1; i <= duration; i++) yearsToShow.push(i);
  } else {
    yearsToShow.push(1);
    const step = (duration - 1) / 9;
    for(let i = 1; i < 9; i++) {
       yearsToShow.push(Math.round(1 + step * i));
    }
    yearsToShow.push(duration);
    yearsToShow = [...new Set(yearsToShow)].sort((a,b) => a - b);
  }

  for (let y of yearsToShow) {
    const months = y * 12;
    const versements = initial + (monthly * months);

    const calc = (rate) => {
      if (rate === 0) return versements; // Si taux nul, on simule sans intérêt
      const rM = rate / 12;
      const fvInitial = netInitial * Math.pow(1 + rM, months);
      const fvMonthly = netMonthly * ((Math.pow(1 + rM, months) - 1) / rM);
      return fvInitial + fvMonthly;
    };

    const val1 = Math.round(calc(r1));
    const val2 = Math.round(calc(r2));
    const val3 = Math.round(calc(r3));

    rows.push({
      year: y,
      versements,
      val1, pv1: val1 - versements,
      val2, pv2: val2 - versements,
      val3, pv3: val3 - versements
    });
  }
  return rows;
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
// ⚠️ Ces composants pilotent les rapports PDF envoyés aux clients :
//    charte figée (oxblood C.primary #692102, Times New Roman, coins carrés).
//    Ils utilisent uniquement les clés d'origine de C → rendu inchangé.

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
  const fullName = data.isCouple && data.prenomConjoint
    ? `${data.prenom} ${(data.nom || "").toUpperCase()} & ${data.prenomConjoint} ${(data.nomConjoint || "").toUpperCase()}`
    : `${data.prenom} ${(data.nom || "").toUpperCase()}`;
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
          <div style={{ color: C.white, fontSize: 22, fontWeight: 600 }}>{data.conseiller || "Votre Conseiller"}</div>
          <div style={{ color: C.gold, fontSize: 14, fontWeight: 500, marginTop: 6 }}>{data.titreConseiller || "Conseiller en Gestion de Patrimoine"}</div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 2 — Table des matières SwissQuote
function SlideTOC({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const isParFinance = data.assetManager === "ParFinance";
  const hidden = data.hiddenSlides || [];
  const getPage = (origIdx) => { let count = 0; for(let i=0; i<=origIdx; i++) if(!hidden.includes(i)) count++; return count; };

  let items = [
    { title: "Qui sommes-nous ? Notre philosophie", origIdx: 2 },
    { title: "Notre cabinet en chiffres", origIdx: 3 },
    { title: "Résumé de votre situation personnelle", origIdx: 4 },
    { title: "Pourquoi Swissquote est une banque fiable", origIdx: 5 },
    { title: "Avantages WallSwiss BY Swissquote", origIdx: 6 },
    { title: "Solution — Compte-titres", origIdx: 8 },
  ];

  let nextIdx = 9;

  if (isParFinance) {
    items.push({ title: "Votre Asset Manager : ParFinance", origIdx: nextIdx++ });
    items.push({ title: "Factsheet | Aries Portfolio", origIdx: nextIdx++ });
    items.push({ title: "Stratégie : Les principales positions", origIdx: nextIdx++ });
  } else {
    items.push({ title: "Fonds NS (CH) Swiss Excellence DPM", origIdx: nextIdx++ });
  }

  items.push(
    { title: "Projections financières", origIdx: nextIdx++ },
    { title: "Avantages tarifaires WS Premium", origIdx: nextIdx++ },
    { title: "Comparatif bancaire", origIdx: nextIdx++ },
    { title: "Votre application de suivi", origIdx: nextIdx++ },
    { title: "Synthèse & Contact", origIdx: nextIdx }
  );

  items = items.filter(item => !hidden.includes(item.origIdx));

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
                {String(getPage(item.origIdx)).padStart(2, '0')}
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
         <img src="/image page3.jpg" alt="Fond" className="pdf-image" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
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
    { val: "ACCRÉDITÉ", label: <>FINMA : F01496591<br/>ORIAS : 24004947</> },
    { val: "+300M CHF", label: "SOUS GESTION" },
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
  const fullName = data.isCouple && data.prenomConjoint
    ? `${data.prenom} ${(data.nom || "").toUpperCase()} & ${data.prenomConjoint} ${(data.nomConjoint || "").toUpperCase()}`
    : `${data.prenom} ${(data.nom || "").toUpperCase()}`;
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
                  ["Âge", data.age ? (data.isCouple && data.ageConjoint ? `${data.age} ans / ${data.ageConjoint} ans` : `${data.age} ans`) : null],
                  ["Profession", data.isCouple && data.professionConjoint ? `${data.profession} / ${data.professionConjoint}` : (data.profession || null)],
                  ["Nationalité", data.nationalite || null],
                  ["Statut civil", data.statut || null],
                  ...(data.customClientFields || []).filter(f => f.label && f.value).map(f => [f.label, f.value])
                ].filter(([k, v]) => v && v !== "-" && String(v).trim() !== "").map(([k, v], i, arr) => (
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
                  ["Revenus annuels bruts", data.revenus ? `CHF ${fmt(data.revenus)}.-` : null],
                  ["Capacité d'épargne", data.capaciteEpargne ? `CHF ${fmt(data.capaciteEpargne)}.- / mois` : null],
                  ["Fortune globale estimée", data.fortuneGlobale ? `CHF ${fmt(data.fortuneGlobale)}.-` : null],
                ].filter(([k, v]) => v && v !== "-" && String(v).trim() !== "").map(([k, v], i, arr) => (
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 32px", flex: 1, alignContent: "center" }}>
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

// Slide 9 — La solution compte-titres
function SlideCompteTitre({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const bubbles = ["Épargne en cas de coup dur", "Financer un projet", "Disponibilité de l'épargne", "Complément de revenu pour la retraite", "Cadre fiscal avantageux", "Optimisation de la transmission"];
  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
        <div>
          <ReportTitle title="La solution" highlight="compte-titres" subtitle="STRATÉGIE" />
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

// Slide 10 — Fonds (NS ou ParFinance)
function SlideFund({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const isParFinance = data.assetManager === "ParFinance";

  if (isParFinance) {
    const parFinancePositions = [
      { title: "1. First Trust Water ETF (FIW)", desc: "Axé sur le secteur de l'eau, un domaine crucial en pleine expansion. Idéal pour s'exposer à un secteur durable nécessaire avec une performance solide." },
      { title: "2. Global X Artificial Intelligence & Technology ETF (AIQ)", desc: "Capitalise sur l'essor de l'IA et du big data via des entreprises innovantes. Pour une exposition aux technologies émergentes et une croissance long terme." },
      { title: "3. Global X US Infrastructure Development ETF (PAVE)", desc: "Mise sur le développement des infrastructures américaines (matériaux, ingénierie) bénéficiant de financements publics importants." },
      { title: "4. iShares Global Healthcare ETF (IXJ)", desc: "Exposition mondiale au secteur de la santé (biotech, dispositifs médicaux) pour répondre aux besoins de la population vieillissante." },
      { title: "5. iShares MSCI KLD 400 Social ETF (DSI)", desc: "Applique des critères ESG ciblés sur des entreprises aux pratiques durables et éthiques, tout en bénéficiant de rendements compétitifs." },
      { title: "6. iShares S&P 500 Value ETF (IVE)", desc: "Se concentre sur les actions de valeur sous-évaluées du S&P 500. Idéal pour une approche prudente axée sur la stabilité." },
      { title: "7. iShares Semiconductor ETF (SOXX)", desc: "Investit dans les semi-conducteurs, essentiels dans l'ère numérique. Adapté aux investisseurs ayant une tolérance au risque et attirés par l'innovation." },
      { title: "8. iShares U.S. Consumer Staples ETF (IYK)", desc: "Cible les biens de consommation de base, offrant une stabilité en période d'incertitude économique." },
      { title: "9. Schwab U.S. Large-Cap Growth ETF (SCHG)", desc: "Sélectionne des actions de croissance de grandes entreprises américaines privilégiant les leaders dans leurs secteurs." },
      { title: "10. Technology Select Sector SPDR Fund (XLK)", desc: "Centré sur les géants technologiques américains. Un fonds pour les investisseurs optimistes sur le secteur numérique." },
      { title: "11. VanEck Oil Services ETF (OIH)", desc: "Spécialisé dans les services pétroliers et l'énergie. Adapté pour naviguer dans un secteur volatil mais potentiellement lucratif." },
      { title: "12. Vanguard Health Care ETF (VHT)", desc: "Investit dans un large éventail d'entreprises du secteur de la santé recherchant une stabilité et une croissance progressive." }
    ];

    return (
      <div style={slideBase}>
        {accentBar()}
        {logoCorner()}
        <div style={{ padding: "48px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
          <ReportTitle title="Un investissement qui a du" highlight="sens" subtitle="LES PRINCIPALES POSITIONS" />
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 40, rowGap: 14, overflow: "hidden", marginTop: -10 }}>
            {parFinancePositions.map((pos, i) => (
              <div key={i}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, marginBottom: 2 }}>{pos.title}</div>
                <div style={{ fontSize: 9, color: C.darkGray, lineHeight: 1.4, textAlign: "justify" }}>{pos.desc}</div>
              </div>
            ))}
          </div>
        </div>
        {footer(fullName)}
      </div>
    );
  }

  return (
    <div style={slideBase}>
      <div style={{ padding: "32px 80px 48px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ border: `3px solid ${C.gold}`, padding: "24px 32px", boxSizing: "border-box", background: C.white }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 26, fontWeight: 700, color: C.primary }}>NS (CH) FUNDS — Swiss Excellence DPM CHF</div>
            <div style={{ fontSize: 12, color: C.gray, marginTop: 6 }}>Fonds actions suisses — Synthèse institutionnelle (NS Partners)</div>
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

function SlideParFinanceIntro({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Votre Asset Manager :" highlight="ParFinance" subtitle="GESTION INDÉPENDANTE DE HAUT NIVEAU" />
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <EditableText editMode={editMode} value={data.texts?.parFinanceP1} onChange={v => onTextChange("parFinanceP1", v)} style={{ fontSize: 14, color: C.darkGray, lineHeight: 1.7, marginBottom: 24, textAlign: "justify" }} />
            <EditableText editMode={editMode} value={data.texts?.parFinanceP2} onChange={v => onTextChange("parFinanceP2", v)} style={{ fontSize: 14, color: C.darkGray, lineHeight: 1.7, marginBottom: 24, textAlign: "justify" }} />
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.05)", minHeight: 280 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: C.primary, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.1em" }}>ParFinance</div>
            <div style={{ width: 40, height: 3, background: C.gold, marginBottom: 24 }} />
            <div style={{ fontSize: 13, color: C.gray, textAlign: "center", lineHeight: 1.6 }}>
              Société de gestion indépendante basée à Genève, spécialisée dans la création de portefeuilles performants et sur-mesure.
            </div>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlideParFinanceFactsheet({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;

  const topHoldings = [
    { name: "SPDR® Blmbg 1-...ill ETF", weight: "7.03%" },
    { name: "iShares US Consu..les ETF", weight: "5.59%" },
    { name: "First Trust Water ETF", weight: "4.84%" },
    { name: "Northern Oil & Gas Inc", weight: "4.50%" },
    { name: "Meta Platforms Inc", weight: "3.93%" },
    { name: "Netflix Inc", weight: "3.50%" },
    { name: "Microsoft Corp", weight: "3.45%" },
    { name: "Global X US Infras.Dev ETF", weight: "3.42%" },
    { name: "iShares MSCI KLD.ial ETF", weight: "3.09%" },
    { name: "iShares S&P 500 Value ETF", weight: "3.02%" }
  ];

  const topUnderlying = [
    { name: "Microsoft Corp", weight: "4.72%" },
    { name: "Northern Oil & Gas Inc", weight: "4.50%" },
    { name: "Meta Platforms Inc", weight: "4.10%" },
    { name: "Netflix Inc", weight: "3.60%" },
    { name: "The Home Depot Inc", weight: "2.98%" },
    { name: "NVIDIA Corp", weight: "2.90%" },
    { name: "GE Vernova Inc", weight: "2.63%" },
    { name: "Apple Inc", weight: "2.43%" },
    { name: "Caterpillar Inc", weight: "2.25%" },
    { name: "Freeport-McMoRan Inc", weight: "2.25%" }
  ];

  // Simulation visuelle du graphique améliorée
  const chartPoints = "0,160 20,150 40,175 60,180 80,140 100,165 120,160 140,165 160,180 180,170 200,175 220,180 240,175 260,160 280,170 300,175 320,180 340,120 360,110 380,115 400,130 420,110 440,115 460,125 480,90 500,100 520,70 540,110 560,95 580,70 600,75 620,40";
  const areaPoints = `0,200 ${chartPoints} 620,200`;

  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "48px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Un investissement qui a du" highlight="sens" subtitle="FACTSHEET | ARIES PORTOFOLIO (USD)" />

        <div style={{ flex: 1, display: "flex", gap: 40, minHeight: 0, marginTop: -10 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.primaryDark, marginBottom: 12, borderBottom: `2px solid ${C.primaryDark}`, paddingBottom: 8 }}>
              Performances d'ARIES
            </div>
            <div style={{ fontSize: 9, color: C.gray, marginBottom: 16 }}>
              • 1_ARIES PORTFOLIO USD - CUSTODY BANK UBS - ASSET MANAGEMENT PARFINANCE - ISIN CH0511368091 V2 (P:1711097) TOTAL RETURN
            </div>
            <div style={{ flex: 1, position: "relative", border: `1px solid ${C.lightGray}`, background: C.white, overflow: "visible" }}>
              <svg viewBox="-10 -10 680 230" preserveAspectRatio="none" style={{ width: "100%", height: "100%", position: "absolute", bottom: 0, left: 0, overflow: "visible" }}>
                 <line x1="0" y1="40" x2="620" y2="40" stroke="#E5E7EB" strokeWidth="1" />
                 <line x1="0" y1="120" x2="620" y2="120" stroke="#E5E7EB" strokeWidth="1" />
                 <line x1="0" y1="200" x2="620" y2="200" stroke="#E5E7EB" strokeWidth="1" />

                 <text x="628" y="124" fontSize="11" fill="#6B7280">20.00%</text>
                 <text x="628" y="204" fontSize="11" fill="#6B7280">0.00%</text>

                 <line x1="100" y1="200" x2="100" y2="205" stroke="#E5E7EB" strokeWidth="1" />
                 <text x="100" y="218" fontSize="10" fill="#6B7280" textAnchor="middle">JAN '23</text>
                 <line x1="200" y1="200" x2="200" y2="205" stroke="#E5E7EB" strokeWidth="1" />
                 <text x="200" y="218" fontSize="10" fill="#6B7280" textAnchor="middle">JUL '23</text>
                 <line x1="300" y1="200" x2="300" y2="205" stroke="#E5E7EB" strokeWidth="1" />
                 <text x="300" y="218" fontSize="10" fill="#6B7280" textAnchor="middle">JAN '24</text>
                 <line x1="400" y1="200" x2="400" y2="205" stroke="#E5E7EB" strokeWidth="1" />
                 <text x="400" y="218" fontSize="10" fill="#6B7280" textAnchor="middle">JUL '24</text>
                 <line x1="500" y1="200" x2="500" y2="205" stroke="#E5E7EB" strokeWidth="1" />
                 <text x="500" y="218" fontSize="10" fill="#6B7280" textAnchor="middle">JAN '25</text>
                 <line x1="600" y1="200" x2="600" y2="205" stroke="#E5E7EB" strokeWidth="1" />
                 <text x="600" y="218" fontSize="10" fill="#6B7280" textAnchor="middle">JUL '25</text>

                 <polygon points={areaPoints} fill="rgba(139, 92, 246, 0.2)" />
                 <polyline points={chartPoints} fill="none" stroke="#8b5cf6" strokeWidth="2.5" />

                 <rect x="625" y="30" width="40" height="20" fill="#8b5cf6" rx="4"/>
                 <text x="645" y="44" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">31.78%</text>
              </svg>
            </div>
          </div>

          <div style={{ width: "260px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.darkGray, marginBottom: 8 }}>Top 10 Holdings</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.mediumGray}` }}>
                    <th style={{ textAlign: "left", paddingBottom: 4, color: C.gray, fontWeight: 600 }}>HOLDING</th>
                    <th style={{ textAlign: "right", paddingBottom: 4, color: C.gray, fontWeight: 600 }}>WEIGHT</th>
                  </tr>
                </thead>
                <tbody>
                  {topHoldings.map((h, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.lightGray}` }}>
                      <td style={{ padding: "4px 0", color: C.darkGray, fontWeight: 600 }}>{h.name}</td>
                      <td style={{ padding: "4px 0", textAlign: "right", color: C.gray }}>{h.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.darkGray, marginBottom: 8 }}>Top 10 Underlying Holdings</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.mediumGray}` }}>
                    <th style={{ textAlign: "left", paddingBottom: 4, color: C.gray, fontWeight: 600 }}>HOLDING</th>
                    <th style={{ textAlign: "right", paddingBottom: 4, color: C.gray, fontWeight: 600 }}>WEIGHT</th>
                  </tr>
                </thead>
                <tbody>
                  {topUnderlying.map((h, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.lightGray}` }}>
                      <td style={{ padding: "4px 0", color: C.darkGray, fontWeight: 600 }}>{h.name}</td>
                      <td style={{ padding: "4px 0", textAlign: "right", color: C.gray }}>{h.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
  const montant = data.montantInvestissement !== "" && data.montantInvestissement !== undefined ? Number(data.montantInvestissement) : 100000;
  const frais = data.fraisSouscription !== "" && data.fraisSouscription !== undefined ? Number(data.fraisSouscription) : 3;

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
        <ReportTitle title="Vos objectifs sur le" highlight="compte-titres" subtitle="SIMULATION FINANCIÈRE" />
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 40, alignItems: "center", minHeight: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", paddingRight: 20 }}>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: C.darkGray, margin: "0 0 16px", textAlign: "justify" }}>
              Ici, nous vous conseillons d'optimiser votre trésorerie actuelle avec un compte-titres chez <strong>SwissQuote</strong> sur la solution de placement avec un dépôt initial de <strong>CHF {fmt(montant)}.-</strong>
            </p>
            <p style={{ fontSize: 13, color: C.gray, margin: "0 0 32px", textAlign: "justify" }}>
              Nous appliquons des droits d'entrée de {frais}% du montant investi soit {fmt(montant * frais / 100)}.-
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

          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 32, fontWeight: 700, color: C.primary, marginBottom: 6 }}>{data.conseiller || "Votre Conseiller"}</div>
          <div style={{ color: C.gray, fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 40 }}>{data.titreConseiller || "Conseiller en Gestion de Patrimoine"}</div>

          <div style={{ display: "grid", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: "0px", background: "rgba(105,33,2,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, fontWeight: 700, fontSize: 15 }}>T</div>
              <span style={{ fontSize: 15, color: C.darkGray, fontWeight: 600 }}>{data.telephone || "+41 XX XXX XX XX"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: "0px", background: "rgba(105,33,2,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, fontWeight: 700, fontSize: 15 }}>E</div>
              <span style={{ fontSize: 15, color: C.darkGray, fontWeight: 600 }}>{data.email || "contact@wallswiss.ch"}</span>
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

function SlidePrevoyanceIntro({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Le système des" highlight="3 piliers suisses" subtitle="PRÉVOYANCE" />

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 48, alignItems: "center" }}>

          {/* Colonne de gauche : Explications des piliers */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: C.white, borderLeft: `4px solid ${C.darkGray}`, padding: "16px 24px", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.darkGray }}>1er Pilier (AVS/AI)</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: "0.05em" }}>Besoins vitaux</div>
              </div>
              <EditableText editMode={editMode} value={data.texts?.prevIntroP1} onChange={v => onTextChange("prevIntroP1", v)} style={{ fontSize: 13, color: C.darkGray, lineHeight: 1.6, margin: 0 }} />
            </div>

            <div style={{ background: C.white, borderLeft: `4px solid ${C.primary}`, padding: "16px 24px", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.primary }}>2ème Pilier (LPP)</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>Maintien niveau de vie</div>
              </div>
              <EditableText editMode={editMode} value={data.texts?.prevIntroP2} onChange={v => onTextChange("prevIntroP2", v)} style={{ fontSize: 13, color: C.darkGray, lineHeight: 1.6, margin: 0 }} />
            </div>

            <div style={{ background: C.white, borderLeft: `4px solid ${C.gold}`, padding: "16px 24px", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.gold }}>3ème Pilier (3A/3B)</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.05em" }}>Combler les lacunes</div>
              </div>
              <EditableText editMode={editMode} value={data.texts?.prevIntroP3} onChange={v => onTextChange("prevIntroP3", v)} style={{ fontSize: 13, color: C.darkGray, lineHeight: 1.6, margin: 0 }} />
            </div>
          </div>

          {/* Colonne de droite : Graphique empilé des 100% */}
          <div style={{ display: "flex", justifyContent: "center", height: "100%", padding: "10px 0" }}>
            <div style={{ position: "relative", width: 280, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>

              {/* Ligne cible 100% */}
              <div style={{ position: "absolute", top: 0, left: -20, right: -40, borderTop: `2px dashed ${C.gray}` }}>
                 <div style={{ position: "absolute", top: -20, right: 0, fontSize: 14, fontWeight: 800, color: C.darkGray }}>100% du salaire</div>
              </div>

              {/* Ligne cible 60% */}
              <div style={{ position: "absolute", bottom: "60%", left: -20, right: -40, borderTop: `2px dashed ${C.primary}` }}>
                 <div style={{ position: "absolute", top: -20, right: 0, fontSize: 14, fontWeight: 800, color: C.primary }}>~60% du salaire</div>
              </div>

              {/* Blocs du graphique */}
              <div style={{ height: "40%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white", borderBottom: "none", zIndex: 2, boxShadow: "0 -4px 10px rgba(0,0,0,0.05)" }}>
                <div style={{ color: C.white, fontWeight: 800, fontSize: 18, textAlign: "center" }}>3ème Pilier<br/><span style={{fontSize: 12, fontWeight: 600}}>Prévoyance privée</span></div>
              </div>

              <div style={{ height: "30%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white", borderBottom: "none", zIndex: 2, boxShadow: "0 -4px 10px rgba(0,0,0,0.05)" }}>
                <div style={{ color: C.white, fontWeight: 800, fontSize: 18, textAlign: "center" }}>2ème Pilier<br/><span style={{fontSize: 12, fontWeight: 600}}>LPP</span></div>
              </div>

              <div style={{ height: "30%", background: C.darkGray, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white", zIndex: 2, boxShadow: "0 -4px 10px rgba(0,0,0,0.05)" }}>
                <div style={{ color: C.white, fontWeight: 800, fontSize: 18, textAlign: "center" }}>1er Pilier<br/><span style={{fontSize: 12, fontWeight: 600}}>AVS/AI</span></div>
              </div>

            </div>
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
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Avantages de la" highlight="Prévoyance 3A/3B" subtitle="LEVIERS DE CRÉATION DE RICHESSE" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 48px", flex: 1, alignContent: "center" }}>
          {[
            { title: "Optimisation Fiscale Immédiate", desc: "Déduction des versements de votre revenu imposable (Pilier 3A) et exonération d'impôt sur la fortune et le rendement pendant toute la durée du contrat." },
            { title: "Croissance du Capital", desc: "Rendement supérieur à l'épargne bancaire grâce à l'investissement sur les marchés financiers via des fonds de placement de premier plan." },
            { title: "Couverture Risques (Assurance)", desc: "Protection financière de votre famille en cas de décès et libération du paiement des primes en cas d'incapacité de gain." },
            { title: "Souplesse et Flexibilité", desc: "Possibilité d'adapter les versements selon l'évolution de vos revenus et d'utiliser le capital pour l'achat de votre résidence principale." },
          ].map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ color: C.gold, fontSize: 24, marginTop: -4 }}>•</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.primaryDark, marginBottom: 4 }}>{a.title}</div>
                <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.6, textAlign: "justify" }}>{a.desc}</div>
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
          <ReportTitle title="Solution — Prévoyance" highlight="& Assurance Vie" subtitle="STRATÉGIE" />
          <EditableText editMode={editMode} value={data.texts?.prevoyanceSol1} onChange={v => onTextChange("prevoyanceSol1", v)} style={{ fontSize: 13.5, lineHeight: 1.8, color: C.darkGray, margin: "0 0 16px", textAlign: "justify" }} />
          <EditableText editMode={editMode} value={data.texts?.prevoyanceSol2} onChange={v => onTextChange("prevoyanceSol2", v)} style={{ fontSize: 13.5, lineHeight: 1.8, color: C.darkGray, margin: "0 0 16px", textAlign: "justify" }} />
          <EditableText editMode={editMode} value={data.texts?.prevoyanceSol3} onChange={v => onTextChange("prevoyanceSol3", v)} style={{ fontSize: 13.5, lineHeight: 1.8, color: C.darkGray, margin: 0, textAlign: "justify" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 24, boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
            <div style={{ fontSize: 11, color: C.gray, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Compagnie Partenaire</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.primaryDark }}>{data.compagniePrevoyance || "Liechtenstein Life"}</div>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 24, boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
            <div style={{ fontSize: 11, color: C.gray, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Votre Mensualité</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.primaryDark }}>CHF {fmt(data.capaciteEpargne || 500)}.-</div>
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
        <ReportTitle title="Couvertures de risque et" highlight="garanties" subtitle="PROTECTION" />
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32, alignItems: "center" }}>
          <div style={{ background: "rgba(105,33,2,0.05)", padding: 32, borderTop: `4px solid ${C.primary}`, height: "260px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: C.primary, marginBottom: 16 }}><Icons.Shield size={32} /></div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.primaryDark, marginBottom: 12 }}>Libération des primes</div>
            <EditableText editMode={editMode} value={data.texts?.prevCouvP1} onChange={v => onTextChange("prevCouvP1", v)} style={{ fontSize: 13, color: C.darkGray, lineHeight: 1.6, flex: 1 }} />
          </div>
          <div style={{ background: "rgba(165,149,104,0.1)", padding: 32, borderTop: `4px solid ${C.gold}`, height: "260px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: C.gold, marginBottom: 16 }}><Icons.User size={32} /></div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.primaryDark, marginBottom: 12 }}>Capital Décès</div>
            <EditableText editMode={editMode} value={data.texts?.prevCouvP2} onChange={v => onTextChange("prevCouvP2", v)} style={{ fontSize: 13, color: C.darkGray, lineHeight: 1.6, flex: 1 }} />
          </div>
          <div style={{ background: C.lightGray, padding: 32, borderTop: `4px solid ${C.gray}`, height: "260px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: C.gray, marginBottom: 16 }}><Icons.TrendUp size={32} /></div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.primaryDark, marginBottom: 12 }}>Rente Invalidité (Option)</div>
            <EditableText editMode={editMode} value={data.texts?.prevCouvP3} onChange={v => onTextChange("prevCouvP3", v)} style={{ fontSize: 13, color: C.darkGray, lineHeight: 1.6, flex: 1 }} />
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlidePrevoyanceFonds({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Stratégie :" highlight="Fonds de placement" subtitle="CROISSANCE DU CAPITAL" />
        <div style={{ flex: 1, display: "flex", gap: 64, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, color: C.primaryDark, fontWeight: 600, marginBottom: 16, lineHeight: 1.6 }}>
              {data.texts?.prevFondsIntro} <strong style={{ color: C.gold }}>{data.compagniePrevoyance || "Liechtenstein Life"}</strong>.
            </div>
            <EditableText editMode={editMode} value={data.texts?.strategieFonds} onChange={v => onTextChange("strategieFonds", v)} style={{ fontSize: 14, color: C.darkGray, lineHeight: 1.8, padding: 24, background: C.lightGray, borderLeft: `4px solid ${C.primary}` }} />
          </div>
          <div style={{ width: 380 }}>
            <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 11, color: C.gray, textTransform: "uppercase", fontWeight: 700, marginBottom: 16 }}>Répartition Cible</div>
              {["Liquidités : 0 - 10%", "Obligations : 10 - 40%", "Actions : 50 - 90%", "Immobilier : 0 - 10%"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: i===2 ? C.primary : C.gold }} />
                  <span style={{ fontSize: 14, color: C.darkGray, fontWeight: i===2 ? 700 : 500 }}>{item}</span>
                </div>
              ))}
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.lightGray}`, fontSize: 12, color: C.gray, fontStyle: "italic" }}>
                *La pondération exacte dépend du profil de risque choisi : <strong>{data.profilRisque || "Équilibré"}</strong>.
              </div>
            </div>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlideTOCPrevoyance({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const hidden = data.hiddenSlides || [];
  const getPage = (origIdx) => { let count = 0; for(let i=0; i<=origIdx; i++) if(!hidden.includes(i)) count++; return count; };

  let items = [
    { title: "Qui sommes-nous ? Notre philosophie", origIdx: 2 },
    { title: "Notre cabinet en chiffres", origIdx: 3 },
    { title: "Résumé de votre situation personnelle", origIdx: 4 },
    { title: "Le système des 3 piliers suisses", origIdx: 5 },
    { title: "Avantages de la Prévoyance 3A/3B", origIdx: 6 },
    { title: "Solution — Prévoyance & Assurance Vie", origIdx: 8 },
    { title: "Couvertures de risque et garanties", origIdx: 9 },
    { title: "Stratégie : Fonds de placement", origIdx: 10 },
  ];

  let nextIdx = 11;
  if (data.showPrevoyanceComparatif !== false) {
      items.push({ title: "Comparatif banque commerciale & Assurance", origIdx: nextIdx++ });
  }

  if (data.profilRisque === "Dynamique") {
      items.push({ title: "Détail Stratégie Dynamique & Performances", origIdx: nextIdx++ });
  }
  items.push({ title: "Comprendre la Valeur de Rachat", origIdx: nextIdx++ });

  if(data.optiFiscale) {
      items.push({ title: "Impact & Optimisation Fiscale", origIdx: nextIdx++ });
  }
  items.push({ title: "Projections financières et capitalisation", origIdx: nextIdx++ });
  items.push({ title: "Synthèse & Contact", origIdx: nextIdx });

  items = items.filter(item => !hidden.includes(item.origIdx));

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
                {String(getPage(item.origIdx)).padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlidePrevoyanceComparatif({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;

  const rP_bank = 0.001; // 0.10%
  const rR_bank = 0.005; // 0.50%
  const rO_bank = 0.01;  // 1%

  const rP_ass = Number(data.tauxPessimistePrev || 2) / 100;
  const rR_ass = Number(data.tauxRealistePrev || 4) / 100;
  const rO_ass = Number(data.tauxOptimistePrev || 6) / 100;

  const fixedYears = [0, 5, 10, 15]; // Simulation standard sur 15 ans
  const baseCapital = 100000;

  const calcLumpSum = (rate, y) => baseCapital * Math.pow(1 + rate, y);

  const bankData = fixedYears.map(y => ({
    year: y,
    pessimiste: calcLumpSum(rP_bank, y),
    realiste: calcLumpSum(rR_bank, y),
    optimiste: calcLumpSum(rO_bank, y)
  }));

  const assData = fixedYears.map(y => ({
    year: y,
    pessimiste: calcLumpSum(rP_ass, y),
    realiste: calcLumpSum(rR_ass, y),
    optimiste: calcLumpSum(rO_ass, y)
  }));

  const colors = ["#9CA3AF", C.gold, C.primaryDark];
  const formatPct = (val) => (val * 100).toFixed(1).replace('.0', '') + "%";

  const renderChart = (title, dataArr, labels, isBank) => {
    const svgW = 440; const svgH = 260;
    const padL = 60; const padR = 20; const padT = 20; const padB = 30;
    const w = svgW - padL - padR; const h = svgH - padT - padB;

    let gridSteps = [];
    let gridMax = 100000;

    if (isBank) {
      gridMax = 140000;
      for(let i=0; i<=140000; i+=20000) gridSteps.push(i);
    } else {
      const maxObj = dataArr[dataArr.length-1].optimiste;
      gridMax = Math.ceil(maxObj / 100000) * 100000 || 500000;
      if (gridMax < 500000) gridMax = 500000;
      const step = gridMax / 5;
      for(let i=0; i<=gridMax; i+=step) gridSteps.push(i);
    }

    const getX = (i) => padL + (i / (dataArr.length - 1)) * w;
    const getY = (val) => padT + h - (val / gridMax) * h;

    const dP = dataArr.map((r, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(r.pessimiste)}`).join(' ');
    const dR = dataArr.map((r, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(r.realiste)}`).join(' ');
    const dO = dataArr.map((r, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(r.optimiste)}`).join(' ');

    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 20, fontWeight: 700, color: C.primaryDark, marginBottom: 16, textAlign: "center", textTransform: "uppercase" }}>{title}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 20, fontSize: 12, fontWeight: 500 }}>
           <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: "50%", background: colors[0] }} /> Pessimiste {labels[0]}</div>
           <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: "50%", background: colors[1] }} /> Réaliste {labels[1]}</div>
           <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: "50%", background: colors[2] }} /> Optimiste {labels[2]}</div>
        </div>
        <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: "visible" }}>
          {gridSteps.map(val => {
            const y = getY(val);
            return (
              <g key={val}>
                <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="#E5E7EB" strokeWidth="1" />
                <text x={padL - 10} y={y + 4} fontSize="11" fill="#374151" textAnchor="end">{val}</text>
              </g>
            );
          })}
          <line x1={padL} y1={getY(0)} x2={svgW - padR} y2={getY(0)} stroke="#E5E7EB" strokeWidth="1" />
          {dataArr.map((r, i) => (
            <text key={i} x={getX(i)} y={svgH - 5} fontSize="12" fill="#374151" textAnchor="middle">N+{r.year}</text>
          ))}
          <path d={dP} fill="none" stroke={colors[0]} strokeWidth="3" />
          <path d={dR} fill="none" stroke={colors[1]} strokeWidth="3" />
          <path d={dO} fill="none" stroke={colors[2]} strokeWidth="3" />
          {dataArr.map((r, i) => (
            <g key={i}>
              <circle cx={getX(i)} cy={getY(r.pessimiste)} r="4" fill={colors[0]} />
              <circle cx={getX(i)} cy={getY(r.realiste)} r="4" fill={colors[1]} />
              <circle cx={getX(i)} cy={getY(r.optimiste)} r="4" fill={colors[2]} />
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div style={slideBase}>
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Comparatif banque commerciale &" highlight="ASSURANCE" />
        <p style={{ fontSize: 14, color: C.darkGray, marginBottom: 40, lineHeight: 1.6 }}>
          Ici, nous comparons le rendement actuel moyen des Prévoyances Individuelle en banque commerciale et en Assurance chez {data.compagniePrevoyance || "Liechtenstein"}. 3 scénarios de performances sont calculés pour chacune de ces solutions.
        </p>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "flex-start" }}>
          {renderChart("PROJECTIONS BANQUE COMMERCIALE*", bankData, ["0,10%", "0,50%", "1%"], true)}
          {renderChart("PROJECTIONS ASSURANCE*", assData, [formatPct(rP_ass), formatPct(rR_ass), formatPct(rO_ass)], false)}
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}
function SlidePrevoyanceFondsDynamique({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;

  const [fundPerformanceAPI, setFundPerformanceAPI] = useState(null);

  useEffect(() => {
    // 🔗 ÉTAPE 1 : Collez ici le lien CSV de votre Google Sheet publié
    const googleSheetCsvUrl = "VOTRE_LIEN_GOOGLE_SHEET_CSV_ICI";

    // Données de secours (affichées par défaut si le lien n'est pas configuré ou échoue)
    const fallbackData = {
      "IE00B5BMR087": { name: "iShares Core S&P 500 UCITS ETF", "3m": "+0.7%", "1y": "+16.7%", "3y": "+79.3%", "5y": "+91.5%", "10y": "+309.5%", "10y_ann": "+15.1%" },
      "IE00B53SZB19": { name: "iShares NASDAQ 100 UCITS ETF", "3m": "-1.8%", "1y": "+19.8%", "3y": "+109.4%", "5y": "+96.8%", "10y": "+522.2%", "10y_ann": "+20.1%" },
      "CH0237935637": { name: "iShares Swiss Dividend ETF (CH)", "3m": "-1.4%", "1y": "+4.1%", "3y": "+48.6%", "5y": "+72.0%", "10y": "+197.2%", "10y_ann": "+11.5%" },
      "DE000A0S9GB0": { name: "Xetra-Gold ETC", "3m": "+7.2%", "1y": "+42.6%", "3y": "+116.7%", "5y": "+172.1%", "10y": "+258.1%", "10y_ann": "+13.6%" },
      "LU0328475792": { name: "Xtrackers Stoxx Europe 600 UCITS ETF 1C", "3m": "-1.7%", "1y": "+7.1%", "3y": "+42.1%", "5y": "+55.6%", "10y": "+102.4%", "10y_ann": "+7.3%" }
    };

    if (!googleSheetCsvUrl || googleSheetCsvUrl === "VOTRE_LIEN_GOOGLE_SHEET_CSV_ICI") {
      setFundPerformanceAPI(fallbackData);
      return;
    }

    // Récupération des données depuis le Google Sheet
    fetch(googleSheetCsvUrl)
      .then(res => res.text())
      .then(csv => {
        // Parsing basique du CSV
        const lines = csv.split('\n');
        const parsedData = {};

        // On commence à i=1 pour ignorer la ligne d'en-tête du tableau Excel
        for(let i = 1; i < lines.length; i++) {
          if(!lines[i].trim()) continue;
          // Séparation par virgules (Attention: Ne pas utiliser de virgules dans les noms des fonds sur le Sheet)
          const row = lines[i].split(',');
          if(row.length >= 8) {
            const isin = row[0].trim();
            parsedData[isin] = {
              name: row[1]?.trim(),
              "3m": row[2]?.trim(),
              "1y": row[3]?.trim(),
              "3y": row[4]?.trim(),
              "5y": row[5]?.trim(),
              "10y": row[6]?.trim(),
              "10y_ann": row[7]?.trim(),
            };
          }
        }
        setFundPerformanceAPI(Object.keys(parsedData).length > 0 ? parsedData : fallbackData);
      })
      .catch(err => {
        console.error("Erreur lecture Google Sheet CSV:", err);
        setFundPerformanceAPI(fallbackData);
      });
  }, []);

  const funds = [
    { isin: "IE00B5BMR087", weight: 30 },
    { isin: "IE00B53SZB19", weight: 25 },
    { isin: "CH0237935637", weight: 15 },
    { isin: "DE000A0S9GB0", weight: 15 },
    { isin: "LU0328475792", weight: 15 }
  ];

  // Calcul des moyennes pondérées du portefeuille
  const parsePct = (str) => parseFloat((str || "0").replace("+", "").replace("%", "")) || 0;
  const formatPct = (val) => (val > 0 ? "+" : "") + val.toFixed(1) + "%";

  const weightedAvg = { "3m": 0, "1y": 0, "3y": 0, "5y": 0, "10y": 0, "10y_ann": 0 };

  if (fundPerformanceAPI) {
    funds.forEach(f => {
      const apiData = fundPerformanceAPI[f.isin] || {};
      const w = f.weight / 100;
      Object.keys(weightedAvg).forEach(k => {
        weightedAvg[k] += parsePct(apiData[k]) * w;
      });
    });
  }

  return (
    <div style={slideBase}>
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Détail Stratégie" highlight="Dynamique" subtitle="RÉPARTITION ET PERFORMANCES HISTORIQUES" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 13, color: C.darkGray, marginBottom: 24 }}>Analyse des fonds sous-jacents composant votre portefeuille dynamique. Les rendements ci-dessous sont connectables en temps réel.</p>

          {!fundPerformanceAPI ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.gray, fontSize: 14 }}>
              Chargement des performances du marché en cours...
            </div>
          ) : (
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
                  const apiData = fundPerformanceAPI[f.isin] || { name: "Données indisponibles", "3m": "-", "1y": "-", "3y": "-", "5y": "-", "10y": "-", "10y_ann": "-" };
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
                <tr style={{ background: "rgba(165,149,104,0.15)", borderTop: `2px solid ${C.gold}` }}>
                  <td colSpan="2" style={{ padding: "12px 16px", fontWeight: 800, color: C.primaryDark, textAlign: "right", textTransform: "uppercase" }}>Moyenne Pondérée</td>
                  <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 900, color: C.primary }}>100%</td>
                  <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 800, color: C.darkGray }}>{formatPct(weightedAvg["3m"])}</td>
                  <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 800, color: C.darkGray }}>{formatPct(weightedAvg["1y"])}</td>
                  <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 800, color: C.darkGray }}>{formatPct(weightedAvg["3y"])}</td>
                  <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 800, color: C.darkGray }}>{formatPct(weightedAvg["5y"])}</td>
                  <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 900, color: C.darkGray }}>{formatPct(weightedAvg["10y"])}</td>
                  <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 900, color: C.primary }}>{formatPct(weightedAvg["10y_ann"])}</td>
                </tr>
              </tbody>
            </table>
          )}
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
// ────────────────────── SLIDES LPP (NOUVEAU MODÈLE) ──────────────────────

function SlideTOCLPP({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const hidden = data.hiddenSlides || [];
  const getPage = (origIdx) => { let count = 0; for(let i=0; i<=origIdx; i++) if(!hidden.includes(i)) count++; return count; };

  const items = [
    { title: "Qui sommes-nous ? Notre philosophie", origIdx: 2 },
    { title: "Notre cabinet en chiffres", origIdx: 3 },
    { title: "Résumé de votre situation personnelle", origIdx: 4 },
    { title: "Les enjeux du 2ème Pilier (LPP)", origIdx: 5 },
    { title: "Fonctionnement du Libre Passage", origIdx: 6 },
    { title: "Votre Compte de Libre Passage", origIdx: 7 },
    { title: `Votre Administrateur : ${data.administrateurLpp || "Pictet"}`, origIdx: 8 },
    { title: "Avantages de l'investissement", origIdx: 9 },
    { title: "Allocation d'actifs recommandée", origIdx: 10 },
    { title: "Projections : Classique vs Investi", origIdx: 11 },
    { title: "Synthèse & Contact", origIdx: 12 },
  ].filter(item => !hidden.includes(item.origIdx));

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
                {String(getPage(item.origIdx)).padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlideLPPIntro({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Les enjeux du" highlight="2ème Pilier (LPP)" subtitle="LE DÉFI DE VOTRE RETRAITE" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 64 }}>
          <div style={{ flex: 1 }}>
             <EditableText editMode={editMode} value={data.texts?.lppIntroP1} onChange={v => onTextChange("lppIntroP1", v)} style={{ fontSize: 14, lineHeight: 1.8, color: C.darkGray, textAlign: "justify", marginBottom: 24 }} />
             <EditableText editMode={editMode} value={data.texts?.lppIntroP2} onChange={v => onTextChange("lppIntroP2", v)} style={{ fontSize: 14, lineHeight: 1.8, color: C.darkGray, textAlign: "justify", marginBottom: 24 }} />
             <EditableText editMode={editMode} value={data.texts?.lppIntroP3} onChange={v => onTextChange("lppIntroP3", v)} style={{ fontSize: 14, lineHeight: 1.8, color: C.primary, fontWeight: 600, textAlign: "justify", margin: 0 }} />
          </div>
          <div style={{ width: 420, background: C.lightGray, borderTop: `4px solid ${C.primary}`, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.primaryDark, marginBottom: 16 }}>La baisse du taux de conversion</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: C.primary, lineHeight: 1 }}>6.8%</div>
              <div style={{ fontSize: 12, color: C.gray, textTransform: "uppercase", fontWeight: 700 }}>Taux légal minimum actuel</div>
            </div>
            <div style={{ fontSize: 13, color: C.darkGray, lineHeight: 1.6, textAlign: "justify" }}>
              Ce taux définit le montant de votre rente. Pour 100'000 CHF de capital, vous touchez 6'800 CHF/an. Cependant, la partie "surobligatoire" (la majorité de votre capital) est souvent soumise à un taux bien plus bas (parfois &lt; 5.0%), réduisant drastiquement votre niveau de vie futur.
            </div>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlideLPPFonctionnement({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Fonctionnement du" highlight="Libre Passage" subtitle="REPRENEZ LE CONTRÔLE DE VOTRE ÉPARGNE" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 64 }}>
          <div style={{ flex: 1 }}>
             <EditableText editMode={editMode} value={data.texts?.lppFonctP1} onChange={v => onTextChange("lppFonctP1", v)} style={{ fontSize: 14, lineHeight: 1.8, color: C.darkGray, textAlign: "justify", marginBottom: 24 }} />
             <EditableText editMode={editMode} value={data.texts?.lppFonctP2} onChange={v => onTextChange("lppFonctP2", v)} style={{ fontSize: 14, lineHeight: 1.8, color: C.darkGray, textAlign: "justify", marginBottom: 24 }} />
             <EditableText editMode={editMode} value={data.texts?.lppFonctP3} onChange={v => onTextChange("lppFonctP3", v)} style={{ fontSize: 14, lineHeight: 1.8, color: C.primary, fontWeight: 600, textAlign: "justify", margin: 0 }} />
          </div>
          <div style={{ width: 420, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: "16px 24px", display: "flex", alignItems: "center", gap: 20, boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
              <div style={{ opacity: 0.5, color: C.darkGray }}><Icons.Building size={32} /></div>
              <div>
                <div style={{ fontSize: 11, color: C.gray, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>Avant</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.darkGray }}>Caisse de pension</div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>Géré collectivement, rendement dicté par la caisse.</div>
              </div>
            </div>
            <div style={{ textAlign: "center", color: C.gold, fontSize: 20 }}>↓</div>
            <div style={{ background: C.white, border: `2px solid ${C.gold}`, padding: "16px 24px", display: "flex", alignItems: "center", gap: 20, boxShadow: "0 10px 30px rgba(165,149,104,0.15)" }}>
              <div style={{ opacity: 0.8, color: C.gold }}><Icons.Bank size={32} /></div>
              <div>
                <div style={{ fontSize: 11, color: C.gold, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>Aujourd'hui</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.primaryDark }}>Compte de Maintien</div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>Dort sur un compte, rendement quasi nul.</div>
              </div>
            </div>
            <div style={{ textAlign: "center", color: C.primary, fontSize: 20 }}>↓</div>
            <div style={{ background: C.primary, color: C.white, padding: "16px 24px", display: "flex", alignItems: "center", gap: 20, boxShadow: "0 10px 30px rgba(105,33,2,0.2)" }}>
              <div style={{ color: C.white }}><Icons.TrendUp size={32} /></div>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>Notre Solution</div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>Libre Passage Investi</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>Géré selon votre profil, rendement du marché.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlideLPPLibrePassage({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Le Compte de" highlight="Libre Passage" subtitle="DYNAMISATION DU CAPITAL DORMANT" />
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <EditableText editMode={editMode} value={data.texts?.lppLibreP1} onChange={v => onTextChange("lppLibreP1", v)} style={{ fontSize: 13.5, lineHeight: 1.8, color: C.darkGray, margin: "0 0 16px", textAlign: "justify" }} />
            <EditableText editMode={editMode} value={data.texts?.lppLibreP2} onChange={v => onTextChange("lppLibreP2", v)} style={{ fontSize: 13.5, lineHeight: 1.8, color: C.darkGray, margin: "0 0 24px", textAlign: "justify" }} />
            <div style={{ background: C.lightGray, padding: 20, borderLeft: `4px solid ${C.primary}` }}>
              <div style={{ fontSize: 12, color: C.gray, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Votre Capital Libre Passage</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.primary }}>CHF {fmt(Number(data.capitalLibrePassage || 120000))}.-</div>
            </div>
          </div>
          <div style={{ background: C.primary, padding: 32, display: "flex", flexDirection: "column", justifyContent: "center", borderRadius: "0px", boxShadow: "0 10px 30px rgba(105,33,2,0.15)", color: C.white, height: "100%" }}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, textAlign: "center" }}>Stratégie d'investissement</div>
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ background: "rgba(255,255,255,0.1)", padding: "16px", display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ color: C.white }}><Icons.TrendUp size={24} /></span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Profil sélectionné</div>
                  <div style={{ fontSize: 12, color: C.gold }}>{data.profilRisque || "Dynamique"}</div>
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.1)", padding: "16px", display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ color: C.white }}><Icons.Bank size={24} /></span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Administrateur / Fondation</div>
                  <div style={{ fontSize: 12, color: C.gold }}>{data.administrateurLpp || "Pictet"}</div>
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.1)", padding: "16px", display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ color: C.white }}><Icons.Shield size={24} /></span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Sécurité</div>
                  <div style={{ fontSize: 12, color: C.gold }}>Avoirs hors bilan bancaire</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}
function SlideLPPAllocation({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const profil = data.profilRisque || "Équilibré";

  let actions = data.lppActions !== undefined && data.lppActions !== "" ? Number(data.lppActions) : (profil === "Prudent" ? 25 : profil === "Dynamique" ? 65 : profil === "Offensif" ? 85 : 45);
  let oblig = data.lppOblig !== undefined && data.lppOblig !== "" ? Number(data.lppOblig) : (profil === "Prudent" ? 65 : profil === "Dynamique" ? 25 : profil === "Offensif" ? 10 : 45);
  let immo = data.lppImmo !== undefined && data.lppImmo !== "" ? Number(data.lppImmo) : (profil === "Prudent" ? 10 : profil === "Dynamique" ? 10 : profil === "Offensif" ? 5 : 10);

  const total = actions + oblig + immo || 1;
  const aPct = (actions/total)*100;
  const oPct = (oblig/total)*100;
  const iPct = (immo/total)*100;

  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Allocation d'actifs recommandée" highlight={`Profil ${profil}`} subtitle="RÉPARTITION DE VOTRE LIBRE PASSAGE" />
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: C.darkGray, textAlign: "justify", margin: 0 }}>
              Afin de générer un rendement optimal tout en maîtrisant la volatilité, votre capital de libre passage sera réparti selon votre tolérance au risque.
            </p>
            <div style={{ background: C.lightGray, padding: 24, borderLeft: `4px solid ${C.primary}` }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.primary, marginBottom: 8 }}>{actions}% Actions mondiales</div>
              <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.5 }}>Moteur de performance à long terme, participation à la croissance économique globale.</div>
            </div>
            <div style={{ background: C.lightGray, padding: 24, borderLeft: `4px solid ${C.gold}` }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.gold, marginBottom: 8 }}>{oblig}% Obligations & Revenu fixe</div>
              <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.5 }}>Amortisseur de volatilité, génère des rendements stables et sécurise le portefeuille.</div>
            </div>
            <div style={{ background: C.lightGray, padding: 24, borderLeft: `4px solid ${C.darkGray}` }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.darkGray, marginBottom: 8 }}>{immo}% Immobilier & Liquidités</div>
              <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.5 }}>Protection contre l'inflation et diversification des classes d'actifs.</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
             <div style={{ width: 280, height: 280, position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <svg viewBox="0 0 48 48" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)", filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.1))", overflow: "visible" }}>
                  <circle r="24" cx="24" cy="24" fill="white" />
                  <circle r="15.9155" cx="24" cy="24" fill="transparent" stroke={C.primary} strokeWidth="16" strokeDasharray={`${aPct} 100`} />
                  <circle r="15.9155" cx="24" cy="24" fill="transparent" stroke={C.gold} strokeWidth="16" strokeDasharray={`${oPct} 100`} strokeDashoffset={`-${aPct}`} />
                  <circle r="15.9155" cx="24" cy="24" fill="transparent" stroke={C.darkGray} strokeWidth="16" strokeDasharray={`${iPct} 100`} strokeDashoffset={`-${aPct + oPct}`} />
                  <circle r="14" cx="24" cy="24" fill="white" />
                </svg>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: C.primaryDark }}>100%</div>
                  <div style={{ fontSize: 11, color: C.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Investi</div>
                </div>
             </div>
             <div style={{ display: "flex", gap: 16, marginTop: 24, justifyContent: "center" }}>
               <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: C.darkGray }}><div style={{ width: 12, height: 12, borderRadius: "50%", background: C.primary }}/> Actions</div>
               <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: C.darkGray }}><div style={{ width: 12, height: 12, borderRadius: "50%", background: C.gold }}/> Obligations</div>
               <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: C.darkGray }}><div style={{ width: 12, height: 12, borderRadius: "50%", background: C.darkGray }}/> Immo/Liq.</div>
             </div>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlideLPPAdministrateur({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const admin = data.administrateurLpp || "Pictet";
  return (
    <div style={slideBase}>
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title={`Votre Administrateur :`} highlight={admin} subtitle="SÉCURITÉ & GOUVERNANCE INSTITUTIONNELLE" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 64 }}>
          <div style={{ flex: 1 }}>
             <EditableText editMode={editMode} value={data.texts?.lppAdminP1} onChange={v => onTextChange("lppAdminP1", v)} style={{ fontSize: 14, lineHeight: 1.8, color: C.darkGray, textAlign: "justify", marginBottom: 24 }} />
             <EditableText editMode={editMode} value={data.texts?.lppAdminP2} onChange={v => onTextChange("lppAdminP2", v)} style={{ fontSize: 14, lineHeight: 1.8, color: C.darkGray, textAlign: "justify", margin: 0 }} />
          </div>
          <div style={{ width: 400, background: C.white, border: `1px solid ${C.mediumGray}`, padding: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.05)", minHeight: 280 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.primary, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>{admin}</div>
            <div style={{ width: 40, height: 3, background: C.gold, marginBottom: 24 }} />
            <div style={{ fontSize: 13, color: C.gray, textAlign: "center", lineHeight: 1.6 }}>
              Une institution financière suisse renommée, spécialisée dans la gestion institutionnelle et le respect absolu du cadre légal OPP2.
            </div>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlideLPPAvantagesCLP({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Avantages de l'investissement" highlight="sur les marchés" subtitle="POURQUOI NE PAS LAISSER SON CAPITAL DORMIR" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 32 }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 64, alignItems: "center" }}>
             <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <EditableText editMode={editMode} value={data.texts?.lppAvantagesP1} onChange={v => onTextChange("lppAvantagesP1", v)} style={{ fontSize: 14.5, lineHeight: 1.8, color: C.darkGray, textAlign: "justify", margin: 0 }} />
                <div style={{ width: 60, height: 3, background: C.gold }} />
                <EditableText editMode={editMode} value={data.texts?.lppAvantagesP2} onChange={v => onTextChange("lppAvantagesP2", v)} style={{ fontSize: 14.5, lineHeight: 1.8, color: C.darkGray, textAlign: "justify", margin: 0 }} />
             </div>

             <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
               <div style={{ display: "flex", gap: 20, alignItems: "flex-start", background: C.white, border: `1px solid ${C.mediumGray}`, padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
                  <div style={{ color: C.primary, background: "rgba(105,33,2,0.06)", padding: 12, borderRadius: "50%", flexShrink: 0 }}><Icons.TrendUp size={28} /></div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.primaryDark, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Contre l'inflation</div>
                    <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.6 }}>L'investissement en actions/obligations maintient le pouvoir d'achat de votre retraite à long terme.</div>
                  </div>
               </div>

               <div style={{ display: "flex", gap: 20, alignItems: "flex-start", background: C.white, border: `1px solid ${C.mediumGray}`, padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
                  <div style={{ color: C.gold, background: "rgba(165,149,104,0.1)", padding: 12, borderRadius: "50%", flexShrink: 0 }}><Icons.Shield size={28} /></div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.primaryDark, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Protection de la famille</div>
                    <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.6 }}>Libre désignation des bénéficiaires en cas de décès (au sein du cadre légal OPP2).</div>
                  </div>
               </div>

               <div style={{ display: "flex", gap: 20, alignItems: "flex-start", background: C.white, border: `1px solid ${C.mediumGray}`, padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
                  <div style={{ color: C.darkGray, background: C.lightGray, padding: 12, borderRadius: "50%", flexShrink: 0 }}><Icons.PieChart size={28} /></div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.primaryDark, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Gestion sur-mesure</div>
                    <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.6 }}>Une architecture ouverte permettant de sélectionner les meilleurs gérants mondiaux selon votre profil.</div>
                  </div>
               </div>
             </div>
          </div>

        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlideLPPProjections({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const rows = computeProjectionsLPP(data);
  const initial = Number(data.capitalLibrePassage || 120000);
  const fee = rows.length > 0 ? rows[0].fee : 1;

  // SVG Chart variables
  const svgW = 480; const svgH = 240;
  const padL = 70; const padR = 20; const padT = 20; const padB = 30;
  const w = svgW - padL - padR; const h = svgH - padT - padB;
  const maxVal = rows[rows.length-1].clp;
  const gridMax = Math.ceil(maxVal / 50000) * 50000 || 200000;

  const getX = (i) => padL + (i / (rows.length - 1)) * w;
  const getY = (val) => padT + h - (val / gridMax) * h;

  const dSupletive = rows.map((r, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(r.supletive)}`).join(' ');
  const dClassic = rows.map((r, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(r.classic)}`).join(' ');
  const dCLP = rows.map((r, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(r.clp)}`).join(' ');

  const rateCLPDisplay = (rows[0].rateCLP * 100).toFixed(1);
  const netInitial = initial - (initial * fee / 100);

  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "48px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Projections :" highlight="Classique vs Libre Passage" subtitle={`SIMULATION JUSQU'À 65 ANS (${Math.max(1, 65 - (Number(data.age)||40))} ANS)`} />
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "center", minHeight: 0 }}>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
             <p style={{ fontSize: 12.5, lineHeight: 1.6, color: C.darkGray, margin: "0 0 16px", textAlign: "justify" }}>
              Comparaison de l'évolution de votre capital de <strong>CHF {fmt(initial)}.-</strong> s'il est placé sur une Fondation Institutionnelle Supplétive (~0.05% net/an), s'il reste sur un compte de fondation classique (~1% net/an) ou s'il est investi sur les marchés via un <strong>Compte de libre passage WallSwiss</strong> (profil <strong>{data.profilRisque || "Dynamique"}</strong>, ~{rateCLPDisplay}% net/an).<br/>
              <span style={{ fontSize: 11, color: C.primary, fontWeight: 600 }}>
                *Des droits d'entrée de {fee}% (soit CHF {fmt(initial * fee / 100)}.-) sont déduits du capital initial, portant le montant net investi à CHF {fmt(netInitial)}.- pour la simulation WallSwiss.
              </span>
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

                {/* Area under CLP */}
                <path d={`${dCLP} L ${getX(rows.length-1)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`} fill="rgba(105,33,2,0.05)" />

                {/* Lines */}
                <path d={dSupletive} fill="none" stroke="#D1D5DB" strokeWidth="2" strokeDasharray="4 4" />
                <path d={dClassic} fill="none" stroke={C.gray} strokeWidth="2" />
                <path d={dCLP} fill="none" stroke={C.primary} strokeWidth="3" />

                {/* Points */}
                {rows.map((r, i) => (
                  <g key={i}>
                    <circle cx={getX(i)} cy={getY(r.supletive)} r="3" fill="#D1D5DB" />
                    <circle cx={getX(i)} cy={getY(r.classic)} r="3" fill={C.gray} />
                    <circle cx={getX(i)} cy={getY(r.clp)} r="5" fill={C.primary} stroke={C.white} strokeWidth="2" />
                  </g>
                ))}
              </svg>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 16, alignSelf: "center", fontSize: 11, fontWeight: 600 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 2, borderBottom: "2px dashed #D1D5DB" }} /> Fondation Supplétive (0.05%)</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 2, background: C.gray }} /> Compte Classique (~1%)</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: "50%", background: C.primary }} /> Libre Passage WallSwiss</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5, textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
              <thead>
                <tr style={{ background: C.primary, color: C.white }}>
                  <th style={{ padding: "12px 6px", fontWeight: 600 }}>Âge</th>
                  <th style={{ padding: "12px 6px", fontWeight: 600 }}>Fondation<br/>Supplétive</th>
                  <th style={{ padding: "12px 6px", fontWeight: 600 }}>Compte<br/>Classique</th>
                  <th style={{ padding: "12px 6px", fontWeight: 600 }}>Libre Passage<br/>WallSwiss<br/><span style={{fontSize: 9, opacity: 0.8}}>(net de frais)</span></th>
                  <th style={{ padding: "12px 6px", fontWeight: 600 }}>Différence<br/>(WS - Classique)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.lightGray : C.white }}>
                    <td style={{ padding: "10px 6px", fontWeight: 700, color: C.primary, borderBottom: "1px solid #E5E3DE" }}>{i === 0 ? "Aujourd'hui" : `${r.age} ans`}</td>
                    <td style={{ padding: "10px 6px", color: C.gray, borderBottom: "1px solid #E5E3DE" }}>{fmt(r.supletive)}</td>
                    <td style={{ padding: "10px 6px", color: C.darkGray, borderBottom: "1px solid #E5E3DE" }}>{fmt(r.classic)}</td>
                    <td style={{ padding: "10px 6px", fontWeight: 700, color: C.primary, borderBottom: "1px solid #E5E3DE" }}>{fmt(r.clp)}</td>
                    <td style={{ padding: "10px 6px", fontWeight: 700, color: r.clp - r.classic >= 0 ? C.gold : "#EF4444", borderBottom: "1px solid #E5E3DE" }}>
                      {r.clp - r.classic > 0 ? "+ " : ""}
                      {fmt(r.clp - r.classic)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: 20, background: "rgba(165,149,104,0.1)", padding: "12px 20px", border: `1px solid ${C.gold}`, color: C.primaryDark, fontSize: 12, fontWeight: 700, textAlign: "center", width: "100%", boxSizing: "border-box" }}>
              Manque à gagner évité à 65 ans :<br/>
              <span style={{ fontSize: 20, color: C.primary, marginTop: 4, display: "block" }}>CHF {fmt(rows[rows.length-1].clp - rows[rows.length-1].classic)}.-</span>
            </div>

            <p style={{ fontSize: 9, color: C.gray, marginTop: 12, lineHeight: 1.5, fontStyle: "italic", textAlign: "center" }}>
              *Simulation non garantie à but illustratif. Les rendements d'investissement sont estimés nets de frais de gestion selon le profil choisi.
            </p>
          </div>

        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}
// ────────────────────── SLIDES ASSURANCE VIE & PER ──────────────────────

function SlideTOCAssuranceVie({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const hidden = data.hiddenSlides || [];
  const getPage = (origIdx) => { let count = 0; for(let i=0; i<=origIdx; i++) if(!hidden.includes(i)) count++; return count; };

  let items = [
    { title: "Qui sommes-nous ? Notre philosophie", origIdx: 2 },
    { title: "Notre cabinet en chiffres", origIdx: 3 },
    { title: "Résumé de votre situation personnelle", origIdx: 4 },
    { title: "Les solutions de l'assurance-vie", origIdx: 5 },
    { title: "Le plan épargne retraite, son fonctionnement", origIdx: 6 },
    { title: "La fiscalité de l'assurance-vie", origIdx: 7 },
    { title: "Gestion de votre portefeuille", origIdx: 8 },
    { title: "Projections financières", origIdx: 9 },
  ];

  let nextIdx = 10;
  if (data.hasProjectionsMultiples) {
    items.push({ title: "Projections financières (Scénario 2)", origIdx: nextIdx++ });
  }
  items.push({ title: "Synthèse & Contact", origIdx: nextIdx });

  items = items.filter(item => !hidden.includes(item.origIdx));

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
                {String(getPage(item.origIdx)).padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlideAvSolutions({ data, editMode, onTextChange }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {logoCorner()}
      <div style={{ padding: "56px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Les solutions de" highlight="l'assurance-vie" subtitle="LE PLACEMENT PRÉFÉRÉ DES FRANÇAIS" />
        <div style={{ flex: 1, display: "flex", gap: 64, alignItems: "center" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
            <EditableText editMode={editMode} value={data.texts?.avSolutionsP1} onChange={v => onTextChange("avSolutionsP1", v)} style={{ fontSize: 14.5, lineHeight: 1.8, color: C.darkGray, textAlign: "justify", margin: 0 }} />
            <div style={{ width: 60, height: 3, background: C.gold }} />
            <EditableText editMode={editMode} value={data.texts?.avSolutionsP2} onChange={v => onTextChange("avSolutionsP2", v)} style={{ fontSize: 14.5, lineHeight: 1.8, color: C.darkGray, textAlign: "justify", margin: 0 }} />
          </div>
          <div style={{ width: 400, height: 300, background: C.lightGray, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", position: "relative", overflow: "hidden" }}>
            <img src="/image page3.jpg" alt="Assurance Vie" className="pdf-image" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(105,33,2,0.85)", color: C.white, padding: "16px", textAlign: "center", fontWeight: 700, fontSize: 14 }}>
              + de 2 000 Milliards d'Euros d'encours
            </div>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlidePERFonctionnement({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  return (
    <div style={slideBase}>
      {/* On retire l'accentBar pour laisser la bannière en bas s'afficher sur toute la largeur */}
      {logoCorner()}
      <div style={{ padding: "40px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Le plan épargne retraite," highlight="son fonctionnement" />

        <div style={{ flex: 1, position: "relative", marginTop: 40 }}>
           {/* SVG Graph de la ligne de temps et de l'arc */}
           <svg viewBox="0 0 1000 300" style={{ position: "absolute", top: 0, left: -20, width: "1060px", height: "300px", overflow: "visible" }}>
             {/* Arc principal */}
             <path d="M 60 200 Q 500 -50 930 180" fill="none" stroke={C.gold} strokeWidth="5" />
             <polygon points="920,172 940,185 918,190" fill={C.gold} />

             {/* Ligne horizontale */}
             <line x1="20" y1="220" x2="940" y2="220" stroke={C.gold} strokeWidth="5" />
             <polygon points="930,210 950,220 930,230" fill={C.gold} />

             {/* Grosse flèche de départ */}
             <path d="M 30 120 L 70 120 L 70 180 L 90 180 L 50 220 L 10 180 L 30 180 Z" fill={C.primaryDark} />
           </svg>

           {/* Textes en surimpression (HTML pour faciliter le formatage) */}
           <div style={{ position: "absolute", top: -20, width: "100%", textAlign: "center", fontSize: 20, color: C.black, fontWeight: 500 }}>
             Hors droits de succession + insaisissable
           </div>

           <div style={{ position: "absolute", top: 230, left: 30, fontSize: 20, fontWeight: 500 }}>0</div>
           <div style={{ position: "absolute", top: 260, left: 30, color: C.primaryDark, fontWeight: 800, fontSize: 16 }}>
             + Garantie plancher décès
           </div>

           {/* Boîte 1 : Versements libres */}
           <div style={{ position: "absolute", top: 100, left: 240 }}>
             <div style={{ background: C.primaryDark, color: C.white, padding: "16px 32px", fontWeight: 700, fontSize: 16 }}>
               Versement libres
             </div>
             <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 10px" }}>
                <svg width="24" height="24" viewBox="0 0 100 100" style={{ transform: "rotate(-45deg)" }}>
                  <path d="M 10 40 L 60 40 L 60 20 L 90 50 L 60 80 L 60 60 L 10 60 Z" fill="#9CA3AF" />
                </svg>
                <svg width="24" height="24" viewBox="0 0 100 100" style={{ transform: "rotate(45deg)", marginTop: 16 }}>
                  <path d="M 10 40 L 60 40 L 60 20 L 90 50 L 60 80 L 60 60 L 10 60 Z" fill="#9CA3AF" />
                </svg>
             </div>
           </div>

           {/* Repère 8 ans */}
           <div style={{ position: "absolute", top: 230, left: 500, transform: "translateX(-50%)", fontSize: 22, fontWeight: 500 }}>
             8 ans
           </div>

           {/* Boîte 2 : Verser / Retirer librement */}
           <div style={{ position: "absolute", top: 80, left: 600 }}>
             <div style={{ background: C.primaryDark, color: C.white, padding: "16px 32px", fontWeight: 700, fontSize: 16, textAlign: "center", lineHeight: 1.4 }}>
               Verser / retirer<br/>librement
             </div>
             <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 10px" }}>
                <svg width="24" height="24" viewBox="0 0 100 100" style={{ transform: "rotate(-45deg)" }}>
                  <path d="M 10 40 L 60 40 L 60 20 L 90 50 L 60 80 L 60 60 L 10 60 Z" fill="#9CA3AF" />
                </svg>
                <svg width="24" height="24" viewBox="0 0 100 100" style={{ transform: "rotate(45deg)", marginTop: 16 }}>
                  <path d="M 10 40 L 60 40 L 60 20 L 90 50 L 60 80 L 60 60 L 10 60 Z" fill="#9CA3AF" />
                </svg>
             </div>
           </div>

           <div style={{ position: "absolute", top: 260, left: 570, color: C.primaryDark, fontWeight: 800, fontSize: 16, maxWidth: 220, lineHeight: 1.4 }}>
             + Optimisation et avantages fiscaux sur les plus values
           </div>

           <div style={{ position: "absolute", top: 260, left: 810, color: C.primaryDark, fontWeight: 800, fontSize: 16, width: 250 }}>
             + Disponibilité du capital
             <ul style={{ color: C.primaryDark, fontWeight: 600, fontSize: 13, marginTop: 8, paddingLeft: 16, lineHeight: 1.6 }}>
               <li>rachat partiel</li>
               <li>rachat partiel programmé</li>
               <li>rachat total</li>
               <li>rentes viagères</li>
             </ul>
           </div>
        </div>
      </div>

      {/* Bannière "Nos partenaires" (au dessus du footer) */}
      <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, height: 70, background: "#9CA3AF", display: "flex", alignItems: "center", padding: "0 80px", gap: 32 }}>
        <div style={{ fontSize: 22, color: C.white, fontWeight: 500 }}>Nos partenaires</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Logo vectorisé d'approximation de SwissLife pour éviter les problèmes d'import d'image dans le PDF */}
          <svg width="32" height="32" viewBox="0 0 100 100">
             <path d="M 10 90 Q 50 10 90 10 Q 70 50 100 90 Z" fill="#E3000F" />
             <rect x="55" y="45" width="20" height="6" fill="white" />
             <rect x="62" y="38" width="6" height="20" fill="white" />
          </svg>
          <div style={{ color: C.darkGray, fontSize: 20, fontWeight: 500, fontFamily: "Arial, sans-serif" }}>SwissLife</div>
        </div>
      </div>

      {footer(fullName)}
    </div>
  );
}
function SlideAvFiscalite({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const blueTitle = "#4A5C8C"; // Couleur bleue spécifique à cette slide d'après l'image

  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "40px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="La fiscalité de" highlight="l'assurance-vie" />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 32, marginTop: 10 }}>

          {/* BLOC 1 : Avant 2017 */}
          <div>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ color: blueTitle, fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Fiscalité sur les intérêts des sommes versées :</div>
              <div style={{ color: blueTitle, fontSize: 24, fontWeight: 800 }}>Avant le 27 Septembre 2017</div>
            </div>

            <div style={{ position: "relative", height: 100 }}>
              <svg viewBox="0 0 1000 100" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "visible" }}>
                <line x1="50" y1="50" x2="940" y2="50" stroke={C.gold} strokeWidth="6" />
                <polygon points="930,40 950,50 930,60" fill={C.gold} />

                <polygon points="50,50 64,50 57,30" fill={C.primaryDark} />
                <polygon points="300,50 314,50 307,30" fill={C.primaryDark} />
                <polygon points="550,50 564,50 557,30" fill={C.primaryDark} />
              </svg>

              <div style={{ position: "absolute", top: 10, left: 230, fontSize: 13, color: C.black }}>Date d'ouverture 4 ans</div>

              <div style={{ position: "absolute", top: 60, left: 130, fontSize: 13, color: C.black }}>35% (ou IR) + 17,2%</div>
              <div style={{ position: "absolute", top: 60, left: 350, fontSize: 13, color: C.black }}>15% (ou IR) + 17,2%</div>
              <div style={{ position: "absolute", top: 60, left: 565, fontSize: 13, color: C.black, lineHeight: 1.5 }}>
                7,5% (après abattement de 9200 € pour un couple ou<br/>
                4600€ pour une personne seule sur la base imposable)<br/>
                + 17,2 PS ( sans abattement )
              </div>
            </div>
          </div>

          {/* BLOC 2 : Après 2017 */}
          <div>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ color: blueTitle, fontSize: 24, fontWeight: 800 }}>Après le 27 Septembre 2017</div>
            </div>

            {/* Timeline > 150k */}
            <div style={{ position: "relative", height: 90 }}>
              <div style={{ position: "absolute", top: 0, left: 50, fontSize: 13, color: C.black }}>Date d'ouverture</div>
              <svg viewBox="0 0 1000 90" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "visible" }}>
                <polygon points="50,45 64,45 57,25" fill={C.primaryDark} />
                <line x1="50" y1="45" x2="940" y2="45" stroke={C.gold} strokeWidth="6" />
                <polygon points="930,35 950,45 930,55" fill={C.gold} />
              </svg>
              <div style={{ position: "absolute", top: 25, left: 50, background: C.primaryDark, color: C.white, padding: "12px 24px", fontWeight: 700, fontSize: 15 }}>
                &gt; 150 000€
              </div>
              <div style={{ position: "absolute", top: 55, left: 400, fontSize: 14, color: C.black, textAlign: "center", lineHeight: 1.5 }}>
                Flat tax 30% ( 17,2 PS+ 12,8 IR )<br/>sur la base imposable
              </div>
            </div>

            {/* Timeline < 150k */}
            <div style={{ position: "relative", height: 120 }}>
              <div style={{ position: "absolute", top: 0, left: 50, fontSize: 13, color: C.black }}>Date d'ouverture</div>
              <div style={{ position: "absolute", top: 0, left: 530, fontSize: 13, color: C.black }}>8 ans</div>

              <svg viewBox="0 0 1000 120" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "visible" }}>
                <polygon points="50,45 64,45 57,25" fill={C.primaryDark} />
                <polygon points="530,45 544,45 537,25" fill={C.primaryDark} />
                <line x1="50" y1="45" x2="940" y2="45" stroke={C.gold} strokeWidth="6" />
                <polygon points="930,35 950,45 930,55" fill={C.gold} />
              </svg>
              <div style={{ position: "absolute", top: 25, left: 50, background: C.primaryDark, color: C.white, padding: "12px 24px", fontWeight: 700, fontSize: 15 }}>
                &lt; 150 000€
              </div>
              <div style={{ position: "absolute", top: 55, left: 260, fontSize: 14, color: C.black }}>
                Flat tax 30%
              </div>
              <div style={{ position: "absolute", top: 55, left: 545, fontSize: 13, color: C.black, lineHeight: 1.6 }}>
                7,5 % (jusqu'à 150 000 € de versements)<br/>
                12,8 % (pour les versements nets supérieurs à 150 000 €)<br/>
                4 600 € pour une personne seule<br/>
                9 200 € pour un couple soumis à une imposition commune
              </div>
            </div>

          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlideAvGestion({ data }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;

  const funds = [
    { nom: "Axiom European Banks Equity RC EUR(v)", isin: "LU1876459303", poids: "20%", p1c: "63.10%", p3c: "210.01%", p3a: "45.81%", p10c: "314.20%", p10a: "15.27%" },
    { nom: "Alken Euro Opportunities A", isin: "LU0524465977", poids: "20%", p1c: "54.33%", p3c: "90.53%", p3a: "23.97%", p10c: "145.09%", p10a: "9.38%" },
    { nom: "AXA Or et Matières Premières C", isin: "FR0010011171", poids: "20%", p1c: "76.63%", p3c: "89.13%", p3a: "23.67%", p10c: "377.33%", p10a: "16.92%" },
    { nom: "DNCA Invest Archer Mid-Cap Europe A EUR", isin: "LU1366712435", poids: "20%", p1c: "17.07%", p3c: "42.18%", p3a: "12.45%", p10c: "n/a*", p10a: "n/a*" },
    { nom: "AXA Amérique Actions AC", isin: "FR0000447807", poids: "20%", p1c: "4.09%", p3c: "56.24%", p3a: "16.04%", p10c: "183.92%", p10a: "11.00%" }
  ];

  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "32px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Gestion de votre" highlight="portefeuille" subtitle="ALLOCATION ET PERFORMANCES HISTORIQUES" />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, marginTop: 4 }}>
          <p style={{ fontSize: 13.5, color: C.darkGray, margin: 0, lineHeight: 1.6 }}>
            Une sélection rigoureuse de fonds pour diversifier vos avoirs et viser une croissance pérenne. Les performances passées sont présentées à titre indicatif pour illustrer la solidité de ces supports sur différentes périodes.
          </p>

          {/* Main Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
            <thead>
              <tr style={{ background: C.primaryDark, color: C.white }}>
                <th style={{ padding: "8px 10px", textAlign: "left" }}>Fonds (ISIN)</th>
                <th style={{ padding: "8px 10px" }}>Poids</th>
                <th style={{ padding: "8px 10px" }}>Perf 1 an<br/>(cumulée)</th>
                <th style={{ padding: "8px 10px" }}>Perf 3 ans<br/>(cumulée)</th>
                <th style={{ padding: "8px 10px" }}>Perf 3 ans<br/>(annualisée)</th>
                <th style={{ padding: "8px 10px" }}>Perf 10 ans<br/>(cumulée)</th>
                <th style={{ padding: "8px 10px" }}>Perf 10 ans<br/>(annualisée)</th>
              </tr>
            </thead>
            <tbody>
              {funds.map((f, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? C.lightGray : C.white, borderBottom: `1px solid ${C.mediumGray}` }}>
                  <td style={{ padding: "8px 10px", textAlign: "left" }}>
                    <div style={{ fontWeight: 700, color: C.primary, marginBottom: 2 }}>{f.nom}</div>
                    <div style={{ fontSize: 9, color: C.gray }}>{f.isin}</div>
                  </td>
                  <td style={{ padding: "8px 10px", fontWeight: 700, color: C.darkGray }}>{f.poids}</td>
                  <td style={{ padding: "8px 10px", color: C.darkGray }}>{f.p1c}</td>
                  <td style={{ padding: "8px 10px", color: C.darkGray }}>{f.p3c}</td>
                  <td style={{ padding: "8px 10px", color: C.darkGray }}>{f.p3a}</td>
                  <td style={{ padding: "8px 10px", color: C.darkGray }}>{f.p10c}</td>
                  <td style={{ padding: "8px 10px", color: C.darkGray }}>{f.p10a}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
            {/* Summary Table */}
            <table style={{ width: "50%", borderCollapse: "collapse", fontSize: 12, textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
              <thead>
                <tr style={{ background: C.primaryDark, color: C.white }}>
                  <th style={{ padding: "6px 10px" }}>Horizon</th>
                  <th style={{ padding: "6px 10px" }}>Cumulé</th>
                  <th style={{ padding: "6px 10px" }}>Annualisé</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: C.lightGray, borderBottom: `1px solid ${C.mediumGray}` }}>
                  <td style={{ padding: "6px 10px", fontWeight: 600, color: C.darkGray }}>1 an</td>
                  <td style={{ padding: "6px 10px", color: C.primary, fontWeight: 700 }}>43.04%</td>
                  <td style={{ padding: "6px 10px", color: C.primary, fontWeight: 700 }}>43.04%</td>
                </tr>
                <tr style={{ background: C.white, borderBottom: `1px solid ${C.mediumGray}` }}>
                  <td style={{ padding: "6px 10px", fontWeight: 600, color: C.darkGray }}>3 ans</td>
                  <td style={{ padding: "6px 10px", color: C.primary, fontWeight: 700 }}>97.62%</td>
                  <td style={{ padding: "6px 10px", color: C.primary, fontWeight: 700 }}>25.49%</td>
                </tr>
                <tr style={{ background: C.lightGray }}>
                  <td style={{ padding: "6px 10px", fontWeight: 600, color: C.darkGray }}>10 ans</td>
                  <td style={{ padding: "6px 10px", color: C.primary, fontWeight: 700 }}>239.33%**</td>
                  <td style={{ padding: "6px 10px", color: C.primary, fontWeight: 700 }}>13.00%**</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: 9, color: C.gray, marginTop: 4, fontStyle: "italic", textAlign: "center" }}>
            * Fonds créé il y a moins de 10 ans. ** Moyenne calculée sur les fonds existants sur la période de 10 ans.<br/>
            Les performances passées ne préjugent pas des performances futures.
          </p>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

function SlideAvProjections({ data, index = 1 }) {
  const fullName = `${data.prenom} ${(data.nom || "").toUpperCase()}`;
  const rows = computeProjectionsAV(data, index);

  const initial = index === 2 ? (data.montantInvestissement2 || 200000) : (data.montantInvestissement || 100000);
  const monthly = index === 2 ? (data.capaciteEpargne2 || 1000) : (data.capaciteEpargne || 500);
  const subtitle = index === 2 ? "ESTIMATION DE LA VALEUR DE VOTRE CONTRAT (SCÉNARIO 2)" : "ESTIMATION DE LA VALEUR DE VOTRE CONTRAT";

  const r1 = data.tauxPessimiste || 3;
  const r2 = data.tauxRealiste || 6;
  const r3 = data.tauxOptimiste || 9;

  // Small graph variables
  const svgW = 320; const svgH = 180;
  const padL = 50; const padR = 10; const padT = 10; const padB = 20;
  const w = svgW - padL - padR; const h = svgH - padT - padB;
  const maxVal = rows.length > 0 ? Math.max(rows[rows.length-1].val3, rows[rows.length-1].versements) : 1;
  const gridMax = Math.ceil(maxVal / 20000) * 20000 || 50000;

  const getX = (i) => padL + (i / (rows.length - 1)) * w;
  const getY = (val) => padT + h - (val / gridMax) * h;

  const dP = rows.map((r, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(r.val1)}`).join(' ');
  const dR = rows.map((r, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(r.val2)}`).join(' ');
  const dO = rows.map((r, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(r.val3)}`).join(' ');
  const dV = rows.map((r, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(r.versements)}`).join(' ');

  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div style={{ padding: "48px 80px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <ReportTitle title="Projections" highlight="financières" subtitle={subtitle} />

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "360px 1fr", gap: 40, alignItems: "center" }}>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <p style={{ fontSize: 13, color: C.darkGray, lineHeight: 1.6, marginBottom: 20, textAlign: "justify" }}>
              Cette projection personnalisée simule l'évolution de votre épargne sur <strong>{data.dureeProjectionAv || 15} ans</strong>, en tenant compte d'un versement initial de <strong>{fmt(initial)} €</strong> et d'une mensualité de <strong>{fmt(monthly)} €</strong> (déduction faite des {data.fraisSouscription || 0}% de droits d'entrée).
            </p>

            <div style={{ width: svgW, height: svgH, background: C.white, border: `1px solid ${C.lightGray}`, marginBottom: 16 }}>
              <svg width={svgW} height={svgH} style={{ overflow: "visible" }}>
                {[0, 0.5, 1].map(pct => {
                  const y = padT + h - (pct * h);
                  return (
                    <g key={pct}>
                      <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="#E5E7EB" strokeDasharray="2 2" />
                      <text x={padL - 8} y={y + 4} fontSize="10" fill={C.gray} textAnchor="end">{fmt(Math.round(gridMax * pct))}</text>
                    </g>
                  );
                })}
                <path d={dV} fill="none" stroke={C.gray} strokeWidth="2" strokeDasharray="4 4" />
                <path d={dP} fill="none" stroke="#9CA3AF" strokeWidth="2" />
                <path d={dR} fill="none" stroke={C.primary} strokeWidth="3" />
                <path d={dO} fill="none" stroke={C.gold} strokeWidth="2" />
              </svg>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 4px", fontSize: 11, fontWeight: 600 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 2, borderBottom: "2px dashed", borderColor: C.gray }} /> Versements</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#9CA3AF" }} /> Scénario 1 ({r1}%)</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: C.primary }} /> Scénario 2 ({r2}%)</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: C.gold }} /> Scénario 3 ({r3}%)</div>
            </div>
          </div>

          <div style={{ overflow: "hidden", borderRadius: "0px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, textAlign: "center", background: C.white }}>
              <thead>
                <tr style={{ background: C.primaryDark, color: C.white }}>
                  <th rowSpan="2" style={{ padding: "6px", borderRight: `1px solid rgba(255,255,255,0.2)` }}>Année</th>
                  <th rowSpan="2" style={{ padding: "6px", borderRight: `1px solid rgba(255,255,255,0.2)` }}>Versements<br/>cumulés</th>
                  <th colSpan="2" style={{ padding: "6px", borderRight: `1px solid rgba(255,255,255,0.2)`, background: "#6B7280" }}>Scénario 1 ({r1}%)</th>
                  <th colSpan="2" style={{ padding: "6px", borderRight: `1px solid rgba(255,255,255,0.2)`, background: C.primary }}>Scénario 2 ({r2}%)</th>
                  <th colSpan="2" style={{ padding: "6px", background: "#8A7950" }}>Scénario 3 ({r3}%)</th>
                </tr>
                <tr style={{ background: C.primary, color: C.white }}>
                  <th style={{ padding: "6px", fontSize: 9, background: "#9CA3AF" }}>Capital Est.</th>
                  <th style={{ padding: "6px", fontSize: 9, background: "#9CA3AF", borderRight: `1px solid rgba(255,255,255,0.2)` }}>Plus-value</th>
                  <th style={{ padding: "6px", fontSize: 9 }}>Capital Est.</th>
                  <th style={{ padding: "6px", fontSize: 9, borderRight: `1px solid rgba(255,255,255,0.2)` }}>Plus-value</th>
                  <th style={{ padding: "6px", fontSize: 9, background: C.gold }}>Capital Est.</th>
                  <th style={{ padding: "6px", fontSize: 9, background: C.gold }}>Plus-value</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.lightGray : C.white, borderBottom: `1px solid ${C.mediumGray}` }}>
                    <td style={{ padding: "6px", fontWeight: 700, color: C.primary }}>N+{r.year}</td>
                    <td style={{ padding: "6px", color: C.darkGray }}>{fmt(r.versements)} €</td>

                    <td style={{ padding: "6px", color: C.darkGray }}>{fmt(r.val1)} €</td>
                    <td style={{ padding: "6px", color: r.pv1 >= 0 ? "#10B981" : "#EF4444", fontWeight: 600, borderRight: `1px solid ${C.lightGray}` }}>{r.pv1 >= 0 ? "+" : ""}{fmt(r.pv1)} €</td>

                    <td style={{ padding: "6px", fontWeight: 700, color: C.primary }}>{fmt(r.val2)} €</td>
                    <td style={{ padding: "6px", color: r.pv2 >= 0 ? "#10B981" : "#EF4444", fontWeight: 700, borderRight: `1px solid ${C.lightGray}` }}>{r.pv2 >= 0 ? "+" : ""}{fmt(r.pv2)} €</td>

                    <td style={{ padding: "6px", fontWeight: 700, color: C.gold }}>{fmt(r.val3)} €</td>
                    <td style={{ padding: "6px", color: r.pv3 >= 0 ? "#10B981" : "#EF4444", fontWeight: 600 }}>{r.pv3 >= 0 ? "+" : ""}{fmt(r.pv3)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}
// ────────────────────── PREVIEW MODAL ──────────────────────

function ReportPreview({ data, onClose, onUpdateData, appSettings, onEdit, onDelete }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: "", subject: "", body: "" });

  const isCurrentHidden = (data.hiddenSlides || []).includes(currentSlide);

  const toggleHideSlide = () => {
    const hidden = data.hiddenSlides || [];
    const newHidden = isCurrentHidden ? hidden.filter(idx => idx !== currentSlide) : [...hidden, currentSlide];
    onUpdateData({ ...data, hiddenSlides: newHidden });
  };

  const getPrintedPageNumber = (origIdx) => {
    let count = 0;
    for(let i=0; i<=origIdx; i++) {
      if (!(data.hiddenSlides || []).includes(i)) count++;
    }
    return count;
  };

  useEffect(() => {
    if (data._autoDownload) {
      const timer = setTimeout(() => {
        handleDownloadPDF();
      }, 800); // Laisse le temps au DOM de se générer avant le snapshot PDF
      return () => clearTimeout(timer);
    }
  }, [data._autoDownload]);

  const typeMap = { "swissquote": "Compte_Titres", "prevoyance": "Prevoyance", "lpp": "LPP", "assurance-vie": "Assurance_Vie" };
  const pdfFilename = `Rapport_${typeMap[data.templateId] || "Financier"}_${data.prenom ? data.prenom.trim() + "_" : ""}${(data.nom || 'Client').trim()}.pdf`.replace(/\s+/g, '_');

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
            filename: pdfFilename,
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

  const openEmailModal = () => {
    const replaceVars = (str) => {
      return str.replace(/{{prenom}}/g, data.prenom || "")
                .replace(/{{nom}}/g, (data.nom || "").toUpperCase())
                .replace(/{{conseiller}}/g, data.conseiller || "");
    };

    setEmailForm({
      to: data.emailClient || "",
      subject: replaceVars(appSettings.emailSubject),
      body: replaceVars(appSettings.emailBody)
    });
    setShowEmailModal(true);
  };

  const handleConfirmEmail = async () => {
    const webhookUrl = appSettings.reportWebhookUrl?.trim();
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      setEmailError("Veuillez configurer une URL de Webhook valide dans les paramètres.");
      setTimeout(() => setEmailError(""), 5000);
      return;
    }

    setShowEmailModal(false);
    setIsEmailing(true);

    const element = document.getElementById('report-printable');
    if (!element) {
        setIsEmailing(false);
        return;
    }

    // 1. Convertir les images en base64 (pour éviter les erreurs CORS du PDF)
    const images = element.querySelectorAll('img.pdf-image');
    const imagePromises = Array.from(images).map(async (img) => {
        if (img.src && !img.src.startsWith('data:')) {
            const base64 = await getBase64Image(img.src);
            img.src = base64;
        }
    });
    await Promise.all(imagePromises);

    // 2. Transformer les textareas en div le temps de la capture
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

    // Pause de 500ms indispensable pour que le DOM se mette à jour correctement
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const html2pdf = await requireHtml2Pdf();

      // Sécurité anti-page blanche (scroll tout en haut avant capture)
      window.scrollTo(0, 0);

      // 3. Génération du PDF en base64 en mémoire avec la méthode fiable
      const opt = {
        margin: 0,
        filename: pdfFilename,
        image: { type: 'jpeg', quality: 0.8 },
        html2canvas: { scale: 1.5, useCORS: true, scrollY: 0, scrollX: 0, windowWidth: 1280, logging: false },
        pagebreak: { mode: ['css', 'legacy'] },
        jsPDF: { unit: 'in', format: [13.33334, 7.5], orientation: 'landscape' }
      };

      const rawPdfBase64 = await new Promise((resolve) => {
        html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf) => resolve(pdf.output('datauristring')));
      });

      // On isole proprement la base64 pure
      const pureBase64 = rawPdfBase64.includes('base64,') ? rawPdfBase64.substring(rawPdfBase64.indexOf('base64,') + 7) : rawPdfBase64;

      // 4. Envoi réel des données au Webhook Make.com
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailForm.to,
          subject: emailForm.subject,
          body: emailForm.body,
          pdfBase64: pureBase64,
          filename: pdfFilename
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Make.com a refusé l'envoi (${response.status}): ${errText}`);
      }

      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email :", error);
      setEmailError(`Erreur lors de l'envoi : ${error.message || 'Vérifiez le lien du webhook.'}`);
      setTimeout(() => setEmailError(""), 5000);
    } finally {
      // 5. Restauration de l'interface
      replacements.forEach(({ textarea, div }) => {
        textarea.style.display = '';
        div.remove();
      });
      setIsEmailing(false);
    }
  };

  const slidesSwissquote = [
    <SlideCover data={data} />,
    <SlideTOC data={data} />,
    <SlidePhilosophy data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideAbout data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideSituation data={data} />,
    <SlideSwissquote data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideAdvantages data={data} />,
    <SlideDivider data={data} number={8} title="Compte-titres" editMode={editMode} onTextChange={handleTextChange} />,
    <SlideCompteTitre data={data} editMode={editMode} onTextChange={handleTextChange} />,
    ...(data.assetManager === "ParFinance" ? [
      <SlideParFinanceIntro data={data} editMode={editMode} onTextChange={handleTextChange} />,
      <SlideParFinanceFactsheet data={data} />,
      <SlideFund data={data} />
    ] : [
      <SlideFund data={data} />
    ]),
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

  if (data.showPrevoyanceComparatif !== false) {
      slidesPrevoyance.push(<SlidePrevoyanceComparatif data={data} />);
  }

  if (data.profilRisque === "Dynamique") {
      slidesPrevoyance.push(<SlidePrevoyanceFondsDynamique data={data} />);
  }
  slidesPrevoyance.push(<SlidePrevoyanceRachat data={data} editMode={editMode} onTextChange={handleTextChange} />);

  if (data.optiFiscale) {
      slidesPrevoyance.push(<SlidePrevoyanceFiscalite data={data} editMode={editMode} onTextChange={handleTextChange} />);
  }
  slidesPrevoyance.push(<SlideProjectionsPrevoyance data={data} />);
  slidesPrevoyance.push(<SlideContact data={data} editMode={editMode} onTextChange={handleTextChange} />);

  const slidesLPP = [
    <SlideCover data={data} />,
    <SlideTOCLPP data={data} />,
    <SlidePhilosophy data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideAbout data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideSituation data={data} />,
    <SlideLPPIntro data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideLPPFonctionnement data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideLPPLibrePassage data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideLPPAdministrateur data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideLPPAvantagesCLP data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideLPPAllocation data={data} />,
    <SlideLPPProjections data={data} />,
    <SlideContact data={data} editMode={editMode} onTextChange={handleTextChange} />,
  ];

  const slidesAssuranceVie = [
    <SlideCover data={data} />,
    <SlideTOCAssuranceVie data={data} />,
    <SlidePhilosophy data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideAbout data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlideSituation data={data} />,
    <SlideAvSolutions data={data} editMode={editMode} onTextChange={handleTextChange} />,
    <SlidePERFonctionnement data={data} />,
    <SlideAvFiscalite data={data} />,
    <SlideAvGestion data={data} />,
    <SlideAvProjections data={data} index={1} />
  ];

  if (data.hasProjectionsMultiples) {
    slidesAssuranceVie.push(<SlideAvProjections data={data} index={2} />);
  }

  slidesAssuranceVie.push(<SlideContact data={data} editMode={editMode} onTextChange={handleTextChange} />);

  const slides = data.templateId === "lpp" ? slidesLPP : data.templateId === "prevoyance" ? slidesPrevoyance : data.templateId === "assurance-vie" ? slidesAssuranceVie : slidesSwissquote;

  return (
    <div className="preview-modal-container" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="no-print" style={{ background: C.black, padding: "10px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <span style={{ color: C.white, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em" }}>APERCU — {data.prenom} {(data.nom||"").toUpperCase()}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button onClick={onEdit} style={{ background: "rgba(255,255,255,0.1)", color: C.white, border: "none", padding: "6px 12px", cursor: "pointer", fontFamily: F.ui, fontSize: 10, fontWeight: 600, borderRadius: "999px", transition: "0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.2)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
            PARAMÉTRAGE
          </button>
          <button onClick={() => setEditMode(!editMode)} style={{ background: editMode ? C.goldUI : "transparent", border: `1px solid ${editMode ? C.goldUI : "rgba(255,255,255,0.3)"}`, color: C.white, padding: "6px 12px", cursor: "pointer", fontFamily: F.ui, fontSize: 10, fontWeight: 600, borderRadius: "999px", transition: "0.2s" }}>
            {editMode ? "TERMINER TEXTES" : "TEXTES LIBRES"}
          </button>
          <button onClick={toggleHideSlide} style={{ background: isCurrentHidden ? "rgba(239,68,68,0.2)" : "transparent", color: isCurrentHidden ? "#FCA5A5" : C.white, border: `1px solid ${isCurrentHidden ? "rgba(252,165,165,0.3)" : "rgba(255,255,255,0.3)"}`, padding: "6px 12px", cursor: "pointer", fontFamily: F.ui, fontSize: 10, fontWeight: 600, borderRadius: "999px", transition: "0.2s" }}>
            {isCurrentHidden ? "RÉAFFICHER" : "MASQUER SLIDE"}
          </button>
          <button onClick={onDelete} style={{ background: "transparent", color: "#FCA5A5", border: "1px solid rgba(252,165,165,0.3)", padding: "6px 12px", cursor: "pointer", fontFamily: F.ui, fontSize: 10, fontWeight: 600, borderRadius: "999px", transition: "0.2s" }} onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,0.2)";e.currentTarget.style.color="#FFF"}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#FCA5A5"}}>
            SUPPRIMER
          </button>

          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.2)", margin: "0 4px" }} />

          <button onClick={handleDownloadPDF} disabled={isPdfLoading || isEmailing} style={{ background: C.white, color: C.accentDark, border: "none", padding: "6px 12px", cursor: (isPdfLoading || isEmailing) ? "wait" : "pointer", fontFamily: F.ui, fontSize: 10, fontWeight: 700, borderRadius: "999px", opacity: (isPdfLoading || isEmailing) ? 0.7 : 1, transition: "0.2s" }}>
            {isPdfLoading ? "GÉNÉRATION..." : "TÉLÉCHARGER PDF"}
          </button>
          <button onClick={openEmailModal} disabled={isPdfLoading || isEmailing} style={{ background: emailSuccess ? "#10B981" : C.goldUI, color: C.white, border: "none", padding: "6px 12px", cursor: (isPdfLoading || isEmailing) ? "wait" : "pointer", fontFamily: F.ui, fontSize: 10, fontWeight: 700, borderRadius: "999px", opacity: (isPdfLoading || isEmailing) ? 0.7 : 1, transition: "0.2s" }}>
            {isEmailing ? "ENVOI..." : emailSuccess ? "ENVOYÉ !" : "EMAIL"}
          </button>

          <span style={{ color: C.goldUI, fontSize: 11, marginLeft: 4 }}>{currentSlide + 1} / {slides.length}</span>
          <button onClick={onClose} style={{ background: "transparent", color: C.dim, border: "none", padding: "6px 12px", cursor: "pointer", fontFamily: F.ui, fontSize: 11, fontWeight: 600 }}>FERMER ✕</button>
        </div>
      </div>
      <div className="no-print" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 60px", position: "relative", minHeight: 0 }}>
        <button onClick={() => setCurrentSlide(s => Math.max(0, s - 1))} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: currentSlide === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)", color: currentSlide === 0 ? "rgba(255,255,255,0.2)" : C.white, border: "none", width: 40, height: 40, cursor: currentSlide === 0 ? "default" : "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>&#8249;</button>

        <div style={{ width: 960, height: 540, position: "relative", boxShadow: "0 8px 40px rgba(0,0,0,0.5)", overflow: "hidden", backgroundColor: C.white }}>
          <div style={{ width: 1280, height: 720, transform: "scale(0.75)", transformOrigin: "top left", position: "absolute", top: 0, left: 0, opacity: isCurrentHidden ? 0.3 : 1, filter: isCurrentHidden ? "grayscale(100%)" : "none", transition: "all 0.3s" }}>
            {slides[currentSlide]}
            <div style={{ position: "absolute", bottom: 0, right: 40, height: 40, display: "flex", alignItems: "center", zIndex: 20 }}>
              <span style={{ color: C.white, fontSize: 11, fontWeight: 700 }}>{isCurrentHidden ? "-" : getPrintedPageNumber(currentSlide)}</span>
            </div>
          </div>
          {isCurrentHidden && (
             <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "rgba(0,0,0,0.8)", color: "#FCA5A5", padding: "16px 32px", fontSize: 20, fontWeight: 700, borderRadius: 8, zIndex: 50, pointerEvents: "none", border: "2px solid #FCA5A5" }}>
               MASQUÉE DE L'IMPRESSION
             </div>
          )}
        </div>

        <button onClick={() => setCurrentSlide(s => Math.min(slides.length - 1, s + 1))} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: currentSlide === slides.length - 1 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)", color: currentSlide === slides.length - 1 ? "rgba(255,255,255,0.2)" : C.white, border: "none", width: 40, height: 40, cursor: currentSlide === slides.length - 1 ? "default" : "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>&#8250;</button>
      </div>
      <div className="no-print" style={{ background: C.black, padding: "8px 24px", display: "flex", gap: 4, overflowX: "auto", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        {slides.map((_, i) => {
          const isHid = (data.hiddenSlides || []).includes(i);
          return (
            <div key={i} onClick={() => setCurrentSlide(i)} style={{ width: 48, height: 28, background: i === currentSlide ? C.accent : "rgba(255,255,255,0.06)", border: i === currentSlide ? `1px solid ${C.goldUI}` : "1px solid rgba(255,255,255,0.04)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: i === currentSlide ? C.white : isHid ? "#EF4444" : "rgba(255,255,255,0.35)", fontWeight: 600, flexShrink: 0, textDecoration: isHid ? "line-through" : "none" }}>
              {i + 1}
            </div>
          );
        })}
      </div>

      <div style={{ position: "fixed", top: 0, left: 0, zIndex: -1000, opacity: 0.001, pointerEvents: "none" }}>
        <div id="report-printable" style={{ width: "1280px", height: `${slides.filter((_, i) => !(data.hiddenSlides || []).includes(i)).length * 720}px`, display: "block", background: C.white, overflow: "hidden" }}>
          {slides.map((SlideComponent, index) => {
            if ((data.hiddenSlides || []).includes(index)) return null;
            return (
              <div key={index} className="pdf-slide" style={{ width: "1280px", height: "720px", position: "relative", overflow: "hidden", backgroundColor: "#FFFFFF", margin: 0, padding: 0, boxSizing: "border-box" }}>
                {SlideComponent}
                <div style={{ position: "absolute", bottom: 0, right: 40, height: 40, display: "flex", alignItems: "center", zIndex: 20 }}>
                  <span style={{ color: C.white, fontSize: 11, fontWeight: 700 }}>{getPrintedPageNumber(index)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isPdfLoading && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.95)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: F.serif, fontSize: 32, fontWeight: 700, color: C.accent, marginBottom: 16 }}>
            Génération du rapport en cours...
          </div>
          <div style={{ fontSize: 13, color: C.gray, fontWeight: 500, fontFamily: F.ui }}>
            Veuillez patienter pendant la capture haute définition...
          </div>
        </div>
      )}
      {isEmailing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.95)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: F.serif, fontSize: 32, fontWeight: 700, color: C.accent, marginBottom: 16 }}>
            Envoi de l'email en cours...
          </div>
          <div style={{ fontSize: 13, color: C.gray, fontWeight: 500, fontFamily: F.ui }}>
            Connexion à l'automatisation Make.com...
          </div>
        </div>
      )}

      {showEmailModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.white, width: 500, padding: 32, borderRadius: C.radius, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontFamily: F.serif, fontSize: 24, color: C.accent, marginTop: 0, marginBottom: 24 }}>Envoyer le rapport par email</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: F.mono }}>Email destinataire</label>
              <input style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.line2}`, borderRadius: 12, fontSize: 13, fontFamily: F.ui, boxSizing: "border-box", outline: "none" }} value={emailForm.to} onChange={e=>setEmailForm({...emailForm, to: e.target.value})} placeholder="client@email.com" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: F.mono }}>Objet</label>
              <input style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.line2}`, borderRadius: 12, fontSize: 13, fontFamily: F.ui, boxSizing: "border-box", outline: "none" }} value={emailForm.subject} onChange={e=>setEmailForm({...emailForm, subject: e.target.value})} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: F.mono }}>Message</label>
              <textarea style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.line2}`, borderRadius: 12, fontSize: 13, fontFamily: F.ui, boxSizing: "border-box", outline: "none", minHeight: 140, resize: "vertical" }} value={emailForm.body} onChange={e=>setEmailForm({...emailForm, body: e.target.value})} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => setShowEmailModal(false)} style={{ background: "transparent", color: C.muted, border: `1px solid ${C.line2}`, padding: "10px 20px", cursor: "pointer", fontFamily: F.ui, fontSize: 13, fontWeight: 600, borderRadius: "999px" }}>Annuler</button>
              <button onClick={handleConfirmEmail} style={{ background: C.accent, color: C.white, border: "none", padding: "10px 20px", cursor: "pointer", fontFamily: F.ui, fontSize: 13, fontWeight: 600, borderRadius: "999px" }}>Confirmer l'envoi</button>
          </div>
        </div>
      </div>
    )}

    {emailError && (
      <div style={{ position: "fixed", bottom: 40, right: 40, background: "#EF4444", color: C.white, padding: "12px 24px", fontSize: 14, fontWeight: 600, boxShadow: "0 10px 25px rgba(239, 68, 68, 0.3)", zIndex: 10001, display: "flex", alignItems: "center", gap: 10, animation: "fadeIn 0.3s ease-out" }}>
        <span style={{ fontSize: 18 }}>!</span> {emailError}
      </div>
    )}
  </div>
);
}
// ────────────────────── MAIN APP / LAYOUT ──────────────────────
// Styles partagés de la coquille — direction artistique WallSmart
// (SF Pro / Inter, boutons pilule, champs arrondis,
//  cartes radius 20, accents or #B98A3D).

const S = {
  label: { display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 7, letterSpacing: "0", textTransform: "none", fontFamily: F.ui },
  input: { width: "100%", padding: "11px 14px", border: `1px solid ${C.line2}`, fontSize: 14, fontFamily: F.ui, color: C.text, background: C.card, outline: "none", boxSizing: "border-box", borderRadius: "12px", transition: "border-color .2s, box-shadow .2s" },
  select: { width: "100%", padding: "11px 14px", border: `1px solid ${C.line2}`, fontSize: 14, fontFamily: F.ui, color: C.text, background: C.card, outline: "none", cursor: "pointer", boxSizing: "border-box", borderRadius: "12px" },
  fg: { marginBottom: 16 },
  card: { background: C.card, padding: 24, boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 28px rgba(0,0,0,0.05)", border: `1px solid ${C.line}`, borderRadius: C.radius },
  cardTitle: { fontSize: 12.5, fontWeight: 700, textTransform: "none", letterSpacing: "-0.01em", color: C.text, marginBottom: 18, display: "flex", alignItems: "center", gap: 10, fontFamily: F.ui },
  dot: { width: 9, height: 9, borderRadius: "50%", background: C.accent, flexShrink: 0 },
  btnP: { background: C.accent, color: "#FFFFFF", border: "none", padding: "12px 26px", cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", borderRadius: "980px", boxShadow: "0 2px 8px rgba(105,33,2,.28)" },
  btnS: { background: C.card, color: C.accent, border: `1px solid ${C.line2}`, padding: "11px 24px", cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 600, borderRadius: "980px" },
};

const PREDEFINED_AGENTS = [
  { prenom: "Fleurie", nom: "PEREZ MATTHEEUWS", tel: "076 286 55 26", email: "fp.mattheeuws@wallswiss.ch", genre: "F" },
  { prenom: "Jesse", nom: "BELE", tel: "078 237 99 83", email: "j.bele@wallswiss.ch", genre: "M" },
  { prenom: "Léna", nom: "LE MANCHEC", tel: "076 768 36 56", email: "l.lemanchec@wallswiss.ch", genre: "F" },
  { prenom: "Denis", nom: "PHILIBERT", tel: "078 260 23 55", email: "d.philibert@wallswiss.ch", genre: "M" },
  { prenom: "Edouard", nom: "MELOUX", tel: "078 247 41 93", email: "e.meloux@wallswiss.ch", genre: "M" },
  { prenom: "Esteban", nom: "TORAL", tel: "078 232 05 50", email: "e.toral@wallswiss.ch", genre: "M" },
  { prenom: "Baptiste", nom: "HAENSLER", tel: "077 209 29 08", email: "b.haensler@wallswiss.ch", genre: "M" },
  { prenom: "Louis", nom: "BORNE", tel: "076 231 92 75", email: "l.borne@wallswiss.ch", genre: "M" },
  { prenom: "Badis", nom: "TOUIHRI", tel: "", email: "b.touihri@wallswiss.ch", genre: "M" },
  { prenom: "Cloé", nom: "BESNARD", tel: "", email: "c.besnard@wallswiss.ch", genre: "F" }
];

// ══════════════════════════════════════════════════════════════════
//  SOMMAIRE WALLSWISS — arborescence complète (7 sections, sous-onglets).
//  · action.type "module"  → rouvre un module existant de la barre du haut.
//  · action.type "url"     → ouvre un lien externe (nouvel onglet).
//  · sans action / feuille → ouvre une page placeholder (DocPageView).
// ══════════════════════════════════════════════════════════════════
const WS_MENU = [
  {
    id: "1", num: "1", title: "Logiciels WallSwiss", icon: "Layers",
    children: [
      { id: "1.1", num: "1.1", title: "CRM – Salesforce", action: { type: "url", url: "https://wallswiss.my.salesforce.com/" } },
      { id: "1.2", num: "1.2", title: "Générateur de rapport financier", action: { type: "module", module: "rapport" } },
      { id: "1.3", num: "1.3", title: "Générateur de planification retraite", action: { type: "module", module: "retraiteR1" } },
      { id: "1.4", num: "1.4", title: "Mon agenda – Calendly" },
      { id: "1.5", num: "1.5", title: "Simulateur Quasi-Résident / TOU" },
      { id: "1.6", num: "1.6", title: "Simulateur d'intérêts composés" },
      { id: "1.7", num: "1.7", title: "Générateur de factures" },
      {
        id: "1.8", num: "1.8", title: "Signaler un incident",
        children: [
          { id: "1.8.1", num: "1.8.1", title: "Cyber-incident" },
          { id: "1.8.2", num: "1.8.2", title: "Conflits d'intérêts" },
          { id: "1.8.3", num: "1.8.3", title: "Événements sensibles" },
          { id: "1.8.4", num: "1.8.4", title: "Problème RH" },
        ]
      },
    ]
  },
  {
    id: "2", num: "2", title: "Mon espace personnel", icon: "User",
    children: [
      { id: "2.1", num: "2.1", title: "Mes outils d'auto-analyse – Trackers" },
      { id: "2.2", num: "2.2", title: "Mon simulateur de commissions" },
      { id: "2.3", num: "2.3", title: "Mes demandes (congés, frais, matériel…)", action: { type: "module", module: "tickets" } },
      { id: "2.4", num: "2.4", title: "Les règles en entreprise" },
      {
        id: "2.5", num: "2.5", title: "Événements",
        children: [
          { id: "2.5.1", num: "2.5.1", title: "Sondages" },
          { id: "2.5.2", num: "2.5.2", title: "Photos : événements WallSwiss" },
        ]
      },
      { id: "2.6", num: "2.6", title: "Boîte à idées : ensemble, nous allons plus loin !", action: { type: "module", module: "idees" } },
      { id: "2.7", num: "2.7", title: "Challenges en cours" },
      { id: "2.8", num: "2.8", title: "Mes débuts chez WallSwiss" },
    ]
  },
  {
    id: "3", num: "3", title: "Procédures", icon: "CheckSquare",
    children: [
      { id: "3.1", num: "3.1", title: "Reprise de gestion" },
      {
        id: "3.2", num: "3.2", title: "Investissements",
        children: [
          { id: "3.2.1", num: "3.2.1", title: "Compte-titres" },
          { id: "3.2.2", num: "3.2.2", title: "Private Equity" },
          { id: "3.2.3", num: "3.2.3", title: "Assurance vie France" },
          { id: "3.2.4", num: "3.2.4", title: "Assurance vie Luxembourg" },
          { id: "3.2.5", num: "3.2.5", title: "Plan d'Épargne Retraite – PER" },
        ]
      },
      {
        id: "3.3", num: "3.3", title: "Planification retraite",
        children: [
          { id: "3.3.1", num: "3.3.1", title: "Formule BASIC" },
          { id: "3.3.2", num: "3.3.2", title: "Formule COUPLE" },
          { id: "3.3.3", num: "3.3.3", title: "Formule PREMIUM" },
        ]
      },
      {
        id: "3.4", num: "3.4", title: "Prévoyance individuelle",
        children: [
          { id: "3.4.1", num: "3.4.1", title: "Liechtenstein Life" },
          { id: "3.4.2", num: "3.4.2", title: "Rente Genevoise" },
          { id: "3.4.3", num: "3.4.3", title: "Autres compagnies" },
        ]
      },
      {
        id: "3.5", num: "3.5", title: "Banques",
        children: [
          { id: "3.5.1", num: "3.5.1", title: "Swissquote" },
          { id: "3.5.2", num: "3.5.2", title: "Bank Zweiplus" },
          { id: "3.5.3", num: "3.5.3", title: "Autres banques partenaires" },
        ]
      },
      {
        id: "3.6", num: "3.6", title: "Libre passage",
        children: [
          { id: "3.6.1", num: "3.6.1", title: "Lémania" },
          { id: "3.6.2", num: "3.6.2", title: "Liberty" },
          { id: "3.6.3", num: "3.6.3", title: "Pictet" },
          { id: "3.6.4", num: "3.6.4", title: "J. Safra Sarasin" },
        ]
      },
      {
        id: "3.7", num: "3.7", title: "Fiscalité",
        children: [
          {
            id: "3.7.1", num: "3.7.1", title: "Fiscalité française",
            children: [
              { id: "3.7.1.1", num: "3.7.1.1", title: "Check-list + mail" },
              { id: "3.7.1.2", num: "3.7.1.2", title: "Protocole déclaration simple" },
              { id: "3.7.1.3", num: "3.7.1.3", title: "Protocole déclaration + LMNP" },
            ]
          },
          {
            id: "3.7.2", num: "3.7.2", title: "Fiscalité suisse",
            children: [
              { id: "3.7.2.1", num: "3.7.2.1", title: "Résident – TOU" },
              { id: "3.7.2.2", num: "3.7.2.2", title: "Frontalier – QR" },
            ]
          },
        ]
      },
    ]
  },
  {
    id: "4", num: "4", title: "Base documentaire", icon: "FileText",
    children: [
      { id: "4.1", num: "4.1", title: "Mails types", action: { type: "module", module: "mails" } },
      { id: "4.2", num: "4.2", title: "Documents administratifs", action: { type: "module", module: "ressources" } },
    ]
  },
  {
    id: "5", num: "5", title: "Académie WallSwiss – Base de connaissances", icon: "PieChart",
    children: [
      { id: "5.1", num: "5.1", title: "Cours AFA / IAF" },
      {
        id: "5.2", num: "5.2", title: "Formation commerciale",
        children: [
          { id: "5.2.1", num: "5.2.1", title: "Vidéos de formation" },
          { id: "5.2.2", num: "5.2.2", title: "Book de formation" },
        ]
      },
      { id: "5.3", num: "5.3", title: "France – PER" },
      { id: "5.4", num: "5.4", title: "France – Assurance vie" },
      { id: "5.5", num: "5.5", title: "Europe – Assurance vie Luxembourg" },
      { id: "5.6", num: "5.6", title: "France – SCPI" },
      { id: "5.7", num: "5.7", title: "Suisse – Libre passage" },
      { id: "5.8", num: "5.8", title: "Suisse – Prévoyance individuelle" },
      { id: "5.9", num: "5.9", title: "Suisse – Création d'entreprise" },
      { id: "5.10", num: "5.10", title: "France – Création d'entreprise" },
      { id: "5.11", num: "5.11", title: "Suisse – AVS (1er pilier)" },
      { id: "5.12", num: "5.12", title: "France – Calcul de la retraite française" },
      { id: "5.13", num: "5.13", title: "Utilisation de la calculette financière", action: { type: "module", module: "academie", doc: "notice-calc" } },
      { id: "5.14", num: "5.14", title: "Formation investissement" },
      { id: "5.15", num: "5.15", title: "Formation KYC" },
      { id: "5.16", num: "5.16", title: "Formation Compliance" },
      { id: "5.17", num: "5.17", title: "Intermédiaire non lié – Guide des obligations" },
    ]
  },
  { id: "6", num: "6", title: "Annuaires", icon: "BookContacts", action: { type: "module", module: "annuaire" } },
  {
    id: "7", num: "7", title: "Hub Marketing", icon: "Target",
    children: [
      { id: "7.1", num: "7.1", title: "Charte graphique + logo" },
      { id: "7.2", num: "7.2", title: "Carnet de recommandation" },
      { id: "7.3", num: "7.3", title: "Lettre à en-tête WallSwiss" },
      { id: "7.4", num: "7.4", title: "Bannières réseaux sociaux" },
      { id: "7.5", num: "7.5", title: "Organisation de mon WhatsApp Business" },
      { id: "7.6", num: "7.6", title: "Présentation des services" },
      { id: "7.7", num: "7.7", title: "Organisation LinkedIn Business" },
      { id: "7.8", num: "7.8", title: "Des publications pour mes réseaux" },
    ]
  },
];

// Page générique (placeholder « en construction ») pour les onglets neufs du sommaire.
/* ═══════════════════════════════════════════════════════════════════════════
   WS_CONTENT — Contenu transféré depuis Notion (2 hubs : « Ma page d'accueil »
   + « Company Home »). Chaque clé correspond à l'id d'un nœud du sommaire
   (WS_MENU). DocPageView affiche ce contenu à la place du placeholder.
   ▸ Sécurité : AUCUN mot de passe n'est stocké ici (voir gestionnaire dédié).
   ═══════════════════════════════════════════════════════════════════════════ */
const WS_CONTENT = {
  // ── 2.2 · Rémunération / commissions ──
  "2.2": { tag: "Rémunération", blocks: [
    ["p", "La rémunération WallSwiss combine un fixe (CDI) et une part variable selon un barème par produit. Deux simulateurs Excel officiels permettent de projeter la commission avant chaque souscription."],
    ["docs", ["Simulateur commissions INVESTISSEMENT - WS.xlsx", "Simulateur commissions ASSURANCE - WS.xlsx"]],
    ["h", "Catégories de commissionnement"],
    ["kv", [["Assurance", "3ᵉ pilier · PER · Assurance vie France · Libre passage"], ["Investissement", "Cryptomonnaie · Compte-titres"]]],
    ["h", "SwissLife — Assurance vie & capitalisation (France)"],
    ["li", ["Gamme dédiée (barème avancé) : SwissLife Strategic Premium (assurance vie) et SwissLife Capi Strategic Premium (capitalisation).", "Surcommission de +2,25 % sur la part investie en unités de compte (UC), qui s'ajoute aux frais d'entrée appliqués.", "Exemple : souscription 100 % UC avec 3,50 % de frais → le cabinet perçoit 3,50 % + 2,25 % = 5,75 %."]],
    ["h", "PER individuel — versements programmés"],
    ["p", "À la mise en place de versements périodiques, WallSwiss avance l'équivalent de 4 ans de commissions sur versement."],
    ["li", ["Part UC : (7,75 % + frais sur versements) × 4 ans.", "Exemple : 500 €/mois en 100 % UC → 6 000 €/an → 41 % × 6 000 € = 2 460 € perçus par le cabinet."]],
    ["warn", "Reprises : si les versements périodiques s'arrêtent, la rémunération est revue à la baisse pendant 4 ans."],
    ["h", "Note de frais"],
    ["p", "La politique de dépenses fixe des limites avec validations obligatoires selon le montant."],
  ]},
  // ── 2.4 · Règlement interne ──
  "2.4": { tag: "Règlement interne", blocks: [
    ["p", "Espace évolutif qui reflète la culture WallSwiss : un environnement de travail organisé, respectueux et collaboratif."],
    ["h", "Relations sociales"],
    ["p", "Chacun contribue à un cadre respectueux. Toute discrimination (âge, orientation sexuelle, sexe, origine, religion, handicap) est interdite. Bon sens de rigueur."],
    ["docs", ["seco_personlichkeit_f_web.pdf (lecture obligatoire)"]],
    ["h", "Bureaux & concentration"],
    ["p", "Espace semi-flexible ; les équipes sont regroupées pour mieux collaborer. La concentration prime : casque sur les oreilles = ne pas déranger."],
    ["h", "Règles de fonctionnement & sanctions"],
    ["docs", ["WS - Règles de fonctionnement et sanctions.pdf", "WS - Charte d'entreprise.docx", "WS - Règlement Intérieur.docx", "WS - Conditions pour le versement d'une commission.pdf"]],
    ["h", "Horaires & télétravail"],
    ["li", ["4 jours de présentiel + 1 jour de télétravail (en option).", "Jour de télétravail à faire approuver par le manager ou le directeur.", "Plage horaire : 10h00 – 18h00."]],
    ["h", "Repas du soir"],
    ["p", "Dîner offert à celles et ceux qui restent au bureau après 20h00 (n'importe quel service de livraison). Contraintes : ne pas dépasser 20 CHF et conserver le reçu."],
    ["h", "Nettoyage & environnement"],
    ["li", ["Rincer sa vaisselle et la ranger ; jeter ses déchets.", "Nettoyer la machine à café si on est le dernier le matin.", "Rendre les salles de conférence propres.", "Éteindre les lumières en partant ; chauffage/clim uniquement si nécessaire ; privilégier le recyclage."]],
    ["h", "Parking"],
    ["p", "Des places WallSwiss sont à disposition au Parking Seujet."],
    ["info", "Toute question, idée ou remarque : contact@wallswiss.ch"],
  ]},
  // ── 2.8 · Onboarding ──
  "2.8": { tag: "Onboarding", blocks: [
    ["p", "Bienvenue chez WallSwiss. Voici les étapes pour bien démarrer."],
    ["h", "1. Mon admin — documents à fournir"],
    ["li", ["Fiche employé(e) conseiller à remplir et retourner à contact@wallswiss.ch.", "Pièce d'identité.", "Extrait de casier judiciaire (< 3 mois, pays de résidence).", "Copie des diplômes.", "Extrait du registre des poursuites.", "Numéro de téléphone suisse (+41) et IBAN CH."]],
    ["h", "2. Documents à signer"],
    ["li", ["Contrat CDI.", "Charte d'entreprise.", "Règlement intérieur.", "Tableau des commissions + conditions de versement conseiller.", "Engagement impôt à la source ; déclaration AVS (si pas de n° AVS) ; prélèvement selon situation familiale."]],
    ["h", "3. Mes accès outils"],
    ["li", ["Notion, Salesforce, Calendly, Canva, Outlook.", "WhatsApp Business, LinkedIn Business.", "Cartes de visite : communiquer le n° suisse à contact@wallswiss.ch (objet « Commande de carte de visite »)."]],
    ["h", "4. Mon parcours de formation"],
    ["li", ["Prospection : création de leads, trames de prospection.", "Maîtrise de l'entretien commercial.", "3P (phases 1 & 2), LPP (phases 1 & 2).", "Fiscalité : RS · TOU · QR, comparateur.", "Private Equity, Assurance vie, Gestion de fortune.", "Logiciels : Salesforce, Notion, outils de souscription (3P, Private, LPP, PARfinance)."]],
  ]},
  // ── 3.1 · Reprise de gestion ──
  "3.1": { tag: "Procédure · Conformité", blocks: [
    ["p", "Protocole interne de reprise de gestion, aligné avec les exigences FINMA (partenaire Liechtenstein Life notamment)."],
    ["ok", "Reprise ACCEPTÉE uniquement en cas d'action concrète sur la police :"],
    ["li", ["Suppression d'une garantie Select ou changement de la stratégie de fonds.", "Augmentation des primes versées.", "Travail avec le client sur l'investissement ou la fiscalité."]],
    ["warn", "Toute reprise sans modification stratégique ni action concrète n'est plus acceptée."],
  ]},
  // ── 3.4.1 · Liechtenstein Life ──
  "3.4.1": { tag: "Fiche partenaire · Prévoyance", blocks: [
    ["p", "Partenaire prévoyance individuelle (3ᵉ pilier). Ressources et process de souscription."],
    ["li", ["Conditions générales + souscription papier vierge + flyers.", "Courrier type.", "Tutoriel vidéo — process de signature.", "Fonds de placement.", "Documents utiles (modification de fonds, augmentation…).", "Guide de paiement."]],
    ["warn", "Protocole de reprise (FINMA) : reprise acceptée uniquement en cas de suppression de garantie Select, changement de stratégie de fonds, augmentation des primes, ou travail investissement/fiscalité. Pas de reprise sans action concrète."],
  ]},
  // ── 3.5.1 · Swissquote ──
  "3.5.1": { tag: "Fiche partenaire · Banque", blocks: [
    ["p", "Banque / dépôt-titres partenaire. Suivi des portefeuilles et protocole de trading."],
    ["info", "Consulter les références de portefeuilles au moins 1×/semaine et les mettre en favoris."],
    ["docs", ["Nouveau Protocole de trading 13.10.2025.pdf"]],
    ["h", "Portefeuilles modèles"],
    ["li", ["PARfinance : Dynamique · Équilibre · Conservateur.", "NS Partners : Swiss Excellence DPM (CHF) · DGC Stock Selection A EUR · DGC Energy DPM EUR (écologique)."]],
  ]},
  // ── 3.6.1 / 3.6.2 / 3.6.3 · Libre passage LPP ──
  "3.6.1": { tag: "Fiche partenaire · Libre passage", blocks: [
    ["p", "Fondation de libre passage LPP partenaire — Lemania."],
    ["li", ["Solutions de 2ᵉ pilier / libre passage.", "Stratégies suivies : NS Golden Age Balanced, LPFX Mirabaud, Mirabaud Prévention."]],
  ]},
  "3.6.2": { tag: "Fiche partenaire · Libre passage", blocks: [
    ["p", "Fondation de libre passage LPP partenaire — Liberty."],
    ["li", ["Solutions de 2ᵉ pilier / libre passage."]],
  ]},
  "3.6.3": { tag: "Fiche partenaire · Libre passage", blocks: [
    ["p", "Fondation de prévoyance / libre passage LPP partenaire — Pictet."],
    ["li", ["Stratégies LPP suivies : Pictet LPP 40, Pictet LPP 60."]],
  ]},
  // ── 3.7.1.1 · Check-list + mail ──
  "3.7.1.1": { tag: "Fiscalité · Outils", blocks: [
    ["p", "Check-lists documentaires et e-mails types pour les déclarations fiscales."],
    ["docs", ["CLIENT - Check List 2026 RS.WS.pdf", "CLIENT - Déclarations fiscales QR.pdf", "Tarifs déclarations fiscales WS - Permis G, B, L.pdf"]],
    ["h", "E-mail post-rendez-vous (principe)"],
    ["p", "Demander systématiquement : IBAN suisse (CH…), copie du permis de travail ou pièce d'identité. Toujours une action claire demandée, formulation cordiale, relances cadrées."],
  ]},
  // ── 3.7.1.2 · Rectification Simple (RS) ──
  "3.7.1.2": { tag: "Procédure · Rectification Simple", blocks: [
    ["p", "Deux voies : Option 1 — Rectification Simple par le cabinet WallSwiss ; Option 2 — via Allo-Déclaration (à noter dans Salesforce si Allo-Déclaration)."],
    ["steps", ["Prendre la liste des documents — « CLIENT - Check List 2026 RS.WS » (PDF ou site WallSwiss).", "Vérifier que le dossier est complet selon le cas client (voir ci-dessous).", "Comprendre l'utilité de chaque document demandé.", "Informations complémentaires : soumis à l'IS à Genève en 2025 ? La TOU serait-elle plus avantageuse ?", "Déposer le dossier dans la bannette FISCALITÉ (aucun envoi sans double vérification).", "Appliquer les bonnes pratiques (voir encadré).", "Tarification : 100 CHF (espèces ou facture)."]],
    ["sub", "Cas clients — documents requis", [
      ["li", ["A0 – Célibataire : formulaire original ou e-démarche, certificat de salaire + attestation-quittance 2025, permis de travail, IBAN CHF.", "C/B – Marié avec enfants : formulaire DRIS TOU, certificat de salaire + quittance 2025, livret de famille + montant des allocations perçues en Suisse.", "H – Célibataire avec enfants à charge : formulaire original ou e-démarche, certificat de salaire + quittance 2025, permis de travail, IBAN CHF, livret de famille + allocations."]],
    ]],
    ["warn", "Depuis le 01.01.2024 : les enfants en garde alternée paritaire sans pension ne peuvent plus être rattachés via une rectification à Genève → déclaration de quasi-résident obligatoire."],
    ["warn", "Délai légal strict : demande de rectification avant le 31 mars 2026 (même s'il manque des justificatifs — préciser qu'ils suivront)."],
    ["sub", "Bonnes pratiques", [
      ["li", ["Rectifications au stylo noir.", "Ne jamais s'engager sur un montant de retour d'impôt devant le client.", "Pas de dépôt sans dossier complet ET paiement reçu.", "Prévenir d'un délai long : retours entre octobre 2026 et février 2027.", "Privilégier l'e-démarche (le papier / la création d'accès prend jusqu'à 4 semaines).", "Utiliser le simulateur avec les bons chiffres (revenus suisses, français, allocations)."]],
    ]],
  ]},
  // ── 3.7.1.3 · Déclaration transfrontalière + LMNP ──
  "3.7.1.3": { tag: "Procédure · Déclaration transfrontalière", blocks: [
    ["p", "Déclaration d'impôt transfrontalier 2026. Périmètre WallSwiss : Genève, Vaud, Valais uniquement. Document de référence : l'avis d'imposition français N-1 (solde d'impôt, plafond PER, composition du foyer)."],
    ["h", "Distinction par canton"],
    ["kv", [["Genève (GE)", "Déclaration FR (2042 + 2047 + 2047-Suisse + 3916). Double dossier possible FR + TOU (tarif premium). Pas de 2041-AS."], ["Vaud (VD)", "Régime des 8 cantons (accord 11.04.1983) : 2047 + 2047-Suisse + 2041-AS. Retour au domicile FR ≥ 1×/semaine. Télétravail 40 % max."], ["Valais (VS)", "Même régime des 8 cantons que VD : 2041-AS, contrôle annuel du seuil de télétravail (40 %)."]]],
    ["h", "Règle de traitement"],
    ["li", ["Option 1 — Le cabinet traite en interne (point d'entrée d'une relation patrimoniale durable).", "Option 2 — Redirection : LMNP → Questionnaire fiscal dédié ; dossier simple → Allo-Déclaration."]],
    ["h", "Process WallSwiss — 6 étapes"],
    ["steps", ["Prise de rendez-vous en ligne (calendrier WallSwiss) + email de confirmation.", "Questionnaire fiscal de pré-entretien + check-list personnalisée par canton.", "Dépôt des documents par le client (espace client, email chiffré ou bannette FISCALITÉ) ; relance à J+3 si incomplet.", "Entretien fiscal (1h) + validation du traitement, signature du mandat et encaissement.", "Finalisation : contrôle croisé obligatoire par Pierrick, validation client, télétransmission via impots.gouv.fr, copie PDF + archivage 10 ans.", "Suivi post-dépôt + déclenchement PER (relances FR, questionnaire annuel en mars)."]],
    ["h", "Cross-sell PER"],
    ["p", "Le PER est un complément naturel (TMI frontalière souvent élevée → gain fiscal 30–45 %). À réception de l'avis FR : calcul du plafond PER puis proposition d'audit patrimonial (30 min)."],
  ]},
  // ── 3.7.2.1 · Quasi-Résident (TOU) ──
  "3.7.2.1": { tag: "Procédure · Quasi-Résident (TOU)", blocks: [
    ["p", "Le quasi-résident (TOU) permet une déclaration complète, avec accès aux déductions effectives — logique identique à un résident, sans devenir résident fiscal suisse."],
    ["h", "Distinction IS / DRIS / TOU"],
    ["kv", [["Impôt à la source", "Calcul automatique, barèmes standards, déductions forfaitaires, aucune personnalisation."], ["DRIS (rectification)", "Correction très limitée depuis 2021 (barème, enfants, erreurs techniques)."], ["TOU (quasi-résident)", "Déclaration complète, déductions effectives, imposition réelle (donc variable)."]]],
    ["h", "La règle des 90 %"],
    ["p", "Éligibilité : au moins 90 % des revenus mondiaux du foyer imposables en Suisse. Sont comptés hors Suisse : salaires FR, revenus fonciers France, valeur locative, dividendes/intérêts, pensions alimentaires perçues."],
    ["warn", "Le quasi-résident n'est PAS automatiquement favorable : sans charges déductibles suffisantes, il peut être défavorable. Interdiction interne WallSwiss de déposer sans analyse."],
    ["h", "Déductions accessibles uniquement via la TOU"],
    ["li", ["Rachats LPP, frais de garde, pensions alimentaires, frais de formation.", "Intérêts d'emprunt, travaux d'entretien, frais médicaux importants."]],
    ["warn", "Choix irréversible pour l'année, coût fiduciaire, dossier lourd. Règle d'or : pas de TOU sans compréhension complète du client."],
    ["h", "Process WallSwiss"],
    ["steps", ["Qualification : découverte client + schéma fiscalité (obligatoire en rendez-vous).", "Simulation : simulateur QR → audit QR ; expliquer les 3 options (IS / DRIS / TOU).", "Validation écrite de la compréhension du client — aucune promesse de remboursement.", "Collecte documentaire (check-list unique WallSwiss) + dossier tracé dans le CRM avec opportunité.", "Dépôt et suivi des relances de l'administration."]],
  ]},
  // ── 3.7.2.2 · Frontalier (QR) ──
  "3.7.2.2": { tag: "Procédure · Frontalier", blocks: [
    ["p", "Traitement fiscal du frontalier selon le canton de travail (voir aussi la déclaration transfrontalière)."],
    ["kv", [["Frontalier GE", "Déclaration FR obligatoire (2042 + 2047 + 2047-Suisse + 3916). Double dossier possible FR + TOU (le plus complet)."], ["Frontalier VD & VS", "Pas de DRIS/TOU côté suisse en standard. Attestation 2041-AS signée par l'employeur CH. Contrôle du seuil de télétravail (40 % max)."]]],
    ["info", "Cas de mobilité en cours d'année (GE→VD…) : traitement au prorata."],
    ["h", "Documents clés"],
    ["li", ["Avis d'imposition N-1 (indispensable), certificat de salaire CH 2025.", "Formulaires 2042 / 2047 / 2047-Suisse / 3916 ; 2041-AS pour VD & VS.", "Justificatif de domicile FR, pièce d'identité, livret de famille (enfants 18–25)."]],
  ]},
  // ── 1.10 · Logiciels & accès ──
  "1.10": { tag: "Logiciels & accès", blocks: [
    ["p", "Accès rapides aux outils WallSwiss. Les identifiants ne sont jamais stockés dans l'application : utilisez le gestionnaire de mots de passe de l'équipe."],
    ["li", ["CRM — Salesforce.", "Agenda — Calendly.", "Messagerie — Outlook.", "Design — Canva.", "IA — ChatGPT+ · Fathom (comptes-rendus de réunion).", "Création — Adobe.", "Simulateurs — Impôt à la source · Intérêts composés."]],
    ["docs", ["WS - Comment optimiser son Outlook.docx", "WS - PROCESS CALENDLY.docx"]],
    ["warn", "Sécurité : ne jamais partager de mot de passe en clair (chat, e-mail, document). Passer par un gestionnaire (1Password / Bitwarden)."],
  ]},
  // ── 3.8 · Taxe annuelle FINMA (AFA) ──
  "3.8": { tag: "Conformité · Process", blocks: [
    ["p", "Taxe annuelle de recertification (AFA) pour les collaborateurs inscrits comme intermédiaires d'assurance dans myAFA (art. 43 LSA)."],
    ["warn", "Sans paiement dans les délais, l'inscription au registre sectoriel est supprimée et la participation à l'examen de recertification est bloquée."],
    ["kv", [["Montant", "100,00 CHF par collaborateur (non soumis à la TVA)"], ["Délai", "30 jours dès réception du mail AFA"]]],
    ["h", "Process étape par étape"],
    ["steps", ["Réception du mail AFA (individuel) → transmettre immédiatement la facture à Pierrick pour paiement.", "Paiement électronique via le lien du mail AFA (CembraPay, TWINT, carte de débit/crédit).", "Confirmation : courriel de règlement + facture PDF sous 24h → à transmettre à Pierrick."]],
    ["h", "Bases légales & contact"],
    ["li", ["Art. 43 LSA · Art. 190a al. 1 OS · Art. 42 Normes minimales · Barème de frais AFA.", "Contact AFA : vermittler@vbv-afa.ch · 031 328 26 29 · vbv.ch."]],
  ]},
  // ── 7.9 · Distribution des leads & statuts ──
  "7.9": { tag: "Marketing · Process leads", blocks: [
    ["p", "Les leads sont centralisés dans un fichier MASTER LEADS puis distribués automatiquement aux équipes (managers : Baptiste, Louis, Pierrick) selon des poids définis, avec règle anti-doublons."],
    ["h", "Statuts obligatoires (nomenclature)"],
    ["li", ["NEW — nouveau lead entrant (auto).", "À rappeler — contact effectué, relance planifiée.", "NRP 1 à 5 — appels sans réponse (1er au 5e).", "R1 Fixé — 1er rendez-vous fixé ; R1 non honoré — voir Salesforce.", "Devis signé — voir Salesforce.", "Pas intéressé — refus du rendez-vous ; Mauvais numéro — coordonnées invalides."]],
    ["warn", "Règle d'or : mettre le statut à jour immédiatement après chaque interaction (les statistiques sont calculées en temps réel)."],
    ["li", ["Réactivité : traiter les leads dès réception.", "Notes : renseigner chaque échange dans la colonne Notes.", "Transferts : toujours la fonction de ré-attribution (jamais de copier-coller manuel)."]],
  ]},

  /* ═══════════ Contenu métier — tous les autres nœuds du sommaire ═══════════ */

  // ── Section 1 · Logiciels & outils ──
  "1.4": { tag: "Outil · Agenda", blocks: [
    ["p", "Calendly gère la prise de rendez-vous en ligne : le prospect choisit un créneau, le RDV se synchronise avec Outlook et une confirmation part automatiquement."],
    ["h", "Bonnes pratiques"],
    ["li", ["Un type d'événement par usage (R1 découverte 45 min, R2 conseil 60 min, point fiscal 30 min).", "Prévoir un buffer entre deux rendez-vous et des plages de disponibilité réalistes.", "Synchroniser Calendly avec Outlook pour éviter les doubles réservations.", "Personnaliser le lien et le message de confirmation aux couleurs WallSwiss."]],
    ["docs", ["WS - PROCESS CALENDLY.docx"]],
  ]},
  "1.5": { tag: "Outil · Fiscalité", blocks: [
    ["p", "Outil Excel pour comparer les trois traitements fiscaux du frontalier (impôt à la source, DRIS, quasi-résident TOU) et vérifier l'éligibilité avant tout dépôt."],
    ["h", "Quand l'utiliser"],
    ["li", ["Systématiquement avant de proposer une déclaration TOU.", "Pour vérifier la règle des 90 % (revenus mondiaux imposables en Suisse).", "Pour objectiver le gain ou la perte et ne jamais promettre un remboursement."]],
    ["info", "Procédure détaillée : Procédures › Fiscalité › Résident – TOU."],
    ["docs", ["OUTIL - Rectification à la source - WallSwiss.xlsx"]],
  ]},
  "1.6": { tag: "Outil · Investissement", blocks: [
    ["p", "Projette la croissance d'un capital dans le temps, avec versements réguliers, taux de rendement et durée — l'outil pédagogique clé pour illustrer l'effet long terme."],
    ["h", "Usage commercial"],
    ["li", ["Montrer l'impact d'un versement mensuel régulier (PER, assurance vie, 3a).", "Comparer plusieurs scénarios de rendement et de durée.", "Matérialiser le coût d'attendre (démarrer tôt plutôt que tard)."]],
  ]},
  "1.7": { tag: "Outil · Facturation", blocks: [
    ["p", "Produit les factures d'honoraires WallSwiss (gestion de fortune, fiscalité, conseil) à la charte du cabinet, avec le bulletin de versement QR suisse intégré."],
    ["li", ["Sélectionner la prestation et le montant, puis générer le PDF.", "Le bulletin QR reste conforme (IBAN QR, référence).", "Numérotation et archivage selon la procédure comptable."]],
    ["docs", ["Facture honoraires gestion de fortune - WS", "Guide de paiement des primes 3P"]],
  ]},
  "1.8.1": { tag: "Conformité · Incident", blocks: [
    ["p", "Tout événement touchant la sécurité informatique : phishing, e-mail frauduleux, perte ou vol d'appareil, accès non autorisé, suspicion de fuite de données."],
    ["ok", "Réflexes immédiats"],
    ["steps", ["Isoler : déconnecter l'appareil du réseau, ne pas cliquer ni payer, ne rien supprimer.", "Sécuriser : changer les mots de passe concernés depuis un autre appareil.", "Signaler sans délai à contact@wallswiss.ch et à la direction (heure, description, captures).", "Documenter l'incident et suivre les consignes reçues."]],
    ["warn", "Ne jamais communiquer d'identifiant ou de donnée client en réponse à une sollicitation, même urgente."],
  ]},
  "1.8.2": { tag: "Conformité", blocks: [
    ["p", "Un conflit d'intérêts naît quand un intérêt personnel, une rémunération ou une relation peut influencer le conseil donné au client."],
    ["h", "Conduite à tenir"],
    ["steps", ["Identifier et déclarer toute situation potentielle à la direction.", "S'abstenir de décider seul dans la situation concernée.", "Privilégier toujours l'intérêt du client et la transparence sur la rémunération.", "Consigner la situation au registre des conflits d'intérêts."]],
    ["info", "Cadre : LSFin / obligations FINMA. En cas de doute : contact@wallswiss.ch."],
  ]},
  "1.8.3": { tag: "Conformité · LBA", blocks: [
    ["p", "Opérations inhabituelles, origine des fonds douteuse, personne politiquement exposée (PPE) ou tout soupçon de blanchiment (LBA)."],
    ["warn", "Ne jamais alerter le client d'un soupçon (interdiction du « tipping-off »)."],
    ["steps", ["Documenter les faits et les indices objectifs.", "Alerter immédiatement le responsable conformité / la direction.", "Ne pas exécuter d'opération douteuse sans validation.", "La communication au MROS relève de la direction, pas du conseiller."]],
  ]},
  "1.8.4": { tag: "RH · Confidentiel", blocks: [
    ["p", "Difficulté relationnelle, conflit, harcèlement, mal-être ou situation personnelle impactant le travail."],
    ["li", ["Échange confidentiel possible avec la direction ou le référent RH.", "Aucune situation n'est traitée au détriment de la personne qui signale.", "Contact : contact@wallswiss.ch (objet « RH – confidentiel »)."]],
  ]},

  // ── Section 2 · Mon espace personnel ──
  "2.1": { tag: "Développement personnel", blocks: [
    ["p", "Outils d'auto-analyse pour piloter sa performance et ses habitudes : suivi d'activité commerciale et suivi des habitudes personnelles."],
    ["h", "Ce qu'on suit"],
    ["li", ["Activité : appels, prises de RDV, R1/R2, devis, souscriptions (taux de transformation).", "Habitudes : routines quotidiennes via le Habit Tracker.", "Objectifs : revue hebdomadaire de ses chiffres et axes de progrès."]],
  ]},
  "2.5.1": { tag: "Vie d'équipe", blocks: [
    ["p", "Espace des sondages internes : donnez votre avis sur l'organisation, les événements et les outils. Vos retours orientent les décisions de l'équipe."],
  ]},
  "2.5.2": { tag: "Vie d'équipe", blocks: [
    ["p", "La vie WallSwiss en images : séminaires, soirées et temps forts de l'équipe (séminaire Courchevel, événements SwissLife, séminaires partenaires…)."],
    ["info", "Galerie alimentée après chaque événement."],
  ]},
  "2.7": { tag: "Challenges", blocks: [
    ["p", "Les challenges commerciaux et marketing en cours : objectifs, règles, classement et récompenses."],
    ["li", ["Challenge marketing : mise en avant des meilleures campagnes et contenus.", "Suivi des performances et du classement de l'équipe.", "Récompenses attribuées selon les résultats."]],
  ]},

  // ── Section 3 · Procédures (investissement, retraite, partenaires) ──
  "3.2.1": { tag: "Procédure · Investissement", blocks: [
    ["p", "Ouverture et gestion d'un compte-titres (dépôt bancaire) chez notre partenaire Swissquote, pour investir en direct ou via mandat."],
    ["steps", ["Qualification du client : objectifs, horizon, profil de risque (KYC).", "Ouverture Swissquote : formulaires, pièces d'identité, justificatifs.", "Choix de la gestion : libre, conseillée ou sous mandat (portefeuilles modèles).", "Suivi : consulter les références de portefeuilles au moins 1×/semaine."]],
    ["info", "Fiche partenaire : Procédures › Banques › Swissquote."],
  ]},
  "3.2.2": { tag: "Procédure · Investissement", blocks: [
    ["p", "Investissement en capital-investissement via notre partenaire Altaroc (millésimes annuels) : accès à des fonds de Private Equity historiquement réservés aux institutionnels."],
    ["h", "Points clés client"],
    ["li", ["Horizon long (8 à 10 ans) et capital peu liquide.", "Appels de capitaux progressifs (le montant engagé est investi par tranches).", "Réservé à une clientèle avertie disposant déjà d'une épargne diversifiée.", "Objectif de performance supérieure aux marchés cotés, en contrepartie du risque et de l'illiquidité."]],
    ["warn", "Vérifier l'adéquation (profil, liquidité, compréhension du risque) avant toute souscription."],
  ]},
  "3.2.3": { tag: "Procédure · Investissement", blocks: [
    ["p", "Assurance vie française via SwissLife (gamme Strategic Premium) : enveloppe d'épargne et de transmission souple, en fonds euro et/ou unités de compte."],
    ["h", "Atouts"],
    ["li", ["Fiscalité allégée sur les gains après 8 ans de détention (abattement annuel).", "Transmission avantageuse (régime propre à l'assurance vie).", "Arbitrages entre supports sans fiscalité tant qu'il n'y a pas de rachat."]],
    ["info", "Rémunération : voir Mon espace › Simulateur de commissions."],
  ]},
  "3.2.4": { tag: "Procédure · Investissement", blocks: [
    ["p", "Assurance vie luxembourgeoise pour la clientèle patrimoniale : sécurité renforcée et neutralité fiscale (imposition selon le pays de résidence)."],
    ["h", "Spécificités"],
    ["li", ["Triangle de sécurité et super-privilège : protection renforcée de l'épargnant.", "Neutralité fiscale luxembourgeoise (fiscalité appliquée = celle du pays de résidence).", "Supports sur-mesure (fonds internes dédiés FID/FAS) dès un certain encours.", "Adaptée aux clients mobiles ou à patrimoine important."]],
  ]},
  "3.2.5": { tag: "Procédure · Investissement", blocks: [
    ["p", "Plan d'Épargne Retraite individuel (France) : épargne retraite déductible du revenu imposable, cible privilégiée des frontaliers fortement imposés."],
    ["h", "Mécanique"],
    ["li", ["Versements déductibles du revenu imposable, dans la limite du plafond épargne retraite.", "Gain fiscal proportionnel à la tranche marginale d'imposition (TMI).", "Sortie en capital et/ou en rente ; cas de déblocage anticipé (dont résidence principale).", "Complément naturel d'une déclaration fiscale : proposer un audit PER à réception de l'avis d'imposition."]],
  ]},
  "3.3.1": { tag: "Planification retraite", blocks: [
    ["p", "Formule d'entrée : un bilan clair de la situation prévoyance d'un client individuel."],
    ["li", ["Analyse des 3 piliers (AVS, LPP, prévoyance individuelle).", "Estimation des revenus à la retraite et identification des lacunes.", "Première recommandation d'optimisation (3a, rachats LPP).", "Livrable généré via le module « Générateur de planification retraite »."]],
  ]},
  "3.3.2": { tag: "Planification retraite", blocks: [
    ["p", "Planification retraite pour un couple : consolidation des deux situations et optimisation commune."],
    ["li", ["Analyse croisée des prévoyances des deux partenaires.", "Optimisation fiscale et successorale du couple.", "Coordination des rachats LPP et versements 3a.", "Livrable via le générateur de planification retraite."]],
  ]},
  "3.3.3": { tag: "Planification retraite", blocks: [
    ["p", "Formule complète : planification patrimoniale approfondie intégrant prévoyance, fiscalité, investissement et transmission."],
    ["li", ["Bilan patrimonial global (prévoyance, immobilier, placements, dettes).", "Stratégie fiscale et de transmission sur mesure.", "Scénarios de retraite chiffrés et plan d'action pluriannuel.", "Suivi dans le temps et revue périodique."]],
  ]},
  "3.4.2": { tag: "Fiche · Prévoyance", blocks: [
    ["p", "La Rente Genevoise (institution genevoise de prévoyance) : solutions de prévoyance individuelle et de rentes viagères, ancrage genevois."],
    ["li", ["Produits de prévoyance 3e pilier et rentes garanties.", "Alternative aux compagnies pour une clientèle attachée à un acteur local."]],
    ["info", "Coordonnées et supports : à compléter dans la fiche partenaire."],
  ]},
  "3.4.3": { tag: "Prévoyance", blocks: [
    ["p", "Panorama des autres compagnies de prévoyance individuelle mobilisables selon le besoin client."],
    ["li", ["Comparer garanties, frais, souplesse des versements et qualité des fonds.", "Choisir selon le profil et l'objectif (épargne, prévoyance décès/invalidité, fiscalité).", "Documenter le comparatif remis au client (devoir de conseil)."]],
  ]},
  "3.5.2": { tag: "Fiche · Banque", blocks: [
    ["p", "Bank zweiplus : banque partenaire de dépôt-titres, alternative à Swissquote selon les besoins du client."],
    ["info", "Process d'ouverture et coordonnées : à compléter dans la fiche partenaire."],
  ]},
  "3.5.3": { tag: "Banque", blocks: [
    ["p", "Autres banques dépositaires mobilisables selon la situation (résidence, devise, type d'actifs)."],
    ["li", ["Critères : frais de dépôt, accès aux marchés, service B2B, exigences KYC.", "Documenter le choix de la banque dépositaire dans le dossier client."]],
  ]},
  "3.6.4": { tag: "Fiche · Libre passage", blocks: [
    ["p", "J. Safra Sarasin : fondation de libre passage / prévoyance partenaire pour le placement des avoirs du 2e pilier."],
    ["li", ["Solutions de libre passage avec stratégies de placement diversifiées.", "Alternative à Lemania, Pictet et Liberty selon le profil de risque."]],
    ["info", "Coordonnées et supports : à compléter dans la fiche partenaire."],
  ]},

  // ── Section 5 · Académie (base de connaissances) ──
  "5.1": { tag: "Académie · Certification", blocks: [
    ["p", "Formation et certification de l'intermédiaire d'assurance (AFA / examen IAF) : la base réglementaire pour exercer."],
    ["li", ["Cadre légal (LSA), produits d'assurance, devoirs d'information et de conseil.", "Examen de (re)certification et inscription au registre myAFA.", "Recertification annuelle liée à la taxe AFA (voir Procédures › Taxe annuelle FINMA)."]],
  ]},
  "5.2.5": { tag: "Académie", blocks: [
    ["p", "Bibliothèque vidéo de formation commerciale : entretien, objections, produits."],
    ["info", "Accéder aux ebooks et supports : Académie › Bibliothèque de formation."],
  ]},
  "5.3": { tag: "Académie · France", blocks: [
    ["p", "Module de formation sur le Plan d'Épargne Retraite (PER) français."],
    ["li", ["Fonctionnement : déductibilité, plafond, sortie en capital ou en rente.", "Public cible : frontaliers et contribuables à TMI élevée.", "Argumentaire : gain fiscal immédiat + capitalisation long terme.", "Voir la procédure : Procédures › Investissements › PER."]],
  ]},
  "5.4": { tag: "Académie · France", blocks: [
    ["p", "Module de formation sur l'assurance vie française."],
    ["li", ["Enveloppe d'épargne et de transmission ; fonds euro vs unités de compte.", "Fiscalité des rachats après 8 ans ; avantages successoraux.", "Positionnement WallSwiss : SwissLife Strategic Premium."]],
  ]},
  "5.5": { tag: "Académie · Europe", blocks: [
    ["p", "Module de formation sur l'assurance vie luxembourgeoise (clientèle patrimoniale)."],
    ["li", ["Triangle de sécurité, super-privilège, neutralité fiscale.", "Fonds internes dédiés (FID/FAS) et mobilité internationale.", "Différences clés avec l'assurance vie française."]],
  ]},
  "5.6": { tag: "Académie · France", blocks: [
    ["p", "Module de formation sur les SCPI (Sociétés Civiles de Placement Immobilier) — la « pierre-papier »."],
    ["li", ["Principe : investir dans un parc immobilier mutualisé et percevoir des revenus.", "Revenus fonciers réguliers ; fiscalité foncière (ou via l'assurance vie / le démembrement).", "Diversification immobilière sans gestion en direct ; liquidité limitée."]],
  ]},
  "5.7": { tag: "Académie · Suisse", blocks: [
    ["p", "Module de formation sur le 2e pilier et le libre passage (LPP)."],
    ["li", ["Quand l'avoir LPP passe en libre passage (sortie d'employeur, expatriation).", "Fondations partenaires : Lemania, Pictet, Liberty, J. Safra Sarasin.", "Stratégies de placement et fiscalité au retrait."]],
  ]},
  "5.8": { tag: "Académie · Suisse", blocks: [
    ["p", "Module sur le 3e pilier suisse (3a lié / 3b libre)."],
    ["li", ["3a : déductible fiscalement dans la limite du plafond annuel en vigueur.", "3b : épargne libre, sans plafond mais sans déduction.", "Usage : combler les lacunes de prévoyance et optimiser l'impôt."]],
  ]},
  "5.9": { tag: "Académie · Suisse", blocks: [
    ["p", "Module sur la création d'entreprise en Suisse et ses enjeux de prévoyance."],
    ["li", ["Formes juridiques : raison individuelle, Sàrl, SA.", "Prévoyance de l'indépendant : affiliation LPP, 3a « grand pilier ».", "Enjeux fiscaux et sociaux au démarrage."]],
  ]},
  "5.10": { tag: "Académie · France", blocks: [
    ["p", "Module sur la création d'entreprise en France."],
    ["li", ["Statuts : micro-entreprise, EI, EURL, SASU / SAS.", "Régimes social et fiscal selon le statut.", "Articulation avec l'épargne retraite (PER) et la protection sociale du dirigeant."]],
  ]},
  "5.11": { tag: "Académie · Suisse", blocks: [
    ["p", "Module sur l'AVS, le 1er pilier suisse (prévoyance étatique)."],
    ["li", ["Financement par cotisations ; couverture vieillesse, survivants, invalidité.", "Rente selon les années de cotisation et le revenu déterminant.", "Lacunes de cotisation : identification et rachats possibles."]],
  ]},
  "5.12": { tag: "Académie · France", blocks: [
    ["p", "Module sur le calcul de la retraite française (utile aux frontaliers ayant cotisé en France)."],
    ["li", ["Régime général : trimestres, salaire annuel moyen, taux.", "Carrières mixtes France / Suisse : coordination des droits.", "Reconstitution de carrière et relevés à demander."]],
  ]},
  "5.14": { tag: "Académie", blocks: [
    ["p", "Module sur les fondamentaux de l'investissement."],
    ["li", ["Profils de risque et allocation d'actifs.", "Diversification, horizon et couple rendement / risque.", "Gamme WallSwiss : compte-titres, Private Equity, assurance vie, mandats."]],
  ]},
  "5.15": { tag: "Académie · Conformité", blocks: [
    ["p", "Module « Know Your Customer » : connaître son client et documenter la relation."],
    ["li", ["Identification et vérification (pièce d'identité, domicile, bénéficiaire effectif).", "Profil de risque et adéquation des produits proposés.", "Origine des fonds et vigilance LBA.", "Tenue et mise à jour du dossier client (Salesforce)."]],
  ]},
  "5.16": { tag: "Académie · Conformité", blocks: [
    ["p", "Module conformité : cadre réglementaire de l'activité (LSFin / LEFin, FINMA)."],
    ["li", ["Devoirs d'information, de diligence et de documentation.", "Transparence sur les rémunérations et gestion des conflits d'intérêts.", "Protection des données et sécurité de l'information."]],
  ]},
  "5.17": { tag: "Académie · Conformité", blocks: [
    ["p", "Statut d'intermédiaire d'assurance non lié : indépendance et obligations associées."],
    ["li", ["Inscription au registre et information du client sur le statut.", "Transparence sur les liens et la rémunération.", "Devoir de conseil documenté et comparaison objective des solutions."]],
  ]},

  // ── Section 7 · Hub Marketing ──
  "7.1": { tag: "Marketing · Direction artistique", blocks: [
    ["p", "La direction artistique WallSwiss garantit une image cohérente sur tous les supports."],
    ["kv", [["Couleurs", "Oxblood #692102 · Champagne #9C8B5C · fond crème"], ["Typographies", "Titres Times New Roman · textes Montserrat"], ["Style", "Angles vifs (radius 0) · emblème lion"]]],
    ["li", ["Logo disponible en versions couleur, blanc et monochrome.", "Ne pas déformer le logo ni modifier les couleurs de marque."]],
  ]},
  "7.2": { tag: "Marketing", blocks: [
    ["p", "Le carnet de recommandation structure la demande de recommandations auprès des clients satisfaits — première source de leads qualifiés."],
    ["li", ["Demander la recommandation au bon moment (après une prestation réussie).", "Faciliter la mise en relation (message type, introduction).", "Suivre chaque recommandation dans le CRM."]],
  ]},
  "7.3": { tag: "Marketing", blocks: [
    ["p", "Modèle de lettre officielle à l'en-tête WallSwiss (logo lion, charte oxblood, pied de page légal) pour toute correspondance du cabinet."],
    ["docs", ["WS - Lettre à en-tête.docx"]],
  ]},
  "7.4": { tag: "Marketing", blocks: [
    ["p", "Gabarits de bannières et visuels aux formats réseaux (post 1080×1080, story 1080×1920, bannière LinkedIn 1200×627)."],
    ["li", ["Respecter la charte (couleurs, typographies, lion).", "Décliner un même message sur plusieurs formats.", "Kit générable via le module social WallSwiss."]],
  ]},
  "7.5": { tag: "Marketing", blocks: [
    ["p", "Configurer WhatsApp Business pour un usage professionnel propre et efficace."],
    ["li", ["Profil complet : nom, logo, description, horaires, site.", "Réponses rapides et messages d'accueil / d'absence.", "Catalogue de services ; séparer nettement le pro et le perso."]],
  ]},
  "7.6": { tag: "Marketing", blocks: [
    ["p", "Support de présentation des services WallSwiss (prévoyance, fiscalité, investissement, gestion de fortune) pour les rendez-vous."],
    ["li", ["Pitch clair de l'offre et de la méthode WallSwiss.", "Adaptable selon le profil du prospect.", "À utiliser en R1 / R2 pour cadrer la relation."]],
  ]},
  "7.7": { tag: "Marketing", blocks: [
    ["p", "Optimiser son profil LinkedIn pour la prospection et la crédibilité."],
    ["li", ["Profil pro : photo, titre clair, résumé orienté client, bannière WallSwiss.", "Publier régulièrement (expertise, cas clients anonymisés, actualités).", "Prospecter : réseau frontalier, demandes de connexion personnalisées."]],
  ]},
  "7.8": { tag: "Marketing", blocks: [
    ["p", "Kit de publications prêtes à l'emploi pour alimenter vos réseaux sociaux."],
    ["li", ["Calendrier éditorial et thématiques récurrentes (fiscalité, prévoyance, marchés).", "Visuels à la charte + textes de publication et hashtags.", "Décliner un sujet en post, story et carrousel."]],
  ]},
};

/* Rendu des blocs de contenu WS_CONTENT (design Aurora). */
function WSBlocks({ blocks }) {
  const co = { warn: "#B45309", ok: "#047857", info: C.accent };
  const cbg = { warn: "rgba(180,83,9,.07)", ok: "rgba(4,120,87,.07)", info: C.accentSoft };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "left" }}>
      {(blocks || []).map((b, i) => {
        const k = b[0];
        if (k === "h") return <h3 key={i} style={{ fontFamily: F.serif, fontSize: 17, fontWeight: 700, color: C.text, margin: "10px 0 0", letterSpacing: "-0.01em" }}>{b[1]}</h3>;
        if (k === "p") return <p key={i} style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, margin: 0 }}>{b[1]}</p>;
        if (k === "li") return <ul key={i} style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>{b[1].map((x, j) => <li key={j} style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>{x}</li>)}</ul>;
        if (k === "steps") return <ol key={i} style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>{b[1].map((x, j) => <li key={j} style={{ fontSize: 13.5, color: C.text, lineHeight: 1.6, fontWeight: 500 }}>{x}</li>)}</ol>;
        if (k === "warn" || k === "ok" || k === "info") return <div key={i} style={{ background: cbg[k], borderLeft: `3px solid ${co[k]}`, padding: "11px 15px", borderRadius: 8, fontSize: 13, color: C.text, lineHeight: 1.6 }}>{b[1]}</div>;
        if (k === "docs") return <div key={i} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{b[1].map((x, j) => <span key={j} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.bgSoft, border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 11px", fontSize: 12, color: C.text, fontWeight: 500 }}>📄 {x}</span>)}</div>;
        if (k === "kv") return <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(120px, 200px) 1fr", gap: "8px 16px", alignItems: "start" }}>{b[1].map((r, j) => <React.Fragment key={j}><div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{r[0]}</div><div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>{r[1]}</div></React.Fragment>)}</div>;
        if (k === "sub") return <div key={i} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px", background: C.bgSoft }}><div style={{ fontWeight: 700, fontSize: 13.5, color: C.accent, marginBottom: 10 }}>{b[1]}</div><WSBlocks blocks={b[2]} /></div>;
        return null;
      })}
    </div>
  );
}

/* Documents de formation rattachés à chaque sous-menu de l'Académie (node id -> fichiers de public/academy/). */
const ACADEMY_NODE_DOCS = {
  "5.1": ["1002-directives-iaf-f.pdf","1004-moyens-auxiliaires-iaf-brevet-f.pdf","1006-formules-conseiller-financier-iaf-2015-f.pdf","1006-formules-iaf-version-2022.pdf","1010-checklist-donnees-documentation.pdf","1013-bases-objectifs.pdf","1014-slides-planification-liquidites.pdf","0901-journee-intro-mendo.pdf","EXAMEN - QCM OctNov.docx","13.EXERCICES - Recueil formules calculs.pdf","14.EXERCICES- Bases-calcul-questions.pdf","15.EXERCICES-calculs-financiers-questions.pdf","1019-nominale-reelle-questions.pdf","12.OUTIL - Notice CALCULATRICE FINANCIERE.docx","calculatrice-hp10b2.pdf"],
  "5.3": ["13239-Plaquette-SwissLife-PER-Individuel.pdf","13124-Notice-SLPERIN.pdf","Essentiel-Produit-SwissLife-PER-Individuel.pdf","Memo-vente-SwissLife-PER-Individuel.pdf","13213-Demande-de-transfert-vers-PER.pdf","Check-list-transferts-entrants-PER-1.pdf","12247-Plaquette-SwissLife-Retraite.pdf","Essentiel-Produit-SwissLife-Retraite[1].pdf","Memo-vente-SwissLife-Retraite.pdf","Checklist-Souscription-Swisslife Retraite.pdf","Demande transfert entrant.pdf","13691-Fiche-zoom-pilotage-retraite.pdf","Fiche-zoom-sur-le-pilotage-retraite.pdf","12635-Avt-mise-en-place-modif-et-suppression-Pilotage-042025f-1 (003).pdf","Annexe financière Epargne Swisslife.xlsx"],
  "5.4": ["ASSURANCE vie Fr.pdf","Fiche Eclair - Assurance vie Française.pdf","SWISSLIFE - Les prédateurs de l'assurance-vie V2.pdf"],
  "5.5": ["Premium LUX-VUL.pptx"],
  "5.6": ["Fiche eclair - SCPI.pdf"],
  "5.7": ["Documentation LPP.docx","Documentation - Rentes 1er et 2ème pilier.docx"],
  "5.8": ["Schema 3P - Entonnoir.docx","Systeme de prévoyance Suisse - Culture Général.docx"],
  "5.11": ["Assurances de personnes et assurances sociales.pdf","Systeme de prévoyance Suisse - Culture Général.docx"],
  "5.14": ["6.ACADEMY -Le guide pour mieux comprendre un factsheet de fonds.docx","Fiche éclair -  Investissement ISR.pdf","Fiche éclair - ETF ou trackers.pdf","Fiche éclair - PRODUIT STRUCTURE.pdf","Fiche eclair - compte titre.pdf","Fiche éclair - titres et bourse 1.pdf","Fiche éclair - titres et bourse 2.pdf"],
  "5.16": ["1 - LCB-FT Guide DISTRIBUTION 2022 (1).pdf","2.INFO - Ordonnance sur les déductions admises fiscalement.pdf"],
  // Procédures › Planification retraite (fichiers dans public/procedures/)
  "3.3.1": [
    { file: "Forfait-Essentiel-2026.pdf", base: "/procedures/", title: "Forfait Essentiel 2026" },
    { file: "Comparatif-Forfaits-2026.pdf", base: "/procedures/", title: "Comparatif des forfaits 2026" },
    { file: "Comparatif-Forfaits-2026-cartes.pdf", base: "/procedures/", title: "Comparatif forfaits 2026 (cartes)" },
  ],
  "3.3.2": [
    { file: "Forfait-Duo-2026.pdf", base: "/procedures/", title: "Forfait Duo 2026" },
    { file: "Comparatif-Forfaits-2026.pdf", base: "/procedures/", title: "Comparatif des forfaits 2026" },
    { file: "Comparatif-Forfaits-2026-cartes.pdf", base: "/procedures/", title: "Comparatif forfaits 2026 (cartes)" },
  ],
  "3.3.3": [
    { file: "Forfait-Premium-2026.pdf", base: "/procedures/", title: "Forfait Premium 2026" },
    { file: "Comparatif-Forfaits-2026.pdf", base: "/procedures/", title: "Comparatif des forfaits 2026" },
    { file: "Comparatif-Forfaits-2026-cartes.pdf", base: "/procedures/", title: "Comparatif forfaits 2026 (cartes)" },
  ],
  // Procédures › Prévoyance individuelle
  "3.4.1": [{ file: "06-Guide-paiement-primes-3P.pdf", base: "/procedures/", title: "Guide de paiement des primes 3e pilier" }],
  // Procédures › Fiscalité française
  "3.7.1.1": [{ file: "04-Checklist-Rectification-simple.pdf", base: "/procedures/", title: "Check-list rectification simple" }],
  "3.7.1.2": [
    { file: "04-Checklist-Rectification-simple.pdf", base: "/procedures/", title: "Check-list rectification simple" },
    { file: "07-Facture-Rectification-Simple.pdf", base: "/procedures/", title: "Facture rectification simple (100 CHF)" },
  ],
  "3.7.1.3": [{ file: "05-Checklist-Declaration-QR.pdf", base: "/procedures/", title: "Check-list déclaration complète (QR)" }],
  // Procédures › Fiscalité suisse
  "3.7.2.1": [
    { file: "07-Facture-Resident-Celibataire.pdf", base: "/procedures/", title: "Facture résident célibataire (195 CHF)" },
    { file: "07-Facture-Resident-Couple.pdf", base: "/procedures/", title: "Facture résident couple (230 CHF)" },
  ],
  "3.7.2.2": [
    { file: "05-Checklist-Declaration-QR.pdf", base: "/procedures/", title: "Check-list déclaration complète (QR)" },
    { file: "07-Facture-QR-Frontalier-Celibataire.pdf", base: "/procedures/", title: "Facture QR frontalier célibataire (290 CHF)" },
    { file: "07-Facture-QR-Frontalier-Couple.pdf", base: "/procedures/", title: "Facture QR frontalier couple (340 CHF)" },
  ],
};

/* Procédures interactives : étapes cochables avec documents rattachés à chaque étape. */
const PROCEDURE_STEPS = {
  // 3.5.1 · Swissquote — Ouverture de compte
  "3.5.1": [
    { title: "Ouvrir le compte Swissquote", detail: "Suivre le guide d'ouverture pas à pas avec le client : formulaire, pièces justificatives, validation du profil.", docs: [{ file: "08-Swissquote-Ouverture-guide.pdf", base: "/procedures/", title: "Guide d'ouverture de compte" }] },
    { title: "Signer la procuration de gestion", detail: "Mandat qui autorise le cabinet à piloter le portefeuille du client.", docs: [{ file: "10-Swissquote-Procuration-gestion.pdf", base: "/procedures/", title: "Procuration de gestion" }] },
    { title: "Signer la procuration LPOA", detail: "Limited Power of Attorney : procuration limitée exigée par Swissquote.", docs: [{ file: "11-Swissquote-LPOA.pdf", base: "/procedures/", title: "Procuration (LPOA)" }] },
    { title: "Confirmation Cross-Border", detail: "Attestation obligatoire pour les clients résidant hors de Suisse (frontaliers notamment).", docs: [{ file: "12-Swissquote-CrossBorder.pdf", base: "/procedures/", title: "Confirmation Cross-Border" }] },
    { title: "Identifier le client", detail: "Faire identifier le client, au choix via les CFF ou La Poste.", docs: [{ file: "13-Swissquote-Identification-CFF.pdf", base: "/procedures/", title: "Identification CFF" }, { file: "14-Swissquote-Identification-LaPoste.pdf", base: "/procedures/", title: "Identification La Poste" }] },
  ],
  // 3.1 · Reprise de gestion
  "3.1": [
    { title: "Faire signer le mandat de gestion", detail: "Document de base qui officialise la reprise du dossier par le cabinet.", docs: [{ file: "00-Mandat-de-gestion.pdf", base: "/procedures/", title: "Mandat de gestion" }] },
    { title: "Demander la libération des primes", detail: "Lettre type à envoyer à la compagnie pour libérer les primes.", docs: [{ file: "01-Lettre-Liberation-primes.pdf", base: "/procedures/", title: "Lettre libération des primes" }] },
    { title: "Demander la valeur de rachat", detail: "Lettre type pour obtenir le décompte et la valeur de rachat de la police.", docs: [{ file: "02-Lettre-Valeur-de-rachat.pdf", base: "/procedures/", title: "Lettre valeur de rachat" }] },
    { title: "Rechercher les avoirs 2e pilier", detail: "Envoi postal à la Centrale du 2e pilier (Berne) pour retrouver d'éventuels avoirs de libre passage oubliés.", docs: [{ file: "03-Lettre-cabinet-Envoi-Berne.pdf", base: "/procedures/", title: "Lettre cabinet (envoi Berne)" }, { file: "09-Centrale-Berne-Recherche-2P.pdf", base: "/procedures/", title: "Centrale de Berne (recherche 2e pilier)" }] },
  ],
};

function ProcedureSteps({ steps, onOpenDoc }) {
  const [done, setDone] = React.useState({});
  const [open, setOpen] = React.useState(0);
  const total = steps.length;
  const doneCount = Object.values(done).filter(Boolean).length;
  return (
    <div style={{ ...S.card, padding: 0, overflow: "hidden", marginTop: 20 }}>
      <div style={{ height: 4, background: C.accent }} />
      <div style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontFamily: F.serif, fontSize: 19, fontWeight: 700, color: C.text }}>Procédure étape par étape</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{total} étapes · cochez au fur et à mesure</div>
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.accent, background: C.accentSoft, padding: "6px 12px", borderRadius: 980 }}>{doneCount}/{total} fait</div>
        </div>
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          {steps.map((s, i) => {
            const isOpen = open === i; const isDone = !!done[i];
            return (
              <div key={i} style={{ border: `1px solid ${isDone ? "#bcdcc8" : C.line}`, borderRadius: 12, overflow: "hidden", background: isDone ? "#f3f9f5" : C.card }}>
                <div onClick={() => setOpen(isOpen ? -1 : i)} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 15px", cursor: "pointer" }}>
                  <button onClick={(e) => { e.stopPropagation(); setDone((d) => ({ ...d, [i]: !d[i] })); }}
                    style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 9, border: `1.5px solid ${isDone ? "#2f7d55" : C.line2}`, background: isDone ? "#2f7d55" : "#fff", color: isDone ? "#fff" : C.muted, fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isDone ? "✓" : (i + 1)}
                  </button>
                  <div style={{ flex: 1, fontWeight: 700, fontSize: 14.5, color: C.text, textDecoration: isDone ? "line-through" : "none", opacity: isDone ? 0.6 : 1 }}>{s.title}</div>
                  <span style={{ color: C.dim, fontSize: 11 }}>{isOpen ? "▲" : "▼"}</span>
                </div>
                {isOpen && (
                  <div style={{ padding: "0 16px 16px 58px" }}>
                    {s.detail && <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.65, margin: "0 0 12px" }}>{s.detail}</p>}
                    {s.docs && s.docs.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {s.docs.map((e, j) => (
                          <button key={j} onClick={() => onOpenDoc && onOpenDoc(e)}
                            style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.bgSoft, border: `1px solid ${C.line}`, borderRadius: 9, padding: "8px 12px", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: C.text }}
                            onMouseEnter={(ev) => { ev.currentTarget.style.borderColor = C.accent; }} onMouseLeave={(ev) => { ev.currentTarget.style.borderColor = C.line; }}>
                            <span style={{ fontSize: 8.5, fontWeight: 800, color: C.accent, background: C.accentSoft, borderRadius: 5, padding: "2px 5px" }}>{academyDocBadge((e.file || "").split(".").pop())}</span>
                            {e.title || e.file}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function academyDocBadge(t) {
  const e = (t || "").toLowerCase();
  if (e === "pdf") return "PDF";
  if (e === "docx" || e === "doc") return "DOCX";
  if (e === "pptx" || e === "ppt") return "PPT";
  if (e === "xlsx" || e === "xls" || e === "csv") return "XLS";
  if (e === "image") return "IMG";
  return (e || "DOC").toUpperCase().slice(0, 4);
}

function AcademyDocsSection({ files, acadMap, onOpenDoc }) {
  const norm = (e) => (typeof e === "string") ? { file: e, base: "/academy/" } : { file: e.file, base: e.base || "/academy/", title: e.title };
  const meta = (e) => {
    const n = norm(e);
    if (n.title) return { title: n.title, type: (n.file.split(".").pop() || "").toLowerCase() };
    if (n.base === "/academy/" && acadMap) {
      if (acadMap[n.file]) return acadMap[n.file];
      const t = n.file.normalize("NFC"); for (const k of Object.keys(acadMap)) if (k.normalize("NFC") === t) return acadMap[k];
    }
    return { title: n.file.replace(/\.[a-z0-9]+$/i, ""), type: (n.file.split(".").pop() || "").toLowerCase() };
  };
  return (
    <div style={{ ...S.card, padding: 0, overflow: "hidden", marginTop: 20 }}>
      <div style={{ height: 4, background: C.accent }} />
      <div style={{ padding: "26px 30px" }}>
        <div style={{ fontFamily: F.serif, fontSize: 19, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Documents de formation</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 3, marginBottom: 18 }}>{files.length} document{files.length > 1 ? "s" : ""} · cliquez pour ouvrir dans la liseuse</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 12 }}>
          {files.map((e, i) => {
            const m = meta(e);
            return (
              <button key={i} onClick={() => onOpenDoc && onOpenDoc(e)}
                style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 12, background: C.bgSoft, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 14px", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.background = C.bgSoft; }}>
                <span style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 9, background: C.accentSoft, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 800, letterSpacing: ".02em" }}>{academyDocBadge(m.type)}</span>
                <span style={{ minWidth: 0, flex: 1, fontSize: 13.5, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}</span>
                <span style={{ color: C.accent, fontSize: 17, flexShrink: 0 }}>›</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DocPageView({ page, onHome, onOpenNode, onOpenDoc, acadMap }) {
  if (!page) return null;
  const wsContent = WS_CONTENT[page.id];
  const nodeDocs = ACADEMY_NODE_DOCS[page.id] || null;
  const nodeSteps = PROCEDURE_STEPS[page.id] || null;
  const path = page.path || [page.title];
  const crumbs = Array.isArray(page.crumbs) ? page.crumbs : [];
  const parent = crumbs.length ? crumbs[crumbs.length - 1] : null;
  const goBack = () => (parent && onOpenNode ? onOpenNode(parent.id) : onHome());
  return (
    <div style={{ padding: "48px 40px", boxSizing: "border-box", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12, color: C.muted, marginBottom: 20 }}>
        <span onClick={onHome} style={{ cursor: "pointer", fontWeight: 600, color: C.accent }}>Accueil</span>
        {crumbs.map((c, i) => (
          <React.Fragment key={c.id || i}>
            <span style={{ color: C.dim }}>›</span>
            <span onClick={() => onOpenNode && onOpenNode(c.id)} style={{ cursor: "pointer", fontWeight: 500, color: C.accent }}>{c.title}</span>
          </React.Fragment>
        ))}
        <span style={{ color: C.dim }}>›</span>
        <span style={{ fontWeight: 700, color: C.text }}>{page.title}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: C.accentSoft, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{page.num || "•"}</div>
        <div>
          <h1 style={{ fontFamily: F.serif, fontSize: 30, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>{page.title}</h1>
          {path.length > 1 && <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{path.slice(0, -1).join(" › ")}</div>}
        </div>
      </div>

      {wsContent && (
        <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
          <div style={{ height: 4, background: C.accent }} />
          <div style={{ padding: "32px 36px" }}>
            {wsContent.tag && <div style={{ display: "inline-block", fontSize: 10.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: C.accent, background: C.accentSoft, padding: "5px 11px", borderRadius: 980, marginBottom: 20 }}>{wsContent.tag}</div>}
            <WSBlocks blocks={wsContent.blocks} />
            <div style={{ marginTop: 26, paddingTop: 18, borderTop: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <span style={{ fontSize: 11.5, color: C.dim }}>Source : base documentaire WallSwiss</span>
              <button onClick={goBack} style={S.btnS}>‹ {parent ? "Retour à « " + parent.title + " »" : "Retour au sommaire"}</button>
            </div>
          </div>
        </div>
      )}
      {nodeSteps && <ProcedureSteps steps={nodeSteps} onOpenDoc={onOpenDoc} />}
      {!nodeSteps && nodeDocs && <AcademyDocsSection files={nodeDocs} acadMap={acadMap} onOpenDoc={onOpenDoc} />}
      {!wsContent && !nodeDocs && !nodeSteps && (
        <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
          <div style={{ height: 4, background: C.accent }} />
          <div style={{ padding: "48px 40px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: C.bgSoft, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent }}>
              <Icons.Layers size={30} />
            </div>
            <div style={{ fontFamily: F.serif, fontSize: 22, fontWeight: 700, color: C.text }}>Section en construction</div>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, maxWidth: 520, margin: 0 }}>
              La page <strong style={{ color: C.text }}>« {page.title} »</strong> est prête à accueillir son contenu. La structure de navigation est en place ; le contenu (procédures, documents, outils ou fiches de connaissances) sera ajouté ici prochainement.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
              <button onClick={goBack} style={S.btnP}>‹ {parent ? "Retour à « " + parent.title + " »" : "Retour au sommaire"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODULE TICKETS / DEMANDES  (congés, note de frais, matériel/IT, absence…)
   ───────────────────────────────────────────────────────────────────────────
   • Toute demande est enregistrée dans Firestore  →  l'onglet « Demandes reçues »
     (admin) la reçoit EN DIRECT (onSnapshot), même sans email.
   • En plus, une notification email part vers TICKETS_CONFIG.recipientEmail :
       – si les 3 identifiants EmailJS sont remplis  → envoi 100% automatique ;
       – sinon  → repli : ouverture d'un email pré-rempli (mailto).
   ▸ POUR ACTIVER L'EMAIL AUTOMATIQUE : créez un compte gratuit sur emailjs.com,
     un « service » + un « template », puis collez les 3 identifiants ci-dessous.
     Le template doit contenir les variables {{subject}}, {{message}}, {{to_email}}.
   ═══════════════════════════════════════════════════════════════════════════ */
const TICKETS_CONFIG = {
  recipientEmail: "p.pereira@wallswiss.ch",                      // destinataire des notifications
  inboxAdmins: ["n.klinger@wallswiss.ch", "admin@wallswiss.ch", "p.pereira@wallswiss.ch"], // qui voit « Demandes reçues »
  emailjs: { serviceId: "", templateId: "", publicKey: "" },     // vide → repli mailto automatique
  // ▸ Google Sheet : collez l'URL du script déployé (voir le fichier .gs fourni).
  //   Dès qu'elle est renseignée, chaque demande ajoute une ligne au Google Sheet.
  sheet: { webhookUrl: "https://script.google.com/macros/s/AKfycbwXLiMnCE2_PBetMql-3-_Y2ig9eAoew4jzx6ibDk4wh-ir7GognRKGv5hcOjJKuWpK/exec", secret: "wallswiss-tickets-2026" },
};

const TICKET_TYPES = [
  { id: "conges", label: "Congés", desc: "Demande de congés / vacances", fields: [
    { key: "dateStart", label: "Du", type: "date", required: true },
    { key: "dateEnd", label: "Au", type: "date", required: true },
    { key: "demiJournee", label: "Demi-journée", type: "select", options: ["Non", "Matin", "Après-midi"] },
  ]},
  { id: "note_frais", label: "Note de frais", desc: "Remboursement de frais professionnels", fields: [
    { key: "montant", label: "Montant (CHF)", type: "number", required: true },
    { key: "categorie", label: "Catégorie", type: "select", options: ["Transport", "Repas", "Hébergement", "Matériel", "Autre"] },
    { key: "dateFrais", label: "Date des frais", type: "date" },
  ]},
  { id: "materiel", label: "Matériel / IT", desc: "Demande de matériel ou support informatique", fields: [
    { key: "item", label: "Matériel / besoin", type: "text", required: true },
    { key: "pourLe", label: "Souhaité pour le", type: "date" },
  ]},
  { id: "absence", label: "Absence maladie", desc: "Déclaration d'absence pour maladie", fields: [
    { key: "dateStart", label: "Depuis le", type: "date", required: true },
    { key: "dateEnd", label: "Jusqu'au (estimé)", type: "date" },
    { key: "certificat", label: "Certificat médical", type: "select", options: ["À suivre", "Joint par email", "Non requis"] },
  ]},
  { id: "idee", label: "Idée / Suggestion", desc: "Proposez une idée pour améliorer WallSwiss (boîte à idées)", fields: [
    { key: "categorie", label: "Catégorie — sur quoi porte l'idée", type: "select", required: true, options: ["Application / logiciel", "Rapports & documents", "Process & organisation", "Commercial & vente", "Marketing & communication", "Formation", "Outils & IT", "Bien-être", "Autre"] },
  ]},
  { id: "autre", label: "Autre demande", desc: "Toute autre demande", fields: [] },
];

const TICKET_STATUS = {
  nouveau:  { label: "Nouveau",  color: "#2563EB", bg: "rgba(37,99,235,.10)" },
  en_cours: { label: "En traitement", color: "#B45309", bg: "rgba(180,83,9,.10)" },
  traite:   { label: "Validé",        color: "#047857", bg: "rgba(4,120,87,.10)" },
  refuse:   { label: "Refusé",   color: "#B91C1C", bg: "rgba(185,28,28,.10)" },
};
const TICKET_PRIORITY = { basse: "Basse", normale: "Normale", haute: "Haute" };

function isTicketAdmin(u) {
  const list = (TICKETS_CONFIG.inboxAdmins || []).map((e) => String(e).toLowerCase());
  return !!u && list.includes(String(u.email || "").toLowerCase());
}

function wsTicketFmtDate(ms) {
  if (!ms) return "—";
  try { return new Date(ms).toLocaleString("fr-CH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return "—"; }
}
function wsTicketFmtDay(v) {
  if (!v) return "";
  try { return new Date(v).toLocaleDateString("fr-CH", { day: "2-digit", month: "2-digit", year: "numeric" }); }
  catch { return String(v); }
}

/* ── EmailJS chargé dynamiquement (aucune dépendance npm à installer) ── */
let _wsEmailjsPromise = null;
function wsLoadEmailJs() {
  if (typeof window !== "undefined" && window.emailjs) return Promise.resolve(window.emailjs);
  if (_wsEmailjsPromise) return _wsEmailjsPromise;
  _wsEmailjsPromise = new Promise((resolve, reject) => {
    try {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
      s.async = true;
      s.onload = () => resolve(window.emailjs);
      s.onerror = () => reject(new Error("EmailJS: chargement impossible"));
      document.head.appendChild(s);
    } catch (e) { reject(e); }
  });
  return _wsEmailjsPromise;
}

function wsBuildTicketBody(t) {
  const type = TICKET_TYPES.find((x) => x.id === t.type);
  const lines = [];
  lines.push("Nouvelle demande — " + (t.typeLabel || t.type));
  lines.push("");
  lines.push("Objet : " + (t.title || ""));
  lines.push("Demandeur : " + (t.authorName || "") + " <" + (t.authorEmail || "") + ">");
  lines.push("Priorité : " + (TICKET_PRIORITY[t.priority] || t.priority));
  if (type && type.fields.length) {
    lines.push("");
    type.fields.forEach((f) => {
      const val = (t.fields || {})[f.key];
      if (val) lines.push(f.label + " : " + (f.type === "date" ? wsTicketFmtDay(val) : val));
    });
  }
  if (t.message) { lines.push(""); lines.push("Message :"); lines.push(t.message); }
  lines.push("");
  lines.push("— Envoyé depuis l'application WallSwiss");
  return lines.join("\n");
}

async function wsSendTicketEmail(t) {
  const subject = "[" + (t.typeLabel || "Demande") + "] " + (t.title || "") + " — " + (t.authorName || t.authorEmail || "");
  const body = wsBuildTicketBody(t);
  const cfg = TICKETS_CONFIG.emailjs || {};
  if (cfg.serviceId && cfg.templateId && cfg.publicKey) {
    try {
      const ej = await wsLoadEmailJs();
      await ej.send(cfg.serviceId, cfg.templateId, {
        to_email: TICKETS_CONFIG.recipientEmail,
        subject: subject,
        message: body,
        from_name: t.authorName || t.authorEmail || "WallSwiss",
        reply_to: t.authorEmail || "",
      }, { publicKey: cfg.publicKey });
      return { ok: true, method: "email" };
    } catch (e) { console.warn("[Tickets] EmailJS échec → repli mailto :", e); }
  }
  // Si un Google Sheet est branché, il sert de canal de réception → pas de pop-up mailto.
  if (TICKETS_CONFIG.sheet && TICKETS_CONFIG.sheet.webhookUrl) return { ok: true, method: "sheet" };
  const href = "mailto:" + encodeURIComponent(TICKETS_CONFIG.recipientEmail) +
    "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  if (typeof window !== "undefined") window.open(href, "_blank");
  return { ok: true, method: "mailto" };
}

/* ── Envoi du ticket vers le Google Sheet (webhook Apps Script, non bloquant) ── */
function wsSendToSheet(t) {
  const cfg = TICKETS_CONFIG.sheet || {};
  if (!cfg.webhookUrl) return;
  try {
    const type = TICKET_TYPES.find((x) => x.id === t.type);
    let details = "";
    if (type) {
      details = type.fields.filter((f) => f.key !== "categorie").map((f) => { const v = (t.fields || {})[f.key]; return v ? f.label + ": " + (f.type === "date" ? wsTicketFmtDay(v) : v) : null; }).filter(Boolean).join(" · ");
    }
    const categorie = (t.fields || {}).categorie || "";
    const payload = {
      secret: cfg.secret || "",
      id: t._id || "",
      date: t.createdAtISO || "",
      type: t.typeLabel || t.type || "",
      objet: t.title || "",
      categorie: categorie,
      demandeur: t.authorName || "",
      email: t.authorEmail || "",
      priorite: TICKET_PRIORITY[t.priority] || t.priority || "",
      statut: "Nouveau",
      details: details,
      message: t.message || "",
    };
    fetch(cfg.webhookUrl, { method: "POST", mode: "no-cors", body: JSON.stringify(payload) }).catch(function () {});
  } catch (e) { console.warn("[Tickets] Sheet webhook:", e); }
}

/* ── Petites icônes inline (aucune dépendance) ── */
const TkI = {
  inbox: (s = 18, c = "currentColor") => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>),
  plus: (s = 18, c = "currentColor") => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  send: (s = 16, c = "currentColor") => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>),
  check: (s = 15, c = "currentColor") => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  x: (s = 15, c = "currentColor") => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  clock: (s = 15, c = "currentColor") => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>),
  chevron: (s = 16, c = "currentColor") => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>),
  back: (s = 16, c = "currentColor") => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>),
};

function TicketStatusBadge({ status }) {
  const m = TICKET_STATUS[status] || TICKET_STATUS.nouveau;
  return (<span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 980, background: m.bg, color: m.color, font: `600 11.5px ${F.ui}`, whiteSpace: "nowrap" }}>{m.label}</span>);
}

/* ═══════════ MODULE « MES DEMANDES » (créer + suivre) ═══════════ */
/* ══════════════════ ACADÉMIE WALLSWISS — Bibliothèque & liseuse ══════════════════ */
/* Les ebooks/PDF de la page Notion « Académie WallSwiss » sont lus ici, dans une     */
/* liseuse intégrée (PDF via pdf.js, Word via mammoth). Déposez les fichiers dans     */
/* le dossier  public/academy/  de StackBlitz (cf. ACADEMY_CONFIG.base).              */
const ACADEMY_CONFIG = {
  base: "/academy/", // dossier public où sont déposés les fichiers (PDF & DOCX)
};

const ACADEMY_CATS = [
  { id: "ebook",        label: "E-book & guides",         emoji: "📘" },
  { id: "onboarding",   label: "Présentation",            emoji: "👋" },
  { id: "entretien",    label: "Entretien & conseil",     emoji: "🎯" },
  { id: "prospection",  label: "Prospection & RDV",       emoji: "📞" },
  { id: "objections",   label: "Objections",              emoji: "🛡️" },
  { id: "calculs",      label: "Calculs & outils",        emoji: "🧮" },
  { id: "productivite", label: "Productivité",            emoji: "🚀" },
  { id: "prevoyance",   label: "Prévoyance (AVS/LPP/3P)",  emoji: "🇨🇭" },
  { id: "frontalier",   label: "Frontalier, permis & CMU", emoji: "🛂" },
  { id: "invest",       label: "Investissement",          emoji: "📊" },
  { id: "per",          label: "PER & Assurance vie",     emoji: "🏦" },
  { id: "iaf",          label: "Cours IAF & examens",     emoji: "🎓" },
  { id: "culture",      label: "Culture générale",        emoji: "📚" },
];

/* Chaque fiche pointe vers un fichier de  public/academy/ .
   type: "pdf" → liseuse pdf.js  ·  "docx" → rendu mammoth. */
const ACADEMY_LIBRARY = [
  { id: "mon-ebook",           cat: "ebook",        type: "pdf",  title: "Mon E-book WallSwiss",                    desc: "Le livre de référence de l'Académie.",           file: "00_MON E-BOOK.pdf" },
  { id: "presentation",        cat: "onboarding",   type: "docx", title: "Présentation WallSwiss",                  desc: "Découverte de l'entreprise et de ses services.", file: "01_1.ACADEMY - Présentation WallSwiss.docx" },
  { id: "fondamentaux",        cat: "entretien",    type: "docx", title: "Fondamentaux de l'entretien commercial",  desc: "Structurer un entretien qui convertit.",         file: "02_2.ACADEMY - Les fondamentaux de l'entretien commercial.docx" },
  { id: "plan-conseil",        cat: "entretien",    type: "docx", title: "Plan de conseil",                         desc: "La trame d'un conseil patrimonial complet.",     file: "03_3.ACADEMY - Plan de conseil.docx" },
  { id: "argumentaire-call",   cat: "prospection",  type: "docx", title: "Argumentaire Call débutant",              desc: "Le script d'appel pour bien démarrer.",          file: "04_4.ACADEMY - Argumentaire Call débutant.docx" },
  { id: "productivite-doc",    cat: "productivite", type: "pdf",  title: "Améliorer sa productivité",               desc: "Atelier Pierrick — solutions concrètes.",        file: "05_5.ACADEMY - SOLUTIONS POUR AMELIORER SA PRODUCTIVITE Cf atelier Pierrick.pdf" },
  { id: "factsheet",           cat: "ebook",        type: "docx", title: "Comprendre un factsheet de fonds",        desc: "Lire et décrypter une fiche de fonds.",          file: "06_6.ACADEMY -Le guide pour mieux comprendre un factsheet de fonds.docx" },
  { id: "cinq-outils",         cat: "prospection",  type: "docx", title: "Les 5 outils pour un max de rendez-vous", desc: "Générer plus de RDV qualifiés.",                 file: "07_7.ACADEMY - Les 5 outils obligatoires pour avoir un maximum de rendez-vous .docx" },
  { id: "objections-coldcall", cat: "objections",   type: "pdf",  title: "Objections fréquentes en cold call",      desc: "Répondre au téléphone à froid.",                 file: "09_8.ACADEMY - Listing des objections les plus fréquentes en COLDCALL.pdf" },
  { id: "42-objections",       cat: "objections",   type: "pdf",  title: "Les 42 objections les plus fréquentes",   desc: "Le référentiel complet des réponses.",           file: "10_9.ACADEMY - Listing des 42 objections les plus fréquentes .pdf" },
  { id: "objections-listing",  cat: "objections",   type: "docx", title: "Objections Cold call — listing",          desc: "Version document des réponses.",                 file: "12_11.ACADEMY - Listing des objections fréquentes Cold call.docx" },
  { id: "notice-calc",         cat: "calculs",      type: "docx", title: "Notice — Calculatrice financière",        desc: "Prendre en main la calculette.",                 file: "13_12.OUTIL - Notice CALCULATRICE FINANCIERE.docx" },
  { id: "recueil-formules",    cat: "calculs",      type: "pdf",  title: "Recueil de formules de calculs",          desc: "Toutes les formules financières.",               file: "14_13.EXERCICES - Recueil formules calculs.pdf" },
  { id: "bases-calcul",        cat: "calculs",      type: "pdf",  title: "Exercices — Bases de calcul",             desc: "S'entraîner sur les fondamentaux.",              file: "15_14.EXERCICES- Bases-calcul-questions.pdf" },
  { id: "calculs-financiers",  cat: "calculs",      type: "pdf",  title: "Exercices — Calculs financiers",          desc: "Cas pratiques financiers.",                      file: "16_15.EXERCICES-calculs-financiers-questions.pdf" },
];

function academyRequire(src, globalKey) {
  if (typeof window !== "undefined" && window[globalKey]) return Promise.resolve(window[globalKey]);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = () => resolve(window[globalKey]);
    s.onerror = () => reject(new Error("Impossible de charger " + src));
    document.head.appendChild(s);
  });
}
async function academyLoadPdfJs() {
  const lib = await academyRequire("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", "pdfjsLib");
  try { lib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; } catch (e) {}
  return lib;
}
function academyLoadMammoth() {
  return academyRequire("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js", "mammoth");
}
function academyLoadDocxPreview() {
  return academyRequire("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js", "JSZip")
    .then(() => academyRequire("https://cdn.jsdelivr.net/npm/docx-preview@0.3.5/dist/docx-preview.min.js", "docx"));
}
function academyLoadXlsx() {
  return academyRequire("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js", "XLSX");
}

const acadRdBtn = { width: 32, height: 32, borderRadius: 9, border: "1px solid rgba(0,0,0,0.13)", background: "#fff", color: "#1D1D1F", font: "700 15px sans-serif", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" };

function AcademyReader({ doc, onClose }) {
  const [status, setStatus] = useState("loading"); // loading | pdf | docx | image | error
  const [errMsg, setErrMsg] = useState("");
  const [docBuf, setDocBuf] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.25);
  const pdfRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const docRef = React.useRef(null);
  const sheetRef = React.useRef(null);
  const ext = ((doc.file || doc.src || "").split(".").pop() || "").toLowerCase();
  const url = doc.data ? doc.data : (doc.src ? doc.src : (ACADEMY_CONFIG.base + encodeURIComponent(doc.file)));
  const absUrl = (typeof window !== "undefined" && !/^https?:/i.test(url)) ? (window.location.origin + url) : url;
  const officeSrc = "https://view.officeapps.live.com/op/embed.aspx?src=" + encodeURIComponent(absUrl);
  const isImg = ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "gif" || ext === "webp" || doc.type === "image";
  const isPdf = ext === "pdf" || (!ext && doc.type === "pdf");
  const isWord = ext === "docx" || ext === "doc";
  const isSheet = ext === "xlsx" || ext === "xls" || ext === "csv";
  const isSlides = ext === "pptx" || ext === "ppt";

  useEffect(() => {
    let cancelled = false;
    setStatus("loading"); setErrMsg(""); setDocBuf(null); setPage(1); pdfRef.current = null;
    (async () => {
      try {
        if (isImg) {
          setStatus("image");
        } else if (isPdf) {
          const lib = await academyLoadPdfJs();
          const pdfDoc = await lib.getDocument(url).promise;
          if (cancelled) return;
          pdfRef.current = pdfDoc; setNumPages(pdfDoc.numPages); setStatus("pdf");
        } else if (isWord) {
          const resp = await fetch(url);
          if (!resp.ok) throw new Error("HTTP " + resp.status);
          const buf = await resp.arrayBuffer();
          const sig = new Uint8Array(buf.slice(0, 2));
          if (!(sig[0] === 0x50 && sig[1] === 0x4B)) throw new Error("bad-docx");
          if (cancelled) return;
          setDocBuf(buf); setStatus("docx");
        } else if (isSheet) {
          const resp = await fetch(url);
          if (!resp.ok) throw new Error("HTTP " + resp.status);
          const buf = await resp.arrayBuffer();
          if (cancelled) return;
          setDocBuf(buf); setStatus("sheet");
        } else if (isSlides) {
          setStatus("office"); // PowerPoint via visionneuse Microsoft
        } else {
          setStatus("download");
        }
      } catch (e) {
        if (!cancelled) {
          if (isWord || isSheet || isSlides) { setStatus("office"); }
          else { setErrMsg(String((e && e.message) || e)); setStatus("download"); }
        }
      }
    })();
    return () => { cancelled = true; };
  }, [doc.id, doc.src]);

  useEffect(() => {
    if (status !== "pdf" || !pdfRef.current || !canvasRef.current) return;
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

  useEffect(() => {
    if (status !== "docx" || !docBuf || !docRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        docRef.current.innerHTML = "<div style='padding:40px;color:#6E6E73;font:600 14px sans-serif'>Rendu du document…</div>";
        const lib = await academyLoadDocxPreview();
        if (cancelled || !docRef.current) return;
        docRef.current.innerHTML = "";
        await lib.renderAsync(docBuf, docRef.current, null, { className: "wsdocx", inWrapper: true, breakPages: true, ignoreLastRenderedPageBreak: true, useBase64URL: true });
      } catch (e) {
        // Repli mammoth (rendu simplifié) si docx-preview échoue sur un .docx valide.
        try {
          const mm = await academyLoadMammoth();
          const out = await mm.convertToHtml({ arrayBuffer: docBuf });
          if (!cancelled && docRef.current) docRef.current.innerHTML = "<div style='max-width:820px;width:100%;margin:0 auto;background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:12px;padding:46px 54px;font:15px/1.65 -apple-system,Inter,Segoe UI,sans-serif;color:#1D1D1F'>" + (out.value || "<p>(Document vide)</p>") + "</div>";
        } catch (e2) {
          if (!cancelled) setStatus("office");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [status, docBuf]);

  useEffect(() => {
    if (status !== "sheet" || !docBuf || !sheetRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        sheetRef.current.innerHTML = "<div style='padding:40px;color:#6E6E73;font:600 14px sans-serif'>Rendu du tableur…</div>";
        const XLSX = await academyLoadXlsx();
        if (cancelled || !sheetRef.current) return;
        const wb = XLSX.read(new Uint8Array(docBuf), { type: "array" });
        let html = "";
        wb.SheetNames.forEach((nm) => { html += "<div style='margin-bottom:26px'><div style='font:700 13px sans-serif;color:#692102;margin:0 0 8px'>" + nm + "</div>" + XLSX.utils.sheet_to_html(wb.Sheets[nm]) + "</div>"; });
        sheetRef.current.innerHTML = "<div class='wsxlsx' style='max-width:1100px;width:100%;margin:0 auto;background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:12px;padding:22px 24px;overflow:auto'>" + html + "</div>";
      } catch (e) { if (!cancelled) setStatus("office"); }
    })();
    return () => { cancelled = true; };
  }, [status, docBuf]);

  const cat = ACADEMY_CATS.find((c) => c.id === doc.cat);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)", background: C.bgSoft }}>
      <style>{".wsxlsx table{border-collapse:collapse;font:12.5px sans-serif}.wsxlsx td,.wsxlsx th{border:1px solid #E3E3E6;padding:4px 9px}.wsxlsx th{background:#F5F0ED;font-weight:700}"}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: C.card, borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
        <button onClick={onClose} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 980, border: `1px solid ${C.line2}`, background: "#fff", color: C.accent, font: `700 13px ${F.ui}`, cursor: "pointer" }}>‹ {doc.backLabel || "Retour"}</button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cat ? cat.emoji + " " : ""}{doc.title}</div>
        </div>
        {status === "pdf" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(2)))} style={acadRdBtn}>−</button>
            <span style={{ fontSize: 12, color: C.muted, width: 44, textAlign: "center" }}>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale((s) => Math.min(2.4, +(s + 0.2).toFixed(2)))} style={acadRdBtn}>+</button>
            <div style={{ width: 1, height: 22, background: C.line2, margin: "0 4px" }} />
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={{ ...acadRdBtn, opacity: page <= 1 ? 0.4 : 1 }}>‹</button>
            <span style={{ fontSize: 12.5, color: C.text, fontWeight: 600, minWidth: 74, textAlign: "center" }}>{page} / {numPages || "…"}</span>
            <button onClick={() => setPage((p) => Math.min(numPages, p + 1))} disabled={page >= numPages} style={{ ...acadRdBtn, opacity: page >= numPages ? 0.4 : 1 }}>›</button>
          </div>
        )}
        <a href={url} download={doc.file} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 980, border: "none", background: C.accent, color: "#fff", font: `700 12.5px ${F.ui}`, textDecoration: "none", cursor: "pointer" }}>Télécharger</a>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", justifyContent: "center" }}>
        {status === "loading" && <div style={{ color: C.muted, font: `600 14px ${F.ui}`, marginTop: 40 }}>Chargement du document…</div>}
        {status === "error" && (
          <div style={{ maxWidth: 520, marginTop: 30, background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "22px 24px", textAlign: "center", height: "fit-content" }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>📄</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 8 }}>Document indisponible</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>Le fichier <b>{doc.file || doc.title}</b> n'a pas pu être chargé. Vérifiez qu'il est bien présent au bon emplacement (dossier <b>public/</b>).</div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 10 }}>{errMsg}</div>
          </div>
        )}
        {status === "pdf" && (
          <div style={{ boxShadow: "0 12px 40px rgba(0,0,0,.14)", borderRadius: 8, overflow: "hidden", alignSelf: "flex-start", background: "#fff" }}>
            <canvas ref={canvasRef} style={{ display: "block", maxWidth: "100%" }} />
          </div>
        )}
        {status === "docx" && (
          <div ref={docRef} style={{ width: "100%", display: "flex", justifyContent: "center" }} />
        )}
        {status === "sheet" && (
          <div ref={sheetRef} style={{ width: "100%" }} />
        )}
        {status === "office" && (
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
            <iframe title={doc.title} src={officeSrc} style={{ width: "100%", flex: 1, minHeight: "72vh", border: "none", background: "#fff", borderRadius: 8, boxShadow: "0 12px 40px rgba(0,0,0,.12)" }} />
            <div style={{ textAlign: "center", fontSize: 11.5, color: C.dim, marginTop: 8 }}>Aperçu Microsoft Office · si rien ne s'affiche, cliquez « Télécharger » en haut à droite.</div>
          </div>
        )}
        {status === "image" && (
          <div style={{ alignSelf: "flex-start", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, boxShadow: "0 12px 40px rgba(0,0,0,.10)" }}>
            <img src={url} alt={doc.title} style={{ display: "block", maxWidth: "100%", borderRadius: 6 }} />
          </div>
        )}
        {status === "download" && (
          <div style={{ maxWidth: 520, marginTop: 30, background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "26px 24px", textAlign: "center", height: "fit-content" }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>📄</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 8 }}>Ce document se télécharge</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 16 }}>Format {((doc.file || "").split(".").pop() || "").toUpperCase()} — cliquez ci-dessous pour l'ouvrir.</div>
            <a href={url} download={doc.file} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 980, background: C.accent, color: "#fff", font: `700 13px ${F.ui}`, textDecoration: "none" }}>Télécharger</a>
          </div>
        )}
      </div>
    </div>
  );
}

function AcademieModule({ initialDoc }) {
  const [openId, setOpenId] = useState(initialDoc || null);
  const [q, setQ] = useState("");
  const [lib, setLib] = useState(ACADEMY_LIBRARY);
  const [rcats, setRcats] = useState(ACADEMY_CATS);
  useEffect(() => { setOpenId(initialDoc || null); }, [initialDoc]);
  // Bibliothèque complète chargée depuis  public/academy/library.json  (générée par le downloader Wall Academy).
  // Repli automatique sur la liste intégrée si le fichier est absent.
  useEffect(() => {
    let alive = true;
    fetch(ACADEMY_CONFIG.base + "library.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive || !j) return;
        const docs = Array.isArray(j) ? j : j.docs;
        if (Array.isArray(docs) && docs.length) setLib(docs);
        if (j && Array.isArray(j.cats) && j.cats.length) setRcats(j.cats);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const openDoc = openId ? lib.find((d) => d.id === openId) : null;
  if (openDoc) return <AcademyReader doc={openDoc} onClose={() => setOpenId(null)} />;

  const ql = q.trim().toLowerCase();
  const match = (d) => !ql || ((d.title || "") + " " + (d.desc || "")).toLowerCase().includes(ql);
  const cats = rcats.map((c) => ({ ...c, items: lib.filter((d) => d.cat === c.id && match(d)) })).filter((c) => c.items.length);
  const total = lib.filter(match).length;

  return (
    <div style={{ flex: 1, minHeight: "calc(100vh - 60px)", overflowY: "auto", padding: "26px 40px 60px", boxSizing: "border-box", background: "radial-gradient(1100px 700px at 50% -6%, #FFFFFF, #EEF0F3)" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
          <div style={{ width: 58, height: 58, borderRadius: 18, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, boxShadow: "0 12px 28px rgba(105,33,2,.28)", flexShrink: 0 }}>🎓</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: C.text }}>Académie WallSwiss</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>Bibliothèque de formation — {lib.length} ressources · liseuse intégrée</div>
          </div>
        </div>
        <div style={{ margin: "18px 0 26px", position: "relative", maxWidth: 420 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un document…" style={{ width: "100%", padding: "11px 15px", borderRadius: 12, border: `1px solid ${C.line2}`, font: `14px ${F.ui}`, color: C.text, outline: "none", boxSizing: "border-box", background: "#fff" }} />
        </div>

        {cats.map((c) => (
          <div key={c.id} style={{ marginBottom: 30 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 13 }}>
              <span style={{ fontSize: 19 }}>{c.emoji}</span>
              <span style={{ fontSize: 15.5, fontWeight: 800, color: C.text }}>{c.label}</span>
              <span style={{ fontSize: 11.5, color: C.accent, background: C.accentSoft, padding: "2px 8px", borderRadius: 980, fontWeight: 700 }}>{c.items.length}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 15 }}>
              {c.items.map((d) => (
                <div key={d.id} onClick={() => setOpenId(d.id)}
                  style={{ display: "flex", alignItems: "center", gap: 15, background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px 17px", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 10px 26px rgba(0,0,0,.05)", transition: "transform .18s, box-shadow .18s, border-color .18s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 18px 40px rgba(0,0,0,.12)"; e.currentTarget.style.borderColor = C.accent; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04), 0 10px 26px rgba(0,0,0,.05)"; e.currentTarget.style.borderColor = C.line; }}>
                  <div style={{ width: 48, height: 56, borderRadius: 9, background: d.type === "pdf" ? "rgba(234,67,53,.10)" : "rgba(37,99,235,.10)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, gap: 2 }}>
                    <span style={{ fontSize: 20 }}>{d.type === "pdf" ? "📕" : "📄"}</span>
                    <span style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: ".04em", color: d.type === "pdf" ? "#EA4335" : "#2563EB" }}>{d.type.toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.25, marginBottom: 3 }}>{d.title}</div>
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{d.desc || ""}</div>
                  </div>
                  <span style={{ color: C.dim, fontSize: 17, flexShrink: 0 }}>→</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {total === 0 && <div style={{ padding: 40, textAlign: "center", color: C.dim, fontSize: 13 }}>Aucun document ne correspond à « {q} ».</div>}
      </div>
    </div>
  );
}

function TicketsModule({ db, appId, user, onOpenAdmin, initialType }) {
  const [type, setType] = useState(initialType || "conges");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normale");
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [myTickets, setMyTickets] = useState([]);
  const [openMine, setOpenMine] = useState(null);

  useEffect(() => {
    if (!db || !user) return;
    const ref = collection(db, "artifacts", appId, "public", "data", "tickets");
    const unsub = onSnapshot(ref, (snap) => {
      const all = [];
      snap.forEach((d) => all.push({ _id: d.id, ...d.data() }));
      setMyTickets(all.filter((t) => t.authorUid === user.uid).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    }, (err) => console.warn("[Tickets] mes demandes:", err));
    return () => unsub();
  }, [db, appId, user]);

  const curType = TICKET_TYPES.find((t) => t.id === type) || TICKET_TYPES[0];
  const setField = (k, v) => setFields((prev) => ({ ...prev, [k]: v }));

  const submit = async () => {
    if (!title.trim()) { setToast({ ok: false, msg: "Ajoutez un objet à votre demande." }); return; }
    for (const f of curType.fields) {
      if (f.required && !fields[f.key]) { setToast({ ok: false, msg: `Champ requis : ${f.label}.` }); return; }
    }
    if (!db || !user) { setToast({ ok: false, msg: "Connexion requise." }); return; }
    setBusy(true);
    const now = Date.now();
    const ticket = {
      type, typeLabel: curType.label,
      title: title.trim(), message: message.trim(), priority,
      fields: { ...fields }, status: "nouveau",
      createdAt: now, createdAtISO: new Date(now).toISOString(),
      authorUid: user.uid || null, authorEmail: user.email || "", authorName: String(user.email || "").split("@")[0],
      adminNote: "",
    };
    // 1) Firestore (source de vérité pour l'onglet admin) — NON bloquant s'il échoue (ex. règles de sécurité).
    let firestoreOk = false, refId = "";
    try {
      const ref = await addDoc(collection(db, "artifacts", appId, "public", "data", "tickets"), ticket);
      refId = ref && ref.id ? ref.id : "";
      firestoreOk = true;
    } catch (e) {
      console.error("[Tickets] Firestore bloqué (règles de sécurité ?) :", e);
    }
    // 2) Google Sheet + notification — partent QUOI QU'IL ARRIVE, même si Firestore a échoué.
    let method = "";
    try {
      wsSendToSheet({ ...ticket, _id: refId });
      const res = await wsSendTicketEmail(ticket);
      method = res && res.method ? res.method : "";
    } catch (e) { console.error("[Tickets] notification :", e); }
    const sheetOk = !!(TICKETS_CONFIG.sheet && TICKETS_CONFIG.sheet.webhookUrl);
    // 3) Bilan : on considère la demande envoyée si au moins un canal a fonctionné.
    if (firestoreOk || sheetOk || method === "email" || method === "mailto") {
      const okMsg = method === "mailto"
        ? "Votre demande est prête ✓  Cliquez « Envoyer » dans l'email qui vient de s'ouvrir."
        : "Votre demande a bien été reçue ✓  Elle va être traitée rapidement.";
      setToast({ ok: true, msg: okMsg });
      setTitle(""); setMessage(""); setFields({}); setPriority("normale");
    } else {
      setToast({ ok: false, msg: "Envoi impossible. Vérifiez votre connexion et les règles Firestore." });
    }
    setBusy(false);
    setTimeout(() => setToast(null), 6000);
  };

  const inputStyle = { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 12, border: `1px solid ${C.line2}`, background: C.card, color: C.text, font: `500 14px ${F.ui}`, outline: "none" };
  const labelStyle = { display: "block", font: `600 12px ${F.ui}`, color: C.muted, marginBottom: 6 };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bgSoft, overflow: "hidden" }}>
      <header className="no-print" style={{ background: C.white, borderBottom: `1px solid ${C.line}`, position: "sticky", top: 0, zIndex: 60, flexShrink: 0 }}>
        <div style={{ padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: C.accentSoft, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>{TkI.inbox(20, C.accent)}</div>
            <div>
              <div style={{ color: C.dim, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{type === "idee" ? "Boîte à idées" : "Espace personnel"}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{type === "idee" ? "Proposer une idée" : "Mes demandes"}</div>
            </div>
          </div>
          {isTicketAdmin(user) && (
            <button onClick={onOpenAdmin} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 15px", borderRadius: 980, border: `1px solid ${C.accent}`, background: C.accent, color: "#fff", font: `600 13px ${F.ui}`, cursor: "pointer" }}>
              {TkI.inbox(15, "#fff")} Demandes reçues {TkI.chevron(15, "#fff")}
            </button>
          )}
        </div>
      </header>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 60px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", display: "grid", gap: 24, gridTemplateColumns: "1fr" }}>

          {/* Formulaire */}
          <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>Nouvelle demande</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>Elle arrive en direct dans l'espace admin et déclenche un email à l'équipe.</div>

            {/* Choix du type */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {TICKET_TYPES.map((t) => {
                const on = t.id === type;
                return (
                  <button key={t.id} onClick={() => { setType(t.id); setFields({}); }} style={{ padding: "8px 14px", borderRadius: 980, cursor: "pointer", font: `600 13px ${F.ui}`, border: `1px solid ${on ? C.accent : C.line2}`, background: on ? C.accentSoft : C.card, color: on ? C.accent : C.muted, transition: "all .15s" }}>
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 12.5, color: C.dim, marginBottom: 18, marginTop: -8 }}>{curType.desc}</div>

            {/* Objet */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Objet de la demande *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === "conges" ? "Ex. Congés d'été" : type === "note_frais" ? "Ex. Déplacement client Genève" : type === "idee" ? "Ex. Ajouter un export PDF des rapports" : "Résumé court"} style={inputStyle} />
            </div>

            {/* Champs spécifiques au type */}
            {curType.fields.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 16 }}>
                {curType.fields.map((f) => (
                  <div key={f.key}>
                    <label style={labelStyle}>{f.label}{f.required ? " *" : ""}</label>
                    {f.type === "select" ? (
                      <select value={fields[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} style={inputStyle}>
                        <option value="">—</option>
                        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={f.type} value={fields[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} style={inputStyle} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Priorité */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Priorité</label>
              <div style={{ display: "flex", gap: 8 }}>
                {Object.keys(TICKET_PRIORITY).map((p) => {
                  const on = p === priority;
                  return (
                    <button key={p} onClick={() => setPriority(p)} style={{ flex: 1, padding: "9px 0", borderRadius: 12, cursor: "pointer", font: `600 13px ${F.ui}`, border: `1px solid ${on ? C.accent : C.line2}`, background: on ? C.accentSoft : C.card, color: on ? C.accent : C.muted }}>
                      {TICKET_PRIORITY[p]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Message / précisions</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Détaillez votre demande…" style={{ ...inputStyle, resize: "vertical", minHeight: 90 }} />
            </div>

            <button onClick={submit} disabled={busy} style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "12px 22px", borderRadius: 14, border: "none", background: busy ? C.dim : C.accent, color: "#fff", font: `700 14px ${F.ui}`, cursor: busy ? "default" : "pointer", boxShadow: "0 2px 10px rgba(105,33,2,.25)" }}>
              {TkI.send(16, "#fff")} {busy ? "Envoi…" : "Envoyer la demande"}
            </button>

            {toast && (
              <div style={{ marginTop: 14, padding: "11px 14px", borderRadius: 12, font: `600 13px ${F.ui}`, background: toast.ok ? "rgba(4,120,87,.08)" : "rgba(185,28,28,.08)", color: toast.ok ? "#047857" : "#B91C1C", border: `1px solid ${toast.ok ? "rgba(4,120,87,.2)" : "rgba(185,28,28,.2)"}` }}>
                {toast.msg}
              </div>
            )}
          </section>

          {/* Mes demandes */}
          <section>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              Mes demandes <span style={{ font: `600 12px ${F.ui}`, color: C.dim }}>({myTickets.length})</span>
            </div>
            {myTickets.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: C.dim, font: `500 13px ${F.ui}`, background: C.card, border: `1px dashed ${C.line2}`, borderRadius: 16 }}>
                Aucune demande pour l'instant. Créez-en une ci-dessus.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {myTickets.map((t) => {
                  const open = openMine === t._id;
                  const tp = TICKET_TYPES.find((x) => x.id === t.type);
                  return (
                  <div key={t._id} style={{ background: C.card, border: `1px solid ${open ? C.accent : C.line}`, borderRadius: 14, overflow: "hidden", transition: "border-color .15s" }}>
                    <div onClick={() => setOpenMine(open ? null : t._id)} style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                          <span style={{ font: `700 14px ${F.ui}`, color: C.text }}>{t.title}</span>
                          <span style={{ font: `600 11px ${F.ui}`, color: C.accent, background: C.accentSoft, padding: "2px 8px", borderRadius: 980, flexShrink: 0 }}>{t.typeLabel}</span>
                          {t.reponse && <span style={{ font: `700 10px ${F.ui}`, color: "#047857", background: "rgba(4,120,87,.10)", padding: "2px 7px", borderRadius: 980, flexShrink: 0 }}>Réponse ✓</span>}
                        </div>
                        <div style={{ font: `500 12px ${F.ui}`, color: C.dim }}>{wsTicketFmtDate(t.createdAt)}</div>
                      </div>
                      <TicketStatusBadge status={t.status} />
                    </div>
                    {open && (
                      <div style={{ padding: "2px 16px 16px 16px", borderTop: `1px solid ${C.line}` }}>
                        {tp && tp.fields.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 18px", margin: "12px 0" }}>
                            {tp.fields.map((f) => { const v = (t.fields || {})[f.key]; if (!v) return null; return (<div key={f.key} style={{ font: `500 12.5px ${F.ui}`, color: C.text }}><span style={{ color: C.dim }}>{f.label} : </span><b>{f.type === "date" ? wsTicketFmtDay(v) : v}</b></div>); })}
                          </div>
                        )}
                        {t.message && <div style={{ font: `500 13px ${F.ui}`, color: C.text, background: C.bgSoft, borderRadius: 10, padding: "10px 12px", margin: "10px 0", whiteSpace: "pre-wrap" }}>{t.message}</div>}
                        {t.reponse ? (
                          <div style={{ borderLeft: "3px solid #047857", background: "rgba(4,120,87,.06)", borderRadius: "0 10px 10px 0", padding: "10px 12px", margin: "10px 0" }}>
                            <div style={{ font: `700 10.5px ${F.ui}`, color: "#047857", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>Réponse de l'administration</div>
                            <div style={{ font: `500 13px ${F.ui}`, color: C.text, whiteSpace: "pre-wrap" }}>{t.reponse}</div>
                          </div>
                        ) : (
                          <div style={{ font: `500 12.5px ${F.ui}`, color: C.dim, margin: "10px 0" }}>Pas encore de réponse. Statut actuel : <b style={{ color: (TICKET_STATUS[t.status] || {}).color }}>{(TICKET_STATUS[t.status] || TICKET_STATUS.nouveau).label}</b>.</div>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

/* ═══════════ MODULE « DEMANDES REÇUES » (admin) ═══════════ */
function TicketsAdminInbox({ db, appId, user, onBack }) {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("actives");
  const [typeFilter, setTypeFilter] = useState("tous");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);
  const [noteDraft, setNoteDraft] = useState({});
  const [replyDraft, setReplyDraft] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!db) return;
    const ref = collection(db, "artifacts", appId, "public", "data", "tickets");
    const unsub = onSnapshot(ref, (snap) => {
      const all = [];
      snap.forEach((d) => all.push({ _id: d.id, ...d.data() }));
      setTickets(all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    }, (err) => console.warn("[Tickets] inbox:", err));
    return () => unsub();
  }, [db, appId]);

  const patch = async (t, data) => {
    try { await updateDoc(doc(db, "artifacts", appId, "public", "data", "tickets", t._id), data); }
    catch (e) { console.error("[Tickets] maj:", e); }
  };
  const setStatus = (t, status) => patch(t, { status });
  const saveNote = (t) => patch(t, { adminNote: noteDraft[t._id] ?? (t.adminNote || "") });
  const saveReply = (t) => patch(t, { reponse: (replyDraft[t._id] ?? (t.reponse || "")), reponseAt: Date.now() });
  const archive = (t) => patch(t, { archived: true, archivedAt: Date.now() });
  const unarchive = (t) => patch(t, { archived: false });
  const archiveAllDone = async () => {
    const done = tickets.filter((t) => !t.archived && (t.status === "traite" || t.status === "refuse"));
    if (!done.length) return;
    setBusy(true);
    for (const t of done) { await patch(t, { archived: true, archivedAt: Date.now() }); }
    setBusy(false);
  };

  if (!isTicketAdmin(user)) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14, background: C.bgSoft }}>
        <div style={{ color: C.accent }}>{TkI.inbox(40, C.accent)}</div>
        <div style={{ font: `700 16px ${F.ui}`, color: C.text }}>Accès réservé</div>
        <div style={{ font: `500 13px ${F.ui}`, color: C.muted, maxWidth: 340, textAlign: "center" }}>Cet espace est réservé aux administrateurs des demandes.</div>
        <button onClick={onBack} style={{ marginTop: 6, padding: "9px 16px", borderRadius: 980, border: `1px solid ${C.line2}`, background: C.card, color: C.text, font: `600 13px ${F.ui}`, cursor: "pointer" }}>← Retour</button>
      </div>
    );
  }

  const active = tickets.filter((t) => !t.archived);
  const archivedList = tickets.filter((t) => t.archived);
  const cnt = (arr, s) => arr.filter((t) => t.status === s).length;
  const aTraiter = active.filter((t) => t.status === "nouveau" || t.status === "en_cours").length;
  const doneCount = active.filter((t) => t.status === "traite" || t.status === "refuse").length;
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const cetteSemaine = tickets.filter((t) => (t.createdAt || 0) >= weekAgo).length;
  const delays = tickets.filter((t) => t.reponseAt && t.createdAt).map((t) => t.reponseAt - t.createdAt);
  const avgDelay = delays.length ? delays.reduce((a, b) => a + b, 0) / delays.length : null;
  const fmtDur = (ms) => { if (ms == null) return "—"; const h = ms / 3600000; if (h < 1) return Math.max(1, Math.round(ms / 60000)) + " min"; if (h < 48) return Math.round(h) + " h"; return Math.round(h / 24) + " j"; };
  const parType = TICKET_TYPES.map((tt) => ({ id: tt.id, label: tt.label, n: active.filter((t) => t.type === tt.id).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  const maxType = Math.max(1, ...parType.map((x) => x.n));
  const kpis = [
    { key: "actives", label: "Actives", value: active.length, color: C.accent },
    { key: "atraiter", label: "À traiter", value: aTraiter, color: "#2563EB" },
    { key: "en_cours", label: "En traitement", value: cnt(active, "en_cours"), color: "#B45309" },
    { key: "traite", label: "Validées", value: cnt(active, "traite"), color: "#047857" },
    { key: "refuse", label: "Refusées", value: cnt(active, "refuse"), color: "#B91C1C" },
    { key: "archive", label: "Archivées", value: archivedList.length, color: C.dim },
  ];
  const ql = q.trim().toLowerCase();
  const matchQ = (t) => !ql || ((t.title || "") + " " + (t.authorName || "") + " " + (t.authorEmail || "") + " " + (t.message || "")).toLowerCase().includes(ql);
  const matchType = (t) => typeFilter === "tous" || t.type === typeFilter;
  let base;
  if (filter === "archive") base = archivedList;
  else if (filter === "actives") base = active;
  else if (filter === "atraiter") base = active.filter((t) => t.status === "nouveau" || t.status === "en_cours");
  else base = active.filter((t) => t.status === filter);
  const shown = base.filter(matchQ).filter(matchType);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bgSoft, overflow: "hidden" }}>
      <header className="no-print" style={{ background: C.white, borderBottom: `1px solid ${C.line}`, position: "sticky", top: 0, zIndex: 60, flexShrink: 0 }}>
        <div style={{ padding: "16px 32px 0", display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={onBack} title="Retour" style={{ width: 38, height: 38, borderRadius: 980, border: `1px solid ${C.line2}`, background: C.card, color: C.muted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>{TkI.back(16, C.muted)}</button>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: C.accentSoft, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>{TkI.inbox(20, C.accent)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.dim, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Administration</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Gestion des demandes</div>
          </div>
        </div>

        {/* KPI cliquables (servent aussi de filtres) */}
        <div style={{ padding: "14px 32px 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(116px, 1fr))", gap: 10 }}>
          {kpis.map((k) => { const on = filter === k.key; return (
            <button key={k.key} onClick={() => setFilter(k.key)} style={{ textAlign: "left", padding: "11px 13px", borderRadius: 14, cursor: "pointer", border: `1px solid ${on ? k.color : C.line}`, background: on ? `${k.color}12` : C.card, transition: "all .15s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}><span style={{ width: 8, height: 8, borderRadius: 3, background: k.color, flexShrink: 0 }} /><span style={{ font: `600 11px ${F.ui}`, color: C.muted }}>{k.label}</span></div>
              <div style={{ font: `800 22px ${F.ui}`, color: on ? k.color : C.text, lineHeight: 1 }}>{k.value}</div>
            </button>); })}
        </div>

        {/* Stats secondaires + répartition par type */}
        <div style={{ padding: "12px 32px 0", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "stretch" }}>
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "9px 14px" }}>
            <div style={{ font: `600 10px ${F.ui}`, color: C.dim, textTransform: "uppercase", letterSpacing: ".05em" }}>Cette semaine</div>
            <div style={{ font: `800 16px ${F.ui}`, color: C.text }}>{cetteSemaine} <span style={{ font: `500 11px ${F.ui}`, color: C.dim }}>reçues</span></div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "9px 14px" }}>
            <div style={{ font: `600 10px ${F.ui}`, color: C.dim, textTransform: "uppercase", letterSpacing: ".05em" }}>Délai moyen de réponse</div>
            <div style={{ font: `800 16px ${F.ui}`, color: C.text }}>{fmtDur(avgDelay)}</div>
          </div>
          {parType.length > 0 && (
            <div style={{ flex: 1, minWidth: 240, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "9px 14px" }}>
              <div style={{ font: `600 10px ${F.ui}`, color: C.dim, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Répartition par type · demandes actives</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {parType.map((x) => (
                  <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ font: `500 11.5px ${F.ui}`, color: C.muted, width: 132, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.label}</span>
                    <div style={{ flex: 1, height: 8, background: C.bgSoft, borderRadius: 980, overflow: "hidden" }}><div style={{ width: `${(x.n / maxType) * 100}%`, height: "100%", background: C.accent, borderRadius: 980 }} /></div>
                    <span style={{ font: `700 11.5px ${F.ui}`, color: C.text, width: 22, textAlign: "right" }}>{x.n}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Barre d'outils : recherche + type + archivage groupé */}
        <div style={{ padding: "12px 32px 14px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (nom, email, objet, message…)" style={{ flex: 1, minWidth: 200, padding: "9px 13px", borderRadius: 10, border: `1px solid ${C.line2}`, background: C.card, color: C.text, font: `500 13px ${F.ui}`, outline: "none", boxSizing: "border-box" }} />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.line2}`, background: C.card, color: C.text, font: `600 12.5px ${F.ui}`, cursor: "pointer" }}>
            <option value="tous">Tous les types</option>
            {TICKET_TYPES.map((tt) => <option key={tt.id} value={tt.id}>{tt.label}</option>)}
          </select>
          {filter !== "archive" && doneCount > 0 && (
            <button onClick={archiveAllDone} disabled={busy} style={{ padding: "9px 15px", borderRadius: 10, border: `1px solid ${C.line2}`, background: C.bgSoft, color: C.text, font: `700 12.5px ${F.ui}`, cursor: busy ? "wait" : "pointer" }}>{busy ? "Archivage…" : `Archiver les traitées (${doneCount})`}</button>
          )}
        </div>
      </header>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 32px 60px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
          {shown.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: C.dim, font: `500 14px ${F.ui}`, background: C.card, border: `1px dashed ${C.line2}`, borderRadius: 16 }}>{filter === "archive" ? "Aucune demande archivée pour le moment." : ((q || typeFilter !== "tous") ? "Aucune demande ne correspond à ces filtres." : "Aucune demande active — tout est traité 🎉")}</div>
          ) : shown.map((t) => {
            const open = openId === t._id;
            const type = TICKET_TYPES.find((x) => x.id === t.type);
            return (
              <div key={t._id} style={{ background: C.card, border: `1px solid ${open ? C.accent : C.line}`, borderRadius: 16, overflow: "hidden", transition: "border-color .15s", opacity: t.archived ? 0.82 : 1 }}>
                <div onClick={() => setOpenId(open ? null : t._id)} style={{ padding: "15px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
                  <div style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .15s", color: C.dim, flexShrink: 0 }}>{TkI.chevron(16, C.dim)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                      <span style={{ font: `700 14.5px ${F.ui}`, color: C.text }}>{t.title}</span>
                      <span style={{ font: `600 11px ${F.ui}`, color: C.accent, background: C.accentSoft, padding: "2px 8px", borderRadius: 980 }}>{t.typeLabel}</span>
                      {t.priority === "haute" && <span style={{ font: `600 11px ${F.ui}`, color: "#B91C1C", background: "rgba(185,28,28,.10)", padding: "2px 8px", borderRadius: 980 }}>Priorité haute</span>}
                      {t.archived && <span style={{ font: `600 11px ${F.ui}`, color: C.dim, background: C.bgSoft, padding: "2px 8px", borderRadius: 980 }}>📦 Archivée</span>}
                    </div>
                    <div style={{ font: `500 12px ${F.ui}`, color: C.dim }}>{t.authorName} · {t.authorEmail} · {wsTicketFmtDate(t.createdAt)}</div>
                  </div>
                  <TicketStatusBadge status={t.status} />
                </div>

                {open && (
                  <div style={{ padding: "4px 18px 18px 48px", borderTop: `1px solid ${C.line}` }}>
                    {type && type.fields.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", margin: "14px 0" }}>
                        {type.fields.map((f) => {
                          const val = (t.fields || {})[f.key];
                          if (!val) return null;
                          return (<div key={f.key} style={{ font: `500 13px ${F.ui}`, color: C.text }}><span style={{ color: C.dim }}>{f.label} : </span><b>{f.type === "date" ? wsTicketFmtDay(val) : val}</b></div>);
                        })}
                      </div>
                    )}
                    {t.message && <div style={{ font: `500 13.5px ${F.ui}`, color: C.text, background: C.bgSoft, borderRadius: 12, padding: "12px 14px", margin: "12px 0", whiteSpace: "pre-wrap" }}>{t.message}</div>}

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "14px 0 10px" }}>
                      <span style={{ font: `600 12px ${F.ui}`, color: C.muted, marginRight: 4 }}>Statut :</span>
                      {[["en_cours", "En traitement", "#B45309"], ["traite", "Validé", "#047857"], ["refuse", "Refusé", "#B91C1C"], ["nouveau", "Nouveau", "#2563EB"]].map(([k, lbl, col]) => (
                        <button key={k} onClick={() => setStatus(t, k)} style={{ padding: "6px 12px", borderRadius: 980, cursor: "pointer", font: `600 12px ${F.ui}`, border: `1px solid ${t.status === k ? col : C.line2}`, background: t.status === k ? col : C.card, color: t.status === k ? "#fff" : C.muted }}>{lbl}</button>
                      ))}
                      <div style={{ flex: 1, minWidth: 8 }} />
                      {t.archived
                        ? <button onClick={() => unarchive(t)} style={{ padding: "6px 12px", borderRadius: 980, cursor: "pointer", font: `700 12px ${F.ui}`, border: `1px solid ${C.line2}`, background: C.card, color: C.accent }}>↩︎ Désarchiver</button>
                        : <button onClick={() => archive(t)} style={{ padding: "6px 12px", borderRadius: 980, cursor: "pointer", font: `700 12px ${F.ui}`, border: `1px solid ${C.line2}`, background: C.bgSoft, color: C.muted }}>📦 Archiver</button>}
                    </div>

                    {/* Réponse à l'employé (visible par le demandeur dans « Mes demandes ») */}
                    <div style={{ marginTop: 14 }}>
                      <label style={{ display: "block", font: `600 11.5px ${F.ui}`, color: C.muted, marginBottom: 5 }}>Réponse à l'employé (visible dans « Mes demandes »)</label>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <textarea value={replyDraft[t._id] ?? (t.reponse || "")} onChange={(e) => setReplyDraft((p) => ({ ...p, [t._id]: e.target.value }))} rows={2} placeholder="Votre réponse au demandeur…" style={{ flex: 1, boxSizing: "border-box", padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.line2}`, background: C.card, color: C.text, font: `500 13px ${F.ui}`, outline: "none", resize: "vertical", minHeight: 42 }} />
                        <button onClick={() => saveReply(t)} style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", font: `700 12.5px ${F.ui}`, cursor: "pointer", flexShrink: 0 }}>Envoyer la réponse</button>
                      </div>
                      {t.reponse && <div style={{ font: `600 11.5px ${F.ui}`, color: "#047857", marginTop: 6 }}>✓ Réponse transmise{t.reponseAt ? " · " + wsTicketFmtDate(t.reponseAt) : ""}</div>}
                    </div>

                    {/* Note interne + email direct */}
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", font: `600 11.5px ${F.ui}`, color: C.muted, marginBottom: 5 }}>Note interne (admin uniquement)</label>
                        <input value={noteDraft[t._id] ?? (t.adminNote || "")} onChange={(e) => setNoteDraft((p) => ({ ...p, [t._id]: e.target.value }))} placeholder="Note privée…" style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.line2}`, background: C.card, color: C.text, font: `500 13px ${F.ui}`, outline: "none" }} />
                      </div>
                      <button onClick={() => saveNote(t)} style={{ padding: "9px 15px", borderRadius: 10, border: `1px solid ${C.line2}`, background: C.bgSoft, color: C.text, font: `600 12.5px ${F.ui}`, cursor: "pointer", flexShrink: 0 }}>Enregistrer</button>
                      <a href={`mailto:${t.authorEmail}?subject=${encodeURIComponent("Votre demande : " + t.title)}`} style={{ padding: "9px 15px", borderRadius: 10, border: `1px solid ${C.line2}`, background: C.card, color: C.accent, font: `600 12.5px ${F.ui}`, cursor: "pointer", textDecoration: "none", flexShrink: 0 }}>Email</a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


function ressTypeOf(f) {
  f = f || "";
  if (/\.pdf$/i.test(f)) return "pdf";
  if (/\.docx?$/i.test(f)) return "docx";
  if (/\.(png|jpe?g|webp|gif|svg)$/i.test(f)) return "image";
  return "pdf";
}

function WallSwissAppMain() {
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
    parFinanceP1: "ParFinance est une société de gestion d'actifs suisse indépendante, reconnue pour son expertise pointue dans l'allocation d'actifs et la sélection de fonds de placement de premier ordre.",
    parFinanceP2: "En choisissant la stratégie Aries Portfolio, vous bénéficiez d'une gestion active et rigoureuse, visant à maximiser les rendements tout en contrôlant la volatilité grâce à une diversification intelligente à l'échelle mondiale.",
    contactDesc: "Gérer son patrimoine nécessite une approche personnalisée et stratégique. En optimisant sa fiscalité, en sécurisant son épargne et en faisant des choix d'investissement éclairés, il est possible de construire un patrimoine pérenne et adapté à vos projets de vie.",
    dividerQuote: "« L'investissement est un voyage à long terme. La clé est de rester concentré sur sa destination finale et de s'entourer des meilleurs partenaires. »",
    appP1: "Effectuez des opérations de trading, d'investissement et bancaires en toute sécurité et à des tarifs avantageux, grâce au principal acteur suisse de la banque en ligne.",
    appP2: "Nos plateformes intuitives vous invitent à explorer un monde riche en opportunités. Et accédez à une vaste gamme d'informations et de programmes de formation.",
    prevIntroP1: "L'AVS couvre les besoins vitaux. Elle est obligatoire pour toute personne domiciliée ou exerçant une activité lucrative en Suisse.",
    prevIntroP2: "La LPP vise le maintien du niveau de vie antérieur. Ensemble, ces deux premiers piliers ne couvrent en moyenne que 60% du dernier salaire de carrière.",
    prevIntroP3: "Le 3ème pilier est donc indispensable pour combler ces lacunes, viser les 100% du salaire à la retraite, et réaliser des économies d'impôts majeures.",
    prevCouvP1: "En cas d'incapacité de gain (maladie ou accident), la compagnie prend le relais et paie vos primes. Votre capital retraite continue de se construire sans que vous n'ayez à débourser un centime.",
    prevCouvP2: "En cas de coup dur prématuré, un capital garanti est immédiatement versé à vos bénéficiaires (conjoint, enfants) pour les mettre à l'abri du besoin et assumer les charges courantes (hypothèque, études).",
    prevCouvP3: "Selon vos besoins, il est possible d'ajouter des rentes en cas d'invalidité pour compenser la perte de revenus, garantissant le maintien absolu de votre niveau de vie.",
    prevFondsIntro: "Pour contrer l'inflation et maximiser votre capital à la retraite, votre épargne est investie sur les marchés financiers au travers de fonds de placement de premier ordre, sélectionnés via notre partenaire",
    prevRachatP1: "Une solution de prévoyance liée à des fonds est un puissant levier conçu pour le long terme (jusqu'à l'âge de la retraite). Les premières années de votre plan constituent le socle de votre sécurité :",
    prevRachatP2: "La valeur de votre contrat (valeur de rachat) se construit ainsi progressivement. Un retrait lors des toutes premières années ne reflète pas encore le plein potentiel de croissance de votre investissement à terme.",
    prevFiscP1: "Le système fiscal suisse encourage fortement la prévoyance individuelle. Chaque franc investi dans votre pilier 3A vient réduire directement votre revenu imposable.",
    prevFiscP2: "Pour un contribuable moyen, cela représente un retour sur investissement immédiat et garanti par l'État pouvant aller de 20% à 35% du montant versé, indépendamment des performances des marchés financiers.",
    lppIntroP1: "Le 2ème pilier (LPP) est la pierre angulaire de votre retraite. Toutefois, face à l'augmentation de l'espérance de vie, les taux de conversion légaux et surobligatoires sont en baisse constante.",
    lppIntroP2: "Cela signifie que pour un même capital accumulé, la rente versée à la retraite sera plus faible que par le passé.",
    lppIntroP3: "Il est donc crucial de reprendre le contrôle de votre prévoyance professionnelle : dynamiser vos avoirs de libre passage est aujourd'hui une nécessité absolue pour maintenir votre niveau de vie.",
    lppFonctP1: "Le compte de libre passage accueille vos avoirs LPP lorsque vous quittez une caisse de pension sans en rejoindre une nouvelle immédiatement (activité indépendante, départ à l'étranger, pause).",
    lppFonctP2: "Sur un compte bancaire classique, ce capital dort et subit l'érosion monétaire due à l'inflation. De plus, il n'est plus géré activement par une caisse de pension.",
    lppFonctP3: "La loi vous autorise à reprendre le contrôle de cette épargne bloquée en l'investissant sur les marchés, afin de recréer une dynamique de rendement propre à la prévoyance.",
    lppLibreP1: "Si vous quittez votre employeur, prenez une année sabbatique ou devenez indépendant, vos avoirs LPP sont transférés sur un compte de libre passage (CLP).",
    lppLibreP2: "Au lieu de laisser ce capital dormir sur un compte rémunéré à un taux proche de zéro, vous avez la possibilité légale de l'investir sur les marchés financiers selon votre profil de risque.",
    lppAdminP1: "Pour sécuriser et gérer vos avoirs de libre passage, nous nous appuyons sur une fondation institutionnelle de premier plan en Suisse.",
    lppAdminP2: "La fondation agit comme le gardien légal de vos avoirs, garantissant que ceux-ci restent insaisissables, séparés du bilan de la banque dépositaire, et investis strictement selon les directives fédérales (OPP2).",
    lppAvantagesP1: "Investir son Libre Passage permet de viser des rendements historiques nettement supérieurs à ceux d'un compte de fondation classique ou d'une caisse de pension standard.",
    lppAvantagesP2: "Vous bénéficiez d'une architecture ouverte : vos avoirs sont gérés par des experts mondiaux, tout en profitant d'avantages fiscaux majeurs.",
    avSolutionsP1: "Le placement préféré des français ( 2 000 MDS € ), l'assurance vie peut se révéler pertinente, que vous souhaitiez : Financer un projet, acheter un bien ou transmettre à vos proches.",
    avSolutionsP2: "L'assurance vie présente de nombreux avantages après 8 ans. Succession, exonération et abattements fiscaux sur les plus-values."
  };

  const [activeModule, setActiveModule] = useState("hub");
  const [moduleArg, setModuleArg] = useState(null); // args de navigation (ex. doc Académie à ouvrir)
  const [resDoc, setResDoc] = useState(null); // document ouvert dans la liseuse (module Ressources)
  // ── SOMMAIRE : navigation via le hub (onglets/sous-onglets) → page placeholder ──
  const [activePage, setActivePage] = useState(null);
  const [pageDoc, setPageDoc] = useState(null);   // document ouvert depuis une fiche Académie
  const [acadMap, setAcadMap] = useState({});      // nom de fichier -> {title,type} (public/academy/library.json)
  useEffect(() => {
    let alive = true;
    fetch(ACADEMY_CONFIG.base + "library.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && j && Array.isArray(j.docs)) { const m = {}; j.docs.forEach((d) => { if (d && d.file) m[d.file] = d; }); setAcadMap(m); } })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  const openPageDoc = (e) => {
    const ent = (typeof e === "string") ? { file: e, base: "/academy/" } : { file: e.file, base: e.base || "/academy/", title: e.title };
    let file = ent.file; const base = ent.base;
    if (base === "/academy/") {
      // résoudre le nom exact stocké (tolérant aux accents NFC/NFD)
      let use = acadMap[file] ? file : null;
      if (!use) { const t = file.normalize("NFC"); for (const k of Object.keys(acadMap)) { if (k.normalize("NFC") === t) { use = k; break; } } }
      if (use) file = use;
    }
    const d = base === "/academy/" ? acadMap[file] : null;
    const ext = (file.split(".").pop() || "").toLowerCase();
    setPageDoc({ id: "doc:" + base + file, title: ent.title || (d && d.title) || file.replace(/\.[a-z0-9]+$/i, ""), type: (d && d.type) || ext, src: base + encodeURIComponent(file), file: file, backLabel: "Retour" });
  };
  const [hubTarget, setHubTarget] = useState(null); // niveau à rouvrir dans le hub (fil d'Ariane)
  const handleSommaireNav = (node, path, crumbs) => {
    if (node.action?.type === "url") { if (typeof window !== "undefined") window.open(node.action.url, "_blank"); return; }
    if (node.action?.type === "module") { setModuleArg({ doc: node.action.doc || null, _n: Date.now() }); setActiveModule(node.action.module); return; }
    setActivePage({ ...node, path, crumbs: crumbs || [] }); setActiveModule("page");
  };
  const openHubAt = (id) => { setHubTarget(id ? { id, _n: Date.now() } : null); setActiveModule("hub"); };
  const goHubRoot = () => { setHubTarget(null); setActiveModule("hub"); };
  const [rapportPage, setRapportPage] = useState("dashboard");
  const [step, setStep] = useState(0);

  const [user, setUser] = useState(null);
  const [userStatus, setUserStatus] = useState(null); // 'pending' ou 'approved'
  const [authLoading, setAuthLoading] = useState(true);
  // --- Écran de connexion / inscription ---
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'signup'
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [agentsList, setAgentsList] = useState([]);
  const [adminTab, setAdminTab] = useState("reports"); // 'reports' ou 'agents'
  const [settingsTab, setSettingsTab] = useState("profile");

  // --- STATE MAILING MODULE ---
  const [mailingClients, setMailingClients] = useState([]);
  const [mailingTab, setMailingTab] = useState("contacts");
  const [newClient, setNewClient] = useState({ prenom: "", nom: "", email: "" });
  const [bulkImport, setBulkImport] = useState("");
  const [campaign, setCampaign] = useState({ subject: "", body: "Bonjour {{prenom}},\n\nJe vous contacte suite à...", selectedIds: [] });
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [campaignSuccess, setCampaignSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // --- STATE MAILS TYPES ---
  const [mailSearch, setMailSearch] = useState("");
  const [mailCat, setMailCat] = useState("Toutes");
  const [toastMsg, setToastMsg] = useState("");
  const [selectedMail, setSelectedMail] = useState(null);

  // --- STATE MARKETING MODULE ---
  const [marketingCampaign, setMarketingCampaign] = useState('3p-meta');
  const [marketingTab, setMarketingTab] = useState('context');
  const [marketingCopied, setMarketingCopied] = useState(false);
  const [compteChIdx, setCompteChIdx] = useState(0);

  // --- STATE RECHERCHE LPP ---
    const [docsSelectionnes, setDocsSelectionnes] = useState({ mandat: true, sff5: true, suppletive: false });
  const [previewActif, setPreviewActif] = useState("mandat");
const [lppForm, setLppForm] = useState({
    nom: "", prenom: "", dateNaissance: "", avs: "",
    adresse: "", localite: "", pays: "Suisse", telephone: "", emailClient: "",
    nomEntreprise: "WallSwiss", adresseEntreprise: "Rue Kléberg 14", cpaVilleEntreprise: "1201 Genève", emailEntreprise: "contact@wallswiss.ch"
  });
  const [isGeneratingLpp, setIsGeneratingLpp] = useState(false);
  const [isSendingSign, setIsSendingSign] = useState(false);
  const handleCopy = (text, msg) => {
    navigator.clipboard.writeText(text);
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleCopyScript = () => {
    const campaignData = CAMPAIGNS_DATA[marketingCampaign];
    const scriptText = `1. Introduction :\n${campaignData.scripts.intro}\n\n2. Transition :\n${campaignData.scripts.transition}\n\n3. Closing :\n${campaignData.scripts.closing}`;
    navigator.clipboard.writeText(scriptText);
    setMarketingCopied(true);
    setTimeout(() => setMarketingCopied(false), 2500);
  };

  const generateOfficialLppPdf = async () => {
    // Charger pdf-lib dynamiquement pour manipuler le PDF officiel
    if (!window.PDFLib) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
    const url = '/SF-F5-FR.pdf';

    // Récupération du PDF officiel à la racine du projet
    const existingPdfBytes = await fetch(url).then(res => {
      if (!res.ok) throw new Error("Le fichier SF-F5-FR.pdf est introuvable. Placez-le à la racine du projet (dossier public/).");
      return res.arrayBuffer();
    });

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const page1 = pages[0];
    const page2 = pages.length > 1 ? pages[1] : null;

    // Helper sécurisé pour dessiner du texte sur une page
    const drawText = (page, text, x, y, size = 11) => {
      if (!page || !text) return;
      page.drawText(String(text), {
        x: x,
        y: y,
        size: size,
        font: helvetica,
        color: rgb(0.1, 0.1, 0.1)
      });
    };

    // ─── PAGE 1 : Informations personnelles ───
    // Coordonnées PDF calibrées précisément sur le formulaire officiel SF-F5-FR
    // (origine bas-gauche, A4 = 595 x 842 points)
    // Les deux cases "Nom" reçoivent la même valeur (nom de naissance + nom actuel)
    drawText(page1, lppForm.nom,           370, 421);  // Nom (case 1)
    drawText(page1, lppForm.nom,           370, 395);  // Nom (case 2)
    drawText(page1, lppForm.prenom,        370, 332);  // Prénom (case 1)
    drawText(page1, lppForm.prenom,        370, 306);  // Prénom (case 2)
    drawText(page1, lppForm.dateNaissance, 370, 224);  // Date de naissance
    drawText(page1, lppForm.avs,           370, 198);  // N° AVS

    // Adresse : répartie sur 3 lignes (rue / NPA+ville / pays)
    drawText(page1, lppForm.adresse,  370, 155);  // Adresse L1 (rue)
    drawText(page1, lppForm.localite, 370, 128);  // Adresse L2 (NPA + ville)
    drawText(page1, lppForm.pays,     370, 102);  // Adresse L3 (pays)

    // Téléphone / email combinés
    const telEmail = [lppForm.telephone, lppForm.emailClient].filter(Boolean).join(' / ');
    drawText(page1, telEmail, 370, 47);

    // ─── PAGE 2 : Lieu et date ───
    if (page2) {
      const today = new Date().toLocaleDateString('fr-CH');
      drawText(page2, `Genève, ${today}`, 370, 419);
      // La signature reste vide (sera ajoutée par Yousign après envoi)
    }

    return await pdfDoc.save();
  };

  const handleDownloadLppDoc = async () => {
    setIsGeneratingLpp(true);
    try {
              const pdfs = [];
    if (docsSelectionnes.sff5) { const sff5 = await genererSFF5Bytes({ nom: lppForm.nom, prenom: lppForm.prenom, dateNaissance: lppForm.dateNaissance, avsNumero: lppForm.avs, adresse: lppForm.adresse, localite: lppForm.localite, pays: lppForm.pays, telephone: lppForm.telephone, email: lppForm.emailClient }); pdfs.push(sff5); }
    if (docsSelectionnes.mandat) { setToastMsg("Mandat PDF à venir"); setTimeout(()=>setToastMsg(""),3000); }
    if (docsSelectionnes.suppletive) { setToastMsg("Recherche supplétive à venir"); setTimeout(()=>setToastMsg(""),3000); }
    if (pdfs.length === 0) { setToastMsg("Sélectionnez au moins un document"); setTimeout(()=>setToastMsg(""),3000); setIsGeneratingLpp(false); return; }
    const pdfBytes = pdfs.length === 1 ? pdfs[0] : await combinerPDFs(pdfs);

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Recherche_LPP_${lppForm.nom || 'Client'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch(e) {
      console.error("Erreur PDF:", e);
      setToastMsg("Erreur lors de la génération du PDF officiel.");
      setTimeout(() => setToastMsg(""), 4000);
    } finally {
      setIsGeneratingLpp(false);
    }
  };

  const handleSendForSignature = async () => {
    const webhookUrl = appSettings.lppWebhookUrl?.trim();

    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      setToastMsg("Veuillez configurer l'URL du Webhook Signature dans les paramètres.");
      setTimeout(() => setToastMsg(""), 4000);
      return;
    }
    if (!lppForm.emailClient || !lppForm.nom || !lppForm.prenom) {
      setToastMsg("Le prénom, nom et email sont obligatoires pour la signature.");
      setTimeout(() => setToastMsg(""), 4000);
      return;
    }

    setIsSendingSign(true);

    try {
      const pdfBytes = await generateOfficialLppPdf();

      // Conversion de Uint8Array en Base64 de façon performante
      const pureBase64 = btoa(
        new Uint8Array(pdfBytes).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom: lppForm.prenom,
          nom: lppForm.nom,
          email: lppForm.emailClient,
          telephone: lppForm.telephone,
          pdfBase64: pureBase64,
          filename: `Mandat_LPP_${lppForm.nom || 'Client'}.pdf`
        })
      });

      if (!response.ok) {
        throw new Error(`Le webhook a refusé l'envoi (${response.status})`);
      }

      setToastMsg("Document officiel envoyé avec succès à Yousign !");
      setTimeout(() => setToastMsg(""), 4000);
    } catch (e) {
      console.error("Erreur d'envoi pour signature:", e);
      setToastMsg(`Erreur lors de l'envoi : ${e.message}`);
      setTimeout(() => setToastMsg(""), 4000);
    } finally {
      setIsSendingSign(false);
    }
  };

  const handleImageUpload = async (file, path) => {
    if (!file || !storage) return null;
    setUploadingImage(true);
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setUploadingImage(false);
      return url;
    } catch (error) {
      console.error("Erreur d'upload :", error);
      setUploadingImage(false);
      return null;
    }
  };

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Connexion / inscription par e-mail + mot de passe
  const handleAuthSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setAuthError("");
    if (!auth || !db) { setAuthError("Firebase n'est pas connecté."); return; }
    const email = authEmail.trim();
    if (!email || !authPassword) { setAuthError("Veuillez renseigner l'e-mail et le mot de passe."); return; }
    setAuthBusy(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      if (authMode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, authPassword);
        try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'agents', cred.user.uid), {
            email: email,
            status: 'approved',
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (e2) { console.error("Création profil agent:", e2); }
      } else {
        await signInWithEmailAndPassword(auth, email, authPassword);
      }
      setAuthPassword("");
    } catch (err) {
      const map = {
        'auth/invalid-email': "Adresse e-mail invalide.",
        'auth/user-not-found': "Aucun compte avec cet e-mail.",
        'auth/wrong-password': "Mot de passe incorrect.",
        'auth/invalid-credential': "E-mail ou mot de passe incorrect.",
        'auth/email-already-in-use': "Un compte existe déjà avec cet e-mail.",
        'auth/weak-password': "Mot de passe trop faible (6 caractères minimum).",
        'auth/too-many-requests': "Trop de tentatives, réessayez plus tard.",
        'auth/network-request-failed': "Problème de connexion réseau."
      };
      setAuthError(map[err.code] || ("Erreur : " + (err.message || err.code)));
    } finally {
      setAuthBusy(false);
    }
  };

  const handlePasswordReset = async () => {
    setAuthError("");
    if (!auth) { setAuthError("Firebase n'est pas connecté."); return; }
    const email = authEmail.trim();
    if (!email) { setAuthError("Entrez d'abord votre e-mail pour recevoir le lien."); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      setAuthError("E-mail de réinitialisation envoyé à " + email + ".");
    } catch (err) {
      setAuthError("Envoi impossible : " + (err.message || err.code));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserStatus(null);
    } catch (error) {
      console.error("Erreur de déconnexion", error);
    }
  };

  const toggleAgentStatus = async (agentId, currentStatus) => {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'agents', agentId), {
        status: newStatus
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut", error);
    }
  };

  const [appSettings, setAppSettings] = useState(() => {
    const defaults = {
      reportWebhookUrl: "",
      campaignWebhookUrl: "",
      lppWebhookUrl: "",
      emailSubject: "Votre Analyse Patrimoniale - WallSwiss",
      emailBody: "Bonjour {{prenom}} {{nom}},\n\nVeuillez trouver ci-joint votre rapport d'analyse patrimoniale personnalisé suite à notre entretien.\n\nRestant à votre entière disposition pour toute question.\n\nCordialement,\n{{conseiller}}",
      agentFirstName: "",
      agentLastName: "",
      agentTitle: "",
      agentPhone: "",
      agentEmail: "",
      defaultLogo: "",
      defaultCover: "",
      defaultPhilosophy: "",
      marketingMedia: {}
    };
    try {
      const local = localStorage.getItem('wallswiss_settings');
      return local ? { ...defaults, ...JSON.parse(local) } : defaults;
    } catch(e) {
      return defaults;
    }
  });

  const [reports, setReports] = useState([]);
  const [preview, setPreview] = useState(null);

  // --- ETAT D'ÉDITION HUB MARKETING ---
  const [isEditingMarketing, setIsEditingMarketing] = useState(false);

  const onMarketingMediaChange = async (file, mediaKey) => {
    if (!file) return;
    const url = await handleImageUpload(file, `marketing/${user?.uid || 'global'}/${mediaKey}_${Date.now()}`);
    if (url) {
      const newSettings = { ...appSettings, marketingMedia: { ...(appSettings.marketingMedia || {}), [mediaKey]: url } };
      updateSettings(newSettings);
    }
  };

  const EditableMedia = ({ mediaKey, defaultUrl, isVideo, posterUrl }) => {
    const currentUrl = appSettings.marketingMedia?.[mediaKey] || defaultUrl;
    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {isVideo ? (
          <video key={currentUrl} className="w-full h-full object-cover block" controls muted loop playsInline poster={posterUrl} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}>
            <source src={currentUrl} type={currentUrl.includes('.webm') ? 'video/webm' : 'video/mp4'} />
          </video>
        ) : (
          <img src={currentUrl} alt="Créative Marketing" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        )}
        {isEditingMarketing && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30 }}>
            <label style={{ background: C.accent, color: C.white, padding: "8px 16px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", gap: 8, alignItems: "center", transition: "0.2s" }} onMouseEnter={e=>e.currentTarget.style.opacity=0.9} onMouseLeave={e=>e.currentTarget.style.opacity=1}>
              <input type="file" accept={isVideo ? "video/*" : "image/*"} style={{ display: "none" }} onChange={(e) => onMarketingMediaChange(e.target.files[0], mediaKey)} />
              <Icons.Copy size={16} /> Changer {isVideo ? "Vidéo" : "Image"}
            </label>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (!user || !db) return;

    let unsubProfile = () => {};
    let unsubAgents = () => {};
    let unsubMailing = () => {};

    // 1. Vérifier le statut de l'utilisateur (sauf si c'est l'admin)
    if (user.email !== ADMIN_EMAIL) {
      const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'agents', user.uid);
      unsubProfile = onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserStatus(docSnap.data().status);
        } else {
          setUserStatus('pending'); // Par défaut bloqué si pas de profil
        }
        setAuthLoading(false);
      });
    } else {
      setUserStatus('approved'); // L'admin est toujours approuvé
      setAuthLoading(false);

      // 2. Si c'est l'admin, charger la liste des agents
      const agentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'agents');
      unsubAgents = onSnapshot(agentsRef, (snapshot) => {
        const loadedAgents = [];
        snapshot.forEach((doc) => {
          loadedAgents.push({ id: doc.id, ...doc.data() });
        });
        setAgentsList(loadedAgents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      });
    }

    // 3. Charger les rapports
    const reportsRef = collection(db, 'artifacts', appId, 'public', 'data', 'reports');
    const unsubscribeReports = onSnapshot(reportsRef, (snapshot) => {
      const loadedReports = [];
      snapshot.forEach((doc) => {
        loadedReports.push({ id: doc.id, ...doc.data() });
      });

      // Si l'utilisateur n'est pas admin, il ne voit que ses propres rapports
      if (user.email !== ADMIN_EMAIL) {
        setReports(loadedReports.filter(r => r.agentId === user.uid).sort((a, b) => b.id - a.id));
      } else {
        // L'admin voit tout le cabinet
        setReports(loadedReports.sort((a, b) => b.id - a.id));
      }
    }, (error) => console.error("Reports snapshot error", error));

    const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'default');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAppSettings(prev => ({ ...prev, ...data }));
        setForm(prev => {
          if (!prev.id) {
            return {
              ...prev,
              conseiller: `${data.agentFirstName || ""} ${data.agentLastName || ""}`.trim() || prev.conseiller,
              titreConseiller: data.agentTitle || prev.titreConseiller,
              telephone: data.agentPhone || prev.telephone,
              email: data.agentEmail || prev.email,
              customLogo: data.defaultLogo || prev.customLogo,
              customCoverImage: data.defaultCover || prev.customCoverImage,
              customPhilosophyImage: data.defaultPhilosophy || prev.customPhilosophyImage
            };
          }
          return prev;
        });
      }
    }, (error) => console.error("Settings snapshot error", error));

    // 4. Charger la base de contacts Mailing
    const mailingRef = collection(db, 'artifacts', appId, 'users', user.uid, 'mailing_clients');
    unsubMailing = onSnapshot(mailingRef, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setMailingClients(list.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt)));
    });

    return () => {
      unsubscribeReports();
      unsubscribeSettings();
      unsubProfile();
      unsubAgents();
      unsubMailing();
    };
  }, [user]);
  // --- ACTIONS MAILING ---
  const handleAddMailingClient = async (e) => {
    e.preventDefault();
    if (!newClient.email || !user || !db) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'mailing_clients'), {
        prenom: newClient.prenom.trim(),
        nom: newClient.nom.trim(),
        email: newClient.email.trim(),
        addedAt: new Date().toISOString()
      });
      setNewClient({ prenom: "", nom: "", email: "" });
    } catch(err) {
      console.error("Erreur ajout contact", err);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImport.trim() || !user || !db) return;
    const lines = bulkImport.trim().split('\n');
    let added = 0;
    for (const line of lines) {
      const parts = line.split(/[\t,;]+/).map(s => s.trim());
      // On cherche une adresse email dans la ligne
      const email = parts.find(p => p.includes('@'));
      if (email) {
        const otherParts = parts.filter(p => !p.includes('@'));
        const prenom = otherParts[0] || "";
        const nom = otherParts[1] || "";
        try {
          await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'mailing_clients'), {
            prenom, nom, email, addedAt: new Date().toISOString()
          });
          added++;
        } catch(e){}
      }
    }
    setBulkImport("");
    setToastMsg(`${added} contacts importés avec succès !`);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleDeleteMailingClient = async (id) => {
    if(!user || !db) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'mailing_clients', id));
      setCampaign(p => ({ ...p, selectedIds: p.selectedIds.filter(cid => cid !== id) }));
    } catch(e) {
      console.error("Erreur suppression", e);
    }
  };

  const handleToggleRecipient = (id) => {
    setCampaign(p => {
      if(p.selectedIds.includes(id)) return { ...p, selectedIds: p.selectedIds.filter(x => x !== id) };
      return { ...p, selectedIds: [...p.selectedIds, id] };
    });
  };

  const handleSelectAllRecipients = () => {
    if (campaign.selectedIds.length === mailingClients.length) {
      setCampaign(p => ({ ...p, selectedIds: [] }));
    } else {
      setCampaign(p => ({ ...p, selectedIds: mailingClients.map(c => c.id) }));
    }
  };

  const handleSendCampaign = () => {
    if (campaign.selectedIds.length === 0) {
      setToastMsg("Veuillez sélectionner au moins un destinataire.");
      setTimeout(() => setToastMsg(""), 3000);
      return;
    }
    setIsSendingCampaign(true);
    // Simulation d'envoi de la campagne (A lier avec Make/SendGrid plus tard)
    // fetch(appSettings.campaignWebhookUrl, { method: 'POST', body: JSON.stringify({ ids: campaign.selectedIds, subject: campaign.subject, body: campaign.body }) })
    setTimeout(() => {
      setIsSendingCampaign(false);
      setCampaignSuccess(true);
      setTimeout(() => setCampaignSuccess(false), 3000);
      setCampaign({ subject: "", body: "Bonjour {{prenom}},\n\nJe vous contacte suite à...", selectedIds: [] });
    }, 2000);
  };
  // -------------------------

  const [form, setForm] = useState({
    templateId: "swissquote",
    hiddenSlides: [],
    dateRapport: new Date().toISOString().split('T')[0],
    isCouple: false, nomConjoint: "", prenomConjoint: "", ageConjoint: "", professionConjoint: "",
    nom: "", prenom: "", emailClient: "", age: "", profession: "", nationalite: "France", statut: "Célibataire", revenus: "",
    capaciteEpargne: "", fortuneGlobale: "", profilRisque: "Équilibré", horizonPlacement: "Moyen terme (3 - 8 ans)",
    anneesProjection: "",
    objectifs: [], objectifCustom: "", customClientFields: [],
    assetManager: "NS Partners",
    montantInvestissement: "100000", fraisSouscription: "3",
    hasProjectionsMultiples: false, montantInvestissement2: "200000", capaciteEpargne2: "1000",
    tauxPessimiste: "3", tauxRealiste: "6", tauxOptimiste: "9",
    compagniePrevoyance: "Liechtenstein Life", optiFiscale: true, showPrevoyanceComparatif: true,
    tauxPessimistePrev: "2", tauxRealistePrev: "4", tauxOptimistePrev: "6",
    dureeProjectionAv: "15",
    capitalLibrePassage: "120000", administrateurLpp: "Pictet", tauxClp: "4.5", fraisSouscriptionLpp: "1",
    lppActions: "", lppOblig: "", lppImmo: "",
    conseiller: `${appSettings.agentFirstName || ""} ${appSettings.agentLastName || ""}`.trim() || "",
    titreConseiller: appSettings.agentTitle || "",
    telephone: appSettings.agentPhone || "",
    email: appSettings.agentEmail || "",
    customLogo: appSettings.defaultLogo || "",
    customCoverImage: appSettings.defaultCover || "",
    customPhilosophyImage: appSettings.defaultPhilosophy || "",
    texts: initialTexts
  });

  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const uText = (k, v) => setForm(p => ({ ...p, texts: { ...p.texts, [k]: v } }));
  const toggleObj = (o) => setForm(p => ({ ...p, objectifs: p.objectifs.includes(o) ? p.objectifs.filter(x => x !== o) : [...p.objectifs, o] }));
  const addCustomObj = () => { if (form.objectifCustom.trim()) { setForm(p => ({ ...p, objectifs: [...p.objectifs, p.objectifCustom.trim()], objectifCustom: "" })); } };

  const handleSave = async () => {
    const newId = form.id || Date.now();
    const newReport = {
      ...form,
      id: newId,
      agentId: user ? user.uid : "demo",
      agentEmail: user ? user.email : "demo@wallswiss.ch",
      dateCreation: form.dateCreation || new Date().toISOString()
    };

    if (user && db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reports', newId.toString()), newReport);
      } catch (e) {
        console.error("Erreur de sauvegarde", e);
      }
    } else {
      alert("Attention : Le rapport est créé temporairement mais ne sera pas sauvegardé sur Firebase car vos clés de connexion sont manquantes dans le code.");
      setReports(p => [...p, newReport]);
    }

    setPreview(newReport);
    setRapportPage("dashboard");
    setStep(0);
  };

  const updateSettings = async (newSettings) => {
    setAppSettings(newSettings);
    localStorage.setItem('wallswiss_settings', JSON.stringify(newSettings));

    if (!db || !user) {
      setToastMsg("Paramètres sauvegardés localement (Firebase non connecté).");
      setTimeout(() => setToastMsg(""), 3000);
      return;
    }

    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'default'), newSettings, { merge: true });
      setToastMsg("Paramètres sauvegardés avec succès !");
      setTimeout(() => setToastMsg(""), 3000);
    } catch (e) {
      console.error("Erreur de sauvegarde des paramètres", e);
      setToastMsg("Erreur lors de la sauvegarde : " + e.message);
      setTimeout(() => setToastMsg(""), 3000);
    }
  };

  const resetForm = () => setForm({ templateId: "swissquote", hiddenSlides: [], dateRapport: new Date().toISOString().split('T')[0], isCouple: false, nomConjoint: "", prenomConjoint: "", ageConjoint: "", professionConjoint: "", nom: "", prenom: "", emailClient: "", age: "", profession: "", nationalite: "France", statut: "Célibataire", revenus: "", capaciteEpargne: "", fortuneGlobale: "", profilRisque: "Équilibré", horizonPlacement: "Moyen terme (3 - 8 ans)", anneesProjection: "", objectifs: [], objectifCustom: "", customClientFields: [], assetManager: "NS Partners", montantInvestissement: "100000", fraisSouscription: "3", hasProjectionsMultiples: false, montantInvestissement2: "200000", capaciteEpargne2: "1000", tauxPessimiste: "3", tauxRealiste: "6", tauxOptimiste: "9", compagniePrevoyance: "Liechtenstein Life", optiFiscale: true, showPrevoyanceComparatif: true, tauxPessimistePrev: "2", tauxRealistePrev: "4", tauxOptimistePrev: "6", dureeProjectionAv: "15", capitalLibrePassage: "120000", administrateurLpp: "Pictet", tauxClp: "4.5", fraisSouscriptionLpp: "1", lppActions: "", lppOblig: "", lppImmo: "", conseiller: `${appSettings.agentFirstName || ""} ${appSettings.agentLastName || ""}`.trim() || "", titreConseiller: appSettings.agentTitle || "", telephone: appSettings.agentPhone || "", email: appSettings.agentEmail || "", customLogo: appSettings.defaultLogo || "", customCoverImage: appSettings.defaultCover || "", customPhilosophyImage: appSettings.defaultPhilosophy || "", texts: initialTexts });

  const handleDeleteReport = async (e, id) => {
    e.stopPropagation();
    if (user && db) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reports', id.toString()));
      } catch (err) {
        console.error("Erreur lors de la suppression", err);
      }
    } else {
      setReports(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleEditReport = (e, report) => {
    e.stopPropagation();
    setForm(report);
    setStep(0);
    setRapportPage("create");
  };

  const handlePreviewUpdate = async (newData) => {
    setPreview(newData);
    if (newData.id) {
      if (user && db) {
        try {
          // Mise à jour dans la collection globale
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reports', newData.id.toString()), newData);
        } catch (e) {
          console.error("Erreur de mise à jour", e);
        }
      } else {
        setReports(prev => prev.map(r => r.id === newData.id ? newData : r));
      }
    } else {
      setForm(newData);
    }
  };

  const defObj = ["Sécuriser son épargne", "Obtenir une réduction d'impôt (via l'optimisation fiscale Suisse)", "Améliorer la fiscalité des placements", "Mettre en place des sécurités (fonds d'urgence)", "Maintenir un standing de vie", "Préparer la retraite", "Optimiser la transmission de patrimoine", "Financer un projet immobilier"];
  const stepLabels = ["Modèles", "Client", "Objectifs", "Investissement", "Conseiller", "Personnalisation", "Aperçu"];
  if (authLoading) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.card, flexDirection: "column", fontFamily: F.ui, zIndex: 9999 }}>
        <div style={{ background: C.accent, width: "72px", height: "72px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "18px", marginBottom: 24 }}>
          <img src={LOGO_URL} alt="WallSwiss" style={{ width: "40px", height: "40px", objectFit: "contain" }} />
        </div>
        <h2 style={{ fontFamily: F.serif, fontSize: 24, color: C.accent, margin: "0 0 8px 0" }}>WallSwiss</h2>
        <div style={{ color: C.muted, fontSize: 13, fontWeight: 500, letterSpacing: "0.05em" }}>Authentification en cours...</div>
      </div>
    );
  }

  // Écran de connexion / inscription (aucun utilisateur connecté)
  if (!user) {
    const isReset = authError && authError.indexOf("envoyé") !== -1;
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: F.ui, padding: 20, boxSizing: "border-box" }}>
        <div style={{ width: "100%", maxWidth: 400, background: C.card, borderRadius: C.radius, border: `1px solid ${C.line}`, boxShadow: "0 20px 50px rgba(0,0,0,0.12)", padding: 36, boxSizing: "border-box" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 26 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <img src={appSettings.defaultLogo || LOGO_URL} alt="WallSwiss" style={{ width: 30, height: 30, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            </div>
            <h1 style={{ fontFamily: F.serif, fontSize: 24, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>WallSwiss</h1>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 6, marginBottom: 0 }}>{authMode === "signup" ? "Créez votre compte conseiller" : "Connexion à votre espace"}</p>
          </div>

          <form onSubmit={handleAuthSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Adresse e-mail</label>
              <input style={S.input} type="email" autoComplete="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="vous@wallswiss.ch" />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={S.label}>Mot de passe</label>
              <input style={S.input} type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="••••••••" />
            </div>

            {authMode === "login" && (
              <div style={{ textAlign: "right", marginBottom: 12 }}>
                <span onClick={handlePasswordReset} style={{ fontSize: 12, color: C.accent, cursor: "pointer", fontWeight: 600 }}>Mot de passe oublié ?</span>
              </div>
            )}

            {authError && (
              <div style={{ background: isReset ? C.greenSoft : C.redSoft, color: isReset ? C.green : C.red, fontSize: 12.5, padding: "10px 12px", borderRadius: 10, marginBottom: 14, lineHeight: 1.5 }}>{authError}</div>
            )}

            <button type="submit" disabled={authBusy} style={{ ...S.btnP, width: "100%", padding: "13px 0", opacity: authBusy ? 0.7 : 1, cursor: authBusy ? "wait" : "pointer" }}>
              {authBusy ? "Veuillez patienter…" : authMode === "signup" ? "Créer mon compte" : "Se connecter"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: C.muted }}>
            {authMode === "signup" ? "Déjà un compte ? " : "Pas encore de compte ? "}
            <span onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setAuthError(""); }} style={{ color: C.accent, cursor: "pointer", fontWeight: 700 }}>
              {authMode === "signup" ? "Se connecter" : "Créer un compte"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Ecran d'attente d'approbation
  if (false && userStatus === 'pending' && user.email !== ADMIN_EMAIL) { // ⚠️ BLOQUAGE DÉSACTIVÉ TEMPORAIREMENT
    return (
      <div style={{ display: "flex", height: "100vh", width: "100vw", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: F.ui }}>
        <div style={{ background: C.card, padding: "48px", width: "100%", maxWidth: "500px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", textAlign: "center", borderRadius: C.radius }}>
          <h2 style={{ fontFamily: F.serif, fontSize: 24, color: C.accent, marginBottom: 8, marginTop: 0 }}>Compte en attente</h2>
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
            Votre compte a bien été créé, mais il nécessite l'approbation d'un administrateur avant de pouvoir accéder à l'outil de génération de rapports.
          </p>
          <div style={{ background: "rgba(105,33,2,0.05)", padding: "16px", color: C.accentDark, fontSize: 12, fontWeight: 600, marginBottom: 32 }}>
            Connecté en tant que : {user.email}
          </div>
          <button onClick={handleLogout} style={S.btnS}>Se déconnecter</button>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch(step) {
      case 0: return (
        <div>
          <div style={S.cardTitle}><div style={S.dot} /> Choix du modèle de présentation</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { id: "swissquote", title: "Compte-titres", desc: "Stratégie d'investissement flexible et performante en Suisse.", active: true },
              { id: "prevoyance", title: "Prévoyance (3A/3B)", desc: "Optimisation fiscale et préparation retraite avec assurance vie.", active: true },
              { id: "lpp", title: "2ème Pilier LPP", desc: "Analyse et dynamisation du Libre passage institutionnel.", active: true },
              { id: "assurance-vie", title: "Assurance Vie & PER", desc: "Solutions de placement et retraite (France).", active: true },
              { id: "immobilier", title: "Immobilier", desc: "Investissements et rendements immobiliers (Bientôt disponible).", active: false },
            ].map(tpl => (
              <div key={tpl.id} onClick={() => tpl.active && u("templateId", tpl.id)} style={{ border: `2px solid ${form.templateId === tpl.id ? C.accent : C.line2}`, padding: 20, cursor: tpl.active ? "pointer" : "not-allowed", opacity: tpl.active ? 1 : 0.5, background: form.templateId === tpl.id ? "rgba(105,33,2,0.04)" : C.card, display: "flex", flexDirection: "column", gap: 8, borderRadius: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: C.accent }}>{tpl.title}</span>
                  {form.templateId === tpl.id && <span style={{ color: C.goldUI, fontSize: 16 }}>&#10003;</span>}
                </div>
                <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{tpl.desc}</span>
              </div>
            ))}
          </div>
        </div>
      );
      case 1: return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={S.card}>
            <div style={S.cardTitle}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={S.dot} /> Identité</div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer", textTransform: "none", color: C.darkGray }}>
                  <input type="checkbox" checked={form.isCouple || false} onChange={e=>u("isCouple", e.target.checked)} />
                  Mode Couple
                </label>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={S.fg}><label style={S.label}>Prénom</label><input style={S.input} value={form.prenom} onChange={e=>u("prenom",e.target.value)} placeholder="Philippe"/></div>
              <div style={S.fg}><label style={S.label}>Nom</label><input style={S.input} value={form.nom} onChange={e=>u("nom",e.target.value)} placeholder="EVEQUE"/></div>
            </div>
            {form.isCouple && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "rgba(165,149,104,0.05)", padding: 12, border: `1px dashed ${C.goldUI}`, marginBottom: 16 }}>
                <div style={{...S.fg, margin:0}}><label style={S.label}>Prénom Conjoint</label><input style={S.input} value={form.prenomConjoint || ""} onChange={e=>u("prenomConjoint",e.target.value)} placeholder="Marie"/></div>
                <div style={{...S.fg, margin:0}}><label style={S.label}>Nom Conjoint</label><input style={S.input} value={form.nomConjoint || ""} onChange={e=>u("nomConjoint",e.target.value)} placeholder="EVEQUE"/></div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={S.fg}><label style={S.label}>Email Client</label><input style={S.input} type="email" value={form.emailClient || ""} onChange={e=>u("emailClient",e.target.value)} placeholder="client@email.com"/></div>
              <div style={S.fg}>
                <label style={S.label}>{form.isCouple ? "Âges (ex: 40 / 38)" : "Âge"}</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input style={S.input} type="number" value={form.age} onChange={e=>u("age",e.target.value)} placeholder="40"/>
                  {form.isCouple && <input style={S.input} type="number" value={form.ageConjoint || ""} onChange={e=>u("ageConjoint",e.target.value)} placeholder="38"/>}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={S.fg}><label style={S.label}>Date du rapport</label><input style={S.input} type="date" value={form.dateRapport || ""} onChange={e=>u("dateRapport",e.target.value)}/></div>
              <div style={S.fg}><label style={S.label}>Nationalité</label><input style={S.input} value={form.nationalite} onChange={e=>u("nationalite",e.target.value)}/></div>
            </div>

            <div style={{ height: 1, background: C.line2, margin: "16px 0" }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 8, textTransform: "uppercase" }}>Informations personnalisées supplémentaires</div>
            {(form.customClientFields || []).map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input style={{...S.input, flex: 1}} placeholder="Objet (ex: Domicile)" value={f.label} onChange={e => { const newF = [...(form.customClientFields||[])]; newF[i].label = e.target.value; u("customClientFields", newF); }} />
                <input style={{...S.input, flex: 2}} placeholder="Texte (ex: Genève)" value={f.value} onChange={e => { const newF = [...(form.customClientFields||[])]; newF[i].value = e.target.value; u("customClientFields", newF); }} />
                <button onClick={() => u("customClientFields", (form.customClientFields||[]).filter((_, idx) => idx !== i))} style={{ background: "transparent", color: "#EF4444", border: "none", cursor: "pointer", fontWeight: "bold" }}>X</button>
              </div>
            ))}
            <button onClick={() => u("customClientFields", [...(form.customClientFields||[]), {label: "", value: ""}])} style={{...S.btnS, padding: "6px 12px", fontSize: 11}}>+ Ajouter une information</button>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}><div style={S.dot} /> Situation Financière</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={S.fg}>
                <label style={S.label}>{form.isCouple ? "Professions" : "Profession"}</label>
                <div style={{ display: "flex", gap: 8, flexDirection: form.isCouple ? "column" : "row" }}>
                  <input style={S.input} value={form.profession} onChange={e=>u("profession",e.target.value)} placeholder="Caméraman"/>
                  {form.isCouple && <input style={S.input} value={form.professionConjoint || ""} onChange={e=>u("professionConjoint",e.target.value)} placeholder="Enseignante"/>}
                </div>
              </div>
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
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 16, marginTop: 0 }}>Sélectionnez les objectifs correspondant à la situation de votre client.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {defObj.map(obj => {
              const active = form.objectifs.includes(obj);
              return (
                <div key={obj} onClick={()=>toggleObj(obj)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: `1.5px solid ${active ? C.accent : C.line2}`, background: active ? "rgba(105,33,2,0.04)" : "transparent", cursor: "pointer", fontSize: 12, fontWeight: 500, borderRadius: "10px" }}>
                  <div style={{ width: 16, height: 16, border: `2px solid ${active ? C.accent : C.line2}`, background: active ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: "4px" }}>
                    {active && <span style={{ color: C.white, fontSize: 10, fontWeight: 700 }}>&#10003;</span>}
                  </div>
                  <span style={{ color: active ? C.accent : C.darkGray }}>{obj}</span>
                </div>
              );
            })}
          </div>
          <div style={{ height: 1, background: C.line2, margin: "20px 0" }} />
          <div style={{ display: "flex", gap: 10 }}>
            <input style={{ ...S.input, flex: 1 }} value={form.objectifCustom} onChange={e=>u("objectifCustom",e.target.value)} placeholder="Ajouter un objectif personnalisé..." onKeyDown={e=>e.key==="Enter"&&addCustomObj()} />
            <button style={{ ...S.btnS, padding: "8px 16px", whiteSpace: "nowrap" }} onClick={addCustomObj}>+ Ajouter</button>
          </div>
          {form.objectifs.filter(o=>!defObj.includes(o)).length > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {form.objectifs.filter(o=>!defObj.includes(o)).map((o,i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 10px", background: "rgba(105,33,2,0.06)", color: C.accent, fontSize: 11, fontWeight: 600, borderRadius: "999px" }}>
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

            <div style={S.fg}>
              <label style={S.label}>Années présentées (projections)</label>
              <input style={S.input} value={form.anneesProjection || ""} onChange={e=>u("anneesProjection",e.target.value)} placeholder="Laisser vide pour auto (ex: 3, 5, 10, 15)"/>
            </div>

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
                  <label style={{...S.label, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 8, color: C.accent}}>
                    <input type="checkbox" checked={form.optiFiscale} onChange={e=>u("optiFiscale",e.target.checked)} style={{width: 16, height: 16}} />
                    Inclure la slide Optimisation Fiscale (3A)
                  </label>
                </div>
                <div style={S.fg}>
                  <label style={{...S.label, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 8, color: C.accent}}>
                    <input type="checkbox" checked={form.showPrevoyanceComparatif !== false} onChange={e=>u("showPrevoyanceComparatif",e.target.checked)} style={{width: 16, height: 16}} />
                    Inclure la slide Comparatif Banque / Assurance
                  </label>
                </div>

                <div style={{ height: 1, background: C.line2, margin: "16px 0" }} />

                <div style={S.fg}>
                  <label style={S.label}>Horizon de placement</label>
                  <input style={S.input} value={form.horizonPlacement} onChange={e=>u("horizonPlacement",e.target.value)} placeholder="Ex: Moyen terme, 5 ans..." />
                </div>

                <div style={{...S.fg, margin: 0}}>
                  <label style={S.label}>Profil de risque du portefeuille</label>
                  <select style={S.select} value={form.profilRisque} onChange={e=>u("profilRisque",e.target.value)}>
                    {["Prudent", "Équilibré", "Dynamique", "Offensif"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </>
            ) : form.templateId === "lpp" ? (
              <>
                <div style={S.fg}><label style={S.label}>Capital de Libre Passage (CHF)</label><input style={S.input} type="number" value={form.capitalLibrePassage} onChange={e=>u("capitalLibrePassage",e.target.value)} placeholder="120000"/></div>
                <div style={S.fg}>
                  <label style={S.label}>Administrateur / Fondation de Libre Passage</label>
                  <select style={S.select} value={form.administrateurLpp} onChange={e=>u("administrateurLpp",e.target.value)}>
                    <option>Pictet</option>
                    <option>Lemania</option>
                  </select>
                </div>

                <div style={{ height: 1, background: C.line2, margin: "16px 0" }} />

                <div style={S.fg}><label style={S.label}>Taux de rendement cible net (%)</label><input style={S.input} type="number" step="0.5" value={form.tauxClp} onChange={e=>u("tauxClp",e.target.value)} placeholder="4.5"/></div>
                <div style={S.fg}><label style={S.label}>Droits d'entrée (%)</label><input style={S.input} type="number" step="0.5" value={form.fraisSouscriptionLpp} onChange={e=>u("fraisSouscriptionLpp",e.target.value)} placeholder="1"/></div>
                <div style={S.fg}>
                  <label style={S.label}>Horizon de placement</label>
                  <input style={S.input} value={form.horizonPlacement} onChange={e=>u("horizonPlacement",e.target.value)} placeholder="Ex: Moyen terme, 5 ans..." />
                </div>
                <div style={S.fg}>
                  <label style={S.label}>Profil de risque (Libre Passage)</label>
                  <select style={S.select} value={form.profilRisque} onChange={e=>u("profilRisque",e.target.value)}>
                    {["Prudent", "Équilibré", "Dynamique", "Offensif"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>

                <div style={{ height: 1, background: C.line2, margin: "16px 0" }} />
                <div style={{ marginBottom: 12, color: C.accent, fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>Allocation d'actifs personnalisée (%)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 0 }}>
                  <div><label style={S.label}>Actions</label><input style={S.input} type="number" value={form.lppActions} onChange={e=>u("lppActions",e.target.value)} placeholder="Ex: 65" /></div>
                  <div><label style={S.label}>Obligations</label><input style={S.input} type="number" value={form.lppOblig} onChange={e=>u("lppOblig",e.target.value)} placeholder="Ex: 25" /></div>
                  <div><label style={S.label}>Immo/Liq</label><input style={S.input} type="number" value={form.lppImmo} onChange={e=>u("lppImmo",e.target.value)} placeholder="Ex: 10" /></div>
                </div>
              </>
            ) : form.templateId === "assurance-vie" ? (
              <>
                <div style={S.fg}><label style={S.label}>Versement initial (€)</label><input style={S.input} type="number" value={form.montantInvestissement} onChange={e=>u("montantInvestissement",e.target.value)}/></div>
                <div style={S.fg}><label style={S.label}>Mensualité (€)</label><input style={S.input} type="number" value={form.capaciteEpargne} onChange={e=>u("capaciteEpargne",e.target.value)}/></div>
                <div style={S.fg}><label style={S.label}>Durée de projection (années)</label><input style={S.input} type="number" max="30" value={form.dureeProjectionAv} onChange={e=>u("dureeProjectionAv",e.target.value)}/></div>

                <div style={S.fg}>
                  <label style={{...S.label, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 8, color: C.accent}}>
                    <input type="checkbox" checked={form.hasProjectionsMultiples} onChange={e=>u("hasProjectionsMultiples",e.target.checked)} style={{width: 16, height: 16}} />
                    Ajouter une 2ème simulation (Scénario 2)
                  </label>
                </div>
                {form.hasProjectionsMultiples && (
                  <div style={{ background: "rgba(105,33,2,0.04)", padding: 16, marginBottom: 16, borderLeft: `3px solid ${C.accent}` }}>
                    <div style={S.fg}><label style={S.label}>Versement initial 2 (€)</label><input style={S.input} type="number" value={form.montantInvestissement2} onChange={e=>u("montantInvestissement2",e.target.value)}/></div>
                    <div style={{...S.fg, margin: 0}}><label style={S.label}>Mensualité 2 (€)</label><input style={S.input} type="number" value={form.capaciteEpargne2} onChange={e=>u("capaciteEpargne2",e.target.value)}/></div>
                  </div>
                )}

                <div style={{ height: 1, background: C.line2, margin: "16px 0" }} />

                <div style={S.fg}><label style={S.label}>Droits d'entrée sur versements (%)</label><input style={S.input} type="number" step="0.5" value={form.fraisSouscription} onChange={e=>u("fraisSouscription",e.target.value)}/></div>
                <div style={S.fg}>
                  <label style={S.label}>Horizon de placement</label>
                  <input style={S.input} value={form.horizonPlacement} onChange={e=>u("horizonPlacement",e.target.value)} placeholder="Ex: Moyen terme, 5 ans..." />
                </div>
                <div style={{...S.fg, margin: 0}}><label style={S.label}>Profil de risque</label><select style={S.select} value={form.profilRisque} onChange={e=>u("profilRisque",e.target.value)}>{["Prudent", "Équilibré", "Dynamique", "Offensif"].map(s=><option key={s}>{s}</option>)}</select></div>
              </>
            ) : (
              <>
                <div style={S.fg}>
                  <label style={S.label}>Asset Manager</label>
                  <select style={S.select} value={form.assetManager || "NS Partners"} onChange={e=>u("assetManager",e.target.value)}>
                    <option>NS Partners</option>
                    <option>ParFinance</option>
                  </select>
                </div>
                <div style={S.fg}><label style={S.label}>Montant initial (CHF)</label><input style={S.input} type="number" value={form.montantInvestissement} onChange={e=>u("montantInvestissement",e.target.value)}/></div>
                <div style={S.fg}><label style={S.label}>Droits d'entrée (%)</label><input style={S.input} type="number" step="0.5" value={form.fraisSouscription} onChange={e=>u("fraisSouscription",e.target.value)}/></div>

                <div style={{ height: 1, background: C.line2, margin: "16px 0" }} />

                <div style={S.fg}>
                  <label style={S.label}>Horizon de placement</label>
                  <input style={S.input} value={form.horizonPlacement} onChange={e=>u("horizonPlacement",e.target.value)} placeholder="Ex: Moyen terme, 5 ans..." />
                </div>
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
            ) : form.templateId === "lpp" ? (
              <div style={{ padding: 20, background: C.cardSoft, color: C.darkGray, fontSize: 13, lineHeight: 1.6, textAlign: "center", borderRadius: 12 }}>
                La projection financière du Libre Passage s'appuie sur le <strong>Profil de risque</strong> choisi.<br/><br/>
                La comparaison se fera automatiquement entre une rémunération classique (compte de fondation) et l'investissement sur les marchés.
              </div>
            ) : (
              <>
                <div style={S.fg}><label style={S.label}>Taux cible 1 (%)</label><input style={S.input} type="number" step="0.5" value={form.tauxPessimiste} onChange={e=>u("tauxPessimiste",e.target.value)}/></div>
                <div style={S.fg}><label style={S.label}>Taux cible 2 (%)</label><input style={S.input} type="number" step="0.5" value={form.tauxRealiste} onChange={e=>u("tauxRealiste",e.target.value)}/></div>
                <div style={S.fg}><label style={S.label}>Taux cible 3 (%)</label><input style={S.input} type="number" step="0.5" value={form.tauxOptimiste} onChange={e=>u("tauxOptimiste",e.target.value)}/></div>
                <div style={{ background: C.cardSoft, padding: 14, marginTop: 16, borderRadius: "12px" }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Montant net initial investi</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>{form.templateId === "assurance-vie" ? "€" : "CHF"} {fmt((form.montantInvestissement||0)-(form.montantInvestissement||0)*(form.fraisSouscription||0)/100)}.-</div>
                </div>
              </>
            )}
          </div>
        </div>
      );
      case 4: return (
        <div style={{ ...S.card, maxWidth: 560 }}>
          <div style={S.cardTitle}><div style={S.dot} /> Informations du conseiller</div>
          <div style={S.fg}>
            <label style={S.label}>Sélection rapide du conseiller</label>
            <select style={S.select} onChange={(e) => {
              if (e.target.value === "") return;
              const agent = PREDEFINED_AGENTS[e.target.value];
              u("conseiller", `${agent.prenom} ${agent.nom}`);
              u("email", agent.email);
              if (agent.tel) u("telephone", agent.tel);
              u("titreConseiller", agent.genre === "M" ? "Planificateur financier | CGP" : "Planificatrice financière | CGP");
            }}>
              <option value="">-- Choisir un conseiller --</option>
              {PREDEFINED_AGENTS.map((a, i) => (
                <option key={i} value={i}>{a.prenom} {a.nom}</option>
              ))}
            </select>
          </div>
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
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 16, marginTop: 0 }}>Modifiez les textes par défaut qui apparaîtront dans les diapositives.</p>

            <div style={S.fg}><label style={S.label}>Page "Qui sommes-nous" - Description</label>
            <textarea style={{...S.input, minHeight: 80, resize: "vertical"}} value={form.texts.aboutDesc} onChange={e=>uText("aboutDesc", e.target.value)} /></div>

            {form.templateId === "swissquote" && (
              <>
                <div style={S.fg}><label style={S.label}>Page "Pourquoi SwissQuote" - Conclusion</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.swissquoteIntro} onChange={e=>uText("swissquoteIntro", e.target.value)} /></div>

                <div style={{ height: 1, background: C.line2, margin: "20px 0" }} />
                <div style={{marginBottom: 12, color: C.accent, fontWeight: 700, fontSize: 12}}>PAGE "SOLUTION COMPTE-TITRES"</div>
                <div style={S.fg}><label style={S.label}>Paragraphe 1 (Introduction)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.solution1} onChange={e=>uText("solution1", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 2 (Avantages)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.solution2} onChange={e=>uText("solution2", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 3 (Fiscalité)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.solution3} onChange={e=>uText("solution3", e.target.value)} /></div>

                {form.assetManager === "ParFinance" && (
                  <>
                    <div style={{ height: 1, background: C.line2, margin: "20px 0" }} />
                    <div style={{marginBottom: 12, color: C.accent, fontWeight: 700, fontSize: 12}}>PAGE "ASSET MANAGER PARFINANCE"</div>
                    <div style={S.fg}><label style={S.label}>Présentation (Paragraphe 1)</label>
                    <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.parFinanceP1} onChange={e=>uText("parFinanceP1", e.target.value)} /></div>
                    <div style={S.fg}><label style={S.label}>Présentation (Paragraphe 2)</label>
                    <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.parFinanceP2} onChange={e=>uText("parFinanceP2", e.target.value)} /></div>
                  </>
                )}
              </>
            )}

            {form.templateId === "prevoyance" && (
              <>
                <div style={{ height: 1, background: C.line2, margin: "20px 0" }} />
                <div style={{marginBottom: 12, color: C.accent, fontWeight: 700, fontSize: 12}}>PAGE "SOLUTION PRÉVOYANCE"</div>
                <div style={S.fg}><label style={S.label}>Paragraphe 1 (Introduction)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.prevoyanceSol1} onChange={e=>uText("prevoyanceSol1", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 2 (Avantages)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.prevoyanceSol2} onChange={e=>uText("prevoyanceSol2", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 3 (Fiscalité & Transmission)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.prevoyanceSol3} onChange={e=>uText("prevoyanceSol3", e.target.value)} /></div>

                <div style={{ height: 1, background: C.line2, margin: "20px 0" }} />
                <div style={{marginBottom: 12, color: C.accent, fontWeight: 700, fontSize: 12}}>PAGE "FONDS DE PLACEMENT"</div>
                <div style={S.fg}><label style={S.label}>Stratégie d'investissement personnalisée</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.strategieFonds} onChange={e=>uText("strategieFonds", e.target.value)} /></div>
              </>
            )}

            {form.templateId === "lpp" && (
              <>
                <div style={{ height: 1, background: C.line2, margin: "20px 0" }} />
                <div style={{marginBottom: 12, color: C.accent, fontWeight: 700, fontSize: 12}}>PAGE "ENJEUX LPP"</div>
                <div style={S.fg}><label style={S.label}>Paragraphe 1 (Contexte)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppIntroP1} onChange={e=>uText("lppIntroP1", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 2 (Conséquence)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppIntroP2} onChange={e=>uText("lppIntroP2", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 3 (Conclusion)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppIntroP3} onChange={e=>uText("lppIntroP3", e.target.value)} /></div>

                <div style={{ height: 1, background: C.line2, margin: "20px 0" }} />
                <div style={{marginBottom: 12, color: C.accent, fontWeight: 700, fontSize: 12}}>PAGE "FONCTIONNEMENT LIBRE PASSAGE"</div>
                <div style={S.fg}><label style={S.label}>Paragraphe 1 (Définition)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppFonctP1} onChange={e=>uText("lppFonctP1", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 2 (Problème)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppFonctP2} onChange={e=>uText("lppFonctP2", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 3 (Solution)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppFonctP3} onChange={e=>uText("lppFonctP3", e.target.value)} /></div>

                <div style={{ height: 1, background: C.line2, margin: "20px 0" }} />
                <div style={{marginBottom: 12, color: C.accent, fontWeight: 700, fontSize: 12}}>PAGES "COMPTE DE LIBRE PASSAGE"</div>
                <div style={S.fg}><label style={S.label}>Introduction Libre Passage</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppLibreP1} onChange={e=>uText("lppLibreP1", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Avantages des Fonds (LPP)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppAvantagesP1} onChange={e=>uText("lppAvantagesP1", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Architecture Ouverte (LPP)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppAvantagesP2} onChange={e=>uText("lppAvantagesP2", e.target.value)} /></div>

                <div style={{ height: 1, background: C.line2, margin: "20px 0" }} />
                <div style={{marginBottom: 12, color: C.accent, fontWeight: 700, fontSize: 12}}>PAGE "ADMINISTRATEUR CLP"</div>
                <div style={S.fg}><label style={S.label}>Présentation du partenaire</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppAdminP1} onChange={e=>uText("lppAdminP1", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Sécurité et gouvernance</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppAdminP2} onChange={e=>uText("lppAdminP2", e.target.value)} /></div>
              </>
            )}

            {form.templateId === "assurance-vie" && (
              <>
                <div style={{ height: 1, background: C.line2, margin: "20px 0" }} />
                <div style={{marginBottom: 12, color: C.accent, fontWeight: 700, fontSize: 12}}>PAGE "SOLUTIONS ASSURANCE VIE"</div>
                <div style={S.fg}><label style={S.label}>Paragraphe 1 (Contexte)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.avSolutionsP1} onChange={e=>uText("avSolutionsP1", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 2 (Avantages)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.avSolutionsP2} onChange={e=>uText("avSolutionsP2", e.target.value)} /></div>
              </>
            )}

            <div style={{ height: 1, background: C.line2, margin: "20px 0" }} />
            <div style={S.fg}><label style={S.label}>Page "Contact" - Mot de la fin</label>
            <textarea style={{...S.input, minHeight: 80, resize: "vertical"}} value={form.texts.contactDesc} onChange={e=>uText("contactDesc", e.target.value)} /></div>
          </div>
        </div>
      );
      case 6: return (
        <div style={S.card}>
          <div style={S.cardTitle}><div style={S.dot} /> Résumé avant génération</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div style={{ background: C.cardSoft, padding: 18, borderRadius: "14px" }}>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Client</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.accent }}>{form.prenom} {form.nom}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{form.age} ans — {form.profession}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{form.statut} — {form.nationalite}</div>
            </div>
            <div style={{ background: C.cardSoft, padding: 18, borderRadius: "14px" }}>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Investissement</div>
              {form.templateId === "prevoyance" ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.accent }}>CHF {fmt(form.capaciteEpargne)}.- / mois</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{form.compagniePrevoyance}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Opti. Fiscale: {form.optiFiscale ? "Oui" : "Non"}</div>
                </>
              ) : form.templateId === "lpp" ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.accent }}>Libre Passage LPP</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Capital: CHF {fmt(form.capitalLibrePassage)}.-</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Cible: {form.tauxClp}% net/an</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.accent }}>CHF {fmt(form.montantInvestissement)}.-</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Droits d'entrée: {form.fraisSouscription}%</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{form.tauxPessimiste}% / {form.tauxRealiste}% / {form.tauxOptimiste}%</div>
                </>
              )}
            </div>
            <div style={{ background: C.cardSoft, padding: 18, borderRadius: "14px" }}>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Objectifs</div>
              <div style={{ fontSize: 12, color: C.darkGray }}>{form.objectifs.length} objectif{form.objectifs.length>1?"s":""}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>{form.objectifs.slice(0,3).join(" / ")}{form.objectifs.length>3?" ...":""}</div>
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
    <div style={{ fontFamily: F.ui, display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden", background: C.bg, color: C.text }}>
      <style>{`
        html, body, #root {
          margin: 0;
          padding: 0;
          background-color: ${C.bg};
          height: 100%;
          width: 100%;
          overflow: hidden;
        }
        input:focus, select:focus, textarea:focus { border-color: ${C.accent} !important; box-shadow: 0 0 0 4px ${C.accentSoft}; }
        ::placeholder { color: #A9A9AF; }
        button:hover { opacity: 0.94; }
        ::selection { background: rgba(105,33,2,.18); }

        ::-webkit-scrollbar { width: 9px; height: 9px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.16); border-radius: 20px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.28); }
        .topnav-scroll::-webkit-scrollbar { height: 0; }

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

      {/* ────────────────── BARRE DE NAVIGATION SUPÉRIEURE ────────────────── */}
      <header className="no-print" style={{ display: "flex", alignItems: "center", gap: 16, height: 60, padding: "0 24px", background: "rgba(255,255,255,0.82)", backdropFilter: "saturate(180%) blur(20px)", WebkitBackdropFilter: "saturate(180%) blur(20px)", borderBottom: `1px solid ${C.line}`, flexShrink: 0, zIndex: 200 }}>
        <div onClick={goHubRoot} style={{ display: "flex", alignItems: "center", gap: 11, cursor: "pointer", flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(105,33,2,.30)" }}>
            <img src={appSettings.defaultLogo || LOGO_URL} alt="WallSwiss" style={{ height: 16, filter: "brightness(0) invert(1)" }} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", color: C.text }}>WallSwiss</div>
        </div>

        {activeModule !== "hub" && (
          <button onClick={goHubRoot}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: 980, border: `1px solid ${C.line2}`, background: C.card, color: C.muted, font: `600 13px ${F.ui}`, cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.bgSoft; e.currentTarget.style.color = C.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.muted; }}>
            ‹ Accueil
          </button>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button onClick={() => setActiveModule("tickets")} title="Mes demandes / suggestions"
            style={{ display: "inline-flex", alignItems: "center", gap: 7, background: (activeModule === "tickets" || activeModule === "idees") ? C.accentSoft : "transparent", color: (activeModule === "tickets" || activeModule === "idees") ? C.accent : C.muted, border: "none", padding: "8px 12px", borderRadius: 980, cursor: "pointer", fontFamily: F.ui, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}
            onMouseEnter={(e) => { if (activeModule !== "tickets" && activeModule !== "idees") { e.currentTarget.style.background = C.bgSoft; e.currentTarget.style.color = C.text; } }}
            onMouseLeave={(e) => { if (activeModule !== "tickets" && activeModule !== "idees") { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; } }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> Mes demandes
          </button>
          {isTicketAdmin(user) && (
            <button onClick={() => setActiveModule("ticketsAdmin")} title="Demandes reçues"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, background: activeModule === "ticketsAdmin" ? C.accentSoft : "transparent", color: activeModule === "ticketsAdmin" ? C.accent : C.muted, border: "none", padding: "8px 12px", borderRadius: 980, cursor: "pointer", fontFamily: F.ui, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}
              onMouseEnter={(e) => { if (activeModule !== "ticketsAdmin") { e.currentTarget.style.background = C.bgSoft; e.currentTarget.style.color = C.text; } }}
              onMouseLeave={(e) => { if (activeModule !== "ticketsAdmin") { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; } }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg> Demandes
            </button>
          )}
          <button onClick={() => window.open("https://wallswiss.my.salesforce.com/", "_blank")}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "transparent", color: C.muted, border: "none", padding: "8px 12px", borderRadius: 980, cursor: "pointer", fontFamily: F.ui, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.bgSoft; e.currentTarget.style.color = C.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; }}>
            <Icons.Users size={16} /> CRM
          </button>
          <button onClick={() => setActiveModule("settings")} title="Paramètres & Intégrations"
            style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", background: activeModule === "settings" ? C.accentSoft : "transparent", color: activeModule === "settings" ? C.accent : C.muted, border: "none", borderRadius: 980, cursor: "pointer" }}
            onMouseEnter={(e) => { if (activeModule !== "settings") { e.currentTarget.style.background = C.bgSoft; e.currentTarget.style.color = C.text; } }}
            onMouseLeave={(e) => { if (activeModule !== "settings") { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; } }}>
            <Icons.Settings size={18} />
          </button>
          <div style={{ width: 1, height: 24, background: C.line, margin: "0 2px" }} />
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gBlue}, ${C.gGreen})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {(user?.email || "WS").replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "WS"}
          </div>
          <button onClick={handleLogout} title="Déconnexion" style={{ background: "transparent", color: C.dim, border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 6, borderRadius: 8 }}
            onMouseEnter={(e) => e.currentTarget.style.color = C.gRed} onMouseLeave={(e) => e.currentTarget.style.color = C.dim}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </header>

      {/* ▼▼▼ AJOUT : les deux bandeaux live, juste sous le header ▼▼▼ */}
      <LiveDataBars />

      {/* Liseuse ouverte depuis une fiche Académie (par-dessus tout) */}
      {pageDoc && (
        <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: C.bg }}>
          <AcademyReader doc={pageDoc} onClose={() => setPageDoc(null)} />
        </div>
      )}

      {/* ────────────────── CONTENU PRINCIPAL ────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", position: "relative" }}>

        {/* VUE PAGE SOMMAIRE (placeholder « en construction ») */}
        {activeModule === "page" && (
          <DocPageView page={activePage} onHome={goHubRoot} onOpenNode={openHubAt} onOpenDoc={openPageDoc} acadMap={acadMap} />
        )}

        {/* VUE HUB — Accueil satellite + onglets / sous-onglets */}
        {activeModule === "hub" && (
          <HubSommaire onNavigate={handleSommaireNav} onOpenModule={(m) => setActiveModule(m)} logoUrl={appSettings.defaultLogo || LOGO_URL} openTo={hubTarget} />
        )}
        {/* VUE MODULE — MES DEMANDES / TICKETS */}
        {activeModule === "tickets" && (
          <TicketsModule db={db} appId={appId} user={user} onOpenAdmin={() => setActiveModule("ticketsAdmin")} />
        )}
        {/* VUE MODULE — BOÎTE À IDÉES (type « Idée » pré-sélectionné) */}
        {activeModule === "idees" && (
          <TicketsModule db={db} appId={appId} user={user} onOpenAdmin={() => setActiveModule("ticketsAdmin")} initialType="idee" />
        )}
        {/* VUE MODULE — DEMANDES REÇUES (admin) */}
        {activeModule === "ticketsAdmin" && (
          <TicketsAdminInbox db={db} appId={appId} user={user} onBack={() => setActiveModule("tickets")} />
        )}

        {activeModule === "academie" && (
          <AcademieModule key={"acad-" + (moduleArg?._n || 0)} initialDoc={moduleArg?.doc || null} />
        )}
        {/* VUE MODULE MARKETING */}
        {activeModule === "marketing" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fafaf9" }}>
            <header className="no-print" style={{ background: C.white, borderBottom: `1px solid ${C.mediumGray}`, position: "sticky", top: 0, zIndex: 100 }}>
              <div style={{ padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: C.gray, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Module ouvert</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>Hub Marketing Leads</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {uploadingImage && <span style={{ fontSize: 12, color: C.goldDeep, fontWeight: 700 }}>Upload en cours...</span>}
                  <button onClick={() => setIsEditingMarketing(!isEditingMarketing)} style={{ background: isEditingMarketing ? "#10B981" : C.white, color: isEditingMarketing ? C.white : C.accent, border: `1px solid ${isEditingMarketing ? "#10B981" : C.accent}`, padding: "8px 16px", cursor: "pointer", fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif", fontSize: 12, fontWeight: 700, borderRadius: 999, transition: "0.2s" }}>
                    {isEditingMarketing ? "Terminer l'édition" : "Éditer les publicités"}
                  </button>
                </div>
              </div>
            </header>

            <main style={{ flex: 1, padding: "0", boxSizing: "border-box", overflowY: "auto", background: "#fafaf9" }}>
                <nav style={{ background: C.white, borderBottom: `1px solid ${C.mediumGray}`, position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <div style={{ padding: "16px 24px 16px 0", borderRight: `1px solid ${C.mediumGray}`, display: "flex", alignItems: "center", gap: 12, color: C.gray, flexShrink: 0 }}>
                                <Icons.Layers size={20} color={C.accent} style={{ opacity: 0.6 }} />
                                <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }} className="hidden sm:inline-block">Campagnes</span>
                            </div>
                            <div style={{ display: "flex", overflowX: "auto", paddingLeft: 8 }} className="hide-scrollbar">
                                {Object.values(CAMPAIGNS_DATA).map(camp => (
                                    <button
                                        key={camp.id}
                                        onClick={() => {
                                            setMarketingCampaign(camp.id);
                                            setMarketingTab('context');
                                        }}
                                        style={{
                                            padding: "16px 24px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap", transition: "all 0.2s", border: "none", cursor: "pointer", outline: "none",
                                            borderBottom: `2px solid ${marketingCampaign === camp.id ? C.accent : "transparent"}`,
                                            color: marketingCampaign === camp.id ? C.accent : C.gray,
                                            background: marketingCampaign === camp.id ? "rgba(105,33,2,0.05)" : "transparent"
                                        }}
                                        onMouseEnter={(e) => { if(marketingCampaign !== camp.id) { e.currentTarget.style.color = C.accent; e.currentTarget.style.background = "#f5f5f4"; } }}
                                        onMouseLeave={(e) => { if(marketingCampaign !== camp.id) { e.currentTarget.style.color = C.gray; e.currentTarget.style.background = "transparent"; } }}
                                    >
                                        {camp.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </nav>

                <div style={{ background: C.white, borderBottom: `1px solid rgba(105,33,2,0.1)`, paddingTop: 40, paddingBottom: 32 }}>
                    <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                            <div style={{ width: 56, height: 56, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", flexShrink: 0 }}>
                                <Icons.Target size={28} />
                            </div>
                            <div>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", background: "#f5f5f4", border: `1px solid ${C.mediumGray}`, color: C.darkGray, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}></span>
                                    Usage Interne
                                </div>
                                <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 30, color: C.accent, margin: "0 0 4px 0" }}>
                                    Guide de Traitement <span style={{ fontWeight: 700 }}>{CAMPAIGNS_DATA[marketingCampaign].title.split(' ')[1]}</span>
                                </h2>
                                <p style={{ color: C.gray, fontSize: 14, fontStyle: "italic", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", margin: 0 }}>{CAMPAIGNS_DATA[marketingCampaign].subtitle}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ maxWidth: 1152, margin: "0 auto", padding: "40px 24px" }}>
                    <div style={{ display: "flex", flexWrap: "nowrap", overflowX: "auto", borderBottom: `1px solid ${C.mediumGray}`, marginBottom: 48 }} className="hide-scrollbar">
                        {[
                            { id: 'context', icon: Icons.ImageIcon, label: '1. Origine' },
                            { id: 'mindset', icon: Icons.Users, label: '2. Psychologie' },
                            { id: 'script', icon: Icons.PhoneCall, label: '3. Script Appel' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setMarketingTab(tab.id)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 8, padding: "20px 32px", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap", transition: "all 0.2s", border: "none", outline: "none", cursor: "pointer",
                                    borderBottom: `2px solid ${marketingTab === tab.id ? C.accent : "transparent"}`,
                                    color: marketingTab === tab.id ? C.accent : "#9ca3af",
                                    background: marketingTab === tab.id ? C.white : "transparent"
                                }}
                                onMouseEnter={(e) => { if(marketingTab !== tab.id) { e.currentTarget.style.color = C.darkGray; e.currentTarget.style.background = "#fafaf9"; } }}
                                onMouseLeave={(e) => { if(marketingTab !== tab.id) { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "transparent"; } }}
                            >
                                <tab.icon size={16} /> {tab.label}
                            </button>
                        ))}
                    </div>
                    {marketingCampaign === '3p-meta' && (
                        <div style={{ animation: "fadeIn 0.6s ease-in-out forwards" }}>
                            {marketingTab === 'context' && (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 48 }}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
                                        <div style={{ position: "relative", width: "100%", maxWidth: 280, border: "6px solid #1c1917", borderRadius: 32, background: "#1c1917", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", padding: 6, overflow: "hidden" }}>
                                            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 128, height: 24, background: "#1c1917", borderBottomLeftRadius: 12, borderBottomRightRadius: 12, zIndex: 20 }}></div>
                                            <div style={{ background: C.white, borderRadius: 24, overflow: "hidden", position: "relative", width: "100%", height: "100%" }}>
                                                <EditableMedia mediaKey="3p-meta_img" defaultUrl="https://leadpartner.ch/wp-content/uploads/2026/02/Capture-decran-2026-02-19-a-17.38.02.png" isVideo={false} />
                                            </div>
                                        </div>
                                        <div style={{ position: "relative", width: "100%", maxWidth: 280, border: "6px solid #1c1917", borderRadius: 32, background: "#1c1917", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", padding: 6, overflow: "hidden" }}>
                                            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 128, height: 24, background: "#1c1917", borderBottomLeftRadius: 12, borderBottomRightRadius: 12, zIndex: 20 }}></div>
                                            <div style={{ background: "#1c1917", borderRadius: 24, overflow: "hidden", position: "relative", width: "100%", aspectRatio: "9/19", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <EditableMedia mediaKey="3p-meta_vid" defaultUrl="https://leadpartner.ch/wp-content/uploads/2026/02/1-Geneve.mp4" isVideo={true} posterUrl={appSettings.marketingMedia?.['3p-meta_img'] || "https://leadpartner.ch/wp-content/uploads/2026/02/Capture-decran-2026-02-19-a-17.38.02.png"} />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                                        <div style={{ borderBottom: `1px solid rgba(105,33,2,0.1)`, paddingBottom: 24 }}>
                                            <h3 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 24, color: C.black, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>Ce que votre prospect a vu</h3>
                                            <p style={{ color: C.darkGray, lineHeight: 1.6, textAlign: "justify", margin: 0 }}>Le prospect a visionné cette annonce vidéo sur son fil d'actualité <strong>Facebook et/ou Instagram</strong>. Il a cliqué pour vérifier s'il pouvait prétendre à une économie d'impôts. Comprendre ce qu'il a en tête est la clé de votre conversion.</p>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                            <div style={{ background: C.white, padding: 24, border: `1px solid ${C.mediumGray}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", gap: 20 }}>
                                                <div style={{ padding: 12, background: "#fafaf9", border: `1px solid ${C.lightGray}`, color: C.gray, flexShrink: 0 }}><Icons.Crosshair size={24} /></div>
                                                <div>
                                                    <h4 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 18, color: C.black, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>Accroche Hyper-Locale</h4>
                                                    <p style={{ fontSize: 14, color: C.darkGray, lineHeight: 1.6, margin: 0 }}>Le lead est interpellé directement comme <strong>"Travailleur Genevois"</strong>. À noter que cette approche est 100% personnalisée : nous avons tourné <strong>8 versions différentes</strong> de cette vidéo pour couvrir chaque canton romand.</p>
                                                </div>
                                            </div>
                                            <div style={{ background: C.white, padding: 24, border: `1px solid ${C.mediumGray}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", gap: 20 }}>
                                                <div style={{ padding: 12, background: "#fafaf9", border: `1px solid ${C.lightGray}`, color: C.gray, flexShrink: 0 }}><Icons.TrendUp size={24} /></div>
                                                <div>
                                                    <h4 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 18, color: C.black, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>La Promesse de Gain</h4>
                                                    <p style={{ fontSize: 14, color: C.darkGray, lineHeight: 1.6, margin: 0 }}>Économiser jusqu'à <strong style={{ color: C.accent }}>4'800 CHF par an</strong> via des solutions "légales". C'est l'argument rationnel qui l'a poussé à cliquer. Il cherche activement à optimiser sa charge fiscale.</p>
                                                </div>
                                            </div>
                                            <div style={{ background: C.white, padding: 24, border: `1px solid ${C.mediumGray}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", gap: 20 }}>
                                                <div style={{ padding: 12, background: "#fafaf9", border: `1px solid ${C.lightGray}`, color: C.gray, flexShrink: 0 }}><Icons.CheckSquare size={24} /></div>
                                                <div>
                                                    <h4 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 18, color: C.black, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>L'Engagement par le Test</h4>
                                                    <p style={{ fontSize: 14, color: C.darkGray, lineHeight: 1.6, margin: 0 }}>Le prospect a pris le temps de remplir un <strong>test d'éligibilité</strong>. L'approche idéale est donc de l'aborder sous l'angle du <strong>résultat à ce test</strong>.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {marketingTab === 'mindset' && (
                                <div style={{ maxWidth: 896, margin: "0 auto" }}>
                                    <div style={{ textAlign: "center", marginBottom: 48 }}>
                                        <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 36, color: C.accent, marginBottom: 16, marginTop: 0 }}>Dans la tête de votre prospect</h2>
                                        <p style={{ color: C.gray, fontSize: 18, margin: 0 }}>Comprendre ses attentes pour éviter de lever ses boucliers commerciaux.</p>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
                                        <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", position: "relative" }}>
                                            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 4, background: "#059669" }}></div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${C.lightGray}` }}>
                                                <div style={{ width: 48, height: 48, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Smile size={24} /></div>
                                                <h3 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 24, fontWeight: 700, color: C.black, margin: 0 }}>Ce qu'il attend</h3>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 14, color: C.darkGray }}>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.CheckCircle size={20} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Connaître le <strong>résultat concret et chiffré</strong> de son test d'éligibilité rempli sur internet.</span></div>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.CheckCircle size={20} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Parler à un <strong>"expert partenaire"</strong> d'Aide Suisse, tel que promis.</span></div>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.CheckCircle size={20} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Bénéficier d'une approche consultative, <strong>sans engagement immédiat</strong>.</span></div>
                                            </div>
                                        </div>
                                        <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", position: "relative" }}>
                                            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 4, background: "#dc2626" }}></div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${C.lightGray}` }}>
                                                <div style={{ width: 48, height: 48, background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Frown size={24} /></div>
                                                <h3 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 24, fontWeight: 700, color: C.black, margin: 0 }}>Ce qu'il redoute</h3>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 14, color: C.darkGray }}>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.XCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} /> <span>L'entendre dire "Vous avez demandé un devis". <em>(Attention: il a fait un test pour impôts)</em>.</span></div>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.XCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Subir une tentative de <strong>vente forcée</strong> dès les premières minutes.</span></div>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.XCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Devoir répéter des informations auxquelles il a déjà répondu dans le formulaire.</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {marketingCampaign === 'meta-lpp' && (
                        <div style={{ animation: "fadeIn 0.6s ease-in-out forwards" }}>
                            {marketingTab === 'context' && (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 48 }}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
                                        <div style={{ position: "relative", width: "100%", maxWidth: 280, border: "6px solid #1c1917", borderRadius: 32, background: "#1c1917", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", padding: 6, overflow: "hidden" }}>
                                            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 128, height: 24, background: "#1c1917", borderBottomLeftRadius: 12, borderBottomRightRadius: 12, zIndex: 20 }}></div>
                                            <div style={{ background: C.white, borderRadius: 24, overflow: "hidden", position: "relative", width: "100%", height: "100%" }}>
                                                <EditableMedia mediaKey="meta-lpp_img" defaultUrl="https://leadpartner.ch/wp-content/uploads/2026/02/Capture-decran-2026-02-25-a-11.26.31.png" isVideo={false} />
                                            </div>
                                        </div>
                                        <div style={{ position: "relative", width: "100%", maxWidth: 280, border: "6px solid #1c1917", borderRadius: 32, background: "#1c1917", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", padding: 6, overflow: "hidden" }}>
                                            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 128, height: 24, background: "#1c1917", borderBottomLeftRadius: 12, borderBottomRightRadius: 12, zIndex: 20 }}></div>
                                            <div style={{ background: "#1c1917", borderRadius: 24, overflow: "hidden", position: "relative", width: "100%", aspectRatio: "9/19", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <EditableMedia mediaKey="meta-lpp_vid" defaultUrl="https://leadpartner.ch/wp-content/uploads/2026/02/1-pilah-2-fini.mp4" isVideo={true} posterUrl={appSettings.marketingMedia?.['meta-lpp_img'] || "https://leadpartner.ch/wp-content/uploads/2026/02/Capture-decran-2026-02-25-a-11.26.31.png"} />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                                        <div style={{ borderBottom: `1px solid rgba(105,33,2,0.1)`, paddingBottom: 24 }}>
                                            <h3 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 24, color: C.black, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>Ce que votre prospect a vu</h3>
                                            <p style={{ color: C.darkGray, lineHeight: 1.6, textAlign: "justify", margin: 0 }}>Le prospect a réagi à une publicité vidéo de la marque <strong>Pilah</strong>. Le message est clair : des milliards dorment dans les caisses de pension en Suisse et il pourrait récupérer en moyenne <strong>8'000 CHF</strong> de son 2ème pilier oublié.</p>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                            <div style={{ background: C.white, padding: 24, border: `1px solid ${C.mediumGray}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", gap: 20 }}>
                                                <div style={{ padding: 12, background: "#fafaf9", border: `1px solid ${C.lightGray}`, color: C.gray, flexShrink: 0 }}><Icons.Target size={24} /></div>
                                                <div>
                                                    <h4 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 18, color: C.black, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>L'Accroche</h4>
                                                    <p style={{ fontSize: 14, color: C.darkGray, lineHeight: 1.6, margin: 0 }}>« Tu as déjà travaillé en Suisse, ou tu y es encore ? ». Cette phrase cible directement les travailleurs frontaliers ou résidents qui ont pu changer d'employeur et "perdre" la trace de leurs avoirs LPP.</p>
                                                </div>
                                            </div>
                                            <div style={{ background: C.white, padding: 24, border: `1px solid ${C.mediumGray}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", gap: 20 }}>
                                                <div style={{ padding: 12, background: "#fafaf9", border: `1px solid ${C.lightGray}`, color: C.gray, flexShrink: 0 }}><Icons.TrendUp size={24} /></div>
                                                <div>
                                                    <h4 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 18, color: C.black, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>La Solution Promise</h4>
                                                    <p style={{ fontSize: 14, color: C.darkGray, lineHeight: 1.6, margin: 0 }}>Le prospect a été attiré par la rentrée d'argent inattendue. La publicité le rassure : <strong>l'outil de vérification est gratuit</strong>, 100% sécurisé et <strong>Pilah s'occupe de toute la paperasse</strong>.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {marketingTab === 'mindset' && (
                                <div style={{ maxWidth: 896, margin: "0 auto" }}>
                                    <div style={{ textAlign: "center", marginBottom: 48 }}>
                                        <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 36, color: C.accent, marginBottom: 16, marginTop: 0 }}>Dans la tête de votre prospect LPP</h2>
                                        <p style={{ color: C.gray, fontSize: 18, margin: 0 }}>Comprendre les motivations et les craintes face à la promesse de retrouver de l'argent.</p>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
                                        <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", position: "relative" }}>
                                            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 4, background: "#059669" }}></div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${C.lightGray}` }}>
                                                <div style={{ width: 48, height: 48, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Smile size={24} /></div>
                                                <h3 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 24, fontWeight: 700, color: C.black, margin: 0 }}>Ce qu'il attend</h3>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 14, color: C.darkGray }}>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.CheckCircle size={20} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Savoir <strong>si oui ou non</strong> il a de l'argent qui l'attend quelque part en Suisse.</span></div>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.CheckCircle size={20} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Que vous teniez la promesse : <strong>vous gérez toute la paperasse</strong> administrative à sa place.</span></div>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.CheckCircle size={20} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Être rassuré sur la <strong>sécurité et la gratuité</strong> de la démarche initiale.</span></div>
                                            </div>
                                        </div>
                                        <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", position: "relative" }}>
                                            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 4, background: "#dc2626" }}></div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${C.lightGray}` }}>
                                                <div style={{ width: 48, height: 48, background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Frown size={24} /></div>
                                                <h3 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 24, fontWeight: 700, color: C.black, margin: 0 }}>Ce qu'il redoute</h3>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 14, color: C.darkGray }}>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.XCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Avoir affaire à une <strong>arnaque d'internet</strong> ("c'est trop beau pour être vrai").</span></div>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.XCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Devoir fournir des <strong>informations sensibles</strong> avant même d'avoir confiance.</span></div>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.XCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Qu'on lui demande de <strong>payer des frais cachés</strong> pour lancer la recherche.</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {marketingCampaign === 'cmu-lamal-meta' && (
                        <div style={{ animation: "fadeIn 0.6s ease-in-out forwards" }}>
                            {marketingTab === 'context' && (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 48 }}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
                                        <div style={{ position: "relative", width: "100%", maxWidth: 280, border: "6px solid #1c1917", borderRadius: 32, background: "#1c1917", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", padding: 6, overflow: "hidden" }}>
                                            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 128, height: 24, background: "#1c1917", borderBottomLeftRadius: 12, borderBottomRightRadius: 12, zIndex: 20 }}></div>
                                            <div style={{ background: C.white, borderRadius: 24, overflow: "hidden", position: "relative", width: "100%", height: "100%" }}>
                                                <EditableMedia mediaKey="cmu-lamal-meta_img" defaultUrl="https://leadpartner.ch/wp-content/uploads/2026/02/Capture-decran-2026-02-25-a-11.50.31.png" isVideo={false} />
                                            </div>
                                        </div>
                                        <div style={{ position: "relative", width: "100%", maxWidth: 280, border: "6px solid #1c1917", borderRadius: 32, background: "#1c1917", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", padding: 6, overflow: "hidden" }}>
                                            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 128, height: 24, background: "#1c1917", borderBottomLeftRadius: 12, borderBottomRightRadius: 12, zIndex: 20 }}></div>
                                            <div style={{ background: "#1c1917", borderRadius: 24, overflow: "hidden", position: "relative", width: "100%", aspectRatio: "9/19", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <EditableMedia mediaKey="cmu-lamal-meta_vid" defaultUrl="https://leadpartner.ch/wp-content/uploads/2026/02/cmu-laml.mp4" isVideo={true} posterUrl={appSettings.marketingMedia?.['cmu-lamal-meta_img'] || "https://leadpartner.ch/wp-content/uploads/2026/02/Capture-decran-2026-02-25-a-11.50.31.png"} />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                                        <div style={{ borderBottom: `1px solid rgba(105,33,2,0.1)`, paddingBottom: 24 }}>
                                            <h3 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 24, color: C.black, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>Ce que votre prospect a vu</h3>
                                            <p style={{ color: C.darkGray, lineHeight: 1.6, textAlign: "justify", margin: 0 }}>Le prospect a réagi à une publicité vidéo très immersive ciblant les frontaliers. Le message joue sur la confidence : un frontalier explique comment il perdait de l'argent chaque mois à cause d'un mauvais choix entre la <strong>CMU et la LAMal</strong>.</p>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                            <div style={{ background: C.white, padding: 24, border: `1px solid ${C.mediumGray}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", gap: 20 }}>
                                                <div style={{ padding: 12, background: "#fafaf9", border: `1px solid ${C.lightGray}`, color: C.gray, flexShrink: 0 }}><Icons.Target size={24} /></div>
                                                <div>
                                                    <h4 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 18, color: C.black, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>L'Accroche Confidentielle</h4>
                                                    <p style={{ fontSize: 14, color: C.darkGray, lineHeight: 1.6, margin: 0 }}>« Tu es salarié en Suisse ? Alors cette astuce est pour toi... » susurré face caméra. Cette approche capte l'attention et donne l'impression d'accéder à un "secret d'initié".</p>
                                                </div>
                                            </div>
                                            <div style={{ background: C.white, padding: 24, border: `1px solid ${C.mediumGray}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", gap: 20 }}>
                                                <div style={{ padding: 12, background: "#fafaf9", border: `1px solid ${C.lightGray}`, color: C.gray, flexShrink: 0 }}><Icons.TrendUp size={24} /></div>
                                                <div>
                                                    <h4 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 18, color: C.black, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>La Douleur & La Solution</h4>
                                                    <p style={{ fontSize: 14, color: C.darkGray, lineHeight: 1.6, margin: 0 }}>Le prospect se reconnaît dans la phrase "Je me suis fait avoir". La promesse de récupérer 200 CHF par mois l'a poussé à remplir le formulaire gratuit.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {marketingTab === 'mindset' && (
                                <div style={{ maxWidth: 896, margin: "0 auto" }}>
                                    <div style={{ textAlign: "center", marginBottom: 48 }}>
                                        <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 36, color: C.accent, marginBottom: 16, marginTop: 0 }}>Dans la tête de votre prospect Frontalier</h2>
                                        <p style={{ color: C.gray, fontSize: 18, margin: 0 }}>Comprendre ses motivations réelles et ses craintes concernant son assurance maladie.</p>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
                                        <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", position: "relative" }}>
                                            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 4, background: "#059669" }}></div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${C.lightGray}` }}>
                                                <div style={{ width: 48, height: 48, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Smile size={24} /></div>
                                                <h3 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 24, fontWeight: 700, color: C.black, margin: 0 }}>Ce qu'il attend</h3>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 14, color: C.darkGray }}>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.CheckCircle size={20} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Savoir <strong>combien il peut économiser</strong> exactement.</span></div>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.CheckCircle size={20} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Comprendre <strong>de manière simple</strong> son droit d'option sans jargon.</span></div>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.CheckCircle size={20} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Être accompagné de A à Z s'il doit faire un changement administratif.</span></div>
                                            </div>
                                        </div>
                                        <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", position: "relative" }}>
                                            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 4, background: "#dc2626" }}></div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${C.lightGray}` }}>
                                                <div style={{ width: 48, height: 48, background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Frown size={24} /></div>
                                                <h3 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 24, fontWeight: 700, color: C.black, margin: 0 }}>Ce qu'il redoute</h3>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 14, color: C.darkGray }}>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.XCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Qu'on essaie de lui vendre une <strong>complémentaire santé hors de prix</strong>.</span></div>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.XCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Faire le mauvais choix et se retrouver bloqué.</span></div>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.XCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Perdre ses avantages actuels de couverture.</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {marketingCampaign === 'compte-ch-meta' && (
                        <div style={{ animation: "fadeIn 0.6s ease-in-out forwards" }}>
                            {marketingTab === 'context' && (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 48 }}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
                                        <div style={{ position: "relative", width: "100%", maxWidth: 320, border: `1px solid ${C.mediumGray}`, borderRadius: 12, background: C.white, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", padding: 8, overflow: "hidden" }}>
                                            <div style={{ background: "#fafaf9", borderRadius: 8, overflow: "hidden", position: "relative", width: "100%", aspectRatio: "4/5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <EditableMedia
                                                    mediaKey={`compte-ch-meta_img_${compteChIdx}`}
                                                    defaultUrl={[
                                                        "https://wallswiss.ch/wp-content/uploads/2026/03/frontalier_argent_brule.png",
                                                        "https://wallswiss.ch/wp-content/uploads/2026/03/frontalier_diagnostic.png",
                                                        "https://wallswiss.ch/wp-content/uploads/2026/03/frontalier_tableau_fache.png",
                                                        "https://wallswiss.ch/wp-content/uploads/2026/03/frontalier_peage_douane.png",
                                                        "https://wallswiss.ch/wp-content/uploads/2026/03/frontalier_cadeau_banque.png"
                                                    ][compteChIdx]}
                                                    isVideo={false}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", maxWidth: 320 }}>
                                            {[
                                                "https://wallswiss.ch/wp-content/uploads/2026/03/frontalier_argent_brule.png",
                                                "https://wallswiss.ch/wp-content/uploads/2026/03/frontalier_diagnostic.png",
                                                "https://wallswiss.ch/wp-content/uploads/2026/03/frontalier_tableau_fache.png",
                                                "https://wallswiss.ch/wp-content/uploads/2026/03/frontalier_peage_douane.png",
                                                "https://wallswiss.ch/wp-content/uploads/2026/03/frontalier_cadeau_banque.png"
                                            ].map((defImg, idx) => {
                                                const currentImg = appSettings.marketingMedia?.[`compte-ch-meta_img_${idx}`] || defImg;
                                                return (
                                                    <button key={idx} onClick={() => setCompteChIdx(idx)} style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", border: `2px solid ${compteChIdx === idx ? C.accent : C.mediumGray}`, transition: "all 0.2s", cursor: "pointer", padding: 0 }}>
                                                        <img src={currentImg} alt={`Miniature ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                                        <div style={{ borderBottom: `1px solid rgba(105,33,2,0.1)`, paddingBottom: 24 }}>
                                            <h3 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 24, color: C.black, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>Ce que votre prospect a vu</h3>
                                            <p style={{ color: C.darkGray, lineHeight: 1.6, textAlign: "justify", margin: 0 }}>Le prospect a réagi à l'une de nos <strong>5 créatives statiques</strong> ciblant une douleur forte des frontaliers : <strong>la perte d'argent sur le taux de change</strong> lors du rapatriement du salaire.</p>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                            <div style={{ background: C.white, padding: 24, border: `1px solid ${C.mediumGray}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", gap: 20 }}>
                                                <div style={{ padding: 12, background: "#fafaf9", border: `1px solid ${C.lightGray}`, color: C.gray, flexShrink: 0 }}><Icons.Target size={24} /></div>
                                                <div>
                                                    <h4 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 18, color: C.black, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>L'Accroche Visuelle & Émotionnelle</h4>
                                                    <p style={{ fontSize: 14, color: C.darkGray, lineHeight: 1.6, margin: 0 }}>L'utilisateur a été interpellé par une image choc illustrant le fait qu'il "donne" littéralement une partie de son salaire à sa banque chaque mois.</p>
                                                </div>
                                            </div>
                                            <div style={{ background: C.white, padding: 24, border: `1px solid ${C.mediumGray}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", gap: 20 }}>
                                                <div style={{ padding: 12, background: "#fafaf9", border: `1px solid ${C.lightGray}`, color: C.gray, flexShrink: 0 }}><Icons.TrendUp size={24} /></div>
                                                <div>
                                                    <h4 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 18, color: C.black, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>La Promesse de Transparence</h4>
                                                    <p style={{ fontSize: 14, color: C.darkGray, lineHeight: 1.6, margin: 0 }}>L'annonce offre un "vrai bon plan" : changer ses francs avec un <strong>taux préférentiel</strong> et arrêter les frais abusifs.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {marketingTab === 'mindset' && (
                                <div style={{ maxWidth: 896, margin: "0 auto" }}>
                                    <div style={{ textAlign: "center", marginBottom: 48 }}>
                                        <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 36, color: C.accent, marginBottom: 16, marginTop: 0 }}>Dans la tête de votre prospect Frontalier</h2>
                                        <p style={{ color: C.gray, fontSize: 18, margin: 0 }}>Comprendre ses attentes financières et ses craintes vis-à-vis des banques.</p>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
                                        <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", position: "relative" }}>
                                            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 4, background: "#059669" }}></div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${C.lightGray}` }}>
                                                <div style={{ width: 48, height: 48, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Smile size={24} /></div>
                                                <h3 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 24, fontWeight: 700, color: C.black, margin: 0 }}>Ce qu'il attend</h3>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 14, color: C.darkGray }}>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.CheckCircle size={20} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Voir <strong>concrètement la différence</strong> de taux par rapport à sa banque actuelle.</span></div>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.CheckCircle size={20} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Que la solution soit <strong>facile et rapide</strong> à mettre en place.</span></div>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.CheckCircle size={20} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Une <strong>transparence totale</strong> sur les frais, comme promis.</span></div>
                                            </div>
                                        </div>
                                        <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", position: "relative" }}>
                                            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 4, background: "#dc2626" }}></div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${C.lightGray}` }}>
                                                <div style={{ width: 48, height: 48, background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Frown size={24} /></div>
                                                <h3 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 24, fontWeight: 700, color: C.black, margin: 0 }}>Ce qu'il redoute</h3>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 14, color: C.darkGray }}>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.XCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Découvrir qu'il y a des <strong>"frais de tenue de compte" cachés</strong> qui annulent l'économie.</span></div>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.XCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Que l'argent mette <strong>plusieurs jours à arriver</strong> sur son compte.</span></div>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><Icons.XCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Devoir changer de banque principale et faire des démarches compliquées.</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {marketingTab === 'script' && (
                        <div style={{ maxWidth: 896, margin: "0 auto", animation: "fadeIn 0.6s ease-in-out forwards" }}>
                            <div style={{ background: "linear-gradient(135deg, #292524 0%, #44403c 50%, #292524 100%)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", position: "relative", overflow: "hidden" }}>
                                <div style={{ position: "absolute", top: 0, right: 0, width: 384, height: 384, background: C.accent, borderRadius: "50%", filter: "blur(120px)", opacity: 0.3, pointerEvents: "none" }}></div>
                                <div style={{ position: "absolute", bottom: 0, left: 0, width: 384, height: 384, background: "#d97706", borderRadius: "50%", filter: "blur(120px)", opacity: 0.2, pointerEvents: "none" }}></div>

                                <button
                                    onClick={handleCopyScript}
                                    style={{
                                        position: "absolute", top: 24, right: 24, zIndex: 20, display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 9999, border: `1px solid ${marketingCopied ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.2)"}`, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", transition: "all 0.2s", cursor: "pointer",
                                        background: marketingCopied ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.1)",
                                        color: marketingCopied ? "#34d399" : C.white,
                                        transform: marketingCopied ? "scale(0.95)" : "scale(1)"
                                    }}
                                >
                                    {marketingCopied ? <Icons.Check size={16} /> : <Icons.Copy size={16} />}
                                    <span>{marketingCopied ? 'Copié !' : 'Copier le script'}</span>
                                </button>

                                <div style={{ padding: "48px", position: "relative", zIndex: 10, color: "#e7e5e4" }}>
                                    <div style={{ marginBottom: 56 }}>
                                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 9999, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: C.white, fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 24, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                            <span style={{ position: "relative", display: "flex", height: 8, width: 8 }}>
                                                <span style={{ animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite", position: "absolute", display: "inline-flex", height: "100%", width: "100%", borderRadius: "50%", background: C.accent, opacity: 0.75 }}></span>
                                                <span style={{ position: "relative", display: "inline-flex", borderRadius: "50%", height: 8, width: 8, background: "#8c3d1e" }}></span>
                                            </span>
                                            Script Partenaire - {CAMPAIGNS_DATA[marketingCampaign].name}
                                        </div>
                                        <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 48, color: C.white, margin: "0 0 12px 0", textShadow: "0 10px 15px rgba(0,0,0,0.1)" }}>Discours de Qualification</h2>
                                        <p style={{ color: "#d6d3d1", fontWeight: 300, fontSize: 14, margin: 0 }}>Lisez ce script de manière naturelle et posée. N'hésitez pas à marquer des pauses.</p>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                                        {/* Etape 1 */}
                                        <div style={{ position: "relative", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 16, padding: 32, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", transition: "background 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.15)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
                                            <div style={{ position: "absolute", left: -12, top: 32, width: 24, height: 24, borderRadius: "50%", background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 15px rgba(239,68,68,0.3)" }}>
                                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }}></div>
                                            </div>
                                            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#f87171", margin: "0 0 16px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                                                <span>1. Introduction</span>
                                                <span style={{ width: 48, height: 1, background: "rgba(248,113,113,0.3)" }}></span>
                                            </p>
                                            <div style={{ fontSize: 20, lineHeight: 1.6, fontWeight: 300, color: "#f5f5f4", marginLeft: 16 }}>
                                                {CAMPAIGNS_DATA[marketingCampaign].scripts.intro}
                                            </div>
                                        </div>

                                        {/* Etape 2 */}
                                        <div style={{ position: "relative", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 16, padding: 32, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", transition: "background 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.15)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
                                            <div style={{ position: "absolute", left: -12, top: 32, width: 24, height: 24, borderRadius: "50%", background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 15px rgba(59,130,246,0.3)" }}>
                                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#60a5fa" }}></div>
                                            </div>
                                            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#60a5fa", margin: "0 0 16px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                                                <span>2. Transition</span>
                                                <span style={{ width: 48, height: 1, background: "rgba(96,165,250,0.3)" }}></span>
                                            </p>
                                            <div style={{ fontSize: 20, lineHeight: 1.6, fontWeight: 300, color: "#f5f5f4", marginLeft: 16 }}>
                                                {CAMPAIGNS_DATA[marketingCampaign].scripts.transition}
                                            </div>
                                        </div>

                                        {/* Etape 3 */}
                                        <div style={{ position: "relative", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 16, padding: 32, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", transition: "background 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.15)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
                                            <div style={{ position: "absolute", left: -12, top: 32, width: 24, height: 24, borderRadius: "50%", background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 15px rgba(16,185,129,0.3)" }}>
                                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399" }}></div>
                                            </div>
                                            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#34d399", margin: "0 0 16px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                                                <span>3. Closing</span>
                                                <span style={{ width: 48, height: 1, background: "rgba(52,211,153,0.3)" }}></span>
                                            </p>
                                            <div style={{ fontSize: 20, lineHeight: 1.6, fontWeight: 300, color: "#f5f5f4", marginLeft: 16 }}>
                                                {CAMPAIGNS_DATA[marketingCampaign].scripts.closing}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.2)", textAlign: "center" }}>
                                        <p style={{ fontSize: 10, color: "#a8a29e", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, margin: 0 }}>* Ce script est fourni à titre indicatif. Il doit être adapté selon vos préférences.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
          </div>
        )}
        {/* VUE MODULE PLANIFICATION RETRAITE */}
        {activeModule === "retraiteR1" && (
          <RetraiteR1Module
            user={user}
            db={db}
            appId={appId}
            appSettings={appSettings}
          />
        )}

        {/* VUE MODULE RECHERCHE LPP */}
        {activeModule === "rechercheLpp" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <header className="no-print" style={{ background: C.white, borderBottom: `1px solid ${C.mediumGray}`, position: "sticky", top: 0, zIndex: 100 }}>
              <div style={{ padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: C.gray, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Module ouvert</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>Générateur de Mandats & Recherche LPP</div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={handleDownloadLppDoc} disabled={isGeneratingLpp} style={{ ...S.btnS, padding: "8px 16px", fontSize: 12, opacity: isGeneratingLpp ? 0.7 : 1 }}>
                    {isGeneratingLpp ? "GÉNÉRATION..." : "TÉLÉCHARGER PDF"}
                  </button>
                  <button onClick={handleSendForSignature} disabled={isSendingSign} style={{ ...S.btnP, padding: "8px 16px", fontSize: 12, display: "flex", alignItems: "center", gap: 8, opacity: isSendingSign ? 0.7 : 1 }}>
                    <Icons.Mail size={14} /> {isSendingSign ? "ENVOI EN COURS..." : "SIGNATURE ÉLECTRONIQUE (YOUSIGN)"}
                  </button>
              <button onClick={handleDownloadLppDoc} style={{ ...S.btnS, padding: "8px 16px", fontSize: 12 }}>REMPLIR SF-F5-FR</button>
                </div>
              </div>
            </header>

            <main style={{ flex: 1, padding: "40px", boxSizing: "border-box", overflowY: "auto", display: "flex", gap: 40, alignItems: "flex-start" }}>

              {/* Formulaire */}
              <div style={{ flex: "0 0 450px", display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={S.card}>
                  <div style={S.cardTitle}><div style={S.dot} /> Informations du Client</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div><label style={S.label}>Prénom *</label><input style={S.input} value={lppForm.prenom} onChange={e=>setLppForm({...lppForm, prenom: e.target.value})} placeholder="Jean"/></div>
                    <div><label style={S.label}>Nom *</label><input style={S.input} value={lppForm.nom} onChange={e=>setLppForm({...lppForm, nom: e.target.value})} placeholder="DUPONT"/></div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={S.label}>Email Client (Pour Signature) *</label>
                    <input style={S.input} type="email" value={lppForm.emailClient} onChange={e=>setLppForm({...lppForm, emailClient: e.target.value})} placeholder="client@email.com"/>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div><label style={S.label}>Date de naissance</label><input style={S.input} value={lppForm.dateNaissance} onChange={e=>setLppForm({...lppForm, dateNaissance: e.target.value})} placeholder="01.01.1980"/></div>
                    <div><label style={S.label}>N° AVS</label><input style={S.input} value={lppForm.avs} onChange={e=>setLppForm({...lppForm, avs: e.target.value})} placeholder="756.xxxx.xxxx.xx"/></div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={S.label}>Adresse</label>
                    <input style={S.input} value={lppForm.adresse} onChange={e=>setLppForm({...lppForm, adresse: e.target.value})} placeholder="Rue de la Gare 12"/>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div><label style={S.label}>NPA / Localité</label><input style={S.input} value={lppForm.localite} onChange={e=>setLppForm({...lppForm, localite: e.target.value})} placeholder="1200 Genève"/></div>
                    <div><label style={S.label}>Pays</label><input style={S.input} value={lppForm.pays} onChange={e=>setLppForm({...lppForm, pays: e.target.value})} placeholder="Suisse"/></div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={S.label}>Téléphone</label>
                    <input style={S.input} value={lppForm.telephone} onChange={e=>setLppForm({...lppForm, telephone: e.target.value})} placeholder="+41 79 000 00 00"/>
                  </div>
                </div>

                <div style={S.card}>
                  <div style={S.cardTitle}><div style={S.dot} /> Informations Société / Mandataire</div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={S.label}>Nom de l'entreprise</label>
                    <input style={S.input} value={lppForm.nomEntreprise} onChange={e=>setLppForm({...lppForm, nomEntreprise: e.target.value})}/>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={S.label}>Adresse</label>
                    <input style={S.input} value={lppForm.adresseEntreprise} onChange={e=>setLppForm({...lppForm, adresseEntreprise: e.target.value})}/>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div><label style={S.label}>NPA / Ville</label><input style={S.input} value={lppForm.cpaVilleEntreprise} onChange={e=>setLppForm({...lppForm, cpaVilleEntreprise: e.target.value})}/></div>
                    <div><label style={S.label}>Email</label><input style={S.input} value={lppForm.emailEntreprise} onChange={e=>setLppForm({...lppForm, emailEntreprise: e.target.value})}/></div>
                  </div>
                </div>
              </div>

                            <div style={S.card}>
                <div style={S.cardTitle}><div style={S.dot} /> Documents à générer</div>
                {[
                  { key: "mandat", label: "Mandat — Demande de recherche d'avoirs" },
                  { key: "sff5", label: "Formulaire SF-F5-FR (Centrale 2e pilier)" },
                  { key: "suppletive", label: "Recherche supplétive (à venir)" },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "8px 0", borderBottom: `1px solid ${C.lightGray}` }}>
                    <input type="checkbox" checked={docsSelectionnes[key]} disabled={key === "suppletive"} onChange={(e) => { setDocsSelectionnes({ ...docsSelectionnes, [key]: e.target.checked }); if (e.target.checked) setPreviewActif(key); }} style={{ accentColor: C.accent, width: 16, height: 16 }} />
                    <span style={{ fontSize: 13, color: docsSelectionnes[key] ? C.darkGray : C.gray, fontWeight: docsSelectionnes[key] ? 600 : 400 }}>{label}</span>
                  </label>
                ))}
              </div>

              {/* Prévisualisation Document */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 40, boxShadow: "0 10px 40px rgba(0,0,0,0.05)", borderRadius: "0px", fontFamily: "'Times New Roman', Times, serif", fontSize: 14, color: C.black, lineHeight: 1.6 }}>

                   <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 60 }}>
                      <div>
                        {appSettings.defaultLogo ? <img src={appSettings.defaultLogo} alt="Logo" style={{ maxHeight: 60, marginBottom: 20 }} /> : <div style={{ fontSize: 24, fontWeight: "bold", color: C.accent, marginBottom: 20 }}>{lppForm.nomEntreprise || "WallSwiss"}</div>}
                        <div>{lppForm.nomEntreprise || "Nom entreprise"}</div>
                        <div>{lppForm.adresseEntreprise || "Rue"}</div>
                        <div>{lppForm.cpaVilleEntreprise || "CPA Ville"}</div>
                        <div>{lppForm.emailEntreprise || "contact@email.com"}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div>Le {new Date().toLocaleDateString('fr-CH')}</div>
                        <br/>
                        <div style={{ textAlign: "left", display: "inline-block" }}>
                          <strong>Stiftung Auffangeinrichtung BVG</strong><br/>
                          Elias-Canetti-Strasse 2<br/>
                          8050 Zürich
                        </div>
                      </div>
                   </div>

                   <h3 style={{ fontSize: 18, fontWeight: "bold", textDecoration: "underline", marginBottom: 24 }}>Demande de recherche d'avoirs</h3>

                   <p>Madame, Monsieur,</p>
                   <p>Par la présente, nous vous transmettons par mandat, une demande de recherche d’avoirs de 2ème pilier pour la personne ci-dessous :</p>

                   <div style={{ margin: "24px 0", paddingLeft: 24 }}>
                     <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", marginBottom: 4 }}><strong>Nom :</strong> <span>{lppForm.nom || "..."}</span></div>
                     <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", marginBottom: 4 }}><strong>Prénom :</strong> <span>{lppForm.prenom || "..."}</span></div>
                     <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", marginBottom: 4 }}><strong>Date de naissance :</strong> <span>{lppForm.dateNaissance || "..."}</span></div>
                     <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", marginBottom: 4 }}><strong>N° AVS :</strong> <span>{lppForm.avs || "..."}</span></div>
                     <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", marginBottom: 4 }}><strong>Adresse :</strong> <span>{lppForm.adresse || "..."}</span></div>
                     <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", marginBottom: 4 }}><strong>Localité :</strong> <span>{lppForm.localite || "..."}</span></div>
                     <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", marginBottom: 4 }}><strong>Pays :</strong> <span>{lppForm.pays || "..."}</span></div>
                     <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", marginBottom: 4 }}><strong>Téléphone :</strong> <span>{lppForm.telephone || "..."}</span></div>
                   </div>

                   <p>Vous trouverez également ci-joint la procuration ainsi qu'une copie de la carte d'identité.</p>
                   <p>Comme cité dans la procuration, nous vous prions de communiquer les résultats de la recherche par courrier ou encore mieux, par courriel.</p>
                   <p>Vous trouverez tous les détails dans notre en-tête.</p>
                   <p>Dans l'attente d'une réponse, nous vous remercions, Madame, Monsieur, pour la suite que vous donnerez à ce dossier.</p>

                   <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between" }}>
                     <div style={{ border: "1px dashed #ccc", padding: "20px 40px", color: "#ccc", textAlign: "center" }}>
                       Signature du mandataire<br/>({lppForm.nomEntreprise || "Entreprise"})
                     </div>
                     <div style={{ border: "1px dashed #ccc", padding: "20px 40px", color: "#ccc", textAlign: "center" }}>
                       Signature du client<br/>({lppForm.nom || "Client"})
                     </div>
                   </div>

                   <div style={{ marginTop: 40, borderTop: "1px dashed #ccc", paddingTop: 40 }}>
                     <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 60 }}>
                        <div>
                          <div>Monsieur/Madame</div>
                          <div>{lppForm.nom || "NOM"} {lppForm.prenom || "Prénom"}</div>
                          <div>{lppForm.adresse || "Rue"}</div>
                          <div>{lppForm.localite || "CPA Ville"}</div>
                          <div>{lppForm.pays || "Pays"}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div>Le {new Date().toLocaleDateString('fr-CH')}</div>
                          <br/>
                          <div style={{ textAlign: "left", display: "inline-block" }}>
                            <strong>Stiftung Auffangeinrichtung BVG</strong><br/>
                            Elias-Canetti-Strasse 2<br/>
                            8050 Zürich
                          </div>
                        </div>
                     </div>

                     <h3 style={{ fontSize: 18, fontWeight: "bold", textDecoration: "underline", marginBottom: 24 }}>Procuration</h3>

                     <p>Madame, Monsieur,</p>
                     <p>Je soussigné(e), <strong>{lppForm.nom || "NOM"} {lppForm.prenom || "Prénom"}</strong>, né(e) le <strong>{lppForm.dateNaissance || "xx.xx.xxxx"}</strong> et demeurant à <strong>{lppForm.adresse || "Rue"}, {lppForm.localite || "CPA Ville"}</strong>, autorise la société <strong>{lppForm.nomEntreprise || "Nom société"}</strong>, domiciliée à <strong>{lppForm.adresseEntreprise || "Adresse société"}, {lppForm.cpaVilleEntreprise || "CPA"}</strong>, à se présenter auprès de vos services afin d'effectuer des demandes d'avoirs de 2ème pilier.</p>

                     <p>J’autorise la société <strong>{lppForm.nomEntreprise || "Nom société"}</strong> à vous faire cette demande par courrier électronique et assume les éventuels risques qui en découlent. Je vous autorise à communiquer directement les résultats de la recherche à la société <strong>{lppForm.nomEntreprise || "Nom société"}</strong> par courrier ou courriel.</p>

                     <p>Cette procuration n’est valide que pour la présente demande et les résultats qui en découlent. Elle devient ensuite caduque.</p>

                     <p>Pour tout litige en rapport avec la présente procuration, le for juridique est Genève et seul le droit suisse est applicable.</p>

                     <p>Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p>

                     <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between" }}>
                       <div>Date, Lieu : _____________________</div>
                       <div style={{ border: "1px dashed #ccc", padding: "30px 60px", color: "#ccc", textAlign: "center" }}>
                         Signature du client<br/>({lppForm.nom || "Client"})
                       </div>
                     </div>
                   </div>
                </div>
              </div>
            </main>

            {/* Élément caché pour la génération PDF propre */}
            <div style={{ position: "fixed", top: 0, left: 0, zIndex: -1000, opacity: 0.001, pointerEvents: "none" }}>
              <div id="lpp-doc-printable" style={{ width: "800px", padding: "40px", background: "#fff", fontFamily: "'Times New Roman', Times, serif", fontSize: "14px", color: "#000", lineHeight: "1.6", boxSizing: "border-box" }}>
                   <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40 }}>
                      <div>
                        {appSettings.defaultLogo ? <img src={appSettings.defaultLogo} alt="Logo" style={{ maxHeight: 60, marginBottom: 20 }} /> : <div style={{ fontSize: 24, fontWeight: "bold", color: C.accent, marginBottom: 20 }}>{lppForm.nomEntreprise || "WallSwiss"}</div>}
                        <div>{lppForm.nomEntreprise || "Nom entreprise"}</div>
                        <div>{lppForm.adresseEntreprise || "Rue"}</div>
                        <div>{lppForm.cpaVilleEntreprise || "CPA Ville"}</div>
                        <div>{lppForm.emailEntreprise || "contact@email.com"}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div>Le {new Date().toLocaleDateString('fr-CH')}</div>
                        <br/>
                        <div style={{ textAlign: "left", display: "inline-block" }}>
                          <strong>Stiftung Auffangeinrichtung BVG</strong><br/>
                          Elias-Canetti-Strasse 2<br/>
                          8050 Zürich
                        </div>
                      </div>
                   </div>
                   <h3 style={{ fontSize: 18, fontWeight: "bold", textDecoration: "underline", marginBottom: 24 }}>Demande de recherche d'avoirs</h3>
                   <p>Madame, Monsieur,</p>
                   <p>Par la présente, nous vous transmettons par mandat, une demande de recherche d’avoirs de 2ème pilier pour la personne ci-dessous :</p>
                   <div style={{ margin: "24px 0", paddingLeft: 24 }}>
                     <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", marginBottom: 4 }}><strong>Nom :</strong> <span>{lppForm.nom || "________________"}</span></div>
                     <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", marginBottom: 4 }}><strong>Prénom :</strong> <span>{lppForm.prenom || "________________"}</span></div>
                     <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", marginBottom: 4 }}><strong>Date de naissance :</strong> <span>{lppForm.dateNaissance || "________________"}</span></div>
                     <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", marginBottom: 4 }}><strong>N° AVS :</strong> <span>{lppForm.avs || "________________"}</span></div>
                     <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", marginBottom: 4 }}><strong>Adresse :</strong> <span>{lppForm.adresse || "________________"}</span></div>
                     <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", marginBottom: 4 }}><strong>Localité :</strong> <span>{lppForm.localite || "________________"}</span></div>
                     <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", marginBottom: 4 }}><strong>Pays :</strong> <span>{lppForm.pays || "________________"}</span></div>
                     <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", marginBottom: 4 }}><strong>Téléphone :</strong> <span>{lppForm.telephone || "________________"}</span></div>
                   </div>
                   <p>Vous trouverez également ci-joint la procuration ainsi qu'une copie de la carte d'identité.</p>
                   <p>Comme cité dans la procuration, nous vous prions de communiquer les résultats de la recherche par courrier ou encore mieux, par courriel.</p>
                   <p>Vous trouverez tous les détails dans notre en-tête.</p>
                   <p>Dans l'attente d'une réponse, nous vous remercions, Madame, Monsieur, pour la suite que vous donnerez à ce dossier.</p>

                   <div style={{ marginTop: 60, display: "flex", justifyContent: "space-between" }}>
                     <div style={{ padding: "0 20px", textAlign: "center" }}>
                       Signature du mandataire :<br/><br/><br/>
                       ___________________________
                     </div>
                     <div style={{ padding: "0 20px", textAlign: "center" }}>
                       Signature du client :<br/><br/><br/>
                       ___________________________
                     </div>
                   </div>

                   <div className="html2pdf__page-break"></div>

                   <div style={{ marginTop: 20, paddingTop: 20 }}>
                     <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40 }}>
                        <div>
                          <div>Monsieur/Madame</div>
                          <div>{lppForm.nom || "NOM"} {lppForm.prenom || "Prénom"}</div>
                          <div>{lppForm.adresse || "Rue"}</div>
                          <div>{lppForm.localite || "CPA Ville"}</div>
                          <div>{lppForm.pays || "Pays"}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div>Le {new Date().toLocaleDateString('fr-CH')}</div>
                          <br/>
                          <div style={{ textAlign: "left", display: "inline-block" }}>
                            <strong>Stiftung Auffangeinrichtung BVG</strong><br/>
                            Elias-Canetti-Strasse 2<br/>
                            8050 Zürich
                          </div>
                        </div>
                     </div>
                     <h3 style={{ fontSize: 18, fontWeight: "bold", textDecoration: "underline", marginBottom: 24 }}>Procuration</h3>
                     <p>Madame, Monsieur,</p>
                     <p>Je soussigné(e), <strong>{lppForm.nom || "________________"} {lppForm.prenom || "________________"}</strong>, né(e) le <strong>{lppForm.dateNaissance || "________________"}</strong> et demeurant à <strong>{lppForm.adresse || "________________"}, {lppForm.localite || "________________"}</strong>, autorise la société <strong>{lppForm.nomEntreprise || "________________"}</strong>, domiciliée à <strong>{lppForm.adresseEntreprise || "________________"}, {lppForm.cpaVilleEntreprise || "________________"}</strong>, à se présenter auprès de vos services afin d'effectuer des demandes d'avoirs de 2ème pilier.</p>
                     <p>J’autorise la société <strong>{lppForm.nomEntreprise || "________________"}</strong> à vous faire cette demande par courrier électronique et assume les éventuels risques qui en découlent. Je vous autorise à communiquer directement les résultats de la recherche à la société <strong>{lppForm.nomEntreprise || "________________"}</strong> par courrier ou courriel.</p>
                     <p>Cette procuration n’est valide que pour la présente demande et les résultats qui en découlent. Elle devient ensuite caduque.</p>
                     <p>Pour tout litige en rapport avec la présente procuration, le for juridique est Genève et seul le droit suisse est applicable.</p>
                     <p>Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p>
                     <div style={{ marginTop: 60, display: "flex", justifyContent: "space-between" }}>
                       <div>Date, Lieu : _____________________</div>
                       <div style={{ padding: "0 60px", textAlign: "center" }}>
                         Signature du client :<br/><br/><br/>
                         ___________________________
                       </div>
                     </div>
                   </div>
              </div>
            </div>
          </div>
        )}
        {/* VUE MODULE ANNUAIRE */}
        {activeModule === "annuaire" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <header className="no-print" style={{ background: C.white, borderBottom: `1px solid ${C.mediumGray}`, position: "sticky", top: 0, zIndex: 100 }}>
              <div style={{ padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: C.gray, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Module ouvert</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>Annuaire Partenaires</div>
                </div>
              </div>
            </header>

            <main style={{ flex: 1, padding: "40px", boxSizing: "border-box", overflowY: "auto", textAlign: "left" }}>
              <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 28, fontWeight: 700, color: C.accent, margin: 0 }}>Contacts & Partenaires</h2>
                  <p style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>Banque · Asset Management · Prévoyance individuelle · Libre passage · Assurance vie France. Responsable des fiches partenaires : Pierrick Pereira.</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
                  {[
                    { nom: "Swissquote", type: "Banque", contact: "Desk B2B / Trading", tel: "+41 44 825 89 90", email: "b2b-desk@swissquote.ch", url: "https://trade.swissquote.ch/my.policy", note: "Protocole de trading + portefeuilles modèles." },
                    { nom: "PARfinance", type: "Asset Management", contact: "Desk Gestion", tel: "+41 22 989 55 55", email: "info@parfinance.ch", url: "https://www.parfinance.ch/", note: "Mandats Dynamique · Équilibre · Conservateur." },
                    { nom: "NS Partners", type: "Asset Management", contact: "Relation Partenaires", tel: "+41 22 906 52 50", email: "geneva@nspgroup.com", url: "https://nspartners.com/", note: "Swiss Excellence DPM · DGC Stock Selection · DGC Energy." },
                    { nom: "Altaroc", type: "Private Equity", contact: "Relation Partenaires", url: "https://altaroc.com/", note: "Millésimes Private Equity." },
                    { nom: "Alpin Capital", type: "Crypto-monnaie", contact: "Desk Crypto-actifs" },
                    { nom: "Liechtenstein Life", type: "Prévoyance individuelle (3P)", contact: "Support Courtier", tel: "+423 265 34 40", email: "info@liechtensteinlife.com", url: "https://partner.life.li/fr/my/dashboard", note: "3ᵉ pilier. Protocole de reprise FINMA (voir Procédures)." },
                    { nom: "Lemania", type: "Libre passage (LPP)", contact: "Administration", tel: "+41 21 311 11 11", email: "info@lemania-lpp.ch", url: "https://www.hublemania.ch/", note: "NS Golden Age Balanced · LPFX Mirabaud." },
                    { nom: "Pictet", type: "Libre passage (LPP)", contact: "Service LPP", tel: "+41 58 323 23 23", email: "lpp@pictet.com", url: "https://www.am.pictet/", note: "Pictet LPP 40 · LPP 60." },
                    { nom: "Liberty", type: "Libre passage (LPP)", contact: "Fondation Liberty", url: "https://www.liberty.ch/" },
                    { nom: "UAF Life Patrimoine", type: "Assurance vie France", contact: "Courtage assurance vie" }
                  ].map((partenaire, i) => (
                    <div key={i} style={{ ...S.card, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <span style={{ background: "rgba(165,149,104,0.1)", color: C.goldDeep, fontSize: 10, fontWeight: 700, padding: "4px 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{partenaire.type}</span>
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: C.accentDark, margin: 0 }}>{partenaire.nom}</h3>

                      <div style={{ display: "grid", gap: 12 }}>
                        {partenaire.contact && (
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ color: C.gray }}><Icons.User size={16} /></div>
                            <span style={{ fontSize: 13, color: C.darkGray, fontWeight: 500 }}>{partenaire.contact}</span>
                          </div>
                        )}
                        {partenaire.tel && (
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ color: C.gray }}><Icons.Phone size={16} /></div>
                            <span style={{ fontSize: 13, color: C.darkGray, fontWeight: 500 }}>{partenaire.tel}</span>
                          </div>
                        )}
                        {partenaire.email && (
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ color: C.gray }}><Icons.Mail size={16} /></div>
                            <span style={{ fontSize: 13, color: C.accent, fontWeight: 500 }}>{partenaire.email}</span>
                          </div>
                        )}
                      </div>
                      {partenaire.note && (
                        <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.5, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>{partenaire.note}</div>
                      )}
                      {partenaire.url && (
                        <button
                          onClick={() => window.open(partenaire.url, "_blank")}
                          style={{ marginTop: 20, width: "100%", background: "transparent", border: `1px solid ${C.mediumGray}`, color: C.accent, padding: "10px 0", cursor: "pointer", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", transition: "0.2s", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, borderRadius: 999 }}
                          onMouseEnter={(e)=>e.currentTarget.style.background="rgba(105,33,2,0.04)"}
                          onMouseLeave={(e)=>e.currentTarget.style.background="transparent"}
                        >
                          Accéder au portail <Icons.ExternalLink size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </div>
        )}

        {/* VUE MODULE RESSOURCES */}
        {activeModule === "ressources" && resDoc && (
          <AcademyReader doc={{ id: "res:" + resDoc.fichier, title: resDoc.nom, type: ressTypeOf(resDoc.fichier), src: encodeURI(resDoc.fichier), pdfAlt: ressTypeOf(resDoc.fichier) === "docx" ? encodeURI(resDoc.fichier.replace(/\.docx?$/i, ".pdf")) : undefined, file: (resDoc.fichier || "").split("/").pop(), backLabel: "Documents" }} onClose={() => setResDoc(null)} />
        )}
        {activeModule === "ressources" && !resDoc && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <header className="no-print" style={{ background: C.white, borderBottom: `1px solid ${C.mediumGray}`, position: "sticky", top: 0, zIndex: 100 }}>
              <div style={{ padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: C.gray, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Module ouvert</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>Ressources Documents</div>
                </div>
              </div>
            </header>

            <main style={{ flex: 1, padding: "40px", boxSizing: "border-box", overflowY: "auto", textAlign: "left" }}>
              <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 28, fontWeight: 700, color: C.accent, margin: 0 }}>Documents & Formulaires</h2>
                  <p style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>Visualisez les documents directement dans l'application (PDF & Word) ou téléchargez-les pour vos rendez-vous.</p>
                </div>

                {[
                  {
                    titre: "Général",
                    docs: [
                      { nom: "Mandat de gestion 2026", desc: "Mandat officiel WallSwiss", fichier: "/Mandat de gestion Wallswiss 2026.pdf" }
                    ]
                  },
                  {
                    titre: "Modèles de courriers",
                    docs: [
                      { nom: "Lettre envoi postal", desc: "Modèle The WallSwiss Partner", fichier: "/WS The WallSwiss Partner lettre envoi postal.docx" },
                      { nom: "Demande valeur rachat", desc: "Modèle de demande de rachat", fichier: "/Modèle - demande de valeur de rachat.docx" },
                      { nom: "Récupération de fonds", desc: "Modèle de récupération de fonds", fichier: "/Modèle - demande de récupération de fonds.docx" },
                      { nom: "Suppression Garantie", desc: "Lettre suppression garantie select", fichier: "/LETTRE SUPPRESSION GARANTIE SELECT.docx" },
                      { nom: "Libération de primes", desc: "Lettre demande de libération", fichier: "/Lettre demande de libération de primes .docx" }
                    ]
                  },
                  {
                    titre: "LPP",
                    docs: [
                      { nom: "Recherche Centrale LPP", desc: "Formulaire de recherche du 2ème Pilier", fichier: "/Centrale 2P.pdf" },
                      { nom: "Liste Documents Retrait", desc: "Documents à fournir pour retrait EPL", fichier: "/1._Liste_Documents_A_Fournir_Retrait_Epl.pdf" },
                      { nom: "Demande de Retrait EPL", desc: "Formulaire de demande de retrait FLLP", fichier: "/Demande_de_Retrait_Epl_FLLP_Fr.pdf" },
                      { nom: "Déblocage LPP Lemania", desc: "Formulaire de déblocage LPP LEMANIA", fichier: "/Formulaire de déblocage LPP LEMANIA.pdf" }
                    ]
                  }
                ].map((categorie, indexCat) => (
                  <div key={indexCat} style={{ marginBottom: 40, textAlign: "left" }}>
                    <h3 style={{ fontSize: 14, color: C.gray, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: `2px solid ${C.mediumGray}`, paddingBottom: 8, marginBottom: 20 }}>
                      {categorie.titre}
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {categorie.docs.map((doc, i) => (
                        <div
                          key={i}
                          style={{ background: C.white, border: `1px solid ${C.lightGray}`, borderLeft: `4px solid transparent`, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.2s", borderRadius: "14px" }}
                          onMouseEnter={(e)=> { e.currentTarget.style.borderLeftColor = C.goldUI; e.currentTarget.style.background = "rgba(165,149,104,0.02)"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.03)"; }}
                          onMouseLeave={(e)=> { e.currentTarget.style.borderLeftColor = "transparent"; e.currentTarget.style.background = C.white; e.currentTarget.style.boxShadow = "none"; }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                            <div style={{ background: "rgba(105,33,2,0.04)", color: C.accent, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px", flexShrink: 0 }}>
                              <Icons.FileText size={24} />
                            </div>
                            <div style={{ textAlign: "left" }}>
                              <div style={{ fontSize: 16, fontWeight: 700, color: C.accentDark, marginBottom: 4 }}>{doc.nom}</div>
                              <div style={{ fontSize: 13, color: C.gray }}>{doc.desc}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                            <button
                              onClick={() => setResDoc(doc)}
                              style={{ background: C.accent, border: "none", color: C.white, padding: "10px 22px", cursor: "pointer", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", transition: "all 0.2s", borderRadius: "999px" }}
                              onMouseEnter={(e)=> { e.currentTarget.style.background = C.accentDark; }}
                              onMouseLeave={(e)=> { e.currentTarget.style.background = C.accent; }}
                            >Voir</button>
                            <a
                              href={encodeURI(doc.fichier)}
                              download={(doc.fichier || "").split('/').pop()}
                              style={{ background: C.white, border: `1px solid ${C.mediumGray}`, color: C.accentDark, padding: "10px 20px", cursor: "pointer", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", transition: "all 0.2s", borderRadius: "999px", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                              onMouseEnter={(e)=> { e.currentTarget.style.background = C.lightGray; }}
                              onMouseLeave={(e)=> { e.currentTarget.style.background = C.white; }}
                            >Télécharger</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        )}
        {/* VUE MODULE MAILS TYPES */}
        {activeModule === "mails" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <header className="no-print" style={{ background: C.white, borderBottom: `1px solid ${C.mediumGray}`, position: "sticky", top: 0, zIndex: 100 }}>
              <div style={{ padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: C.gray, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Module ouvert</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>Mails Types</div>
                </div>
              </div>
            </header>

            <main style={{ flex: 1, padding: "40px", boxSizing: "border-box", overflowY: "auto", position: "relative" }}>
              <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
                  <div>
                    <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 28, fontWeight: 700, color: C.accent, margin: 0 }}>Modèles de communication</h2>
                    <p style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>Centralisation de vos emails types pour un envoi rapide en un clic.</p>
                  </div>
                  <div style={{ width: "300px" }}>
                    <input
                      style={{ ...S.input, borderRadius: "20px", padding: "10px 20px" }}
                      placeholder="Rechercher un mail..."
                      value={mailSearch}
                      onChange={(e) => setMailSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Filtres par catégorie */}
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, marginBottom: 16 }}>
                  {["Toutes", "Rendez-vous", "LPP", "Relances", "Suivi", "CMU / Fiscalité", "Prévoyance", "Investissements", "Événements", "Divers"].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setMailCat(cat)}
                      style={{
                        background: mailCat === cat ? C.accent : C.white,
                        color: mailCat === cat ? C.white : C.darkGray,
                        border: `1px solid ${mailCat === cat ? C.accent : C.mediumGray}`,
                        padding: "8px 16px",
                        borderRadius: "20px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "0.2s"
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Grille des mails */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
                  {MAILS_TYPES.filter(m => {
                    const matchCat = mailCat === "Toutes" || m.categorie === mailCat;
                    const matchSearch = m.titre.toLowerCase().includes(mailSearch.toLowerCase()) || m.objet.toLowerCase().includes(mailSearch.toLowerCase());
                    return matchCat && matchSearch;
                  }).map(mail => (
                    <div key={mail.id} style={{ ...S.card, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16, padding: "20px 24px" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <span style={{ background: "rgba(105,33,2,0.06)", color: C.accent, fontSize: 10, fontWeight: 700, padding: "4px 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {mail.categorie}
                          </span>
                          {mail.pieceJointe && <span title="Pièce jointe requise" style={{ color: C.goldDeep }}><Icons.FileText size={16} /></span>}
                        </div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: C.accentDark, margin: "0 0 8px 0", lineHeight: 1.4 }}>{mail.titre}</h3>
                        <p style={{ fontSize: 12, color: C.gray, margin: 0, fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Objet : {mail.objet}</p>
                        <p style={{ fontSize: 12, color: C.darkGray, marginTop: 12, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {mail.corps}
                        </p>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => handleCopy(mail.objet, "Objet copié !")} style={{ flex: 1, background: C.white, border: `1px solid ${C.mediumGray}`, color: C.accentDark, padding: "8px 0", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "0.2s", display: "flex", justifyContent: "center", alignItems: "center", gap: 6, borderRadius: 999 }} onMouseEnter={e=>{e.currentTarget.style.background=C.cardSoft}} onMouseLeave={e=>{e.currentTarget.style.background=C.white}}>
                            <Icons.Copy size={14} /> OBJET
                          </button>
                          <button onClick={() => handleCopy(mail.corps, "Corps copié !")} style={{ flex: 1, background: C.white, border: `1px solid ${C.mediumGray}`, color: C.accentDark, padding: "8px 0", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "0.2s", display: "flex", justifyContent: "center", alignItems: "center", gap: 6, borderRadius: 999 }} onMouseEnter={e=>{e.currentTarget.style.background=C.cardSoft}} onMouseLeave={e=>{e.currentTarget.style.background=C.white}}>
                            <Icons.Copy size={14} /> CORPS
                          </button>
                        </div>
                        <button onClick={() => setSelectedMail(mail)} style={{ width: "100%", background: C.accent, color: C.white, border: "none", padding: "8px 0", fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em", transition: "0.2s", borderRadius: 999 }} onMouseEnter={e=>{e.currentTarget.style.opacity=0.9}} onMouseLeave={e=>{e.currentTarget.style.opacity=1}}>
                          VOIR LES DÉTAILS
                        </button>
                      </div>
                    </div>
                  ))}
                  {MAILS_TYPES.filter(m => (mailCat === "Toutes" || m.categorie === mailCat) && (m.titre.toLowerCase().includes(mailSearch.toLowerCase()) || m.objet.toLowerCase().includes(mailSearch.toLowerCase()))).length === 0 && (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: C.gray, fontSize: 14 }}>
                      Aucun mail trouvé pour cette recherche ou catégorie.
                    </div>
                  )}
                </div>
              </div>
            </main>

            {/* Modal Détail du Mail */}
            {selectedMail && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "left" }}>
                <div style={{ background: C.white, width: "100%", maxWidth: 800, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", borderRadius: 20 }}>
                  <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.mediumGray}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: C.cardSoft }}>
                    <div>
                      <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{selectedMail.categorie}</div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: C.accentDark, margin: 0 }}>{selectedMail.titre}</h2>
                    </div>
                    <button onClick={() => setSelectedMail(null)} style={{ background: "transparent", border: "none", fontSize: 24, color: C.gray, cursor: "pointer" }}>&times;</button>
                  </div>

                  <div style={{ padding: "32px", overflowY: "auto", flex: 1 }}>
                    {selectedMail.pieceJointe && (
                      <div style={{ background: "rgba(165,149,104,0.1)", borderLeft: `4px solid ${C.goldUI}`, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: C.darkGray, display: "flex", alignItems: "center", gap: 12 }}>
                        <Icons.FileText size={20} color={C.goldUI} />
                        <strong>Pièce(s) jointe(s) recommandée(s) :</strong> {selectedMail.pieceJointe}
                      </div>
                    )}

                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 11, color: C.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Objet du mail</div>
                      <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: "12px 16px", fontSize: 14, fontWeight: 600, color: C.accentDark, display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 12 }}>
                        {selectedMail.objet}
                        <button onClick={() => handleCopy(selectedMail.objet, "Objet copié !")} style={{ background: "transparent", border: "none", color: C.accent, cursor: "pointer" }} title="Copier l'objet"><Icons.Copy size={18}/></button>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: C.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Corps du message</div>
                      <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: "20px", fontSize: 13, color: C.darkGray, whiteSpace: "pre-wrap", lineHeight: 1.6, position: "relative", borderRadius: 12 }}>
                        <button onClick={() => handleCopy(selectedMail.corps, "Corps copié !")} style={{ position: "absolute", top: 12, right: 12, background: C.cardSoft, border: `1px solid ${C.mediumGray}`, padding: "6px 10px", color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, borderRadius: 999 }} title="Copier le corps">
                          <Icons.Copy size={14}/> Copier
                        </button>
                        {selectedMail.corps}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: "20px 32px", borderTop: `1px solid ${C.mediumGray}`, display: "flex", justifyContent: "flex-end", gap: 16 }}>
                  <button onClick={() => handleCopy(`${selectedMail.objet}\n\n${selectedMail.corps}`, "Objet et Corps copiés !")} style={{ ...S.btnP, display: "flex", alignItems: "center", gap: 8 }}>
                    <Icons.Copy size={16}/> Tout Copier (Objet + Corps)
                  </button>
                  <button onClick={() => setSelectedMail(null)} style={S.btnS}>Fermer</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* VUE PARAMÈTRES & INTÉGRATIONS */}
      {activeModule === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <header className="no-print" style={{ background: C.white, borderBottom: `1px solid ${C.mediumGray}`, position: "sticky", top: 0, zIndex: 100 }}>
              <div style={{ padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: C.gray, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Configuration Globale</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>Paramètres & Intégrations</div>
                </div>
                <nav style={{ display: "flex", gap: 8 }}>
                  {[["profile","Profil Agent"],["design","Marque & Design"],["reports","Envoi Rapports"],["campaigns","Campagnes Mailing"]].map(([p,l]) => (
                    <button
                      key={p}
                      onClick={() => setSettingsTab(p)}
                      style={{ background: settingsTab===p ? "rgba(105,33,2,0.06)" : "transparent", color: settingsTab===p ? C.accent : C.gray, border: "none", padding: "8px 16px", cursor: "pointer", fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif", fontSize: 13, fontWeight: settingsTab===p?700:500, borderRadius: "999px", transition: "0.2s" }}
                    >
                      {l}
                    </button>
                  ))}
                </nav>
              </div>
            </header>

            <main style={{ flex: 1, padding: "40px", boxSizing: "border-box", overflowY: "auto" }}>
              <div style={{ width: "100%", maxWidth: 800, margin: "0 auto" }}>

                {settingsTab === "profile" && (
                  <div style={S.card}>
                    <div style={S.cardTitle}><div style={S.dot} /> Configuration de l'Agent</div>
                    <p style={{ color: C.gray, fontSize: 13, marginBottom: 24, marginTop: 0 }}>Ces informations seront utilisées par défaut comme variables dans vos rapports et vos campagnes d'e-mailing.</p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                      <div><label style={S.label}>Prénom</label><input style={S.input} value={appSettings.agentFirstName || ""} onChange={e => setAppSettings({...appSettings, agentFirstName: e.target.value})} placeholder="Prénom" /></div>
                      <div><label style={S.label}>Nom</label><input style={S.input} value={appSettings.agentLastName || ""} onChange={e => setAppSettings({...appSettings, agentLastName: e.target.value})} placeholder="Nom" /></div>
                    </div>
                    <div style={S.fg}><label style={S.label}>Titre / Fonction</label><input style={S.input} value={appSettings.agentTitle || ""} onChange={e => setAppSettings({...appSettings, agentTitle: e.target.value})} placeholder="Planificatrice financière | CGP" /></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                      <div><label style={S.label}>Téléphone</label><input style={S.input} value={appSettings.agentPhone || ""} onChange={e => setAppSettings({...appSettings, agentPhone: e.target.value})} placeholder="+41 76..." /></div>
                      <div><label style={S.label}>Email de contact</label><input style={S.input} value={appSettings.agentEmail || ""} onChange={e => setAppSettings({...appSettings, agentEmail: e.target.value})} placeholder="contact@wallswiss.ch" /></div>
                    </div>
                  </div>
                )}

                {settingsTab === "design" && (
                  <div style={S.card}>
                    <div style={S.cardTitle}><div style={S.dot} /> Marque & Design de l'Agence</div>
                    <p style={{ color: C.gray, fontSize: 13, marginBottom: 24, marginTop: 0 }}>Définissez les images par défaut pour l'ensemble de vos rapports.</p>

                    <div style={S.fg}>
                      <label style={S.label}>Logo de l'Agence (Remplace le logo WallSwiss)</label>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 64, height: 64, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <img src={appSettings.defaultLogo || LOGO_URL} style={{ maxWidth: "80%", maxHeight: "80%", objectFit: "contain" }} />
                        </div>
                        <input type="file" accept="image/*" onChange={async (e) => {
                          const url = await handleImageUpload(e.target.files[0], `agency/${user.uid}/logo_${Date.now()}`);
                          if (url) setAppSettings({...appSettings, defaultLogo: url});
                        }} style={{ fontSize: 12, fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }} />
                      </div>
                    </div>

                    <div style={S.fg}>
                      <label style={S.label}>Image de couverture (Page Agence & Solutions)</label>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 120, height: 64, background: C.cardSoft, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                          <img src={appSettings.defaultCover || "/geneva.jpg"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <input type="file" accept="image/*" onChange={async (e) => {
                          const url = await handleImageUpload(e.target.files[0], `agency/${user.uid}/cover_${Date.now()}`);
                          if (url) setAppSettings({...appSettings, defaultCover: url});
                        }} style={{ fontSize: 12, fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }} />
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={S.label}>Image Philosophie (Page 3)</label>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 120, height: 64, background: C.cardSoft, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                          <img src={appSettings.defaultPhilosophy || "/image page3.jpg"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <input type="file" accept="image/*" onChange={async (e) => {
                          const url = await handleImageUpload(e.target.files[0], `agency/${user.uid}/philosophy_${Date.now()}`);
                          if (url) setAppSettings({...appSettings, defaultPhilosophy: url});
                        }} style={{ fontSize: 12, fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }} />
                      </div>
                    </div>
                    {uploadingImage && <div style={{ fontSize: 12, color: C.goldDeep, fontWeight: 700, marginTop: 8 }}>Upload de l'image en cours vers Firebase...</div>}
                  </div>
                )}

                {settingsTab === "reports" && (
                  <div style={S.card}>
                    <div style={S.cardTitle}><div style={S.dot} /> Configuration Envoi de Rapports & Signatures</div>
                    <p style={{ color: C.gray, fontSize: 13, marginBottom: 24, marginTop: 0 }}>Configurez les Webhooks (Make.com, Zapier) qui gèrent vos intégrations externes.</p>

                    <div style={S.fg}>
                      <label style={S.label}>URL du Webhook - Rapports financiers (Email)</label>
                      <input
                        style={S.input}
                        value={appSettings.reportWebhookUrl || ""}
                        onChange={e => setAppSettings({...appSettings, reportWebhookUrl: e.target.value})}
                        placeholder="https://hook.eu1.make.com/..."
                      />
                    </div>

                    <div style={S.fg}>
                      <label style={{...S.label, color: C.accentDark}}>URL du Webhook - Signature Yousign (Module LPP)</label>
                      <input
                        style={{...S.input, borderLeft: `3px solid ${C.goldUI}`}}
                        value={appSettings.lppWebhookUrl || ""}
                        onChange={e => setAppSettings({...appSettings, lppWebhookUrl: e.target.value})}
                        placeholder="https://hook.eu1.make.com/..."
                      />
                      <div style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>Ce webhook recevra : nom, prenom, email, telephone, et le pdfBase64.</div>
                    </div>

                    <div style={{ height: 1, background: C.mediumGray, margin: "24px 0" }} />

                    <div style={S.fg}>
                      <label style={S.label}>Sujet de l'e-mail par défaut (Rapports)</label>
                      <input
                        style={S.input}
                        value={appSettings.emailSubject || ""}
                        onChange={e => setAppSettings({...appSettings, emailSubject: e.target.value})}
                      />
                    </div>

                    <div style={S.fg}>
                      <label style={S.label}>Corps de l'e-mail par défaut (Rapports)</label>
                      <textarea
                        style={{...S.input, minHeight: 120, resize: "vertical"}}
                        value={appSettings.emailBody || ""}
                        onChange={e => setAppSettings({...appSettings, emailBody: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {settingsTab === "campaigns" && (
                  <div style={S.card}>
                    <div style={S.cardTitle}><div style={S.dot} /> Configuration Campagnes Mailing</div>
                    <p style={{ color: C.gray, fontSize: 13, marginBottom: 24, marginTop: 0 }}>Configurez le Webhook dédié à l'envoi en masse (séquences d'emails) vers votre liste de contacts.</p>

                    <div style={S.fg}>
                      <label style={S.label}>URL du Webhook (Campagnes en masse)</label>
                      <input
                        style={S.input}
                        value={appSettings.campaignWebhookUrl || ""}
                        onChange={e => setAppSettings({...appSettings, campaignWebhookUrl: e.target.value})}
                        placeholder="https://hook.eu1.make.com/..."
                      />
                      <div style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>Ce webhook recevra un tableau d'identifiants ou d'emails pour déclencher votre scénario d'envoi en masse.</div>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => updateSettings(appSettings)}
                    style={S.btnP}
                  >
                    Enregistrer les paramètres
                  </button>
                </div>
              </div>
            </main>
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
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>Rapport Financier</div>
                </div>
                <nav style={{ display: "flex", gap: 8 }}>
                  {[["dashboard","Tableau de bord"],["create","Créer un rapport"]].map(([p,l]) => (
                    <button
                      key={p}
                      onClick={()=>{setRapportPage(p);if(p==="create")setStep(0);}}
                      style={{ background: rapportPage===p ? "rgba(105,33,2,0.06)" : "transparent", color: rapportPage===p ? C.accent : C.gray, border: "none", padding: "8px 16px", cursor: "pointer", fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif", fontSize: 13, fontWeight: rapportPage===p?700:500, borderRadius: "999px", transition: "0.2s" }}
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
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 16, opacity: 0.2 }}><rect x="3" y="3" width="18" height="18" stroke={C.accent} strokeWidth="1.5"/><line x1="7" y1="8" x2="17" y2="8" stroke={C.accent} strokeWidth="1"/><line x1="7" y1="12" x2="14" y2="12" stroke={C.accent} strokeWidth="1"/><line x1="7" y1="16" x2="11" y2="16" stroke={C.accent} strokeWidth="1"/></svg>
                    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 24, color: C.accent, marginBottom: 8 }}>Aucun rapport créé</div>
                    <p style={{ color: C.gray, fontSize: 13, marginBottom: 24, maxWidth: 380, margin: "0 auto 24px" }}>Commencez par créer votre premier rapport financier personnalisé.</p>
                    <button style={S.btnP} onClick={()=>{setRapportPage("create");resetForm();}}>+ Créer un rapport</button>
                  </div>
                ) : (
                  <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                      <div>
                        <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 28, fontWeight: 700, color: C.accent, margin: 0 }}>
                          {user?.email === ADMIN_EMAIL ? "Tous les rapports (Cabinet)" : "Mes rapports récents"}
                        </h2>
                        <p style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>
                          {user?.email === ADMIN_EMAIL
                            ? `Vue globale : ${reports.length} rapport(s) sur l'ensemble des agents.`
                            : `Vous avez ${reports.length} rapport${reports.length>1?"s":""} enregistré${reports.length>1?"s":""}.`}
                        </p>
                      </div>
                      <button style={S.btnP} onClick={()=>{setRapportPage("create");resetForm();}}>+ Nouveau rapport</button>
                    </div>

                    {[
                      { id: "swissquote", title: "Compte-titres" },
                      { id: "prevoyance", title: "Prévoyance (3A/3B)" },
                      { id: "lpp", title: "2ème Pilier LPP" },
                      { id: "assurance-vie", title: "Assurance Vie & PER" }
                    ].map(cat => {
                      const catReports = reports.filter(r => r.templateId === cat.id);
                      if (catReports.length === 0) return null;

                      return (
                        <div key={cat.id} style={{ marginBottom: 40 }}>
                          <h3 style={{ fontSize: 14, color: C.gray, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: `2px solid ${C.mediumGray}`, paddingBottom: 8, marginBottom: 20 }}>{cat.title}</h3>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
                            {catReports.map((r,i) => (
                              <div key={i} style={{ ...S.card, cursor: "pointer", position: "relative", overflow: "hidden", padding: "24px 28px", transition: "transform 0.2s" }} onClick={()=>setPreview(r)} onMouseEnter={(e)=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={(e)=>e.currentTarget.style.transform="translateY(0)"}>
                                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: C.goldUI }} />
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 4 }}>
                                  <div style={{ fontSize: 10, color: C.gray, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Dossier Client</div>
                                  {user?.email === ADMIN_EMAIL && (
                                    <div style={{ fontSize: 9, background: C.cardSoft, color: C.accent, padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>Agent: {r.agentEmail?.split('@')[0]}</div>
                                  )}
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: C.accent, marginBottom: 6 }}>{r.prenom} {(r.nom||"").toUpperCase()}</div>
                                <div style={{ fontSize: 13, color: C.darkGray, marginBottom: 16 }}>{r.profession} — {r.age} ans</div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: `1px solid ${C.lightGray}` }}>
                                  <div>
                                    <div style={{ fontSize: 10, color: C.gray, marginBottom: 2 }}>
                                      {r.templateId === "prevoyance" ? "Épargne simulée" : r.templateId === "lpp" ? "Libre Passage" : r.templateId === "assurance-vie" ? "Assurance Vie" : "Montant simulé"}
                                    </div>
                                    <div style={{ fontSize: 13, color: C.accent, fontWeight: 600 }}>
                                      {r.templateId === "prevoyance"
                                        ? `CHF ${fmt(r.capaciteEpargne || 500)}.-/mois`
                                        : r.templateId === "lpp"
                                        ? `CHF ${fmt(r.capitalLibrePassage || 120000)}.-`
                                        : `CHF ${fmt(r.montantInvestissement||100000)}.-`
                                      }
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "230px" }}>
                                    <button onClick={(e) => handleEditReport(e, r)} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, color: C.accent, padding: "6px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "0.2s", borderRadius: "999px", flex: "1 1 45%" }} onMouseEnter={e=>{e.currentTarget.style.background=C.accent;e.currentTarget.style.color=C.white;e.currentTarget.style.borderColor=C.accent}} onMouseLeave={e=>{e.currentTarget.style.background=C.white;e.currentTarget.style.color=C.accent;e.currentTarget.style.borderColor=C.mediumGray}}>ÉDITER</button>
                                    <button onClick={(e) => handleDeleteReport(e, r.id)} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, color: "#EF4444", padding: "6px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "0.2s", borderRadius: "999px", flex: "1 1 45%" }} onMouseEnter={e=>{e.currentTarget.style.background="#EF4444";e.currentTarget.style.color=C.white;e.currentTarget.style.borderColor="#EF4444"}} onMouseLeave={e=>{e.currentTarget.style.background=C.white;e.currentTarget.style.color="#EF4444";e.currentTarget.style.borderColor=C.mediumGray}}>SUPPRIMER</button>
                                    <button onClick={(e) => { e.stopPropagation(); setPreview({...r, _autoDownload: true}); }} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, color: C.accentDark, padding: "6px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "0.2s", borderRadius: "999px", flex: "1 1 45%" }} onMouseEnter={e=>{e.currentTarget.style.background=C.accentDark;e.currentTarget.style.color=C.white;e.currentTarget.style.borderColor=C.accentDark}} onMouseLeave={e=>{e.currentTarget.style.background=C.white;e.currentTarget.style.color=C.accentDark;e.currentTarget.style.borderColor=C.mediumGray}}>PDF</button>
                                    <button onClick={(e) => { e.stopPropagation(); setPreview(r); }} style={{ background: C.goldUI, border: `1px solid ${C.goldUI}`, color: C.white, padding: "6px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "0.2s", borderRadius: "999px", flex: "1 1 45%", display: "flex", justifyContent: "center", alignItems: "center" }} onMouseEnter={e=>{e.currentTarget.style.opacity=0.8}} onMouseLeave={e=>{e.currentTarget.style.opacity=1}}>APERÇU</button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {rapportPage === "create" && (
                <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>
                  <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif", fontSize: 28, fontWeight: 700, color: C.accent, margin: "0 0 4px" }}>Générateur de rapport</h2>
                  <p style={{ color: C.gray, fontSize: 13, marginBottom: 32 }}>Suivez les étapes pour configurer la proposition patrimoniale de votre client.</p>

                  <div style={{ display: "flex", gap: 4, marginBottom: 32, background: "transparent" }}>
                    {stepLabels.map((l,i) => (
                      <div key={i} onClick={()=>setStep(i)} style={{ flex: 1, textAlign: "center", padding: "12px 6px", fontSize: 11, fontWeight: step===i?700:600, color: step===i?C.white:step>i?C.accent:C.gray, background: step===i?C.accent:step>i?"rgba(105,33,2,0.06)":C.white, border: `1px solid ${step===i?C.accent:step>i?"rgba(105,33,2,0.1)":C.mediumGray}`, cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.2s", borderRadius: "10px", position: "relative" }}>
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

    {/* Toast Notification Globale */}
    {toastMsg && (
      <div style={{ position: "fixed", bottom: 40, right: 40, background: toastMsg.includes("Erreur") || toastMsg.includes("Veuillez") || toastMsg.includes("obligatoires") ? "#EF4444" : "#10B981", color: C.white, padding: "12px 24px", fontSize: 14, fontWeight: 600, boxShadow: "0 10px 25px rgba(0,0,0, 0.2)", zIndex: 3000, display: "flex", alignItems: "center", gap: 10, animation: "fadeIn 0.3s ease-out", borderRadius: 12 }}>
        <span style={{ fontSize: 18 }}>{toastMsg.includes("Erreur") || toastMsg.includes("Veuillez") || toastMsg.includes("obligatoires") ? "!" : "✓"}</span> {toastMsg}
      </div>
    )}
    <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>

    {preview && <ReportPreview data={preview} onClose={()=>setPreview(null)} onUpdateData={handlePreviewUpdate} appSettings={appSettings} onEdit={(e)=>{handleEditReport(e, preview); setPreview(null);}} onDelete={(e)=>{handleDeleteReport(e, preview.id); setPreview(null);}} />}
  </div>
);
}

// ────────────────────── ERROR BOUNDARY ──────────────────────
// Empêche l'écran noir : si un composant plante, on affiche l'erreur réelle.
class WSErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("WallSwiss crash:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "-apple-system, BlinkMacSystemFont, Inter, sans-serif", color: "#1D1D1F", background: "#FFFFFF", minHeight: "100vh", boxSizing: "border-box" }}>
          <h1 style={{ color: "#EA4335", fontSize: 22, margin: "0 0 8px" }}>⚠️ Une erreur est survenue au chargement</h1>
          <p style={{ color: "#6E6E73", fontSize: 14 }}>Copie ce détail technique pour le diagnostic :</p>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#F5F5F7", padding: 16, borderRadius: 12, fontSize: 12, color: "#B00020", border: "1px solid rgba(0,0,0,.1)" }}>
            {String(this.state.error && (this.state.error.stack || this.state.error.message || this.state.error))}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function WallSwissApp() {
  return (
    <WSErrorBoundary>
      <WallSwissAppMain />
    </WSErrorBoundary>
  );
}