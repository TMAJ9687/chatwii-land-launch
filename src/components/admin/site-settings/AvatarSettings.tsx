import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
  db, storage,
  uploadFile,
  getFileDownloadURL,
  deleteFile
} from "@/lib/firebase";
import {
  doc, getDoc, setDoc,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";

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

const getFilename = (file: File, prefix: string) =>
  `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e6)}.${file.name.split(".").pop()}`;

export const AvatarSettings = () => {
  const [avatars, setAvatars] = useState<SettingsAvatars>(DEFAULT_AVATARS);
  const [loading, setLoading] = useState(true);
  const [upLoading, setUpLoading] = useState(false);

  const vipMaleInputRef = useRef<HTMLInputElement>(null);
  const vipFemaleInputRef = useRef<HTMLInputElement>(null);
  const stdMaleInputRef = useRef<HTMLInputElement>(null);
  const stdFemaleInputRef = useRef<HTMLInputElement>(null);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const settingsRef = doc(db, "site_settings", "avatars");
        const settingsSnapshot = await getDoc(settingsRef);

        let settingsData = DEFAULT_AVATARS;
        if (settingsSnapshot.exists()) {
          const data = settingsSnapshot.data();
          settingsData = {
            vip_male: Array.isArray(data.avatars?.vip_male) ? data.avatars.vip_male : [],
            vip_female: Array.isArray(data.avatars?.vip_female) ? data.avatars.vip_female : [],
            standard_male: data.avatars?.standard_male ?? null,
            standard_female: data.avatars?.standard_female ?? null,
          };
        }
        setAvatars(settingsData);
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load avatar settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Save avatars to settings in Firestore
  const saveAvatars = async (nextAvatars: SettingsAvatars) => {
    try {
      const settingsRef = doc(db, "site_settings", "avatars");
      await setDoc(settingsRef, { avatars: nextAvatars }, { merge: true });
      setAvatars(nextAvatars);
      toast.success("Avatars updated");
    } catch (error) {
      console.error("Error saving avatars:", error);
      toast.error("Failed to update avatars settings");
    }
  };

  // Upload for VIP avatars (male/female)
  const handleVipAvatarUpload = async (role: "vip_male" | "vip_female", files: FileList | null) => {
    if (!files || !files[0]) return;
    setUpLoading(true);
    try {
      const file = files[0];
      const fname = getFilename(file, role);
      const uploadResult = await uploadFile("avatars", fname, file);
      const url = uploadResult.url;

      const nextAvatars = {
        ...avatars,
        [role]: [...(avatars[role] as string[]), url],
      };
      await saveAvatars(nextAvatars);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
    } finally {
      setUpLoading(false);
    }
  };

  // Delete for VIP avatars
  const handleVipAvatarDelete = async (role: "vip_male" | "vip_female", url: string) => {
    try {
      const urlPath = url.split('/o/')[1]?.split('?')[0];
      if (urlPath) {
        try {
          const storageRef = ref(storage, decodeURIComponent(urlPath));
          await deleteObject(storageRef);
        } catch (storageError) {
          console.warn("Could not delete from storage:", storageError);
        }
      }
      const nextArr = (avatars[role] as string[]).filter(av => av !== url);
      const nextAvatars = { ...avatars, [role]: nextArr };
      await saveAvatars(nextAvatars);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete avatar");
    }
  };

  // Upload for standard avatars (male/female)
  const handleStdAvatarUpload = async (
    role: "standard_male" | "standard_female",
    files: FileList | null
  ) => {
    if (!files || !files[0]) return;
    setUpLoading(true);
    try {
      const file = files[0];
      const fname = getFilename(file, role);
      const uploadResult = await uploadFile("avatars", fname, file);
      const url = uploadResult.url;

      const nextAvatars = { ...avatars, [role]: url };
      await saveAvatars(nextAvatars);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
    } finally {
      setUpLoading(false);
    }
  };

  // Remove for standard avatars
  const handleStdAvatarRemove = async (role: "standard_male" | "standard_female") => {
    try {
      const currentUrl = avatars[role];
      if (currentUrl) {
        const urlPath = currentUrl.split('/o/')[1]?.split('?')[0];
        if (urlPath) {
          try {
            const storageRef = ref(storage, decodeURIComponent(urlPath));
            await deleteObject(storageRef);
          } catch (storageError) {
            console.warn("Could not delete from storage:", storageError);
          }
        }
      }
      const nextAvatars = { ...avatars, [role]: null };
      await saveAvatars(nextAvatars);
    } catch (error) {
      console.error("Remove error:", error);
      toast.error("Failed to remove avatar");
    }
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
