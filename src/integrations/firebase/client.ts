import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Removed: getDatabase, connectDatabaseEmulator, ref, onValue, goOffline, goOnline, off from "firebase/database"
import { firebaseConfig } from "./config";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app); // Firestore instance
export const storage = getStorage(app);
// Removed: export const realtimeDb = getDatabase(app);
export { app };

// ——— Firestore listener tracking ——————————————————————————————————
// (This section remains unchanged as it relates to Firestore)

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
// (This entire section has been removed as it relates to RTDB)
// Removed: isSetup, connectionMonitorRef, activeListeners
// Removed: setupConnectionMonitoring function
// Removed: handleOnline, handleOffline functions
// Removed: trackListener, removeListener functions (for RTDB)

// ——— Close everything on logout —————————————————————————————————————

export const closeDbConnection = async () => {
  // Only clear Firestore listeners now
  const tasks = [
    clearFirestoreListenersTask()
    // Removed: clearActiveListenersTask(), removeEventListenersTask(), removeConnectionMonitorTask()
  ];

  // Wait for Firestore cleanup task with a timeout
  try {
    await Promise.race([
      Promise.all(tasks),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 600))
    ]);

    // Removed: goOffline(realtimeDb);
    // Removed: isSetup = false; // If isSetup was only for RTDB
    console.log("Firebase Firestore listeners cleared successfully");
    return true;
  }
  catch (error) {
    console.warn("Error or timeout during Firebase Firestore cleanup:", error);

    // Force Firestore cleanup anyway
    forceCleanup();
    return false;
  }
};

// Individual cleanup tasks wrapped in promises

// Removed: clearActiveListenersTask function (for RTDB)
// Removed: removeEventListenersTask function
// Removed: removeConnectionMonitorTask function (for RTDB)

function clearFirestoreListenersTask() {
  return new Promise<void>((resolve) => {
    try {
      console.log(`Clearing ${firestoreListeners.length} Firestore listeners`);
      clearFirestoreListeners();
      resolve();
    } catch (e) {
      console.warn("Error in clearFirestoreListeners:", e);
      resolve(); // Always resolve to not block other tasks
    }
  });
}

// Force cleanup for emergency situations
function forceCleanup() {
  console.warn("Forcing Firebase cleanup");
  try {
    // Removed: RTDB activeListeners cleanup
    // Removed: Browser online/offline event listeners removal
    // Removed: RTDB connectionMonitorRef cleanup
    clearFirestoreListeners(); // Keep Firestore cleanup
    // Removed: goOffline(realtimeDb);
    // Removed: isSetup = false; // If isSetup was only for RTDB
  } catch (e) {
    console.error("Error during force cleanup:", e);
  }
}