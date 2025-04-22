
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
      const { data, error } = await supabase
        .from('site_settings')
        .select('settings')
        .eq('id', 1)
        .single();

      if (error) throw error;

      if (data?.settings) {
        setSettings({
          standard_photo_limit: data.settings.standard_photo_limit || 10
        });
      }
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
      const { data: existingData } = await supabase
        .from('site_settings')
        .select('settings')
        .eq('id', 1)
        .single();

      const newSettings = {
        ...(existingData?.settings || {}),
        standard_photo_limit: settings.standard_photo_limit
      };

      const { error } = await supabase
        .from('site_settings')
        .upsert({ id: 1, settings: newSettings });

      if (error) throw error;

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
