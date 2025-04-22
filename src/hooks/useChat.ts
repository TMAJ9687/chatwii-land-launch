
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MessageWithMedia } from '@/types/message';

export const useChat = () => {
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(true);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserNickname, setSelectedUserNickname] = useState<string>('');
  const [messages, setMessages] = useState<MessageWithMedia[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isVipUser, setIsVipUser] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState<'none' | 'inbox' | 'history' | 'blocked'>('none');

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
        console.error('Error fetching messages:', error);
        toast.error("Failed to load messages");
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
          const newMessage = payload.new as MessageWithMedia;
          
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
      )
      .subscribe();

    return () => {
      window.selectedUserId = undefined;
      supabase.removeChannel(channel);
    };
  }, [selectedUserId, currentUserId]);

  const handleUserSelect = async (userId: string) => {
    setSelectedUserId(userId);
    setMessages([]);
    
    const { data } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', userId)
      .single();
    
    if (data) {
      setSelectedUserNickname(data.nickname);
    }
  };

  return {
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
  };
};
