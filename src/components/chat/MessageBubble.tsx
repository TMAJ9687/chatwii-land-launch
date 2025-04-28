
import { useState, useEffect, memo } from 'react';
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
  revealedImages: Set<string>;
  toggleImageReveal: (messageId: string) => void;
}

export const MessageBubble = memo(({
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

  useEffect(() => {
    if (!message.reply_to) return;
    
    const fetchReplyMessage = async () => {
      try {
        const replyMessages = await queryDocuments('messages', [
          { field: 'id', operator: '==', value: message.reply_to }
        ]);
        
        if (replyMessages.length > 0) {
          const replyMsg = replyMessages[0];
          
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

  const handleToggleImageReveal = () => {
    if (message.id) {
      toggleImageReveal(message.id);
    }
  };
  
  const isImageRevealed = (messageId: string | undefined): boolean => {
    if (!messageId) {
      return false;
    }
    
    return revealedImages.has(messageId);
  };

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
        {message.reply_to && (
          <ReplyPreview replyMessage={replyMessage} isCurrentUser={isCurrentUser} />
        )}

        <MessageContent message={message} isCurrentUser={isCurrentUser} />

        <MessageMedia 
          media={message.media} 
          messageId={message.id}
          isCurrentUser={isCurrentUser}
          onImageClick={onImageClick}
          isRevealed={isImageRevealed(message.id)}
          toggleImageReveal={handleToggleImageReveal}
        />
        
        <MessageReactions reactions={message.reactions} />
        
        <MessageActions
          message={message}
          isCurrentUser={isCurrentUser}
          isVipUser={isVipUser}
          onUnsend={() => handleUnsendMessage(message.id)}
          onReply={() => startReply(message.id)}
          onReact={(emoji) => handleReactToMessage(message.id, emoji)}
          onTranslate={() => translateMessage(message)}
        />

        <div className="flex items-center justify-between mt-1">
          <MessageTimestamp timestamp={formatTimestamp(message.created_at)} isCurrentUser={isCurrentUser} />
          
          {isCurrentUser && isVipUser && (
            <MessageStatus isRead={message.is_read} />
          )}
        </div>
      </div>
    </div>
  );
});

// Add display name for better debugging
MessageBubble.displayName = 'MessageBubble';
