import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

/**
 * Firebase del CRM TRES65 (proyecto tres65-perfilcliente), SOLO para iniciar
 * sesión en /admin con las mismas cuentas de agente del dashboard. La landing no
 * lee ni escribe Firestore: todo pasa por el backend (src/lib/crm.ts).
 */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

export function isFirebaseConfigured(): boolean {
  return Boolean(config.projectId && (useEmulator || (config.apiKey && config.appId)));
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

export function getFirebaseAuth(): Auth {
  if (!isFirebaseConfigured()) {
    throw new Error("Falta la configuración de Firebase del CRM (NEXT_PUBLIC_FIREBASE_*).");
  }
  if (!app) app = getApps().length ? getApp() : initializeApp({ ...config, apiKey: config.apiKey || "demo-key" });
  if (!auth) {
    auth = getAuth(app);
    if (useEmulator) connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  }
  return auth;
}
