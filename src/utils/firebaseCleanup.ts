
import { firebaseListeners } from '@/services/FirebaseListenerService';
import { realtimeDb } from '@/integrations/firebase/firebase-core';
import { goOffline } from 'firebase/database';

/**
 * Clean up all Firebase listeners and connections
 * This should be called when the user logs out or the app is unloaded
 */
export async function cleanupFirebaseConnections(): Promise<boolean> {
  console.log('Running Firebase cleanup operations');
  
  try {
    // Clean up all active listeners
    firebaseListeners.unsubscribeAll();
    
    // Go offline
    goOffline(realtimeDb);
    
    console.log('Firebase connections closed successfully');
    return true;
  } 
  catch (error) {
    console.error("Error during Firebase connection cleanup:", error);
    return false;
  }
}

/**
 * Utility for handling cleanup on app/component unmount
 */
export function useFirebaseCleanup(componentName: string) {
  return () => {
    const activeListeners = firebaseListeners.getActiveListenerKeys()
      .filter(key => key.startsWith(componentName));
      
    if (activeListeners.length > 0) {
      console.log(`Cleaning up ${activeListeners.length} listeners for ${componentName}`);
      activeListeners.forEach(key => firebaseListeners.unsubscribe(key));
    }
  };
}
