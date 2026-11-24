import crypto from "node:crypto";
import { createMediaAsset } from "@/lib/db/repository";
import { generateGeminiImage } from "@/lib/gemini/client";
import { validateSafePublicUrl } from "@/lib/ops/research";
import type { ContentAuthorType, MediaAsset } from "@/lib/supabase/types";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapLines(text: string, maxChars = 34, maxLines = 3): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let curr = "";
  for (const w of words) {
    const candidate = curr ? `${curr} ${w}` : w;
    if (candidate.length > maxChars && curr) {
      lines.push(curr);
      curr = w;
      if (lines.length === maxLines - 1) break;
    } else {
      curr = candidate;
    }
  }
  if (curr && lines.length < maxLines) {
    lines.push(curr);
  }
  return lines;
}

export function generateProceduralEditorialSvg(params: {
  title?: string;
  subtitle?: string;
  prompt: string;
  accentColor?: string;
  category?: string;
}): string {
  const accent = /^#[0-9a-fA-F]{3,8}$/.test(params.accentColor || "")
    ? params.accentColor!
    : "#FF3B1F";
  const heading = (params.title || params.prompt || "G-Gravitator Signal").trim();
  const lines = wrapLines(heading, 30, 3);
  const badge = (params.category || "G-GRAVITATOR // VISUAL").toUpperCase().slice(0, 36);
  const sub = (params.subtitle || params.prompt || "").trim().slice(0, 88);

  const hash = crypto.createHash("sha256").update(heading + accent).digest();
  const cx = 860 + (hash[0] % 140);
  const cy = 240 + (hash[1] % 140);
  const r1 = 150 + (hash[2] % 60);
  const r2 = 240 + (hash[3] % 70);

  const titleSvg = lines
    .map(
      (line, idx) =>
        `<text x="76" y="${260 + idx * 60}" fill="#F4F3EF" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="700" letter-spacing="-1.2">${escapeXml(line)}</text>`
    )
    .join("\n  ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="78%" cy="42%" r="58%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.34"/>
      <stop offset="55%" stop-color="${accent}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#08080A" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#08080A"/>
      <stop offset="100%" stop-color="#111114"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <circle cx="${cx}" cy="${cy}" r="${r2}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>
  <circle cx="${cx}" cy="${cy}" r="${r1}" fill="none" stroke="${accent}" stroke-opacity="0.55" stroke-width="2" stroke-dasharray="8 8"/>
  <circle cx="${cx}" cy="${cy}" r="18" fill="${accent}"/>
  <rect x="76" y="76" width="${Math.max(180, badge.length * 10 + 40)}" height="36" rx="18" fill="${accent}" fill-opacity="0.16" stroke="${accent}" stroke-opacity="0.55"/>
  <text x="96" y="99" fill="${accent}" font-family="ui-monospace, SFMono-Regular, monospace" font-size="14" font-weight="700" letter-spacing="1.4">${escapeXml(badge)}</text>
  ${titleSvg}
  <text x="76" y="495" fill="#A1A1AA" font-family="system-ui, -apple-system, sans-serif" font-size="22">${escapeXml(sub)}</text>
  <line x1="76" y1="546" x2="1124" y2="546" stroke="rgba(255,255,255,0.1)"/>
  <text x="76" y="582" fill="#8B8B94" font-family="ui-monospace, SFMono-Regular, monospace" font-size="15">G-GRAVITATOR // EDITORIAL STUDIO</text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

export async function generateAndStoreImage(params: {
  prompt: string;
  title?: string;
  subtitle?: string;
  accentColor?: string;
  category?: string;
  createdBy: ContentAuthorType;
}): Promise<{ asset: MediaAsset; generator: "gemini" | "editorial_svg" }> {
  const safeSlug = (params.title || params.prompt)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36) || "visual";

  const generated = await generateGeminiImage({
    prompt: `${params.prompt}${params.accentColor ? `. Primary accent color: ${params.accentColor}.` : ""} Clean editorial dark-obsidian composition, crisp contrast, zero gibberish text.`,
    aspectRatio: "16:9",
  });

  if (generated) {
    const ext = generated.mimeType.includes("jpeg")
      ? "jpg"
      : generated.mimeType.includes("webp")
      ? "webp"
      : "png";
    const asset = await createMediaAsset({
      filename: `${safeSlug}.${ext}`,
      mime_type: generated.mimeType,
      data_url: `data:${generated.mimeType};base64,${generated.base64}`,
      source_type: "generated",
      prompt: params.prompt,
      alt_text: params.title || params.prompt,
      created_by: params.createdBy,
    });
    return { asset, generator: "gemini" };
  }

  const svgDataUrl = generateProceduralEditorialSvg(params);
  const asset = await createMediaAsset({
    filename: `${safeSlug}.svg`,
    mime_type: "image/svg+xml",
    data_url: svgDataUrl,
    source_type: "generated",
    prompt: params.prompt,
    alt_text: params.title || params.prompt,
    created_by: params.createdBy,
  });
  return { asset, generator: "editorial_svg" };
}

export async function importAndStoreImageFromUrl(params: {
  url: string;
  altText?: string;
  createdBy: ContentAuthorType;
}): Promise<MediaAsset> {
  const parsed = validateSafePublicUrl(params.url);
  const res = await fetch(parsed.toString(), {
    headers: { "User-Agent": "Mozilla/5.0 G-Gravitator-Media/1.0" },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch image (${res.status})`);
  }

  const rawContentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const mime = rawContentType.startsWith("image/") ? rawContentType : "image/png";
  const arrBuf = await res.arrayBuffer();
  if (arrBuf.byteLength === 0) {
    throw new Error("Remote image was empty.");
  }
  if (arrBuf.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Image exceeds maximum 5 MB size limit.");
  }

  const b64 = Buffer.from(arrBuf).toString("base64");
  const pathName = parsed.pathname.split("/").pop() || "imported-image";
  const cleanName = pathName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60) || "imported.png";

  return createMediaAsset({
    filename: cleanName,
    mime_type: mime,
    data_url: `data:${mime};base64,${b64}`,
    source_type: "imported",
    source_url: parsed.toString(),
    alt_text: params.altText || cleanName,
    created_by: params.createdBy,
  });
}

export async function uploadAndStoreImage(params: {
  filename: string;
  mimeType: string;
  base64Data: string;
  altText?: string;
  createdBy: ContentAuthorType;
}): Promise<MediaAsset> {
  const cleanMime = params.mimeType.split(";")[0].trim().toLowerCase();
  if (!cleanMime.startsWith("image/")) {
    throw new Error("Only image files (PNG, JPEG, WEBP, GIF, SVG) are allowed.");
  }

  const stripped = params.base64Data.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");
  const buf = Buffer.from(stripped, "base64");
  if (buf.byteLength === 0 || buf.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Uploaded image must be between 1 byte and 5 MB.");
  }

  const cleanName =
    params.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60) || "upload.png";

  return createMediaAsset({
    filename: cleanName,
    mime_type: cleanMime,
    data_url: `data:${cleanMime};base64,${buf.toString("base64")}`,
    source_type: "uploaded",
    alt_text: params.altText || cleanName,
    created_by: params.createdBy,
  });
}

export function parseDataUrlToBuffer(dataUrl: string): {
  mimeType: string;
  buffer: Buffer;
} | null {
  const match = dataUrl.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}
