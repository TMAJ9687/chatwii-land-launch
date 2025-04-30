
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type SiteSettingsJson = {
  profanity_nickname?: string[];
  profanity_chat?: string[];
  [key: string]: any;
};

export const ProfanitySettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<SiteSettingsJson>({
    profanity_nickname: [],
    profanity_chat: [],
  });

  const [nicknameWord, setNicknameWord] = useState("");
  const [chatWord, setChatWord] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      // Mock fetching settings
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSettings({
        profanity_nickname: ["badword1", "badword2"],
        profanity_chat: ["offensive1", "offensive2"],
      });
    } catch (e) {
      toast.error("Failed to load profanity data");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettingsInSupabase = async (newFields: Partial<SiteSettingsJson>) => {
    // Mock update settings
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Merge with previous settings
      const updated = { ...settings, ...newFields };
      setSettings(updated);
      
      toast.success("Updated successfully!");
    } catch (e) {
      toast.error("Failed to update settings");
    }
  };

  // ADD word
  const handleAddWord = (type: "profanity_nickname" | "profanity_chat") => {
    const word = (type === "profanity_nickname" ? nicknameWord.trim() : chatWord.trim()).toLowerCase();
    if (!word) return toast.error("Cannot add an empty word");
    
    // Check if word already exists
    if (settings[type]?.includes(word)) return toast.error("Duplicate word");
    
    const updatedArr = [...(settings[type] || []), word];
    updateSettingsInSupabase({ [type]: updatedArr });
    
    if (type === "profanity_nickname") setNicknameWord("");
    else setChatWord("");
  };

  // DELETE word
  const handleDeleteWord = (type: "profanity_nickname" | "profanity_chat", word: string) => {
    const updatedArr = (settings[type] || []).filter((w: string) => w !== word);
    updateSettingsInSupabase({ [type]: updatedArr });
  };

  return (
    <div className="space-y-8 max-w-2xl p-2">
      <h3 className="text-lg font-semibold mb-2">Nickname Profanity</h3>
      <div className="space-y-3 rounded-lg border p-4 bg-muted">
        <div className="flex flex-wrap gap-2 mb-2">
          {settings.profanity_nickname?.length === 0 && (
            <span className="text-xs text-muted-foreground">No words yet.</span>
          )}
          {settings.profanity_nickname?.map((word: string) => (
            <span key={word} className="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-primary text-sm font-medium">
              {word}
              <Button size="icon" variant="ghost" className="ml-1" onClick={() => handleDeleteWord("profanity_nickname", word)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={nicknameWord}
            onChange={e => setNicknameWord(e.target.value)}
            placeholder="Add word..."
            className="max-w-xs"
            onKeyDown={e => { if (e.key === "Enter") handleAddWord("profanity_nickname"); }}
            disabled={isLoading}
          />
          <Button onClick={() => handleAddWord("profanity_nickname")} disabled={isLoading}>Add Nickname Word</Button>
        </div>
      </div>

      <h3 className="text-lg font-semibold mt-8 mb-2">Chat Profanity</h3>
      <div className="space-y-3 rounded-lg border p-4 bg-muted">
        <div className="flex flex-wrap gap-2 mb-2">
          {settings.profanity_chat?.length === 0 && (
            <span className="text-xs text-muted-foreground">No words yet.</span>
          )}
          {settings.profanity_chat?.map((word: string) => (
            <span key={word} className="inline-flex items-center px-2 py-1 rounded bg-accent/40 text-sm text-accent-foreground font-medium">
              {word}
              <Button size="icon" variant="ghost" className="ml-1" onClick={() => handleDeleteWord("profanity_chat", word)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={chatWord}
            onChange={e => setChatWord(e.target.value)}
            placeholder="Add word..."
            className="max-w-xs"
            onKeyDown={e => { if (e.key === "Enter") handleAddWord("profanity_chat"); }}
            disabled={isLoading}
          />
          <Button onClick={() => handleAddWord("profanity_chat")} disabled={isLoading}>Add Chat Word</Button>
        </div>
      </div>
    </div>
  );
};
