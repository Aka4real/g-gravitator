"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  RefreshCw,
  Check,
  EyeOff,
  Pin,
  LogOut,
  Lock,
  ArrowUpRight,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { SourceBadges } from "@/components/hackathons/SourceBadges";
import { SPRING_UI } from "@/lib/motion";
import type {
  ClientInquiry,
  Hackathon,
  InquiryStatus,
  NewsCategory,
  NewsItem,
  NewsletterSubscriber,
  OrbitApplication,
  OrbitTrack,
  OxakalabsStatus,
  ServiceTierKey,
} from "@/lib/supabase/types";

interface AdminConsoleClientProps {
  initialAuthenticated: boolean;
  initialHackathons: Hackathon[];
  initialNews: NewsItem[];
  initialInquiries: ClientInquiry[];
  initialOrbit: OrbitApplication[];
  initialSubscribers: NewsletterSubscriber[];
}

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

function formatUtcDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--";
  const month = UTC_MONTHS[date.getUTCMonth()];
  const day = String(date.getUTCDate()).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${month} ${day}, ${year}`;
}

const TIER_LABELS: Record<ServiceTierKey, string> = {
  GRAVITY_AUDIT: "Gravity Audit",
  VELOCITY_MVP: "Velocity MVP",
  LAB_RETAINER: "Lab Retainer",
  CUSTOM: "Custom Scope",
};

const NEWS_CAT_LABELS: Record<NewsCategory, string> = {
  MODELS: "Models",
  AGENTS: "Agents",
  DEVTOOLS: "Devtools",
  RESEARCH: "Research",
  BUSINESS: "Business",
  OPEN_SOURCE: "Open Source",
};

const ORBIT_TRACK_LABELS: Record<OrbitTrack, string> = {
  AI_ENGINEERING: "Applied AI Engineering",
  FULLSTACK_SYSTEMS: "Full-Stack Systems",
  KINETIC_DESIGN: "Kinetic Design Engineering",
};

export function AdminConsoleClient({
  initialAuthenticated,
  initialHackathons,
  initialNews,
  initialInquiries,
  initialOrbit,
  initialSubscribers,
}: AdminConsoleClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [passcode, setPasscode] = useState("GG-ORBIT-2026");
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "HACKATHONS" | "NEWS" | "INQUIRIES" | "ORBIT"
  >("HACKATHONS");

  const [hackathons, setHackathons] = useState<Hackathon[]>(initialHackathons);
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [inquiries, setInquiries] = useState<ClientInquiry[]>(initialInquiries);
  const [syncNotice, setSyncNotice] = useState<{
    tone: "info" | "success" | "error";
    text: string;
  } | null>(null);
  const [syncingTarget, setSyncingTarget] = useState<"hackathons" | "news" | null>(
    null
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthenticating(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        setAuthenticated(true);
      } else {
        const data = await res.json().catch(() => null);
        setAuthError(data?.error || "Invalid passcode. Please try again.");
      }
    } catch {
      setAuthError("Network error while verifying passcode. Please try again.");
    } finally {
      setAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setAuthenticated(false);
  };

  const handleRunLiveSync = async (target: "hackathons" | "news") => {
    setSyncingTarget(target);
    setSyncNotice({
      tone: "info",
      text:
        target === "hackathons"
          ? "Running live hackathon ingestion across providers..."
          : "Running live Orbital Wire ingestion...",
    });
    try {
      const endpoint =
        target === "hackathons"
          ? "/api/cron/ingest-hackathons"
          : "/api/cron/ingest-news";
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        if (target === "hackathons") {
          setSyncNotice({
            tone: "success",
            text: `Hackathon sync complete. Fetched ${data.report?.fetchedRaw ?? 0}, inserted ${data.report?.inserted ?? 0}, merged ${data.report?.merged ?? 0}.`,
          });
          const listRes = await fetch("/api/hackathons?includeExpired=true").then(
            (r) => r.json()
          );
          if (Array.isArray(listRes.hackathons)) {
            setHackathons(listRes.hackathons);
          }
        } else {
          setSyncNotice({
            tone: "success",
            text: `Orbital Wire sync complete. Fetched ${data.report?.fetchedRaw ?? 0}, inserted ${data.report?.inserted ?? 0}.`,
          });
          const newsRes = await fetch("/api/news").then((r) => r.json());
          if (Array.isArray(newsRes.news)) {
            setNews(newsRes.news);
          }
        }
      } else {
        setSyncNotice({
          tone: "error",
          text: "Sync failed: unauthorized session or upstream provider timeout.",
        });
      }
    } catch {
      setSyncNotice({
        tone: "error",
        text: "Sync failed due to a network error.",
      });
    } finally {
      setSyncingTarget(null);
    }
  };

  const handleHackathonPatch = async (
    id: string,
    patch: {
      is_published?: boolean;
      oxakalabs_status?: OxakalabsStatus;
    }
  ) => {
    const res = await fetch("/api/admin/curate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "hackathon", id, ...patch }),
    });
    if (res.ok) {
      const data = await res.json();
      setHackathons((prev) =>
        prev.map((h) => (h.id === id ? { ...h, ...data.hackathon } : h))
      );
    }
  };

  const handleNewsPatch = async (
    id: string,
    patch: { is_pinned?: boolean; is_published?: boolean }
  ) => {
    const res = await fetch("/api/admin/curate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "news", id, ...patch }),
    });
    if (res.ok) {
      const data = await res.json();
      setNews((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...data.newsItem } : n))
      );
    }
  };

  const handleInquiryPatch = async (id: string, status: InquiryStatus) => {
    const res = await fetch("/api/admin/curate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "inquiry", id, status }),
    });
    if (res.ok) {
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === id ? { ...inq, status } : inq))
      );
    }
  };

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md py-12 sm:py-20">
        <div className="surface-card p-7 sm:p-9">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#FF3B1F]/30 bg-[#FF3B1F]/12 text-[#FF6B54]">
            <Lock className="h-5 w-5" strokeWidth={1.7} />
          </div>

          <h1 className="font-display mt-5 text-2xl font-bold tracking-[-0.025em] text-[#F4F3EF] sm:text-3xl">
            Curator Console
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
            Enter the founder passcode (pre-filled for local verification:{" "}
            <code className="font-mono-telemetry rounded-md bg-white/[0.08] px-1.5 py-0.5 text-xs text-[#F4F3EF]">
              GG-ORBIT-2026
            </code>
            ) to moderate hackathon signals, Orbital Wire stories, and inquiries.
          </p>

          {authError && (
            <div
              role="alert"
              className="mt-5 flex items-center gap-2 rounded-xl border border-[#FF3B1F]/35 bg-[#FF3B1F]/12 px-4 py-3 text-sm text-[#FF8A7A]"
            >
              <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="admin-passcode-input"
                className="block text-sm font-medium text-[#D4D4D8]"
              >
                Founder passcode
              </label>
              <input
                type="password"
                id="admin-passcode-input"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-4 text-sm text-[#F4F3EF] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/25 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              id="admin-login-btn"
              disabled={authenticating}
              className="press-tactile inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-[#FF3B1F] px-5 text-sm font-semibold text-[#08080A] hover:bg-[#FF5238] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {authenticating ? "Verifying..." : "Unlock console"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const pendingModerationCount = hackathons.filter((h) => !h.is_published).length;

  const tabs = [
    {
      key: "HACKATHONS" as const,
      label: "Hackathons",
      count: hackathons.length,
      pending: pendingModerationCount,
    },
    {
      key: "NEWS" as const,
      label: "Orbital Wire",
      count: news.length,
      pending: 0,
    },
    {
      key: "INQUIRIES" as const,
      label: "Inquiries",
      count: inquiries.length,
      pending: 0,
    },
    {
      key: "ORBIT" as const,
      label: "Orbit & Brief",
      count: initialOrbit.length + initialSubscribers.length,
      pending: 0,
    },
  ];

  return (
    <div className="min-w-0">
      {/* Unboxed Console Header */}
      <header className="flex flex-col justify-between gap-5 border-b border-white/[0.08] pb-8 lg:flex-row lg:items-end">
        <div>
          <h1 className="font-display text-[clamp(1.875rem,3.6vw,3rem)] font-bold tracking-[-0.03em] text-[#F4F3EF]">
            Curator Console
          </h1>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-[#A1A1AA]">
            Approve X hackathon signals, manage OXAKALABS squad deployments, pin Orbital
            Wire stories, and triage client inquiries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={syncingTarget !== null}
            id="admin-sync-hackathons-btn"
            onClick={() => handleRunLiveSync("hackathons")}
            className="press-tactile inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-white/[0.1] bg-[#18181D] px-4 text-xs font-medium whitespace-nowrap text-[#F4F3EF] hover:border-white/[0.2] hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-[#FF6B54] ${
                syncingTarget === "hackathons" ? "animate-spin" : ""
              }`}
              strokeWidth={1.8}
            />
            <span>Sync hackathons</span>
          </button>

          <button
            type="button"
            disabled={syncingTarget !== null}
            id="admin-sync-news-btn"
            onClick={() => handleRunLiveSync("news")}
            className="press-tactile inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-white/[0.1] bg-[#18181D] px-4 text-xs font-medium whitespace-nowrap text-[#F4F3EF] hover:border-white/[0.2] hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-[#34D399] ${
                syncingTarget === "news" ? "animate-spin" : ""
              }`}
              strokeWidth={1.8}
            />
            <span>Sync Orbital Wire</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="press-tactile inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.08] bg-transparent px-4 text-xs font-medium whitespace-nowrap text-[#A1A1AA] hover:border-white/[0.16] hover:text-[#F4F3EF]"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.7} />
            <span>Lock</span>
          </button>
        </div>
      </header>

      {/* Sync Status Notice */}
      {syncNotice && (
        <div
          role={syncNotice.tone === "error" ? "alert" : "status"}
          className={`mt-6 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            syncNotice.tone === "error"
              ? "border-[#FF3B1F]/35 bg-[#FF3B1F]/12 text-[#FF8A7A]"
              : syncNotice.tone === "success"
              ? "border-[#10B981]/35 bg-[#10B981]/12 text-[#34D399]"
              : "border-white/[0.1] bg-[#111114] text-[#D4D4D8]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {syncNotice.tone === "error" ? (
              <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            ) : syncNotice.tone === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            ) : (
              <RefreshCw className="h-4 w-4 shrink-0 animate-spin" strokeWidth={1.8} />
            )}
            <span>{syncNotice.text}</span>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setSyncNotice(null)}
            className="rounded-full p-1 opacity-75 transition-opacity hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>
      )}

      {/* Segmented Navigation Pill Tabs */}
      <div
        role="tablist"
        aria-label="Curator console sections"
        className="mt-7 flex items-center gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.key)}
              className={`press-tactile relative inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors ${
                active
                  ? "border-transparent text-[#08080A]"
                  : "border-white/[0.08] bg-[#111114] text-[#A1A1AA] hover:border-white/[0.16] hover:text-[#F4F3EF]"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="admin-active-tab"
                  transition={prefersReducedMotion ? { duration: 0.1 } : SPRING_UI}
                  className="absolute inset-0 rounded-full bg-[#F4F3EF]"
                />
              )}
              <span className="relative z-10">{tab.label}</span>
              <span
                className={`font-mono-telemetry relative z-10 rounded-full px-2 py-0.5 text-xs ${
                  active
                    ? "bg-black/[0.12] font-semibold text-[#08080A]"
                    : "bg-white/[0.07] text-[#D4D4D8]"
                }`}
              >
                {tab.count}
              </span>
              {tab.pending > 0 && (
                <span className="font-mono-telemetry relative z-10 rounded-full bg-[#FF3B1F] px-2 py-0.5 text-[11px] font-semibold text-[#08080A]">
                  {tab.pending} pending
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: HACKATHONS & OXAKALABS STATUS */}
      {activeTab === "HACKATHONS" && (
        <div className="mt-6 space-y-4">
          {hackathons.map((hack) => {
            const selectId = `admin-oxa-status-${hack.id}`;
            return (
              <div
                key={hack.id}
                className={`surface-card flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center ${
                  !hack.is_published
                    ? "border-[#FF3B1F]/35 bg-[#FF3B1F]/[0.05]"
                    : ""
                }`}
              >
                <div className="min-w-0 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <SourceBadges sources={hack.sources} />
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        hack.is_published
                          ? "border border-[#10B981]/30 bg-[#10B981]/15 text-[#34D399]"
                          : "bg-[#FF3B1F] text-[#08080A]"
                      }`}
                    >
                      {hack.is_published ? "Published" : "Pending review"}
                    </span>
                    <span className="font-mono-telemetry text-xs text-[#8B8B94]">
                      Confidence {Math.round(hack.confidence_score * 100)}%
                    </span>
                  </div>

                  <h2 className="font-display mt-3 text-lg leading-snug font-semibold text-[#F4F3EF] sm:text-xl">
                    {hack.title}
                  </h2>
                  <p className="mt-1.5 text-xs text-[#A1A1AA]">
                    <span className="text-[#D4D4D8]">{hack.organizer}</span> ·{" "}
                    <span className="font-mono-telemetry text-[#34D399]">
                      {hack.prize_display}
                    </span>{" "}
                    · Deadline{" "}
                    <span className="font-mono-telemetry text-[#D4D4D8]">
                      {formatUtcDate(hack.deadline_at)}
                    </span>
                  </p>
                </div>

                {/* Curator Controls */}
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label
                      htmlFor={selectId}
                      className="block text-xs font-medium text-[#A1A1AA]"
                    >
                      OXAKALABS status
                    </label>
                    <select
                      id={selectId}
                      value={hack.oxakalabs_status}
                      onChange={(e) =>
                        handleHackathonPatch(hack.id, {
                          oxakalabs_status: e.target.value as OxakalabsStatus,
                        })
                      }
                      className="mt-1.5 h-10 cursor-pointer rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3.5 text-xs font-medium text-[#F4F3EF] focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/25 focus:outline-none"
                    >
                      <option value="NONE">None</option>
                      <option value="SCOUTING">OXA Scouting</option>
                      <option value="SQUAD_DEPLOYED">OXA Squad deployed</option>
                      <option value="SUBMITTED">OXA Submitted</option>
                      <option value="WON">OXA Podium win</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleHackathonPatch(hack.id, {
                        is_published: !hack.is_published,
                      })
                    }
                    className={`press-tactile inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-4 text-xs font-semibold whitespace-nowrap ${
                      hack.is_published
                        ? "border border-white/[0.1] bg-[#18181D] text-[#D4D4D8] hover:border-[#FF3B1F]/40 hover:text-[#FF8A7A]"
                        : "bg-[#10B981] text-[#08080A] hover:bg-[#34D399]"
                    }`}
                  >
                    {hack.is_published ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" strokeWidth={1.8} />
                        <span>Unpublish</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" strokeWidth={2} />
                        <span>Approve &amp; publish</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: ORBITAL WIRE NEWS CURATION */}
      {activeTab === "NEWS" && (
        <div className="mt-6 space-y-4">
          {news.map((item) => (
            <div
              key={item.id}
              className={`surface-card flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center ${
                !item.is_published ? "opacity-65" : ""
              }`}
            >
              <div className="min-w-0 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-white/[0.09] bg-[#18181D] px-2.5 py-0.5 text-xs font-medium text-[#D4D4D8]">
                    {NEWS_CAT_LABELS[item.category] ?? item.category}
                  </span>
                  <span className="text-xs text-[#8B8B94]">{item.source_name}</span>
                  <span className="font-mono-telemetry text-xs font-medium text-[#34D399]">
                    Impact {item.impact_score}/100
                  </span>
                  {item.is_pinned && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FF3B1F] px-2.5 py-0.5 text-xs font-semibold text-[#08080A]">
                      <Pin className="h-3 w-3" strokeWidth={2} />
                      <span>Pinned banner</span>
                    </span>
                  )}
                  {!item.is_published && (
                    <span className="inline-flex items-center rounded-full border border-white/[0.1] bg-white/[0.05] px-2.5 py-0.5 text-xs text-[#A1A1AA]">
                      Hidden
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-base leading-snug font-semibold text-[#F4F3EF]">
                  {item.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[#A1A1AA]">
                  {item.gravity_take}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleNewsPatch(item.id, { is_pinned: !item.is_pinned })
                  }
                  className={`press-tactile inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-xs font-semibold whitespace-nowrap ${
                    item.is_pinned
                      ? "border-[#FF3B1F] bg-[#FF3B1F] text-[#08080A] hover:bg-[#FF5238]"
                      : "border-white/[0.1] bg-[#18181D] text-[#D4D4D8] hover:border-white/[0.2] hover:text-[#F4F3EF]"
                  }`}
                >
                  <Pin className="h-3.5 w-3.5" strokeWidth={1.8} />
                  <span>{item.is_pinned ? "Unpin" : "Pin to top"}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleNewsPatch(item.id, { is_published: !item.is_published })
                  }
                  className="press-tactile inline-flex h-9 cursor-pointer items-center rounded-full border border-white/[0.1] bg-[#18181D] px-4 text-xs font-medium whitespace-nowrap text-[#D4D4D8] hover:border-white/[0.2] hover:text-[#F4F3EF]"
                >
                  {item.is_published ? "Hide" : "Restore"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: B2B SYSTEMS CLIENT INQUIRIES */}
      {activeTab === "INQUIRIES" && (
        <div className="mt-6 space-y-4">
          {inquiries.map((inq) => {
            const selectId = `admin-inquiry-status-${inq.id}`;
            return (
              <div
                key={inq.id}
                className="surface-card flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center"
              >
                <div className="min-w-0 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-[#FF3B1F] px-2.5 py-0.5 text-xs font-semibold text-[#08080A]">
                      {TIER_LABELS[inq.tier] ?? inq.tier}
                    </span>
                    <span className="font-mono-telemetry inline-flex items-center rounded-full border border-[#10B981]/30 bg-[#10B981]/12 px-2.5 py-0.5 text-xs font-medium text-[#34D399]">
                      {inq.budget_range || "Custom budget"}
                    </span>
                    <span className="text-xs text-[#8B8B94]">
                      Timeline: {inq.timeline || "Immediate"}
                    </span>
                  </div>

                  <h2 className="font-display mt-3 text-lg font-semibold text-[#F4F3EF] sm:text-xl">
                    {inq.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-[#8B8B94]">
                    <span className="text-[#D4D4D8]">
                      {inq.company || "Independent"}
                    </span>{" "}
                    ·{" "}
                    <a
                      href={`mailto:${inq.email}`}
                      className="text-[#A1A1AA] underline-offset-2 hover:text-[#F4F3EF] hover:underline"
                    >
                      {inq.email}
                    </a>
                  </p>

                  <p className="mt-3 text-sm leading-relaxed text-[#A1A1AA]">
                    {inq.project_brief}
                  </p>
                </div>

                <div className="shrink-0">
                  <label
                    htmlFor={selectId}
                    className="block text-xs font-medium text-[#A1A1AA]"
                  >
                    Pipeline status
                  </label>
                  <select
                    id={selectId}
                    value={inq.status}
                    onChange={(e) =>
                      handleInquiryPatch(inq.id, e.target.value as InquiryStatus)
                    }
                    className="mt-1.5 h-10 cursor-pointer rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3.5 text-xs font-medium text-[#F4F3EF] focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/25 focus:outline-none"
                  >
                    <option value="NEW">New</option>
                    <option value="REVIEWED">Reviewed</option>
                    <option value="DISCOVERY_CALL">Discovery call</option>
                    <option value="CLOSED_WON">Closed won</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: ORBIT COHORT WAITLIST & NEWSLETTER SUBSCRIBERS */}
      {activeTab === "ORBIT" && (
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section aria-labelledby="orbit-apps-heading">
            <div className="flex items-baseline justify-between gap-2">
              <h2
                id="orbit-apps-heading"
                className="font-display text-xl font-semibold text-[#F4F3EF]"
              >
                Orbit applications
              </h2>
              <span className="font-mono-telemetry text-xs text-[#8B8B94]">
                {initialOrbit.length} total
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {initialOrbit.map((app) => (
                <div key={app.id} className="surface-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#F4F3EF]">
                      {app.full_name}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[#FF3B1F]/30 bg-[#FF3B1F]/12 px-2.5 py-0.5 text-xs font-medium text-[#FF8A7A]">
                      {ORBIT_TRACK_LABELS[app.track] ?? app.track}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[#8B8B94]">{app.email}</div>
                  {app.portfolio_url && (
                    <a
                      href={app.portfolio_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-[#34D399] hover:underline"
                    >
                      <span className="break-all">{app.portfolio_url}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                    </a>
                  )}
                  <p className="mt-2.5 text-sm leading-relaxed text-[#A1A1AA]">
                    {app.proof_of_work}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="brief-subs-heading">
            <div className="flex items-baseline justify-between gap-2">
              <h2
                id="brief-subs-heading"
                className="font-display text-xl font-semibold text-[#F4F3EF]"
              >
                Weekly Orbital Brief subscribers
              </h2>
              <span className="font-mono-telemetry text-xs text-[#8B8B94]">
                {initialSubscribers.length} total
              </span>
            </div>

            <div className="surface-card mt-4 overflow-hidden">
              <ul className="divide-y divide-white/[0.06]">
                {initialSubscribers.map((sub) => (
                  <li
                    key={sub.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 text-sm"
                  >
                    <span className="text-[#F4F3EF]">{sub.email}</span>
                    <span className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-xs text-[#A1A1AA]">
                      {sub.source}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
