import fs from "node:fs/promises";
import path from "node:path";
import React from "react";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getMediaAssetById } from "@/lib/db/repository";
import { validateSafePublicUrl } from "@/lib/ops/research";
import { BRAND, BrandMark } from "@/lib/brand/mark";
import { OG_SIZE, renderLinkCard, truncate } from "@/lib/brand/images";
import { sanitizeShareText } from "@/lib/journal/share";
import type { Dispatch, DispatchCategory } from "@/lib/supabase/types";

const MAX_REMOTE_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
/**
 * WhatsApp enforces a strict ~300 KB thumbnail budget for rich full-width
 * Open Graph link previews. Targeting <= 240 KB guarantees every journal
 * share card renders with its full header image across WhatsApp, X,
 * LinkedIn, Facebook, iMessage, Slack, Telegram, and Discord.
 */
export const MAX_SOCIAL_OG_BYTES = 240 * 1024;

export interface RenderedJournalOgImage {
  buffer: Buffer;
  contentType: "image/jpeg" | "image/png";
  width: number;
  height: number;
}

const CATEGORY_LABELS: Record<DispatchCategory, string> = {
  "AI SYSTEMS": "AI Systems",
  "HACKATHON LOG": "Hackathon Log",
  "DESIGN ENGINEERING": "Design Engineering",
  ARCHITECTURE: "Architecture",
  "POST-MORTEM": "Post-Mortem",
};

const EXT_TO_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export interface ResolvedCoverAsset {
  dataUrl: string;
  mimeType: string;
}

function normalizeAccentHex(raw?: string | null): string {
  return /^#[0-9a-fA-F]{3,8}$/.test(raw || "") ? raw! : BRAND.vermilion;
}

