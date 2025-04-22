
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import ChatPage from "./pages/ChatPage";
import ChatInterface from "./pages/ChatInterface";
import NotFound from "./pages/NotFound";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import VipLoginPage from "./pages/VipLoginPage";
import VipRegistrationPage from "./pages/VipRegistrationPage";
import VipProfileSetupPage from "./pages/VipProfileSetupPage";
import VipSettingsPage from "./pages/VipSettingsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import FeedbackPage from "./pages/FeedbackPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/profile-setup" element={<ProfileSetupPage />} />
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/vip/login" element={<VipLoginPage />} />
            <Route path="/vip/register" element={<VipRegistrationPage />} />
            <Route path="/vip/profile-setup" element={<VipProfileSetupPage />} />
            <Route path="/vip/settings" element={<VipSettingsPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
