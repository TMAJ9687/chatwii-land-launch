
import { Mail, History, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VipButton } from '@/components/VipButton';
import { LogoutButton } from '@/components/LogoutButton';
import { VipSettingsButton } from '@/components/VipSettingsButton';

interface ChatHeaderProps {
  isVipUser: boolean;
  onSidebarToggle: (sidebar: 'inbox' | 'history' | 'blocked') => void;
}

export const ChatHeader = ({ isVipUser, onSidebarToggle }: ChatHeaderProps) => {
  return (
    <header className="border-b border-border py-3 px-4 flex items-center justify-between">
      <h1 className="text-xl font-bold">Chatwii Chat</h1>
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full relative"
          onClick={() => onSidebarToggle('inbox')}
        >
          <Mail className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => onSidebarToggle('history')}
        >
          <History className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => onSidebarToggle('blocked')}
        >
          <Users className="h-5 w-5" />
        </Button>
        <VipSettingsButton isVipUser={isVipUser} />
        <ThemeToggle />
        <VipButton />
        <LogoutButton />
      </div>
    </header>
  );
};
