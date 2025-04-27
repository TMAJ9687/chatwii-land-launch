
// Re-export from the correct location
export { db, auth, storage } from '@/integrations/firebase/client';
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
