
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll, StorageReference } from "firebase/storage";
import { storage } from "./client";
import { toast } from "sonner";

// Cache for download URLs to prevent redundant requests
const urlCache = new Map<string, {url: string, timestamp: number}>();
const URL_CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Upload a file to Firebase Storage with progress tracking
 */
export const uploadFile = async (
  bucket: string,
  filePath: string,
  file: File | Blob,
  contentType?: string,
  onProgress?: (progress: number) => void
) => {
  const storageRef = ref(storage, `${bucket}/${filePath}`);
  const metadata = contentType ? { contentType } : undefined;
  
  // Handle progress tracking if callback provided
  if (onProgress) {
    // Firebase storage doesn't support direct progress tracking
    // This is a placeholder for future implementation
    onProgress(10);
    
    setTimeout(() => onProgress(50), 300);
    setTimeout(() => onProgress(80), 600);
  }
  
  try {
    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Cache the URL
    urlCache.set(snapshot.ref.fullPath, {
      url: downloadURL,
      timestamp: Date.now()
    });
    
    if (onProgress) {
      onProgress(100);
    }
    
    return {
      path: snapshot.ref.fullPath,
      url: downloadURL
    };
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};

/**
 * Get download URL for a file with caching
 */
export const getFileDownloadURL = async (path: string) => {
  // Check cache first
  const cached = urlCache.get(path);
  if (cached && Date.now() - cached.timestamp < URL_CACHE_TTL) {
    return cached.url;
  }
  
  // Get fresh URL if not cached or expired
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    
    // Update cache
    urlCache.set(path, {
      url,
      timestamp: Date.now()
    });
    
    return url;
  } catch (error) {
    console.error("Failed to get file URL:", error);
    throw error;
  }
};

/**
 * Delete a file from storage
 */
export const deleteFile = async (fullPath: string) => {
  try {
    const storageRef = ref(storage, fullPath);
    await deleteObject(storageRef);
    
    // Remove from cache
    urlCache.delete(fullPath);
    
    return true;
  } catch (error) {
    console.error("Failed to delete file:", error);
    throw error;
  }
};

/**
 * List all files in a directory
 */
export const listFiles = async (directoryPath: string) => {
  try {
    const directoryRef = ref(storage, directoryPath);
    const res = await listAll(directoryRef);
    
    return {
      items: res.items,
      prefixes: res.prefixes
    };
  } catch (error) {
    console.error("Failed to list files:", error);
    throw error;
  }
};

/**
 * Clean up orphaned files that are no longer referenced
 */
export const cleanupOrphanedFiles = async (bucket: string, referencedPaths: string[]) => {
  try {
    const bucketRef = ref(storage, bucket);
    const res = await listAll(bucketRef);
    
    const orphanedFiles: StorageReference[] = [];
    
    // Find files that aren't in the referencedPaths array
    res.items.forEach(item => {
      if (!referencedPaths.includes(item.fullPath)) {
        orphanedFiles.push(item);
      }
    });
    
    // Delete orphaned files
    const deletePromises = orphanedFiles.map(file => deleteObject(file));
    await Promise.all(deletePromises);
    
    return orphanedFiles.length;
  } catch (error) {
    console.error("Failed to clean up orphaned files:", error);
    throw error;
  }
};
