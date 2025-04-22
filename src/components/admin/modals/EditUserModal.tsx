import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES } from "@/constants/countries";
import { Loader2 } from "lucide-react";

type Role = "standard" | "vip";
type Gender = "Male" | "Female" | "Other" | "Prefer not to say";
const GENDER_OPTIONS: Gender[] = ["Male", "Female", "Other", "Prefer not to say"];
const ROLE_OPTIONS: Role[] = ["standard", "vip"];

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any; // shape from profile
  refreshList: () => void;
}

// Utility to fetch active VIP subscription for a user
async function getVipStatus(userId: string) {
  const { data, error } = await supabase
    .from("vip_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("end_date", { ascending: false });
  if (error) return null;
  if (!data || !data[0]) return null;
  return data[0]?.end_date ? `Active until ${new Date(data[0].end_date).toLocaleDateString()}` : "Active";
}

export const EditUserModal = ({ isOpen, onClose, user, refreshList }: EditUserModalProps) => {
  const { toast } = useToast();

  const [formValues, setFormValues] = useState({
    nickname: "",
    age: "",
    gender: "" as Gender | "",
    country: "",
    role: "" as Role | "",
  });
  const [vipStatus, setVipStatus] = useState("Loading...");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user) {
      setFormValues({
        nickname: user.nickname || "",
        age: user.age ? String(user.age) : "",
        gender: (user.gender as Gender) || "",
        country: user.country || "",
        role: (ROLE_OPTIONS.includes(user.role) ? user.role : "standard") as Role,
      });
      setVipStatus("Loading...");
      getVipStatus(user.id).then((status) => setVipStatus(status || "Inactive"));
    }
  }, [user]);

  // -- Validation
  const validate = () => {
    const newErrs: { [k: string]: string } = {};
    if (!formValues.nickname.trim()) newErrs.nickname = "Nickname required";
    if (formValues.age) {
      const ageNum = Number(formValues.age);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 99) newErrs.age = "Age must be 18-99";
    } else newErrs.age = "Age required";
    if (!formValues.gender) newErrs.gender = "Gender required";
    if (!formValues.country) newErrs.country = "Country required";
    if (!formValues.role) newErrs.role = "Role required";
    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  useEffect(() => {
    if (isOpen) validate();
    // eslint-disable-next-line
  }, [formValues]);

  // -- Submit handler
  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    let roleChanged = formValues.role !== user.role;
    let updates: any = {
      nickname: formValues.nickname,
      age: parseInt(formValues.age, 10),
      gender: formValues.gender,
      country: formValues.country,
      role: formValues.role,
    };

    // Update profile
    const { error: profileErr } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (profileErr) {
      toast({
        title: "Update failed",
        description: profileErr.message.includes("duplicate") ? "Nickname already taken." : profileErr.message,
        variant: "destructive"
      });
      setIsSaving(false);
      return;
    }

    // Handle VIP logic on role change
    if (roleChanged) {
      if (formValues.role === "vip" && user.role !== "vip") {
        // Upgrade logic: grant a 1 month free VIP
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("vip_subscriptions").insert({
          user_id: user.id,
          start_date: new Date().toISOString(),
          end_date: endDate,
          is_active: true,
          payment_provider: "admin_granted"
        });
      }
      if (formValues.role === "standard" && user.role === "vip") {
        // Downgrade logic: set all subs inactive
        await supabase.from("vip_subscriptions")
          .update({ is_active: false })
          .eq("user_id", user.id);
      }
    }

    toast({ title: "User updated", description: "Profile updated successfully" });
    setIsSaving(false);
    onClose();
    refreshList();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User: {user.nickname}</DialogTitle>
          <DialogDescription>
            Update user details. Only Standard and VIP roles can be changed here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Nickname */}
          <div>
            <label className="block text-sm font-medium mb-1">Nickname</label>
            <Input 
              value={formValues.nickname}
              onChange={e => setFormValues(v => ({...v, nickname: e.target.value }))}
              disabled={isSaving}
              maxLength={30}
            />
            {errors.nickname && <div className="text-xs text-red-500 mt-1">{errors.nickname}</div>}
          </div>
          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <Select
              value={formValues.role}
              onValueChange={val => setFormValues(v => ({...v, role: val as Role }))}
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <div className="text-xs text-red-500 mt-1">{errors.role}</div>}
          </div>
          {/* Gender */}
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <Select
              value={formValues.gender}
              onValueChange={val => setFormValues(v => ({...v, gender: val as Gender }))}
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.gender && <div className="text-xs text-red-500 mt-1">{errors.gender}</div>}
          </div>
          {/* Age */}
          <div>
            <label className="block text-sm font-medium mb-1">Age</label>
            <Input 
              type="number"
              value={formValues.age}
              onChange={e => setFormValues(v => ({...v, age: e.target.value }))}
              disabled={isSaving}
              min={18}
              max={99}
            />
            {errors.age && <div className="text-xs text-red-500 mt-1">{errors.age}</div>}
          </div>
          {/* Country */}
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <Select
              value={formValues.country}
              onValueChange={val => setFormValues(v => ({...v, country: val }))}
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && <div className="text-xs text-red-500 mt-1">{errors.country}</div>}
          </div>
          {/* VIP Status */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium mb-1">VIP Status</label>
            <span className="text-xs">{vipStatus}</span>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button 
              type="submit" 
              disabled={isSaving || Object.keys(errors).length > 0}
            >
              {isSaving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;
