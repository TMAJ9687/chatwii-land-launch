
import { ref, onValue, off } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/firebase-core';
import { CleanupFunction } from '@/integrations/firebase/firebase-core';

/**
 * Service for managing Firebase Realtime Database listeners
 * Ensures proper cleanup and prevents memory leaks
 */
export class FirebaseListenerService {
  private static instance: FirebaseListenerService;
  private listeners: Map<string, { ref: any, unsubscribe: CleanupFunction }> = new Map();
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): FirebaseListenerService {
    if (!FirebaseListenerService.instance) {
      FirebaseListenerService.instance = new FirebaseListenerService();
    }
    return FirebaseListenerService.instance;
  }
  
  /**
   * Subscribe to a database path
   */
  public subscribe<T = any>(
    key: string,
    path: string,
    callback: (data: T | null) => void,
    errorCallback?: (error: Error) => void
  ): CleanupFunction {
    // Clean up existing subscription with the same key
    this.unsubscribe(key);
    
    // Create a new reference and listener
    const dbRef = ref(realtimeDb, path);
    
    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        const data = snapshot.val();
        callback(data as T);
      },
      (error) => {
        console.error(`Firebase listener error for ${key} at ${path}:`, error);
        if (errorCallback) {
          errorCallback(error);
        }
      }
    );
    
    // Store the listener for later cleanup
    this.listeners.set(key, {
      ref: dbRef,
      unsubscribe: () => {
        try {
          off(dbRef);
        } catch (e) {
          console.warn(`Error unsubscribing from ${key}:`, e);
        }
      }
    });
    
    // Return cleanup function
    return () => this.unsubscribe(key);
  }
  
  /**
   * Unsubscribe from a specific path
   */
  public unsubscribe(key: string): boolean {
    const listener = this.listeners.get(key);
    if (listener) {
      listener.unsubscribe();
      this.listeners.delete(key);
      return true;
    }
    return false;
  }
  
  /**
   * Get count of active listeners
   */
  public getActiveListenersCount(): number {
    return this.listeners.size;
  }
  
  /**
   * Get list of active listener keys
   */
  public getActiveListenerKeys(): string[] {
    return Array.from(this.listeners.keys());
  }
  
  /**
   * Clean up all listeners
   */
  public unsubscribeAll(): void {
    this.listeners.forEach((listener) => {
      listener.unsubscribe();
    });
    this.listeners.clear();
  }
}

// Export a singleton instance
export const firebaseListeners = FirebaseListenerService.getInstance();
