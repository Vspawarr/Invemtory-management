import "server-only";

import { put, get, del } from "@vercel/blob";

import type { StorageProvider } from "./types";

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}

/**
 * Vercel Blob-backed provider, for deployments (e.g. Vercel) with no
 * persistent local disk — the filesystem provider's ROOT folder wouldn't
 * survive between serverless invocations there.
 *
 * Every object is written and read with `access: "private"`: a private
 * blob has no public URL and can only be fetched with our own
 * BLOB_READ_WRITE_TOKEN (server-only, never sent to the client). This
 * preserves the exact trust boundary the filesystem provider already had —
 * bytes are never reachable except through the authenticated
 * app/api/photos/[id] route, which re-checks RBAC before ever calling
 * `storage.read()`. `addRandomSuffix: false` keeps the object addressable
 * by exactly the opaque key we generated (generateStorageKey), the same
 * key stored on CropPhoto — no separate URL needs to be persisted.
 */
export const vercelBlobProvider: StorageProvider = {
  async upload(key, buffer) {
    await put(key, buffer, { access: "private", addRandomSuffix: false });
  },
  async read(key) {
    const result = await get(key, { access: "private" });
    if (!result || result.statusCode !== 200) {
      throw new Error(`Storage key not found: ${key}`);
    }
    return streamToBuffer(result.stream);
  },
  async delete(key) {
    await del(key);
  },
};
