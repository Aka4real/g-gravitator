"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  EyeOff,
  FileText,
  FlaskConical,
  Image as ImageIcon,
  KeyRound,
  Layers,
  Loader2,
  LogOut,
  Mic,
  Newspaper,
  Pin,
  Plug,
  Plus,
  Radar,
  RefreshCw,
  Shield,
  Sparkles,
  Star,
  Trash2,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { AiVoiceAssistantPanel } from "@/components/ops/AiVoiceAssistantPanel";
import { OpsAuthScreen } from "@/components/ops/OpsAuthScreen";
import {
  PostDesignerModal,
  type DesignerEntityType,
} from "@/components/ops/PostDesignerModal";
import type { OpsBootstrapData, OpsUserInfo } from "@/components/ops/ops-types";
import type {
  AiPermissionsPolicy,
  Dispatch,
  Hackathon,
  InquiryStatus,
  LabDivision,
  LabProject,
  LabProjectStatus,
  NewsItem,
  OrbitApplicationStatus,
  OxakalabsStatus,
} from "@/lib/supabase/types";

type ConsoleTab =
  | "OVERVIEW"
  | "JOURNAL"
  | "NEWS"
  | "HACKATHONS"
  | "LABS"
  | "CRM"
  | "MEDIA"
  | "PERMISSIONS"
  | "MCP_TEAM";

interface OpsConsoleClientProps {
  initialUser: OpsUserInfo | null;
  hasAdmins: boolean;
  requiresInviteCode: boolean;
  initialData: OpsBootstrapData | null;
}

