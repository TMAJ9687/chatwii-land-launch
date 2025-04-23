import React, { useEffect, useState } from 'react';
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

import AdminLoginPage from "./pages/AdminLoginPage";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const queryClient = new QueryClient();

const STRIPE_PUBLISHABLE_KEY = "pk_test_YOUR_PUBLISHABLE_KEY";
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const useAdminAuth = () => {
  const [checked, setChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await import("@/integrations/supabase/client").then(mod => mod.supabase.auth.getSession());
      if (!session) {
        setChecked(true);
        setIsAdmin(false);
        return;
      }
      const { data: profile } = await import("@/integrations/supabase/client").then(mod =>
        mod.supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle()
      );
      setIsAdmin(profile?.role === "admin");
      setChecked(true);
    };
    check();
  }, []);

  return { checked, isAdmin };
};

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { checked, isAdmin } = useAdminAuth();
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    if (checked && !isAdmin) setRedirect(true);
  }, [checked, isAdmin]);

  if (!checked) return null;
  if (redirect) {
    window.location.replace("/tmaj2025");
    return null;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
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
              <Route path="/tmaj2025" element={<AdminLoginPage />} />
              <Route path="/admin" element={
                <ProtectedAdminRoute>
                  <AdminDashboardPage />
                </ProtectedAdminRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </Elements>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
