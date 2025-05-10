
import { Route, Routes as RouterRoutes } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import ProfileSetupPage from "@/pages/ProfileSetupPage";
import Index from "@/pages/Index";
import ChatInterface from "@/pages/ChatInterface";
import SimpleChatInterface from "@/pages/SimpleChatInterface";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import { useMockMode } from "@/contexts/MockModeContext";
import { toast } from "sonner";

export const Routes = () => {
  const { enableMockMode } = useMockMode();

  // Enable mock mode by default on all routes
  useEffect(() => {
    enableMockMode();
    toast.success("Mock mode enabled automatically - now you can access the Chat Interface");
  }, [enableMockMode]);

  return (
    <RouterRoutes>
      <Route path="/" element={<SimpleChatInterface />} />
      <Route path="/index" element={<Index />} />
      <Route path="/profile-setup" element={<ProfileSetupPage />} />
      <Route path="/chat" element={<ChatInterface />} />
      <Route path="/chat-ui" element={<SimpleChatInterface />} />
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};
