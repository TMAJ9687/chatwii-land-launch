
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";

interface ProfileSetupFormProps {
  nickname: string;
}

const ageOptions = Array.from({ length: 63 }, (_, i) => i + 18);
const interests = [
  "Music", "Sports", "Gaming", "Travel", "Movies",
  "Food", "Technology", "Art", "Books", "Fashion"
];

export const ProfileSetupForm = ({ nickname }: ProfileSetupFormProps) => {
  const navigate = useNavigate();
  const [gender, setGender] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await fetch("https://api.ipapi.com/api/check?access_key=YOUR_API_KEY");
        const data = await response.json();
        setCountry(data.country_name || "Unknown");
      } catch (error) {
        console.error("Error detecting country:", error);
        setCountry("Unknown");
      }
    };

    detectCountry();
  }, []);

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

  const handleSubmit = async () => {
    if (!gender) {
      toast({
        title: "Error",
        description: "Please select your gender",
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
        .insert({
          id: user.id,
          nickname,
          gender,
          age: age ? parseInt(age) : null,
          country,
        });

      if (profileError) throw profileError;

      // Insert user interests
      if (selectedInterests.length > 0) {
        const { data: interestsData } = await supabase
          .from("interests")
          .select("id, name")
          .in("name", selectedInterests);

        if (interestsData) {
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
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nickname
        </label>
        <input
          type="text"
          value={nickname}
          disabled
          className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 rounded-md"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Gender
        </label>
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
          </SelectContent>
        </Select>
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

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Country
        </label>
        <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 rounded-md">
          <Flag className="h-4 w-4" />
          <span>{country || "Detecting..."}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Interests (Select up to 2)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {interests.map(interest => (
            <div key={interest} className="flex items-center space-x-2">
              <Checkbox
                id={interest}
                checked={selectedInterests.includes(interest)}
                onCheckedChange={() => handleInterestChange(interest)}
                disabled={!selectedInterests.includes(interest) && selectedInterests.length >= 2}
              />
              <label
                htmlFor={interest}
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                {interest}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={!gender || isLoading}
      >
        {isLoading ? "Saving..." : "Continue to Chat"}
      </Button>
    </div>
  );
};
