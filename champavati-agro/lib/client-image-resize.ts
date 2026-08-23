"use client";

/**
 * Downscales an image client-side (Canvas API) before it ever leaves the
 * device — mobile camera photos are routinely 10-40MB, and there is no
 * reason to upload or store that. Re-encodes as JPEG at a fixed max
 * dimension, which is also how we obtain accurate pixel dimensions without
 * any server-side image-processing dependency (no sharp/native binary).
 *
 * If the browser can't decode the file (an unsupported format), falls back
 * to uploading it unresized — server-side content validation is the real
 * gate either way, so an unsupported format is rejected there with a clear
 * error instead of silently failing here.
 */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

export interface ResizedImage {
  blob: Blob;
  width: number | null;
  height: number | null;
}

export async function resizeImageFile(file: File): Promise<ResizedImage> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) throw new Error("Could not encode image");

    return { blob, width, height };
  } catch {
    return { blob: file, width: null, height: null };
  }
}
