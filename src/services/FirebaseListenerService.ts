
import { ref, onValue, off, DatabaseReference } from "firebase/database";
import { realtimeDb } from "@/integrations/firebase/client";
import { toast } from "sonner";

// Type definitions for listeners
type ListenerCallback = (data: any) => void;
type ErrorCallback = (error: Error) => void;

interface Listener {
  ref: DatabaseReference;
  callback: ListenerCallback;
  onError?: ErrorCallback;
  path: string;
  id: string;
  owner: string;
  active: boolean;
}

class FirebaseListenerService {
  private static instance: FirebaseListenerService;
  private listeners: Map<string, Listener>;
  private debug: boolean = false;

  private constructor() {
    this.listeners = new Map<string, Listener>();
    
    // Debug mode detection
    this.debug = localStorage.getItem('firebase-debug') === 'true';
    
    // Clean up all listeners on page unload
    window.addEventListener('beforeunload', () => {
      this.removeAllListeners();
    });
  }

  public static getInstance(): FirebaseListenerService {
    if (!FirebaseListenerService.instance) {
      FirebaseListenerService.instance = new FirebaseListenerService();
    }
    return FirebaseListenerService.instance;
  }

  /**
   * Enable or disable debug mode
   */
  public setDebugMode(enabled: boolean): void {
    this.debug = enabled;
    if (enabled) {
      localStorage.setItem('firebase-debug', 'true');
      this.logDebug('Debug mode enabled');
      this.logActiveListeners();
    } else {
      localStorage.removeItem('firebase-debug');
    }
  }

  /**
   * Add a new listener or reuse an existing one
   */
  public addListener(
    path: string,
    callback: ListenerCallback,
    onError?: ErrorCallback,
    owner: string = 'unknown'
  ): string {
    const listenerRef = ref(realtimeDb, path);
    const listenerId = this.generateListenerId(path, owner);

    // Check if we already have this exact listener
    if (this.listeners.has(listenerId)) {
      const existingListener = this.listeners.get(listenerId)!;
      
      // If it's already active, just return the ID
      if (existingListener.active) {
        this.logDebug(`Reusing existing listener for ${path} (${listenerId})`);
        return listenerId;
      }
      
      // If it exists but is inactive, reactivate it
      this.logDebug(`Reactivating listener for ${path} (${listenerId})`);
      existingListener.active = true;
      
      // Setup the listener
      onValue(
        existingListener.ref,
        (snapshot) => {
          try {
            const data = snapshot.val();
            existingListener.callback(data);
          } catch (error) {
            console.error(`Error in Firebase listener callback for ${path}:`, error);
            if (existingListener.onError && error instanceof Error) {
              existingListener.onError(error);
            }
          }
        },
        (error) => {
          console.error(`Firebase listener error for ${path}:`, error);
          if (existingListener.onError) {
            existingListener.onError(error);
          }
        }
      );
      
      return listenerId;
    }

    // Create a new listener
    this.logDebug(`Adding new listener for ${path} (${listenerId})`);
    
    const listener: Listener = {
      ref: listenerRef,
      callback,
      onError,
      path,
      id: listenerId,
      owner,
      active: true,
    };

    // Set up the listener
    onValue(
      listenerRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          callback(data);
        } catch (error) {
          console.error(`Error in Firebase listener callback for ${path}:`, error);
          if (onError && error instanceof Error) {
            onError(error);
          }
        }
      },
      (error) => {
        console.error(`Firebase listener error for ${path}:`, error);
        if (onError) {
          onError(error);
        }
      }
    );

    // Store the listener
    this.listeners.set(listenerId, listener);
    
    return listenerId;
  }

  /**
   * Remove a specific listener by ID
   */
  public removeListener(listenerId: string): boolean {
    if (!this.listeners.has(listenerId)) {
      this.logDebug(`Attempted to remove non-existent listener: ${listenerId}`);
      return false;
    }

    const listener = this.listeners.get(listenerId)!;
    
    if (listener.active) {
      this.logDebug(`Removing listener: ${listenerId} (${listener.path})`);
      off(listener.ref);
      listener.active = false;
    } else {
      this.logDebug(`Listener ${listenerId} already inactive`);
    }
    
    return true;
  }

  /**
   * Remove all listeners with a specific owner
   */
  public removeListenersByOwner(owner: string): number {
    let count = 0;
    
    this.listeners.forEach((listener, id) => {
      if (listener.owner === owner) {
        if (this.removeListener(id)) {
          count++;
        }
      }
    });
    
    this.logDebug(`Removed ${count} listeners owned by ${owner}`);
    return count;
  }

  /**
   * Remove all active listeners
   */
  public removeAllListeners(): void {
    this.logDebug(`Removing all active listeners (${this.getActiveListenerCount()} active)`);
    
    this.listeners.forEach((listener) => {
      if (listener.active) {
        off(listener.ref);
        listener.active = false;
      }
    });
  }

  /**
   * Get the total number of registered listeners
   */
  public getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Get the number of currently active listeners
   */
  public getActiveListenerCount(): number {
    let count = 0;
    this.listeners.forEach((listener) => {
      if (listener.active) count++;
    });
    return count;
  }

  /**
   * Log active listeners (only in debug mode)
   */
  public logActiveListeners(): void {
    if (!this.debug) return;
    
    console.group('Active Firebase Listeners');
    let activeCount = 0;
    
    this.listeners.forEach((listener) => {
      if (listener.active) {
        console.log(`${listener.id} - Path: ${listener.path}, Owner: ${listener.owner}`);
        activeCount++;
      }
    });
    
    if (activeCount === 0) {
      console.log('No active listeners');
    }
    
    console.log(`Total: ${activeCount} active listeners (${this.listeners.size} total registered)`);
    console.groupEnd();
  }

  /**
   * Generate a unique ID for a listener
   */
  private generateListenerId(path: string, owner: string): string {
    return `${owner}:${path}`;
  }

  /**
   * Log debug messages if debug mode is enabled
   */
  private logDebug(message: string): void {
    if (this.debug) {
      console.log(`[FirebaseListener] ${message}`);
    }
  }
}

// Export the singleton instance
export const firebaseListener = FirebaseListenerService.getInstance();
