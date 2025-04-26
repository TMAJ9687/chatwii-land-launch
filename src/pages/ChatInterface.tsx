import { useEffect, useState, useRef, useCallback } from 'react';
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
import { useMessageActions } from '@/hooks/useMessageActions';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatContent } from '@/components/chat/ChatContent';
import { Message } from '@/types/message';
import { toast } from 'sonner';
import { ReportUserPopup } from '@/components/ReportUserPopup';
import { isMockUser } from '@/utils/mockUsers';
import { debounce } from 'lodash';

const ChatInterface = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('standard');
  const [isVipUser, setIsVipUser] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [hasSelectedNewUser, setHasSelectedNewUser] = useState(false);
  
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
    isLoading,
    error: messagesError,
    resetState
  } = useMessages(currentUserId, selectedUserId, currentUserRole, markMessagesAsRead);

  const {
    handleUnsendMessage,
    startReply,
    cancelReply,
    handleReplyToMessage,
    handleReactToMessage,
    translateMessage,
    deleteConversation,
    translatingMessageId,
    isDeletingConversation
  } = useMessageActions(currentUserId || '', isVipUser);

  const channelsRef = useRef<Record<string, any>>({});
  
  const cleanupChannels = useCallback(() => {
    Object.entries(channelsRef.current).forEach(([name, channel]) => {
      if (channel) {
        console.log(`Cleaning up channel: ${name}`);
        supabase.removeChannel(channel);
        delete channelsRef.current[name];
      }
    });
  }, []);

  const setupMessageChannel = useCallback(() => {
    if (!currentUserId) return;

    // Clean up any existing channel
    if (channelsRef.current.messageChannel) {
      supabase.removeChannel(channelsRef.current.messageChannel);
      delete channelsRef.current.messageChannel;
    }

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
          const payloadNew = payload.new as Record<string, any>;
          
          // Skip if sender or receiver is a mock user
          if (payloadNew && (
              isMockUser(payloadNew.sender_id as string) || 
              isMockUser(payloadNew.receiver_id as string))) {
            return;
          }
          
          if (selectedUserId && payloadNew && 
             ((payloadNew.sender_id === currentUserId && payloadNew.receiver_id === selectedUserId) ||
              (payloadNew.sender_id === selectedUserId && payloadNew.receiver_id === currentUserId))) {
            
            const newMessage = payloadNew as Message;
            
            setMessages(current => {
              const exists = current.some(msg =>
                (msg.id === newMessage.id) ||
                (msg.content === newMessage.content &&
                  msg.sender_id === newMessage.sender_id &&
                  Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 1000)
              );
              
              if (!exists) {
                return [...current, { ...newMessage, media: null, reactions: [] }];
              }
              return current;
            });
            
            try {
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

              // Also fetch reactions
              const { data: reactionsData } = await supabase
                .from('message_reactions')
                .select('*')
                .eq('message_id', newMessage.id);
                
              if (reactionsData?.length) {
                setMessages(current =>
                  current.map(msg =>
                    msg.id === newMessage.id
                      ? { ...msg, reactions: reactionsData }
                      : msg
                  )
                );
              }
            } catch (error) {
              console.error('Error fetching media or reactions for message:', error);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `or(receiver_id.eq.${currentUserId},sender_id.eq.${currentUserId})`,
        },
        (payload) => {
          if (selectedUserId) {
            setMessages(current =>
              current.map(msg =>
                msg.id === payload.new.id
                  ? { ...msg, ...payload.new }
                  : msg
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Message channel status:', status);
      });

    channelsRef.current.messageChannel = channel;
  }, [currentUserId, selectedUserId, setMessages]);

  const setupReactionsChannel = useCallback(() => {
    if (!currentUserId || !selectedUserId) return;

    // Clean up any existing channel
    if (channelsRef.current.reactionsChannel) {
      supabase.removeChannel(channelsRef.current.reactionsChannel);
      delete channelsRef.current.reactionsChannel;
    }

    const channel = supabase
      .channel('message-reactions')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'message_reactions'
        },
        async (payload) => {
          // Skip mock user updates
          if (payload.new && (isMockUser(payload.new.user_id))) return;
          
          // Only refresh messages when reactions change
          if (selectedUserId) {
            fetchMessages();
          }
        }
      )
      .subscribe((status) => {
        console.log('Reactions channel status:', status);
      });

    channelsRef.current.reactionsChannel = channel;
  }, [currentUserId, selectedUserId, fetchMessages]);

  useEffect(() => {
    updateSelectedUserId(selectedUserId);
  }, [selectedUserId, updateSelectedUserId]);

  useEffect(() => {
    let cancelled = false;

    const checkAuthAndLoadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setCurrentUserId(null);
        setProfile(null);
        navigate('/');
        return;
      }

      setCurrentUserId(session.user.id);

      const { data: dbProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (!error && dbProfile) {
        setIsVipUser(dbProfile.vip_status || dbProfile.role === 'vip');
        setCurrentUserRole(dbProfile.role || 'standard');
        setProfile(dbProfile);
      } else {
        setCurrentUserId(null);
        setProfile(null);
        await supabase.auth.signOut();
        navigate('/');
        return;
      }

      checkRulesAccepted();
    };

    checkAuthAndLoadProfile();
    return () => { cancelled = true; };
  }, [navigate, checkRulesAccepted]);

  useEffect(() => {
    setupMessageChannel();
    setupReactionsChannel();
    
    return () => {
      cleanupChannels();
    };
  }, [currentUserId, selectedUserId, setupMessageChannel, setupReactionsChannel, cleanupChannels]);

  useEffect(() => {
    if (selectedUserId && currentUserId && !isLoading) {
      // Set a flag to indicate we've just selected a new user
      setHasSelectedNewUser(true);
      
      // Reset state and fetch fresh messages
      resetState();
      fetchMessages();
    }
  }, [selectedUserId, currentUserId, fetchMessages, isLoading, resetState]);

  useEffect(() => {
    if (hasSelectedNewUser) {
      const timer = setTimeout(() => {
        setHasSelectedNewUser(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [hasSelectedNewUser]);

  const handleTypingStatusChange = (isTyping: boolean) => {
    setIsTyping(isTyping);
  };

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

    try {
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
        } : null,
        reactions: []
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
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      toast.error("An error occurred while sending your message");
    }
  };

  const handleDeleteConversation = () => {
    if (selectedUserId && !isDeletingConversation) {
      deleteConversation(selectedUserId);
      fetchMessages();
    }
  };

  useEffect(() => {
    if (messagesError && !hasSelectedNewUser) {
      toast.error(messagesError);
    }
  }, [messagesError, hasSelectedNewUser]);

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
    </div>
  );
};

export default ChatInterface;
