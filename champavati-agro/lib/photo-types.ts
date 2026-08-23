import type { PhotoCategory, PhotoPhase } from "@/lib/photo-categories";

/** The shape returned by lib/server/dal/photos.ts's PHOTO_SELECT — shared so
 * client gallery/lightbox components can type their props without importing
 * server-only DAL code. */
export interface GalleryPhoto {
  id: string;
  category: PhotoCategory;
  phase: PhotoPhase | null;
  cropId: string | null;
  farmerId: string | null;
  landParcelId: string | null;
  timelineStageId: string | null;
  timelineStage: { stageNameSnapshot: string } | null;
  healthRecordId: string | null;
  applicationId: string | null;
  treatmentResultId: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  originalFilename: string | null;
  caption: string | null;
  observation: string | null;
  uploadedById: string;
  createdAt: Date;
}
