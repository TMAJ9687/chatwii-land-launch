
import React from 'react';
import { ChatNavbar } from '@/components/chat/ChatNavbar';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ResetConnectionButton } from '@/components/ResetConnectionButton';

interface ChatLayoutProps {
  children: React.ReactNode;
  unreadCount?: number;
  isVipUser?: boolean;
}

export const ChatLayout = ({ children, unreadCount = 0, isVipUser = false }: ChatLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <ChatNavbar unreadCount={unreadCount} isVipUser={isVipUser} />
      
      <div className="fixed right-4 top-16 z-50">
        <ResetConnectionButton />
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
