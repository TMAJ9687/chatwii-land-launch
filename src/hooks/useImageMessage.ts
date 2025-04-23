
import { useRef, useState } from 'react';
import { useImageUpload } from './useImageUpload';
import { toast } from 'sonner';

export const useImageMessage = (
  currentUserId: string | null,
  canSendToUser: boolean,
  hasReachedLimit: boolean,
  isVip: boolean,
  dailyLimit: number
) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    selectedFile,
    previewUrl,
    isUploading: imageUploading,
    handleFileSelect,
    uploadImage,
    clearFileSelection,
    checkDailyUploadLimit,
    updateDailyUploadCount
  } = useImageUpload(currentUserId);

  const triggerFileInput = () => {
    if (!currentUserId) {
      toast.error("You must be logged in to send images");
      return;
    }
    
    if (!canSendToUser) {
      toast.error("You cannot send messages to this user");
      return;
    }

    if (hasReachedLimit && !isVip) {
      toast.error(`You've reached your daily limit of ${dailyLimit} images`);
      return;
    }

    fileInputRef.current?.click();
  };

  const handleImageUpload = async () => {
    if (!currentUserId) {
      toast.error("You must be logged in to send images");
      return null;
    }
    
    if (hasReachedLimit && !isVip) {
      toast.error(`You've reached your daily limit of ${dailyLimit} images`);
      return null;
    }

    const canUpload = await checkDailyUploadLimit();
    if (!canUpload && !isVip) {
      toast.error(`You've reached your daily limit of ${dailyLimit} images`);
      return null;
    }

    const imageUrl = await uploadImage();
    if (imageUrl) {
      await updateDailyUploadCount();
      clearFileSelection();
      return imageUrl;
    }
    return null;
  };

  return {
    fileInputRef,
    selectedFile,
    previewUrl,
    imageUploading,
    handleFileSelect,
    clearFileSelection,
    triggerFileInput,
    handleImageUpload
  };
};
