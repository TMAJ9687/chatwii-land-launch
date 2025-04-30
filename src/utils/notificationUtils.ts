
import { toast } from "sonner";

// Store last notification time by sender ID
const notificationCooldowns: Record<string, number> = {};

// Track shown notifications to prevent duplicates
interface NotificationTracker {
  text: string;
  timestamp: number;
}
let recentNotifications: NotificationTracker[] = [];

// Constants
const COOLDOWN_PERIOD = 120000; // 2 minute cooldown per sender (increased from 1 minute)
const DUPLICATE_TIMEOUT = 30000; // 30 seconds for duplicate detection (increased from 10 seconds)
const MAX_RECENT_NOTIFICATIONS = 20; // Only track the last 20 notifications
const GLOBAL_COOLDOWN = 5000; // Minimum 5 seconds between any notifications (increased from 3 seconds)

// Load from localStorage
let lastGlobalNotification = 0;
try {
  const savedLastTime = localStorage.getItem('lastNotificationTime');
  if (savedLastTime) {
    lastGlobalNotification = parseInt(savedLastTime, 10);
  }
  
  const savedTracker = localStorage.getItem('notificationTracker');
  if (savedTracker) {
    recentNotifications = JSON.parse(savedTracker);
  }
} catch (e) {
  console.warn('Error loading notification state:', e);
  recentNotifications = [];
  lastGlobalNotification = 0;
}

// Save notification state to persist between refreshes
const saveNotificationState = () => {
  try {
    localStorage.setItem('lastNotificationTime', String(lastGlobalNotification));
    localStorage.setItem('notificationTracker', JSON.stringify(recentNotifications));
  } catch (e) {
    console.warn('Error saving notification state:', e);
  }
};

// Cleanup old notifications periodically
const cleanupOldNotifications = () => {
  const now = Date.now();
  recentNotifications = recentNotifications.filter(
    n => now - n.timestamp < DUPLICATE_TIMEOUT
  );
  
  // Also clean up old cooldowns
  Object.keys(notificationCooldowns).forEach(senderId => {
    if (now - notificationCooldowns[senderId] > COOLDOWN_PERIOD) {
      delete notificationCooldowns[senderId];
    }
  });
  
  saveNotificationState();
};

/**
 * Show a debounced notification for messages
 */
export const showMessageNotification = (
  senderId: string,
  senderName: string,
  messagePreview?: string,
  options?: { onClick?: () => void }
): boolean => {
  const now = Date.now();
  
  // Clean up old notifications first
  cleanupOldNotifications();
  
  // Check global cooldown
  if (now - lastGlobalNotification < GLOBAL_COOLDOWN) {
    return false;
  }
  
  // Check sender-specific cooldown
  if (notificationCooldowns[senderId] && 
      now - notificationCooldowns[senderId] < COOLDOWN_PERIOD) {
    return false;
  }
  
  // Create notification text
  const text = messagePreview 
    ? `New message from ${senderName}: ${messagePreview.substring(0, 30)}${messagePreview.length > 30 ? '...' : ''}`
    : `New message from ${senderName}`;
  
  // Check for duplicate notification
  const isDuplicate = recentNotifications.some(
    n => n.text === text && now - n.timestamp < DUPLICATE_TIMEOUT
  );
  
  if (isDuplicate) {
    return false;
  }
  
  // Show notification
  toast(text, {
    duration: 4000,
    onDismiss: options?.onClick  // Using onDismiss instead of onClick
  });
  
  // Update tracking state
  lastGlobalNotification = now;
  notificationCooldowns[senderId] = now;
  
  // Add to recent notifications and limit the array size
  recentNotifications.push({ text, timestamp: now });
  if (recentNotifications.length > MAX_RECENT_NOTIFICATIONS) {
    recentNotifications = recentNotifications.slice(-MAX_RECENT_NOTIFICATIONS);
  }
  
  // Save state
  saveNotificationState();
  
  return true;
};

/**
 * Reset all notification cooldowns - use when changing conversations
 */
export const resetNotificationCooldowns = (senderId?: string) => {
  if (senderId) {
    delete notificationCooldowns[senderId];
  } else {
    Object.keys(notificationCooldowns).forEach(key => {
      delete notificationCooldowns[key];
    });
  }
};
