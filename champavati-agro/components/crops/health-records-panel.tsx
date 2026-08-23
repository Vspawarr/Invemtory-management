"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Activity, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { RatingInput } from "@/components/crops/rating-input";
import { addHealthRecordAction } from "@/lib/server/actions/health";

type HealthRecord = {
  id: string;
  overallHealth: number;
  pestSeverity: number;
  diseaseSeverity: number;
  weedSeverity: number;
  growthRating: number;
  waterCondition: number;
  nutrientDeficiency: number;
  notes: string | null;
  createdAt: Date;
};

const FIELDS: { key: keyof typeof DEFAULTS; label: string }[] = [
  { key: "overallHealth", label: "Overall health" },
  { key: "growthRating", label: "Growth" },
  { key: "pestSeverity", label: "Pest severity" },
  { key: "diseaseSeverity", label: "Disease severity" },
  { key: "weedSeverity", label: "Weed severity" },
  { key: "waterCondition", label: "Water condition" },
  { key: "nutrientDeficiency", label: "Nutrient deficiency" },
];

const DEFAULTS = {
  overallHealth: 3,
  growthRating: 3,
  pestSeverity: 1,
  diseaseSeverity: 1,
  weedSeverity: 1,
  waterCondition: 3,
  nutrientDeficiency: 1,
};

export function HealthRecordsPanel({ cropId, records }: { cropId: string; records: HealthRecord[] }) {
  const [open, setOpen] = useState(false);
  const [ratings, setRatings] = useState({ ...DEFAULTS });
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    const result = await addHealthRecordAction({ cropId, ...ratings, notes });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Health record added.");
    setOpen(false);
    setNotes("");
    setRatings({ ...DEFAULTS });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Crop health</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="size-4" /> Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record crop health</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              {FIELDS.map((f) => (
                <RatingInput
                  key={f.key}
                  label={f.label}
                  value={ratings[f.key]}
                  onChange={(v) => setRatings((r) => ({ ...r, [f.key]: v }))}
                />
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="health-notes">Notes</Label>
              <Textarea id="health-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
        {records.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Health observation not recorded yet"
            description="Record the crop's condition to start tracking health over time."
            className="py-10"
          />
        ) : (
          <ul className="space-y-3">
            {records.slice(0, 5).map((r) => (
              <li key={r.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <Badge variant={r.overallHealth >= 4 ? "success" : r.overallHealth >= 3 ? "muted" : "danger"}>
                    Health {r.overallHealth}/5
                  </Badge>
                  <span className="text-xs text-muted-foreground">{format(r.createdAt, "d MMM yyyy")}</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                  <span>Pest {r.pestSeverity}/5</span>
                  <span>Disease {r.diseaseSeverity}/5</span>
                  <span>Water {r.waterCondition}/5</span>
                </div>
                {r.notes && <p className="mt-2 text-xs">{r.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
