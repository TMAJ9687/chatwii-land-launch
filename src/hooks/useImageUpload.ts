
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { 
  uploadFile, 
  getFileDownloadURL, 
  getDocument, 
  createDocument, 
  updateDocument 
} from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

// Define interfaces to fix type errors
interface SiteSettings {
  id: string;
  settings?: {
    files?: {
      max_size_mb?: number;
      allowed_mime_types?: string[];
      max_image_dimension?: number;
      daily_upload_limit?: number;
    }
  };
}

interface UserProfile {
  id: string;
  role?: string;
  vip_status?: boolean;
  [key: string]: any;
}

interface DailyUploadRecord {
  id: string;
  user_id?: string;
  upload_count?: number;
  last_upload_date?: string;
  [key: string]: any;
}

export const useImageUpload = (currentUserId: string | null) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const hasLimitChecked = useRef<boolean>(false);

  // Get allowed mime types and size limits from site settings
  const getSiteSettings = async () => {
    try {
      const settingsDoc = await getDocument('site_settings', '1') as SiteSettings;
      
      if (settingsDoc && typeof settingsDoc === 'object') {
        // Safely access nested properties with optional chaining
        const fileSettings = settingsDoc?.settings?.files || {};
        
        return {
          maxSizeMb: fileSettings.max_size_mb || 5,
          allowedMimeTypes: fileSettings.allowed_mime_types || ['image/jpeg', 'image/png', 'image/gif'],
          maxImageDimension: fileSettings.max_image_dimension || 2000,
          dailyUploadLimit: fileSettings.daily_upload_limit || 10
        };
      }
      
      return {
        maxSizeMb: 5,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
        maxImageDimension: 2000,
        dailyUploadLimit: 10
      };
    } catch (error) {
      console.error('Error getting site settings:', error);
      return {
        maxSizeMb: 5,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
        maxImageDimension: 2000,
        dailyUploadLimit: 10
      };
    }
  };

  // Check if the user is a VIP
  const isVipUser = async () => {
    if (!currentUserId) return false;
    
    try {
      const userProfile = await getDocument('profiles', currentUserId) as UserProfile;
      // Safely check properties, ensuring they exist on the profile object
      if (userProfile && typeof userProfile === 'object') {
        return (userProfile?.role === 'vip' || userProfile?.vip_status === true);
      }
      return false;
    } catch (error) {
      console.error('Error checking VIP status:', error);
      return false;
    }
  };

  // Check if the user has reached the daily upload limit
  const checkDailyUploadLimit = async () => {
    if (!currentUserId) return false;
    
    // VIP users don't have a daily limit
    if (await isVipUser()) {
      return true;
    }

    try {
      const { dailyUploadLimit } = await getSiteSettings();
      
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const dailyUploadDoc = await getDocument('daily_photo_uploads', currentUserId) as DailyUploadRecord;
      
      if (dailyUploadDoc && typeof dailyUploadDoc === 'object') {
        // Ensure the document has the expected structure before accessing properties
        const lastUploadDate = dailyUploadDoc?.last_upload_date?.toString().split('T')[0];
        const uploadCount = typeof dailyUploadDoc?.upload_count === 'number' ? dailyUploadDoc?.upload_count : 0;
        
        // Reset counter if it's a new day
        if (lastUploadDate !== today) {
          return true;
        }
        
        // Check if limit reached
        return uploadCount < dailyUploadLimit;
      }
      
      // No record yet, first upload of the day
      return true;
    } catch (error) {
      console.error('Error checking daily upload limit:', error);
      return true; // Allow upload on error
    }
  };

  // Update the daily upload count
  const updateDailyUploadCount = async () => {
    if (!currentUserId) return;
    
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const dailyUploadDoc = await getDocument('daily_photo_uploads', currentUserId) as DailyUploadRecord;
      
      if (dailyUploadDoc && typeof dailyUploadDoc === 'object') {
        // Use safe property access to avoid errors
        const lastUploadDate = dailyUploadDoc?.last_upload_date?.toString().split('T')[0];
        const currentCount = typeof dailyUploadDoc?.upload_count === 'number' ? dailyUploadDoc?.upload_count : 0;
        
        if (lastUploadDate === today) {
          // Update existing record for today
          await updateDocument('daily_photo_uploads', currentUserId, {
            upload_count: currentCount + 1,
            last_upload_date: today
          });
        } else {
          // Reset for a new day
          await updateDocument('daily_photo_uploads', currentUserId, {
            upload_count: 1,
            last_upload_date: today
          });
        }
      } else {
        // Create new record
        await createDocument('daily_photo_uploads', {
          id: currentUserId,
          user_id: currentUserId,
          upload_count: 1,
          last_upload_date: today
        });
      }
    } catch (error) {
      console.error('Error updating daily upload count:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    setSelectedFile(file);
    
    // Create a preview URL
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setPreviewUrl(fileReader.result as string);
    };
    fileReader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile || !currentUserId) return null;
    
    try {
      setIsUploading(true);
      
      // Validate file
      const settings = await getSiteSettings();
      
      if (selectedFile.size > settings.maxSizeMb * 1024 * 1024) {
        throw new Error(`File size exceeds the ${settings.maxSizeMb}MB limit`);
      }
      
      if (!settings.allowedMimeTypes.includes(selectedFile.type)) {
        throw new Error('File type not allowed');
      }
      
      // Upload the file
      const filePath = `uploads/${currentUserId}/${uuidv4()}-${selectedFile.name}`;
      await uploadFile('uploads', filePath, selectedFile);
      
      // Get the download URL
      const downloadUrl = await getFileDownloadURL(filePath);
      
      return downloadUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
      return null;
    } finally {
      setIsUploading(false);
    }
  };
  
  const clearFileSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };
  
  return {
    selectedFile,
    previewUrl,
    isUploading,
    handleFileSelect,
    uploadImage,
    clearFileSelection,
    checkDailyUploadLimit,
    updateDailyUploadCount
  };
};
