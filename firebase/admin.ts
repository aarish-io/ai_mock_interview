import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// Cached instances
let cachedApp: App | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

// Lazy initialization - only runs when actually called at runtime
function getFirebaseAdmin() {
  if (!cachedApp) {
    const apps = getApps();

    if (!apps.length) {
      cachedApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Replace newlines in the private key
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    } else {
      cachedApp = apps[0];
    }
  }

  if (!cachedAuth) {
    cachedAuth = getAuth();
  }

  if (!cachedDb) {
    cachedDb = getFirestore();
  }

  return { auth: cachedAuth, db: cachedDb };
}

// Export getters that lazily initialize on first access
export const auth = new Proxy({} as Auth, {
  get(_, prop) {
    return (getFirebaseAdmin().auth as any)[prop];
  },
});

export const db = new Proxy({} as Firestore, {
  get(_, prop) {
    return (getFirebaseAdmin().db as any)[prop];
  },
});