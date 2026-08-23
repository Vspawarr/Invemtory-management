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
import { createRecommendationAction } from "@/lib/server/actions/treatments";

type Product = { id: string; name: string; brand: string | null; category: { name: string } };

type FormValues = {
  productId: string;
  targetPestOrDisease?: string;
  dosage?: string;
  applicationMethod?: string;
  instructions?: string;
  notes?: string;
};

export function RecommendationForm({ cropId, products }: { cropId: string; products: Product[] }) {
  const router = useRouter();
  const { register, handleSubmit, setValue } = useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(values: FormValues) {
    if (!values.productId) {
      toast.error("Select a product.");
      return;
    }
    setSubmitting(true);
    const result = await createRecommendationAction({ cropId, ...values });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Recommendation recorded.");
    router.push(`/admin/crops/${cropId}`);
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rec-product">Product</Label>
            <Select onValueChange={(v) => setValue("productId", v)}>
              <SelectTrigger id="rec-product">
                <SelectValue placeholder={products.length ? "Select product" : "No products yet"} />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.brand ? `(${p.brand})` : ""} — {p.category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rec-target">Target pest / disease</Label>
            <Input id="rec-target" {...register("targetPestOrDisease")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rec-dosage">Dosage</Label>
              <Input id="rec-dosage" placeholder="e.g. 2 ml / litre" {...register("dosage")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rec-method">Application method</Label>
              <Input id="rec-method" placeholder="e.g. Foliar spray" {...register("applicationMethod")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rec-instructions">Instructions</Label>
            <Textarea id="rec-instructions" {...register("instructions")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rec-notes">Notes</Label>
            <Textarea id="rec-notes" {...register("notes")} />
          </div>
          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={submitting || products.length === 0}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : "Save recommendation"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
