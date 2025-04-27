
import { useMessageDeletion } from './message/useMessageDeletion';
import { useMessageReactions } from './message/useMessageReactions';
import { useMessageReplies } from './message/useMessageReplies';
import { useMessageTranslation } from './message/useMessageTranslation';
import { MessageWithMedia } from '@/types/message';

export const useMessageActions = (currentUserId: string, isVipUser: boolean) => {
  const { translateMessage, translatingMessageId } = useMessageTranslation(currentUserId, isVipUser);
  const { handleReactToMessage } = useMessageReactions(currentUserId, isVipUser);
  const { 
    isReplying, 
    replyToMessageId, 
    replyContent, 
    setReplyContent, 
    startReply, 
    cancelReply, 
    handleReplyToMessage 
  } = useMessageReplies(currentUserId, isVipUser);
  const { 
    handleUnsendMessage, 
    deleteConversation, 
    isDeletingConversation 
  } = useMessageDeletion(currentUserId, isVipUser);

  return {
    handleUnsendMessage,
    startReply,
    cancelReply,
    setReplyContent,
    handleReplyToMessage,
    handleReactToMessage,
    translateMessage,
    deleteConversation,
    translatingMessageId,
    isDeletingConversation,
    isReplying,
    replyToMessageId,
    replyContent
  };
};
