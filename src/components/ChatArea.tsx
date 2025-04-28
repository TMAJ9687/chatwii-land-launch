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

  const { blockedUsers, blockUser } = useBlockedUsers();
  const isMockVipUser = isMockUser(selectedUser?.id);

  // Restore revealed images from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('revealedImages');
      if (saved) {
        const validIds = JSON.parse(saved)
          .filter((id: any) => typeof id === 'string');
        setRevealedImages(new Set(validIds));
      }
    } catch (e) {
      setRevealedImages(new Set());
    }
  }, []);

  // Mark messages as read (with retry and error index handling)
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    const markMessagesAsRead = async () => {
      if (isMockVipUser) {
        onMessagesRead?.();
        return;
      }
      if (currentUserId && selectedUser?.id) {
        try {
          const unreadMessages = await queryDocuments('messages', [
            { field: 'sender_id', operator: '==', value: selectedUser.id },
            { field: 'receiver_id', operator: '==', value: currentUserId },
            { field: 'is_read', operator: '==', value: false }
          ]);
          const updatePromises = unreadMessages.map(msg =>
            msg?.id
              ? updateDocument('messages', msg.id, { is_read: true })
              : Promise.resolve()
          );
          await Promise.all(updatePromises);
          onMessagesRead?.();
        } catch (error: any) {
          if (error?.message?.includes('index')) {
            setIndexError(error.message);
          }
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(markMessagesAsRead, 1000 * retryCount);
          }
        }
      }
    };

    markMessagesAsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, selectedUser?.id, isMockVipUser, onMessagesRead]);

  const isBlocked = blockedUsers.includes(selectedUser?.id);

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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {isMockVipUser && (
        <WarningBanner message="This is a demo VIP user. You can see messages but cannot interact with this account." />
      )}
      {indexError && <FirebaseIndexMessage />}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          onImageClick={url => setFullScreenImage(url)}
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
