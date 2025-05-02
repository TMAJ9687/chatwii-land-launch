
import React, { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "@/lib/firebase";

export const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Listen to browser's online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also check Firebase connection status
    const connectedRef = ref(realtimeDb, '.info/connected');
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val() === true;
      setIsOnline(connected);
      
      // Only show status indicator when offline
      setShowStatus(!connected);
      
      // If we reconnect, hide the indicator after a delay
      if (connected) {
        setTimeout(() => setShowStatus(false), 3000);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  // Don't render anything if online and not showing status
  if (isOnline && !showStatus) return null;

  return (
    <div 
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-all duration-300 ${
        isOnline 
          ? "bg-green-100 text-green-800" 
          : "bg-red-100 text-red-800 animate-pulse"
      }`}
    >
      {isOnline ? (
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
