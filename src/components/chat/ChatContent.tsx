
import React, { useState } from 'react';
import { ChatArea } from '@/components/ChatArea';
import { MessageInput } from '@/components/MessageInput';
import { EmptyStateView } from './EmptyStateView';
import { MessageWithMedia } from '@/types/message';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { FirebaseIndexMessage } from './FirebaseIndexMessage';

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
  isLoading?: boolean;
  error?: string | null;
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
  isLoading = false,
  error = null,
}) => {
  const [indexUrl, setIndexUrl] = useState<string | null>(null);
  
  // Check for Firebase index error in the error message
  React.useEffect(() => {
    if (error && error.includes('index')) {
      const urlMatch = error.match(/https:\/\/console\.firebase\.google\.com[^\s"]*/);
      if (urlMatch) {
        setIndexUrl(urlMatch[0]);
      }
    }
  }, [error]);

  if (!selectedUserId) {
    return <EmptyStateView />;
  }

  return (
    <>
      {error && error.includes('index') && (
        <FirebaseIndexMessage indexUrl={indexUrl || undefined} />
      )}
      
      {error && !error.includes('index') && (
        <Alert variant="destructive" className="mx-4 mt-4">
          <AlertTitle>Error loading messages</AlertTitle>
          <p>{error}</p>
        </Alert>
      )}

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
        isLoading={isLoading}
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

