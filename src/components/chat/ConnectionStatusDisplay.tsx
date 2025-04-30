
import React from 'react';
import { toast } from 'sonner';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConnectionStatusDisplayProps {
  status: 'connected' | 'connecting' | 'disconnected';
  usersCount: number;
  onRetry?: () => void;
}

export const ConnectionStatusDisplay: React.FC<ConnectionStatusDisplayProps> = ({ 
  status, 
  usersCount,
  onRetry 
}) => {
  // Handle retry button click
  const handleRetry = () => {
    toast.info("Attempting to reconnect...");
    if (onRetry) onRetry();
  };

  if (status === 'connected' && usersCount > 0) {
    return null; // Don't show anything when connected with users
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50 text-muted-foreground">
      {status === 'disconnected' ? (
        <>
          <WifiOff className="h-8 w-8 mb-2 text-destructive" />
          <h3 className="text-base font-medium mb-1">Connection Error</h3>
          <p className="text-sm text-center mb-3">
            Unable to connect to the chat server. Please check your internet connection.
          </p>
          <Button size="sm" onClick={handleRetry}>
            Try Again
          </Button>
        </>
      ) : status === 'connecting' ? (
        <>
          <div className="animate-pulse">
            <Wifi className="h-8 w-8 mb-2 text-amber-500" />
          </div>
          <p className="text-sm">Connecting to chat server...</p>
        </>
      ) : usersCount === 0 ? (
        <>
          <AlertCircle className="h-8 w-8 mb-2 text-amber-500" />
          <h3 className="text-base font-medium mb-1">No Users Online</h3>
          <p className="text-sm text-center">
            There are currently no other users online. Your profile is visible to others when they connect.
          </p>
        </>
      ) : null}
    </div>
  );
};
