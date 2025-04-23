
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileData {
  nickname: string;
  gender: string;
  age: string;
  country: string;
  interests?: string[];
}

export function useProfileSubmission() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const submitProfile = async (profileData: ProfileData) => {
    const { nickname, gender, age, country, interests = [] } = profileData;
    
    // Server-side nickname availability check
    const { data: nicknameCheck } = await supabase.rpc('is_nickname_available', { 
      check_nickname: nickname 
    });

    if (!nicknameCheck) {
      toast.error("Nickname is already taken. Please choose a different nickname.");
      return false;
    }
    
    if (!gender) {
      toast.error("Please select your gender");
      return false;
    }
    
    if (!age) {
      toast.error("Please select your age");
      return false;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          nickname,
          gender,
          age: age ? parseInt(age) : null,
          country,
          role: 'standard'
        });

      if (profileError) {
        toast.error("Failed to save profile. Please try again.");
        return false;
      }

      if (interests.length > 0) {
        const { data: interestsData } = await supabase
          .from("interests")
          .select("id, name")
          .in("name", interests);

        if (interestsData && interestsData.length > 0) {
          await supabase
            .from("user_interests")
            .delete()
            .eq("user_id", user.id);
            
          const userInterests = interestsData.map(interest => ({
            user_id: user.id,
            interest_id: interest.id
          }));

          const { error: interestsError } = await supabase
            .from("user_interests")
            .insert(userInterests);

          if (interestsError) throw interestsError;
        }
      }

      navigate("/chat");
      return true;
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { submitProfile, isLoading };
}
