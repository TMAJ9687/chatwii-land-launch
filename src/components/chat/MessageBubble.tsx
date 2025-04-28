
import { useState, useEffect, useCallback } from 'react';
import { MessageWithMedia } from '@/types/message';
import { useMessageActions } from '@/hooks/useMessageActions';
import { MessageActions } from './MessageActions';
import { MessageContent } from './MessageContent';
import { MessageMedia } from './MessageMedia';
import { MessageReactions } from './MessageReactions';
import { ReplyPreview } from './ReplyPreview';
import { queryDocuments } from '@/lib/firebase';
import { MessageBubbleWrapper } from './message/MessageBubbleWrapper';
import { MessageVisibilityStatus } from './message/MessageVisibilityStatus';

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

  // Fetch reply message if this message is a reply
  useEffect(() => {
    if (!message.reply_to) {
      setReplyMessage(null);
      return;
    }

    let isMounted = true;
    const fetchReplyMessage = async () => {
      try {
        const [replyMsg] = await queryDocuments('messages', [
          { field: 'id', operator: '==', value: message.reply_to }
        ]);
        if (!replyMsg) return;

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
        if (isMounted) setReplyMessage(fullReplyMessage);
      } catch (error) {
        if (isMounted) setReplyMessage(null);
        console.error('Error fetching reply message:', error);
      }
    };
    fetchReplyMessage();
    return () => { isMounted = false; };
  }, [message.reply_to]);

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

  return (
    <MessageBubbleWrapper message={message} isCurrentUser={isCurrentUser}>
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
  );
};
