"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowUpRight,
  Radio,
  BookOpen,
  Pin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CrosshairCell } from "@/components/kinetic/CrosshairCell";
import { NewsletterBar } from "@/components/journal/NewsletterBar";
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

const DISPATCH_CATEGORIES: (DispatchCategory | "ALL")[] = [
  "ALL",
  "AI SYSTEMS",
  "HACKATHON LOG",
  "DESIGN ENGINEERING",
  "ARCHITECTURE",
  "POST-MORTEM",
];

const NEWS_CATEGORIES: (NewsCategory | "ALL")[] = [
  "ALL",
  "MODELS",
  "AGENTS",
  "DEVTOOLS",
  "RESEARCH",
  "BUSINESS",
  "OPEN_SOURCE",
];

function formatRelativeTime(iso: string): string {
  const diffMin = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export function JournalHubClient({
  dispatches,
  newsItems,
  initialQuery = "",
}: JournalHubClientProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [dispatchCat, setDispatchCat] = useState<DispatchCategory | "ALL">("ALL");
  const [newsCat, setNewsCat] = useState<NewsCategory | "ALL">("ALL");
  const [expandedNewsIds, setExpandedNewsIds] = useState<string[]>(() =>
    newsItems.slice(0, 3).map((n) => n.id)
  );

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
        const hay = `${d.title} ${d.subtitle} ${d.tags.join(" ")} ${d.category}`.toLowerCase();
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
        const hay = `${n.title} ${n.source_name} ${n.gravity_take} ${n.category}`.toLowerCase();
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
    <div>
      {/* Pinned Breaking Signal Bar */}
      {pinnedNews && (
        <div className="flex flex-col justify-between gap-3 border-b border-[#27272A] bg-[#FF3B1F]/10 px-6 py-3 sm:flex-row sm:items-center lg:px-10">
          <div className="flex items-center gap-2.5">
            <span className="font-mono-telemetry inline-flex items-center gap-1 bg-[#FF3B1F] px-2 py-0.5 text-[10px] font-bold text-[#09090B]">
              <Pin className="h-2.5 w-2.5" strokeWidth={2} />
              <span>PINNED BREAKING SIGNAL</span>
            </span>
            <a
              href={pinnedNews.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-[#F3F2EE] hover:text-[#FF3B1F]"
            >
              {pinnedNews.title}
            </a>
          </div>
          <span className="font-mono-telemetry shrink-0 text-[10px] text-[#A1A1AA]">
            {pinnedNews.source_name} • IMPACT: {pinnedNews.impact_score}/100
          </span>
        </div>
      )}

      {/* =====================================================================
          1. HERO EDITORIAL FEATURE (FLAGSHIP LAB DISPATCH)
         ===================================================================== */}
      {featuredDispatch && (
        <section className="border-b border-[#27272A] bg-[#111114]/60 p-6 sm:p-10 lg:p-14">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono-telemetry bg-[#FF3B1F] px-2.5 py-1 text-xs font-bold text-[#09090B]">
              DISPATCH // {featuredDispatch.issue_number} •{" "}
              {featuredDispatch.reading_time_mins} MIN READ
            </span>
            <span className="font-mono-telemetry border border-[#27272A] bg-[#09090B] px-2.5 py-1 text-xs text-[#F3F2EE]">
              {featuredDispatch.category}
            </span>
            <span className="font-mono-telemetry text-xs text-[#71717A]">
              BY {featuredDispatch.author_name.toUpperCase()}
            </span>
          </div>

          <Link
            href={`/journal/${featuredDispatch.slug}`}
            className="font-display mt-5 block max-w-4xl text-3xl font-extrabold tracking-tight text-[#F3F2EE] hover:text-[#FF3B1F] sm:text-4xl lg:text-5xl"
          >
            {featuredDispatch.title}
          </Link>

          <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#A1A1AA]">
            {featuredDispatch.subtitle}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-[#27272A] pt-5">
            <div className="flex flex-wrap gap-1.5">
              {featuredDispatch.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono-telemetry border border-[#27272A] bg-[#09090B] px-2 py-0.5 text-[10px] text-[#A1A1AA]"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <Link
              href={`/journal/${featuredDispatch.slug}`}
              className="font-mono-telemetry inline-flex items-center gap-2 bg-[#F3F2EE] px-5 py-3 text-xs font-bold text-[#09090B] transition-colors hover:bg-[#FF3B1F]"
            >
              <span>READ FULL ENGINEERING DISPATCH</span>
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </div>
        </section>
      )}

      {/* Global Search & Filter Strip */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#27272A] bg-[#09090B] px-6 py-4 sm:flex-row sm:items-center lg:px-10">
        <div className="relative flex-1 max-w-xl">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#FF3B1F]"
            strokeWidth={1.5}
          />
          <input
            type="text"
            id="journal-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Lab Dispatches and Orbital Wire signals (e.g. Gemini Flash, MCP, arXiv)..."
            className="w-full border border-[#27272A] bg-[#111114] py-2.5 pr-4 pl-10 text-xs text-[#F3F2EE] placeholder-[#71717A] focus:border-[#FF3B1F] focus:outline-none"
          />
        </div>
        <div className="font-mono-telemetry flex items-center gap-3 text-[11px] text-[#A1A1AA]">
          <span>TRACK A: {filteredDispatches.length} DISPATCHES</span>
          <span className="text-[#3F3F46]">|</span>
          <span className="text-[#10B981]">
            TRACK B: {filteredNews.length} ORBITAL WIRE SIGNALS
          </span>
        </div>
      </div>

      {/* =====================================================================
          2. DUAL-TRACK SPLIT FEED (65% MAIN COLUMN / 35% ORBITAL WIRE RAIL)
         ===================================================================== */}
      <div className="grid grid-cols-1 divide-y divide-[#27272A] lg:grid-cols-12 lg:divide-x lg:divide-y-0">
        {/* MAIN COLUMN (65% -> 8 of 12 cols): TRACK A — LAB DISPATCHES */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="border-b border-[#27272A] bg-[#111114] px-6 py-4 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#FF3B1F]" strokeWidth={1.5} />
                <h2 className="font-mono-telemetry text-xs font-bold text-[#F3F2EE]">
                  TRACK A // LAB DISPATCHES (LONG-FORM ENGINEERING JOURNALISM)
                </h2>
              </div>
              <span className="font-mono-telemetry text-[10px] text-[#71717A]">
                DARK / LIGHT READER SUPPORTED
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {DISPATCH_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setDispatchCat(cat)}
                  className={`font-mono-telemetry border px-2.5 py-1 text-[10px] transition-colors ${
                    dispatchCat === cat
                      ? "border-[#FF3B1F] bg-[#FF3B1F] font-bold text-[#09090B]"
                      : "border-[#27272A] bg-[#09090B] text-[#A1A1AA] hover:text-[#F3F2EE]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Dispatches List */}
          <div className="divide-y divide-[#27272A]">
            {filteredDispatches.map((disp) => (
              <CrosshairCell
                key={disp.id}
                corners={["tl"]}
                className="bg-[#09090B] p-6 transition-colors hover:bg-[#111114] sm:p-8"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-telemetry bg-[#F3F2EE] px-2 py-0.5 text-[10px] font-bold text-[#09090B]">
                      DISPATCH // {disp.issue_number}
                    </span>
                    <span className="font-mono-telemetry border border-[#27272A] px-2 py-0.5 text-[10px] text-[#FF3B1F]">
                      {disp.category}
                    </span>
                  </div>
                  <span className="font-mono-telemetry text-[10px] text-[#71717A]">
                    {disp.reading_time_mins} MIN READ • {disp.author_name}
                  </span>
                </div>

                <Link
                  href={`/journal/${disp.slug}`}
                  className="font-display mt-4 block text-2xl font-bold tracking-tight text-[#F3F2EE] hover:text-[#FF3B1F]"
                >
                  {disp.title}
                </Link>

                <p className="mt-2.5 text-xs leading-relaxed text-[#A1A1AA]">
                  {disp.subtitle}
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap gap-1.5">
                    {disp.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono-telemetry border border-[#27272A] bg-[#111114] px-2 py-0.5 text-[9px] text-[#71717A]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/journal/${disp.slug}`}
                    className="font-mono-telemetry inline-flex items-center gap-1.5 text-xs font-semibold text-[#F3F2EE] hover:text-[#FF3B1F]"
                  >
                    <span>OPEN READER</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.8} />
                  </Link>
                </div>
              </CrosshairCell>
            ))}
          </div>

          {/* Weekly Orbital Brief Capture Bar */}
          <div className="border-t border-[#27272A] p-6 sm:p-8">
            <NewsletterBar />
          </div>
        </div>

        {/* SIDEBAR RAIL (35% -> 4 of 12 cols): TRACK B — THE ORBITAL WIRE */}
        <aside className="bg-[#09090B] lg:col-span-5 xl:col-span-4">
          <div className="border-b border-[#27272A] bg-[#111114] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-[#10B981]" strokeWidth={1.5} />
                <h2 className="font-mono-telemetry text-xs font-bold text-[#F3F2EE]">
                  TRACK B // THE ORBITAL WIRE
                </h2>
              </div>
              <span className="font-mono-telemetry flex items-center gap-1 text-[10px] text-[#10B981]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10B981]" />
                <span>FEED: LIVE</span>
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {NEWS_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewsCat(cat)}
                  className={`font-mono-telemetry border px-2 py-0.5 text-[9px] transition-colors ${
                    newsCat === cat
                      ? "border-[#10B981] bg-[#10B981] font-bold text-[#09090B]"
                      : "border-[#27272A] bg-[#09090B] text-[#71717A] hover:text-[#F3F2EE]"
                  }`}
                >
                  {cat.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Chronological High-Density News Ticker */}
          <div className="divide-y divide-[#27272A]">
            {filteredNews.map((item) => {
              const isExpanded = expandedNewsIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="p-5 transition-colors hover:bg-[#111114]/70"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono-telemetry border border-[#27272A] bg-[#111114] px-1.5 py-0.5 text-[9px] text-[#F3F2EE]">
                        {item.category.replace("_", " ")}
                      </span>
                      <span className="font-mono-telemetry text-[10px] text-[#71717A]">
                        {item.source_name}
                      </span>
                    </div>
                    <span className="font-mono-telemetry text-[10px] text-[#71717A]">
                      {formatRelativeTime(item.published_at)}
                    </span>
                  </div>

                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block text-sm font-semibold leading-snug text-[#F3F2EE] hover:text-[#FF3B1F]"
                  >
                    {item.title}
                  </a>

                  {/* Impact Bar + Expandable 2-Sentence Gravity Take */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono-telemetry text-[10px] text-[#10B981]">
                      IMPACT SCORE: {item.impact_score}/100
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleNewsExpand(item.id)}
                      className="font-mono-telemetry inline-flex items-center gap-1 text-[10px] text-[#FF3B1F] hover:underline"
                    >
                      <span>GRAVITY TAKE</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-2.5 border-l-2 border-[#FF3B1F] bg-[#111114] p-3 text-xs leading-relaxed text-[#A1A1AA]">
                      {item.gravity_take}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
