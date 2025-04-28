
import React, { useState, useEffect, useCallback } from 'react';
import { ChatArea } from '@/components/ChatArea';
import { MessageInput } from '@/components/MessageInput';
import { EmptyStateView } from './EmptyStateView';
import { MessageWithMedia } from '@/types/message';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { FirebaseIndexMessage } from './FirebaseIndexMessage';
import { Loader2 } from 'lucide-react';
import { useChatConnection } from '@/hooks/chat/useChatConnection';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
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
  const [lastReconnectAttempt, setLastReconnectAttempt] = useState<number>(0);
  
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

  // Handle reconnection attempts with throttling
  const handleRetryConnection = useCallback(() => {
    const now = Date.now();
    // Prevent multiple retries within 5 seconds
    if (now - lastReconnectAttempt < 5000) {
      toast.info("Please wait before retrying again");
      return;
    }
    
    setLastReconnectAttempt(now);
    reconnect();
    toast.info("Attempting to reconnect...");
    setLocalError(null);
  }, [reconnect, lastReconnectAttempt]);

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
      
      {/* General Error */}
      {localError && !localError.includes('index') && (
        <Alert variant="destructive" className="mx-4 mt-4">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertTitle>Error loading messages</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{localError}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetryConnection}
            >
              <RefreshCcw className="h-4 w-4 mr-1" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Status Warning */}
      {!isConnected && !localError && selectedUserId && (
        <Alert variant="default" className="mx-4 mt-4 bg-amber-50 border-amber-500">
          <WifiOff className="h-4 w-4 text-amber-500 mr-2" />
          <AlertTitle>Connection Status</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Connecting to message service...</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetryConnection}
            >
              <RefreshCcw className="h-4 w-4 mr-1" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Connected Status */}
      {isConnected && !localError && !isLoading && (
        <div className="mx-4 mt-1 flex items-center text-xs text-green-600 justify-end">
          <Wifi className="h-3 w-3 mr-1" /> 
          <span>Connected</span>
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
