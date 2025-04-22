
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Save } from 'lucide-react';
import { useVipSettings } from '@/hooks/useVipSettings';
import { THEME_OPTIONS, COUNTRY_OPTIONS } from '@/constants/vipSettings';
import { ProfileTheme } from '@/types/profile';
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SettingsAvatars {
  vip_male: string[];
  vip_female: string[];
  standard_male: string | null;
  standard_female: string | null;
}

// Utility function to ensure avatars object always has required structure
const getCleanAvatars = (avatars: any): SettingsAvatars => ({
  vip_male: Array.isArray(avatars?.vip_male) ? avatars.vip_male : [],
  vip_female: Array.isArray(avatars?.vip_female) ? avatars.vip_female : [],
  standard_male: typeof avatars?.standard_male === "string" ? avatars.standard_male : null,
  standard_female: typeof avatars?.standard_female === "string" ? avatars.standard_female : null,
});

const getSiteAvatars = async (gender: string): Promise<string[]> => {
  const { data } = await supabase.from("site_settings").select("settings").eq("id", 1).maybeSingle();

  let avatars: SettingsAvatars = {
    vip_male: [],
    vip_female: [],
    standard_male: null,
    standard_female: null,
  };

  if (data?.settings) {
    // settings might be a string or object due to database possible types
    let parsedSettings: any = data.settings;
    if (typeof parsedSettings === "string") {
      try {
        parsedSettings = JSON.parse(parsedSettings);
      } catch {
        // fallback to default avatars structure
      }
    }
    if (parsedSettings.avatars) {
      avatars = getCleanAvatars(parsedSettings.avatars);
    }
  }

  if (gender === "female") return avatars.vip_female || [];
  return avatars.vip_male || [];
};

const VipSettingsPage = () => {
  const {
    profileData,
    setProfileData,
    loading,
    saving,
    handleSave,
    handleVisibilityChange
  } = useVipSettings();
  const [allowedAvatars, setAllowedAvatars] = useState<string[]>([]);

  useEffect(() => {
    if (!loading) {
      // Default to male/female, fallback to male for unknown
      const gender = profileData.gender?.toLowerCase() === "female" ? "female" : "male";
      getSiteAvatars(gender).then(setAllowedAvatars);
    }
  }, [loading, profileData.gender]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center">
          <Link to="/chat" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">VIP Profile Settings</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Avatar Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Avatar</CardTitle>
              <CardDescription>Select your profile picture</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Current Avatar:</p>
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24 border-2 border-primary">
                    {profileData.avatar_url ? (
                      <AvatarImage src={profileData.avatar_url} alt="Profile avatar" />
                    ) : (
                      <AvatarFallback>VIP</AvatarFallback>
                    )}
                  </Avatar>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {allowedAvatars.length === 0 && (
                  <div className="col-span-3 text-xs text-muted-foreground">No avatars found (contact admin)</div>
                )}
                {allowedAvatars.map((url, index) => (
                  <div 
                    key={url}
                    className={`cursor-pointer rounded-md p-2 border-2 ${profileData.avatar_url === url ? 'border-primary' : 'border-transparent'}`}
                    onClick={() => setProfileData(prev => ({ ...prev, avatar_url: url }))}
                  >
                    <Avatar className="h-16 w-16 mx-auto">
                      <AvatarImage src={url} alt={`Avatar option ${index + 1}`} />
                      <AvatarFallback>{index + 1}</AvatarFallback>
                    </Avatar>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {/* Theme Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Theme</CardTitle>
              <CardDescription>Choose how your profile appears to others</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {THEME_OPTIONS.map((theme) => (
                  <div
                    key={theme.id}
                    className={`p-4 rounded-md border-2 cursor-pointer ${theme.className} ${
                      profileData.profile_theme === theme.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setProfileData(prev => ({ 
                      ...prev, 
                      profile_theme: theme.id as ProfileTheme 
                    }))}
                  >
                    <p className="font-medium">{theme.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Visibility & Country */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Additional Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Visibility Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="visibility" className="text-base">Visibility</Label>
                  <p className="text-sm text-muted-foreground">Toggle whether you appear in the user list</p>
                </div>
                <Switch
                  id="visibility"
                  checked={profileData.visibility === 'online'}
                  onCheckedChange={handleVisibilityChange}
                />
              </div>
              
              {/* Country Selection */}
              <div className="space-y-2">
                <Label htmlFor="country" className="text-base">Country</Label>
                <Select 
                  value={profileData.country} 
                  onValueChange={(value) => setProfileData(prev => ({ ...prev, country: value }))}
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                onClick={handleSave} 
                disabled={saving} 
                className="ml-auto"
              >
                {saving ? 'Saving...' : 'Save Settings'}
                {!saving && <Save className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VipSettingsPage;

