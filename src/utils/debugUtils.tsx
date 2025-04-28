
import { firebaseListener } from '@/services/FirebaseListenerService';
import { useState, useEffect } from 'react';

/**
 * Toggles Firebase debugging mode
 */
export const toggleFirebaseDebug = (enabled?: boolean) => {
  const isEnabled = enabled !== undefined ? enabled : !getFirebaseDebugStatus();
  firebaseListener.setDebugMode(isEnabled);
  
  if (isEnabled) {
    console.log("Firebase debugging enabled. All listener activity will be logged to console.");
    firebaseListener.logActiveListeners();
  } else {
    console.log("Firebase debugging disabled.");
  }
  
  return isEnabled;
};

/**
 * Gets the current status of Firebase debugging
 */
export const getFirebaseDebugStatus = () => {
  return localStorage.getItem('firebase-debug') === 'true';
};

/**
 * Helper function to log component lifecycle events in development
 */
export const logComponentLifecycle = (componentName: string, event: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production' && getFirebaseDebugStatus()) {
    if (data) {
      console.log(`[${componentName}] ${event}:`, data);
    } else {
      console.log(`[${componentName}] ${event}`);
    }
  }
};

/**
 * Utility to monitor React re-renders
 */
export const useRenderLogger = (componentName: string) => {
  if (process.env.NODE_ENV !== 'production' && getFirebaseDebugStatus()) {
    console.log(`[${componentName}] Rendered`);
  }
};

/**
 * Gets Firebase listener stats
 */
export const getFirebaseListenerStats = () => {
  return {
    total: firebaseListener.getListenerCount(),
    active: firebaseListener.getActiveListenerCount()
  };
};

/**
 * Debug component to display Firebase listener stats
 */
export const FirebaseDebugPanel = () => {
  const [stats, setStats] = useState({ total: 0, active: 0 });
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || !getFirebaseDebugStatus()) {
      return;
    }
    
    // Update stats initially
    setStats(getFirebaseListenerStats());
    
    // Set up an interval to update stats
    const intervalId = setInterval(() => {
      setStats(getFirebaseListenerStats());
    }, 2000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  if (process.env.NODE_ENV === 'production' || !getFirebaseDebugStatus()) {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '0',
      right: '0',
      background: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '5px 10px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      Firebase Listeners: {stats.active} active / {stats.total} total
      <button 
        style={{ marginLeft: '10px', background: '#444', border: 'none', color: 'white', cursor: 'pointer' }}
        onClick={() => firebaseListener.logActiveListeners()}
      >
        Log
      </button>
    </div>
  );
};
