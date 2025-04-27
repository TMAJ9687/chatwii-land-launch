
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  queryDocuments,
  createDocument,
  updateDocument,
  subscribeToQuery
} from '@/lib/firebase';
import { MessageWithMedia } from '@/types/message';

export const useChatState = (currentUserId: string | null) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithMedia[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Update unread count when user selects another user
  const handleUserSelect = useCallback((userId: string, nickname: string) => {
    setSelectedUserId(userId);
    
    // Fetch the conversation between current user and selected user
    fetchMessages(userId);
  }, [currentUserId]);

  // Fetch messages between current user and selected user
  const fetchMessages = useCallback(async (targetUserId: string) => {
    if (!currentUserId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Query messages where either user is sender or receiver
      const messagesData = await queryDocuments('messages', [
        { field: 'participants', operator: 'array-contains', value: currentUserId }
      ], 'created_at', 'asc');
      
      // Filter for messages between these two users only
      const relevantMessages = messagesData.filter(msg => 
        (msg.sender_id === currentUserId && msg.receiver_id === targetUserId) || 
        (msg.sender_id === targetUserId && msg.receiver_id === currentUserId)
      );
      
      // Mark messages as read
      const unreadMessages = relevantMessages.filter(
        msg => msg.receiver_id === currentUserId && !msg.is_read
      );
      
      for (const msg of unreadMessages) {
        await updateDocument('messages', msg.id, { is_read: true });
      }
      
      // Process and format messages for display
      const formattedMessages = await Promise.all(
        relevantMessages.map(async msg => {
          // Get media for message if any
          const mediaRecords = await queryDocuments('message_media', [
            { field: 'message_id', operator: '==', value: msg.id }
          ]);
          
          // Get reactions for message if any
          const reactionRecords = await queryDocuments('message_reactions', [
            { field: 'message_id', operator: '==', value: msg.id }
          ]);
          
          // Format as MessageWithMedia
          const messageWithMedia: MessageWithMedia = {
            id: msg.id,
            content: msg.content || '',
            sender_id: msg.sender_id,
            receiver_id: msg.receiver_id,
            is_read: msg.is_read || false,
            created_at: msg.created_at,
            updated_at: msg.updated_at,
            deleted_at: msg.deleted_at,
            translated_content: msg.translated_content,
            language_code: msg.language_code,
            reply_to: msg.reply_to,
            media: mediaRecords.length > 0 ? {
              id: mediaRecords[0].id,
              message_id: mediaRecords[0].message_id,
              user_id: mediaRecords[0].user_id,
              file_url: mediaRecords[0].file_url,
              media_type: mediaRecords[0].media_type as any,
              created_at: mediaRecords[0].created_at
            } : null,
            reactions: reactionRecords.map(reaction => ({
              id: reaction.id,
              message_id: reaction.message_id,
              user_id: reaction.user_id,
              emoji: reaction.emoji,
              created_at: reaction.created_at
            }))
          };
          
          return messageWithMedia;
        })
      );
      
      setMessages(formattedMessages);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(`Failed to load messages: ${err.message || 'Unknown error'}`);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      const unreadMessages = await queryDocuments('messages', [
        { field: 'receiver_id', operator: '==', value: currentUserId },
        { field: 'is_read', operator: '==', value: false }
      ]);
      
      setUnreadCount(unreadMessages.length);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [currentUserId]);

  // Listen for new messages
  useEffect(() => {
    if (!currentUserId) return;
    
    // Set up subscription to messages where current user is receiver
    const unsubscribe = subscribeToQuery(
      'messages',
      [
        { field: 'receiver_id', operator: '==', value: currentUserId },
        { field: 'is_read', operator: '==', value: false }
      ],
      (newMessages) => {
        if (newMessages.length > 0) {
          // Update unread count
          setUnreadCount(newMessages.length);
          
          // Show notification for new messages
          if (selectedUserId !== newMessages[0].sender_id) {
            toast('You have new messages');
          }
        }
      }
    );
    
    // Fetch initial unread count
    fetchUnreadCount();
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUserId, selectedUserId, fetchUnreadCount]);

  // Send a message
  const sendMessage = useCallback(async (content: string, receiverId: string, imageUrl?: string) => {
    if (!currentUserId) return;
    
    try {
      // Create message document
      const messageId = await createDocument('messages', {
        content: content || '',
        sender_id: currentUserId,
        receiver_id: receiverId,
        is_read: false,
        participants: [currentUserId, receiverId]
      });
      
      // If there's an image, create media document
      if (imageUrl && messageId) {
        await createDocument('message_media', {
          message_id: messageId,
          user_id: currentUserId,
          file_url: imageUrl,
          media_type: 'image'
        });
      }
      
      // Refresh messages
      fetchMessages(receiverId);
      
      return messageId;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      return null;
    }
  }, [currentUserId, fetchMessages]);

  return {
    selectedUserId,
    messages,
    isLoading,
    error,
    unreadCount,
    handleUserSelect,
    fetchMessages,
    fetchUnreadCount,
    sendMessage
  };
};
