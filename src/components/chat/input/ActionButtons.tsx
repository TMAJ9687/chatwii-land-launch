import { Button } from '@/components/ui/button';
import { Paperclip, Mic, Smile, Send } from 'lucide-react';

interface ActionButtonsProps {
  onEmojiClick?: () => void;
  onAttachmentClick?: () => void;
  onVoiceClick?: () => void;
  onSendClick?: () => void;
  onStop?: () => void;
  onCancel?: () => void;
  isRecording?: boolean;
  disabled?: boolean;
  sendDisabled?: boolean;
  isVip?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onEmojiClick,
  onAttachmentClick,
  onVoiceClick,
  onSendClick,
  onStop,
  onCancel,
  isRecording = false,
  disabled = false,
  sendDisabled = false,
  isVip = false
}) => {
  if (onStop && onCancel) {
    return (
      <>
        <Button 
          variant="destructive" 
          size="icon" 
          className="rounded-full"
          onClick={onStop}
          disabled={disabled}
        >
          <Mic className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          onClick={onCancel}
          disabled={disabled}
        >
          <Send className="h-5 w-5 rotate-45" />
        </Button>
      </>
    );
  }
  
  return (
    <>
      {onEmojiClick && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          onClick={onEmojiClick}
          disabled={disabled}
        >
          <Smile className="h-5 w-5" />
        </Button>
      )}

      {onVoiceClick && (
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
      )}

      {onAttachmentClick && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          onClick={onAttachmentClick}
          disabled={disabled}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
      )}

      {onSendClick && (
        <Button 
          onClick={onSendClick}
          size="icon"
          className="rounded-full"
          disabled={sendDisabled || disabled}
        >
          <Send className="h-5 w-5" />
        </Button>
      )}
    </>
  );
};
