
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface InboxSidebarProps {
  onUserSelect: (userId: string) => void;
}

export const InboxSidebar = ({ onUserSelect }: InboxSidebarProps) => {
  const { data: conversations } = useQuery({
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
          )
        `)
        .eq('receiver_id', user.id)
        .is('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-4">
      {conversations?.map((conversation) => (
        <Button
          key={conversation.sender_id}
          variant="ghost"
          className="w-full justify-start"
          onClick={() => onUserSelect(conversation.sender_id)}
        >
          {conversation.profiles?.nickname}
        </Button>
      ))}
    </div>
  );
};
