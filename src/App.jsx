import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithCustomToken, signInAnonymously, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, updateDoc, onSnapshot, addDoc, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

const C = {
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
const APP_VERSION = "v2.1.0 (Secured)";

const CAMPAIGNS_DATA = {
  '3p-meta': {
      id: '3p-meta',
      name: '3P Meta',
      title: 'Leads 3P (Optimisation)',
      subtitle: 'Campagne : "Aide Suisse - Optimisation Fiscale"',
      scripts: {
          intro: "« Bonjour [Prénom], c'est [Votre Prénom], je suis partenaire de Aide Suisse. Je vous contacte car nous avons bien reçu votre demande effectuée sur Facebook et/ou Instagram par rapport à la simulation pour la récupération des 4'800 CHF d'impôts sur Genève. Je vous appelle simplement pour vous communiquer les résultats de votre test d'éligibilité. Vous avez 2 minutes ? »",
          transition: "« Bonne nouvelle, votre profil montre un potentiel d'économie intéressant. Afin de mieux comprendre votre situation, j'aurais besoin de valider quelques points avec vous sur votre contexte professionnel et personnel actuel (Imposé à la source ? 3ème pilier ? Famille ?). »",
          closing: "« C’est très clair. Pour vous donner un chiffre final et surtout voir s'il y a des leviers intéressants pour optimiser votre situation, il est nécessaire de fixer un rendez-vous téléphonique pour une évaluation complète. On bloque un créneau ensemble pour ce rendez-vous demain soir ou jeudi midi ? »"
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
          closing: "« C’est très clair. Comme expliqué dans la vidéo, notre service s'occupe de toute la paperasse pour retrouver cet argent. Pour lancer la recherche 100% sécurisée, je vous propose de prendre un rendez-vous téléphonique d'une dizaine de minutes. Qu'est-ce qui vous arrange pour ce rendez-vous, demain soir ou jeudi midi ? »"
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
  }
];

const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

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

// ────────────────────── FORMULAIRE LPP OFFICIEL ──────────────────────

const lppColors = { 
  blue: "#1a4674", 
  bg: "#fefce8", 
  border: "#cbd5e1",
  text: "#334155"
};

const LppFormField = ({ label, value, sublabel, height = 30 }) => (
  <div style={{ display: "flex", marginBottom: 6, alignItems: "flex-start", width: "100%" }}>
    <div style={{ width: 220, fontSize: 12, color: lppColors.blue, fontWeight: "bold", paddingTop: 6, paddingRight: 10 }}>{label}</div>
    <div style={{ flex: 1 }}>
      <div style={{ width: "100%", minHeight: height, background: lppColors.bg, border: `1px solid ${lppColors.border}`, padding: "6px 8px", fontSize: 14, color: "#000", boxSizing: "border-box", display: "flex", alignItems: "flex-start", whiteSpace: "pre-wrap", fontFamily: "Arial, sans-serif" }}>
        {value}
      </div>
      {sublabel && <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{sublabel}</div>}
    </div>
  </div>
);

const LppOfficialPage1 = ({ data }) => (
  <div style={{ width: "100%", height: "100%", position: "relative" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, borderBottom: `2px solid ${lppColors.blue}`, paddingBottom: 15 }}>
       <div style={{ flex: 1 }}>
         <h1 style={{ margin: 0, fontSize: 15, color: lppColors.blue, fontWeight: "bold" }}>Fonds de garantie LPP</h1>
         <h2 style={{ margin: "16px 0", fontSize: 24, color: lppColors.blue, lineHeight: 1.2 }}>Recherche d'avoirs<br/>de la prévoyance professionnelle</h2>
         <h3 style={{ margin: 0, fontSize: 16, color: lppColors.blue, fontWeight: "bold" }}>Centrale du 2ème pilier</h3>
       </div>
       <div style={{ width: 240, display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right" }}>
         <div style={{ border: "1px solid #000", padding: "10px 15px", fontSize: 12, textAlign: "left", width: "100%", boxSizing: "border-box" }}>
           <strong>Centrale du 2ème pilier</strong><br/>
           Fonds de garantie LPP<br/>
           Organe de direction<br/>
           Case postale 1023<br/>
           3000 Berne 14
         </div>
         <div style={{ marginTop: 20, fontSize: 14, fontWeight: "bold", color: lppColors.blue, textAlign: "right" }}>
           Formulaire de demande<br/>SF-F5-FR
         </div>
         <div style={{ marginTop: 8, fontSize: 12, color: lppColors.blue }}>Page 1/3</div>
       </div>
    </div>
    
    <div style={{ background: "#f1f5f9", padding: "12px 16px", marginBottom: 24, fontSize: 12, border: "1px solid #e2e8f0", lineHeight: 1.5 }}>
      Un seul questionnaire par personne doit être envoyé. Pour que la demande d'une tierce<br/>
      personne soit prise en considération. Veuillez joindre une copie de la procuration.<br/>
      Veuillez lire l'aide-mémoire avant de compléter le présent questionnaire. Merci.
    </div>

    <div style={{ display: "flex", marginBottom: 32, alignItems: "flex-start" }}>
      <div style={{ width: 220, fontWeight: "bold", color: lppColors.blue, fontSize: 13 }}>La demande concerne<br/><span style={{fontSize: 10, fontWeight: "normal"}}>Cas particuliers</span></div>
      <div style={{ flex: 1 }}>
         <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 14, height: 14, border: "1px solid #000", background: "#fff" }}></div> moi-même (seulement pages 1 et 2)</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 14, height: 14, border: "1px solid #000", background: "#fff" }}></div> une procédure de divorce</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 14, height: 14, border: "1px solid #000", display: "flex", alignItems: "center", justifyContent: "center", background: lppColors.bg }}><strong>X</strong></div> une autre personne</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 14, height: 14, border: "1px solid #000", background: "#fff" }}></div> un décès (remplir aussi la page 3)</div>
         </div>
      </div>
    </div>

    <h3 style={{ fontSize: 14, color: lppColors.blue, borderBottom: `1px solid ${lppColors.blue}`, paddingBottom: 4, marginBottom: 16 }}>1. Informations de la personne pour laquelle des avoirs sont recherchés</h3>
    
    <LppFormField label="Nom" value={data.nom} />
    <LppFormField label="Autre(s) nom(s)" value="" sublabel="Veuillez séparer les noms par le signe « / »." />
    <LppFormField label="Prénom" value={data.prenom} />
    <LppFormField label="Autre(s) prénom(s)" value="" sublabel="Veuillez séparer les prénoms par un signe « / »." />
    <LppFormField label="Date de naissance" value={data.dateNaissance} />
    <LppFormField label="N° AVS" value={data.avs} />
    <LppFormField label="Adresse" value={`${data.adresse || ""}\n${data.localite || ""}\n${data.pays || ""}`.trim()} height={60} />
    <LppFormField label="Numéro de téléphone / e-mail" value={`${data.telephone || ""} ${data.telephone && data.emailClient ? " / " : ""} ${data.emailClient || ""}`} sublabel="(en cas de questions)" />
  </div>
);

