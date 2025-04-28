import { Button } from '../ui/button';

interface ImagePreviewProps {
  previewUrl: string;
  onCancel: () => void;
}

export const ImagePreview = ({ previewUrl, onCancel }: ImagePreviewProps) => {
  return (
    <div className="absolute bottom-full left-0 p-2 bg-background border rounded-t-lg flex items-center shadow-lg z-50">
      <img
        src={previewUrl}
        alt="Image preview"
        className="w-20 h-20 object-cover rounded mr-2"
        draggable={false}
      />
      <Button
        variant="destructive"
        size="sm"
        onClick={onCancel}
        aria-label="Cancel image preview"
      >
        Cancel
      </Button>
    </div>
  );
};
