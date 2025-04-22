
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { VIPUsersList } from "./VIPUsersList";
import { StandardUsersList } from "./StandardUsersList";
import { BotUsersList } from "./BotUsersList";
import { BannedUsersList } from "./BannedUsersList";
import { AddBotModal } from "./modals/AddBotModal";

export const UserManagement = () => {
  const [isAddBotModalOpen, setIsAddBotModalOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button onClick={() => setIsAddBotModalOpen(true)}>Add New Bot</Button>
      </div>
      
      <Tabs defaultValue="vip" className="w-full">
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="vip">VIP Users</TabsTrigger>
          <TabsTrigger value="standard">Online Standard Users</TabsTrigger>
          <TabsTrigger value="bots">Bots</TabsTrigger>
          <TabsTrigger value="banned">Banned Users</TabsTrigger>
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
        
        <TabsContent value="banned">
          <BannedUsersList />
        </TabsContent>
      </Tabs>

      <AddBotModal 
        isOpen={isAddBotModalOpen}
        onClose={() => setIsAddBotModalOpen(false)}
        onSuccess={() => {
          // This will trigger a refetch of the bots list
          window.location.reload();
        }}
      />
    </div>
  );
};
