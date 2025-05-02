import { Timestamp } from 'firebase/firestore';

/**
 * Helper function to handle Firebase Timestamp conversion
 * Converts any timestamp format to a standard ISO string
 */
export const formatTimestamp = (timestamp: string | Date | Timestamp | null | undefined): string => {
  if (!timestamp) return new Date().toISOString();
  
  // Handle Firebase Timestamp objects
  if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  
  // Handle Date objects
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  
  // Handle string timestamps
  if (typeof timestamp === 'string') {
    // Check if it's already ISO format
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timestamp)) {
      return timestamp;
    }
    // Otherwise convert to ISO
    return new Date(timestamp).toISOString();
  }
  
  // Handle numbers as milliseconds since epoch
  if (typeof timestamp === 'number') {
    return new Date(timestamp).toISOString();
  }
  
  // Fallback for unknown formats
  return String(timestamp);
};

/**
 * Get numeric timestamp value for comparison
 */
export const getTimestampValue = (timestamp: any): number => {
  if (!timestamp) return 0;
  
  // Handle Firebase Timestamp
  if (timestamp && typeof timestamp === 'object' && 'toMillis' in timestamp) {
    return timestamp.toMillis();
  }
  
  // Handle Date objects
  if (timestamp instanceof Date) {
    return timestamp.getTime();
  }
  
  // Handle ISO strings
  if (typeof timestamp === 'string') {
    return new Date(timestamp).getTime();
  }
  
  // Handle numbers
  if (typeof timestamp === 'number') {
    return timestamp;
  }
  
  return 0;
};
