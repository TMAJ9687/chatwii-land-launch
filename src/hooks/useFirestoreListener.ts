
import { useEffect, useRef } from 'react';
import { 
  DocumentReference, 
  Query, 
  onSnapshot, 
  DocumentData,
  Unsubscribe
} from 'firebase/firestore';
import { trackFirestoreListener } from '@/integrations/firebase/client';
import { createLogger } from '@/utils/logger';

const logger = createLogger('firestoreListener');

/**
 * Hook for subscribing to Firestore document changes with automatic cleanup
 */
export function useFirestoreDocument<T = DocumentData>(
  docRef: DocumentReference | null,
  callback: (data: T | null) => void,
  options: {
    once?: boolean;
    errorHandler?: (error: Error) => void;
  } = {}
) {
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const callbackRef = useRef(callback);
  const { once, errorHandler } = options;

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Set up the subscription
  useEffect(() => {
    if (!docRef) return;

    logger.debug(`Subscribing to document: ${docRef.path}`);

    const unsub = onSnapshot(
      docRef,
      (doc) => {
        const data = doc.exists() ? { id: doc.id, ...doc.data() } as T : null;
        callbackRef.current(data);
        
        if (once && unsubscribeRef.current) {
          logger.debug(`One-time read complete, unsubscribing: ${docRef.path}`);
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      },
      (error) => {
        logger.error(`Error in Firestore document subscription: ${docRef.path}`, error);
        if (errorHandler) {
          errorHandler(error);
        }
      }
    );

    // Track the subscription
    unsubscribeRef.current = unsub;
    trackFirestoreListener(unsub);

    return () => {
      logger.debug(`Unsubscribing from document: ${docRef.path}`);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [docRef, once, errorHandler]);

  return unsubscribeRef.current !== null;
}

/**
 * Hook for subscribing to Firestore query changes with automatic cleanup
 */
export function useFirestoreQuery<T = DocumentData>(
  query: Query | null,
  callback: (data: T[]) => void,
  options: {
    errorHandler?: (error: Error) => void;
  } = {}
) {
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const callbackRef = useRef(callback);
  const { errorHandler } = options;

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Set up the subscription
  useEffect(() => {
    if (!query) return;

    logger.debug(`Subscribing to query`);

    const unsub = onSnapshot(
      query,
      (snapshot) => {
        const documents = snapshot.docs.map(doc => {
          return { id: doc.id, ...doc.data() } as T;
        });
        callbackRef.current(documents);
      },
      (error) => {
        logger.error(`Error in Firestore query subscription`, error);
        if (errorHandler) {
          errorHandler(error);
        }
      }
    );

    // Track the subscription
    unsubscribeRef.current = unsub;
    trackFirestoreListener(unsub);

    return () => {
      logger.debug(`Unsubscribing from query`);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [query, errorHandler]);

  return unsubscribeRef.current !== null;
}
