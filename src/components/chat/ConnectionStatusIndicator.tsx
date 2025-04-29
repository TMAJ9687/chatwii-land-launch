
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, WifiOff, RefreshCw, XCircle, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FirebaseRulesHelper } from '@/components/admin/FirebaseRulesHelper';

interface ConnectionStatusIndicatorProps {
  isConnected: boolean;
  onReconnect: () => void;
  error: string | null;
  isLoading?: boolean;
  showFirebaseRules?: boolean;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  isConnected,
  onReconnect,
  error,
  isLoading = false,
  showFirebaseRules = false,
}) => {
  // If everything is working fine, don't show the indicator
  if (isConnected && !error && !isLoading) {
    return null;
  }

  // Handle permission errors specifically
  const isPermissionError = error?.toLowerCase().includes('permission') || 
                           error?.toLowerCase().includes('access') || 
                           error?.toLowerCase().includes('not authorized');
  
  // Handle different types of issues
  let icon = <AlertCircle className="h-4 w-4" />;
  let title = 'Connection Issue';
  let description = error || 'There was a problem connecting to the chat service.';
  let variant: 'default' | 'destructive' = 'default';
  
  if (!isConnected) {
    icon = <WifiOff className="h-4 w-4" />;
    title = 'Disconnected';
    description = 'You are currently disconnected from the chat service. Please check your internet connection.';
  } else if (isPermissionError) {
    icon = <XCircle className="h-4 w-4" />;
    title = 'Permission Error';
    description = 'You don\'t have permission to access this data. This may be due to missing Firebase security rules.';
    variant = 'destructive';
  } else if (isLoading) {
    icon = <RefreshCw className="h-4 w-4 animate-spin" />;
    title = 'Loading';
    description = 'Connecting to chat service...';
  } else if (error?.includes('index')) {
    icon = <Bell className="h-4 w-4" />;
    title = 'Database Configuration Required';
    description = 'Firebase index is required for this query. Please follow the link to create the necessary index.';
  }

  return (
    <>
      <Alert variant={variant} className="mb-2">
        <div className="flex items-start">
          {icon}
          <div className="ml-2 flex-1">
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription className="text-sm">{description}</AlertDescription>

            {!isConnected && (
              <Button 
                onClick={onReconnect} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Reconnect
              </Button>
            )}
          </div>
        </div>
      </Alert>

      {/* Show Firebase Rules Helper when there's a permission error */}
      {isPermissionError && showFirebaseRules && (
        <div className="mb-4">
          <FirebaseRulesHelper />
        </div>
      )}
    </>
  );
};
