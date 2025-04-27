
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./client";

// Upload a file to Firebase Storage
export const uploadFile = async (
  bucket: string,
  filePath: string,
  file: File | Blob,
  contentType?: string
) => {
  const storageRef = ref(storage, `${bucket}/${filePath}`);
  const metadata = contentType ? { contentType } : undefined;
  
  const snapshot = await uploadBytes(storageRef, file, metadata);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return {
    path: snapshot.ref.fullPath,
    url: downloadURL
  };
};

// Get download URL for a file
export const getFileDownloadURL = async (fullPath: string) => {
  const storageRef = ref(storage, fullPath);
  return await getDownloadURL(storageRef);
};

// Delete a file from storage
export const deleteFile = async (fullPath: string) => {
  const storageRef = ref(storage, fullPath);
  await deleteObject(storageRef);
  return true;
};
