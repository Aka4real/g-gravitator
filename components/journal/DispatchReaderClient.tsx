"use client";

import React, { useMemo, useState, useSyncExternalStore } from "react";
import { PreloadLink } from "@/components/layout/PreloadLink";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  Sun,
  Moon,
  Clock,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Share2,
  Link2,
} from "lucide-react";
import { JournalShareModal } from "@/components/journal/JournalShareModal";
import { NewsletterBar } from "@/components/journal/NewsletterBar";
import {
  buildJournalShareUrls,
  buildSocialShareTargets,
  copyTextToClipboard,
} from "@/lib/journal/share";
import { SPRING_UI } from "@/lib/motion";
import type { Dispatch, DispatchCategory } from "@/lib/supabase/types";

interface DispatchReaderClientProps {
  dispatch: Dispatch;
  otherDispatches: Dispatch[];
  isAdminPreview?: boolean;
  isSharedDraft?: boolean;
  initialShareToken?: string | null;
  initialOrigin?: string;
}

interface ParsedBlock {
  type: "h2" | "h3" | "code" | "ul" | "image" | "callout" | "p";
  id?: string;
  lang?: string;
  content: string;
  items?: string[];
  alt?: string;
  url?: string;
  calloutKind?: "ACCENT" | "NOTE" | "TIP" | "WARNING" | "QUOTE";
}

const DISPATCH_CATEGORY_LABELS: Record<DispatchCategory, string> = {
  "AI SYSTEMS": "AI Systems",
  "HACKATHON LOG": "Hackathon Log",
  "DESIGN ENGINEERING": "Design Engineering",
  ARCHITECTURE: "Architecture",
  "POST-MORTEM": "Post-Mortem",
};

function sanitizeProse(text: string): string {
  return text.replaceAll(" // ", " · ").replaceAll("—", ", ");
}

