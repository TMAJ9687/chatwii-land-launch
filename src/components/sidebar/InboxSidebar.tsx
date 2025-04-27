
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

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
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const messagesRef = collection(db, 'messages');
    const unreadQuery = query(
      messagesRef,
      where('receiver_id', '==', user.uid),
      where('is_read', '==', false)
    );

    const messagesData = await getDocs(unreadQuery);
    const userMessageCounts = new Map<string, ConversationUser>();

    for (const doc of messagesData.docs) {
      const message = doc.data();
      if (!message || !message.sender_id) continue;

      const senderId = message.sender_id;

      if (!userMessageCounts.has(senderId)) {
        const profileQuery = query(
          collection(db, 'profiles'),
          where('id', '==', senderId)
        );
        const profileDocs = await getDocs(profileQuery);
        const senderProfile = profileDocs.docs[0]?.data();

        if (!userMessageCounts.has(senderId)) {
          userMessageCounts.set(senderId, {
            id: senderId,
            nickname: senderProfile?.nickname || 'Unknown',
            avatar_url: senderProfile?.avatar_url || null,
            unread_count: 1
          });
        }
      } else {
        const existing = userMessageCounts.get(senderId)!;
        userMessageCounts.set(senderId, {
          ...existing,
          unread_count: existing.unread_count + 1
        });
      }
    }

    return Array.from(userMessageCounts.values());
  };

  const { data: conversationsData, refetch } = useQuery({
    queryKey: ['inbox-users'],
    queryFn: fetchInboxUsers,
    refetchInterval: 10000
  });

  // Update conversations state when query data changes
  useEffect(() => {
    if (conversationsData) {
      setConversations(conversationsData);
    }
  }, [conversationsData]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const messagesRef = collection(db, 'messages');
    const unreadQuery = query(
      messagesRef,
      where('receiver_id', '==', user.uid),
      where('is_read', '==', false)
    );

    const unsubscribe = onSnapshot(unreadQuery, () => {
      refetch();
    });

    return () => unsubscribe();
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
