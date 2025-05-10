
import { Badge } from '@/components/ui/badge';

interface SimpleUserCardProps {
  nickname: string;
  isOnline: boolean;
  isSelected: boolean;
  isVip?: boolean;
  unreadCount?: number;
  lastMessage?: string;
  onClick?: () => void;
}

export const SimpleUserCard = ({
  nickname,
  isOnline,
  isSelected,
  isVip = false,
  unreadCount = 0,
  lastMessage,
  onClick
}: SimpleUserCardProps) => {
  return (
    <div 
      className={`p-3 border-b border-border cursor-pointer hover:bg-muted transition-colors ${
        isSelected ? 'bg-muted' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
              {nickname[0]}
            </div>
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
            )}
          </div>
          <div className="ml-3">
            <div className="font-medium flex items-center">
              {nickname}
              {isVip && <span className="ml-1 text-yellow-500">✨</span>}
            </div>
            {lastMessage && (
              <div className="text-xs text-muted-foreground truncate w-32">
                {lastMessage}
              </div>
            )}
          </div>
        </div>
        
        {unreadCount > 0 && (
          <Badge variant="destructive" className="rounded-full h-5 min-w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </div>
    </div>
  );
};
