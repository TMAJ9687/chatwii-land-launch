
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
  
  const { profanityList } = useProfanityList('nickname');
  const { submitProfile, isLoading } = useProfileSubmission();

  const nickname = initialNickname;

  // Form validation - gender and age are required but interests are optional
  const isValid = !!gender && !!age;

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

  const handleSubmit = () => {
    if (!gender) {
      toast.error("Please select your gender.");
      return;
    }
    
    if (!age) {
      toast.error("Please select your age.");
      return;
    }
    
    submitProfile({
      nickname,
      gender,
      age,
      country,
      interests: selectedInterests,
    });
  };

  // Helper function to provide better field-specific guidance
  const getButtonLabel = (): string => {
    if (isLoading) return "Saving...";
    if (!gender) return "Select Gender";
    if (!age) return "Select Age";
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

      <GenderSelector gender={gender} onChange={setGender} />

      <AgeSelector age={age} onChange={setAge} />

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
