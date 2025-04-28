
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
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
