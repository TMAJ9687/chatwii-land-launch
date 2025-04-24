
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
  onDataChange: (payload: { new: T; old: T | null }) => void
) {
  const { table, event = '*', schema = 'public', filter } = options;

  useEffect(() => {
    // Enable postgres changes for the specified table if not already done
    const enableRealtimeForTable = async () => {
      try {
        // This is a best-effort approach as it requires admin privileges
        await supabase.rpc('enable_realtime', { table_name: table });
      } catch (error) {
        // It's ok if this fails as the table might already be enabled via SQL
        console.log(`Note: Couldn't enable realtime for ${table} via RPC, it may already be enabled via SQL.`);
      }
    };

    enableRealtimeForTable();

    // Subscribe to changes
    const channel = supabase.channel(`table-changes-${table}`)
      .on(
        'postgres_changes',
        {
          event: event,
          schema: schema,
          table: table,
          filter: filter,
        },
        (payload) => {
          onDataChange(payload as { new: T; old: T | null });
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
export function useReportsUpdates(onReportUpdate: (report: any) => void) {
  useRealtimeUpdates(
    { table: 'reports', event: '*' },
    (payload) => {
      onReportUpdate(payload);
    }
  );
}
