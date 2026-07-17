// ════════════════════════════════════════════════════════════════
//  firebase.js — Firebase / Auth / accès données (rôles + restriction).
//  Onglet indépendant. Le fichier principal importe tout d'ici.
// ════════════════════════════════════════════════════════════════
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 👑 Email de l'administrateur (= toi). Doit correspondre à l'email
//    avec lequel TU te connectes à l'app, et à celui des règles Firestore.
export const ADMIN_EMAIL = "admin@wallswiss.ch";

const firebaseConfig = {
  apiKey: "AIzaSyD6siK4q7ovudou4pmwMxQU0-Mrl7H_foA",
  authDomain: "appws-3b512.firebaseapp.com",
  projectId: "appws-3b512",
  storageBucket: "appws-3b512.firebasestorage.app",
  messagingSenderId: "1063328233614",
  appId: "1:1063328233614:web:e15d8f9ba7811462b4f1df",
};

const isCanvasEnv = typeof __firebase_config !== "undefined";
const finalConfig = isCanvasEnv ? JSON.parse(__firebase_config) : firebaseConfig;
export const appId =
  isCanvasEnv && typeof __app_id !== "undefined" ? __app_id : "wallswiss-app";

const app = getApps().length ? getApp() : initializeApp(finalConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

// ── Raccourcis de chemins Firestore ─────────────────────────────
const agentsCol = () => collection(db, "artifacts", appId, "public", "data", "agents");
const agentDoc = (uid) => doc(db, "artifacts", appId, "public", "data", "agents", uid);
const reportsCol = () => collection(db, "artifacts", appId, "public", "data", "reports");

// ════════════════════════════════════════════════════════════════
//  AUTHENTIFICATION
// ════════════════════════════════════════════════════════════════
export function watchAuth(callback) {
  return onAuthStateChanged(auth, (u) => callback(u || null));
}

// Inscription conseiller : crée le compte PUIS le profil en attente.
// role:'agent' + status:'pending' sont IMPOSÉS (les règles refusent autre chose).
export async function signUp(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(
    agentDoc(cred.user.uid),
    {
      email,
      role: "agent",
      status: "pending",
      managerId: null,
      createdAt: new Date().toISOString(),
    },
    { merge: true }
  );
  return cred.user;
}

export function logIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
export function logOut() {
  return signOut(auth);
}
export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export function authErrorMessage(code) {
  const map = {
    "auth/invalid-email": "Adresse e-mail invalide.",
    "auth/user-not-found": "Aucun compte avec cet e-mail.",
    "auth/wrong-password": "Mot de passe incorrect.",
    "auth/invalid-credential": "E-mail ou mot de passe incorrect.",
    "auth/email-already-in-use": "Un compte existe déjà avec cet e-mail.",
    "auth/weak-password": "Mot de passe trop faible (6 caractères minimum).",
    "auth/too-many-requests": "Trop de tentatives, réessayez plus tard.",
    "auth/network-request-failed": "Problème de connexion réseau.",
  };
  return map[code] || "Erreur : " + code;
}

// ════════════════════════════════════════════════════════════════
//  PROFIL / RÔLE
// ════════════════════════════════════════════════════════════════
// Rôle effectif : admin par email (non falsifiable), sinon le champ role.
export function effectiveRole(user, profile) {
  if (user?.email === ADMIN_EMAIL) return "admin";
  return profile?.role || "agent";
}

export function watchProfile(uid, callback) {
  return onSnapshot(agentDoc(uid), (snap) =>
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  );
}

// ════════════════════════════════════════════════════════════════
//  ADMIN — gestion des conseillers
// ════════════════════════════════════════════════════════════════
export function watchAllAgents(callback) {
  return onSnapshot(agentsCol(), (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}
export function setAgentStatus(uid, status) {
  return updateDoc(agentDoc(uid), { status });
}
export function setAgentRole(uid, role) {
  // Repasser un manager en agent lui retire son équipe ; on nettoie aussi
  // son propre managerId le cas échéant côté admin si besoin.
  return updateDoc(agentDoc(uid), { role });
}
export function setAgentManager(uid, managerId) {
  return updateDoc(agentDoc(uid), { managerId: managerId || null });
}

// ════════════════════════════════════════════════════════════════
//  RAPPORTS — lecture restreinte selon le rôle (vraie sécurité base)
//    admin   → tous
//    manager → les siens + ceux des agents qu'il gère
//    agent   → uniquement les siens
//  profile = { uid, role }
// ════════════════════════════════════════════════════════════════
export function watchReportsForProfile(profile, onReports) {
  const emit = (docs) => onReports(docs.map((d) => ({ id: d.id, ...d.data() })));

  if (profile.role === "admin") {
    return onSnapshot(reportsCol(), (snap) => emit(snap.docs));
  }

  if (profile.role !== "manager") {
    // agent
    return onSnapshot(
      query(reportsCol(), where("agentId", "==", profile.uid)),
      (snap) => emit(snap.docs)
    );
  }

  // manager : on suit d'abord son équipe, puis les rapports associés
  let unsubReports = () => {};
  const unsubTeam = onSnapshot(
    query(agentsCol(), where("managerId", "==", profile.uid)),
    (teamSnap) => {
      const ids = [profile.uid, ...teamSnap.docs.map((d) => d.id)];
      unsubReports();
      unsubReports = watchReportsForIds(ids, onReports);
    }
  );
  return () => {
    unsubTeam();
    unsubReports();
  };
}

// Écoute les rapports pour une liste d'uid (paquets de 30 = limite Firestore 'in')
function watchReportsForIds(ids, onReports) {
  const chunks = [];
  for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));
  const buckets = chunks.map(() => []);
  const unsubs = chunks.map((chunk, ci) =>
    onSnapshot(query(reportsCol(), where("agentId", "in", chunk)), (snap) => {
      buckets[ci] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onReports(buckets.flat());
    })
  );
  return () => unsubs.forEach((u) => u());
}