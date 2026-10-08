import { createHash } from "node:crypto";

export const AUTH_COOKIE = "meridian_auth";

/** Set with the APP_PASSWORD environment variable; nobody can sign in without it. */
export function appPassword(): string | null {
  return process.env.APP_PASSWORD || null;
}

/** Cookie value proving the visitor entered the current password. */
export function authToken(): string | null {
  const password = appPassword();
  if (!password) return null;
  return createHash("sha256").update(`meridian-auth:${password}`).digest("hex");
}
