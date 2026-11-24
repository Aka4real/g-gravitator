import crypto from "node:crypto";

interface RateLimitBucket {
  timestamps: number[];
}

const globalMcpGuards = globalThis as typeof globalThis & {
  __ggMcpRateLimits?: Map<string, RateLimitBucket>;
};

function getRateLimitMap(): Map<string, RateLimitBucket> {
  if (!globalMcpGuards.__ggMcpRateLimits) {
    globalMcpGuards.__ggMcpRateLimits = new Map<string, RateLimitBucket>();
  }
  return globalMcpGuards.__ggMcpRateLimits;
}

export function checkMcpTokenRateLimit(
  tokenKey: string,
  limitRpm = 60
): {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
} {
  const safeLimit = Math.max(1, Math.min(1000, Math.round(limitRpm || 60)));
  const now = Date.now();
  const windowMs = 60_000;
  const map = getRateLimitMap();
  const existing = map.get(tokenKey) ?? { timestamps: [] };
  const recent = existing.timestamps.filter((ts) => now - ts < windowMs);

  if (recent.length >= safeLimit) {
    const oldest = recent[0] ?? now;
    const resetMs = Math.max(1000, windowMs - (now - oldest));
    map.set(tokenKey, { timestamps: recent });
    return {
      allowed: false,
      limit: safeLimit,
      remaining: 0,
      resetSeconds: Math.ceil(resetMs / 1000),
    };
  }

  recent.push(now);
  map.set(tokenKey, { timestamps: recent });
  if (map.size > 500) {
    // Periodic pruning of stale buckets
    for (const [k, v] of map.entries()) {
      if (v.timestamps.length === 0 || now - v.timestamps[v.timestamps.length - 1] > windowMs * 5) {
        map.delete(k);
      }
    }
  }

  return {
    allowed: true,
    limit: safeLimit,
    remaining: Math.max(0, safeLimit - recent.length),
    resetSeconds: 60,
  };
}

function getGuardSecret(): string {
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.MCP_API_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "gg-mcp-dryrun-fallback-secret-v1";
  return crypto.createHash("sha256").update(secret).digest("hex");
}

export function issueBulkPurgeConfirmToken(params: {
  entity: string;
  olderThanDays: number;
  includePinned: boolean;
  candidateCount: number;
}): string {
  const payload = {
    e: params.entity,
    d: params.olderThanDays,
    p: params.includePinned,
    c: params.candidateCount,
    iat: Date.now(),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getGuardSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyBulkPurgeConfirmToken(
  token: string,
  expected: {
    entity: string;
    olderThanDays: number;
    includePinned: boolean;
    candidateCount: number;
  }
): { valid: boolean; reason?: string } {
  const parts = token.trim().split(".");
  if (parts.length !== 2) {
    return { valid: false, reason: "Invalid confirm_token format." };
  }
  const [encoded, providedSig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", getGuardSecret())
    .update(encoded)
    .digest("base64url");

  try {
    const a = Buffer.from(providedSig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { valid: false, reason: "confirm_token signature verification failed." };
    }
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as {
      e?: string;
      d?: number;
      p?: boolean;
      c?: number;
      iat?: number;
    };
    if (!payload.iat || Date.now() - payload.iat > 10 * 60 * 1000) {
      return { valid: false, reason: "confirm_token expired (run dry_run: true again)." };
    }
    if (
      payload.e !== expected.entity ||
      payload.d !== expected.olderThanDays ||
      payload.p !== expected.includePinned ||
      payload.c !== expected.candidateCount
    ) {
      return {
        valid: false,
        reason: "confirm_token parameters/candidate set no longer match current dataset (re-run dry_run: true).",
      };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: "Corrupted confirm_token." };
  }
}