function formatUtc(iso: string | null | undefined): string {
  if (!iso) return "--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--";
  return d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

export function OpsConsoleClient({
  initialUser,
  hasAdmins,
  requiresInviteCode,
  initialData,
}: OpsConsoleClientProps) {
  const [user, setUser] = useState<OpsUserInfo | null>(initialUser);
  const [data, setData] = useState<OpsBootstrapData | null>(initialData);
  const [loadingBootstrap, setLoadingBootstrap] = useState(false);
  const [activeTab, setActiveTab] = useState<ConsoleTab>("OVERVIEW");
  const [notice, setNotice] = useState<{
    tone: "info" | "success" | "error";
    text: string;
  } | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  // Designer Modal
  const [designerState, setDesignerState] = useState<{
    entity: DesignerEntityType;
    existing: Dispatch | NewsItem | Hackathon | null;
  } | null>(null);

  // AI & Voice Assistant Panel
  const [aiOpen, setAiOpen] = useState(false);

  // Lab Project Inline Form
  const [editingLab, setEditingLab] = useState<LabProject | null>(null);
  const [showLabForm, setShowLabForm] = useState(false);
  const [labCode, setLabCode] = useState("");
  const [labDivision, setLabDivision] = useState<LabDivision>("SKUNKWORKS");
  const [labName, setLabName] = useState("");
  const [labTagline, setLabTagline] = useState("");
  const [labDesc, setLabDesc] = useState("");
  const [labStatus, setLabStatus] = useState<LabProjectStatus>("PROTOTYPING");
  const [labStack, setLabStack] = useState("Next.js, TypeScript, Gemini 3.8 Flash");
  const [labLiveUrl, setLabLiveUrl] = useState("");
  const [labRepoUrl, setLabRepoUrl] = useState("");
  const [labScore, setLabScore] = useState({
    pain_intensity: 4,
    willingness_to_pay: 4,
    technical_moat: 4,
    distribution_hook: 4,
    lean_maintainability: 4,
  });

  // Media Tab Controls
  const [mediaPrompt, setMediaPrompt] = useState("");
  const [mediaImportUrl, setMediaImportUrl] = useState("");
  const mediaUploadRef = useRef<HTMLInputElement | null>(null);

  // Subscriber add
  const [newSubEmail, setNewSubEmail] = useState("");

  // MCP Token & Invite State
  const [mcpTokenName, setMcpTokenName] = useState("");
  const [mcpTokenMode, setMcpTokenMode] = useState<"inherit" | "full" | "readonly">(
    "inherit"
  );
  const [newPlaintextToken, setNewPlaintextToken] = useState<string | null>(null);
  const [newInviteCode, setNewInviteCode] = useState<string | null>(null);
  const [auditFilter, setAuditFilter] = useState<"ALL" | "admin" | "ai_assistant" | "mcp">("ALL");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const refreshBootstrap = async () => {
    setLoadingBootstrap(true);
    try {
      const res = await fetch("/api/ops/bootstrap", { cache: "no-store" });
      if (res.status === 401) {
        setUser(null);
        setData(null);
        return;
      }
      if (res.ok) {
        const next = (await res.json()) as OpsBootstrapData;
        setData(next);
        setUser(next.user);
      }
    } finally {
      setLoadingBootstrap(false);
    }
  };

  const handleAuthenticated = async (loggedInUser: OpsUserInfo) => {
    setUser(loggedInUser);
    await refreshBootstrap();
  };

  const handleLogout = async () => {
    await fetch("/api/ops/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setUser(null);
    setData(null);
  };

  const runAction = async (
    action: string,
    args: Record<string, unknown>,
    successMsg?: string
  ) => {
    setBusyAction(action);
    try {
      const res = await fetch("/api/ops/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, args }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setNotice({
          tone: "error",
          text: json?.error || `Action ${action} failed.`,
        });
        return null;
      }
      if (successMsg) {
        setNotice({ tone: "success", text: successMsg });
      }
      await refreshBootstrap();
      return json.data;
    } catch {
      setNotice({ tone: "error", text: "Network error executing action." });
      return null;
    } finally {
      setBusyAction(null);
    }
  };

  const handleCopy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(label);
      setTimeout(() => setCopiedKey((c) => (c === label ? null : c)), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const pendingReviews = useMemo(() => {
    if (!data) return [];
    const list: {
      entity: "hackathon" | "dispatch" | "news";
      id: string;
      title: string;
      subtitle: string;
      createdBy: string;
      status: string;
      confidence?: number;
      raw: Dispatch | NewsItem | Hackathon;
    }[] = [];

    for (const h of data.hackathons) {
      if (!h.is_published) {
        list.push({
          entity: "hackathon",
          id: h.id,
          title: h.title,
          subtitle: `${h.organizer} · ${h.prize_display}`,
          createdBy: h.created_by || "ingestion",
          status: h.approval_status || "PENDING_REVIEW",
          confidence: h.confidence_score,
          raw: h,
        });
      }
    }

    for (const d of data.dispatches) {
      if (d.is_published === false) {
        list.push({
          entity: "dispatch",
          id: d.id,
          title: d.title,
          subtitle: `Issue ${d.issue_number} · ${d.category}`,
          createdBy: d.created_by || "admin",
          status: d.approval_status || "PENDING_REVIEW",
          raw: d,
        });
      }
    }

    for (const n of data.news) {
      if (!n.is_published) {
        list.push({
          entity: "news",
          id: n.id,
          title: n.title,
          subtitle: `${n.source_name} · Impact ${n.impact_score}/100`,
          createdBy: n.created_by || "ingestion",
          status: n.approval_status || "PENDING_REVIEW",
          raw: n,
        });
      }
    }

    return list;
  }, [data]);

  if (!user) {
    return (
      <OpsAuthScreen
        hasAdmins={hasAdmins}
        requiresInviteCode={requiresInviteCode}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08080A] text-[#F4F3EF]">
        <div className="flex items-center gap-3 text-sm text-[#A1A1AA]">
          <Loader2 className="h-5 w-5 animate-spin text-[#FF3B1F]" />
          <span>Loading G-Gravitator Command Center...</span>
        </div>
      </div>
    );
  }

  const openLabEditor = (proj: LabProject | null) => {
    setEditingLab(proj);
    setLabCode(proj?.code || "");
    setLabDivision(proj?.division || "SKUNKWORKS");
    setLabName(proj?.name || "");
    setLabTagline(proj?.tagline || "");
    setLabDesc(proj?.description || "");
    setLabStatus(proj?.status || "PROTOTYPING");
    setLabStack(proj?.tech_stack?.join(", ") || "Next.js, TypeScript, Gemini 3.8 Flash");
    setLabLiveUrl(proj?.live_url || "");
    setLabRepoUrl(proj?.repo_url || "");
    setLabScore(
      proj?.scorecard || {
        pain_intensity: 4,
        willingness_to_pay: 4,
        technical_moat: 4,
        distribution_hook: 4,
        lean_maintainability: 4,
      }
    );
    setShowLabForm(true);
  };

  const handleSaveLab = async (e: React.FormEvent) => {
    e.preventDefault();
    const stackArr = labStack
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (editingLab) {
      await runAction(
        "update_lab_project",
        {
          id: editingLab.id,
          division: labDivision,
          name: labName,
          tagline: labTagline,
          description: labDesc,
          status: labStatus,
          tech_stack: stackArr,
          live_url: labLiveUrl,
          repo_url: labRepoUrl,
          scorecard: labScore,
        },
        `Updated ${labName}`
      );
    } else {
      await runAction(
        "create_lab_project",
        {
          code: labCode,
          division: labDivision,
          name: labName,
          tagline: labTagline,
          description: labDesc,
          status: labStatus,
          tech_stack: stackArr,
          live_url: labLiveUrl,
          repo_url: labRepoUrl,
          scorecard: labScore,
        },
        `Created project ${labCode}`
      );
    }
    setShowLabForm(false);
  };

  const handleApproveAndGrantDirect = async (
    entity: "hackathon" | "dispatch" | "news",
    id: string
  ) => {
    await runAction("approve_content", { entity, id });
    const permKey =
      entity === "dispatch"
        ? "can_publish_directly_journal"
        : entity === "news"
        ? "can_publish_directly_news"
        : "can_publish_directly_hackathons";
    await runAction(
      "update_ai_permissions",
      { patch: { [permKey]: true } },
      `Approved post and enabled direct AI publishing for ${entity}.`
    );
  };

  const togglePermission = async (
    key: keyof AiPermissionsPolicy,
    value: boolean
  ) => {
    await runAction(
      "update_ai_permissions",
      { patch: { [key]: value } },
      `Updated ${key} = ${value}`
    );
  };

  const handleDownloadSubscribersCsv = () => {
    const rows = [
      ["email", "source", "created_at"],
      ...data.subscribers.map((s) => [s.email, s.source, s.created_at]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "g-gravitator-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const navItems: {
    id: ConsoleTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    {
      id: "OVERVIEW",
      label: "Review & Overview",
      icon: Activity,
      badge: pendingReviews.length || undefined,
    },
    {
      id: "JOURNAL",
      label: "Journal Dispatches",
      icon: FileText,
      badge: data.dispatches.length,
    },
    {
      id: "NEWS",
      label: "Orbital Wire",
      icon: Newspaper,
      badge: data.news.length,
    },
    {
      id: "HACKATHONS",
      label: "Hackathons",
      icon: Radar,
      badge: data.hackathons.length,
    },
    {
      id: "LABS",
      label: "Labs & Skunkworks",
      icon: FlaskConical,
      badge: data.labs.length,
    },
    {
      id: "CRM",
      label: "CRM & Audience",
      icon: Users,
      badge: data.inquiries.length + data.orbit.length,
    },
    {
      id: "MEDIA",
      label: "Media Studio",
      icon: ImageIcon,
      badge: data.mediaAssets.length || undefined,
    },
    {
      id: "PERMISSIONS",
      label: "AI Permissions",
      icon: Shield,
    },
    {
      id: "MCP_TEAM",
      label: "MCP, Team & Audit",
      icon: Plug,
    },
  ];

  const filteredAudit = data.auditLogs.filter((l) =>
    auditFilter === "ALL" ? true : l.actor_type === auditFilter
  );

  const mcpClientConfigSnippet = JSON.stringify(
    {
      mcpServers: {
        "g-gravitator-ops": {
          url: data.mcpEndpointUrl,
          headers: {
            Authorization: "Bearer YOUR_MCP_TOKEN",
          },
        },
      },
    },
    null,
    2
  );

  return (
    <div className="min-h-screen bg-[#08080A] text-[#F4F3EF]">
      {/* Top Command Bar */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#08080A]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF3B1F] font-mono text-xs font-bold text-[#08080A]">
              GG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base font-bold tracking-tight text-[#F4F3EF]">
                  G-Gravitator Command
                </h1>
                <span className="rounded-full border border-[#10B981]/35 bg-[#10B981]/12 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#34D399]">
                  {user.role}
                </span>
              </div>
              <p className="text-[11px] text-[#8B8B94]">
                Signed in as {user.name} ({user.email})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-[#FF3B1F] px-4 text-xs font-semibold text-[#08080A] transition-colors hover:bg-[#FF5238]"
            >
              <Bot className="h-4 w-4" />
              <span>AI &amp; Voice Operator</span>
              <Mic className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              disabled={busyAction !== null}
              onClick={() =>
                void runAction(
                  "run_hackathon_ingestion",
                  {},
                  "Live hackathon ingestion completed."
                )
              }
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.1] bg-[#141418] px-3.5 text-xs font-medium text-[#D4D4D8] hover:border-white/[0.22] hover:text-[#F4F3EF] disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-[#FF6B54] ${
                  busyAction === "run_hackathon_ingestion" ? "animate-spin" : ""
                }`}
              />
              <span>Sync Hackathons</span>
            </button>

            <button
              type="button"
              disabled={busyAction !== null}
              onClick={() =>
                void runAction(
                  "run_news_ingestion",
                  {},
                  "Orbital Wire news ingestion completed."
                )
              }
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.1] bg-[#141418] px-3.5 text-xs font-medium text-[#D4D4D8] hover:border-white/[0.22] hover:text-[#F4F3EF] disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-[#34D399] ${
                  busyAction === "run_news_ingestion" ? "animate-spin" : ""
                }`}
              />
              <span>Sync Wire</span>
            </button>

            <button
              type="button"
              onClick={() => void refreshBootstrap()}
              title="Refresh data"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/[0.1] bg-[#141418] text-[#A1A1AA] hover:text-[#F4F3EF]"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loadingBootstrap ? "animate-spin" : ""}`}
              />
            </button>

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.1] px-3.5 text-xs font-medium text-[#A1A1AA] hover:border-white/[0.22] hover:text-[#F4F3EF]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1480px] grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:px-8">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 xl:col-span-2">
          <nav
            aria-label="Command sections"
            className="flex gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex shrink-0 cursor-pointer items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left text-xs font-medium transition-colors ${
                    active
                      ? "bg-[#F4F3EF] font-semibold text-[#08080A]"
                      : "border border-white/[0.06] bg-[#111114] text-[#A1A1AA] hover:border-white/[0.14] hover:text-[#F4F3EF] lg:border-transparent lg:bg-transparent"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
                        active
                          ? "bg-black/15 text-[#08080A]"
                          : item.id === "OVERVIEW" && (item.badge ?? 0) > 0
                          ? "bg-[#FF3B1F] font-semibold text-[#08080A]"
                          : "bg-white/[0.08] text-[#D4D4D8]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Workspace */}
        <main className="min-w-0 space-y-6 lg:col-span-9 xl:col-span-10">
          {notice && (
            <div
              role={notice.tone === "error" ? "alert" : "status"}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                notice.tone === "error"
                  ? "border-[#FF3B1F]/40 bg-[#FF3B1F]/12 text-[#FF8A7A]"
                  : notice.tone === "success"
                  ? "border-[#10B981]/35 bg-[#10B981]/12 text-[#34D399]"
                  : "border-white/[0.1] bg-[#141418] text-[#D4D4D8]"
              }`}
            >
              <div className="flex items-center gap-2">
                {notice.tone === "error" ? (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                )}
                <span>{notice.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="rounded-full p-1 opacity-75 hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW & MODERATION REVIEW QUEUE */}
          {activeTab === "OVERVIEW" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  { label: "Pending Review", val: pendingReviews.length, accent: "#FF3B1F" },
                  { label: "Journal Issues", val: data.dispatches.length, accent: "#F4F3EF" },
                  { label: "Orbital Wire", val: data.news.length, accent: "#10B981" },
                  { label: "Hackathons", val: data.hackathons.length, accent: "#3B82F6" },
                  { label: "B2B Inquiries", val: data.inquiries.length, accent: "#F59E0B" },
                  { label: "Orbit + Subs", val: data.orbit.length + data.subscribers.length, accent: "#A855F7" },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="rounded-2xl border border-white/[0.08] bg-[#111114] p-4"
                  >
                    <div className="text-xs text-[#8B8B94]">{k.label}</div>
                    <div
                      className="font-mono mt-1.5 text-2xl font-bold"
                      style={{ color: k.accent }}
                    >
                      {k.val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Create + AI Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#111114] p-5">
                <div>
                  <h2 className="font-display text-lg font-semibold text-[#F4F3EF]">
                    Design, Research &amp; Publish
                  </h2>
                  <p className="mt-1 text-xs text-[#A1A1AA]">
                    Create richly formatted posts with custom colors &amp; AI visuals, or command your AI Operator by voice.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDesignerState({ entity: "dispatch", existing: null })
                    }
                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-[#F4F3EF] px-4 text-xs font-semibold text-[#08080A] hover:bg-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Journal Dispatch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDesignerState({ entity: "news", existing: null })
                    }
                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#18181D] px-4 text-xs font-medium text-[#F4F3EF]"
                  >
                    <Plus className="h-3.5 w-3.5 text-[#34D399]" />
                    <span>New Wire Post</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDesignerState({ entity: "hackathon", existing: null })
                    }
                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#18181D] px-4 text-xs font-medium text-[#F4F3EF]"
                  >
                    <Plus className="h-3.5 w-3.5 text-[#FF6B54]" />
                    <span>New Hackathon</span>
                  </button>
                </div>
              </div>

              {/* Pending Review Queue */}
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-[#F4F3EF]">
                      Approval &amp; Review Queue ({pendingReviews.length})
                    </h2>
                    <p className="text-xs text-[#8B8B94]">
                      Community-submitted hackathons and AI-authored posts wait here until you approve them or allow direct AI publishing.
                    </p>
                  </div>
                </div>

                {pendingReviews.length === 0 ? (
                  <div className="rounded-2xl border border-white/[0.08] bg-[#111114] p-8 text-center text-sm text-[#8B8B94]">
                    All submissions and AI drafts have been reviewed.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingReviews.map((item) => (
                      <div
                        key={`${item.entity}-${item.id}`}
                        className="flex flex-col justify-between gap-4 rounded-2xl border border-[#FF3B1F]/35 bg-[#FF3B1F]/[0.05] p-5 lg:flex-row lg:items-center"
                      >
                        <div className="min-w-0 max-w-2xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#FF3B1F] px-2.5 py-0.5 text-[11px] font-semibold uppercase text-[#08080A]">
                              {item.entity}
                            </span>
                            <span className="rounded-full border border-white/[0.12] bg-[#18181D] px-2.5 py-0.5 text-[11px] font-medium text-[#D4D4D8]">
                              By {item.createdBy}
                            </span>
                            <span className="font-mono text-[11px] text-[#FBBF24]">
                              {item.status}
                            </span>
                            {item.confidence !== undefined && (
                              <span className="font-mono text-[11px] text-[#8B8B94]">
                                Confidence {Math.round(item.confidence * 100)}%
                              </span>
                            )}
                          </div>
                          <h3 className="font-display mt-2.5 text-lg font-semibold text-[#F4F3EF]">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-xs text-[#A1A1AA]">{item.subtitle}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void runAction(
                                "approve_content",
                                { entity: item.entity, id: item.id },
                                `Approved & published ${item.title}`
                              )
                            }
                            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-[#10B981] px-4 text-xs font-semibold text-[#08080A] hover:bg-[#34D399]"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve &amp; Publish</span>
                          </button>

                          {(item.createdBy === "ai_assistant" ||
                            item.createdBy === "mcp") && (
                            <button
                              type="button"
                              onClick={() =>
                                void handleApproveAndGrantDirect(item.entity, item.id)
                              }
                              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[#34D399]/40 bg-[#10B981]/15 px-3.5 text-xs font-medium text-[#34D399] hover:bg-[#10B981]/25"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>Approve + Allow AI Direct Post</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setDesignerState({
                                entity: item.entity,
                                existing: item.raw,
                              })
                            }
                            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#18181D] px-3.5 text-xs font-medium text-[#F4F3EF]"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Design / Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void runAction(
                                "reject_content",
                                { entity: item.entity, id: item.id },
                                `Marked ${item.title} rejected`
                              )
                            }
                            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.1] bg-[#18181D] px-3.5 text-xs font-medium text-[#FBBF24]"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void runAction(
                                item.entity === "dispatch"
                                  ? "delete_dispatch"
                                  : item.entity === "news"
                                  ? "delete_news_item"
                                  : "delete_hackathon",
                                { id: item.id },
                                `Deleted ${item.title}`
                              )
                            }
                            className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-full border border-[#FF3B1F]/30 bg-[#FF3B1F]/10 px-3 text-xs font-medium text-[#FF8A7A]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 2: JOURNAL DISPATCHES */}
          {activeTab === "JOURNAL" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-[#F4F3EF]">
                    Journal Lab Dispatches ({data.dispatches.length})
                  </h2>
                  <p className="text-xs text-[#8B8B94]">
                    Design rich long-form dispatches with cover images, accent colors, callouts, and links.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDesignerState({ entity: "dispatch", existing: null })
                  }
                  className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[#FF3B1F] px-5 text-xs font-semibold text-[#08080A] hover:bg-[#FF5238]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Design New Dispatch</span>
                </button>
              </div>

              <div className="space-y-3">
                {data.dispatches.map((d) => {
                  const published = d.is_published !== false;
                  return (
                    <div
                      key={d.id}
                      className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 lg:flex-row lg:items-center ${
                        published
                          ? "border-white/[0.08] bg-[#111114]"
                          : "border-[#FF3B1F]/35 bg-[#FF3B1F]/[0.05]"
                      }`}
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        {d.cover_image_url && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={d.cover_image_url}
                            alt={d.title}
                            className="hidden h-16 w-24 shrink-0 rounded-xl border border-white/[0.1] object-cover sm:block"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#08080A]"
                              style={{
                                backgroundColor: d.design?.accent_color || "#FF3B1F",
                              }}
                            >
                              Issue {d.issue_number}
                            </span>
                            <span className="rounded-full border border-white/[0.1] bg-[#18181D] px-2.5 py-0.5 text-[11px] text-[#D4D4D8]">
                              {d.category}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                                published
                                  ? "bg-[#10B981]/15 text-[#34D399]"
                                  : "bg-[#FF3B1F] text-[#08080A]"
                              }`}
                            >
                              {published ? "Published" : d.approval_status || "Pending"}
                            </span>
                            {d.created_by && (
                              <span className="text-[11px] text-[#8B8B94]">
                                by {d.created_by}
                              </span>
                            )}
                          </div>
                          <h3 className="font-display mt-2 text-base font-semibold text-[#F4F3EF]">
                            {d.title}
                          </h3>
                          <p className="mt-1 line-clamp-1 text-xs text-[#A1A1AA]">
                            {d.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <a
                          href={`/journal/${d.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center gap-1 rounded-full border border-white/[0.1] bg-[#18181D] px-3 text-xs text-[#D4D4D8] hover:text-[#F4F3EF]"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            void runAction("update_dispatch", {
                              id: d.id,
                              is_featured: !d.is_featured,
                            })
                          }
                          title="Toggle featured"
                          className={`inline-flex h-9 cursor-pointer items-center gap-1 rounded-full border px-3 text-xs ${
                            d.is_featured
                              ? "border-[#F59E0B]/40 bg-[#F59E0B]/15 text-[#FBBF24]"
                              : "border-white/[0.1] bg-[#18181D] text-[#A1A1AA]"
                          }`}
                        >
                          <Star className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDesignerState({ entity: "dispatch", existing: d })
                          }
                          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.1] bg-[#18181D] px-3.5 text-xs font-medium text-[#F4F3EF]"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Design / Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              published ? "revoke_approval" : "approve_content",
                              { entity: "dispatch", id: d.id },
                              published
                                ? "Approval revoked (unpublished)."
                                : "Dispatch approved & published."
                            )
                          }
                          className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold ${
                            published
                              ? "border border-white/[0.1] bg-[#18181D] text-[#D4D4D8]"
                              : "bg-[#10B981] text-[#08080A]"
                          }`}
                        >
                          {published ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5" />
                              <span>Revoke Approval</span>
                            </>
                          ) : (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>Approve</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              "delete_dispatch",
                              { id: d.id },
                              `Deleted dispatch ${d.issue_number}`
                            )
                          }
                          className="inline-flex h-9 cursor-pointer items-center rounded-full border border-[#FF3B1F]/30 bg-[#FF3B1F]/10 px-3 text-xs text-[#FF8A7A]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ORBITAL WIRE NEWS */}
          {activeTab === "NEWS" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-[#F4F3EF]">
                    Orbital Wire News ({data.news.length})
                  </h2>
                  <p className="text-xs text-[#8B8B94]">
                    Create, design, pin, approve, revoke, or bulk-clean stale signals.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void runAction(
                        "remove_old_posts",
                        { entity: "news", older_than_days: 14 },
                        "Cleaned stale Orbital Wire items older than 14 days."
                      )
                    }
                    className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#141418] px-4 text-xs font-medium text-[#D4D4D8] hover:border-[#FF3B1F]/40 hover:text-[#FF8A7A]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clean Old (&gt;14d)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDesignerState({ entity: "news", existing: null })
                    }
                    className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-[#FF3B1F] px-5 text-xs font-semibold text-[#08080A] hover:bg-[#FF5238]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Wire Post</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {data.news.map((n) => (
                  <div
                    key={n.id}
                    className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 lg:flex-row lg:items-center ${
                      n.is_published
                        ? "border-white/[0.08] bg-[#111114]"
                        : "border-[#FF3B1F]/35 bg-[#FF3B1F]/[0.05]"
                    }`}
                  >
                    <div className="min-w-0 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/[0.1] bg-[#18181D] px-2.5 py-0.5 text-[11px] font-medium text-[#D4D4D8]">
                          {n.category}
                        </span>
                        <span className="text-xs text-[#8B8B94]">{n.source_name}</span>
                        <span className="font-mono text-xs text-[#34D399]">
                          Impact {n.impact_score}/100
                        </span>
                        {n.is_pinned && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FF3B1F] px-2.5 py-0.5 text-[11px] font-semibold text-[#08080A]">
                            <Pin className="h-3 w-3" />
                            <span>Pinned</span>
                          </span>
                        )}
                        {!n.is_published && (
                          <span className="rounded-full bg-[#FF3B1F]/20 px-2.5 py-0.5 text-[11px] font-medium text-[#FF8A7A]">
                            {n.approval_status || "Pending Review"}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 text-base font-semibold text-[#F4F3EF]">
                        {n.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-[#A1A1AA]">
                        {n.gravity_take}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void runAction("update_news_item", {
                            id: n.id,
                            is_pinned: !n.is_pinned,
                          })
                        }
                        className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold ${
                          n.is_pinned
                            ? "border-[#FF3B1F] bg-[#FF3B1F] text-[#08080A]"
                            : "border-white/[0.1] bg-[#18181D] text-[#D4D4D8]"
                        }`}
                      >
                        <Pin className="h-3.5 w-3.5" />
                        <span>{n.is_pinned ? "Unpin" : "Pin"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDesignerState({ entity: "news", existing: n })
                        }
                        className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-full border border-white/[0.1] bg-[#18181D] px-3.5 text-xs text-[#F4F3EF]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Design</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void runAction(
                            n.is_published ? "revoke_approval" : "approve_content",
                            { entity: "news", id: n.id },
                            n.is_published
                              ? "Approval revoked."
                              : "News item approved & published."
                          )
                        }
                        className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold ${
                          n.is_published
                            ? "border border-white/[0.1] bg-[#18181D] text-[#D4D4D8]"
                            : "bg-[#10B981] text-[#08080A]"
                        }`}
                      >
                        {n.is_published ? "Revoke Approval" : "Approve"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void runAction(
                            "delete_news_item",
                            { id: n.id },
                            "Deleted news item."
                          )
                        }
                        className="inline-flex h-9 cursor-pointer items-center rounded-full border border-[#FF3B1F]/30 bg-[#FF3B1F]/10 px-3 text-xs text-[#FF8A7A]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: HACKATHONS */}
          {activeTab === "HACKATHONS" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-[#F4F3EF]">
                    Hackathons ({data.hackathons.length})
                  </h2>
                  <p className="text-xs text-[#8B8B94]">
                    Approve community/AI hackathons, assign OXAKALABS squads, design visual cards, or clean expired events.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void runAction(
                        "remove_old_posts",
                        { entity: "hackathons", older_than_days: 0 },
                        "Removed expired hackathons."
                      )
                    }
                    className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#141418] px-4 text-xs font-medium text-[#D4D4D8] hover:border-[#FF3B1F]/40 hover:text-[#FF8A7A]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clean Expired</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDesignerState({ entity: "hackathon", existing: null })
                    }
                    className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-[#FF3B1F] px-5 text-xs font-semibold text-[#08080A] hover:bg-[#FF5238]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Hackathon</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {data.hackathons.map((h) => (
                  <div
                    key={h.id}
                    className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 lg:flex-row lg:items-center ${
                      h.is_published
                        ? "border-white/[0.08] bg-[#111114]"
                        : "border-[#FF3B1F]/35 bg-[#FF3B1F]/[0.05]"
                    }`}
                  >
                    <div className="min-w-0 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            h.is_published
                              ? "border border-[#10B981]/30 bg-[#10B981]/15 text-[#34D399]"
                              : "bg-[#FF3B1F] text-[#08080A]"
                          }`}
                        >
                          {h.is_published ? "Published" : h.approval_status || "Pending Review"}
                        </span>
                        <span className="font-mono text-[11px] text-[#8B8B94]">
                          {h.created_by || "ingestion"} · Confidence {Math.round(h.confidence_score * 100)}%
                        </span>
                      </div>
                      <h3 className="font-display mt-2 text-base font-semibold text-[#F4F3EF]">
                        {h.title}
                      </h3>
                      <p className="mt-1 text-xs text-[#A1A1AA]">
                        {h.organizer} · <span className="font-mono text-[#34D399]">{h.prize_display}</span> · Deadline{" "}
                        {formatUtc(h.deadline_at)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <select
                        aria-label="OXAKALABS status"
                        value={h.oxakalabs_status}
                        onChange={(e) =>
                          void runAction("update_hackathon", {
                            id: h.id,
                            oxakalabs_status: e.target.value as OxakalabsStatus,
                          })
                        }
                        className="h-9 rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF]"
                      >
                        <option value="NONE">OXA None</option>
                        <option value="SCOUTING">OXA Scouting</option>
                        <option value="SQUAD_DEPLOYED">OXA Deployed</option>
                        <option value="SUBMITTED">OXA Submitted</option>
                        <option value="WON">OXA Won</option>
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          setDesignerState({ entity: "hackathon", existing: h })
                        }
                        className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-full border border-white/[0.1] bg-[#18181D] px-3.5 text-xs text-[#F4F3EF]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Design</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void runAction(
                            h.is_published ? "revoke_approval" : "approve_content",
                            { entity: "hackathon", id: h.id },
                            h.is_published
                              ? "Approval revoked."
                              : "Hackathon approved & published."
                          )
                        }
                        className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold ${
                          h.is_published
                            ? "border border-white/[0.1] bg-[#18181D] text-[#D4D4D8]"
                            : "bg-[#10B981] text-[#08080A]"
                        }`}
                      >
                        {h.is_published ? "Revoke Approval" : "Approve"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void runAction(
                            "delete_hackathon",
                            { id: h.id },
                            "Deleted hackathon."
                          )
                        }
                        className="inline-flex h-9 cursor-pointer items-center rounded-full border border-[#FF3B1F]/30 bg-[#FF3B1F]/10 px-3 text-xs text-[#FF8A7A]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: LABS & SKUNKWORKS */}
          {activeTab === "LABS" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-[#F4F3EF]">
                    Labs &amp; OXAKALABS Skunkworks ({data.labs.length})
                  </h2>
                  <p className="text-xs text-[#8B8B94]">
                    Create, promote, score (25-pt Graduation Scorecard), or retire projects across G-XX and OXA-XX.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openLabEditor(null)}
                  className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-[#FF3B1F] px-5 text-xs font-semibold text-[#08080A]"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Lab / Skunkworks</span>
                </button>
              </div>

              {showLabForm && (
                <form
                  onSubmit={handleSaveLab}
                  className="space-y-4 rounded-2xl border border-[#FF3B1F]/35 bg-[#111114] p-5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-semibold">
                      {editingLab ? `Edit ${editingLab.code}` : "Create Project"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowLabForm(false)}
                      className="text-xs text-[#8B8B94] hover:text-[#F4F3EF]"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <input
                      type="text"
                      required
                      disabled={Boolean(editingLab)}
                      value={labCode}
                      onChange={(e) => setLabCode(e.target.value)}
                      placeholder="Code (e.g. G-05 or OXA-07)"
                      className="h-10 rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF]"
                    />
                    <select
                      value={labDivision}
                      onChange={(e) => setLabDivision(e.target.value as LabDivision)}
                      className="h-10 rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF]"
                    >
                      <option value="LABS">G-Gravitator LABS</option>
                      <option value="SKUNKWORKS">OXAKALABS SKUNKWORKS</option>
                    </select>
                    <select
                      value={labStatus}
                      onChange={(e) =>
                        setLabStatus(e.target.value as LabProjectStatus)
                      }
                      className="h-10 rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF]"
                    >
                      <option value="CONCEPT">CONCEPT</option>
                      <option value="PROTOTYPING">PROTOTYPING</option>
                      <option value="R&D">R&amp;D</option>
                      <option value="SKUNKWORKS CANDIDATE">SKUNKWORKS CANDIDATE</option>
                      <option value="BETA">BETA</option>
                      <option value="LIVE">LIVE</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                    <input
                      type="text"
                      required
                      value={labName}
                      onChange={(e) => setLabName(e.target.value)}
                      placeholder="Project Name"
                      className="h-10 rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF]"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={labTagline}
                    onChange={(e) => setLabTagline(e.target.value)}
                    placeholder="Concise one-line tagline"
                    className="h-10 w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF]"
                  />
                  <textarea
                    rows={3}
                    required
                    value={labDesc}
                    onChange={(e) => setLabDesc(e.target.value)}
                    placeholder="Technical description"
                    className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] p-3 text-xs text-[#F4F3EF]"
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <input
                      type="text"
                      value={labStack}
                      onChange={(e) => setLabStack(e.target.value)}
                      placeholder="Tech stack (comma-separated)"
                      className="h-10 rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF]"
                    />
                    <input
                      type="url"
                      value={labLiveUrl}
                      onChange={(e) => setLabLiveUrl(e.target.value)}
                      placeholder="Live URL (optional)"
                      className="h-10 rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF]"
                    />
                    <input
                      type="url"
                      value={labRepoUrl}
                      onChange={(e) => setLabRepoUrl(e.target.value)}
                      placeholder="Repo URL (optional)"
                      className="h-10 rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF]"
                    />
                  </div>

                  {/* 25-pt Scorecard */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {(
                      [
                        ["pain_intensity", "Pain (1-5)"],
                        ["willingness_to_pay", "WTP (1-5)"],
                        ["technical_moat", "Moat (1-5)"],
                        ["distribution_hook", "Distrib (1-5)"],
                        ["lean_maintainability", "Lean (1-5)"],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-[11px] text-[#A1A1AA]">
                          {label}
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={labScore[key]}
                          onChange={(e) =>
                            setLabScore((s) => ({
                              ...s,
                              [key]: Math.min(5, Math.max(1, Number(e.target.value) || 1)),
                            }))
                          }
                          className="mt-1 h-9 w-full rounded-xl border border-white/[0.1] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF]"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-10 cursor-pointer items-center rounded-full bg-[#FF3B1F] px-5 text-xs font-semibold text-[#08080A]"
                  >
                    {editingLab ? "Save Project" : "Create Project"}
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {data.labs.map((p) => {
                  const total = p.scorecard
                    ? p.scorecard.pain_intensity +
                      p.scorecard.willingness_to_pay +
                      p.scorecard.technical_moat +
                      p.scorecard.distribution_hook +
                      p.scorecard.lean_maintainability
                    : null;
                  return (
                    <div
                      key={p.id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#111114] p-5"
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-[#F4F3EF] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#08080A]">
                              {p.code}
                            </span>
                            <span className="rounded-full border border-white/[0.1] bg-[#18181D] px-2.5 py-0.5 text-[11px] text-[#D4D4D8]">
                              {p.division} · {p.status}
                            </span>
                          </div>
                          {total !== null && (
                            <span className="font-mono text-xs text-[#34D399]">
                              {total}/25
                            </span>
                          )}
                        </div>
                        <h3 className="font-display mt-2.5 text-base font-semibold text-[#F4F3EF]">
                          {p.name}
                        </h3>
                        <p className="mt-1 text-xs text-[#A1A1AA]">{p.tagline}</p>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openLabEditor(p)}
                          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border border-white/[0.1] bg-[#18181D] px-3 text-xs text-[#F4F3EF]"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              "delete_lab_project",
                              { id: p.id },
                              `Deleted ${p.code}`
                            )
                          }
                          className="inline-flex h-8 cursor-pointer items-center rounded-full border border-[#FF3B1F]/30 bg-[#FF3B1F]/10 px-3 text-xs text-[#FF8A7A]"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: CRM & AUDIENCE */}
          {activeTab === "CRM" && (
            <div className="space-y-8">
              {/* Inquiries */}
              <section className="space-y-3">
                <h2 className="font-display text-xl font-semibold text-[#F4F3EF]">
                  B2B Systems Inquiries ({data.inquiries.length})
                </h2>
                {data.inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#111114] p-5 lg:flex-row lg:items-center"
                  >
                    <div className="max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#FF3B1F] px-2.5 py-0.5 text-[11px] font-semibold text-[#08080A]">
                          {inq.tier}
                        </span>
                        <span className="font-mono text-xs text-[#34D399]">
                          {inq.budget_range || "Custom"}
                        </span>
                        <span className="text-xs text-[#8B8B94]">
                          {inq.timeline || "Flexible"}
                        </span>
                      </div>
                      <h3 className="font-display mt-2 text-base font-semibold text-[#F4F3EF]">
                        {inq.name} ·{" "}
                        <span className="font-normal text-[#A1A1AA]">
                          {inq.company || "Independent"} ({inq.email})
                        </span>
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#A1A1AA]">
                        {inq.project_brief}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={inq.status}
                        onChange={(e) =>
                          void runAction("update_inquiry_status", {
                            id: inq.id,
                            status: e.target.value as InquiryStatus,
                          })
                        }
                        className="h-9 rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF]"
                      >
                        <option value="NEW">New</option>
                        <option value="REVIEWED">Reviewed</option>
                        <option value="DISCOVERY_CALL">Discovery Call</option>
                        <option value="CLOSED_WON">Closed Won</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          void runAction(
                            "delete_inquiry",
                            { id: inq.id },
                            "Deleted inquiry"
                          )
                        }
                        className="inline-flex h-9 cursor-pointer items-center rounded-full border border-[#FF3B1F]/30 bg-[#FF3B1F]/10 px-3 text-xs text-[#FF8A7A]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </section>

              {/* Orbit + Subscribers */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <section className="space-y-3">
                  <h2 className="font-display text-lg font-semibold text-[#F4F3EF]">
                    Orbit Applications ({data.orbit.length})
                  </h2>
                  {data.orbit.map((app) => (
                    <div
                      key={app.id}
                      className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#111114] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-[#F4F3EF]">
                            {app.full_name}
                          </div>
                          <div className="text-xs text-[#8B8B94]">
                            {app.email} · {app.track}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={app.status || "NEW"}
                            onChange={(e) =>
                              void runAction("update_orbit_application", {
                                id: app.id,
                                status: e.target.value as OrbitApplicationStatus,
                              })
                            }
                            className="h-8 rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-2.5 text-xs text-[#F4F3EF]"
                          >
                            <option value="NEW">New</option>
                            <option value="REVIEWING">Reviewing</option>
                            <option value="ACCEPTED">Accepted</option>
                            <option value="WAITLISTED">Waitlisted</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                          <button
                            type="button"
                            onClick={() =>
                              void runAction("delete_orbit_application", { id: app.id })
                            }
                            className="inline-flex h-8 cursor-pointer items-center rounded-full border border-[#FF3B1F]/30 bg-[#FF3B1F]/10 px-2.5 text-xs text-[#FF8A7A]"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-[#A1A1AA]">
                        {app.proof_of_work}
                      </p>
                    </div>
                  ))}
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-lg font-semibold text-[#F4F3EF]">
                      Newsletter Subscribers ({data.subscribers.length})
                    </h2>
                    <button
                      type="button"
                      onClick={handleDownloadSubscribersCsv}
                      className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#18181D] px-3 text-xs text-[#D4D4D8]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newSubEmail.trim()) return;
                      void runAction(
                        "add_newsletter_subscriber",
                        { email: newSubEmail.trim(), source: "admin" },
                        "Added subscriber"
                      ).then(() => setNewSubEmail(""));
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="email"
                      required
                      value={newSubEmail}
                      onChange={(e) => setNewSubEmail(e.target.value)}
                      placeholder="Add subscriber email..."
                      className="h-9 flex-1 rounded-xl border border-white/[0.12] bg-[#141418] px-3 text-xs text-[#F4F3EF]"
                    />
                    <button
                      type="submit"
                      className="h-9 cursor-pointer rounded-xl bg-[#F4F3EF] px-4 text-xs font-semibold text-[#08080A]"
                    >
                      Add
                    </button>
                  </form>

                  <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111114]">
                    <ul className="divide-y divide-white/[0.06]">
                      {data.subscribers.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between gap-2 px-4 py-3 text-xs"
                        >
                          <div>
                            <span className="text-[#F4F3EF]">{s.email}</span>
                            <span className="ml-2 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-[#A1A1AA]">
                              {s.source}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              void runAction("delete_newsletter_subscriber", {
                                id: s.id,
                              })
                            }
                            className="text-[#8B8B94] hover:text-[#FF8A7A]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* TAB 7: MEDIA STUDIO & LIBRARY */}
          {activeTab === "MEDIA" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-semibold text-[#F4F3EF]">
                  Media Studio &amp; Library ({data.mediaAssets.length})
                </h2>
                <p className="text-xs text-[#8B8B94]">
                  Generate AI images, import remote pictures by URL, upload files, copy URLs for posts, or download assets.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#111114] p-4">
                  <div className="text-xs font-semibold text-[#FF8A7A]">
                    1. Generate Visual (Gemini / Studio SVG)
                  </div>
                  <input
                    type="text"
                    value={mediaPrompt}
                    onChange={(e) => setMediaPrompt(e.target.value)}
                    placeholder="Describe image prompt..."
                    className="h-9 w-full rounded-xl border border-white/[0.1] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF]"
                  />
                  <button
                    type="button"
                    disabled={!mediaPrompt.trim() || busyAction !== null}
                    onClick={() =>
                      void runAction(
                        "generate_post_image",
                        { prompt: mediaPrompt, title: mediaPrompt },
                        "Image generated and saved to library."
                      ).then(() => setMediaPrompt(""))
                    }
                    className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#FF3B1F] text-xs font-semibold text-[#08080A] disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate &amp; Store</span>
                  </button>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#111114] p-4">
                  <div className="text-xs font-semibold text-[#34D399]">
                    2. Import Image From URL
                  </div>
                  <input
                    type="url"
                    value={mediaImportUrl}
                    onChange={(e) => setMediaImportUrl(e.target.value)}
                    placeholder="https://example.com/cover.png"
                    className="h-9 w-full rounded-xl border border-white/[0.1] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF]"
                  />
                  <button
                    type="button"
                    disabled={!mediaImportUrl.trim() || busyAction !== null}
                    onClick={() =>
                      void runAction(
                        "import_image_from_url",
                        { url: mediaImportUrl },
                        "Image imported into Media Library."
                      ).then(() => setMediaImportUrl(""))
                    }
                    className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#F4F3EF] text-xs font-semibold text-[#08080A] disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Import &amp; Host</span>
                  </button>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#111114] p-4">
                  <div className="text-xs font-semibold text-[#D4D4D8]">
                    3. Upload From Device
                  </div>
                  <input
                    ref={mediaUploadRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const reader = new FileReader();
                      reader.onload = async () => {
                        const res = await fetch("/api/ops/media", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "upload",
                            filename: f.name,
                            mimeType: f.type || "image/png",
                            base64Data: String(reader.result || ""),
                          }),
                        });
                        if (res.ok) {
                          setNotice({
                            tone: "success",
                            text: `Uploaded ${f.name}`,
                          });
                          await refreshBootstrap();
                        }
                      };
                      reader.readAsDataURL(f);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => mediaUploadRef.current?.click()}
                    className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-white/[0.15] bg-[#18181D] text-xs font-medium text-[#F4F3EF]"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Image File</span>
                  </button>
                  <p className="text-[11px] text-[#8B8B94]">
                    Stored securely and served via /api/media/[id]
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.mediaAssets.map((m) => (
                  <div
                    key={m.id}
                    className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111114]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.url}
                      alt={m.alt_text || m.filename}
                      className="h-44 w-full object-cover"
                    />
                    <div className="space-y-2 p-4">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate font-semibold text-[#F4F3EF]">
                          {m.filename}
                        </span>
                        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] uppercase text-[#A1A1AA]">
                          {m.source_type}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => void handleCopy(m.id, m.url)}
                          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border border-white/[0.1] bg-[#18181D] px-3 text-xs text-[#D4D4D8]"
                        >
                          <Copy className="h-3 w-3" />
                          <span>{copiedKey === m.id ? "Copied" : "Copy URL"}</span>
                        </button>
                        <a
                          href={`${m.url}?download=1`}
                          download={m.filename}
                          className="inline-flex h-8 items-center gap-1 rounded-full border border-white/[0.1] bg-[#18181D] px-3 text-xs text-[#34D399]"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download</span>
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              "delete_media_asset",
                              { id: m.id },
                              "Deleted media asset"
                            )
                          }
                          className="ml-auto inline-flex h-8 cursor-pointer items-center rounded-full border border-[#FF3B1F]/30 bg-[#FF3B1F]/10 px-2.5 text-xs text-[#FF8A7A]"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: AI PERMISSIONS & GOVERNANCE */}
          {activeTab === "PERMISSIONS" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-semibold text-[#F4F3EF]">
                  AI Permissions &amp; Approval Governance
                </h2>
                <p className="text-xs text-[#8B8B94]">
                  Control full system-wide AI execution parity, direct publishing vs. admin review queue, community hackathon gating, and MCP inheritance.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(
                  [
                    [
                      "ai_enabled",
                      "AI Operator Enabled",
                      "Allow the Admin AI Operator (voice + text) to execute commands.",
                    ],
                    [
                      "full_admin_parity",
                      "Full Admin Parity Mode",
                      "AI Assistant can perform any operational action an Admin performs.",
                    ],
                    [
                      "community_hackathons_require_approval",
                      "Require Approval for Community Hackathons",
                      "Publicly submitted hackathons stay in Pending Review until Admin or AI approves them.",
                    ],
                    [
                      "can_publish_directly_journal",
                      "AI Direct-Publish: Journal Dispatches",
                      "If OFF, AI-created dispatches go to Pending Review for Admin approval first.",
                    ],
                    [
                      "can_publish_directly_news",
                      "AI Direct-Publish: Orbital Wire News",
                      "If OFF, AI-created news posts go to Pending Review first.",
                    ],
                    [
                      "can_publish_directly_hackathons",
                      "AI Direct-Publish: Hackathons",
                      "If OFF, AI-created hackathons go to Pending Review first.",
                    ],
                    [
                      "can_create_posts",
                      "Create Posts (Journal / Wire / Hackathons)",
                      "Allow AI to draft and design new posts.",
                    ],
                    [
                      "can_edit_posts",
                      "Edit Existing Posts",
                      "Allow AI to modify copy, colors, images, and metadata.",
                    ],
                    [
                      "can_approve_posts",
                      "Approve Pending Posts",
                      "Allow AI to review and publish pending items.",
                    ],
                    [
                      "can_revoke_approval",
                      "Revoke Approval / Reject Posts",
                      "Allow AI to unpublish approved items back to review.",
                    ],
                    [
                      "can_delete_posts",
                      "Delete & Clean Old Posts",
                      "Allow AI to delete specific or expired posts.",
                    ],
                    [
                      "can_manage_labs",
                      "Manage Labs & Skunkworks",
                      "Allow AI to create, score, update, or delete Labs/Skunkworks projects.",
                    ],
                    [
                      "can_manage_inquiries",
                      "Manage B2B Inquiries",
                      "Allow AI to triage inquiry pipeline status or delete spam.",
                    ],
                    [
                      "can_manage_orbit_and_subscribers",
                      "Manage Orbit & Subscribers",
                      "Allow AI to review Orbit applicants and manage newsletter subscribers.",
                    ],
                    [
                      "can_trigger_ingestion",
                      "Trigger Live Ingestion Pipelines",
                      "Allow AI to run hackathon and news sync pipelines.",
                    ],
                    [
                      "can_web_research",
                      "Live Web Research & URL Inspection",
                      "Allow AI to search HN, arXiv, Devpost, Google, and read URLs.",
                    ],
                    [
                      "can_manage_media",
                      "Generate, Import & Delete Media",
                      "Allow AI to create cover art and import/manage images.",
                    ],
                    [
                      "mcp_enabled",
                      "External MCP HTTP Server Enabled",
                      "Allow external AI models to connect to /api/mcp.",
                    ],
                    [
                      "mcp_inherit_ai_permissions",
                      "MCP Tokens Inherit AI Policy",
                      "Apply these permission toggles to external MCP clients using inherit mode.",
                    ],
                  ] as [keyof AiPermissionsPolicy, string, string][]
                ).map(([key, label, desc]) => {
                  const enabled = Boolean(data.aiPermissions[key]);
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#111114] p-4"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#F4F3EF]">
                          {label}
                        </div>
                        <div className="mt-0.5 text-xs text-[#8B8B94]">{desc}</div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        onClick={() => void togglePermission(key, !enabled)}
                        className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                          enabled ? "bg-[#10B981]" : "bg-white/[0.15]"
                        }`}
                      >
                        <span
                          className={`block h-5 w-5 rounded-full bg-[#08080A] transition-transform ${
                            enabled ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 9: MCP, TEAM & AUDIT LOG */}
          {activeTab === "MCP_TEAM" && (
            <div className="space-y-8">
              {/* External MCP Endpoint */}
              <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#111114] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-[#F4F3EF]">
                      External MCP Server Endpoint
                    </h2>
                    <p className="mt-1 text-xs text-[#8B8B94]">
                      Connect Claude, Cursor, Antigravity, or custom AI agents from outside via JSON-RPC 2.0 HTTP MCP.
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 font-mono text-xs font-semibold ${
                      data.aiPermissions.mcp_enabled
                        ? "bg-[#10B981]/15 text-[#34D399]"
                        : "bg-[#FF3B1F]/15 text-[#FF8A7A]"
                    }`}
                  >
                    {data.aiPermissions.mcp_enabled ? "MCP ONLINE" : "MCP DISABLED"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.1] bg-[#0B0B0E] p-3">
                  <code className="flex-1 truncate font-mono text-xs text-[#34D399]">
                    {data.mcpEndpointUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => void handleCopy("mcp-url", data.mcpEndpointUrl)}
                    className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full bg-[#18181D] px-3 text-xs text-[#F4F3EF]"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedKey === "mcp-url" ? "Copied" : "Copy URL"}</span>
                  </button>
                </div>

                {/* Create Token */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const res = (await runAction(
                      "create_mcp_token",
                      {
                        name: mcpTokenName || "External AI Agent",
                        permissions_mode: mcpTokenMode,
                      },
                      "Created new MCP bearer token."
                    )) as { plaintextToken?: string } | null;
                    if (res?.plaintextToken) {
                      setNewPlaintextToken(res.plaintextToken);
                    }
                    setMcpTokenName("");
                  }}
                  className="flex flex-wrap gap-2"
                >
                  <input
                    type="text"
                    value={mcpTokenName}
                    onChange={(e) => setMcpTokenName(e.target.value)}
                    placeholder="Client name (e.g. Claude Desktop, Cursor)"
                    className="h-9 min-w-[200px] flex-1 rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF]"
                  />
                  <select
                    value={mcpTokenMode}
                    onChange={(e) =>
                      setMcpTokenMode(e.target.value as typeof mcpTokenMode)
                    }
                    className="h-9 rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF]"
                  >
                    <option value="inherit">Inherit AI Policy</option>
                    <option value="full">Full Admin Parity</option>
                    <option value="readonly">Read-Only</option>
                  </select>
                  <button
                    type="submit"
                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-[#FF3B1F] px-4 text-xs font-semibold text-[#08080A]"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>Issue MCP Token</span>
                  </button>
                </form>

                {newPlaintextToken && (
                  <div className="rounded-xl border border-[#10B981]/40 bg-[#10B981]/12 p-4 text-xs">
                    <div className="font-semibold text-[#34D399]">
                      Copy this token now (it will not be shown again):
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="flex-1 break-all rounded-lg bg-[#08080A] p-2 font-mono text-[#F4F3EF]">
                        {newPlaintextToken}
                      </code>
                      <button
                        type="button"
                        onClick={() => void handleCopy("mcp-tok", newPlaintextToken)}
                        className="h-8 cursor-pointer rounded-full bg-[#10B981] px-3 font-semibold text-[#08080A]"
                      >
                        {copiedKey === "mcp-tok" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}

                {data.mcpTokens.length > 0 && (
                  <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-[#0B0B0E]">
                    {data.mcpTokens.map((t) => (
                      <div
                        key={t.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-[#F4F3EF]">{t.name}</span>
                          <span className="ml-2 font-mono text-[#8B8B94]">
                            {t.prefix}...
                          </span>
                          <span className="ml-2 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-[#D4D4D8]">
                            {t.permissions_mode}
                          </span>
                          {!t.is_active && (
                            <span className="ml-2 text-[#FF8A7A]">Revoked</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {t.is_active && (
                            <button
                              type="button"
                              onClick={() =>
                                void runAction("revoke_mcp_token", { id: t.id })
                              }
                              className="text-xs text-[#FBBF24] hover:underline"
                            >
                              Revoke
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              void runAction("delete_mcp_token", { id: t.id })
                            }
                            className="text-xs text-[#FF8A7A] hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs text-[#A1A1AA]">
                    <span>MCP Client Config Snippet</span>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopy("mcp-cfg", mcpClientConfigSnippet)
                      }
                      className="text-[#F4F3EF] hover:underline"
                    >
                      {copiedKey === "mcp-cfg" ? "Copied JSON" : "Copy JSON"}
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#08080A] p-3 font-mono text-[11px] text-[#A1A1AA]">
                    {mcpClientConfigSnippet}
                  </pre>
                </div>
              </section>

              {/* Admin Team & Invites */}
              <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#111114] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-[#F4F3EF]">
                      Admin Operators &amp; Signup Invites
                    </h2>
                    <p className="text-xs text-[#8B8B94]">
                      Issue single-use invite codes for additional admin operators to sign up.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = (await runAction(
                        "create_invite",
                        {},
                        "Generated new admin invite code."
                      )) as { invite?: { code: string } } | null;
                      if (res?.invite?.code) {
                        setNewInviteCode(res.invite.code);
                      }
                    }}
                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-[#F4F3EF] px-4 text-xs font-semibold text-[#08080A]"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Generate Invite Code</span>
                  </button>
                </div>

                {newInviteCode && (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-[#10B981]/35 bg-[#10B981]/12 px-4 py-3 text-xs">
                    <span className="font-mono font-semibold text-[#34D399]">
                      Invite Code: {newInviteCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleCopy("inv", newInviteCode)}
                      className="rounded-full bg-[#10B981] px-3 py-1 font-semibold text-[#08080A]"
                    >
                      {copiedKey === "inv" ? "Copied" : "Copy"}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-[#0B0B0E]">
                    {data.adminUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between gap-2 px-4 py-3 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-[#F4F3EF]">
                            {u.name} ({u.role})
                          </div>
                          <div className="text-[#8B8B94]">{u.email}</div>
                        </div>
                        {u.id !== user.id && (
                          <button
                            type="button"
                            onClick={() =>
                              void runAction("delete_admin_user", { id: u.id })
                            }
                            className="text-[#FF8A7A] hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-[#0B0B0E]">
                    {data.adminInvites.length === 0 ? (
                      <div className="p-4 text-xs text-[#8B8B94]">
                        No active invite codes.
                      </div>
                    ) : (
                      data.adminInvites.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between gap-2 px-4 py-3 text-xs"
                        >
                          <div>
                            <code className="font-mono text-[#F4F3EF]">
                              {inv.code}
                            </code>
                            <div className="text-[11px] text-[#8B8B94]">
                              {inv.used_by
                                ? `Used by ${inv.used_by}`
                                : "Unused single-use code"}
                            </div>
                          </div>
                          {!inv.used_by && (
                            <button
                              type="button"
                              onClick={() =>
                                void runAction("revoke_invite", { id: inv.id })
                              }
                              className="text-[#FF8A7A] hover:underline"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>

              {/* Live Audit Log */}
              <section className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#111114] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold text-[#F4F3EF]">
                    Live Audit Log ({filteredAudit.length})
                  </h2>
                  <div className="flex gap-1.5">
                    {(["ALL", "admin", "ai_assistant", "mcp"] as const).map(
                      (f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setAuditFilter(f)}
                          className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium ${
                            auditFilter === f
                              ? "bg-[#F4F3EF] text-[#08080A]"
                              : "bg-[#18181D] text-[#A1A1AA]"
                          }`}
                        >
                          {f}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="max-h-96 divide-y divide-white/[0.06] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0B0B0E]">
                  {filteredAudit.length === 0 ? (
                    <div className="p-4 text-xs text-[#8B8B94]">
                      No audit entries recorded yet.
                    </div>
                  ) : (
                    filteredAudit.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="rounded-full bg-white/[0.07] px-2 py-0.5 font-mono text-[10px] text-[#D4D4D8]">
                            {entry.actor_type}
                          </span>
                          <span className="ml-2 font-medium text-[#F4F3EF]">
                            {entry.action}
                          </span>
                          <span className="ml-2 text-[#A1A1AA]">
                            {entry.summary}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-[#8B8B94]">
                          {entry.status} · {formatUtc(entry.created_at)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Post Designer Modal */}
      {designerState && (
        <PostDesignerModal
          entity={designerState.entity}
          existing={designerState.existing}
          mediaAssets={data.mediaAssets}
          onClose={() => setDesignerState(null)}
          onSaved={refreshBootstrap}
          onMediaUpdated={refreshBootstrap}
        />
      )}

      {/* AI & Human Voice Assistant Slide-Over */}
      <AiVoiceAssistantPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onMutated={refreshBootstrap}
      />
    </div>
  );
}
