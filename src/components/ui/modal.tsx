
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  className?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
  closeOnClickOutside?: boolean;
  closeOnEsc?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  contentClassName,
  showCloseButton = true,
  closeOnClickOutside = true,
  closeOnEsc = true,
}: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-[95vw] w-full h-[95vh]',
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open && closeOnClickOutside) {
          onClose();
        }
      }}
    >
      <DialogContent
        className={cn(
          sizeClasses[size],
          size === 'full' && 'flex flex-col overflow-hidden',
          className
        )}
        onEscapeKeyDown={(e) => {
          if (!closeOnEsc) {
            e.preventDefault();
          }
        }}
      >
        {showCloseButton && (
          <Button
            variant="ghost"
            className="absolute right-4 top-4 rounded-full p-1 h-auto w-auto"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}

        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}

        <div className={cn(
          "flex-1 overflow-auto", 
          size === 'full' && "my-2",
          contentClassName
        )}>
          {children}
        </div>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

export { DialogFooter } from '@/components/ui/dialog';
