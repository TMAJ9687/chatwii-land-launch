
import { Button } from '@/components/ui/button';
import { Paperclip, Mic, Smile, Send } from 'lucide-react';

interface ActionButtonsProps {
  onEmojiClick: () => void;
  onAttachmentClick: () => void;
  onVoiceClick: () => void;
  onSendClick: () => void;
  isRecording: boolean;
  disabled: boolean;
  sendDisabled: boolean;
  isVip: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onEmojiClick,
  onAttachmentClick,
  onVoiceClick,
  onSendClick,
  isRecording,
  disabled,
  sendDisabled,
  isVip
}) => {
  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full"
        onClick={onEmojiClick}
        disabled={disabled}
      >
        <Smile className="h-5 w-5" />
      </Button>

      <Button 
        variant={isRecording ? "destructive" : "ghost"}
        size="icon"
        className={`rounded-full transition-all duration-200 ${
          !isVip ? 'opacity-50 cursor-not-allowed' : ''
        } ${isRecording ? 'animate-pulse' : ''}`}
        onClick={onVoiceClick}
        disabled={disabled || !isVip}
        title={!isVip ? "VIP-only feature" : "Record voice message"}
      >
        <Mic className="h-5 w-5" />
      </Button>

      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full"
        onClick={onAttachmentClick}
        disabled={disabled}
      >
        <Paperclip className="h-5 w-5" />
      </Button>

      <Button 
        onClick={onSendClick}
        size="icon"
        className="rounded-full"
        disabled={sendDisabled || disabled}
      >
        <Send className="h-5 w-5" />
      </Button>
    </>
  );
};
