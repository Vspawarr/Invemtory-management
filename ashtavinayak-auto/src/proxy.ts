import { NextRequest, NextResponse } from "next/server";

/**
 * UX-only redirects (Next 16 uses proxy.ts in place of middleware.ts).
 * This is NOT the security boundary — every admin/account page and every
 * mutating server action independently verifies auth + role server-side
 * via lib/auth-guard.ts. This proxy only avoids flashing protected UI to a
 * cookie-less visitor before the page itself redirects.
 */
export function proxy(request: NextRequest) {
  const hasSessionCookie =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  const { pathname } = request.nextUrl;

  if (!hasSessionCookie && (pathname.startsWith("/admin") || pathname.startsWith("/account"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
