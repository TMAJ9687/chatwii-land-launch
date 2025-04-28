
import { Suspense, useEffect, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { AdminGuard } from '@/components/guards/AdminGuard';
import { VipGuard } from '@/components/guards/VipGuard';
import { Spinner } from "@/components/Spinner";
import { firebaseListener } from '@/services/FirebaseListenerService';

// Lazy-loaded routes
const ChatInterfacePage = lazy(() => import('@/pages/ChatInterface'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const VipSignupPage = lazy(() => import('@/pages/auth/VipSignupPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const VipProfileSetupPage = lazy(() => import('@/pages/VipProfileSetupPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function App() {
  useEffect(() => {
    // Initialize Firebase listener service debug mode from localStorage
    if (localStorage.getItem('firebase-debug') === 'true') {
      firebaseListener.setDebugMode(true);
    }
    
    // Clean up all listeners on unmount (though App rarely unmounts)
    return () => {
      firebaseListener.removeAllListeners();
    };
  }, []);

  return (
    <>
      <BrowserRouter>
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Spinner size="lg" /></div>}>
          <Routes>
            <Route path="/" element={<AuthGuard><ChatInterfacePage /></AuthGuard>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/vip-signup" element={<VipSignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/admin/*" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
            <Route path="/vip-profile-setup" element={<VipGuard><VipProfileSetupPage /></VipGuard>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster />
    </>
  );
}

export default App;
