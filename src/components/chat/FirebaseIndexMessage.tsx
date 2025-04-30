
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface FirebaseIndexMessageProps {
  indexUrl?: string;
}

export const FirebaseIndexMessage: React.FC<FirebaseIndexMessageProps> = ({ indexUrl }) => {
  return (
    <Alert className="mb-4 max-w-2xl mx-auto">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Firebase Index Required</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          This operation requires a Firebase index to be created. This is normally required for complex
          queries and custom sorting. 
        </p>
        {indexUrl ? (
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(indexUrl, '_blank')}
            >
              Create Index in Firebase Console
            </Button>
          </div>
        ) : (
          <p className="text-sm italic">
            Please check the Firebase console and create the required index.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
};
