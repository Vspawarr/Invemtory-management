import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@prisma/client";
import type { Session } from "next-auth";

/**
 * Server-side authorization. This — not src/proxy.ts — is the real security
 * boundary: every admin/account page, layout, and mutating server action
 * must call one of these before doing anything sensitive.
 */

const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "SALES"];

export async function requireUser(): Promise<NonNullable<Session["user"]>> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

export async function requireRole(...roles: Role[]): Promise<NonNullable<Session["user"]>> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect("/");
  }
  return user;
}

export async function requireAdmin(): Promise<NonNullable<Session["user"]>> {
  return requireRole(...ADMIN_ROLES);
}

export async function requireSuperAdmin(): Promise<NonNullable<Session["user"]>> {
  return requireRole("SUPER_ADMIN");
}

/** Non-redirecting variant for server actions, which should return a typed error instead. */
export async function getSessionUser(): Promise<Session["user"] | null> {
  const session = await auth();
  return session?.user ?? null;
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function assertRole(...roles: Role[]): Promise<NonNullable<Session["user"]>> {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) {
    throw new UnauthorizedError();
  }
  return user;
}

export async function assertAdmin(): Promise<NonNullable<Session["user"]>> {
  return assertRole(...ADMIN_ROLES);
}

export async function assertSuperAdmin(): Promise<NonNullable<Session["user"]>> {
  return assertRole("SUPER_ADMIN");
}

export async function assertUser(): Promise<NonNullable<Session["user"]>> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
