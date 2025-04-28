
import { useState, useEffect } from "react";
import { format } from "date-fns";
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
import { CheckCircle, Trash2, Ban, Loader2 } from "lucide-react";
import { BanUserModal } from "@/components/admin/modals/BanUserModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  collection, query, where, orderBy, getDocs,
  doc, deleteDoc, updateDoc, addDoc, serverTimestamp
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

type Report = {
  id: number | string;
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
  const [reportToDelete, setReportToDelete] = useState<number | string | null>(null);
  const [reportedUser, setReportedUser] = useState<{ id: string, nickname: string } | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation({
    mutationFn: async (reportId: number | string) => {
      const reportRef = doc(db, "reports", reportId.toString());
      await deleteDoc(reportRef);
      return reportId;
    },
    onSuccess: (reportId) => {
      setReports(prev => prev.filter(report => report.id !== reportId));
      toast.success("Report deleted successfully");
      setReportToDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report", {
        description: "There was a problem deleting the report."
      });
    }
  });
  
  const resolveMutation = useMutation({
    mutationFn: async (reportId: number | string) => {
      const reportRef = doc(db, "reports", reportId.toString());
      await updateDoc(reportRef, {
        status: "resolved",
        resolved_at: new Date().toISOString()
      });
      return reportId;
    },
    onSuccess: (reportId) => {
      setReports(prev => 
        prev.map(report => 
          report.id === reportId 
            ? { ...report, status: "resolved", resolved_at: new Date().toISOString() } 
            : report
        )
      );
      toast.success("Report resolved successfully");
    },
    onError: () => {
      toast.error("Failed to resolve report");
    }
  });
  
  const fetchReports = async () => {
    setLoading(true);
    try {
      // Get reports from Firestore
      const reportsRef = collection(db, "reports");
      const reportsQuery = query(
        reportsRef,
        orderBy("created_at", "desc")
      );
      
      const reportsSnapshot = await getDocs(reportsQuery);
      
      if (!reportsSnapshot.empty) {
        // Collect all user IDs we need to look up
        const userIds = new Set<string>();
        const reportData: any[] = [];
        
        reportsSnapshot.forEach(doc => {
          const data = doc.data();
          reportData.push({
            id: doc.id,
            ...data
          });
          
          if (data.reporter_id) userIds.add(data.reporter_id);
          if (data.reported_id) userIds.add(data.reported_id);
        });
        
        // Fetch profiles for all users
        const profilesMap = new Map<string, any>();
        
        if (userIds.size > 0) {
          const profilesRef = collection(db, "profiles");
          const profilesQuery = query(
            profilesRef,
            where("id", "in", Array.from(userIds))
          );
          
          const profilesSnapshot = await getDocs(profilesQuery);
          profilesSnapshot.forEach(doc => {
            const profileData = doc.data();
            if (profileData.id) {
              profilesMap.set(profileData.id, profileData);
            }
          });
        }
        
        // Combine report data with profile data
        const reportsWithNicknames = reportData.map(report => ({
          ...report,
          reporter_nickname: profilesMap.get(report.reporter_id)?.nickname || "Unknown User",
          reported_nickname: profilesMap.get(report.reported_id)?.nickname || "Unknown User",
        }));
        
        setReports(reportsWithNicknames);
      } else {
        setReports([]);
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
  
  const handleBanUser = (userId: string, nickname: string) => {
    setReportedUser({ id: userId, nickname });
    setShowBanModal(true);
  };
  
  const handleBanConfirm = async (reason: string, duration: string) => {
    if (!reportedUser) return;
    
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        toast.error("Authentication error");
        return;
      }
      
      const expiresAt = duration === 'permanent' ? null : 
        new Date(Date.now() + {
          '1day': 24 * 60 * 60 * 1000,
          '1week': 7 * 24 * 60 * 60 * 1000,
          '1month': 30 * 24 * 60 * 60 * 1000,
        }[duration as string] || 0).toISOString();
      
      // Add ban to Firestore
      const bansRef = collection(db, "bans");
      await addDoc(bansRef, {
        user_id: reportedUser.id,
        reason,
        admin_id: currentUser.id,
        expires_at: expiresAt,
        created_at: serverTimestamp()
      });
      
      // Update profile visibility
      const profileRef = doc(db, "profiles", reportedUser.id);
      await updateDoc(profileRef, {
        visibility: 'offline'
      });
      
      toast.success(`User ${reportedUser.nickname} has been banned`);
      
      // Resolve reports for this user
      const reportsRef = collection(db, "reports");
      const reportQuery = query(
        reportsRef,
        where("reported_id", "==", reportedUser.id),
        where("status", "==", "pending")
      );
      
      const reportSnapshot = await getDocs(reportQuery);
      const updatePromises: Promise<void>[] = [];
      
      reportSnapshot.forEach(doc => {
        updatePromises.push(
          updateDoc(doc.ref, {
            status: "resolved",
            resolved_at: new Date().toISOString()
          })
        );
      });
      
      await Promise.all(updatePromises);
      
      // Refresh reports list
      fetchReports();
    } catch (error) {
      console.error("Ban user error:", error);
      toast.error("Failed to ban user");
    } finally {
      setShowBanModal(false);
      setReportedUser(null);
    }
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
                          onClick={() => resolveMutation.mutate(report.id)}
                          disabled={resolveMutation.isPending && resolveMutation.variables === report.id}
                          title="Mark as resolved"
                        >
                          {resolveMutation.isPending && resolveMutation.variables === report.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
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
                            <AlertDialogAction onClick={() => deleteMutation.mutate(report.id)}>
                              {deleteMutation.isPending && deleteMutation.variables === report.id ? 
                                'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
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
