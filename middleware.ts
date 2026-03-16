import { NextRequest, NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE } from "@/lib/auth";

function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith("/vote") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/login") ||
    pathname === "/favicon.ico"
  );
}

export function middleware(request: NextRequest) {
  const password = process.env.ADMIN_ACCESS_PASSWORD;
  if (!password) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;
  if (authCookie === password) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
