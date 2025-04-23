
import { useVipUsers } from "@/hooks/useVipUsers";
import { VipUsersTable } from "./vip-list/VipUsersTable";

export const VIPUsersList = () => {
  const { vipUsers, isLoading, refetch } = useVipUsers();

  if (isLoading) {
    return <div className="text-center py-4">Loading VIP users...</div>;
  }

  return (
    <VipUsersTable 
      users={vipUsers || []} 
      onActionComplete={refetch} 
    />
  );
};
