
import { DatabaseIcon, Database } from 'lucide-react';
import { useMockMode } from '@/contexts/MockModeContext';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

export const MockModeToggle = () => {
  const { isMockMode, enableMockMode, disableMockMode } = useMockMode();

  const toggleMockMode = () => {
    if (isMockMode) {
      disableMockMode();
      toast.info('Firebase mode enabled');
    } else {
      enableMockMode();
      toast.info('Mock mode enabled - Firebase connection disabled');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMockMode}
            className={isMockMode ? 'text-orange-500 border-orange-500' : ''}
          >
            {isMockMode ? (
              <Database className="h-4 w-4" />
            ) : (
              <DatabaseIcon className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isMockMode ? 'Disable Mock Mode' : 'Enable Mock Mode (No Firebase)'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
