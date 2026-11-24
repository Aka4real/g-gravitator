"use client";

import React, { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  KeyRound,
  Loader2,
  Play,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sliders,
  Terminal,
  X,
} from "lucide-react";
import type { OpsMcpTokenSummary } from "@/components/ops/ops-types";
import {
  ALL_MCP_SCOPE_KEYS,
  MCP_ROLE_PRESETS,
  MCP_SCOPE_DEFINITIONS,
  type McpScopeDomain,
} from "@/lib/mcp/permissions";
import type {
  AiPermissionsPolicy,
  McpRolePreset,
  McpScopeKey,
} from "@/lib/supabase/types";

interface McpGovernanceSectionProps {
  endpointUrl: string;
  aiPermissions: AiPermissionsPolicy;
  tokens: OpsMcpTokenSummary[];
  runAction: (
    action: string,
    args: Record<string, unknown>,
    successMsg?: string
  ) => Promise<unknown>;
  confirmDeleteKey: string | null;
  onConfirmedDelete: (
    key: string,
    action: string,
    args: Record<string, unknown>,
    successMsg: string
  ) => void;
  onJumpToPermissions?: () => void;
}

const DOMAIN_LABELS: Record<McpScopeDomain, string> = {
  READ_PRIVACY: "Read & Privacy (PII Gated)",
  CONTENT_MODERATION: "Content & Moderation",
  LABS_SKUNKWORKS: "Labs & Skunkworks",
  CRM_AUDIENCE: "CRM & Audience",
  RESEARCH_MEDIA: "Research, Ingestion & Media",
};

const RISK_STYLES: Record<string, string> = {
  low: "bg-[#10B981]/15 text-[#34D399]",
  medium: "bg-[#38BDF8]/15 text-[#7DD3FC]",
  high: "bg-[#F59E0B]/15 text-[#FBBF24]",
  destructive: "bg-[#FF3B1F]/15 text-[#FF8A7A]",
};

