
import { useState, useCallback } from 'react';
import { MessageWithMedia } from '@/types/message';
import { useMessageActions } from '@/hooks/useMessageActions';
import { MessageActions } from './MessageActions';
import { MessageContent } from './MessageContent';
import { MessageMedia } from './MessageMedia';
import { MessageReactions } from './MessageReactions';
import { MessageBubbleWrapper } from './message/MessageBubbleWrapper';
import { MessageVisibilityStatus } from './message/MessageVisibilityStatus';
import { MessageReplyFetcher } from './message/MessageReplyFetcher';

interface MessageBubbleProps {
  message: MessageWithMedia;
  currentUserId: string;
  isVipUser?: boolean;
  onImageClick: (url: string) => void;
  revealedImages: Set<string>;
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
    translatingMessageId,
  } = useMessageActions(currentUserId, isVipUser);

  // Utilities
  const isImageRevealed = useCallback(
    (messageId?: string) => !!messageId && revealedImages.has(messageId),
    [revealedImages]
  );

  const formatTimestamp = (timestamp: string | Date | any): string => {
    if (typeof timestamp === 'string') return timestamp;
    if (timestamp && typeof timestamp.toDate === 'function') return timestamp.toDate().toISOString();
    if (timestamp instanceof Date) return timestamp.toISOString();
    return new Date().toISOString();
  };

  // Handlers
  const handleToggleImageReveal = () => {
    if (message.id) toggleImageReveal(message.id);
  };

  // Handler for when reply message is loaded
  const handleReplyLoaded = useCallback((loadedMessage: MessageWithMedia | null) => {
    setReplyMessage(loadedMessage);
  }, []);

  return (
    <>
      {/* This component fetches reply data if needed but doesn't render anything */}
      <MessageReplyFetcher 
        replyToId={message.reply_to} 
        onReplyLoaded={handleReplyLoaded}
      />

      <MessageBubbleWrapper 
        message={message} 
        replyMessage={replyMessage}
        isCurrentUser={isCurrentUser}
      >
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
          onUnsend={() => handleUnsendMessage(message.id, message.sender_id)}
          onReply={() => startReply(message.id)}
          onReact={emoji => handleReactToMessage(message.id, emoji)}
          onTranslate={() => translateMessage(message)}
          translating={translatingMessageId === message.id}
        />

        <MessageVisibilityStatus
          timestamp={formatTimestamp(message.created_at)}
          isRead={message.is_read}
          isCurrentUser={isCurrentUser}
          isVipUser={isVipUser}
        />
      </MessageBubbleWrapper>
    </>
  );
};
