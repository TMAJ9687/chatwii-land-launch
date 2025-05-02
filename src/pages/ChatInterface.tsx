
import { useEffect } from 'react';
import { SidebarContainer } from '@/components/sidebar/SidebarContainer';
import { InboxSidebar } from '@/components/sidebar/InboxSidebar';
import { HistorySidebar } from '@/components/sidebar/HistorySidebar';
import { BlockedUsersSidebar } from '@/components/sidebar/BlockedUsersSidebar';
import { RulesPopup } from '@/components/RulesPopup';
import { ReportUserPopup } from '@/components/ReportUserPopup';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { useAuthProfile } from '@/hooks/useAuthProfile';
import { usePresenceState } from '@/hooks/usePresenceState';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { useGlobalMessages } from '@/hooks/useGlobalMessages';
import { useConversation } from '@/hooks/useConversation';
import { useTypingIndicator } from '@/hooks/chat/useTypingIndicator';
import { ChatLayout } from '@/components/layout/ChatLayout';
import { ChatProvider, useChatContext } from '@/contexts/ChatContext';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatContent } from '@/components/chat/ChatContent';
import { UserListSidebar } from '@/components/chat/UserListSidebar';
import { ConnectionProvider } from '@/contexts/ConnectionContext';

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

  // Setup user presence
  const { isOnline } = usePresenceState(currentUserId);

  // Get unread message counts
  const { unreadCount, fetchUnreadCount } = useGlobalMessages(currentUserId);

  // Get messages for the selected conversation
  const { 
    messages,
    isLoading: messagesLoading,
    error: messagesError,
    handleSendMessage,
    handleDeleteConversation,
  } = useConversation(currentUserId, selectedUserId, currentUserRole, isVipUser);

  // Setup typing indicator
  const { isTyping, setIsTyping, broadcastTypingStatus } = useTypingIndicator(
    currentUserId,
    selectedUserId,
    isVipUser
  );

  // Check if rules are accepted
  useEffect(() => {
    if (currentUserId) {
      checkRulesAccepted();
    }
  }, [currentUserId, checkRulesAccepted]);

  // Handle typing status change
  const handleTypingStatusChange = (isTyping: boolean) => {
    setIsTyping(isTyping);
    broadcastTypingStatus(isTyping);
  };

  // Update handleUserSelect to match the expected signature
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

  const handleRetryConnection = () => {
    window.location.reload();
  };

  return (
    <ChatLayout unreadCount={unreadCount} isVipUser={isVipUser}>
      <div className="flex h-[calc(100vh-60px)]">
        <UserListSidebar
          onUserSelect={handleUserSelect}
          selectedUserId={selectedUserId}
          currentUserId={currentUserId}
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
            isConnected={true}
            onRetryConnection={handleRetryConnection}
          />
        </main>
      </div>

      {/* Sidebar containers */}
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

      {/* Popups */}
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
    <ConnectionProvider>
      <ChatProvider>
        <ChatInterfaceContent />
      </ChatProvider>
    </ConnectionProvider>
  );
};

export default ChatInterface;
