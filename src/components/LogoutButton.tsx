
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLogout } from "@/hooks/useLogout";

export const LogoutButton = () => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { handleLogout, isLoggingOut } = useLogout("/feedback");

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowConfirmation(true)}
        className="rounded-full" 
        disabled={isLoggingOut}
      >
        <LogOut className="h-5 w-5 text-red-600" />
      </Button>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logging out?</AlertDialogTitle>
            <AlertDialogDescription>
              Leaving so soon? We'll miss you!! :(
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogout} 
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out..." : "Yes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
