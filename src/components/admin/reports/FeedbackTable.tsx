import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "@/components/ui/sonner";
import {
  Table, TableHeader, TableRow, TableHead,
  TableBody, TableCell
} from "@/components/ui/table";
import { Star, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

type Feedback = {
  id: number;
  user_id: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string;
  user_nickname?: string;
};

// Placeholder/mock feedback
const MOCK_FEEDBACK: Feedback[] = [
  {
    id: 1,
    user_id: "user1",
    rating: 5,
    comment: "Great service!",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    user_nickname: "JohnDoe"
  },
  {
    id: 2,
    user_id: null,
    rating: 3,
    comment: "It's okay, could be better.",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    user_nickname: "Anonymous"
  }
];

export const FeedbackTable = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    // Replace this with your API call to fetch feedback
    setTimeout(() => {
      setFeedbackList(MOCK_FEEDBACK);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleDelete = async (feedbackId: number) => {
    setDeletingId(feedbackId);
    try {
      // Replace with your API delete logic
      await new Promise(res => setTimeout(res, 800));
      setFeedbackList(prev => prev.filter(item => item.id !== feedbackId));
      toast.success('Feedback deleted successfully');
    } catch (err) {
      console.error('Error deleting feedback:', err);
      toast.error('Failed to delete feedback');
    } finally {
      setDeletingId(null);
    }
  };

  const renderStars = (rating: number | null) => {
    if (rating === null) return "No rating";
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < (rating ?? 0)
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm">{rating}/5</span>
      </div>
    );
  };

  if (isLoading) {
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
            {feedbackList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No feedback submitted yet
                </TableCell>
              </TableRow>
            ) : (
              feedbackList.map((item) => (
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Feedback</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this feedback? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
