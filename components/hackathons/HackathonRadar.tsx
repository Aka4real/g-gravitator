"use client";

import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { CrosshairCell } from "@/components/kinetic/CrosshairCell";
import { CountdownTimer } from "@/components/hackathons/CountdownTimer";
import {
  SourceBadges,
  OxakalabsStatusBadge,
} from "@/components/hackathons/SourceBadges";
import { generateHackathonIcs } from "@/lib/ics";
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
  { key: "all", label: "All Sources" },
  { key: "twitter", label: "X (Twitter)" },
  { key: "devpost", label: "Devpost" },
  { key: "dorahacks", label: "DoraHacks" },
  { key: "lablab", label: "Lablab.ai" },
  { key: "luma", label: "Luma / CV" },
  { key: "mlh", label: "MLH" },
  { key: "ethglobal", label: "ETHGlobal" },
  { key: "kaggle", label: "Kaggle" },
  { key: "devfolio", label: "Devfolio" },
  { key: "unstop", label: "Unstop" },
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

export function HackathonRadar({
  initialHackathons,
  lastSyncAt,
  initialQuery = "",
  initialOpenSubmit = false,
}: HackathonRadarProps) {
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
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // Community Submission Modal State
  const [submitModalOpen, setSubmitModalOpen] = useState(initialOpenSubmit);
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitContext, setSubmitContext] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedCandidate, setSubmittedCandidate] = useState<Hackathon | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gg_hackathon_bookmarks");
      if (saved) setBookmarks(JSON.parse(saved));
    } catch {
      // Ignore localStorage error
    }
  }, []);

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem("gg_hackathon_bookmarks", JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

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

  // Top Telemetry Metrics
  const totalPrizeUsd = hackathons.reduce(
    (acc, h) => acc + (h.prize_pool_usd ?? 0),
    0
  );
  const closingUnder72h = hackathons.filter((h) => {
    const diff = new Date(h.deadline_at).getTime() - Date.now();
    return diff > 0 && diff < 72 * 3600 * 1000;
  }).length;
  const xSignalCount = hackathons.filter((h) =>
    h.sources.some((s) => s.provider === "twitter")
  ).length;

  const syncMinutesAgo = Math.max(
    1,
    Math.round((Date.now() - new Date(lastSyncAt).getTime()) / 60000)
  );

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
        setSubmitError(data.error || "Verification gate rejected URL.");
      } else {
        const cand = data.candidate as Hackathon;
        setSubmittedCandidate(cand);
        if (cand.is_published) {
          // Refresh local list
          const refreshed = await fetch("/api/hackathons").then((r) => r.json());
          if (Array.isArray(refreshed.hackathons)) {
            setHackathons(refreshed.hackathons);
          }
        }
      }
    } catch {
      setSubmitError("Network error communicating with verification pipeline.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* =====================================================================
          1. TOP TELEMETRY STRIP (AEROSPACE MISSION CONTROL READOUT)
         ===================================================================== */}
      <div className="grid grid-cols-2 divide-x divide-y divide-[#27272A] border-b border-[#27272A] bg-[#111114] sm:grid-cols-5 sm:divide-y-0">
        <div className="px-5 py-4">
          <div className="font-mono-telemetry text-[10px] text-[#71717A]">
            TOTAL ACTIVE
          </div>
          <div className="font-display mt-1 text-2xl font-extrabold text-[#F3F2EE]">
            {hackathons.length} EVENTS
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="font-mono-telemetry text-[10px] text-[#71717A]">
            COMBINED PRIZE POOL
          </div>
          <div className="font-display mt-1 text-2xl font-extrabold text-[#10B981]">
            ${totalPrizeUsd.toLocaleString("en-US")}
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="font-mono-telemetry text-[10px] text-[#71717A]">
            CLOSING &lt; 72H
          </div>
          <div className="font-display mt-1 text-2xl font-extrabold text-[#FF3B1F]">
            {closingUnder72h} URGENT
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="font-mono-telemetry text-[10px] text-[#71717A]">
            X / TWITTER SIGNALS
          </div>
          <div className="font-display mt-1 text-2xl font-extrabold text-[#F3F2EE]">
            {xSignalCount} VERIFIED
          </div>
        </div>
        <div className="col-span-2 flex items-center justify-between px-5 py-4 sm:col-span-1">
          <div>
            <div className="font-mono-telemetry text-[10px] text-[#71717A]">
              LAST SYNC
            </div>
            <div className="font-mono-telemetry mt-1 text-xs font-bold text-[#10B981]">
              {syncMinutesAgo}M AGO // NOMINAL
            </div>
          </div>
          <button
            type="button"
            id="open-submit-hackathon-modal"
            onClick={() => setSubmitModalOpen(true)}
            className="font-mono-telemetry inline-flex items-center gap-1.5 bg-[#FF3B1F] px-3 py-2 text-[10px] font-bold text-[#09090B] hover:bg-[#F3F2EE]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            <span>SUBMIT X / LINK</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. STICKY PRECISION FILTER BAR
         ===================================================================== */}
      <div className="sticky top-16 z-30 border-b border-[#27272A] bg-[#09090B]/95 px-6 py-4 backdrop-blur-md lg:px-10">
        {/* Top Row: Search + Format + Sort + View Switcher */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Instant Search Input */}
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#FF3B1F]"
              strokeWidth={1.5}
            />
            <input
              type="text"
              id="hackathon-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, sponsor (DeepMind, Anthropic, Vercel), stack, or theme..."
              className="w-full border border-[#27272A] bg-[#111114] py-2.5 pr-4 pl-10 text-xs text-[#F3F2EE] placeholder-[#71717A] focus:border-[#FF3B1F] focus:outline-none"
            />
          </div>

          {/* Format Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex border border-[#27272A] bg-[#111114] p-0.5">
              {(["ALL", "ONLINE", "IN_PERSON", "HYBRID"] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setSelectedFormat(fmt)}
                  className={`font-mono-telemetry px-2.5 py-1.5 text-[10px] transition-colors ${
                    selectedFormat === fmt
                      ? "bg-[#FF3B1F] font-bold text-[#09090B]"
                      : "text-[#A1A1AA] hover:text-[#F3F2EE]"
                  }`}
                >
                  {fmt === "IN_PERSON" ? "IN-PERSON" : fmt}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
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
              className="font-mono-telemetry border border-[#27272A] bg-[#111114] px-3 py-2 text-[10px] text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
            >
              <option value="closing_soon">SORT: CLOSING SOONEST</option>
              <option value="prize_pool">SORT: HIGHEST PRIZE POOL</option>
              <option value="newest">SORT: NEWLY DISCOVERED</option>
              <option value="oxakalabs">SORT: OXAKALABS PICKS</option>
            </select>

            {/* Bookmarks Filter */}
            <button
              type="button"
              onClick={() => setBookmarksOnly((v) => !v)}
              className={`font-mono-telemetry inline-flex items-center gap-1 border px-2.5 py-2 text-[10px] transition-colors ${
                bookmarksOnly
                  ? "border-[#FF3B1F] bg-[#FF3B1F]/20 text-[#FF3B1F]"
                  : "border-[#27272A] bg-[#111114] text-[#A1A1AA] hover:text-[#F3F2EE]"
              }`}
            >
              <Bookmark className="h-3 w-3" strokeWidth={1.5} />
              <span>SAVED ({bookmarks.length})</span>
            </button>

            {/* View Switcher: Grid Cards vs Compact Telemetry Table */}
            <div className="inline-flex border border-[#27272A] bg-[#111114] p-0.5">
              <button
                type="button"
                id="view-mode-grid"
                onClick={() => setViewMode("GRID")}
                title="Grid Cards View"
                className={`p-1.5 ${
                  viewMode === "GRID"
                    ? "bg-[#FF3B1F] text-[#09090B]"
                    : "text-[#A1A1AA] hover:text-[#F3F2EE]"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                id="view-mode-table"
                onClick={() => setViewMode("TABLE")}
                title="Compact Telemetry Table View"
                className={`p-1.5 ${
                  viewMode === "TABLE"
                    ? "bg-[#FF3B1F] text-[#09090B]"
                    : "text-[#A1A1AA] hover:text-[#F3F2EE]"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Middle Row: Source Filter Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="font-mono-telemetry mr-1 text-[10px] text-[#71717A]">
            SOURCE:
          </span>
          {SOURCE_CHIPS.map((src) => {
            const active = selectedSource === src.key;
            return (
              <button
                key={src.key}
                type="button"
                id={`source-chip-${src.key}`}
                onClick={() => setSelectedSource(src.key)}
                className={`font-mono-telemetry border px-2.5 py-1 text-[10px] transition-colors ${
                  active
                    ? "border-[#FF3B1F] bg-[#FF3B1F] font-bold text-[#09090B]"
                    : "border-[#27272A] bg-[#111114] text-[#A1A1AA] hover:border-[#3F3F46] hover:text-[#F3F2EE]"
                }`}
              >
                {src.label}
              </button>
            );
          })}
        </div>

        {/* Bottom Row: Theme Tags */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="font-mono-telemetry mr-1 text-[10px] text-[#71717A]">
            THEME:
          </span>
          {THEME_CHIPS.map((theme) => {
            const active = selectedTheme === theme;
            return (
              <button
                key={theme}
                type="button"
                onClick={() => setSelectedTheme(theme)}
                className={`font-mono-telemetry border px-2 py-0.5 text-[10px] transition-colors ${
                  active
                    ? "border-[#F3F2EE] bg-[#F3F2EE] font-bold text-[#09090B]"
                    : "border-[#27272A] bg-[#09090B] text-[#71717A] hover:text-[#F3F2EE]"
                }`}
              >
                {theme}
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          3. HACKATHON LISTING (GRID CARDS OR COMPACT TELEMETRY TABLE)
         ===================================================================== */}
      {filteredHackathons.length === 0 ? (
        <div className="p-16 text-center">
          <Radar className="mx-auto h-8 w-8 text-[#FF3B1F]" strokeWidth={1.5} />
          <h3 className="font-display mt-4 text-xl font-bold text-[#F3F2EE]">
            ZERO HACKATHON SIGNALS MATCH CURRENT FILTER
          </h3>
          <p className="mt-2 text-xs text-[#A1A1AA]">
            Clear your active filters or submit an X (Twitter) post or Devpost/Luma link
            into the verification pipeline.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedSource("all");
                setSelectedFormat("ALL");
                setSelectedTheme("ALL");
                setBookmarksOnly(false);
              }}
              className="font-mono-telemetry border border-[#27272A] bg-[#111114] px-4 py-2 text-xs text-[#F3F2EE]"
            >
              RESET FILTERS
            </button>
            <button
              type="button"
              onClick={() => setSubmitModalOpen(true)}
              className="font-mono-telemetry bg-[#FF3B1F] px-4 py-2 text-xs font-bold text-[#09090B]"
            >
              + SUBMIT HACKATHON / X LINK
            </button>
          </div>
        </div>
      ) : viewMode === "GRID" ? (
        <div className="grid grid-cols-1 divide-y divide-[#27272A] md:grid-cols-2 md:divide-y-0">
          {filteredHackathons.map((hack) => {
            const isBookmarked = bookmarks.includes(hack.id);
            return (
              <CrosshairCell
                key={hack.id}
                corners={["tl", "tr"]}
                className="flex flex-col justify-between border-r border-b border-[#27272A] bg-[#09090B] p-6 transition-colors hover:bg-[#111114] lg:p-8"
              >
                <div>
                  {/* Top Row: Source Badges + Format Pill + OXAKALABS Status Tag */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <SourceBadges sources={hack.sources} />
                      <span className="font-mono-telemetry border border-[#27272A] bg-[#111114] px-2 py-0.5 text-[10px] text-[#F3F2EE]">
                        {hack.format}
                      </span>
                    </div>
                    <OxakalabsStatusBadge status={hack.oxakalabs_status} />
                  </div>

                  {/* Title & Organizer */}
                  <h2 className="font-display mt-4 text-xl font-bold tracking-tight text-[#F3F2EE] sm:text-2xl">
                    {hack.title}
                  </h2>
                  <div className="font-mono-telemetry mt-1 text-[11px] text-[#71717A]">
                    ORGANIZER: <span className="text-[#A1A1AA]">{hack.organizer}</span> •{" "}
                    <span>{hack.location}</span>
                  </div>

                  {/* 2-Line Crisp Description */}
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[#A1A1AA]">
                    {hack.summary}
                  </p>

                  {/* Theme Tags */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {hack.themes.map((theme) => (
                      <span
                        key={theme}
                        className="font-mono-telemetry border border-[#27272A] bg-[#111114] px-2 py-0.5 text-[9px] text-[#A1A1AA]"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  {/* Metrics Strip (JetBrains Mono): Prize Pool | Live Countdown Timer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[#27272A] bg-[#111114]/70 px-4 py-3">
                    <div>
                      <div className="font-mono-telemetry text-[9px] text-[#71717A]">
                        PRIZE POOL
                      </div>
                      <div className="font-mono-telemetry text-xs font-bold text-[#10B981]">
                        {hack.prize_display}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono-telemetry text-[9px] text-[#71717A]">
                        SUBMISSION COUNTDOWN
                      </div>
                      <CountdownTimer deadlineAt={hack.deadline_at} />
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={hack.primary_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono-telemetry inline-flex items-center gap-1.5 bg-[#F3F2EE] px-3.5 py-2 text-[11px] font-bold text-[#09090B] transition-colors hover:bg-[#FF3B1F]"
                      >
                        <span>APPLY / VIEW SOURCE</span>
                        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                      </a>

                      {hack.source_tweet_url && (
                        <a
                          href={hack.source_tweet_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono-telemetry inline-flex items-center gap-1 border border-[#FF3B1F]/50 bg-[#FF3B1F]/10 px-2.5 py-2 text-[10px] text-[#FF3B1F] hover:bg-[#FF3B1F] hover:text-[#09090B]"
                        >
                          <span>VIEW ORIGINAL X POST</span>
                          <ArrowUpRight className="h-3 w-3" strokeWidth={1.8} />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDownloadIcs(hack)}
                        title="Add Deadline to Calendar (.ics)"
                        className="font-mono-telemetry inline-flex items-center gap-1 border border-[#27272A] bg-[#111114] px-2.5 py-2 text-[10px] text-[#A1A1AA] hover:border-[#3F3F46] hover:text-[#F3F2EE]"
                      >
                        <Calendar className="h-3 w-3 text-[#FF3B1F]" strokeWidth={1.5} />
                        <span>.ICS</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBookmark(hack.id)}
                        title="Bookmark Hackathon"
                        className={`border p-2 transition-colors ${
                          isBookmarked
                            ? "border-[#FF3B1F] bg-[#FF3B1F] text-[#09090B]"
                            : "border-[#27272A] bg-[#111114] text-[#A1A1AA] hover:text-[#F3F2EE]"
                        }`}
                      >
                        <Bookmark className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              </CrosshairCell>
            );
          })}
        </div>
      ) : (
        /* Compact Telemetry Table View */
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#27272A] bg-[#111114] text-[10px] text-[#71717A]">
                <th className="font-mono-telemetry px-4 py-3">SOURCES</th>
                <th className="font-mono-telemetry px-4 py-3">HACKATHON &amp; ORGANIZER</th>
                <th className="font-mono-telemetry px-4 py-3">FORMAT</th>
                <th className="font-mono-telemetry px-4 py-3">PRIZE POOL</th>
                <th className="font-mono-telemetry px-4 py-3">COUNTDOWN</th>
                <th className="font-mono-telemetry px-4 py-3">OXAKALABS STATUS</th>
                <th className="font-mono-telemetry px-4 py-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A]">
              {filteredHackathons.map((hack) => (
                <tr key={hack.id} className="hover:bg-[#111114]/80">
                  <td className="px-4 py-3.5">
                    <SourceBadges sources={hack.sources} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-[#F3F2EE]">{hack.title}</div>
                    <div className="font-mono-telemetry text-[10px] text-[#71717A]">
                      {hack.organizer} • {hack.location}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono-telemetry border border-[#27272A] px-2 py-0.5 text-[10px] text-[#A1A1AA]">
                      {hack.format}
                    </span>
                  </td>
                  <td className="font-mono-telemetry px-4 py-3.5 font-semibold text-[#10B981]">
                    {hack.prize_display}
                  </td>
                  <td className="px-4 py-3.5">
                    <CountdownTimer deadlineAt={hack.deadline_at} compact />
                  </td>
                  <td className="px-4 py-3.5">
                    <OxakalabsStatusBadge status={hack.oxakalabs_status} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadIcs(hack)}
                        className="font-mono-telemetry border border-[#27272A] px-2 py-1 text-[10px] text-[#A1A1AA] hover:text-[#F3F2EE]"
                      >
                        .ICS
                      </button>
                      <a
                        href={hack.primary_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono-telemetry bg-[#FF3B1F] px-2.5 py-1 text-[10px] font-bold text-[#09090B]"
                      >
                        APPLY ↗
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* =====================================================================
          4. COMMUNITY SUBMISSION MODAL (+ SUBMIT HACKATHON / X LINK)
         ===================================================================== */}
      {submitModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSubmitModalOpen(false)}
        >
          <div
            className="w-full max-w-lg border border-[#27272A] bg-[#111114] text-[#F3F2EE]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#27272A] bg-[#09090B] px-6 py-4">
              <div>
                <span className="font-mono-telemetry text-[10px] text-[#FF3B1F]">
                  GEMINI FLASH + HEURISTIC EXTRACTION PIPELINE
                </span>
                <h3 className="font-display mt-0.5 text-lg font-bold">
                  SUBMIT HACKATHON OR X (TWITTER) SIGNAL
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="border border-[#27272A] p-1.5 text-[#A1A1AA] hover:text-[#F3F2EE]"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-6">
              {submittedCandidate ? (
                <div className="border border-[#10B981] bg-[#09090B] p-5">
                  <div className="flex items-center gap-2 text-[#10B981]">
                    <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />
                    <span className="font-mono-telemetry text-xs font-bold">
                      EXTRACTED &amp; VERIFIED // CONFIDENCE:{" "}
                      {Math.round(submittedCandidate.confidence_score * 100)}%
                    </span>
                  </div>
                  <h4 className="font-display mt-3 text-lg font-bold text-[#F3F2EE]">
                    {submittedCandidate.title}
                  </h4>
                  <p className="mt-1 text-xs text-[#A1A1AA]">
                    Organizer: {submittedCandidate.organizer} • Prize:{" "}
                    {submittedCandidate.prize_display}
                  </p>
                  <p className="mt-2 text-xs text-[#A1A1AA]">
                    {submittedCandidate.is_published
                      ? "Auto-published to the live radar (Confidence >= 85%)."
                      : "Routed to the /admin Curator Moderation Queue for founder approval."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedCandidate(null);
                      setSubmitUrl("");
                      setSubmitContext("");
                      setSubmitModalOpen(false);
                    }}
                    className="font-mono-telemetry mt-5 bg-[#FF3B1F] px-4 py-2 text-xs font-bold text-[#09090B]"
                  >
                    DONE
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitUrl} className="space-y-4">
                  <p className="text-xs text-[#A1A1AA]">
                    Paste any X (Twitter) announcement link (`https://x.com/.../status/...`)
                    or Luma / Devpost / DoraHacks URL. Our pipeline resolves the post,
                    filters retrospective noise, and extracts structured hackathon
                    telemetry.
                  </p>

                  {submitError && (
                    <div className="border border-[#FF3B1F] bg-[#FF3B1F]/10 p-3 text-xs text-[#FF3B1F]">
                      {submitError}
                    </div>
                  )}

                  <div>
                    <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                      X (TWITTER) STATUS URL OR HACKATHON LINK *
                    </label>
                    <input
                      type="url"
                      required
                      id="submit-hackathon-url-input"
                      value={submitUrl}
                      onChange={(e) => setSubmitUrl(e.target.value)}
                      placeholder="https://x.com/GoogleAI/status/189001020304050607"
                      className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-xs text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                      OPTIONAL TWEET TEXT / PRIZE &amp; DEADLINE CONTEXT
                    </label>
                    <textarea
                      rows={3}
                      id="submit-hackathon-context-input"
                      value={submitContext}
                      onChange={(e) => setSubmitContext(e.target.value)}
                      placeholder="Optional: Paste the announcement text (e.g. '$50,000 AI Agents Hackathon by Anthropic & Cerebral Valley, online registration open...')"
                      className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] p-3 text-xs text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    id="submit-hackathon-confirm-btn"
                    disabled={submitting}
                    className="font-mono-telemetry w-full bg-[#FF3B1F] py-3 text-xs font-bold text-[#09090B] hover:bg-[#F3F2EE]"
                  >
                    {submitting
                      ? "EXTRACTING & VERIFYING TELEMETRY..."
                      : "RUN EXTRACTION & VERIFICATION →"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
