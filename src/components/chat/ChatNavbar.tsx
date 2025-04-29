
import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBadge } from '@/components/NotificationBadge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogoutButton } from '@/components/LogoutButton';
import { VipSettingsButton } from '@/components/VipSettingsButton';

interface ChatNavbarProps {
  unreadCount?: number;
  isVipUser?: boolean;
}

export const ChatNavbar = ({ unreadCount = 0, isVipUser = false }: ChatNavbarProps) => {
  return (
    <nav className="border-b bg-background p-3 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-xl font-bold mr-4">Chat App</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon"
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <NotificationBadge count={unreadCount} />
          )}
        </Button>
        
        <ThemeToggle />
        <VipSettingsButton isVipUser={isVipUser} />
        <LogoutButton />
      </div>
    </nav>
  );
};
