
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BanUserModal } from "../modals/BanUserModal";
import { UpgradeUserModal } from "../modals/UpgradeUserModal";
import { EditUserModal } from "../modals/EditUserModal";
import { useAdminActions, BanDuration, VipDuration } from "@/hooks/useAdminActions";
import { Loader2 } from "lucide-react";

interface UserActionsProps {
  user: {
    id: string;
    nickname: string;
    role: string;
  };
  onActionComplete: () => void;
}

export const UserActions = ({ user, onActionComplete }: UserActionsProps) => {
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const { kickUser, banUser, upgradeToVip, isProcessing } = useAdminActions();

  const handleKick = async () => {
    const success = await kickUser(user.id);
    if (success) onActionComplete();
  };

  const handleBan = async (reason: string, duration: string) => {
    const success = await banUser(user.id, reason, duration as BanDuration);
    if (success) onActionComplete();
  };

  const handleUpgrade = async (duration: string) => {
    const success = await upgradeToVip(user.id, duration as VipDuration);
    if (success) onActionComplete();
  };

  return (
    <div className="flex gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            disabled={isProcessing}
          >
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

      <Button 
        variant="outline"
        size="sm"
        onClick={() => setShowUpgradeModal(true)}
        disabled={isProcessing}
      >
        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upgrade'}
      </Button>

      <BanUserModal
        isOpen={showBanModal}
        onClose={() => setShowBanModal(false)}
        onConfirm={(reason, duration) => handleBan(reason, duration)}
        username={user.nickname}
      />

      <UpgradeUserModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onConfirm={(duration) => handleUpgrade(duration)}
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
