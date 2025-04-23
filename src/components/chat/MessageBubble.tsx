
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { MessageWithMedia } from '@/types/message';
import { VoiceMessagePlayer } from '../VoiceMessagePlayer';
import { useState } from 'react';

interface MessageBubbleProps {
  message: MessageWithMedia;
  currentUserId: string;
  onImageClick: (url: string) => void;
  revealedImages: Set<number>;
  toggleImageReveal: (messageId: number) => void;
}

export const MessageBubble = ({ 
  message, 
  currentUserId, 
  onImageClick, 
  revealedImages,
  toggleImageReveal 
}: MessageBubbleProps) => {
  const [loadingImage, setLoadingImage] = useState(true);
  const isCurrentUser = message.sender_id === currentUserId;

  const handleImageLoad = () => {
    setLoadingImage(false);
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isCurrentUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        {/* Text content */}
        {message.content && <p className="break-words">{message.content}</p>}

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
        
        {/* Timestamp */}
        <span className={`text-xs block mt-1 ${
          isCurrentUser
            ? 'text-primary-foreground/70'
            : 'text-muted-foreground'
        }`}>
          {format(new Date(message.created_at), 'HH:mm')}
        </span>
      </div>
    </div>
  );
};
