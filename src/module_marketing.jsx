import React, { useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   HUB MARKETING LEADS (module autonome : module_marketing.jsx)
   Extrait de App.jsx : campagnes, scripts d'appel, guides de traitement.
   Connexion au parent via props :
     - user            : utilisateur Firebase (pour le chemin d'upload)
     - appSettings     : réglages de l'app (appSettings.marketingMedia)
     - onSaveSettings  : callback de sauvegarde des réglages (updateSettings)
     - onUploadImage   : callback d'upload Firebase Storage (handleImageUpload)
     - uploadingImage  : bool, upload en cours (affiche l'indicateur)
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Jetons de design (copie locale, identique à App.jsx) ── */
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

/* ── Icônes utilisées par le hub (copie locale) ── */
const Icons = {
  TrendUp: ({ size = 28, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
  Users: ({ size = 24, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Copy: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>,
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
  Layers: ({ size = 20, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
};

/* ── Données des campagnes ── */
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

export default function ModuleMarketing({ user, appSettings = {}, onSaveSettings, onUploadImage, uploadingImage = false }) {
  // --- STATE MARKETING MODULE ---
  const [marketingCampaign, setMarketingCampaign] = useState('3p-meta');
  const [marketingTab, setMarketingTab] = useState('context');
  const [marketingCopied, setMarketingCopied] = useState(false);
  const [compteChIdx, setCompteChIdx] = useState(0);
  const [isEditingMarketing, setIsEditingMarketing] = useState(false);

  const handleCopyScript = () => {
    const campaignData = CAMPAIGNS_DATA[marketingCampaign];
    const scriptText = `1. Introduction :\n${campaignData.scripts.intro}\n\n2. Transition :\n${campaignData.scripts.transition}\n\n3. Closing :\n${campaignData.scripts.closing}`;
    navigator.clipboard.writeText(scriptText);
    setMarketingCopied(true);
    setTimeout(() => setMarketingCopied(false), 2500);
  };

  const onMarketingMediaChange = async (file, mediaKey) => {
    if (!file || !onUploadImage) return;
    const url = await onUploadImage(file, `marketing/${user?.uid || 'global'}/${mediaKey}_${Date.now()}`);
    if (url && onSaveSettings) {
      const newSettings = { ...appSettings, marketingMedia: { ...(appSettings.marketingMedia || {}), [mediaKey]: url } };
      onSaveSettings(newSettings);
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

  return (
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
  );
}