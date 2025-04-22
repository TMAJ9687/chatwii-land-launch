
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const BannedUsersList = () => {
  const { toast } = useToast();
  
  const { data: bannedUsers, isLoading, refetch } = useQuery({
    queryKey: ["banned-users"],
    queryFn: async () => {
      // The previous query was ambiguous with relationships
      // We'll use aliasing to be specific about the columns we want
      const { data, error } = await supabase
        .from("bans")
        .select(`
          *,
          banned_user:profiles!bans_user_id_fkey (
            nickname
          ),
          admin:profiles!bans_admin_id_fkey (
            nickname
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleUnban = async (userId: string) => {
    const { error } = await supabase
      .from("bans")
      .delete()
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Error", description: "Failed to unban user", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "User has been unbanned" });
    refetch();
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading banned users...</div>;
  }

  if (!bannedUsers?.length) {
    return <div className="text-center py-4">No banned users found.</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Banned By</TableHead>
            <TableHead>Date Banned</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bannedUsers.map((ban) => (
            <TableRow key={ban.id}>
              <TableCell>{ban.banned_user?.nickname || 'Unknown'}</TableCell>
              <TableCell>{ban.reason || 'No reason provided'}</TableCell>
              <TableCell>{ban.admin?.nickname || 'Unknown'}</TableCell>
              <TableCell>{format(new Date(ban.created_at), 'MMM d, yyyy')}</TableCell>
              <TableCell>
                {ban.expires_at 
                  ? format(new Date(ban.expires_at), 'MMM d, yyyy')
                  : 'Permanent'
                }
              </TableCell>
              <TableCell>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">Unban</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Unban User</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to unban {ban.banned_user?.nickname}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleUnban(ban.user_id)}>
                        Unban
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
