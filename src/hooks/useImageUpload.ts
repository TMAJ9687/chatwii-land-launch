
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useImageUpload = (currentUserId: string | null) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Clear file selection
  const clearFileSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  // Check daily upload limit
  const checkDailyUploadLimit = async () => {
    if (!currentUserId) return false;

    const { data: siteSettings } = await supabase
      .from('site_settings')
      .select('settings')
      .single();

    const dailyLimit = siteSettings?.settings?.dailyPhotoUploadLimit || 10;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUserId)
      .single();

    // VIP users have unlimited uploads
    if (profile?.role === 'vip') return true;

    const { data: uploadRecord } = await supabase
      .from('daily_photo_uploads')
      .select('upload_count, last_upload_date')
      .eq('user_id', currentUserId)
      .single();

    // No record or different date - reset count
    if (!uploadRecord || uploadRecord.last_upload_date !== new Date().toISOString().split('T')[0]) {
      return true;
    }

    // Check if within daily limit
    return uploadRecord.upload_count < dailyLimit;
  };

  // Update daily upload count
  const updateDailyUploadCount = async () => {
    if (!currentUserId) return;

    const today = new Date().toISOString().split('T')[0];

    const { data: existingRecord } = await supabase
      .from('daily_photo_uploads')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('last_upload_date', today)
      .single();

    if (existingRecord) {
      await supabase
        .from('daily_photo_uploads')
        .update({ upload_count: existingRecord.upload_count + 1 })
        .eq('user_id', currentUserId)
        .eq('last_upload_date', today);
    } else {
      await supabase
        .from('daily_photo_uploads')
        .insert({
          user_id: currentUserId,
          last_upload_date: today,
          upload_count: 1
        });
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

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
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
