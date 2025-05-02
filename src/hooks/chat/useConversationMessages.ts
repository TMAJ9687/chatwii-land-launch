
import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MessageWithMedia } from '@/types/message';
import { trackFirestoreListener } from '@/utils/firebaseCleanup';
import { toast } from 'sonner';
import { getConversationId } from '@/utils/channelUtils';
import { isMockUser, getMockVipMessages } from '@/utils/mockUsers';

/**
 * Hook to manage messages for a conversation using Firestore
 */
export const useConversationMessages = (
  currentUserId: string | null,
  selectedUserId: string | null
) => {
  const [messages, setMessages] = useState<MessageWithMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle mock users separately for testing/demo
  const isMockUserSelected = selectedUserId ? isMockUser(selectedUserId) : false;
  
  // Listen for messages in this conversation
  useEffect(() => {
    // Reset state when user selection changes
    setMessages([]);
    setError(null);
    
    // Handle mock user messages (for demo/testing)
    if (isMockUserSelected && currentUserId) {
      const mockMessages = getMockVipMessages(currentUserId);
      setMessages(mockMessages as MessageWithMedia[]);
      return;
    }
    
    if (!currentUserId || !selectedUserId) {
      return;
    }
    
    // Get conversation ID
    const conversationId = getConversationId(currentUserId, selectedUserId);
    if (!conversationId) return;
    
    setIsLoading(true);
    
    try {
      // Query messages for this conversation, ordered by creation time
      const q = query(
        collection(db, 'messages'),
        where('participants', 'array-contains', currentUserId),
        orderBy('created_at', 'asc')
      );
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(
        q, 
        (snapshot) => {
          try {
            // Process and filter messages for this conversation only
            const now = new Date();
            const conversationMessages: MessageWithMedia[] = [];
            
            snapshot.forEach(doc => {
              const data = doc.data();
              
              // Only include messages between these two users
              if (
                (data.sender_id === currentUserId && data.receiver_id === selectedUserId) ||
                (data.sender_id === selectedUserId && data.receiver_id === currentUserId)
              ) {
                // Skip messages that have expired (if expire_at is set)
                if (data.expire_at && data.expire_at instanceof Timestamp) {
                  if (data.expire_at.toDate() < now) {
                    return; // Skip expired message
                  }
                }
                
                // Add to conversation messages
                conversationMessages.push({
                  id: doc.id,
                  content: data.content || '',
                  sender_id: data.sender_id,
                  receiver_id: data.receiver_id,
                  is_read: Boolean(data.is_read),
                  created_at: data.created_at,
                  updated_at: data.updated_at,
                  deleted_at: data.deleted_at || null,
                  translated_content: data.translated_content || null,
                  language_code: data.language_code || null,
                  reply_to: data.reply_to || null,
                  media: data.media || null,
                  reactions: data.reactions || []
                });
              }
            });
            
            // Sort by creation date
            conversationMessages.sort((a, b) => {
              const dateA = a.created_at instanceof Timestamp
                ? a.created_at.toMillis()
                : new Date(a.created_at as string).getTime();
                
              const dateB = b.created_at instanceof Timestamp 
                ? b.created_at.toMillis()
                : new Date(b.created_at as string).getTime();
                
              return dateA - dateB;
            });
            
            setMessages(conversationMessages);
            setError(null);
            setIsLoading(false);
          } catch (err) {
            console.error('Error processing message snapshot:', err);
            setError('Error processing messages');
            setIsLoading(false);
          }
        },
        (err) => {
          console.error('Error in messages snapshot:', err);
          setError(`Failed to load messages: ${err.message}`);
          setIsLoading(false);
          toast.error('Error loading messages');
        }
      );
      
      // Track for cleanup
      trackFirestoreListener(unsubscribe);
      
      return () => {
        unsubscribe();
      };
    } catch (err: any) {
      console.error('Error setting up message listener:', err);
      setError(`Error setting up message listener: ${err.message}`);
      setIsLoading(false);
    }
  }, [currentUserId, selectedUserId, isMockUserSelected]);
  
  // Function to mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    // This would update is_read status in Firestore
    // Implementation will come in the next phase
    console.log('Marking messages as read');
    return Promise.resolve();
  }, []);
  
  return {
    messages,
    setMessages,
    isLoading,
    error,
    markMessagesAsRead
  };
};
