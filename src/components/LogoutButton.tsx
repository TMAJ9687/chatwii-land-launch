
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

export const LogoutButton = () => {
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleLogout = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Update user's visibility to offline before signing out
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ visibility: 'offline' })
          .eq('id', user.id);

        if (updateError) {
          toast.error("Could not update user status", {
            description: "There was an issue updating your online status."
          });
          console.error('Error updating user visibility:', updateError);
        }
      }

      // Sign out
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      toast.error("Logout failed", {
        description: "An unexpected error occurred during logout."
      });
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowConfirmation(true)}
        className="rounded-full"
      >
        <LogOut className="h-5 w-5" />
      </Button>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you really want to leave? We'll miss you!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
