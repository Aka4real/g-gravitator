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
  Search,
  Share2,
  Shield,
  Sparkles,
  Star,
  Trash2,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { JournalShareModal } from "@/components/journal/JournalShareModal";
import { AiVoiceAssistantPanel } from "@/components/ops/AiVoiceAssistantPanel";
import { McpGovernanceSection } from "@/components/ops/McpGovernanceSection";
import { OpsAuthScreen } from "@/components/ops/OpsAuthScreen";
import {
  PostDesignerModal,
  type DesignerEntityType,
} from "@/components/ops/PostDesignerModal";
import type { OpsBootstrapData, OpsUserInfo } from "@/components/ops/ops-types";
import { BrandMark } from "@/lib/brand/mark";
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

const PARITY_CAPABILITY_KEYS: (keyof AiPermissionsPolicy)[] = [
  "can_create_posts",
  "can_edit_posts",
  "can_approve_posts",
  "can_revoke_approval",
  "can_bulk_moderate",
  "can_delete_posts",
  "can_manage_labs",
  "can_manage_inquiries",
  "can_manage_orbit_and_subscribers",
  "can_trigger_ingestion",
  "can_web_research",
  "can_use_ai_drafter",
  "can_manage_media",
];

function formatUtc(iso: string | null | undefined): string {
  if (!iso) return "--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--";
  return d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

const SECONDARY_BTN =
  "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3.5 text-[13px] font-medium text-[var(--ink-primary)] transition-colors duration-150 hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-50";

const SEARCH_INPUT_CLASS =
  "h-10 w-52 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-surface)] pr-3.5 pl-9 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none";

const LAB_INPUT_CLASS =
  "mt-1.5 h-10 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3.5 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none";

export function OpsConsoleClient({
  initialUser,
  hasAdmins,
  requiresInviteCode,
  initialData,
}: OpsConsoleClientProps) {
  const [user, setUser] = useState<OpsUserInfo | null>(initialUser);
  const [hasAdminsState, setHasAdminsState] = useState(hasAdmins);
  const [requiresInviteState, setRequiresInviteState] =
    useState(requiresInviteCode);
  const [data, setData] = useState<OpsBootstrapData | null>(initialData);
  const [loadingBootstrap, setLoadingBootstrap] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ConsoleTab>("OVERVIEW");
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState<{
    tone: "info" | "success" | "error";
    text: string;
  } | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  // Two-step destructive delete confirmation
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Designer Modal
  const [designerState, setDesignerState] = useState<{
    entity: DesignerEntityType;
    existing: Dispatch | NewsItem | Hackathon | null;
  } | null>(null);
  const [shareDispatchTarget, setShareDispatchTarget] =
    useState<Dispatch | null>(null);

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
  const [labThesis, setLabThesis] = useState("");
  const [labArchNotes, setLabArchNotes] = useState("");
  const [labHackOrigin, setLabHackOrigin] = useState("");
  const [labStatus, setLabStatus] = useState<LabProjectStatus>("PROTOTYPING");
  const [labStack, setLabStack] = useState(
    "Next.js, TypeScript, Gemini 3.8 Flash"
  );
  const [labLiveUrl, setLabLiveUrl] = useState("");
  const [labRepoUrl, setLabRepoUrl] = useState("");
  const [labScore, setLabScore] = useState({
    pain_intensity: 4,
    willingness_to_pay: 4,
    technical_moat: 4,
    distribution_hook: 4,
    lean_maintainability: 4,
  });

  // Orbit notes draft state keyed by application ID
  const [orbitNotesDraft, setOrbitNotesDraft] = useState<
    Record<string, string>
  >({});

  // Media Tab Controls
  const [mediaPrompt, setMediaPrompt] = useState("");
  const [mediaImportUrl, setMediaImportUrl] = useState("");
  const [mediaUploading, setMediaUploading] = useState(false);
  const mediaUploadRef = useRef<HTMLInputElement | null>(null);

  // Subscriber add
  const [newSubEmail, setNewSubEmail] = useState("");

  // Invite & Audit State
  const [newInviteCode, setNewInviteCode] = useState<string | null>(null);
  const [auditFilter, setAuditFilter] = useState<
    "ALL" | "admin" | "ai_assistant" | "mcp"
  >("ALL");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const refreshBootstrap = async () => {
    setLoadingBootstrap(true);
    setBootstrapError(null);
    try {
      const res = await fetch("/api/ops/bootstrap", { cache: "no-store" });
      if (res.status === 401) {
        setUser(null);
        setData(null);
        return;
      }
      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        const msg =
          errJson?.error ||
          `Failed to load Command Center (HTTP ${res.status}).`;
        setBootstrapError(msg);
        setNotice({ tone: "error", text: msg });
        return;
      }
      const next = (await res.json()) as OpsBootstrapData;
      setData(next);
      setUser(next.user);
      setHasAdminsState(true);
      setRequiresInviteState(true);
    } catch {
      const msg = "Network error loading Command Center data.";
      setBootstrapError(msg);
      setNotice({ tone: "error", text: msg });
    } finally {
      setLoadingBootstrap(false);
    }
  };

  const handleAuthenticated = async (loggedInUser: OpsUserInfo) => {
    setUser(loggedInUser);
    setHasAdminsState(true);
    setRequiresInviteState(true);
    await refreshBootstrap();
  };

  const handleLogout = async () => {
    await fetch("/api/ops/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    }).catch(() => null);

    try {
      const statusRes = await fetch("/api/ops/auth", { cache: "no-store" });
      if (statusRes.ok) {
        const info = (await statusRes.json()) as {
          hasAdmins?: boolean;
          requiresInviteCode?: boolean;
        };
        if (typeof info.hasAdmins === "boolean")
          setHasAdminsState(info.hasAdmins);
        if (typeof info.requiresInviteCode === "boolean") {
          setRequiresInviteState(info.requiresInviteCode);
        }
      }
    } catch {
      setHasAdminsState(true);
      setRequiresInviteState(true);
    }

    setAiOpen(false);
    setDesignerState(null);
    setShareDispatchTarget(null);
    setUser(null);
    setData(null);
    setBootstrapError(null);
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

  const handleConfirmedDelete = (
    key: string,
    action: string,
    args: Record<string, unknown>,
    successMsg: string
  ) => {
    if (confirmDeleteKey === key) {
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
        confirmTimerRef.current = null;
      }
      setConfirmDeleteKey(null);
      void runAction(action, args, successMsg);
      return;
    }
    setConfirmDeleteKey(key);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(() => {
      setConfirmDeleteKey((curr) => (curr === key ? null : curr));
    }, 4500);
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

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredDispatches = useMemo(() => {
    if (!data) return [];
    if (!normalizedSearch) return data.dispatches;
    return data.dispatches.filter((d) =>
      `${d.issue_number} ${d.title} ${d.subtitle} ${d.category} ${d.tags.join(" ")}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [data, normalizedSearch]);

  const filteredNews = useMemo(() => {
    if (!data) return [];
    if (!normalizedSearch) return data.news;
    return data.news.filter((n) =>
      `${n.title} ${n.source_name} ${n.category} ${n.gravity_take}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [data, normalizedSearch]);

  const filteredHackathons = useMemo(() => {
    if (!data) return [];
    if (!normalizedSearch) return data.hackathons;
    return data.hackathons.filter((h) =>
      `${h.title} ${h.organizer} ${h.prize_display} ${h.location} ${h.themes.join(" ")}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [data, normalizedSearch]);

  const filteredLabs = useMemo(() => {
    if (!data) return [];
    if (!normalizedSearch) return data.labs;
    return data.labs.filter((p) =>
      `${p.code} ${p.name} ${p.tagline} ${p.division} ${p.status} ${p.tech_stack.join(" ")}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [data, normalizedSearch]);

  const filteredInquiries = useMemo(() => {
    if (!data) return [];
    if (!normalizedSearch) return data.inquiries;
    return data.inquiries.filter((i) =>
      `${i.name} ${i.email} ${i.company || ""} ${i.tier} ${i.project_brief}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [data, normalizedSearch]);

  const filteredOrbit = useMemo(() => {
    if (!data) return [];
    if (!normalizedSearch) return data.orbit;
    return data.orbit.filter((a) =>
      `${a.full_name} ${a.email} ${a.track} ${a.proof_of_work} ${a.notes || ""}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [data, normalizedSearch]);

  if (!user) {
    return (
      <OpsAuthScreen
        hasAdmins={hasAdminsState}
        requiresInviteCode={requiresInviteState}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--bg-canvas)] px-4 text-[var(--ink-primary)]">
        {bootstrapError ? (
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--accent)]/40 bg-[var(--bg-surface)] p-7 text-center">
            <AlertCircle className="mx-auto h-7 w-7 text-[#FF8A7A]" />
            <h2 className="font-display text-[20px] font-bold">
              Command Center unavailable
            </h2>
            <p className="text-[14px] text-[var(--ink-muted)]">
              {bootstrapError}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => void refreshBootstrap()}
                className="press-tactile inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-[13px] font-semibold text-[#07090D]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry</span>
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className={SECONDARY_BTN}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-[14px] text-[var(--ink-muted)]">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
            <span>Loading G-Gravitator Command Center...</span>
          </div>
        )}
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
    setLabThesis(proj?.thesis || "");
    setLabArchNotes(proj?.architecture_notes?.join("\n") || "");
    setLabHackOrigin(proj?.hackathon_origin || "");
    setLabStatus(proj?.status || "PROTOTYPING");
    setLabStack(
      proj?.tech_stack?.join(", ") || "Next.js, TypeScript, Gemini 3.8 Flash"
    );
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
    const archNotesArr = labArchNotes
      .split("\n")
      .map((line) => line.trim())
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
          thesis: labThesis.trim() || null,
          architecture_notes: archNotesArr,
          hackathon_origin: labHackOrigin.trim() || null,
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
          thesis: labThesis.trim() || null,
          architecture_notes: archNotesArr,
          hackathon_origin: labHackOrigin.trim() || null,
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
    if (key === "full_admin_parity") {
      if (value) {
        const patch: Partial<AiPermissionsPolicy> = { full_admin_parity: true };
        for (const cap of PARITY_CAPABILITY_KEYS) {
          (patch as Record<string, boolean>)[cap] = true;
        }
        await runAction(
          "update_ai_permissions",
          { patch },
          "Enabled Full Admin Parity across all operational AI capabilities."
        );
        return;
      }
      await runAction(
        "update_ai_permissions",
        {
          patch: {
            full_admin_parity: false,
            can_approve_posts: false,
            can_revoke_approval: false,
            can_delete_posts: false,
          },
        },
        "Disabled Full Admin Parity (restricted AI approve, revoke, and delete permissions)."
      );
      return;
    }

    const patch: Partial<AiPermissionsPolicy> = { [key]: value };
    if (PARITY_CAPABILITY_KEYS.includes(key)) {
      if (!value && data.aiPermissions.full_admin_parity) {
        patch.full_admin_parity = false;
      } else if (value) {
        const allEnabled = PARITY_CAPABILITY_KEYS.every((cap) =>
          cap === key ? true : Boolean(data.aiPermissions[cap])
        );
        if (allEnabled) {
          patch.full_admin_parity = true;
        }
      }
    }

    await runAction(
      "update_ai_permissions",
      { patch },
      `Updated ${key} = ${value}`
    );
  };

  const handleDownloadSubscribersCsv = () => {
    const rows = [
      ["email", "source", "created_at"],
      ...data.subscribers.map((s) => [s.email, s.source, s.created_at]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
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
    count?: number;
  }[] = [
    {
      id: "OVERVIEW",
      label: "Review & overview",
      icon: Activity,
      count: pendingReviews.length || undefined,
    },
    {
      id: "JOURNAL",
      label: "Journal dispatches",
      icon: FileText,
      count: data.dispatches.length,
    },
    {
      id: "NEWS",
      label: "Orbital Wire",
      icon: Newspaper,
      count: data.news.length,
    },
    {
      id: "HACKATHONS",
      label: "Hackathons",
      icon: Radar,
      count: data.hackathons.length,
    },
    {
      id: "LABS",
      label: "Labs & Skunkworks",
      icon: FlaskConical,
      count: data.labs.length,
    },
    {
      id: "CRM",
      label: "CRM & audience",
      icon: Users,
      count: data.inquiries.length + data.orbit.length,
    },
    {
      id: "MEDIA",
      label: "Media studio",
      icon: ImageIcon,
      count: data.mediaAssets.length || undefined,
    },
    {
      id: "PERMISSIONS",
      label: "AI permissions",
      icon: Shield,
    },
    {
      id: "MCP_TEAM",
      label: "MCP, team & audit",
      icon: Plug,
    },
  ];

  const filteredAudit = data.auditLogs.filter((l) =>
    auditFilter === "ALL" ? true : l.actor_type === auditFilter
  );

  const auditFilterLabels: Record<typeof auditFilter, string> = {
    ALL: "All",
    admin: "Admin",
    ai_assistant: "AI",
    mcp: "MCP",
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
      {/* Top Command Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--hairline)] bg-[var(--bg-canvas)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3.5">
            <BrandMark size={30} title="G-Gravitator" />
            <div>
              <h1 className="font-display text-[17px] font-bold tracking-[-0.025em] text-[var(--ink-primary)]">
                G-Gravitator Command
              </h1>
              <p className="flex flex-wrap items-center gap-x-2 text-[13px] text-[var(--ink-muted)]">
                <span>
                  {user.name} ({user.role})
                </span>
                {data.systemHealth && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span
                      title={`AI Model: ${data.systemHealth.geminiModel}`}
                      className={
                        data.systemHealth.geminiConfigured
                          ? "text-[#34D399]"
                          : "text-[#FBBF24]"
                      }
                    >
                      {data.systemHealth.geminiConfigured
                        ? "Gemini ready"
                        : "Gemini key missing"}
                    </span>
                    <span aria-hidden="true" className="hidden sm:inline">
                      ·
                    </span>
                    <span className="hidden sm:inline">
                      {data.systemHealth.supabaseConfigured
                        ? "Supabase"
                        : "Local store"}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="press-tactile inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-[#07090D] hover:bg-[var(--accent-hover)]"
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
              className={SECONDARY_BTN}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-[var(--accent)] ${
                  busyAction === "run_hackathon_ingestion" ? "animate-spin" : ""
                }`}
              />
              <span>Sync hackathons</span>
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
              className={SECONDARY_BTN}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-[#34D399] ${
                  busyAction === "run_news_ingestion" ? "animate-spin" : ""
                }`}
              />
              <span>Sync wire</span>
            </button>

            <button
              type="button"
              onClick={() => void refreshBootstrap()}
              title="Refresh data"
              aria-label="Refresh command data"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] text-[var(--ink-muted)] transition-colors duration-150 hover:border-white/35 hover:text-[var(--ink-primary)]"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  loadingBootstrap ? "animate-spin" : ""
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => void handleLogout()}
              className={SECONDARY_BTN}
            >
              <LogOut className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1480px] grid-cols-1 gap-8 px-4 py-7 sm:px-6 lg:grid-cols-12 lg:px-8">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 xl:col-span-2">
          <nav
            aria-label="Command sections"
            className="flex gap-1 overflow-x-auto border-b border-[var(--hairline)] pb-2 lg:flex-col lg:overflow-visible lg:border-b-0 lg:pb-0"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setSearchQuery("");
                    setConfirmDeleteKey(null);
                  }}
                  className={`flex shrink-0 cursor-pointer items-center justify-between gap-3 rounded-lg border-l-2 px-3 py-2.5 text-left text-[13px] transition-colors duration-150 ${
                    active
                      ? "border-[var(--accent)] bg-[var(--bg-surface)] font-semibold text-[var(--ink-primary)]"
                      : "border-transparent font-medium text-[var(--ink-muted)] hover:bg-[var(--bg-surface)]/60 hover:text-[var(--ink-primary)]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        active ? "text-[var(--accent)]" : "text-[var(--ink-muted)]"
                      }`}
                    />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </span>
                  {item.count !== undefined && (
                    <span
                      className={`font-tabular text-[13px] ${
                        item.id === "OVERVIEW" && item.count > 0
                          ? "font-semibold text-[var(--accent)]"
                          : active
                          ? "text-[var(--ink-primary)]"
                          : "text-[var(--ink-muted)]"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Workspace */}
        <main className="min-w-0 space-y-8 lg:col-span-9 xl:col-span-10">
          {notice && (
            <div
              role={notice.tone === "error" ? "alert" : "status"}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-[14px] ${
                notice.tone === "error"
                  ? "border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[#FF8A7A]"
                  : notice.tone === "success"
                  ? "border-[#10B981]/35 bg-[#10B981]/10 text-[#34D399]"
                  : "border-[var(--hairline-strong)] bg-[var(--bg-surface)] text-[var(--ink-primary)]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {notice.tone === "error" ? (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                )}
                <span>{notice.text}</span>
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => setNotice(null)}
                className="cursor-pointer rounded-full p-1 opacity-75 transition-opacity duration-150 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW & MODERATION REVIEW QUEUE */}
          {activeTab === "OVERVIEW" && (
            <div className="space-y-8">
              {/* Architectural Single-Layer KPI Ledger */}
              <div className="grid grid-cols-2 divide-y divide-[var(--hairline)] overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)] sm:grid-cols-3 lg:grid-cols-6 lg:divide-x lg:divide-y-0">
                {[
                  {
                    label: "Pending review",
                    val: pendingReviews.length,
                    highlight: pendingReviews.length > 0,
                  },
                  { label: "Journal issues", val: data.dispatches.length },
                  { label: "Orbital Wire", val: data.news.length },
                  { label: "Hackathons", val: data.hackathons.length },
                  { label: "B2B inquiries", val: data.inquiries.length },
                  {
                    label: "Orbit and subs",
                    val: data.orbit.length + data.subscribers.length,
                  },
                ].map((k) => (
                  <div key={k.label} className="px-5 py-4">
                    <div className="text-[13px] text-[var(--ink-muted)]">
                      {k.label}
                    </div>
                    <div
                      className={`font-display font-tabular mt-1.5 text-[28px] font-bold leading-none ${
                        k.highlight
                          ? "text-[var(--accent)]"
                          : "text-[var(--ink-primary)]"
                      }`}
                    >
                      {k.val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Create Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--hairline)] pb-6">
                <div>
                  <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[var(--ink-primary)]">
                    Design, research, and publish
                  </h2>
                  <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
                    Author formatted posts with custom covers or command the AI Operator by voice.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDesignerState({ entity: "dispatch", existing: null })
                    }
                    className="press-tactile inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--ink-primary)] px-4 text-[13px] font-semibold text-[#07090D] hover:bg-white"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New dispatch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDesignerState({ entity: "news", existing: null })
                    }
                    className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-4 text-[13px] font-medium text-[var(--ink-primary)] transition-colors duration-150 hover:border-white/35"
                  >
                    <Plus className="h-4 w-4 text-[#34D399]" />
                    <span>New wire post</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDesignerState({ entity: "hackathon", existing: null })
                    }
                    className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-4 text-[13px] font-medium text-[var(--ink-primary)] transition-colors duration-150 hover:border-white/35"
                  >
                    <Plus className="h-4 w-4 text-[var(--accent)]" />
                    <span>New hackathon</span>
                  </button>
                </div>
              </div>

              {/* Pending Review Queue */}
              <section className="space-y-4">
                <div>
                  <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[var(--ink-primary)]">
                    Approval and review queue{" "}
                    <span className="font-tabular font-normal text-[var(--ink-muted)]">
                      ({pendingReviews.length})
                    </span>
                  </h2>
                  <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
                    Community hackathons and AI-authored drafts wait here until approved or direct publishing is enabled.
                  </p>
                </div>

                {pendingReviews.length === 0 ? (
                  <div className="rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)] p-8 text-center text-[14px] text-[var(--ink-muted)]">
                    All submissions and AI drafts have been reviewed.
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--hairline)] overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)]">
                    {pendingReviews.map((item) => {
                      const delKey = `pending-${item.entity}-${item.id}`;
                      return (
                        <div
                          key={`${item.entity}-${item.id}`}
                          className="flex flex-col justify-between gap-4 border-l-2 border-l-[var(--accent)] p-5 lg:flex-row lg:items-center"
                        >
                          <div className="min-w-0 max-w-2xl">
                            <div className="flex flex-wrap items-center gap-x-2 text-[13px]">
                              <span className="font-semibold capitalize text-[var(--accent)]">
                                {item.entity}
                              </span>
                              <span className="text-[var(--ink-muted)]">·</span>
                              <span className="text-[var(--ink-primary)]">
                                By {item.createdBy}
                              </span>
                              <span className="text-[var(--ink-muted)]">·</span>
                              <span className="text-[#FBBF24]">
                                {item.status}
                              </span>
                              {item.confidence !== undefined && (
                                <>
                                  <span className="text-[var(--ink-muted)]">
                                    ·
                                  </span>
                                  <span className="font-tabular text-[var(--ink-muted)]">
                                    Confidence{" "}
                                    {Math.round(item.confidence * 100)}%
                                  </span>
                                </>
                              )}
                            </div>
                            <h3 className="font-display mt-2 text-[17px] font-semibold text-[var(--ink-primary)]">
                              {item.title}
                            </h3>
                            <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
                              {item.subtitle}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void runAction(
                                  "approve_content",
                                  { entity: item.entity, id: item.id },
                                  `Approved and published ${item.title}`
                                )
                              }
                              className="press-tactile inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-[#10B981] px-4 text-[13px] font-semibold text-[#07090D] hover:bg-[#34D399]"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Approve &amp; publish</span>
                            </button>

                            {(item.createdBy === "ai_assistant" ||
                              item.createdBy === "mcp") && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleApproveAndGrantDirect(
                                    item.entity,
                                    item.id
                                  )
                                }
                                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[#34D399]/40 bg-[#10B981]/12 px-3.5 text-[13px] font-medium text-[#34D399] transition-colors duration-150 hover:bg-[#10B981]/20"
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Approve + AI direct</span>
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
                              className={SECONDARY_BTN}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Design</span>
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
                              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3.5 text-[13px] font-medium text-[#FBBF24] transition-colors duration-150 hover:border-[#FBBF24]/50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Reject</span>
                            </button>

                            <button
                              type="button"
                              aria-label={`Delete ${item.title}`}
                              onClick={() =>
                                handleConfirmedDelete(
                                  delKey,
                                  item.entity === "dispatch"
                                    ? "delete_dispatch"
                                    : item.entity === "news"
                                    ? "delete_news_item"
                                    : "delete_hackathon",
                                  { id: item.id },
                                  `Deleted ${item.title}`
                                )
                              }
                              className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors duration-150 ${
                                confirmDeleteKey === delKey
                                  ? "border-[var(--accent)] bg-[var(--accent)] font-semibold text-[#07090D]"
                                  : "border-[var(--accent)]/35 bg-[var(--accent-soft)] text-[#FF8A7A]"
                              }`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {confirmDeleteKey === delKey && (
                                <span>Confirm?</span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 2: JOURNAL DISPATCHES */}
          {activeTab === "JOURNAL" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--ink-primary)]">
                    Journal dispatches{" "}
                    <span className="font-tabular font-normal text-[var(--ink-muted)]">
                      ({filteredDispatches.length}/{data.dispatches.length})
                    </span>
                  </h2>
                  <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
                    Author long-form technical issues with custom covers, accent colors, and links.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
                    <input
                      type="text"
                      aria-label="Filter dispatches"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter dispatches..."
                      className={SEARCH_INPUT_CLASS}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDesignerState({ entity: "dispatch", existing: null })
                    }
                    className="press-tactile inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-[13px] font-semibold text-[#07090D] hover:bg-[var(--accent-hover)]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Design new dispatch</span>
                  </button>
                </div>
              </div>

              <div className="divide-y divide-[var(--hairline)] overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)]">
                {filteredDispatches.map((d) => {
                  const published = d.is_published !== false;
                  const delKey = `dispatch-${d.id}`;
                  return (
                    <div
                      key={d.id}
                      className={`flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center ${
                        published ? "" : "border-l-2 border-l-[var(--accent)]"
                      }`}
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        {d.cover_image_url && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={d.cover_image_url}
                            alt={d.title}
                            className="hidden h-16 w-24 shrink-0 rounded-lg border border-[var(--hairline)] object-cover sm:block"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 text-[13px]">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{
                                backgroundColor:
                                  d.design?.accent_color || "#FF3B1F",
                              }}
                            />
                            <span className="font-tabular font-semibold text-[var(--ink-primary)]">
                              Issue {d.issue_number}
                            </span>
                            <span className="text-[var(--ink-muted)]">·</span>
                            <span className="text-[var(--ink-muted)]">
                              {d.category}
                            </span>
                            <span className="text-[var(--ink-muted)]">·</span>
                            <span
                              className={
                                published
                                  ? "font-medium text-[#34D399]"
                                  : "font-medium text-[#FF8A7A]"
                              }
                            >
                              {published
                                ? "Published"
                                : d.approval_status || "Pending"}
                            </span>
                            {d.created_by && (
                              <>
                                <span className="text-[var(--ink-muted)]">
                                  ·
                                </span>
                                <span className="text-[var(--ink-muted)]">
                                  by {d.created_by}
                                </span>
                              </>
                            )}
                          </div>
                          <h3 className="font-display mt-1.5 text-[16px] font-semibold text-[var(--ink-primary)]">
                            {d.title}
                          </h3>
                          <p className="mt-1 line-clamp-1 text-[14px] text-[var(--ink-muted)]">
                            {d.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <a
                          href={`/journal/${d.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          title={
                            published
                              ? "Open live dispatch"
                              : "Open admin preview"
                          }
                          className={SECONDARY_BTN}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {!published && <span>Preview</span>}
                        </a>
                        <button
                          type="button"
                          onClick={() => setShareDispatchTarget(d)}
                          title={
                            published
                              ? "Share dispatch and inspect Open Graph preview"
                              : "Generate private draft share link and inspect Open Graph preview"
                          }
                          className={SECONDARY_BTN}
                        >
                          <Share2 className="h-3.5 w-3.5 text-[var(--accent)]" />
                          <span>Share</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void runAction("update_dispatch", {
                              id: d.id,
                              is_featured: !d.is_featured,
                            })
                          }
                          title="Toggle featured"
                          aria-label={`Toggle featured for ${d.title}`}
                          className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-colors duration-150 ${
                            d.is_featured
                              ? "border-[#F59E0B]/45 bg-[#F59E0B]/15 text-[#FBBF24]"
                              : "border-[var(--hairline-strong)] bg-[var(--bg-canvas)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                          }`}
                        >
                          <Star className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDesignerState({ entity: "dispatch", existing: d })
                          }
                          className={SECONDARY_BTN}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Design</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              published ? "revoke_approval" : "approve_content",
                              { entity: "dispatch", id: d.id },
                              published
                                ? "Approval revoked (unpublished)."
                                : "Dispatch approved and published."
                            )
                          }
                          className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-150 ${
                            published
                              ? "border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                              : "bg-[#10B981] text-[#07090D] hover:bg-[#34D399]"
                          }`}
                        >
                          {published ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5" />
                              <span>Revoke</span>
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
                          aria-label={`Delete dispatch ${d.issue_number}`}
                          onClick={() =>
                            handleConfirmedDelete(
                              delKey,
                              "delete_dispatch",
                              { id: d.id },
                              `Deleted dispatch ${d.issue_number}`
                            )
                          }
                          className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors duration-150 ${
                            confirmDeleteKey === delKey
                              ? "border-[var(--accent)] bg-[var(--accent)] font-semibold text-[#07090D]"
                              : "border-[var(--accent)]/35 bg-[var(--accent-soft)] text-[#FF8A7A]"
                          }`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {confirmDeleteKey === delKey && <span>Confirm?</span>}
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
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--ink-primary)]">
                    Orbital Wire{" "}
                    <span className="font-tabular font-normal text-[var(--ink-muted)]">
                      ({filteredNews.length}/{data.news.length})
                    </span>
                  </h2>
                  <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
                    Create, pin, approve, revoke, or bulk-clean stale industry signals.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
                    <input
                      type="text"
                      aria-label="Filter Orbital Wire"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter wire..."
                      className={SEARCH_INPUT_CLASS}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleConfirmedDelete(
                        "bulk-clean-news",
                        "remove_old_posts",
                        { entity: "news", older_than_days: 14 },
                        "Cleaned stale Orbital Wire items older than 14 days."
                      )
                    }
                    className={`inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-[13px] font-medium transition-colors duration-150 ${
                      confirmDeleteKey === "bulk-clean-news"
                        ? "border-[var(--accent)] bg-[var(--accent)] font-semibold text-[#07090D]"
                        : "border-[var(--hairline-strong)] bg-[var(--bg-surface)] text-[var(--ink-primary)] hover:border-[var(--accent)]/50 hover:text-[#FF8A7A]"
                    }`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>
                      {confirmDeleteKey === "bulk-clean-news"
                        ? "Confirm clean >14d?"
                        : "Clean old (>14d)"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDesignerState({ entity: "news", existing: null })
                    }
                    className="press-tactile inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--accent)] px-5 text-[13px] font-semibold text-[#07090D] hover:bg-[var(--accent-hover)]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New wire post</span>
                  </button>
                </div>
              </div>

              <div className="divide-y divide-[var(--hairline)] overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)]">
                {filteredNews.map((n) => {
                  const delKey = `news-${n.id}`;
                  return (
                    <div
                      key={n.id}
                      className={`flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center ${
                        n.is_published
                          ? ""
                          : "border-l-2 border-l-[var(--accent)]"
                      }`}
                    >
                      <div className="min-w-0 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-x-2 text-[13px]">
                          <span className="font-medium text-[var(--ink-primary)]">
                            {n.category}
                          </span>
                          <span className="text-[var(--ink-muted)]">·</span>
                          <span className="text-[var(--ink-muted)]">
                            {n.source_name}
                          </span>
                          <span className="text-[var(--ink-muted)]">·</span>
                          <span className="font-tabular text-[#34D399]">
                            Impact {n.impact_score}/100
                          </span>
                          {n.is_pinned && (
                            <>
                              <span className="text-[var(--ink-muted)]">·</span>
                              <span className="font-semibold text-[var(--accent)]">
                                Pinned
                              </span>
                            </>
                          )}
                          {!n.is_published && (
                            <>
                              <span className="text-[var(--ink-muted)]">·</span>
                              <span className="font-medium text-[#FF8A7A]">
                                {n.approval_status || "Pending review"}
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="font-display mt-1.5 text-[16px] font-semibold text-[var(--ink-primary)]">
                          {n.title}
                        </h3>
                        <p className="mt-1 text-[14px] leading-relaxed text-[var(--ink-muted)]">
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
                          className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors duration-150 ${
                            n.is_pinned
                              ? "border-[var(--accent)] bg-[var(--accent)] text-[#07090D]"
                              : "border-[var(--hairline-strong)] bg-[var(--bg-canvas)] text-[var(--ink-primary)]"
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
                          className={SECONDARY_BTN}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Design</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              n.is_published
                                ? "revoke_approval"
                                : "approve_content",
                              { entity: "news", id: n.id },
                              n.is_published
                                ? "Approval revoked."
                                : "News item approved and published."
                            )
                          }
                          className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-150 ${
                            n.is_published
                              ? "border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                              : "bg-[#10B981] text-[#07090D] hover:bg-[#34D399]"
                          }`}
                        >
                          {n.is_published ? "Revoke" : "Approve"}
                        </button>

                        <button
                          type="button"
                          aria-label={`Delete ${n.title}`}
                          onClick={() =>
                            handleConfirmedDelete(
                              delKey,
                              "delete_news_item",
                              { id: n.id },
                              "Deleted news item."
                            )
                          }
                          className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors duration-150 ${
                            confirmDeleteKey === delKey
                              ? "border-[var(--accent)] bg-[var(--accent)] font-semibold text-[#07090D]"
                              : "border-[var(--accent)]/35 bg-[var(--accent-soft)] text-[#FF8A7A]"
                          }`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {confirmDeleteKey === delKey && <span>Confirm?</span>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: HACKATHONS */}
          {activeTab === "HACKATHONS" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--ink-primary)]">
                    Hackathons{" "}
                    <span className="font-tabular font-normal text-[var(--ink-muted)]">
                      ({filteredHackathons.length}/{data.hackathons.length})
                    </span>
                  </h2>
                  <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
                    Approve hackathons, assign OXAKALABS squads, edit cards, or clean expired events.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
                    <input
                      type="text"
                      aria-label="Filter hackathons"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter hackathons..."
                      className={SEARCH_INPUT_CLASS}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleConfirmedDelete(
                        "bulk-clean-hackathons",
                        "remove_old_posts",
                        { entity: "hackathons", older_than_days: 0 },
                        "Removed expired hackathons."
                      )
                    }
                    className={`inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-[13px] font-medium transition-colors duration-150 ${
                      confirmDeleteKey === "bulk-clean-hackathons"
                        ? "border-[var(--accent)] bg-[var(--accent)] font-semibold text-[#07090D]"
                        : "border-[var(--hairline-strong)] bg-[var(--bg-surface)] text-[var(--ink-primary)] hover:border-[var(--accent)]/50 hover:text-[#FF8A7A]"
                    }`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>
                      {confirmDeleteKey === "bulk-clean-hackathons"
                        ? "Confirm clean?"
                        : "Clean expired"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDesignerState({ entity: "hackathon", existing: null })
                    }
                    className="press-tactile inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--accent)] px-5 text-[13px] font-semibold text-[#07090D] hover:bg-[var(--accent-hover)]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New hackathon</span>
                  </button>
                </div>
              </div>

              <div className="divide-y divide-[var(--hairline)] overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)]">
                {filteredHackathons.map((h) => {
                  const delKey = `hackathon-${h.id}`;
                  return (
                    <div
                      key={h.id}
                      className={`flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center ${
                        h.is_published
                          ? ""
                          : "border-l-2 border-l-[var(--accent)]"
                      }`}
                    >
                      <div className="min-w-0 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-x-2 text-[13px]">
                          <span
                            className={
                              h.is_published
                                ? "font-medium text-[#34D399]"
                                : "font-semibold text-[#FF8A7A]"
                            }
                          >
                            {h.is_published
                              ? "Published"
                              : h.approval_status || "Pending review"}
                          </span>
                          <span className="text-[var(--ink-muted)]">·</span>
                          <span className="font-tabular text-[var(--ink-muted)]">
                            {h.created_by || "ingestion"} · Confidence{" "}
                            {Math.round(h.confidence_score * 100)}%
                          </span>
                        </div>
                        <h3 className="font-display mt-1.5 text-[16px] font-semibold text-[var(--ink-primary)]">
                          {h.title}
                        </h3>
                        <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
                          {h.organizer} ·{" "}
                          <span className="font-tabular font-medium text-[#34D399]">
                            {h.prize_display}
                          </span>{" "}
                          · Deadline{" "}
                          <span className="font-tabular">
                            {formatUtc(h.deadline_at)}
                          </span>
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <select
                          aria-label="OXAKALABS status"
                          value={h.oxakalabs_status}
                          onChange={(e) =>
                            void runAction("update_hackathon", {
                              id: h.id,
                              oxakalabs_status: e.target
                                .value as OxakalabsStatus,
                            })
                          }
                          className="h-9 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3 text-[13px] text-[var(--ink-primary)] focus:border-[var(--accent)] focus:outline-none"
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
                            setDesignerState({
                              entity: "hackathon",
                              existing: h,
                            })
                          }
                          className={SECONDARY_BTN}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Design</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              h.is_published
                                ? "revoke_approval"
                                : "approve_content",
                              { entity: "hackathon", id: h.id },
                              h.is_published
                                ? "Approval revoked."
                                : "Hackathon approved and published."
                            )
                          }
                          className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-150 ${
                            h.is_published
                              ? "border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                              : "bg-[#10B981] text-[#07090D] hover:bg-[#34D399]"
                          }`}
                        >
                          {h.is_published ? "Revoke" : "Approve"}
                        </button>

                        <button
                          type="button"
                          aria-label={`Delete ${h.title}`}
                          onClick={() =>
                            handleConfirmedDelete(
                              delKey,
                              "delete_hackathon",
                              { id: h.id },
                              "Deleted hackathon."
                            )
                          }
                          className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors duration-150 ${
                            confirmDeleteKey === delKey
                              ? "border-[var(--accent)] bg-[var(--accent)] font-semibold text-[#07090D]"
                              : "border-[var(--accent)]/35 bg-[var(--accent-soft)] text-[#FF8A7A]"
                          }`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {confirmDeleteKey === delKey && <span>Confirm?</span>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: LABS & SKUNKWORKS */}
          {activeTab === "LABS" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--ink-primary)]">
                    Labs and Skunkworks{" "}
                    <span className="font-tabular font-normal text-[var(--ink-muted)]">
                      ({filteredLabs.length}/{data.labs.length})
                    </span>
                  </h2>
                  <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
                    Create, score on the 25-point Graduation Scorecard, promote, or retire internal products.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
                    <input
                      type="text"
                      aria-label="Filter labs"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter labs..."
                      className={SEARCH_INPUT_CLASS}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => openLabEditor(null)}
                    className="press-tactile inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--accent)] px-5 text-[13px] font-semibold text-[#07090D] hover:bg-[var(--accent-hover)]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New lab or skunkworks</span>
                  </button>
                </div>
              </div>

              {showLabForm && (
                <form
                  onSubmit={handleSaveLab}
                  className="space-y-5 rounded-xl border border-[var(--accent)]/40 bg-[var(--bg-surface)] p-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-[17px] font-bold text-[var(--ink-primary)]">
                      {editingLab ? `Edit ${editingLab.code}` : "Create project"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowLabForm(false)}
                      className="cursor-pointer text-[13px] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label
                        htmlFor="lab-code"
                        className="block text-[13px] font-medium text-[var(--ink-primary)]"
                      >
                        Project code *
                      </label>
                      <input
                        id="lab-code"
                        type="text"
                        required
                        disabled={Boolean(editingLab)}
                        value={labCode}
                        onChange={(e) => setLabCode(e.target.value)}
                        placeholder="G-05 or OXA-07"
                        className={`${LAB_INPUT_CLASS} disabled:opacity-50`}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lab-division"
                        className="block text-[13px] font-medium text-[var(--ink-primary)]"
                      >
                        Division
                      </label>
                      <select
                        id="lab-division"
                        value={labDivision}
                        onChange={(e) =>
                          setLabDivision(e.target.value as LabDivision)
                        }
                        className={LAB_INPUT_CLASS}
                      >
                        <option value="LABS">G-Gravitator LABS</option>
                        <option value="SKUNKWORKS">OXAKALABS SKUNKWORKS</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="lab-status"
                        className="block text-[13px] font-medium text-[var(--ink-primary)]"
                      >
                        Status
                      </label>
                      <select
                        id="lab-status"
                        value={labStatus}
                        onChange={(e) =>
                          setLabStatus(e.target.value as LabProjectStatus)
                        }
                        className={LAB_INPUT_CLASS}
                      >
                        <option value="CONCEPT">CONCEPT</option>
                        <option value="PROTOTYPING">PROTOTYPING</option>
                        <option value="R&D">R&amp;D</option>
                        <option value="SKUNKWORKS CANDIDATE">
                          SKUNKWORKS CANDIDATE
                        </option>
                        <option value="BETA">BETA</option>
                        <option value="LIVE">LIVE</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="lab-name"
                        className="block text-[13px] font-medium text-[var(--ink-primary)]"
                      >
                        Project name *
                      </label>
                      <input
                        id="lab-name"
                        type="text"
                        required
                        value={labName}
                        onChange={(e) => setLabName(e.target.value)}
                        placeholder="Project name"
                        className={LAB_INPUT_CLASS}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="lab-tagline"
                      className="block text-[13px] font-medium text-[var(--ink-primary)]"
                    >
                      One-line tagline *
                    </label>
                    <input
                      id="lab-tagline"
                      type="text"
                      required
                      value={labTagline}
                      onChange={(e) => setLabTagline(e.target.value)}
                      placeholder="Concise one-line tagline"
                      className={LAB_INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lab-desc"
                      className="block text-[13px] font-medium text-[var(--ink-primary)]"
                    >
                      Technical description *
                    </label>
                    <textarea
                      id="lab-desc"
                      rows={3}
                      required
                      value={labDesc}
                      onChange={(e) => setLabDesc(e.target.value)}
                      placeholder="Technical description"
                      className="mt-1.5 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] p-3.5 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="lab-thesis"
                        className="block text-[13px] font-medium text-[var(--ink-primary)]"
                      >
                        Core thesis (optional)
                      </label>
                      <textarea
                        id="lab-thesis"
                        rows={2}
                        value={labThesis}
                        onChange={(e) => setLabThesis(e.target.value)}
                        placeholder="Problem statement or thesis"
                        className="mt-1.5 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] p-3 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lab-arch"
                        className="block text-[13px] font-medium text-[var(--ink-primary)]"
                      >
                        Architecture notes (one bullet per line)
                      </label>
                      <textarea
                        id="lab-arch"
                        rows={2}
                        value={labArchNotes}
                        onChange={(e) => setLabArchNotes(e.target.value)}
                        placeholder="One architectural note per line"
                        className="mt-1.5 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] p-3 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label
                        htmlFor="lab-stack"
                        className="block text-[13px] font-medium text-[var(--ink-primary)]"
                      >
                        Tech stack
                      </label>
                      <input
                        id="lab-stack"
                        type="text"
                        value={labStack}
                        onChange={(e) => setLabStack(e.target.value)}
                        placeholder="Comma-separated"
                        className={LAB_INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lab-origin"
                        className="block text-[13px] font-medium text-[var(--ink-primary)]"
                      >
                        Hackathon origin
                      </label>
                      <input
                        id="lab-origin"
                        type="text"
                        value={labHackOrigin}
                        onChange={(e) => setLabHackOrigin(e.target.value)}
                        placeholder="Optional event name"
                        className={LAB_INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lab-live"
                        className="block text-[13px] font-medium text-[var(--ink-primary)]"
                      >
                        Live URL
                      </label>
                      <input
                        id="lab-live"
                        type="url"
                        value={labLiveUrl}
                        onChange={(e) => setLabLiveUrl(e.target.value)}
                        placeholder="https://..."
                        className={LAB_INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lab-repo"
                        className="block text-[13px] font-medium text-[var(--ink-primary)]"
                      >
                        Repository URL
                      </label>
                      <input
                        id="lab-repo"
                        type="url"
                        value={labRepoUrl}
                        onChange={(e) => setLabRepoUrl(e.target.value)}
                        placeholder="https://github.com/..."
                        className={LAB_INPUT_CLASS}
                      />
                    </div>
                  </div>

                  {/* 25-pt Scorecard */}
                  <div className="grid grid-cols-2 gap-3 border-t border-[var(--hairline)] pt-4 sm:grid-cols-5">
                    {(
                      [
                        ["pain_intensity", "Pain (1-5)"],
                        ["willingness_to_pay", "WTP (1-5)"],
                        ["technical_moat", "Moat (1-5)"],
                        ["distribution_hook", "Distribution (1-5)"],
                        ["lean_maintainability", "Lean (1-5)"],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key}>
                        <label
                          htmlFor={`lab-score-${key}`}
                          className="block text-[13px] text-[var(--ink-muted)]"
                        >
                          {label}
                        </label>
                        <input
                          id={`lab-score-${key}`}
                          type="number"
                          min={1}
                          max={5}
                          value={labScore[key]}
                          onChange={(e) =>
                            setLabScore((s) => ({
                              ...s,
                              [key]: Math.min(
                                5,
                                Math.max(1, Number(e.target.value) || 1)
                              ),
                            }))
                          }
                          className={`${LAB_INPUT_CLASS} font-tabular`}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="press-tactile inline-flex h-10 cursor-pointer items-center rounded-full bg-[var(--accent)] px-6 text-[13px] font-semibold text-[#07090D] hover:bg-[var(--accent-hover)]"
                  >
                    {editingLab ? "Save project" : "Create project"}
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredLabs.map((p) => {
                  const total = p.scorecard
                    ? p.scorecard.pain_intensity +
                      p.scorecard.willingness_to_pay +
                      p.scorecard.technical_moat +
                      p.scorecard.distribution_hook +
                      p.scorecard.lean_maintainability
                    : null;
                  const delKey = `lab-${p.id}`;
                  return (
                    <div
                      key={p.id}
                      className="flex flex-col justify-between gap-4 rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)] p-5"
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                          <div className="flex items-center gap-2">
                            <span className="font-tabular font-semibold text-[var(--ink-primary)]">
                              {p.code}
                            </span>
                            <span className="text-[var(--ink-muted)]">·</span>
                            <span className="text-[var(--ink-muted)]">
                              {p.division} · {p.status}
                            </span>
                          </div>
                          {total !== null && (
                            <span className="font-tabular font-semibold text-[#34D399]">
                              {total}/25
                            </span>
                          )}
                        </div>
                        <h3 className="font-display mt-2.5 text-[17px] font-semibold text-[var(--ink-primary)]">
                          {p.name}
                        </h3>
                        <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
                          {p.tagline}
                        </p>
                        {p.hackathon_origin && (
                          <p className="mt-2 text-[13px] text-[var(--ink-muted)]">
                            Origin: {p.hackathon_origin}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-end gap-2 border-t border-[var(--hairline)] pt-3">
                        <button
                          type="button"
                          onClick={() => openLabEditor(p)}
                          className={SECONDARY_BTN}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${p.code}`}
                          onClick={() =>
                            handleConfirmedDelete(
                              delKey,
                              "delete_lab_project",
                              { id: p.id },
                              `Deleted ${p.code}`
                            )
                          }
                          className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors duration-150 ${
                            confirmDeleteKey === delKey
                              ? "border-[var(--accent)] bg-[var(--accent)] font-semibold text-[#07090D]"
                              : "border-[var(--accent)]/35 bg-[var(--accent-soft)] text-[#FF8A7A]"
                          }`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {confirmDeleteKey === delKey && <span>Confirm?</span>}
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--ink-primary)]">
                    CRM, inquiries, and audience
                  </h2>
                  <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
                    Triage client inquiries, review Orbit applications with notes, and manage subscribers.
                  </p>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
                  <input
                    type="text"
                    aria-label="Filter inquiries and Orbit applications"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter inquiries and Orbit..."
                    className={SEARCH_INPUT_CLASS}
                  />
                </div>
              </div>

              {/* Inquiries */}
              <section className="space-y-3">
                <h3 className="font-display text-[18px] font-bold text-[var(--ink-primary)]">
                  B2B systems inquiries{" "}
                  <span className="font-tabular font-normal text-[var(--ink-muted)]">
                    ({filteredInquiries.length}/{data.inquiries.length})
                  </span>
                </h3>
                <div className="divide-y divide-[var(--hairline)] overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)]">
                  {filteredInquiries.length === 0 ? (
                    <div className="p-6 text-[14px] text-[var(--ink-muted)]">
                      No matching inquiries.
                    </div>
                  ) : (
                    filteredInquiries.map((inq) => {
                      const delKey = `inq-${inq.id}`;
                      return (
                        <div
                          key={inq.id}
                          className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center"
                        >
                          <div className="max-w-2xl">
                            <div className="flex flex-wrap items-center gap-x-2 text-[13px]">
                              <span className="font-semibold text-[var(--accent)]">
                                {inq.tier}
                              </span>
                              <span className="text-[var(--ink-muted)]">·</span>
                              <span className="font-tabular text-[#34D399]">
                                {inq.budget_range || "Custom"}
                              </span>
                              <span className="text-[var(--ink-muted)]">·</span>
                              <span className="text-[var(--ink-muted)]">
                                {inq.timeline || "Flexible"}
                              </span>
                            </div>
                            <h4 className="font-display mt-1.5 text-[16px] font-semibold text-[var(--ink-primary)]">
                              {inq.name}{" "}
                              <span className="font-sans text-[14px] font-normal text-[var(--ink-muted)]">
                                · {inq.company || "Independent"} ({inq.email})
                              </span>
                            </h4>
                            <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--ink-muted)]">
                              {inq.project_brief}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              aria-label={`Inquiry status for ${inq.name}`}
                              value={inq.status}
                              onChange={(e) =>
                                void runAction("update_inquiry_status", {
                                  id: inq.id,
                                  status: e.target.value as InquiryStatus,
                                })
                              }
                              className="h-9 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3 text-[13px] text-[var(--ink-primary)] focus:border-[var(--accent)] focus:outline-none"
                            >
                              <option value="NEW">New</option>
                              <option value="REVIEWED">Reviewed</option>
                              <option value="DISCOVERY_CALL">
                                Discovery call
                              </option>
                              <option value="CLOSED_WON">Closed won</option>
                              <option value="ARCHIVED">Archived</option>
                            </select>
                            <button
                              type="button"
                              aria-label={`Delete inquiry from ${inq.name}`}
                              onClick={() =>
                                handleConfirmedDelete(
                                  delKey,
                                  "delete_inquiry",
                                  { id: inq.id },
                                  "Deleted inquiry"
                                )
                              }
                              className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors duration-150 ${
                                confirmDeleteKey === delKey
                                  ? "border-[var(--accent)] bg-[var(--accent)] font-semibold text-[#07090D]"
                                  : "border-[var(--accent)]/35 bg-[var(--accent-soft)] text-[#FF8A7A]"
                              }`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {confirmDeleteKey === delKey && (
                                <span>Confirm?</span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Orbit + Subscribers */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <section className="space-y-3">
                  <h3 className="font-display text-[18px] font-bold text-[var(--ink-primary)]">
                    Orbit applications{" "}
                    <span className="font-tabular font-normal text-[var(--ink-muted)]">
                      ({filteredOrbit.length}/{data.orbit.length})
                    </span>
                  </h3>
                  <div className="divide-y divide-[var(--hairline)] overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)]">
                    {filteredOrbit.length === 0 ? (
                      <div className="p-6 text-[14px] text-[var(--ink-muted)]">
                        No Orbit applications found.
                      </div>
                    ) : (
                      filteredOrbit.map((app) => {
                        const delKey = `orbit-${app.id}`;
                        const draftNote =
                          orbitNotesDraft[app.id] !== undefined
                            ? orbitNotesDraft[app.id]
                            : app.notes || "";
                        const noteChanged =
                          draftNote.trim() !== (app.notes || "").trim();
                        return (
                          <div key={app.id} className="space-y-3 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <div className="text-[15px] font-semibold text-[var(--ink-primary)]">
                                  {app.full_name}
                                </div>
                                <div className="text-[13px] text-[var(--ink-muted)]">
                                  {app.email} · {app.track}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  aria-label={`Orbit status for ${app.full_name}`}
                                  value={app.status || "NEW"}
                                  onChange={(e) =>
                                    void runAction("update_orbit_application", {
                                      id: app.id,
                                      status: e.target
                                        .value as OrbitApplicationStatus,
                                    })
                                  }
                                  className="h-9 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-2.5 text-[13px] text-[var(--ink-primary)] focus:border-[var(--accent)] focus:outline-none"
                                >
                                  <option value="NEW">New</option>
                                  <option value="REVIEWING">Reviewing</option>
                                  <option value="ACCEPTED">Accepted</option>
                                  <option value="WAITLISTED">Waitlisted</option>
                                  <option value="REJECTED">Rejected</option>
                                </select>
                                <button
                                  type="button"
                                  aria-label={`Delete application from ${app.full_name}`}
                                  onClick={() =>
                                    handleConfirmedDelete(
                                      delKey,
                                      "delete_orbit_application",
                                      { id: app.id },
                                      `Deleted Orbit application for ${app.full_name}`
                                    )
                                  }
                                  className={`inline-flex h-9 cursor-pointer items-center gap-1 rounded-full border px-2.5 text-[13px] transition-colors duration-150 ${
                                    confirmDeleteKey === delKey
                                      ? "border-[var(--accent)] bg-[var(--accent)] font-semibold text-[#07090D]"
                                      : "border-[var(--accent)]/35 bg-[var(--accent-soft)] text-[#FF8A7A]"
                                  }`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  {confirmDeleteKey === delKey && (
                                    <span>Confirm?</span>
                                  )}
                                </button>
                              </div>
                            </div>
                            <p className="text-[14px] leading-relaxed text-[var(--ink-muted)]">
                              {app.proof_of_work}
                            </p>
                            {app.portfolio_url && (
                              <a
                                href={app.portfolio_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#34D399] hover:underline"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span className="truncate">
                                  {app.portfolio_url}
                                </span>
                              </a>
                            )}
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                aria-label={`Reviewer notes for ${app.full_name}`}
                                value={draftNote}
                                onChange={(e) =>
                                  setOrbitNotesDraft((prev) => ({
                                    ...prev,
                                    [app.id]: e.target.value,
                                  }))
                                }
                                placeholder="Internal reviewer notes..."
                                className="h-9 flex-1 rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none"
                              />
                              {noteChanged && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void runAction(
                                      "update_orbit_application",
                                      { id: app.id, notes: draftNote.trim() },
                                      `Saved reviewer note for ${app.full_name}`
                                    )
                                  }
                                  className="h-9 cursor-pointer rounded-full bg-[var(--ink-primary)] px-4 text-[13px] font-semibold text-[#07090D]"
                                >
                                  Save
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-[18px] font-bold text-[var(--ink-primary)]">
                      Newsletter subscribers{" "}
                      <span className="font-tabular font-normal text-[var(--ink-muted)]">
                        ({data.subscribers.length})
                      </span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleDownloadSubscribersCsv}
                      className={SECONDARY_BTN}
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
                      aria-label="Add subscriber email"
                      value={newSubEmail}
                      onChange={(e) => setNewSubEmail(e.target.value)}
                      placeholder="Add subscriber email..."
                      className="h-10 flex-1 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-3.5 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="press-tactile h-10 cursor-pointer rounded-full bg-[var(--ink-primary)] px-5 text-[13px] font-semibold text-[#07090D] hover:bg-white"
                    >
                      Add
                    </button>
                  </form>

                  <div className="overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)]">
                    <ul className="divide-y divide-[var(--hairline)]">
                      {data.subscribers.map((s) => {
                        const delKey = `sub-${s.id}`;
                        return (
                          <li
                            key={s.id}
                            className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]"
                          >
                            <div className="min-w-0 truncate">
                              <span className="text-[var(--ink-primary)]">
                                {s.email}
                              </span>
                              <span className="ml-2 text-[var(--ink-muted)]">
                                · {s.source}
                              </span>
                            </div>
                            <button
                              type="button"
                              aria-label={`Remove ${s.email}`}
                              onClick={() =>
                                handleConfirmedDelete(
                                  delKey,
                                  "delete_newsletter_subscriber",
                                  { id: s.id },
                                  `Removed ${s.email}`
                                )
                              }
                              className={`shrink-0 cursor-pointer text-[13px] transition-colors duration-150 ${
                                confirmDeleteKey === delKey
                                  ? "font-semibold text-[var(--accent)]"
                                  : "text-[var(--ink-muted)] hover:text-[#FF8A7A]"
                              }`}
                            >
                              {confirmDeleteKey === delKey ? (
                                "Confirm?"
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </li>
                        );
                      })}
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
                <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--ink-primary)]">
                  Media studio and library{" "}
                  <span className="font-tabular font-normal text-[var(--ink-muted)]">
                    ({data.mediaAssets.length})
                  </span>
                </h2>
                <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
                  Generate AI visuals, import remote images by URL, upload files, or copy hosted URLs.
                </p>
              </div>

              <div className="grid grid-cols-1 divide-y divide-[var(--hairline)] overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
                <div className="space-y-3 p-5">
                  <h3 className="text-[14px] font-semibold text-[var(--ink-primary)]">
                    Generate visual (Gemini or Studio SVG)
                  </h3>
                  <input
                    type="text"
                    aria-label="Image generation prompt"
                    value={mediaPrompt}
                    onChange={(e) => setMediaPrompt(e.target.value)}
                    placeholder="Describe image prompt..."
                    className="h-10 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3.5 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={!mediaPrompt.trim() || busyAction !== null}
                    onClick={async () => {
                      const promptVal = mediaPrompt.trim();
                      if (!promptVal) return;
                      const res = (await runAction("generate_post_image", {
                        prompt: promptVal,
                        title: promptVal,
                      })) as { generator?: string } | null;
                      if (res) {
                        setMediaPrompt("");
                        setNotice({
                          tone: "success",
                          text:
                            res.generator === "gemini"
                              ? "Generated with Gemini Image AI and saved to Media Library."
                              : "Generated with Studio Editorial SVG fallback and saved to Media Library.",
                        });
                      }
                    }}
                    className="press-tactile inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] text-[13px] font-semibold text-[#07090D] hover:bg-[var(--accent-hover)] disabled:opacity-50"
                  >
                    {busyAction === "generate_post_image" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {busyAction === "generate_post_image"
                        ? "Generating..."
                        : "Generate and store"}
                    </span>
                  </button>
                </div>

                <div className="space-y-3 p-5">
                  <h3 className="text-[14px] font-semibold text-[var(--ink-primary)]">
                    Import image from URL
                  </h3>
                  <input
                    type="url"
                    aria-label="Remote image URL"
                    value={mediaImportUrl}
                    onChange={(e) => setMediaImportUrl(e.target.value)}
                    placeholder="https://example.com/cover.png"
                    className="h-10 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3.5 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={!mediaImportUrl.trim() || busyAction !== null}
                    onClick={() =>
                      void runAction(
                        "import_image_from_url",
                        { url: mediaImportUrl },
                        "Image imported into Media Library."
                      ).then((res) => {
                        if (res) setMediaImportUrl("");
                      })
                    }
                    className="press-tactile inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--ink-primary)] text-[13px] font-semibold text-[#07090D] hover:bg-white disabled:opacity-50"
                  >
                    {busyAction === "import_image_from_url" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {busyAction === "import_image_from_url"
                        ? "Importing..."
                        : "Import and host"}
                    </span>
                  </button>
                </div>

                <div className="space-y-3 p-5">
                  <h3 className="text-[14px] font-semibold text-[var(--ink-primary)]">
                    Upload from device
                  </h3>
                  <input
                    ref={mediaUploadRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f) return;
                      setMediaUploading(true);
                      try {
                        const dataUrl: string = await new Promise(
                          (resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () =>
                              resolve(String(reader.result || ""));
                            reader.onerror = () =>
                              reject(new Error("Could not read file."));
                            reader.readAsDataURL(f);
                          }
                        );
                        const res = await fetch("/api/ops/media", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "upload",
                            filename: f.name,
                            mimeType: f.type || "image/png",
                            base64Data: dataUrl,
                          }),
                        });
                        const json = (await res.json().catch(() => null)) as {
                          error?: string;
                        } | null;
                        if (!res.ok) {
                          setNotice({
                            tone: "error",
                            text: json?.error || `Failed to upload ${f.name}.`,
                          });
                          return;
                        }
                        setNotice({
                          tone: "success",
                          text: `Uploaded ${f.name}`,
                        });
                        await refreshBootstrap();
                      } catch {
                        setNotice({
                          tone: "error",
                          text: `Network or file read error uploading ${f.name}.`,
                        });
                      } finally {
                        setMediaUploading(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={mediaUploading}
                    onClick={() => mediaUploadRef.current?.click()}
                    className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] text-[13px] font-medium text-[var(--ink-primary)] transition-colors duration-150 hover:border-white/35 disabled:opacity-50"
                  >
                    {mediaUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {mediaUploading ? "Uploading..." : "Upload image file"}
                    </span>
                  </button>
                  <p className="text-[13px] text-[var(--ink-muted)]">
                    Served via <code className="font-code">/api/media/[id]</code>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.mediaAssets.map((m) => {
                  const delKey = `media-${m.id}`;
                  return (
                    <div
                      key={m.id}
                      className="overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.url}
                        alt={m.alt_text || m.filename}
                        className="aspect-[16/10] w-full object-cover"
                      />
                      <div className="space-y-3 p-4">
                        <div className="flex items-center justify-between gap-2 text-[13px]">
                          <span className="truncate font-semibold text-[var(--ink-primary)]">
                            {m.filename}
                          </span>
                          <span className="shrink-0 text-[var(--ink-muted)]">
                            {m.source_type}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleCopy(m.id, m.url)}
                            className={SECONDARY_BTN}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>
                              {copiedKey === m.id ? "Copied" : "Copy URL"}
                            </span>
                          </button>
                          <a
                            href={`${m.url}?download=1`}
                            download={m.filename}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3.5 text-[13px] font-medium text-[#34D399] transition-colors duration-150 hover:border-[#34D399]/50"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download</span>
                          </a>
                          <button
                            type="button"
                            aria-label={`Delete ${m.filename}`}
                            onClick={() =>
                              handleConfirmedDelete(
                                delKey,
                                "delete_media_asset",
                                { id: m.id },
                                "Deleted media asset"
                              )
                            }
                            className={`ml-auto inline-flex h-9 cursor-pointer items-center gap-1 rounded-full border px-3 text-[13px] transition-colors duration-150 ${
                              confirmDeleteKey === delKey
                                ? "border-[var(--accent)] bg-[var(--accent)] font-semibold text-[#07090D]"
                                : "border-[var(--accent)]/35 bg-[var(--accent-soft)] text-[#FF8A7A]"
                            }`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {confirmDeleteKey === delKey && (
                              <span>Confirm?</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 8: AI PERMISSIONS & GOVERNANCE */}
          {activeTab === "PERMISSIONS" && (
            <div className="space-y-8">
              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--ink-primary)]">
                    AI Operator permissions and approval governance
                  </h2>
                  <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
                    Control system-wide AI execution parity, direct publishing versus review queue, and community hackathon gating.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {(
                    [
                      [
                        "ai_enabled",
                        "AI Operator enabled",
                        "Allow the Admin AI Operator (voice and text) to execute commands.",
                        true,
                      ],
                      [
                        "full_admin_parity",
                        "Full Admin Parity mode",
                        "Master preset enabling all operational AI capabilities across posts, labs, CRM, ingestion, research, and media.",
                        true,
                      ],
                      [
                        "community_hackathons_require_approval",
                        "Require approval for community hackathons",
                        "Publicly submitted hackathons stay in Pending Review until Admin or AI approves them.",
                        true,
                      ],
                      [
                        "can_publish_directly_journal",
                        "Direct-publish: Journal Dispatches",
                        "If off, AI and inherited drafts go to Pending Review for admin approval first.",
                        false,
                      ],
                      [
                        "can_publish_directly_news",
                        "Direct-publish: Orbital Wire News",
                        "If off, AI and inherited news posts go to Pending Review first.",
                        false,
                      ],
                      [
                        "can_publish_directly_hackathons",
                        "Direct-publish: Hackathons",
                        "If off, AI and inherited hackathons go to Pending Review first.",
                        false,
                      ],
                      [
                        "can_create_posts",
                        "Create posts (Journal, Wire, Hackathons)",
                        "Allow AI to draft and design new posts.",
                        true,
                      ],
                      [
                        "can_edit_posts",
                        "Edit existing posts",
                        "Allow AI to modify copy, colors, images, and metadata.",
                        true,
                      ],
                      [
                        "can_approve_posts",
                        "Approve pending posts",
                        "Allow AI to review and publish pending items.",
                        true,
                      ],
                      [
                        "can_revoke_approval",
                        "Revoke approval or reject posts",
                        "Allow AI to unpublish approved items back to review.",
                        true,
                      ],
                      [
                        "can_bulk_moderate",
                        "Bulk moderate pending queue",
                        "Allow batch approve, revoke, or reject of up to 25 items per call.",
                        true,
                      ],
                      [
                        "can_delete_posts",
                        "Delete and clean old posts",
                        "Allow AI to delete specific or expired posts.",
                        true,
                      ],
                      [
                        "can_manage_labs",
                        "Manage Labs and Skunkworks",
                        "Allow AI to create, score, update, or delete Labs and Skunkworks projects.",
                        true,
                      ],
                      [
                        "can_manage_inquiries",
                        "Manage B2B inquiries",
                        "Allow AI to triage inquiry pipeline status or delete spam.",
                        true,
                      ],
                      [
                        "can_manage_orbit_and_subscribers",
                        "Manage Orbit and subscribers",
                        "Allow AI to review Orbit applicants and manage newsletter subscribers.",
                        true,
                      ],
                      [
                        "can_trigger_ingestion",
                        "Trigger live ingestion pipelines",
                        "Allow AI to run hackathon and news sync pipelines.",
                        true,
                      ],
                      [
                        "can_web_research",
                        "Live web research and URL inspection",
                        "Allow AI to search HN, arXiv, Devpost, Google, and read URLs.",
                        true,
                      ],
                      [
                        "can_use_ai_drafter",
                        "AI structured drafter engine",
                        "Allow generating full structured post previews via Gemini.",
                        true,
                      ],
                      [
                        "can_manage_media",
                        "Generate, import, and delete media",
                        "Allow AI to create cover art and import or manage images.",
                        true,
                      ],
                    ] as [keyof AiPermissionsPolicy, string, string, boolean][]
                  ).map(([key, label, desc, defaultVal]) => {
                    const rawVal = data.aiPermissions[key];
                    const enabled =
                      typeof rawVal === "boolean" ? rawVal : defaultVal;
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-4 rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)] p-4"
                      >
                        <div className="min-w-0">
                          <div className="text-[14px] font-semibold text-[var(--ink-primary)]">
                            {label}
                          </div>
                          <div className="mt-0.5 text-[13px] text-[var(--ink-muted)]">
                            {desc}
                          </div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          aria-label={label}
                          onClick={() => void togglePermission(key, !enabled)}
                          className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-150 ${
                            enabled ? "bg-[#10B981]" : "bg-white/[0.15]"
                          }`}
                        >
                          <span
                            className={`block h-5 w-5 rounded-full bg-[#07090D] transition-transform duration-150 ${
                              enabled ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* External MCP Security Ceilings */}
              <div className="space-y-4 border-t border-[var(--hairline)] pt-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-[19px] font-bold text-[var(--ink-primary)]">
                      External MCP server security ceilings
                    </h3>
                    <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
                      Global hard guardrails enforced across all external MCP tokens regardless of preset or mode.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <label
                      htmlFor="mcp-default-rpm"
                      className="text-[var(--ink-muted)]"
                    >
                      Default token RPM:
                    </label>
                    <select
                      id="mcp-default-rpm"
                      value={data.aiPermissions.mcp_default_rate_limit_rpm ?? 60}
                      onChange={(e) =>
                        void runAction(
                          "update_ai_permissions",
                          {
                            patch: {
                              mcp_default_rate_limit_rpm: Number(e.target.value),
                            },
                          },
                          "Updated default MCP RPM limit."
                        )
                      }
                      className="font-tabular h-9 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-3 text-[13px] text-[var(--ink-primary)] focus:border-[var(--accent)] focus:outline-none"
                    >
                      <option value={30}>30 req/min</option>
                      <option value={60}>60 req/min</option>
                      <option value={120}>120 req/min</option>
                      <option value={300}>300 req/min</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {(
                    [
                      [
                        "mcp_enabled",
                        "External MCP HTTP server enabled",
                        "Master kill-switch for external clients connecting to /api/mcp.",
                        true,
                      ],
                      [
                        "mcp_inherit_ai_permissions",
                        "Inherit-mode tokens follow AI policy",
                        "Apply the AI Operator toggles above to tokens in inherit mode.",
                        true,
                      ],
                      [
                        "mcp_allow_pii_over_mcp",
                        "Global PII ceiling: Allow inquiries, Orbit, and subscribers",
                        "Hard lock: keep off to block all external tokens from reading emails and briefs.",
                        false,
                      ],
                      [
                        "mcp_allow_full_parity_tokens",
                        "Allow full-parity MCP tokens",
                        "If off, any legacy Full Ops token is automatically downgraded to inherit mode.",
                        true,
                      ],
                      [
                        "mcp_require_dry_run_for_bulk_delete",
                        "Require dry-run confirm token for bulk purge",
                        "Forces external MCP agents to preview remove_old_posts via dry_run before deleting.",
                        true,
                      ],
                      [
                        "mcp_expose_resources",
                        "Expose MCP resources and URI templates",
                        "Enable resources/list, resources/templates/list, and resources/read.",
                        true,
                      ],
                      [
                        "mcp_expose_prompts",
                        "Expose MCP workflow prompts",
                        "Enable prompts/list and prompts/get workflow playbooks.",
                        true,
                      ],
                      [
                        "mcp_read_audit_logs",
                        "Allow inherit tokens to read audit logs",
                        "Expose get_audit_logs and ggravitator://audit/{actor} to inherit tokens.",
                        false,
                      ],
                    ] as [keyof AiPermissionsPolicy, string, string, boolean][]
                  ).map(([key, label, desc, defaultVal]) => {
                    const rawVal = data.aiPermissions[key];
                    const enabled =
                      typeof rawVal === "boolean" ? rawVal : defaultVal;
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-4 rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)] p-4"
                      >
                        <div className="min-w-0">
                          <div className="text-[14px] font-semibold text-[var(--ink-primary)]">
                            {label}
                          </div>
                          <div className="mt-0.5 text-[13px] text-[var(--ink-muted)]">
                            {desc}
                          </div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          aria-label={label}
                          onClick={() => void togglePermission(key, !enabled)}
                          className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-150 ${
                            enabled ? "bg-[#10B981]" : "bg-white/[0.15]"
                          }`}
                        >
                          <span
                            className={`block h-5 w-5 rounded-full bg-[#07090D] transition-transform duration-150 ${
                              enabled ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: MCP, TEAM & AUDIT LOG */}
          {activeTab === "MCP_TEAM" && (
            <div className="space-y-10">
              <McpGovernanceSection
                endpointUrl={data.mcpEndpointUrl}
                aiPermissions={data.aiPermissions}
                tokens={data.mcpTokens}
                runAction={runAction}
                confirmDeleteKey={confirmDeleteKey}
                onConfirmedDelete={handleConfirmedDelete}
                onJumpToPermissions={() => setActiveTab("PERMISSIONS")}
              />

              {/* Admin Team & Invites */}
              <section className="space-y-4 border-t border-[var(--hairline)] pt-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[var(--ink-primary)]">
                      Admin operators and signup invites
                    </h2>
                    <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
                      Issue single-use invite codes for additional admin operators.
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
                    className="press-tactile inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[var(--ink-primary)] px-5 text-[13px] font-semibold text-[#07090D] hover:bg-white"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Generate invite code</span>
                  </button>
                </div>

                {newInviteCode && (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-[#10B981]/35 bg-[#10B981]/10 px-4 py-3 text-[13px]">
                    <span className="font-code font-semibold text-[#34D399]">
                      Invite code: {newInviteCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleCopy("inv", newInviteCode)}
                      className="cursor-pointer rounded-full bg-[#10B981] px-3.5 py-1 text-[13px] font-semibold text-[#07090D]"
                    >
                      {copiedKey === "inv" ? "Copied" : "Copy"}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="divide-y divide-[var(--hairline)] rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)]">
                    {data.adminUsers.map((u) => {
                      const delKey = `admin-${u.id}`;
                      const canRemove =
                        u.id !== user.id &&
                        (u.role !== "SUPER_ADMIN" ||
                          user.role === "SUPER_ADMIN");
                      return (
                        <div
                          key={u.id}
                          className="flex items-center justify-between gap-3 px-4 py-3.5 text-[13px]"
                        >
                          <div>
                            <div className="font-semibold text-[var(--ink-primary)]">
                              {u.name} ({u.role})
                            </div>
                            <div className="text-[var(--ink-muted)]">
                              {u.email}
                            </div>
                          </div>
                          {canRemove && (
                            <button
                              type="button"
                              onClick={() =>
                                handleConfirmedDelete(
                                  delKey,
                                  "delete_admin_user",
                                  { id: u.id },
                                  `Removed admin ${u.email}`
                                )
                              }
                              className={`cursor-pointer hover:underline ${
                                confirmDeleteKey === delKey
                                  ? "font-semibold text-[var(--accent)]"
                                  : "text-[#FF8A7A]"
                              }`}
                            >
                              {confirmDeleteKey === delKey
                                ? "Confirm?"
                                : "Remove"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="divide-y divide-[var(--hairline)] rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)]">
                    {data.adminInvites.length === 0 ? (
                      <div className="p-4 text-[13px] text-[var(--ink-muted)]">
                        No active invite codes.
                      </div>
                    ) : (
                      data.adminInvites.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between gap-3 px-4 py-3.5 text-[13px]"
                        >
                          <div>
                            <code className="font-code text-[var(--ink-primary)]">
                              {inv.code}
                            </code>
                            <div className="text-[var(--ink-muted)]">
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
                              className="cursor-pointer text-[#FF8A7A] hover:underline"
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
              <section className="space-y-4 border-t border-[var(--hairline)] pt-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[var(--ink-primary)]">
                    Live audit log{" "}
                    <span className="font-tabular font-normal text-[var(--ink-muted)]">
                      ({filteredAudit.length})
                    </span>
                  </h2>
                  <div
                    role="tablist"
                    aria-label="Filter audit actor"
                    className="inline-flex rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-surface)] p-0.5"
                  >
                    {(["ALL", "admin", "ai_assistant", "mcp"] as const).map(
                      (f) => (
                        <button
                          key={f}
                          type="button"
                          role="tab"
                          aria-selected={auditFilter === f}
                          onClick={() => setAuditFilter(f)}
                          className={`h-8 cursor-pointer rounded-full px-3.5 text-[13px] font-medium transition-colors duration-150 ${
                            auditFilter === f
                              ? "bg-[var(--ink-primary)] text-[#07090D]"
                              : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                          }`}
                        >
                          {auditFilterLabels[f]}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="max-h-96 divide-y divide-[var(--hairline)] overflow-y-auto rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)]">
                  {filteredAudit.length === 0 ? (
                    <div className="p-5 text-[14px] text-[var(--ink-muted)]">
                      No audit entries recorded yet.
                    </div>
                  ) : (
                    filteredAudit.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[13px]"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-[var(--accent)]">
                            {entry.actor_type}
                          </span>
                          <span className="mx-2 text-[var(--ink-muted)]">·</span>
                          <span className="font-medium text-[var(--ink-primary)]">
                            {entry.action}
                          </span>
                          <span className="ml-2 text-[var(--ink-muted)]">
                            {entry.summary}
                          </span>
                        </div>
                        <span className="font-tabular text-[13px] text-[var(--ink-muted)]">
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
        systemHealth={data.systemHealth}
      />

      {/* Journal Share & Open Graph Preview Modal */}
      <JournalShareModal
        dispatch={shareDispatchTarget}
        open={Boolean(shareDispatchTarget)}
        onClose={() => setShareDispatchTarget(null)}
      />
    </div>
  );
}
