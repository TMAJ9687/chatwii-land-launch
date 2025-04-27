
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
import { supabase } from '@/lib/supabase';

interface MessageBubbleProps {
  message: MessageWithMedia;
  currentUserId: string;
  isVipUser?: boolean;
  onImageClick: (url: string) => void;
  revealedImages: Set<number>;
  toggleImageReveal: (messageId: number) => void;
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
        const { data, error } = await supabase
          .from('messages')
          .select('*, message_media(*)')
          .eq('id', message.reply_to)
          .single();
          
        if (error) throw error;
        
        setReplyMessage({
          ...data,
          media: data.message_media?.[0] || null,
          reactions: []
        });
      } catch (error) {
        console.error('Error fetching reply message:', error);
      }
    };
    
    fetchReplyMessage();
  }, [message.reply_to]);

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
          revealedImages={revealedImages}
          toggleImageReveal={toggleImageReveal}
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
