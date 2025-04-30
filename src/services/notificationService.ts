
import { toast } from 'sonner';

// Centralized notification service for consistent messaging
export const notificationService = {
  // Success notifications
  success: (message: string) => {
    toast.success(message);
    console.log('[Success]', message);
  },
  
  // Informational notifications
  info: (message: string) => {
    toast.info(message);
    console.log('[Info]', message);
  },
  
  // Warning notifications
  warning: (message: string) => {
    toast.warning(message);
    console.warn('[Warning]', message);
  },
  
  // Error notifications
  error: (message: string, error?: any) => {
    toast.error(message);
    if (error) {
      console.error('[Error]', message, error);
    } else {
      console.error('[Error]', message);
    }
  },
  
  // Connection status notifications
  connectionChange: (connected: boolean) => {
    if (connected) {
      toast.success('Connection established');
      console.log('[Connection] Established');
    } else {
      toast.error('Connection lost');
      console.warn('[Connection] Lost');
    }
  },
  
  // Debug message (only appears in console, not as toast)
  debug: (message: string, data?: any) => {
    if (data) {
      console.debug('[Debug]', message, data);
    } else {
      console.debug('[Debug]', message);
    }
  }
};

// Function to log Firebase database paths to help with debugging
export const logDatabasePath = (path: string, description: string = '') => {
  console.group(`Database Path ${description ? '- ' + description : ''}`);
  console.log(`Path: ${path}`);
  console.log(`Full URL: https://chatwiilovable-7ae1d-default-rtdb.europe-west1.firebasedatabase.app/${path}`);
  console.groupEnd();
};
