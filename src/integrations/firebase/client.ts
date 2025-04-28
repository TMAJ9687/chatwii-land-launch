
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

// Track connection state
let isSetup = false;
let connectionMonitorRef: any = null;
let activeListeners: Record<string, any> = {};

// Safe monitor setup with error handling
export const setupConnectionMonitoring = () => {
  if (isSetup) return;
  
  try {
    const connectedRef = ref(realtimeDb, ".info/connected");
    
    // Use try-catch inside the onValue callback to prevent unhandled promise rejections
    connectionMonitorRef = onValue(connectedRef, (snap) => {
      try {
        if (snap.val() === true) {
          console.log("Connected to Firebase Realtime Database");
        } else {
          console.log("Disconnected from Firebase Realtime Database");
        }
      } catch (error) {
        console.error("Error in connection monitoring callback:", error);
      }
    }, (error) => {
      console.error("Error setting up connection monitoring:", error);
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
  try {
    goOnline(realtimeDb);
  } catch (error) {
    console.error("Error going online:", error);
  }
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

// Properly close database connection with aggressive error handling and timeouts
export const closeDbConnection = async () => {
  // Force close after timeout
  const forceCloseTimeout = setTimeout(() => {
    console.warn("Force closing Firebase connections after timeout");
    clearActiveListeners();
    removeEventListeners();
    removeConnectionMonitor();
    try {
      goOffline(realtimeDb);
    } catch (e) {
      console.warn("Error in force offline:", e);
    }
    isSetup = false;
  }, 750); // Shorter timeout (750ms) for more responsive logout
  
  try {
    // Try graceful cleanup first
    clearActiveListeners();
    removeEventListeners();
    removeConnectionMonitor();
    
    // Go offline
    goOffline(realtimeDb);
    
    isSetup = false;
    console.log("Firebase realtime database connection closed");
    clearTimeout(forceCloseTimeout);
    return true;
  } catch (error) {
    console.error("Error closing database connection:", error);
    // Let the force close timeout handle it
    return false;
  }
};

// Helper functions for closeDbConnection
function clearActiveListeners() {
  Object.keys(activeListeners).forEach(path => {
    try {
      off(activeListeners[path]);
    } catch (error) {
      console.warn(`Error removing listener for ${path}:`, error);
    }
  });
  activeListeners = {};
}

function removeEventListeners() {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
}

function removeConnectionMonitor() {
  if (connectionMonitorRef) {
    try {
      connectionMonitorRef();
    } catch (e) {
      console.warn('Error removing connection monitor:', e);
    }
    connectionMonitorRef = null;
  }
}
