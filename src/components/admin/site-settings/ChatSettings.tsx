
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const ChatSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    standard_photo_limit: 10
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Mock fetching settings
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSettings({
        standard_photo_limit: 10
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoLimitChange = (value: string) => {
    const limit = Math.max(1, parseInt(value) || 1);
    setSettings(prev => ({ ...prev, standard_photo_limit: limit }));
  };

  const handleSave = async () => {
    try {
      // Mock saving settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Chat settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 max-w-xl">
        <div className="grid gap-2">
          <Label htmlFor="photo-limit">Max Image Upload Count (Standard Users)</Label>
          <Input
            id="photo-limit"
            type="number"
            min="1"
            value={settings.standard_photo_limit}
            onChange={(e) => handlePhotoLimitChange(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={handleSave}>Save Chat Settings</Button>
    </div>
  );
};
