"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CloudRain, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { recordWeatherObservationAction } from "@/lib/server/actions/weather";

type RainfallStatus = "NORMAL" | "DELAYED_MONSOON" | "DRY_SPELL" | "EXCESS_RAIN";

const ADVISORY: Record<RainfallStatus, string> = {
  NORMAL: "Rainfall conditions are normal for this stage.",
  DELAYED_MONSOON: "Sowing conditions may be delayed. Verify field moisture before sowing.",
  DRY_SPELL: "Monitor soil moisture and crop stress.",
  EXCESS_RAIN: "Excess rainfall: monitor drainage, waterlogging and disease symptoms.",
};

const STATUS_LABEL: Record<RainfallStatus, string> = {
  NORMAL: "Normal",
  DELAYED_MONSOON: "Delayed monsoon",
  DRY_SPELL: "Dry spell",
  EXCESS_RAIN: "Excess rain",
};

type WeatherEntry = {
  id: string;
  rainfallStatus: RainfallStatus;
  rainfallLast7Days: number | null;
  rainfallLast14Days: number | null;
  irrigationAvailable: boolean;
  notes: string | null;
  recordedAt: Date;
};

export function WeatherPanel({ cropId, entries }: { cropId: string; entries: WeatherEntry[] }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<RainfallStatus>("NORMAL");
  const [rain7, setRain7] = useState("");
  const [rain14, setRain14] = useState("");
  const [irrigation, setIrrigation] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const latest = entries[0];

  async function submit() {
    setSubmitting(true);
    const result = await recordWeatherObservationAction({
      cropId,
      rainfallStatus: status,
      rainfallLast7Days: rain7 ? Number(rain7) : undefined,
      rainfallLast14Days: rain14 ? Number(rain14) : undefined,
      irrigationAvailable: irrigation,
      notes,
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Weather observation recorded.");
    setOpen(false);
    setNotes("");
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Weather &amp; field conditions</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="size-4" /> Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record weather observation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="weather-status">Rainfall status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as RainfallStatus)}>
                  <SelectTrigger id="weather-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABEL) as RainfallStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="weather-rain7">Rainfall last 7 days (mm)</Label>
                  <Input id="weather-rain7" type="number" value={rain7} onChange={(e) => setRain7(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="weather-rain14">Rainfall last 14 days (mm)</Label>
                  <Input id="weather-rain14" type="number" value={rain14} onChange={(e) => setRain14(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="weather-irrigation" className="text-sm font-medium">
                  Irrigation available
                </Label>
                <Switch id="weather-irrigation" checked={irrigation} onCheckedChange={setIrrigation} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weather-notes">Notes</Label>
                <Textarea id="weather-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {!latest ? (
          <EmptyState
            icon={CloudRain}
            title="No weather observations yet"
            description="Record rainfall conditions to see monitoring advisories here."
            className="py-10"
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant={latest.rainfallStatus === "NORMAL" ? "muted" : "info"}>
                {STATUS_LABEL[latest.rainfallStatus]}
              </Badge>
              <span className="text-xs text-muted-foreground">{format(latest.recordedAt, "d MMM yyyy")}</span>
            </div>
            <p className="rounded-lg bg-muted/60 p-3 text-sm">{ADVISORY[latest.rainfallStatus]}</p>
            {(latest.rainfallLast7Days !== null || latest.rainfallLast14Days !== null) && (
              <p className="text-xs text-muted-foreground">
                {latest.rainfallLast7Days !== null && `${latest.rainfallLast7Days}mm (7 days)`}
                {latest.rainfallLast7Days !== null && latest.rainfallLast14Days !== null && " · "}
                {latest.rainfallLast14Days !== null && `${latest.rainfallLast14Days}mm (14 days)`}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
