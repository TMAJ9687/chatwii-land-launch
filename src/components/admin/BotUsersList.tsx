
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

export const BotUsersList = () => {
  const { data: botUsers, isLoading } = useQuery({
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
                <span className="text-blue-500 cursor-pointer">Configure Bot</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
