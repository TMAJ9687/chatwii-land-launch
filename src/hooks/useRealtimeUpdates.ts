
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface RealtimeUpdatesProps {
  tableName: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  schema?: string;
  filter?: string;
  enabled?: boolean;
}

export function useRealtimeUpdates({
  tableName,
  onInsert,
  onUpdate,
  onDelete,
  schema = "public",
  filter,
  enabled = true,
}: RealtimeUpdatesProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxRetries = 5;
  const [retryCount, setRetryCount] = useState(0);

  const setupChannel = () => {
    if (!enabled) return;
    
    try {
      // Clean up any existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      // Create a unique channel name
      const channelName = `${tableName}_changes_${Date.now()}`;
      console.log(`Setting up new channel: ${channelName}`);
      
      // Create a channel for database changes
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema,
            table: tableName,
            filter: filter ? filter : undefined,
          },
          (payload) => {
            console.log(`New ${tableName} inserted:`, payload);
            onInsert?.(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema,
            table: tableName,
            filter: filter ? filter : undefined,
          },
          (payload) => {
            console.log(`${tableName} updated:`, payload);
            onUpdate?.(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema,
            table: tableName,
            filter: filter ? filter : undefined,
          },
          (payload) => {
            console.log(`${tableName} deleted:`, payload);
            onDelete?.(payload);
          }
        )
        .subscribe((status) => {
          console.log(`Realtime subscription status for ${tableName}:`, status);
          if (status === "SUBSCRIBED") {
            setIsConnected(true);
            setError(null);
            setRetryCount(0);
            
            // Clear any pending reconnection timeouts
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setIsConnected(false);
            setError(`Connection error: ${status}`);
            
            // Attempt to reconnect with exponential backoff
            if (retryCount < maxRetries) {
              const delay = Math.min(1000 * (2 ** retryCount), 30000);
              console.log(`Will attempt to reconnect in ${delay}ms (attempt ${retryCount + 1} of ${maxRetries})`);
              
              reconnectTimeoutRef.current = setTimeout(() => {
                setRetryCount(prev => prev + 1);
                setupChannel();
              }, delay);
            } else {
              setError("Failed to connect after multiple attempts");
              toast.error(`Realtime connection failed for ${tableName}`);
            }
          }
        });
        
      channelRef.current = channel;
    } catch (err: any) {
      console.error(`Error setting up realtime updates for ${tableName}:`, err);
      setError(err.message || "Failed to setup realtime updates");
      setIsConnected(false);
      toast.error(`Realtime connection error: ${err.message}`);
    }
  };

  useEffect(() => {
    setupChannel();
    
    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log(`Cleaning up realtime updates for ${tableName}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [tableName, schema, filter, enabled]); // Re-subscribe when these props change

  return { isConnected, error, reconnect: setupChannel };
}
