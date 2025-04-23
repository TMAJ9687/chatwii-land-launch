
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VipUserRow } from "./VipUserRow";
import { VipUser } from "@/hooks/useVipUsers";

interface VipUsersTableProps {
  users: VipUser[];
  onActionComplete: () => void;
}

export const VipUsersTable = ({ users, onActionComplete }: VipUsersTableProps) => {
  if (!users?.length) {
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
          {users.map((user) => (
            <VipUserRow 
              key={user.id}
              user={user}
              onActionComplete={onActionComplete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
