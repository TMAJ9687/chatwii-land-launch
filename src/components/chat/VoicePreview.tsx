
import { Button } from '../ui/button';
import { VoiceMessagePlayer } from '../VoiceMessagePlayer';

interface VoicePreviewProps {
  audioUrl: string;
  onSend?: () => void; // Made optional
  onCancel: () => void;
  disabled?: boolean;
}

export const VoicePreview = ({ audioUrl, onSend, onCancel, disabled }: VoicePreviewProps) => {
  return (
    <div className="absolute bottom-full left-0 p-2 bg-background border rounded-t-lg flex items-center gap-2 z-10">
      <VoiceMessagePlayer src={audioUrl} />
      {onSend && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSend}
          disabled={disabled}
        >
          Send
        </Button>
      )}
      <Button
        variant="destructive"
        size="sm"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </div>
  );
};
