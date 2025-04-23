
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useImageCounter = (currentUserId: string | null) => {
  const [imagesUsedToday, setImagesUsedToday] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(10); // Default limit
  const [isVip, setIsVip] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!currentUserId) return;

    // Create new abort controller for this effect instance
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const fetchImageCountData = async () => {
      try {
        // Fetch site settings for image limit
        const { data: siteSettings } = await supabase
          .from('site_settings')
          .select('settings')
          .eq('id', 1)
          .abortSignal(signal)
          .maybeSingle();
        
        if (siteSettings?.settings && 
            typeof siteSettings.settings === 'object' && 
            siteSettings.settings !== null &&
            'standard_photo_limit' in siteSettings.settings) {
          setDailyLimit(Number(siteSettings.settings.standard_photo_limit) || 10);
        }

        // Check if user is VIP
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, vip_status')
          .eq('id', currentUserId)
          .abortSignal(signal)
          .maybeSingle();
        
        setIsVip(profile?.role === 'vip' || profile?.vip_status === true);

        // Get today's usage
        const today = new Date().toISOString().split('T')[0];
        const { data: uploadRecord } = await supabase
          .from('daily_photo_uploads')
          .select('upload_count')
          .eq('user_id', currentUserId)
          .eq('last_upload_date', today)
          .abortSignal(signal)
          .maybeSingle();

        if (uploadRecord) {
          setImagesUsedToday(uploadRecord.upload_count);
        } else {
          setImagesUsedToday(0);
        }
      } catch (error) {
        // Only log errors if not aborted
        if (!signal.aborted) {
          console.error('Error fetching image count data:', error);
        }
      }
    };

    fetchImageCountData();

    // Cleanup function to abort any pending requests when unmounting
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [currentUserId]);

  return {
    imagesUsedToday,
    dailyLimit,
    isVip,
    remainingImages: isVip ? Infinity : Math.max(0, dailyLimit - imagesUsedToday),
    hasReachedLimit: !isVip && imagesUsedToday >= dailyLimit
  };
};
