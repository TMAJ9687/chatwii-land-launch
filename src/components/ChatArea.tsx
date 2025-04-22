
import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Flag, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { ReportUserPopup } from '@/components/ReportUserPopup';
import { ImageModal } from './ImageModal';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: number;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  media_url?: string;
}

interface ChatAreaProps {
  messages: Message[];
  currentUserId: string;
  selectedUser: {
    id: string;
    nickname: string;
  };
}

export const ChatArea = ({ messages, currentUserId, selectedUser }: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [revealedImages, setRevealedImages] = useState<Set<number>>(new Set());
  const { blockedUsers, blockUser } = useBlockedUsers();

  const isBlocked = blockedUsers.includes(selectedUser.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleImageReveal = (messageId: number) => {
    setRevealedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
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
        {messages.map((message) => (
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
              {/* Text message */}
              {message.content && <p className="break-words">{message.content}</p>}
              
              {/* Image message */}
              {message.media_url && (
                <div 
                  className="mt-2 relative cursor-pointer"
                  onClick={() => {
                    if (revealedImages.has(message.id)) {
                      setFullScreenImage(message.media_url);
                    }
                  }}
                >
                  <img 
                    src={message.media_url} 
                    alt="Chat image" 
                    className={`max-w-[300px] max-h-[300px] object-cover rounded-lg ${
                      !revealedImages.has(message.id) ? 'filter blur-lg' : ''
                    }`}
                  />
                  {!revealedImages.has(message.id) && (
                    <Button
                      onClick={() => toggleImageReveal(message.id)}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    >
                      Reveal
                    </Button>
                  )}
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

      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <ImageModal 
          imageUrl={fullScreenImage} 
          onClose={() => setFullScreenImage(null)} 
        />
      )}
    </div>
  );
};
