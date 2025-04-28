import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  getDatabase,
  connectDatabaseEmulator,
  ref,
  onValue,
  goOffline,
  goOnline,
  off
} from "firebase/database";
import { firebaseConfig } from "./config";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);
export { app };

// ——— Firestore listener tracking ——————————————————————————————————

let firestoreListeners: Array<() => void> = [];

/** Register a Firestore onSnapshot unsubscribe for later cleanup */
export function trackFirestoreListener(unsubscribe: () => void) {
  firestoreListeners.push(unsubscribe);
}

/** Unsubscribe all registered Firestore listeners */
export function clearFirestoreListeners() {
  firestoreListeners.forEach(unsub => {
    try { unsub(); }
    catch (e) { console.warn("Error unsubscribing firestore listener:", e); }
  });
  firestoreListeners = [];
}

// ——— Realtime DB connection & listener tracking ——————————————————————

let isSetup = false;
let connectionMonitorRef: any = null;
let activeListeners: Record<string, any> = {};

export const setupConnectionMonitoring = () => {
  if (isSetup) return;
  try {
    const connectedRef = ref(realtimeDb, ".info/connected");
    connectionMonitorRef = onValue(connectedRef, (snap) => {
      console.log(snap.val() ? "Connected to Firebase Realtime Database" : "Disconnected from Firebase Realtime Database");
    }, (error) => {
      console.error("Error setting up connection monitoring:", error);
    });
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    isSetup = true;
  } catch (error) {
    console.error("Error setting up connection monitoring:", error);
  }
};

setupConnectionMonitoring();

function handleOnline()  { try { goOnline(realtimeDb);  } catch{} }
function handleOffline() { /* No-op: SDK will auto-reconnect */ }

export const trackListener = (path: string, listener: any) => {
  activeListeners[path] = listener;
  return listener;
};

export const removeListener = (path: string) => {
  if (activeListeners[path]) {
    try { off(activeListeners[path]); }
    catch (error) { console.warn(`Error removing listener for ${path}:`, error); }
    delete activeListeners[path];
  }
};

// ——— Close everything on logout —————————————————————————————————————

export const closeDbConnection = async () => {
  // Force‐close after timeout
  const forceCloseTimeout = setTimeout(() => {
    console.warn("Force closing Firebase connections after timeout");
    clearActiveListeners();
    removeEventListeners();
    removeConnectionMonitor();
    clearFirestoreListeners();         // <— also clear Firestore subscribers
    try { goOffline(realtimeDb); } catch {}
    isSetup = false;
  }, 750);

  try {
    clearActiveListeners();
    removeEventListeners();
    removeConnectionMonitor();
    clearFirestoreListeners();         // <— clear Firestore subscribers
    goOffline(realtimeDb);
    isSetup = false;
    console.log("Firebase realtime database connection closed");
    clearTimeout(forceCloseTimeout);
    return true;
  } catch (error) {
    console.error("Error closing database connection:", error);
    return false;
  }
};

function clearActiveListeners() {
  Object.keys(activeListeners).forEach(path => {
    try { off(activeListeners[path]); }
    catch (error) { console.warn(`Error removing listener for ${path}:`, error); }
  });
  Object.keys(activeListeners).forEach(k => delete activeListeners[k]);
}

function removeEventListeners() {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
}

function removeConnectionMonitor() {
  if (connectionMonitorRef) {
    try { connectionMonitorRef(); } catch {}
    connectionMonitorRef = null;
  }
}
