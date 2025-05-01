
import { toast } from 'sonner';

/**
 * A service for consistent notifications throughout the app
 */
export const notificationService = {
  /**
   * Show an informational toast
   */
  info: (message: string, options?: any) => {
    return toast.info(message, {
      id: options?.id || `info-${Date.now()}`,
      duration: options?.duration || 4000,
      ...options
    });
  },
  
  /**
   * Show a success toast
   */
  success: (message: string, options?: any) => {
    return toast.success(message, {
      id: options?.id || `success-${Date.now()}`,
      duration: options?.duration || 4000,
      ...options
    });
  },
  
  /**
   * Show an error toast
   */
  error: (message: string, error?: any, options?: any) => {
    console.error(message, error);
    
    return toast.error(message, {
      id: options?.id || `error-${Date.now()}`,
      duration: options?.duration || 5000,
      ...options
    });
  },
  
  /**
   * Show a warning toast
   */
  warning: (message: string, options?: any) => {
    return toast.warning(message, {
      id: options?.id || `warning-${Date.now()}`,
      duration: options?.duration || 5000,
      ...options
    });
  },
  
  /**
   * Log a debug message (only in development)
   */
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
};
