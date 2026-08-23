"use client";

import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateStageMasterAction } from "@/lib/server/actions/crop-stage-master";

export type StageMasterVM = {
  id: string;
  name: string;
  localName: string;
  sequence: number;
  minStartOffsetDays: number;
  defaultStartOffsetDays: number;
  maxStartOffsetDays: number;
  minEndOffsetDays: number;
  defaultEndOffsetDays: number;
  maxEndOffsetDays: number;
  criticalStage: boolean;
  waterSensitive: boolean;
  weatherSensitive: boolean;
  monitoringActions: string | null;
  commonPests: string[];
  commonDiseases: string[];
  sourceReference: string | null;
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
};

export function EditStageDialog({ stage }: { stage: StageMasterVM }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    minStartOffsetDays: stage.minStartOffsetDays,
    defaultStartOffsetDays: stage.defaultStartOffsetDays,
    maxStartOffsetDays: stage.maxStartOffsetDays,
    minEndOffsetDays: stage.minEndOffsetDays,
    defaultEndOffsetDays: stage.defaultEndOffsetDays,
    maxEndOffsetDays: stage.maxEndOffsetDays,
    criticalStage: stage.criticalStage,
    waterSensitive: stage.waterSensitive,
    weatherSensitive: stage.weatherSensitive,
    monitoringActions: stage.monitoringActions ?? "",
    commonPests: stage.commonPests.join(", "),
    commonDiseases: stage.commonDiseases.join(", "),
    sourceReference: stage.sourceReference ?? "",
    confidenceLevel: stage.confidenceLevel,
  });
  const [submitting, setSubmitting] = useState(false);

  function n(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: Number(value) }));
  }

  async function submit() {
    setSubmitting(true);
    const result = await updateStageMasterAction({ stageId: stage.id, ...form });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error, { duration: 8000 });
      return;
    }
    toast.success("Stage updated. Applies to future crops only.");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {stage.sequence}. {stage.name}
          </DialogTitle>
          <DialogDescription>
            Changes apply only to crops created after saving — existing crop timelines are never
            altered.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`min-start-${stage.id}`}>Min start offset</Label>
              <Input
                id={`min-start-${stage.id}`}
                type="number"
                value={form.minStartOffsetDays}
                onChange={(e) => n("minStartOffsetDays", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`default-start-${stage.id}`}>Default start offset</Label>
              <Input
                id={`default-start-${stage.id}`}
                type="number"
                value={form.defaultStartOffsetDays}
                onChange={(e) => n("defaultStartOffsetDays", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`max-start-${stage.id}`}>Max start offset</Label>
              <Input
                id={`max-start-${stage.id}`}
                type="number"
                value={form.maxStartOffsetDays}
                onChange={(e) => n("maxStartOffsetDays", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`min-end-${stage.id}`}>Min end offset</Label>
              <Input
                id={`min-end-${stage.id}`}
                type="number"
                value={form.minEndOffsetDays}
                onChange={(e) => n("minEndOffsetDays", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`default-end-${stage.id}`}>Default end offset</Label>
              <Input
                id={`default-end-${stage.id}`}
                type="number"
                value={form.defaultEndOffsetDays}
                onChange={(e) => n("defaultEndOffsetDays", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`max-end-${stage.id}`}>Max end offset</Label>
              <Input
                id={`max-end-${stage.id}`}
                type="number"
                value={form.maxEndOffsetDays}
                onChange={(e) => n("maxEndOffsetDays", e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Offsets are signed days relative to the crop&apos;s anchor date — negative for
            pre-anchor stages (e.g. Land Preparation), 0 for the anchor stage itself, positive
            after.
          </p>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.criticalStage}
                onCheckedChange={(v) => setForm((f) => ({ ...f, criticalStage: !!v }))}
              />
              Critical stage
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.waterSensitive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, waterSensitive: !!v }))}
              />
              Water-sensitive
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.weatherSensitive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, weatherSensitive: !!v }))}
              />
              Weather-sensitive
            </label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`monitoring-${stage.id}`}>Monitoring guidance</Label>
            <Textarea
              id={`monitoring-${stage.id}`}
              value={form.monitoringActions}
              onChange={(e) => setForm((f) => ({ ...f, monitoringActions: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`pests-${stage.id}`}>Common pests (comma-separated)</Label>
              <Input
                id={`pests-${stage.id}`}
                value={form.commonPests}
                onChange={(e) => setForm((f) => ({ ...f, commonPests: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`diseases-${stage.id}`}>Common diseases (comma-separated)</Label>
              <Input
                id={`diseases-${stage.id}`}
                value={form.commonDiseases}
                onChange={(e) => setForm((f) => ({ ...f, commonDiseases: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`source-${stage.id}`}>Source reference</Label>
              <Input
                id={`source-${stage.id}`}
                value={form.sourceReference}
                onChange={(e) => setForm((f) => ({ ...f, sourceReference: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`confidence-${stage.id}`}>Confidence</Label>
              <Select
                value={form.confidenceLevel}
                onValueChange={(v) => setForm((f) => ({ ...f, confidenceLevel: v as "HIGH" | "MEDIUM" | "LOW" }))}
              >
                <SelectTrigger id={`confidence-${stage.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
