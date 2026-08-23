import "server-only";

import type { StorageProvider } from "./types";
import { filesystemProvider } from "./filesystem-provider";
import { vercelBlobProvider } from "./vercel-blob-provider";

function resolveProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || "filesystem";
  switch (provider) {
    case "filesystem":
      return filesystemProvider;
    case "vercel-blob":
      return vercelBlobProvider;
    default:
      throw new Error(
        `Unsupported STORAGE_PROVIDER "${provider}" — only "filesystem" and "vercel-blob" are ` +
          `implemented. Add a new file under lib/server/storage/ implementing StorageProvider ` +
          `and register it here before switching this env var.`
      );
  }
}

/** The active storage provider for this deployment. Every call site — the
 * upload action and the authenticated serving route — goes through this
 * single export, never a provider file directly. */
export const storage: StorageProvider = resolveProvider();

export type { StorageProvider } from "./types";
