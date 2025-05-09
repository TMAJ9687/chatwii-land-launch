
import { Route, Routes as RouterRoutes } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import ProfileSetupPage from "@/pages/ProfileSetupPage";
import Index from "@/pages/Index";
import ChatInterface from "@/pages/ChatInterface";
import NotFound from "@/pages/NotFound";

export const Routes = () => {
  return (
    <RouterRoutes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/index" element={<Index />} />
      <Route path="/profile-setup" element={<ProfileSetupPage />} />
      <Route path="/chat" element={<ChatInterface />} />
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};
