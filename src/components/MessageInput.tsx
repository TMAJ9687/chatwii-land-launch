
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
          
          setReplyToMessage({
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
