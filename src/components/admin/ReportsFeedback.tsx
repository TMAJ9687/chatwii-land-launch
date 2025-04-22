
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportsTable } from "./reports/ReportsTable";
import { FeedbackTable } from "./reports/FeedbackTable";

export const ReportsFeedback = () => {
  const [activeTab, setActiveTab] = useState("reports");
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Reports & Feedback</h2>
        <p className="text-muted-foreground">Manage user reports and view feedback</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="reports">User Reports</TabsTrigger>
          <TabsTrigger value="feedback">User Feedback</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reports">
          <ReportsTable />
        </TabsContent>
        
        <TabsContent value="feedback">
          <FeedbackTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};
