
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

export const VIPUsersList = () => {
  const { data: vipUsers, isLoading } = useQuery({
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

  if (isLoading) {
    return <div className="text-center py-4">Loading VIP users...</div>;
  }

  if (!vipUsers?.length) {
    return <div className="text-center py-4">No VIP users found.</div>;
  }

  return (
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
                <span className="text-blue-500 cursor-pointer">View Details</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
