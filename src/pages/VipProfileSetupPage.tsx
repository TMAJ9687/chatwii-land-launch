import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDetectCountry } from "@/hooks/useDetectCountry";
import { ArrowRight, Check } from "lucide-react";
import { COUNTRIES } from "@/constants/countries";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ageOptions = Array.from({ length: 63 }, (_, i) => 18 + i);
const INTERESTS = [
  "Music", "Sports", "Gaming", "Travel", "Movies",
  "Food", "Technology", "Art", "Books", "Fashion",
  "Photography", "Nature", "Fitness", "Cooking", "Dancing"
];

const VipProfileSetupPage = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [vipAvatars, setVipAvatars] = useState<string[]>([]);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const { country: detectedCountry, countryCode } = useDetectCountry();
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  
  const filteredCountries = countrySearchQuery 
    ? COUNTRIES.filter(c => c.toLowerCase().includes(countrySearchQuery.toLowerCase()))
    : COUNTRIES;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/vip/login');
        return;
      }
      setCurrentUser(session.user);
      
      // Check if profile already exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        // If profile exists, populate fields
        setNickname(profile.nickname || '');
        setGender(profile.gender || '');
        setAge(profile.age?.toString() || '');
        setAvatarUrl(profile.avatar_url || '');
        setSelectedCountry(profile.country || detectedCountry || '');
        
        // Fetch user interests
        const { data: userInterests } = await supabase
          .from('user_interests')
          .select('interests(name)')
          .eq('user_id', session.user.id);
        
        if (userInterests && userInterests.length > 0) {
          const interests = userInterests.map((i: any) => i.interests?.name).filter(Boolean);
          setSelectedInterests(interests);
        }
      } else {
        // No profile - redirect to registration
        navigate('/vip/register');
      }
    };
    
    // Initialize country from detected country
    if (detectedCountry && !selectedCountry) {
      setSelectedCountry(detectedCountry);
    }
    
    checkAuth();
  }, [navigate, detectedCountry, selectedCountry]);
  
  // Load avatars when gender changes
  useEffect(() => {
    if (gender) {
      loadVipAvatars(gender);
    }
  }, [gender]);
  
  const loadVipAvatars = async (gender: string) => {
    // Default to male avatars if gender is not specified
    const genderKey = gender?.toLowerCase() === 'female' ? 'vip_female' : 'vip_male';
    
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("settings")
        .eq("id", 1)
        .single();
        
      if (data?.settings) {
        // Check if settings is a string (it should be an object)
        const settingsData = typeof data.settings === 'string' 
          ? JSON.parse(data.settings) 
          : data.settings;
        
        // Now check for avatars property in the parsed settings
        if (settingsData && 
            settingsData.avatars && 
            Array.isArray(settingsData.avatars[genderKey])) {
          setVipAvatars(settingsData.avatars[genderKey]);
        } else {
          // If no avatars found or not in expected format, set empty array
          console.log('No avatar data found in expected format:', settingsData);
          setVipAvatars([]);
        }
      } else {
        // If no settings data found at all, set empty array
        console.log('No settings data found');
        setVipAvatars([]);
      }
    } catch (error) {
      console.error('Error loading avatars:', error);
      setVipAvatars([]);
    }
  };

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => {
      // If already selected, remove it
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      }
      
      // If not selected and less than 3 interests, add it
      if (prev.length < 3) {
        return [...prev, interest];
      }
      
      // Otherwise, keep the same
      return prev;
    });
  };

  const handleAvatarSelect = (url: string) => {
    setAvatarUrl(url);
    setAvatarDialogOpen(false);
  };

  const handleSubmitProfile = async () => {
    if (!gender) {
      toast.error("Please select your gender");
      return;
    }
    
    if (!age) {
      toast.error("Please select your age");
      return;
    }
    
    if (!avatarUrl) {
      toast.error("Please select an avatar");
      return;
    }
    
    if (!selectedCountry) {
      toast.error("Please select your country");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Update profile with all information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          gender,
          age: parseInt(age),
          country: selectedCountry,
          avatar_url: avatarUrl
        })
        .eq('id', currentUser.id);
      
      if (profileError) throw profileError;
      
      // Update user interests
      if (selectedInterests.length > 0) {
        // First, delete existing interests
        await supabase
          .from('user_interests')
          .delete()
          .eq('user_id', currentUser.id);
        
        // Then insert new interests
        for (const interest of selectedInterests) {
          // Get or create interest
          let interestId;
          
          // Check if interest exists
          const { data: existingInterest } = await supabase
            .from('interests')
            .select('id')
            .eq('name', interest)
            .maybeSingle();
            
          if (existingInterest) {
            interestId = existingInterest.id;
          } else {
            // Create new interest
            const { data: newInterest } = await supabase
              .from('interests')
              .insert({ name: interest })
              .select('id')
              .single();
              
            if (newInterest) {
              interestId = newInterest.id;
            }
          }
          
          if (interestId) {
            // Insert user interest
            await supabase
              .from('user_interests')
              .insert({
                user_id: currentUser.id,
                interest_id: interestId
              });
          }
        }
      }
      
      toast.success("Profile updated successfully!");
      navigate('/chat');
    } catch (error: any) {
      toast.error(`Profile update failed: ${error.message || "Unknown error"}`);
      console.error("Profile update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Setup Your <span className="text-chatwii-peach">VIP Profile</span>
          </h1>
          
          <div className="space-y-6">
            {/* Avatar Selection */}
            <div className="flex flex-col items-center">
              <Label className="mb-2 text-center">Select Your Avatar</Label>
              <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="p-0 h-24 w-24 rounded-full overflow-hidden">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt="User avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <span className="text-3xl text-gray-400">{nickname?.charAt(0)?.toUpperCase() || '?'}</span>
                      </div>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Choose Your VIP Avatar</DialogTitle>
                  </DialogHeader>
                  {vipAvatars.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4 py-4">
                      {vipAvatars.map((url, index) => (
                        <Card 
                          key={index} 
                          className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                            avatarUrl === url ? 'ring-2 ring-chatwii-orange' : ''
                          }`}
                          onClick={() => handleAvatarSelect(url)}
                        >
                          <CardContent className="p-3 flex items-center justify-center">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={url} alt={`Avatar option ${index + 1}`} />
                              <AvatarFallback>VIP</AvatarFallback>
                            </Avatar>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-gray-500">
                      {gender ? 
                        "No VIP avatars available for your gender. Please contact support." :
                        "Please select your gender first to see available avatars."
                      }
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Nickname Display (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                value={nickname}
                readOnly
                tabIndex={-1}
                className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">Nickname cannot be changed after registration</p>
            </div>
            
            {/* Gender Selection */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={(value) => {
                setGender(value);
                // Reset avatar when gender changes
                setAvatarUrl('');
                loadVipAvatars(value);
              }}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Age Selection */}
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Select value={age} onValueChange={setAge}>
                <SelectTrigger id="age">
                  <SelectValue placeholder="Select your age" />
                </SelectTrigger>
                <SelectContent>
                  {ageOptions.map(age => (
                    <SelectItem key={age} value={age.toString()}>{age}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Country Selection */}
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger id="country" className="w-full">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  <div className="py-2 px-3 sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <Input
                      placeholder="Search countries..."
                      value={countrySearchQuery}
                      onChange={(e) => setCountrySearchQuery(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  {filteredCountries.map(country => {
                    // Get country code for flag
                    const code = getCountryCode(country);
                    const flagUrl = code ? `https://flagcdn.com/24x18/${code.toLowerCase()}.png` : '';
                    
                    return (
                      <SelectItem key={country} value={country} className="flex items-center">
                        <div className="flex items-center gap-2">
                          {flagUrl && (
                            <img 
                              src={flagUrl} 
                              alt={`${country} flag`}
                              className="w-5 h-auto inline-block mr-2"
                              style={{ verticalAlign: 'middle' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          {country}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedCountry && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                  {(() => {
                    const code = getCountryCode(selectedCountry);
                    const flagUrl = code ? `https://flagcdn.com/24x18/${code.toLowerCase()}.png` : '';
                    
                    return (
                      <>
                        {flagUrl && (
                          <img 
                            src={flagUrl} 
                            alt={`${selectedCountry} flag`}
                            className="w-5 h-auto"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span>{selectedCountry}</span>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            
            {/* Interests Selection */}
            <div className="space-y-2">
              <Label>Interests (Select up to 3)</Label>
              <div className="grid grid-cols-3 gap-2">
                {INTERESTS.map(interest => (
                  <Button
                    key={interest}
                    type="button"
                    variant={selectedInterests.includes(interest) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleInterestToggle(interest)}
                    className={`flex items-center justify-center ${
                      selectedInterests.includes(interest) 
                        ? 'bg-chatwii-orange text-white hover:bg-chatwii-peach' 
                        : ''
                    }`}
                    disabled={!selectedInterests.includes(interest) && selectedInterests.length >= 3}
                  >
                    {selectedInterests.includes(interest) && (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    {interest}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Selected: {selectedInterests.length}/3
              </p>
            </div>
            
            <Button 
              onClick={handleSubmitProfile}
              className="w-full bg-chatwii-peach hover:bg-chatwii-orange flex items-center justify-center gap-2"
              disabled={isSubmitting || !gender || !age || !avatarUrl || !selectedCountry}
            >
              {isSubmitting ? "Saving..." : "Go to Chat"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get country codes for flags
const getCountryCode = (country: string): string | null => {
  const countryMappings: Record<string, string> = {
    'United States': 'us',
    'United Kingdom': 'gb',
    'Afghanistan': 'af',
    'Albania': 'al',
    'Algeria': 'dz',
    'Andorra': 'ad',
    'Angola': 'ao',
    'Argentina': 'ar',
    'Armenia': 'am',
    'Australia': 'au',
    'Austria': 'at',
    'Azerbaijan': 'az',
    // Add more mappings as needed
  };
  
  // Try to get from mapping
  if (countryMappings[country]) {
    return countryMappings[country];
  }
  
  // Default: convert to lowercase and take first two chars
  // This is a simplistic approach and won't work for all countries
  return country.toLowerCase().substring(0, 2);
};

export default VipProfileSetupPage;
