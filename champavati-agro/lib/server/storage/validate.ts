import { randomUUID } from "crypto";
import { fileTypeFromBuffer } from "file-type";

import { MAX_FILE_SIZE_BYTES, MAX_FILES_PER_UPLOAD } from "@/lib/photo-limits";

export { MAX_FILE_SIZE_BYTES, MAX_FILES_PER_UPLOAD };

/** Sniffed content type (via magic bytes, never the browser-declared MIME
 * type or filename) must be one of these — anything else, including an
 * executable or script renamed to look like an image, is rejected. */
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ValidatedImage = { buffer: Buffer; mimeType: string; ext: string };
export type ValidationError = { error: string };

/** Validates one file's actual content (magic-byte sniffed, not trusted from
 * the client) against the allowed image types and size limit. Never trusts
 * the browser-supplied MIME type or the original filename. */
export async function validateImageFile(buffer: Buffer): Promise<ValidatedImage | ValidationError> {
  if (buffer.byteLength === 0) return { error: "File is empty." };
  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    return { error: `File exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit.` };
  }

  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_MIME_TYPES.includes(detected.mime as (typeof ALLOWED_MIME_TYPES)[number])) {
    return { error: "File content is not a supported image (JPEG, PNG, or WebP)." };
  }

  return { buffer, mimeType: detected.mime, ext: detected.ext };
}

export function tooManyFiles(count: number): boolean {
  return count > MAX_FILES_PER_UPLOAD;
}

/** A fresh, opaque storage key — never derived from the original filename,
 * which is stored separately (sanitized, display-only) and never used as a
 * path component. */
export function generateStorageKey(ext: string): string {
  return `${randomUUID()}.${ext}`;
}

/** Sanitizes an original filename for display/metadata only — strips path
 * separators and control characters, truncates to a sane length. Never used
 * to build a storage path. */
export function sanitizeOriginalFilename(name: string | undefined | null): string | null {
  if (!name) return null;
  const cleaned = name.replace(/[/\\]/g, "").replace(/[\x00-\x1f]/g, "").trim();
  return cleaned.length === 0 ? null : cleaned.slice(0, 200);
}
