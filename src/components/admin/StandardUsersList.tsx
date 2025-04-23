
import { useStandardUsers } from "@/hooks/useStandardUsers";
import { UsersTable } from "./user-list/UsersTable";

export const StandardUsersList = () => {
  const { standardUsers, isLoading, refetch } = useStandardUsers();

  if (isLoading) {
    return <div className="text-center py-4">Loading online users...</div>;
  }

  return (
    <UsersTable 
      users={standardUsers || []} 
      onActionComplete={refetch} 
    />
  );
};
