import { promises as fs } from "fs";
import path from "path";

import type { StorageProvider } from "./types";

// A statically-known literal path, not built from an env var — Next's
// build-time file tracer needs to see the exact folder to scope tracing to
// it; an env-driven path defeats that static analysis and makes it trace
// (and bundle) the entire project for this one dynamic filesystem access.
const ROOT = path.join(process.cwd(), ".uploads");

/** Resolves `key` inside ROOT and rejects anything that would escape it
 * (defense in depth — our own keys are opaque UUIDs with no path
 * separators, but a provider should never trust a key blindly). */
function resolveWithinRoot(key: string): string {
  const resolved = path.resolve(ROOT, key);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) {
    throw new Error("Invalid storage key.");
  }
  return resolved;
}

export const filesystemProvider: StorageProvider = {
  async upload(key, buffer) {
    await fs.mkdir(ROOT, { recursive: true });
    await fs.writeFile(resolveWithinRoot(key), buffer);
  },
  async read(key) {
    return fs.readFile(resolveWithinRoot(key));
  },
  async delete(key) {
    await fs.rm(resolveWithinRoot(key), { force: true });
  },
};
