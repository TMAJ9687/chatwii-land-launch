
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useLogout = (redirectTo: string = "/") => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
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
          toast({
            variant: "destructive",
            title: "Could not update user status",
            description: "There was an issue updating your online status."
          });
          console.error('Error updating user visibility:', updateError);
        }
      }

      // Sign out
      await supabase.auth.signOut();
      
      // Redirect to specified page after logout
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
