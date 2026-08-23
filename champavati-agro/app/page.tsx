import { redirect } from "next/navigation";

import { auth } from "@/auth";

/** The root route is never rendered — it only routes people to where they
 * actually belong, the same way every protected layout already decides
 * that: signed-in admins/farmers go straight to their dashboard, everyone
 * else goes to /login. */
export default async function Home() {
  const session = await auth();

  if (!session) redirect("/login");
  redirect(session.user.role === "ADMIN" ? "/admin/dashboard" : "/farmer/dashboard");
}
