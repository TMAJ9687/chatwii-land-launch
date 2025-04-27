
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarContainer } from '@/components/sidebar/SidebarContainer';
import { InboxSidebar } from '@/components/sidebar/InboxSidebar';
import { HistorySidebar } from '@/components/sidebar/HistorySidebar';
import { BlockedUsersSidebar } from '@/components/sidebar/BlockedUsersSidebar';
import { VipButton } from '@/components/VipButton';
import { RulesPopup } from '@/components/RulesPopup';
import { UserList } from '@/components/UserList';
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

// Inner component that uses the ChatContext
const ChatInterfaceContent = () => {
  const navigate = useNavigate();
  const { 
    selectedUserId, 
    selectedUserNickname, 
    showRules, 
    setShowRules,
    acceptedRules, 
    activeSidebar,
    setActiveSidebar,
    handleCloseChat,
    handleUserSelect,
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

  const { 
    messages, 
    setMessages,
    fetchMessages,
    isLoading,
    resetState
  } = useMessages(currentUserId, selectedUserId, currentUserRole, () => {});

  const {
    handleSendMessage,
    handleDeleteConversation,
  } = useConversation(currentUserId, selectedUserId, currentUserRole, isVipUser);

  const { isTyping, setIsTyping, broadcastTypingStatus } = useTypingIndicator(
    currentUserId,
    selectedUserId,
    isVipUser
  );

  // Setup channels for realtime communication
  useChannelSetup(currentUserId, selectedUserId, setMessages, fetchMessages);

  // Check if rules have been accepted when user profile is loaded
  useEffect(() => {
    if (currentUserId) {
      checkRulesAccepted();
    }
  }, [currentUserId, checkRulesAccepted]);

  const handleTypingStatusChange = (isTyping: boolean) => {
    setIsTyping(isTyping);
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading profile...</p>
      </div>
    );
  }
  
  return (
    <ChatLayout unreadCount={unreadCount} isVipUser={isVipUser}>
      <div className="flex h-[calc(100vh-60px)]">
        <aside className="w-full max-w-xs border-r border-border">
          <UserList
            users={onlineUsers}
            onUserSelect={(userId, nickname) => handleUserSelect(userId, nickname || '')}
            selectedUserId={selectedUserId ?? undefined}
          />
        </aside>

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
          />
        </main>
      </div>

      <SidebarContainer
        isOpen={activeSidebar === 'inbox'}
        onClose={() => setActiveSidebar('none')}
        title="Inbox"
      >
        <InboxSidebar onUserSelect={(userId) => {
          handleUserSelect(userId, '');
          setActiveSidebar('none');
        }} />
      </SidebarContainer>

      <SidebarContainer
        isOpen={activeSidebar === 'history'}
        onClose={() => setActiveSidebar('none')}
        title="Chat History"
      >
        <HistorySidebar onUserSelect={(userId) => {
          handleUserSelect(userId, '');
          setActiveSidebar('none');
        }} />
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

// Wrapper component that provides the ChatContext
const ChatInterface = () => {
  return (
    <ChatProvider>
      <ChatInterfaceContent />
    </ChatProvider>
  );
};

export default ChatInterface;
