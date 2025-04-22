
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BanUserModal } from "./modals/BanUserModal";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const VIPUsersList = () => {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showBanModal, setShowBanModal] = useState(false);

  const { data: vipUsers, isLoading, refetch } = useQuery({
    queryKey: ["vip-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          vip_subscriptions (
            end_date,
            is_active
          )
        `)
        .eq("role", "vip")
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

  const handleDowngrade = async (userId: string) => {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        role: 'standard',
        vip_status: false 
      })
      .eq('id', userId);

    if (profileError) {
      toast({ title: "Error", description: "Failed to downgrade user", variant: "destructive" });
      return;
    }

    const { error: subscriptionError } = await supabase
      .from('vip_subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (subscriptionError) {
      toast({ title: "Error", description: "Failed to update subscription", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "User downgraded successfully" });
    refetch();
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading VIP users...</div>;
  }

  if (!vipUsers?.length) {
    return <div className="text-center py-4">No VIP users found.</div>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nickname</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vipUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.nickname}</TableCell>
                <TableCell>
                  <span className={`inline-flex h-2 w-2 rounded-full ${user.visibility === 'online' ? 'bg-green-500' : 'bg-gray-300'} mr-2`}></span>
                  {user.visibility === 'online' ? 'Online' : 'Offline'}
                </TableCell>
                <TableCell>
                  {user.vip_subscriptions?.[0]?.is_active ? (
                    <span className="text-green-600">
                      Active until {new Date(user.vip_subscriptions[0].end_date).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-red-600">Expired</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {user.visibility === 'online' && (
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
                    )}
                    
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
                      onClick={() => console.log('Edit user:', user.id)}
                    >
                      Edit
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">Downgrade</Button>
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
                          <AlertDialogAction onClick={() => handleDowngrade(user.id)}>
                            Confirm
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedUser && (
        <BanUserModal
          isOpen={showBanModal}
          onClose={() => {
            setShowBanModal(false);
            setSelectedUser(null);
          }}
          onConfirm={(reason, duration) => handleBan(selectedUser.id, reason, duration)}
          username={selectedUser.nickname}
        />
      )}
    </>
  );
};
