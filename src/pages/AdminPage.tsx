
import React from 'react';

const AdminPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-medium mb-4">User Management</h2>
            <p className="text-muted-foreground">Manage user accounts and permissions</p>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-medium mb-4">Content Moderation</h2>
            <p className="text-muted-foreground">Moderate user-generated content</p>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-medium mb-4">System Settings</h2>
            <p className="text-muted-foreground">Configure system settings and preferences</p>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-medium mb-4">Analytics</h2>
            <p className="text-muted-foreground">View system analytics and reports</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
