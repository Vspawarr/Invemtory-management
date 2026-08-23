import { NextResponse } from "next/server";

import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAdminRoute = pathname.startsWith("/admin");
  const isFarmerRoute = pathname.startsWith("/farmer");

  if (!isAdminRoute && !isFarmerRoute) return NextResponse.next();

  if (!session) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user.role;

  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/farmer/dashboard", req.nextUrl.origin));
  }

  if (isFarmerRoute && role !== "FARMER") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/farmer/:path*"],
};
