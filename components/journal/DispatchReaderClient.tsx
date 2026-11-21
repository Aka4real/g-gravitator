"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Sun, Moon, Clock, Copy, Check } from "lucide-react";
import { NewsletterBar } from "@/components/journal/NewsletterBar";
import { SPRING_UI } from "@/lib/motion";
import type { Dispatch, DispatchCategory } from "@/lib/supabase/types";

interface DispatchReaderClientProps {
  dispatch: Dispatch;
  otherDispatches: Dispatch[];
}

interface ParsedBlock {
  type: "h2" | "code" | "ul" | "p";
  id?: string;
  lang?: string;
  content: string;
  items?: string[];
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
    } else if (trimmed.startsWith("```")) {
      const lines = trimmed.split("\n");
      const lang = lines[0].replace("```", "").trim() || "text";
      const code = lines.slice(1, -1).join("\n");
      blocks.push({ type: "code", lang, content: code });
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
 * Pure React inline markdown formatter for **bold**, `code`, and *italic* spans.
 */
function renderInlineText(text: string, isLight: boolean): React.ReactNode[] {
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong
          key={idx}
          className={isLight ? "font-semibold text-[#08080A]" : "font-semibold text-[#F4F3EF]"}
        >
          {renderInlineText(part.slice(2, -2), isLight)}
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

export function DispatchReaderClient({
  dispatch,
  otherDispatches,
}: DispatchReaderClientProps) {
  const prefersReducedMotion = useReducedMotion();
  // Obsidian Dark (#08080A) vs Editorial Alabaster Light (#F4F3EF) reading mode
  const [readingMode, setReadingMode] = useState<"DARK" | "LIGHT">("DARK");
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

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

  return (
    <div
      data-reading-theme={isLight ? "light" : "dark"}
      className={`min-h-screen transition-colors duration-300 ${
        isLight
          ? "bg-[#F4F3EF] text-[#111114]"
          : "bg-[#08080A] text-[#F4F3EF]"
      }`}
    >
      <div className="mx-auto max-w-[1360px] px-5 pt-4 pb-24 sm:px-8 lg:px-12 lg:pb-32">
        {/* Sticky Floating Reader Toolbar */}
        <div className="sticky top-[76px] z-20 pt-2">
          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-full px-4 py-2 sm:px-5 ${
              isLight
                ? "border border-black/[0.09] bg-[#F4F3EF]/85 text-[#111114] shadow-[0_12px_32px_rgba(8,8,10,0.08)] backdrop-blur-xl"
                : "glass-chrome text-[#F4F3EF]"
            }`}
          >
            <Link
              href="/journal"
              className={`press-tactile inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium transition-colors ${
                isLight
                  ? "text-[#27272A] hover:text-[#08080A]"
                  : "text-[#D4D4D8] hover:text-[#F4F3EF]"
              }`}
            >
              <ArrowLeft
                className="h-4 w-4 text-[#FF3B1F]"
                strokeWidth={1.8}
              />
              <span>Journal</span>
            </Link>

            <div className="flex items-center gap-3 sm:gap-4">
              <span
                className={`font-mono-telemetry hidden items-center gap-1.5 text-xs sm:inline-flex ${
                  isLight ? "text-[#52525B]" : "text-[#A1A1AA]"
                }`}
              >
                <Clock className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.6} />
                <span>
                  Issue {dispatch.issue_number} · {dispatch.reading_time_mins} min read
                </span>
              </span>

              {/* Dark / Light Editorial Reading Mode Segmented Switch */}
              <div
                role="group"
                aria-label="Reading theme"
                className={`inline-flex items-center rounded-full border p-1 ${
                  isLight
                    ? "border-black/[0.1] bg-[#E8E6DF]"
                    : "border-white/[0.09] bg-[#0B0B0E]/90"
                }`}
              >
                <button
                  type="button"
                  id="reader-mode-dark"
                  aria-pressed={!isLight}
                  onClick={() => setReadingMode("DARK")}
                  className={`press-tactile relative inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
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
                  <span className="relative z-10">Dark</span>
                </button>

                <button
                  type="button"
                  id="reader-mode-light"
                  aria-pressed={isLight}
                  onClick={() => setReadingMode("LIGHT")}
                  className={`press-tactile relative inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
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
                  <span className="relative z-10">Light</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Editorial Article Header */}
        <header
          className={`border-b pt-12 pb-10 sm:pt-16 sm:pb-12 ${
            isLight ? "border-black/[0.1]" : "border-white/[0.08]"
          }`}
        >
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono-telemetry inline-flex items-center rounded-full bg-[#FF3B1F] px-3 py-1 text-xs font-semibold text-[#08080A]">
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
                            className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF3B1F]"
                          />
                          <span
                            className={
                              isLight ? "text-[#1C1C20]" : "text-[#D4D4D8]"
                            }
                          >
                            {renderInlineText(item, isLight)}
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
                    {renderInlineText(block.content, isLight)}
                  </p>
                );
              })}

              {/* Theme-Adaptive Newsletter Capture */}
              <div className="pt-10">
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
                <Link
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
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
