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
  return text.replaceAll(" // ", " · ").replaceAll("\u2014", ", ");
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
      const code = lines
        .slice(1, lines[lines.length - 1]?.startsWith("```") ? -1 : undefined)
        .join("\n");
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
    } else if (trimmed.split("\n").every((line) => line.trim().startsWith(">"))) {
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
      trimmed.split("\n").every((line) => /^(-|\d+\.)\s+/.test(line.trim()))
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
        const isExternal =
          href.startsWith("http://") || href.startsWith("https://");
        return (
          <a
            key={idx}
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noreferrer noopener" : undefined}
            className="font-medium underline decoration-2 underline-offset-4 transition-opacity duration-150 hover:opacity-80"
            style={{
              color: isLight ? "#C82810" : accentColor,
              textDecorationColor: isLight
                ? "rgba(200,40,16,0.45)"
                : `${accentColor}88`,
            }}
          >
            {label}
          </a>
        );
      }
    }

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong
          key={idx}
          className={
            isLight
              ? "font-semibold text-[var(--ink-stone-primary)]"
              : "font-semibold text-[var(--ink-primary)]"
          }
        >
          {renderInlineText(part.slice(2, -2), isLight, accentColor)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={idx}
          className={`rounded-md px-1.5 py-0.5 text-[0.9em] ${
            isLight
              ? "bg-black/[0.06] text-[#0B0E14]"
              : "bg-white/[0.08] text-[var(--ink-primary)]"
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
  return tag.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
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

  const accentColor = /^#[0-9a-fA-F]{3,8}$/.test(
    dispatch.design?.accent_color || ""
  )
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
      className={`min-h-screen pt-16 transition-colors duration-300 ${
        isLight
          ? "bg-[var(--bg-stone)] text-[var(--ink-stone-primary)]"
          : "bg-[var(--bg-canvas)] text-[var(--ink-primary)]"
      }`}
    >
      {/* Sticky Minimalist Reader Bar */}
      <div
        className={`sticky top-16 z-20 border-b backdrop-blur-xl transition-colors duration-200 ${
          isLight
            ? "border-[var(--hairline-stone)] bg-[#F1F3F6]/90 text-[var(--ink-stone-primary)]"
            : "border-[var(--hairline)] bg-[#07090D]/90 text-[var(--ink-primary)]"
        }`}
      >
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8 lg:px-12">
          <PreloadLink
            href="/journal"
            className={`inline-flex items-center gap-2 text-[14px] font-medium transition-colors duration-150 ${
              isLight
                ? "text-[var(--ink-stone-muted)] hover:text-[var(--ink-stone-primary)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            }`}
          >
            <ArrowLeft
              className="h-4 w-4"
              style={{ color: isLight ? "#C82810" : accentColor }}
              strokeWidth={1.8}
            />
            <span>Journal</span>
          </PreloadLink>

          <div className="flex items-center gap-4">
            <span
              className={`font-tabular hidden items-center gap-1.5 text-[14px] md:inline-flex ${
                isLight
                  ? "text-[var(--ink-stone-muted)]"
                  : "text-[var(--ink-muted)]"
              }`}
            >
              <Clock
                className="h-3.5 w-3.5"
                style={{ color: isLight ? "#C82810" : accentColor }}
                strokeWidth={1.7}
              />
              <span>
                Issue {dispatch.issue_number} · {dispatch.reading_time_mins} min
                read
              </span>
            </span>

            <button
              type="button"
              id="dispatch-toolbar-share-btn"
              onClick={() => setShareOpen(true)}
              className={`inline-flex cursor-pointer items-center gap-1.5 text-[14px] font-medium transition-colors duration-150 ${
                isLight
                  ? "text-[var(--ink-stone-primary)] hover:text-[var(--accent-on-stone)]"
                  : "text-[var(--ink-primary)] hover:text-[#FF7A63]"
              }`}
            >
              <Share2
                className="h-4 w-4"
                style={{ color: isLight ? "#C82810" : accentColor }}
                strokeWidth={1.8}
              />
              <span>Share</span>
            </button>

            {/* Connected Dark / Light Switch */}
            <div
              role="group"
              aria-label="Reading theme"
              className={`inline-flex items-center rounded-full border p-1 ${
                isLight
                  ? "border-[var(--hairline-stone)] bg-[var(--bg-stone-subtle)]"
                  : "border-[var(--hairline-strong)] bg-[var(--bg-surface)]"
              }`}
            >
              <button
                type="button"
                id="reader-mode-dark"
                aria-pressed={!isLight}
                onClick={() => setReadingMode("DARK")}
                className={`press-tactile relative inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium transition-colors duration-150 ${
                  !isLight
                    ? "text-[#07090D]"
                    : "text-[var(--ink-stone-muted)] hover:text-[var(--ink-stone-primary)]"
                }`}
              >
                {!isLight && (
                  <motion.span
                    layoutId="reader-theme-pill"
                    transition={
                      prefersReducedMotion ? { duration: 0.1 } : SPRING_UI
                    }
                    className="absolute inset-0 rounded-full bg-[var(--ink-primary)]"
                  />
                )}
                <Moon className="relative z-10 h-3.5 w-3.5" strokeWidth={1.7} />
                <span className="relative z-10">Dark</span>
              </button>

              <button
                type="button"
                id="reader-mode-light"
                aria-pressed={isLight}
                onClick={() => setReadingMode("LIGHT")}
                className={`press-tactile relative inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium transition-colors duration-150 ${
                  isLight
                    ? "text-[#F2F4F8]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                }`}
              >
                {isLight && (
                  <motion.span
                    layoutId="reader-theme-pill"
                    transition={
                      prefersReducedMotion ? { duration: 0.1 } : SPRING_UI
                    }
                    className="absolute inset-0 rounded-full bg-[var(--ink-stone-primary)]"
                  />
                )}
                <Sun className="relative z-10 h-3.5 w-3.5" strokeWidth={1.7} />
                <span className="relative z-10">Light</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1360px] px-5 pt-8 pb-24 sm:px-8 lg:px-12 lg:pb-32">
        {isAdminPreview && (
          <div
            role="status"
            className={`mb-8 flex flex-wrap items-center justify-between gap-3 border-l-2 border-[var(--accent)] py-2 pl-4 text-[14px] ${
              isLight ? "text-[#991B1B]" : "text-[#FF8A7A]"
            }`}
          >
            <span>
              Admin preview · Status:{" "}
              <strong>{dispatch.approval_status || "UNPUBLISHED"}</strong>,
              hidden from public readers until approved.
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleQuickCopyShareLink}
                className="inline-flex cursor-pointer items-center gap-1.5 font-medium underline underline-offset-4"
              >
                {copiedShareLink ? (
                  <>
                    <Check className="h-4 w-4 text-[#10B981]" strokeWidth={2} />
                    <span>Copied preview link</span>
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" strokeWidth={1.8} />
                    <span>Copy preview link</span>
                  </>
                )}
              </button>
              <a
                href="/gg-command"
                className="press-tactile rounded-full bg-[var(--accent)] px-4 py-1.5 text-[13px] font-semibold text-[#07090D]"
              >
                Return to Command Center
              </a>
            </div>
          </div>
        )}

        {isSharedDraft && !isAdminPreview && (
          <div
            role="status"
            className={`mb-8 border-l-2 border-[#F59E0B] py-2 pl-4 text-[14px] ${
              isLight ? "text-[#92400E]" : "text-[#FBBF24]"
            }`}
          >
            Shared draft preview · You are reading an unlisted dispatch shared
            via a private link.
          </div>
        )}

        {/* Editorial Article Header */}
        <header
          className={`border-b pb-10 sm:pt-4 sm:pb-12 ${
            isLight
              ? "border-[var(--hairline-stone)]"
              : "border-[var(--hairline)]"
          }`}
        >
          <div
            className={
              heroLayout === "split" && dispatch.cover_image_url
                ? "grid grid-cols-1 items-center gap-10 lg:grid-cols-12"
                : "max-w-4xl"
            }
          >
            <div
              className={
                heroLayout === "split" && dispatch.cover_image_url
                  ? "lg:col-span-7"
                  : ""
              }
            >
              <p
                className={`font-tabular text-[14px] font-medium ${
                  isLight
                    ? "text-[var(--ink-stone-muted)]"
                    : "text-[var(--ink-muted)]"
                }`}
              >
                <span
                  className="font-semibold"
                  style={{ color: isLight ? "#C82810" : accentColor }}
                >
                  Issue {dispatch.issue_number}
                </span>{" "}
                ·{" "}
                {DISPATCH_CATEGORY_LABELS[dispatch.category] ??
                  dispatch.category}{" "}
                · {dispatch.reading_time_mins} min read
              </p>

              <h1 className="font-display mt-5 text-[clamp(2.25rem,4.8vw,4rem)] leading-[1.04] font-bold tracking-[-0.035em]">
                {sanitizeProse(dispatch.title)}
              </h1>

              <p
                className={`mt-5 max-w-[65ch] text-[16px] leading-[1.65] ${
                  isLight ? "text-[#2D3440]" : "text-[var(--ink-muted)]"
                }`}
              >
                {sanitizeProse(dispatch.subtitle)}
              </p>

              <div className="mt-8 flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <div className="text-[14px] font-semibold">
                    {dispatch.author_name}
                  </div>
                  <div
                    className={`mt-0.5 text-[14px] ${
                      isLight
                        ? "text-[var(--ink-stone-muted)]"
                        : "text-[var(--ink-muted)]"
                    }`}
                  >
                    {dispatch.author_role.replace(/\s*\/\/\s*/g, ", ")}
                  </div>
                </div>

                <p
                  className={`text-[14px] ${
                    isLight
                      ? "text-[var(--ink-stone-muted)]"
                      : "text-[var(--ink-muted)]"
                  }`}
                >
                  {dispatch.tags.map(formatTagLabel).join(" · ")}
                </p>
              </div>
            </div>

            {dispatch.cover_image_url && heroLayout === "split" && (
              <div className="lg:col-span-5">
                <div className="overflow-hidden rounded-xl ring-1 ring-inset ring-white/[0.08]">
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

          {dispatch.cover_image_url &&
            heroLayout !== "split" &&
            heroLayout !== "minimal" && (
              <div
                className={`mt-10 overflow-hidden rounded-xl ring-1 ring-inset ${
                  heroLayout === "fullbleed" ? "max-h-[480px]" : "max-w-4xl"
                } ${isLight ? "ring-black/10" : "ring-white/[0.08]"}`}
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

        {/* 12-Column Reading Grid */}
        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <aside className="lg:col-span-3">
            <nav
              aria-label="Table of contents"
              className="lg:sticky lg:top-36"
            >
              <div
                className={`text-[14px] font-semibold ${
                  isLight
                    ? "text-[var(--ink-stone-primary)]"
                    : "text-[var(--ink-primary)]"
                }`}
              >
                On this page
              </div>
              <ul className="mt-3 space-y-2 border-l border-[var(--hairline)] pl-4">
                {headings.map((h) => (
                  <li key={h.id}>
                    <a
                      href={`#${h.id}`}
                      className={`block py-1 text-[14px] leading-snug transition-colors duration-150 ${
                        isLight
                          ? "text-[var(--ink-stone-muted)] hover:text-[var(--ink-stone-primary)]"
                          : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                      }`}
                    >
                      {h.content}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <article className="min-w-0 lg:col-span-9">
            <div className="max-w-[65ch] space-y-6">
              {blocks.map((block, idx) => {
                if (block.type === "h2") {
                  return (
                    <h2
                      key={idx}
                      id={block.id}
                      className="type-heading scroll-mt-36 pt-6"
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
                      className="type-subhead scroll-mt-36 pt-3"
                    >
                      {block.content}
                    </h3>
                  );
                }

                if (block.type === "image" && block.url) {
                  return (
                    <figure
                      key={idx}
                      className={`overflow-hidden rounded-xl border ${
                        isLight
                          ? "border-[var(--hairline-stone)] bg-[var(--bg-stone-subtle)]"
                          : "border-[var(--hairline)] bg-[var(--bg-surface)]"
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
                          className={`px-4 py-3 text-[14px] ${
                            isLight
                              ? "text-[var(--ink-stone-muted)]"
                              : "text-[var(--ink-muted)]"
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
                      : isLight
                      ? "#C82810"
                      : accentColor;
                  return (
                    <aside
                      key={idx}
                      style={{
                        borderColor: calloutBorderColor,
                        backgroundColor:
                          calloutStyle === "tinted-banner"
                            ? `${calloutBorderColor}14`
                            : isLight
                            ? "#E5E9F0"
                            : "#0F1218",
                      }}
                      className={`rounded-r-xl border-l-2 p-5 text-[16px] leading-[1.65] ${
                        isLight
                          ? "text-[var(--ink-stone-primary)]"
                          : "text-[var(--ink-primary)]"
                      }`}
                    >
                      {block.calloutKind && block.calloutKind !== "QUOTE" && (
                        <div
                          className="mb-1.5 text-[14px] font-semibold"
                          style={{ color: calloutBorderColor }}
                        >
                          {block.calloutKind.charAt(0) +
                            block.calloutKind.slice(1).toLowerCase()}
                        </div>
                      )}
                      <div>
                        {renderInlineText(block.content, isLight, accentColor)}
                      </div>
                    </aside>
                  );
                }

                if (block.type === "code") {
                  const isCopied = copiedCodeIdx === idx;
                  return (
                    <div
                      key={idx}
                      className="overflow-hidden rounded-xl border border-[var(--hairline)] bg-[#0B0E14] text-[#F2F4F8]"
                    >
                      <div className="flex items-center justify-between border-b border-[var(--hairline)] bg-[#11151E] px-4 py-2.5">
                        <span className="text-[13px] font-medium text-[#9BA3B0]">
                          {block.lang}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(block.content, idx)}
                          className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-[#F2F4F8] transition-colors duration-150 hover:text-[#FF7A63]"
                        >
                          {isCopied ? (
                            <>
                              <Check
                                className="h-3.5 w-3.5 text-[#34D399]"
                                strokeWidth={2}
                              />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" strokeWidth={1.7} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="overflow-x-auto p-5 text-[13.5px] leading-relaxed text-[#F2F4F8]">
                        <code>{block.content}</code>
                      </pre>
                    </div>
                  );
                }

                if (block.type === "ul") {
                  return (
                    <ul
                      key={idx}
                      className="space-y-3 pl-1 text-[16px] leading-[1.7]"
                    >
                      {block.items?.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span
                            aria-hidden="true"
                            className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor: isLight
                                ? "#C82810"
                                : accentColor,
                            }}
                          />
                          <span
                            className={
                              isLight ? "text-[#1D232E]" : "text-[#D4DAE4]"
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
                    className={`text-[16px] leading-[1.75] ${
                      isLight ? "text-[#1D232E]" : "text-[#D4DAE4]"
                    }`}
                  >
                    {renderInlineText(block.content, isLight, accentColor)}
                  </p>
                );
              })}

              {galleryImages.length > 0 && (
                <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
                  {galleryImages.map((img, i) => (
                    <figure
                      key={i}
                      className={`overflow-hidden rounded-xl border ${
                        isLight
                          ? "border-[var(--hairline-stone)] bg-[var(--bg-stone-subtle)]"
                          : "border-[var(--hairline)] bg-[var(--bg-surface)]"
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
                          className={`px-4 py-2.5 text-[14px] ${
                            isLight
                              ? "text-[var(--ink-stone-muted)]"
                              : "text-[var(--ink-muted)]"
                          }`}
                        >
                          {img.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              )}

              {featuredLinks.length > 0 && (
                <section
                  className={`border-t pt-8 ${
                    isLight
                      ? "border-[var(--hairline-stone)]"
                      : "border-[var(--hairline)]"
                  }`}
                >
                  <div className="flex items-center gap-2 text-[14px] font-semibold">
                    <ExternalLink
                      className="h-4 w-4"
                      style={{ color: isLight ? "#C82810" : accentColor }}
                    />
                    <span>Referenced resources</span>
                  </div>
                  <div className="mt-4 divide-y divide-[var(--hairline)]">
                    {featuredLinks.map((lnk, i) => (
                      <a
                        key={i}
                        href={lnk.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="group block py-3.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[16px] font-medium">
                            {lnk.label}
                          </span>
                          <ArrowUpRight
                            className="h-4 w-4 shrink-0"
                            style={{
                              color: isLight ? "#C82810" : accentColor,
                            }}
                          />
                        </div>
                        {lnk.description && (
                          <p
                            className={`mt-1 text-[14px] ${
                              isLight
                                ? "text-[var(--ink-stone-muted)]"
                                : "text-[var(--ink-muted)]"
                            }`}
                          >
                            {lnk.description}
                          </p>
                        )}
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Share Dispatch Strip */}
              <section
                aria-label="Share this dispatch"
                className={`mt-8 border-t pt-8 ${
                  isLight
                    ? "border-[var(--hairline-stone)]"
                    : "border-[var(--hairline)]"
                }`}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="type-subhead">Share this dispatch</h2>
                    <p
                      className={`mt-1 text-[14px] ${
                        isLight
                          ? "text-[var(--ink-stone-muted)]"
                          : "text-[var(--ink-muted)]"
                      }`}
                    >
                      Copy a link with a matching Open Graph social preview.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      id="dispatch-footer-copy-link-btn"
                      onClick={handleQuickCopyShareLink}
                      className={`press-tactile inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-5 text-[14px] font-semibold ${
                        copiedShareLink
                          ? "bg-[#10B981] text-[#07090D]"
                          : "bg-[var(--accent)] text-[#07090D] hover:bg-[var(--accent-hover)]"
                      }`}
                    >
                      {copiedShareLink ? (
                        <>
                          <Check className="h-4 w-4" strokeWidth={2.1} />
                          <span>Copied link</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" strokeWidth={1.9} />
                          <span>Copy link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      id="dispatch-footer-share-modal-btn"
                      onClick={() => setShareOpen(true)}
                      className="inline-flex cursor-pointer items-center gap-1.5 text-[14px] font-medium underline underline-offset-4"
                    >
                      <span>Preview</span>
                    </button>

                    <a
                      href={socialTargets.x}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-[14px] font-medium underline underline-offset-4"
                    >
                      <span>X</span>
                      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.7} />
                    </a>

                    <a
                      href={socialTargets.linkedin}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-[14px] font-medium underline underline-offset-4"
                    >
                      <span>LinkedIn</span>
                      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.7} />
                    </a>
                  </div>
                </div>
              </section>

              <div className="pt-8">
                <NewsletterBar source={`dispatch-${dispatch.issue_number}`} />
              </div>
            </div>
          </article>
        </div>

        {/* Continue Reading */}
        {otherDispatches.length > 0 && (
          <section
            aria-labelledby="more-dispatches-heading"
            className={`mt-20 border-t pt-12 ${
              isLight
                ? "border-[var(--hairline-stone)]"
                : "border-[var(--hairline)]"
            }`}
          >
            <h2 id="more-dispatches-heading" className="type-heading">
              More Lab Dispatches
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
              {otherDispatches.map((other) => (
                <PreloadLink
                  key={other.id}
                  href={`/journal/${other.slug}`}
                  className={`group block border-t pt-5 ${
                    isLight
                      ? "border-[var(--hairline-stone)]"
                      : "border-[var(--hairline-strong)]"
                  }`}
                >
                  <p
                    className={`font-tabular text-[14px] ${
                      isLight
                        ? "text-[var(--ink-stone-muted)]"
                        : "text-[var(--ink-muted)]"
                    }`}
                  >
                    <span
                      className={`font-semibold ${
                        isLight ? "text-[#C82810]" : "text-[#FF7A63]"
                      }`}
                    >
                      Issue {other.issue_number}
                    </span>{" "}
                    ·{" "}
                    {DISPATCH_CATEGORY_LABELS[other.category] ?? other.category}
                  </p>
                  <h3 className="type-subhead mt-3 transition-colors duration-150 group-hover:text-[#FF7A63]">
                    {other.title}
                  </h3>
                  <p
                    className={`font-tabular mt-4 text-[14px] ${
                      isLight
                        ? "text-[var(--ink-stone-muted)]"
                        : "text-[var(--ink-muted)]"
                    }`}
                  >
                    {other.reading_time_mins} min read
                  </p>
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
