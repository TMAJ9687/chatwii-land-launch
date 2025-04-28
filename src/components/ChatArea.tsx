
import { useState, useEffect, useCallback } from 'react';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { ReportUserPopup } from '@/components/ReportUserPopup';
import { ImageModal } from './ImageModal';
import { MessageWithMedia } from '@/types/message';
import { updateDocument, queryDocuments } from '@/lib/firebase';
import { MessageList } from './chat/MessageList';
import { WarningBanner } from './chat/WarningBanner';
import { isMockUser } from '@/utils/mockUsers';
import { firebaseListener } from '@/services/FirebaseListenerService';

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [revealedImages, setRevealedImages] = useState<Set<string>>(new Set());
  const { checkIfUserIsBlocked } = useBlockedUsers();
  const [isBlocked, setIsBlocked] = useState(false);
  
  // Track component own identity for diagnostic purposes
  const componentId = `chat-area-${selectedUser.id}`;

  useEffect(() => {
    if (!selectedUser || !selectedUser.id) return;
    
    // Check if selected user is blocked
    const checkBlocked = async () => {
      const blocked = await checkIfUserIsBlocked(selectedUser.id);
      setIsBlocked(blocked);
    };
    
    checkBlocked();
  }, [selectedUser, checkIfUserIsBlocked]);

  useEffect(() => {
    // Read all messages from the selected user when chat opens
    const markMessagesAsRead = async () => {
      // Skip for mock users
      if (isMockUser(selectedUser.id)) return;
      
      try {
        // Get unread messages from this sender
        const unreadMessages = await queryDocuments('messages', [
          { field: 'sender_id', operator: '==', value: selectedUser.id },
          { field: 'receiver_id', operator: '==', value: currentUserId },
          { field: 'is_read', operator: '==', value: false }
        ]);
        
        // Update each message to mark as read
        const updatePromises = unreadMessages.map(msg => {
          if (!msg || !msg.id) return Promise.resolve();
          return updateDocument('messages', msg.id, { is_read: true });
        });
        
        await Promise.all(updatePromises);
        
        // Notify parent component
        if (onMessagesRead) {
          onMessagesRead();
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };
    
    if (currentUserId && selectedUser && selectedUser.id) {
      markMessagesAsRead();
    }
    
    // Clean up when component unmounts
    return () => {
      firebaseListener.removeListenersByOwner(componentId);
    };
  }, [currentUserId, selectedUser, onMessagesRead]);

  const toggleImageReveal = useCallback((messageId: string) => {
    setRevealedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  const handleImageClick = useCallback((url: string) => {
    setSelectedImage(url);
  }, []);

  return (
    <>
      <div className="flex-1 overflow-hidden flex flex-col">
        {isBlocked && (
          <WarningBanner message="This user is blocked. You won't receive their messages." />
        )}
        
        <MessageList 
          messages={messages} 
          currentUserId={currentUserId}
          onImageClick={handleImageClick}
          revealedImages={revealedImages}
          toggleImageReveal={toggleImageReveal}
          isTyping={isTyping}
          isVipUser={isVipUser}
        />
      </div>
      
      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage} 
          isOpen={!!selectedImage} 
          onClose={() => setSelectedImage(null)} 
        />
      )}
    </>
  );
};
