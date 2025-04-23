
import { useState, useEffect, useRef } from 'react';
import { History, Mail, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
import { ChatArea } from '@/components/ChatArea';
import { MessageInput } from '@/components/MessageInput';
import { VipSettingsButton } from '@/components/VipSettingsButton';
import { toast } from 'sonner';
import { MessageWithMedia, Message } from '@/types/message';
import { useBot } from '@/hooks/useBot';

type ActiveSidebar = 'none' | 'inbox' | 'history' | 'blocked';

declare global {
  interface Window {
    selectedUserId?: string;
  }
}

const getCutoffTimestamp = (role: string) => {
  const now = new Date();
  let hoursAgo = 1;
  if (role === 'vip' || role === 'admin') {
    hoursAgo = 10;
  }
  now.setHours(now.getHours() - hoursAgo);
  return now.toISOString();
};

const ChatInterface = () => {
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(true);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserNickname, setSelectedUserNickname] = useState<string>('');
  const [messages, setMessages] = useState<MessageWithMedia[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('standard');
  const [isVipUser, setIsVipUser] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState<ActiveSidebar>('none');
  const [profile, setProfile] = useState<any>(null);
  const { handleBotResponse } = useBot();

  // New: online user state and reference to channel
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const presenceChannelRef = useRef<any>(null);

  useEffect(() => {
    let presenceChannel: any = null;
    let myProfile: any = null;

    const checkAuthAndJoinPresence = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }
      setCurrentUserId(session.user.id);

      // Fetch full profile (for nickname, role, avatar, etc)
      const { data: dbProfile, error } = await supabase
        .from('profiles')
        .select('id, nickname, vip_status, role, avatar_url, country, gender, age, profile_theme')
        .eq('id', session.user.id)
        .single();
      if (!error && dbProfile) {
        setIsVipUser(dbProfile.vip_status || dbProfile.role === 'vip');
        setCurrentUserRole(dbProfile.role || 'standard');
        setProfile(dbProfile);
        myProfile = dbProfile;
      } else {
        setCurrentUserRole('standard');
        myProfile = {
          id: session.user.id,
          nickname: "Unknown",
          role: "standard",
          avatar_url: null,
          vip_status: false,
        };
        setProfile(myProfile);
      }

      const rulesAccepted = localStorage.getItem('rulesAccepted');
      if (rulesAccepted === 'true') {
        setShowRules(false);
        setAcceptedRules(true);
      }

      // SUBSCRIBE TO PRESENCE CHANNEL
      presenceChannel = supabase.channel('online_users', {
        config: {
          presence: {
            key: myProfile.id
          }
        }
      });

      // SYNC EVENT: set the onlineUsers state to the current presence state
      presenceChannel.on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        // Flatten all user arrays (by user id) into one array of users
        let users: any[] = [];
        Object.values(state).forEach((arr: any) => {
          if (Array.isArray(arr)) {
            users = users.concat(arr);
          }
        });
        setOnlineUsers(users);
      });

      // JOIN EVENT: merge newPresences into state
      presenceChannel.on('presence', { event: 'join' }, ({ newPresences }) => {
        setOnlineUsers(prev => {
          // Avoid duplicates using id
          const existingIds = new Set(prev.map(u => u.user_id));
          const newOnes = newPresences.filter((p: any) => !existingIds.has(p.user_id));
          return [...prev, ...newOnes];
        });
      });

      // LEAVE EVENT: remove any leftPresences from state
      presenceChannel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
        setOnlineUsers(prev =>
          prev.filter(user => !leftPresences.some((left: any) => left.user_id === user.user_id))
        );
      });

      // Subscribe THEN track presence (to avoid ghosting)
      presenceChannel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          // Track current user presence and profile info (expand as needed)
          await presenceChannel.track({
            user_id: myProfile.id,
            nickname: myProfile.nickname,
            role: myProfile.role,
            avatar_url: myProfile.avatar_url,
            country: myProfile.country,
            gender: myProfile.gender,
            age: myProfile.age,
            vip_status: !!myProfile.vip_status,
            profile_theme: myProfile.profile_theme
            // add other profile fields if needed
          });
        }
      });

      // Save reference for cleanup
      presenceChannelRef.current = presenceChannel;
    };

    checkAuthAndJoinPresence();

    return () => {
      // Untrack our user and clean up channel/listeners
      (async () => {
        try {
          // Remove from presence channel
          if (presenceChannelRef.current) {
            await presenceChannelRef.current.untrack();
            supabase.removeChannel(presenceChannelRef.current);
            presenceChannelRef.current = null;
          }
        } catch (e) {
          console.warn('Presence cleanup failed:', e);
        }
      })();
      window.selectedUserId = undefined;
    };
  }, [navigate]);

  useEffect(() => {
    if (!selectedUserId || !currentUserId) return;
    window.selectedUserId = selectedUserId;

    const fetchMessages = async () => {
      const cutoffTime = getCutoffTimestamp(currentUserRole);

      /* 
        NOTE: This cutoff only limits message visibility in the frontend.
        Actual deletion or backend retention of older messages would require a separate backend process.
      */

      console.log('Fetching initial messages...', {
        currentUserId,
        selectedUserId,
        cutoffTime,
        role: currentUserRole,
        timestamp: new Date().toISOString()
      });
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          message_media (*)
        `)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${currentUserId})`)
        .gte('created_at', cutoffTime)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        toast.error("Failed to load messages");
        return;
      }

      const messagesWithMedia = data.map(message => ({
        ...message,
        media: message.message_media?.[0] || null,
      }));
      setMessages(messagesWithMedia);
    };

    fetchMessages();

    const channelName = `chat_${[currentUserId, selectedUserId].sort().join('_')}`;
    console.log('Setting up subscription for channel:', {
      channelName,
      currentUserId,
      selectedUserId,
      timestamp: new Date().toISOString()
    });

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${currentUserId}))`,
        },
        async (payload) => {
          console.log('New message received:', {
            payload,
            timestamp: new Date().toISOString()
          });
          const newMessage = payload.new as Message;
          setMessages(current => {
            const exists = current.some(msg =>
              (msg.id === newMessage.id) ||
              (msg.content === newMessage.content &&
                msg.sender_id === newMessage.sender_id &&
                Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 1000)
            );
            if (!exists) {
              console.log('Adding new message to state:', {
                messageId: newMessage.id,
                timestamp: new Date().toISOString()
              });
              return [...current, { ...newMessage, media: null }];
            }
            return current;
          });
          // Fetch message media if available
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
      )
      .subscribe();

    return () => {
      console.log('Cleaning up subscription:', {
        channelName,
        timestamp: new Date().toISOString()
      });
      supabase.removeChannel(channel);
      window.selectedUserId = undefined;
    };
  }, [selectedUserId, currentUserId, currentUserRole]); // add currentUserRole dep

  const handleSendMessage = async (content: string, imageUrl?: string) => {
    console.log('Attempting to send message:', {
      hasContent: !!content,
      hasImage: !!imageUrl,
      timestamp: new Date().toISOString()
    });

    if (!selectedUserId || !currentUserId) return;

    // Check if recipient is a bot
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', selectedUserId)
      .single();

    // Create optimistic message
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
        media_type: 'image',
        created_at: new Date().toISOString()
      } : null
    };

    // Optimistically add message to state
    setMessages(current => [...current, optimisticMessage]);

    // Send the actual message
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
      // Remove optimistic message on error
      setMessages(current =>
        current.filter(msg => msg.id !== optimisticMessage.id)
      );
      toast.error("Failed to send message");
      console.error('Error sending message:', messageError);
      return;
    }

    // If recipient is a bot, trigger bot response
    if (recipientProfile?.role === 'bot' && content) {
      handleBotResponse(selectedUserId, currentUserId, content);
    }

    // Handle image upload if present
    if (imageUrl && messageData) {
      const { error: mediaError } = await supabase
        .from('message_media')
        .insert({
          message_id: messageData.id,
          user_id: currentUserId,
          file_url: imageUrl,
          media_type: 'image'
        });

      if (mediaError) {
        toast.error("Failed to attach image to message");
        console.error('Error creating media record:', mediaError);
      }
    }
  };

  const handleUserSelect = async (userId: string) => {
    setSelectedUserId(userId);
    setMessages([]);

    const { data, error } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', userId)
      .single();

    if (data) {
      setSelectedUserNickname(data.nickname);
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
          <VipButton />
          <LogoutButton />
        </div>
      </header>

      <div className="flex h-[calc(100vh-60px)]">
        <aside className="w-full max-w-xs border-r border-border">
          <UserList
            users={onlineUsers}
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
                onSendMessage={handleSendMessage}
                currentUserId={currentUserId}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <div className="mb-6 text-5xl">👋</div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Chatwii</h2>
              <p className="text-muted-foreground max-w-md">
                Select a user from the list to start chatting
              </p>
            </div>
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
