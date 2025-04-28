
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./client";
import { toast } from "sonner";

// Upload a file to Firebase Storage
export const uploadFile = async (
  bucket: string,
  filePath: string,
  file: File | Blob,
  contentType?: string
) => {
  const storageRef = ref(storage, `${bucket}/${filePath}`);
  const metadata = contentType ? { contentType } : undefined;
  
  try {
    console.log(`Uploading file to ${bucket}/${filePath}`);
    const snapshot = await uploadBytes(storageRef, file, metadata);
    console.log('File uploaded successfully');
    
    // Try multiple times to get download URL due to potential CORS issues
    let downloadURL;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        downloadURL = await getDownloadURL(snapshot.ref);
        console.log('Download URL retrieved:', downloadURL);
        break;
      } catch (error: any) {
        console.warn(`Attempt ${attempts + 1}: Failed to get download URL`, error);
        attempts++;
        if (attempts >= maxAttempts) {
          throw error;
        }
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!downloadURL) {
      throw new Error("Could not retrieve download URL after multiple attempts");
    }
    
    return {
      path: snapshot.ref.fullPath,
      url: downloadURL
    };
  } catch (error: any) {
    console.error("Error during file upload:", error);
    
    // Provide helpful error message for CORS issues
    if (error.message?.includes('CORS')) {
      toast.error("CORS error: Please configure Firebase Storage CORS settings");
      console.error(`
        CORS error detected. To fix this issue:
        1. Go to Firebase Console > Storage
        2. Click on the Rules tab
        3. Add CORS configuration in your firebase.json file:
        {
          "storage": {
            "cors": [
              {
                "origin": ["*"],
                "method": ["GET", "POST", "PUT", "DELETE"],
                "maxAgeSeconds": 3600
              }
            ]
          }
        }
        4. Run 'firebase deploy'
      `);
    } else {
      toast.error(`Upload failed: ${error.message || "Unknown error"}`);
    }
    
    throw error;
  }
};

// Get download URL for a file
export const getFileDownloadURL = async (path: string) => {
  try {
    console.log(`Getting download URL for ${path}`);
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    console.log('Download URL retrieved successfully');
    return url;
  } catch (error) {
    console.error("Error getting download URL:", error);
    throw error;
  }
};

// Delete a file from storage
export const deleteFile = async (fullPath: string) => {
  try {
    console.log(`Deleting file at ${fullPath}`);
    const storageRef = ref(storage, fullPath);
    await deleteObject(storageRef);
    console.log('File deleted successfully');
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};
