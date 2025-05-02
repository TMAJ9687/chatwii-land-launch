
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FirebaseIndexMessageProps {
  error: string | null;
  indexUrl?: string; // Make indexUrl optional with a default
}

export const FirebaseIndexMessage = ({ error, indexUrl = "https://console.firebase.google.com" }: FirebaseIndexMessageProps) => {
  if (!error) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex flex-col gap-2">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-yellow-800">Firebase Permission Issue</h4>
          <p className="text-sm text-yellow-700 mt-1">
            {error}
          </p>
          <p className="text-xs text-yellow-600 mt-2">
            This is likely due to Firebase security rules. Attempting to proceed in development mode.
          </p>
        </div>
      </div>
      <div className="mt-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7 bg-yellow-100 border-yellow-200 text-yellow-800 hover:bg-yellow-200"
          onClick={() => window.open(indexUrl, '_blank')}
        >
          Open Firebase Console
        </Button>
      </div>
    </div>
  );
};
