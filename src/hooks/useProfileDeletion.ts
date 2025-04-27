
import { 
  db, 
  storage, 
  deleteDocument, 
  deleteFile, 
  getUserProfile,
  queryDocuments 
} from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  doc, 
  startsWith 
} from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { toast } from 'sonner';

export const useProfileDeletion = () => {
  const deleteUserProfile = async (userId: string): Promise<{success: boolean, error?: any}> => {
    try {
      // Step 1: Check the user's role
      const profile = await getUserProfile(userId);

      if (!profile) {
        console.error('Profile not found for deletion');
        toast.error('Failed to fetch profile for deletion.');
        return { success: false, error: 'Profile not found' };
      }

      // Step 2: Skip deletion for admin and VIP users
      if (profile.role === 'admin' || profile.role === 'vip') {
        console.log(`Skipping deletion for ${profile.role} user: ${userId}`);
        return { success: true }; // No deletion needed
      }

      // Step 3: Delete files from storage
      try {
        // Delete files from chat_images bucket
        const imagesFolderRef = ref(storage, `chat_images/${userId}`);
        const imagesListResult = await listAll(imagesFolderRef);
        
        const deleteImagePromises = imagesListResult.items.map(itemRef => 
          deleteObject(itemRef));
        await Promise.all(deleteImagePromises);
        
        // Delete files from chat_audio bucket
        const audioFolderRef = ref(storage, `chat_audio/${userId}`);
        const audioListResult = await listAll(audioFolderRef);
        
        const deleteAudioPromises = audioListResult.items.map(itemRef => 
          deleteObject(itemRef));
        await Promise.all(deleteAudioPromises);
      } catch (storageError) {
        // Ignore errors if files don't exist
        console.log('No files to delete or storage error:', storageError);
      }

      // Step 4: Delete associated data using batch writes
      const batch = writeBatch(db);

      // Delete reports
      const reporterQuery = query(collection(db, 'reports'), where('reporter_id', '==', userId));
      const reportedQuery = query(collection(db, 'reports'), where('reported_id', '==', userId));
      
      const reporterDocs = await getDocs(reporterQuery);
      const reportedDocs = await getDocs(reportedQuery);
      
      reporterDocs.forEach(document => batch.delete(doc(db, 'reports', document.id)));
      reportedDocs.forEach(document => batch.delete(doc(db, 'reports', document.id)));

      // Delete daily_photo_uploads
      const uploadsQuery = query(collection(db, 'daily_photo_uploads'), where('user_id', '==', userId));
      const uploadsDocs = await getDocs(uploadsQuery);
      uploadsDocs.forEach(document => batch.delete(doc(db, 'daily_photo_uploads', document.id)));

      // Delete blocked_users entries
      const blockerQuery = query(collection(db, 'blocked_users'), where('blocker_id', '==', userId));
      const blockedQuery = query(collection(db, 'blocked_users'), where('blocked_id', '==', userId));
      
      const blockerDocs = await getDocs(blockerQuery);
      const blockedDocs = await getDocs(blockedQuery);
      
      blockerDocs.forEach(document => batch.delete(doc(db, 'blocked_users', document.id)));
      blockedDocs.forEach(document => batch.delete(doc(db, 'blocked_users', document.id)));

      // Delete messages
      const sentMessagesQuery = query(collection(db, 'messages'), where('sender_id', '==', userId));
      const receivedMessagesQuery = query(collection(db, 'messages'), where('receiver_id', '==', userId));
      
      const sentMessagesDocs = await getDocs(sentMessagesQuery);
      const receivedMessagesDocs = await getDocs(receivedMessagesQuery);
      
      sentMessagesDocs.forEach(document => batch.delete(doc(db, 'messages', document.id)));
      receivedMessagesDocs.forEach(document => batch.delete(doc(db, 'messages', document.id)));

      // Delete user interests
      const userInterestsQuery = query(collection(db, 'user_interests'), where('user_id', '==', userId));
      const userInterestsDocs = await getDocs(userInterestsQuery);
      userInterestsDocs.forEach(document => batch.delete(doc(db, 'user_interests', document.id)));

      // Delete the profile
      batch.delete(doc(db, 'profiles', userId));

      // Commit the batch
      await batch.commit();

      console.log(`Successfully deleted profile for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('Profile deletion error:', error);
      return { success: false, error };
    }
  };

  return { deleteUserProfile };
};
