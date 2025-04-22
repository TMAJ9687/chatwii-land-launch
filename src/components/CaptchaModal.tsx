
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Turnstile } from "react-turnstile";

interface CaptchaModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
  onError: () => void;
  onExpire: () => void;
}

export const CaptchaModal = ({ open, onClose, onSuccess, onError, onExpire }: CaptchaModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>CAPTCHA Verification</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-4">
          {/* TODO: Replace the below sitekey with your real Cloudflare Turnstile sitekey */}
          <Turnstile
            sitekey="1x00000000000000000000AA" // <-- Use real key in production!
            onSuccess={onSuccess}
            onError={onError}
            onExpire={onExpire}
            theme="light"
          />
          <p className="mt-3 text-xs text-gray-500 text-center">
            Please complete the CAPTCHA to continue.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
