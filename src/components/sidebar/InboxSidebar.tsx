
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCurrentUser, queryDocuments, subscribeToQuery } from '@/lib/firebase';

interface InboxSidebarProps {
  onUserSelect: (userId: string) => void;
}

interface ConversationUser {
  id: string;
  nickname: string;
  avatar_url: string | null;
  unread_count: number;
}

export const InboxSidebar = ({ onUserSelect }: InboxSidebarProps) => {
  const [conversations, setConversations] = useState<ConversationUser[]>([]);

  const fetchInboxUsers = async () => {
    const user = getCurrentUser();
    if (!user || !user.uid) throw new Error('Not authenticated');

    // Get all unread messages for this user
    const messagesData = await queryDocuments('messages', [
      { field: 'receiver_id', operator: '==', value: user.uid },
      { field: 'is_read', operator: '==', value: false }
    ]);

    // Process the results to count unread messages by sender
    const userMessageCounts = new Map<string, ConversationUser>();
    
    for (const message of messagesData) {
      // Skip invalid messages
      if (!message || !message.sender_id) continue;
      
      const senderId = message.sender_id;
      
      // Get sender profile info
      let senderProfile = null;
      if (!userMessageCounts.has(senderId)) {
        const profiles = await queryDocuments('profiles', [
          { field: 'id', operator: '==', value: senderId }
        ]);
        senderProfile = profiles.length > 0 ? profiles[0] : null;
      }
      
      if (userMessageCounts.has(senderId)) {
        // Increment count for existing sender
        const existing = userMessageCounts.get(senderId)!;
        userMessageCounts.set(senderId, {
          ...existing,
          unread_count: existing.unread_count + 1
        });
      } else {
        // Add new sender to map
        userMessageCounts.set(senderId, {
          id: senderId,
          nickname: senderProfile?.nickname || 'Unknown',
          avatar_url: senderProfile?.avatar_url || null,
          unread_count: 1
        });
      }
    }
    
    // Convert Map to array
    return Array.from(userMessageCounts.values());
  };
  
  const { refetch } = useQuery({
    queryKey: ['inbox-users'],
    queryFn: fetchInboxUsers,
    onSuccess: (data) => {
      setConversations(data || []);
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Subscribe to message changes
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !user.uid) return;
    
    // Listen for new messages where current user is the receiver
    const unsubscribe = subscribeToQuery(
      'messages',
      [
        { field: 'receiver_id', operator: '==', value: user.uid },
        { field: 'is_read', operator: '==', value: false }
      ],
      () => {
        // Refetch conversations when new messages arrive
        refetch();
      }
    );
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
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
      
      {conversations.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No unread messages
        </div>
      )}
    </div>
  );
};
