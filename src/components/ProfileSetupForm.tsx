
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { NicknameSection } from "@/components/profile/NicknameSection";
import { GenderSelector } from "@/components/profile/GenderSelector";
import { AgeSelector } from "@/components/profile/AgeSelector";
import { CountryDisplay } from "@/components/profile/CountryDisplay";
import { InterestsSelector } from "@/components/profile/InterestsSelector";
import { useDetectCountry } from "@/hooks/useDetectCountry";
import { useProfanityList } from "@/hooks/useProfanityList";
import { useProfileSubmission } from "@/hooks/useProfileSubmission";
import { FirebaseIndexMessage } from "@/components/chat/FirebaseIndexMessage";
import { isFirebasePermissionError } from "@/utils/firebaseErrorHandling";

interface ProfileSetupFormProps {
  nickname: string;
}

export const ProfileSetupForm = ({ nickname: initialNickname }: ProfileSetupFormProps) => {
  const navigate = useNavigate();
  const [gender, setGender] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const { country, countryCode } = useDetectCountry();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(true); // Open by default to make interests selection more visible
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const { profanityList } = useProfanityList('nickname');
  const { submitProfile, isLoading, error: submissionError } = useProfileSubmission();

  const nickname = initialNickname;
  
  // Debug log to check if component is receiving the correct nickname
  useEffect(() => {
    console.log("ProfileSetupForm initialized with nickname:", nickname);
  }, [nickname]);

  // Form validation - ONLY gender and age are required, interests are optional
  const isValid = !!gender && !!age;

  // Check if there's a permission error
  useEffect(() => {
    if (submissionError && isFirebasePermissionError(submissionError)) {
      setPermissionError("Firebase permission error. Admin has been notified.");
      console.error("Firebase permission error in ProfileSetupForm:", submissionError);
    } else {
      setPermissionError(null);
    }
  }, [submissionError]);

  const handleInterestChange = (interest: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      }
      if (prev.length < 2) {
        return [...prev, interest];
      }
      return prev;
    });
  };

  const handleBack = () => {
    navigate("/");
  };

  const handleSubmit = async () => {
    if (!nickname) {
      toast.error("Nickname is missing. Please go back and enter a nickname.");
      return;
    }
    
    if (!gender) {
      toast.error("Please select your gender.");
      return;
    }
    
    if (!age) {
      toast.error("Please select your age.");
      return;
    }
    
    console.log("Submitting profile with data:", {
      nickname,
      gender,
      age,
      country,
      interests: selectedInterests,
    });
    
    try {
      // Use process.env.NODE_ENV to bypass nickname availability in dev mode
      const bypassNicknameCheck = process.env.NODE_ENV === 'development';
      
      const success = await submitProfile({
        nickname,
        gender,
        age,
        country,
        interests: selectedInterests,
        bypassNicknameCheck
      });
      
      console.log("Profile submission result:", success);
      
      if (success) {
        toast.success("Profile created successfully!");
        navigate("/chat");
      }
    } catch (error) {
      console.error("Error during profile submission:", error);
      // This will be handled by the useProfileSubmission hook
    }
  };

  // Helper function to provide better field-specific guidance
  const getButtonLabel = (): string => {
    if (isLoading) return "Saving...";
    if (!gender) return "Select Gender (Required)";
    if (!age) return "Select Age (Required)";
    return "Continue to Chat";
  };

  return (
    <div className="space-y-6">
      <Button 
        variant="ghost"
        className="flex items-center gap-2 mb-4 hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={handleBack}
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>

      <NicknameSection nickname={nickname} error={""} />

      <div className="space-y-1">
        <GenderSelector gender={gender} onChange={setGender} />
        <p className="text-xs text-gray-500 ml-1">Required</p>
      </div>

      <div className="space-y-1">
        <AgeSelector age={age} onChange={setAge} />
        <p className="text-xs text-gray-500 ml-1">Required</p>
      </div>

      {permissionError && (
        <FirebaseIndexMessage 
          error={permissionError}
          indexUrl="https://console.firebase.google.com/project/_/database/firestore/rules"
        />
      )}

      <Button
        className={`w-full ${
          isValid 
            ? 'bg-[#F97316] hover:bg-orange-600 text-white' 
            : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
        }`}
        onClick={handleSubmit}
        disabled={isLoading || !isValid}
      >
        {getButtonLabel()}
      </Button>

      <CountryDisplay country={country} countryCode={countryCode} />

      <InterestsSelector
        selectedInterests={selectedInterests}
        onChange={handleInterestChange}
        isOpen={isOpen}
        onToggle={setIsOpen}
      />
    </div>
  );
};
