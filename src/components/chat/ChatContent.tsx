
import React, { useState, useEffect, useCallback } from 'react';
import { ChatArea } from '@/components/ChatArea';
import { MessageInput } from '@/components/MessageInput';
import { EmptyStateView } from './EmptyStateView';
import { MessageWithMedia } from '@/types/message';
import { FirebaseIndexMessage } from './FirebaseIndexMessage';
import { Loader2 } from 'lucide-react';
import { useChatConnection } from '@/hooks/chat/useChatConnection';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';
import { toast } from 'sonner';

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
  const [isSending, setIsSending] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Ensure we maintain connection when a chat is selected
  const { isConnected, reconnect } = useChatConnection(!!selectedUserId);
  
  // Check for Firebase index error in the error message
  useEffect(() => {
    if (error && error.includes('index')) {
      const urlMatch = error.match(/https:\/\/console\.firebase\.google\.com[^\s"]*/);
      if (urlMatch) {
        setIndexUrl(urlMatch[0]);
      }
    }
    
    setLocalError(error);
  }, [error]);

  // Memoize the send handler to prevent unnecessary rerenders
  const handleSendMessage = useCallback(async (content: string, imageUrl?: string) => {
    if (!content && !imageUrl) return;
    
    setIsSending(true);
    try {
      await onSendMessage(content, imageUrl);
    } catch (e) {
      setLocalError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [onSendMessage]);

  if (!selectedUserId) {
    return <EmptyStateView />;
  }

  return (
    <>
      {/* Firebase Index Error */}
      {error && error.includes('index') && (
        <FirebaseIndexMessage indexUrl={indexUrl || undefined} />
      )}
      
      {/* Connection Status Component */}
      <ConnectionStatusIndicator 
        isConnected={isConnected}
        onReconnect={reconnect}
        error={localError}
        isLoading={isLoading}
      />

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

      {isSending && (
        <div className="bg-muted/50 py-1 px-4 flex items-center justify-center">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          <span className="text-sm">Sending message...</span>
        </div>
      )}

      <MessageInput
        onSendMessage={handleSendMessage}
        currentUserId={currentUserId}
        receiverId={selectedUserId}
        isVipUser={isVipUser}
        onTypingStatusChange={onTypingStatusChange}
        disabled={isSending || !isConnected}
      />
    </>
  );
};
