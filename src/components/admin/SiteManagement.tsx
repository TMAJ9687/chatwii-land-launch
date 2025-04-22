import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettings } from "./site-settings/GeneralSettings";
import { ChatSettings } from "./site-settings/ChatSettings";
import { ProfanitySettings } from "./site-settings/ProfanitySettings";
import { VipPricesSettings } from "./site-settings/VipPricesSettings";
import { AvatarSettings } from "./site-settings/AvatarSettings";

export const SiteManagement = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Site Management</h2>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="chat">Chat Settings</TabsTrigger>
          <TabsTrigger value="profanity">Profanity Words</TabsTrigger>
          <TabsTrigger value="vip">VIP Prices</TabsTrigger>
          <TabsTrigger value="avatars">Avatars</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>
        
        <TabsContent value="chat">
          <ChatSettings />
        </TabsContent>
        
        <TabsContent value="profanity">
          <ProfanitySettings />
        </TabsContent>
        
        <TabsContent value="vip">
          <VipPricesSettings />
        </TabsContent>
        
        <TabsContent value="avatars">
          <AvatarSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};
