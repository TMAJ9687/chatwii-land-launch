
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface ActionButtonsProps {
  onStop: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onStop,
  onCancel,
  disabled = false
}) => {
  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onStop}
        disabled={disabled}
        className="rounded-full"
      >
        <Check className="h-5 w-5" />
      </Button>
      <Button
        variant="destructive"
        size="icon"
        onClick={onCancel}
        disabled={disabled}
        className="rounded-full"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
};
