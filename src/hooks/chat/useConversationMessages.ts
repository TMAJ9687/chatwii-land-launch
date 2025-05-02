
import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MessageWithMedia } from '@/types/message';
import { trackFirestoreListener } from '@/utils/firebaseCleanup';
import { isMockUser, getMockVipMessages } from '@/utils/mockUsers';

/**
 * Hook to manage and listen to messages for a conversation using Firestore
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
  
  useEffect(() => {
    setMessages([]);
    setError(null);
    
    // Handle mock user messages (for demo/testing)
    if (isMockUserSelected && currentUserId) {
      const mockMessages = getMockVipMessages(currentUserId);
      
      // Convert mock messages to proper MessageWithMedia type
      // Add required fields that might be missing
      const completeMessages: MessageWithMedia[] = mockMessages.map(msg => ({
        id: String(msg.id || ''),
        content: msg.content || '',
        sender_id: msg.sender_id || '',
        receiver_id: msg.receiver_id || '',
        is_read: Boolean(msg.is_read),
        created_at: msg.created_at || new Date().toISOString(),
        media: msg.media || null,
        reactions: msg.reactions || [],  // Ensure reactions exists
        updated_at: msg.updated_at || msg.created_at || new Date().toISOString(),
        deleted_at: null,
        translated_content: null,
        language_code: null,
        reply_to: null
      }));
      
      setMessages(completeMessages);
      return;
    }
    
    if (!currentUserId || !selectedUserId) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create a conversation ID using both user IDs (sorted for consistency)
      const conversationId = [currentUserId, selectedUserId].sort().join('_');
      
      // Query messages for this conversation, ordered by creation time
      const q = query(
        collection(db, 'messages'),
        where('conversation_id', '==', conversationId),
        orderBy('created_at', 'asc')
      );
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            const conversationMessages: MessageWithMedia[] = [];
            const now = new Date();
            
            snapshot.forEach(doc => {
              const data = doc.data();
              
              // Skip messages that have expired (if expire_at is set)
              if (data.expire_at && new Date(data.expire_at.toDate()) < now) {
                return;
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
            });
            
            setMessages(conversationMessages);
            setIsLoading(false);
            setError(null);
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

  return {
    messages,
    isLoading,
    error
  };
};
