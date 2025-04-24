import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { 
  Table, TableHeader, TableRow, TableHead, 
  TableBody, TableCell 
} from "@/components/ui/table";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type Feedback = {
  id: number;
  user_id: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string;
  user_nickname?: string;
};

export const FeedbackTable = () => {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (feedbackId: number) => {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', feedbackId);

      if (error) throw error;
    },
    onSuccess: (_, feedbackId) => {
      setFeedback(prev => prev.filter(item => item.id !== feedbackId));
      toast.success('Feedback deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete feedback');
    }
  });

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select()
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const userIds = new Set<string>();
        data.forEach(item => {
          if (item.user_id) {
            userIds.add(item.user_id);
          }
        });
        
        let nicknameMap = new Map<string, string>();
        
        if (userIds.size > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, nickname")
            .in("id", Array.from(userIds));
            
          if (profilesError) throw profilesError;
          
          profiles?.forEach(profile => {
            nicknameMap.set(profile.id, profile.nickname);
          });
        }
        
        const feedbackWithUsernames = data.map(item => ({
          ...item,
          user_nickname: item.user_id ? (nicknameMap.get(item.user_id) || "Unknown User") : "Anonymous"
        }));
        
        setFeedback(feedbackWithUsernames);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast.error("Failed to load feedback data", {
        description: "There was a problem fetching the feedback data."
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFeedback();
  }, []);
  
  const renderStars = (rating: number | null) => {
    if (rating === null) return "No rating";
    
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star 
            key={index}
            className={`h-4 w-4 ${index < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
          />
        ))}
        <span className="ml-2 text-sm">{rating}/5</span>
      </div>
    );
  };
  
  if (loading) {
    return <div className="flex justify-center p-8">Loading feedback...</div>;
  }
  
  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="hidden md:table-cell">Comment</TableHead>
              <TableHead>Date Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedback.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No feedback submitted yet
                </TableCell>
              </TableRow>
            ) : (
              feedback.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.user_nickname || "Anonymous"}</TableCell>
                  <TableCell>{renderStars(item.rating)}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-md">
                    {item.comment || "No comment provided"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(item.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
