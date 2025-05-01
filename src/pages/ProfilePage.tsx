
import React from 'react';
import { Button } from '@/components/ui/button';

const ProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <div className="bg-card p-6 rounded-lg shadow">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Profile Information</h3>
              <p className="text-muted-foreground">Update your personal details</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <h4 className="font-medium">User Name</h4>
                <p className="text-sm text-muted-foreground">user@example.com</p>
              </div>
            </div>
            <Button>Edit Profile</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
