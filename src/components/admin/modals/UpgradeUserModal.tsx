
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface UpgradeUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (duration: string) => void;
  username: string;
}

export const UpgradeUserModal = ({ isOpen, onClose, onConfirm, username }: UpgradeUserModalProps) => {
  const [duration, setDuration] = useState("1month");

  const handleSubmit = () => {
    onConfirm(duration);
    setDuration("1month");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade User: {username}</DialogTitle>
          <DialogDescription>
            Select the duration for the VIP status.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="permanent">Permanent (Gifted)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Confirm Upgrade</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
