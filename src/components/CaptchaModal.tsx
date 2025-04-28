
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ReCAPTCHA from 'react-google-recaptcha';

interface CaptchaModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
  onError: () => void;
  onExpire: () => void;
}

export const CaptchaModal: React.FC<CaptchaModalProps> = ({
  open,
  onClose,
  onSuccess,
  onError,
  onExpire,
}) => {
  const handleCaptchaChange = (token: string | null) => {
    if (token) {
      onSuccess(token);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify you're human</DialogTitle>
          <DialogDescription>
            Please complete the CAPTCHA verification below to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <ReCAPTCHA
            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
            onChange={handleCaptchaChange}
            onExpired={onExpire}
            onError={onError}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
