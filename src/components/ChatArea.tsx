
import { useEffect, useState } from 'react';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { ReportUserPopup } from '@/components/ReportUserPopup';
import { ImageModal } from './ImageModal';
import { MessageWithMedia } from '@/types/message';
import { supabase } from '@/lib/supabase';
import { MessageList } from './chat/MessageList';
import { ChatHeader } from './chat/ChatHeader';

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
  
  useEffect(() => {
    const savedRevealedImages = localStorage.getItem('revealedImages');
    if (savedRevealedImages) {
      setRevealedImages(new Set(JSON.parse(savedRevealedImages)));
    }
  }, []);

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
      <ChatHeader
        nickname={selectedUser.nickname}
        isBlocked={isBlocked}
        onClose={onClose}
        onReportUser={() => setShowReportPopup(true)}
        onBlockUser={handleBlockUser}
      />

      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        onImageClick={(url) => setFullScreenImage(url)}
        revealedImages={revealedImages}
        toggleImageReveal={toggleImageReveal}
      />

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
