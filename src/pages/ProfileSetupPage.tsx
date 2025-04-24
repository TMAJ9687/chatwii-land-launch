
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VipButton } from "@/components/VipButton";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { VerticalAdLabel } from "@/components/VerticalAdLabel";
import { ProfileSetupForm } from "@/components/ProfileSetupForm";

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const nickname = location.state?.nickname;

  useEffect(() => {
    if (!nickname) {
      navigate("/");
    }
  }, [nickname, navigate]);

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
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-semibold leading-relaxed">
              Complete Your <span className="text-chatwii-orange">Profile</span>
            </h1>
          </div>

          <ProfileSetupForm nickname={nickname} />
        </div>

        {/* Ad Placeholder */}
        <div className="w-full max-w-xl mt-4">
          <AdPlaceholder />
        </div>
      </main>
    </div>
  );
};

export default ProfileSetupPage;
