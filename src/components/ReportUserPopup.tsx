
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Reset form state immediately when dialog closes
      setSelectedReason('');
      setOtherReason('');
    }
  }, [isOpen]);

  const reportMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
      if (!reason.trim()) {
        throw new Error('Reason is required');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error, data } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_id: reportedUser.id,
          reason,
          status: 'pending'
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Report submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      onClose(); // Close dialog on success
    },
    onError: (error: any) => {
      console.error('Report submission error:', error);
      toast.error(error.message || 'Failed to submit report. Please try again later.');
    }
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (reportMutation.isPending) {
        toast.info('Please wait while your report is being submitted');
        return;
      }
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason');
      return;
    }

    const reason = selectedReason === 'other' 
      ? otherReason 
      : REPORT_REASONS.find(r => r.id === selectedReason)?.label || '';

    if (selectedReason === 'other' && !otherReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    // Submit the report
    reportMutation.mutate({ reason });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report {reportedUser.nickname}</DialogTitle>
          <DialogDescription>
            Please select a reason for reporting this user. This report will be reviewed by our administrators.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {REPORT_REASONS.map((reason) => (
              <div key={reason.id} className="flex items-center space-x-2">
                <RadioGroupItem value={reason.id} id={reason.id} />
                <Label htmlFor={reason.id} className="cursor-pointer">{reason.label}</Label>
              </div>
            ))}
          </RadioGroup>

          {selectedReason === 'other' && (
            <Textarea
              placeholder="Please describe the issue (max 120 characters)"
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value.slice(0, 120))}
              className="h-20"
              disabled={reportMutation.isPending}
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
