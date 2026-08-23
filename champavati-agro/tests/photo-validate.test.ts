import { describe, expect, it } from "vitest";

import {
  validateImageFile,
  generateStorageKey,
  sanitizeOriginalFilename,
  tooManyFiles,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_UPLOAD,
  ALLOWED_MIME_TYPES,
} from "@/lib/server/storage/validate";

// A minimal buffer with a real JPEG magic-byte signature (FF D8 FF E0) —
// file-type's detector is purely signature-based for JPEG, so this is
// enough to be genuinely sniffed as image/jpeg without a full valid file.
const MINIMAL_JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);

describe("validateImageFile — content-sniffed (never trusts declared MIME/filename)", () => {
  it("accepts a real image based on its actual magic bytes", async () => {
    const result = await validateImageFile(MINIMAL_JPEG);
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.mimeType).toBe("image/jpeg");
      expect(ALLOWED_MIME_TYPES).toContain(result.mimeType);
    }
  });

  it("rejects an empty file", async () => {
    const result = await validateImageFile(Buffer.alloc(0));
    expect("error" in result).toBe(true);
  });

  it("rejects a file exceeding the size limit", async () => {
    const oversized = Buffer.concat([MINIMAL_JPEG, Buffer.alloc(MAX_FILE_SIZE_BYTES)]);
    const result = await validateImageFile(oversized);
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error).toMatch(/exceeds/i);
  });

  it("rejects a Windows executable disguised with any filename/extension — content sniffing catches it regardless", async () => {
    // MZ header — a real executable's actual magic bytes, not a text stand-in.
    const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0, 0, 0, 0, 0, 0, 0]);
    const result = await validateImageFile(exeBuffer);
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error).toMatch(/not a supported image/i);
  });

  it("rejects a plain text file with no recognizable image signature", async () => {
    const textBuffer = Buffer.from("this is definitely not an image");
    const result = await validateImageFile(textBuffer);
    expect("error" in result).toBe(true);
  });

  it("rejects an unsupported-but-real image format (e.g. an ELF binary, standing in for anything outside the JPEG/PNG/WebP allowlist)", async () => {
    const elfBuffer = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0, 0, 0, 0, 0, 0, 0, 0]);
    const result = await validateImageFile(elfBuffer);
    expect("error" in result).toBe(true);
  });
});

describe("tooManyFiles", () => {
  it("flags a batch over the per-upload cap", () => {
    expect(tooManyFiles(MAX_FILES_PER_UPLOAD + 1)).toBe(true);
    expect(tooManyFiles(MAX_FILES_PER_UPLOAD)).toBe(false);
    expect(tooManyFiles(1)).toBe(false);
  });
});

describe("generateStorageKey — safe, opaque, never derived from user input", () => {
  it("produces a key with the given extension", () => {
    const key = generateStorageKey("jpg");
    expect(key.endsWith(".jpg")).toBe(true);
  });

  it("never reuses a key across calls", () => {
    const keys = new Set(Array.from({ length: 20 }, () => generateStorageKey("jpg")));
    expect(keys.size).toBe(20);
  });

  it("contains no path separators — cannot be used for path traversal", () => {
    const key = generateStorageKey("png");
    expect(key).not.toMatch(/[/\\]/);
  });
});

describe("sanitizeOriginalFilename — display-only, never a storage path", () => {
  it("strips path separators", () => {
    expect(sanitizeOriginalFilename("../../etc/passwd.jpg")).not.toMatch(/[/\\]/);
  });

  it("strips control characters", () => {
    const withControlChars = "photo\x00\x1f.jpg";
    expect(sanitizeOriginalFilename(withControlChars)).toBe("photo.jpg");
  });

  it("truncates very long filenames", () => {
    const long = "a".repeat(500) + ".jpg";
    const result = sanitizeOriginalFilename(long);
    expect(result!.length).toBeLessThanOrEqual(200);
  });

  it("returns null for empty/missing input, never an empty string", () => {
    expect(sanitizeOriginalFilename(null)).toBeNull();
    expect(sanitizeOriginalFilename(undefined)).toBeNull();
    expect(sanitizeOriginalFilename("")).toBeNull();
  });
});
