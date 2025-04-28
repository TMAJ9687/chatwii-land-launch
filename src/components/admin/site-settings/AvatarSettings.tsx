import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

interface SettingsAvatars {
  vip_male: string[];
  vip_female: string[];
  standard_male: string | null;
  standard_female: string | null;
}

const DEFAULT_AVATARS: SettingsAvatars = {
  vip_male: [],
  vip_female: [],
  standard_male: null,
  standard_female: null,
};

const getPublicUrl = (path: string) => {
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data ? data.publicUrl : "";
};

const getFilename = (file: File, prefix: string) =>
  `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e6)}.${file.name.split(".").pop()}`;

export const AvatarSettings = () => {
  const [settings, setSettings] = useState<any>(null);
  const [avatars, setAvatars] = useState<SettingsAvatars>(DEFAULT_AVATARS);
  const [loading, setLoading] = useState(true);
  const [upLoading, setUpLoading] = useState(false);

  // For upload file input
  const vipMaleInputRef = useRef<HTMLInputElement>(null);
  const vipFemaleInputRef = useRef<HTMLInputElement>(null);
  const stdMaleInputRef = useRef<HTMLInputElement>(null);
  const stdFemaleInputRef = useRef<HTMLInputElement>(null);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const response = await supabase
        .from("site_settings")
        .select("settings")
        .eq("id", 1)
        .maybeSingle();
        
      const { data, error } = response;
      let obj = {};
      if (data?.settings && typeof data.settings === "object") obj = data.settings;
      const avatarsObj = obj["avatars"] ?? { ...DEFAULT_AVATARS };

      // Ensure shape
      setAvatars({
        vip_male: Array.isArray(avatarsObj.vip_male) ? avatarsObj.vip_male : [],
        vip_female: Array.isArray(avatarsObj.vip_female) ? avatarsObj.vip_female : [],
        standard_male: avatarsObj.standard_male ?? null,
        standard_female: avatarsObj.standard_female ?? null,
      });
      setSettings(obj);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  // Save avatars to settings JSONB in supabase
  const saveAvatars = async (nextAvatars: SettingsAvatars) => {
    const nextSettings = {
      ...settings,
      avatars: nextAvatars,
    };
    const response = await supabase
      .from("site_settings")
      .update({ settings: nextSettings })
      .eq("id", 1);
      
    const { error } = response;
    if (error) {
      toast.error("Failed to update avatars settings");
      return false;
    }
    setAvatars(nextAvatars);
    setSettings(nextSettings);
    toast.success("Avatars updated");
    return true;
  };

  const handleVipAvatarUpload = async (role: "vip_male" | "vip_female", files: FileList | null) => {
    if (!files || !files[0]) return;
    setUpLoading(true);
    const file = files[0];
    const fname = getFilename(file, role);
    const { error } = await supabase.storage.from("avatars").upload(fname, file);
    if (error) {
      toast.error("Upload failed");
      setUpLoading(false);
      return;
    }
    const url = getPublicUrl(fname);
    const nextAvatars = {
      ...avatars,
      [role]: [ ...(avatars[role] as string[]), url ],
    };
    await saveAvatars(nextAvatars);
    setUpLoading(false);
  };

  const handleVipAvatarDelete = async (role: "vip_male" | "vip_female", url: string) => {
    const nextArr = (avatars[role] as string[]).filter(av => av !== url);
    const nextAvatars = { ...avatars, [role]: nextArr };
    await saveAvatars(nextAvatars);
  };

  const handleStdAvatarUpload = async (
    role: "standard_male" | "standard_female",
    files: FileList | null
  ) => {
    if (!files || !files[0]) return;
    setUpLoading(true);
    const file = files[0];
    const fname = getFilename(file, role);
    const { error } = await supabase.storage.from("avatars").upload(fname, file);
    if (error) {
      toast.error("Upload failed");
      setUpLoading(false);
      return;
    }
    const url = getPublicUrl(fname);
    const nextAvatars = { ...avatars, [role]: url };
    await saveAvatars(nextAvatars);
    setUpLoading(false);
  };

  const handleStdAvatarRemove = async (role: "standard_male" | "standard_female") => {
    const nextAvatars = { ...avatars, [role]: null };
    await saveAvatars(nextAvatars);
  };

  return (
    <div className="space-y-10">
      <h3 className="text-xl font-semibold">Avatar Management</h3>
      {loading ? (
        <div>Loading avatars...</div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* VIP Avatars */}
          <div>
            <h4 className="text-lg font-bold mb-2">VIP Avatars</h4>
            <div className="flex flex-col md:flex-row gap-8">
              {/* VIP Male */}
              <div className="flex-1">
                <h5 className="mb-2 font-medium">Male</h5>
                <div className="flex flex-wrap gap-4 mb-2">
                  {avatars.vip_male.length === 0 && (
                    <span className="text-gray-400 text-sm">No avatars uploaded</span>
                  )}
                  {avatars.vip_male.map((url, i) => (
                    <div key={url} className="relative group">
                      <img src={url} alt={`VIP Male Avatar ${i+1}`} className="h-20 w-20 object-cover rounded-full border" />
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute -top-2 -right-2 p-0 w-7 h-7 bg-white/90 border z-10"
                        onClick={() => handleVipAvatarDelete("vip_male", url)}
                        aria-label="Delete Avatar"
                      >
                        <X className="h-4 w-4"/>
                      </Button>
                    </div>
                  ))}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={vipMaleInputRef}
                    className="hidden"
                    onChange={e => handleVipAvatarUpload("vip_male", e.target.files)}
                  />
                  <Button
                    onClick={() => vipMaleInputRef.current?.click()}
                    disabled={upLoading}
                  >
                    Upload VIP Male Avatar
                  </Button>
                </div>
              </div>
              {/* VIP Female */}
              <div className="flex-1">
                <h5 className="mb-2 font-medium">Female</h5>
                <div className="flex flex-wrap gap-4 mb-2">
                  {avatars.vip_female.length === 0 && (
                    <span className="text-gray-400 text-sm">No avatars uploaded</span>
                  )}
                  {avatars.vip_female.map((url, i) => (
                    <div key={url} className="relative group">
                      <img src={url} alt={`VIP Female Avatar ${i+1}`} className="h-20 w-20 object-cover rounded-full border" />
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute -top-2 -right-2 p-0 w-7 h-7 bg-white/90 border z-10"
                        onClick={() => handleVipAvatarDelete("vip_female", url)}
                        aria-label="Delete Avatar"
                      >
                        <X className="h-4 w-4"/>
                      </Button>
                    </div>
                  ))}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={vipFemaleInputRef}
                    className="hidden"
                    onChange={e => handleVipAvatarUpload("vip_female", e.target.files)}
                  />
                  <Button
                    onClick={() => vipFemaleInputRef.current?.click()}
                    disabled={upLoading}
                  >
                    Upload VIP Female Avatar
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {/* Standard Default Avatars */}
          <div>
            <h4 className="text-lg font-bold mb-2">Standard Default Avatars</h4>
            <div className="flex flex-col md:flex-row gap-8">
              {/* Standard Male */}
              <div className="flex-1">
                <h5 className="mb-2 font-medium">Male</h5>
                {avatars.standard_male ? (
                  <div className="mb-2 flex items-center gap-4">
                    <img src={avatars.standard_male} className="h-20 w-20 rounded-full border object-cover"/>
                    <Button size="sm" variant="outline" onClick={() => handleStdAvatarRemove("standard_male")}>Remove Default</Button>
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm mb-2 block">No default avatar set</span>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={stdMaleInputRef}
                    className="hidden"
                    onChange={e => handleStdAvatarUpload("standard_male", e.target.files)}
                  />
                  <Button
                    onClick={() => stdMaleInputRef.current?.click()}
                    disabled={upLoading}
                  >
                    Set/Change Standard Male Default
                  </Button>
                </div>
              </div>
              {/* Standard Female */}
              <div className="flex-1">
                <h5 className="mb-2 font-medium">Female</h5>
                {avatars.standard_female ? (
                  <div className="mb-2 flex items-center gap-4">
                    <img src={avatars.standard_female} className="h-20 w-20 rounded-full border object-cover"/>
                    <Button size="sm" variant="outline" onClick={() => handleStdAvatarRemove("standard_female")}>Remove Default</Button>
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm mb-2 block">No default avatar set</span>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={stdFemaleInputRef}
                    className="hidden"
                    onChange={e => handleStdAvatarUpload("standard_female", e.target.files)}
                  />
                  <Button
                    onClick={() => stdFemaleInputRef.current?.click()}
                    disabled={upLoading}
                  >
                    Set/Change Standard Female Default
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
