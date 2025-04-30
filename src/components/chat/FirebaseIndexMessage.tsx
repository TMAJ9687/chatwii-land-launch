
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FirebaseIndexMessageProps {
  indexUrl?: string;
  error?: string;
}

export const FirebaseIndexMessage: React.FC<FirebaseIndexMessageProps> = ({ indexUrl, error }) => {
  // Extract URL from error message if not provided explicitly
  const extractedUrl = React.useMemo(() => {
    if (!indexUrl && error) {
      const urlMatch = error.match(/https:\/\/console\.firebase\.google\.com[^\s"]*/);
      return urlMatch ? urlMatch[0] : undefined;
    }
    return indexUrl;
  }, [indexUrl, error]);
  
  // Determine if this is a permissions error
  const isPermissionsError = React.useMemo(() => {
    return error?.includes('permission') || error?.includes('PERMISSION_DENIED');
  }, [error]);
  
  // Determine if this is an index error
  const isIndexError = React.useMemo(() => {
    return error?.includes('index') || error?.includes('no matching index found');
  }, [error]);

  return (
    <Card className="m-2 bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700">
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h4 className="font-medium text-amber-800 dark:text-amber-300">
            {isPermissionsError ? 'Firebase Permission Error' : 
             isIndexError ? 'Firebase Index Required' : 'Firebase Configuration Error'}
          </h4>
        </div>
        
        {isPermissionsError && (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Firebase is denying access to the database. Please check your Realtime Database rules
            in the Firebase console and ensure they're configured correctly.
          </p>
        )}
        
        {isIndexError && (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            To enable efficient message queries, Firebase requires a composite index. Please create this index
            in your Firebase console.
          </p>
        )}
        
        {!isPermissionsError && !isIndexError && (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            There was an error connecting to Firebase. Please check your configuration and try again.
          </p>
        )}
        
        {extractedUrl && (
          <Button 
            variant="outline" 
            className="bg-amber-100 border-amber-300 hover:bg-amber-200 text-amber-800 
                     dark:bg-amber-900/50 dark:border-amber-700 dark:hover:bg-amber-900 dark:text-amber-300"
            onClick={() => window.open(extractedUrl, '_blank')}
          >
            {isPermissionsError ? 'Open Firebase Rules Console' : 
             isIndexError ? 'Create Index in Firebase Console' : 'Open Firebase Console'}
          </Button>
        )}
        
        <p className="text-xs text-amber-600 dark:text-amber-400 pt-1">
          {isIndexError && 'After creating the index, it may take a few minutes to activate.'}
          {isPermissionsError && 'Check the browser console for the recommended rules configuration.'}
        </p>
      </div>
    </Card>
  );
};
