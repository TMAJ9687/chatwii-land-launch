
import { useState, useEffect } from 'react';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { ReportUserPopup } from '@/components/ReportUserPopup';
import { ImageModal } from './ImageModal';
import { MessageWithMedia } from '@/types/message';
import { supabase } from '@/lib/supabase';
import { MessageList } from './chat/MessageList';
import { WarningBanner } from './chat/WarningBanner';
import { isMockUser } from '@/utils/mockUsers';

interface ChatAreaProps {
  messages: MessageWithMedia[];
  currentUserId: string;
  selectedUser: {
    id: string;
    nickname: string;
  };
  onClose?: () => void;
  onMessagesRead?: () => void;
  isTyping?: boolean;
  isVipUser?: boolean;
}

export const ChatArea = ({ 
  messages,
  currentUserId, 
  selectedUser,
  onClose,
  onMessagesRead,
  isTyping = false,
  isVipUser = false
}: ChatAreaProps) => {
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [revealedImages, setRevealedImages] = useState<Set<number>>(new Set());
  const { blockedUsers, blockUser } = useBlockedUsers();
  const isMockVipUser = isMockUser(selectedUser.id);
  
  useEffect(() => {
    const savedRevealedImages = localStorage.getItem('revealedImages');
    if (savedRevealedImages) {
      setRevealedImages(new Set(JSON.parse(savedRevealedImages)));
    }
  }, []);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const markMessagesAsRead = async () => {
      // Skip database operations for mock user
      if (isMockVipUser) {
        if (onMessagesRead) onMessagesRead();
        return;
      }
      
      if (currentUserId && selectedUser.id) {
        try {
          const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', selectedUser.id)
            .eq('receiver_id', currentUserId)
            .eq('is_read', false);
          
          if (error) {
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying markMessagesAsRead (attempt ${retryCount})`);
              setTimeout(markMessagesAsRead, 1000 * retryCount);
              return;
            }
            throw error;
          }
          
          if (onMessagesRead) onMessagesRead();
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      }
    };

    markMessagesAsRead();
  }, [currentUserId, selectedUser.id, onMessagesRead, isMockVipUser]);

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
      {isMockVipUser && (
        <WarningBanner message="This is a demo VIP user. You can see messages but cannot interact with this account." />
      )}
      
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        onImageClick={(url) => setFullScreenImage(url)}
        revealedImages={revealedImages}
        toggleImageReveal={toggleImageReveal}
        isTyping={isTyping}
        isVipUser={isVipUser}
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
