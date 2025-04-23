import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VipNicknameInput } from "@/components/vip/VipNicknameInput";

// Simple profanity list for client-side validation (server will also check)
const profanityList = ['fuck', 'shit', 'ass', 'bitch', 'dick', 'penis', 'vagina', 'sex'];

const VipProfileSetupPage = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/vip/login');
        return;
      }
      setCurrentUser(session.user);
      
      // Check if profile already exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        navigate('/chat');
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Check nickname availability first
      const { data: isAvailable, error: checkError } = await supabase.rpc('is_nickname_available', { 
        check_nickname: nickname 
      });

      if (checkError) throw checkError;

      if (!isAvailable) {
        toast("This nickname is already taken. Please choose another one.");
        setIsSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: currentUser.id,
          nickname,
          role: 'vip',
          vip_status: true,
        }]);
      
      if (insertError) throw insertError;
      
      toast("Profile setup complete! Welcome to ChatWii VIP.");
      navigate('/chat');
    } catch (error: any) {
      toast("Profile setup failed: " + (error.message || "Please try again."));
      console.error("Profile setup error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Welcome to <span className="text-chatwii-peach">ChatWii VIP</span>
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <VipNicknameInput
              value={nickname}
              onChange={setNickname}
              profanityList={profanityList}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-chatwii-peach hover:bg-chatwii-orange"
              disabled={!nickname || isSubmitting}
            >
              {isSubmitting ? "Setting up..." : "Continue to Chat"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VipProfileSetupPage;
