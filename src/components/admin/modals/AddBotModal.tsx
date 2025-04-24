
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { COUNTRIES } from "@/constants/countries";
import { Loader2 } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

interface AddBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddBotModal = ({ isOpen, onClose, onSuccess }: AddBotModalProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nickname: "",
    age: "25",
    gender: "female",
    country: "United States",
  });

  // Reset form when modal closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setFormData({
          nickname: "",
          age: "25",
          gender: "female",
          country: "United States",
        });
        setIsSubmitting(false);
      }, 300);
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!formData.nickname.trim()) {
      toast({
        title: "Error",
        description: "Nickname is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First, check that an admin user is making the request
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        });
        return;
      }
      
      // Verify the user is an admin
      const { data: adminCheck, error: adminError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
        
      if (adminError || adminCheck?.role !== 'admin') {
        toast({
          title: "Error",
          description: "Admin privileges required",
          variant: "destructive",
        });
        return;
      }

      // Use RPC function to create bot - this will handle auth user creation
      // and profile creation in a single transaction
      const botId = uuidv4();
      
      const { data, error } = await supabase.rpc('create_bot_user', {
        bot_id: botId,
        bot_nickname: formData.nickname,
        bot_age: parseInt(formData.age),
        bot_gender: formData.gender,
        bot_country: formData.country
      });
      
      if (error) {
        console.error("Error creating bot:", error);
        throw error;
      }

      // Create bot_config entry
      const { error: configError } = await supabase
        .from("bot_config")
        .insert({
          bot_user_id: botId,
          persona: "friendly",
          predefined_responses: JSON.stringify([
            "Hello, nice to meet you!",
            "How are you doing today?",
            "I'm just a simple bot, but I'm happy to chat!",
            "What would you like to talk about?"
          ])
        });

      if (configError) {
        console.error("Error creating bot config:", configError);
        throw configError;
      }

      toast({ title: "Success", description: "Bot created successfully" });
      onSuccess();
      handleOpenChange(false);
    } catch (error: any) {
      console.error("Error creating bot:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create bot",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Bot</DialogTitle>
          <DialogDescription>
            Fill in the details for the new bot profile.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="nickname" className="text-sm font-medium">
              Nickname
            </label>
            <Input
              id="nickname"
              value={formData.nickname}
              onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
              placeholder="Enter bot nickname"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Age</label>
              <Select value={formData.age} onValueChange={(value) => setFormData(prev => ({ ...prev, age: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {Array.from({ length: 63 }, (_, i) => i + 18).map((age) => (
                    <SelectItem key={age} value={age.toString()}>
                      {age}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Country</label>
            <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {COUNTRIES.filter(country => country !== "Israel").map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Bot'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
