"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PreloadLink } from "@/components/layout/PreloadLink";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Search,
  ArrowUpRight,
  Pin,
  ChevronDown,
  X,
  RotateCcw,
  Share2,
} from "lucide-react";
import { JournalShareModal } from "@/components/journal/JournalShareModal";
import { NewsletterBar } from "@/components/journal/NewsletterBar";
import { EASE_OUT_EXPO } from "@/lib/motion";
import type {
  Dispatch,
  DispatchCategory,
  NewsCategory,
  NewsItem,
} from "@/lib/supabase/types";

interface JournalHubClientProps {
  dispatches: Dispatch[];
  newsItems: NewsItem[];
  initialQuery?: string;
}

const DISPATCH_CATEGORIES: {
  key: DispatchCategory | "ALL";
  label: string;
}[] = [
  { key: "ALL", label: "All" },
  { key: "AI SYSTEMS", label: "AI Systems" },
  { key: "HACKATHON LOG", label: "Hackathon Log" },
  { key: "DESIGN ENGINEERING", label: "Design Engineering" },
  { key: "ARCHITECTURE", label: "Architecture" },
  { key: "POST-MORTEM", label: "Post-Mortem" },
];

const NEWS_CATEGORIES: { key: NewsCategory | "ALL"; label: string }[] = [
  { key: "ALL", label: "All categories" },
  { key: "MODELS", label: "Models" },
  { key: "AGENTS", label: "Agents" },
  { key: "DEVTOOLS", label: "Devtools" },
  { key: "RESEARCH", label: "Research" },
  { key: "BUSINESS", label: "Business" },
  { key: "OPEN_SOURCE", label: "Open Source" },
];

const DISPATCH_CATEGORY_LABELS: Record<DispatchCategory, string> = {
  "AI SYSTEMS": "AI Systems",
  "HACKATHON LOG": "Hackathon Log",
  "DESIGN ENGINEERING": "Design Engineering",
  ARCHITECTURE: "Architecture",
  "POST-MORTEM": "Post-Mortem",
};

const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  MODELS: "Models",
  AGENTS: "Agents",
  DEVTOOLS: "Devtools",
  RESEARCH: "Research",
  BUSINESS: "Business",
  OPEN_SOURCE: "Open Source",
};

