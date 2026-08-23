"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { createProductAction, type ProductInput } from "@/lib/server/actions/products";

export function ProductFormDialog({
  categories,
  cropMasters,
}: {
  categories: { id: string; name: string }[];
  cropMasters: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm<ProductInput>();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(values: ProductInput) {
    setSubmitting(true);
    const result = await createProductAction(values);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Product added.");
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="product-name">Name</Label>
              <Input id="product-name" {...register("name", { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-category">Category</Label>
              <Select onValueChange={(v) => setValue("categoryId", v)}>
                <SelectTrigger id="product-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-target-crop">Target crop (optional)</Label>
              <Select onValueChange={(v) => setValue("targetCropId", v)}>
                <SelectTrigger id="product-target-crop">
                  <SelectValue placeholder="Any crop" />
                </SelectTrigger>
                <SelectContent>
                  {cropMasters.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-brand">Brand</Label>
              <Input id="product-brand" {...register("brand")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-manufacturer">Manufacturer</Label>
              <Input id="product-manufacturer" {...register("manufacturer")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-active-ingredient">Active ingredient</Label>
              <Input id="product-active-ingredient" {...register("activeIngredient")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-target-pest">Target pest/disease</Label>
              <Input id="product-target-pest" {...register("targetPest")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-unit">Unit</Label>
              <Input
                id="product-unit"
                placeholder="litre / kg / gm / packet"
                {...register("unit", { required: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-pack-size">Pack size</Label>
              <Input
                id="product-pack-size"
                placeholder="500 ml / 1 kg"
                {...register("packSize", { required: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-mrp">MRP (₹)</Label>
              <Input
                id="product-mrp"
                type="number"
                step="0.01"
                {...register("mrp", { required: true, valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-selling-price">Selling price (₹)</Label>
              <Input
                id="product-selling-price"
                type="number"
                step="0.01"
                {...register("sellingPrice", { required: true, valueAsNumber: true })}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="product-usage-notes">Usage notes</Label>
              <Textarea id="product-usage-notes" {...register("usageNotes")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : "Save product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
