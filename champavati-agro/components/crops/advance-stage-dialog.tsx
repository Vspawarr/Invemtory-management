"use client";

import { useState } from "react";
import { Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { advanceCropStageAction } from "@/lib/server/actions/crops";

export function AdvanceStageDialog({
  cropId,
  stages,
  currentStageId,
}: {
  cropId: string;
  stages: { id: string; stageNameSnapshot: string; sequenceSnapshot: number }[];
  currentStageId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [stageId, setStageId] = useState(currentStageId ?? "");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!stageId || reason.trim().length < 3) {
      toast.error("Select a stage and give a short reason.");
      return;
    }
    setSubmitting(true);
    const result = await advanceCropStageAction({ cropId, timelineStageId: stageId, reason, markActualStart: true });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Crop stage updated.");
    setOpen(false);
    setReason("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <TrendingUp className="size-4" /> Update stage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update current stage</DialogTitle>
          <DialogDescription>
            Confirm which stage this crop has actually reached. Earlier stages will be shown as
            completed; a reason is kept on record.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="advance-stage-select">Stage reached</Label>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger id="advance-stage-select">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {[...stages]
                  .sort((a, b) => a.sequenceSnapshot - b.sequenceSnapshot)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.sequenceSnapshot}. {s.stageNameSnapshot}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="advance-reason">Reason / observation</Label>
            <Textarea
              id="advance-reason"
              placeholder="e.g. Field visit confirmed flowering has started"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
