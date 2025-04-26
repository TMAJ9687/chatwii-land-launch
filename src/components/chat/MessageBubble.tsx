
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { MessageWithMedia } from '@/types/message';
import { VoiceMessagePlayer } from '../VoiceMessagePlayer';
import { useState, useEffect } from 'react';
import { useMessageActions } from '@/hooks/useMessageActions';
import { MessageActions } from './MessageActions';
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
  const [loadingImage, setLoadingImage] = useState(true);
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

  const handleImageLoad = () => {
    setLoadingImage(false);
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

        {/* Regular message content */}
        {message.content && !message.deleted_at && (
          <div>
            <p className="break-words">{message.content}</p>
            {message.translated_content && (
              <p className="text-sm opacity-70 mt-1 italic">
                {message.translated_content}
              </p>
            )}
          </div>
        )}

        {/* Deleted message placeholder */}
        {message.deleted_at && (
          <p className="italic text-sm opacity-70">Message removed</p>
        )}

        {/* Image media */}
        {message.media && message.media.media_type === 'image' && (
          <div className="mt-2 relative group">
            <img 
              src={message.media.file_url} 
              alt="Chat image" 
              className={`max-w-[300px] max-h-[300px] object-cover rounded-lg transition-all duration-300 ${
                !revealedImages.has(message.id) ? 'filter blur-lg' : ''
              }`}
              onLoad={handleImageLoad}
              style={{ display: loadingImage ? 'none' : 'block' }}
              onClick={() => {
                if (revealedImages.has(message.id)) {
                  onImageClick(message.media!.file_url);
                }
              }}
            />
            <Button
              onClick={(e) => {
                e.stopPropagation();
                toggleImageReveal(message.id);
              }}
              className={`absolute bottom-2 ${
                isCurrentUser ? 'right-2' : 'left-2'
              } opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background/90 backdrop-blur-sm text-sm z-10`}
              size="sm"
            >
              {revealedImages.has(message.id) ? 'Hide Image' : 'Reveal Image'}
            </Button>
          </div>
        )}

        {/* Voice media */}
        {message.media && message.media.media_type === 'voice' && (
          <div className="mt-2">
            <VoiceMessagePlayer src={message.media.file_url} />
          </div>
        )}
        
        {/* Display reactions if there are any */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap mt-1 gap-1">
            {message.reactions.map((reaction, index) => (
              <span 
                key={`${reaction.id || index}-${reaction.emoji}`}
                className="inline-block bg-background/20 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-xs"
              >
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}
        
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
