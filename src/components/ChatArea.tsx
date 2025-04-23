
import { useEffect, useState } from 'react';
import { X, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { ReportUserPopup } from '@/components/ReportUserPopup';
import { ImageModal } from './ImageModal';
import { MessageWithMedia } from '@/types/message';
import { supabase } from '@/lib/supabase';
import { MessageList } from './chat/MessageList';
import { ChatActions } from './chat/ChatActions';

interface ChatAreaProps {
  messages: MessageWithMedia[];
  currentUserId: string;
  selectedUser: {
    id: string;
    nickname: string;
  };
  onClose?: () => void;
  onMessagesRead?: () => void;
}

export const ChatArea = ({ 
  messages,
  currentUserId, 
  selectedUser,
  onClose,
  onMessagesRead
}: ChatAreaProps) => {
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [revealedImages, setRevealedImages] = useState<Set<number>>(new Set());
  const { blockedUsers, blockUser } = useBlockedUsers();
  
  // Load saved revealed images from localStorage
  useEffect(() => {
    const savedRevealedImages = localStorage.getItem('revealedImages');
    if (savedRevealedImages) {
      setRevealedImages(new Set(JSON.parse(savedRevealedImages)));
    }
  }, []);

  // Mark messages as read when chat is opened
  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (currentUserId && selectedUser.id) {
        try {
          const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', selectedUser.id)
            .eq('receiver_id', currentUserId)
            .eq('is_read', false);
          
          if (error) throw error;
          
          // Notify parent component that messages have been read
          if (onMessagesRead) onMessagesRead();
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      }
    };

    markMessagesAsRead();
  }, [currentUserId, selectedUser.id, onMessagesRead]);

  const isBlocked = blockedUsers.includes(selectedUser.id);

  const toggleImageReveal = (messageId: number) => {
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

  const handleBlockUser = () => {
    if (!isBlocked) {
      blockUser(selectedUser.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Chat Header */}
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
          
          <ChatActions
            isBlocked={isBlocked}
            onShowReportPopup={() => setShowReportPopup(true)}
            onBlockUser={handleBlockUser}
          />
        </div>
      </div>

      {/* Messages List */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        onImageClick={(url) => setFullScreenImage(url)}
        revealedImages={revealedImages}
        toggleImageReveal={toggleImageReveal}
      />

      {/* Report User Popup */}
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
