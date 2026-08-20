"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react";
import { AppImage } from "@/components/app-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  id: string;
  url: string;
  altText?: string | null;
}

export function VehicleGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const goto = useCallback(
    (i: number) => setIndex((i + images.length) % images.length),
    [images.length]
  );

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goto(index - 1);
      if (e.key === "ArrowRight") goto(index + 1);
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, index, goto]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-muted text-muted-foreground">
        No photos available
      </div>
    );
  }

  const current = images[index];

  return (
    <div>
      <div className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        <AppImage
          src={current.url}
          alt={current.altText || title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
        />
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          aria-label="View fullscreen"
        >
          <Expand className="h-4 w-4" />
        </button>
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goto(index - 1)}
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goto(index + 1)}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "relative h-16 w-20 shrink-0 overflow-hidden rounded-md border-2",
                i === index ? "border-primary" : "border-transparent"
              )}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === index}
            >
              <AppImage src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-5xl border-none bg-transparent p-0 shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">{title} — photo {index + 1} of {images.length}</DialogTitle>
          <div className="relative aspect-[4/3] w-full">
            <AppImage src={current.url} alt={current.altText || title} fill sizes="90vw" className="object-contain" />
          </div>
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
            aria-label="Close fullscreen viewer"
          >
            <X className="h-5 w-5" />
          </button>
          {images.length > 1 && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => goto(index - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 hover:text-white"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => goto(index + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 hover:text-white"
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                {index + 1} / {images.length}
              </span>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
