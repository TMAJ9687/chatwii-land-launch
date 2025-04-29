import { formatDistanceToNow } from 'date-fns';

export interface MessageTimestampProps {
  timestamp: string | Date | any;
}

export const formatTimestamp = (timestamp: string | Date | any): string => {
  if (!timestamp) return '';
  
  try {
    let date: Date;
    
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'object' && 'seconds' in timestamp) {
      // Firebase Timestamp object
      date = new Date((timestamp as any).seconds * 1000);
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return '';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // If it's today, just show the time
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const timestampDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (timestampDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If it's within the last 7 days, show relative time
    if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    
    // Otherwise, show the date
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return '';
  }
};

export const MessageTimeFormatter: React.FC<MessageTimestampProps> = ({ timestamp }) => {
  const formattedTime = formatTimestamp(timestamp);
  
  return <span className="text-xs text-muted-foreground">{formattedTime}</span>;
};
