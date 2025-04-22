
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { 
  Table, TableHeader, TableRow, TableHead, 
  TableBody, TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, 
  AlertDialogFooter, AlertDialogHeader, 
  AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { CheckCircle, Trash2, Ban } from "lucide-react";
import { BanUserModal } from "@/components/admin/modals/BanUserModal";

type Report = {
  id: number;
  reporter_id: string;
  reported_id: string;
  reason: string | null;
  suggest_ban: boolean | null;
  created_at: string;
  status: string;
  resolved_at: string | null;
  reporter_nickname: string;
  reported_nickname: string;
};

export const ReportsTable = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportToDelete, setReportToDelete] = useState<number | null>(null);
  const [reportedUser, setReportedUser] = useState<{ id: string, nickname: string } | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  
  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch reports and join with profiles table to get nicknames
      const { data, error } = await supabase
        .from("reports")
        .select(`
          id, reporter_id, reported_id, reason, suggest_ban, 
          created_at, status, resolved_at
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        // Get unique user IDs to fetch nicknames
        const userIds = new Set<string>();
        data.forEach(report => {
          userIds.add(report.reporter_id);
          userIds.add(report.reported_id);
        });
        
        // Fetch profile information for all users
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, nickname")
          .in("id", Array.from(userIds));
          
        if (profilesError) throw profilesError;
        
        // Create a map of user IDs to nicknames
        const nicknameMap = new Map<string, string>();
        profiles?.forEach(profile => {
          nicknameMap.set(profile.id, profile.nickname);
        });
        
        // Combine reports with profile information
        const reportsWithNicknames = data.map(report => ({
          ...report,
          reporter_nickname: nicknameMap.get(report.reporter_id) || "Unknown User",
          reported_nickname: nicknameMap.get(report.reported_id) || "Unknown User",
        }));
        
        setReports(reportsWithNicknames);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports", {
        description: "There was a problem fetching the report data."
      });
    } finally {
      setLoading(false);
    }
  };
  
  const markAsResolved = async (reportId: number) => {
    try {
      const { error } = await supabase
        .from("reports")
        .update({ 
          status: "resolved",
          resolved_at: new Date().toISOString()
        })
        .eq("id", reportId);
        
      if (error) throw error;
      
      toast.success("Report resolved", {
        description: "The report has been marked as resolved."
      });
      
      // Update the local state
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === reportId 
            ? { ...report, status: "resolved", resolved_at: new Date().toISOString() } 
            : report
        )
      );
    } catch (error) {
      console.error("Error resolving report:", error);
      toast.error("Failed to resolve report", {
        description: "There was a problem updating the report status."
      });
    }
  };
  
  const deleteReport = async (reportId: number) => {
    try {
      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", reportId);
        
      if (error) throw error;
      
      toast.success("Report deleted", {
        description: "The report has been permanently deleted."
      });
      
      // Update the local state
      setReports(prevReports => prevReports.filter(report => report.id !== reportId));
      setReportToDelete(null);
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report", {
        description: "There was a problem deleting the report."
      });
    }
  };
  
  const handleBanUser = (userId: string, nickname: string) => {
    setReportedUser({ id: userId, nickname });
    setShowBanModal(true);
  };
  
  const handleBanConfirm = (reason: string, duration: string) => {
    // This will be handled by the BanUserModal component
    toast.success(`User ban initiated`, {
      description: `${reportedUser?.nickname} will be banned for ${duration}.`
    });
    setShowBanModal(false);
  };
  
  useEffect(() => {
    fetchReports();
  }, []);
  
  if (loading) {
    return <div className="flex justify-center p-8">Loading reports...</div>;
  }
  
  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reported User</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead className="hidden md:table-cell">Reason</TableHead>
              <TableHead>Suggest Ban</TableHead>
              <TableHead className="hidden sm:table-cell">Date Reported</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No reports found
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.reported_nickname}</TableCell>
                  <TableCell>{report.reporter_nickname}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-xs truncate">
                    {report.reason || "No reason provided"}
                  </TableCell>
                  <TableCell>
                    {report.suggest_ban ? (
                      <Badge variant="destructive">Yes</Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {format(new Date(report.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={report.status === "resolved" ? "outline" : "secondary"}
                    >
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {report.status !== "resolved" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsResolved(report.id)}
                          title="Mark as resolved"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Delete Report Button */}
                      <AlertDialog open={reportToDelete === report.id} onOpenChange={() => setReportToDelete(null)}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReportToDelete(report.id)}
                            title="Delete report"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Report</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this report? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteReport(report.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      {/* Ban User Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBanUser(report.reported_id, report.reported_nickname)}
                        title="Ban user"
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Ban User Modal */}
      {reportedUser && (
        <BanUserModal 
          isOpen={showBanModal}
          onClose={() => setShowBanModal(false)}
          onConfirm={handleBanConfirm}
          username={reportedUser.nickname}
        />
      )}
    </div>
  );
};