const LppOfficialPage2 = ({ data }) => (
  <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, borderBottom: `2px solid ${lppColors.blue}`, paddingBottom: 15 }}>
       <div>
         <h1 style={{ margin: 0, fontSize: 16, color: lppColors.blue, fontWeight: "bold" }}>Fonds de garantie LPP</h1>
         <h3 style={{ margin: "4px 0 0", fontSize: 15, color: lppColors.blue, fontWeight: "normal" }}>Centrale du 2ème pilier</h3>
       </div>
       <div style={{ textAlign: "right" }}>
         <div style={{ fontSize: 14, fontWeight: "bold", color: lppColors.blue }}>Formulaire de demande SF-F5-FR</div>
         <div style={{ fontSize: 12, color: lppColors.blue, marginTop: 4 }}>Page 2/3</div>
       </div>
    </div>

    <h3 style={{ fontSize: 14, color: lppColors.blue, borderBottom: `1px solid ${lppColors.blue}`, paddingBottom: 4, marginBottom: 16 }}>2. Remarques</h3>
    <div style={{ width: "100%", height: 120, background: lppColors.bg, border: `1px solid ${lppColors.border}`, marginBottom: 24 }}></div>
    
    <div style={{ fontSize: 12, marginBottom: 40, display: "flex", gap: 12, alignItems: "flex-start", background: "#f8fafc", padding: 16, border: "1px solid #e2e8f0" }}>
      <div style={{ fontSize: 24, color: lppColors.blue, fontWeight: "bold", lineHeight: 0.8 }}>+</div>
      <div style={{ lineHeight: 1.5 }}>Il n'est pas obligatoire de joindre les copies de documents concernant les rapports de travail (feuilles de salaires, etc.) ou les assurances (certificat AVS, certificat du 2ème pilier, extrait de compte individuel AVS). Les copies de ces documents peuvent faciliter des vérifications plus poussées si une première recherche n'aboutit pas. Important: ne pas envoyer d'originaux. Il n'est pas nécessaire de faire certifier conformes les copies.</div>
    </div>

    <h3 style={{ fontSize: 14, color: lppColors.blue, borderBottom: `1px solid ${lppColors.blue}`, paddingBottom: 4, marginBottom: 16 }}>3. Confirmation de la personne qui fait la demande</h3>
    <p style={{ marginBottom: 24, fontSize: 13 }}>La personne qui fait la demande confirme que les renseignements fournis ci-dessus sont corrects.</p>

    <div style={{ display: "flex", gap: 24, marginBottom: 40 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, marginBottom: 6, color: lppColors.blue, fontWeight: "bold" }}>Lieu et date</div>
        <div style={{ width: "100%", height: 35, background: lppColors.bg, border: `1px solid ${lppColors.border}`, display: "flex", alignItems: "center", padding: "0 10px", fontSize: 14 }}>
          {data.cpaVilleEntreprise || ""}, le {new Date().toLocaleDateString('fr-CH')}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, marginBottom: 6, color: lppColors.blue, fontWeight: "bold" }}>Signature du demandeur ({data.nomEntreprise || "Mandataire"})</div>
        <div style={{ width: "100%", height: 80, background: lppColors.bg, border: `1px solid ${lppColors.border}` }}></div>
      </div>
    </div>

    <div style={{ marginTop: "auto", borderTop: "1px solid #CBD5E1", paddingTop: 16, fontSize: 11, display: "flex", gap: 32, lineHeight: 1.5 }}>
      <div style={{ flex: 1 }}>
        <strong style={{ color: lppColors.blue, fontSize: 12 }}>Annexes</strong><br/><br/>
        La copie d'un passeport ou d'une carte d'identité jointe à la demande nous permet de retranscrire plus facilement les données personnelles correctes.<br/><br/>
        Si cette demande est faite pour une autre personne, il est obligatoire de joindre la copie de la procuration (la procuration ne doit pas dater de plus d'une année). Exception: communication des données conformément à l'art. 86a LPP.
      </div>
      <div style={{ flex: 1 }}>
        Le présent questionnaire doit être renvoyé à:<br/><br/>
        <strong style={{ fontSize: 12 }}>Centrale du 2ème pilier</strong><br/>
        Fonds de garantie LPP<br/>
        Organe de direction<br/>
        Case postale 1023<br/>
        3000 Berne 14<br/><br/>
        T +41 31 380 79 75 (aucun renseignement sur les avoirs n'est donné par téléphone)<br/>
        E-mail: info@zentralstelle.ch
      </div>
    </div>
  </div>
);

const ProcurationLPP = ({ data }) => (
  <div style={{ width: "100%", height: "100%", position: "relative" }}>
     <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 50 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 15 }}>Mandataire</div>
          <div><strong>{data.nomEntreprise || "WallSwiss"}</strong></div>
          <div>{data.adresseEntreprise || "Rue"}</div>
          <div>{data.cpaVilleEntreprise || "CPA Ville"}</div>
          <div>{data.emailEntreprise || "contact@email.com"}</div>
        </div>
        <div style={{ textAlign: "right", marginTop: 20 }}>
          <div>Genève, le {new Date().toLocaleDateString('fr-CH')}</div>
          <br/>
          <div style={{ textAlign: "left", display: "inline-block", marginTop: 20 }}>
            <strong>À l'attention de :</strong><br/>
            Stiftung Auffangeinrichtung BVG<br/>
            Elias-Canetti-Strasse 2<br/>
            8050 Zürich
          </div>
        </div>
     </div>

     <h3 style={{ fontSize: 22, fontWeight: "bold", textDecoration: "underline", marginBottom: 40, textAlign: "center" }}>PROCURATION</h3>
     
     <div style={{ textAlign: "justify", lineHeight: 1.8, fontSize: 14 }}>
       <p>Madame, Monsieur,</p>
       <p>Je soussigné(e), <strong>{data.nom || "________________"} {data.prenom || "________________"}</strong>, né(e) le <strong>{data.dateNaissance || "________________"}</strong> et demeurant à <strong>{data.adresse || "________________"}, {data.localite || "________________"}</strong>,</p>
       
       <p>Autorise par la présente la société <strong>{data.nomEntreprise || "________________"}</strong>, domiciliée à <strong>{data.adresseEntreprise || "________________"}, {data.cpaVilleEntreprise || "________________"}</strong>, à me représenter auprès de vos services afin d'effectuer toute demande de recherche d'avoirs de 2ème pilier.</p>
       
       <p>J’autorise la société <strong>{data.nomEntreprise || "________________"}</strong> à vous faire cette demande par courrier ou courrier électronique et assume les éventuels risques qui en découlent. Je vous autorise expressément à communiquer directement les résultats de la recherche à mon mandataire, la société <strong>{data.nomEntreprise || "________________"}</strong>, par courrier ou courriel ({data.emailEntreprise || "________________"}).</p>
       
       <p>Cette procuration n’est valide que pour la présente demande et la réception des résultats qui en découlent. Elle devient ensuite caduque.</p>
       
       <p>Pour tout litige en rapport avec la présente procuration, le for juridique est {data.cpaVilleEntreprise?.replace(/[0-9]/g, '').trim() || "Genève"} et seul le droit suisse est applicable.</p>
       
       <p>Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p>
     </div>

     <div style={{ marginTop: 80, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
       <div style={{ fontSize: 14 }}>Fait pour valoir ce que de droit.<br/><br/>Date et Lieu : _____________________</div>
       <div style={{ border: "2px dashed #cbd5e1", padding: "40px 80px", color: "#94a3b8", textAlign: "center", borderRadius: 8 }}>
         Signature du client :<br/><br/><br/><br/>
         ___________________________
       </div>
     </div>
  </div>
);

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
          <button onClick={onEdit} style={{ background: "rgba(255,255,255,0.1)", color: C.white, border: "none", padding: "6px 12px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 10, fontWeight: 600, borderRadius: "0px", transition: "0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.2)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
            PARAMÉTRAGE
          </button>
          <button onClick={() => setEditMode(!editMode)} style={{ background: editMode ? C.gold : "transparent", border: `1px solid ${editMode ? C.gold : "rgba(255,255,255,0.3)"}`, color: C.white, padding: "6px 12px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 10, fontWeight: 600, borderRadius: "0px", transition: "0.2s" }}>
            {editMode ? "TERMINER TEXTES" : "TEXTES LIBRES"}
          </button>
          <button onClick={toggleHideSlide} style={{ background: isCurrentHidden ? "rgba(239,68,68,0.2)" : "transparent", color: isCurrentHidden ? "#FCA5A5" : C.white, border: `1px solid ${isCurrentHidden ? "rgba(252,165,165,0.3)" : "rgba(255,255,255,0.3)"}`, padding: "6px 12px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 10, fontWeight: 600, borderRadius: "0px", transition: "0.2s" }}>
            {isCurrentHidden ? "RÉAFFICHER" : "MASQUER SLIDE"}
          </button>
          <button onClick={onDelete} style={{ background: "transparent", color: "#FCA5A5", border: "1px solid rgba(252,165,165,0.3)", padding: "6px 12px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 10, fontWeight: 600, borderRadius: "0px", transition: "0.2s" }} onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,0.2)";e.currentTarget.style.color="#FFF"}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#FCA5A5"}}>
            SUPPRIMER
          </button>
          
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.2)", margin: "0 4px" }} />
          
          <button onClick={handleDownloadPDF} disabled={isPdfLoading || isEmailing} style={{ background: C.white, color: C.primaryDark, border: "none", padding: "6px 12px", cursor: (isPdfLoading || isEmailing) ? "wait" : "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 10, fontWeight: 700, borderRadius: "0px", opacity: (isPdfLoading || isEmailing) ? 0.7 : 1, transition: "0.2s" }}>
            {isPdfLoading ? "GÉNÉRATION..." : "TÉLÉCHARGER PDF"}
          </button>
          <button onClick={openEmailModal} disabled={isPdfLoading || isEmailing} style={{ background: emailSuccess ? "#10B981" : C.gold, color: C.white, border: "none", padding: "6px 12px", cursor: (isPdfLoading || isEmailing) ? "wait" : "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 10, fontWeight: 700, borderRadius: "0px", opacity: (isPdfLoading || isEmailing) ? 0.7 : 1, transition: "0.2s" }}>
            {isEmailing ? "ENVOI..." : emailSuccess ? "ENVOYÉ !" : "EMAIL"}
          </button>
          
          <span style={{ color: C.gold, fontSize: 11, marginLeft: 4 }}>{currentSlide + 1} / {slides.length}</span>
          <button onClick={onClose} style={{ background: "transparent", color: C.gray, border: "none", padding: "6px 12px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 11, fontWeight: 600 }}>FERMER ✕</button>
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
            <div key={i} onClick={() => setCurrentSlide(i)} style={{ width: 48, height: 28, background: i === currentSlide ? C.primary : "rgba(255,255,255,0.06)", border: i === currentSlide ? `1px solid ${C.gold}` : "1px solid rgba(255,255,255,0.04)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: i === currentSlide ? C.white : isHid ? "#EF4444" : "rgba(255,255,255,0.35)", fontWeight: 600, flexShrink: 0, textDecoration: isHid ? "line-through" : "none" }}>
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
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 32, fontWeight: 700, color: C.primary, marginBottom: 16 }}>
            Génération du rapport en cours...
          </div>
          <div style={{ fontSize: 13, color: C.gray, fontWeight: 500, fontFamily: "'Montserrat', sans-serif" }}>
            Veuillez patienter pendant la capture haute définition...
          </div>
        </div>
      )}
      {isEmailing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.95)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 32, fontWeight: 700, color: C.primary, marginBottom: 16 }}>
            Envoi de l'email en cours...
          </div>
          <div style={{ fontSize: 13, color: C.gray, fontWeight: 500, fontFamily: "'Montserrat', sans-serif" }}>
            Connexion à l'automatisation Make.com...
          </div>
        </div>
      )}

      {showEmailModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.white, width: 500, padding: 32, borderRadius: "0px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, color: C.primary, marginTop: 0, marginBottom: 24 }}>Envoyer le rapport par email</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.gray, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" }}>Email destinataire</label>
              <input style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.mediumGray}`, fontSize: 13, fontFamily: "'Montserrat', sans-serif", boxSizing: "border-box", outline: "none" }} value={emailForm.to} onChange={e=>setEmailForm({...emailForm, to: e.target.value})} placeholder="client@email.com" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.gray, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" }}>Objet</label>
              <input style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.mediumGray}`, fontSize: 13, fontFamily: "'Montserrat', sans-serif", boxSizing: "border-box", outline: "none" }} value={emailForm.subject} onChange={e=>setEmailForm({...emailForm, subject: e.target.value})} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.gray, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" }}>Message</label>
              <textarea style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.mediumGray}`, fontSize: 13, fontFamily: "'Montserrat', sans-serif", boxSizing: "border-box", outline: "none", minHeight: 140, resize: "vertical" }} value={emailForm.body} onChange={e=>setEmailForm({...emailForm, body: e.target.value})} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => setShowEmailModal(false)} style={{ background: "transparent", color: C.gray, border: `1px solid ${C.mediumGray}`, padding: "10px 20px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 600 }}>Annuler</button>
              <button onClick={handleConfirmEmail} style={{ background: C.primary, color: C.white, border: "none", padding: "10px 20px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 600 }}>Confirmer l'envoi</button>
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

const S = {
  label: { display: "block", fontSize: 11, fontWeight: 600, color: C.gray, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" },
  input: { width: "100%", padding: "10px 12px", border: `1.5px solid ${C.mediumGray}`, fontSize: 13, fontFamily: "'Montserrat', sans-serif", color: C.black, background: C.white, outline: "none", boxSizing: "border-box", borderRadius: "0px" },
  select: { width: "100%", padding: "10px 12px", border: `1.5px solid ${C.mediumGray}`, fontSize: 13, fontFamily: "'Montserrat', sans-serif", color: C.black, background: C.white, outline: "none", cursor: "pointer", boxSizing: "border-box", borderRadius: "0px" },
  fg: { marginBottom: 16 },
  card: { background: C.white, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", border: `1px solid ${C.mediumGray}`, borderRadius: "0px" },
  cardTitle: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.primary, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 },
  dot: { width: 8, height: 2, background: C.gold, flexShrink: 0 },
  btnP: { background: C.primary, color: C.white, border: "none", padding: "12px 28px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", borderRadius: "0px" },
  btnS: { background: C.white, color: C.primary, border: `2px solid ${C.primary}`, padding: "10px 24px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 600, borderRadius: "0px" },
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

export default function WallSwissApp() {
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
  const [rapportPage, setRapportPage] = useState("dashboard"); 
  const [step, setStep] = useState(0);

  const [user, setUser] = useState(null);
  const [userStatus, setUserStatus] = useState(null); // 'pending' ou 'approved'
  const [authLoading, setAuthLoading] = useState(true);
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

  const requirePdfLib = async () => {
    if (window.PDFLib) return window.PDFLib;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
      script.onload = () => resolve(window.PDFLib);
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  const requireHtml2Canvas = async () => {
    if (window.html2canvas) return window.html2canvas;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = () => resolve(window.html2canvas);
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  const generateLppPdfBase64 = async () => {
    const { PDFDocument, rgb, StandardFonts } = await requirePdfLib();
    
    // Téléchargement du PDF officiel vierge sauvegardé (ou local par défaut)
    const templatePath = appSettings.lppOfficialTemplatePdf || "/SF-F5-FR.pdf";
    const templateRes = await fetch(templatePath);
    const existingPdfBytes = await templateRes.arrayBuffer();
    
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const page1 = pages[0];
    const page2 = pages.length > 1 ? pages[1] : null;

    const draw = (page, text, x, y, size = 11) => {
      if(!page || !text) return;
      page.drawText(String(text), { x, y, size, font: helveticaFont, color: rgb(0,0,0) });
    };

    // PAGE 1 : Coordonnées approximatives pour le document SF-F5-FR
    draw(page1, "X", 65, 520, 14); // Case "Une autre personne"
    draw(page1, lppForm.nom, 230, 475);
    draw(page1, lppForm.prenom, 230, 420);
    draw(page1, lppForm.dateNaissance, 230, 365);
    draw(page1, lppForm.avs, 230, 335);
    draw(page1, lppForm.adresse, 230, 285);
    draw(page1, `${lppForm.localite} - ${lppForm.pays}`, 230, 265);
    draw(page1, `${lppForm.telephone} / ${lppForm.emailClient}`, 230, 185);

    // PAGE 2
    if (page2) {
      const lieuDate = `${lppForm.cpaVilleEntreprise || "Genève"}, le ${new Date().toLocaleDateString('fr-CH')}`;
      draw(page2, lieuDate, 65, 410);
      draw(page2, lppForm.nomEntreprise || "Mandataire", 310, 410);
    }

    // PAGE 3 : PROCURATION
    const h2c = await requireHtml2Canvas();
    const procElement = document.getElementById('procuration-printable');
    
    // Assurer que l'élément est capturable
    const prevDisplay = procElement.style.display;
    procElement.style.display = 'block';
    const canvas = await h2c(procElement, { scale: 2, useCORS: true, logging: false });
    procElement.style.display = prevDisplay;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const jpgImage = await pdfDoc.embedJpg(imgData);
    
    // Ajout d'une nouvelle page A4 (595x842) à la fin du document officiel
    const page3 = pdfDoc.addPage([595, 842]);
    page3.drawImage(jpgImage, { x: 0, y: 0, width: 595, height: 842 });

    return await pdfDoc.saveAsBase64({ dataUri: true });
  };

  const handleDownloadLppDoc = async () => {
    setIsGeneratingLpp(true);
    try {
      const pdfBase64 = await generateLppPdfBase64();
      const link = document.createElement('a');
      link.href = pdfBase64;
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
      const rawPdfBase64 = await generateLppPdfBase64();
      const pureBase64 = rawPdfBase64.includes('base64,') ? rawPdfBase64.substring(rawPdfBase64.indexOf('base64,') + 7) : rawPdfBase64;

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

      setToastMsg("Document envoyé avec succès à Yousign !");
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
    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch(e) {
        console.error("Auth error", e);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        if (!u.email) u.email = ADMIN_EMAIL; // Force l'accès admin pour l'utilisateur anonyme
        setUser(u);
      } else {
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

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
      lppOfficialTemplatePdf: "/SF-F5-FR.pdf",
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
            <label style={{ background: C.primary, color: C.white, padding: "8px 16px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", gap: 8, alignItems: "center", transition: "0.2s" }} onMouseEnter={e=>e.currentTarget.style.opacity=0.9} onMouseLeave={e=>e.currentTarget.style.opacity=1}>
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
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.white, flexDirection: "column", fontFamily: "'Montserrat', sans-serif", zIndex: 9999 }}>
        <div style={{ background: C.primary, width: "72px", height: "72px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0px", marginBottom: 24 }}>
          <img src={LOGO_URL} alt="WallSwiss" style={{ width: "40px", height: "40px", objectFit: "contain" }} />
        </div>
        <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, color: C.primary, margin: "0 0 8px 0" }}>WallSwiss</h2>
        <div style={{ color: C.gray, fontSize: 13, fontWeight: 500, letterSpacing: "0.05em" }}>Authentification en cours...</div>
      </div>
    );
  }

  // Ecran d'attente d'approbation
  if (false && userStatus === 'pending' && user.email !== ADMIN_EMAIL) { // ⚠️ BLOQUAGE DÉSACTIVÉ TEMPORAIREMENT
    return (
      <div style={{ display: "flex", height: "100vh", width: "100vw", alignItems: "center", justifyContent: "center", background: C.lightGray, fontFamily: "'Montserrat', sans-serif" }}>
        <div style={{ background: C.white, padding: "48px", width: "100%", maxWidth: "500px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, color: C.primary, marginBottom: 8, marginTop: 0 }}>Compte en attente</h2>
          <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
            Votre compte a bien été créé, mais il nécessite l'approbation d'un administrateur avant de pouvoir accéder à l'outil de génération de rapports.
          </p>
          <div style={{ background: "rgba(105,33,2,0.05)", padding: "16px", color: C.primaryDark, fontSize: 12, fontWeight: 600, marginBottom: 32 }}>
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
              <div key={tpl.id} onClick={() => tpl.active && u("templateId", tpl.id)} style={{ border: `2px solid ${form.templateId === tpl.id ? C.primary : C.mediumGray}`, padding: 20, cursor: tpl.active ? "pointer" : "not-allowed", opacity: tpl.active ? 1 : 0.5, background: form.templateId === tpl.id ? "rgba(105,33,2,0.04)" : C.white, display: "flex", flexDirection: "column", gap: 8, borderRadius: "0px" }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "rgba(165,149,104,0.05)", padding: 12, border: `1px dashed ${C.gold}`, marginBottom: 16 }}>
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
            
            <div style={{ height: 1, background: C.mediumGray, margin: "16px 0" }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 8, textTransform: "uppercase" }}>Informations personnalisées supplémentaires</div>
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
          <p style={{ fontSize: 12, color: C.gray, marginBottom: 16, marginTop: 0 }}>Sélectionnez les objectifs correspondant à la situation de votre client.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {defObj.map(obj => {
              const active = form.objectifs.includes(obj);
              return (
                <div key={obj} onClick={()=>toggleObj(obj)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: `1.5px solid ${active ? C.primary : C.mediumGray}`, background: active ? "rgba(105,33,2,0.04)" : "transparent", cursor: "pointer", fontSize: 12, fontWeight: 500, borderRadius: "0px" }}>
                  <div style={{ width: 16, height: 16, border: `2px solid ${active ? C.primary : C.mediumGray}`, background: active ? C.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: "0px" }}>
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
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 10px", background: "rgba(105,33,2,0.06)", color: C.primary, fontSize: 11, fontWeight: 600, borderRadius: "0px" }}>
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
                  <label style={{...S.label, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 8, color: C.primary}}>
                    <input type="checkbox" checked={form.optiFiscale} onChange={e=>u("optiFiscale",e.target.checked)} style={{width: 16, height: 16}} /> 
                    Inclure la slide Optimisation Fiscale (3A)
                  </label>
                </div>
                <div style={S.fg}>
                  <label style={{...S.label, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 8, color: C.primary}}>
                    <input type="checkbox" checked={form.showPrevoyanceComparatif !== false} onChange={e=>u("showPrevoyanceComparatif",e.target.checked)} style={{width: 16, height: 16}} /> 
                    Inclure la slide Comparatif Banque / Assurance
                  </label>
                </div>
                
                <div style={{ height: 1, background: C.mediumGray, margin: "16px 0" }} />
                
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
                
                <div style={{ height: 1, background: C.mediumGray, margin: "16px 0" }} />
                
                <div style={S.fg}><label style={S.label}>Taux de rendement cible net (%)</label><input style={S.input} type="number" step="0.5" value={form.tauxClp} onChange={e=>u("tauxClp",e.target.value)} placeholder="4.5"/></div>
                <div style={S.fg}><label style={S.label}>Droits d'entrée (%)</label><input style={S.input} type="number" step="0.5" value={form.fraisSouscriptionLpp} onChange={e=>u("fraisSouscriptionLpp",e.target.value)} placeholder="1"/></div>
                <div style={S.fg}>
                  <label style={S.label}>Profil de risque (Libre Passage)</label>
                  <select style={S.select} value={form.profilRisque} onChange={e=>u("profilRisque",e.target.value)}>
                    {["Prudent", "Équilibré", "Dynamique", "Offensif"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                
                <div style={{ height: 1, background: C.mediumGray, margin: "16px 0" }} />
                <div style={{ marginBottom: 12, color: C.primary, fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>Allocation d'actifs personnalisée (%)</div>
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
                  <label style={{...S.label, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 8, color: C.primary}}>
                    <input type="checkbox" checked={form.hasProjectionsMultiples} onChange={e=>u("hasProjectionsMultiples",e.target.checked)} style={{width: 16, height: 16}} /> 
                    Ajouter une 2ème simulation (Scénario 2)
                  </label>
                </div>
                {form.hasProjectionsMultiples && (
                  <div style={{ background: "rgba(105,33,2,0.04)", padding: 16, marginBottom: 16, borderLeft: `3px solid ${C.primary}` }}>
                    <div style={S.fg}><label style={S.label}>Versement initial 2 (€)</label><input style={S.input} type="number" value={form.montantInvestissement2} onChange={e=>u("montantInvestissement2",e.target.value)}/></div>
                    <div style={{...S.fg, margin: 0}}><label style={S.label}>Mensualité 2 (€)</label><input style={S.input} type="number" value={form.capaciteEpargne2} onChange={e=>u("capaciteEpargne2",e.target.value)}/></div>
                  </div>
                )}
                
                <div style={{ height: 1, background: C.mediumGray, margin: "16px 0" }} />
                
                <div style={S.fg}><label style={S.label}>Droits d'entrée sur versements (%)</label><input style={S.input} type="number" step="0.5" value={form.fraisSouscription} onChange={e=>u("fraisSouscription",e.target.value)}/></div>
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
                
                <div style={{ height: 1, background: C.mediumGray, margin: "16px 0" }} />
                
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
              <div style={{ padding: 20, background: C.lightGray, color: C.darkGray, fontSize: 13, lineHeight: 1.6, textAlign: "center" }}>
                La projection financière du Libre Passage s'appuie sur le <strong>Profil de risque</strong> choisi.<br/><br/>
                La comparaison se fera automatiquement entre une rémunération classique (compte de fondation) et l'investissement sur les marchés.
              </div>
            ) : (
              <>
                <div style={S.fg}><label style={S.label}>Taux cible 1 (%)</label><input style={S.input} type="number" step="0.5" value={form.tauxPessimiste} onChange={e=>u("tauxPessimiste",e.target.value)}/></div>
                <div style={S.fg}><label style={S.label}>Taux cible 2 (%)</label><input style={S.input} type="number" step="0.5" value={form.tauxRealiste} onChange={e=>u("tauxRealiste",e.target.value)}/></div>
                <div style={S.fg}><label style={S.label}>Taux cible 3 (%)</label><input style={S.input} type="number" step="0.5" value={form.tauxOptimiste} onChange={e=>u("tauxOptimiste",e.target.value)}/></div>
                <div style={{ background: C.lightGray, padding: 14, marginTop: 16, borderRadius: "0px" }}>
                  <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>Montant net initial investi</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>{form.templateId === "assurance-vie" ? "€" : "CHF"} {fmt((form.montantInvestissement||0)-(form.montantInvestissement||0)*(form.fraisSouscription||0)/100)}.-</div>
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
            <p style={{ fontSize: 12, color: C.gray, marginBottom: 16, marginTop: 0 }}>Modifiez les textes par défaut qui apparaîtront dans les diapositives.</p>
            
            <div style={S.fg}><label style={S.label}>Page "Qui sommes-nous" - Description</label>
            <textarea style={{...S.input, minHeight: 80, resize: "vertical"}} value={form.texts.aboutDesc} onChange={e=>uText("aboutDesc", e.target.value)} /></div>
            
            {form.templateId === "swissquote" && (
              <>
                <div style={S.fg}><label style={S.label}>Page "Pourquoi SwissQuote" - Conclusion</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.swissquoteIntro} onChange={e=>uText("swissquoteIntro", e.target.value)} /></div>

                <div style={{ height: 1, background: C.mediumGray, margin: "20px 0" }} />
                <div style={{marginBottom: 12, color: C.primary, fontWeight: 700, fontSize: 12}}>PAGE "SOLUTION COMPTE-TITRES"</div>
                <div style={S.fg}><label style={S.label}>Paragraphe 1 (Introduction)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.solution1} onChange={e=>uText("solution1", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 2 (Avantages)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.solution2} onChange={e=>uText("solution2", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 3 (Fiscalité)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.solution3} onChange={e=>uText("solution3", e.target.value)} /></div>
                
                {form.assetManager === "ParFinance" && (
                  <>
                    <div style={{ height: 1, background: C.mediumGray, margin: "20px 0" }} />
                    <div style={{marginBottom: 12, color: C.primary, fontWeight: 700, fontSize: 12}}>PAGE "ASSET MANAGER PARFINANCE"</div>
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
                <div style={{ height: 1, background: C.mediumGray, margin: "20px 0" }} />
                <div style={{marginBottom: 12, color: C.primary, fontWeight: 700, fontSize: 12}}>PAGE "SOLUTION PRÉVOYANCE"</div>
                <div style={S.fg}><label style={S.label}>Paragraphe 1 (Introduction)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.prevoyanceSol1} onChange={e=>uText("prevoyanceSol1", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 2 (Avantages)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.prevoyanceSol2} onChange={e=>uText("prevoyanceSol2", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 3 (Fiscalité & Transmission)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.prevoyanceSol3} onChange={e=>uText("prevoyanceSol3", e.target.value)} /></div>
                
                <div style={{ height: 1, background: C.mediumGray, margin: "20px 0" }} />
                <div style={{marginBottom: 12, color: C.primary, fontWeight: 700, fontSize: 12}}>PAGE "FONDS DE PLACEMENT"</div>
                <div style={S.fg}><label style={S.label}>Stratégie d'investissement personnalisée</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.strategieFonds} onChange={e=>uText("strategieFonds", e.target.value)} /></div>
              </>
            )}

            {form.templateId === "lpp" && (
              <>
                <div style={{ height: 1, background: C.mediumGray, margin: "20px 0" }} />
                <div style={{marginBottom: 12, color: C.primary, fontWeight: 700, fontSize: 12}}>PAGE "ENJEUX LPP"</div>
                <div style={S.fg}><label style={S.label}>Paragraphe 1 (Contexte)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppIntroP1} onChange={e=>uText("lppIntroP1", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 2 (Conséquence)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppIntroP2} onChange={e=>uText("lppIntroP2", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 3 (Conclusion)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppIntroP3} onChange={e=>uText("lppIntroP3", e.target.value)} /></div>
                
                <div style={{ height: 1, background: C.mediumGray, margin: "20px 0" }} />
                <div style={{marginBottom: 12, color: C.primary, fontWeight: 700, fontSize: 12}}>PAGE "FONCTIONNEMENT LIBRE PASSAGE"</div>
                <div style={S.fg}><label style={S.label}>Paragraphe 1 (Définition)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppFonctP1} onChange={e=>uText("lppFonctP1", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 2 (Problème)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppFonctP2} onChange={e=>uText("lppFonctP2", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 3 (Solution)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppFonctP3} onChange={e=>uText("lppFonctP3", e.target.value)} /></div>

                <div style={{ height: 1, background: C.mediumGray, margin: "20px 0" }} />
                <div style={{marginBottom: 12, color: C.primary, fontWeight: 700, fontSize: 12}}>PAGES "COMPTE DE LIBRE PASSAGE"</div>
                <div style={S.fg}><label style={S.label}>Introduction Libre Passage</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppLibreP1} onChange={e=>uText("lppLibreP1", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Avantages des Fonds (LPP)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppAvantagesP1} onChange={e=>uText("lppAvantagesP1", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Architecture Ouverte (LPP)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppAvantagesP2} onChange={e=>uText("lppAvantagesP2", e.target.value)} /></div>
                
                <div style={{ height: 1, background: C.mediumGray, margin: "20px 0" }} />
                <div style={{marginBottom: 12, color: C.primary, fontWeight: 700, fontSize: 12}}>PAGE "ADMINISTRATEUR CLP"</div>
                <div style={S.fg}><label style={S.label}>Présentation du partenaire</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppAdminP1} onChange={e=>uText("lppAdminP1", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Sécurité et gouvernance</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.lppAdminP2} onChange={e=>uText("lppAdminP2", e.target.value)} /></div>
              </>
            )}

            {form.templateId === "assurance-vie" && (
              <>
                <div style={{ height: 1, background: C.mediumGray, margin: "20px 0" }} />
                <div style={{marginBottom: 12, color: C.primary, fontWeight: 700, fontSize: 12}}>PAGE "SOLUTIONS ASSURANCE VIE"</div>
                <div style={S.fg}><label style={S.label}>Paragraphe 1 (Contexte)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.avSolutionsP1} onChange={e=>uText("avSolutionsP1", e.target.value)} /></div>
                <div style={S.fg}><label style={S.label}>Paragraphe 2 (Avantages)</label>
                <textarea style={{...S.input, minHeight: 60, resize: "vertical"}} value={form.texts.avSolutionsP2} onChange={e=>uText("avSolutionsP2", e.target.value)} /></div>
              </>
            )}

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
            <div style={{ background: C.lightGray, padding: 18, borderRadius: "0px" }}>
              <div style={{ fontSize: 10, color: C.gray, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Client</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>{form.prenom} {form.nom}</div>
              <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>{form.age} ans — {form.profession}</div>
              <div style={{ fontSize: 12, color: C.gray }}>{form.statut} — {form.nationalite}</div>
            </div>
            <div style={{ background: C.lightGray, padding: 18, borderRadius: "0px" }}>
              <div style={{ fontSize: 10, color: C.gray, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Investissement</div>
              {form.templateId === "prevoyance" ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>CHF {fmt(form.capaciteEpargne)}.- / mois</div>
                  <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>{form.compagniePrevoyance}</div>
                  <div style={{ fontSize: 12, color: C.gray }}>Opti. Fiscale: {form.optiFiscale ? "Oui" : "Non"}</div>
                </>
              ) : form.templateId === "lpp" ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>Libre Passage LPP</div>
                  <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>Capital: CHF {fmt(form.capitalLibrePassage)}.-</div>
                  <div style={{ fontSize: 12, color: C.gray }}>Cible: {form.tauxClp}% net/an</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>CHF {fmt(form.montantInvestissement)}.-</div>
                  <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>Droits d'entrée: {form.fraisSouscription}%</div>
                  <div style={{ fontSize: 12, color: C.gray }}>{form.tauxPessimiste}% / {form.tauxRealiste}% / {form.tauxOptimiste}%</div>
                </>
              )}
            </div>
            <div style={{ background: C.lightGray, padding: 18, borderRadius: "0px" }}>
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
    <div style={{ fontFamily: "'Montserrat', sans-serif", display: "flex", height: "100%", width: "100%", overflow: "hidden", background: C.lightGray, color: C.black }}>
      <style>{`
        html, body, #root { 
          margin: 0; 
          padding: 0; 
          background-color: ${C.lightGray};
          height: 100%;
          width: 100%;
          overflow: hidden; 
        }
        input:focus, select:focus, textarea:focus { border-color: ${C.primary} !important; }
        ::placeholder { color: #B0ADA6; }
        button:hover { opacity: 0.9; }
        
        ::-webkit-scrollbar { width: 6px; height: 6px; } 
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }
        
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

      {/* ────────────────── MENU LATÉRAL (SIDEBAR) ────────────────── */}
      <aside className="no-print" style={{ width: "260px", background: C.sidebar, color: C.white, display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "2px 0 10px rgba(0,0,0,0.1)", zIndex: 110 }}>
        <div style={{ padding: "32px 24px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
          <div style={{ background: C.white, padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={appSettings.defaultLogo || LOGO_URL} alt="WallSwiss" style={{ height: "20px", filter: "invert(1) sepia(1) saturate(5) hue-rotate(345deg) brightness(0.5)" }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 18, fontWeight: 700, letterSpacing: "0.08em" }}>WALLSWISS</div>
            <div style={{ color: C.gold, fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Espace Conseiller</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "24px 0", display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", minHeight: 0 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.1em", padding: "0 24px", marginBottom: 8, textTransform: "uppercase" }}>Général</div>
          
          <button 
            onClick={() => setActiveModule("hub")} 
            style={{ width: "100%", textAlign: "left", background: activeModule === "hub" ? "rgba(255,255,255,0.1)" : "transparent", color: activeModule === "hub" ? C.white : "rgba(255,255,255,0.6)", border: "none", borderLeft: `3px solid ${activeModule === "hub" ? C.gold : "transparent"}`, padding: "12px 24px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: activeModule === "hub" ? 600 : 500, transition: "0.2s", display: "flex", alignItems: "center", gap: 10 }}
          >
            <Icons.Home size={16} /> Hub d'accueil
          </button>
          
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.1em", padding: "0 24px", margin: "16px 0 8px", textTransform: "uppercase" }}>Modules</div>
          
          <button 
            onClick={() => setActiveModule("rapport")} 
            style={{ width: "100%", textAlign: "left", background: activeModule === "rapport" ? "rgba(255,255,255,0.1)" : "transparent", color: activeModule === "rapport" ? C.white : "rgba(255,255,255,0.6)", border: "none", borderLeft: `3px solid ${activeModule === "rapport" ? C.gold : "transparent"}`, padding: "12px 24px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: activeModule === "rapport" ? 600 : 500, transition: "0.2s", display: "flex", alignItems: "center", gap: 10 }}
          >
            <Icons.FileText size={16} /> Rapport Financier
          </button>

          <button 
            onClick={() => setActiveModule("annuaire")} 
            style={{ width: "100%", textAlign: "left", background: activeModule === "annuaire" ? "rgba(255,255,255,0.1)" : "transparent", color: activeModule === "annuaire" ? C.white : "rgba(255,255,255,0.6)", border: "none", borderLeft: `3px solid ${activeModule === "annuaire" ? C.gold : "transparent"}`, padding: "12px 24px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: activeModule === "annuaire" ? 600 : 500, transition: "0.2s", marginTop: "8px", display: "flex", alignItems: "center", gap: 10 }}
          >
            <Icons.BookContacts size={16} /> Annuaire Partenaires
          </button>

          <button 
            onClick={() => setActiveModule("ressources")} 
            style={{ width: "100%", textAlign: "left", background: activeModule === "ressources" ? "rgba(255,255,255,0.1)" : "transparent", color: activeModule === "ressources" ? C.white : "rgba(255,255,255,0.6)", border: "none", borderLeft: `3px solid ${activeModule === "ressources" ? C.gold : "transparent"}`, padding: "12px 24px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: activeModule === "ressources" ? 600 : 500, transition: "0.2s", marginTop: "8px", display: "flex", alignItems: "center", gap: 10 }}
          >
            <Icons.FileText size={16} /> Ressources Documents
          </button>

          <button 
            onClick={() => setActiveModule("mails")} 
            style={{ width: "100%", textAlign: "left", background: activeModule === "mails" ? "rgba(255,255,255,0.1)" : "transparent", color: activeModule === "mails" ? C.white : "rgba(255,255,255,0.6)", border: "none", borderLeft: `3px solid ${activeModule === "mails" ? C.gold : "transparent"}`, padding: "12px 24px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: activeModule === "mails" ? 600 : 500, transition: "0.2s", marginTop: "8px", display: "flex", alignItems: "center", gap: 10 }}
          >
            <Icons.Inbox size={16} /> Mails Types
          </button>

          <button 
            onClick={() => setActiveModule("marketing")} 
            style={{ width: "100%", textAlign: "left", background: activeModule === "marketing" ? "rgba(255,255,255,0.1)" : "transparent", color: activeModule === "marketing" ? C.white : "rgba(255,255,255,0.6)", border: "none", borderLeft: `3px solid ${activeModule === "marketing" ? C.gold : "transparent"}`, padding: "12px 24px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: activeModule === "marketing" ? 600 : 500, transition: "0.2s", marginTop: "8px", display: "flex", alignItems: "center", gap: 10 }}
          >
            <Icons.Target size={16} /> Hub Marketing
          </button>

          <button 
            onClick={() => setActiveModule("rechercheLpp")} 
            style={{ width: "100%", textAlign: "left", background: activeModule === "rechercheLpp" ? "rgba(255,255,255,0.1)" : "transparent", color: activeModule === "rechercheLpp" ? C.white : "rgba(255,255,255,0.6)", border: "none", borderLeft: `3px solid ${activeModule === "rechercheLpp" ? C.gold : "transparent"}`, padding: "12px 24px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: activeModule === "rechercheLpp" ? 600 : 500, transition: "0.2s", marginTop: "8px", display: "flex", alignItems: "center", gap: 10 }}
          >
            <Icons.Search size={16} /> Recherche Avoirs LPP
          </button>

          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.1em", padding: "0 24px", margin: "16px 0 8px", textTransform: "uppercase" }}>Liens rapides</div>

          <button 
            onClick={() => window.open("https://wallswiss.my.salesforce.com/", "_blank")} 
            style={{ width: "100%", textAlign: "left", background: "transparent", color: "rgba(255,255,255,0.6)", border: "none", borderLeft: `3px solid transparent`, padding: "12px 24px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 500, transition: "0.2s", display: "flex", alignItems: "center", gap: 10 }}
          >
            <Icons.Users size={16} /> CRM Salesforce
          </button>
        </nav>

        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
          <button 
            onClick={() => setActiveModule("settings")} 
            style={{ width: "100%", textAlign: "left", background: activeModule === "settings" ? "rgba(255,255,255,0.1)" : "transparent", color: activeModule === "settings" ? C.white : "rgba(255,255,255,0.6)", border: "none", padding: "8px 0", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 12, fontWeight: activeModule === "settings" ? 600 : 500, transition: "0.2s", display: "flex", alignItems: "center", gap: 10 }}
          >
            <Icons.Settings size={16} /> Paramètres & Intégrations
          </button>
        </div>

        <div style={{ padding: "24px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 11, color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>
          <div style={{ marginBottom: 12, color: C.gold, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><Icons.User size={14} /> {user?.email || "Mode Démo"}</div>
          <button onClick={handleLogout} style={{ background: "transparent", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.2)", padding: "4px 8px", cursor: "pointer", fontSize: 10, width: "100%", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Déconnexion</button>
          <div>{APP_VERSION}</div>
        </div>
      </aside>

      {/* ────────────────── CONTENU PRINCIPAL ────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", position: "relative" }}>
        
        {/* VUE HUB D'ACCUEIL */}
        {activeModule === "hub" && (
          <div style={{ padding: "60px 80px", maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
            <h1 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 36, color: C.primary, marginBottom: 8, marginTop: 0 }}>Bonjour</h1>
            <p style={{ color: C.gray, fontSize: 15, marginBottom: 48 }}>Sélectionnez un module ci-dessous pour démarrer vos tâches.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
              <div 
                onClick={() => setActiveModule("rapport")}
                style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", borderRadius: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ background: "rgba(105,33,2,0.06)", color: C.primary, width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <Icons.FileText size={28} />
                </div>
                <h3 style={{ fontSize: 18, color: C.primary, marginBottom: 8, marginTop: 0 }}>Rapport Financier</h3>
                <p style={{ color: C.gray, fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>Générez des rapports d'analyse patrimoniale professionnels et personnalisés pour vos clients en quelques clics.</p>
                <span style={{ color: C.gold, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ouvrir le module &rarr;</span>
              </div>

              <div 
                onClick={() => setActiveModule("annuaire")}
                style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", borderRadius: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ background: "rgba(105,33,2,0.06)", color: C.primary, width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <Icons.BookContacts size={28} />
                </div>
                <h3 style={{ fontSize: 18, color: C.primary, marginBottom: 8, marginTop: 0 }}>Annuaire Partenaires</h3>
                <p style={{ color: C.gray, fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>Retrouvez rapidement les contacts de nos partenaires financiers et assureurs.</p>
                <span style={{ color: C.gold, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ouvrir le module &rarr;</span>
              </div>

              <div 
                onClick={() => window.open("https://wallswiss.my.salesforce.com/", "_blank")}
                style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", borderRadius: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ background: "rgba(105,33,2,0.06)", color: C.primary, width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <Icons.Users size={28} />
                </div>
                <h3 style={{ fontSize: 18, color: C.primary, marginBottom: 8, marginTop: 0 }}>CRM Salesforce</h3>
                <p style={{ color: C.gray, fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>Accédez à votre espace CRM pour gérer vos prospects et clients.</p>
                <span style={{ color: C.gold, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ouvrir Salesforce &rarr;</span>
              </div>

              <div 
                onClick={() => setActiveModule("ressources")}
                style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", borderRadius: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ background: "rgba(105,33,2,0.06)", color: C.primary, width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <Icons.FileText size={28} />
                </div>
                <h3 style={{ fontSize: 18, color: C.primary, marginBottom: 8, marginTop: 0 }}>Ressources Documents</h3>
                <p style={{ color: C.gray, fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>Téléchargez facilement les documents, PDF et mandats officiels pour vos clients.</p>
                <span style={{ color: C.gold, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ouvrir le module &rarr;</span>
              </div>
            </div>
          </div>
        )}

        {/* VUE MODULE MARKETING */}
        {activeModule === "marketing" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fafaf9" }}>
            <header className="no-print" style={{ background: C.white, borderBottom: `1px solid ${C.mediumGray}`, position: "sticky", top: 0, zIndex: 100 }}>
              <div style={{ padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: C.gray, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Module ouvert</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>Hub Marketing Leads</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {uploadingImage && <span style={{ fontSize: 12, color: C.gold, fontWeight: 700 }}>Upload en cours...</span>}
                  <button onClick={() => setIsEditingMarketing(!isEditingMarketing)} style={{ background: isEditingMarketing ? "#10B981" : C.white, color: isEditingMarketing ? C.white : C.primary, border: `1px solid ${isEditingMarketing ? "#10B981" : C.primary}`, padding: "8px 16px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 12, fontWeight: 700, borderRadius: 4, transition: "0.2s" }}>
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
                                <Icons.Layers size={20} color={C.primary} style={{ opacity: 0.6 }} />
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
                                            borderBottom: `2px solid ${marketingCampaign === camp.id ? C.primary : "transparent"}`,
                                            color: marketingCampaign === camp.id ? C.primary : C.gray,
                                            background: marketingCampaign === camp.id ? "rgba(105,33,2,0.05)" : "transparent"
                                        }}
                                        onMouseEnter={(e) => { if(marketingCampaign !== camp.id) { e.currentTarget.style.color = C.primary; e.currentTarget.style.background = "#f5f5f4"; } }}
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
                            <div style={{ width: 56, height: 56, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", flexShrink: 0 }}>
                                <Icons.Target size={28} />
                            </div>
                            <div>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", background: "#f5f5f4", border: `1px solid ${C.mediumGray}`, color: C.darkGray, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}></span>
                                    Usage Interne
                                </div>
                                <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 30, color: C.primary, margin: "0 0 4px 0" }}>
                                    Guide de Traitement <span style={{ fontWeight: 700 }}>{CAMPAIGNS_DATA[marketingCampaign].title.split(' ')[1]}</span>
                                </h2>
                                <p style={{ color: C.gray, fontSize: 14, fontStyle: "italic", fontFamily: "'Times New Roman', Times, serif", margin: 0 }}>{CAMPAIGNS_DATA[marketingCampaign].subtitle}</p>
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
                                    borderBottom: `2px solid ${marketingTab === tab.id ? C.primary : "transparent"}`,
                                    color: marketingTab === tab.id ? C.primary : "#9ca3af",
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
                                            <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, color: C.black, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>Ce que votre prospect a vu</h3>
                                            <p style={{ color: C.darkGray, lineHeight: 1.6, textAlign: "justify", margin: 0 }}>Le prospect a visionné cette annonce vidéo sur son fil d'actualité <strong>Facebook et/ou Instagram</strong>. Il a cliqué pour vérifier s'il pouvait prétendre à une économie d'impôts. Comprendre ce qu'il a en tête est la clé de votre conversion.</p>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                            <div style={{ background: C.white, padding: 24, border: `1px solid ${C.mediumGray}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", gap: 20 }}>
                                                <div style={{ padding: 12, background: "#fafaf9", border: `1px solid ${C.lightGray}`, color: C.gray, flexShrink: 0 }}><Icons.Crosshair size={24} /></div>
                                                <div>
                                                    <h4 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 18, color: C.black, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>Accroche Hyper-Locale</h4>
                                                    <p style={{ fontSize: 14, color: C.darkGray, lineHeight: 1.6, margin: 0 }}>Le lead est interpellé directement comme <strong>"Travailleur Genevois"</strong>. À noter que cette approche est 100% personnalisée : nous avons tourné <strong>8 versions différentes</strong> de cette vidéo pour couvrir chaque canton romand.</p>
                                                </div>
                                            </div>
                                            <div style={{ background: C.white, padding: 24, border: `1px solid ${C.mediumGray}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", gap: 20 }}>
                                                <div style={{ padding: 12, background: "#fafaf9", border: `1px solid ${C.lightGray}`, color: C.gray, flexShrink: 0 }}><Icons.TrendUp size={24} /></div>
                                                <div>
                                                    <h4 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 18, color: C.black, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>La Promesse de Gain</h4>
                                                    <p style={{ fontSize: 14, color: C.darkGray, lineHeight: 1.6, margin: 0 }}>Économiser jusqu'à <strong style={{ color: C.primary }}>4'800 CHF par an</strong> via des solutions "légales". C'est l'argument rationnel qui l'a poussé à cliquer. Il cherche activement à optimiser sa charge fiscale.</p>
                                                </div>
                                            </div>
                                            <div style={{ background: C.white, padding: 24, border: `1px solid ${C.mediumGray}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", gap: 20 }}>
                                                <div style={{ padding: 12, background: "#fafaf9", border: `1px solid ${C.lightGray}`, color: C.gray, flexShrink: 0 }}><Icons.CheckSquare size={24} /></div>
                                                <div>
                                                    <h4 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 18, color: C.black, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>L'Engagement par le Test</h4>
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
                                        <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 36, color: C.primary, marginBottom: 16, marginTop: 0 }}>Dans la tête de votre prospect</h2>
                                        <p style={{ color: C.gray, fontSize: 18, margin: 0 }}>Comprendre ses attentes pour éviter de lever ses boucliers commerciaux.</p>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
                                        <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", position: "relative" }}>
                                            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 4, background: "#059669" }}></div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${C.lightGray}` }}>
                                                <div style={{ width: 48, height: 48, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Smile size={24} /></div>
                                                <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, fontWeight: 700, color: C.black, margin: 0 }}>Ce qu'il attend</h3>
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
                                                <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, fontWeight: 700, color: C.black, margin: 0 }}>Ce qu'il redoute</h3>
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
                                            <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, color: C.black, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>Ce que votre prospect a vu</h3>
                                            <p style={{ color: C.darkGray, lineHeight: 1.6, textAlign: "justify", margin: 0 }}>Le prospect a réagi à une publicité vidéo de la marque <strong>Pilah</strong>. Le message est clair : des milliards dorment dans les caisses de pension en Suisse et il pourrait récupérer en moyenne <strong>8'000 CHF</strong> de son 2ème pilier oublié.</p>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                            <div style={{ background: C.white, padding: 24, border: `1px solid ${C.mediumGray}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", gap: 20 }}>
                                                <div style={{ padding: 12, background: "#fafaf9", border: `1px solid ${C.lightGray}`, color: C.gray, flexShrink: 0 }}><Icons.Target size={24} /></div>
                                                <div>
                                                    <h4 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 18, color: C.black, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>L'Accroche</h4>
                                                    <p style={{ fontSize: 14, color: C.darkGray, lineHeight: 1.6, margin: 0 }}>« Tu as déjà travaillé en Suisse, ou tu y es encore ? ». Cette phrase cible directement les travailleurs frontaliers ou résidents qui ont pu changer d'employeur et "perdre" la trace de leurs avoirs LPP.</p>
                                                </div>
                                            </div>
                                            <div style={{ background: C.white, padding: 24, border: `1px solid ${C.mediumGray}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", gap: 20 }}>
                                                <div style={{ padding: 12, background: "#fafaf9", border: `1px solid ${C.lightGray}`, color: C.gray, flexShrink: 0 }}><Icons.TrendUp size={24} /></div>
                                                <div>
                                                    <h4 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 18, color: C.black, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>La Solution Promise</h4>
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
                                        <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 36, color: C.primary, marginBottom: 16, marginTop: 0 }}>Dans la tête de votre prospect LPP</h2>
                                        <p style={{ color: C.gray, fontSize: 18, margin: 0 }}>Comprendre les motivations et les craintes face à la promesse de retrouver de l'argent.</p>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
                                        <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", position: "relative" }}>
                                            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 4, background: "#059669" }}></div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${C.lightGray}` }}>
                                                <div style={{ width: 48, height: 48, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Smile size={24} /></div>
                                                <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, fontWeight: 700, color: C.black, margin: 0 }}>Ce qu'il attend</h3>
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
                                                <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, fontWeight: 700, color: C.black, margin: 0 }}>Ce qu'il redoute</h3>
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
                                            <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, color: C.black, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>Ce que votre prospect a vu</h3>
                                            <p style={{ color: C.darkGray, lineHeight: 1.6, textAlign: "justify", margin: 0 }}>Le prospect a réagi à une publicité vidéo très immersive ciblant les frontaliers. Le message joue sur la confidence : un frontalier explique comment il perdait de l'argent chaque mois à cause d'un mauvais choix entre la <strong>CMU et la LAMal</strong>.</p>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                            <div style={{ background: C.white, padding: 24, border: `1px solid ${C.mediumGray}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", gap: 20 }}>
                                                <div style={{ padding: 12, background: "#fafaf9", border: `1px solid ${C.lightGray}`, color: C.gray, flexShrink: 0 }}><Icons.Target size={24} /></div>
                                                <div>
                                                    <h4 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 18, color: C.black, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>L'Accroche Confidentielle</h4>
                                                    <p style={{ fontSize: 14, color: C.darkGray, lineHeight: 1.6, margin: 0 }}>« Tu es salarié en Suisse ? Alors cette astuce est pour toi... » susurré face caméra. Cette approche capte l'attention et donne l'impression d'accéder à un "secret d'initié".</p>
                                                </div>
                                            </div>
                                            <div style={{ background: C.white, padding: 24, border: `1px solid ${C.mediumGray}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", gap: 20 }}>
                                                <div style={{ padding: 12, background: "#fafaf9", border: `1px solid ${C.lightGray}`, color: C.gray, flexShrink: 0 }}><Icons.TrendUp size={24} /></div>
                                                <div>
                                                    <h4 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 18, color: C.black, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>La Douleur & La Solution</h4>
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
                                        <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 36, color: C.primary, marginBottom: 16, marginTop: 0 }}>Dans la tête de votre prospect Frontalier</h2>
                                        <p style={{ color: C.gray, fontSize: 18, margin: 0 }}>Comprendre ses motivations réelles et ses craintes concernant son assurance maladie.</p>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
                                        <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", position: "relative" }}>
                                            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 4, background: "#059669" }}></div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${C.lightGray}` }}>
                                                <div style={{ width: 48, height: 48, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Smile size={24} /></div>
                                                <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, fontWeight: 700, color: C.black, margin: 0 }}>Ce qu'il attend</h3>
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
                                                <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, fontWeight: 700, color: C.black, margin: 0 }}>Ce qu'il redoute</h3>
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
                                                    <button key={idx} onClick={() => setCompteChIdx(idx)} style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", border: `2px solid ${compteChIdx === idx ? C.primary : C.mediumGray}`, transition: "all 0.2s", cursor: "pointer", padding: 0 }}>
                                                        <img src={currentImg} alt={`Miniature ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                                        <div style={{ borderBottom: `1px solid rgba(105,33,2,0.1)`, paddingBottom: 24 }}>
                                            <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, color: C.black, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>Ce que votre prospect a vu</h3>
                                            <p style={{ color: C.darkGray, lineHeight: 1.6, textAlign: "justify", margin: 0 }}>Le prospect a réagi à l'une de nos <strong>5 créatives statiques</strong> ciblant une douleur forte des frontaliers : <strong>la perte d'argent sur le taux de change</strong> lors du rapatriement du salaire.</p>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                            <div style={{ background: C.white, padding: 24, border: `1px solid ${C.mediumGray}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", gap: 20 }}>
                                                <div style={{ padding: 12, background: "#fafaf9", border: `1px solid ${C.lightGray}`, color: C.gray, flexShrink: 0 }}><Icons.Target size={24} /></div>
                                                <div>
                                                    <h4 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 18, color: C.black, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>L'Accroche Visuelle & Émotionnelle</h4>
                                                    <p style={{ fontSize: 14, color: C.darkGray, lineHeight: 1.6, margin: 0 }}>L'utilisateur a été interpellé par une image choc illustrant le fait qu'il "donne" littéralement une partie de son salaire à sa banque chaque mois.</p>
                                                </div>
                                            </div>
                                            <div style={{ background: C.white, padding: 24, border: `1px solid ${C.mediumGray}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", gap: 20 }}>
                                                <div style={{ padding: 12, background: "#fafaf9", border: `1px solid ${C.lightGray}`, color: C.gray, flexShrink: 0 }}><Icons.TrendUp size={24} /></div>
                                                <div>
                                                    <h4 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 18, color: C.black, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>La Promesse de Transparence</h4>
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
                                        <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 36, color: C.primary, marginBottom: 16, marginTop: 0 }}>Dans la tête de votre prospect Frontalier</h2>
                                        <p style={{ color: C.gray, fontSize: 18, margin: 0 }}>Comprendre ses attentes financières et ses craintes vis-à-vis des banques.</p>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
                                        <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", position: "relative" }}>
                                            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 4, background: "#059669" }}></div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${C.lightGray}` }}>
                                                <div style={{ width: 48, height: 48, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Smile size={24} /></div>
                                                <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, fontWeight: 700, color: C.black, margin: 0 }}>Ce qu'il attend</h3>
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
                                                <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, fontWeight: 700, color: C.black, margin: 0 }}>Ce qu'il redoute</h3>
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
                                <div style={{ position: "absolute", top: 0, right: 0, width: 384, height: 384, background: C.primary, borderRadius: "50%", filter: "blur(120px)", opacity: 0.3, pointerEvents: "none" }}></div>
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
                                                <span style={{ animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite", position: "absolute", display: "inline-flex", height: "100%", width: "100%", borderRadius: "50%", background: C.primary, opacity: 0.75 }}></span>
                                                <span style={{ position: "relative", display: "inline-flex", borderRadius: "50%", height: 8, width: 8, background: "#8c3d1e" }}></span>
                                            </span>
                                            Script Partenaire - {CAMPAIGNS_DATA[marketingCampaign].name}
                                        </div>
                                        <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 48, color: C.white, margin: "0 0 12px 0", textShadow: "0 10px 15px rgba(0,0,0,0.1)" }}>Discours de Qualification</h2>
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

        {/* VUE MODULE RECHERCHE LPP */}
        {activeModule === "rechercheLpp" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <header className="no-print" style={{ background: C.white, borderBottom: `1px solid ${C.mediumGray}`, position: "sticky", top: 0, zIndex: 100 }}>
              <div style={{ padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: C.gray, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Module ouvert</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>Générateur de Mandats & Recherche LPP</div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={handleDownloadLppDoc} disabled={isGeneratingLpp} style={{ ...S.btnS, padding: "8px 16px", fontSize: 12, opacity: isGeneratingLpp ? 0.7 : 1 }}>
                    {isGeneratingLpp ? "GÉNÉRATION..." : "TÉLÉCHARGER PDF"}
                  </button>
                  <button onClick={handleSendForSignature} disabled={isSendingSign} style={{ ...S.btnP, padding: "8px 16px", fontSize: 12, display: "flex", alignItems: "center", gap: 8, opacity: isSendingSign ? 0.7 : 1 }}>
                    <Icons.Mail size={14} /> {isSendingSign ? "ENVOI EN COURS..." : "SIGNATURE ÉLECTRONIQUE (YOUSIGN)"}
                  </button>
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
    
              {/* Prévisualisation Document - Rendu Visuel Centré */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 40, alignItems: "center", background: "#e2e8f0", padding: "40px 0", overflowY: "auto", overflowX: "hidden", borderRadius: 8, border: "1px solid #cbd5e1", position: "relative" }}>
                
                <div style={{ position: "absolute", top: 20, background: "rgba(0,0,0,0.7)", color: "#fff", padding: "8px 16px", borderRadius: 20, fontSize: 12, fontWeight: "bold", zIndex: 10 }}>
                   Mode aperçu. Le fichier final sera fusionné sur le PDF officiel.
                </div>

                <div style={{ width: "794px", minHeight: "1123px", background: "#fff", padding: "50px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", boxSizing: "border-box", flexShrink: 0, fontFamily: "Arial, sans-serif", fontSize: 13, color: "#000", lineHeight: 1.4 }}>
                   <LppOfficialPage1 data={lppForm} />
                </div>
                <div style={{ width: "794px", minHeight: "1123px", background: "#fff", padding: "50px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", boxSizing: "border-box", flexShrink: 0, fontFamily: "Arial, sans-serif", fontSize: 13, color: "#000", lineHeight: 1.4 }}>
                   <LppOfficialPage2 data={lppForm} />
                </div>
                <div style={{ width: "794px", minHeight: "1123px", background: "#fff", padding: "50px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", boxSizing: "border-box", flexShrink: 0, fontFamily: "'Times New Roman', Times, serif", fontSize: 14, color: "#000" }}>
                   <ProcurationLPP data={lppForm} />
                </div>
              </div>
            </main>
    
            {/* Élément caché UNIQUEMENT pour la capture de la Procuration */}
            <div id="procuration-printable" style={{ position: "absolute", top: "-9999px", left: "-9999px", width: "794px", height: "1123px", background: "#fff", padding: "50px", boxSizing: "border-box", fontFamily: "'Times New Roman', Times, serif", fontSize: 14, color: "#000" }}>
               <ProcurationLPP data={lppForm} />
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
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>Annuaire Partenaires</div>
                </div>
              </div>
            </header>

            <main style={{ flex: 1, padding: "40px", boxSizing: "border-box", overflowY: "auto", textAlign: "left" }}>
              <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, fontWeight: 700, color: C.primary, margin: 0 }}>Contacts & Partenaires</h2>
                  <p style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>Retrouvez les informations de contact de nos principaux partenaires.</p>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
                  {[
                    { nom: "Swissquote", type: "Banque / Dépôt", contact: "Desk B2B", tel: "+41 44 825 89 90", email: "b2b-desk@swissquote.ch", url: "https://trade.swissquote.ch/my.policy" },
                    { nom: "ParFinance", type: "Asset Manager", contact: "Desk Gestion", tel: "+41 22 989 55 55", email: "info@parfinance.ch", url: "https://www.parfinance.ch/" },
                    { nom: "NS Partners", type: "Asset Manager", contact: "Relation Partenaires", tel: "+41 22 906 52 50", email: "geneva@nspgroup.com", url: "https://nspartners.com/" },
                    { nom: "Liechtenstein Life", type: "Prévoyance & Assurance", contact: "Support Courtier", tel: "+423 265 34 40", email: "info@liechtensteinlife.com", url: "https://partner.life.li/fr/my/dashboard" },
                    { nom: "Pictet", type: "Fondation LPP", contact: "Service LPP", tel: "+41 58 323 23 23", email: "lpp@pictet.com", url: "https://www.am.pictet/" },
                    { nom: "Lemania", type: "Fondation LPP", contact: "Administration", tel: "+41 21 311 11 11", email: "info@lemania-lpp.ch", url: "https://www.hublemania.ch/" }
                  ].map((partenaire, i) => (
                    <div key={i} style={{ ...S.card, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <span style={{ background: "rgba(165,149,104,0.1)", color: C.gold, fontSize: 10, fontWeight: 700, padding: "4px 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{partenaire.type}</span>
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: C.primaryDark, margin: 0 }}>{partenaire.nom}</h3>
                      
                      <div style={{ display: "grid", gap: 12 }}>
                        {partenaire.contact && (
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ color: C.gray }}><Icons.User size={16} /></div>
                            <span style={{ fontSize: 13, color: C.darkGray, fontWeight: 500 }}>{partenaire.contact}</span>
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ color: C.gray }}><Icons.Phone size={16} /></div>
                          <span style={{ fontSize: 13, color: C.darkGray, fontWeight: 500 }}>{partenaire.tel}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ color: C.gray }}><Icons.Mail size={16} /></div>
                          <span style={{ fontSize: 13, color: C.primary, fontWeight: 500 }}>{partenaire.email}</span>
                        </div>
                      </div>
                      {partenaire.url && (
                        <button 
                          onClick={() => window.open(partenaire.url, "_blank")} 
                          style={{ marginTop: 20, width: "100%", background: "transparent", border: `1px solid ${C.mediumGray}`, color: C.primary, padding: "10px 0", cursor: "pointer", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", transition: "0.2s", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
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
        {activeModule === "ressources" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <header className="no-print" style={{ background: C.white, borderBottom: `1px solid ${C.mediumGray}`, position: "sticky", top: 0, zIndex: 100 }}>
              <div style={{ padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: C.gray, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Module ouvert</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>Ressources Documents</div>
                </div>
              </div>
            </header>

            <main style={{ flex: 1, padding: "40px", boxSizing: "border-box", overflowY: "auto", textAlign: "left" }}>
              <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, fontWeight: 700, color: C.primary, margin: 0 }}>Documents & Formulaires</h2>
                  <p style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>Téléchargez directement les documents officiels dont vous avez besoin pour vos rendez-vous.</p>
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
                      { nom: "Recherche Centrale LPP", desc: "Formulaire de recherche du 2ème Pilier", fichier: "/SF-F5-FR.pdf" },
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
                          style={{ background: C.white, border: `1px solid ${C.lightGray}`, borderLeft: `4px solid transparent`, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.2s", borderRadius: "0px" }} 
                          onMouseEnter={(e)=> { e.currentTarget.style.borderLeftColor = C.gold; e.currentTarget.style.background = "rgba(165,149,104,0.02)"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.03)"; }} 
                          onMouseLeave={(e)=> { e.currentTarget.style.borderLeftColor = "transparent"; e.currentTarget.style.background = C.white; e.currentTarget.style.boxShadow = "none"; }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                            <div style={{ background: "rgba(105,33,2,0.04)", color: C.primary, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0px", flexShrink: 0 }}>
                              <Icons.FileText size={24} />
                            </div>
                            <div style={{ textAlign: "left" }}>
                              <div style={{ fontSize: 16, fontWeight: 700, color: C.primaryDark, marginBottom: 4 }}>{doc.nom}</div>
                              <div style={{ fontSize: 13, color: C.gray }}>{doc.desc}</div>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              const link = document.createElement('a');
                              link.href = doc.fichier;
                              link.download = doc.fichier.split('/').pop();
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }} 
                            style={{ background: C.white, border: `1px solid ${C.mediumGray}`, color: C.primaryDark, padding: "10px 24px", cursor: "pointer", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 10, borderRadius: "0px" }}
                            onMouseEnter={(e)=> { e.currentTarget.style.background = C.primary; e.currentTarget.style.color = C.white; e.currentTarget.style.borderColor = C.primary; }}
                            onMouseLeave={(e)=> { e.currentTarget.style.background = C.white; e.currentTarget.style.color = C.primaryDark; e.currentTarget.style.borderColor = C.mediumGray; }}
                          >
                            Télécharger / Ouvrir <span style={{ fontSize: 14 }}>&rarr;</span>
                          </button>
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
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>Mails Types</div>
                </div>
              </div>
            </header>

            <main style={{ flex: 1, padding: "40px", boxSizing: "border-box", overflowY: "auto", position: "relative" }}>
              <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
                  <div>
                    <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, fontWeight: 700, color: C.primary, margin: 0 }}>Modèles de communication</h2>
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
                  {["Toutes", "Rendez-vous", "CMU / Fiscalité", "Prévoyance", "LPP", "Suivi", "Investissements", "Événements", "Divers"].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setMailCat(cat)}
                      style={{
                        background: mailCat === cat ? C.primary : C.white,
                        color: mailCat === cat ? C.white : C.darkGray,
                        border: `1px solid ${mailCat === cat ? C.primary : C.mediumGray}`,
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
                          <span style={{ background: "rgba(105,33,2,0.06)", color: C.primary, fontSize: 10, fontWeight: 700, padding: "4px 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {mail.categorie}
                          </span>
                          {mail.pieceJointe && <span title="Pièce jointe requise" style={{ color: C.gold }}><Icons.FileText size={16} /></span>}
                        </div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: C.primaryDark, margin: "0 0 8px 0", lineHeight: 1.4 }}>{mail.titre}</h3>
                        <p style={{ fontSize: 12, color: C.gray, margin: 0, fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Objet : {mail.objet}</p>
                        <p style={{ fontSize: 12, color: C.darkGray, marginTop: 12, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {mail.corps}
                        </p>
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => handleCopy(mail.objet, "Objet copié !")} style={{ flex: 1, background: C.white, border: `1px solid ${C.mediumGray}`, color: C.primaryDark, padding: "8px 0", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "0.2s", display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }} onMouseEnter={e=>{e.currentTarget.style.background=C.lightGray}} onMouseLeave={e=>{e.currentTarget.style.background=C.white}}>
                            <Icons.Copy size={14} /> OBJET
                          </button>
                          <button onClick={() => handleCopy(mail.corps, "Corps copié !")} style={{ flex: 1, background: C.white, border: `1px solid ${C.mediumGray}`, color: C.primaryDark, padding: "8px 0", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "0.2s", display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }} onMouseEnter={e=>{e.currentTarget.style.background=C.lightGray}} onMouseLeave={e=>{e.currentTarget.style.background=C.white}}>
                            <Icons.Copy size={14} /> CORPS
                          </button>
                        </div>
                        <button onClick={() => setSelectedMail(mail)} style={{ width: "100%", background: C.primary, color: C.white, border: "none", padding: "8px 0", fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em", transition: "0.2s" }} onMouseEnter={e=>{e.currentTarget.style.opacity=0.9}} onMouseLeave={e=>{e.currentTarget.style.opacity=1}}>
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
                <div style={{ background: C.white, width: "100%", maxWidth: 800, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                  <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.mediumGray}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: C.lightGray }}>
                    <div>
                      <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{selectedMail.categorie}</div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: C.primaryDark, margin: 0 }}>{selectedMail.titre}</h2>
                    </div>
                    <button onClick={() => setSelectedMail(null)} style={{ background: "transparent", border: "none", fontSize: 24, color: C.gray, cursor: "pointer" }}>&times;</button>
                  </div>
                  
                  <div style={{ padding: "32px", overflowY: "auto", flex: 1 }}>
                    {selectedMail.pieceJointe && (
                      <div style={{ background: "rgba(165,149,104,0.1)", borderLeft: `4px solid ${C.gold}`, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: C.darkGray, display: "flex", alignItems: "center", gap: 12 }}>
                        <Icons.FileText size={20} color={C.gold} />
                        <strong>Pièce(s) jointe(s) recommandée(s) :</strong> {selectedMail.pieceJointe}
                      </div>
                    )}
                    
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 11, color: C.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Objet du mail</div>
                      <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: "12px 16px", fontSize: 14, fontWeight: 600, color: C.primaryDark, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {selectedMail.objet}
                        <button onClick={() => handleCopy(selectedMail.objet, "Objet copié !")} style={{ background: "transparent", border: "none", color: C.primary, cursor: "pointer" }} title="Copier l'objet"><Icons.Copy size={18}/></button>
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: 11, color: C.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Corps du message</div>
                      <div style={{ background: C.white, border: `1px solid ${C.mediumGray}`, padding: "20px", fontSize: 13, color: C.darkGray, whiteSpace: "pre-wrap", lineHeight: 1.6, position: "relative" }}>
                        <button onClick={() => handleCopy(selectedMail.corps, "Corps copié !")} style={{ position: "absolute", top: 12, right: 12, background: C.lightGray, border: `1px solid ${C.mediumGray}`, padding: "6px 10px", color: C.primary, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600 }} title="Copier le corps">
                          <Icons.Copy size={14}/> Copier
                        </button>
                        {selectedMail.corps}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ padding: "20px 32px", borderTop: `1px solid ${C.mediumGray}`, display: "flex", justifyContent: "flex-end", gap: 16 }}>
                  <button onClick={() => handleCopy(`${selectedMail.objet}\n\n${selectedMail.corps}`, "Objet et Corps copiés !")} style={{ ...S.btnP, background: C.gold, display: "flex", alignItems: "center", gap: 8 }}>
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
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>Paramètres & Intégrations</div>
                </div>
                <nav style={{ display: "flex", gap: 8 }}>
                  {[["profile","Profil Agent"],["design","Marque & Design"],["reports","Envoi Rapports"],["campaigns","Campagnes Mailing"]].map(([p,l]) => (
                    <button 
                      key={p} 
                      onClick={() => setSettingsTab(p)} 
                      style={{ background: settingsTab===p ? "rgba(105,33,2,0.06)" : "transparent", color: settingsTab===p ? C.primary : C.gray, border: "none", padding: "8px 16px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: settingsTab===p?700:500, borderRadius: "0px", transition: "0.2s" }}
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
                        <div style={{ width: 64, height: 64, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <img src={appSettings.defaultLogo || LOGO_URL} style={{ maxWidth: "80%", maxHeight: "80%", objectFit: "contain" }} />
                        </div>
                        <input type="file" accept="image/*" onChange={async (e) => {
                          const url = await handleImageUpload(e.target.files[0], `agency/${user.uid}/logo_${Date.now()}`);
                          if (url) setAppSettings({...appSettings, defaultLogo: url});
                        }} style={{ fontSize: 12, fontFamily: "'Montserrat', sans-serif" }} />
                      </div>
                    </div>

                    <div style={S.fg}>
                      <label style={S.label}>Image de couverture (Page Agence & Solutions)</label>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 120, height: 64, background: C.lightGray, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                          <img src={appSettings.defaultCover || "/geneva.jpg"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <input type="file" accept="image/*" onChange={async (e) => {
                          const url = await handleImageUpload(e.target.files[0], `agency/${user.uid}/cover_${Date.now()}`);
                          if (url) setAppSettings({...appSettings, defaultCover: url});
                        }} style={{ fontSize: 12, fontFamily: "'Montserrat', sans-serif" }} />
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={S.label}>Image Philosophie (Page 3)</label>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 120, height: 64, background: C.lightGray, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                          <img src={appSettings.defaultPhilosophy || "/image page3.jpg"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <input type="file" accept="image/*" onChange={async (e) => {
                          const url = await handleImageUpload(e.target.files[0], `agency/${user.uid}/philosophy_${Date.now()}`);
                          if (url) setAppSettings({...appSettings, defaultPhilosophy: url});
                        }} style={{ fontSize: 12, fontFamily: "'Montserrat', sans-serif" }} />
                      </div>
                    </div>
                    {uploadingImage && <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, marginTop: 8 }}>Upload de l'image en cours vers Firebase...</div>}
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
                      <label style={{...S.label, color: C.primaryDark}}>URL du Webhook - Signature Yousign (Module LPP)</label>
                      <input 
                        style={{...S.input, borderLeft: `3px solid ${C.gold}`}} 
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
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>Rapport Financier</div>
                </div>
                <nav style={{ display: "flex", gap: 8 }}>
                  {[["dashboard","Tableau de bord"],["create","Créer un rapport"]].map(([p,l]) => (
                    <button 
                      key={p} 
                      onClick={()=>{setRapportPage(p);if(p==="create")setStep(0);}} 
                      style={{ background: rapportPage===p ? "rgba(105,33,2,0.06)" : "transparent", color: rapportPage===p ? C.primary : C.gray, border: "none", padding: "8px 16px", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: rapportPage===p?700:500, borderRadius: "0px", transition: "0.2s" }}
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
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 16, opacity: 0.2 }}><rect x="3" y="3" width="18" height="18" stroke={C.primary} strokeWidth="1.5"/><line x1="7" y1="8" x2="17" y2="8" stroke={C.primary} strokeWidth="1"/><line x1="7" y1="12" x2="14" y2="12" stroke={C.primary} strokeWidth="1"/><line x1="7" y1="16" x2="11" y2="16" stroke={C.primary} strokeWidth="1"/></svg>
                    <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 24, color: C.primary, marginBottom: 8 }}>Aucun rapport créé</div>
                    <p style={{ color: C.gray, fontSize: 13, marginBottom: 24, maxWidth: 380, margin: "0 auto 24px" }}>Commencez par créer votre premier rapport financier personnalisé.</p>
                    <button style={S.btnP} onClick={()=>{setRapportPage("create");resetForm();}}>+ Créer un rapport</button>
                  </div>
                ) : (
                  <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                      <div>
                        <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, fontWeight: 700, color: C.primary, margin: 0 }}>
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
                                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: C.gold }} />
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 4 }}>
                                  <div style={{ fontSize: 10, color: C.gray, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Dossier Client</div>
                                  {user?.email === ADMIN_EMAIL && (
                                    <div style={{ fontSize: 9, background: C.lightGray, color: C.primary, padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>Agent: {r.agentEmail?.split('@')[0]}</div>
                                  )}
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: C.primary, marginBottom: 6 }}>{r.prenom} {(r.nom||"").toUpperCase()}</div>
                                <div style={{ fontSize: 13, color: C.darkGray, marginBottom: 16 }}>{r.profession} — {r.age} ans</div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: `1px solid ${C.lightGray}` }}>
                                  <div>
                                    <div style={{ fontSize: 10, color: C.gray, marginBottom: 2 }}>
                                      {r.templateId === "prevoyance" ? "Épargne simulée" : r.templateId === "lpp" ? "Libre Passage" : r.templateId === "assurance-vie" ? "Assurance Vie" : "Montant simulé"}
                                    </div>
                                    <div style={{ fontSize: 13, color: C.primary, fontWeight: 600 }}>
                                      {r.templateId === "prevoyance" 
                                        ? `CHF ${fmt(r.capaciteEpargne || 500)}.-/mois` 
                                        : r.templateId === "lpp"
                                        ? `CHF ${fmt(r.capitalLibrePassage || 120000)}.-`
                                        : `CHF ${fmt(r.montantInvestissement||100000)}.-`
                                      }
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "230px" }}>
                                    <button onClick={(e) => handleEditReport(e, r)} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, color: C.primary, padding: "6px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "0.2s", borderRadius: "0px", flex: "1 1 45%" }} onMouseEnter={e=>{e.currentTarget.style.background=C.primary;e.currentTarget.style.color=C.white;e.currentTarget.style.borderColor=C.primary}} onMouseLeave={e=>{e.currentTarget.style.background=C.white;e.currentTarget.style.color=C.primary;e.currentTarget.style.borderColor=C.mediumGray}}>ÉDITER</button>
                                    <button onClick={(e) => handleDeleteReport(e, r.id)} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, color: "#EF4444", padding: "6px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "0.2s", borderRadius: "0px", flex: "1 1 45%" }} onMouseEnter={e=>{e.currentTarget.style.background="#EF4444";e.currentTarget.style.color=C.white;e.currentTarget.style.borderColor="#EF4444"}} onMouseLeave={e=>{e.currentTarget.style.background=C.white;e.currentTarget.style.color="#EF4444";e.currentTarget.style.borderColor=C.mediumGray}}>SUPPRIMER</button>
                                    <button onClick={(e) => { e.stopPropagation(); setPreview({...r, _autoDownload: true}); }} style={{ background: C.white, border: `1px solid ${C.mediumGray}`, color: C.primaryDark, padding: "6px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "0.2s", borderRadius: "0px", flex: "1 1 45%" }} onMouseEnter={e=>{e.currentTarget.style.background=C.primaryDark;e.currentTarget.style.color=C.white;e.currentTarget.style.borderColor=C.primaryDark}} onMouseLeave={e=>{e.currentTarget.style.background=C.white;e.currentTarget.style.color=C.primaryDark;e.currentTarget.style.borderColor=C.mediumGray}}>PDF</button>
                                    <button onClick={(e) => { e.stopPropagation(); setPreview(r); }} style={{ background: C.gold, border: `1px solid ${C.gold}`, color: C.white, padding: "6px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "0.2s", borderRadius: "0px", flex: "1 1 45%", display: "flex", justifyContent: "center", alignItems: "center" }} onMouseEnter={e=>{e.currentTarget.style.opacity=0.8}} onMouseLeave={e=>{e.currentTarget.style.opacity=1}}>APERÇU</button>
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
                  <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 28, fontWeight: 700, color: C.primary, margin: "0 0 4px" }}>Générateur de rapport</h2>
                  <p style={{ color: C.gray, fontSize: 13, marginBottom: 32 }}>Suivez les étapes pour configurer la proposition patrimoniale de votre client.</p>
                  
                  <div style={{ display: "flex", gap: 4, marginBottom: 32, background: "transparent" }}>
                    {stepLabels.map((l,i) => (
                      <div key={i} onClick={()=>setStep(i)} style={{ flex: 1, textAlign: "center", padding: "12px 6px", fontSize: 11, fontWeight: step===i?700:600, color: step===i?C.white:step>i?C.primary:C.gray, background: step===i?C.primary:step>i?"rgba(105,33,2,0.06)":C.white, border: `1px solid ${step===i?C.primary:step>i?"rgba(105,33,2,0.1)":C.mediumGray}`, cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.2s", borderRadius: "0px", position: "relative" }}>
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
      <div style={{ position: "fixed", bottom: 40, right: 40, background: toastMsg.includes("Erreur") || toastMsg.includes("Veuillez") || toastMsg.includes("obligatoires") ? "#EF4444" : "#10B981", color: C.white, padding: "12px 24px", fontSize: 14, fontWeight: 600, boxShadow: "0 10px 25px rgba(0,0,0, 0.2)", zIndex: 3000, display: "flex", alignItems: "center", gap: 10, animation: "fadeIn 0.3s ease-out" }}>
        <span style={{ fontSize: 18 }}>{toastMsg.includes("Erreur") || toastMsg.includes("Veuillez") || toastMsg.includes("obligatoires") ? "!" : "✓"}</span> {toastMsg}
      </div>
    )}
    <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>

    {preview && <ReportPreview data={preview} onClose={()=>setPreview(null)} onUpdateData={handlePreviewUpdate} appSettings={appSettings} onEdit={(e)=>{handleEditReport(e, preview); setPreview(null);}} onDelete={(e)=>{handleDeleteReport(e, preview.id); setPreview(null);}} />}
  </div>
);
}