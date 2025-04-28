
import { useEffect, useState, useCallback } from 'react';
import { MessageWithMedia } from '@/types/message';
import { queryDocuments } from '@/lib/firebase';

interface MessageReplyFetcherProps {
  replyToId?: string | null;
  onReplyLoaded: (message: MessageWithMedia | null) => void;
}

/**
 * This component doesn't render anything, it only fetches reply message data
 * and provides it to its parent through the callback
 */
export const MessageReplyFetcher = ({ 
  replyToId, 
  onReplyLoaded 
}: MessageReplyFetcherProps) => {
  // Use an internal state to avoid unnecessary re-renders of parent components
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch the message that is being replied to
  const fetchReplyMessage = useCallback(async (messageId: string) => {
    if (!messageId) {
      onReplyLoaded(null);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Fetch the message
      const messages = await queryDocuments('messages', [
        { field: 'id', operator: '==', value: messageId }
      ]);
      
      if (!messages || messages.length === 0) {
        onReplyLoaded(null);
        return;
      }
      
      // Fetch associated media if any
      const message = messages[0];
      const mediaRecords = await queryDocuments('message_media', [
        { field: 'message_id', operator: '==', value: messageId }
      ]);
      
      // Create the complete message object
      const completeMessage: MessageWithMedia = {
        ...message,
        media: mediaRecords && mediaRecords.length > 0 ? {
          id: mediaRecords[0].id,
          message_id: mediaRecords[0].message_id,
          user_id: mediaRecords[0].user_id,
          file_url: mediaRecords[0].file_url,
          media_type: mediaRecords[0].media_type,
          created_at: mediaRecords[0].created_at,
        } : null,
        reactions: [] // We don't need reactions for reply preview
      };
      
      onReplyLoaded(completeMessage);
    } catch (err) {
      console.error('Error fetching reply message:', err);
      onReplyLoaded(null);
    } finally {
      setIsLoading(false);
    }
  }, [onReplyLoaded]);
  
  useEffect(() => {
    if (replyToId) {
      fetchReplyMessage(replyToId);
    } else {
      onReplyLoaded(null);
    }
  }, [replyToId, fetchReplyMessage, onReplyLoaded]);
  
  // This component doesn't render anything
  return null;
};
