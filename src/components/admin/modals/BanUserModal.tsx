
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface BanUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, duration: string) => void;
  username: string;
}

export const BanUserModal = ({ isOpen, onClose, onConfirm, username }: BanUserModalProps) => {
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("permanent");

  const handleSubmit = () => {
    onConfirm(reason, duration);
    setReason("");
    setDuration("permanent");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ban User: {username}</DialogTitle>
          <DialogDescription>
            Enter the reason and duration for banning this user.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="banReason">Ban Reason</Label>
            <Textarea
              id="banReason"
              placeholder="Enter reason for ban..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Ban Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1day">1 Day</SelectItem>
                <SelectItem value="1week">1 Week</SelectItem>
                <SelectItem value="1month">1 Month</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!reason}>Confirm Ban</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
