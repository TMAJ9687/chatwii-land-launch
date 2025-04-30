
import React, { useCallback, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button"; 
import { Wifi, WifiOff, RefreshCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ConnectionStatusIndicatorProps {
  isConnected: boolean;
  onReconnect: () => void;
  error: string | null;
  isLoading: boolean;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  isConnected,
  onReconnect,
  error,
  isLoading
}) => {
  const [lastReconnectAttempt, setLastReconnectAttempt] = useState<number>(0);
  
  // Handle reconnection attempts with throttling
  const handleRetryConnection = useCallback(() => {
    const now = Date.now();
    // Prevent multiple retries within 5 seconds
    if (now - lastReconnectAttempt < 5000) {
      toast.info("Please wait before retrying again");
      return;
    }
    
    setLastReconnectAttempt(now);
    onReconnect();
    toast.info("Attempting to reconnect...");
  }, [onReconnect, lastReconnectAttempt]);

  // If loading, don't show any connection status
  if (isLoading) {
    return null;
  }

  // Error alert
  if (error && !error.includes('index')) {
    return (
      <Alert variant="destructive" className="mx-4 mt-4">
        <AlertTriangle className="h-4 w-4 mr-2" />
        <AlertTitle>Error loading messages</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetryConnection}
          >
            <RefreshCcw className="h-4 w-4 mr-1" /> Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Disconnected warning
  if (!isConnected && !error) {
    return (
      <Alert variant="default" className="mx-4 mt-4 bg-amber-50 border-amber-500">
        <WifiOff className="h-4 w-4 text-amber-500 mr-2" />
        <AlertTitle>Connection Status</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Connecting to message service...</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetryConnection}
          >
            <RefreshCcw className="h-4 w-4 mr-1" /> Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Connected status
  if (isConnected && !error) {
    return (
      <div className="mx-4 mt-1 flex items-center text-xs text-green-600 justify-end">
        <Wifi className="h-3 w-3 mr-1" /> 
        <span>Connected</span>
      </div>
    );
  }

  return null;
};
