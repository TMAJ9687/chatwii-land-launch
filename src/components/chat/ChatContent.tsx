
import React from 'react';
import { ChatArea } from '@/components/ChatArea';
import { MessageInput } from '@/components/MessageInput';
import { EmptyStateView } from './EmptyStateView';
import { MessageWithMedia } from '@/types/message';

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

export const ChatContent: React.FC<ChatContentProps> = ({
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
}) => {
  if (!selectedUserId) {
    return <EmptyStateView />;
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
        onTypingStatusChange={onTypingStatusChange}
      />
    </>
  );
};
