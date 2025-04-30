
import React from 'react';
import { ChatNavbar } from '@/components/chat/ChatNavbar';
import { ResetConnectionButton } from '@/components/ResetConnectionButton';
import { ChatSidebar } from '@/components/chat/ChatSidebar';

interface ChatLayoutProps {
  children: React.ReactNode;
  unreadCount?: number;
  isVipUser?: boolean;
  onlineUsers?: any[];
  onUserSelect?: (userId: string) => void;
  selectedUserId?: string | null;
  showSidebar?: boolean;
}

export const ChatLayout = ({ 
  children, 
  unreadCount = 0, 
  isVipUser = false,
  onlineUsers = [],
  onUserSelect,
  selectedUserId,
  showSidebar = true
}: ChatLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <ChatNavbar unreadCount={unreadCount} isVipUser={isVipUser} />
      
      <div className="fixed right-4 top-16 z-50">
        <ResetConnectionButton />
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && onUserSelect && (
          <ChatSidebar 
            onlineUsers={onlineUsers}
            onUserSelect={onUserSelect}
            selectedUserId={selectedUserId}
          />
        )}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
