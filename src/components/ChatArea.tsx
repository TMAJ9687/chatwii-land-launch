
import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Flag, Ban, X, MoreVertical, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { ReportUserPopup } from '@/components/ReportUserPopup';
import { ImageModal } from './ImageModal';
import { MessageWithMedia } from '@/types/message';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatAreaProps {
  messages: MessageWithMedia[];
  currentUserId: string;
  selectedUser: {
    id: string;
    nickname: string;
  };
  onClose?: () => void;
}

export const ChatArea = ({ 
  messages: initialMessages, 
  currentUserId, 
  selectedUser,
  onClose 
}: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [revealedImages, setRevealedImages] = useState<Set<number>>(new Set());
  const { blockedUsers, blockUser } = useBlockedUsers();
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    console.log('Loading saved revealed images from localStorage');
    const savedRevealedImages = localStorage.getItem('revealedImages');
    if (savedRevealedImages) {
      setRevealedImages(new Set(JSON.parse(savedRevealedImages)));
    }
  }, []);

  const isBlocked = blockedUsers.includes(selectedUser.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    console.log('Messages updated, scrolling to bottom:', {
      messageCount: initialMessages.length,
      timestamp: new Date().toISOString()
    });
    scrollToBottom();
  }, [initialMessages]);

  const toggleImageReveal = (messageId: number) => {
    console.log('Toggling image reveal:', {
      messageId,
      wasRevealed: revealedImages.has(messageId),
      timestamp: new Date().toISOString()
    });
    
    setRevealedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      localStorage.setItem('revealedImages', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const handleImageLoad = (messageId: number) => {
    console.log('Image loaded:', {
      messageId,
      timestamp: new Date().toISOString()
    });
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });
  };

  const handleBlockUser = () => {
    if (!isBlocked) {
      blockUser(selectedUser.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-medium">{selectedUser.nickname}</h2>
        <div className="flex items-center gap-2">
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowReportPopup(true)}>
                <Flag className="h-4 w-4 mr-2" /> Report User
              </DropdownMenuItem>
              
              {!isBlocked && (
                <DropdownMenuItem onClick={handleBlockUser}>
                  <Ban className="h-4 w-4 mr-2" /> Block User
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {initialMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender_id === currentUserId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {/* Standard text */}
              {message.content && <p className="break-words">{message.content}</p>}

              {/* IMAGE MEDIA */}
              {message.media && message.media.media_type === 'image' && (
                <div className="mt-2 relative group">
                  <img 
                    src={message.media.file_url} 
                    alt="Chat image" 
                    className={`max-w-[300px] max-h-[300px] object-cover rounded-lg transition-all duration-300 ${
                      !revealedImages.has(message.id) ? 'filter blur-lg' : ''
                    }`}
                    onLoad={() => handleImageLoad(message.id)}
                    style={{ display: loadingImages.has(message.id) ? 'none' : 'block' }}
                    onClick={() => {
                      if (revealedImages.has(message.id)) {
                        setFullScreenImage(message.media!.file_url);
                      }
                    }}
                  />
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleImageReveal(message.id);
                    }}
                    className={`absolute bottom-2 ${
                      message.sender_id === currentUserId ? 'right-2' : 'left-2'
                    } opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background/90 backdrop-blur-sm text-sm z-10`}
                    size="sm"
                  >
                    {revealedImages.has(message.id) ? 'Hide Image' : 'Reveal Image'}
                  </Button>
                </div>
              )}

              {/* VOICE MEDIA */}
              {message.media && message.media.media_type === 'voice' && (
                <div className="mt-2">
                  <VoiceMessagePlayer src={message.media.file_url} />
                </div>
              )}
              
              <span className={`text-xs block mt-1 ${
                message.sender_id === currentUserId
                  ? 'text-primary-foreground/70'
                  : 'text-muted-foreground'
              }`}>
                {format(new Date(message.created_at), 'HH:mm')}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <ReportUserPopup
        isOpen={showReportPopup}
        onClose={() => setShowReportPopup(false)}
        reportedUser={selectedUser}
      />

      {fullScreenImage && (
        <ImageModal 
          imageUrl={fullScreenImage} 
          onClose={() => setFullScreenImage(null)} 
        />
      )}
    </div>
  );
};
