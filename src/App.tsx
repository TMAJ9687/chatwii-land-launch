
import React, { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import LandingPage from "./pages/LandingPage";
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
import { supabase } from "./integrations/supabase/client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

const STRIPE_PUBLISHABLE_KEY = "pk_test_YOUR_PUBLISHABLE_KEY";
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const useAdminAuth = () => {
  const [checked, setChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
          setIsAdmin(false);
          setChecked(true);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        setIsAdmin(profile?.role === "admin");
      } catch (error) {
        console.error("Admin auth check failed:", error);
        setIsAdmin(false);
      } finally {
        setChecked(true);
      }
    };
    
    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      check();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { checked, isAdmin };
};

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { checked, isAdmin } = useAdminAuth();

  if (!checked) {
    return <div className="flex justify-center items-center h-screen">Verifying admin access...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
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
              <Route path="/admin/*" element={
                <ProtectedAdminRoute>
                  <AdminDashboardPage />
                </ProtectedAdminRoute>
              } />
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
