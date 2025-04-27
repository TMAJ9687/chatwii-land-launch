
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

  const setupRealtimeListener = () => {
    if (!enabled || !path) return;
    
    try {
      // Clean up any existing reference
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
        const data = snapshot.val();
        console.log(`Received update for ${path}:`, data);
        
        if (!data) {
          // Handle empty data case
          return;
        }
        
        // Process the data
        // Note: Since we're using a basic listener, we'd need additional logic
        // to determine if this is an insert, update or delete
        // This is simplified from the Supabase implementation
        
        if (onUpdate) {
          onUpdate(data);
        }
        
        setIsConnected(true);
        setError(null);
        setRetryCount(0);
        
        // Clear any pending reconnection timeouts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      }, (error) => {
        setIsConnected(false);
        setError(`Connection error: ${error.message}`);
        
        // Attempt to reconnect with exponential backoff
        if (retryCount < maxRetries) {
          const delay = Math.min(1000 * (2 ** retryCount), 30000);
          console.log(`Will attempt to reconnect in ${delay}ms (attempt ${retryCount + 1} of ${maxRetries})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            setupRealtimeListener();
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
    setupRealtimeListener();
    
    // Cleanup function
    return () => {
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
