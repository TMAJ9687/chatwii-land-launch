
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
  doc
} from 'firebase/firestore';
import { ref, listAll, deleteObject, ListResult } from 'firebase/storage';
import { toast } from 'sonner';

export const useProfileDeletion = () => {
  const deleteUserProfile = async (userId: string): Promise<{success: boolean, error?: any}> => {
    try {
      // Step 1: Check the user's role
      const profile = await getUserProfile(userId);

      if (!profile) {
        console.warn('Profile not found for deletion');
        return { success: false, error: 'Profile not found' };
      }

      // Step 2: Skip deletion for admin and VIP users
      if (profile.role === 'admin' || profile.role === 'vip') {
        console.log(`Skipping deletion for ${profile.role} user: ${userId}`);
        return { success: true }; // No deletion needed
      }

      // Step 3: Delete files from storage - don't wait for completion to avoid delays
      try {
        // Only attempt storage deletion if there's a userId
        if (userId) {
          // We'll start the delete operations but we won't wait for them
          (async () => {
            try {
              // Try deleting chat images with timeout
              const imagesFolderRef = ref(storage, `chat_images/${userId}`);
              try {
                const imagesListResult = await Promise.race([
                  listAll(imagesFolderRef),
                  new Promise<ListResult>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
                ]) as ListResult;
                
                // Start deletion but don't await
                imagesListResult.items.forEach(itemRef => {
                  deleteObject(itemRef).catch(err => console.warn('Image deletion error:', err));
                });
              } catch (err) {
                console.warn('Image listing failed or timed out:', err);
              }
              
              // Try deleting chat audio with timeout
              const audioFolderRef = ref(storage, `chat_audio/${userId}`);
              try {
                const audioListResult = await Promise.race([
                  listAll(audioFolderRef),
                  new Promise<ListResult>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
                ]) as ListResult;
                
                // Start deletion but don't await
                audioListResult.items.forEach(itemRef => {
                  deleteObject(itemRef).catch(err => console.warn('Audio deletion error:', err));
                });
              } catch (err) {
                console.warn('Audio listing failed or timed out:', err);
              }
            } catch (err) {
              console.warn('Storage folder deletion error:', err);
            }
          })();
        }
      } catch (storageError) {
        // Log but continue if storage deletion fails
        console.warn('Storage deletion error:', storageError);
      }

      // Step 4: Delete associated data using batch writes
      const batch = writeBatch(db);
      
      // Rather than wait for all queries, set a maximum time limit
      const startTime = Date.now();
      const timeLimit = 3000; // 3 seconds max
      
      try {
        // Delete the most critical data first
        
        // Delete the profile first
        batch.delete(doc(db, 'profiles', userId));
        
        // Only proceed with other deletion if we haven't exceeded time limit
        if (Date.now() - startTime < timeLimit) {
          // Delete reports
          try {
            const reporterQuery = query(collection(db, 'reports'), where('reporter_id', '==', userId));
            const reporterDocs = await getDocs(reporterQuery);
            reporterDocs.forEach(document => batch.delete(doc(db, 'reports', document.id)));
          } catch (err) {
            console.warn('Reporter query error:', err);
          }
          
          if (Date.now() - startTime < timeLimit) {
            try {
              const reportedQuery = query(collection(db, 'reports'), where('reported_id', '==', userId));
              const reportedDocs = await getDocs(reportedQuery);
              reportedDocs.forEach(document => batch.delete(doc(db, 'reports', document.id)));
            } catch (err) {
              console.warn('Reported query error:', err);
            }
          }
        }

        // Delete user interests if time permits
        if (Date.now() - startTime < timeLimit) {
          try {
            const userInterestsQuery = query(collection(db, 'user_interests'), where('user_id', '==', userId));
            const userInterestsDocs = await getDocs(userInterestsQuery);
            userInterestsDocs.forEach(document => batch.delete(doc(db, 'user_interests', document.id)));
          } catch (err) {
            console.warn('User interests query error:', err);
          }
        }

        // Commit the batch
        await batch.commit();

        console.log(`Successfully deleted profile for user ${userId}`);
        return { success: true };
      } catch (error) {
        console.error('Profile deletion batch error:', error);
        return { success: false, error };
      }
    } catch (error) {
      console.error('Profile deletion error:', error);
      return { success: false, error };
    }
  };

  return { deleteUserProfile };
};
