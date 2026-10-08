import { NextResponse } from "next/server";
import { AUTH_COOKIE, appPassword, authToken } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = authToken();
  if (!token || body?.password !== appPassword()) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
