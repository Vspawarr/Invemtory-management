/** Client+server-safe upload limits — no Node-only imports, so the upload
 * dialog (a Client Component) can import this directly without pulling in
 * `crypto`/`file-type` from lib/server/storage/validate.ts, which re-exports
 * these same values for server-side enforcement (one source of truth). */
export const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
export const MAX_FILES_PER_UPLOAD = 6;
