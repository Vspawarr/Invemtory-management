import "server-only";

import type { AppSession } from "./require-session";
import { ForbiddenError } from "./errors";

/** Throws unless the session belongs to an admin. */
export function requireAdmin(session: AppSession): void {
  if (session.user.role !== "ADMIN") {
    throw new ForbiddenError();
  }
}

/**
 * Throws unless the session is an admin, or a farmer whose own id matches
 * `farmerId`. This is the core ownership check every farmer-scoped DAL
 * function must run before returning data — never rely on the UI to hide
 * another farmer's records.
 */
export function assertOwnedByFarmer(session: AppSession, farmerId: string): void {
  if (session.user.role === "ADMIN") return;
  if (session.user.role === "FARMER" && session.user.farmerId === farmerId) return;
  throw new ForbiddenError();
}

/** Convenience wrapper for records that carry a `farmerId` field directly. */
export function assertRecordAccess(
  session: AppSession,
  record: { farmerId: string } | null
): void {
  if (!record) return;
  assertOwnedByFarmer(session, record.farmerId);
}

/** Returns the farmer-scoping where-clause fragment for the current session, or {} for admins. */
export function farmerScopeFilter(session: AppSession): { farmerId: string } | Record<string, never> {
  if (session.user.role === "ADMIN") return {};
  if (!session.user.farmerId) throw new ForbiddenError();
  return { farmerId: session.user.farmerId };
}
