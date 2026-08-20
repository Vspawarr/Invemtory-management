"use client";

import { useState, useCallback } from "react";
import { ImagePlus, X, ArrowLeft, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPTED = "image/jpeg,image/jpg,image/png,image/webp";

export interface PendingImage {
  file: File;
  previewUrl: string;
}

/**
 * Client-side multi-photo picker with preview, removal, and reordering
 * (up/down — no drag-and-drop). Selected files are handed to the parent via
 * onChange so the caller can attach them to a FormData submit in order.
 * Camera/gallery selection works out of the box via the native file input.
 */
export function ImageUploader({
  images,
  onChange,
  maxImages = 15,
  minImages = 1,
}: {
  images: PendingImage[];
  onChange: (images: PendingImage[]) => void;
  maxImages?: number;
  minImages?: number;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      setError(null);
      const incoming = Array.from(fileList);
      const room = maxImages - images.length;
      if (incoming.length > room) {
        setError(`You can add up to ${maxImages} photos in total.`);
      }
      const accepted = incoming.slice(0, Math.max(room, 0));
      const next = [
        ...images,
        ...accepted.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
      ];
      onChange(next);
    },
    [images, maxImages, onChange]
  );

  const removeAt = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    onChange(next);
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <label
        htmlFor="image-uploader-input"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-secondary/40 px-4 py-8 text-center transition-colors hover:bg-secondary/70"
      >
        <ImagePlus className="h-6 w-6 text-muted-foreground" />
        <span className="text-sm font-medium">Tap to add photos</span>
        <span className="text-xs text-muted-foreground">
          JPG, PNG or WEBP · up to 5MB each · {minImages}-{maxImages} photos
        </span>
        <input
          id="image-uploader-input"
          type="file"
          accept={ACCEPTED}
          multiple
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, index) => (
            <div
              key={img.previewUrl}
              className={cn(
                "group relative aspect-[4/3] overflow-hidden rounded-md border bg-muted",
                index === 0 && "ring-2 ring-accent"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.previewUrl} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
              {index === 0 && (
                <span className="absolute left-1 top-1 flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                  <Star className="h-3 w-3 fill-current" /> Primary
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-white hover:bg-white/20 hover:text-white"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move earlier"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-white hover:bg-white/20 hover:text-white"
                  onClick={() => removeAt(index)}
                  aria-label="Remove photo"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-white hover:bg-white/20 hover:text-white"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                  aria-label="Move later"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
