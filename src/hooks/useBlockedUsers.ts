
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useBlockedUsers = () => {
  const queryClient = useQueryClient();

  const { data: blockedUsers = [], isLoading: isLoadingBlocks } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id);

      if (error) throw error;
      return data.map(b => b.blocked_id);
    }
  });

  // Get users who have blocked the current user
  const { data: blockedByUsers = [], isLoading: isLoadingBlockedBy } = useQuery({
    queryKey: ['blocked-by-users'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('blocked_users')
        .select('blocker_id')
        .eq('blocked_id', user.id);

      if (error) throw error;
      return data.map(b => b.blocker_id);
    }
  });

  const blockUser = useMutation({
    mutationFn: async (blockedId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('blocked_users')
        .insert({ blocker_id: user.id, blocked_id: blockedId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      toast.success('User blocked successfully');
    },
    onError: () => {
      toast.error('Failed to block user');
    }
  });

  const unblockUser = useMutation({
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
    onError: () => {
      toast.error('Failed to unblock user');
    }
  });

  // Check if a user is blocked by the current user or if they have blocked the current user
  const isUserBlocked = (userId: string) => {
    return blockedUsers.includes(userId);
  };

  const isBlockedByUser = (userId: string) => {
    return blockedByUsers.includes(userId);
  };

  const canInteractWithUser = (userId: string) => {
    return !isUserBlocked(userId) && !isBlockedByUser(userId);
  };

  return {
    blockedUsers,
    blockedByUsers,
    blockUser: blockUser.mutate,
    unblockUser: unblockUser.mutate,
    isUserBlocked,
    isBlockedByUser,
    canInteractWithUser,
    isLoadingBlocks,
    isLoadingBlockedBy
  };
};
