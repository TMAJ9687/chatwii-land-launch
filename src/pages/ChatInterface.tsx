
import { SidebarContainer } from '@/components/sidebar/SidebarContainer';
import { InboxSidebar } from '@/components/sidebar/InboxSidebar';
import { HistorySidebar } from '@/components/sidebar/HistorySidebar';
import { BlockedUsersSidebar } from '@/components/sidebar/BlockedUsersSidebar';
import { UserList } from '@/components/UserList';
import { ChatArea } from '@/components/ChatArea';
import { MessageInput } from '@/components/MessageInput';
import { RulesPopup } from '@/components/RulesPopup';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { WelcomeMessage } from '@/components/chat/WelcomeMessage';
import { useChat } from '@/hooks/useChat';

const ChatInterface = () => {
  const {
    showRules,
    setShowRules,
    acceptedRules,
    setAcceptedRules,
    selectedUserId,
    selectedUserNickname,
    messages,
    currentUserId,
    isVipUser,
    activeSidebar,
    setActiveSidebar,
    handleUserSelect
  } = useChat();

  return (
    <div className="min-h-screen bg-background">
      <ChatHeader 
        isVipUser={isVipUser}
        onSidebarToggle={(sidebar) => setActiveSidebar(sidebar)} 
      />
      
      <div className="flex h-[calc(100vh-60px)]">
        <aside className="w-full max-w-xs border-r border-border">
          <UserList
            onUserSelect={handleUserSelect}
            selectedUserId={selectedUserId ?? undefined}
          />
        </aside>

        <main className="flex-1 flex flex-col">
          {selectedUserId ? (
            <>
              <ChatArea 
                messages={messages}
                currentUserId={currentUserId || ''}
                selectedUser={{
                  id: selectedUserId,
                  nickname: selectedUserNickname
                }}
              />
              <MessageInput 
                onSendMessage={() => {}} 
                currentUserId={currentUserId} 
              />
            </>
          ) : (
            <WelcomeMessage />
          )}
        </main>
      </div>

      <SidebarContainer
        isOpen={activeSidebar === 'inbox'}
        onClose={() => setActiveSidebar('none')}
        title="Inbox"
      >
        <InboxSidebar onUserSelect={(userId) => {
          handleUserSelect(userId);
          setActiveSidebar('none');
        }} />
      </SidebarContainer>

      <SidebarContainer
        isOpen={activeSidebar === 'history'}
        onClose={() => setActiveSidebar('none')}
        title="Chat History"
      >
        <HistorySidebar onUserSelect={(userId) => {
          handleUserSelect(userId);
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
          onAccept={() => {
            setAcceptedRules(true);
            localStorage.setItem('rulesAccepted', 'true');
          }}
        />
      )}
    </div>
  );
};

export default ChatInterface;
