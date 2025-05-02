
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inbox, History, Shield } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { useChatContext } from '@/contexts/ChatContext';
import { LogoutButton } from '@/components/LogoutButton';
import { InactivityStatus } from '@/components/InactivityStatus';

interface ChatLayoutProps {
  children: ReactNode;
  unreadCount: number;
  isVipUser: boolean;
}

export const ChatLayout = ({ children, unreadCount, isVipUser }: ChatLayoutProps) => {
  const navigate = useNavigate();
  const { onlineUsers } = useOnlineUsers();
  const { activeSidebar, setActiveSidebar } = useChatContext();
  
  const handleSidebarToggle = (sidebar: 'inbox' | 'history' | 'blocked') => {
    setActiveSidebar(activeSidebar === sidebar ? 'none' : sidebar);
  };
  
  const getActiveClass = (sidebar: string) => {
    return activeSidebar === sidebar 
      ? 'bg-primary text-primary-foreground' 
      : 'bg-muted hover:bg-secondary';
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="h-[60px] border-b flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <h1 
            className="text-xl font-semibold cursor-pointer"
            onClick={() => navigate('/')}
          >
            {isVipUser ? '✨ VIP Chat' : 'Chat App'}
          </h1>
          <div className="flex items-center text-xs text-muted-foreground">
            <span className="bg-green-500 w-2 h-2 rounded-full mr-1"></span>
            <span>{onlineUsers.length} online</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <InactivityStatus isVipUser={isVipUser} />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={`rounded-full relative ${getActiveClass('inbox')}`}
                  onClick={() => handleSidebarToggle('inbox')}
                >
                  <Inbox className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Inbox</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={`rounded-full ${getActiveClass('history')}`}
                  onClick={() => handleSidebarToggle('history')}
                >
                  <History className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Chat History</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={`rounded-full ${getActiveClass('blocked')}`}
                  onClick={() => handleSidebarToggle('blocked')}
                >
                  <Shield className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Blocked Users</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <LogoutButton />
        </div>
      </header>
      
      <div className="flex-1 relative">
        {children}
      </div>
    </div>
  );
};
