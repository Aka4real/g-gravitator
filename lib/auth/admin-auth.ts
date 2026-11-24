import crypto from "node:crypto";
import { cookies } from "next/headers";
import {
  findActiveMcpTokenByHash,
  listAdminUsers,
} from "@/lib/db/repository";
import type {
  McpPermissionsMode,
  McpRolePreset,
  McpScopeMap,
} from "@/lib/supabase/types";

export const ADMIN_SESSION_COOKIE = "gg_ops_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface AdminSessionPayload {
  sub: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN";
  iat: number;
  exp: number;
}

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN";
}

function getSessionSecret(): string {
  const explicit = process.env.ADMIN_SESSION_SECRET?.trim();
  if (explicit && explicit.length >= 16) {
    return explicit;
  }
  const seed =
    process.env.CRON_SECRET?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    "g-gravitator-ops-session-fallback-v1";
  return crypto
    .createHash("sha256")
    .update(`gg-ops-hmac-key::${seed}`)
    .digest("hex");
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;

  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, "hex");
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function signSessionToken(
  user: Pick<AuthenticatedAdmin, "id" | "email" | "name" | "role">
): string {
  const now = Date.now();
  const payload: AdminSessionPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    iat: now,
    exp: now + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): AdminSessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  try {
    const expectedSig = crypto
      .createHmac("sha256", getSessionSecret())
      .update(encoded)
      .digest("base64url");
    const sigBuf = Buffer.from(sig, "utf8");
    const expectedBuf = Buffer.from(expectedSig, "utf8");
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as AdminSessionPayload;
    if (!payload?.sub || !payload?.email || !payload?.exp) return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setAdminSessionCookie(
  user: AuthenticatedAdmin
): Promise<void> {
  const token = signSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getAuthenticatedAdmin(): Promise<AuthenticatedAdmin | null> {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!rawToken) return null;

    const payload = verifySessionToken(rawToken);
    if (!payload) return null;

    const allUsers = await listAdminUsers();
    if (allUsers.length > 0) {
      const existing = allUsers.find((u) => u.id === payload.sub);
      if (!existing) return null;
      return {
        id: existing.id,
        email: existing.email,
        name: existing.name,
        role: existing.role,
      };
    }

    // Signed stateless fallback if store hasn't hydrated admin_users across ephemeral serverless instance
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export interface VerifiedMcpAuth {
  authorized: boolean;
  tokenId?: string;
  label: string;
  permissionsMode: McpPermissionsMode;
  rolePreset?: McpRolePreset;
  customScopes?: McpScopeMap;
  expiresAt?: string | null;
  rateLimitRpm?: number;
}

export async function verifyMcpAuth(request: Request): Promise<VerifiedMcpAuth> {
  const authHeader = request.headers.get("authorization") || "";
  const apiKeyHeader = request.headers.get("x-mcp-api-key") || "";
  let token = "";

  if (authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.slice(7).trim();
  } else if (apiKeyHeader.trim()) {
    token = apiKeyHeader.trim();
  }

  if (!token) {
    return { authorized: false, label: "anonymous", permissionsMode: "readonly" };
  }

  const envKey = process.env.MCP_API_KEY?.trim();
  if (envKey) {
    const providedDigest = crypto.createHash("sha256").update(token).digest();
    const expectedDigest = crypto.createHash("sha256").update(envKey).digest();
    if (crypto.timingSafeEqual(providedDigest, expectedDigest)) {
      return {
        authorized: true,
        tokenId: "env-master",
        label: "Env Master MCP Key",
        permissionsMode: "inherit",
        rolePreset: "inherit",
        rateLimitRpm: 120,
      };
    }
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const matched = await findActiveMcpTokenByHash(tokenHash);
  if (matched) {
    return {
      authorized: true,
      tokenId: matched.id,
      label: `MCP:${matched.name}`,
      permissionsMode: matched.permissions_mode,
      rolePreset: matched.role_preset,
      customScopes: matched.custom_scopes,
      expiresAt: matched.expires_at ?? null,
      rateLimitRpm: matched.rate_limit_rpm ?? 60,
    };
  }

  return { authorized: false, label: "invalid", permissionsMode: "readonly" };
}
