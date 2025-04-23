
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface NotificationBadgeProps {
  count: number;
}

export const NotificationBadge = ({ count }: NotificationBadgeProps) => {
  if (count <= 0) return null;

  return (
    <Badge
      variant="destructive"
      className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px] rounded-full"
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
};
