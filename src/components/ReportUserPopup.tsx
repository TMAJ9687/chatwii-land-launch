import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export const ReportUserPopup = ({
  isOpen,
  onClose,
  reportedUser
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {reportedUser.nickname}</DialogTitle>
          <DialogDescription>
            Just a test: Can you close this dialog without freezing?
          </DialogDescription>
        </DialogHeader>
        <Button onClick={onClose}>Close</Button>
      </DialogContent>
    </Dialog>
  );
};
