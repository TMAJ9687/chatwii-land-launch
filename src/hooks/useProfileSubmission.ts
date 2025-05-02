
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserProfile, queryDocuments, createDocument, deleteDocument } from "@/lib/firebase";
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
    
    // Validate required fields
    if (!nickname) {
      console.error("Missing nickname in profile data");
      toast.error("Nickname is required");
      return false;
    }

    // Log the start of submission process
    console.log("Starting profile submission process for:", nickname);
    
    // Server-side nickname availability check
    try {
      console.log("Checking nickname availability:", nickname);
      const existingProfiles = await queryDocuments('profiles', [
        { field: 'nickname', operator: '==', value: nickname },
        { field: 'deleted_at', operator: '==', value: null }
      ]);

      if (existingProfiles.length > 0) {
        console.log("Nickname already taken:", nickname);
        toast.error("Nickname is already taken. Please choose a different nickname.");
        return false;
      }
    } catch (error) {
      console.error("Error checking nickname availability:", error);
      toast.error("Failed to check nickname availability. Please try again.");
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
      if (!userId) {
        console.error("No user ID found in localStorage");
        throw new Error("No user found. Please try signing in again.");
      }

      console.log("Creating user profile for user ID:", userId);

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
      console.log("User role set to 'standard' in localStorage");

      if (interests.length > 0) {
        console.log("Processing user interests:", interests);
        
        // Get existing interests
        const interestsData = await queryDocuments('interests', [
          { field: 'name', operator: 'in', value: interests }
        ]);
        
        console.log("Found matching interest records:", interestsData.length);

        // Delete existing user interests
        const userInterests = await queryDocuments('user_interests', [
          { field: 'user_id', operator: '==', value: userId }
        ]);

        // Delete existing interests
        for (const interest of userInterests) {
          await deleteDocument('user_interests', interest.id);
        }
        
        console.log("Deleted existing user interests");

        // Create new user interests
        for (const interest of interestsData) {
          await createDocument('user_interests', {
            user_id: userId,
            interest_id: interest.id
          });
        }
        
        console.log("Created new user interest associations");
      }

      console.log("Profile setup completed successfully");
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
