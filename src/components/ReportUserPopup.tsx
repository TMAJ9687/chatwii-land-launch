
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ReportUserPopupProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUser: {
    id: string;
    nickname: string;
  };
}

const REPORT_REASONS = [
  { id: 'underage', label: 'Under age (user is below 18)' },
  { id: 'harassment', label: 'Harassment/Bullying (sending terrible texts)' },
  { id: 'hate', label: 'Hate Speech/Discrimination (racism/sexism)' },
  { id: 'spam', label: 'Spam/Scams (spamming the chat and phishing)' },
  { id: 'impersonation', label: 'Impersonation (pretending to be someone they are not)' },
  { id: 'explicit', label: 'Explicit/Inappropriate Content (sharing NSFW material)' },
  { id: 'other', label: 'Other' }
];

export const ReportUserPopup = ({
  isOpen,
  onClose,
  reportedUser
}: ReportUserPopupProps) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [otherReason, setOtherReason] = useState('');

  // Reset state when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Small delay to ensure smooth animation before resetting state
      setTimeout(() => {
        setSelectedReason('');
        setOtherReason('');
      }, 300);
      onClose();
    }
  };

  const reportMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
          .from('reports')
          .insert({
            reporter_id: user.id,
            reported_id: reportedUser.id,
            reason,
            status: 'pending'
          });

        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Report submission error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Report submitted successfully');
      handleOpenChange(false);
    },
    onError: (error) => {
      console.error('Report submission error:', error);
      toast.error('Failed to submit report. Please try again later.');
    }
  });

  const handleSubmit = () => {
    if (!selectedReason) {
      toast.error('Please select a reason');
      return;
    }

    const reason = selectedReason === 'other' ? otherReason : 
      REPORT_REASONS.find(r => r.id === selectedReason)?.label || '';

    if (selectedReason === 'other' && !otherReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    reportMutation.mutate({ reason });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {reportedUser.nickname}</DialogTitle>
          <DialogDescription>
            Please select a reason for reporting this user. This report will be reviewed by our administrators.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {REPORT_REASONS.map((reason) => (
              <div key={reason.id} className="flex items-center space-x-2">
                <RadioGroupItem value={reason.id} id={reason.id} />
                <Label htmlFor={reason.id}>{reason.label}</Label>
              </div>
            ))}
          </RadioGroup>

          {selectedReason === 'other' && (
            <Textarea
              placeholder="Please describe the issue (max 120 characters)"
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value.slice(0, 120))}
              className="h-20"
            />
          )}

          <Button 
            onClick={handleSubmit}
            disabled={!selectedReason || 
              (selectedReason === 'other' && !otherReason.trim()) || 
              reportMutation.isPending}
            className="w-full"
          >
            {reportMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
