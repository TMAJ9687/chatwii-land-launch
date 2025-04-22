
import { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Separator } from "@/components/ui/separator"
import { UserManagement } from "@/components/admin/UserManagement"
import { SiteManagement } from "@/components/admin/SiteManagement"
import { ReportsFeedback } from "@/components/admin/ReportsFeedback"

export const AdminDashboardPage = () => {
  const [currentView, setCurrentView] = useState("users");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
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
        {currentView === "settings" && <div>Admin Settings (Coming soon...)</div>}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
