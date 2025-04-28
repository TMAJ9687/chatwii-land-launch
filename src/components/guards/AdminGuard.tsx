
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthProfile } from '@/hooks/useAuthProfile';
import { Spinner } from "@/components/Spinner";

interface AdminGuardProps {
  children: ReactNode;
}

export const AdminGuard = ({ children }: AdminGuardProps) => {
  const { currentUserId, currentUserRole, loading } = useAuthProfile();
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

  // Redirect to home if not an admin
  if (currentUserRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Render children if authenticated and is an admin
  return <>{children}</>;
};
