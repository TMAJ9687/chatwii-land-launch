
import { useEffect, useState } from 'react';
import { MessageWithMedia } from '@/types/message';
import { queryDocuments } from '@/lib/firebase';

interface MessageReplyFetcherProps {
  replyToId?: string | null;
  onReplyLoaded: (message: MessageWithMedia | null) => void;
}

/**
 * Component that handles fetching reply message data
 * This component doesn't render anything visible - it just fetches data
 * and provides it to the parent component via the onReplyLoaded callback
 */
export const MessageReplyFetcher: React.FC<MessageReplyFetcherProps> = ({
  replyToId,
  onReplyLoaded
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!replyToId) {
      onReplyLoaded(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    
    const fetchReplyMessage = async () => {
      try {
        // Fetch the original message
        const replyMessages = await queryDocuments('messages', [
          { field: 'id', operator: '==', value: replyToId }
        ]);
        
        if (!isMounted) return;
        
        if (replyMessages.length > 0) {
          const replyMsg = replyMessages[0];
          
          // Fetch media if any
          const mediaRecords = await queryDocuments('message_media', [
            { field: 'message_id', operator: '==', value: replyMsg.id }
          ]);
          
          if (!isMounted) return;
          
          // Construct full message with media
          const fullMessage: MessageWithMedia = {
            ...replyMsg,
            media: mediaRecords.length > 0 
              ? {
                  id: mediaRecords[0].id,
                  message_id: mediaRecords[0].message_id,
                  user_id: mediaRecords[0].user_id,
                  file_url: mediaRecords[0].file_url,
                  media_type: mediaRecords[0].media_type,
                  created_at: mediaRecords[0].created_at
                }
              : null,
            reactions: []
          };
          
          onReplyLoaded(fullMessage);
        } else {
          onReplyLoaded(null);
        }
      } catch (error) {
        console.error('Error fetching reply message:', error);
        if (isMounted) {
          onReplyLoaded(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchReplyMessage();
    
    return () => {
      isMounted = false;
    };
  }, [replyToId, onReplyLoaded]);

  // This component doesn't render anything visible
  return null;
};
