
import React from 'react';
import { MessageList } from '@/components/chat/MessageList';
import { ChatLayout } from '@/components/layout/ChatLayout';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { UserListSidebar } from '@/components/chat/UserListSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image, Send, Mic } from 'lucide-react';

// Mock data for UI purposes only
const MOCK_MESSAGES = [
  {
    id: '1',
    content: 'Hello! How are you today?',
    sender_id: 'user1',
    receiver_id: 'current-user',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    is_read: true,
    reactions: [],
    translated_content: null
  },
  {
    id: '2',
    content: 'I\'m doing great, thanks for asking! How about you?',
    sender_id: 'current-user',
    receiver_id: 'user1',
    created_at: new Date(Date.now() - 3000000).toISOString(),
    is_read: true,
    reactions: [],
    translated_content: null
  },
  {
    id: '3',
    content: 'Pretty good! Just checking out this new chat interface.',
    sender_id: 'user1',
    receiver_id: 'current-user',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    is_read: true,
    reactions: [],
    translated_content: null
  },
  {
    id: '4',
    content: 'It looks really nice, doesn\'t it?',
    sender_id: 'current-user',
    receiver_id: 'user1',
    created_at: new Date(Date.now() - 600000).toISOString(),
    is_read: false,
    reactions: [],
    translated_content: null
  }
];

const MOCK_ONLINE_USERS = [
  { id: 'user1', nickname: 'Alice', avatar_url: '', is_online: true },
  { id: 'user2', nickname: 'Bob', avatar_url: '', is_online: true },
  { id: 'user3', nickname: 'Charlie', avatar_url: '', is_online: true },
  { id: 'user4', nickname: 'Diana', avatar_url: '', is_online: false }
];

const SimpleChatInterface = () => {
  // Using static data for UI-only version
  const currentUserId = 'current-user';
  const selectedUserId = 'user1';
  const selectedUserNickname = 'Alice';
  const unreadCount = 2;
  const isVipUser = true;
  const revealedImages = new Set<string>();

  return (
    <ChatLayout unreadCount={unreadCount} isVipUser={isVipUser}>
      <div className="flex h-[calc(100vh-60px)]">
        <aside className="w-72 border-r border-border flex-shrink-0 h-full">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-medium">Online Users</h2>
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {MOCK_ONLINE_USERS.filter(u => u.is_online).length} online
              </span>
            </div>
            <Input 
              placeholder="Search users..." 
              className="w-full" 
            />
          </div>

          <div className="overflow-y-auto h-[calc(100%-65px)]">
            {MOCK_ONLINE_USERS.map(user => (
              <div 
                key={user.id} 
                className={`p-3 border-b border-border cursor-pointer hover:bg-muted transition-colors ${
                  user.id === selectedUserId ? 'bg-muted' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                      {user.nickname[0]}
                    </div>
                    {user.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium">{user.nickname}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.is_online ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between bg-background">
            <h2 className="font-medium">{selectedUserNickname}</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {MOCK_MESSAGES.map((message) => (
              <div 
                key={message.id}
                className={`flex mb-4 ${message.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-lg px-3 py-2 max-w-[80%] ${
                    message.sender_id === currentUserId 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  }`}
                >
                  <p className="break-words">{message.content}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    
                    {message.sender_id === currentUserId && isVipUser && (
                      <span className={message.is_read ? "text-green-500 ml-1" : "text-muted-foreground/40 ml-1"}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex items-center space-x-1 opacity-70 ml-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
            </div>
          </div>

          <div className="p-2 border-t flex flex-col gap-2">
            <div className="flex items-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <Image className="h-5 w-5" />
              </Button>
              
              <div className="flex-1">
                <Input
                  value=""
                  placeholder="Type a message..."
                />
              </div>
              
              <Button
                variant="default"
                size="icon"
                className="rounded-full"
              >
                <Send className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <Mic className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </ChatLayout>
  );
};

export default SimpleChatInterface;