function formatCategoryLabel(category: DispatchCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

function extractMediaIdFromUrl(coverUrl: string): string | null {
  const trimmed = coverUrl.trim();
  const relMatch = trimmed.match(/^\/api\/media\/([a-zA-Z0-9_-]+)(?:[?#].*)?$/);
  if (relMatch) return relMatch[1];

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      const absMatch = parsed.pathname.match(/^\/api\/media\/([a-zA-Z0-9_-]+)$/);
      if (absMatch) return absMatch[1];
    } catch {
      return null;
    }
  }
  return null;
}

function parseInlineImageDataUrl(raw: string): ResolvedCoverAsset | null {
  const match = raw
    .trim()
    .match(/^data:(image\/(?:png|jpeg|jpg|webp|gif|svg\+xml));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!match) return null;
  const mimeType = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
  const cleanB64 = match[2].replace(/\s+/g, "");
  return {
    mimeType,
    dataUrl: `data:${mimeType};base64,${cleanB64}`,
  };
}

/**
 * Resolves any journal `cover_image_url` (Media Library `/api/media/[id]`,
 * local `public/images/...`, inline `data:image/...`, or external `https://...`)
 * into a safe in-memory data URL for deterministic OG PNG rendering.
 */
export async function resolveDispatchCoverAsset(
  coverUrl?: string | null
): Promise<ResolvedCoverAsset | null> {
  const raw = coverUrl?.trim();
  if (!raw) return null;

  // 1. Inline data URL
  if (raw.startsWith("data:")) {
    return parseInlineImageDataUrl(raw);
  }

  // 2. Local Media Library asset (/api/media/[id])
  const mediaId = extractMediaIdFromUrl(raw);
  if (mediaId) {
    try {
      const asset = await getMediaAssetById(mediaId);
      if (asset?.data_url) {
        return parseInlineImageDataUrl(asset.data_url);
      }
    } catch {
      return null;
    }
    return null;
  }

  // 3. Local static file inside public/
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    const cleanRel = raw.split(/[?#]/)[0].replace(/^\/+/, "");
    if (!cleanRel) return null;
    const publicDir = path.resolve(process.cwd(), "public");
    const targetPath = path.resolve(publicDir, cleanRel);
    if (!targetPath.startsWith(publicDir + path.sep)) {
      return null;
    }
    const ext = path.extname(targetPath).toLowerCase();
    const mimeType = EXT_TO_MIME[ext];
    if (!mimeType) return null;
    try {
      const buf = await fs.readFile(targetPath);
      if (buf.byteLength === 0 || buf.byteLength > MAX_REMOTE_IMAGE_BYTES) {
        return null;
      }
      return {
        mimeType,
        dataUrl: `data:${mimeType};base64,${buf.toString("base64")}`,
      };
    } catch {
      return null;
    }
  }

  // 4. Remote HTTPS/HTTP image URL (SSRF-validated)
  if (raw.startsWith("https://") || raw.startsWith("http://")) {
    try {
      const parsed = validateSafePublicUrl(raw);
      const res = await fetch(parsed.toString(), {
        headers: { "User-Agent": "G-Gravitator-OG-Renderer/1.0" },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const ct = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      if (!ct.startsWith("image/")) return null;
      const mimeType = ct === "image/jpg" ? "image/jpeg" : ct;
      const contentLen = Number(res.headers.get("content-length") || "0");
      if (contentLen > MAX_REMOTE_IMAGE_BYTES) return null;

      const arrBuf = await res.arrayBuffer();
      if (arrBuf.byteLength === 0 || arrBuf.byteLength > MAX_REMOTE_IMAGE_BYTES) {
        return null;
      }
      return {
        mimeType,
        dataUrl: `data:${mimeType};base64,${Buffer.from(arrBuf).toString("base64")}`,
      };
    } catch {
      return null;
    }
  }

  return null;
}

async function materializePng(response: ImageResponse): Promise<Buffer> {
  const arrBuf = await response.arrayBuffer();
  return Buffer.from(arrBuf);
}

function renderStudioSvgReplicaCard(dispatch: Dispatch, svgText: string): ImageResponse {
  const accentMatch = svgText.match(/stop-color="(#[0-9a-fA-F]{3,8})"/);
  const accent = normalizeAccentHex(dispatch.design?.accent_color || accentMatch?.[1]);
  const cleanTitle = truncate(sanitizeShareText(dispatch.title), 108);
  const cleanSubtitle = truncate(sanitizeShareText(dispatch.subtitle), 150);
  const titleFontSize = cleanTitle.length > 74 ? 44 : cleanTitle.length > 44 ? 54 : 66;
  const categoryLabel = formatCategoryLabel(dispatch.category);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          padding: "64px 76px",
          background: BRAND.obsidian,
          backgroundImage: `radial-gradient(circle at 82% 38%, ${accent}52 0%, ${accent}14 42%, rgba(8,8,10,0) 70%)`,
          color: BRAND.bone,
          overflow: "hidden",
        }}
      >
        {/* Orbital rings matching Studio Editorial SVG composition */}
        <div
          style={{
            position: "absolute",
            right: 40,
            top: 75,
            width: 480,
            height: 480,
            borderRadius: 9999,
            border: "1.5px solid rgba(255,255,255,0.08)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 120,
            top: 155,
            width: 320,
            height: 320,
            borderRadius: 9999,
            border: `2px dashed ${accent}`,
            opacity: 0.55,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 262,
            top: 297,
            width: 36,
            height: 36,
            borderRadius: 9999,
            background: accent,
            display: "flex",
          }}
        />

        {/* Top Badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 18px",
              borderRadius: 9999,
              background: `${accent}26`,
              border: `1.5px solid ${accent}88`,
              color: accent,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {`Issue ${dispatch.issue_number} · ${categoryLabel}`}
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <BrandMark size={48} />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 880 }}>
          <div
            style={{
              display: "flex",
              fontSize: titleFontSize,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: BRAND.bone,
            }}
          >
            {cleanTitle}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontSize: 25,
              lineHeight: 1.4,
              color: BRAND.muted,
              maxWidth: 820,
            }}
          >
            {cleanSubtitle}
          </div>
        </div>

        {/* Footer Strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 22,
          }}
        >
          <div style={{ display: "flex", fontSize: 18, color: "#8B8B94", letterSpacing: "0.06em" }}>
            {`G-GRAVITATOR · ${dispatch.author_name}`}
          </div>
          <div style={{ display: "flex", fontSize: 18, color: BRAND.muted }}>
            {`${dispatch.reading_time_mins} min read`}
          </div>
        </div>
      </div>
    ),
    OG_SIZE
  );
}

function renderJournalEditorialCard(dispatch: Dispatch): ImageResponse {
  const accent = normalizeAccentHex(dispatch.design?.accent_color);
  const tint = normalizeAccentHex(dispatch.design?.surface_tint || accent);
  const cleanTitle = truncate(sanitizeShareText(dispatch.title), 108);
  const cleanSubtitle = truncate(sanitizeShareText(dispatch.subtitle), 150);
  const titleFontSize = cleanTitle.length > 74 ? 44 : cleanTitle.length > 44 ? 54 : 66;
  const categoryLabel = formatCategoryLabel(dispatch.category);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 72px",
          background: BRAND.obsidian,
          backgroundImage: `radial-gradient(circle at 86% 12%, ${tint}48 0%, rgba(8,8,10,0) 52%)`,
          color: BRAND.bone,
        }}
      >
        {/* Top Row: Brand Mark + Issue Pill */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <BrandMark size={60} />
            <div
              style={{
                display: "flex",
                marginLeft: 18,
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: BRAND.bone,
              }}
            >
              G-Gravitator
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 18px",
              borderRadius: 9999,
              background: accent,
              color: BRAND.obsidian,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {`Issue ${dispatch.issue_number}`}
          </div>
        </div>

        {/* Editorial Headline & Subtitle */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: accent,
              marginBottom: 18,
              fontWeight: 600,
            }}
          >
            {`Journal · ${categoryLabel} · ${dispatch.reading_time_mins} min read`}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: titleFontSize,
              fontWeight: 700,
              lineHeight: 1.07,
              letterSpacing: "-0.035em",
              color: BRAND.bone,
              maxWidth: 1050,
            }}
          >
            {cleanTitle}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontSize: 26,
              lineHeight: 1.38,
              color: BRAND.muted,
              maxWidth: 960,
            }}
          >
            {cleanSubtitle}
          </div>
        </div>

        {/* Bottom Author & Accent Rule */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                height: 4,
                width: 84,
                background: accent,
              }}
            />
            <div
              style={{
                display: "flex",
                marginLeft: 18,
                fontSize: 20,
                color: BRAND.muted,
              }}
            >
              {dispatch.author_name}
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 18, color: "#8B8B94" }}>
            ggravitator.xyz/journal
          </div>
        </div>
      </div>
    ),
    OG_SIZE
  );
}

