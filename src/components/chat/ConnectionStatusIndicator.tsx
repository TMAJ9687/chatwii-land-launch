
import React from 'react';
import { AlertCircle, Loader2, SignalHigh, SignalMedium, SignalLow } from 'lucide-react';
import { Button } from '../ui/button';

interface ConnectionStatusIndicatorProps {
  isConnected: boolean;
  onReconnect: () => void;
  error: string | null;
  isLoading?: boolean;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  isConnected,
  onReconnect,
  error,
  isLoading = false
}) => {
  // If there's no error and we're connected, don't show anything
  if (!error && isConnected && !isLoading) {
    return null;
  }

  return (
    <div className="bg-muted/50 py-1 px-4 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Loading messages...</span>
          </>
        ) : isConnected ? (
          <>
            <SignalHigh className="h-4 w-4 text-green-500" />
            <span>Connected</span>
          </>
        ) : error ? (
          <>
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-destructive">{error}</span>
          </>
        ) : (
          <>
            <SignalLow className="h-4 w-4 text-amber-500" />
            <span>Connecting...</span>
          </>
        )}
      </div>
      
      {(!isConnected || error) && !isLoading && (
        <Button variant="ghost" size="sm" onClick={onReconnect} className="h-6 px-2">
          Reconnect
        </Button>
      )}
    </div>
  );
};
