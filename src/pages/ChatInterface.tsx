import { useEffect, useState, useRef } from 'react';
import { History, Mail, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SidebarContainer } from '@/components/sidebar/SidebarContainer';
import { InboxSidebar } from '@/components/sidebar/InboxSidebar';
import { HistorySidebar } from '@/components/sidebar/HistorySidebar';
import { BlockedUsersSidebar } from '@/components/sidebar/BlockedUsersSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VipButton } from '@/components/VipButton';
import { RulesPopup } from '@/components/RulesPopup';
import { UserList } from '@/components/UserList';
import { LogoutButton } from '@/components/LogoutButton';
import { VipSettingsButton } from '@/components/VipSettingsButton';
import { NotificationBadge } from '@/components/NotificationBadge';
import { useBot } from '@/hooks/useBot';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { useGlobalMessages } from '@/hooks/useGlobalMessages';
import { usePresence } from '@/hooks/usePresence';
import { useMessages } from '@/hooks/useMessages';
import { useChatState } from '@/hooks/useChatState';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatContent } from '@/components/chat/ChatContent';
import { Message } from '@/types/message';
import { toast } from 'sonner';
import { ReportUserPopup } from '@/components/ReportUserPopup';
import { isMockUser } from '@/utils/mockUsers';

const ChatInterface = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('standard');
  const [isVipUser, setIsVipUser] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  const { handleBotResponse } = useBot();
  const { canInteractWithUser, isLoadingBlocks } = useBlockedUsers();
  const { unreadCount, fetchUnreadCount, markMessagesAsRead, updateSelectedUserId } = useGlobalMessages(currentUserId);
  const { onlineUsers } = usePresence(currentUserId);
  
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
  } = useChatState();

  const { 
    messages, 
    setMessages,
    fetchMessages,
    isLoading 
  } = useMessages(currentUserId, selectedUserId, currentUserRole, markMessagesAsRead);

  const globalChannelRef = useRef<any>(null);

  useEffect(() => {
    updateSelectedUserId(selectedUserId);
  }, [selectedUserId, updateSelectedUserId]);

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }
      
      setCurrentUserId(session.user.id);

      const { data: dbProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (!error && dbProfile) {
        setIsVipUser(dbProfile.vip_status || dbProfile.role === 'vip');
        setCurrentUserRole(dbProfile.role || 'standard');
        setProfile(dbProfile);
      } else {
        console.error("Error loading profile:", error);
        setCurrentUserRole('standard');
        setProfile({
          id: session.user.id,
          nickname: "Unknown",
          role: "standard",
          avatar_url: null,
          vip_status: false,
        });
      }

      checkRulesAccepted();
    };

    checkAuthAndLoadProfile();
  }, [navigate, checkRulesAccepted]);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('all-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(receiver_id.eq.${currentUserId},sender_id.eq.${currentUserId})`,
        },
        async (payload) => {
          if (isMockUser(payload.new.sender_id) || isMockUser(payload.new.receiver_id)) {
            return;
          }
          
          if (selectedUserId && 
             ((payload.new.sender_id === currentUserId && payload.new.receiver_id === selectedUserId) ||
              (payload.new.sender_id === selectedUserId && payload.new.receiver_id === currentUserId))) {
            
            const newMessage = payload.new as Message;
            
            setMessages(current => {
              const exists = current.some(msg =>
                (msg.id === newMessage.id) ||
                (msg.content === newMessage.content &&
                  msg.sender_id === newMessage.sender_id &&
                  Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 1000)
              );
              
              if (!exists) {
                return [...current, { ...newMessage, media: null }];
              }
              return current;
            });
            
            const { data: mediaData } = await supabase
              .from('message_media')
              .select('*')
              .eq('message_id', newMessage.id);
              
            if (mediaData?.length) {
              setMessages(current =>
                current.map(msg =>
                  msg.id === newMessage.id
                    ? { ...msg, media: mediaData[0] }
                    : msg
                )
              );
            }
          }
        }
      )
      .subscribe();

    globalChannelRef.current = channel;
      
    return () => {
      if (globalChannelRef.current) {
        supabase.removeChannel(globalChannelRef.current);
        globalChannelRef.current = null;
      }
    };
  }, [currentUserId, selectedUserId, setMessages]);

  useEffect(() => {
    if (selectedUserId && currentUserId && !isLoading) {
      fetchMessages();
    }
  }, [selectedUserId, currentUserId, fetchMessages, isLoading]);

  const handleSendMessage = async (content: string, imageUrl?: string) => {
    if (!selectedUserId || !currentUserId) return;

    if (!canInteractWithUser(selectedUserId)) {
      toast.error("You cannot send messages to this user");
      return;
    }

    if (isMockUser(selectedUserId)) {
      toast.error("This is a demo VIP user. You cannot send messages to this account.");
      return;
    }

    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', selectedUserId)
      .single();

    const optimisticMessage = {
      id: Date.now(),
      content: content || (imageUrl ? '[Image]' : ''),
      sender_id: currentUserId,
      receiver_id: selectedUserId,
      created_at: new Date().toISOString(),
      is_read: false,
      media: imageUrl ? {
        id: Date.now(),
        message_id: Date.now(),
        user_id: currentUserId,
        file_url: imageUrl,
        media_type: imageUrl.includes('voice') ? 'voice' : 'image',
        created_at: new Date().toISOString()
      } : null
    };

    setMessages(current => [...current, optimisticMessage]);

    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        content: content || (imageUrl ? '[Image]' : ''),
        sender_id: currentUserId,
        receiver_id: selectedUserId,
        is_read: false
      })
      .select()
      .single();

    if (messageError) {
      setMessages(current =>
        current.filter(msg => msg.id !== optimisticMessage.id)
      );
      toast.error("Failed to send message");
      console.error('Error sending message:', messageError);
      return;
    }

    if (recipientProfile?.role === 'bot' && content) {
      handleBotResponse(selectedUserId, currentUserId, content);
    }

    if (imageUrl && messageData) {
      const { error: mediaError } = await supabase
        .from('message_media')
        .insert({
          message_id: messageData.id,
          user_id: currentUserId,
          file_url: imageUrl,
          media_type: imageUrl.includes('voice') ? 'voice' : 'image'
        });

      if (mediaError) {
        toast.error("Failed to attach media to message");
        console.error('Error creating media record:', mediaError);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border py-3 px-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Chatwii Chat</h1>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full relative"
            onClick={() => setActiveSidebar('inbox')}
          >
            <Mail className="h-5 w-5" />
            <NotificationBadge count={unreadCount} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setActiveSidebar('history')}
          >
            <History className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setActiveSidebar('blocked')}
          >
            <Users className="h-5 w-5" />
          </Button>
          <VipSettingsButton isVipUser={isVipUser} />
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      <div className="flex h-[calc(100vh-60px)]">
        <aside className="w-full max-w-xs border-r border-border">
          <UserList
            users={onlineUsers}
            onUserSelect={(userId) => handleUserSelect(userId, '')}
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
              isBlocked={isBlocked}
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
            showReportPopup={showReportPopup}                 // ✅ add this line!
            setShowReportPopup={setShowReportPopup}           // ✅ and this!
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
    </div>
  );
};

export default ChatInterface;
