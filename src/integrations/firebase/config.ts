
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
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    },
    "messages": {
      "$conversation_id": {
        // Fixed: using contains which is supported in RTDB
        ".read": "auth !== null && $conversation_id.contains(auth.uid)",
        ".write": "auth !== null && $conversation_id.contains(auth.uid)"
      }
    },
    "message_reactions": {
      "$conversation_id": {
        // Fixed: using contains which is supported in RTDB
        ".read": "auth !== null && $conversation_id.contains(auth.uid)",
        ".write": "auth !== null && $conversation_id.contains(auth.uid)"
      }
    },
    "typing_status": {
      "$conversation_id": {
        // Fixed: using contains which is supported in RTDB
        ".read": "auth !== null && $conversation_id.contains(auth.uid)",
        ".write": "auth !== null && $conversation_id.contains(auth.uid)"
      }
    },
    ".read": false,
    ".write": false
  }
};
