
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useImageCounter = (currentUserId: string | null) => {
  const [imagesUsedToday, setImagesUsedToday] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [isVip, setIsVip] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!currentUserId) return;

    abortControllerRef.current?.abort(); // Abort any existing request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const fetchImageCountData = async () => {
      try {
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

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, vip_status')
          .eq('id', currentUserId)
          .abortSignal(signal)
          .maybeSingle();
        
        setIsVip(profile?.role === 'vip' || profile?.vip_status === true);

        const today = new Date().toISOString().split('T')[0];
        const { data: uploadRecord } = await supabase
          .from('daily_photo_uploads')
          .select('upload_count')
          .eq('user_id', currentUserId)
          .eq('last_upload_date', today)
          .abortSignal(signal)
          .maybeSingle();

        setImagesUsedToday(uploadRecord?.upload_count || 0);
      } catch (error) {
        if (!signal.aborted) {
          console.error('Error fetching image count data:', error);
        }
      }
    };

    fetchImageCountData();

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
