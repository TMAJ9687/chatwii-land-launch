
import React from 'react';
import { Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const MessageInputPlaceholder: React.FC = () => {
  return (
    <div className="p-4 border-t border-border flex gap-2 items-center bg-background relative">
      <Input
        value="This is a demo VIP user. You cannot send messages to this account."
        disabled
        className="flex-1 bg-gray-100 dark:bg-gray-800 text-muted-foreground"
      />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Info className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            This is a demo VIP user created to showcase the VIP features.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
