import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        if (!token) return false;
        if (req.nextUrl.pathname.startsWith("/admin")) return token.role === "ADMIN";
        return true;
      },
    },
  },
);

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/admin/:path*", "/whatsapp/:path*"],
};
