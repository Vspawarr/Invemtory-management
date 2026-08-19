import crypto from "crypto";
import type { StorageDriver, StoredFile } from "./index";

/**
 * Minimal Cloudinary upload via its signed REST API (no SDK dependency).
 * Active only when CLOUDINARY_* env vars are configured.
 */
export const cloudinaryStorageDriver: StorageDriver = {
  async put(buffer: Buffer, extension: string, mimeType: string): Promise<StoredFile> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "ashtavinayak";
    const signaturePayload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(signaturePayload).digest("hex");

    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(buffer)], { type: mimeType }), `upload.${extension}`);
    form.append("api_key", apiKey);
    form.append("timestamp", String(timestamp));
    form.append("folder", folder);
    form.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: form }
    );
    if (!response.ok) {
      throw new Error(`Cloudinary upload failed with status ${response.status}`);
    }
    const result = (await response.json()) as { secure_url: string; public_id: string };
    return { url: result.secure_url, storageKey: result.public_id };
  },

  async delete(storageKey: string): Promise<void> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;

    const timestamp = Math.floor(Date.now() / 1000);
    const signaturePayload = `public_id=${storageKey}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(signaturePayload).digest("hex");

    const form = new FormData();
    form.append("public_id", storageKey);
    form.append("api_key", apiKey);
    form.append("timestamp", String(timestamp));
    form.append("signature", signature);

    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: form,
    }).catch(() => undefined);
  },
};
