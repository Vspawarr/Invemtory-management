"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTreatmentResultAction } from "@/lib/server/actions/treatments";

const RESULT_OPTIONS = ["EXCELLENT", "GOOD", "MODERATE", "NO_IMPROVEMENT", "POOR", "CROP_DAMAGED"] as const;

type FormValues = {
  pestSeverityBefore?: number;
  pestSeverityAfter?: number;
  diseaseSeverityBefore?: number;
  diseaseSeverityAfter?: number;
  improvementPercent?: number;
  result: (typeof RESULT_OPTIONS)[number];
  notes?: string;
};

export function TreatmentResultForm({ applicationId, cropId }: { applicationId: string; cropId: string }) {
  const router = useRouter();
  const { register, handleSubmit, setValue } = useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(values: FormValues) {
    if (!values.result) {
      toast.error("Select a result.");
      return;
    }
    setSubmitting(true);
    const result = await createTreatmentResultAction({ applicationId, ...values });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Treatment result recorded.");
    router.push(`/admin/crops/${cropId}`);
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tr-pest-before">Pest severity before (1-5)</Label>
              <Input
                id="tr-pest-before"
                type="number"
                min={1}
                max={5}
                {...register("pestSeverityBefore", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tr-pest-after">Pest severity after (1-5)</Label>
              <Input
                id="tr-pest-after"
                type="number"
                min={1}
                max={5}
                {...register("pestSeverityAfter", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tr-disease-before">Disease severity before (1-5)</Label>
              <Input
                id="tr-disease-before"
                type="number"
                min={1}
                max={5}
                {...register("diseaseSeverityBefore", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tr-disease-after">Disease severity after (1-5)</Label>
              <Input
                id="tr-disease-after"
                type="number"
                min={1}
                max={5}
                {...register("diseaseSeverityAfter", { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tr-improvement">Improvement (%)</Label>
            <Input
              id="tr-improvement"
              type="number"
              min={0}
              max={100}
              {...register("improvementPercent", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tr-result">Result</Label>
            <Select onValueChange={(v) => setValue("result", v as FormValues["result"])}>
              <SelectTrigger id="tr-result">
                <SelectValue placeholder="Select result" />
              </SelectTrigger>
              <SelectContent>
                {RESULT_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tr-notes">Notes</Label>
            <Textarea id="tr-notes" {...register("notes")} />
          </div>
          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : "Save result"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