function formatShortUtc(iso: string | null | undefined): string {
  if (!iso) return "--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--";
  return d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

function buildDefaultScopeMap(preset: McpRolePreset): Record<McpScopeKey, boolean> {
  return { ...MCP_ROLE_PRESETS[preset].defaultScopes };
}

type InspectionPayload = {
  serverInfo: { name: string; version: string; title?: string };
  supportedVersions: string[];
  effective: {
    enabled: boolean;
    effectiveMode: string;
    rolePreset: string;
    downgradedFromFull: boolean;
    scopes: Record<string, boolean>;
    ceilings: Record<string, boolean>;
  };
  counts: {
    tools: number;
    resources: number;
    resourceTemplates: number;
    prompts: number;
  };
  tools: Array<{
    name: string;
    title: string;
    readOnlyHint: boolean;
    destructiveHint: boolean;
  }>;
  resources: Array<{ uri: string; name: string; mimeType: string }>;
  resourceTemplates: Array<{ uriTemplate: string; name: string; mimeType: string }>;
  prompts: Array<{ name: string; title: string }>;
};

export function McpGovernanceSection({
  endpointUrl,
  aiPermissions,
  tokens,
  runAction,
  confirmDeleteKey,
  onConfirmedDelete,
  onJumpToPermissions,
}: McpGovernanceSectionProps) {
  const [tokenName, setTokenName] = useState("");
  const [rolePreset, setRolePreset] = useState<McpRolePreset>("editorial_writer");
  const [customScopes, setCustomScopes] = useState<Record<McpScopeKey, boolean>>(() =>
    buildDefaultScopeMap("editorial_writer")
  );
  const [showCreateMatrix, setShowCreateMatrix] = useState(false);
  const [expiresDays, setExpiresDays] = useState<number>(90);
  const [rateLimitRpm, setRateLimitRpm] = useState<number>(60);
  const [tokenNotes, setTokenNotes] = useState("");
  const [newPlaintextToken, setNewPlaintextToken] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Edit existing token modal state
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPreset, setEditPreset] = useState<McpRolePreset>("inherit");
  const [editScopes, setEditScopes] = useState<Record<McpScopeKey, boolean>>(() =>
    buildDefaultScopeMap("inherit")
  );
  const [editRateLimit, setEditRateLimit] = useState(60);
  const [editNotes, setEditNotes] = useState("");

  // Client snippet selector
  const [snippetTab, setSnippetTab] = useState<"claude" | "antigravity" | "vscode" | "curl">(
    "claude"
  );

  // Live Inspector / Probe State
  const [inspectorTarget, setInspectorTarget] = useState<string>("preset:editorial_writer");
  const [probeMethod, setProbeMethod] = useState<string>("tools/list");
  const [inspectionResult, setInspectionResult] = useState<InspectionPayload | null>(null);
  const [probeOutput, setProbeOutput] = useState<unknown>(null);
  const [inspectorBusy, setInspectorBusy] = useState(false);

  const groupedScopes = useMemo(() => {
    const groups: Record<McpScopeDomain, typeof MCP_SCOPE_DEFINITIONS> = {
      READ_PRIVACY: [],
      CONTENT_MODERATION: [],
      LABS_SKUNKWORKS: [],
      CRM_AUDIENCE: [],
      RESEARCH_MEDIA: [],
    };
    for (const def of MCP_SCOPE_DEFINITIONS) {
      groups[def.domain].push(def);
    }
    return groups;
  }, []);

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((c) => (c === key ? null : c)), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleCreatePresetChange = (next: McpRolePreset) => {
    setRolePreset(next);
    if (next !== "custom") {
      setCustomScopes(buildDefaultScopeMap(next));
    }
  };

  const toggleCreateScope = (key: McpScopeKey) => {
    setRolePreset("custom");
    setCustomScopes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const startEditToken = (t: OpsMcpTokenSummary) => {
    const preset: McpRolePreset =
      t.role_preset && t.role_preset in MCP_ROLE_PRESETS
        ? t.role_preset
        : t.permissions_mode === "readonly"
        ? "readonly_public"
        : t.permissions_mode === "full"
        ? "full_ops"
        : t.permissions_mode === "custom"
        ? "custom"
        : "inherit";

    const baseScopes = buildDefaultScopeMap(preset);
    if (t.custom_scopes) {
      for (const k of ALL_MCP_SCOPE_KEYS) {
        if (typeof t.custom_scopes[k] === "boolean") {
          baseScopes[k] = t.custom_scopes[k]!;
        }
      }
    }
    setEditingTokenId(t.id);
    setEditName(t.name);
    setEditPreset(preset);
    setEditScopes(baseScopes);
    setEditRateLimit(t.rate_limit_rpm ?? 60);
    setEditNotes(t.notes ?? "");
  };

  const handleEditPresetChange = (next: McpRolePreset) => {
    setEditPreset(next);
    if (next !== "custom") {
      setEditScopes(buildDefaultScopeMap(next));
    }
  };

  const saveEditToken = async () => {
    if (!editingTokenId) return;
    const mode = MCP_ROLE_PRESETS[editPreset].permissionsMode;
    await runAction(
      "update_mcp_token",
      {
        id: editingTokenId,
        name: editName,
        role_preset: editPreset,
        permissions_mode: mode,
        custom_scopes: editPreset === "custom" || mode === "custom" ? editScopes : {},
        rate_limit_rpm: editRateLimit,
        notes: editNotes,
      },
      `Updated permissions for "${editName}".`
    );
    setEditingTokenId(null);
  };

  const runInspection = async (overrideTarget?: string) => {
    const target = overrideTarget ?? inspectorTarget;
    if (overrideTarget) setInspectorTarget(overrideTarget);
    setInspectorBusy(true);
    try {
      const payload = target.startsWith("token:")
        ? { token_id: target.slice("token:".length) }
        : { role_preset: target.replace(/^preset:/, "") };
      const res = await fetch("/api/ops/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "inspect_mcp_token", args: payload }),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        data?: InspectionPayload;
      } | null;
      if (json?.ok && json.data) {
        setInspectionResult(json.data);
      }
    } finally {
      setInspectorBusy(false);
    }
  };

  const runRpcProbe = async () => {
    setInspectorBusy(true);
    try {
      const targetArgs = inspectorTarget.startsWith("token:")
        ? { token_id: inspectorTarget.slice("token:".length) }
        : { role_preset: inspectorTarget.replace(/^preset:/, "") };
      const toolCallParams =
        probeMethod === "tools/call:identity"
          ? { method: "tools/call", params: { name: "get_my_mcp_identity", arguments: {} } }
          : probeMethod === "tools/call:overview"
          ? { method: "tools/call", params: { name: "get_system_overview", arguments: {} } }
          : { method: probeMethod };

      const res = await fetch("/api/ops/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run_mcp_rpc_probe",
          args: { ...targetArgs, ...toolCallParams },
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        data?: unknown;
        error?: string;
      } | null;
      setProbeOutput(json?.data ?? json);
    } finally {
      setInspectorBusy(false);
    }
  };

  const tokenPlaceholder = newPlaintextToken || "YOUR_MCP_TOKEN";

  const clientSnippet = useMemo(() => {
    if (snippetTab === "claude") {
      return JSON.stringify(
        {
          mcpServers: {
            "g-gravitator-ops": {
              type: "http",
              url: endpointUrl,
              headers: {
                Authorization: `Bearer ${tokenPlaceholder}`,
                "MCP-Protocol-Version": "2025-11-25",
              },
            },
          },
        },
        null,
        2
      );
    }
    if (snippetTab === "antigravity") {
      return JSON.stringify(
        {
          mcpServers: {
            "g-gravitator-ops": {
              serverUrl: endpointUrl,
              headers: {
                Authorization: `Bearer ${tokenPlaceholder}`,
                "MCP-Protocol-Version": "2026-07-28",
              },
            },
          },
        },
        null,
        2
      );
    }
    if (snippetTab === "vscode") {
      return JSON.stringify(
        {
          servers: {
            "g-gravitator-ops": {
              type: "http",
              url: endpointUrl,
              headers: {
                Authorization: `Bearer ${tokenPlaceholder}`,
              },
            },
          },
        },
        null,
        2
      );
    }
    return `curl -sS -X POST "${endpointUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${tokenPlaceholder}" \\
  -H "MCP-Protocol-Version: 2026-07-28" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;
  }, [endpointUrl, snippetTab, tokenPlaceholder]);

  const activePresetInfo = MCP_ROLE_PRESETS[rolePreset];
  const allowFullParity = aiPermissions.mcp_allow_full_parity_tokens !== false;
  const allowPii = Boolean(aiPermissions.mcp_allow_pii_over_mcp);

  return (
    <section className="space-y-6 rounded-2xl border border-white/[0.08] bg-[#111114] p-6">
      {/* Header + Status */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-semibold text-[#F4F3EF]">
              External MCP Server &amp; Least-Privilege Tokens
            </h2>
            <span className="rounded-full border border-white/[0.1] bg-[#0B0B0E] px-2.5 py-0.5 font-mono text-[10px] text-[#A1A1AA]">
              Streamable HTTP · 2026-07-28 / 2025-11-25
            </span>
          </div>
          <p className="mt-1 text-xs text-[#8B8B94]">
            Scoped JSON-RPC 2.0 MCP endpoint with 29 granular permissions, 6 role presets,
            resource templates, prompts, sliding-window rate limits, and PII guardrails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 font-mono text-xs font-semibold ${
              aiPermissions.mcp_enabled
                ? "bg-[#10B981]/15 text-[#34D399]"
                : "bg-[#FF3B1F]/15 text-[#FF8A7A]"
            }`}
          >
            {aiPermissions.mcp_enabled ? "MCP ONLINE" : "MCP DISABLED"}
          </span>
          <span
            className={`rounded-full px-3 py-1 font-mono text-[11px] font-medium ${
              allowPii
                ? "bg-[#F59E0B]/15 text-[#FBBF24]"
                : "bg-white/[0.06] text-[#A1A1AA]"
            }`}
          >
            {allowPii ? "PII EXPOSED" : "PII SHIELDED"}
          </span>
          {onJumpToPermissions && (
            <button
              type="button"
              onClick={onJumpToPermissions}
              className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-full border border-white/[0.12] bg-[#18181D] px-3 text-[11px] text-[#D4D4D8] hover:text-[#F4F3EF]"
            >
              <Shield className="h-3 w-3" />
              <span>Global Ceilings</span>
            </button>
          )}
        </div>
      </div>

      {/* Endpoint Copy Bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.1] bg-[#0B0B0E] p-3">
        <code className="flex-1 truncate font-mono text-xs text-[#34D399]">
          {endpointUrl}
        </code>
        <button
          type="button"
          onClick={() => void handleCopy("mcp-url", endpointUrl)}
          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full bg-[#18181D] px-3 text-xs text-[#F4F3EF]"
        >
          {copiedKey === "mcp-url" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          <span>{copiedKey === "mcp-url" ? "Copied" : "Copy URL"}</span>
        </button>
      </div>

      {/* Issue Scoped Token Form */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const mode = MCP_ROLE_PRESETS[rolePreset].permissionsMode;
          const res = (await runAction(
            "create_mcp_token",
            {
              name: tokenName || "External AI Agent",
              role_preset: rolePreset,
              permissions_mode: mode,
              custom_scopes:
                rolePreset === "custom" || mode === "custom" ? customScopes : undefined,
              expires_in_days: expiresDays > 0 ? expiresDays : null,
              rate_limit_rpm: rateLimitRpm,
              notes: tokenNotes.trim() || undefined,
            },
            `Issued scoped MCP token (${MCP_ROLE_PRESETS[rolePreset].label}).`
          )) as { plaintextToken?: string } | null;

          if (res?.plaintextToken) {
            setNewPlaintextToken(res.plaintextToken);
          }
          setTokenName("");
          setTokenNotes("");
        }}
        className="space-y-4 rounded-xl border border-white/[0.08] bg-[#0B0B0E] p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold text-[#F4F3EF]">
            Issue Scoped MCP Token
          </div>
          <button
            type="button"
            onClick={() => setShowCreateMatrix((s) => !s)}
            className="inline-flex cursor-pointer items-center gap-1 text-xs text-[#A1A1AA] hover:text-[#F4F3EF]"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{showCreateMatrix ? "Hide 29-Scope Matrix" : "Customize 29 Scopes"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-12">
          <input
            type="text"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            placeholder="Client name (e.g. Claude Editorial, Cursor Labs)"
            className="h-9 rounded-xl border border-white/[0.12] bg-[#111114] px-3 text-xs text-[#F4F3EF] md:col-span-4"
          />

          <select
            value={rolePreset}
            onChange={(e) => handleCreatePresetChange(e.target.value as McpRolePreset)}
            className="h-9 rounded-xl border border-white/[0.12] bg-[#111114] px-3 text-xs text-[#F4F3EF] md:col-span-3"
          >
            <option value="editorial_writer">Preset: Editorial Writer</option>
            <option value="hackathon_scout">Preset: Hackathon Scout</option>
            <option value="labs_copilot">Preset: Labs Copilot</option>
            <option value="readonly_public">Preset: Public Read-Only</option>
            <option value="crm_operator">Preset: CRM &amp; Orbit Operator</option>
            <option value="inherit">Inherit Global AI Policy</option>
            <option value="full_ops" disabled={!allowFullParity}>
              Full Ops Parity {!allowFullParity ? "(Disabled Globally)" : ""}
            </option>
            <option value="custom">Custom Scope Selection</option>
          </select>

          <select
            value={expiresDays}
            onChange={(e) => setExpiresDays(Number(e.target.value))}
            className="h-9 rounded-xl border border-white/[0.12] bg-[#111114] px-3 text-xs text-[#F4F3EF] md:col-span-2"
          >
            <option value={7}>Expires: 7 days</option>
            <option value={30}>Expires: 30 days</option>
            <option value={90}>Expires: 90 days</option>
            <option value={365}>Expires: 1 year</option>
            <option value={0}>Expires: Never</option>
          </select>

          <select
            value={rateLimitRpm}
            onChange={(e) => setRateLimitRpm(Number(e.target.value))}
            className="h-9 rounded-xl border border-white/[0.12] bg-[#111114] px-3 text-xs text-[#F4F3EF] md:col-span-1"
          >
            <option value={30}>30 rpm</option>
            <option value={60}>60 rpm</option>
            <option value={120}>120 rpm</option>
            <option value={300}>300 rpm</option>
          </select>

          <button
            type="submit"
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#FF3B1F] px-4 text-xs font-semibold text-[#08080A] md:col-span-2"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Issue Token</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8B8B94]">
          <span>{activePresetInfo.description}</span>
          <input
            type="text"
            value={tokenNotes}
            onChange={(e) => setTokenNotes(e.target.value)}
            placeholder="Optional description or owner note..."
            className="h-7 w-full rounded-lg border border-white/[0.08] bg-[#111114] px-2.5 text-[11px] text-[#D4D4D8] sm:w-64"
          />
        </div>

        {!allowPii && rolePreset === "crm_operator" && (
          <div className="flex items-center gap-2 rounded-lg border border-[#F59E0B]/35 bg-[#F59E0B]/10 px-3 py-2 text-[11px] text-[#FBBF24]">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            <span>
              Global PII Ceiling (<code>mcp_allow_pii_over_mcp</code>) is currently OFF.
              CRM PII reads will stay blocked until you enable it in AI Permissions.
            </span>
          </div>
        )}

        {/* Fine-Grained Scope Matrix */}
        {showCreateMatrix && (
          <div className="space-y-4 border-t border-white/[0.08] pt-4">
            {(Object.keys(groupedScopes) as McpScopeDomain[]).map((domain) => (
              <div key={domain} className="space-y-2">
                <div className="font-mono text-[10px] font-semibold tracking-wider text-[#A1A1AA] uppercase">
                  {DOMAIN_LABELS[domain]}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {groupedScopes[domain].map((def) => {
                    const checked = Boolean(customScopes[def.key]);
                    return (
                      <label
                        key={def.key}
                        className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-xs transition-colors ${
                          checked
                            ? "border-[#10B981]/35 bg-[#10B981]/8"
                            : "border-white/[0.06] bg-[#111114]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCreateScope(def.key)}
                          className="mt-0.5 accent-[#10B981]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-medium text-[#F4F3EF]">
                              {def.label}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase ${
                                RISK_STYLES[def.risk]
                              }`}
                            >
                              {def.risk}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#8B8B94]">
                            {def.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </form>

      {/* Newly Issued / Rotated Plaintext Secret Banner */}
      {newPlaintextToken && (
        <div className="rounded-xl border border-[#10B981]/40 bg-[#10B981]/12 p-4 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-[#34D399]">
              Copy this MCP secret now (shown once — snippets below pre-filled automatically):
            </span>
            <button
              type="button"
              onClick={() => setNewPlaintextToken(null)}
              className="text-[#A1A1AA] hover:text-[#F4F3EF]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
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

      {/* Existing Tokens List */}
      {tokens.length > 0 && (
        <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-[#0B0B0E]">
          {tokens.map((t) => {
            const delKey = `mcp-${t.id}`;
            const isExpired = Boolean(t.is_expired);
            const presetLabel =
              MCP_ROLE_PRESETS[t.role_preset ?? "inherit"]?.badge ??
              t.permissions_mode.toUpperCase();
            const deniedCount = t.denied_count ?? 0;
            const requestCount = t.request_count ?? 0;

            return (
              <div key={t.id} className="space-y-2.5 px-4 py-3.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[#F4F3EF]">
                        {t.name}
                      </span>
                      <span className="font-mono text-[#8B8B94]">
                        {t.prefix}...
                      </span>
                      <span className="rounded-full bg-white/[0.08] px-2 py-0.5 font-mono text-[10px] text-[#D4D4D8]">
                        {presetLabel}
                      </span>
                      <span className="rounded-full bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] text-[#8B8B94]">
                        {t.rate_limit_rpm ?? 60} rpm
                      </span>
                      {!t.is_active ? (
                        <span className="rounded-full bg-[#FF3B1F]/15 px-2 py-0.5 font-mono text-[10px] text-[#FF8A7A]">
                          REVOKED
                        </span>
                      ) : isExpired ? (
                        <span className="rounded-full bg-[#F59E0B]/15 px-2 py-0.5 font-mono text-[10px] text-[#FBBF24]">
                          EXPIRED
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#10B981]/15 px-2 py-0.5 font-mono text-[10px] text-[#34D399]">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8B8B94]">
                      <span>{requestCount} reqs</span>
                      <span className={deniedCount > 0 ? "text-[#FBBF24]" : undefined}>
                        {deniedCount} denied
                      </span>
                      <span>Last used: {formatShortUtc(t.last_used_at)}</span>
                      {t.expires_at && (
                        <span>Expires: {t.expires_at.slice(0, 10)}</span>
                      )}
                      {t.last_client_info && (
                        <span className="font-mono text-[#A1A1AA]">
                          Client: {t.last_client_info}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => void runInspection(`token:${t.id}`)}
                      className="inline-flex cursor-pointer items-center gap-1 text-[#7DD3FC] hover:underline"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Inspect</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editingTokenId === t.id
                          ? setEditingTokenId(null)
                          : startEditToken(t)
                      }
                      className="inline-flex cursor-pointer items-center gap-1 text-[#D4D4D8] hover:underline"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>{editingTokenId === t.id ? "Close" : "Edit Scopes"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = (await runAction(
                          "rotate_mcp_token",
                          { id: t.id },
                          `Rotated secret for "${t.name}".`
                        )) as { plaintextToken?: string } | null;
                        if (res?.plaintextToken) {
                          setNewPlaintextToken(res.plaintextToken);
                        }
                      }}
                      className="inline-flex cursor-pointer items-center gap-1 text-[#34D399] hover:underline"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Rotate</span>
                    </button>
                    {t.is_active ? (
                      <button
                        type="button"
                        onClick={() =>
                          void runAction(
                            "revoke_mcp_token",
                            { id: t.id },
                            `Revoked MCP token "${t.name}".`
                          )
                        }
                        className="cursor-pointer text-[#FBBF24] hover:underline"
                      >
                        Revoke
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          void runAction(
                            "update_mcp_token",
                            { id: t.id, is_active: true },
                            `Reactivated MCP token "${t.name}".`
                          )
                        }
                        className="cursor-pointer text-[#34D399] hover:underline"
                      >
                        Reactivate
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        onConfirmedDelete(
                          delKey,
                          "delete_mcp_token",
                          { id: t.id },
                          `Deleted MCP token "${t.name}"`
                        )
                      }
                      className={`cursor-pointer hover:underline ${
                        confirmDeleteKey === delKey
                          ? "font-semibold text-[#FF3B1F]"
                          : "text-[#FF8A7A]"
                      }`}
                    >
                      {confirmDeleteKey === delKey ? "Confirm?" : "Delete"}
                    </button>
                  </div>
                </div>

                {/* Inline Edit Token Panel */}
                {editingTokenId === t.id && (
                  <div className="mt-3 space-y-3 rounded-xl border border-white/[0.1] bg-[#111114] p-4">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 rounded-lg border border-white/[0.12] bg-[#0B0B0E] px-2.5 text-xs text-[#F4F3EF]"
                      />
                      <select
                        value={editPreset}
                        onChange={(e) =>
                          handleEditPresetChange(e.target.value as McpRolePreset)
                        }
                        className="h-8 rounded-lg border border-white/[0.12] bg-[#0B0B0E] px-2.5 text-xs text-[#F4F3EF]"
                      >
                        {Object.values(MCP_ROLE_PRESETS).map((p) => (
                          <option
                            key={p.id}
                            value={p.id}
                            disabled={p.id === "full_ops" && !allowFullParity}
                          >
                            {p.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={5}
                        max={1000}
                        value={editRateLimit}
                        onChange={(e) => setEditRateLimit(Number(e.target.value) || 60)}
                        placeholder="RPM"
                        className="h-8 rounded-lg border border-white/[0.12] bg-[#0B0B0E] px-2.5 text-xs text-[#F4F3EF]"
                      />
                    </div>

                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Token notes..."
                      className="h-8 w-full rounded-lg border border-white/[0.12] bg-[#0B0B0E] px-2.5 text-xs text-[#D4D4D8]"
                    />

                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                      {MCP_SCOPE_DEFINITIONS.map((def) => {
                        const checked = Boolean(editScopes[def.key]);
                        return (
                          <label
                            key={def.key}
                            className="flex cursor-pointer items-center gap-2 rounded-md border border-white/[0.06] bg-[#0B0B0E] px-2.5 py-1.5 text-[11px]"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setEditPreset("custom");
                                setEditScopes((prev) => ({
                                  ...prev,
                                  [def.key]: !prev[def.key],
                                }));
                              }}
                              className="accent-[#10B981]"
                            />
                            <span className="truncate text-[#E4E4E7]">{def.label}</span>
                          </label>
                        );
                      })}
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingTokenId(null)}
                        className="h-8 cursor-pointer rounded-full border border-white/[0.12] px-3 text-xs text-[#A1A1AA]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void saveEditToken()}
                        className="h-8 cursor-pointer rounded-full bg-[#10B981] px-4 text-xs font-semibold text-[#08080A]"
                      >
                        Save Scope Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Multi-Client Config Generator */}
      <div className="space-y-2 rounded-xl border border-white/[0.08] bg-[#0B0B0E] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["claude", "Claude / Cursor"],
                ["antigravity", "Antigravity"],
                ["vscode", "VS Code MCP"],
                ["curl", "cURL Test"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSnippetTab(id)}
                className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium ${
                  snippetTab === id
                    ? "bg-[#F4F3EF] text-[#08080A]"
                    : "bg-[#18181D] text-[#A1A1AA]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void handleCopy("mcp-cfg", clientSnippet)}
            className="inline-flex cursor-pointer items-center gap-1 text-xs text-[#F4F3EF] hover:underline"
          >
            {copiedKey === "mcp-cfg" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <span>{copiedKey === "mcp-cfg" ? "Copied" : "Copy Snippet"}</span>
          </button>
        </div>
        <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-[#08080A] p-3 font-mono text-[11px] text-[#A1A1AA]">
          {clientSnippet}
        </pre>
      </div>

      {/* Live MCP Inspector & JSON-RPC Probe */}
      <div className="space-y-3 rounded-xl border border-white/[0.08] bg-[#0B0B0E] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#F4F3EF]">
            <Terminal className="h-4 w-4 text-[#FF3B1F]" />
            <span>Live MCP Protocol Inspector &amp; Simulator</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={inspectorTarget}
              onChange={(e) => setInspectorTarget(e.target.value)}
              className="h-8 rounded-lg border border-white/[0.12] bg-[#111114] px-2.5 text-xs text-[#F4F3EF]"
            >
              <optgroup label="Simulate Preset">
                {Object.values(MCP_ROLE_PRESETS).map((p) => (
                  <option key={p.id} value={`preset:${p.id}`}>
                    Simulate: {p.label}
                  </option>
                ))}
              </optgroup>
              {tokens.length > 0 && (
                <optgroup label="Issued Tokens">
                  {tokens.map((t) => (
                    <option key={t.id} value={`token:${t.id}`}>
                      Token: {t.name} ({t.prefix}...)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            <button
              type="button"
              disabled={inspectorBusy}
              onClick={() => void runInspection()}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-[#18181D] px-3 text-xs text-[#F4F3EF] hover:bg-white/[0.12]"
            >
              {inspectorBusy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3 text-[#34D399]" />
              )}
              <span>Inspect Scopes</span>
            </button>

            <select
              value={probeMethod}
              onChange={(e) => setProbeMethod(e.target.value)}
              className="h-8 rounded-lg border border-white/[0.12] bg-[#111114] px-2.5 text-xs text-[#F4F3EF]"
            >
              <option value="server/discover">RPC: server/discover</option>
              <option value="initialize">RPC: initialize</option>
              <option value="tools/list">RPC: tools/list</option>
              <option value="resources/list">RPC: resources/list</option>
              <option value="resources/templates/list">RPC: resources/templates/list</option>
              <option value="prompts/list">RPC: prompts/list</option>
              <option value="tools/call:identity">Tool: get_my_mcp_identity</option>
              <option value="tools/call:overview">Tool: get_system_overview</option>
            </select>

            <button
              type="button"
              disabled={inspectorBusy}
              onClick={() => void runRpcProbe()}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-[#FF3B1F] px-3 text-xs font-semibold text-[#08080A]"
            >
              <Play className="h-3 w-3" />
              <span>Run Probe</span>
            </button>
          </div>
        </div>

        {inspectionResult && (
          <div className="space-y-3 rounded-lg border border-white/[0.06] bg-[#111114] p-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[#34D399]">
                {inspectionResult.counts.tools} tools exposed
              </span>
              <span className="font-mono text-[#7DD3FC]">
                {inspectionResult.counts.resources} resources
              </span>
              <span className="font-mono text-[#FBBF24]">
                {inspectionResult.counts.resourceTemplates} URI templates
              </span>
              <span className="font-mono text-[#C084FC]">
                {inspectionResult.counts.prompts} prompts
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {inspectionResult.tools.map((tool) => (
                <span
                  key={tool.name}
                  className={`rounded-md px-2 py-0.5 font-mono text-[10px] ${
                    tool.destructiveHint
                      ? "bg-[#FF3B1F]/15 text-[#FF8A7A]"
                      : tool.readOnlyHint
                      ? "bg-[#10B981]/12 text-[#34D399]"
                      : "bg-white/[0.08] text-[#E4E4E7]"
                  }`}
                >
                  {tool.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {probeOutput !== null && (
          <pre className="max-h-72 overflow-auto rounded-lg border border-white/[0.06] bg-[#08080A] p-3 font-mono text-[11px] text-[#D4D4D8]">
            {JSON.stringify(probeOutput, null, 2)}
          </pre>
        )}
      </div>
    </section>
  );
}
