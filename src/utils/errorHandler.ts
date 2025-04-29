
import { toast } from 'sonner';
import { createLogger } from '@/utils/logger';

const logger = createLogger('errorHandler');

// Error types
export enum ErrorSource {
  Firebase = 'FIREBASE',
  Authentication = 'AUTH',
  Messages = 'MESSAGES',
  Upload = 'UPLOAD',
  Network = 'NETWORK',
  Application = 'APP'
}

// Error severity levels
export enum ErrorSeverity {
  Info = 'INFO',
  Warning = 'WARNING',
  Error = 'ERROR',
  Critical = 'CRITICAL'
}

// Structured error object
interface AppError {
  source: ErrorSource;
  severity: ErrorSeverity;
  message: string;
  originalError?: any;
  timestamp: Date;
}

// Firebase specific error codes and messages
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'permission-denied': 'You don\'t have permission to access this data',
  'unauthorized': 'Authentication required to perform this action',
  'unavailable': 'The service is currently unavailable',
  'resource-exhausted': 'Too many requests, please try again later',
  'not-found': 'The requested data could not be found',
  'already-exists': 'This data already exists',
  'invalid-argument': 'Invalid input provided',
  'failed-precondition': 'Operation failed due to the current state of the system',
  'aborted': 'The operation was aborted',
};

// Central error handler
export const handleError = (
  error: any, 
  source: ErrorSource, 
  context: string = '', 
  severity: ErrorSeverity = ErrorSeverity.Error
): AppError => {
  // Extract error message and code if available
  let message = error?.message || 'An error occurred';
  const code = error?.code || '';
  
  // Add context if available
  if (context) {
    message = `${context}: ${message}`;
  }
  
  // Try to get friendly message for Firebase errors
  if (source === ErrorSource.Firebase && code) {
    const firebaseCode = code.split('/').pop();
    if (firebaseCode && FIREBASE_ERROR_MESSAGES[firebaseCode]) {
      message = FIREBASE_ERROR_MESSAGES[firebaseCode];
    }
  }
  
  // Create structured error object
  const appError: AppError = {
    source,
    severity,
    message,
    originalError: error,
    timestamp: new Date()
  };
  
  // Log error based on severity
  switch (severity) {
    case ErrorSeverity.Critical:
    case ErrorSeverity.Error:
      logger.error(message, error);
      break;
    case ErrorSeverity.Warning:
      logger.warn(message, error);
      break;
    case ErrorSeverity.Info:
      logger.debug(message, error);
      break;
  }
  
  // Show toast notification for errors and warnings
  if (severity === ErrorSeverity.Error || severity === ErrorSeverity.Critical) {
    toast.error(message);
  } else if (severity === ErrorSeverity.Warning) {
    toast.warning(message);
  }
  
  return appError;
};

// Specialized handlers for different error types
export const handleFirebaseError = (error: any, context: string = ''): AppError => {
  return handleError(error, ErrorSource.Firebase, context);
};

export const handleAuthError = (error: any, context: string = ''): AppError => {
  return handleError(error, ErrorSource.Authentication, context);
};

export const handleMessageError = (error: any, context: string = ''): AppError => {
  return handleError(error, ErrorSource.Messages, context);
};

// Helper to determine if an error is a permissions error
export const isPermissionError = (error: any): boolean => {
  if (!error) return false;
  
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';
  
  return (
    errorCode.includes('permission-denied') ||
    errorCode.includes('unauthorized') ||
    errorMessage.includes('permission') ||
    errorMessage.includes('access') ||
    errorMessage.includes('not authorized')
  );
};

// Helper to determine if an error is a network error
export const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';
  
  return (
    errorCode.includes('unavailable') ||
    errorCode.includes('network') ||
    errorMessage.includes('network') ||
    errorMessage.includes('offline') ||
    errorMessage.includes('connection')
  );
};
