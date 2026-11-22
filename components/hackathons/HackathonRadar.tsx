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

const SOURCE_CHIPS: { key: HackathonProvider | "all"; label: string }[] = [
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

const THEME_CHIPS = [
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
  const [selectedSource, setSelectedSource] = useState<HackathonProvider | "all">("all");
  const [selectedFormat, setSelectedFormat] = useState<HackathonFormat | "ALL">("ALL");
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

  // Hydration-safe current timestamp (never evaluated during SSR / first hydration pass)
  const [nowMs, setNowMs] = useState<number | null>(null);

  // Community Submission Modal State
  const [submitModalOpen, setSubmitModalOpen] = useState(initialOpenSubmit);
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitContext, setSubmitContext] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedCandidate, setSubmittedCandidate] = useState<Hackathon | null>(null);

  useEffect(() => {
    const syncNow = () => setNowMs(Date.now());
    const kickoff = window.setTimeout(syncNow, 0);
    const interval = window.setInterval(syncNow, 60_000);
    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(interval);
    };
  }, []);

  // Escape key dismissal + scroll lock when modal is open
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
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
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
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
      return new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime();
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

  // Hydration-safe top telemetry figures
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

  const syncMinutesAgo = useMemo(() => {
    if (nowMs === null) return null;
    const syncMs = new Date(lastSyncAt).getTime();
    if (Number.isNaN(syncMs)) return null;
    return Math.max(1, Math.round((nowMs - syncMs) / 60_000));
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
          const refreshed = await fetch("/api/hackathons").then((r) => r.json());
          if (Array.isArray(refreshed.hackathons)) {
            setHackathons(refreshed.hackathons);
          }
        }
      }
    } catch {
      setSubmitError("Network error communicating with the verification pipeline.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-w-0">
      {/* Compact Metric Pills & Primary Submit Trigger */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#111114] px-3.5 py-2 text-xs">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-[#10B981]"
            />
            <span className="font-mono-telemetry font-semibold text-[#F4F3EF]">
              {hackathons.length}
            </span>
            <span className="text-[#A1A1AA]">active events</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#111114] px-3.5 py-2 text-xs">
            <span className="font-mono-telemetry font-semibold text-[#34D399]">
              ${totalPrizeUsd.toLocaleString("en-US")}
            </span>
            <span className="text-[#A1A1AA]">in prizes</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#FF3B1F]/25 bg-[#FF3B1F]/[0.08] px-3.5 py-2 text-xs">
            <span className="font-mono-telemetry font-semibold text-[#FF8A7A]">
              {closingUnder72h === null ? "--" : closingUnder72h}
            </span>
            <span className="text-[#D4D4D8]">closing &lt;72h</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#111114] px-3.5 py-2 text-xs">
            <span className="font-mono-telemetry font-semibold text-[#F4F3EF]">
              {xSignalCount}
            </span>
            <span className="text-[#A1A1AA]">X signals</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-transparent px-3 py-2 text-xs text-[#8B8B94]">
            <span>Synced</span>
            <span className="font-mono-telemetry text-[#A1A1AA]">
              {syncMinutesAgo === null ? "recently" : `${syncMinutesAgo}m ago`}
            </span>
          </div>
        </div>

        <button
          type="button"
          id="open-submit-hackathon-modal"
          onClick={() => setSubmitModalOpen(true)}
          className="press-tactile inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 self-start rounded-full bg-[#FF3B1F] px-5 text-sm font-semibold whitespace-nowrap text-[#08080A] hover:bg-[#FF5238] sm:self-auto"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          <span>Submit X or link</span>
        </button>
      </div>

      {/* Floating Frosted Filter Toolbar */}
      <div className="glass-chrome mt-6 rounded-2xl p-4 sm:p-5 lg:sticky lg:top-[76px] lg:z-20">
        {/* Top Row: Search + Format + Sort + Saved + View Switcher */}
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
          {/* Instant Search Input */}
          <div className="relative min-w-0 flex-1">
            <label htmlFor="hackathon-search-input" className="sr-only">
              Search hackathons
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#8B8B94]"
              strokeWidth={1.6}
            />
            <input
              type="text"
              id="hackathon-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, sponsor (DeepMind, Anthropic, Vercel), stack, or theme..."
              className="h-10 w-full min-w-0 rounded-xl border border-white/[0.12] bg-[#0B0B0E]/85 pr-9 pl-10 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/25 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search query"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1 text-[#8B8B94] transition-colors hover:bg-white/[0.08] hover:text-[#F4F3EF]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.8} />
              </button>
            )}
          </div>

          {/* Right Control Cluster */}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {/* Format Segmented Control */}
            <div
              role="group"
              aria-label="Hackathon format"
              className="inline-flex max-w-full items-center overflow-x-auto rounded-full border border-white/[0.08] bg-[#0B0B0E]/90 p-1"
            >
              {FORMAT_OPTIONS.map((fmt) => {
                const active = selectedFormat === fmt.key;
                return (
                  <button
                    key={fmt.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedFormat(fmt.key)}
                    className={`press-tactile relative shrink-0 cursor-pointer rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                      active
                        ? "text-[#08080A]"
                        : "text-[#A1A1AA] hover:text-[#F4F3EF]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="hackathon-format-pill"
                        transition={prefersReducedMotion ? { duration: 0.1 } : SPRING_UI}
                        className="absolute inset-0 rounded-full bg-[#F4F3EF]"
                      />
                    )}
                    <span className="relative z-10">{fmt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sort Selector */}
            <div className="min-w-0">
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
                className="h-9 max-w-full cursor-pointer rounded-xl border border-white/[0.12] bg-[#111114] px-3 text-xs font-medium text-[#F4F3EF] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/25 focus:outline-none"
              >
                <option value="closing_soon">Sort: Closing soonest</option>
                <option value="prize_pool">Sort: Highest prize pool</option>
                <option value="newest">Sort: Newly discovered</option>
                <option value="oxakalabs">Sort: OXAKALABS picks</option>
              </select>
            </div>

            {/* Bookmarks Filter */}
            <button
              type="button"
              aria-pressed={bookmarksOnly}
              onClick={() => setBookmarksOnly((v) => !v)}
              className={`press-tactile inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium whitespace-nowrap ${
                bookmarksOnly
                  ? "border-[#FF3B1F]/40 bg-[#FF3B1F]/15 text-[#FF8A7A]"
                  : "border-white/[0.09] bg-[#111114] text-[#A1A1AA] hover:border-white/[0.18] hover:text-[#F4F3EF]"
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" strokeWidth={1.6} />
              <span>Saved</span>
              <span className="font-mono-telemetry text-[11px]">
                ({bookmarks.length})
              </span>
            </button>

            {/* View Switcher: Grid vs Table */}
            <div
              role="group"
              aria-label="Layout view"
              className="inline-flex shrink-0 items-center rounded-full border border-white/[0.08] bg-[#0B0B0E]/90 p-1"
            >
              <button
                type="button"
                id="view-mode-grid"
                aria-label="Grid cards view"
                aria-pressed={viewMode === "GRID"}
                onClick={() => setViewMode("GRID")}
                title="Grid view"
                className={`press-tactile relative flex h-7 w-8 cursor-pointer items-center justify-center rounded-full transition-colors ${
                  viewMode === "GRID"
                    ? "text-[#08080A]"
                    : "text-[#A1A1AA] hover:text-[#F4F3EF]"
                }`}
              >
                {viewMode === "GRID" && (
                  <motion.span
                    layoutId="hackathon-view-pill"
                    transition={prefersReducedMotion ? { duration: 0.1 } : SPRING_UI}
                    className="absolute inset-0 rounded-full bg-[#F4F3EF]"
                  />
                )}
                <LayoutGrid className="relative z-10 h-3.5 w-3.5" strokeWidth={1.7} />
              </button>
              <button
                type="button"
                id="view-mode-table"
                aria-label="Compact table view"
                aria-pressed={viewMode === "TABLE"}
                onClick={() => setViewMode("TABLE")}
                title="Table view"
                className={`press-tactile relative flex h-7 w-8 cursor-pointer items-center justify-center rounded-full transition-colors ${
                  viewMode === "TABLE"
                    ? "text-[#08080A]"
                    : "text-[#A1A1AA] hover:text-[#F4F3EF]"
                }`}
              >
                {viewMode === "TABLE" && (
                  <motion.span
                    layoutId="hackathon-view-pill"
                    transition={prefersReducedMotion ? { duration: 0.1 } : SPRING_UI}
                    className="absolute inset-0 rounded-full bg-[#F4F3EF]"
                  />
                )}
                <TableIcon className="relative z-10 h-3.5 w-3.5" strokeWidth={1.7} />
              </button>
            </div>
          </div>
        </div>

        {/* Source Filter Pill Rail (horizontally scrollable on mobile, wraps cleanly on desktop) */}
        <div className="mt-3.5 flex min-w-0 items-center gap-2 border-t border-white/[0.06] pt-3.5">
          <span className="shrink-0 text-xs font-medium text-[#8B8B94]">Sources</span>
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {SOURCE_CHIPS.map((src) => {
              const active = selectedSource === src.key;
              return (
                <button
                  key={src.key}
                  type="button"
                  id={`source-chip-${src.key}`}
                  aria-pressed={active}
                  onClick={() => setSelectedSource(src.key)}
                  className={`press-tactile shrink-0 cursor-pointer rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap ${
                    active
                      ? "border-[#F4F3EF] bg-[#F4F3EF] font-semibold text-[#08080A]"
                      : "border-white/[0.08] bg-[#111114]/80 text-[#A1A1AA] hover:border-white/[0.18] hover:text-[#F4F3EF]"
                  }`}
                >
                  {src.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme Filter Pill Rail */}
        <div className="mt-2.5 flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-xs font-medium text-[#8B8B94]">Themes</span>
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {THEME_CHIPS.map((theme) => {
              const active = selectedTheme === theme;
              const label = theme === "ALL" ? "All themes" : theme;
              return (
                <button
                  key={theme}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedTheme(theme)}
                  className={`press-tactile shrink-0 cursor-pointer rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap ${
                    active
                      ? "border-[#FF3B1F]/40 bg-[#FF3B1F]/15 text-[#FF8A7A]"
                      : "border-white/[0.07] bg-transparent text-[#8B8B94] hover:border-white/[0.15] hover:text-[#F4F3EF]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Count + Active Filter Reset */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-[#8B8B94]">
        <p>
          Showing{" "}
          <span className="font-mono-telemetry font-semibold text-[#F4F3EF]">
            {filteredHackathons.length}
          </span>{" "}
          of{" "}
          <span className="font-mono-telemetry text-[#A1A1AA]">
            {hackathons.length}
          </span>{" "}
          hackathons
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="press-tactile inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.09] bg-[#111114] px-3 py-1 text-xs font-medium text-[#D4D4D8] hover:border-white/[0.18] hover:text-[#F4F3EF]"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={1.7} />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Hackathon Listing: Empty State, Grid Cards, or Compact Table */}
      {filteredHackathons.length === 0 ? (
        <div className="surface-card mt-5 p-10 text-center sm:p-16">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FF3B1F]/25 bg-[#FF3B1F]/10 text-[#FF6B54]">
            <Radar className="h-6 w-6" strokeWidth={1.6} />
          </div>
          <h2 className="font-display mt-5 text-2xl font-semibold text-[#F4F3EF]">
            No hackathons match your filters
          </h2>
          <p className="mx-auto mt-2 max-w-[48ch] text-sm leading-relaxed text-[#A1A1AA]">
            Clear your current filters to view all active events, or submit an X (Twitter)
            announcement or registration link directly into the verification pipeline.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="press-tactile inline-flex h-10 cursor-pointer items-center rounded-full border border-white/[0.12] bg-[#18181D] px-5 text-sm font-medium text-[#F4F3EF] hover:border-white/[0.2] hover:bg-white/[0.08]"
            >
              Reset filters
            </button>
            <button
              type="button"
              onClick={() => setSubmitModalOpen(true)}
              className="press-tactile inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-[#FF3B1F] px-5 text-sm font-semibold text-[#08080A] hover:bg-[#FF5238]"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              <span>Submit X or link</span>
            </button>
          </div>
        </div>
      ) : viewMode === "GRID" ? (
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          {filteredHackathons.map((hack) => {
            const isBookmarked = bookmarks.includes(hack.id);
            return (
              <article
                key={hack.id}
                className="surface-card surface-card-interactive flex min-w-0 flex-col justify-between p-6 sm:p-7"
              >
                <div className="min-w-0">
                  {/* Top Row: Source Badges, Format Pill & OXAKALABS Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <SourceBadges sources={hack.sources} />
                      <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-[#18181D] px-2.5 py-0.5 text-xs font-medium text-[#A1A1AA]">
                        {formatFormatLabel(hack.format)}
                      </span>
                    </div>
                    <OxakalabsStatusBadge status={hack.oxakalabs_status} />
                  </div>

                  {hack.image_url && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0B0B0E]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={hack.image_url}
                        alt={hack.title}
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Title & Organizer */}
                  <h2 className="font-display mt-4 text-xl leading-snug font-semibold tracking-[-0.02em] text-[#F4F3EF] sm:text-2xl">
                    {hack.title}
                  </h2>
                  <p className="mt-1.5 text-sm text-[#8B8B94]">
                    <span className="font-medium text-[#D4D4D8]">{hack.organizer}</span>
                    <span className="mx-1.5 text-[#52525B]" aria-hidden="true">
                      /
                    </span>
                    <span>{hack.location}</span>
                  </p>

                  {/* Crisp Description */}
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#A1A1AA]">
                    {hack.summary}
                  </p>

                  {hack.related_links && hack.related_links.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {hack.related_links.slice(0, 3).map((lnk, i) => (
                        <a
                          key={i}
                          href={lnk.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2 hover:opacity-80"
                          style={{ color: hack.design?.accent_color || "#FF8A7A" }}
                        >
                          <span>{lnk.label}</span>
                          <ArrowUpRight className="h-3 w-3" strokeWidth={1.8} />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Theme Tags */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {hack.themes.map((theme) => (
                      <span
                        key={theme}
                        className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-xs font-medium text-[#A1A1AA]"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Metrics & Actions Footer */}
                <div className="mt-6 border-t border-white/[0.07] pt-5">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs text-[#8B8B94]">Prize pool</div>
                      <div className="font-mono-telemetry mt-0.5 text-sm font-semibold text-[#34D399]">
                        {hack.prize_display}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-[#8B8B94]">Submission deadline</div>
                      <div className="mt-0.5">
                        <CountdownTimer deadlineAt={hack.deadline_at} />
                      </div>
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={hack.primary_url}
                        target="_blank"
                        rel="noreferrer"
                        className="press-tactile inline-flex h-9 items-center gap-1.5 rounded-full bg-[#F4F3EF] px-4 text-xs font-semibold whitespace-nowrap text-[#08080A] hover:bg-[#FF3B1F] hover:text-[#08080A]"
                      >
                        <span>Apply</span>
                        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                      </a>

                      {hack.source_tweet_url && (
                        <a
                          href={hack.source_tweet_url}
                          target="_blank"
                          rel="noreferrer"
                          className="press-tactile inline-flex h-9 items-center gap-1.5 rounded-full border border-[#FF3B1F]/35 bg-[#FF3B1F]/12 px-3.5 text-xs font-medium whitespace-nowrap text-[#FF8A7A] hover:bg-[#FF3B1F] hover:text-[#08080A]"
                        >
                          <span>View X post</span>
                          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDownloadIcs(hack)}
                        title="Add deadline to calendar (.ics)"
                        className="press-tactile inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.09] bg-[#18181D] px-3 text-xs font-medium text-[#D4D4D8] hover:border-white/[0.18] hover:text-[#F4F3EF]"
                      >
                        <Calendar
                          className="h-3.5 w-3.5 text-[#FF6B54]"
                          strokeWidth={1.6}
                        />
                        <span className="font-mono-telemetry">.ics</span>
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
                        title={isBookmarked ? "Bookmarked" : "Bookmark hackathon"}
                        className={`press-tactile flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border ${
                          isBookmarked
                            ? "border-[#FF3B1F] bg-[#FF3B1F] text-[#08080A]"
                            : "border-white/[0.09] bg-[#18181D] text-[#A1A1AA] hover:border-white/[0.18] hover:text-[#F4F3EF]"
                        }`}
                      >
                        <Bookmark
                          className="h-3.5 w-3.5"
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
        /* Compact Responsive Table View */
        <div className="surface-card mt-5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#16161A]/60 text-xs font-medium text-[#8B8B94]">
                  <th className="px-5 py-3.5 font-medium">Sources</th>
                  <th className="px-5 py-3.5 font-medium">Hackathon</th>
                  <th className="px-5 py-3.5 font-medium">Format</th>
                  <th className="px-5 py-3.5 font-medium">Prize pool</th>
                  <th className="px-5 py-3.5 font-medium">Deadline</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredHackathons.map((hack) => {
                  const isBookmarked = bookmarks.includes(hack.id);
                  return (
                    <tr
                      key={hack.id}
                      className="transition-colors hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-4 align-middle">
                        <SourceBadges sources={hack.sources} />
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <div className="font-medium text-[#F4F3EF]">{hack.title}</div>
                        <div className="mt-0.5 text-xs text-[#8B8B94]">
                          {hack.organizer} · {hack.location}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <span className="inline-flex rounded-full border border-white/[0.08] bg-[#18181D] px-2.5 py-0.5 text-xs text-[#A1A1AA]">
                          {formatFormatLabel(hack.format)}
                        </span>
                      </td>
                      <td className="font-mono-telemetry px-5 py-4 align-middle text-xs font-semibold whitespace-nowrap text-[#34D399]">
                        {hack.prize_display}
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <CountdownTimer deadlineAt={hack.deadline_at} compact />
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <OxakalabsStatusBadge status={hack.oxakalabs_status} />
                      </td>
                      <td className="px-5 py-4 text-right align-middle">
                        <div className="inline-flex items-center gap-1.5">
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
                                ? "border-[#FF3B1F] bg-[#FF3B1F] text-[#08080A]"
                                : "border-white/[0.09] bg-[#18181D] text-[#A1A1AA] hover:text-[#F4F3EF]"
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
                            className="press-tactile font-mono-telemetry inline-flex h-8 cursor-pointer items-center rounded-full border border-white/[0.09] bg-[#18181D] px-2.5 text-xs text-[#D4D4D8] hover:text-[#F4F3EF]"
                          >
                            .ics
                          </button>
                          <a
                            href={hack.primary_url}
                            target="_blank"
                            rel="noreferrer"
                            className="press-tactile inline-flex h-8 items-center gap-1 rounded-full bg-[#FF3B1F] px-3 text-xs font-semibold whitespace-nowrap text-[#08080A] hover:bg-[#FF5238]"
                          >
                            <span>Apply</span>
                            <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
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
              transition={prefersReducedMotion ? { duration: 0.14 } : SPRING_SHEET}
              className="glass-chrome w-full max-w-lg overflow-hidden rounded-2xl text-[#F4F3EF]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-6 py-5">
                <div>
                  <h2
                    id="submit-hackathon-modal-title"
                    className="font-display text-xl font-semibold text-[#F4F3EF]"
                  >
                    Submit a hackathon or X signal
                  </h2>
                  <p className="mt-1 text-xs text-[#A1A1AA]">
                    Parsed and verified through Gemini Flash and heuristic extraction.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close modal"
                  onClick={() => setSubmitModalOpen(false)}
                  className="press-tactile flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.05] text-[#A1A1AA] hover:bg-white/[0.1] hover:text-[#F4F3EF]"
                >
                  <X className="h-4 w-4" strokeWidth={1.7} />
                </button>
              </div>

              <div className="p-6">
                {submittedCandidate ? (
                  <div className="rounded-2xl border border-[#10B981]/30 bg-[#10B981]/[0.08] p-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-[#34D399]">
                      <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                      <span>
                        Verified (confidence{" "}
                        <span className="font-mono-telemetry">
                          {Math.round(submittedCandidate.confidence_score * 100)}%
                        </span>
                        )
                      </span>
                    </div>
                    <h3 className="font-display mt-3 text-lg font-semibold text-[#F4F3EF]">
                      {submittedCandidate.title}
                    </h3>
                    <p className="mt-1 text-sm text-[#A1A1AA]">
                      {submittedCandidate.organizer} ·{" "}
                      <span className="font-mono-telemetry text-[#34D399]">
                        {submittedCandidate.prize_display}
                      </span>
                    </p>
                    <p className="mt-2.5 text-sm leading-relaxed text-[#D4D4D8]">
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
                      className="press-tactile mt-5 inline-flex h-10 cursor-pointer items-center rounded-full bg-[#FF3B1F] px-5 text-sm font-semibold text-[#08080A] hover:bg-[#FF5238]"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitUrl} className="space-y-4">
                    <p className="text-sm leading-relaxed text-[#A1A1AA]">
                      Paste an X (Twitter) announcement link or a Devpost, Luma, or
                      DoraHacks URL. The pipeline resolves the post, filters
                      retrospective chatter, and extracts structured hackathon fields.
                    </p>

                    {submitError && (
                      <div
                        role="alert"
                        className="rounded-xl border border-[#FF3B1F]/35 bg-[#FF3B1F]/12 px-4 py-3 text-sm text-[#FF8A7A]"
                      >
                        {submitError}
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="submit-hackathon-url-input"
                        className="block text-sm font-medium text-[#D4D4D8]"
                      >
                        Hackathon or X status URL <span className="text-[#FF6B54]">*</span>
                      </label>
                      <input
                        type="url"
                        required
                        id="submit-hackathon-url-input"
                        value={submitUrl}
                        onChange={(e) => setSubmitUrl(e.target.value)}
                        placeholder="https://x.com/GoogleAI/status/189001020304050607"
                        className="mt-2 h-11 w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E]/90 px-4 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/25 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="submit-hackathon-context-input"
                        className="block text-sm font-medium text-[#D4D4D8]"
                      >
                        Announcement text or deadline notes{" "}
                        <span className="font-normal text-[#8B8B94]">(optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        id="submit-hackathon-context-input"
                        value={submitContext}
                        onChange={(e) => setSubmitContext(e.target.value)}
                        placeholder="Paste tweet copy, prize pool, or registration deadline details..."
                        className="mt-2 w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E]/90 px-4 py-3 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/25 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      id="submit-hackathon-confirm-btn"
                      disabled={submitting}
                      className="press-tactile inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-[#FF3B1F] px-5 text-sm font-semibold text-[#08080A] hover:bg-[#FF5238] disabled:cursor-not-allowed disabled:opacity-60"
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
