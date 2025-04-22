import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Flag, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { ReportUserPopup } from '@/components/ReportUserPopup';
import { ImageModal } from './ImageModal';
import { MessageWithMedia } from '@/types/message';

interface ChatAreaProps {
  messages: MessageWithMedia[];
  currentUserId: string;
  selectedUser: {
    id: string;
    nickname: string;
  };
}

export const ChatArea = ({ messages: initialMessages, currentUserId, selectedUser }: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [revealedImages, setRevealedImages] = useState<Set<number>>(new Set());
  const { blockedUsers, blockUser } = useBlockedUsers();
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());

  useEffect(() => {
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
    scrollToBottom();
  }, [initialMessages]);

  const toggleImageReveal = (messageId: number) => {
    console.log('Toggling image reveal for message:', messageId);
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
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-medium">{selectedUser.nickname}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReportPopup(true)}
          >
            <Flag className="h-4 w-4 mr-2" />
            Report
          </Button>
          {!isBlocked && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => blockUser(selectedUser.id)}
            >
              <Ban className="h-4 w-4 mr-2" />
              Block
            </Button>
          )}
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
              {message.content && <p className="break-words">{message.content}</p>}
              
              {message.media && (
                <div className="mt-2 relative">
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
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  >
                    {revealedImages.has(message.id) ? 'Hide Image' : 'Reveal Image'}
                  </Button>
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
