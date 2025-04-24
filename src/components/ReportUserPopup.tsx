
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

// Utility for timeout to prevent UI freezes during long operations
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), ms)
    ),
  ]);
};

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
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Reset state when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset form state after dialog is fully closed
      setTimeout(() => {
        setSelectedReason('');
        setOtherReason('');
        setSubmitAttempted(false);
      }, 300);
    }
  };

  const reportMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
      try {
        // Get current user with timeout protection (5 seconds)
        const userResponse = await withTimeout(supabase.auth.getUser(), 5000);
        const { data: { user } } = userResponse;
        if (!user) throw new Error('Not authenticated');

        // Create report object
        const reportObject = {
          reporter_id: user.id,
          reported_id: reportedUser.id,
          reason,
          status: 'pending'
        };

        // Submit report with timeout protection (8 seconds)
        // Convert the Supabase query to a proper Promise using Promise.resolve()
        const reportPromise = Promise.resolve(
          supabase
            .from('reports')
            .insert(reportObject)
        );

        const response = await withTimeout(reportPromise, 8000);
        
        if (response.error) throw response.error;
        return true;
      } catch (error: any) {
        console.error('Report submission error:', error);
        
        if (error.message?.includes('timed out')) {
          throw new Error('Request timed out. Please try again later.');
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Report submitted successfully');
      // Immediately close dialog on success
      onClose();
    },
    onError: (error: any) => {
      console.error('Report submission error:', error);
      toast.error(error.message || 'Failed to submit report. Please try again later.');
      setSubmitAttempted(false); // Reset submit flag to allow retry
    }
  });

  const handleSubmit = async () => {
    if (submitAttempted) return; // Prevent multiple submissions
    
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

    setSubmitAttempted(true);
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
              reportMutation.isPending ||
              submitAttempted}
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
