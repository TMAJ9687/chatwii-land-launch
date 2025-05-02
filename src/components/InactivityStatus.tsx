
import React from 'react';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import { formatDistance } from 'date-fns';
import { Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface InactivityStatusProps {
  isVipUser: boolean;
}

export const InactivityStatus: React.FC<InactivityStatusProps> = ({ isVipUser }) => {
  const { remainingTime, isEnabled } = useInactivityTimer({
    isVipUser
  });
  
  // Don't show for VIP users or if timer is not enabled
  if (!isEnabled || !remainingTime || isVipUser) {
    return null;
  }

  // Format remaining time
  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);
  const formattedTime = minutes > 0 
    ? `${minutes}m ${seconds}s` 
    : `${seconds}s`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center text-xs text-muted-foreground gap-1 px-2 py-1 rounded-md hover:bg-muted cursor-default">
            <Clock className="h-3.5 w-3.5" />
            <span>{formattedTime}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Session expires in {formattedTime}</p>
          <p className="text-xs text-muted-foreground mt-1">VIP users have unlimited session time</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
