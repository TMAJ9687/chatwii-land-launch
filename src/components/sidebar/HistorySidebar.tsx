import React, { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarInitial } from '@/utils/userUtils';
import { FirebaseListenerService } from '@/services/FirebaseListenerService';
import { formatDistanceToNow } from 'date-fns';

// Get the singleton instance
const firebaseListeners = FirebaseListenerService.getInstance();

interface HistorySidebarProps {
  onUserSelect: (userId: string) => void;
}

interface ConversationHistory {
  userId: string;
  nickname: string;
  avatar_url: string | null;
  lastMessageDate: Date;
  messageCount: number;
}

export const HistorySidebar = ({ onUserSelect }: HistorySidebarProps) => {
  const [history, setHistory] = useState<ConversationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversationHistory = async () => {
      const user = auth.currentUser;
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Query messages where the current user is a participant
        const messagesRef = collection(db, 'messages');
        const messagesQuery = query(
          messagesRef,
          where('participants', 'array-contains', user.uid),
          orderBy('created_at', 'desc')
        );

        const snapshot = await getDocs(messagesQuery);
        
        // Build map of conversations keyed by other user's ID
        const conversations = new Map<string, {
          lastMessageDate: Date,
          messageCount: number
        }>();

        snapshot.forEach(doc => {
          const message = doc.data();
          
          // Determine the other user in the conversation
          const otherUserId = message.sender_id === user.uid 
            ? message.receiver_id 
            : message.sender_id;
            
          // Skip if it's the same user (shouldn't happen with proper data)
          if (otherUserId === user.uid) return;
          
          const messageDate = message.created_at?.toDate() || new Date();
          
          if (!conversations.has(otherUserId)) {
            conversations.set(otherUserId, {
              lastMessageDate: messageDate,
              messageCount: 1
            });
          } else {
            const existing = conversations.get(otherUserId)!;
            conversations.set(otherUserId, {
              // Keep the most recent date
              lastMessageDate: messageDate > existing.lastMessageDate 
                ? messageDate 
                : existing.lastMessageDate,
              messageCount: existing.messageCount + 1
            });
          }
        });

        // Now fetch profile data for all users in conversations
        await fetchUserProfiles(conversations);
      } catch (error) {
        console.error('Error fetching conversation history:', error);
        setIsLoading(false);
      }
    };

    fetchConversationHistory();
  }, []);

  const fetchUserProfiles = async (conversations: Map<string, { lastMessageDate: Date, messageCount: number }>) => {
    if (conversations.size === 0) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      const userIds = Array.from(conversations.keys());
      
      // Fetch profiles in batches if there are many users
      const batchSize = 10;
      const profilesData: ConversationHistory[] = [];
      
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        
        const profilesRef = collection(db, 'profiles');
        const profileQuery = query(
          profilesRef,
          where('id', 'in', batch)
        );
        
        const profileSnapshot = await getDocs(profileQuery);
        
        profileSnapshot.forEach(doc => {
          const profile = doc.data();
          const userId = profile.id;
          const conversationData = conversations.get(userId);
          
          if (profile && conversationData) {
            profilesData.push({
              userId,
              nickname: profile.nickname || 'Unknown User',
              avatar_url: profile.avatar_url || null,
              lastMessageDate: conversationData.lastMessageDate,
              messageCount: conversationData.messageCount
            });
          }
        });
      }
      
      // Sort by most recent conversation first
      profilesData.sort((a, b) => b.lastMessageDate.getTime() - a.lastMessageDate.getTime());
      
      setHistory(profilesData);
    } catch (error) {
      console.error('Error fetching user profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user selection and close sidebar
  const handleUserSelect = (userId: string) => {
    onUserSelect(userId);
  };

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {!isLoading && history.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No conversation history
        </div>
      )}
      
      {history.map((conversation) => (
        <div
          key={conversation.userId}
          className="flex items-center justify-between p-3 hover:bg-muted rounded-lg cursor-pointer"
          onClick={() => handleUserSelect(conversation.userId)}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {conversation.avatar_url ? (
                <AvatarImage src={conversation.avatar_url} alt={conversation.nickname} />
              ) : (
                <AvatarFallback>{getAvatarInitial(conversation.nickname)}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{conversation.nickname}</span>
              <span className="text-xs text-muted-foreground">
                Last active {formatDistanceToNow(conversation.lastMessageDate, { addSuffix: true })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span>{conversation.messageCount}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
