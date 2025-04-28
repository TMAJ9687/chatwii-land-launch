
import { useState } from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

// Mock banned users data
const MOCK_BANNED_USERS = [
  {
    id: '1',
    user_id: 'user1',
    admin_id: 'admin1',
    reason: 'Inappropriate behavior',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    banned_user: { nickname: 'JohnDoe123' },
    admin: { nickname: 'AdminUser' }
  },
  {
    id: '2',
    user_id: 'user2',
    admin_id: 'admin1',
    reason: 'Spam',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: null,
    banned_user: { nickname: 'SpamUser42' },
    admin: { nickname: 'AdminUser' }
  }
];

export const BannedUsersList = () => {
  const { toast } = useToast();
  const [bannedUsers, setBannedUsers] = useState(MOCK_BANNED_USERS);
  const [isLoading, setIsLoading] = useState(false);

  const handleUnban = async (userId: string) => {
    setIsLoading(true);
    try {
      // Mock unban operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove the unbanned user from the list
      setBannedUsers(users => users.filter(user => user.user_id !== userId));
      
      toast({ title: "Success", description: "User has been unbanned" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to unban user", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && bannedUsers.length === 0) {
    return <div className="text-center py-4">Loading banned users...</div>;
  }

  if (!bannedUsers.length) {
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
