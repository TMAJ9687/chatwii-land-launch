
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VoiceMessagePlayer } from '@/components/VoiceMessagePlayer';
import { MessageMedia as MessageMediaType } from '@/types/message';

interface MessageMediaProps {
  media: MessageMediaType | null;
  messageId: number;
  isCurrentUser: boolean;
  onImageClick: (url: string) => void;
  revealedImages: Set<number>;
  toggleImageReveal: (messageId: number) => void;
}

export const MessageMedia: React.FC<MessageMediaProps> = ({ 
  media, 
  messageId,
  isCurrentUser,
  onImageClick,
  revealedImages,
  toggleImageReveal
}) => {
  const [loadingImage, setLoadingImage] = useState(true);

  if (!media) return null;

  const handleImageLoad = () => {
    setLoadingImage(false);
  };

  if (media.media_type === 'image') {
    return (
      <div className="mt-2 relative group">
        <img 
          src={media.file_url} 
          alt="Chat image" 
          className={`max-w-[300px] max-h-[300px] object-cover rounded-lg transition-all duration-300 ${
            !revealedImages.has(messageId) ? 'filter blur-lg' : ''
          }`}
          onLoad={handleImageLoad}
          style={{ display: loadingImage ? 'none' : 'block' }}
          onClick={() => {
            if (revealedImages.has(messageId)) {
              onImageClick(media.file_url);
            }
          }}
        />
        <Button
          onClick={(e) => {
            e.stopPropagation();
            toggleImageReveal(messageId);
          }}
          className={`absolute bottom-2 ${
            isCurrentUser ? 'right-2' : 'left-2'
          } opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background/90 backdrop-blur-sm text-sm z-10`}
          size="sm"
        >
          {revealedImages.has(messageId) ? 'Hide Image' : 'Reveal Image'}
        </Button>
      </div>
    );
  }

  if (media.media_type === 'voice') {
    return (
      <div className="mt-2">
        <VoiceMessagePlayer src={media.file_url} />
      </div>
    );
  }

  return null;
};