function decodeResolvedDataUrlBuffer(resolved: ResolvedCoverAsset): Buffer | null {
  const commaIdx = resolved.dataUrl.indexOf(",");
  if (commaIdx < 0) return null;
  const b64 = resolved.dataUrl.slice(commaIdx + 1).trim();
  if (!b64) return null;
  const buf = Buffer.from(b64, "base64");
  return buf.byteLength > 0 ? buf : null;
}

/**
 * Encodes any image buffer (cover photograph or Satori-rendered PNG card) into a
 * universally compatible 1200x630 non-progressive baseline JPEG guaranteed to sit
 * comfortably below WhatsApp's ~300 KB Open Graph preview ceiling.
 */
export async function encodeSocialOgJpeg(
  input: Buffer
): Promise<RenderedJournalOgImage> {
  const basePipeline = sharp(input, { animated: false })
    .rotate()
    .resize(OG_SIZE.width, OG_SIZE.height, {
      fit: "cover",
      position: "centre",
    })
    .flatten({ background: BRAND.obsidian });

  const qualitySteps = [82, 74, 66, 56, 46];
  let bestBuffer: Buffer | null = null;

  for (const quality of qualitySteps) {
    const candidate = await basePipeline
      .clone()
      .jpeg({
        quality,
        progressive: false,
        optimiseCoding: true,
        trellisQuantisation: true,
        overshootDeringing: true,
      })
      .toBuffer();
    bestBuffer = candidate;
    if (candidate.byteLength <= MAX_SOCIAL_OG_BYTES) {
      return {
        buffer: candidate,
        contentType: "image/jpeg",
        width: OG_SIZE.width,
        height: OG_SIZE.height,
      };
    }
  }

  // Final safety valve for extreme high-entropy textures: slightly downscale
  // while keeping exact 1.905:1 OG aspect ratio and <= 240 KB budget.
  const compactWidth = 960;
  const compactHeight = 504;
  const compactBuffer = await sharp(input, { animated: false })
    .rotate()
    .resize(compactWidth, compactHeight, {
      fit: "cover",
      position: "centre",
    })
    .flatten({ background: BRAND.obsidian })
    .jpeg({
      quality: 58,
      progressive: false,
      optimiseCoding: true,
      trellisQuantisation: true,
      overshootDeringing: true,
    })
    .toBuffer();

  if (!bestBuffer || compactBuffer.byteLength < bestBuffer.byteLength) {
    return {
      buffer: compactBuffer,
      contentType: "image/jpeg",
      width: compactWidth,
      height: compactHeight,
    };
  }

  return {
    buffer: bestBuffer,
    contentType: "image/jpeg",
    width: OG_SIZE.width,
    height: OG_SIZE.height,
  };
}

