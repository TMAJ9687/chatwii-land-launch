
import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceRecorderButtonProps {
  isRecording: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const VoiceRecorderButton: React.FC<VoiceRecorderButtonProps> = ({
  isRecording,
  onClick,
  disabled = false
}) => {
  return (
    <Button
      variant={isRecording ? "destructive" : "ghost"}
      size="icon"
      onClick={onClick}
      className="rounded-full"
      disabled={disabled}
    >
      {isRecording ? (
        <MicOff className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
};
