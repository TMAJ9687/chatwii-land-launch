import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserManagement } from "@/components/admin/UserManagement";
import { SiteManagement } from "@/components/admin/SiteManagement";
import { ReportsFeedback } from "@/components/admin/ReportsFeedback";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { LogoutButton } from "@/components/LogoutButton";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export const AdminDashboardPage = () => {
  const [currentView, setCurrentView] = useState("users");
  const { isLoading, isAdmin, user } = useAdminAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAdmin || !user) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <LogoutButton />
          </div>
        </div>
        
        <NavigationMenu className="mb-8">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={navigationMenuTriggerStyle()} 
                onClick={() => setCurrentView("users")}
              >
                User Management
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={navigationMenuTriggerStyle()} 
                onClick={() => setCurrentView("site")}
              >
                Site Management
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={navigationMenuTriggerStyle()} 
                onClick={() => setCurrentView("reports")}
              >
                Reports & Feedback
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={navigationMenuTriggerStyle()} 
                onClick={() => setCurrentView("settings")}
              >
                Admin Settings
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        
        <Separator className="mb-8" />
        
        {currentView === "users" && <UserManagement />}
        {currentView === "site" && <SiteManagement />}
        {currentView === "reports" && <ReportsFeedback />}
        {currentView === "settings" && <AdminSettings />}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
