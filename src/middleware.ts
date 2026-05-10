import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

function portalAdminRole(role: unknown): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (!portalAdminRole(token?.role)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        if (!token) return false;
        if (req.nextUrl.pathname.startsWith("/admin")) return portalAdminRole(token.role);
        return true;
      },
    },
  },
);

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/admin/:path*", "/whatsapp/:path*"],
};
