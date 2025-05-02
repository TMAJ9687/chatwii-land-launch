
// Re-export from the correct location
export { db, auth, storage, realtimeDb } from '@/integrations/firebase/firebase-core';
export { 
  signInAnonymousUser, 
  signUpWithEmail, 
  signInWithEmail, 
  signOutUser, 
  getCurrentUser, 
  createUserProfile, 
  getUserProfile, 
  updateUserDisplayInfo, 
  subscribeToAuthChanges 
} from '@/integrations/firebase/auth';
export {
  createDocument,
  setDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  subscribeToDocument,
  subscribeToQuery
} from '@/integrations/firebase/firestore';
export {
  uploadFile,
  getFileDownloadURL,
  deleteFile
} from '@/integrations/firebase/storage';

// Export firebase cleanup utilities
export { cleanupFirebaseConnections } from '@/utils/firebaseCleanup';
