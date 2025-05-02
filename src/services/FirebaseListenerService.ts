
import { Query, DocumentData, onSnapshot } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/firebase-core';

type ListenerCallback = (snapshot: any) => void;
type ErrorCallback = (error: Error) => void;

// Define a type that can be either a Firestore Query or a string path
type QueryOrPath = Query<DocumentData, DocumentData> | string;

export class FirebaseListenerService {
  private static instance: FirebaseListenerService;
  private listeners: Map<string, () => void>;

  private constructor() {
    this.listeners = new Map();
  }

  public static getInstance(): FirebaseListenerService {
    if (!FirebaseListenerService.instance) {
      FirebaseListenerService.instance = new FirebaseListenerService();
    }
    return FirebaseListenerService.instance;
  }

  public subscribe(
    key: string,
    queryOrPath: QueryOrPath,
    callback: ListenerCallback,
    onError?: ErrorCallback
  ): () => void {
    // Unsubscribe from existing listener if exists
    if (this.listeners.has(key)) {
      this.unsubscribe(key);
    }

    let unsubscribe: () => void;

    try {
      // Handle either Firestore Query or Realtime DB path
      if (typeof queryOrPath === 'string') {
        // This is a Realtime DB path
        const dbRef = ref(realtimeDb, queryOrPath);
        unsubscribe = onValue(
          dbRef,
          (snapshot) => {
            callback(snapshot.val());
          },
          (error) => {
            console.error(`Error in Realtime DB listener ${key}:`, error);
            if (onError) {
              onError(error as Error);
            }
          }
        );
      } else {
        // This is a Firestore Query
        unsubscribe = onSnapshot(
          queryOrPath,
          (snapshot) => {
            callback(snapshot);
          },
          (error) => {
            console.error(`Error in Firestore listener ${key}:`, error);
            if (onError) {
              onError(error);
            }
          }
        );
      }
      
      // Store unsubscribe function
      this.listeners.set(key, unsubscribe);
      
      return unsubscribe;
    } catch (error) {
      console.error(`Error setting up listener ${key}:`, error);
      if (onError) {
        onError(error as Error);
      }
      return () => {}; // Return empty function if setup failed
    }
  }

  public unsubscribe(key: string): void {
    const unsubscribe = this.listeners.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(key);
    }
  }

  public unsubscribeAll(): void {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners.clear();
  }

  public getActiveListenerKeys(): string[] {
    return Array.from(this.listeners.keys());
  }
}

// Export the singleton instance
export const firebaseListeners = FirebaseListenerService.getInstance();
