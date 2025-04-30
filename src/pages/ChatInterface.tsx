
import { useEffect } from 'react';
import { SidebarContainer } from '@/components/sidebar/SidebarContainer';
import { InboxSidebar } from '@/components/sidebar/InboxSidebar';
import { HistorySidebar } from '@/components/sidebar/HistorySidebar';
import { BlockedUsersSidebar } from '@/components/sidebar/BlockedUsersSidebar';
import { RulesPopup } from '@/components/RulesPopup';
import { ReportUserPopup } from '@/components/ReportUserPopup';
import { usePresence } from '@/hooks/usePresence';
import { useGlobalMessages } from '@/hooks/useGlobalMessages';
import { useAuthProfile } from '@/hooks/useAuthProfile';
import { useConversation } from '@/hooks/useConversation';
import { useMessages } from '@/hooks/useMessages';
import { useTypingIndicator } from '@/hooks/chat/useTypingIndicator';
import { useChannelSetup } from '@/hooks/useChannelSetup';
import { ChatLayout } from '@/components/layout/ChatLayout';
import { ChatProvider, useChatContext } from '@/contexts/ChatContext';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatContent } from '@/components/chat/ChatContent';
import { UserListSidebar } from '@/components/chat/UserListSidebar';

const ChatInterfaceContent = () => {
  const { 
    selectedUserId, 
    selectedUserNickname,
    showRules, 
    setShowRules,
    acceptedRules, 
    activeSidebar,
    setActiveSidebar,
    handleCloseChat,
    handleUserSelect: contextHandleUserSelect,
    handleAcceptRules,
    checkRulesAccepted,
    isBlocked,
    showReportPopup, 
    setShowReportPopup,
    handleBlockUser
  } = useChatContext();
  
  const { 
    currentUserId, 
    currentUserRole, 
    isVipUser, 
    profile, 
    loading: profileLoading 
  } = useAuthProfile();

  const { unreadCount, fetchUnreadCount } = useGlobalMessages(currentUserId);
  const { onlineUsers } = usePresence(currentUserId);

  // Create an async wrapper function for messages hook to match expected Promise<void> return type
  const markMessagesAsReadAsync = async () => {
    fetchUnreadCount();
    return Promise.resolve();
  };

  const { 
    messages, 
    setMessages,
    fetchMessages,
    isLoading: messagesLoading,
    error: messagesError
  } = useMessages(currentUserId, selectedUserId, currentUserRole, markMessagesAsReadAsync);

  const {
    handleSendMessage,
    handleDeleteConversation,
  } = useConversation(currentUserId, selectedUserId, currentUserRole, isVipUser);

  const { isTyping, setIsTyping, broadcastTypingStatus } = useTypingIndicator(
    currentUserId,
    selectedUserId,
    isVipUser
  );

  // Simply call the hook without destructuring now
  useChannelSetup(currentUserId, selectedUserId, setMessages, fetchMessages);

  useEffect(() => {
    if (currentUserId) {
      checkRulesAccepted();
    }
  }, [currentUserId, checkRulesAccepted]);

  const handleTypingStatusChange = (isTyping: boolean) => {
    setIsTyping(isTyping);
  };

  // Update handleUserSelect to match the expected signature in UserList component
  const handleUserSelect = (userId: string) => {
    contextHandleUserSelect(userId, '');
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading profile...</p>
      </div>
    );
  }
  
  const sidebarUserSelect = (userId: string) => {
    contextHandleUserSelect(userId, '');
    setActiveSidebar('none');
  };

  return (
    <ChatLayout unreadCount={unreadCount} isVipUser={isVipUser}>
      <div className="flex h-[calc(100vh-60px)]">
        <UserListSidebar
          onlineUsers={onlineUsers}
          onUserSelect={handleUserSelect}
          selectedUserId={selectedUserId}
        />

        <main className="flex-1 flex flex-col">
          {selectedUserId && (
            <ChatHeader
              nickname={selectedUserNickname}
              onClose={handleCloseChat}
              onReportUser={() => setShowReportPopup(true)}
              onBlockUser={handleBlockUser}
              onDeleteConversation={handleDeleteConversation}
              isBlocked={isBlocked}
              isVipUser={isVipUser}
            />
          )}
          
          <ChatContent
            selectedUserId={selectedUserId}
            selectedUserNickname={selectedUserNickname}
            currentUserId={currentUserId || ''}
            messages={messages}
            onClose={handleCloseChat}
            onSendMessage={handleSendMessage}
            onMessagesRead={() => fetchUnreadCount()}
            isVipUser={isVipUser}
            isTyping={isTyping}
            onTypingStatusChange={handleTypingStatusChange}
            isLoading={messagesLoading}
            error={messagesError}
          />
        </main>
      </div>

      <SidebarContainer
        isOpen={activeSidebar === 'inbox'}
        onClose={() => setActiveSidebar('none')}
        title="Inbox"
      >
        <InboxSidebar onUserSelect={sidebarUserSelect} />
      </SidebarContainer>

      <SidebarContainer
        isOpen={activeSidebar === 'history'}
        onClose={() => setActiveSidebar('none')}
        title="Chat History"
      >
        <HistorySidebar onUserSelect={sidebarUserSelect} />
      </SidebarContainer>

      <SidebarContainer
        isOpen={activeSidebar === 'blocked'}
        onClose={() => setActiveSidebar('none')}
        title="Blocked Users"
      >
        <BlockedUsersSidebar />
      </SidebarContainer>

      {!acceptedRules && (
        <RulesPopup
          open={showRules}
          onOpenChange={setShowRules}
          onAccept={handleAcceptRules}
        />
      )}

      <ReportUserPopup
        isOpen={showReportPopup}
        onClose={() => setShowReportPopup(false)}
        reportedUser={{
          id: selectedUserId || '',
          nickname: selectedUserNickname
        }}
      />
    </ChatLayout>
  );
};

const ChatInterface = () => {
  return (
    <ChatProvider>
      <ChatInterfaceContent />
    </ChatProvider>
  );
};

export default ChatInterface;
