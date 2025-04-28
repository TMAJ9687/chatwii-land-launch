
import { useEffect, useState, useRef } from "react";
import { ref, onValue, off } from "firebase/database";
import { realtimeDb } from "@/integrations/firebase/client";
import { toast } from "sonner";

interface RealtimeUpdatesProps {
  path: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  enabled?: boolean;
}

export function useRealtimeUpdates({
  path,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: RealtimeUpdatesProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dbRefRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxRetries = 5;
  const [retryCount, setRetryCount] = useState(0);
  const shouldUpdateRef = useRef(true); // Use ref to prevent unnecessary re-renders

  const setupRealtimeListener = () => {
    // Don't set up listener if disabled or path is missing
    if (!enabled || !path) return;
    
    try {
      // Clean up any existing reference to prevent duplicate listeners
      if (dbRefRef.current) {
        off(dbRefRef.current);
        dbRefRef.current = null;
      }
      
      console.log(`Setting up new realtime listener for path: ${path}`);
      
      // Create a reference to the database path
      const dbRef = ref(realtimeDb, path);
      dbRefRef.current = dbRef;
      
      // Listen for changes
      onValue(dbRef, (snapshot) => {
        // Only process data if component is still mounted
        if (!shouldUpdateRef.current) return;
        
        const data = snapshot.val();
        console.log(`Received update for ${path}:`, data);
        
        if (data) {
          // Process the data
          // Note: Since we're using a basic listener, we'd need additional logic
          // to determine if this is an insert, update or delete
          
          if (onUpdate) {
            onUpdate(data);
          }
          
          setIsConnected(true);
          setError(null);
          setRetryCount(0);
        }
        
        // Clear any pending reconnection timeouts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      }, (error) => {
        if (!shouldUpdateRef.current) return;
        
        setIsConnected(false);
        setError(`Connection error: ${error.message}`);
        
        // Attempt to reconnect with exponential backoff
        if (retryCount < maxRetries) {
          const delay = Math.min(1000 * (2 ** retryCount), 30000);
          console.log(`Will attempt to reconnect in ${delay}ms (attempt ${retryCount + 1} of ${maxRetries})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldUpdateRef.current) {
              setRetryCount(prev => prev + 1);
              setupRealtimeListener();
            }
          }, delay);
        } else {
          setError("Failed to connect after multiple attempts");
          toast.error(`Realtime connection failed for ${path}`);
        }
      });
    } catch (err: any) {
      console.error(`Error setting up realtime updates for ${path}:`, err);
      setError(err.message || "Failed to setup realtime updates");
      setIsConnected(false);
      toast.error(`Realtime connection error: ${err.message}`);
    }
  };

  useEffect(() => {
    // Set up the listener when the component mounts
    shouldUpdateRef.current = true;
    setupRealtimeListener();
    
    // Cleanup function
    return () => {
      shouldUpdateRef.current = false;
      if (dbRefRef.current) {
        console.log(`Cleaning up realtime updates for ${path}`);
        off(dbRefRef.current);
        dbRefRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [path, enabled]); // Re-subscribe when these props change

  return { isConnected, error, reconnect: setupRealtimeListener };
}
