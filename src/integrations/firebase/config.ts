// firebase/config.ts

// Firebase configuration (without Realtime Database URL)
export const firebaseConfig = {
  apiKey: "AIzaSyCkMejgIKMAnmFV70Gr_A7U4FIlfxkK4tg", // Keep this
  authDomain: "chatwiilovable-7ae1d.firebaseapp.com", // Keep this
  projectId: "chatwiilovable-7ae1d",                // Keep this
  storageBucket: "chatwiilovable-7ae1d.appspot.com", // Keep this
  messagingSenderId: "58580734475",                 // Keep this (for Cloud Messaging if used)
  appId: "1:58580734475:web:31de6a30c7fb6661536d0e", // Keep this
  measurementId: "G-C1ERTKEMKQ"                     // Keep this (for Analytics if used)
  // Removed: databaseURL field as it's for the disabled Realtime Database
};

// Removed: The entire realtimeDatabaseRules object as it's no longer needed.
// Your Firestore rules are managed separately in the Firebase Console.