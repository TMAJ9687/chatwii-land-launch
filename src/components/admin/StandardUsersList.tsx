import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BanUserModal } from "./modals/BanUserModal";
import { UpgradeUserModal } from "./modals/UpgradeUserModal";
import { EditUserModal } from "./modals/EditUserModal";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const StandardUsersList = () => {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any>(null);

  const { data: standardUsers, isLoading, refetch } = useQuery({
    queryKey: ["online-standard-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "standard")
        .eq("visibility", "online")
        .order("nickname");

      if (error) throw error;
      return data;
    },
  });

  const handleKick = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ visibility: "offline" })
      .eq("id", userId);

    if (error) {
      toast({ title: "Error", description: "Failed to kick user", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "User kicked successfully" });
      refetch();
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
    refetch();
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
    refetch();
  };

  const handleEditUser = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      toast({ title: "Error", description: "Could not fetch user", variant: "destructive" });
      return;
    }
    setUserToEdit(data);
    setEditUserModalOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading online users...</div>;
  }

  if (!standardUsers?.length) {
    return <div className="text-center py-4">No online standard users found.</div>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nickname</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standardUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.nickname}</TableCell>
                <TableCell>{user.age || 'N/A'}</TableCell>
                <TableCell>{user.gender || 'N/A'}</TableCell>
                <TableCell>{user.country || 'N/A'}</TableCell>
                <TableCell>
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
                      onClick={() => {
                        setSelectedUser(user);
                        setShowBanModal(true);
                      }}
                    >
                      Ban
                    </Button>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditUser(user.id)}
                    >
                      Edit
                    </Button>

                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUpgradeModal(true);
                      }}
                    >
                      Upgrade
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedUser && (
        <>
          <BanUserModal
            isOpen={showBanModal}
            onClose={() => {
              setShowBanModal(false);
              setSelectedUser(null);
            }}
            onConfirm={(reason, duration) => handleBan(selectedUser.id, reason, duration)}
            username={selectedUser.nickname}
          />

          <UpgradeUserModal
            isOpen={showUpgradeModal}
            onClose={() => {
              setShowUpgradeModal(false);
              setSelectedUser(null);
            }}
            onConfirm={(duration) => handleUpgrade(selectedUser.id, duration)}
            username={selectedUser.nickname}
          />
        </>
      )}

      {editUserModalOpen && (
        <EditUserModal
          isOpen={editUserModalOpen}
          onClose={() => {
            setEditUserModalOpen(false);
            setUserToEdit(null);
          }}
          user={userToEdit}
          refreshList={refetch}
        />
      )}
    </>
  );
};
