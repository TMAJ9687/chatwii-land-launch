
import { useState, useEffect } from 'react';
import { History, Filter, Send, Paperclip, Smile } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VipButton } from '@/components/VipButton';
import { RulesPopup } from '@/components/RulesPopup';
import { UserListItem } from '@/components/UserListItem';

// Mock data for demonstration
const mockUsers = [
  {
    id: '1',
    name: 'Emily',
    gender: 'Female',
    age: 18,
    country: 'Burundi',
    isVip: true,
    interests: ['Photography', 'Reading', 'Art']
  },
  {
    id: '2',
    name: 'Harper',
    gender: 'Female',
    age: 40,
    country: 'Gambia',
    isVip: true,
    interests: ['Travel', 'Photography', 'Books']
  },
  {
    id: '3',
    name: 'Jackson',
    gender: 'Male',
    age: 42,
    country: 'Bolivia',
    isVip: true,
    interests: ['Technology', 'Cycling', 'Sports']
  },
  {
    id: '4',
    name: 'James',
    gender: 'Male',
    age: 44,
    country: 'Somalia',
    isVip: true,
    interests: ['Writing', 'Music', 'Art']
  },
  {
    id: '5',
    name: 'Mason',
    gender: 'Male',
    age: 43,
    country: 'Austria',
    isVip: true,
    interests: ['Sports', 'Gaming', 'Technology']
  },
  {
    id: '6',
    name: 'Jack',
    gender: 'Male',
    age: 30,
    country: 'Australia',
    isVip: false,
    interests: ['Sports', 'Travel']
  }
];

const ChatInterface = () => {
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(true);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleAcceptRules = () => {
    setAcceptedRules(true);
    localStorage.setItem('rulesAccepted', 'true');
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
  };

  const handleSendMessage = () => {
    if (message.trim() && selectedUser) {
      // In a real app, this would send the message to the backend
      console.log(`Sending message to ${selectedUser}: ${message}`);
      setMessage('');
    }
  };

  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 py-3 px-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Chatwii Chat</h1>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="rounded-full">
            <History className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Filter className="h-5 w-5" />
          </Button>
          <ThemeToggle />
          <VipButton />
        </div>
      </header>
      
      <div className="flex h-[calc(100vh-60px)]">
        {/* Left sidebar - User list */}
        <aside className="w-full max-w-xs border-r border-gray-200 dark:border-gray-800 flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-800">
            <div className="relative">
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>
          
          {/* People label */}
          <div className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 flex justify-between">
            <span>People</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {filteredUsers.length} online
            </span>
          </div>
          
          {/* User list */}
          <div className="overflow-y-auto flex-1 bg-yellow-50 dark:bg-yellow-900/20">
            {filteredUsers.map(user => (
              <UserListItem
                key={user.id}
                name={user.name}
                gender={user.gender}
                age={user.age}
                country={user.country}
                isVip={user.isVip}
                interests={user.interests}
                isSelected={user.id === selectedUser}
                onClick={() => handleUserSelect(user.id)}
              />
            ))}
          </div>
        </aside>

        {/* Main chat area */}
        <main className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Selected user header */}
              <div className="border-b border-gray-200 dark:border-gray-800 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    {mockUsers.find(u => u.id === selectedUser)?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {mockUsers.find(u => u.id === selectedUser)?.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {mockUsers.find(u => u.id === selectedUser)?.gender}, 
                      {mockUsers.find(u => u.id === selectedUser)?.age} | 
                      {mockUsers.find(u => u.id === selectedUser)?.country}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="flex items-center justify-center h-full text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              </div>

              {/* Message input */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                  <Smile className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="rounded-full"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Button 
                  className="rounded-full h-10 w-10 bg-teal-500 hover:bg-teal-600 flex-shrink-0"
                  onClick={handleSendMessage}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <div className="mb-6 text-5xl">👋</div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Chatwii</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                Select a user from the list to start chatting. You can filter users
                by gender, age, and country to find your perfect match.
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
          onAccept={handleAcceptRules}
        />
      )}
    </div>
  );
};

export default ChatInterface;
