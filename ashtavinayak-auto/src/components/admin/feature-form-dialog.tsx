"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createFeature, updateFeature } from "@/actions/features";

type Feature = { id: string; name: string; sortOrder: number; isActive: boolean };

export function FeatureFormDialog({ feature }: { feature?: Feature }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isEdit = Boolean(feature);

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = isEdit ? await updateFeature(feature!.id, formData) : await createFeature(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(isEdit ? "Feature updated." : "Feature created.");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            Add Feature
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Feature" : "New Feature"}</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={feature?.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort order</Label>
            <Input id="sortOrder" name="sortOrder" type="number" defaultValue={feature?.sortOrder ?? 0} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="isActive" name="isActive" defaultChecked={feature?.isActive ?? true} value="true" />
            <Label htmlFor="isActive">Active</Label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Feature"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
