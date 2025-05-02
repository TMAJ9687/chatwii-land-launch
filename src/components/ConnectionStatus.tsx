
import React, { useEffect, useState } from "react";
import { Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "@/lib/firebase";
import { safeFirebaseOperation } from "@/utils/firebaseErrorHandling";

export const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    // Listen to browser's online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also check Firebase connection status, using the safeFirebaseOperation for better error handling
    const checkFirebaseConnection = async () => {
      const connectedRef = ref(realtimeDb, '.info/connected');
      
      return safeFirebaseOperation(
        () => {
          return onValue(connectedRef, (snapshot) => {
            const connected = snapshot.val() === true;
            setIsOnline(connected);
            setPermissionError(false);
            
            // Only show status indicator when offline
            setShowStatus(!connected);
            
            // If we reconnect, hide the indicator after a delay
            if (connected) {
              setTimeout(() => setShowStatus(false), 3000);
            }
          });
        }, 
        "Could not check connection status", 
        { silent: true, throwError: false }
      );
    };
    
    checkFirebaseConnection().catch(error => {
      console.error("Firebase connection check error:", error);
      // If there's an error, show a permissions issue indicator
      setPermissionError(true);
      setShowStatus(true);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't render anything if online, not showing status, and no permission errors
  if (isOnline && !showStatus && !permissionError) return null;

  return (
    <div 
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-all duration-300 ${
        permissionError
          ? "bg-yellow-100 text-yellow-800"
          : isOnline 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800 animate-pulse"
      }`}
    >
      {permissionError ? (
        <>
          <AlertTriangle className="h-4 w-4" />
          <span>Firebase Permission Issue</span>
        </>
      ) : isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
};
