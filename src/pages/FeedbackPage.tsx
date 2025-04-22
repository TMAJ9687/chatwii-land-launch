
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

export const FeedbackPage = () => {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  
  const handleRatingClick = (value: number) => {
    setRating(value);
  };
  
  const handleRatingHover = (value: number) => {
    setHoveredRating(value);
  };
  
  const handleRatingLeave = () => {
    setHoveredRating(null);
  };
  
  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("feedback")
        .insert({
          rating,
          comment: comment.trim() || null
        });
        
      if (error) throw error;
      
      setSubmitted(true);
      
      // Show success message and redirect after a short delay
      setTimeout(() => {
        navigate("/");
      }, 2000);
      
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback", {
        description: "There was a problem submitting your feedback. Please try again."
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // If the feedback was submitted, show a thank you message
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-3xl font-bold mb-4">Thank you for your feedback!</h1>
          <p className="mb-4 text-muted-foreground">Your feedback helps us improve our service.</p>
          <p className="text-sm">Redirecting to home page...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Feedback & Rating</h1>
        
        <div className="mb-6">
          <p className="mb-2">How would you rate your experience?</p>
          <div 
            className="flex justify-center space-x-2"
            onMouseLeave={handleRatingLeave}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <Star
                key={value}
                className={`h-8 w-8 cursor-pointer ${
                  (hoveredRating !== null ? value <= hoveredRating : value <= (rating || 0))
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
                onClick={() => handleRatingClick(value)}
                onMouseEnter={() => handleRatingHover(value)}
              />
            ))}
          </div>
          <p className="text-center mt-2 text-sm text-muted-foreground">
            {rating ? `You selected ${rating} star${rating !== 1 ? 's' : ''}` : 'Click to rate'}
          </p>
        </div>
        
        <div className="mb-6">
          <label htmlFor="comment" className="block mb-2">
            Any additional comments? (optional)
          </label>
          <Textarea
            id="comment"
            placeholder="Tell us about your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={submitting || rating === null}
          className="w-full"
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </Button>
        
        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => navigate("/")}
            className="text-sm"
          >
            Skip feedback
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
