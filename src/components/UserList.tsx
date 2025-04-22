
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserListItem } from "@/components/UserListItem";
import { useUserList } from "@/hooks/useUserList";

interface UserListProps {
  onUserSelect: (userId: string) => void;
  selectedUserId?: string;
}

export const UserList = ({ onUserSelect, selectedUserId }: UserListProps) => {
  const { users, showFilters, setShowFilters } = useUserList(onUserSelect, selectedUserId);

  return (
    <div className="h-full flex flex-col">
      {/* Header with filter */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          People ({users.length})
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowFilters(!showFilters)}
          className="rounded-full"
        >
          <Filter className="h-5 w-5" />
        </Button>
      </div>

      {/* User list */}
      <div className="overflow-y-auto flex-1">
        {users.map((user) => (
          <UserListItem
            key={user.id}
            name={user.nickname}
            gender={user.gender}
            age={user.age}
            country={user.country}
            isVip={user.role === 'vip' || user.vip_status}
            interests={user.interests}
            isSelected={selectedUserId === user.id}
            onClick={() => onUserSelect(user.id)}
            avatar={user.avatar_url}
            profileTheme={user.profile_theme}
          />
        ))}
      </div>
    </div>
  );
};
