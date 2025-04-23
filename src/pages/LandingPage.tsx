
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VipButton } from "@/components/VipButton";
import { UsernameInput } from "@/components/UsernameInput";
import { ChatButton } from "@/components/ChatButton";
import { CaptchaModal } from "@/components/CaptchaModal";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { VerticalAdLabel } from "@/components/VerticalAdLabel";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

const LandingPage = () => {
  const [nickname, setNickname] = useState("");
  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Handler for "Start Chat" click
  const handleStartChatClick = () => {
    setCaptchaOpen(true);
    setCaptchaError(null);
  };

  // Handler when CAPTCHA is solved
  const handleCaptchaSuccess = async (token: string) => {
    // Log the received CAPTCHA token
    console.log("Turnstile token:", token);

    // TODO: Send this token to backend for verification with Secret Key!
    setIsSigningIn(true);
    setCaptchaError(null);
    setCaptchaOpen(false);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      navigate("/profile-setup", { state: { nickname } });
    } catch (error) {
      setCaptchaError("Failed to sign in. Please try again.");
      toast({
        title: "Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  // CAPTCHA error/expired handlers
  const handleCaptchaError = () => {
    setCaptchaError("CAPTCHA failed, please try again.");
    setCaptchaOpen(false);
  };
  const handleCaptchaExpire = () => {
    setCaptchaError("CAPTCHA expired, please try again.");
    setCaptchaOpen(false);
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

          <div className="space-y-4">
            <UsernameInput maxLength={16} value={nickname} onChange={setNickname} />
            <ChatButton 
              nickname={nickname} 
              onCaptchaClick={handleStartChatClick}
              disabled={isSigningIn || !nickname}
            />
            {captchaError && (
              <div className="text-red-500 pt-2 text-center text-sm">
                {captchaError}
              </div>
            )}
          </div>
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

