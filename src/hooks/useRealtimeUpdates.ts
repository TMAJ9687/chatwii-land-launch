
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface RealtimeUpdatesProps {
  tableName: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  schema?: string;
  filter?: string;
}

export function useRealtimeUpdates({
  tableName,
  onInsert,
  onUpdate,
  onDelete,
  schema = "public",
  filter,
}: RealtimeUpdatesProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel;
    
    try {
      // Create a channel for database changes
      channel = supabase
        .channel(`${tableName}_changes`)
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
          } else {
            setIsConnected(false);
          }
        });
    } catch (err: any) {
      console.error(`Error setting up realtime updates for ${tableName}:`, err);
      setError(err.message || "Failed to setup realtime updates");
      toast.error(`Realtime connection error: ${err.message}`);
    }

    // Cleanup function
    return () => {
      if (channel) {
        console.log(`Cleaning up realtime updates for ${tableName}`);
        supabase.removeChannel(channel);
      }
    };
  }, [tableName, schema, filter, onInsert, onUpdate, onDelete]);

  return { isConnected, error };
}
