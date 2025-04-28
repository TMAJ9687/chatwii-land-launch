
import { useState, useEffect } from 'react';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { ReportUserPopup } from '@/components/ReportUserPopup';
import { ImageModal } from './ImageModal';
import { MessageWithMedia } from '@/types/message';
import { updateDocument, queryDocuments } from '@/lib/firebase';
import { MessageList } from './chat/MessageList';
import { WarningBanner } from './chat/WarningBanner';
import { isMockUser } from '@/utils/mockUsers';
import { FirebaseIndexMessage } from './chat/FirebaseIndexMessage';
import { Loader2 } from 'lucide-react';

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
  isLoading?: boolean;
}

export const ChatArea = ({ 
  messages,
  currentUserId, 
  selectedUser,
  onClose,
  onMessagesRead,
  isTyping = false,
  isVipUser = false,
  isLoading = false
}: ChatAreaProps) => {
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [revealedImages, setRevealedImages] = useState<Set<string>>(new Set());
  const [indexError, setIndexError] = useState<string | null>(null);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const { blockedUsers, blockUser, canInteractWithUser } = useBlockedUsers();
  const isMockVipUser = isMockUser(selectedUser.id);
  
  useEffect(() => {
    const savedRevealedImages = localStorage.getItem('revealedImages');
    if (savedRevealedImages) {
      try {
        const parsedImages = JSON.parse(savedRevealedImages);
        const validIds = parsedImages
          .filter((id: any) => id && typeof id === 'string')
          .map((id: any) => String(id));
        setRevealedImages(new Set(validIds));
      } catch (e) {
        console.error('Error parsing revealed images from storage:', e);
        setRevealedImages(new Set());
      }
    }
  }, []);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const markMessagesAsRead = async () => {
      if (isMockVipUser) {
        if (onMessagesRead) onMessagesRead();
        return;
      }
      
      if (currentUserId && selectedUser.id) {
        try {
          setMarkingAsRead(true);
          console.log('Marking messages as read from', selectedUser.id);
          const unreadMessages = await queryDocuments('messages', [
            { field: 'sender_id', operator: '==', value: selectedUser.id },
            { field: 'receiver_id', operator: '==', value: currentUserId },
            { field: 'is_read', operator: '==', value: false }
          ]);
          
          console.log(`Found ${unreadMessages.length} unread messages to mark as read`);
          
          const updatePromises = unreadMessages.map(msg => {
            if (!msg || !msg.id) {
              console.warn('Invalid message, skipping:', msg);
              return Promise.resolve();
            }
            console.log('Marking message as read:', msg.id);
            return updateDocument('messages', msg.id, { is_read: true });
          });
          
          await Promise.all(updatePromises);
          console.log('All messages marked as read');
          
          if (onMessagesRead) onMessagesRead();
        } catch (error: any) {
          console.error('Error marking messages as read:', error);
          
          if (error.message?.includes('index')) {
            setIndexError(error.message);
          }
          
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying markMessagesAsRead (attempt ${retryCount})`);
            setTimeout(markMessagesAsRead, 1000 * retryCount);
            return;
          }
        } finally {
          setMarkingAsRead(false);
        }
      }
    };

    markMessagesAsRead();
  }, [currentUserId, selectedUser.id, onMessagesRead, isMockVipUser]);

  const isBlocked = blockedUsers.includes(selectedUser.id);

  const toggleImageReveal = (messageId: string) => {
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
      blockUser(selectedUser.id, currentUserId);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {isMockVipUser && (
        <WarningBanner message="This is a demo VIP user. You can see messages but cannot interact with this account." />
      )}
      
      {indexError && (
        <FirebaseIndexMessage />
      )}
      
      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      )}
      
      {!isLoading && messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p>No messages yet. Start the conversation!</p>
        </div>
      )}
      
      {!isLoading && messages.length > 0 && (
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          onImageClick={(url) => setFullScreenImage(url)}
          revealedImages={revealedImages}
          toggleImageReveal={toggleImageReveal}
          isTyping={isTyping}
          isVipUser={isVipUser}
        />
      )}

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
