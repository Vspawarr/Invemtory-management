"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { resizeImageFile } from "@/lib/client-image-resize";
import { PHOTO_CATEGORIES, PHOTO_CATEGORY_LABEL, type PhotoCategory, type PhotoPhase } from "@/lib/photo-categories";
import { MAX_FILES_PER_UPLOAD } from "@/lib/photo-limits";
import { uploadCropPhotosAction } from "@/lib/server/actions/photos";

type PendingPhoto = { file: File; previewUrl: string; width: number | null; height: number | null };

export function PhotoUploadDialog({
  cropId,
  stages,
  defaultStageId,
  healthRecordId,
  applicationId,
  treatmentResultId,
  lockedCategory,
  lockedPhase,
  trigger,
  triggerLabel = "Add Field Photo",
  onUploaded,
}: {
  cropId: string;
  /** Only shown when provided — lets the admin tag which timeline stage the photo was taken during. */
  stages?: { id: string; label: string }[];
  defaultStageId?: string | null;
  /** Preset context — when set, the category is locked and the field is hidden. */
  healthRecordId?: string;
  applicationId?: string;
  treatmentResultId?: string;
  lockedCategory?: PhotoCategory;
  lockedPhase?: PhotoPhase;
  trigger?: React.ReactNode;
  triggerLabel?: string;
  onUploaded?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [category, setCategory] = useState<PhotoCategory>(lockedCategory ?? "FIELD_VISIT");
  const [stageId, setStageId] = useState(defaultStageId ?? "");
  const [caption, setCaption] = useState("");
  const [observation, setObservation] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    if (photos.length + fileList.length > MAX_FILES_PER_UPLOAD) {
      toast.error(`Upload at most ${MAX_FILES_PER_UPLOAD} photos at a time.`);
      return;
    }
    setBusy(true);
    const next: PendingPhoto[] = [];
    for (const raw of Array.from(fileList)) {
      const { blob, width, height } = await resizeImageFile(raw);
      const resized = new File([blob], raw.name || "photo.jpg", { type: blob.type || raw.type });
      next.push({ file: resized, previewUrl: URL.createObjectURL(resized), width, height });
    }
    setPhotos((p) => [...p, ...next]);
    setBusy(false);
  }

  function removePhoto(index: number) {
    setPhotos((p) => {
      URL.revokeObjectURL(p[index].previewUrl);
      return p.filter((_, i) => i !== index);
    });
  }

  function reset() {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPhotos([]);
    setCaption("");
    setObservation("");
    setStageId(defaultStageId ?? "");
  }

  async function submit() {
    if (photos.length === 0) {
      toast.error("Add at least one photo.");
      return;
    }
    setSubmitting(true);
    const formData = new FormData();
    formData.set("cropId", cropId);
    formData.set("category", lockedCategory ?? category);
    if (lockedPhase) formData.set("phase", lockedPhase);
    if (stageId) formData.set("timelineStageId", stageId);
    if (healthRecordId) formData.set("healthRecordId", healthRecordId);
    if (applicationId) formData.set("applicationId", applicationId);
    if (treatmentResultId) formData.set("treatmentResultId", treatmentResultId);
    if (caption) formData.set("caption", caption);
    if (observation) formData.set("observation", observation);
    formData.set("dims", JSON.stringify(photos.map((p) => ({ width: p.width, height: p.height }))));
    for (const p of photos) formData.append("files", p.file);

    const result = await uploadCropPhotosAction(formData);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${result.data.ids.length} photo${result.data.ids.length === 1 ? "" : "s"} uploaded.`);
    reset();
    setOpen(false);
    onUploaded?.();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Plus className="size-4" /> {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{triggerLabel}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" className="flex-1" onClick={() => cameraInputRef.current?.click()} disabled={busy}>
            <Camera className="size-4" /> Take Photo
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={() => galleryInputRef.current?.click()} disabled={busy}>
            <ImagePlus className="size-4" /> Choose from Gallery
          </Button>
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((p, i) => (
              <div key={p.previewUrl} className="relative aspect-square overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element -- client-side object URL preview, not an optimizable remote asset */}
                <img src={p.previewUrl} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
                  aria-label="Remove photo"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {busy && <p className="text-xs text-muted-foreground">Processing…</p>}

        {!lockedCategory && (
          <div className="space-y-1.5">
            <Label htmlFor="photo-category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as PhotoCategory)}>
              <SelectTrigger id="photo-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PHOTO_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {PHOTO_CATEGORY_LABEL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {stages && stages.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="photo-stage">Crop stage (optional)</Label>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger id="photo-stage">
                <SelectValue placeholder="Not specified" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="photo-caption">Caption</Label>
          <Input id="photo-caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="e.g. Flowering condition" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="photo-observation">Observation</Label>
          <Textarea
            id="photo-observation"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="What did you notice in the field?"
          />
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={submitting || busy || photos.length === 0}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              `Upload ${photos.length || ""} photo${photos.length === 1 ? "" : "s"}`.trim()
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
