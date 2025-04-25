import { useState, useEffect } from 'react';
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

  // Reset form state on open/close or user change
  useEffect(() => {
    if (!isOpen) {
      setSelectedReason('');
      setOtherReason('');
      setSubmitAttempted(false);
    }
  }, [isOpen, reportedUser?.id]);

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
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit report. Please try again later.');
      setSubmitAttempted(false);
    },
    onSettled: () => setSubmitAttempted(false)
  });

  const handleSubmit = async () => {
    if (submitAttempted || reportMutation.isPending) return;

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

    setSubmitAttempted(true);
    reportMutation.mutate({ reason });
  };

  // No modal if not open!
  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
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
          padding: "1.3rem 1rem 1rem 1rem",
          zIndex: 9999,
          borderRadius: "13px",
          minWidth: "270px",
          maxWidth: "94vw",
          boxShadow: "0 8px 32px #0002",
          fontFamily: "inherit",
        }}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: 10,
            top: 7,
            background: "none",
            border: "none",
            fontSize: 16,
            cursor: "pointer",
            color: "#aaa",
            width: 26,
            height: 26,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          aria-label="Close"
        >✕</button>
        <h2 style={{
          margin: "0 0 13px 0",
          fontSize: "1.09rem",
          fontWeight: 600,
          letterSpacing: 0.1,
        }}>
          Report <span style={{ color: "#FC8181", fontWeight: 600 }}>{reportedUser.nickname}</span>
        </h2>
        <div style={{ marginBottom: 12 }}>
          <select
            style={{
              width: "100%",
              marginBottom: 10,
              padding: "7px 9px",
              borderRadius: 5,
              border: "1px solid #ddd",
              fontSize: "0.96rem",
              background: "#fafafa",
              color: "#333"
            }}
            value={selectedReason}
            onChange={e => setSelectedReason(e.target.value)}
            disabled={reportMutation.isPending}
          >
            <option value="">Select a reason...</option>
            {REPORT_REASONS.map(reason =>
              <option value={reason.id} key={reason.id}>{reason.label}</option>
            )}
          </select>
          {selectedReason === "other" && (
            <textarea
              placeholder="Describe the issue (max 120 chars)"
              value={otherReason}
              onChange={e => setOtherReason(e.target.value.slice(0, 120))}
              style={{
                width: "100%",
                height: 40,
                marginBottom: 8,
                padding: "7px 9px",
                borderRadius: 5,
                border: "1px solid #ddd",
                fontSize: "0.97rem",
                background: "#fafafa",
                color: "#333",
                resize: "none"
              }}
              maxLength={120}
              disabled={reportMutation.isPending}
            />
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={reportMutation.isPending || submitAttempted}
          style={{
            width: "100%",
            padding: "8px 0",
            background: "#fc8181",
            color: "white",
            border: "none",
            borderRadius: 7,
            fontWeight: 500,
            fontSize: "0.98rem",
            cursor: reportMutation.isPending || submitAttempted ? "not-allowed" : "pointer",
            opacity: reportMutation.isPending || submitAttempted ? 0.7 : 1,
            letterSpacing: 0.1,
            boxShadow: "0 2px 12px #fc818128"
          }}
        >
          {reportMutation.isPending ? "Submitting..." : "Submit Report"}
        </button>
      </div>
    </>
  );
};
