
export const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - users can read any profile but only edit their own
    match /profiles/{profileId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == profileId;
    }
    
    // Messages - users can only access messages where they are sender or receiver
    match /messages/{messageId} {
      allow read: if request.auth != null && (
        resource.data.sender_id == request.auth.uid ||
        resource.data.receiver_id == request.auth.uid ||
        resource.data.participants.hasAny([request.auth.uid])
      );
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && (
        resource.data.sender_id == request.auth.uid
      );
    }
    
    // Message media - follows same rules as messages
    match /message_media/{mediaId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
    
    // Message reactions - users can add reactions to messages they can see
    match /message_reactions/{reactionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
    
    // Site settings - readable by all authenticated users
    match /site_settings/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
`;

export const databaseRules = `
{
  "rules": {
    "presence": {
      "$uid": {
        ".read": true,
        ".write": "auth !== null && auth.uid === $uid"
      }
    },
    "typing": {
      "$conversation_id": {
        ".read": "auth !== null && $conversation_id.indexOf(auth.uid) >= 0",
        ".write": "auth !== null && $conversation_id.indexOf(auth.uid) >= 0"
      }
    },
    "messages": {
      "$conversation_id": {
        ".read": "auth !== null && $conversation_id.indexOf(auth.uid) >= 0",
        ".write": "auth !== null && $conversation_id.indexOf(auth.uid) >= 0"
      }
    },
    "message_reactions": {
      "$conversation_id": {
        ".read": "auth !== null && $conversation_id.indexOf(auth.uid) >= 0",
        ".write": "auth !== null && $conversation_id.indexOf(auth.uid) >= 0"
      }
    },
    ".read": false,
    ".write": false
  }
}
`;

export const storageRules = `
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Default rule - deny everything
    match /{allPaths=**} {
      allow read, write: if false;
    }
    
    // User uploads - allow users to upload to their own folder
    match /uploads/{userId}/{fileName} {
      allow read: if true;  // Anyone can view uploads
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Message media - allow users to upload their own media
    match /message_media/{userId}/{fileName} {
      allow read: if true;  // Anyone can view message media
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
`;

export const displayFirebaseRules = () => {
  console.log("Firestore Rules:");
  console.log(firestoreRules);
  console.log("\nRealtime Database Rules:");
  console.log(databaseRules);
  console.log("\nStorage Rules:");
  console.log(storageRules);
};
