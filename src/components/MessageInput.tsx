
import React from 'react';
import { MessageInputContainer } from './chat/input/MessageInputContainer';
import { MessageInputPlaceholder } from './chat/input/MessageInputPlaceholder';
import { ReplyComposer } from './chat/ReplyComposer';
import { MessageWithMedia } from '@/types/message';
import { useMessageActions } from '@/hooks/useMessageActions';
import { supabase } from '@/lib/supabase';
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
        const { data, error } = await supabase
          .from('messages')
          .select('*, message_media(*)')
          .eq('id', replyToMessageId)
          .single();
          
        if (error) throw error;
        
        setReplyToMessage({
          ...data,
          media: data.message_media?.[0] || null,
          reactions: []
        });
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
