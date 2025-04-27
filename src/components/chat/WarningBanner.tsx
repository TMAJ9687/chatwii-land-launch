
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface WarningBannerProps {
  message: string;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({ message }) => {
  return (
    <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 m-4">
      <Info className="h-4 w-4 text-amber-500" />
      <AlertDescription className="text-amber-800 dark:text-amber-300">
        {message}
      </AlertDescription>
    </Alert>
  );
};
