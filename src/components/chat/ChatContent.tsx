
import { ChatArea } from '@/components/ChatArea';
import { MessageInput } from '@/components/MessageInput';
import { MessageWithMedia } from '@/types/message';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
  // Now typing status is managed by the parent component and passed as prop
  
  // Only for VIP users: track and share typing status
  useEffect(() => {
    if (!isVipUser || !selectedUserId || !currentUserId) return;
    
    const typingChannel = supabase.channel(`typing:${currentUserId}-${selectedUserId}`);
    
    typingChannel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId === selectedUserId) {
          if (onTypingStatusChange) {
            onTypingStatusChange(payload.isTyping);
          }
          
          // Auto-reset typing indicator after 5 seconds if no new typing event
          if (payload.isTyping) {
            setTimeout(() => {
              if (onTypingStatusChange) {
                onTypingStatusChange(false);
              }
            }, 5000);
          }
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [selectedUserId, currentUserId, isVipUser, onTypingStatusChange]);

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
        isTyping={isTyping && isVipUser}
        isVipUser={isVipUser}
      />

      <MessageInput
        onSendMessage={onSendMessage}
        currentUserId={currentUserId}
        receiverId={selectedUserId}
        isVipUser={isVipUser}
        onTypingStatusChange={isVipUser ? onTypingStatusChange : undefined}
      />
    </>
  );
};
