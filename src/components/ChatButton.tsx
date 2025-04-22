
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface ChatButtonProps {
  nickname: string;
}

export const ChatButton = ({ nickname }: ChatButtonProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleStartChat = async () => {
    if (!nickname) {
      toast({
        title: "Error",
        description: "Please enter a nickname",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;

      navigate('/profile-setup', { state: { nickname } });
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: "Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleStartChat}
      disabled={isLoading}
      className="w-full bg-chatwii-peach hover:bg-opacity-90 text-white py-3 rounded-md font-medium transition-colors text-base shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "Starting..." : "Start Chat"}
    </button>
  );
};
