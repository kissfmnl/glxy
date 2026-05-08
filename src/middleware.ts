import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

function normalizeHost(host: string) {
  const hostname = host.split(":")[0] || host;
  return hostname.replace(/^www\./i, "").toLowerCase();
}

// 1 service, 2 domeinen:
// - `testkiss.nl` -> publieke landing (bezoekers)
// - `app.testkiss.nl` -> DJ-portaal (root "/" redirectt naar dashboard/login)
export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const host = normalizeHost(req.headers.get("host") || "");

  const isAppSubdomain = host === "app.testkiss.nl";
  const isVisitorDomain = host === "testkiss.nl";

  // Auth token ophalen (JWT via NextAuth)
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Root host-routing
  if (pathname === "/") {
    if (isAppSubdomain) {
      const dest = token ? "/dashboard" : "/login";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    // Visitor domain: laat de publieke landing renderen.
    return NextResponse.next();
  }

  // Protected routes (DJ/Admin)
  const isProtected =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/whatsapp" ||
    pathname.startsWith("/whatsapp/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Alleen ADMIN users op /admin
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      if ((token as any).role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  // Als iemand via testkiss.nl op /dashboard probeert: redirect naar login (beschermd)
  if (isVisitorDomain && isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/dashboard/:path*",
    "/whatsapp",
    "/whatsapp/:path*",
    "/admin",
    "/admin/:path*",
    "/settings",
    "/settings/:path*",
  ],
};
