
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

import VipPlansPage from "./pages/VipPlansPage";
import VipSuccessPage from "./pages/VipSuccessPage";
import VipCancelPage from "./pages/VipCancelPage";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const queryClient = new QueryClient();

// IMPORTANT: Replace with your real Stripe publishable key!
const STRIPE_PUBLISHABLE_KEY = "pk_test_YOUR_PUBLISHABLE_KEY";
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* Stripe Elements Provider: All payment/plan-related pages should be here */}
        {/* REMINDER: Replace publishable key above with your live/test key for real payments */}
        <Elements stripe={stripePromise}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/profile-setup" element={<ProfileSetupPage />} />
              <Route path="/chat" element={<ChatInterface />} />
              <Route path="/vip/login" element={<VipLoginPage />} />
              <Route path="/vip/register" element={<VipRegistrationPage />} />
              <Route path="/vip/profile-setup" element={<VipProfileSetupPage />} />
              <Route path="/vip/settings" element={<VipSettingsPage />} />
              <Route path="/vip-plans" element={<VipPlansPage />} />
              <Route path="/vip-success" element={<VipSuccessPage />} />
              <Route path="/vip-cancel" element={<VipCancelPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </Elements>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
