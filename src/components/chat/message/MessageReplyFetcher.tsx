
import { useState, useEffect } from 'react';
import { MessageWithMedia } from '@/types/message';
import { queryDocuments } from '@/lib/firebase';

interface MessageReplyFetcherProps {
  replyToId: string | null | undefined;
  onReplyLoaded: (message: MessageWithMedia | null) => void;
}

export const MessageReplyFetcher = ({ 
  replyToId, 
  onReplyLoaded 
}: MessageReplyFetcherProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // Fetch reply message if this message is a reply
  useEffect(() => {
    // Skip if there's no reply reference
    if (!replyToId) {
      onReplyLoaded(null);
      return;
    }

    let isMounted = true;
    let fetchAborted = false;
    setIsLoading(true);

    // Function to fetch reply message with timeout and error handling
    const fetchReplyMessage = async () => {
      try {
        if (fetchAborted) return;
        
        // Set timeout for query operations
        const replyMessagePromise = queryDocuments('messages', [
          { field: 'id', operator: '==', value: replyToId }
        ]);
        
        // Use Promise.race to limit query time
        const replyMessages = await Promise.race([
          replyMessagePromise,
          new Promise<any[]>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout fetching reply message')), 3000)
          )
        ]);
        
        if (fetchAborted) return;
        const replyMsg = replyMessages?.[0];
        if (!replyMsg || !isMounted) {
          setIsLoading(false);
          return;
        }

        // Set timeout for media query operation
        const mediaQueryPromise = queryDocuments('message_media', [
          { field: 'message_id', operator: '==', value: replyMsg.id }
        ]);
        
        const mediaRecords = await Promise.race([
          mediaQueryPromise, 
          new Promise<any[]>((resolve) => {
            setTimeout(() => resolve([]), 2000);
          })
        ]);
        
        if (!isMounted || fetchAborted) {
          setIsLoading(false);
          return;
        }

        // Create full message object
        const fullReplyMessage: MessageWithMedia = {
          id: replyMsg.id,
          content: replyMsg.content || '',
          sender_id: replyMsg.sender_id,
          receiver_id: replyMsg.receiver_id,
          is_read: replyMsg.is_read || false,
          created_at: replyMsg.created_at,
          updated_at: replyMsg.updated_at,
          deleted_at: replyMsg.deleted_at,
          translated_content: replyMsg.translated_content,
          language_code: replyMsg.language_code,
          reply_to: replyMsg.reply_to,
          media: mediaRecords.length > 0 ? {
            id: mediaRecords[0].id,
            message_id: mediaRecords[0].message_id,
            user_id: mediaRecords[0].user_id,
            file_url: mediaRecords[0].file_url,
            media_type: mediaRecords[0].media_type,
            created_at: mediaRecords[0].created_at
          } : null,
          reactions: []
        };
        
        if (isMounted) {
          setIsLoading(false);
          onReplyLoaded(fullReplyMessage);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error or timeout fetching reply message:', error);
          setIsLoading(false);
          onReplyLoaded(null);
        }
      }
    };
    
    fetchReplyMessage();
    
    return () => { 
      isMounted = false;
      fetchAborted = true;
      setIsLoading(false);
    };
  }, [replyToId, onReplyLoaded]);

  // Render nothing - this is just a data fetcher
  return null;
};
