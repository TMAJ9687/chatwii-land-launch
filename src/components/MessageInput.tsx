
import React from 'react';
import { MessageInputContainer } from './chat/input/MessageInputContainer';
import { MessageInputPlaceholder } from './chat/input/MessageInputPlaceholder';
import { ReplyComposer } from './chat/ReplyComposer';
import { MessageWithMedia } from '@/types/message';
import { useMessageActions } from '@/hooks/useMessageActions';
import { queryDocuments } from '@/lib/firebase';
import { isMockUser } from '@/utils/mockUsers';
import { useEffect, useState } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string, imageUrl?: string) => void;
  currentUserId: string | null;
  receiverId: string;
  isVipUser?: boolean;
  onTypingStatusChange?: (isTyping: boolean) => void;
}

export const MessageInput: React.FC<MessageInputProps> = (props) => {
  const { currentUserId, receiverId, isVipUser = false } = props;
  const isMockVipUser = isMockUser(receiverId);
  
  const { 
    isReplying,
    replyToMessageId,
    replyContent,
    setReplyContent,
    cancelReply,
    handleReplyToMessage
  } = useMessageActions(currentUserId || '', isVipUser);

  const [replyToMessage, setReplyToMessage] = useState<MessageWithMedia | null>(null);

  useEffect(() => {
    if (!replyToMessageId) {
      setReplyToMessage(null);
      return;
    }
    
    const fetchReplyMessage = async () => {
      try {
        const replyMessages = await queryDocuments('messages', [
          { field: 'id', operator: '==', value: replyToMessageId }
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
          
          setReplyToMessage(fullReplyMessage);
        }
      } catch (error) {
        console.error('Error fetching reply message:', error);
      }
    };
    
    fetchReplyMessage();
  }, [replyToMessageId]);

  const handleSendReply = (content: string) => {
    if (!replyToMessageId || !content.trim()) return;
    
    handleReplyToMessage(replyToMessageId, content);
    if (props.onTypingStatusChange) {
      props.onTypingStatusChange(false);
    }
  };

  if (isMockVipUser) {
    return <MessageInputPlaceholder />;
  }

  return (
    <div className="flex flex-col bg-background">
      {isReplying && (
        <ReplyComposer 
          originalMessage={replyToMessage}
          onSendReply={handleSendReply}
          onCancel={cancelReply}
        />
      )}
    
      {!isReplying && <MessageInputContainer {...props} />}
    </div>
  );
};
