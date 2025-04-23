
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface InboxSidebarProps {
  onUserSelect: (userId: string) => void;
}

export const InboxSidebar = ({ onUserSelect }: InboxSidebarProps) => {
  const { data: conversations, refetch } = useQuery({
    queryKey: ['inbox-users'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .select(`
          sender_id,
          profiles!messages_sender_id_fkey (
            nickname,
            avatar_url
          ),
          count
        `)
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .group('sender_id, profiles!messages_sender_id_fkey(nickname, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(item => ({
        id: item.sender_id,
        nickname: item.profiles?.nickname,
        avatar_url: item.profiles?.avatar_url,
        unread_count: item.count
      }));
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Subscribe to message changes
  React.useEffect(() => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const channel = supabase
      .channel('inbox-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          // Refetch conversations when new messages arrive
          refetch();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return (
    <div className="space-y-4">
      {conversations?.map((conversation) => (
        <Button
          key={conversation.id}
          variant="ghost"
          className="w-full justify-between"
          onClick={() => onUserSelect(conversation.id)}
        >
          <span>{conversation.nickname}</span>
          {conversation.unread_count > 0 && (
            <Badge variant="destructive" className="ml-2">
              {conversation.unread_count}
            </Badge>
          )}
        </Button>
      ))}
      
      {conversations?.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No unread messages
        </div>
      )}
    </div>
  );
};
