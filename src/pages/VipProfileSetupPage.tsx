
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDetectCountry } from "@/hooks/useDetectCountry";
import { ArrowRight } from "lucide-react";

const ageOptions = Array.from({ length: 63 }, (_, i) => 18 + i);

const VipProfileSetupPage = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { country, countryCode } = useDetectCountry();

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
      } else {
        // No profile - redirect to registration
        navigate('/vip/register');
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Validate file is image
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }
    
    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB");
      return;
    }
    
    setIsUploading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      if (data) {
        setAvatarUrl(data.publicUrl);
        
        // Update profile with avatar
        await supabase
          .from('profiles')
          .update({ avatar_url: data.publicUrl })
          .eq('id', currentUser.id);
          
        toast.success("Avatar updated successfully");
      }
    } catch (error: any) {
      toast.error(`Avatar upload failed: ${error.message || "Unknown error"}`);
      console.error("Avatar upload error:", error);
    } finally {
      setIsUploading(false);
    }
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
    
    setIsSubmitting(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          gender,
          age: parseInt(age),
          country: country || null
        })
        .eq('id', currentUser.id);
      
      if (profileError) throw profileError;
      
      toast.success("Profile updated successfully!");
      navigate('/chat');
    } catch (error: any) {
      toast.error(`Profile update failed: ${error.message || "Unknown error"}`);
      console.error("Profile update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If profile fields change, silently update
  const handleFieldChange = async (field: string, value: any) => {
    try {
      await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', currentUser.id);
        
      toast.success(`${field} updated successfully`);
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
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
            {/* Avatar Upload */}
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 mb-4">
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
                
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition cursor-pointer"
                >
                  <span className="text-white text-sm">Change</span>
                </label>
                
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarChange}
                  disabled={isUploading}
                />
              </div>
              
              {isUploading && <p className="text-sm text-gray-500">Uploading avatar...</p>}
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
                handleFieldChange('gender', value);
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
              <Select value={age} onValueChange={(value) => {
                setAge(value);
                handleFieldChange('age', parseInt(value));
              }}>
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
            
            {/* Country Display */}
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={country || ''}
                readOnly
                tabIndex={-1}
                className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
              />
            </div>
            
            <Button 
              onClick={handleSubmitProfile}
              className="w-full bg-chatwii-peach hover:bg-chatwii-orange flex items-center justify-center gap-2"
              disabled={isSubmitting || !gender || !age}
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

export default VipProfileSetupPage;
