
import { TableCell, TableRow } from "@/components/ui/table";
import { VipUserActions } from "../vip-actions/VipUserActions";
import { VipUser } from "@/hooks/useVipUsers";

interface VipUserRowProps {
  user: VipUser;
  onActionComplete: () => void;
}

export const VipUserRow = ({ user, onActionComplete }: VipUserRowProps) => {
  return (
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
        <VipUserActions 
          user={user} 
          onActionComplete={onActionComplete} 
        />
      </TableCell>
    </TableRow>
  );
};
