
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VIPUsersList } from "./VIPUsersList";
import { StandardUsersList } from "./StandardUsersList";
import { BotUsersList } from "./BotUsersList";

export const UserManagement = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">User Management</h2>
      
      <Tabs defaultValue="vip" className="w-full">
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="vip">VIP Users</TabsTrigger>
          <TabsTrigger value="standard">Online Standard Users</TabsTrigger>
          <TabsTrigger value="bots">Bots</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vip">
          <VIPUsersList />
        </TabsContent>
        
        <TabsContent value="standard">
          <StandardUsersList />
        </TabsContent>
        
        <TabsContent value="bots">
          <BotUsersList />
        </TabsContent>
      </Tabs>
    </div>
  );
};