function isSafeHref(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function parseMdxBlocks(mdx: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const rawChunks = mdx.split(/\n\n+/);

  for (const chunk of rawChunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("## ")) {
      const title = sanitizeProse(trimmed.replace(/^##\s+/, "").trim());
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      blocks.push({ type: "h2", id, content: title });
    } else if (trimmed.startsWith("### ")) {
      const title = sanitizeProse(trimmed.replace(/^###\s+/, "").trim());
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      blocks.push({ type: "h3", id, content: title });
    } else if (trimmed.startsWith("```")) {
      const lines = trimmed.split("\n");
      const lang = lines[0].replace("```", "").trim() || "text";
      const code = lines.slice(1, lines[lines.length - 1]?.startsWith("```") ? -1 : undefined).join("\n");
      blocks.push({ type: "code", lang, content: code });
    } else if (/^!\[([^\]]*)\]\(([^)\s]+)\)$/.test(trimmed)) {
      const match = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
      if (match) {
        blocks.push({
          type: "image",
          alt: match[1] || "Dispatch visual",
          url: match[2],
          content: match[1] || "",
        });
      }
    } else if (
      trimmed
        .split("\n")
        .every((line) => line.trim().startsWith(">"))
    ) {
      const lines = trimmed
        .split("\n")
        .map((line) => line.trim().replace(/^>\s?/, ""));
      const firstLine = lines[0] || "";
      const tagMatch = firstLine.match(/^\[!(ACCENT|NOTE|TIP|WARNING)\]\s*(.*)$/i);
      let calloutKind: ParsedBlock["calloutKind"] = "QUOTE";
      let contentLines = lines;
      if (tagMatch) {
        calloutKind = tagMatch[1].toUpperCase() as ParsedBlock["calloutKind"];
        contentLines = [tagMatch[2], ...lines.slice(1)].filter(Boolean);
      }
      blocks.push({
        type: "callout",
        calloutKind,
        content: sanitizeProse(contentLines.join(" ").trim()),
      });
    } else if (
      trimmed
        .split("\n")
        .every((line) => /^(-|\d+\.)\s+/.test(line.trim()))
    ) {
      const items = trimmed
        .split("\n")
        .map((line) =>
          sanitizeProse(line.replace(/^(-|\d+\.)\s+/, "").trim())
        );
      blocks.push({ type: "ul", content: "", items });
    } else {
      blocks.push({ type: "p", content: sanitizeProse(trimmed) });
    }
  }

  return blocks;
}

/**
 * Pure React inline markdown formatter for **bold**, `code`, *italic*, and [label](url) links.
 */
function renderInlineText(
  text: string,
  isLight: boolean,
  accentColor: string
): React.ReactNode[] {
  const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      if (isSafeHref(href)) {
        const isExternal = href.startsWith("http://") || href.startsWith("https://");
        return (
          <a
            key={idx}
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noreferrer noopener" : undefined}
            className="inline-flex items-baseline gap-0.5 font-medium underline decoration-2 underline-offset-4 transition-opacity hover:opacity-80"
            style={{ color: accentColor, textDecorationColor: `${accentColor}88` }}
          >
            <span>{label}</span>
          </a>
        );
      }
    }

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong
          key={idx}
          className={isLight ? "font-semibold text-[#08080A]" : "font-semibold text-[#F4F3EF]"}
        >
          {renderInlineText(part.slice(2, -2), isLight, accentColor)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={idx}
          className={`rounded-md px-1.5 py-0.5 font-mono text-[0.88em] ${
            isLight
              ? "bg-black/[0.06] text-[#111114]"
              : "bg-white/[0.08] text-[#F4F3EF]"
          }`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={idx} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function formatTagLabel(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const noopSubscribe = () => () => {};

export function DispatchReaderClient({
  dispatch,
  otherDispatches,
  isAdminPreview = false,
  isSharedDraft = false,
  initialShareToken = null,
  initialOrigin = "https://www.ggravitator.xyz",
}: DispatchReaderClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const [readingMode, setReadingMode] = useState<"DARK" | "LIGHT">("DARK");
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const clientOrigin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => initialOrigin
  );

  const shareUrls = useMemo(
    () =>
      buildJournalShareUrls({
        dispatch,
        origin: clientOrigin,
        shareToken: initialShareToken,
      }),
    [dispatch, clientOrigin, initialShareToken]
  );

  const socialTargets = useMemo(
    () =>
      buildSocialShareTargets({
        url: shareUrls.shareUrl,
        title: dispatch.title,
        subtitle: dispatch.subtitle,
        issueNumber: dispatch.issue_number,
      }),
    [shareUrls.shareUrl, dispatch.title, dispatch.subtitle, dispatch.issue_number]
  );

  const accentColor =
    /^#[0-9a-fA-F]{3,8}$/.test(dispatch.design?.accent_color || "")
      ? dispatch.design!.accent_color!
      : "#FF3B1F";
  const heroLayout = dispatch.design?.hero_layout || "editorial";
  const calloutStyle = dispatch.design?.callout_style || "left-bar";
  const galleryImages = dispatch.design?.gallery_images ?? [];
  const featuredLinks = dispatch.design?.featured_links ?? [];

  const blocks = useMemo(
    () => parseMdxBlocks(dispatch.mdx_content),
    [dispatch.mdx_content]
  );

  const headings = useMemo(
    () => blocks.filter((b) => b.type === "h2"),
    [blocks]
  );

  const isLight = readingMode === "LIGHT";

  const handleCopyCode = async (code: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeIdx(idx);
      setTimeout(() => {
        setCopiedCodeIdx((curr) => (curr === idx ? null : curr));
      }, 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleQuickCopyShareLink = () => {
    void copyTextToClipboard(shareUrls.shareUrl).then((ok) => {
      if (ok) {
        setCopiedShareLink(true);
        window.setTimeout(() => setCopiedShareLink(false), 2000);
      }
    });
  };

  return (
    <div
      data-reading-theme={isLight ? "light" : "dark"}
      style={
        !isLight && dispatch.design?.surface_tint
          ? {
              backgroundImage: `radial-gradient(circle at 82% 8%, ${dispatch.design.surface_tint}22, transparent 42%)`,
            }
          : undefined
      }
      className={`min-h-screen transition-colors duration-300 ${
        isLight
          ? "bg-[#F4F3EF] text-[#111114]"
          : "bg-[#08080A] text-[#F4F3EF]"
      }`}
    >
      <div className="mx-auto max-w-[1360px] px-5 pt-4 pb-24 sm:px-8 lg:px-12 lg:pb-32">
        {/* Sticky Floating Reader Toolbar */}
        <div className="sticky top-[74px] z-20 pt-2 sm:top-[76px]">
          <div
            className={`flex flex-nowrap items-center justify-between gap-2 rounded-full px-3 py-1.5 sm:gap-3 sm:px-5 sm:py-2 ${
              isLight
                ? "border border-black/[0.09] bg-[#F4F3EF]/85 text-[#111114] shadow-[0_12px_32px_rgba(8,8,10,0.08)] backdrop-blur-xl"
                : "glass-chrome text-[#F4F3EF]"
            }`}
          >
            <PreloadLink
              href="/journal"
              className={`press-tactile inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-1.5 py-1 text-xs font-medium transition-colors sm:gap-2 sm:px-2 sm:text-sm ${
                isLight
                  ? "text-[#27272A] hover:text-[#08080A]"
                  : "text-[#D4D4D8] hover:text-[#F4F3EF]"
              }`}
            >
              <ArrowLeft
                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                style={{ color: accentColor }}
                strokeWidth={1.8}
              />
              <span>Journal</span>
            </PreloadLink>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3.5">
              <span
                className={`font-mono-telemetry hidden items-center gap-1.5 text-xs md:inline-flex ${
                  isLight ? "text-[#52525B]" : "text-[#A1A1AA]"
                }`}
              >
                <Clock
                  className="h-3.5 w-3.5"
                  style={{ color: accentColor }}
                  strokeWidth={1.6}
                />
                <span>
                  Issue {dispatch.issue_number} · {dispatch.reading_time_mins} min read
                </span>
              </span>

              <button
                type="button"
                id="dispatch-toolbar-share-btn"
                onClick={() => setShareOpen(true)}
                className={`press-tactile inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 ${
                  isLight
                    ? "border-black/[0.12] bg-[#E8E6DF] text-[#111114] hover:border-black/[0.25]"
                    : "border-white/[0.1] bg-[#18181D] text-[#F4F3EF] hover:border-white/[0.22]"
                }`}
              >
                <Share2
                  className="h-3.5 w-3.5"
                  style={{ color: accentColor }}
                  strokeWidth={1.8}
                />
                <span>Share</span>
              </button>

              {/* Dark / Light Editorial Reading Mode Segmented Switch */}
              <div
                role="group"
                aria-label="Reading theme"
                className={`inline-flex shrink-0 items-center rounded-full border p-0.5 sm:p-1 ${
                  isLight
                    ? "border-black/[0.1] bg-[#E8E6DF]"
                    : "border-white/[0.09] bg-[#0B0B0E]/90"
                }`}
              >
                <button
                  type="button"
                  id="reader-mode-dark"
                  aria-label="Dark reading mode"
                  aria-pressed={!isLight}
                  onClick={() => setReadingMode("DARK")}
                  className={`press-tactile relative inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:py-1 ${
                    !isLight
                      ? "text-[#08080A]"
                      : "text-[#52525B] hover:text-[#08080A]"
                  }`}
                >
                  {!isLight && (
                    <motion.span
                      layoutId="reader-theme-pill"
                      transition={prefersReducedMotion ? { duration: 0.1 } : SPRING_UI}
                      className="absolute inset-0 rounded-full bg-[#F4F3EF]"
                    />
                  )}
                  <Moon className="relative z-10 h-3.5 w-3.5" strokeWidth={1.7} />
                  <span className="relative z-10 hidden sm:inline">Dark</span>
                </button>

                <button
                  type="button"
                  id="reader-mode-light"
                  aria-label="Light reading mode"
                  aria-pressed={isLight}
                  onClick={() => setReadingMode("LIGHT")}
                  className={`press-tactile relative inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:py-1 ${
                    isLight
                      ? "text-[#F4F3EF]"
                      : "text-[#A1A1AA] hover:text-[#F4F3EF]"
                  }`}
                >
                  {isLight && (
                    <motion.span
                      layoutId="reader-theme-pill"
                      transition={prefersReducedMotion ? { duration: 0.1 } : SPRING_UI}
                      className="absolute inset-0 rounded-full bg-[#111114]"
                    />
                  )}
                  <Sun className="relative z-10 h-3.5 w-3.5" strokeWidth={1.7} />
                  <span className="relative z-10 hidden sm:inline">Light</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {isAdminPreview && (
          <div
            role="status"
            className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs ${
              isLight
                ? "border-[#FF3B1F]/40 bg-[#FF3B1F]/10 text-[#991B1B]"
                : "border-[#FF3B1F]/40 bg-[#FF3B1F]/12 text-[#FF8A7A]"
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              <span className="inline-block h-2 w-2 rounded-full bg-[#FF3B1F]" />
              <span>
                Admin Preview · Status:{" "}
                <span className="font-mono uppercase">
                  {dispatch.approval_status || "UNPUBLISHED"}
                </span>{" "}
                , hidden from public readers until approved.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleQuickCopyShareLink}
                className={`press-tactile inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 font-semibold ${
                  isLight
                    ? "border-black/[0.15] bg-white text-[#111114]"
                    : "border-white/[0.15] bg-[#18181D] text-[#F4F3EF]"
                }`}
              >
                {copiedShareLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#10B981]" strokeWidth={2} />
                    <span>Copied preview link</span>
                  </>
                ) : (
                  <>
                    <Link2 className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.8} />
                    <span>Copy preview share link</span>
                  </>
                )}
              </button>
              <a
                href="/gg-command"
                className="rounded-full border border-[#FF3B1F]/40 bg-[#FF3B1F] px-3 py-1 font-semibold text-[#08080A] hover:bg-[#FF5238]"
              >
                Return to Command Center
              </a>
            </div>
          </div>
        )}

        {isSharedDraft && !isAdminPreview && (
          <div
            role="status"
            className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs ${
              isLight
                ? "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#92400E]"
                : "border-[#F59E0B]/35 bg-[#F59E0B]/10 text-[#FBBF24]"
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              <span className="inline-block h-2 w-2 rounded-full bg-[#F59E0B]" />
              <span>
                Shared Draft Preview · You are reading an unlisted dispatch shared via a private preview link.
              </span>
            </div>
          </div>
        )}

        {/* Editorial Article Header */}
        <header
          className={`border-b pt-12 pb-10 sm:pt-16 sm:pb-12 ${
            isLight ? "border-black/[0.1]" : "border-white/[0.08]"
          }`}
        >
          <div
            className={
              heroLayout === "split" && dispatch.cover_image_url
                ? "grid grid-cols-1 items-center gap-8 lg:grid-cols-12"
                : "max-w-4xl"
            }
          >
            <div className={heroLayout === "split" && dispatch.cover_image_url ? "lg:col-span-7" : ""}>
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className="font-mono-telemetry inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-[#08080A]"
                  style={{ backgroundColor: accentColor }}
                >
                  Issue {dispatch.issue_number}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                    isLight
                      ? "border-black/[0.12] bg-[#E8E6DF] text-[#111114]"
                      : "border-white/[0.1] bg-[#18181D] text-[#D4D4D8]"
                  }`}
                >
                  {DISPATCH_CATEGORY_LABELS[dispatch.category] ?? dispatch.category}
                </span>
                <span
                  className={`font-mono-telemetry text-xs ${
                    isLight ? "text-[#52525B]" : "text-[#8B8B94]"
                  }`}
                >
                  {dispatch.reading_time_mins} min read
                </span>
              </div>

              <h1 className="font-display mt-6 text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.08] font-bold tracking-[-0.03em]">
                {sanitizeProse(dispatch.title)}
              </h1>

              <p
                className={`mt-5 max-w-[65ch] text-lg leading-relaxed sm:text-xl ${
                  isLight ? "text-[#27272A]" : "text-[#A1A1AA]"
                }`}
              >
                {sanitizeProse(dispatch.subtitle)}
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">{dispatch.author_name}</div>
                  <div
                    className={`mt-0.5 text-xs ${
                      isLight ? "text-[#52525B]" : "text-[#8B8B94]"
                    }`}
                  >
                    {dispatch.author_role.replace(/\s*\/\/\s*/g, ", ")}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {dispatch.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        isLight
                          ? "bg-black/[0.06] text-[#27272A]"
                          : "bg-white/[0.06] text-[#A1A1AA]"
                      }`}
                    >
                      {formatTagLabel(tag)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {dispatch.cover_image_url && heroLayout === "split" && (
              <div className="lg:col-span-5">
                <div
                  className={`overflow-hidden rounded-2xl border ${
                    isLight ? "border-black/[0.12]" : "border-white/[0.1]"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dispatch.cover_image_url}
                    alt={dispatch.title}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="h-auto w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {dispatch.cover_image_url && heroLayout !== "split" && heroLayout !== "minimal" && (
            <div
              className={`mt-10 overflow-hidden rounded-2xl border ${
                heroLayout === "fullbleed" ? "max-h-[480px]" : "max-w-4xl"
              } ${isLight ? "border-black/[0.12]" : "border-white/[0.1]"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dispatch.cover_image_url}
                alt={dispatch.title}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full object-cover"
              />
            </div>
          )}
        </header>

        {/* Open 12-Column Reading Layout: Sticky Minimal TOC + 68ch Essay */}
        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Sticky Table of Contents */}
          <aside className="lg:col-span-3">
            <nav
              aria-label="Table of contents"
              className="lg:sticky lg:top-[152px]"
            >
              <div
                className={`text-xs font-semibold ${
                  isLight ? "text-[#52525B]" : "text-[#8B8B94]"
                }`}
              >
                On this page
              </div>
              <ul className="mt-3 space-y-1">
                {headings.map((h) => (
                  <li key={h.id}>
                    <a
                      href={`#${h.id}`}
                      className={`block rounded-xl px-3 py-2 text-sm leading-snug transition-colors ${
                        isLight
                          ? "text-[#3F3F46] hover:bg-black/[0.05] hover:text-[#08080A]"
                          : "text-[#A1A1AA] hover:bg-white/[0.06] hover:text-[#F4F3EF]"
                      }`}
                    >
                      {h.content}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Right Editorial Essay Body (65-72ch comfortable measure) */}
          <article className="min-w-0 lg:col-span-9">
            <div className="max-w-[68ch] space-y-6">
              {blocks.map((block, idx) => {
                if (block.type === "h2") {
                  return (
                    <h2
                      key={idx}
                      id={block.id}
                      className="font-display scroll-mt-36 pt-6 text-2xl leading-[1.15] font-semibold tracking-[-0.025em] sm:text-3xl"
                    >
                      {block.content}
                    </h2>
                  );
                }

                if (block.type === "h3") {
                  return (
                    <h3
                      key={idx}
                      id={block.id}
                      className="font-display scroll-mt-36 pt-3 text-xl leading-[1.2] font-semibold tracking-[-0.02em]"
                    >
                      {block.content}
                    </h3>
                  );
                }

                if (block.type === "image" && block.url) {
                  return (
                    <figure
                      key={idx}
                      className={`overflow-hidden rounded-2xl border ${
                        isLight
                          ? "border-black/[0.1] bg-[#E8E6DF]"
                          : "border-white/[0.1] bg-[#111114]"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={block.url}
                        alt={block.alt || "Dispatch visual"}
                        className="w-full object-cover"
                      />
                      {block.alt && (
                        <figcaption
                          className={`px-4 py-2.5 text-xs ${
                            isLight ? "text-[#52525B]" : "text-[#8B8B94]"
                          }`}
                        >
                          {block.alt}
                        </figcaption>
                      )}
                    </figure>
                  );
                }

                if (block.type === "callout") {
                  const calloutBorderColor =
                    block.calloutKind === "WARNING"
                      ? "#F59E0B"
                      : block.calloutKind === "TIP"
                      ? "#10B981"
                      : accentColor;
                  return (
                    <aside
                      key={idx}
                      style={{
                        borderColor:
                          calloutStyle === "left-bar"
                            ? calloutBorderColor
                            : `${calloutBorderColor}44`,
                        backgroundColor:
                          calloutStyle === "tinted-banner"
                            ? `${calloutBorderColor}18`
                            : isLight
                            ? "#E8E6DF"
                            : "#111114",
                      }}
                      className={`rounded-2xl p-5 text-[15px] leading-relaxed ${
                        calloutStyle === "left-bar"
                          ? "rounded-l-md border-l-4"
                          : "border"
                      } ${isLight ? "text-[#111114]" : "text-[#E4E4E7]"}`}
                    >
                      {block.calloutKind && block.calloutKind !== "QUOTE" && (
                        <div
                          className="mb-1.5 flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider"
                          style={{ color: calloutBorderColor }}
                        >
                          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
                          <span>{block.calloutKind}</span>
                        </div>
                      )}
                      <div>{renderInlineText(block.content, isLight, accentColor)}</div>
                    </aside>
                  );
                }

                if (block.type === "code") {
                  const isCopied = copiedCodeIdx === idx;
                  return (
                    <div
                      key={idx}
                      className={`overflow-hidden rounded-2xl border ${
                        isLight
                          ? "border-black/[0.12] bg-[#111114] text-[#F4F3EF]"
                          : "border-white/[0.09] bg-[#111114] text-[#F4F3EF]"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#18181D] px-4 py-2.5">
                        <span className="font-mono-telemetry text-xs text-[#A1A1AA]">
                          {block.lang}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(block.content, idx)}
                          className="press-tactile inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-[#D4D4D8] hover:border-white/[0.2] hover:text-[#F4F3EF]"
                        >
                          {isCopied ? (
                            <>
                              <Check
                                className="h-3 w-3 text-[#34D399]"
                                strokeWidth={2}
                              />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" strokeWidth={1.7} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-[#F4F3EF]">
                        <code>{block.content}</code>
                      </pre>
                    </div>
                  );
                }

                if (block.type === "ul") {
                  return (
                    <ul
                      key={idx}
                      className="space-y-3 pl-1 text-[17px] leading-[1.75]"
                    >
                      {block.items?.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span
                            aria-hidden="true"
                            className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: accentColor }}
                          />
                          <span
                            className={
                              isLight ? "text-[#1C1C20]" : "text-[#D4D4D8]"
                            }
                          >
                            {renderInlineText(item, isLight, accentColor)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  );
                }

                return (
                  <p
                    key={idx}
                    className={`text-[17px] leading-[1.78] ${
                      isLight ? "text-[#1C1C20]" : "text-[#D4D4D8]"
                    }`}
                  >
                    {renderInlineText(block.content, isLight, accentColor)}
                  </p>
                );
              })}

              {/* Visual Gallery */}
              {galleryImages.length > 0 && (
                <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
                  {galleryImages.map((img, i) => (
                    <figure
                      key={i}
                      className={`overflow-hidden rounded-2xl border ${
                        isLight
                          ? "border-black/[0.1] bg-[#E8E6DF]"
                          : "border-white/[0.1] bg-[#111114]"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.alt || img.caption || "Gallery visual"}
                        className="h-48 w-full object-cover"
                      />
                      {img.caption && (
                        <figcaption
                          className={`px-4 py-2.5 text-xs ${
                            isLight ? "text-[#52525B]" : "text-[#8B8B94]"
                          }`}
                        >
                          {img.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              )}

              {/* Featured Reference Links */}
              {featuredLinks.length > 0 && (
                <section
                  className={`rounded-2xl border p-6 ${
                    isLight
                      ? "border-black/[0.1] bg-[#E8E6DF]"
                      : "border-white/[0.08] bg-[#111114]"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-75">
                    <ExternalLink className="h-3.5 w-3.5" style={{ color: accentColor }} />
                    <span>Referenced Resources &amp; Links</span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {featuredLinks.map((lnk, i) => (
                      <a
                        key={i}
                        href={lnk.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={`group flex flex-col justify-between rounded-xl border p-4 transition-colors ${
                          isLight
                            ? "border-black/[0.1] bg-[#F4F3EF] hover:border-black/[0.25]"
                            : "border-white/[0.08] bg-[#18181D] hover:border-white/[0.2]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold">{lnk.label}</span>
                          <ArrowUpRight
                            className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            style={{ color: accentColor }}
                          />
                        </div>
                        {lnk.description && (
                          <p className="mt-1.5 text-xs opacity-75">{lnk.description}</p>
                        )}
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Share This Dispatch Card */}
              <section
                aria-label="Share this dispatch"
                className={`mt-6 rounded-2xl border p-6 sm:p-7 ${
                  isLight
                    ? "border-black/[0.1] bg-[#E8E6DF]/80"
                    : "border-white/[0.08] bg-[#111114]"
                }`}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-display text-lg font-semibold tracking-[-0.02em]">
                      Share this dispatch
                    </h2>
                    <p
                      className={`mt-1 text-xs leading-relaxed ${
                        isLight ? "text-[#52525B]" : "text-[#8B8B94]"
                      }`}
                    >
                      Generate a link with a rich social preview and matching cover artwork.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      id="dispatch-footer-copy-link-btn"
                      onClick={handleQuickCopyShareLink}
                      className={`press-tactile inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-4 text-xs font-semibold ${
                        copiedShareLink
                          ? "bg-[#10B981] text-[#08080A]"
                          : "bg-[#FF3B1F] text-[#08080A] hover:bg-[#FF5238]"
                      }`}
                    >
                      {copiedShareLink ? (
                        <>
                          <Check className="h-3.5 w-3.5" strokeWidth={2.1} />
                          <span>Copied link</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" strokeWidth={1.9} />
                          <span>Copy link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      id="dispatch-footer-share-modal-btn"
                      onClick={() => setShareOpen(true)}
                      className={`press-tactile inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-xs font-medium transition-colors ${
                        isLight
                          ? "border-black/[0.12] bg-[#F4F3EF] text-[#111114] hover:border-black/[0.25]"
                          : "border-white/[0.12] bg-[#18181D] text-[#F4F3EF] hover:border-white/[0.25]"
                      }`}
                    >
                      <Share2
                        className="h-3.5 w-3.5"
                        style={{ color: accentColor }}
                        strokeWidth={1.8}
                      />
                      <span>Preview &amp; share</span>
                    </button>

                    <a
                      href={socialTargets.x}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={`press-tactile inline-flex h-10 items-center gap-1 rounded-full border px-3.5 text-xs font-medium transition-colors ${
                        isLight
                          ? "border-black/[0.1] bg-[#F4F3EF] text-[#27272A] hover:text-[#08080A]"
                          : "border-white/[0.1] bg-[#18181D] text-[#D4D4D8] hover:text-[#F4F3EF]"
                      }`}
                    >
                      <span>X</span>
                      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.7} />
                    </a>

                    <a
                      href={socialTargets.linkedin}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={`press-tactile inline-flex h-10 items-center gap-1 rounded-full border px-3.5 text-xs font-medium transition-colors ${
                        isLight
                          ? "border-black/[0.1] bg-[#F4F3EF] text-[#27272A] hover:text-[#08080A]"
                          : "border-white/[0.1] bg-[#18181D] text-[#D4D4D8] hover:text-[#F4F3EF]"
                      }`}
                    >
                      <span>LinkedIn</span>
                      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.7} />
                    </a>
                  </div>
                </div>
              </section>

              {/* Theme-Adaptive Newsletter Capture */}
              <div className="pt-8">
                <NewsletterBar source={`dispatch-${dispatch.issue_number}`} />
              </div>
            </div>
          </article>
        </div>

        {/* Continue Reading Section */}
        {otherDispatches.length > 0 && (
          <section
            aria-labelledby="more-dispatches-heading"
            className={`mt-20 border-t pt-12 ${
              isLight ? "border-black/[0.1]" : "border-white/[0.08]"
            }`}
          >
            <h2
              id="more-dispatches-heading"
              className="font-display text-2xl font-semibold tracking-[-0.02em]"
            >
              More Lab Dispatches
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              {otherDispatches.map((other) => (
                <PreloadLink
                  key={other.id}
                  href={`/journal/${other.slug}`}
                  className={`group flex flex-col justify-between rounded-2xl border p-6 transition-[background-color,border-color,transform] duration-200 ${
                    isLight
                      ? "border-black/[0.1] bg-[#E8E6DF]/70 text-[#111114] hover:border-black/[0.22] hover:bg-[#E8E6DF]"
                      : "border-white/[0.08] bg-[#111114] text-[#F4F3EF] hover:border-white/[0.16] hover:bg-[#16161A]"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`font-mono-telemetry font-semibold ${
                          isLight ? "text-[#C4250D]" : "text-[#FF8A7A]"
                        }`}
                      >
                        Issue {other.issue_number}
                      </span>
                      <span
                        className={isLight ? "text-[#52525B]" : "text-[#8B8B94]"}
                      >
                        {DISPATCH_CATEGORY_LABELS[other.category] ?? other.category}
                      </span>
                    </div>
                    <h3 className="font-display mt-3 text-lg leading-snug font-semibold tracking-[-0.02em]">
                      {other.title}
                    </h3>
                  </div>
                  <span
                    className={`font-mono-telemetry mt-5 text-xs ${
                      isLight ? "text-[#52525B]" : "text-[#8B8B94]"
                    }`}
                  >
                    {other.reading_time_mins} min read
                  </span>
                </PreloadLink>
              ))}
            </div>
          </section>
        )}
      </div>

      <JournalShareModal
        dispatch={dispatch}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        shareToken={initialShareToken}
        originOverride={clientOrigin}
        isLight={isLight}
      />
    </div>
  );
}
