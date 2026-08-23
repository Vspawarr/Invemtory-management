"use client";

import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PHOTO_CATEGORY_LABEL, PHOTO_PHASE_LABEL } from "@/lib/photo-categories";
import type { GalleryPhoto } from "@/lib/photo-types";
import { deleteCropPhotoAction } from "@/lib/server/actions/photos";

export function PhotoLightbox({
  photos,
  index,
  onClose,
  onNavigate,
  onDeleted,
  editable = false,
  hideObservation = false,
}: {
  photos: GalleryPhoto[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onDeleted?: (photoId: string) => void;
  editable?: boolean;
  /** The farmer portal shows only the farmer-facing caption, never the
   * admin's internal observation note. */
  hideObservation?: boolean;
}) {
  const [deleting, setDeleting] = useState(false);
  const photo = photos[index];
  if (!photo) return null;

  async function handleDelete() {
    if (!confirm("Remove this photo?")) return;
    setDeleting(true);
    const result = await deleteCropPhotoAction(photo.id);
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Photo removed.");
    onDeleted?.(photo.id);
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <div className="relative overflow-hidden rounded-lg bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- served from the authenticated /api/photos route, not an optimizable static/remote asset */}
          <img
            src={`/api/photos/${photo.id}`}
            alt={photo.caption ?? PHOTO_CATEGORY_LABEL[photo.category]}
            className="max-h-[60vh] w-full object-contain"
          />
          {index > 0 && (
            <button
              type="button"
              onClick={() => onNavigate(index - 1)}
              className="absolute top-1/2 left-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
              aria-label="Previous photo"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}
          {index < photos.length - 1 && (
            <button
              type="button"
              onClick={() => onNavigate(index + 1)}
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
              aria-label="Next photo"
            >
              <ChevronRight className="size-5" />
            </button>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{PHOTO_CATEGORY_LABEL[photo.category]}</Badge>
            {photo.phase && <Badge variant="outline">{PHOTO_PHASE_LABEL[photo.phase]}</Badge>}
            {photo.timelineStage && <Badge variant="outline">{photo.timelineStage.stageNameSnapshot}</Badge>}
            <span className="text-xs text-muted-foreground">{format(photo.createdAt, "d MMM yyyy")}</span>
          </div>
          {photo.caption && <p className="font-medium">{photo.caption}</p>}
          {!hideObservation && photo.observation && <p className="text-muted-foreground">{photo.observation}</p>}
          {editable && (
            <Button size="sm" variant="ghost" className="text-destructive" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="size-4" /> Remove photo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
