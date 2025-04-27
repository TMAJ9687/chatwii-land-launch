
import React from 'react';
import { Image } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AttachmentButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const AttachmentButton: React.FC<AttachmentButtonProps> = ({
  onClick,
  disabled = false
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="rounded-full"
      disabled={disabled}
    >
      <Image className="h-5 w-5" />
    </Button>
  );
};
