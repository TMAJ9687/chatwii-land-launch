
import { AlertCircle, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResetConnectionButton } from '@/components/ResetConnectionButton';
import { toast } from 'sonner';

interface ConnectionStatusIndicatorProps {
  isConnected: boolean;
  onReconnect: () => void;
  error: string | null;
  isLoading?: boolean;
}

export const ConnectionStatusIndicator = ({
  isConnected,
  onReconnect,
  error,
  isLoading = false
}: ConnectionStatusIndicatorProps) => {
  const handleReconnectClick = () => {
    toast.info('Attempting to reconnect...');
    onReconnect();
  };
  
  // If no issues and not loading, don't show anything
  if (isConnected && !error && !isLoading) {
    return null;
  }
  
  // Show appropriate message based on state
  return (
    <div className={`px-4 py-2 flex items-center justify-between text-sm ${
      error ? 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
      !isConnected ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
      'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    }`}>
      <div className="flex items-center space-x-2">
        {error ? (
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        ) : !isConnected ? (
          <WifiOff className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        ) : (
          <Wifi className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        )}
        
        <span>
          {error ? 'Connection error' : 
           !isConnected ? 'Disconnected' : 
           isLoading ? 'Loading messages...' : 'Connected'}
        </span>
        
        {isLoading && <Loader2 className="h-3 w-3 animate-spin ml-2" />}
      </div>
      
      <div className="flex items-center space-x-2">
        {!isConnected && (
          <Button 
            onClick={handleReconnectClick} 
            variant="outline" 
            size="sm"
            className="h-7 px-2 py-1 text-xs"
          >
            Reconnect
          </Button>
        )}
        
        <ResetConnectionButton />
      </div>
    </div>
  );
};
