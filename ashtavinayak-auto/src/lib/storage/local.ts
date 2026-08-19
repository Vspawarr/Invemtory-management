import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { StorageDriver, StoredFile } from "./index";

const UPLOAD_ROOT = path.join(process.cwd(), "storage", "uploads");

export const localStorageDriver: StorageDriver = {
  async put(buffer: Buffer, extension: string): Promise<StoredFile> {
    const year = String(new Date().getFullYear());
    const name = `${crypto.randomUUID()}.${extension}`;
    const key = `${year}/${name}`;
    const dir = path.join(UPLOAD_ROOT, year);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), buffer);
    return { url: `/api/files/${key}`, storageKey: key };
  },

  async delete(storageKey: string): Promise<void> {
    const resolved = path.resolve(UPLOAD_ROOT, storageKey);
    if (!resolved.startsWith(UPLOAD_ROOT)) return;
    await unlink(resolved).catch(() => undefined);
  },
};

export { UPLOAD_ROOT };
