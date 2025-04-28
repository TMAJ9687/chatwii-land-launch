import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { COUNTRIES } from "@/constants/countries";
import { Loader2 } from "lucide-react";

type Role = "standard" | "vip";
type Gender = "Male" | "Female" | "Other" | "Prefer not to say";
const GENDER_OPTIONS: Gender[] = [
  "Male",
  "Female",
  "Other",
  "Prefer not to say",
];
const ROLE_OPTIONS: Role[] = ["standard", "vip"];

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  refreshList: () => void;
}

export const EditUserModal = ({
  isOpen,
  onClose,
  user,
  refreshList,
}: EditUserModalProps) => {
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
        role: (ROLE_OPTIONS.includes(user.role)
          ? user.role
          : "standard") as Role,
      });
      setVipStatus("Loading...");
      getVipStatus(user.id).then((status) =>
        setVipStatus(status || "Inactive")
      );
    }
  }, [user]);

  const validate = () => {
    const newErrs: { [k: string]: string } = {};
    if (!formValues.nickname.trim())
      newErrs.nickname = "Nickname required";
    if (formValues.age) {
      const ageNum = Number(formValues.age);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 99)
        newErrs.age = "Age must be 18-99";
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

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validate()) return;

    setIsSaving(true);

    try {
      // TODO: Replace with actual backend update call
      await new Promise((resolve) => setTimeout(resolve, 1200));

      toast({
        title: "User updated",
        description: "Profile updated successfully",
      });
      setIsSaving(false);
      onClose();
      refreshList();
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update user profile",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
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
              onChange={(e) =>
                setFormValues((v) => ({
                  ...v,
                  nickname: e.target.value,
                }))
              }
              disabled={isSaving}
              maxLength={30}
            />
            {errors.nickname && (
              <div className="text-xs text-red-500 mt-1">{errors.nickname}</div>
            )}
          </div>
          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <Select
              value={formValues.role}
              onValueChange={(val) =>
                setFormValues((v) => ({
                  ...v,
                  role: val as Role,
                }))
              }
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <div className="text-xs text-red-500 mt-1">{errors.role}</div>
            )}
          </div>
          {/* Gender */}
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <Select
              value={formValues.gender}
              onValueChange={(val) =>
                setFormValues((v) => ({
                  ...v,
                  gender: val as Gender,
                }))
              }
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.gender && (
              <div className="text-xs text-red-500 mt-1">{errors.gender}</div>
            )}
          </div>
          {/* Age */}
          <div>
            <label className="block text-sm font-medium mb-1">Age</label>
            <Input
              type="number"
              value={formValues.age}
              onChange={(e) =>
                setFormValues((v) => ({
                  ...v,
                  age: e.target.value,
                }))
              }
              disabled={isSaving}
              min={18}
              max={99}
            />
            {errors.age && (
              <div className="text-xs text-red-500 mt-1">{errors.age}</div>
            )}
          </div>
          {/* Country */}
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <Select
              value={formValues.country}
              onValueChange={(val) =>
                setFormValues((v) => ({
                  ...v,
                  country: val,
                }))
              }
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && (
              <div className="text-xs text-red-500 mt-1">{errors.country}</div>
            )}
          </div>
          {/* VIP Info */}
          {formValues.role === "vip" && (
            <div className="text-sm p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
              <span className="font-semibold">VIP Status:</span> {vipStatus}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Helper: (still just a mock, replace with your own logic)
async function getVipStatus(userId: string) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return "Active until 12/31/2023";
}
