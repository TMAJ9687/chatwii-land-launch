
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const BlockedUsersSidebar = () => {
  const queryClient = useQueryClient();

  const { data: blockedUsers } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          blocked_id,
          profiles!blocked_users_blocked_id_fkey (
            nickname
          )
        `)
        .eq('blocker_id', user.id);

      if (error) throw error;
      return data;
    }
  });

  const unblockMutation = useMutation({
    mutationFn: async (blockedId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      toast.success('User unblocked successfully');
    },
    onError: (error) => {
      toast.error('Failed to unblock user');
      console.error('Unblock error:', error);
    }
  });

  return (
    <div className="space-y-4">
      {blockedUsers?.map((blocked) => (
        <div key={blocked.blocked_id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
          <span>{blocked.profiles?.nickname}</span>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => unblockMutation.mutate(blocked.blocked_id)}
          >
            Unblock
          </Button>
        </div>
      ))}
    </div>
  );
};