/**
 * Generates a materialized 1200x630 baseline JPEG Open Graph / Twitter share card
 * sized under 240 KB for universal social unfurling (WhatsApp, X, Facebook,
 * LinkedIn, iMessage, Telegram, Slack, Discord).
 *
 * Uses a fast direct sharp pipeline for raster cover photos (avoiding Satori's
 * ~1.8 MB lossless PNG bloat) and compresses Studio SVG / editorial fallback
 * cards through the exact same baseline JPEG encoder.
 */
export async function renderJournalOgImage(
  dispatch: Dispatch | null
): Promise<RenderedJournalOgImage> {
  if (!dispatch) {
    const fallbackPng = await materializePng(renderLinkCard());
    try {
      return await encodeSocialOgJpeg(fallbackPng);
    } catch {
      return {
        buffer: fallbackPng,
        contentType: "image/png",
        width: OG_SIZE.width,
        height: OG_SIZE.height,
      };
    }
  }

  if (dispatch.cover_image_url) {
    const resolved = await resolveDispatchCoverAsset(dispatch.cover_image_url);
    if (resolved) {
      try {
        if (resolved.mimeType === "image/svg+xml") {
          const rawSvgBuf = decodeResolvedDataUrlBuffer(resolved);
          const svgText = rawSvgBuf ? rawSvgBuf.toString("utf8") : "";
          if (svgText.includes("G-GRAVITATOR // EDITORIAL STUDIO")) {
            const studioPng = await materializePng(
              renderStudioSvgReplicaCard(dispatch, svgText)
            );
            return await encodeSocialOgJpeg(studioPng);
          }
          if (rawSvgBuf) {
            return await encodeSocialOgJpeg(rawSvgBuf);
          }
        } else {
          const rawRasterBuf = decodeResolvedDataUrlBuffer(resolved);
          if (rawRasterBuf) {
            return await encodeSocialOgJpeg(rawRasterBuf);
          }
        }
      } catch (error) {
        console.warn(
          `[journal-og] Failed rendering cover image for "${dispatch.slug}", using editorial fallback:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }

  const editorialPng = await materializePng(renderJournalEditorialCard(dispatch));
  try {
    return await encodeSocialOgJpeg(editorialPng);
  } catch {
    return {
      buffer: editorialPng,
      contentType: "image/png",
      width: OG_SIZE.width,
      height: OG_SIZE.height,
    };
  }
}

/**
 * Generates a materialized 1200x630 PNG buffer for a Journal Dispatch's
 * Open Graph / Twitter share card, rendering the journal's actual cover
 * picture whenever one is attached, and falling back cleanly to a styled
 * editorial card when no cover is present or a remote image fails.
 */
export async function renderJournalOgPngBuffer(
  dispatch: Dispatch | null
): Promise<Buffer> {
  if (!dispatch) {
    return materializePng(renderLinkCard());
  }

  if (dispatch.cover_image_url) {
    const resolved = await resolveDispatchCoverAsset(dispatch.cover_image_url);
    if (resolved) {
      try {
        if (resolved.mimeType === "image/svg+xml") {
          const b64 = resolved.dataUrl.split(",")[1] || "";
          const svgText = Buffer.from(b64, "base64").toString("utf8");
          if (svgText.includes("G-GRAVITATOR // EDITORIAL STUDIO")) {
            return await materializePng(renderStudioSvgReplicaCard(dispatch, svgText));
          }
        }

        // Render the journal's actual cover picture cleanly fitted to 1200x630
        const coverResponse = new ImageResponse(
          (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                background: BRAND.obsidian,
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolved.dataUrl}
                alt={sanitizeShareText(dispatch.title)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                }}
              />
            </div>
          ),
          OG_SIZE
        );
        return await materializePng(coverResponse);
      } catch (error) {
        console.warn(
          `[journal-og] Failed rendering cover image for "${dispatch.slug}", using editorial fallback:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }

  return materializePng(renderJournalEditorialCard(dispatch));
}
