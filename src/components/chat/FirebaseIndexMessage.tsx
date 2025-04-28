
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface FirebaseIndexMessageProps {
  indexUrl?: string;
}

export const FirebaseIndexMessage: React.FC<FirebaseIndexMessageProps> = ({ indexUrl }) => {
  return (
    <Alert className="mb-4 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700">
      <AlertTitle className="text-amber-800 dark:text-amber-200">Firebase Index Required</AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        <p>To enable the full chat functionality, a Firebase index needs to be created.</p>
        {indexUrl ? (
          <p className="mt-2">
            <a 
              href={indexUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline font-medium hover:text-amber-900 dark:hover:text-amber-100"
            >
              Click here to create the required index
            </a>
          </p>
        ) : (
          <p className="mt-2">Check your console for the index creation link.</p>
        )}
      </AlertDescription>
    </Alert>
  );
};
