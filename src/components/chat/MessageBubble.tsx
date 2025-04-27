
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MessageWithMedia } from '@/types/message';
import { useMessageActions } from '@/hooks/useMessageActions';
import { MessageActions } from './MessageActions';
import { MessageContent } from './MessageContent';
import { MessageMedia } from './MessageMedia';
import { MessageReactions } from './MessageReactions';
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
        {message.reply_to && replyMessage && (
          <div className={`text-sm opacity-80 mb-2 pb-1 border-b ${
            isCurrentUser
              ? 'border-primary-foreground/20'
              : 'border-muted-foreground/20'
          }`}>
            <div className="font-medium mb-0.5">↪️ Reply to</div>
            <div className="truncate">
              {replyMessage.content || (replyMessage.media ? '[Media message]' : '[Message]')}
            </div>
          </div>
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
          <span className={`text-xs ${
            isCurrentUser
              ? 'text-primary-foreground/70'
              : 'text-muted-foreground'
          }`}>
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
          
          {isCurrentUser && isVipUser && (
            <span className="text-xs text-muted-foreground ml-2">
              {message.is_read ? 'Read' : 'Sent'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
