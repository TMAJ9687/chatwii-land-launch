
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

// Mock bot users data
const MOCK_BOT_USERS = [
  {
    id: 'bot1',
    nickname: 'ChatBot',
    age: 25,
    gender: 'Female',
    country: 'USA',
    bot_config: { persona: 'Friendly assistant' }
  },
  {
    id: 'bot2',
    nickname: 'HelperBot',
    age: 30,
    gender: 'Male',
    country: 'Canada',
    bot_config: { persona: 'Technical support' }
  }
];

export const BotUsersList = () => {
  const { toast } = useToast();
  const [botUsers, setBotUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Mock loading data
    setTimeout(() => {
      setBotUsers(MOCK_BOT_USERS);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleDelete = async (botId: string) => {
    try {
      // Mock deletion
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update state
      setBotUsers(prevBots => prevBots.filter(bot => bot.id !== botId));
      
      toast({ title: "Success", description: "Bot deleted successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete bot", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading bot users...</div>;
  }

  if (!botUsers?.length) {
    return (
      <div className="text-center py-4">
        No bot users found. Click "Add New Bot" above to create one.
      </div>
    );
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
          {botUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.nickname}</TableCell>
              <TableCell>{user.age || 'N/A'}</TableCell>
              <TableCell>{user.gender || 'N/A'}</TableCell>
              <TableCell>{user.country || 'N/A'}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => console.log('Edit bot:', user.id)}
                  >
                    Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Bot</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete bot {user.nickname}? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(user.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
