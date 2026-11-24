import fs from "node:fs/promises";
import path from "node:path";
import React from "react";
import { ImageResponse } from "next/og";
import { getMediaAssetById } from "@/lib/db/repository";
import { validateSafePublicUrl } from "@/lib/ops/research";
import { BRAND, BrandMark } from "@/lib/brand/mark";
import { OG_SIZE, renderLinkCard, truncate } from "@/lib/brand/images";
import { sanitizeShareText } from "@/lib/journal/share";
import type { Dispatch, DispatchCategory } from "@/lib/supabase/types";

const MAX_REMOTE_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

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
            ggravitator.com/journal
          </div>
        </div>
      </div>
    ),
    OG_SIZE
  );
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
