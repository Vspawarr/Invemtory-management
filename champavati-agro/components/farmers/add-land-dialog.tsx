"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { addLandParcelAction } from "@/lib/server/actions/farmers";

const OWNERSHIP_OPTIONS = [
  { value: "OWNED", label: "Owned" },
  { value: "LEASED", label: "Leased" },
  { value: "SHARECROPPED", label: "Sharecropped" },
  { value: "OTHER", label: "Other" },
] as const;

const EMPTY = {
  name: "",
  surveyNo: "",
  areaAcres: "",
  soilType: "",
  waterSource: "",
  village: "",
  notes: "",
};

export function AddLandDialog({ farmerId, defaultVillage }: { farmerId: string; defaultVillage: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY, village: defaultVillage });
  const [irrigationAvailable, setIrrigationAvailable] = useState(true);
  const [ownershipStatus, setOwnershipStatus] = useState<(typeof OWNERSHIP_OPTIONS)[number]["value"]>("OWNED");
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    const areaAcres = Number(form.areaAcres);
    if (!form.name || !form.village || !areaAcres || areaAcres <= 0) {
      toast.error("Give the parcel a name, village, and a positive area.");
      return;
    }
    setSubmitting(true);
    const result = await addLandParcelAction({
      farmerId,
      name: form.name,
      surveyNo: form.surveyNo || undefined,
      areaAcres,
      soilType: form.soilType || undefined,
      waterSource: form.waterSource || undefined,
      irrigationAvailable,
      ownershipStatus,
      notes: form.notes || undefined,
      village: form.village,
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Land parcel added.");
    setOpen(false);
    setForm({ ...EMPTY, village: defaultVillage });
    setIrrigationAvailable(true);
    setOwnershipStatus("OWNED");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="size-4" /> Add land
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a land parcel</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="land-name">Parcel name / Gat no.</Label>
            <Input id="land-name" value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="land-surveyNo">Survey / Gat number</Label>
            <Input id="land-surveyNo" value={form.surveyNo} onChange={(e) => update("surveyNo", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="land-areaAcres">Area (acres)</Label>
            <Input
              id="land-areaAcres"
              type="number"
              step="0.01"
              value={form.areaAcres}
              onChange={(e) => update("areaAcres", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="land-village">Village</Label>
            <Input id="land-village" value={form.village} onChange={(e) => update("village", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="land-soilType">Soil type</Label>
            <Input id="land-soilType" value={form.soilType} onChange={(e) => update("soilType", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="land-waterSource">Irrigation source</Label>
            <Input
              id="land-waterSource"
              placeholder="Well, canal, borewell…"
              value={form.waterSource}
              onChange={(e) => update("waterSource", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="land-ownership">Ownership / tenancy</Label>
            <Select value={ownershipStatus} onValueChange={(v) => setOwnershipStatus(v as typeof ownershipStatus)}>
              <SelectTrigger id="land-ownership">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OWNERSHIP_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <Label htmlFor="land-irrigation" className="text-sm font-normal">
              Irrigation available
            </Label>
            <Switch id="land-irrigation" checked={irrigationAvailable} onCheckedChange={setIrrigationAvailable} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="land-notes">Notes</Label>
          <Textarea id="land-notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : "Add parcel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
