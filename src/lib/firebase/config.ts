import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  connectFirestoreEmulator,
  persistentLocalCache,
  persistentMultipleTabManager,
  disableNetwork,
  enableNetwork,
} from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB7z1QOTwFbe3ViJyMznuCBIizmbFhPWBU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sync-4517e.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sync-4517e",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sync-4517e.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "353595032888",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:353595032888:web:3b673e18dd4d99c3236dcd",
};

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore with robust multi-tab persistent cache
let db: ReturnType<typeof getFirestore>;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  db = getFirestore(app);
}

const functions = getFunctions(app);
const storage = getStorage(app);

// Global circuit breaker for Firestore Quota Exceeded (Spark tier daily write/read exhaustion)
let isQuotaExceeded = false;

export function isFirestoreQuotaExceeded() {
  return isQuotaExceeded;
}

export async function handleFirestoreQuotaExceeded() {
  if (isQuotaExceeded) return;
  isQuotaExceeded = true;
  console.warn(
    "⚠️ Firestore daily free quota reached on Spark plan. Disabling network polling and operating in local offline cache mode."
  );
  try {
    await disableNetwork(db);
  } catch {
    // ignore
  }
}

// Intercept unhandled quota errors on window to silence repetitive WebChannel retry logs
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const isQuota =
      reason?.code === "resource-exhausted" ||
      reason?.message?.includes("Quota exceeded") ||
      reason?.message?.includes("resource-exhausted") ||
      String(reason).includes("Quota exceeded");

    if (isQuota) {
      handleFirestoreQuotaExceeded();
      event.preventDefault();
    }
  });
}

// Connect to emulators if explicitly requested in local development
if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true"
) {
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
    connectFunctionsEmulator(functions, "localhost", 5001);
    connectStorageEmulator(storage, "localhost", 9199);
    console.log("⚡ Connected to Firebase Local Emulator Suite");
  } catch {
    // Already connected or ignore in hot reloads
  }
}

export { app, auth, db, functions, storage, disableNetwork, enableNetwork };
