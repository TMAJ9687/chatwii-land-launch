
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./client";
import { toast } from "sonner";

// Upload a file to Firebase Storage with CORS handling
export const uploadFile = async (
  bucket: string,
  filePath: string,
  file: File | Blob,
  contentType?: string
) => {
  const storageRef = ref(storage, `${bucket}/${filePath}`);
  const metadata = contentType ? { contentType, cacheControl: 'public, max-age=31536000' } : undefined;
  
  try {
    console.log(`Uploading file to ${bucket}/${filePath}`);
    const snapshot = await uploadBytes(storageRef, file, metadata);
    console.log('File uploaded successfully');
    
    // Get download URL with proper retry and error handling
    const downloadURL = await getDownloadURLSafely(snapshot.ref);
    
    return {
      path: snapshot.ref.fullPath,
      url: downloadURL
    };
  } catch (error: any) {
    console.error("Error during file upload:", error);
    
    // Provide helpful error message for CORS issues
    if (error.message?.includes('CORS')) {
      toast.error("Storage access error - check CORS settings", {
        duration: 6000,
        description: "Add your domain to Firebase Storage CORS settings"
      });
      console.error(`
        CORS error detected. Please update Firebase Storage CORS settings in Firebase Console:
        1. Go to Firebase Console > Storage > Rules
        2. Add this CORS configuration:
        [
          {
            "origin": ["*"],
            "method": ["GET", "POST", "PUT", "DELETE"],
            "maxAgeSeconds": 3600
          }
        ]
        3. Save changes and retry
      `);
    } else {
      toast.error(`Upload failed: ${error.message || "Unknown error"}`);
    }
    
    throw error;
  }
};

// Helper function to safely get download URL with retries
async function getDownloadURLSafely(ref: any): Promise<string> {
  const maxAttempts = 3;
  let lastError;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Add cache-busting parameter to avoid CORS issues
      const url = await getDownloadURL(ref);
      const cacheBuster = `?t=${Date.now()}`;
      
      // Test URL with a HEAD request to verify CORS is working
      if (attempt === 0) {
        try {
          const testResponse = await fetch(url, { method: 'HEAD' });
          if (!testResponse.ok) {
            console.warn("Storage URL accessible but may have CORS issues");
          }
        } catch (e) {
          console.warn("Could not verify storage URL accessibility:", e);
        }
      }
      
      return url + cacheBuster;
    } catch (error: any) {
      console.warn(`Attempt ${attempt + 1}: Failed to get download URL`, error);
      lastError = error;
      
      // Wait longer between each retry
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  
  throw lastError || new Error("Failed to get download URL after multiple attempts");
}

// Get download URL for a file with error handling
export const getFileDownloadURL = async (path: string) => {
  try {
    console.log(`Getting download URL for ${path}`);
    const storageRef = ref(storage, path);
    const url = await getDownloadURLSafely(storageRef);
    console.log('Download URL retrieved successfully');
    return url;
  } catch (error) {
    console.error("Error getting download URL:", error);
    throw error;
  }
};

// Delete a file from storage with better error handling
export const deleteFile = async (fullPath: string) => {
  try {
    console.log(`Deleting file at ${fullPath}`);
    const storageRef = ref(storage, fullPath);
    await deleteObject(storageRef);
    console.log('File deleted successfully');
    return true;
  } catch (error: any) {
    // Don't throw for non-critical storage operations
    if (error.code === 'storage/object-not-found') {
      console.log('File already deleted or does not exist');
      return true;
    }
    console.error("Error deleting file:", error);
    return false; // Return false instead of throwing to avoid crashing on non-critical operations
  }
};
