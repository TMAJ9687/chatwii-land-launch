
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
  const { handleLogout } = useLogout("/feedback");

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowConfirmation(true)}
        className="rounded-full"
      >
        <LogOut className="h-5 w-5" />
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
            <AlertDialogAction onClick={handleLogout}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
