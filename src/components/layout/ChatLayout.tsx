
import React from 'react';
import { Mail, History, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogoutButton } from '@/components/LogoutButton';
import { VipSettingsButton } from '@/components/VipSettingsButton';
import { NotificationBadge } from '@/components/NotificationBadge';
import { useChatContext } from '@/contexts/ChatContext';

interface ChatLayoutProps {
  children: React.ReactNode;
  unreadCount: number;
  isVipUser: boolean;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ 
  children, 
  unreadCount,
  isVipUser
}) => {
  const { setActiveSidebar } = useChatContext();

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

      {children}
    </div>
  );
};
