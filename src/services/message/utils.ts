
import { Timestamp } from "firebase/firestore";
import { createLogger } from "@/utils/logger";

const logger = createLogger("messageUtils");

/**
 * Helper to convert Firestore timestamp to ISO string
 */
export const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString();
  
  if (timestamp instanceof Timestamp) {
    return new Date(timestamp.toMillis()).toISOString();
  }
  
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  
  if (typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date((timestamp as any).seconds * 1000).toISOString();
  }
  
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  
  return new Date().toISOString();
};
