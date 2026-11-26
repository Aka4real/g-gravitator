"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Search,
  LayoutGrid,
  Table as TableIcon,
  Plus,
  Bookmark,
  Calendar,
  ArrowUpRight,
  X,
  CheckCircle2,
  Radar,
  RotateCcw,
} from "lucide-react";
import { CountdownTimer } from "@/components/hackathons/CountdownTimer";
import {
  SourceBadges,
  OxakalabsStatusBadge,
} from "@/components/hackathons/SourceBadges";
import { generateHackathonIcs } from "@/lib/ics";
import { SPRING_SHEET, SPRING_UI } from "@/lib/motion";
import type {
  Hackathon,
  HackathonFormat,
  HackathonProvider,
} from "@/lib/supabase/types";

interface HackathonRadarProps {
  initialHackathons: Hackathon[];
  lastSyncAt: string;
  initialQuery?: string;
  initialOpenSubmit?: boolean;
}

const SOURCE_OPTIONS: { key: HackathonProvider | "all"; label: string }[] = [
  { key: "all", label: "All sources" },
  { key: "twitter", label: "X (Twitter)" },
  { key: "devpost", label: "Devpost" },
  { key: "dorahacks", label: "DoraHacks" },
  { key: "lablab", label: "Lablab.ai" },
  { key: "luma", label: "Luma" },
  { key: "mlh", label: "MLH" },
  { key: "ethglobal", label: "ETHGlobal" },
  { key: "kaggle", label: "Kaggle" },
  { key: "devfolio", label: "Devfolio" },
  { key: "unstop", label: "Unstop" },
];

const FORMAT_OPTIONS: { key: HackathonFormat | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ONLINE", label: "Online" },
  { key: "IN_PERSON", label: "In-person" },
  { key: "HYBRID", label: "Hybrid" },
];

const THEME_OPTIONS = [
  "ALL",
  "AI",
  "Agents",
  "SaaS / Web",
  "Web3",
  "Fintech",
  "HealthTech",
  "Open Source",
  "Hardware",
];

const BOOKMARKS_KEY = "gg_hackathon_bookmarks";
const EMPTY_BOOKMARKS: string[] = [];
const bookmarkListeners = new Set<() => void>();
let cachedBookmarksRaw: string | null = null;
let cachedBookmarksList: string[] = EMPTY_BOOKMARKS;

function subscribeBookmarks(listener: () => void): () => void {
  bookmarkListeners.add(listener);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === BOOKMARKS_KEY) listener();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    bookmarkListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function getBookmarksSnapshot(): string[] {
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_KEY);
    if (raw === cachedBookmarksRaw) return cachedBookmarksList;
    cachedBookmarksRaw = raw;
    if (!raw) {
      cachedBookmarksList = EMPTY_BOOKMARKS;
      return cachedBookmarksList;
    }
    const parsed: unknown = JSON.parse(raw);
    cachedBookmarksList = Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : EMPTY_BOOKMARKS;
    return cachedBookmarksList;
  } catch {
    return EMPTY_BOOKMARKS;
  }
}

function getBookmarksServerSnapshot(): string[] {
  return EMPTY_BOOKMARKS;
}

function formatFormatLabel(fmt: HackathonFormat): string {
  if (fmt === "IN_PERSON") return "In-person";
  if (fmt === "HYBRID") return "Hybrid";
  return "Online";
}

