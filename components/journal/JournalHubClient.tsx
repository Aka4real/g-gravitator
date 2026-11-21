"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Search,
  ArrowUpRight,
  Pin,
  ChevronDown,
  X,
  RotateCcw,
} from "lucide-react";
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

const DISPATCH_CATEGORIES: { key: DispatchCategory | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "AI SYSTEMS", label: "AI Systems" },
  { key: "HACKATHON LOG", label: "Hackathon Log" },
  { key: "DESIGN ENGINEERING", label: "Design Engineering" },
  { key: "ARCHITECTURE", label: "Architecture" },
  { key: "POST-MORTEM", label: "Post-Mortem" },
];

const NEWS_CATEGORIES: { key: NewsCategory | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
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

function formatHydrationSafeTimestamp(iso: string, nowMs: number | null): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--";

  if (nowMs === null) {
    return `${UTC_MONTHS[date.getUTCMonth()]} ${String(date.getUTCDate()).padStart(2, "0")}`;
  }

  const diffMin = Math.max(1, Math.round((nowMs - date.getTime()) / 60_000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatTagLabel(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function sanitizeProse(text: string): string {
  return text.replaceAll(" // ", " · ").replaceAll("—", ", ");
}

export function JournalHubClient({
  dispatches,
  newsItems,
  initialQuery = "",
}: JournalHubClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [dispatchCat, setDispatchCat] = useState<DispatchCategory | "ALL">("ALL");
  const [newsCat, setNewsCat] = useState<NewsCategory | "ALL">("ALL");
  const [expandedNewsIds, setExpandedNewsIds] = useState<string[]>(() =>
    newsItems.slice(0, 3).map((n) => n.id)
  );
  // Hydration-safe timestamp: remains null during SSR and first client render
  const [nowMs, setNowMs] = useState<number | null>(null);

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
      {/* Pinned Breaking Signal Callout */}
      {pinnedNews && (
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#FF3B1F]/25 bg-[#FF3B1F]/[0.07] px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5 sm:flex-nowrap">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#FF3B1F] px-3 py-1 text-xs font-semibold text-[#08080A]">
              <Pin className="h-3 w-3" strokeWidth={2} />
              <span>Pinned signal</span>
            </span>
            <a
              href={pinnedNews.source_url}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 text-sm font-medium text-[#F4F3EF] transition-colors hover:text-[#FF8A7A]"
            >
              {pinnedNews.title}
            </a>
          </div>
          <div className="font-mono-telemetry flex shrink-0 items-center gap-2 text-xs text-[#D4D4D8]">
            <span className="text-[#A1A1AA]">{pinnedNews.source_name}</span>
            <span className="text-[#52525B]" aria-hidden="true">
              /
            </span>
            <span className="font-semibold text-[#34D399]">
              Impact {pinnedNews.impact_score}/100
            </span>
          </div>
        </div>
      )}

      {/* Featured Flagship Lab Dispatch */}
      {featuredDispatch && (
        <article className="surface-card p-7 sm:p-10 lg:p-12">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono-telemetry inline-flex items-center rounded-full bg-[#FF3B1F] px-3 py-1 text-xs font-semibold text-[#08080A]">
              Issue {featuredDispatch.issue_number}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/[0.1] bg-[#18181D] px-3 py-1 text-xs font-medium text-[#D4D4D8]">
              {DISPATCH_CATEGORY_LABELS[featuredDispatch.category] ??
                featuredDispatch.category}
            </span>
            <span className="font-mono-telemetry text-xs text-[#8B8B94]">
              {featuredDispatch.reading_time_mins} min read
            </span>
            <span className="text-xs text-[#8B8B94]">
              by <span className="text-[#D4D4D8]">{featuredDispatch.author_name}</span>
            </span>
          </div>

          <Link
            href={`/journal/${featuredDispatch.slug}`}
            className="font-display mt-5 block max-w-4xl text-[clamp(1.75rem,3.4vw,2.875rem)] leading-[1.1] font-bold tracking-[-0.025em] text-[#F4F3EF] transition-colors hover:text-[#FF6B54]"
          >
            {featuredDispatch.title}
          </Link>

          <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-[#A1A1AA] sm:text-lg">
            {sanitizeProse(featuredDispatch.subtitle)}
          </p>

          <div className="mt-8 flex flex-col gap-5 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {featuredDispatch.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-medium text-[#A1A1AA]"
                >
                  {formatTagLabel(tag)}
                </span>
              ))}
            </div>

            <Link
              href={`/journal/${featuredDispatch.slug}`}
              className="press-tactile inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-[#F4F3EF] px-6 text-sm font-semibold whitespace-nowrap text-[#08080A] hover:bg-[#FF3B1F] sm:self-auto"
            >
              <span>Read dispatch</span>
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
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
            className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#8B8B94]"
            strokeWidth={1.6}
          />
          <input
            type="text"
            id="journal-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Lab Dispatches and Orbital Wire (e.g. Gemini Flash, MCP, arXiv)..."
            className="h-11 w-full rounded-xl border border-white/[0.12] bg-[#111114] pr-10 pl-11 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/25 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear journal search"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-[#8B8B94] transition-colors hover:bg-white/[0.08] hover:text-[#F4F3EF]"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-[#8B8B94]">
          <span>
            <span className="font-mono-telemetry font-semibold text-[#F4F3EF]">
              {filteredDispatches.length}
            </span>{" "}
            dispatches
          </span>
          <span className="text-[#52525B]" aria-hidden="true">
            /
          </span>
          <span>
            <span className="font-mono-telemetry font-semibold text-[#34D399]">
              {filteredNews.length}
            </span>{" "}
            wire signals
          </span>
        </div>
      </div>

      {/* Dual-Track Editorial Layout */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
        {/* Main Column (7/8 cols): Lab Dispatches */}
        <section aria-labelledby="lab-dispatches-heading" className="min-w-0 lg:col-span-7 xl:col-span-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="lab-dispatches-heading"
              className="font-display text-2xl font-semibold tracking-[-0.02em] text-[#F4F3EF] sm:text-3xl"
            >
              Lab Dispatches
            </h2>
            <span className="text-xs text-[#8B8B94]">Dark and light reader</span>
          </div>

          {/* Dispatch Category Pills */}
          <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {DISPATCH_CATEGORIES.map((cat) => {
              const active = dispatchCat === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setDispatchCat(cat.key)}
                  className={`press-tactile shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap ${
                    active
                      ? "border-[#F4F3EF] bg-[#F4F3EF] font-semibold text-[#08080A]"
                      : "border-white/[0.08] bg-[#111114] text-[#A1A1AA] hover:border-white/[0.18] hover:text-[#F4F3EF]"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Dispatches List */}
          {filteredDispatches.length === 0 ? (
            <div className="surface-card mt-6 p-10 text-center">
              <p className="text-sm font-medium text-[#F4F3EF]">
                No dispatches match this filter.
              </p>
              <p className="mt-1 text-xs text-[#8B8B94]">
                Try switching categories or clearing your search query.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDispatchCat("ALL");
                  setSearchQuery("");
                }}
                className="press-tactile mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.1] bg-[#18181D] px-4 py-2 text-xs font-medium text-[#F4F3EF] hover:border-white/[0.2]"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.7} />
                <span>Show all dispatches</span>
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {filteredDispatches.map((disp) => (
                <article
                  key={disp.id}
                  className="surface-card surface-card-interactive p-6 sm:p-8"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-telemetry inline-flex items-center rounded-full bg-white/[0.08] px-2.5 py-0.5 text-xs font-semibold text-[#F4F3EF]">
                        Issue {disp.issue_number}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-[#FF3B1F]/30 bg-[#FF3B1F]/10 px-2.5 py-0.5 text-xs font-medium text-[#FF8A7A]">
                        {DISPATCH_CATEGORY_LABELS[disp.category] ?? disp.category}
                      </span>
                    </div>
                    <span className="font-mono-telemetry text-xs text-[#8B8B94]">
                      {disp.reading_time_mins} min read · {disp.author_name}
                    </span>
                  </div>

                  <Link
                    href={`/journal/${disp.slug}`}
                    className="font-display mt-4 block text-xl leading-snug font-semibold tracking-[-0.02em] text-[#F4F3EF] transition-colors hover:text-[#FF6B54] sm:text-2xl"
                  >
                    {disp.title}
                  </Link>

                  <p className="mt-2.5 max-w-[65ch] text-sm leading-relaxed text-[#A1A1AA]">
                    {sanitizeProse(disp.subtitle)}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-4">
                    <div className="flex flex-wrap gap-1.5">
                      {disp.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-xs text-[#8B8B94]"
                        >
                          {formatTagLabel(tag)}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={`/journal/${disp.slug}`}
                      className="group inline-flex items-center gap-1.5 text-sm font-medium text-[#F4F3EF] transition-colors hover:text-[#FF6B54]"
                    >
                      <span>Open reader</span>
                      <ArrowUpRight
                        className="h-4 w-4 text-[#FF6B54] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        strokeWidth={1.8}
                      />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Weekly Orbital Brief Capture Bar */}
          <div className="mt-8">
            <NewsletterBar />
          </div>
        </section>

        {/* Sidebar Rail (5/4 cols): The Orbital Wire */}
        <aside aria-labelledby="orbital-wire-heading" className="min-w-0 lg:col-span-5 xl:col-span-4">
          <div className="flex items-center justify-between gap-3">
            <h2
              id="orbital-wire-heading"
              className="font-display text-2xl font-semibold tracking-[-0.02em] text-[#F4F3EF] sm:text-3xl"
            >
              The Orbital Wire
            </h2>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#10B981]/30 bg-[#10B981]/12 px-3 py-1 text-xs font-medium text-[#34D399]">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10B981]"
              />
              <span>Live feed</span>
            </span>
          </div>

          {/* News Category Pills */}
          <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {NEWS_CATEGORIES.map((cat) => {
              const active = newsCat === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setNewsCat(cat.key)}
                  className={`press-tactile shrink-0 cursor-pointer rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap ${
                    active
                      ? "border-[#10B981] bg-[#10B981] font-semibold text-[#08080A]"
                      : "border-white/[0.08] bg-[#111114] text-[#A1A1AA] hover:border-white/[0.18] hover:text-[#F4F3EF]"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Chronological AI Signal Feed */}
          {filteredNews.length === 0 ? (
            <div className="surface-card mt-6 p-8 text-center">
              <p className="text-sm font-medium text-[#F4F3EF]">
                No wire signals match this filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setNewsCat("ALL");
                  setSearchQuery("");
                }}
                className="press-tactile mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.1] bg-[#18181D] px-3.5 py-1.5 text-xs font-medium text-[#F4F3EF]"
              >
                <RotateCcw className="h-3 w-3" strokeWidth={1.7} />
                <span>Reset wire filters</span>
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredNews.map((item) => {
                const isExpanded = expandedNewsIds.includes(item.id);
                return (
                  <article key={item.id} className="surface-card p-5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="inline-flex shrink-0 items-center rounded-full border border-white/[0.09] bg-[#18181D] px-2.5 py-0.5 text-xs font-medium text-[#D4D4D8]">
                          {NEWS_CATEGORY_LABELS[item.category] ?? item.category}
                        </span>
                        <span className="truncate text-xs text-[#8B8B94]">
                          {item.source_name}
                        </span>
                      </div>
                      <span className="font-mono-telemetry shrink-0 text-xs text-[#8B8B94]">
                        {formatHydrationSafeTimestamp(item.published_at, nowMs)}
                      </span>
                    </div>

                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block text-[15px] leading-snug font-semibold text-[#F4F3EF] transition-colors hover:text-[#FF6B54]"
                    >
                      {item.title}
                    </a>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="font-mono-telemetry text-xs font-medium text-[#34D399]">
                        Impact {item.impact_score}/100
                      </span>

                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => toggleNewsExpand(item.id)}
                        className="press-tactile inline-flex cursor-pointer items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-medium text-[#D4D4D8] hover:border-white/[0.16] hover:text-[#F4F3EF]"
                      >
                        <span>Gravity Take</span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-[#FF6B54] transition-transform duration-200 ${
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
                          className="mt-3 rounded-xl border border-white/[0.07] bg-[#18181D] p-4 text-sm leading-relaxed text-[#D4D4D8]"
                        >
                          {sanitizeProse(item.gravity_take)}
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
    </div>
  );
}
