import { randomBytes, timingSafeEqual } from "node:crypto";

const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const sessions = new Map<string, number>();

export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.FOODIE_ADMIN_EMAIL?.trim() &&
    process.env.FOODIE_ADMIN_PASSWORD,
  );
}

export function adminCredentialsMatch(email: string, password: string): boolean {
  const adminEmail = process.env.FOODIE_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.FOODIE_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return false;
  return timingSafeStringEqual(email.trim().toLowerCase(), adminEmail) &&
    timingSafeStringEqual(password, adminPassword);
}

function timingSafeStringEqual(value: string, expected: string): boolean {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return valueBuffer.length === expectedBuffer.length && timingSafeEqual(valueBuffer, expectedBuffer);
}

export function createAdminSession(): string {
  const now = Date.now();
  for (const [token, expiresAt] of sessions) {
    if (expiresAt <= now) sessions.delete(token);
  }

  const token = randomBytes(32).toString("base64url");
  sessions.set(token, now + ADMIN_SESSION_TTL_MS);
  return token;
}

export function isAdminSessionValid(token: string): boolean {
  const expiresAt = sessions.get(token);
  if (expiresAt === undefined) return false;
  if (expiresAt <= Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function revokeAdminSession(token: string): void {
  sessions.delete(token);
}
