
import { firebaseListeners } from '@/services/FirebaseListenerService';
import { realtimeDb } from '@/integrations/firebase/firebase-core';
import { goOffline } from 'firebase/database';

// Array to track Firestore unsubscribe functions
const firestoreListeners: Array<() => void> = [];

/**
 * Track a Firestore listener for later cleanup
 */
export function trackFirestoreListener(unsubscribe: () => void): void {
  firestoreListeners.push(unsubscribe);
}

/**
 * Clear all registered Firestore listeners
 */
export function clearFirestoreListeners(): void {
  console.log(`Clearing ${firestoreListeners.length} Firestore listeners`);
  
  firestoreListeners.forEach(unsub => {
    try {
      unsub();
    } catch (e) {
      console.warn("Error unsubscribing Firestore listener:", e);
    }
  });
  
  firestoreListeners.length = 0;
}

/**
 * Clean up all Firebase listeners and connections
 * This should be called when the user logs out or the app is unloaded
 */
export async function cleanupFirebaseConnections(): Promise<boolean> {
  console.log('Running Firebase cleanup operations');
  
  try {
    // Clean up all Realtime Database listeners
    firebaseListeners.unsubscribeAll();
    
    // Clean up all Firestore listeners
    clearFirestoreListeners();
    
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
