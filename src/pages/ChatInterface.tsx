
import { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VipButton } from '@/components/VipButton';
import { RulesPopup } from '@/components/RulesPopup';
import { UserList } from '@/components/UserList';
import { LogoutButton } from '@/components/LogoutButton';

const ChatInterface = () => {
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(true);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserNickname, setSelectedUserNickname] = useState<string>('');

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
      }
    };
    
    checkAuth();
    
    // Check if rules were accepted before
    const rulesAccepted = localStorage.getItem('rulesAccepted');
    if (rulesAccepted === 'true') {
      setShowRules(false);
      setAcceptedRules(true);
    }
  }, [navigate]);

  const handleUserSelect = async (userId: string) => {
    setSelectedUserId(userId);
    
    // Fetch the selected user's nickname
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
    <div className="min-h-screen bg-white dark:bg-gray-900 relative">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 py-3 px-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Chatwii Chat</h1>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="rounded-full">
            <History className="h-5 w-5" />
          </Button>
          <ThemeToggle />
          <VipButton />
          <LogoutButton />
        </div>
      </header>
      
      <div className="flex h-[calc(100vh-60px)]">
        {/* Left sidebar - User list */}
        <aside className="w-full max-w-xs border-r border-gray-200 dark:border-gray-800">
          <UserList
            onUserSelect={handleUserSelect}
            selectedUserId={selectedUserId ?? undefined}
          />
        </aside>

        {/* Main chat area */}
        <main className="flex-1 flex flex-col">
          {selectedUserId ? (
            <div className="flex-1 flex flex-col">
              {/* Selected user header */}
              <div className="border-b border-gray-200 dark:border-gray-800 p-3">
                <h2 className="font-medium">{selectedUserNickname}</h2>
              </div>
              
              {/* Chat messages area - placeholder for now */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="flex items-center justify-center h-full text-gray-500">
                  Start a conversation with {selectedUserNickname}!
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <div className="mb-6 text-5xl">👋</div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Chatwii</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                Select a user from the list to start chatting
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Rules popup */}
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
