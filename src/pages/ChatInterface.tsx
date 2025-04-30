import { useEffect } from 'react';
import { SidebarContainer } from '@/components/sidebar/SidebarContainer';
import { InboxSidebar } from '@/components/sidebar/InboxSidebar';
import { HistorySidebar } from '@/components/sidebar/HistorySidebar';
import { BlockedUsersSidebar } from '@/components/sidebar/BlockedUsersSidebar';
import { RulesPopup } from '@/components/RulesPopup';
import { ReportUserPopup } from '@/components/ReportUserPopup';
import { usePresence } from '@/hooks/usePresence'; // Needs review for RTDB
import { useGlobalMessages } from '@/hooks/useGlobalMessages'; // Seems OK (Firestore)
import { useAuthProfile } from '@/hooks/useAuthProfile'; // Assumed OK
import { useConversation } from '@/hooks/useConversation'; // Needs review for RTDB
import { useMessages } from '@/hooks/useMessages'; // Seems OK (Firestore)
import { useTypingIndicator } from '@/hooks/chat/useTypingIndicator'; // Needs review for RTDB
// Removed: import { useChannelSetup } from '@/hooks/useChannelSetup'; // Obsolete RTDB hook
import { ChatLayout } from '@/components/layout/ChatLayout';
import { ChatProvider, useChatContext } from '@/contexts/ChatContext'; // Assumed OK
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

  // Destructure markMessagesAsRead from useGlobalMessages
  const { unreadCount, fetchUnreadCount, markMessagesAsRead } = useGlobalMessages(currentUserId);
  const { onlineUsers } = usePresence(currentUserId); // This hook still needs review

  // Removed: markMessagesAsReadAsync wrapper function is no longer needed

  const {
    messages,
    setMessages,
    fetchMessages,
    isLoading: messagesLoading,
    error: messagesError
  // Pass the actual markMessagesAsRead function from useGlobalMessages to useMessages
  } = useMessages(currentUserId, selectedUserId, currentUserRole, markMessagesAsRead);

  const {
    handleSendMessage,
    handleDeleteConversation,
  } = useConversation(currentUserId, selectedUserId, currentUserRole, isVipUser); // This hook still needs review

  const { isTyping, setIsTyping, broadcastTypingStatus } = useTypingIndicator( // This hook still needs review
    currentUserId,
    selectedUserId,
    isVipUser
  );

  // Removed: Call to the obsolete useChannelSetup hook
  // useChannelSetup(currentUserId, selectedUserId, setMessages, fetchMessages);

  useEffect(() => {
    if (currentUserId) {
      checkRulesAccepted();
    }
  }, [currentUserId, checkRulesAccepted]);

  // Removed: handleTypingStatusChange function seems unused now, was possibly related to older setup
  // const handleTypingStatusChange = (isTyping: boolean) => {
  //  setIsTyping(isTyping);
  // };
  // Ensure onTypingStatusChange prop passed to ChatContent is still valid or update ChatContent

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
          onlineUsers={onlineUsers} // Data depends on usePresence review
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
              onDeleteConversation={handleDeleteConversation} // Depends on useConversation review
              isBlocked={isBlocked}
              isVipUser={isVipUser}
            />
          )}

          <ChatContent
            selectedUserId={selectedUserId}
            selectedUserNickname={selectedUserNickname}
            currentUserId={currentUserId || ''}
            messages={messages} // Data from useMessages (Firestore)
            onClose={handleCloseChat}
            onSendMessage={handleSendMessage} // Depends on useConversation review
            // Note: onMessagesRead currently just refetches the global count.
            // You might want it to trigger the actual markMessagesAsRead(selectedUserId) logic
            // if useMessages doesn't already handle that implicitly when it fetches.
            // Recheck useMessages logic - it does call markMessagesAsRead(selectedUserId) after fetch.
            // Passing fetchUnreadCount might be redundant unless needed for immediate UI feedback.
            onMessagesRead={() => fetchUnreadCount()}
            isVipUser={isVipUser}
            isTyping={isTyping} // Depends on useTypingIndicator review
            onTypingStatusChange={setIsTyping} // Pass setIsTyping directly if needed
            isLoading={messagesLoading} // From useMessages (Firestore)
            error={messagesError} // From useMessages (Firestore)
          />
        </main>
      </div>

      {/* Sidebar Containers remain unchanged */}
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

      {/* Rules Popup remains unchanged */}
      {!acceptedRules && (
        <RulesPopup
          open={showRules}
          onOpenChange={setShowRules}
          onAccept={handleAcceptRules}
        />
      )}

      {/* Report Popup remains unchanged */}
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

// ChatInterface wrapper remains unchanged
const ChatInterface = () => {
  return (
    <ChatProvider>
      <ChatInterfaceContent />
    </ChatProvider>
  );
};

export default ChatInterface;