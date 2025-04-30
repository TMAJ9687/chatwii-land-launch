import React, { useState, useEffect, useCallback } from 'react';
import { ChatArea } from '@/components/ChatArea';
import { MessageInput } from '@/components/MessageInput';
import { EmptyStateView } from './EmptyStateView';
import { MessageWithMedia } from '@/types/message';
import { FirebaseIndexMessage } from './FirebaseIndexMessage';
import { Loader2 } from 'lucide-react';
// Removed: import { useChatConnection } from '@/hooks/chat/useChatConnection'; // Obsolete RTDB hook
// Removed: import { ConnectionStatusIndicator } from './ConnectionStatusIndicator'; // Component relying on useChatConnection
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

  // Removed: Call to the obsolete useChatConnection hook
  // const { isConnected, reconnect } = useChatConnection(!!selectedUserId);

  // Check for Firebase index error in the error message
  useEffect(() => {
    if (error && error.includes('index')) {
      const urlMatch = error.match(/https:\/\/console\.firebase\.google\.com[^\s"]*/);
      if (urlMatch) {
        setIndexUrl(urlMatch[0]);
      }
    }
    // Store the error locally for potential display (ConnectionStatusIndicator removed)
    setLocalError(error);
  }, [error]);

  // Memoize the send handler to prevent unnecessary rerenders
  const handleSendMessage = useCallback(async (content: string, imageUrl?: string) => {
    if (!content && !imageUrl) return;

    setIsSending(true);
    setLocalError(null); // Clear previous errors on new send attempt
    try {
      await onSendMessage(content, imageUrl);
    } catch (e: any) {
        console.error("Send message error:", e);
        // Set a generic error or use e.message if available
        setLocalError(`Failed to send message: ${e?.message || 'Please try again.'}`);
        toast.error(`Failed to send message: ${e?.message || 'Please try again.'}`);
    } finally {
      setIsSending(false);
    }
  }, [onSendMessage]);

  if (!selectedUserId) {
    return <EmptyStateView />;
  }

  return (
    <>
      {/* Firebase Index Error Display (remains useful for Firestore) */}
      {error && error.includes('index') && (
        <FirebaseIndexMessage indexUrl={indexUrl || undefined} />
      )}

      {/* Removed: ConnectionStatusIndicator component */}
      {/* <ConnectionStatusIndicator
          isConnected={isConnected} // isConnected no longer available
          onReconnect={reconnect}   // reconnect no longer available
          error={localError}
          isLoading={isLoading}
      /> */}

      {/* Display localError if needed */}
       {localError && !error?.includes('index') && ( // Avoid duplicating index message
          <div className="bg-destructive/10 text-destructive text-center p-2 text-sm">
              {localError}
          </div>
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
        isTyping={isTyping} // Prop depends on useTypingIndicator review
        isVipUser={isVipUser}
        isLoading={isLoading} // Prop from useMessages
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
        onTypingStatusChange={onTypingStatusChange} // Prop depends on useTypingIndicator review
        // Updated disabled logic: Input is disabled only while sending.
        // Firestore handles offline automatically, so disabling based on connection is less critical.
        disabled={isSending}
      />
    </>
  );
};