import React from "react";
import { ImageResponse } from "next/og";
import { BRAND, BrandMark, type BrandMarkVariant } from "@/lib/brand/mark";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_ALT = "G-Gravitator: build with weight.";

const ICON_CACHE = "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400";

/** Square PNG icon (favicon, Apple touch icon, PWA icons). */
export function renderIcon(size: number, variant: BrandMarkVariant = "rounded") {
  return new ImageResponse(<BrandMark size={size} variant={variant} />, {
    width: size,
    height: size,
    headers: { "Cache-Control": ICON_CACHE },
  });
}

interface LinkCardProps {
  /** Small mono label above the headline, e.g. "LABS // G-01". */
  eyebrow?: string;
  title?: string;
  description?: string;
}

/** 1200x630 link-preview card shared by Open Graph and Twitter. */
export function renderLinkCard({
  eyebrow = "Software + AI creativity lab",
  title = BRAND.tagline,
  description = "Flagship products, bespoke systems, hackathon wins and the builders program, engineered to pull markets.",
}: LinkCardProps = {}) {
  const long = title.length > 48;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: BRAND.obsidian,
          backgroundImage:
            "radial-gradient(circle at 88% 8%, rgba(255,59,31,0.34) 0%, rgba(255,59,31,0) 46%)",
          color: BRAND.bone,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <BrandMark size={72} />
          <div
            style={{
              display: "flex",
              marginLeft: 22,
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            G-Gravitator
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: BRAND.vermilion,
              marginBottom: 22,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: long ? 64 : 96,
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: "-0.04em",
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 30,
              lineHeight: 1.35,
              color: BRAND.muted,
              maxWidth: 940,
            }}
          >
            {description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            height: 4,
            width: 120,
            background: BRAND.vermilion,
          }}
        />
      </div>
    ),
    { ...OG_SIZE, headers: { "Cache-Control": ICON_CACHE } },
  );
}

export function truncate(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}\u2026` : clean;
}
