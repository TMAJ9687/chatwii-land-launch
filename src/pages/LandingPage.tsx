
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VipButton } from "@/components/VipButton";
import { UsernameInput } from "@/components/UsernameInput";
import { ChatButton } from "@/components/ChatButton";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { VerticalAdLabel } from "@/components/VerticalAdLabel";

const LandingPage = () => {
  const [nickname, setNickname] = useState("");

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
              with <span className="text-chatwii-green">no registration</span>
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm">
              Unleash your creativity and connect with like-minded individuals on our chatting website, where conversations come to life.
            </p>
          </div>

          <div className="space-y-4">
            <UsernameInput maxLength={16} value={nickname} onChange={setNickname} />
            <ChatButton nickname={nickname} />
          </div>
        </div>

        <div className="w-full max-w-xl mt-4">
          <AdPlaceholder />
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
