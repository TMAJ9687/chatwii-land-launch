
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
          
          setReplyMessage({
            ...replyMsg,
            media: mediaRecords.length > 0 ? {
              id: mediaRecords[0].id,
              message_id: mediaRecords[0].message_id,
              user_id: mediaRecords[0].user_id,
              file_url: mediaRecords[0].file_url,
              media_type: mediaRecords[0].media_type as any,
              created_at: mediaRecords[0].created_at
            } : null,
            reactions: []
          });
        }
      } catch (error) {
        console.error('Error fetching reply message:', error);
      }
    };
    
    fetchReplyMessage();
  }, [message.reply_to]);

  // Convert message ID for existing toggleImageReveal function
  const handleToggleImageReveal = () => {
    toggleImageReveal(message.id);
  };
  
  // Check if the image is revealed
  const isImageRevealed = (messageIdStr: string): boolean => {
    // Convert string ID to number for compatibility with existing Set
    const messageIdNum = parseInt(messageIdStr, 10);
    return !isNaN(messageIdNum) && revealedImages.has(messageIdNum);
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
          <MessageTimestamp timestamp={message.created_at} isCurrentUser={isCurrentUser} />
          
          {isCurrentUser && isVipUser && (
            <MessageStatus isRead={message.is_read} />
          )}
        </div>
      </div>
    </div>
  );
};