const UTC_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function formatHydrationSafeTimestamp(
  iso: string,
  nowMs: number | null
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--";

  if (nowMs === null) {
    return `${UTC_MONTHS[date.getUTCMonth()]} ${String(
      date.getUTCDate()
    ).padStart(2, "0")}`;
  }

  const diffMin = Math.max(1, Math.round((nowMs - date.getTime()) / 60_000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatTagLabel(tag: string): string {
  return tag.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function sanitizeProse(text: string): string {
  return text.replaceAll(" // ", " · ").replaceAll("\u2014", ", ");
}

export function JournalHubClient({
  dispatches,
  newsItems,
  initialQuery = "",
}: JournalHubClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [dispatchCat, setDispatchCat] = useState<DispatchCategory | "ALL">(
    "ALL"
  );
  const [newsCat, setNewsCat] = useState<NewsCategory | "ALL">("ALL");
  const [expandedNewsIds, setExpandedNewsIds] = useState<string[]>(() =>
    newsItems.slice(0, 3).map((n) => n.id)
  );
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [shareDispatch, setShareDispatch] = useState<Dispatch | null>(null);

  useEffect(() => {
    const syncNow = () => setNowMs(Date.now());
    const kickoff = window.setTimeout(syncNow, 0);
    const interval = window.setInterval(syncNow, 60_000);
    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(interval);
    };
  }, []);

  const featuredDispatch = useMemo(
    () => dispatches.find((d) => d.is_featured) ?? dispatches[0],
    [dispatches]
  );

  const pinnedNews = useMemo(
    () => newsItems.find((n) => n.is_pinned),
    [newsItems]
  );

  const filteredDispatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dispatches.filter((d) => {
      if (dispatchCat !== "ALL" && d.category !== dispatchCat) return false;
      if (q) {
        const hay =
          `${d.title} ${d.subtitle} ${d.tags.join(" ")} ${d.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [dispatches, dispatchCat, searchQuery]);

  const filteredNews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return newsItems.filter((n) => {
      if (newsCat !== "ALL" && n.category !== newsCat) return false;
      if (q) {
        const hay =
          `${n.title} ${n.source_name} ${n.gravity_take} ${n.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [newsItems, newsCat, searchQuery]);

  const toggleNewsExpand = (id: string) => {
    setExpandedNewsIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-w-0 space-y-10">
      {/* Pinned Breaking Signal Bar */}
      {pinnedNews && (
        <div className="flex flex-col justify-between gap-3 border-y border-[var(--accent)]/40 py-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-baseline gap-3">
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-[#FF7A63]">
              <Pin className="h-3.5 w-3.5" strokeWidth={2} />
              <span>Pinned</span>
            </span>
            <a
              href={pinnedNews.source_url}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 text-[16px] font-medium text-[var(--ink-primary)] transition-colors duration-150 hover:text-[#FF7A63]"
            >
              {pinnedNews.title}
            </a>
          </div>
          <p className="font-tabular shrink-0 text-[14px] text-[var(--ink-muted)]">
            {pinnedNews.source_name} ·{" "}
            <span className="font-semibold text-[#34D399]">
              Impact {pinnedNews.impact_score}/100
            </span>
          </p>
        </div>
      )}

      {/* Featured Flagship Dispatch */}
      {featuredDispatch && (
        <article className="surface-slab p-7 sm:p-10 lg:p-12">
          <p className="font-tabular text-[14px] font-medium text-[var(--ink-muted)]">
            <span className="font-semibold text-[var(--accent)]">
              Issue {featuredDispatch.issue_number}
            </span>{" "}
            ·{" "}
            {DISPATCH_CATEGORY_LABELS[featuredDispatch.category] ??
              featuredDispatch.category}{" "}
            · {featuredDispatch.reading_time_mins} min read · By{" "}
            <span className="text-[var(--ink-primary)]">
              {featuredDispatch.author_name}
            </span>
          </p>

          <PreloadLink
            href={`/journal/${featuredDispatch.slug}`}
            className="type-heading mt-4 block max-w-4xl text-[var(--ink-primary)] transition-colors duration-150 hover:text-[#FF7A63]"
          >
            {featuredDispatch.title}
          </PreloadLink>

          <p className="mt-4 max-w-[65ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
            {sanitizeProse(featuredDispatch.subtitle)}
          </p>

          <div className="mt-8 flex flex-col gap-5 border-t border-[var(--hairline)] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[14px] text-[var(--ink-muted)]">
              {featuredDispatch.tags.map(formatTagLabel).join(" · ")}
            </p>

            <div className="flex flex-wrap items-center gap-5 self-start sm:self-auto">
              <button
                type="button"
                id="featured-dispatch-share-btn"
                onClick={() => setShareDispatch(featuredDispatch)}
                className="inline-flex cursor-pointer items-center gap-1.5 text-[14px] font-medium text-[var(--ink-primary)] underline decoration-white/30 underline-offset-4 transition-colors duration-150 hover:text-[#FF7A63]"
              >
                <Share2
                  className="h-4 w-4 text-[var(--accent)]"
                  strokeWidth={1.8}
                />
                <span>Share</span>
              </button>

              <PreloadLink
                href={`/journal/${featuredDispatch.slug}`}
                className="press-tactile inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--ink-primary)] px-6 text-[14px] font-semibold whitespace-nowrap text-[#07090D] hover:bg-[var(--accent)]"
              >
                <span>Read dispatch</span>
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </PreloadLink>
            </div>
          </div>
        </article>
      )}

      {/* Search Bar & Counts */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xl">
          <label htmlFor="journal-search-input" className="sr-only">
            Search Lab Dispatches and Orbital Wire
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]"
            strokeWidth={1.7}
          />
          <input
            type="text"
            id="journal-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Lab Dispatches and Orbital Wire (e.g. Gemini, MCP, arXiv)..."
            className="h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-surface)] pr-10 pl-11 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear journal search"
              className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-full p-1 text-[var(--ink-muted)] transition-colors duration-150 hover:text-[var(--ink-primary)]"
            >
              <X className="h-4 w-4" strokeWidth={1.8} />
            </button>
          )}
        </div>

        <p className="font-tabular text-[14px] text-[var(--ink-muted)]">
          <strong className="font-semibold text-[var(--ink-primary)]">
            {filteredDispatches.length}
          </strong>{" "}
          dispatches ·{" "}
          <strong className="font-semibold text-[#34D399]">
            {filteredNews.length}
          </strong>{" "}
          wire signals
        </p>
      </div>

      {/* Dual-Track Broadsheet Grid */}
      <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-12">
        {/* Main Column (7/8 cols): Lab Dispatches */}
        <section
          aria-labelledby="lab-dispatches-heading"
          className="min-w-0 lg:col-span-7 xl:col-span-8"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="lab-dispatches-heading"
              className="type-heading text-[var(--ink-primary)]"
            >
              Lab Dispatches
            </h2>
            <span className="text-[14px] text-[var(--ink-muted)]">
              Dark and light reader
            </span>
          </div>

          {/* Connected Editorial Underline Tab Bar */}
          <div
            role="tablist"
            aria-label="Dispatch categories"
            className="mt-5 flex items-center gap-6 overflow-x-auto border-b border-[var(--hairline)]"
          >
            {DISPATCH_CATEGORIES.map((cat) => {
              const active = dispatchCat === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setDispatchCat(cat.key)}
                  className={`relative shrink-0 cursor-pointer pb-3 text-[14px] font-medium whitespace-nowrap transition-colors duration-150 ${
                    active
                      ? "text-[var(--ink-primary)]"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                  }`}
                >
                  {cat.label}
                  {active && (
                    <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[var(--accent)]" />
                  )}
                </button>
              );
            })}
          </div>

          {filteredDispatches.length === 0 ? (
            <div className="border-b border-[var(--hairline)] py-12 text-center">
              <p className="text-[16px] font-medium text-[var(--ink-primary)]">
                No dispatches match this filter.
              </p>
              <p className="mt-1.5 text-[14px] text-[var(--ink-muted)]">
                Try switching categories or clearing your search query.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDispatchCat("ALL");
                  setSearchQuery("");
                }}
                className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-[14px] font-medium text-[#FF7A63] underline underline-offset-4"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} />
                <span>Show all dispatches</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--hairline)] border-b border-[var(--hairline)]">
              {filteredDispatches.map((disp) => {
                const dispAccent = /^#[0-9a-fA-F]{3,8}$/.test(
                  disp.design?.accent_color || ""
                )
                  ? disp.design!.accent_color!
                  : "#FF3B1F";

                return (
                  <article key={disp.id} className="py-8">
                    {disp.cover_image_url && (
                      <div className="mb-5 overflow-hidden rounded-xl bg-[var(--bg-surface)] ring-1 ring-inset ring-white/[0.08]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={disp.cover_image_url}
                          alt={disp.title}
                          className="h-52 w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="font-tabular flex flex-wrap items-baseline justify-between gap-2 text-[14px] text-[var(--ink-muted)]">
                      <span>
                        <span className="font-semibold text-[var(--ink-primary)]">
                          Issue {disp.issue_number}
                        </span>{" "}
                        ·{" "}
                        <span style={{ color: dispAccent }}>
                          {DISPATCH_CATEGORY_LABELS[disp.category] ??
                            disp.category}
                        </span>
                      </span>
                      <span>
                        {disp.reading_time_mins} min read · {disp.author_name}
                      </span>
                    </div>

                    <PreloadLink
                      href={`/journal/${disp.slug}`}
                      className="type-heading mt-3 block text-[var(--ink-primary)] transition-colors duration-150 hover:text-[#FF7A63]"
                    >
                      {disp.title}
                    </PreloadLink>

                    <p className="mt-3 max-w-[65ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                      {sanitizeProse(disp.subtitle)}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                      <p className="text-[14px] text-[var(--ink-muted)]">
                        {disp.tags.map(formatTagLabel).join(" · ")}
                      </p>

                      <div className="flex items-center gap-5">
                        <button
                          type="button"
                          onClick={() => setShareDispatch(disp)}
                          aria-label={`Share Issue ${disp.issue_number}: ${disp.title}`}
                          className="inline-flex cursor-pointer items-center gap-1.5 text-[14px] font-medium text-[var(--ink-muted)] transition-colors duration-150 hover:text-[var(--ink-primary)]"
                        >
                          <Share2
                            className="h-4 w-4"
                            style={{ color: dispAccent }}
                            strokeWidth={1.8}
                          />
                          <span>Share</span>
                        </button>

                        <PreloadLink
                          href={`/journal/${disp.slug}`}
                          className="group inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--ink-primary)] underline decoration-white/30 underline-offset-4 transition-colors duration-150 hover:text-[#FF7A63]"
                        >
                          <span>Open reader</span>
                          <ArrowUpRight
                            className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            style={{ color: dispAccent }}
                            strokeWidth={1.8}
                          />
                        </PreloadLink>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-10">
            <NewsletterBar />
          </div>
        </section>

        {/* Sidebar Rail (5/4 cols): The Orbital Wire */}
        <aside
          aria-labelledby="orbital-wire-heading"
          className="min-w-0 lg:col-span-5 xl:col-span-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="orbital-wire-heading"
              className="type-heading text-[var(--ink-primary)]"
            >
              The Orbital Wire
            </h2>

            <div>
              <label htmlFor="wire-category-select" className="sr-only">
                Filter Orbital Wire category
              </label>
              <select
                id="wire-category-select"
                value={newsCat}
                onChange={(e) =>
                  setNewsCat(e.target.value as NewsCategory | "ALL")
                }
                className="h-9 cursor-pointer rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-3 text-[13px] font-medium text-[var(--ink-primary)] focus:border-[var(--accent)] focus:outline-none"
              >
                {NEWS_CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredNews.length === 0 ? (
            <div className="mt-6 border-y border-[var(--hairline)] py-8 text-center">
              <p className="text-[16px] font-medium text-[var(--ink-primary)]">
                No wire signals match this filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setNewsCat("ALL");
                  setSearchQuery("");
                }}
                className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-[14px] font-medium text-[#FF7A63] underline underline-offset-4"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} />
                <span>Reset wire filters</span>
              </button>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
              {filteredNews.map((item) => {
                const isExpanded = expandedNewsIds.includes(item.id);
                return (
                  <article key={item.id} className="py-5">
                    <div className="font-tabular flex items-baseline justify-between gap-2 text-[14px] text-[var(--ink-muted)]">
                      <span className="truncate">
                        <span className="font-medium text-[var(--ink-primary)]">
                          {NEWS_CATEGORY_LABELS[item.category] ?? item.category}
                        </span>{" "}
                        · {item.source_name}
                      </span>
                      <span className="shrink-0">
                        {formatHydrationSafeTimestamp(item.published_at, nowMs)}
                      </span>
                    </div>

                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="type-subhead mt-2.5 block text-[var(--ink-primary)] transition-colors duration-150 hover:text-[#FF7A63]"
                    >
                      {item.title}
                    </a>

                    {item.image_url && (
                      <div className="mt-3 overflow-hidden rounded-xl bg-[var(--bg-surface)] ring-1 ring-inset ring-white/[0.08]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="h-36 w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="mt-3.5 flex items-center justify-between gap-3">
                      <span
                        className="font-tabular text-[14px] font-medium"
                        style={{
                          color: item.design?.accent_color || "#34D399",
                        }}
                      >
                        Impact {item.impact_score}/100
                      </span>

                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => toggleNewsExpand(item.id)}
                        className="inline-flex cursor-pointer items-center gap-1 text-[14px] font-medium text-[var(--ink-primary)] transition-colors duration-150 hover:text-[#FF7A63]"
                      >
                        <span>Gravity Take</span>
                        <ChevronDown
                          className={`h-4 w-4 text-[var(--accent)] transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          strokeWidth={1.8}
                        />
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={
                            prefersReducedMotion
                              ? { opacity: 0 }
                              : { opacity: 0, y: -4 }
                          }
                          animate={{ opacity: 1, y: 0 }}
                          exit={
                            prefersReducedMotion
                              ? { opacity: 0 }
                              : { opacity: 0, y: -4 }
                          }
                          transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
                          className="mt-3 border-l-2 border-[var(--accent)]/60 pl-4 text-[16px] leading-[1.6] text-[var(--ink-muted)]"
                        >
                          <div>{sanitizeProse(item.gravity_take)}</div>
                          {item.related_links &&
                            item.related_links.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-3">
                                {item.related_links.map((lnk, i) => (
                                  <a
                                    key={i}
                                    href={lnk.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[14px] font-medium text-[#FF7A63] underline underline-offset-4 hover:text-[var(--ink-primary)]"
                                  >
                                    <span>{lnk.label}</span>
                                    <ArrowUpRight
                                      className="h-3.5 w-3.5"
                                      strokeWidth={1.8}
                                    />
                                  </a>
                                ))}
                              </div>
                            )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </article>
                );
              })}
            </div>
          )}
        </aside>
      </div>

      <JournalShareModal
        dispatch={shareDispatch}
        open={Boolean(shareDispatch)}
        onClose={() => setShareDispatch(null)}
      />
    </div>
  );
}
