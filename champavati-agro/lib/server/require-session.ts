import "server-only";

import type { Session } from "next-auth";

import { auth } from "@/auth";

import { UnauthenticatedError } from "./errors";

export type AppSession = Session;

/** The single place Server Actions/Server Components obtain the session from — never trust a client-supplied role/farmerId. */
export async function requireSession(): Promise<AppSession> {
  const session = await auth();
  if (!session) throw new UnauthenticatedError();
  return session;
}
