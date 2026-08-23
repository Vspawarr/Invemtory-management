"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createFollowupAction } from "@/lib/server/actions/followups";

export function AddFollowupDialog({
  farmers,
  defaultFarmerId,
  crops,
  trigger,
}: {
  /** Full farmer picker list — omit when `defaultFarmerId` is set (Farmer 360 quick action). */
  farmers?: { id: string; fullName: string }[];
  /** Preset + lock the farmer, e.g. when opened from that farmer's own profile page. */
  defaultFarmerId?: string;
  /** Optional crop picker, scoped to the preset farmer's own crops. */
  crops?: { id: string; label: string }[];
  /** Custom trigger button — defaults to a generic "Add follow-up" button. */
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [farmerId, setFarmerId] = useState(defaultFarmerId ?? "");
  const [cropId, setCropId] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!farmerId || !reason || !dueDate) {
      toast.error("Fill in farmer, reason, and due date.");
      return;
    }
    setSubmitting(true);
    const result = await createFollowupAction({
      farmerId,
      cropId: cropId || undefined,
      reason,
      priority,
      dueDate,
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Follow-up scheduled.");
    setOpen(false);
    setReason("");
    setDueDate("");
    setCropId("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" /> Add follow-up
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule a follow-up</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {farmers && !defaultFarmerId && (
            <div className="space-y-1.5">
              <Label htmlFor="followup-farmer">Farmer</Label>
              <Select value={farmerId} onValueChange={setFarmerId}>
                <SelectTrigger id="followup-farmer">
                  <SelectValue placeholder="Select farmer" />
                </SelectTrigger>
                <SelectContent>
                  {farmers.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {crops && crops.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="followup-crop">Crop (optional)</Label>
              <Select value={cropId} onValueChange={setCropId}>
                <SelectTrigger id="followup-crop">
                  <SelectValue placeholder="Not crop-specific" />
                </SelectTrigger>
                <SelectContent>
                  {crops.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="followup-reason">Reason</Label>
            <Input id="followup-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="followup-priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger id="followup-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="followup-due-date">Due date</Label>
              <Input
                id="followup-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
