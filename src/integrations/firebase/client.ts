
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

function handleOnline()  { try { goOnline(realtimeDb);  } catch(e) { console.warn("Error going online:", e); } }
function handleOffline() { /* No-op: SDK will auto-reconnect */ }

export const trackListener = (path: string, listener: any) => {
  activeListeners[path] = listener;
  return listener;
};

export const removeListener = (path: string) => {
  if (activeListeners[path]) {
    try { 
      off(ref(realtimeDb, path), activeListeners[path]); 
    }
    catch (error) { console.warn(`Error removing listener for ${path}:`, error); }
    delete activeListeners[path];
  }
};

// ——— Close everything on logout —————————————————————————————————————

export const closeDbConnection = async () => {
  // Start parallel cleanup tasks and handle each independently
  const tasks = [
    clearActiveListenersTask(),
    removeEventListenersTask(),
    removeConnectionMonitorTask(),
    clearFirestoreListenersTask()
  ];
  
  // Wait for all tasks with a timeout
  try {
    await Promise.race([
      Promise.all(tasks),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 600))
    ]);
    
    // Finally go offline
    goOffline(realtimeDb);
    isSetup = false;
    console.log("Firebase connections closed successfully");
    return true;
  } 
  catch (error) {
    console.warn("Error or timeout during Firebase connection closure:", error);
    
    // Force cleanup anyway
    forceCleanup();
    return false;
  }
};

// Individual cleanup tasks wrapped in promises
function clearActiveListenersTask() {
  return new Promise<void>((resolve) => {
    try {
      console.log(`Clearing ${Object.keys(activeListeners).length} active realtime DB listeners`);
      Object.keys(activeListeners).forEach(path => {
        try { 
          off(ref(realtimeDb, path), activeListeners[path]); 
        } catch (e) { 
          console.warn(`Error removing listener for ${path}:`, e); 
        }
      });
      activeListeners = {};
      resolve();
    } catch (e) {
      console.warn("Error in clearActiveListeners:", e);
      resolve(); // Always resolve to not block other tasks
    }
  });
}

function removeEventListenersTask() {
  return new Promise<void>((resolve) => {
    try {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      resolve();
    } catch (e) {
      console.warn("Error in removeEventListeners:", e);
      resolve();
    }
  });
}

function removeConnectionMonitorTask() {
  return new Promise<void>((resolve) => {
    try {
      if (connectionMonitorRef) {
        connectionMonitorRef();
        connectionMonitorRef = null;
      }
      resolve();
    } catch (e) {
      console.warn("Error in removeConnectionMonitor:", e);
      resolve();
    }
  });
}

function clearFirestoreListenersTask() {
  return new Promise<void>((resolve) => {
    try {
      console.log(`Clearing ${firestoreListeners.length} Firestore listeners`);
      clearFirestoreListeners();
      resolve();
    } catch (e) {
      console.warn("Error in clearFirestoreListeners:", e);
      resolve();
    }
  });
}

// Force cleanup for emergency situations
function forceCleanup() {
  console.warn("Forcing Firebase connection cleanup");
  try {
    Object.keys(activeListeners).forEach(k => delete activeListeners[k]);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (connectionMonitorRef) {
      try { connectionMonitorRef(); } catch {}
      connectionMonitorRef = null;
    }
    clearFirestoreListeners();
    try { goOffline(realtimeDb); } catch {}
    isSetup = false;
  } catch (e) {
    console.error("Error during force cleanup:", e);
  }
}
