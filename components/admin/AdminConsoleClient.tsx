"use client";

import React, { useState } from "react";
import {
  Shield,
  RefreshCw,
  Check,
  EyeOff,
  Pin,
  LogOut,
  Lock,
  ArrowUpRight,
} from "lucide-react";
import { SourceBadges } from "@/components/hackathons/SourceBadges";
import type {
  ClientInquiry,
  Hackathon,
  InquiryStatus,
  NewsItem,
  NewsletterSubscriber,
  OrbitApplication,
  OxakalabsStatus,
} from "@/lib/supabase/types";

interface AdminConsoleClientProps {
  initialAuthenticated: boolean;
  initialHackathons: Hackathon[];
  initialNews: NewsItem[];
  initialInquiries: ClientInquiry[];
  initialOrbit: OrbitApplication[];
  initialSubscribers: NewsletterSubscriber[];
}

export function AdminConsoleClient({
  initialAuthenticated,
  initialHackathons,
  initialNews,
  initialInquiries,
  initialOrbit,
  initialSubscribers,
}: AdminConsoleClientProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [passcode, setPasscode] = useState("GG-ORBIT-2026");
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "HACKATHONS" | "NEWS" | "INQUIRIES" | "ORBIT"
  >("HACKATHONS");

  const [hackathons, setHackathons] = useState<Hackathon[]>(initialHackathons);
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [inquiries, setInquiries] = useState<ClientInquiry[]>(initialInquiries);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    if (res.ok) {
      setAuthenticated(true);
    } else {
      const data = await res.json();
      setAuthError(data.error || "Invalid passcode");
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
    setSyncing(true);
    setSyncMessage(`RUNNING LIVE ${target.toUpperCase()} INGESTION...`);
    try {
      const endpoint =
        target === "hackathons"
          ? "/api/cron/ingest-hackathons"
          : "/api/cron/ingest-news";
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        if (target === "hackathons") {
          setSyncMessage(
            `HACKATHON SYNC COMPLETE // Fetched: ${data.report?.fetchedRaw ?? 0}, Inserted: ${data.report?.inserted ?? 0}, Merged: ${data.report?.merged ?? 0}`
          );
          const listRes = await fetch("/api/hackathons?includeExpired=true").then((r) =>
            r.json()
          );
          if (Array.isArray(listRes.hackathons)) {
            setHackathons(listRes.hackathons);
          }
        } else {
          setSyncMessage(
            `ORBITAL WIRE SYNC COMPLETE // Fetched: ${data.report?.fetchedRaw ?? 0}, Inserted: ${data.report?.inserted ?? 0}`
          );
          const newsRes = await fetch("/api/news").then((r) => r.json());
          if (Array.isArray(newsRes.news)) {
            setNews(newsRes.news);
          }
        }
      } else {
        setSyncMessage("SYNC ERROR: Unauthorized or provider timeout.");
      }
    } catch {
      setSyncMessage("SYNC ERROR: Network failure.");
    } finally {
      setSyncing(false);
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
      <div className="mx-auto max-w-md py-20">
        <div className="border border-[#27272A] bg-[#111114] p-8">
          <div className="flex items-center gap-2 text-xs text-[#FF3B1F]">
            <Lock className="h-4 w-4" strokeWidth={1.5} />
            <span className="font-mono-telemetry">
              G-GRAVITATOR // CURATOR SECURITY CLEARANCE
            </span>
          </div>
          <h1 className="font-display mt-3 text-2xl font-extrabold uppercase">
            AUTHENTICATE ADMIN CONSOLE
          </h1>
          <p className="mt-2 text-xs text-[#A1A1AA]">
            Enter the founder clearance passcode (`ADMIN_PASSCODE`, pre-filled for local
            verification: `GG-ORBIT-2026`) or authenticate via Supabase Auth.
          </p>

          {authError && (
            <div className="mt-4 border border-[#FF3B1F] bg-[#FF3B1F]/10 p-3 text-xs text-[#FF3B1F]">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="font-mono-telemetry block text-[10px] text-[#A1A1AA]">
                FOUNDER CLEARANCE PASSCODE
              </label>
              <input
                type="password"
                id="admin-passcode-input"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              id="admin-login-btn"
              className="font-mono-telemetry w-full bg-[#FF3B1F] py-3 text-xs font-bold text-[#09090B] hover:bg-[#F3F2EE]"
            >
              UNLOCK CURATOR CONSOLE →
            </button>
          </form>
        </div>
      </div>
    );
  }

  const pendingModerationCount = hackathons.filter((h) => !h.is_published).length;

  return (
    <div>
      {/* Top Admin Command Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#27272A] bg-[#111114] px-6 py-5 sm:flex-row sm:items-center lg:px-10">
        <div>
          <div className="font-mono-telemetry flex items-center gap-2 text-xs text-[#10B981]">
            <Shield className="h-4 w-4 text-[#FF3B1F]" strokeWidth={1.5} />
            <span>CLEARANCE: LEVEL 01 FOUNDER // CURATOR CONSOLE</span>
          </div>
          <h1 className="font-display mt-1 text-2xl font-extrabold uppercase sm:text-3xl">
            G-GRAVITATOR &amp; OXAKALABS COMMAND CENTER
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={syncing}
            id="admin-sync-hackathons-btn"
            onClick={() => handleRunLiveSync("hackathons")}
            className="font-mono-telemetry inline-flex items-center gap-1.5 border border-[#27272A] bg-[#09090B] px-3 py-2 text-[10px] text-[#F3F2EE] hover:border-[#FF3B1F]"
          >
            <RefreshCw
              className={`h-3 w-3 text-[#FF3B1F] ${syncing ? "animate-spin" : ""}`}
            />
            <span>SYNC HACKATHONS</span>
          </button>

          <button
            type="button"
            disabled={syncing}
            id="admin-sync-news-btn"
            onClick={() => handleRunLiveSync("news")}
            className="font-mono-telemetry inline-flex items-center gap-1.5 border border-[#27272A] bg-[#09090B] px-3 py-2 text-[10px] text-[#F3F2EE] hover:border-[#10B981]"
          >
            <RefreshCw
              className={`h-3 w-3 text-[#10B981] ${syncing ? "animate-spin" : ""}`}
            />
            <span>SYNC ORBITAL WIRE</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="font-mono-telemetry inline-flex items-center gap-1 border border-[#27272A] bg-[#09090B] px-3 py-2 text-[10px] text-[#A1A1AA] hover:text-[#FF3B1F]"
          >
            <LogOut className="h-3 w-3" />
            <span>LOCK</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="border-b border-[#27272A] bg-[#18181B] px-6 py-2.5 text-xs text-[#10B981] lg:px-10">
          <span className="font-mono-telemetry">{syncMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap border-b border-[#27272A] bg-[#09090B] px-6 lg:px-10">
        {[
          {
            key: "HACKATHONS" as const,
            label: `01. HACKATHONS & X QUEUE (${hackathons.length}${
              pendingModerationCount > 0 ? ` • ${pendingModerationCount} PENDING` : ""
            })`,
          },
          { key: "NEWS" as const, label: `02. ORBITAL WIRE (${news.length})` },
          {
            key: "INQUIRIES" as const,
            label: `03. B2B SYSTEMS INQUIRIES (${inquiries.length})`,
          },
          {
            key: "ORBIT" as const,
            label: `04. ORBIT WAITLIST (${initialOrbit.length}) & SUBSCRIBERS (${initialSubscribers.length})`,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`font-mono-telemetry border-b-2 px-5 py-4 text-xs font-semibold transition-colors ${
              activeTab === tab.key
                ? "border-[#FF3B1F] text-[#F3F2EE]"
                : "border-transparent text-[#71717A] hover:text-[#F3F2EE]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: HACKATHONS & OXAKALABS STATUS */}
      {activeTab === "HACKATHONS" && (
        <div className="divide-y divide-[#27272A]">
          {hackathons.map((hack) => (
            <div
              key={hack.id}
              className={`flex flex-col justify-between gap-4 p-6 lg:flex-row lg:items-center lg:px-10 ${
                !hack.is_published ? "bg-[#FF3B1F]/5" : "bg-[#09090B]"
              }`}
            >
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <SourceBadges sources={hack.sources} />
                  <span
                    className={`font-mono-telemetry px-2 py-0.5 text-[10px] font-bold ${
                      hack.is_published
                        ? "bg-[#10B981]/20 text-[#10B981]"
                        : "bg-[#FF3B1F] text-[#09090B]"
                    }`}
                  >
                    {hack.is_published ? "PUBLISHED" : "MODERATION QUEUE"}
                  </span>
                  <span className="font-mono-telemetry text-[10px] text-[#71717A]">
                    CONFIDENCE: {Math.round(hack.confidence_score * 100)}%
                  </span>
                </div>

                <h3 className="font-display mt-2 text-lg font-bold text-[#F3F2EE]">
                  {hack.title}
                </h3>
                <p className="mt-1 text-xs text-[#A1A1AA]">
                  {hack.organizer} • {hack.prize_display} • Deadline:{" "}
                  {new Date(hack.deadline_at).toLocaleDateString()}
                </p>
              </div>

              {/* Curator Controls: OXAKALABS Status & Publish Toggle */}
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="font-mono-telemetry block text-[9px] text-[#71717A]">
                    OXAKALABS STATUS
                  </label>
                  <select
                    value={hack.oxakalabs_status}
                    onChange={(e) =>
                      handleHackathonPatch(hack.id, {
                        oxakalabs_status: e.target.value as OxakalabsStatus,
                      })
                    }
                    className="font-mono-telemetry mt-1 border border-[#27272A] bg-[#111114] px-3 py-1.5 text-[11px] text-[#F3F2EE]"
                  >
                    <option value="NONE">NONE</option>
                    <option value="SCOUTING">OXA // SCOUTING</option>
                    <option value="SQUAD_DEPLOYED">OXA // SQUAD DEPLOYED</option>
                    <option value="SUBMITTED">OXA // SUBMITTED</option>
                    <option value="WON">OXA // WON</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleHackathonPatch(hack.id, {
                      is_published: !hack.is_published,
                    })
                  }
                  className={`font-mono-telemetry mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-bold ${
                    hack.is_published
                      ? "border border-[#27272A] bg-[#111114] text-[#A1A1AA] hover:text-[#FF3B1F]"
                      : "bg-[#10B981] text-[#09090B]"
                  }`}
                >
                  {hack.is_published ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>UNPUBLISH</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>APPROVE &amp; PUBLISH</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: ORBITAL WIRE NEWS CURATION */}
      {activeTab === "NEWS" && (
        <div className="divide-y divide-[#27272A]">
          {news.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between gap-4 p-6 lg:flex-row lg:items-center lg:px-10"
            >
              <div className="max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="font-mono-telemetry border border-[#27272A] bg-[#111114] px-2 py-0.5 text-[10px] text-[#FF3B1F]">
                    {item.category}
                  </span>
                  <span className="font-mono-telemetry text-[10px] text-[#71717A]">
                    {item.source_name} • IMPACT: {item.impact_score}/100
                  </span>
                  {item.is_pinned && (
                    <span className="font-mono-telemetry bg-[#FF3B1F] px-2 py-0.5 text-[10px] font-bold text-[#09090B]">
                      PINNED BANNER
                    </span>
                  )}
                </div>
                <h3 className="mt-2 text-base font-bold text-[#F3F2EE]">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-[#A1A1AA]">{item.gravity_take}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleNewsPatch(item.id, { is_pinned: !item.is_pinned })
                  }
                  className={`font-mono-telemetry inline-flex items-center gap-1 border px-3 py-1.5 text-[10px] ${
                    item.is_pinned
                      ? "border-[#FF3B1F] bg-[#FF3B1F] font-bold text-[#09090B]"
                      : "border-[#27272A] bg-[#111114] text-[#A1A1AA]"
                  }`}
                >
                  <Pin className="h-3 w-3" />
                  <span>{item.is_pinned ? "UNPIN" : "PIN TO TOP"}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleNewsPatch(item.id, { is_published: !item.is_published })
                  }
                  className="font-mono-telemetry border border-[#27272A] bg-[#111114] px-3 py-1.5 text-[10px] text-[#A1A1AA] hover:text-[#F3F2EE]"
                >
                  {item.is_published ? "HIDE" : "RESTORE"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: B2B SYSTEMS CLIENT INQUIRIES */}
      {activeTab === "INQUIRIES" && (
        <div className="divide-y divide-[#27272A]">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className="flex flex-col justify-between gap-4 p-6 lg:flex-row lg:items-center lg:px-10"
            >
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono-telemetry bg-[#FF3B1F] px-2 py-0.5 text-[10px] font-bold text-[#09090B]">
                    {inq.tier}
                  </span>
                  <span className="font-mono-telemetry border border-[#27272A] px-2 py-0.5 text-[10px] text-[#10B981]">
                    {inq.budget_range || "CUSTOM BUDGET"}
                  </span>
                  <span className="font-mono-telemetry text-[10px] text-[#71717A]">
                    TIMELINE: {inq.timeline || "IMMEDIATE"}
                  </span>
                </div>
                <h3 className="font-display mt-2 text-lg font-bold text-[#F3F2EE]">
                  {inq.name} ({inq.company || "Independent"}) —{" "}
                  <span className="text-sm font-normal text-[#A1A1AA]">
                    {inq.email}
                  </span>
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#A1A1AA]">
                  {inq.project_brief}
                </p>
              </div>

              <div>
                <label className="font-mono-telemetry block text-[9px] text-[#71717A]">
                  PIPELINE STATUS
                </label>
                <select
                  value={inq.status}
                  onChange={(e) =>
                    handleInquiryPatch(inq.id, e.target.value as InquiryStatus)
                  }
                  className="font-mono-telemetry mt-1 border border-[#27272A] bg-[#111114] px-3 py-2 text-xs text-[#F3F2EE]"
                >
                  <option value="NEW">NEW</option>
                  <option value="REVIEWED">REVIEWED</option>
                  <option value="DISCOVERY_CALL">DISCOVERY CALL</option>
                  <option value="CLOSED_WON">CLOSED WON</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: ORBIT COHORT WAITLIST & NEWSLETTER */}
      {activeTab === "ORBIT" && (
        <div className="grid grid-cols-1 divide-y divide-[#27272A] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <div className="p-6 lg:p-10">
            <h2 className="font-mono-telemetry text-xs font-bold text-[#FF3B1F]">
              ORBIT CYCLE 01 // BUILDER APPLICATIONS ({initialOrbit.length})
            </h2>
            <div className="mt-4 divide-y divide-[#27272A] border border-[#27272A] bg-[#111114]">
              {initialOrbit.map((app) => (
                <div key={app.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#F3F2EE]">
                      {app.full_name}
                    </span>
                    <span className="font-mono-telemetry border border-[#27272A] bg-[#09090B] px-2 py-0.5 text-[10px] text-[#FF3B1F]">
                      {app.track}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[#A1A1AA]">{app.email}</div>
                  {app.portfolio_url && (
                    <a
                      href={app.portfolio_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono-telemetry mt-2 inline-flex items-center gap-1 text-[10px] text-[#10B981] hover:underline"
                    >
                      <span>{app.portfolio_url}</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  )}
                  <p className="mt-2 text-xs text-[#A1A1AA]">{app.proof_of_work}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 lg:p-10">
            <h2 className="font-mono-telemetry text-xs font-bold text-[#10B981]">
              WEEKLY ORBITAL BRIEF // SUBSCRIBERS ({initialSubscribers.length})
            </h2>
            <div className="mt-4 divide-y divide-[#27272A] border border-[#27272A] bg-[#111114]">
              {initialSubscribers.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between px-4 py-3 text-xs"
                >
                  <span className="text-[#F3F2EE]">{sub.email}</span>
                  <span className="font-mono-telemetry text-[10px] text-[#71717A]">
                    SOURCE: {sub.source.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
