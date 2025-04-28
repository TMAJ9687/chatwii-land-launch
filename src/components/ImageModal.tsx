import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImageModal = ({ imageUrl, onClose }: ImageModalProps) => {
  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Support Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Image Preview"
      aria-describedby="image-modal-description"
      onClick={onClose}
      tabIndex={-1}
    >
      <div
        className="relative max-w-full max-h-full"
        onClick={e => e.stopPropagation()}
      >
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 z-60"
          onClick={onClose}
          aria-label="Close image view"
        >
          <X className="h-5 w-5" />
        </Button>
        <p id="image-modal-description" className="sr-only">
          Full size image preview
        </p>
        <img
          src={imageUrl}
          alt="Full screen"
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
};
