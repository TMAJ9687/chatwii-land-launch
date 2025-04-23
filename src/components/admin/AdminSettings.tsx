
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useImageUpload } from "@/hooks/useImageUpload";

export const AdminSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<{ nickname: string; avatar_url: string | null } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const { handleFileSelect, selectedFile, previewUrl, uploadImage, clearFileSelection, isUploading } = useImageUpload(userId);
  
  // Track component mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);
  
  // Fetch admin profile data
  useEffect(() => {
    // Cancel any previous requests
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    const fetchProfile = async () => {
      try {
        // Check if we have a user first
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        if (isMountedRef.current) {
          setUserId(user.id);
        }
        
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('nickname, avatar_url')
          .eq('id', user.id)
          .abortSignal(signal)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
          console.error("Error fetching profile:", error);
          toast({
            title: "Error",
            description: "Failed to load admin profile",
            variant: "destructive",
          });
          return;
        }
        
        if (isMountedRef.current && profileData) {
          setProfile(profileData);
          setNickname(profileData.nickname || '');
        }
      } catch (error) {
        if (!signal.aborted && isMountedRef.current) {
          console.error("Error:", error);
          toast({
            title: "Error",
            description: "An unexpected error occurred",
            variant: "destructive",
          });
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    
    fetchProfile();
    
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);
  
  // Save avatar changes
  const handleSaveAvatar = async () => {
    if (!selectedFile || !userId) return;
    
    try {
      const imageUrl = await uploadImage();
      
      if (imageUrl) {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: imageUrl })
          .eq('id', userId);
          
        if (error) {
          throw error;
        }
        
        setProfile(prev => prev ? { ...prev, avatar_url: imageUrl } : null);
        clearFileSelection();
        
        toast({
          title: "Success",
          description: "Avatar updated successfully",
        });
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast({
        title: "Error",
        description: "Failed to update avatar",
        variant: "destructive",
      });
    }
  };
  
  // Save display name changes
  const handleSaveDisplayName = async () => {
    if (!nickname.trim() || !userId) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nickname })
        .eq('id', userId);
        
      if (error) {
        throw error;
      }
      
      setProfile(prev => prev ? { ...prev, nickname } : null);
      
      toast({
        title: "Success",
        description: "Display name updated successfully",
      });
    } catch (error) {
      console.error("Error updating display name:", error);
      toast({
        title: "Error",
        description: "Failed to update display name",
        variant: "destructive",
      });
    }
  };
  
  // Change password
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        throw error;
      }
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update password",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }
  
  // Show create profile form if no profile exists
  if (!profile) {
    return (
      <div className="p-6 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Create Admin Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="newDisplayName">Admin Display Name</Label>
                <Input
                  id="newDisplayName"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your display name"
                />
              </div>
              <Button 
                onClick={handleSaveDisplayName}
                disabled={!nickname.trim()}
              >
                Create Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Admin Settings</h2>
        <p className="text-muted-foreground">Manage your admin profile settings</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              {previewUrl ? (
                <AvatarImage src={previewUrl} alt="Preview" />
              ) : (
                <AvatarImage src={profile?.avatar_url || ""} alt="Admin" />
              )}
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Input type="file" accept="image/*" onChange={handleFileSelect} />
              <Button 
                onClick={handleSaveAvatar} 
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? "Uploading..." : "Save Avatar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Display Name</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="displayName">Admin Display Name (for chat)</Label>
            <Input
              id="displayName"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter display name"
            />
          </div>
          <Button onClick={handleSaveDisplayName} disabled={!nickname.trim()}>
            Save Display Name
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          <Button 
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword || !confirmPassword}
          >
            Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
