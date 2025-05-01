
import React from 'react';
import { AlertCircle, Loader2, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConnection } from '@/contexts/ConnectionContext';

interface ConnectionStatusIndicatorProps {
  onReconnect?: () => void;
  error: string | null;
  isLoading: boolean;
  isConnected?: boolean; // Added isConnected prop
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  onReconnect,
  error,
  isLoading,
  isConnected: propIsConnected // Renamed to avoid conflict
}) => {
  const { isConnected: contextIsConnected } = useConnection();
  
  // Use prop if provided, otherwise fallback to context
  const isConnected = propIsConnected !== undefined ? propIsConnected : contextIsConnected;

  // Don't show anything if everything is working properly
  if (isConnected && !error && !isLoading) {
    return null;
  }

  // Extract a more user-friendly error message
  const getErrorMessage = (error: string | null): string => {
    if (!error) return '';
    
    if (error.includes('permission') || error.includes('PERMISSION_DENIED')) {
      return 'Database permission issue';
    } else if (error.includes('Invalid token')) {
      return 'Database path issue';
    } else if (error.includes('index')) {
      return 'Database index issue';
    } else {
      return 'Error loading messages';
    }
  };

  return (
    <div className="px-4 py-2 bg-muted/80 border-b flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : isConnected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-amber-500" />
        )}
        
        <span className="text-sm font-medium">
          {isLoading
            ? "Loading messages..."
            : isConnected
              ? "Connected"
              : "Connection issue"}
        </span>

        {error && (
          <>
            <AlertCircle className="h-4 w-4 text-destructive ml-1" />
            <span className="text-sm text-destructive truncate max-w-[200px]">
              {getErrorMessage(error)}
            </span>
          </>
        )}
      </div>
      
      {!isConnected && !isLoading && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onReconnect} 
          className="text-xs h-7 px-2"
        >
          Reconnect
        </Button>
      )}
    </div>
  );
};
