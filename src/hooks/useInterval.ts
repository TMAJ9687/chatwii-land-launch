
import { useEffect, useRef } from 'react';
import { createLogger } from '@/utils/logger';

const logger = createLogger('useInterval');

/**
 * Custom hook for managing intervals with proper cleanup
 * @param callback The function to call on each interval
 * @param delay Delay in ms. Set to null to pause the interval
 * @param options Additional options
 */
export function useInterval(
  callback: () => void,
  delay: number | null,
  options: {
    immediate?: boolean;
    stopAfterRuns?: number;
  } = {}
) {
  const { immediate = false, stopAfterRuns } = options;
  
  const savedCallback = useRef<() => void>(callback);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runsRef = useRef<number>(0);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) {
      // If delay is null, clear any existing interval
      if (intervalRef.current) {
        logger.debug('Clearing interval due to null delay');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    function tick() {
      try {
        savedCallback.current();
      } catch (error) {
        logger.error('Error in interval callback:', error);
      }
      
      runsRef.current++;
      
      // Check if we've reached the run limit
      if (stopAfterRuns && runsRef.current >= stopAfterRuns) {
        logger.debug(`Reached ${runsRef.current} runs, stopping interval`);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }

    // Run immediately if requested
    if (immediate) {
      logger.debug('Running interval callback immediately');
      tick();
    }

    // Set up the interval
    logger.debug(`Setting up interval with ${delay}ms delay`);
    intervalRef.current = setInterval(tick, delay);

    // Clear interval on cleanup
    return () => {
      logger.debug('Cleaning up interval');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [delay, immediate, stopAfterRuns]);

  // Method to manually stop the interval
  const stop = () => {
    if (intervalRef.current) {
      logger.debug('Manually stopping interval');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Method to manually reset the run count
  const resetRuns = () => {
    runsRef.current = 0;
  };

  return {
    stop,
    resetRuns,
    isActive: intervalRef.current !== null,
    runCount: runsRef.current
  };
}
