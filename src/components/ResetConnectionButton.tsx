import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { closeDbConnection } from '@/integrations/firebase/client';

export const ResetConnectionButton = () => {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (isResetting) return;
    
    setIsResetting(true);
    toast.info('Resetting connection...');
    
    try {
      // Step 1: Close all database connections
      await closeDbConnection();
      
      // Step 2: Clear any cached tokens
      const user = auth.currentUser;
      if (user) {
        // Force token refresh
        await user.getIdToken(true);
        toast.success('Auth token refreshed');
      }
      
      // Step 3: Clear any relevant localStorage items but don't log out
      const keysToPreserve = ['firebase_user_id', 'firebase_user_role'];
      const preservedValues: Record<string, string> = {};
      
      // Save values we want to keep
      keysToPreserve.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) preservedValues[key] = value;
      });
      
      // Clear all firebase-related items
      Object.keys(localStorage).forEach(key => {
        if (key.includes('firebase') || key.includes('presence') || key.includes('messages')) {
          localStorage.removeItem(key);
        }
      });
      
      // Restore preserved values
      Object.entries(preservedValues).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      
      // Step 4: Clear IndexedDB if available
      try {
        const dbs = await window.indexedDB.databases();
        dbs.forEach(db => {
          if (db.name && (db.name.includes('firebase') || db.name.includes('firestore'))) {
            window.indexedDB.deleteDatabase(db.name);
          }
        });
      } catch (e) {
        console.warn('Could not clear IndexedDB:', e);
      }
      
      // Step 5: Reload the page to establish fresh connections
      toast.success('Connection reset complete. Reloading page...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Error resetting connection:', error);
      toast.error('Failed to reset connection');
      setIsResetting(false);
    }
  };

  return (
    <Button 
      onClick={handleReset} 
      variant="outline" 
      size="sm"
      disabled={isResetting}
      className="flex items-center space-x-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
    >
      {isResetting ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
          <span>Resetting...</span>
        </>
      ) : (
        <span>Reset Connection</span>
      )}
    </Button>
  );
};
