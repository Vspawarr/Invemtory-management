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
import { updateApplicationStatusAction } from "@/lib/server/actions/treatments";

const STATUS_OPTIONS = ["RECOMMENDED", "PURCHASED", "APPLIED", "NOT_APPLIED", "CANCELLED"] as const;

type FormValues = {
  status: (typeof STATUS_OPTIONS)[number];
  appliedDate?: string;
  quantityUsed?: number;
  notes?: string;
};

export function ApplicationStatusForm({
  applicationId,
  cropId,
  currentStatus,
}: {
  applicationId: string;
  cropId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const { register, handleSubmit, setValue } = useForm<FormValues>({
    defaultValues: { status: currentStatus as FormValues["status"] },
  });
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const result = await updateApplicationStatusAction({ applicationId, ...values });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Application updated.");
    router.push(`/admin/crops/${cropId}`);
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="space-y-4 pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="app-status">Status</Label>
            <Select defaultValue={currentStatus} onValueChange={(v) => setValue("status", v as FormValues["status"])}>
              <SelectTrigger id="app-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="app-applied-date">Applied date</Label>
              <Input id="app-applied-date" type="date" {...register("appliedDate")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="app-quantity">Quantity used</Label>
              <Input
                id="app-quantity"
                type="number"
                step="0.01"
                {...register("quantityUsed", { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="app-notes">Notes</Label>
            <Textarea id="app-notes" {...register("notes")} />
          </div>
          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
