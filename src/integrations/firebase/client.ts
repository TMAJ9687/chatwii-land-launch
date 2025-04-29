
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  getDatabase,
  ref,
  onValue,
  goOffline,
  goOnline,
  off
} from "firebase/database";
import { firebaseConfig } from "./config";
import { createLogger } from "@/utils/logger";

const logger = createLogger('firebase');

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);
export { app };

// Track app state
const appState = {
  isInitialized: false,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isAuthenticated: false,
  userId: null as string | null,
};

// ——— Firestore listener tracking ——————————————————————————————————

let firestoreListeners: Array<() => void> = [];

/** Register a Firestore onSnapshot unsubscribe for later cleanup */
export function trackFirestoreListener(unsubscribe: () => void) {
  firestoreListeners.push(unsubscribe);
}

/** Unsubscribe all registered Firestore listeners */
export function clearFirestoreListeners() {
  logger.debug(`Clearing ${firestoreListeners.length} Firestore listeners`);
  firestoreListeners.forEach(unsub => {
    try { unsub(); }
    catch (e) { logger.warn("Error unsubscribing firestore listener:", e); }
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
      logger.debug(snap.val() ? "Connected to Firebase Realtime Database" : "Disconnected from Firebase Realtime Database");
    }, (error) => {
      logger.error("Error setting up connection monitoring:", error);
    });
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    isSetup = true;
  } catch (error) {
    logger.error("Error setting up connection monitoring:", error);
  }
};

setupConnectionMonitoring();

function handleOnline()  { 
  appState.isOnline = true;
  try { 
    logger.debug("Network back online, reconnecting to Firebase");
    goOnline(realtimeDb);  
  } catch(e) { 
    logger.warn("Error going online:", e); 
  } 
}

function handleOffline() { 
  appState.isOnline = false;
  logger.debug("Network offline, Firebase will auto-reconnect when available");
}

export const trackListener = (path: string, listener: any) => {
  activeListeners[path] = listener;
  return listener;
};

export const removeListener = (path: string) => {
  if (activeListeners[path]) {
    try { 
      off(ref(realtimeDb, path), activeListeners[path]); 
    }
    catch (error) { logger.warn(`Error removing listener for ${path}:`, error); }
    delete activeListeners[path];
  }
};

// ——— Authentication state tracking ——————————————————————————————————

// Monitor auth state
onAuthStateChanged(auth, (user) => {
  const wasAuthenticated = appState.isAuthenticated;
  appState.isAuthenticated = !!user;
  appState.userId = user?.uid || null;
  
  // If authentication state changed, log it
  if (wasAuthenticated !== appState.isAuthenticated) {
    logger.debug(`Authentication state changed: ${appState.isAuthenticated ? 'logged in' : 'logged out'}`);
    
    // If we just logged out, ensure connections are closed
    if (wasAuthenticated && !appState.isAuthenticated) {
      closeDbConnection();
    }
  }
});

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
    logger.debug("Firebase connections closed successfully");
    return true;
  } 
  catch (error) {
    logger.warn("Error or timeout during Firebase connection closure:", error);
    
    // Force cleanup anyway
    forceCleanup();
    return false;
  }
};

// Individual cleanup tasks wrapped in promises
function clearActiveListenersTask() {
  return new Promise<void>((resolve) => {
    try {
      logger.debug(`Clearing ${Object.keys(activeListeners).length} active realtime DB listeners`);
      Object.keys(activeListeners).forEach(path => {
        try { 
          off(ref(realtimeDb, path), activeListeners[path]); 
        } catch (e) { 
          logger.warn(`Error removing listener for ${path}:`, e); 
        }
      });
      activeListeners = {};
      resolve();
    } catch (e) {
      logger.warn("Error in clearActiveListeners:", e);
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
      logger.warn("Error in removeEventListeners:", e);
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
      logger.warn("Error in removeConnectionMonitor:", e);
      resolve();
    }
  });
}

function clearFirestoreListenersTask() {
  return new Promise<void>((resolve) => {
    try {
      logger.debug(`Clearing ${firestoreListeners.length} Firestore listeners`);
      clearFirestoreListeners();
      resolve();
    } catch (e) {
      logger.warn("Error in clearFirestoreListeners:", e);
      resolve();
    }
  });
}

// Force cleanup for emergency situations
function forceCleanup() {
  logger.warn("Forcing Firebase connection cleanup");
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
    logger.error("Error during force cleanup:", e);
  }
}

// Export app state for components to use
export const getAppState = () => ({...appState});
