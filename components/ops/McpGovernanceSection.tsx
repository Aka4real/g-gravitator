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
  READ_PRIVACY: "Read and privacy (PII gated)",
  CONTENT_MODERATION: "Content and moderation",
  LABS_SKUNKWORKS: "Labs and Skunkworks",
  CRM_AUDIENCE: "CRM and audience",
  RESEARCH_MEDIA: "Research, ingestion, and media",
};

const RISK_TEXT_STYLES: Record<string, string> = {
  low: "text-[#34D399]",
  medium: "text-[#7DD3FC]",
  high: "text-[#FBBF24]",
  destructive: "text-[#FF8A7A]",
};

function formatShortUtc(iso: string | null | undefined): string {
  if (!iso) return "--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--";
  return d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

function buildDefaultScopeMap(
  preset: McpRolePreset
): Record<McpScopeKey, boolean> {
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
  resourceTemplates: Array<{
    uriTemplate: string;
    name: string;
    mimeType: string;
  }>;
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
  const [rolePreset, setRolePreset] =
    useState<McpRolePreset>("editorial_writer");
  const [customScopes, setCustomScopes] = useState<
    Record<McpScopeKey, boolean>
  >(() => buildDefaultScopeMap("editorial_writer"));
  const [showCreateMatrix, setShowCreateMatrix] = useState(false);
  const [expiresDays, setExpiresDays] = useState<number>(90);
  const [rateLimitRpm, setRateLimitRpm] = useState<number>(60);
  const [tokenNotes, setTokenNotes] = useState("");
  const [newPlaintextToken, setNewPlaintextToken] = useState<string | null>(
    null
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPreset, setEditPreset] = useState<McpRolePreset>("inherit");
  const [editScopes, setEditScopes] = useState<Record<McpScopeKey, boolean>>(
    () => buildDefaultScopeMap("inherit")
  );
  const [editRateLimit, setEditRateLimit] = useState(60);
  const [editNotes, setEditNotes] = useState("");

  const [snippetTab, setSnippetTab] = useState<
    "claude" | "antigravity" | "vscode" | "curl"
  >("claude");

  const [inspectorTarget, setInspectorTarget] = useState<string>(
    "preset:editorial_writer"
  );
  const [probeMethod, setProbeMethod] = useState<string>("tools/list");
  const [inspectionResult, setInspectionResult] =
    useState<InspectionPayload | null>(null);
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
        custom_scopes:
          editPreset === "custom" || mode === "custom" ? editScopes : {},
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
          ? {
              method: "tools/call",
              params: { name: "get_my_mcp_identity", arguments: {} },
            }
          : probeMethod === "tools/call:overview"
          ? {
              method: "tools/call",
              params: { name: "get_system_overview", arguments: {} },
            }
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
    <section className="space-y-6 rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)] p-6">
      {/* Header + Plain Status Summary */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--hairline)] pb-5">
        <div>
          <h2 className="type-subhead text-[var(--ink-primary)]">
            External MCP server and least-privilege tokens
          </h2>
          <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
            Streamable HTTP JSON-RPC 2.0 (2026-07-28 / 2025-11-25) with 29
            granular scopes, 6 role presets, rate limits, and PII guardrails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[13px] font-medium">
          <span
            className={
              aiPermissions.mcp_enabled ? "text-[#34D399]" : "text-[#FF8A7A]"
            }
          >
            {aiPermissions.mcp_enabled ? "MCP online" : "MCP disabled"}
          </span>
          <span aria-hidden="true" className="text-white/25">
            ·
          </span>
          <span
            className={allowPii ? "text-[#FBBF24]" : "text-[var(--ink-muted)]"}
          >
            {allowPii ? "PII exposed" : "PII shielded"}
          </span>
          {onJumpToPermissions && (
            <button
              type="button"
              onClick={onJumpToPermissions}
              className="inline-flex cursor-pointer items-center gap-1.5 text-[var(--ink-primary)] underline decoration-white/30 underline-offset-4 transition-colors duration-150 hover:text-[#FF7A63]"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Global ceilings</span>
            </button>
          )}
        </div>
      </div>

      {/* Endpoint Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--hairline)] bg-[var(--bg-canvas)] px-4 py-3">
        <code className="flex-1 truncate text-[13px] text-[#34D399]">
          {endpointUrl}
        </code>
        <button
          type="button"
          onClick={() => void handleCopy("mcp-url", endpointUrl)}
          className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-[var(--ink-primary)] transition-colors duration-150 hover:text-[#FF7A63]"
        >
          {copiedKey === "mcp-url" ? (
            <Check className="h-3.5 w-3.5 text-[#34D399]" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
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
                rolePreset === "custom" || mode === "custom"
                  ? customScopes
                  : undefined,
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
        className="space-y-4 border-t border-[var(--hairline)] pt-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[14px] font-semibold text-[var(--ink-primary)]">
            Issue scoped MCP token
          </div>
          <button
            type="button"
            onClick={() => setShowCreateMatrix((s) => !s)}
            className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-[var(--ink-muted)] transition-colors duration-150 hover:text-[var(--ink-primary)]"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>
              {showCreateMatrix ? "Hide 29-scope matrix" : "Customize 29 scopes"}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-12">
          <input
            type="text"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            placeholder="Client name (e.g. Claude Editorial, Cursor Labs)"
            aria-label="MCP client name"
            className="h-10 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3.5 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none md:col-span-4"
          />

          <select
            aria-label="MCP role preset"
            value={rolePreset}
            onChange={(e) =>
              handleCreatePresetChange(e.target.value as McpRolePreset)
            }
            className="h-10 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3 text-[13px] text-[var(--ink-primary)] focus:border-[var(--accent)] focus:outline-none md:col-span-3"
          >
            <option value="editorial_writer">Preset: Editorial Writer</option>
            <option value="hackathon_scout">Preset: Hackathon Scout</option>
            <option value="labs_copilot">Preset: Labs Copilot</option>
            <option value="readonly_public">Preset: Public Read-Only</option>
            <option value="crm_operator">Preset: CRM &amp; Orbit Operator</option>
            <option value="inherit">Inherit Global AI Policy</option>
            <option value="full_ops" disabled={!allowFullParity}>
              Full Ops Parity {!allowFullParity ? "(Disabled globally)" : ""}
            </option>
            <option value="custom">Custom Scope Selection</option>
          </select>

          <select
            aria-label="Token expiration"
            value={expiresDays}
            onChange={(e) => setExpiresDays(Number(e.target.value))}
            className="h-10 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3 text-[13px] text-[var(--ink-primary)] focus:border-[var(--accent)] focus:outline-none md:col-span-2"
          >
            <option value={7}>Expires: 7 days</option>
            <option value={30}>Expires: 30 days</option>
            <option value={90}>Expires: 90 days</option>
            <option value={365}>Expires: 1 year</option>
            <option value={0}>Expires: Never</option>
          </select>

          <select
            aria-label="Rate limit RPM"
            value={rateLimitRpm}
            onChange={(e) => setRateLimitRpm(Number(e.target.value))}
            className="h-10 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3 text-[13px] text-[var(--ink-primary)] focus:border-[var(--accent)] focus:outline-none md:col-span-1"
          >
            <option value={30}>30 rpm</option>
            <option value={60}>60 rpm</option>
            <option value={120}>120 rpm</option>
            <option value={300}>300 rpm</option>
          </select>

          <button
            type="submit"
            className="press-tactile inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-[#07090D] hover:bg-[var(--accent-hover)] md:col-span-2"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Issue token</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-[var(--ink-muted)]">
          <span>{activePresetInfo.description}</span>
          <input
            type="text"
            value={tokenNotes}
            onChange={(e) => setTokenNotes(e.target.value)}
            placeholder="Optional owner note..."
            aria-label="Optional token note"
            className="h-9 w-full rounded-xl border border-[var(--hairline)] bg-[var(--bg-canvas)] px-3 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] sm:w-64"
          />
        </div>

        {!allowPii && rolePreset === "crm_operator" && (
          <div className="flex items-center gap-2 border-l-2 border-[#F59E0B] pl-3 text-[13px] text-[#FBBF24]">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              Global PII ceiling (<code>mcp_allow_pii_over_mcp</code>) is OFF.
              CRM PII reads remain blocked until enabled in AI Permissions.
            </span>
          </div>
        )}

        {showCreateMatrix && (
          <div className="space-y-5 border-t border-[var(--hairline)] pt-5">
            {(Object.keys(groupedScopes) as McpScopeDomain[]).map((domain) => (
              <div key={domain} className="space-y-2.5">
                <div className="text-[13px] font-semibold text-[var(--ink-primary)]">
                  {DOMAIN_LABELS[domain]}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {groupedScopes[domain].map((def) => {
                    const checked = Boolean(customScopes[def.key]);
                    return (
                      <label
                        key={def.key}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-[13px] transition-colors duration-150 ${
                          checked
                            ? "border-[#10B981]/40 bg-[#10B981]/[0.07]"
                            : "border-[var(--hairline)] bg-[var(--bg-canvas)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCreateScope(def.key)}
                          className="mt-0.5 h-4 w-4 accent-[#10B981]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="font-medium text-[var(--ink-primary)]">
                              {def.label}
                            </span>
                            <span
                              className={`text-[12px] font-medium ${
                                RISK_TEXT_STYLES[def.risk]
                              }`}
                            >
                              {def.risk}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[13px] text-[var(--ink-muted)]">
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

      {/* Plaintext Secret Banner */}
      {newPlaintextToken && (
        <div className="rounded-xl border border-[#10B981]/40 bg-[#10B981]/10 p-4 text-[13px]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-[#34D399]">
              Copy this MCP secret now (shown once, pre-filled in snippets
              below):
            </span>
            <button
              type="button"
              onClick={() => setNewPlaintextToken(null)}
              aria-label="Dismiss token banner"
              className="cursor-pointer text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <code className="flex-1 break-all rounded-lg bg-[var(--bg-canvas)] p-2.5 text-[13px] text-[var(--ink-primary)]">
              {newPlaintextToken}
            </code>
            <button
              type="button"
              onClick={() => void handleCopy("mcp-tok", newPlaintextToken)}
              className="press-tactile h-9 cursor-pointer rounded-full bg-[#10B981] px-4 font-semibold text-[#07090D]"
            >
              {copiedKey === "mcp-tok" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Existing Tokens Ledger */}
      {tokens.length > 0 && (
        <div className="divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
          {tokens.map((t) => {
            const delKey = `mcp-${t.id}`;
            const isExpired = Boolean(t.is_expired);
            const presetLabel =
              MCP_ROLE_PRESETS[t.role_preset ?? "inherit"]?.badge ??
              t.permissions_mode;
            const deniedCount = t.denied_count ?? 0;
            const requestCount = t.request_count ?? 0;

            return (
              <div key={t.id} className="space-y-3 py-4 text-[13px]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="font-tabular flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                      <span className="text-[14px] font-semibold text-[var(--ink-primary)]">
                        {t.name}
                      </span>
                      <span className="text-[var(--ink-muted)]">
                        {t.prefix}...
                      </span>
                      <span className="text-[var(--ink-muted)]">
                        {presetLabel} · {t.rate_limit_rpm ?? 60} rpm
                      </span>
                      <span
                        className={`font-medium ${
                          !t.is_active
                            ? "text-[#FF8A7A]"
                            : isExpired
                            ? "text-[#FBBF24]"
                            : "text-[#34D399]"
                        }`}
                      >
                        {!t.is_active
                          ? "Revoked"
                          : isExpired
                          ? "Expired"
                          : "Active"}
                      </span>
                    </div>

                    <div className="font-tabular flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--ink-muted)]">
                      <span>{requestCount} requests</span>
                      <span className={deniedCount > 0 ? "text-[#FBBF24]" : ""}>
                        {deniedCount} denied
                      </span>
                      <span>Last used: {formatShortUtc(t.last_used_at)}</span>
                      {t.expires_at && (
                        <span>Expires: {t.expires_at.slice(0, 10)}</span>
                      )}
                      {t.last_client_info && (
                        <span>Client: {t.last_client_info}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3.5 text-[13px] font-medium">
                    <button
                      type="button"
                      onClick={() => void runInspection(`token:${t.id}`)}
                      className="inline-flex cursor-pointer items-center gap-1 text-[#7DD3FC] hover:underline"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Inspect</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editingTokenId === t.id
                          ? setEditingTokenId(null)
                          : startEditToken(t)
                      }
                      className="inline-flex cursor-pointer items-center gap-1 text-[var(--ink-primary)] hover:underline"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>
                        {editingTokenId === t.id ? "Close" : "Edit scopes"}
                      </span>
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
                      <RefreshCw className="h-3.5 w-3.5" />
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
                          ? "font-semibold text-[var(--accent)]"
                          : "text-[#FF8A7A]"
                      }`}
                    >
                      {confirmDeleteKey === delKey ? "Confirm?" : "Delete"}
                    </button>
                  </div>
                </div>

                {editingTokenId === t.id && (
                  <div className="mt-3 space-y-3 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] p-4">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-9 rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-3 text-[13px] text-[var(--ink-primary)]"
                      />
                      <select
                        value={editPreset}
                        onChange={(e) =>
                          handleEditPresetChange(
                            e.target.value as McpRolePreset
                          )
                        }
                        className="h-9 rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-3 text-[13px] text-[var(--ink-primary)]"
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
                        onChange={(e) =>
                          setEditRateLimit(Number(e.target.value) || 60)
                        }
                        placeholder="RPM"
                        className="h-9 rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-3 text-[13px] text-[var(--ink-primary)]"
                      />
                    </div>

                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Token notes..."
                      className="h-9 w-full rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-3 text-[13px] text-[var(--ink-primary)]"
                    />

                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                      {MCP_SCOPE_DEFINITIONS.map((def) => {
                        const checked = Boolean(editScopes[def.key]);
                        return (
                          <label
                            key={def.key}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--hairline)] bg-[var(--bg-surface)] px-3 py-2 text-[13px]"
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
                              className="h-3.5 w-3.5 accent-[#10B981]"
                            />
                            <span className="truncate text-[var(--ink-primary)]">
                              {def.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    <div className="flex justify-end gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingTokenId(null)}
                        className="cursor-pointer px-3 text-[13px] font-medium text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void saveEditToken()}
                        className="press-tactile h-9 cursor-pointer rounded-full bg-[#10B981] px-4 text-[13px] font-semibold text-[#07090D]"
                      >
                        Save scope changes
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
      <div className="space-y-3 border-t border-[var(--hairline)] pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="MCP client snippet format"
            className="inline-flex flex-wrap rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] p-1"
          >
            {(
              [
                ["claude", "Claude / Cursor"],
                ["antigravity", "Antigravity"],
                ["vscode", "VS Code"],
                ["curl", "cURL"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={snippetTab === id}
                onClick={() => setSnippetTab(id)}
                className={`cursor-pointer rounded-full px-3.5 py-1 text-[13px] font-medium transition-colors duration-150 ${
                  snippetTab === id
                    ? "bg-[var(--ink-primary)] text-[#07090D]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void handleCopy("mcp-cfg", clientSnippet)}
            className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-[var(--ink-primary)] hover:text-[#FF7A63]"
          >
            {copiedKey === "mcp-cfg" ? (
              <Check className="h-3.5 w-3.5 text-[#34D399]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copiedKey === "mcp-cfg" ? "Copied" : "Copy snippet"}</span>
          </button>
        </div>
        <pre className="overflow-x-auto rounded-xl border border-[var(--hairline)] bg-[var(--bg-canvas)] p-4 text-[13px] leading-relaxed text-[var(--ink-muted)]">
          <code>{clientSnippet}</code>
        </pre>
      </div>

      {/* Live MCP Protocol Inspector & JSON-RPC Probe */}
      <div className="space-y-3 border-t border-[var(--hairline)] pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-[var(--ink-primary)]">
            <Terminal className="h-4 w-4 text-[var(--accent)]" />
            <span>Live MCP protocol inspector and simulator</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Inspect target"
              value={inspectorTarget}
              onChange={(e) => setInspectorTarget(e.target.value)}
              className="h-9 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3 text-[13px] text-[var(--ink-primary)]"
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
              className="press-tactile inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-recessed)] px-3.5 text-[13px] font-medium text-[var(--ink-primary)]"
            >
              {inspectorBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-[#34D399]" />
              )}
              <span>Inspect scopes</span>
            </button>

            <select
              aria-label="RPC probe method"
              value={probeMethod}
              onChange={(e) => setProbeMethod(e.target.value)}
              className="h-9 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3 text-[13px] text-[var(--ink-primary)]"
            >
              <option value="server/discover">RPC: server/discover</option>
              <option value="initialize">RPC: initialize</option>
              <option value="tools/list">RPC: tools/list</option>
              <option value="resources/list">RPC: resources/list</option>
              <option value="resources/templates/list">
                RPC: resources/templates/list
              </option>
              <option value="prompts/list">RPC: prompts/list</option>
              <option value="tools/call:identity">
                Tool: get_my_mcp_identity
              </option>
              <option value="tools/call:overview">
                Tool: get_system_overview
              </option>
            </select>

            <button
              type="button"
              disabled={inspectorBusy}
              onClick={() => void runRpcProbe()}
              className="press-tactile inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-[#07090D]"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Run probe</span>
            </button>
          </div>
        </div>

        {inspectionResult && (
          <div className="space-y-3 rounded-xl border border-[var(--hairline)] bg-[var(--bg-canvas)] p-4 text-[13px]">
            <div className="font-tabular flex flex-wrap items-center gap-x-4 gap-y-1 font-medium">
              <span className="text-[#34D399]">
                {inspectionResult.counts.tools} tools exposed
              </span>
              <span className="text-[#7DD3FC]">
                {inspectionResult.counts.resources} resources
              </span>
              <span className="text-[#FBBF24]">
                {inspectionResult.counts.resourceTemplates} URI templates
              </span>
              <span className="text-[var(--ink-primary)]">
                {inspectionResult.counts.prompts} prompts
              </span>
            </div>

            <p className="text-[13px] leading-relaxed text-[var(--ink-muted)]">
              {inspectionResult.tools.map((tool, i) => (
                <React.Fragment key={tool.name}>
                  {i > 0 && " · "}
                  <code
                    className={
                      tool.destructiveHint
                        ? "text-[#FF8A7A]"
                        : tool.readOnlyHint
                        ? "text-[#34D399]"
                        : "text-[var(--ink-primary)]"
                    }
                  >
                    {tool.name}
                  </code>
                </React.Fragment>
              ))}
            </p>
          </div>
        )}

        {probeOutput !== null && (
          <pre className="max-h-72 overflow-auto rounded-xl border border-[var(--hairline)] bg-[var(--bg-canvas)] p-4 text-[13px] text-[var(--ink-muted)]">
            <code>{JSON.stringify(probeOutput, null, 2)}</code>
          </pre>
        )}
      </div>
    </section>
  );
}
