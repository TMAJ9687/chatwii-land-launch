
import React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SendButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const SendButton: React.FC<SendButtonProps> = ({
  onClick,
  disabled = false
}) => {
  return (
    <Button
      variant="primary"
      size="icon"
      onClick={onClick}
      className="rounded-full"
      disabled={disabled}
    >
      <Send className="h-5 w-5" />
    </Button>
  );
};
