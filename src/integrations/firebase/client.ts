
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
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

// Configure database persistent connection
import { ref, onDisconnect, onValue, goOffline, goOnline } from "firebase/database";

// Setup reconnection mechanism for the database
const connectedRef = ref(realtimeDb, ".info/connected");

// Monitor connection state
onValue(connectedRef, (snap) => {
  if (snap.val() === true) {
    console.log("Connected to Firebase Realtime Database");
  } else {
    console.log("Disconnected from Firebase Realtime Database");
  }
});

// Add connection recovery logic for network issues
window.addEventListener('online', () => {
  console.log("Network connection restored, reconnecting to Firebase...");
  goOnline(realtimeDb);
});

window.addEventListener('offline', () => {
  console.log("Network connection lost, Firebase will attempt to reconnect automatically");
});

export const closeDbConnection = () => {
  goOffline(realtimeDb);
};

