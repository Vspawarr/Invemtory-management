"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { resizeImageFile } from "@/lib/client-image-resize";
import { MAX_FILES_PER_UPLOAD } from "@/lib/photo-limits";

export type PendingPhoto = { file: File; previewUrl: string; width: number | null; height: number | null };

/** Camera/gallery capture + client-side resize + multi-photo preview grid,
 * shared by every place in the app that lets an admin attach photos inline
 * to something else being created (a health record, a before/after
 * treatment result) — the standalone photo-upload flow uses the same
 * resize/preview building blocks via PhotoUploadDialog, just wrapped in its
 * own dialog chrome since it submits independently rather than alongside a
 * parent form. */
export function InlinePhotoPicker({
  value,
  onChange,
  label = "Photos (optional)",
}: {
  value: PendingPhoto[];
  onChange: (photos: PendingPhoto[]) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  async function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    if (value.length + fileList.length > MAX_FILES_PER_UPLOAD) {
      toast.error(`Add at most ${MAX_FILES_PER_UPLOAD} photos.`);
      return;
    }
    setBusy(true);
    const next: PendingPhoto[] = [];
    for (const raw of Array.from(fileList)) {
      const { blob, width, height } = await resizeImageFile(raw);
      const resized = new File([blob], raw.name || "photo.jpg", { type: blob.type || raw.type });
      next.push({ file: resized, previewUrl: URL.createObjectURL(resized), width, height });
    }
    onChange([...value, ...next]);
    setBusy(false);
  }

  function remove(index: number) {
    URL.revokeObjectURL(value[index].previewUrl);
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input
        ref={cameraRef}
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
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => cameraRef.current?.click()} disabled={busy}>
          <Camera className="size-4" /> Take Photo
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => galleryRef.current?.click()} disabled={busy}>
          <ImagePlus className="size-4" /> Gallery
        </Button>
      </div>
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {value.map((p, i) => (
            <div key={p.previewUrl} className="relative aspect-square overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element -- client-side object URL preview */}
              <img src={p.previewUrl} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
                aria-label="Remove photo"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Builds the shared FormData fields (files + dims) for a batch of pending
 * photos — the caller still sets cropId/category/phase/context fields. */
export function appendPhotosToFormData(formData: FormData, photos: PendingPhoto[]) {
  formData.set("dims", JSON.stringify(photos.map((p) => ({ width: p.width, height: p.height }))));
  for (const p of photos) formData.append("files", p.file);
}
