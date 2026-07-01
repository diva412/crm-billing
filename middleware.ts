import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];
const TOKEN_COOKIE_NAME = "crm_token";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Just check token exists — full verify happens in each API route
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
    "/tax/:path*",
    "/profile/:path*",
    "/api/dashboard/:path*",
    "/api/leads/:path*",
    "/api/customers/:path*",
    "/api/followups/:path*",
    "/api/quotations/:path*",
    "/api/invoices/:path*",
    "/api/payments/:path*",
    "/api/projects/:path*",
    "/api/expenses/:path*",
    "/api/tax/:path*",
    "/api/profile/:path*",
  ],
};