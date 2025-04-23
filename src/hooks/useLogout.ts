
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useLogout = (redirectTo: string = "/feedback") => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Delete the user's profile (remove for nickname re-use)
        const { error: deleteProfileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);

        if (deleteProfileError) {
          toast({
            variant: "destructive",
            title: "Could not remove profile",
            description: "There was an issue deleting your profile info.",
          });
          console.error('Error deleting user profile:', deleteProfileError);
        }

        // Optionally you may want to also clear their interests, etc...
      }

      // Sign out
      await supabase.auth.signOut();
      navigate(redirectTo);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "An unexpected error occurred during logout."
      });
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    handleLogout,
    isLoggingOut
  };
};
