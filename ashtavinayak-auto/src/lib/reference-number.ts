import crypto from "crypto";

const REFERENCE_PREFIX = "AAC";

/** Human-friendly reference number, e.g. AAC-2026-000001 (from the submission's autoincrement seq). */
export function formatReferenceNumber(seq: number, date = new Date()): string {
  return `${REFERENCE_PREFIX}-${date.getFullYear()}-${String(seq).padStart(6, "0")}`;
}

/**
 * Cryptographically random public tracking token for the seller status page.
 * The plaintext is shown once to the seller; only its SHA-256 hash is stored.
 */
export function generateTrackingToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, tokenHash: hashTrackingToken(token) };
}

export function hashTrackingToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Masked representation for any internal reference — never log the full token. */
export function maskToken(token: string): string {
  if (token.length <= 12) return "***";
  return `${token.slice(0, 6)}...${token.slice(-6)}`;
}

export function submissionStatusPath(referenceNumber: string, token: string): string {
  return `/sell-your-vehicle/status/${encodeURIComponent(referenceNumber)}?token=${encodeURIComponent(token)}`;
}

export function submissionStatusUrl(referenceNumber: string, token: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base}${submissionStatusPath(referenceNumber, token)}`;
}
