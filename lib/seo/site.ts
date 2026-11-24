import type { Dispatch } from "@/lib/supabase/types";

export const PRIMARY_BRAND_DOMAIN = "ggravitator.xyz";
export const CANONICAL_HOST = "www.ggravitator.xyz";
export const DEFAULT_CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;

export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MAX = 160;

function stripPort(host: string): string {
  return host.split(":")[0].trim().toLowerCase();
}

export function isLocalHostname(host: string): boolean {
  const bare = stripPort(host);
  return bare === "localhost" || bare === "127.0.0.1" || bare === "0.0.0.0";
}

export function isVercelAppHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const bare = stripPort(host);
  return bare.endsWith(".vercel.app") || bare.endsWith(".now.sh");
}

export function isLegacyDomainHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const bare = stripPort(host);
  return (
    bare === "ggravitator.com" ||
    bare.endsWith(".ggravitator.com") ||
    isVercelAppHost(bare)
  );
}

export function isOwnedSiteHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const bare = stripPort(host);
  return (
    bare === PRIMARY_BRAND_DOMAIN ||
    bare.endsWith(`.${PRIMARY_BRAND_DOMAIN}`)
  );
}

function parseConfiguredCustomSiteUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (isLegacyDomainHost(parsed.host)) {
      return null;
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

/**
 * Resolves the canonical public origin for sitemaps, canonical tags, JSON-LD,
 * feeds, and share URLs.
 *
 * Precedence:
 * 1. Explicit custom domain in `NEXT_PUBLIC_SITE_URL` (ignoring legacy `.com` or `.vercel.app` values)
 * 2. Localhost/dev host from request headers or URL
 * 3. Owned `.xyz` host from incoming request headers (`www.ggravitator.xyz` or `ggravitator.xyz`)
 * 4. `DEFAULT_CANONICAL_ORIGIN` (`https://www.ggravitator.xyz`)
 */
export function resolveCanonicalOrigin(params?: {
  headers?: Pick<Headers, "get"> | null;
  requestUrl?: string | null;
}): string {
  const hdrs = params?.headers;
  const rawHeaderHost =
    hdrs?.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    hdrs?.get("host")?.split(",")[0]?.trim() ||
    "";
  const rawHeaderProto = hdrs?.get("x-forwarded-proto")?.split(",")[0]?.trim();

  let requestHost = "";
  let requestProto = "";
  if (params?.requestUrl) {
    try {
      const parsed = new URL(params.requestUrl);
      requestHost = parsed.host;
      requestProto = parsed.protocol.replace(/:$/, "");
    } catch {
      // Ignore malformed request URL
    }
  }

  const effectiveHost = rawHeaderHost || requestHost;
  const explicitProto = rawHeaderProto || requestProto;
  const effectiveProto = explicitProto || "https";

  if (effectiveHost && isLocalHostname(effectiveHost)) {
    const proto = explicitProto === "https" ? "https" : "http";
    return `${proto}://${effectiveHost}`;
  }

  if (effectiveHost && isOwnedSiteHost(effectiveHost)) {
    return `https://${effectiveHost.toLowerCase()}`;
  }

  const configuredCustom = parseConfiguredCustomSiteUrl();
  if (configuredCustom) {
    return configuredCustom;
  }

  if (
    effectiveHost &&
    !isLegacyDomainHost(effectiveHost) &&
    !isVercelAppHost(effectiveHost)
  ) {
    return `${effectiveProto}://${effectiveHost}`;
  }

  return DEFAULT_CANONICAL_ORIGIN;
}

export function cleanSeoText(text: string): string {
  return text
    .replaceAll(" // ", " \u00B7 ")
    .replaceAll("\u2014", ", ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateWordBoundary(
  text: string,
  maxChars: number,
  ellipsis = "..."
): string {
  const clean = cleanSeoText(text);
  if (clean.length <= maxChars) return clean;
  const budget = Math.max(12, maxChars - ellipsis.length);
  const sliced = clean.slice(0, budget).trimEnd();
  const lastSpace = sliced.lastIndexOf(" ");
  const boundary =
    lastSpace >= Math.floor(budget * 0.55)
      ? sliced.slice(0, lastSpace).trimEnd()
      : sliced;
  return `${boundary.replace(/[,:;\-]+$/, "")}${ellipsis}`;
}

export function buildDispatchSeoTitle(
  dispatch: Pick<Dispatch, "title" | "issue_number" | "design">
): string {
  const custom = dispatch.design?.seo_title?.trim();
  if (custom) {
    return truncateWordBoundary(custom, SEO_TITLE_MAX, "");
  }
  const cleanTitle = cleanSeoText(dispatch.title);
  const withIssue = `Issue ${dispatch.issue_number}: ${cleanTitle}`;
  if (withIssue.length <= 54) {
    return withIssue;
  }
  if (cleanTitle.length <= 58) {
    return cleanTitle;
  }
  return truncateWordBoundary(cleanTitle, 58, "...");
}

export function buildDispatchSeoDescription(
  dispatch: Pick<Dispatch, "subtitle" | "mdx_content" | "design">
): string {
  const custom = dispatch.design?.seo_description?.trim();
  if (custom) {
    return truncateWordBoundary(custom, SEO_DESCRIPTION_MAX, "...");
  }
  const sub = cleanSeoText(dispatch.subtitle || "");
  if (sub) {
    return truncateWordBoundary(sub, SEO_DESCRIPTION_MAX, "...");
  }
  const plainBody = cleanSeoText(
    (dispatch.mdx_content || "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[#>*_`]/g, " ")
  );
  return truncateWordBoundary(plainBody, SEO_DESCRIPTION_MAX, "...");
}

export function estimateWordCount(mdx: string): number {
  const plain = mdx
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/[#>*_`]/g, " ")
    .trim();
  if (!plain) return 0;
  return plain.split(/\s+/).length;
}

export function toAbsoluteSiteUrl(
  rawUrl: string | null | undefined,
  origin: string
): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  const base = origin.replace(/\/+$/, "");
  if (trimmed.startsWith("/")) {
    return `${base}${trimmed}`;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function extractDispatchImageUrls(
  dispatch: Pick<Dispatch, "cover_image_url" | "mdx_content" | "design">,
  origin: string
): string[] {
  const seen = new Set<string>();
  const add = (candidate?: string | null) => {
    const abs = toAbsoluteSiteUrl(candidate, origin);
    if (abs && !seen.has(abs)) {
      seen.add(abs);
    }
  };

  add(dispatch.cover_image_url);

  const mdx = dispatch.mdx_content || "";
  for (const match of mdx.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)) {
    add(match[1]);
  }

  for (const img of dispatch.design?.gallery_images ?? []) {
    add(img.url);
  }

  return Array.from(seen);
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildOrganizationJsonLd(origin: string) {
  const cleanOrigin = origin.replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "G-Gravitator",
    alternateName: ["OXAKALABS", "G-Gravitator Labs"],
    url: cleanOrigin,
    logo: {
      "@type": "ImageObject",
      url: `${cleanOrigin}/icon.svg`,
    },
    founder: {
      "@type": "Person",
      name: "Enwedo Akaolisa Gift",
      jobTitle: "Principal Architect",
    },
    description:
      "Software and AI creativity lab engineering flagship products (G-01..G-04), bespoke B2B AI systems, OXAKALABS Skunkworks R&D builds, and technical fellowships.",
  };
}

export function buildWebsiteJsonLd(origin: string) {
  const cleanOrigin = origin.replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "G-Gravitator",
    url: cleanOrigin,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${cleanOrigin}/journal?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
