
import { useState, useEffect, useRef } from 'react';
import { uploadFile, queryDocuments, createDocument, updateDocument } from '@/lib/firebase';
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
      // Get site settings
      const siteSettings = await queryDocuments('site_settings', [
        { field: 'id', operator: '==', value: 'general' }
      ]);
      
      // Use settings from the database with proper type safety
      let dailyLimit = 10; // Default value
      
      if (siteSettings.length > 0 && 
          typeof siteSettings[0] === 'object' && 
          siteSettings[0] !== null) {
        const settingsObj = siteSettings[0];
        if (settingsObj.settings && typeof settingsObj.settings === 'object') {
          dailyLimit = Number(settingsObj.settings.standard_photo_limit) || 10;
        }
      }

      // Get user profile
      const profiles = await queryDocuments('profiles', [
        { field: 'id', operator: '==', value: currentUserId }
      ]);
      
      const profile = profiles.length > 0 ? profiles[0] : null;

      // VIP users have unlimited uploads
      if (profile && (profile.role === 'vip')) return true;

      const today = new Date().toISOString().split('T')[0];
      
      // Get today's upload count
      const uploadRecords = await queryDocuments('daily_photo_uploads', [
        { field: 'user_id', operator: '==', value: currentUserId },
        { field: 'last_upload_date', operator: '==', value: today }
      ]);

      const uploadRecord = uploadRecords.length > 0 ? uploadRecords[0] : null;

      // No record or different date - reset count
      if (!uploadRecord) {
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
    
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get existing record
      const uploadRecords = await queryDocuments('daily_photo_uploads', [
        { field: 'user_id', operator: '==', value: currentUserId },
        { field: 'last_upload_date', operator: '==', value: today }
      ]);

      const existingRecord = uploadRecords.length > 0 ? uploadRecords[0] : null;

      if (existingRecord && existingRecord.id) {
        // Update existing record
        await updateDocument('daily_photo_uploads', existingRecord.id, {
          upload_count: (existingRecord.upload_count || 0) + 1
        });
      } else {
        // Create new record
        await createDocument('daily_photo_uploads', {
          user_id: currentUserId,
          last_upload_date: today,
          upload_count: 1
        });
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
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${currentUserId}/${fileName}`;

      const { url } = await uploadFile(
        'chat_images',
        filePath,
        selectedFile,
        selectedFile.type
      );

      return url;
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
