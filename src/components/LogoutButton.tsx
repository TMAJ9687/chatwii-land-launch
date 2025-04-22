
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

export const LogoutButton = () => {
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleLogout = async () => {
    try {
      // Get current user
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id;
      
      // Update user's visibility to offline before signing out
      if (userId) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ visibility: 'offline' })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating user visibility:', updateError);
        }
      }

      // Sign out
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
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
