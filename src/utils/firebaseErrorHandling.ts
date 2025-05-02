
import { toast } from "sonner";

type ErrorWithCode = {
  code?: string;
  message?: string;
};

/**
 * Handles Firebase errors and shows user-friendly toast messages
 */
export const handleFirebaseError = (error: unknown, fallbackMessage = "An unknown error occurred") => {
  console.error("Firebase operation error:", error);
  
  const err = error as ErrorWithCode;
  
  if (err.code) {
    // Common Firebase auth error codes
    switch (err.code) {
      case 'auth/invalid-email':
        toast.error("Invalid email address format.");
        break;
      case 'auth/user-disabled':
        toast.error("This account has been disabled.");
        break;
      case 'auth/user-not-found':
        toast.error("Account not found. Please check your credentials.");
        break;
      case 'auth/wrong-password':
        toast.error("Incorrect password. Please try again.");
        break;
      case 'auth/email-already-in-use':
        toast.error("Email already in use. Please login or use a different email.");
        break;
      case 'auth/weak-password':
        toast.error("Password is too weak. Please use a stronger password.");
        break;
      case 'auth/network-request-failed':
        toast.error("Network error. Please check your connection and try again.");
        break;
      case 'auth/too-many-requests':
        toast.error("Too many unsuccessful attempts. Please try again later.");
        break;
      case 'auth/operation-not-allowed':
        toast.error("Operation not allowed. Please contact support.");
        break;
      case 'permission-denied':
        toast.error("Permission denied. You may not have access to this resource.");
        break;
      case 'unavailable':
        toast.error("Service temporarily unavailable. Please try again later.");
        break;
      default:
        // Show the Firebase error message or fallback to generic message
        toast.error(err.message || fallbackMessage);
    }
    return;
  }
  
  // If no error code, show the error message or fallback
  toast.error(err.message || fallbackMessage);
};

/**
 * Safely execute a Firebase operation with automatic error handling
 */
export async function safeFirebaseOperation<T>(
  operation: () => Promise<T>, 
  errorMessage = "Operation failed"
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleFirebaseError(error, errorMessage);
    return null;
  }
}
