
// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCkMejgIKMAnmFV70Gr_A7U4FIlfxkK4tg",
  authDomain: "chatwiilovable-7ae1d.firebaseapp.com",
  projectId: "chatwiilovable-7ae1d",
  storageBucket: "chatwiilovable-7ae1d.appspot.com",
  messagingSenderId: "58580734475",
  appId: "1:58580734475:web:31de6a30c7fb6661536d0e",
  measurementId: "G-C1ERTKEMKQ",
  databaseURL: "https://chatwiilovable-7ae1d-default-rtdb.europe-west1.firebasedatabase.app"
};

// Realtime Database Rules - Copy these to your Firebase Console
export const realtimeDatabaseRules = {
  "rules": {
    "presence": {
      // Allow reading all presence data for any authenticated user
      ".read": "auth !== null",
      "$uid": {
        // Only the owner can write their own presence
        ".write": "$uid === auth.uid"
      }
    },
    "messages": {
      "$conversation_id": {
        // Instead of .contains, use string comparison and check if conversation ID has user's ID
        ".read": "auth !== null && ($conversation_id.indexOf(auth.uid) !== -1)",
        ".write": "auth !== null && ($conversation_id.indexOf(auth.uid) !== -1)"
      }
    },
    "reactions": {
      "$conversation_id": {
        ".read": "auth !== null && ($conversation_id.indexOf(auth.uid) !== -1)",
        ".write": "auth !== null && ($conversation_id.indexOf(auth.uid) !== -1)"
      }
    },
    "typing_status": {
      "$conversation_id": {
        ".read": "auth !== null && ($conversation_id.indexOf(auth.uid) !== -1)",
        ".write": "auth !== null && ($conversation_id.indexOf(auth.uid) !== -1)" 
      }
    },
    // Deny all other read/write access by default
    ".read": false,
    ".write": false
  }
};

/**
 * Helper function to check if the Realtime Database rules are configured correctly
 * This can be called on application startup
 */
export const checkRealtimeDatabaseRules = () => {
  // Print the expected rules to the console for easy copying
  console.log("===== REALTIME DATABASE RULES =====");
  console.log(JSON.stringify(realtimeDatabaseRules, null, 2));
  console.log("==================================");
  console.log("To configure your Realtime Database rules:");
  console.log("1. Go to Firebase Console > Your Project > Realtime Database > Rules");
  console.log("2. Copy and paste the rules above");
  console.log("3. Click 'Publish' to save the changes");
};
