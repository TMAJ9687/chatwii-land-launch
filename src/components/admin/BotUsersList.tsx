
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const BotUsersList = () => {
  const { toast } = useToast();
  
  const { data: botUsers, isLoading, refetch } = useQuery({
    queryKey: ["bot-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          bot_config (
            persona
          )
        `)
        .eq("role", "bot")
        .order("nickname");

      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (botId: string) => {
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", botId);

    if (profileError) {
      toast({ title: "Error", description: "Failed to delete bot", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Bot deleted successfully" });
    refetch();
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading bot users...</div>;
  }

  if (!botUsers?.length) {
    return <div className="text-center py-4">No bot users found.</div>;
  }

  return (
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
          {botUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.nickname}</TableCell>
              <TableCell>{user.age || 'N/A'}</TableCell>
              <TableCell>{user.gender || 'N/A'}</TableCell>
              <TableCell>{user.country || 'N/A'}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => console.log('Edit bot:', user.id)}
                  >
                    Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Bot</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete bot {user.nickname}? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(user.id)}>
                          Delete
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
  );
};
