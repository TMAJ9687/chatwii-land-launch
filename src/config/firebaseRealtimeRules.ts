
export const realtimeDatabaseRules = `
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
        ".read": "auth !== null && $conversation_id.contains(auth.uid)",
        ".write": "auth !== null && $conversation_id.contains(auth.uid)"
      }
    },
    "messages": {
      "$conversation_id": {
        ".read": "auth !== null && $conversation_id.contains(auth.uid)",
        ".write": "auth !== null && $conversation_id.contains(auth.uid)"
      }
    },
    "message_reactions": {
      "$conversation_id": {
        ".read": "auth !== null && $conversation_id.contains(auth.uid)",
        ".write": "auth !== null && $conversation_id.contains(auth.uid)"
      }
    },
    ".read": false,
    ".write": false
  }
}
`;

export const displayRealtimeDatabaseRules = () => {
  console.log("\nRealtime Database Rules:");
  console.log(realtimeDatabaseRules);
};
