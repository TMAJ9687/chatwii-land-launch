
import React, { useState, useEffect, useCallback } from 'react';
import { ChatArea } from '@/components/ChatArea';
import { MessageInput } from '@/components/MessageInput';
import { EmptyStateView } from './EmptyStateView';
import { MessageWithMedia } from '@/types/message';
import { FirebaseIndexMessage } from './FirebaseIndexMessage';
import { Loader2 } from 'lucide-react';
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
  onRetryConnection?: () => void;
  isConnected?: boolean;
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
  onRetryConnection,
  isConnected = true,
}) => {
  const [isSending, setIsSending] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Update local error when props change
  useEffect(() => {
    setLocalError(error);
  }, [error]);

  // Memoize the send handler to prevent unnecessary rerenders
  const handleSendMessage = useCallback(async (content: string, imageUrl?: string) => {
    if (!content && !imageUrl) return;
    
    setIsSending(true);
    try {
      await onSendMessage(content, imageUrl);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setLocalError('Failed to send message. Please try again. ' + errorMessage);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [onSendMessage]);

  // Handle retry connection
  const handleRetryConnection = useCallback(() => {
    if (onRetryConnection) {
      toast.info('Attempting to reconnect...');
      onRetryConnection();
    }
  }, [onRetryConnection]);

  if (!selectedUserId) {
    return <EmptyStateView />;
  }

  // Determine if we have a Firebase error to show
  const hasFirebaseError = localError && (
    localError.includes('firebase') || 
    localError.includes('permission') || 
    localError.includes('PERMISSION_DENIED') ||
    localError.includes('index') ||
    localError.includes('Invalid token')
  );

  return (
    <>
      {/* Firebase Errors (Index or Permissions) */}
      {hasFirebaseError && (
        <FirebaseIndexMessage error={localError} />
      )}
      
      {/* Connection Status Component */}
      <ConnectionStatusIndicator 
        isConnected={isConnected}
        onReconnect={handleRetryConnection}
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
