
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthProfile } from '@/hooks/useAuthProfile';
import { Spinner } from "@/components/Spinner";

interface VipGuardProps {
  children: ReactNode;
}

export const VipGuard = ({ children }: VipGuardProps) => {
  const { currentUserId, isVipUser, loading } = useAuthProfile();
  const location = useLocation();

  // Show loading indicator while checking auth status
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUserId) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to home if not a VIP user
  if (!isVipUser) {
    return <Navigate to="/" replace />;
  }

  // Render children if authenticated and is a VIP user
  return <>{children}</>;
};
