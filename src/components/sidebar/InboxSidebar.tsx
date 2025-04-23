
import React, { useEffect } from 'react';
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

      // First, get all unread messages for this user
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          sender_id,
          profiles!messages_sender_id_fkey (
            nickname,
            avatar_url
          )
        `)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (messagesError) throw messagesError;
      
      // Process the results to count unread messages by sender
      const userMessageCounts = new Map();
      
      messagesData.forEach(item => {
        const senderId = item.sender_id;
        const userProfile = item.profiles || { nickname: 'Unknown', avatar_url: null };
        
        if (userMessageCounts.has(senderId)) {
          // Increment count for existing sender
          const existing = userMessageCounts.get(senderId);
          userMessageCounts.set(senderId, {
            ...existing,
            unread_count: existing.unread_count + 1
          });
        } else {
          // Add new sender to map
          userMessageCounts.set(senderId, {
            id: senderId,
            nickname: userProfile.nickname,
            avatar_url: userProfile.avatar_url,
            unread_count: 1
          });
        }
      });
      
      // Convert Map to array for returning
      return Array.from(userMessageCounts.values());
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Subscribe to message changes
  useEffect(() => {
    const checkAuth = async () => {
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
    };

    checkAuth();
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
