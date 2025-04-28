
import { useState, useEffect, useRef } from 'react';

export const useImageCounter = (currentUserId: string | null) => {
  const [imagesUsedToday, setImagesUsedToday] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [isVip, setIsVip] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    // Mock implementation
    if (isMountedRef.current) {
      setDailyLimit(10);
      setIsVip(false);
      setImagesUsedToday(0);
    }

    return () => {};
  }, [currentUserId]);

  return {
    imagesUsedToday,
    dailyLimit,
    isVip,
    remainingImages: isVip ? Infinity : Math.max(0, dailyLimit - imagesUsedToday),
    hasReachedLimit: !isVip && imagesUsedToday >= dailyLimit
  };
};
