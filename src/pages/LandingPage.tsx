
import React, { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VipButton } from "@/components/VipButton";
import { ChatButton } from "@/components/ChatButton";
import { CaptchaModal } from "@/components/CaptchaModal";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { VerticalAdLabel } from "@/components/VerticalAdLabel";
import { ValidatedUsernameInput } from "@/components/ValidatedUsernameInput";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { signInAnonymousUser, getUserProfile } from "@/lib/firebase";
import { handleFirebaseError } from "@/utils/firebaseErrorHandling";
import { Button } from "@/components/ui/button";

const LandingPage = () => {
  const [nickname, setNickname] = useState("");
  const [isNicknameValid, setIsNicknameValid] = useState(false);
  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [existingSession, setExistingSession] = useState<{userId: string, role: string} | null>(null);
  const navigate = useNavigate();

  // Check for existing session
  useEffect(() => {
    const userId = localStorage.getItem('firebase_user_id');
    const userRole = localStorage.getItem('firebase_user_role');
    
    if (userId && userRole) {
      console.log("Found existing user session:", { userId, userRole });
      setExistingSession({ userId, role: userRole });
      
      // Check if user has a profile
      const checkProfile = async () => {
        try {
          const profile = await getUserProfile(userId);
          if (profile) {
            // User has a profile, they can continue to chat
            console.log("Found existing profile:", profile);
          }
        } catch (error) {
          console.error("Error checking profile:", error);
          // Clear session data if there's an error
          localStorage.removeItem('firebase_user_id');
          localStorage.removeItem('firebase_user_role');
          setExistingSession(null);
        }
      };
      
      checkProfile();
    }
  }, []);

  // Handler for "Start Chat" click
  const handleStartChatClick = () => {
    if (!isNicknameValid) {
      toast.error("Please enter a valid nickname");
      return;
    }
    
    console.log("Starting chat process with nickname:", nickname);
    setCaptchaOpen(true);
    setCaptchaError(null);
  };

  // Handler when CAPTCHA is solved
  const handleCaptchaSuccess = async (token: string) => {
    setIsSigningIn(true);
    setCaptchaError(null);
    setCaptchaOpen(false);
    
    console.log("CAPTCHA verified, attempting anonymous sign-in");
    
    try {
      const user = await signInAnonymousUser();
      console.log("Anonymous sign-in successful:", user.uid);
      
      // Store user ID and provider for later use
      localStorage.setItem('firebase_user_id', user.uid);
      localStorage.setItem('firebase_user_provider', 'anonymous');
      
      // Navigate to profile setup with the nickname
      console.log("Navigating to profile setup with nickname:", nickname);
      navigate("/profile-setup", { state: { nickname } });
    } catch (error) {
      console.error("Sign-in failed:", error);
      handleFirebaseError(error, "Failed to sign in. Please try again.");
      setCaptchaError("Failed to sign in. Please try again.");
      setIsSigningIn(false);
    }
  };

  // CAPTCHA error/expired handlers
  const handleCaptchaError = () => {
    console.log("CAPTCHA validation failed");
    setCaptchaError("CAPTCHA failed, please try again.");
    setCaptchaOpen(false);
  };
  
  const handleCaptchaExpire = () => {
    console.log("CAPTCHA expired");
    setCaptchaError("CAPTCHA expired, please try again.");
    setCaptchaOpen(false);
  };
  
  // Handler for continuing with existing session
  const handleContinueSession = () => {
    navigate("/chat");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative">
      <header className="absolute top-0 right-0 p-6 flex items-center space-x-3">
        <ThemeToggle />
        <VipButton />
      </header>

      <VerticalAdLabel />

      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-semibold leading-relaxed">
              Text <span className="text-chatwii-orange">Anonymously</span>
              <br />
              with <span className="text-teal-500">no registration</span>
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm">
              Unleash your creativity and connect with like-minded individuals on our chatting website, where conversations come to life.
            </p>
          </div>

          {existingSession ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-md p-4">
                <h4 className="font-medium text-green-800 dark:text-green-300">
                  Welcome back!
                </h4>
                <p className="text-sm text-green-700 dark:text-green-400 mt-2">
                  You're already signed in. Would you like to continue your previous session?
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Clear session and start fresh
                    localStorage.removeItem('firebase_user_id');
                    localStorage.removeItem('firebase_user_role');
                    setExistingSession(null);
                  }}
                >
                  New Session
                </Button>
                
                <ChatButton 
                  nickname="Continue" 
                  onCaptchaClick={handleContinueSession}
                  variant="secondary"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <ValidatedUsernameInput 
                value={nickname} 
                onChange={setNickname}
                onValidityChange={setIsNicknameValid}
              />
              <ChatButton 
                nickname={nickname} 
                onCaptchaClick={handleStartChatClick}
                disabled={isSigningIn || !nickname || !isNicknameValid}
              />
              {captchaError && (
                <div className="text-red-500 pt-2 text-center text-sm">
                  {captchaError}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-full max-w-xl mt-4">
          <AdPlaceholder />
        </div>
      </main>

      <CaptchaModal
        open={captchaOpen}
        onClose={() => setCaptchaOpen(false)}
        onSuccess={handleCaptchaSuccess}
        onError={handleCaptchaError}
        onExpire={handleCaptchaExpire}
      />
    </div>
  );
};

export default LandingPage;
