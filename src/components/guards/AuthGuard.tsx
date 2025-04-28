
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthProfile } from '@/hooks/useAuthProfile';
import { Spinner } from "@/components/Spinner";

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { currentUserId, loading } = useAuthProfile();
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

  // Render children if authenticated
  return <>{children}</>;
};
