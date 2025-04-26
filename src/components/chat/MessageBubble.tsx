
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { MessageWithMedia } from '@/types/message';
import { VoiceMessagePlayer } from '../VoiceMessagePlayer';
import { useState } from 'react';
import { useMessageActions } from '@/hooks/useMessageActions';
import { MessageActions } from './MessageActions';

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
  const isCurrentUser = message.sender_id === currentUserId;
  
  const {
    handleUnsendMessage,
    handleReplyToMessage,
    handleReactToMessage,
    translateMessage,
    translatingMessageId
  } = useMessageActions(currentUserId, isVipUser || false);

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
        {message.reply_to && (
          <div className="text-sm opacity-70 mb-1 pb-1 border-b">
            {/* Show reply preview content */}
            ↪️ Reply to message
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
        
        {/* Message Actions */}
        <MessageActions
          message={message}
          isCurrentUser={isCurrentUser}
          isVipUser={isVipUser}
          onUnsend={() => handleUnsendMessage(message.id)}
          onReply={() => handleReplyToMessage(message.id, message.content || '')}
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
