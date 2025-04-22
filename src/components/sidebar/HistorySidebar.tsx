
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface HistorySidebarProps {
  onUserSelect: (userId: string) => void;
}

export const HistorySidebar = ({ onUserSelect }: HistorySidebarProps) => {
  const { data: conversationHistory } = useQuery({
    queryKey: ['chat-history'],
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
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Deduplicate users
      const uniqueUsers = new Map();
      data?.forEach(msg => {
        if (msg.sender_id !== user.id && !uniqueUsers.has(msg.sender_id)) {
          uniqueUsers.set(msg.sender_id, msg.profiles);
        }
      });

      return Array.from(uniqueUsers.entries()).map(([id, profile]) => ({
        id,
        ...profile
      }));
    }
  });

  return (
    <div className="space-y-4">
      {conversationHistory?.map((user) => (
        <Button
          key={user.id}
          variant="ghost"
          className="w-full justify-start"
          onClick={() => onUserSelect(user.id)}
        >
          {user.nickname}
        </Button>
      ))}
    </div>
  );
};
