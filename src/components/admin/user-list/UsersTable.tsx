
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserRow } from "./UserRow";
import { StandardUser } from "@/hooks/useStandardUsers";

interface UsersTableProps {
  users: StandardUser[];
  onActionComplete: () => void;
}

export const UsersTable = ({ users, onActionComplete }: UsersTableProps) => {
  if (!users?.length) {
    return <div className="text-center py-4">No online standard users found.</div>;
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
          {users.map((user) => (
            <UserRow 
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
