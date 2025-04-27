
import { useState, useEffect } from 'react';
import { MessageWithMedia } from '@/types/message';
import { useMessageActions } from '@/hooks/useMessageActions';
import { MessageActions } from './MessageActions';
import { MessageContent } from './MessageContent';
import { MessageMedia } from './MessageMedia';
import { MessageReactions } from './MessageReactions';
import { MessageTimestamp } from './MessageTimestamp';
import { MessageStatus } from './MessageStatus';
import { ReplyPreview } from './ReplyPreview';
import { queryDocuments } from '@/lib/firebase';

interface MessageBubbleProps {
  message: MessageWithMedia;
  currentUserId: string;
  isVipUser?: boolean;
  onImageClick: (url: string) => void;
  revealedImages: Set<number>;
  toggleImageReveal: (messageId: string) => void;
}

export const MessageBubble = ({ 
  message, 
  currentUserId, 
  isVipUser = false,
  onImageClick, 
  revealedImages,
  toggleImageReveal 
}: MessageBubbleProps) => {
  const [replyMessage, setReplyMessage] = useState<MessageWithMedia | null>(null);
  const isCurrentUser = message.sender_id === currentUserId;
  
  const {
    handleUnsendMessage,
    startReply,
    handleReactToMessage,
    translateMessage,
    translatingMessageId
  } = useMessageActions(currentUserId, isVipUser || false);

  // Fetch the message this is replying to, if any
  useEffect(() => {
    if (!message.reply_to) return;
    
    const fetchReplyMessage = async () => {
      try {
        const replyMessages = await queryDocuments('messages', [
          { field: 'id', operator: '==', value: message.reply_to }
        ]);
        
        if (replyMessages.length > 0) {
          const replyMsg = replyMessages[0];
          
          // Fetch media for the reply message
          const mediaRecords = await queryDocuments('message_media', [
            { field: 'message_id', operator: '==', value: replyMsg.id }
          ]);
          
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
          
          setReplyMessage(fullReplyMessage);
        }
      } catch (error) {
        console.error('Error fetching reply message:', error);
      }
    };
    
    fetchReplyMessage();
  }, [message.reply_to]);

  // Handle image reveal toggle
  const handleToggleImageReveal = () => {
    toggleImageReveal(message.id);
  };
  
  // Check if the image is revealed - update to handle string IDs
  const isImageRevealed = (messageIdStr: string): boolean => {
    // Try to parse the string ID to a number for compatibility with the Set<number>
    const messageIdNum = parseInt(messageIdStr, 10);
    
    // Check if we successfully parsed a number and if it exists in the Set
    if (!isNaN(messageIdNum)) {
      return revealedImages.has(messageIdNum);
    }
    
    // For string IDs that can't be converted to numbers, return false
    return false;
  };

  // Handle timestamp conversion for display
  const formatTimestamp = (timestamp: string | Date | any): string => {
    if (typeof timestamp === 'string') {
      return timestamp;
    } else if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    } else if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    return new Date().toISOString();
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} relative group`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isCurrentUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        {/* Reply preview if this is a reply */}
        {message.reply_to && (
          <ReplyPreview replyMessage={replyMessage} isCurrentUser={isCurrentUser} />
        )}

        {/* Message content */}
        <MessageContent message={message} isCurrentUser={isCurrentUser} />

        {/* Message media */}
        <MessageMedia 
          media={message.media} 
          messageId={message.id}
          isCurrentUser={isCurrentUser}
          onImageClick={onImageClick}
          isRevealed={isImageRevealed(message.id)}
          toggleImageReveal={handleToggleImageReveal}
        />
        
        {/* Display reactions if there are any */}
        <MessageReactions reactions={message.reactions} />
        
        {/* Message Actions */}
        <MessageActions
          message={message}
          isCurrentUser={isCurrentUser}
          isVipUser={isVipUser}
          onUnsend={() => handleUnsendMessage(message.id)}
          onReply={() => startReply(message.id)}
          onReact={(emoji) => handleReactToMessage(message.id, emoji)}
          onTranslate={() => translateMessage(message)}
        />

        {/* Timestamp and Status */}
        <div className="flex items-center justify-between mt-1">
          <MessageTimestamp timestamp={formatTimestamp(message.created_at)} isCurrentUser={isCurrentUser} />
          
          {isCurrentUser && isVipUser && (
            <MessageStatus isRead={message.is_read} />
          )}
        </div>
      </div>
    </div>
  );
};
