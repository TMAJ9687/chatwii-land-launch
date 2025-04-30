
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FirebaseIndexMessageProps {
  indexUrl?: string;
}

export const FirebaseIndexMessage: React.FC<FirebaseIndexMessageProps> = ({ indexUrl }) => {
  return (
    <Card className="m-2 bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700">
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h4 className="font-medium text-amber-800 dark:text-amber-300">Firebase Index Required</h4>
        </div>
        
        <p className="text-sm text-amber-700 dark:text-amber-300">
          To enable efficient message queries, Firebase requires a composite index. Please create this index
          in your Firebase console.
        </p>
        
        {indexUrl && (
          <Button 
            variant="outline" 
            className="bg-amber-100 border-amber-300 hover:bg-amber-200 text-amber-800 
                     dark:bg-amber-900/50 dark:border-amber-700 dark:hover:bg-amber-900 dark:text-amber-300"
            onClick={() => window.open(indexUrl, '_blank')}
          >
            Create Index in Firebase Console
          </Button>
        )}
        
        <p className="text-xs text-amber-600 dark:text-amber-400 pt-1">
          After creating the index, it may take a few minutes to activate.
        </p>
      </div>
    </Card>
  );
};
