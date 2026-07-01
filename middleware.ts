import { NextRequest, NextResponse } from "next/server";
import { verifyToken, TOKEN_COOKIE_NAME } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(TOKEN_COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/leads/:path*",
    "/customers/:path*",
    "/followups/:path*",
    "/quotations/:path*",
    "/invoices/:path*",
    "/payments/:path*",
    "/projects/:path*",
    "/expenses/:path*",
    "/reports/:path*",
    "/api/dashboard/:path*",
    "/api/leads/:path*",
    "/api/customers/:path*",
    "/api/followups/:path*",
    "/api/quotations/:path*",
    "/api/invoices/:path*",
    "/api/payments/:path*",
    "/api/projects/:path*",
    "/api/expenses/:path*",
  ],
};
