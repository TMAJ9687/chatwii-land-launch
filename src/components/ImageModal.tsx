
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImageModal = ({ imageUrl, onClose }: ImageModalProps) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div 
        className="relative max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <Button 
          variant="destructive" 
          size="icon" 
          className="absolute top-2 right-2 z-60"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
        <img 
          src={imageUrl} 
          alt="Full screen" 
          className="max-w-full max-h-full object-contain" 
        />
      </div>
    </div>
  );
};
