
import { Query, DocumentData, onSnapshot } from 'firebase/firestore';

type ListenerCallback = (snapshot: any) => void;
type ErrorCallback = (error: Error) => void;

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
    query: Query<DocumentData, DocumentData>,
    callback: ListenerCallback,
    onError?: ErrorCallback
  ): () => void {
    // Unsubscribe from existing listener if exists
    if (this.listeners.has(key)) {
      this.unsubscribe(key);
    }

    // Create new listener
    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        callback(snapshot);
      },
      (error) => {
        console.error(`Error in listener ${key}:`, error);
        if (onError) {
          onError(error);
        }
      }
    );

    // Store unsubscribe function
    this.listeners.set(key, unsubscribe);

    return unsubscribe;
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
}