export function HackathonRadar({
  initialHackathons,
  lastSyncAt,
  initialQuery = "",
  initialOpenSubmit = false,
}: HackathonRadarProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hackathons, setHackathons] = useState<Hackathon[]>(initialHackathons);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedSource, setSelectedSource] = useState<
    HackathonProvider | "all"
  >("all");
  const [selectedFormat, setSelectedFormat] = useState<HackathonFormat | "ALL">(
    "ALL"
  );
  const [selectedTheme, setSelectedTheme] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<
    "closing_soon" | "prize_pool" | "newest" | "oxakalabs"
  >("closing_soon");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const bookmarks = useSyncExternalStore(
    subscribeBookmarks,
    getBookmarksSnapshot,
    getBookmarksServerSnapshot
  );

  const [nowMs, setNowMs] = useState<number | null>(null);

  const [submitModalOpen, setSubmitModalOpen] = useState(initialOpenSubmit);
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitContext, setSubmitContext] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedCandidate, setSubmittedCandidate] =
    useState<Hackathon | null>(null);

  useEffect(() => {
    const syncNow = () => setNowMs(Date.now());
    const kickoff = window.setTimeout(syncNow, 0);
    const interval = window.setInterval(syncNow, 60_000);
    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!submitModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSubmitModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [submitModalOpen]);

  const toggleBookmark = useCallback((id: string) => {
    const current = getBookmarksSnapshot();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    const serialized = JSON.stringify(next);
    cachedBookmarksRaw = serialized;
    cachedBookmarksList = next;
    try {
      window.localStorage.setItem(BOOKMARKS_KEY, serialized);
    } catch {
      // Ignore storage write error
    }
    bookmarkListeners.forEach((listener) => listener());
  }, []);

  const handleDownloadIcs = (hack: Hackathon) => {
    const icsContent = generateHackathonIcs(hack);
    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${hack.slug}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedSource("all");
    setSelectedFormat("ALL");
    setSelectedTheme("ALL");
    setBookmarksOnly(false);
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedSource !== "all" ||
    selectedFormat !== "ALL" ||
    selectedTheme !== "ALL" ||
    bookmarksOnly;

  const filteredHackathons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = hackathons.filter((h) => {
      if (bookmarksOnly && !bookmarks.includes(h.id)) return false;
      if (selectedSource !== "all") {
        if (!h.sources.some((s) => s.provider === selectedSource)) return false;
      }
      if (selectedFormat !== "ALL" && h.format !== selectedFormat) return false;
      if (selectedTheme !== "ALL") {
        const hasTheme = h.themes.some(
          (t) => t.toLowerCase() === selectedTheme.toLowerCase()
        );
        if (!hasTheme) return false;
      }
      if (q) {
        const hay =
          `${h.title} ${h.organizer} ${h.summary} ${h.location} ${h.themes.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "prize_pool") {
        return (b.prize_pool_usd ?? 0) - (a.prize_pool_usd ?? 0);
      }
      if (sortBy === "newest") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      if (sortBy === "oxakalabs") {
        const rank = (s: Hackathon["oxakalabs_status"]) =>
          s === "SQUAD_DEPLOYED"
            ? 4
            : s === "SUBMITTED"
            ? 3
            : s === "WON"
            ? 5
            : s === "SCOUTING"
            ? 2
            : 0;
        const diff = rank(b.oxakalabs_status) - rank(a.oxakalabs_status);
        if (diff !== 0) return diff;
      }
      return (
        new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime()
      );
    });
  }, [
    hackathons,
    searchQuery,
    selectedSource,
    selectedFormat,
    selectedTheme,
    sortBy,
    bookmarksOnly,
    bookmarks,
  ]);

  const totalPrizeUsd = useMemo(
    () => hackathons.reduce((acc, h) => acc + (h.prize_pool_usd ?? 0), 0),
    [hackathons]
  );

  const closingUnder72h = useMemo(() => {
    if (nowMs === null) return null;
    return hackathons.filter((h) => {
      const diff = new Date(h.deadline_at).getTime() - nowMs;
      return diff > 0 && diff < 72 * 3600 * 1000;
    }).length;
  }, [hackathons, nowMs]);

  const xSignalCount = useMemo(
    () =>
      hackathons.filter((h) => h.sources.some((s) => s.provider === "twitter"))
        .length,
    [hackathons]
  );

  const syncRelativeLabel = useMemo(() => {
    if (nowMs === null) return "recently";
    const syncMs = new Date(lastSyncAt).getTime();
    if (Number.isNaN(syncMs)) return "recently";
    const mins = Math.max(1, Math.round((nowMs - syncMs) / 60_000));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 48) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
  }, [lastSyncAt, nowMs]);

  const handleSubmitUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmittedCandidate(null);

    try {
      const res = await fetch("/api/hackathons/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: submitUrl,
          raw_context: submitContext || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Verification gate rejected this URL.");
      } else {
        const cand = data.candidate as Hackathon;
        setSubmittedCandidate(cand);
        if (cand.is_published) {
          const refreshed = await fetch("/api/hackathons").then((r) =>
            r.json()
          );
          if (Array.isArray(refreshed.hackathons)) {
            setHackathons(refreshed.hackathons);
          }
        }
      }
    } catch {
      setSubmitError(
        "Network error communicating with the verification pipeline."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-w-0">
      {/* Typographic Summary Ledger + Single Primary Submit Action */}
      <div className="flex flex-col gap-4 border-y border-[var(--hairline)] py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-tabular flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-[var(--ink-muted)]">
          <span>
            <strong className="font-semibold text-[var(--ink-primary)]">
              {hackathons.length}
            </strong>{" "}
            active events
          </span>
          <span aria-hidden="true" className="text-white/25">
            ·
          </span>
          <span>
            <strong className="font-semibold text-[#34D399]">
              ${totalPrizeUsd.toLocaleString("en-US")}
            </strong>{" "}
            in prizes
          </span>
          <span aria-hidden="true" className="text-white/25">
            ·
          </span>
          <span>
            <strong className="font-semibold text-[#FF7A63]">
              {closingUnder72h === null ? "--" : closingUnder72h}
            </strong>{" "}
            closing under 72h
          </span>
          <span aria-hidden="true" className="text-white/25">
            ·
          </span>
          <span>
            <strong className="font-semibold text-[var(--ink-primary)]">
              {xSignalCount}
            </strong>{" "}
            X signals
          </span>
          <span aria-hidden="true" className="text-white/25">
            ·
          </span>
          <span>Synced {syncRelativeLabel}</span>
        </p>

        <button
          type="button"
          id="open-submit-hackathon-modal"
          onClick={() => setSubmitModalOpen(true)}
          className="press-tactile inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 self-start rounded-full bg-[var(--accent)] px-5 text-[14px] font-semibold whitespace-nowrap text-[#07090D] hover:bg-[var(--accent-hover)] sm:self-auto"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          <span>Submit X or link</span>
        </button>
      </div>

      {/* Unified Sticky Filter Bar (Non-Button Controls: Search, Selects, Segmented Switches) */}
      <div className="mt-6 rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)]/95 p-4 backdrop-blur-xl lg:sticky lg:top-[72px] lg:z-20">
        <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
          {/* Search Input */}
          <div className="relative min-w-0 flex-1">
            <label htmlFor="hackathon-search-input" className="sr-only">
              Search hackathons
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]"
              strokeWidth={1.7}
            />
            <input
              type="text"
              id="hackathon-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, sponsors, stack..."
              className="h-10 w-full min-w-0 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] pr-9 pl-10 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search query"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded-full p-1 text-[var(--ink-muted)] transition-colors duration-150 hover:text-[var(--ink-primary)]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.8} />
              </button>
            )}
          </div>

          {/* Native Selectors & Connected Segmented Switches */}
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <div>
              <label htmlFor="hackathon-source-select" className="sr-only">
                Filter by source
              </label>
              <select
                id="hackathon-source-select"
                value={selectedSource}
                onChange={(e) =>
                  setSelectedSource(
                    e.target.value as HackathonProvider | "all"
                  )
                }
                className="h-10 cursor-pointer rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3 text-[14px] font-medium text-[var(--ink-primary)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none"
              >
                {SOURCE_OPTIONS.map((src) => (
                  <option key={src.key} value={src.key}>
                    {src.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="hackathon-theme-select" className="sr-only">
                Filter by theme
              </label>
              <select
                id="hackathon-theme-select"
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="h-10 cursor-pointer rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3 text-[14px] font-medium text-[var(--ink-primary)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none"
              >
                {THEME_OPTIONS.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme === "ALL" ? "All themes" : theme}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="hackathon-sort-select" className="sr-only">
                Sort hackathons
              </label>
              <select
                id="hackathon-sort-select"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | "closing_soon"
                      | "prize_pool"
                      | "newest"
                      | "oxakalabs"
                  )
                }
                className="h-10 cursor-pointer rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3 text-[14px] font-medium text-[var(--ink-primary)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="closing_soon">Closing soonest</option>
                <option value="prize_pool">Highest prize pool</option>
                <option value="newest">Newly discovered</option>
                <option value="oxakalabs">OXAKALABS picks</option>
              </select>
            </div>

            {/* Connected Format Segmented Switch */}
            <div
              role="group"
              aria-label="Hackathon format"
              className="inline-flex max-w-full items-center overflow-x-auto rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] p-1"
            >
              {FORMAT_OPTIONS.map((fmt) => {
                const active = selectedFormat === fmt.key;
                return (
                  <button
                    key={fmt.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedFormat(fmt.key)}
                    className={`press-tactile relative shrink-0 cursor-pointer rounded-full px-3 py-1 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 ${
                      active
                        ? "text-[#07090D]"
                        : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="hackathon-format-pill"
                        transition={
                          prefersReducedMotion ? { duration: 0.1 } : SPRING_UI
                        }
                        className="absolute inset-0 rounded-full bg-[var(--ink-primary)]"
                      />
                    )}
                    <span className="relative z-10">{fmt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Saved Toggle Switch */}
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3 text-[13px] font-medium text-[var(--ink-primary)] select-none">
              <input
                type="checkbox"
                checked={bookmarksOnly}
                onChange={(e) => setBookmarksOnly(e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              <span className="font-tabular whitespace-nowrap">
                Saved ({bookmarks.length})
              </span>
            </label>

            {/* Connected Grid / Table View Switcher */}
            <div
              role="group"
              aria-label="Layout view"
              className="inline-flex shrink-0 items-center rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] p-1"
            >
              <button
                type="button"
                id="view-mode-grid"
                aria-label="Grid cards view"
                aria-pressed={viewMode === "GRID"}
                onClick={() => setViewMode("GRID")}
                title="Grid view"
                className={`press-tactile relative flex h-8 w-9 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 ${
                  viewMode === "GRID"
                    ? "text-[#07090D]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                }`}
              >
                {viewMode === "GRID" && (
                  <motion.span
                    layoutId="hackathon-view-pill"
                    transition={
                      prefersReducedMotion ? { duration: 0.1 } : SPRING_UI
                    }
                    className="absolute inset-0 rounded-full bg-[var(--ink-primary)]"
                  />
                )}
                <LayoutGrid
                  className="relative z-10 h-4 w-4"
                  strokeWidth={1.7}
                />
              </button>
              <button
                type="button"
                id="view-mode-table"
                aria-label="Compact table view"
                aria-pressed={viewMode === "TABLE"}
                onClick={() => setViewMode("TABLE")}
                title="Table view"
                className={`press-tactile relative flex h-8 w-9 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 ${
                  viewMode === "TABLE"
                    ? "text-[#07090D]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                }`}
              >
                {viewMode === "TABLE" && (
                  <motion.span
                    layoutId="hackathon-view-pill"
                    transition={
                      prefersReducedMotion ? { duration: 0.1 } : SPRING_UI
                    }
                    className="absolute inset-0 rounded-full bg-[var(--ink-primary)]"
                  />
                )}
                <TableIcon
                  className="relative z-10 h-4 w-4"
                  strokeWidth={1.7}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count + Reset */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[14px] text-[var(--ink-muted)]">
        <p className="font-tabular">
          Showing{" "}
          <strong className="font-semibold text-[var(--ink-primary)]">
            {filteredHackathons.length}
          </strong>{" "}
          of {hackathons.length} hackathons
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex cursor-pointer items-center gap-1.5 text-[14px] font-medium text-[var(--ink-primary)] underline decoration-white/30 underline-offset-4 transition-colors duration-150 hover:text-[#FF7A63]"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Empty State, Grid View, or Compact Table View */}
      {filteredHackathons.length === 0 ? (
        <div className="surface-slab mt-6 p-10 text-center sm:p-16">
          <Radar
            className="mx-auto h-7 w-7 text-[var(--accent)]"
            strokeWidth={1.6}
          />
          <h2 className="type-heading mt-4 text-[var(--ink-primary)]">
            No hackathons match your filters
          </h2>
          <p className="mx-auto mt-3 max-w-[48ch] text-[16px] leading-[1.6] text-[var(--ink-muted)]">
            Clear your current filters to view all active events, or submit an X
            announcement or registration link directly into our verification
            pipeline.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-5">
            <button
              type="button"
              onClick={() => setSubmitModalOpen(true)}
              className="press-tactile inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--accent)] px-6 text-[14px] font-semibold text-[#07090D] hover:bg-[var(--accent-hover)]"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              <span>Submit X or link</span>
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="cursor-pointer text-[14px] font-medium text-[var(--ink-primary)] underline decoration-white/30 underline-offset-4 transition-colors duration-150 hover:text-[#FF7A63]"
            >
              Reset filters
            </button>
          </div>
        </div>
      ) : viewMode === "GRID" ? (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredHackathons.map((hack) => {
            const isBookmarked = bookmarks.includes(hack.id);
            return (
              <article
                key={hack.id}
                className="surface-slab surface-slab-interactive flex min-w-0 flex-col justify-between p-6 sm:p-7"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[14px]">
                      <SourceBadges sources={hack.sources} />
                      <span aria-hidden="true" className="text-white/25">
                        ·
                      </span>
                      <span className="text-[var(--ink-muted)]">
                        {formatFormatLabel(hack.format)}
                      </span>
                    </div>
                    <OxakalabsStatusBadge status={hack.oxakalabs_status} />
                  </div>

                  {hack.image_url && (
                    <div className="mt-4 overflow-hidden rounded-xl bg-[var(--bg-canvas)] ring-1 ring-inset ring-white/[0.08]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={hack.image_url}
                        alt={hack.title}
                        className="h-44 w-full object-cover"
                      />
                    </div>
                  )}

                  <h2 className="type-heading mt-4 text-[var(--ink-primary)]">
                    {hack.title}
                  </h2>

                  <p className="mt-2 text-[14px] text-[var(--ink-muted)]">
                    <span className="font-medium text-[var(--ink-primary)]">
                      {hack.organizer}
                    </span>{" "}
                    · {hack.location}
                  </p>

                  <p className="mt-3 line-clamp-2 text-[16px] leading-[1.6] text-[var(--ink-muted)]">
                    {hack.summary}
                  </p>

                  {hack.related_links && hack.related_links.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-4">
                      {hack.related_links.slice(0, 3).map((lnk, i) => (
                        <a
                          key={i}
                          href={lnk.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[14px] font-medium underline underline-offset-4 transition-opacity duration-150 hover:opacity-80"
                          style={{
                            color: hack.design?.accent_color || "#FF7A63",
                          }}
                        >
                          <span>{lnk.label}</span>
                          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                        </a>
                      ))}
                    </div>
                  )}

                  {hack.themes.length > 0 && (
                    <p className="mt-4 text-[14px] text-[var(--ink-muted)]">
                      {hack.themes.join(" · ")}
                    </p>
                  )}
                </div>

                <div className="mt-6 border-t border-[var(--hairline)] pt-5">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[14px] text-[var(--ink-muted)]">
                        Prize pool
                      </div>
                      <div className="font-tabular mt-0.5 text-[16px] font-semibold text-[#34D399]">
                        {hack.prize_display}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-[14px] text-[var(--ink-muted)]">
                        Submission deadline
                      </div>
                      <div className="mt-0.5">
                        <CountdownTimer deadlineAt={hack.deadline_at} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-4">
                      <a
                        href={hack.primary_url}
                        target="_blank"
                        rel="noreferrer"
                        className="press-tactile inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--ink-primary)] px-5 text-[14px] font-semibold whitespace-nowrap text-[#07090D] hover:bg-[var(--accent)]"
                      >
                        <span>Apply</span>
                        <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                      </a>

                      {hack.source_tweet_url && (
                        <a
                          href={hack.source_tweet_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[14px] font-medium text-[#FF7A63] underline decoration-[#FF7A63]/40 underline-offset-4 transition-colors duration-150 hover:text-[var(--ink-primary)]"
                        >
                          <span>View X post</span>
                          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadIcs(hack)}
                        title="Add deadline to calendar (.ics)"
                        className="press-tactile inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-recessed)] px-3 text-[13px] font-medium text-[var(--ink-primary)] hover:border-white/30"
                      >
                        <Calendar
                          className="h-3.5 w-3.5 text-[var(--accent)]"
                          strokeWidth={1.7}
                        />
                        <span className="font-tabular">.ics</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBookmark(hack.id)}
                        aria-label={
                          isBookmarked
                            ? `Remove ${hack.title} from bookmarks`
                            : `Bookmark ${hack.title}`
                        }
                        aria-pressed={isBookmarked}
                        title={
                          isBookmarked ? "Bookmarked" : "Bookmark hackathon"
                        }
                        className={`press-tactile flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border ${
                          isBookmarked
                            ? "border-[var(--accent)] bg-[var(--accent)] text-[#07090D]"
                            : "border-[var(--hairline-strong)] bg-[var(--bg-recessed)] text-[var(--ink-muted)] hover:border-white/30 hover:text-[var(--ink-primary)]"
                        }`}
                      >
                        <Bookmark
                          className="h-4 w-4"
                          strokeWidth={1.7}
                          fill={isBookmarked ? "currentColor" : "none"}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Compact Responsive Data Table View */
        <div className="surface-slab mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-[14px]">
              <thead>
                <tr className="border-b border-[var(--hairline)] bg-[var(--bg-recessed)]/70 text-[13px] font-medium text-[var(--ink-muted)]">
                  <th className="px-5 py-3.5 font-medium">Sources</th>
                  <th className="px-5 py-3.5 font-medium">Hackathon</th>
                  <th className="px-5 py-3.5 font-medium">Format</th>
                  <th className="px-5 py-3.5 font-medium">Prize pool</th>
                  <th className="px-5 py-3.5 font-medium">Deadline</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hairline)]">
                {filteredHackathons.map((hack) => {
                  const isBookmarked = bookmarks.includes(hack.id);
                  return (
                    <tr
                      key={hack.id}
                      className="transition-colors duration-150 hover:bg-white/[0.025]"
                    >
                      <td className="px-5 py-4 align-middle">
                        <SourceBadges sources={hack.sources} />
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <div className="font-medium text-[var(--ink-primary)]">
                          {hack.title}
                        </div>
                        <div className="mt-0.5 text-[13px] text-[var(--ink-muted)]">
                          {hack.organizer} · {hack.location}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-middle text-[13px] text-[var(--ink-muted)]">
                        {formatFormatLabel(hack.format)}
                      </td>
                      <td className="font-tabular px-5 py-4 align-middle text-[14px] font-semibold whitespace-nowrap text-[#34D399]">
                        {hack.prize_display}
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <CountdownTimer deadlineAt={hack.deadline_at} compact />
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <OxakalabsStatusBadge
                          status={hack.oxakalabs_status}
                          variant="table"
                        />
                      </td>
                      <td className="px-5 py-4 text-right align-middle">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleBookmark(hack.id)}
                            aria-label={
                              isBookmarked
                                ? `Remove ${hack.title} from bookmarks`
                                : `Bookmark ${hack.title}`
                            }
                            aria-pressed={isBookmarked}
                            className={`press-tactile flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border ${
                              isBookmarked
                                ? "border-[var(--accent)] bg-[var(--accent)] text-[#07090D]"
                                : "border-[var(--hairline-strong)] bg-[var(--bg-recessed)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                            }`}
                          >
                            <Bookmark
                              className="h-3.5 w-3.5"
                              strokeWidth={1.7}
                              fill={isBookmarked ? "currentColor" : "none"}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadIcs(hack)}
                            className="press-tactile font-tabular inline-flex h-8 cursor-pointer items-center rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-recessed)] px-2.5 text-[13px] text-[var(--ink-primary)]"
                          >
                            .ics
                          </button>
                          <a
                            href={hack.primary_url}
                            target="_blank"
                            rel="noreferrer"
                            className="press-tactile inline-flex h-8 items-center gap-1 rounded-full bg-[var(--accent)] px-3.5 text-[13px] font-semibold whitespace-nowrap text-[#07090D] hover:bg-[var(--accent-hover)]"
                          >
                            <span>Apply</span>
                            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Community Submission Modal */}
      <AnimatePresence>
        {submitModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setSubmitModalOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="submit-hackathon-modal-title"
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.96, y: 10 }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, scale: 1, y: 0 }
              }
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.96, y: 8 }
              }
              transition={
                prefersReducedMotion ? { duration: 0.14 } : SPRING_SHEET
              }
              className="glass-bar w-full max-w-lg overflow-hidden rounded-2xl text-[var(--ink-primary)] shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-6 py-5">
                <div>
                  <h2
                    id="submit-hackathon-modal-title"
                    className="font-display text-[20px] font-semibold text-[var(--ink-primary)]"
                  >
                    Submit a hackathon or X signal
                  </h2>
                  <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
                    Parsed and verified through Gemini Flash and heuristic
                    extraction.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close modal"
                  onClick={() => setSubmitModalOpen(false)}
                  className="press-tactile flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-white/[0.04] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                >
                  <X className="h-4 w-4" strokeWidth={1.7} />
                </button>
              </div>

              <div className="p-6">
                {submittedCandidate ? (
                  <div className="space-y-3 border-l-2 border-[#10B981] pl-5">
                    <div className="flex items-center gap-2 text-[14px] font-medium text-[#34D399]">
                      <CheckCircle2
                        className="h-4 w-4 shrink-0"
                        strokeWidth={1.8}
                      />
                      <span className="font-tabular">
                        Verified (confidence{" "}
                        {Math.round(submittedCandidate.confidence_score * 100)}
                        %)
                      </span>
                    </div>
                    <h3 className="type-subhead text-[var(--ink-primary)]">
                      {submittedCandidate.title}
                    </h3>
                    <p className="text-[14px] text-[var(--ink-muted)]">
                      {submittedCandidate.organizer} ·{" "}
                      <span className="font-tabular font-semibold text-[#34D399]">
                        {submittedCandidate.prize_display}
                      </span>
                    </p>
                    <p className="text-[16px] leading-[1.6] text-[var(--ink-muted)]">
                      {submittedCandidate.is_published
                        ? "Published straight to the live radar."
                        : "Submitted to the editorial review queue. Once approved, it will go live on the radar."}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmittedCandidate(null);
                        setSubmitUrl("");
                        setSubmitContext("");
                        setSubmitModalOpen(false);
                      }}
                      className="press-tactile mt-3 inline-flex h-11 cursor-pointer items-center rounded-full bg-[var(--accent)] px-6 text-[14px] font-semibold text-[#07090D] hover:bg-[var(--accent-hover)]"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitUrl} className="space-y-5">
                    <p className="text-[14px] leading-relaxed text-[var(--ink-muted)]">
                      Paste an X announcement link or a Devpost, Luma, or
                      DoraHacks URL. The pipeline resolves the post, filters
                      recaps, and extracts structured hackathon fields.
                    </p>

                    {submitError && (
                      <div
                        role="alert"
                        className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-4 py-3 text-[14px] text-[#FF8A7A]"
                      >
                        {submitError}
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="submit-hackathon-url-input"
                        className="block text-[14px] font-medium text-[var(--ink-primary)]"
                      >
                        Hackathon or X status URL{" "}
                        <span className="text-[var(--accent)]">*</span>
                      </label>
                      <input
                        type="url"
                        required
                        id="submit-hackathon-url-input"
                        value={submitUrl}
                        onChange={(e) => setSubmitUrl(e.target.value)}
                        placeholder="https://x.com/GoogleAI/status/189001020304050607"
                        className="mt-2 h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="submit-hackathon-context-input"
                        className="block text-[14px] font-medium text-[var(--ink-primary)]"
                      >
                        Announcement text or deadline notes (optional)
                      </label>
                      <textarea
                        rows={3}
                        id="submit-hackathon-context-input"
                        value={submitContext}
                        onChange={(e) => setSubmitContext(e.target.value)}
                        placeholder="Paste tweet copy, prize pool, or registration deadline details..."
                        className="mt-2 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-4 py-3 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      id="submit-hackathon-confirm-btn"
                      disabled={submitting}
                      className="press-tactile inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-[var(--accent)] px-5 text-[14px] font-semibold text-[#07090D] hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting
                        ? "Extracting and verifying..."
                        : "Verify and submit signal"}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
