import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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
  { id: 'underage', label: 'Under age', description: 'User is below 18' },
  { id: 'harassment', label: 'Harassment / Bullying', description: 'Sending terrible texts' },
  { id: 'hate', label: 'Hate Speech / Discrimination', description: 'Racism / sexism' },
  { id: 'spam', label: 'Spam / Scams', description: 'Spamming the chat and phishing' },
  { id: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone they are not' },
  { id: 'explicit', label: 'Explicit / Inappropriate Content', description: 'Sharing NSFW material' },
  { id: 'other', label: 'Other', description: '' }
];

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), ms)
    ),
  ]);
};

export const ReportUserPopup = ({
  isOpen,
  onClose,
  reportedUser
}: ReportUserPopupProps) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [otherReason, setOtherReason] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const resetForm = () => {
    setSelectedReason('');
    setOtherReason('');
    setSubmitAttempted(false);
  };

  // Only show the modal if open
  if (!isOpen) return null;

  const reportMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
      try {
        const { data: { user } } = await withTimeout(supabase.auth.getUser(), 5000);
        if (!user) throw new Error('Not authenticated');

        const reportObject = {
          reporter_id: user.id,
          reported_id: reportedUser.id,
          reason,
          status: 'pending'
        };

        const { data, error } = await withTimeout(
          Promise.resolve(supabase.from('reports').insert(reportObject)).then(result => result),
          5000
        );

        if (error) throw error;
        return data;
      } catch (error: any) {
        if (error.message?.includes('timed out')) {
          throw new Error('Request timed out. Please try again later.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Report submitted successfully');
      handleClose();
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

    if (selectedReason === 'other' && !otherReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setSubmitAttempted(true);

    const reason =
      selectedReason === 'other'
        ? otherReason
        : REPORT_REASONS.find(r => r.id === selectedReason)?.label || '';

    reportMutation.mutate({ reason });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/30 transition-opacity"
        onClick={handleClose}
        aria-label="Close report popup"
      />
      {/* Modal */}
      <div
        className="fixed z-50 left-1/2 top-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 border border-gray-100"
        style={{ minWidth: 320 }}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="absolute right-3 top-3 text-gray-400 hover:text-red-500"
          onClick={handleClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
          Report <span className="text-red-500">{reportedUser.nickname}</span>
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Why are you reporting this user? Select a reason below.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            {REPORT_REASONS.map(reason => (
              <label
                key={reason.id}
                htmlFor={`reason-${reason.id}`}
                className={`flex items-start p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border border-transparent transition`}
              >
                <input
                  type="radio"
                  id={`reason-${reason.id}`}
                  name="report_reason"
                  value={reason.id}
                  checked={selectedReason === reason.id}
                  onChange={() => setSelectedReason(reason.id)}
                  className="mt-1.5 mr-3 text-red-600 focus:ring-red-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-100">{reason.label}</span>
                  {reason.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{reason.description}</p>
                  )}
                </div>
              </label>
            ))}
            {/* Show textarea if "Other" is selected */}
            {selectedReason === 'other' && (
              <textarea
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500 text-xs"
                placeholder="Please provide more details..."
                value={otherReason}
                onChange={e => setOtherReason(e.target.value.slice(0, 120))}
                rows={3}
                maxLength={120}
                required
                autoFocus
              />
            )}
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500"
              onClick={handleClose}
              disabled={reportMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
              disabled={reportMutation.isPending || submitAttempted}
            >
              {reportMutation.isPending ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
