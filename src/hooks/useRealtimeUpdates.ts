
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type RealtimeOptions = {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  filter?: string;
};

export function useRealtimeUpdates<T = any>(
  options: RealtimeOptions,
  onDataChange: (payload: { new: T; old: T | null; eventType: string }) => void
) {
  const { table, event = '*', schema = 'public', filter } = options;

  useEffect(() => {
    // Enable postgres changes for the specified table is done through SQL now
    // No need to call rpc function as it doesn't exist anymore
    
    // Subscribe to changes
    const channel = supabase.channel(`table-changes-${table}`);
    
    // Configure the channel with postgres changes
    channel
      .on('postgres_changes', 
        {
          event: event,
          schema: schema,
          table: table,
          filter: filter,
        },
        (payload) => {
          onDataChange({ 
            new: payload.new as T, 
            old: payload.old as T | null,
            eventType: payload.eventType
          });
        }
      )
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.error(`Failed to subscribe to ${table} changes, status: ${status}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, schema, filter, onDataChange]);
}

// Hook specifically for profile updates
export function useProfileUpdates(onProfileUpdate: (profile: any) => void) {
  useRealtimeUpdates(
    { table: 'profiles', event: 'UPDATE' },
    (payload) => {
      onProfileUpdate(payload.new);
    }
  );
}

// Hook specifically for report updates
export function useReportsUpdates(onReportUpdate: (payload: { new: any; old: any | null; eventType: string }) => void) {
  useRealtimeUpdates(
    { table: 'reports', event: '*' },
    (payload) => {
      onReportUpdate(payload);
    }
  );
}
