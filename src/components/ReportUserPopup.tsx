import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  { id: 'underage', label: 'Under age', desc: 'User is below 18' },
  { id: 'harassment', label: 'Harassment / Bullying', desc: 'Sending terrible texts' },
  { id: 'hate', label: 'Hate Speech / Discrimination', desc: 'Racism / sexism' },
  { id: 'spam', label: 'Spam / Scams', desc: 'Spamming the chat and phishing' },
  { id: 'impersonation', label: 'Impersonation', desc: 'Pretending to be someone they are not' },
  { id: 'explicit', label: 'Explicit / Inappropriate Content', desc: 'Sharing NSFW material' },
  { id: 'other', label: 'Other', desc: '' }
];

export const ReportUserPopup = ({
  isOpen,
  onClose,
  reportedUser
}: ReportUserPopupProps) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [otherReason, setOtherReason] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedReason('');
      setOtherReason('');
      setSubmitAttempted(false);
    }
  }, [isOpen, reportedUser?.id]);

  const resetForm = () => {
    setSelectedReason('');
    setOtherReason('');
    setSubmitAttempted(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      onClose();
    }
  };

  const reportMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const reportObject = {
        reporter_id: user.id,
        reported_id: reportedUser.id,
        reason,
        status: 'pending'
      };
      const { error } = await supabase.from('reports').insert(reportObject);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Report submitted successfully');
      handleOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit report. Please try again later.');
      setSubmitAttempted(false);
    },
    onSettled: () => setSubmitAttempted(false)
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submitAttempted || reportMutation.isPending) return;

    if (!selectedReason) {
      toast.error('Please select a reason');
      return;
    }

    const reason = selectedReason === 'other' ? otherReason : REPORT_REASONS.find(r => r.id === selectedReason)?.label || '';
    if (selectedReason === 'other' && !otherReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setSubmitAttempted(true);
    reportMutation.mutate({ reason });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm w-full rounded-xl bg-white dark:bg-neutral-900 shadow-xl p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-semibold text-gray-800 dark:text-white">
            Report <span className="text-red-500">{reportedUser?.nickname || "User"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-300">
            Why are you reporting this user? Select a reason below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="px-6 pt-2 pb-6">
          <div className="space-y-2">
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason.id}
                className={`flex items-start gap-2.5 p-2 rounded-md border border-transparent hover:bg-gray-50 dark:hover:bg-neutral-800 transition cursor-pointer ${
                  selectedReason === reason.id ? 'ring-2 ring-red-200 dark:ring-red-600' : ''
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={reason.id}
                  checked={selectedReason === reason.id}
                  onChange={() => setSelectedReason(reason.id)}
                  className="mt-1.5 accent-red-500"
                  disabled={reportMutation.isPending}
                />
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-100">{reason.label}</div>
                  {reason.desc && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{reason.desc}</div>
                  )}
                </div>
              </label>
            ))}
            {selectedReason === 'other' && (
              <Textarea
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value.slice(0, 120))}
                placeholder="Please provide more details..."
                className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500 text-xs"
                rows={3}
                maxLength={120}
                disabled={reportMutation.isPending}
              />
            )}
          </div>
          <div className="mt-5 flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              className="text-xs"
              onClick={onClose}
              disabled={reportMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="text-xs bg-red-600 hover:bg-red-700"
              disabled={reportMutation.isPending || submitAttempted}
            >
              {reportMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
