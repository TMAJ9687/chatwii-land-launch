
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
import { Link } from 'react-router-dom';

// Predefined avatar URLs
const AVATAR_OPTIONS = [
  '/avatars/avatar1.png',
  '/avatars/avatar2.png',
  '/avatars/avatar3.png',
  '/avatars/avatar4.png',
  '/avatars/avatar5.png',
  '/avatars/avatar6.png',
];

// Predefined theme options
const THEME_OPTIONS = [
  { id: 'default', name: 'Default', className: 'bg-white dark:bg-gray-800 border-gray-200' },
  { id: 'gold', name: 'Gold Border', className: 'bg-white dark:bg-gray-800 border-yellow-500' },
  { id: 'blue', name: 'Blue Glow', className: 'bg-white dark:bg-gray-800 border-blue-400 shadow-blue-300 shadow-sm' },
  { id: 'purple', name: 'Purple Accent', className: 'bg-white dark:bg-gray-800 border-purple-500' },
  { id: 'green', name: 'Green Accent', className: 'bg-white dark:bg-gray-800 border-green-500' },
];

// Country options
const COUNTRY_OPTIONS = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Japan',
  'China',
  'Brazil',
  'India',
  'Russia',
  'Mexico',
  'South Korea',
];

const VipSettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    avatar_url: '',
    profile_theme: 'default',
    visibility: 'online',
    country: '',
  });
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/vip/login');
        return;
      }
      
      // Fetch user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
        navigate('/chat');
        return;
      }
      
      // Check if user is a VIP
      if (!profile.vip_status) {
        toast.error('This page is for VIP users only');
        navigate('/chat');
        return;
      }
      
      // Set profile data
      setProfileData({
        avatar_url: profile.avatar_url || '',
        profile_theme: profile.profile_theme || 'default',
        visibility: profile.visibility || 'online',
        country: profile.country || '',
      });
      
      setLoading(false);
    };
    
    checkAuth();
  }, [navigate]);
  
  const handleSave = async () => {
    setSaving(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/vip/login');
      return;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({
        avatar_url: profileData.avatar_url,
        profile_theme: profileData.profile_theme,
        visibility: profileData.visibility,
        country: profileData.country,
      })
      .eq('id', session.user.id);
    
    if (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to save settings');
      setSaving(false);
      return;
    }
    
    toast.success('Settings saved successfully');
    setSaving(false);
  };
  
  const handleVisibilityChange = (checked: boolean) => {
    setProfileData(prev => ({
      ...prev,
      visibility: checked ? 'online' : 'invisible',
    }));
  };
  
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
                {AVATAR_OPTIONS.map((url, index) => (
                  <div 
                    key={index}
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
                    onClick={() => setProfileData(prev => ({ ...prev, profile_theme: theme.id }))}
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
