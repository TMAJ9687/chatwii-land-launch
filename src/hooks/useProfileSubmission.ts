
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

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
    
    if (!gender) {
      toast({
        title: "Error",
        description: "Please select your gender",
        variant: "destructive",
      });
      return false;
    }
    
    if (!age) {
      toast({
        title: "Error",
        description: "Please select your age",
        variant: "destructive",
      });
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
        if (
          profileError.message &&
          /duplicate key value.*nickname|unique constraint.*nickname/i.test(profileError.message)
        ) {
          toast({
            title: "Nickname is taken",
            description: "Please choose a different nickname.",
            variant: "destructive",
          });
          setIsLoading(false);
          return false;
        } else {
          toast({
            title: "Error",
            description: "Failed to save profile. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return false;
        }
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
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { submitProfile, isLoading };
}
