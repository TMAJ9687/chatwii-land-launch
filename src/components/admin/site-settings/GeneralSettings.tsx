
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const GeneralSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    adsense_links: ["", "", ""],
    maintenance_mode: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Mock fetching settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSettings({
        adsense_links: ["", "", ""],
        maintenance_mode: false
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdsenseLinkChange = (index: number, value: string) => {
    const newLinks = [...settings.adsense_links];
    newLinks[index] = value;
    setSettings(prev => ({ ...prev, adsense_links: newLinks }));
  };

  const handleMaintenanceModeChange = (checked: boolean) => {
    setSettings(prev => ({ ...prev, maintenance_mode: checked }));
  };

  const handleSave = async () => {
    try {
      // Mock saving settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('General settings saved successfully');
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
        {settings.adsense_links.map((link, index) => (
          <div key={index} className="grid gap-2">
            <Label htmlFor={`adsense-${index}`}>AdSense Link {index + 1}</Label>
            <Input
              id={`adsense-${index}`}
              value={link}
              onChange={(e) => handleAdsenseLinkChange(index, e.target.value)}
              placeholder={`Enter AdSense link ${index + 1}`}
            />
          </div>
        ))}
        
        <div className="flex items-center gap-2">
          <Switch
            id="maintenance-mode"
            checked={settings.maintenance_mode}
            onCheckedChange={handleMaintenanceModeChange}
          />
          <Label htmlFor="maintenance-mode">Enable Maintenance Mode</Label>
        </div>
      </div>

      <Button onClick={handleSave}>Save General Settings</Button>
    </div>
  );
};
