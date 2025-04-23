
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
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
  const [nickname] = useState(initialNickname);
  const [gender, setGender] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const { country, countryCode } = useDetectCountry();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [nickNameError] = useState("");
  const { profanityList } = useProfanityList('nickname');
  const { submitProfile, isLoading } = useProfileSubmission();

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
    navigate('/');
  };

  const handleSubmit = () => {
    submitProfile({
      nickname,
      gender,
      age,
      country,
      interests: selectedInterests
    });
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

      <NicknameSection 
        nickname={nickname} 
        error={nickNameError} 
      />

      <GenderSelector 
        gender={gender} 
        onChange={setGender}
      />

      <AgeSelector 
        age={age} 
        onChange={setAge}
      />

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={!gender || !age || isLoading}
      >
        {isLoading ? "Saving..." : "Continue to Chat"}
      </Button>

      <CountryDisplay 
        country={country}
        countryCode={countryCode}
      />

      <InterestsSelector
        selectedInterests={selectedInterests}
        onChange={handleInterestChange}
        isOpen={isOpen}
        onToggle={setIsOpen}
      />
    </div>
  );
};
