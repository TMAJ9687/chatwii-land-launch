import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Flag, ChevronLeft, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getCountryNameFromCode, getFlagUrl } from "@/utils/countryTools";

interface ProfileSetupFormProps {
  nickname: string;
}

const ageOptions = Array.from({ length: 63 }, (_, i) => i + 18);
const interests = [
  "Music", "Sports", "Gaming", "Travel", "Movies",
  "Food", "Technology", "Art", "Books", "Fashion"
];

let profanityList: string[] = [];

const validateNickname = (nickname: string) => {
  // Max 16 characters
  if (nickname.length > 16) {
    return { valid: false, message: "Nickname must be 16 characters or less" };
  }

  // Max 2 numbers
  const numberCount = (nickname.match(/\d/g) || []).length;
  if (numberCount > 2) {
    return { valid: false, message: "Nickname can contain at most 2 numbers" };
  }

  // Max 3 consecutive same letters
  if (/(.)\1{3,}/.test(nickname)) {
    return { valid: false, message: "Nickname cannot contain more than 3 consecutive same letters" };
  }

  // Check against profanity list (dynamically loaded)
  for (const word of profanityList) {
    if (nickname.toLowerCase().includes(word)) {
      return { valid: false, message: "Nickname contains inappropriate language" };
    }
  }

  return { valid: true, message: "" };
};

export const ProfileSetupForm = ({ nickname: initialNickname }: ProfileSetupFormProps) => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(initialNickname);
  const [gender, setGender] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [nickNameError, setNickNameError] = useState("");

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await fetch("https://country.is");
        const data = await response.json();
        if (data && data.country) {
          setCountryCode(data.country.toUpperCase());
          setCountry(getCountryNameFromCode(data.country));
        } else {
          setCountry("Unknown");
          setCountryCode("");
        }
      } catch (error) {
        console.error("Error detecting country:", error);
        setCountry("Unknown");
        setCountryCode("");
      }
    };

    detectCountry();
  }, []);

  useEffect(() => {
    const fetchProfanity = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("settings")
          .eq("id", 1)
          .maybeSingle();
        let arr: string[] = [];
        if (data?.settings && typeof data.settings === "object" && !Array.isArray(data.settings)) {
          arr = Array.isArray(data.settings.profanity_nickname)
            ? data.settings.profanity_nickname.map(String)
            : [];
        }
        profanityList = arr;
      } catch (e) {
        profanityList = [];
      }
    };
    fetchProfanity();
  }, []);

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {};

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

  const handleSubmit = async () => {
    if (!gender) {
      toast({
        title: "Error",
        description: "Please select your gender",
        variant: "destructive",
      });
      return;
    }
    if (!age) {
      toast({
        title: "Error",
        description: "Please select your age",
        variant: "destructive",
      });
      return;
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
        } else {
          toast({
            title: "Error",
            description: "Failed to save profile. Please try again.",
            variant: "destructive",
          });
        }
        setIsLoading(false);
        return;
      }

      if (selectedInterests.length > 0) {
        const { data: interestsData } = await supabase
          .from("interests")
          .select("id, name")
          .in("name", selectedInterests);

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
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nickname
        </label>
        <input
          type="text"
          value={nickname}
          readOnly
          tabIndex={-1}
          className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-md text-gray-400 cursor-not-allowed"
        />
        {nickNameError && (
          <p className="text-sm text-red-500">{nickNameError}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Gender
        </label>
        <div className="flex gap-4">
          <Button
            variant={gender === 'Male' ? 'default' : 'outline'}
            onClick={() => setGender('Male')}
            className="flex-1"
          >
            Male
          </Button>
          <Button
            variant={gender === 'Female' ? 'default' : 'outline'}
            onClick={() => setGender('Female')}
            className="flex-1"
          >
            Female
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Age
        </label>
        <Select value={age} onValueChange={setAge}>
          <SelectTrigger>
            <SelectValue placeholder="Select age" />
          </SelectTrigger>
          <SelectContent>
            {ageOptions.map(age => (
              <SelectItem key={age} value={age.toString()}>
                {age}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={!gender || !age || isLoading}
      >
        {isLoading ? "Saving..." : "Continue to Chat"}
      </Button>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Country
        </label>
        <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 rounded-md min-h-[36px]">
          {countryCode && (
            <img
              src={getFlagUrl(countryCode)}
              alt={`${country} flag`}
              className="w-5 h-4 rounded mr-2"
              style={{ background: "#E5E7EB", objectFit: "cover" }}
            />
          )}
          <span>{country || "Detecting..."}</span>
        </div>
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Interests (Select up to 2)
          </label>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {interests.map(interest => (
              <Button
                key={interest}
                variant={selectedInterests.includes(interest) ? 'default' : 'outline'}
                onClick={() => handleInterestChange(interest)}
                disabled={!selectedInterests.includes(interest) && selectedInterests.length >= 2}
                className="w-full"
              >
                {interest}
              </Button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
