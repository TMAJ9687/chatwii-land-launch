
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase, connectDatabaseEmulator, ref, onValue, goOffline, goOnline } from "firebase/database";
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

// Properly close database connection
export const closeDbConnection = () => {
  try {
    // Remove event listeners
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    
    // Remove connection monitor
    if (connectionMonitorRef) {
      connectionMonitorRef();
      connectionMonitorRef = null;
    }
    
    // Go offline
    goOffline(realtimeDb);
    
    isSetup = false;
    console.log("Firebase realtime database connection closed");
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
};
