import { useEffect, useState, useRef, useCallback } from "react";
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
  const [retryCount, setRetryCount] = useState(0);
  const dbRefRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldUpdateRef = useRef(true);
  const MAX_RETRIES = 5;

  // Helper: Cleanup listener and pending timeouts
  const cleanupListener = useCallback(() => {
    if (dbRefRef.current) {
      off(dbRefRef.current);
      dbRefRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Helper: Set up the real-time Firebase listener
  const setupRealtimeListener = useCallback(() => {
    if (!enabled || !path) return;
    cleanupListener();

    try {
      const dbRef = ref(realtimeDb, path);
      dbRefRef.current = dbRef;

      const handleValue = (snapshot: any) => {
        if (!shouldUpdateRef.current) return;
        const data = snapshot.val();
        if (data) {
          onUpdate?.(data); // Only calls if provided
          setIsConnected(true);
          setError(null);
          setRetryCount(0);
        }
        cleanupListener(); // Clean pending reconnect if any
      };

      const handleError = (error: any) => {
        if (!shouldUpdateRef.current) return;
        setIsConnected(false);
        setError(`Connection error: ${error.message}`);
        if (retryCount < MAX_RETRIES) {
          const delay = Math.min(1000 * (2 ** retryCount), 30000);
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
      };

      onValue(dbRef, handleValue, handleError);
    } catch (err: any) {
      setError(err.message || "Failed to setup realtime updates");
      setIsConnected(false);
      toast.error(`Realtime connection error: ${err.message}`);
    }
    // eslint-disable-next-line
  }, [enabled, path, onUpdate, retryCount, cleanupListener]);

  // Effect: Mount & unmount logic
  useEffect(() => {
    shouldUpdateRef.current = true;
    setupRealtimeListener();

    return () => {
      shouldUpdateRef.current = false;
      cleanupListener();
    };
  }, [path, enabled, setupRealtimeListener, cleanupListener]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    setRetryCount(0);
    setupRealtimeListener();
  }, [setupRealtimeListener]);

  return { isConnected, error, reconnect };
}
