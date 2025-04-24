
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BanUserModal } from "../modals/BanUserModal";
import { EditUserModal } from "../modals/EditUserModal";
import { VipUser } from "@/hooks/useVipUsers";
import { useAdminActions, BanDuration } from "@/hooks/useAdminActions";
import { Loader2 } from "lucide-react";

interface VipUserActionsProps {
  user: VipUser;
  onActionComplete: () => void;
}

export const VipUserActions = ({ user, onActionComplete }: VipUserActionsProps) => {
  const [showBanModal, setShowBanModal] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const { kickUser, banUser, downgradeFromVip, isProcessing } = useAdminActions();

  const handleKick = async () => {
    const success = await kickUser(user.id);
    if (success) onActionComplete();
  };

  const handleBan = async (reason: string, duration: string) => {
    const success = await banUser(user.id, reason, duration as BanDuration);
    if (success) onActionComplete();
  };

  const handleDowngrade = async () => {
    const success = await downgradeFromVip(user.id);
    if (success) onActionComplete();
  };

  return (
    <div className="flex gap-2">
      {user.visibility === 'online' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kick'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kick User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to kick {user.nickname}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleKick}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setShowBanModal(true)}
        disabled={isProcessing}
      >
        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ban'}
      </Button>

      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setEditUserModalOpen(true)}
      >
        Edit
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Downgrade'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Downgrade User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to downgrade {user.nickname} to Standard?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDowngrade}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BanUserModal
        isOpen={showBanModal}
        onClose={() => setShowBanModal(false)}
        onConfirm={(reason, duration) => handleBan(reason, duration)}
        username={user.nickname}
      />

      <EditUserModal
        isOpen={editUserModalOpen}
        onClose={() => setEditUserModalOpen(false)}
        user={user}
        refreshList={onActionComplete}
      />
    </div>
  );
};
