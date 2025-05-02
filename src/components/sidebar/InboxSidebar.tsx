
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp, DocumentData } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuthProfile } from '@/hooks/useAuthProfile';
import { Loader2 } from 'lucide-react';
import { getAvatarInitial } from '@/utils/userUtils';
import { FirebaseListenerService } from '@/services/FirebaseListenerService';

// Get the singleton instance
const firebaseListeners = FirebaseListenerService.getInstance();

interface InboxSidebarProps {
  onUserSelect: (userId: string) => void;
}

interface ConversationUser {
  id: string;
  nickname: string;
  avatar_url: string | null;
  unread_count: number;
  last_message?: string;
  last_message_time?: Date;
}

export const InboxSidebar = ({ onUserSelect }: InboxSidebarProps) => {
  const [conversations, setConversations] = useState<ConversationUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { currentUserId } = useAuthProfile();

  // Set up listener for unread messages
  useEffect(() => {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Create a unique key for this listener
    const listenerKey = `inbox-messages-${currentUserId}`;
    
    // Query for messages where the current user is a participant
    const messagesRef = collection(db, 'messages');
    const messageQuery = query(
      messagesRef,
      where('participants', 'array-contains', currentUserId),
      orderBy('created_at', 'desc')
    );

    // Set up the listener
    const unsubscribe = firebaseListeners.subscribe(
      listenerKey,
      messageQuery,
      (snapshot: any) => {
        if (!snapshot) {
          setConversations([]);
          setIsLoading(false);
          return;
        }

        const userMessageCounts = new Map<string, ConversationUser>();
        
        snapshot.forEach((doc: DocumentData) => {
          const message = doc.data();
          if (!message) return;

          // Figure out the other user in the conversation
          const otherUserId = message.sender_id === currentUserId 
            ? message.receiver_id
            : message.sender_id;

          // Count as unread if the message is not read and not from the current user
          const isUnread = !message.is_read && message.sender_id !== currentUserId;

          // Update or create conversation entry
          if (userMessageCounts.has(otherUserId)) {
            const existing = userMessageCounts.get(otherUserId)!;
            
            // Update last message if this is newer
            const messageTime = message.created_at?.toDate();
            const existingTime = existing.last_message_time || new Date(0);
            
            if (messageTime > existingTime) {
              existing.last_message = message.content;
              existing.last_message_time = messageTime;
            }
            
            // Increment unread count if needed
            if (isUnread) {
              userMessageCounts.set(otherUserId, {
                ...existing,
                unread_count: existing.unread_count + 1
              });
            }
          } else {
            // Get the timestamp as a Date
            const messageTime = message.created_at?.toDate() || new Date();
            
            // Add new conversation
            userMessageCounts.set(otherUserId, {
              id: otherUserId,
              nickname: 'Loading...',
              avatar_url: null,
              unread_count: isUnread ? 1 : 0,
              last_message: message.content,
              last_message_time: messageTime
            });
          }
        });
        
        // Load user profiles for conversations
        loadUserProfiles(Array.from(userMessageCounts.entries()));
      },
      (error) => {
        console.error('Error fetching inbox messages:', error);
        setIsLoading(false);
      }
    );
    
    return () => {
      firebaseListeners.unsubscribe(listenerKey);
    };
  }, [currentUserId]);

  // Helper function to load user profiles
  const loadUserProfiles = async (conversationEntries: [string, ConversationUser][]) => {
    if (conversationEntries.length === 0) {
      setConversations([]);
      setIsLoading(false);
      return;
    }
    
    try {
      // Get all user IDs that need profiles
      const userIds = conversationEntries.map(([id]) => id);
      
      // Set up profiles listener
      const profilesRef = collection(db, 'profiles');
      const profileQuery = query(
        profilesRef,
        where('id', 'in', userIds)
      );
      
      // Subscribe to profiles
      const listenerKey = `inbox-profiles-${currentUserId}`;
      
      firebaseListeners.subscribe(
        listenerKey,
        profileQuery,
        (snapshot: any) => {
          if (!snapshot) {
            setIsLoading(false);
            return;
          }
          
          // Create a map of user profiles
          const profiles = new Map();
          snapshot.forEach((doc: DocumentData) => {
            const profile = doc.data();
            if (profile && profile.id) {
              profiles.set(profile.id, {
                nickname: profile.nickname || 'Unknown',
                avatar_url: profile.avatar_url || null
              });
            }
          });
          
          // Update conversations with profile data
          const updatedConversations = conversationEntries.map(([userId, conv]) => {
            const profile = profiles.get(userId);
            if (profile) {
              return {
                ...conv,
                nickname: profile.nickname,
                avatar_url: profile.avatar_url
              };
            }
            return {
              ...conv,
              nickname: 'Unknown User'
            };
          });
          
          // Sort by last message time (most recent first)
          updatedConversations.sort((a, b) => {
            const dateA = a.last_message_time || new Date(0);
            const dateB = b.last_message_time || new Date(0);
            return dateB.getTime() - dateA.getTime();
          });
          
          setConversations(updatedConversations);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error fetching user profiles:', error);
          setIsLoading(false);
        }
      );
      
    } catch (error) {
      console.error('Error loading user profiles:', error);
      setIsLoading(false);
      
      // Still show conversations without profile data
      const basicConversations = conversationEntries.map(([userId, conv]) => ({
        ...conv,
        nickname: 'Unknown User'
      }));
      
      setConversations(basicConversations);
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
      
      {!isLoading && conversations.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No conversations yet
        </div>
      )}
      
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer"
          onClick={() => handleUserSelect(conversation.id)}
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
              {conversation.last_message && (
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {conversation.last_message}
                </span>
              )}
            </div>
          </div>
          
          {conversation.unread_count > 0 && (
            <Badge variant="destructive" className="ml-2">
              {conversation.unread_count}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
};
