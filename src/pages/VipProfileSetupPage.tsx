
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

// Define profanity list for nickname validation
const profanityList = ['fuck', 'shit', 'ass', 'bitch', 'dick', 'penis', 'vagina', 'sex'];

const VipProfileSetupPage = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
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

  const validateNickname = (value: string): string => {
    if (!value) return "Nickname is required";
    if (value.length > 16) return "Nickname must be max 16 characters";
    
    const numberCount = (value.match(/\d/g) || []).length;
    if (numberCount > 2) return "Nickname can contain maximum 2 numbers";
    
    if (/(.)\1\1\1/.test(value)) return "Nickname cannot contain more than 3 consecutive same letters";
    
    if (!/^[a-zA-Z0-9\s]*$/.test(value)) return "Nickname can only contain letters, numbers, and spaces";
    
    const lowerCaseValue = value.toLowerCase();
    for (const word of profanityList) {
      if (lowerCaseValue.includes(word)) return "Nickname contains inappropriate language";
    }
    
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateNickname(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: currentUser.id,
          nickname,
          role: 'vip',
          vip_status: true,
        }]);
      
      if (insertError) throw insertError;
      
      toast({
        title: "Profile setup complete!",
        description: "Welcome to ChatWii VIP."
      });
      
      navigate('/chat');
    } catch (error: any) {
      toast({
        title: "Profile setup failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
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
            <div className="space-y-2">
              <Label htmlFor="nickname">Choose your Nickname</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError(validateNickname(e.target.value));
                }}
                placeholder="Enter your nickname"
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-chatwii-peach hover:bg-chatwii-orange"
              disabled={!!error || !nickname || isSubmitting}
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
