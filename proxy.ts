import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, authToken } from "@/lib/auth";

// Everything except the login screen requires the password cookie,
// including shared snapshot links.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = authToken();
  const authed = token !== null && request.cookies.get(AUTH_COOKIE)?.value === token;

  if (pathname === "/login" || pathname === "/api/login") {
    if (authed && pathname === "/login") {
      return NextResponse.redirect(new URL("/upload", request.url));
    }
    return NextResponse.next();
  }

  if (authed) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const login = new URL("/login", request.url);
  if (pathname !== "/") login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
