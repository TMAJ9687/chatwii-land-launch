
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
    // Create a unique channel name for this subscription
    const channelName = `table-changes-${table}-${Math.random().toString(36).slice(2, 11)}`;
    
    try {
      // Set up the channel for postgres changes
      const channel = supabase.channel(channelName);
      
      // Configure the channel with postgres changes
      const subscription = channel
        .on(
          'postgres_changes', 
          {
            event: event,
            schema: schema,
            table: table,
            filter: filter,
          },
          (payload) => {
            try {
              onDataChange({ 
                new: payload.new as T, 
                old: payload.old as T | null,
                eventType: payload.eventType
              });
            } catch (error) {
              console.error(`Error handling data change for table ${table}:`, error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Successfully subscribed to ${table} changes`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Failed to subscribe to ${table} changes, status: ${status}`);
            toast.error(`Connection issue detected. Some updates may be delayed.`);
          } else if (status === 'TIMED_OUT') {
            console.error(`Subscription to ${table} timed out`);
          }
        });

      // Clean up function
      return () => {
        console.log(`Removing channel for ${table}`);
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error(`Error setting up realtime for ${table}:`, error);
      return () => {}; // Return empty cleanup function
    }
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
