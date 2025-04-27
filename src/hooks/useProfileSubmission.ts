
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserProfile, queryDocuments } from "@/lib/firebase";
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
    const existingProfiles = await queryDocuments('profiles', [
      { field: 'nickname', operator: '==', value: nickname },
      { field: 'deleted_at', operator: '==', value: null }
    ]);

    if (existingProfiles.length > 0) {
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
      const userId = localStorage.getItem('firebase_user_id');
      if (!userId) throw new Error("No user found");

      // Create or update user profile
      await createUserProfile(userId, {
        nickname,
        gender,
        age: age ? parseInt(age) : null,
        country,
        role: 'standard',
        vip_status: false,
        visibility: 'online'
      });

      // Store role in localStorage for easy access
      localStorage.setItem('firebase_user_role', 'standard');

      if (interests.length > 0) {
        // Get existing interests
        const interestsData = await queryDocuments('interests', [
          { field: 'name', operator: 'in', value: interests }
        ]);

        // Delete existing user interests
        const userInterests = await queryDocuments('user_interests', [
          { field: 'user_id', operator: '==', value: userId }
        ]);

        // Delete existing interests
        for (const interest of userInterests) {
          await deleteDocument('user_interests', interest.id);
        }

        // Create new user interests
        for (const interest of interestsData) {
          await createDocument('user_interests', {
            user_id: userId,
            interest_id: interest.id
          });
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
