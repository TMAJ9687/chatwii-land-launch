
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VipButton } from "@/components/VipButton";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { VerticalAdLabel } from "@/components/VerticalAdLabel";
import { ProfileSetupForm } from "@/components/ProfileSetupForm";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useAuthVerification } from "@/hooks/useAuthVerification";

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [nickname, setNickname] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authStatus, isAuthenticated } = useAuthVerification();

  useEffect(() => {
    const loadProfileData = async () => {
      // First check if we have a nickname in the location state
      const locationState = location.state as { nickname?: string } | null;
      const nicknameFromState = locationState?.nickname;
      
      console.log("ProfileSetupPage - Nickname from location state:", nicknameFromState);
      
      if (nicknameFromState) {
        setNickname(nicknameFromState);
        setIsLoading(false);
        setError(null);
        return;
      }

      // If no nickname in state but user is authenticated, generate a temporary one
      if (isAuthenticated) {
        console.log("User ID found, but no nickname in state. Proceeding anyway.");
        // Generate a more user-friendly temporary nickname
        const tempNickname = "Guest" + Math.floor(Math.random() * 1000);
        setNickname(tempNickname);
        toast.info("Creating a temporary nickname. You can change it later.");
        setIsLoading(false);
        setError(null);
        return;
      }
      
      // If not authenticated and no nickname, show error
      if (authStatus !== 'loading') {
        console.log("No user ID or nickname found. Redirecting to landing page.");
        setError("Authentication required. Please enter a nickname first.");
        setIsLoading(false);
        
        // Don't redirect immediately to show the error first
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    };

    loadProfileData();
  }, [location, navigate, isAuthenticated, authStatus]);

  // Show loading state while checking auth
  if (authStatus === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <div className="text-xl">Setting up your profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative">
      {/* Header with Theme Toggle and VIP Button */}
      <header className="absolute top-0 right-0 p-6 flex items-center space-x-3">
        <ThemeToggle />
        <VipButton />
      </header>

      {/* Vertical Ad Label */}
      <VerticalAdLabel />

      {/* Main Content */}
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        {error ? (
          <div className="w-full max-w-md">
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 mb-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-semibold leading-relaxed">
                Complete Your <span className="text-chatwii-orange">Profile</span>
              </h1>
            </div>

            <ProfileSetupForm nickname={nickname} />
          </div>
        )}

        {/* Ad Placeholder */}
        <div className="w-full max-w-xl mt-4">
          <AdPlaceholder />
        </div>
      </main>
    </div>
  );
};

export default ProfileSetupPage;
