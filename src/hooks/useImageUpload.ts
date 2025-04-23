
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useImageUpload = (currentUserId: string | null) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clear file selection
  const clearFileSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  // Check daily upload limit
  const checkDailyUploadLimit = async () => {
    if (!currentUserId) return false;

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const { data: siteSettings } = await supabase
        .from('site_settings')
        .select('settings')
        .eq('id', 1)
        .abortSignal(signal)
        .maybeSingle();

      // Use settings from the database with proper type safety
      let dailyLimit = 10; // Default value
      
      if (siteSettings?.settings && 
          typeof siteSettings.settings === 'object' && 
          siteSettings.settings !== null &&
          'standard_photo_limit' in siteSettings.settings) {
        dailyLimit = Number(siteSettings.settings.standard_photo_limit) || 10;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUserId)
        .abortSignal(signal)
        .maybeSingle();

      // VIP users have unlimited uploads
      if (profile?.role === 'vip') return true;

      const today = new Date().toISOString().split('T')[0];
      const { data: uploadRecord } = await supabase
        .from('daily_photo_uploads')
        .select('upload_count, last_upload_date')
        .eq('user_id', currentUserId)
        .abortSignal(signal)
        .maybeSingle();

      // No record or different date - reset count
      if (!uploadRecord || uploadRecord.last_upload_date !== today) {
        return true;
      }

      // Check if within daily limit
      return uploadRecord.upload_count < dailyLimit;
    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) {
        console.log('Upload limit check aborted');
        return false;
      }
      console.error('Error checking daily upload limit:', error);
      return false;
    }
  };

  // Update daily upload count
  const updateDailyUploadCount = async () => {
    if (!currentUserId) return;

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: existingRecord } = await supabase
        .from('daily_photo_uploads')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('last_upload_date', today)
        .abortSignal(signal)
        .maybeSingle();

      if (existingRecord) {
        await supabase
          .from('daily_photo_uploads')
          .update({ upload_count: existingRecord.upload_count + 1 })
          .eq('user_id', currentUserId)
          .eq('last_upload_date', today)
          .abortSignal(signal);
      } else {
        await supabase
          .from('daily_photo_uploads')
          .insert({
            user_id: currentUserId,
            last_upload_date: today,
            upload_count: 1
          })
          .abortSignal(signal);
      }
    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) return;
      console.error('Error updating daily upload count:', error);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      toast.error('Please select a valid image file');
    }
  };

  // Upload image to storage
  const uploadImage = async () => {
    if (!selectedFile || !currentUserId) return null;

    try {
      setIsUploading(true);
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${currentUserId}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat_images')
        .upload(filePath, selectedFile);

      if (uploadError) {
        toast.error('Failed to upload image');
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat_images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      toast.error('Image upload failed');
      console.error('Upload error:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Cleanup preview URL and abort controller on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      abortControllerRef.current?.abort();
    };
  }, [previewUrl]);

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
