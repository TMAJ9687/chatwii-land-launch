
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BanUserModal } from "../modals/BanUserModal";
import { UpgradeUserModal } from "../modals/UpgradeUserModal";
import { EditUserModal } from "../modals/EditUserModal";

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

  const handleKick = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ visibility: "offline" })
      .eq("id", userId);

    if (error) {
      toast({ title: "Error", description: "Failed to kick user", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "User kicked successfully" });
      onActionComplete();
    }
  };

  const handleBan = async (userId: string, reason: string, duration: string) => {
    const expiresAt = duration === 'permanent' ? null : 
      new Date(Date.now() + {
        '1day': 24 * 60 * 60 * 1000,
        '1week': 7 * 24 * 60 * 60 * 1000,
        '1month': 30 * 24 * 60 * 60 * 1000,
      }[duration] || 0).toISOString();

    const { error: banError } = await supabase
      .from('bans')
      .insert({
        user_id: userId,
        reason,
        expires_at: expiresAt,
      });

    if (banError) {
      toast({ title: "Error", description: "Failed to ban user", variant: "destructive" });
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ visibility: 'offline' })
      .eq('id', userId);

    if (updateError) {
      toast({ title: "Error", description: "Failed to update user status", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "User banned successfully" });
    onActionComplete();
  };

  const handleUpgrade = async (userId: string, duration: string) => {
    const endDate = duration === 'permanent' ? null : 
      new Date(Date.now() + {
        '1month': 30 * 24 * 60 * 60 * 1000,
        '3months': 90 * 24 * 60 * 60 * 1000,
      }[duration] || 0).toISOString();

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        role: 'vip',
        vip_status: true 
      })
      .eq('id', userId);

    if (profileError) {
      toast({ title: "Error", description: "Failed to upgrade user", variant: "destructive" });
      return;
    }

    const { error: subscriptionError } = await supabase
      .from('vip_subscriptions')
      .insert({
        user_id: userId,
        start_date: new Date().toISOString(),
        end_date: endDate,
        is_active: true,
        payment_provider: 'admin_granted'
      });

    if (subscriptionError) {
      toast({ title: "Error", description: "Failed to create subscription", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "User upgraded successfully" });
    onActionComplete();
  };

  return (
    <div className="flex gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">Kick</Button>
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
            <AlertDialogAction onClick={() => handleKick(user.id)}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setShowBanModal(true)}
      >
        Ban
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
      >
        Upgrade
      </Button>

      <BanUserModal
        isOpen={showBanModal}
        onClose={() => setShowBanModal(false)}
        onConfirm={(reason, duration) => handleBan(user.id, reason, duration)}
        username={user.nickname}
      />

      <UpgradeUserModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onConfirm={(duration) => handleUpgrade(user.id, duration)}
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
