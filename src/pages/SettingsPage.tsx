
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const SettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        
        <div className="bg-card p-6 rounded-lg shadow space-y-6">
          <div>
            <h3 className="text-lg font-medium">Notifications</h3>
            <p className="text-muted-foreground">Configure how you receive notifications</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive email notifications</p>
              </div>
              <Switch id="email-notifications" defaultChecked={true} />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications</p>
              </div>
              <Switch id="push-notifications" defaultChecked={true} />
            </div>
          </div>
          
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
