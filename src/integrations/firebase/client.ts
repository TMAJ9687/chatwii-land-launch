
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase, connectDatabaseEmulator, ref, onValue, goOffline, goOnline, off } from "firebase/database";
import { firebaseConfig } from "./config";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);

// Re-export for convenience
export { app };

// Connect to emulators in development if needed
if (import.meta.env.DEV) {
  // Add emulator connections here if needed
  // Example: connectDatabaseEmulator(realtimeDb, 'localhost', 9000);
}

// Track connection state
let isSetup = false;
let connectionMonitorRef: any = null;
let activeListeners: Record<string, any> = {};

// Safe monitor setup
export const setupConnectionMonitoring = () => {
  if (isSetup) return;
  
  try {
    const connectedRef = ref(realtimeDb, ".info/connected");
    connectionMonitorRef = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        console.log("Connected to Firebase Realtime Database");
      } else {
        console.log("Disconnected from Firebase Realtime Database");
      }
    });
    
    // Add connection recovery logic for network issues
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    isSetup = true;
  } catch (error) {
    console.error("Error setting up connection monitoring:", error);
  }
};

// Setup connection monitoring by default
setupConnectionMonitoring();

// Handle online state
function handleOnline() {
  console.log("Network connection restored, reconnecting to Firebase...");
  goOnline(realtimeDb);
}

// Handle offline state
function handleOffline() {
  console.log("Network connection lost, Firebase will attempt to reconnect automatically");
}

// Track listener for cleanup
export const trackListener = (path: string, listener: any) => {
  activeListeners[path] = listener;
  return listener;
};

// Remove listener
export const removeListener = (path: string) => {
  if (activeListeners[path]) {
    try {
      off(activeListeners[path]);
    } catch (error) {
      console.warn(`Error removing listener for ${path}:`, error);
    }
    delete activeListeners[path];
  }
};

// Properly close database connection
export const closeDbConnection = async () => {
  try {
    // Remove all active listeners first
    Object.keys(activeListeners).forEach(path => {
      try {
        off(activeListeners[path]);
      } catch (error) {
        console.warn(`Error removing listener for ${path}:`, error);
      }
    });
    activeListeners = {};
    
    // Remove event listeners
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    
    // Remove connection monitor
    if (connectionMonitorRef) {
      try {
        connectionMonitorRef();
      } catch (e) {
        console.warn('Error removing connection monitor:', e);
      }
      connectionMonitorRef = null;
    }
    
    // Go offline
    goOffline(realtimeDb);
    
    isSetup = false;
    console.log("Firebase realtime database connection closed");
    return true;
  } catch (error) {
    console.error("Error closing database connection:", error);
    return false;
  }
};
