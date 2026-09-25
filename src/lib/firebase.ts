import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";

/**
 * Configuración pública del proyecto Firebase EXCLUSIVO de esta landing.
 * Estos valores no son secretos (Firebase los expone en cualquier web app);
 * la protección real de los datos está en `firestore.rules`.
 */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.projectId && config.appId) || (useEmulator && Boolean(config.projectId));
}

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase no está configurado. Copia .env.example a .env.local y llena las variables NEXT_PUBLIC_FIREBASE_*.",
    );
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp({ ...config, apiKey: config.apiKey || "demo-key" });
  }
  return app;
}

export function getDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
    if (useEmulator) connectFirestoreEmulator(db, "127.0.0.1", 8181);
  }
  return db;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
    if (useEmulator) connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  }
  return auth;
}
