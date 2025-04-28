
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useImageUpload } from "@/hooks/useImageUpload";

export const AdminSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<{ nickname: string; avatar_url: string | null } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Track component mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize the image upload hook only after userId is set
  const { handleFileSelect, selectedFile, previewUrl, uploadImage, clearFileSelection, isUploading } 
    = useImageUpload(userId || '');

  // Mock fetch admin profile data
  useEffect(() => {
    setTimeout(() => {
      if (isMountedRef.current) {
        const mockProfile = {
          nickname: 'Admin',
          avatar_url: null
        };
        setUserId('admin-user-id');
        setProfile(mockProfile);
        setNickname(mockProfile.nickname);
        setIsLoading(false);
      }
    }, 1000);
  }, []);

  // Save avatar changes
  const handleSaveAvatar = async () => {
    if (!selectedFile || !userId) return;
    
    try {
      const imageUrl = await uploadImage();
      
      if (imageUrl) {
        // Mock update profile
        setProfile(prev => prev ? { ...prev, avatar_url: imageUrl } : null);
        clearFileSelection();
        toast("Avatar updated successfully");
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast("Failed to update avatar");
    }
  };

  // Save display name changes
  const handleSaveDisplayName = async () => {
    if (!nickname.trim() || !userId) return;
    
    try {
      // Mock check nickname availability
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock update profile
      setProfile(prev => prev ? { ...prev, nickname } : null);
      toast("Display name updated successfully");
    } catch (error) {
      console.error("Error updating display name:", error);
      toast("Failed to update display name");
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast("Passwords do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      toast("Password must be at least 6 characters long");
      return;
    }
    
    try {
      // Mock password update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast("Password updated successfully");
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast(error?.message || "Failed to update password");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

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
