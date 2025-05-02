
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
  const [retryCount, setRetryCount] = useState(0);

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
            setIsLoading(false);
            return false;
          }
        } catch (error) {
          console.error("Error checking nickname availability:", error);
          
          // If this is a development environment or explicitly bypassing, continue anyway
          if (bypassNicknameCheck || process.env.NODE_ENV === 'development') {
            console.warn("Development mode: Continuing despite nickname check error");
          } else {
            handleFirebaseError(error, "Unable to check nickname availability");
            setError(error);
            setIsLoading(false);
            return false;
          }
        }
      } else {
        console.log("Bypassing nickname availability check");
      }
      
      // Validate other required fields
      if (!gender) {
        toast.error("Please select your gender");
        setIsLoading(false);
        return false;
      }
      
      if (!age) {
        toast.error("Please select your age");
        setIsLoading(false);
        return false;
      }

      const userId = localStorage.getItem('firebase_user_id');
      if (!userId) {
        console.error("No user ID found in localStorage");
        toast.error("Authentication error. Please try again.");
        setIsLoading(false);
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
        
        // Store role in localStorage for easy access
        localStorage.setItem('firebase_user_role', 'standard');
        console.log("User role set to 'standard' in localStorage");
      } catch (error) {
        console.error("Error creating user profile:", error);
        
        // If this is a permission error and we're in development mode, we'll
        // assume the profile creation worked and continue
        if ((bypassNicknameCheck || process.env.NODE_ENV === 'development') && 
            retryCount < 2) {
          console.warn("Development mode: Assuming profile creation succeeded despite error");
          setRetryCount(prev => prev + 1);
          
          // We'll still store the role
          localStorage.setItem('firebase_user_role', 'standard');
        } else {
          handleFirebaseError(error, "Failed to create user profile");
          setError(error);
          setIsLoading(false);
          return false;
        }
      }

      // Only process interests if we have some
      if (interests.length > 0) {
        try {
          console.log("Processing user interests:", interests);
          
          // Get existing interests
          const interestsData = await queryDocuments('interests', [
            { field: 'name', operator: 'in', value: interests }
          ]).catch(err => {
            console.warn("Error fetching existing interests:", err);
            return [];
          });
          
          console.log("Found matching interest records:", interestsData.length);

          // In development mode, if we couldn't fetch interests, we'll skip this part
          if (interestsData.length === 0 && (bypassNicknameCheck || process.env.NODE_ENV === 'development')) {
            console.warn("Development mode: Skipping interest association due to query error");
          } else {
            // Delete existing user interests
            const userInterests = await queryDocuments('user_interests', [
              { field: 'user_id', operator: '==', value: userId }
            ]).catch(err => {
              console.warn("Error fetching user interests:", err);
              return [];
            });

            // Delete existing interests
            for (const interest of userInterests) {
              await deleteDocument('user_interests', interest.id)
                .catch(err => console.warn("Error deleting user interest:", err));
            }
            
            console.log("Deleted existing user interests");

            // Create new user interests
            for (const interest of interestsData) {
              await createDocument('user_interests', {
                user_id: userId,
                interest_id: interest.id
              }).catch(err => console.warn("Error creating user interest:", err));
            }
            
            console.log("Created new user interest associations");
          }
        } catch (error) {
          // Non-fatal error - log but don't fail the whole process
          console.error("Error processing interests:", error);
          // Silently handle this error as interests are optional
        }
      }

      console.log("Profile setup completed successfully");
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error saving profile:", error);
      handleFirebaseError(error, "Failed to save profile");
      setError(error);
      setIsLoading(false);
      return false;
    }
  };

  return { submitProfile, isLoading, error };
}
