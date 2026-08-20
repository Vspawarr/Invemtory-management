import { headers } from "next/headers";

/**
 * In-memory sliding-window rate limiter, keyed by `action:ip`.
 * Suitable for a single-instance deployment; swap the store for Redis to scale out.
 */
const buckets = new Map<string, number[]>();

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  submission: { max: 5, windowMs: 60 * 60 * 1000 },
  enquiry: { max: 10, windowMs: 60 * 60 * 1000 },
  callback: { max: 10, windowMs: 60 * 60 * 1000 },
  "status-lookup": { max: 10, windowMs: 60 * 60 * 1000 },
  register: { max: 10, windowMs: 60 * 60 * 1000 },
  contact: { max: 10, windowMs: 60 * 60 * 1000 },
};

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** Returns true when the caller is within limits; false when rate-limited. */
export async function checkRateLimit(action: keyof typeof LIMITS | string): Promise<boolean> {
  const limit = LIMITS[action] ?? { max: 20, windowMs: 60 * 60 * 1000 };
  const ip = await getClientIp();
  const key = `${action}:${ip}`;
  const now = Date.now();
  const windowStart = now - limit.windowMs;

  const timestamps = (buckets.get(key) ?? []).filter((t) => t > windowStart);
  if (timestamps.length >= limit.max) {
    buckets.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  buckets.set(key, timestamps);

  // Opportunistic cleanup to bound memory
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => t <= windowStart)) buckets.delete(k);
    }
  }
  return true;
}
