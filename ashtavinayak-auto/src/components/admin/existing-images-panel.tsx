"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppImage } from "@/components/app-image";
import { cn } from "@/lib/utils";
import { removeVehicleImage, setPrimaryVehicleImage, reorderVehicleImage } from "@/actions/vehicles";

export function ExistingImagesPanel({
  images,
}: {
  images: { id: string; url: string; isPrimary: boolean }[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (images.length === 0) return null;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {images.map((img) => (
        <div
          key={img.id}
          className={cn(
            "group relative aspect-[4/3] overflow-hidden rounded-md border bg-muted",
            img.isPrimary && "ring-2 ring-accent"
          )}
        >
          <AppImage src={img.url} alt="" fill className="object-cover" sizes="200px" />
          {img.isPrimary && (
            <span className="absolute left-1 top-1 flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
              <Star className="h-3 w-3 fill-current" /> Primary
            </span>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-white hover:bg-white/20 hover:text-white"
              disabled={isPending}
              onClick={() => run(() => reorderVehicleImage(img.id, "up"))}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            {!img.isPrimary && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-white hover:bg-white/20 hover:text-white"
                disabled={isPending}
                onClick={() => run(() => setPrimaryVehicleImage(img.id))}
                aria-label="Set as primary"
              >
                <Star className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-white hover:bg-white/20 hover:text-white"
              disabled={isPending}
              onClick={() => run(() => removeVehicleImage(img.id))}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-white hover:bg-white/20 hover:text-white"
              disabled={isPending}
              onClick={() => run(() => reorderVehicleImage(img.id, "down"))}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
