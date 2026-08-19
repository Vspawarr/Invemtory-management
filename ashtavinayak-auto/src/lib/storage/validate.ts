/**
 * Upload validation: extension + MIME whitelist, size limits, count limits,
 * and magic-byte sniffing so a renamed executable can't slip through.
 * SVG and all executable/script content types are rejected.
 */

export const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MIN_IMAGES = 1;
export const MAX_IMAGES = 15;

export interface ValidatedImage {
  buffer: Buffer;
  extension: string;
  mimeType: string;
}

function sniffImageType(buffer: Buffer): "jpg" | "png" | "webp" | null {
  if (buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  )
    return "png";
  // WEBP: "RIFF" .... "WEBP"
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  )
    return "webp";
  return null;
}

export async function validateImageFile(
  file: File
): Promise<{ ok: true; image: ValidatedImage } | { ok: false; error: string }> {
  if (file.size === 0) return { ok: false, error: "Empty file." };
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: `"${file.name}" is larger than 5 MB.` };
  }

  const extension = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number])) {
    return { ok: false, error: `"${file.name}": only JPG, JPEG, PNG and WEBP files are allowed.` };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return { ok: false, error: `"${file.name}" has an unsupported file type.` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffImageType(buffer);
  if (!sniffed) {
    return { ok: false, error: `"${file.name}" is not a valid image file.` };
  }
  // Normalize the stored extension to what the bytes actually are.
  return { ok: true, image: { buffer, extension: sniffed, mimeType: mimeFor(sniffed) } };
}

export function mimeFor(extension: string): string {
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}
