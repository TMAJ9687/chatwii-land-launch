
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";

interface RulesPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

export const RulesPopup = ({ open, onOpenChange, onAccept }: RulesPopupProps) => {
  const navigate = useNavigate();
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const handleDecline = () => {
    setConfirmationOpen(true);
  };

  const handleConfirmDecline = async () => {
    // Sign out the user
    await auth.signOut();
    // Navigate to the landing page
    navigate("/");
  };

  const handleAccept = () => {
    onAccept();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Site Rules</DialogTitle>
            <DialogDescription>
              Please read and accept the following rules to continue using Chatwii.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2">
            <h3 className="font-semibold text-base">Respect and Kindness</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Treat all users with respect and kindness. No harassment, hate speech, or bullying of any kind will be tolerated.
            </p>
            
            <h3 className="font-semibold text-base">Appropriate Content</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Do not share explicit, offensive, or illegal content. This includes text, images, or links.
            </p>
            
            <h3 className="font-semibold text-base">Privacy</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Do not share personal identifying information about yourself or others, including real names, addresses, phone numbers, etc.
            </p>
            
            <h3 className="font-semibold text-base">Spam</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Do not spam the chat with repetitive messages, excessive emojis, or advertisements.
            </p>
            
            <h3 className="font-semibold text-base">Reporting</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Report any violations of these rules to the moderators immediately.
            </p>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
            <Button variant="outline" onClick={handleDecline}>
              Decline
            </Button>
            <Button type="submit" onClick={handleAccept}>
              Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are declining to follow the site rules so you'll be kicked out of the site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, go back</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDecline}>
              Yes, I understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
