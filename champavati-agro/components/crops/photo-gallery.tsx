"use client";

import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { PhotoLightbox } from "@/components/crops/photo-lightbox";
import { PHOTO_CATEGORY_LABEL } from "@/lib/photo-categories";
import type { GalleryPhoto } from "@/lib/photo-types";
import { loadMorePhotosAction } from "@/lib/server/actions/photos";

export function PhotoGallery({
  cropId,
  initialPhotos,
  initialTotal,
  editable = false,
  hideObservation = false,
}: {
  cropId: string;
  initialPhotos: GalleryPhoto[];
  initialTotal: number;
  editable?: boolean;
  hideObservation?: boolean;
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  async function loadMore() {
    setLoading(true);
    const result = await loadMorePhotosAction(cropId, photos.length);
    setLoading(false);
    if (result.ok) {
      setPhotos((p) => [...p, ...result.data.photos]);
      setTotal(result.data.total);
    }
  }

  function handleDeleted(photoId: string) {
    setPhotos((p) => p.filter((x) => x.id !== photoId));
    setTotal((t) => t - 1);
    setLightboxIndex(null);
  }

  if (photos.length === 0) {
    return (
      <EmptyState
        icon={Camera}
        title="No photos yet"
        description="Field photos and observations will appear here."
        className="py-10"
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-lg border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- served from the authenticated /api/photos route, not an optimizable static/remote asset */}
            <img
              src={`/api/photos/${photo.id}`}
              alt={photo.caption ?? PHOTO_CATEGORY_LABEL[photo.category]}
              loading="lazy"
              className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <span className="absolute bottom-1 left-1">
              <Badge variant="secondary" className="text-[9px]">
                {PHOTO_CATEGORY_LABEL[photo.category]}
              </Badge>
            </span>
          </button>
        ))}
      </div>

      {photos.length < total && (
        <Button variant="outline" size="sm" className="mt-3" onClick={loadMore} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : `Load more (${total - photos.length})`}
        </Button>
      )}

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
          onDeleted={handleDeleted}
          editable={editable}
          hideObservation={hideObservation}
        />
      )}
    </>
  );
}
