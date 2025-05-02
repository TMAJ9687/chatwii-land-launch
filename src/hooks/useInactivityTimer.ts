
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useLogout } from '@/hooks/useLogout';

// Default timeout for standard users (30 minutes in milliseconds)
const DEFAULT_TIMEOUT = 30 * 60 * 1000; 
// Warning time before logout (1 minute in milliseconds)
const WARNING_TIME = 60 * 1000;

interface InactivityTimerOptions {
  isVipUser?: boolean;
  timeout?: number;
  onTimeout?: () => void;
  redirectPath?: string;
}

export const useInactivityTimer = ({
  isVipUser = false,
  timeout = DEFAULT_TIMEOUT,
  onTimeout,
  redirectPath = '/feedback'
}: InactivityTimerOptions = {}) => {
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [isWarningShown, setIsWarningShown] = useState<boolean>(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const { handleLogout } = useLogout(redirectPath);

  // Skip inactivity timer for VIP users
  const isEnabled = !isVipUser;
  
  // Reset the timer whenever there's user activity
  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    setIsWarningShown(false);
  }, []);

  // Handle timeout when the user has been inactive
  const handleTimeout = useCallback(() => {
    if (onTimeout) {
      onTimeout();
    } else {
      toast.error('You have been logged out due to inactivity.');
      handleLogout();
    }
  }, [onTimeout, handleLogout]);

  // Set up activity listeners and timer
  useEffect(() => {
    if (!isEnabled) return;
    
    // Event listeners to detect user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Function to handle user activity
    const handleUserActivity = () => resetTimer();
    
    // Add event listeners for user activity
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity);
    });
    
    // Set up interval to check inactivity
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - lastActivity;
      
      // Calculate remaining time
      const timeLeft = timeout - elapsedTime;
      setRemainingTime(timeLeft > 0 ? timeLeft : 0);
      
      // Show warning when approaching timeout
      if (elapsedTime > (timeout - WARNING_TIME) && !isWarningShown) {
        toast.warning(`You'll be logged out in 1 minute due to inactivity. Move your mouse or press a key to stay logged in.`, {
          duration: WARNING_TIME,
        });
        setIsWarningShown(true);
      }
      
      // Handle timeout when elapsed time exceeds the limit
      if (elapsedTime >= timeout) {
        handleTimeout();
      }
    }, 1000);
    
    // Clean up event listeners and interval
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      clearInterval(interval);
    };
  }, [isEnabled, timeout, lastActivity, isWarningShown, handleTimeout, resetTimer]);
  
  return {
    resetTimer,
    remainingTime,
    isEnabled
  };
};
