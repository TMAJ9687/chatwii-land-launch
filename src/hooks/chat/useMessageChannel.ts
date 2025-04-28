
import { useCallback, useRef } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue, off } from 'firebase/database';
import { MessageWithMedia } from '@/types/message';
import { isMockUser } from '@/utils/mockUsers';
import { queryDocuments } from '@/lib/firebase';

export const useMessageChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<MessageWithMedia[]>>
) => {
  const messageListenerRef = useRef<any>(null);

  const cleanupMessageChannel = useCallback(() => {
    if (messageListenerRef.current) {
      off(messageListenerRef.current);
      messageListenerRef.current = null;
      console.log('Cleaned up message channel');
    }
  }, []);

  const setupMessageChannel = useCallback(() => {
    if (!currentUserId || !selectedUserId) return null;

    // Clean up any existing listener first
    cleanupMessageChannel();
    
    try {
      console.log('Setting up message channel with Firebase');
      
      // Create a reference to the messages path for this conversation
      const conversationPath = `messages/${currentUserId}_${selectedUserId}`;
      const messagesRef = ref(realtimeDb, conversationPath);
      messageListenerRef.current = messagesRef;
      
      // Set up the value listener
      onValue(messagesRef, async (snapshot) => {
        // Skip mock user updates
        if (isMockUser(selectedUserId)) return;
        
        const data = snapshot.val();
        if (!data) return;
        
        // Process each message to get media and reactions
        const processedMessages = await Promise.all(
          Object.values(data).map(async (msg: any) => {
            const mediaRecords = await queryDocuments('message_media', [
              { field: 'message_id', operator: '==', value: msg.id }
            ]);
            
            const reactionRecords = await queryDocuments('message_reactions', [
              { field: 'message_id', operator: '==', value: msg.id }
            ]);
            
            return {
              ...msg,
              media: mediaRecords.length > 0 ? {
                id: mediaRecords[0].id,
                message_id: mediaRecords[0].message_id,
                user_id: mediaRecords[0].user_id,
                file_url: mediaRecords[0].file_url,
                media_type: mediaRecords[0].media_type,
                created_at: mediaRecords[0].created_at
              } : null,
              reactions: reactionRecords
            };
          })
        );
        
        setMessages(processedMessages);
      });
      
      return messagesRef;
    } catch (error) {
      console.error('Failed to setup message channel:', error);
      return null;
    }
  }, [currentUserId, selectedUserId, setMessages, cleanupMessageChannel]);

  return {
    setupMessageChannel,
    cleanupMessageChannel
  };
};
