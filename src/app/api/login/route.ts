import { NextRequest, NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE, ADMIN_AUTH_COOKIE_VALUE } from "@/lib/auth";

function getSafeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith("/")) {
    return "/";
  }
  return value;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");
  const expectedPassword = process.env.ADMIN_ACCESS_PASSWORD;
  const redirectPath = getSafeRedirectPath(request.nextUrl.searchParams.get("redirect"));

  if (!expectedPassword || password !== expectedPassword) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "1");
    loginUrl.searchParams.set("redirect", redirectPath);
    return NextResponse.redirect(loginUrl, 303);
  }

  const redirectUrl = new URL(redirectPath, request.url);
  const response = NextResponse.redirect(redirectUrl, 303);
  response.cookies.set(ADMIN_AUTH_COOKIE, ADMIN_AUTH_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
