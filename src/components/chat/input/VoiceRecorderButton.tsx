
import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceRecorderButtonProps {
  isRecording: boolean;
  onClick: () => void; // Use this for actual click handling
  onStartRecording?: () => Promise<void>; // Added as optional
  onStopRecording?: () => void; // Added as optional
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
