
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  const reportMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
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
    },
    onSuccess: () => {
      toast.success('Report submitted successfully');
      onClose();
    },
    onError: () => {
      toast.error('Failed to submit report');
    },
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {reportedUser.nickname}</DialogTitle>
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
            disabled={!selectedReason || (selectedReason === 'other' && !otherReason.trim())}
          >
            Submit Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
