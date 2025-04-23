
import { TableCell, TableRow } from "@/components/ui/table";
import { UserActions } from "../user-actions/UserActions";
import { StandardUser } from "@/hooks/useStandardUsers";

interface UserRowProps {
  user: StandardUser;
  onActionComplete: () => void;
}

export const UserRow = ({ user, onActionComplete }: UserRowProps) => {
  return (
    <TableRow key={user.id}>
      <TableCell className="font-medium">{user.nickname}</TableCell>
      <TableCell>{user.age || 'N/A'}</TableCell>
      <TableCell>{user.gender || 'N/A'}</TableCell>
      <TableCell>{user.country || 'N/A'}</TableCell>
      <TableCell>
        <UserActions user={user} onActionComplete={onActionComplete} />
      </TableCell>
    </TableRow>
  );
};
