
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";

const MAX_LENGTH = 120;

const FeedbackPage = () => {
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Mock getting user ID
  useEffect(() => {
    setUserId(null);
  }, []);

  const handleSubmit = async () => {
    if (!rating) return;
    
    setSubmitting(true);
    try {
      // Mock submit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitted(true);
      toast.success("Thank you for your feedback!");
      
      // Redirect after a delay
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    toast.info("Feedback skipped");
    navigate("/", { replace: true });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Thank you for your feedback!</h1>
          <p className="mb-2 text-muted-foreground">Your feedback helps us improve.</p>
          <span className="text-sm">Redirecting to the home page...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <h1 className="text-xl font-bold text-center mb-5">Feedback</h1>
        <div>
          <p className="mb-2">Rate your experience:</p>
          <div className="flex justify-center space-x-1 mb-2" onMouseLeave={() => setHoverRating(null)}>
            {[1, 2, 3, 4, 5].map((val) => (
              <Star
                key={val}
                className={`h-8 w-8 cursor-pointer duration-75 ${
                  (hoverRating !== null ? val <= hoverRating : val <= (rating || 0))
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
                onClick={() => setRating(val)}
                onMouseEnter={() => setHoverRating(val)}
                strokeWidth={1.5}
              />
            ))}
          </div>
        </div>
        <Textarea
          maxLength={MAX_LENGTH}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mt-4 mb-1"
          placeholder="Let us know your thoughts (optional)"
          rows={3}
        />
        <div className="text-right text-xs text-muted-foreground mb-3">
          {comment.length}/{MAX_LENGTH}
        </div>
        <Button
          className="w-full mb-2"
          disabled={!rating || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
        <Button
          variant="outline"
          className="w-full"
          type="button"
          onClick={handleSkip}
        >
          Skip feedback
        </Button>
      </div>
    </div>
  );
};

export default FeedbackPage;
