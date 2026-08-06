// ============================================================
// ANNUAIRE PARTENAIRES — Coordonnées des institutions
// Module séparé : mettre à jour les contacts ici, sans toucher App.jsx.
// Dernière mise à jour : 05/08/2026 (coordonnées corrigées)
// ============================================================

// Contacts individuels des conseillers (ParFinance / NS Partner's).
// En attente de la validation de Pierrick : passer ce flag à true
// pour afficher les conseillers dans l'annuaire.
export const AFFICHER_CONTACTS_CONSEILLERS = false;

export const ANNUAIRE_PARTENAIRES = [
  {
    nom: "Swissquote",
    type: "Banque",
    contact: "Desk B2B / Trading",
    tel: "+41 58 721 90 35",
    email: "Institutional@swissquote.ch",
    url: "https://trade.swissquote.ch/my.policy",
    note: "Protocole de trading + portefeuilles modèles.",
  },
  {
    nom: "PARfinance",
    type: "Asset Management",
    contact: "Desk Gestion",
    tel: "+41 22 989 55 55",
    url: "https://www.parfinance.ch/",
    note: "Mandats Dynamique · Équilibre · Conservateur.",
    conseillers: [
      { nom: "Benjamin", email: "bhb@opfi.com" },
      { nom: "David", email: "dhg@opfi.com", tel: "+41 22 989 55 55" },
    ],
  },
  {
    nom: "NS Partners",
    type: "Asset Management",
    contact: "Relation Partenaires",
    tel: "+41 22 906 52 50",
    url: "https://nspartners.com/",
    note: "Swiss Excellence DPM · DGC Stock Selection · DGC Energy.",
    conseillers: [
      { nom: "Alexis Peytre", email: "Alexis.PEYTRE@nspgroup.com", tel: "+41 79 436 56 60" },
    ],
  },
  {
    nom: "Altaroc",
    type: "Private Equity",
    contact: "Relation Partenaires",
    url: "https://altaroc.com/",
    note: "Millésimes Private Equity.",
  },
  {
    nom: "Alpin Capital",
    type: "Crypto-monnaie",
    contact: "Desk Crypto-actifs",
  },
  {
    nom: "Liechtenstein Life",
    type: "Prévoyance individuelle (3P)",
    contact: "Support Courtier",
    tel: "+423 265 35 01",
    email: "brokers@liechtensteinlife.com",
    url: "https://partner.life.li/fr/my/dashboard",
    note: "3ᵉ pilier. Protocole de reprise FINMA (voir Procédures).",
  },
  {
    nom: "Lemania",
    type: "Libre passage (LPP)",
    contact: "Administration",
    tel: "+41 58 822 18 18",
    email: "info@hublemania.ch",
    url: "https://www.hublemania.ch/",
    note: "NS Golden Age Balanced · LPFX Mirabaud.",
  },
  {
    nom: "Pictet",
    type: "Libre passage (LPP)",
    contact: "Service LPP",
    tel: "+41 58 323 29 60",
    email: "pictetfoundations@pictet.com",
    url: "https://www.am.pictet/",
    note: "Pictet LPP 40 · LPP 60.",
  },
  {
    nom: "Liberty",
    type: "Libre passage (LPP)",
    contact: "Fondation Liberty",
    url: "https://www.liberty.ch/",
  },
  {
    nom: "UAF Life Patrimoine",
    type: "Assurance vie France",
    contact: "Courtage assurance vie",
  },
];
