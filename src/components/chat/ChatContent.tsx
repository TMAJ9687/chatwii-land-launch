
import { ChatArea } from '@/components/ChatArea';
import { MessageInput } from '@/components/MessageInput';
import { MessageWithMedia } from '@/types/message';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { debounce } from 'lodash';

interface ChatContentProps {
  selectedUserId: string | null;
  selectedUserNickname: string;
  currentUserId: string;
  messages: MessageWithMedia[];
  onClose: () => void;
  onSendMessage: (content: string, imageUrl?: string) => void;
  onMessagesRead: () => void;
  isVipUser?: boolean;
  isTyping?: boolean;
  onTypingStatusChange?: (isTyping: boolean) => void;
}

export const ChatContent = ({
  selectedUserId,
  selectedUserNickname,
  currentUserId,
  messages,
  onClose,
  onSendMessage,
  onMessagesRead,
  isVipUser = false,
  isTyping = false,
  onTypingStatusChange,
}: ChatContentProps) => {
  const [typingChannelName] = useState(`typing:${currentUserId}-${selectedUserId}`);
  
  // Only for VIP users: track and share typing status
  useEffect(() => {
    if (!isVipUser || !selectedUserId || !currentUserId) return;
    
    const typingChannel = supabase.channel(typingChannelName);
    
    typingChannel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId === selectedUserId) {
          if (onTypingStatusChange) {
            onTypingStatusChange(payload.isTyping);
          }
        }
      })
      .subscribe((status) => {
        console.log(`Typing channel status: ${status}`);
      });
      
    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [selectedUserId, currentUserId, isVipUser, onTypingStatusChange, typingChannelName]);

  // Auto-reset typing indicator after inactivity
  useEffect(() => {
    if (!isTyping || !isVipUser) return;
    
    const timeout = setTimeout(() => {
      if (onTypingStatusChange) {
        onTypingStatusChange(false);
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [isTyping, onTypingStatusChange, isVipUser]);

  const broadcastTypingStatus = useCallback(
    debounce((isTyping: boolean) => {
      if (!isVipUser || !selectedUserId || !currentUserId) return;
      
      supabase.channel(typingChannelName)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: currentUserId, isTyping }
        })
        .then((status) => {
          console.log('Broadcast typing status:', status);
        })
        .catch((error) => {
          console.error('Error broadcasting typing status:', error);
        });
    }, 300),
    [selectedUserId, currentUserId, isVipUser, typingChannelName]
  );

  if (!selectedUserId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <div className="mb-6 text-5xl">👋</div>
        <h2 className="text-2xl font-bold mb-2">Welcome to Chatwii</h2>
        <p className="text-muted-foreground max-w-md">
          Select a user from the list to start chatting
        </p>
      </div>
    );
  }

  return (
    <>
      <ChatArea
        messages={messages}
        currentUserId={currentUserId}
        selectedUser={{
          id: selectedUserId,
          nickname: selectedUserNickname
        }}
        onClose={onClose}
        onMessagesRead={onMessagesRead}
        isTyping={isTyping}
        isVipUser={isVipUser}
      />

      <MessageInput
        onSendMessage={onSendMessage}
        currentUserId={currentUserId}
        receiverId={selectedUserId}
        isVipUser={isVipUser}
        onTypingStatusChange={isVipUser ? (isTyping) => {
          broadcastTypingStatus(isTyping);
          if (onTypingStatusChange) {
            onTypingStatusChange(isTyping); // Update local state as well
          }
        } : undefined}
      />
    </>
  );
};
