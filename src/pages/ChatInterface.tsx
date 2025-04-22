
import { useState, useEffect } from 'react';
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
import { MessageWithMedia } from '@/types/message';

type ActiveSidebar = 'none' | 'inbox' | 'history' | 'blocked';

declare global {
  interface Window {
    selectedUserId?: string;
  }
}

const ChatInterface = () => {
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(true);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserNickname, setSelectedUserNickname] = useState<string>('');
  const [messages, setMessages] = useState<MessageWithMedia[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isVipUser, setIsVipUser] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState<ActiveSidebar>('none');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }
      setCurrentUserId(session.user.id);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('vip_status, role')
        .eq('id', session.user.id)
        .single();
      
      if (!error && profile) {
        setIsVipUser(profile.vip_status || profile.role === 'vip');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ visibility: 'online' })
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Error updating user visibility:', updateError);
      }

      const rulesAccepted = localStorage.getItem('rulesAccepted');
      if (rulesAccepted === 'true') {
        setShowRules(false);
        setAcceptedRules(true);
      }
    };
    
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!selectedUserId || !currentUserId) return;
    
    window.selectedUserId = selectedUserId;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          message_media (*)
        `)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error) {
        toast.error("Failed to load messages");
        console.error('Error fetching messages:', error);
        return;
      }

      const messagesWithMedia = data.map(message => ({
        ...message,
        media: message.message_media?.[0] || null
      }));
      
      setMessages(messagesWithMedia);
    };

    fetchMessages();

    const channelName = `chat_${[currentUserId, selectedUserId].sort().join('_')}`;
    console.log('Setting up subscription for channel:', channelName);

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
          console.log('New message received:', payload);
          const newMessage = payload.new;
          
          const { data: mediaData } = await supabase
            .from('message_media')
            .select('*')
            .eq('message_id', newMessage.id);

          const messageWithMedia = {
            ...newMessage,
            media: mediaData?.[0] || null
          };
          
          setMessages(current => {
            if (!current.some(msg => msg.id === messageWithMedia.id)) {
              return [...current, messageWithMedia];
            }
            return current;
          });
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for ${channelName}:`, status);
      });

    return () => {
      console.log('Cleaning up subscription for channel:', channelName);
      window.selectedUserId = undefined;
      supabase.removeChannel(channel);
    };
  }, [selectedUserId, currentUserId]);

  const handleSendMessage = async (content: string, imageUrl?: string) => {
    if (!selectedUserId || !currentUserId) return;

    if (!imageUrl) {
      const { error } = await supabase
        .from('messages')
        .insert([{
          content,
          sender_id: currentUserId,
          receiver_id: selectedUserId
        }]);

      if (error) {
        toast.error("Failed to send message");
        console.error('Error sending message:', error);
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
