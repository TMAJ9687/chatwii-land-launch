
import { format } from 'date-fns';

interface SimpleChatBubbleProps {
  content: string;
  timestamp: string;
  isCurrentUser: boolean;
  isRead?: boolean;
  showReadStatus?: boolean;
}

export const SimpleChatBubble = ({
  content,
  timestamp,
  isCurrentUser,
  isRead = false,
  showReadStatus = true
}: SimpleChatBubbleProps) => {
  // Format timestamp for display
  const formattedTime = () => {
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch (e) {
      return ''; // Return empty string if timestamp is invalid
    }
  };
  
  return (
    <div 
      className={`flex mb-4 ${isCurrentUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`rounded-lg px-3 py-2 max-w-[80%] relative group ${
          isCurrentUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted"
        }`}
      >
        <p className="break-words">{content}</p>
        
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-muted-foreground">
            {formattedTime()}
          </span>
          
          {isCurrentUser && showReadStatus && (
            <span className={isRead ? "text-green-500 ml-1" : "text-muted-foreground/40 ml-1"}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>
        
        <div className="absolute right-0 top-0 flex items-center gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="h-6 w-6 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2 1m2-1l-2-1m2 1v2.5M12 19l-2 1m2-1l-2-1m2 1v2.5" />
            </svg>
          </button>
          <button className="h-6 w-6 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
