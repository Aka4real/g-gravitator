import crypto from "node:crypto";
import { headers } from "next/headers";
import type { Dispatch } from "@/lib/supabase/types";

const DEFAULT_SHARE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

interface DispatchShareTokenPayload {
  typ: "dispatch_share";
  id: string;
  slug: string;
  iat: number;
  exp: number;
}

function getDispatchShareSecret(): string {
  const explicit = process.env.ADMIN_SESSION_SECRET?.trim();
  const seed =
    (explicit && explicit.length >= 16 ? explicit : null) ||
    process.env.CRON_SECRET?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    "g-gravitator-ops-session-fallback-v1";

  return crypto
    .createHash("sha256")
    .update(`gg-dispatch-share-hmac-v1::${seed}`)
    .digest("hex");
}

export function signDispatchShareToken(
  dispatch: Pick<Dispatch, "id" | "slug">,
  ttlMs = DEFAULT_SHARE_TTL_MS
): string {
  const now = Date.now();
  const payload: DispatchShareTokenPayload = {
    typ: "dispatch_share",
    id: dispatch.id,
    slug: dispatch.slug,
    iat: now,
    exp: now + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getDispatchShareSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyDispatchShareToken(
  token: string | null | undefined,
  dispatch: Pick<Dispatch, "id" | "slug">
): boolean {
  if (!token || !token.includes(".")) return false;
  const parts = token.trim().split(".");
  if (parts.length !== 2) return false;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return false;

  try {
    const expectedSig = crypto
      .createHmac("sha256", getDispatchShareSecret())
      .update(encoded)
      .digest("base64url");
    const sigBuf = Buffer.from(sig, "utf8");
    const expectedBuf = Buffer.from(expectedSig, "utf8");
    if (sigBuf.length !== expectedBuf.length) return false;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as DispatchShareTokenPayload;

    if (payload?.typ !== "dispatch_share") return false;
    if (payload.id !== dispatch.id || payload.slug !== dispatch.slug) return false;
    if (!payload.exp || Date.now() > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

function isLocalHostname(host: string): boolean {
  const bare = host.split(":")[0].toLowerCase();
  return bare === "localhost" || bare === "127.0.0.1" || bare === "0.0.0.0";
}

export function resolveOriginFromHeaders(
  hdrs: Pick<Headers, "get">
): string {
  const rawHost =
    hdrs.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    hdrs.get("host")?.split(",")[0]?.trim() ||
    "";
  const rawProto = hdrs.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (rawHost && isLocalHostname(rawHost)) {
    const proto = rawProto === "https" ? "https" : "http";
    return `${proto}://${rawHost}`;
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;

  if (rawHost) {
    const proto = rawProto || "https";
    return `${proto}://${rawHost}`;
  }

  return "https://ggravitator.com";
}

export async function getRequestOrigin(): Promise<string> {
  try {
    const hdrs = await headers();
    return resolveOriginFromHeaders(hdrs);
  } catch {
    return (
      process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
      "https://ggravitator.com"
    );
  }
}

export function getRequestOriginFromRequest(request: Request): string {
  const fromHeaders = resolveOriginFromHeaders(request.headers);
  if (fromHeaders !== "https://ggravitator.com") {
    return fromHeaders;
  }
  try {
    const url = new URL(request.url);
    if (isLocalHostname(url.host)) {
      return `${url.protocol}//${url.host}`;
    }
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
    return configured || `${url.protocol}//${url.host}`;
  } catch {
    return fromHeaders;
  }
}
