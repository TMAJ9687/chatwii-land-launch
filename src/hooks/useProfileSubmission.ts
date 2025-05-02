
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserProfile, queryDocuments, createDocument, deleteDocument } from "@/lib/firebase";
import { toast } from "sonner";
import { handleFirebaseError } from "@/utils/firebaseErrorHandling";

interface ProfileData {
  nickname: string;
  gender: string;
  age: string;
  country: string;
  interests?: string[];
  bypassNicknameCheck?: boolean;
}

export function useProfileSubmission() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const submitProfile = async (profileData: ProfileData) => {
    const { nickname, gender, age, country, interests = [], bypassNicknameCheck = false } = profileData;
    
    // Validate required fields
    if (!nickname) {
      console.error("Missing nickname in profile data");
      toast.error("Nickname is required");
      return false;
    }

    // Log the start of submission process
    console.log("Starting profile submission process for:", nickname);
    setIsLoading(true);
    setError(null);
    
    try {
      // Skip nickname check if in development mode or when bypassed
      if (!bypassNicknameCheck) {
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
          handleFirebaseError(error, "Unable to check nickname availability");
          setError(error);
          
          // If this is a permission error, we'll show a special message but allow continuing
          // for now since we're still setting up the Firebase rules
          if (process.env.NODE_ENV === 'development') {
            console.warn("Development mode: Continuing despite nickname check error");
          } else {
            return false;
          }
        }
      } else {
        console.log("Bypassing nickname availability check");
      }
      
      if (!gender) {
        toast.error("Please select your gender");
        return false;
      }
      
      if (!age) {
        toast.error("Please select your age");
        return false;
      }

      const userId = localStorage.getItem('firebase_user_id');
      if (!userId) {
        console.error("No user ID found in localStorage");
        toast.error("Authentication error. Please try again.");
        return false;
      }

      console.log("Creating user profile for user ID:", userId);

      // Create or update user profile
      try {
        await createUserProfile(userId, {
          nickname,
          gender,
          age: age ? parseInt(age) : null,
          country,
          role: 'standard',
          vip_status: false,
          visibility: 'online'
        });
      } catch (error) {
        console.error("Error creating user profile:", error);
        handleFirebaseError(error, "Failed to create user profile");
        setError(error);
        return false;
      }

      // Store role in localStorage for easy access
      localStorage.setItem('firebase_user_role', 'standard');
      console.log("User role set to 'standard' in localStorage");

      // Only process interests if we have some and if there was no error earlier
      if (interests.length > 0) {
        try {
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
        } catch (error) {
          // Non-fatal error - log but don't fail the whole process
          console.error("Error processing interests:", error);
          // Silently handle this error as interests are optional
        }
      }

      console.log("Profile setup completed successfully");
      return true;
    } catch (error) {
      console.error("Error saving profile:", error);
      handleFirebaseError(error, "Failed to save profile");
      setError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { submitProfile, isLoading, error };
}
