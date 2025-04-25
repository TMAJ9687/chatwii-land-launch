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

  // This function resets all local state
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
      try {
        const start = Date.now();
        console.log('Starting report submission...');

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

        console.log(`Report submission took ${Date.now() - start}ms`);
        return data;
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
      // onClose will also reset the form
      handleOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Report submission error:', error);
      toast.error(error.message || 'Failed to submit report. Please try again later.');
      setSubmitAttempted(false);
      // Optionally close or keep open; here we keep open for retry
    },
    onSettled: () => {
      setSubmitAttempted(false);
    }
  });

  const handleSubmit = async () => {
    if (submitAttempted || reportMutation.isPending) return;

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

  // Pretty fallback modal to avoid freezing, with overlay!
  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 9998,
        }}
        onClick={onClose}
        aria-label="Close Report Modal"
      />
      <div
        style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          background: "white",
          padding: "2rem",
          zIndex: 9999,
          borderRadius: "16px",
          minWidth: "340px",
          maxWidth: "94vw",
          boxShadow: "0 8px 40px #0003"
        }}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: 20,
            top: 18,
            background: "none",
            border: "none",
            fontSize: 22,
            cursor: "pointer",
            color: "#999",
          }}
          aria-label="Close"
        >✖</button>
        <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: "1.4rem" }}>
          Report <span style={{ color: "#FC8181" }}>{reportedUser.nickname}</span>
        </h2>
        <div style={{ marginBottom: 16 }}>
          <select
            style={{
              width: "100%",
              marginBottom: 12,
              padding: 10,
              borderRadius: 6,
              border: "1px solid #ccc",
              fontSize: "1rem",
            }}
            value={selectedReason}
            onChange={e => setSelectedReason(e.target.value)}
          >
            <option value="">Select a reason...</option>
            {REPORT_REASONS.map(reason =>
              <option value={reason.id} key={reason.id}>{reason.label}</option>
            )}
          </select>
          {selectedReason === "other" && (
            <textarea
              placeholder="Please describe the issue (max 120 characters)"
              value={otherReason}
              onChange={e => setOtherReason(e.target.value.slice(0, 120))}
              style={{
                width: "100%",
                height: 64,
                marginBottom: 10,
                padding: 8,
                borderRadius: 6,
                border: "1px solid #ccc",
                fontSize: "1rem"
              }}
              maxLength={120}
            />
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={reportMutation.isPending || submitAttempted}
          style={{
            width: "100%",
            padding: "12px 0",
            background: "#fc8181",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            fontSize: "1.08rem",
            cursor: reportMutation.isPending || submitAttempted ? "not-allowed" : "pointer",
            opacity: reportMutation.isPending || submitAttempted ? 0.8 : 1,
            marginTop: 4,
            letterSpacing: 0.1,
            boxShadow: "0 2px 16px #fc818125"
          }}
        >
          {reportMutation.isPending ? "Submitting..." : "Submit Report"}
        </button>
      </div>
    </>
  );


};
