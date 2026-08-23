"use client";

import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateFarmerAction } from "@/lib/server/actions/farmers";

export type EditableFarmer = {
  id: string;
  fullName: string;
  fatherOrHusbandName: string | null;
  altPhone: string | null;
  email: string | null;
  gender: string | null;
  dob: string | null; // yyyy-MM-dd, pre-formatted by the caller
  address: string | null;
  village: string;
  taluka: string;
  district: string;
  state: string;
  pincode: string | null;
  notes: string | null;
};

export function EditFarmerDialog({ farmer }: { farmer: EditableFarmer }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: farmer.fullName,
    fatherOrHusbandName: farmer.fatherOrHusbandName ?? "",
    altPhone: farmer.altPhone ?? "",
    email: farmer.email ?? "",
    gender: farmer.gender ?? "",
    dob: farmer.dob ?? "",
    address: farmer.address ?? "",
    village: farmer.village,
    taluka: farmer.taluka,
    district: farmer.district,
    state: farmer.state,
    pincode: farmer.pincode ?? "",
    notes: farmer.notes ?? "",
  });
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    if (!form.fullName || !form.village || !form.taluka || !form.district || !form.state) {
      toast.error("Full name and address fields are required.");
      return;
    }
    setSubmitting(true);
    const result = await updateFarmerAction({
      farmerId: farmer.id,
      fullName: form.fullName,
      fatherOrHusbandName: form.fatherOrHusbandName || undefined,
      altPhone: form.altPhone || undefined,
      email: form.email || undefined,
      gender: form.gender || undefined,
      dob: form.dob || undefined,
      address: form.address || undefined,
      village: form.village,
      taluka: form.taluka,
      district: form.district,
      state: form.state,
      pincode: form.pincode || undefined,
      notes: form.notes || undefined,
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Farmer profile updated.");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="size-4" /> Edit profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit farmer profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ef-fullName">Full name</Label>
            <Input id="ef-fullName" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ef-fatherOrHusbandName">Father / Husband name</Label>
            <Input
              id="ef-fatherOrHusbandName"
              value={form.fatherOrHusbandName}
              onChange={(e) => update("fatherOrHusbandName", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ef-altPhone">Alternate mobile</Label>
            <Input id="ef-altPhone" value={form.altPhone} onChange={(e) => update("altPhone", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ef-email">Email</Label>
            <Input
              id="ef-email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ef-gender">Gender</Label>
            <Input id="ef-gender" value={form.gender} onChange={(e) => update("gender", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ef-dob">Date of birth</Label>
            <Input id="ef-dob" type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ef-address">Address</Label>
            <Input id="ef-address" value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ef-village">Village</Label>
            <Input id="ef-village" value={form.village} onChange={(e) => update("village", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ef-taluka">Taluka</Label>
            <Input id="ef-taluka" value={form.taluka} onChange={(e) => update("taluka", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ef-district">District</Label>
            <Input id="ef-district" value={form.district} onChange={(e) => update("district", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ef-state">State</Label>
            <Input id="ef-state" value={form.state} onChange={(e) => update("state", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ef-pincode">PIN code</Label>
            <Input id="ef-pincode" value={form.pincode} onChange={(e) => update("pincode", e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ef-notes">Notes</Label>
          <Textarea
            id="ef-notes"
            placeholder="Relationship notes, preferences, reminders…"
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
