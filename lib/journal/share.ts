import type { Dispatch } from "@/lib/supabase/types";

export function sanitizeShareText(text: string): string {
  return text.replaceAll(" // ", " \u00B7 ").replaceAll("\u2014", ", ").trim();
}

/**
 * Deterministic isomorphic hash used to bust Open Graph image caches
 * whenever a dispatch's cover image, title, subtitle, or design changes.
 */
export function getDispatchOgVersion(
  dispatch: Pick<
    Dispatch,
    | "updated_at"
    | "cover_image_url"
    | "title"
    | "subtitle"
    | "category"
    | "issue_number"
    | "design"
  >
): string {
  const raw = [
    "og-jpg-v2",
    dispatch.updated_at || "",
    dispatch.cover_image_url || "",
    dispatch.title || "",
    dispatch.subtitle || "",
    dispatch.category || "",
    dispatch.issue_number || "",
    dispatch.design?.accent_color || "",
    dispatch.design?.surface_tint || "",
  ].join("|");

  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= code + i;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, "0")}${(h2 >>> 0).toString(16).padStart(8, "0")}`;
}

export interface JournalShareUrls {
  canonicalUrl: string;
  shareUrl: string;
  ogImagePath: string;
  ogImageUrl: string;
  version: string;
  isPrivatePreview: boolean;
}

export function buildJournalShareUrls(params: {
  dispatch: Pick<
    Dispatch,
    | "slug"
    | "is_published"
    | "updated_at"
    | "cover_image_url"
    | "title"
    | "subtitle"
    | "category"
    | "issue_number"
    | "design"
  >;
  origin: string;
  shareToken?: string | null;
}): JournalShareUrls {
  const cleanOrigin = params.origin.replace(/\/+$/, "");
  const isUnpublished = params.dispatch.is_published === false;
  const token = isUnpublished ? params.shareToken?.trim() || null : null;
  const version = getDispatchOgVersion(params.dispatch);

  const canonicalUrl = `${cleanOrigin}/journal/${params.dispatch.slug}`;
  const shareUrl = token
    ? `${canonicalUrl}?share=${encodeURIComponent(token)}`
    : canonicalUrl;
  const ogImagePath = `/journal/${params.dispatch.slug}/og?v=${version}${
    token ? `&share=${encodeURIComponent(token)}` : ""
  }`;
  const ogImageUrl = `${cleanOrigin}${ogImagePath}`;

  return {
    canonicalUrl,
    shareUrl,
    ogImagePath,
    ogImageUrl,
    version,
    isPrivatePreview: Boolean(token),
  };
}

export interface SocialShareTargets {
  x: string;
  linkedin: string;
  whatsapp: string;
  telegram: string;
  email: string;
}

export function buildSocialShareTargets(params: {
  url: string;
  title: string;
  subtitle?: string;
  issueNumber?: string;
}): SocialShareTargets {
  const cleanTitle = sanitizeShareText(params.title);
  const cleanSubtitle = params.subtitle ? sanitizeShareText(params.subtitle) : "";
  const prefix = params.issueNumber ? `Issue ${params.issueNumber}: ` : "";
  const xText = `${prefix}${cleanTitle}`;
  const emailSubject = `${prefix}${cleanTitle} | G-Gravitator Journal`;
  const emailBody = [
    cleanTitle,
    cleanSubtitle,
    "",
    `Read the dispatch: ${params.url}`,
  ]
    .filter((line, idx) => line !== "" || idx === 2)
    .join("\n");

  const whatsappText = `${cleanTitle}\n\n${params.url}`;

  return {
    x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(params.url)}&text=${encodeURIComponent(xText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(params.url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(params.url)}&text=${encodeURIComponent(cleanTitle)}`,
    email: `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`,
  };
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to textarea copy fallback
    }
  }

  if (typeof document !== "undefined") {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);
      return copied;
    } catch {
      return false;
    }
  }

  return false;
}
