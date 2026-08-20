"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/actions/auth";

export function ProfileForm({
  defaultName,
  email,
  defaultPhone,
}: {
  defaultName: string;
  email: string;
  defaultPhone: string;
}) {
  const [isPending, startTransition] = useTransition();

  const action = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Profile updated.");
    });
  };

  return (
    <form action={action} className="max-w-md space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="profile-name">Name</Label>
        <Input id="profile-name" name="name" defaultValue={defaultName} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="profile-email">Email</Label>
        <Input id="profile-email" value={email} disabled />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="profile-phone">Mobile</Label>
        <Input id="profile-phone" name="phone" defaultValue={defaultPhone} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}
