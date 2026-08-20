import { localStorageDriver } from "./local";
import { cloudinaryStorageDriver } from "./cloudinary";

export interface StoredFile {
  /** Public URL the file is served from */
  url: string;
  /** Provider-specific key used for deletion */
  storageKey: string;
}

export interface StorageDriver {
  put(buffer: Buffer, extension: string, mimeType: string): Promise<StoredFile>;
  delete(storageKey: string): Promise<void>;
}

/**
 * Storage abstraction: Cloudinary when configured via env, local filesystem
 * fallback otherwise (files served through /api/files/...).
 */
export function getStorage(): StorageDriver {
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    return cloudinaryStorageDriver;
  }
  return localStorageDriver;
}
