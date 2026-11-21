import React from "react";

/**
 * G-Gravitator brand mark: the "GG" monogram.
 *
 * Single source of truth for the logo. The same geometry renders the
 * navbar mark, browser favicon, Apple touch icon, PWA icons and the
 * Open Graph / Twitter link-preview cards. Pure SVG elements only, so it
 * works in Server Components, Client Components and `next/og`.
 */
export const BRAND = {
  name: "G-Gravitator",
  shortName: "G-Gravitator",
  tagline: "Build with weight.",
  vermilion: "#FF3B1F",
  obsidian: "#08080A",
  bone: "#F4F3EF",
  muted: "#A1A1AA",
} as const;

export type BrandMarkVariant =
  /** Rounded vermilion tile on a transparent canvas (favicon, UI). */
  | "rounded"
  /** Edge-to-edge vermilion square (Apple touch icon, OS applies the mask). */
  | "full"
  /** Edge-to-edge tile with the glyph shrunk into the maskable safe zone. */
  | "maskable";

const VIEWBOX = 64;
const CENTER = VIEWBOX / 2;
const GLYPH_RADIUS = 8;
const GLYPH_STROKE = 5.5;
const GLYPH_CENTERS = [20.8, 43.2] as const;
const GAP_ANGLE = (40 * Math.PI) / 180;

function scale(value: number, factor: number) {
  return CENTER + (value - CENTER) * factor;
}

/** One geometric "G": open arc plus inward crossbar. */
function glyphPath(cx: number, factor: number) {
  const r = GLYPH_RADIUS * factor;
  const x = scale(cx, factor);
  const startX = x + r * Math.cos(GAP_ANGLE);
  const startY = CENTER - r * Math.sin(GAP_ANGLE);
  const barEnd = x + 1.2 * factor;
  const f = (n: number) => n.toFixed(3);
  return `M ${f(startX)} ${f(startY)} A ${f(r)} ${f(r)} 0 1 0 ${f(x + r)} ${f(CENTER)} H ${f(barEnd)}`;
}

interface BrandMarkProps {
  size?: number | string;
  variant?: BrandMarkVariant;
  /** Tile color, defaults to brand vermilion. */
  background?: string;
  /** Glyph color, defaults to brand obsidian. */
  foreground?: string;
  className?: string;
  title?: string;
}

export function BrandMark({
  size = 32,
  variant = "rounded",
  background = BRAND.vermilion,
  foreground = BRAND.obsidian,
  className,
  title,
}: BrandMarkProps) {
  const factor = variant === "maskable" ? 0.78 : 1;
  const strokeWidth = GLYPH_STROKE * factor;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {variant === "rounded" ? (
        <rect width={VIEWBOX} height={VIEWBOX} rx={15} fill={background} />
      ) : (
        <rect width={VIEWBOX} height={VIEWBOX} fill={background} />
      )}
      {GLYPH_CENTERS.map((cx) => (
        <path
          key={cx}
          d={glyphPath(cx, factor)}
          fill="none"
          stroke={foreground}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}
