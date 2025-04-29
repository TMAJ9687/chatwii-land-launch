
import { useEffect, useRef } from 'react';
import { createLogger } from '@/utils/logger';

const logger = createLogger('firebaseCleanup');

type CleanupFunction = () => void;

/**
 * Hook to manage multiple cleanup functions and ensure they run on component unmount
 * This helps prevent memory leaks when using Firebase listeners
 */
export const useFirebaseCleanup = () => {
  const cleanupFunctionsRef = useRef<CleanupFunction[]>([]);
  
  // Register a cleanup function
  const registerCleanup = (cleanup: CleanupFunction): void => {
    cleanupFunctionsRef.current.push(cleanup);
  };
  
  // Run a cleanup function and remove it from the list
  const runCleanup = (cleanup: CleanupFunction): void => {
    try {
      cleanup();
    } catch (error) {
      logger.warn('Error running cleanup function:', error);
    }
    
    // Remove from the list
    cleanupFunctionsRef.current = cleanupFunctionsRef.current.filter(c => c !== cleanup);
  };
  
  // Run all cleanup functions
  const runAllCleanups = (): void => {
    logger.debug(`Running ${cleanupFunctionsRef.current.length} cleanup functions`);
    
    // Take a copy of the array to prevent issues during iteration
    const cleanups = [...cleanupFunctionsRef.current];
    
    // Run each cleanup function
    cleanups.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        logger.warn('Error running cleanup function:', error);
      }
    });
    
    // Clear the list
    cleanupFunctionsRef.current = [];
  };
  
  // Run all cleanups on unmount
  useEffect(() => {
    return () => {
      runAllCleanups();
    };
  }, []);
  
  return {
    registerCleanup,
    runCleanup,
    runAllCleanups
  };
};
