import type {
  AiPermissionsPolicy,
  McpPermissionsMode,
  McpRolePreset,
  McpScopeKey,
  McpScopeMap,
} from "@/lib/supabase/types";

export interface OpsActorContext {
  actorType: "admin" | "ai_assistant" | "mcp";
  actorLabel: string;
  permissionsMode?: McpPermissionsMode;
  tokenId?: string;
  rolePreset?: McpRolePreset;
  customScopes?: McpScopeMap;
  expiresAt?: string | null;
  rateLimitRpm?: number;
}

export type McpScopeDomain =
  | "READ_PRIVACY"
  | "CONTENT_MODERATION"
  | "LABS_SKUNKWORKS"
  | "CRM_AUDIENCE"
  | "RESEARCH_MEDIA";

export interface McpScopeDefinition {
  key: McpScopeKey;
  label: string;
  description: string;
  domain: McpScopeDomain;
  risk: "low" | "medium" | "high" | "destructive";
  isPii?: boolean;
}

export const MCP_SCOPE_DEFINITIONS: McpScopeDefinition[] = [
  // 1. Read & Privacy
  {
    key: "can_read_public_content",
    label: "Read Public Content",
    description: "Read published Dispatches, Orbital Wire News, Hackathons, and Labs/Skunkworks.",
    domain: "READ_PRIVACY",
    risk: "low",
  },
  {
    key: "can_read_drafts_and_pending",
    label: "Read Drafts & Review Queue",
    description: "Read unpublished drafts, pending review items, rejected posts, and ingestion health.",
    domain: "READ_PRIVACY",
    risk: "low",
  },
  {
    key: "can_read_media_library",
    label: "Read Media Library",
    description: "List and inspect uploaded or AI-generated image assets in Media Studio.",
    domain: "READ_PRIVACY",
    risk: "low",
  },
  {
    key: "can_read_inquiries_pii",
    label: "Read B2B Inquiries (PII)",
    description: "Read client names, emails, budgets, and briefs. Also requires Global PII Ceiling ON.",
    domain: "READ_PRIVACY",
    risk: "high",
    isPii: true,
  },
  {
    key: "can_read_orbit_pii",
    label: "Read Orbit Applicants (PII)",
    description: "Read Orbit Cycle applicant emails, portfolios, and reviewer notes. Requires Global PII ON.",
    domain: "READ_PRIVACY",
    risk: "high",
    isPii: true,
  },
  {
    key: "can_read_subscribers_pii",
    label: "Read Newsletter Subscribers (PII)",
    description: "Read subscriber email addresses. Requires Global PII Ceiling ON.",
    domain: "READ_PRIVACY",
    risk: "high",
    isPii: true,
  },
  {
    key: "can_read_audit_logs",
    label: "Read System Audit Logs",
    description: "Inspect recent Admin, AI Operator, and MCP audit log trails.",
    domain: "READ_PRIVACY",
    risk: "medium",
  },

  // 2. Content & Moderation
  {
    key: "can_create_journal",
    label: "Create Journal Dispatches",
    description: "Create new long-form Dispatches (subject to direct-publish gate).",
    domain: "CONTENT_MODERATION",
    risk: "medium",
  },
  {
    key: "can_create_news",
    label: "Create Orbital Wire News",
    description: "Create new Orbital Wire signal posts (subject to direct-publish gate).",
    domain: "CONTENT_MODERATION",
    risk: "medium",
  },
  {
    key: "can_create_hackathons",
    label: "Create Hackathons",
    description: "Create new Hackathon Radar entries (subject to direct-publish gate).",
    domain: "CONTENT_MODERATION",
    risk: "medium",
  },
  {
    key: "can_edit_posts",
    label: "Edit Existing Posts",
    description: "Modify copy, design metadata, cover images, and links on existing posts.",
    domain: "CONTENT_MODERATION",
    risk: "medium",
  },
  {
    key: "can_publish_directly_journal",
    label: "Direct-Publish Journal Dispatches",
    description: "Publish newly created Dispatches live immediately without Review Queue.",
    domain: "CONTENT_MODERATION",
    risk: "high",
  },
  {
    key: "can_publish_directly_news",
    label: "Direct-Publish Orbital Wire News",
    description: "Publish newly created Orbital Wire items live immediately without Review Queue.",
    domain: "CONTENT_MODERATION",
    risk: "medium",
  },
  {
    key: "can_publish_directly_hackathons",
    label: "Direct-Publish Hackathons",
    description: "Publish newly created Hackathons live immediately without Review Queue.",
    domain: "CONTENT_MODERATION",
    risk: "medium",
  },
  {
    key: "can_approve_posts",
    label: "Approve Pending Posts",
    description: "Approve and publish queued Dispatches, News, or Hackathons.",
    domain: "CONTENT_MODERATION",
    risk: "high",
  },
  {
    key: "can_revoke_approval",
    label: "Revoke Approval / Reject",
    description: "Unpublish live items back to review or mark submissions REJECTED.",
    domain: "CONTENT_MODERATION",
    risk: "high",
  },
  {
    key: "can_bulk_moderate",
    label: "Bulk Moderate Queue",
    description: "Batch approve, revoke, or reject up to 25 items in a single operation.",
    domain: "CONTENT_MODERATION",
    risk: "high",
  },
  {
    key: "can_delete_posts",
    label: "Delete Individual Posts",
    description: "Permanently delete a Dispatch, News item, or Hackathon by ID.",
    domain: "CONTENT_MODERATION",
    risk: "destructive",
  },
  {
    key: "can_purge_expired_posts",
    label: "Bulk Purge Expired/Old Posts",
    description: "Run remove_old_posts cleanup (gated by mandatory dry-run preview when enabled).",
    domain: "CONTENT_MODERATION",
    risk: "destructive",
  },

  // 3. Labs & Skunkworks
  {
    key: "can_manage_labs",
    label: "Manage Labs & Changelogs",
    description: "Create, edit, or delete Lab Drops / Skunkworks entries and append changelogs.",
    domain: "LABS_SKUNKWORKS",
    risk: "high",
  },
  {
    key: "can_score_lab_graduation",
    label: "Update 25-Pt Graduation Scorecards",
    description: "Score Labs/Skunkworks candidates across the 5 graduation rubric dimensions.",
    domain: "LABS_SKUNKWORKS",
    risk: "medium",
  },
  {
    key: "can_promote_to_skunkworks",
    label: "Graduate Skunkworks → Labs (G-XX)",
    description: "Promote high-scoring OXAKALABS Skunkworks prototypes into G-Gravitator Labs (G-XX).",
    domain: "LABS_SKUNKWORKS",
    risk: "high",
  },

  // 4. CRM & Audience
  {
    key: "can_manage_inquiries",
    label: "Manage B2B Client Inquiries",
    description: "Update pipeline statuses or delete B2B client inquiry records.",
    domain: "CRM_AUDIENCE",
    risk: "high",
  },
  {
    key: "can_manage_orbit_and_subscribers",
    label: "Manage Orbit & Newsletter",
    description: "Update Orbit applications and add/delete newsletter subscribers.",
    domain: "CRM_AUDIENCE",
    risk: "high",
  },
  {
    key: "can_export_crm_data",
    label: "Export CRM / Subscriber Lists (PII)",
    description: "Export structured CRM & audience data. Requires Global PII Ceiling ON.",
    domain: "CRM_AUDIENCE",
    risk: "high",
    isPii: true,
  },

  // 5. Research, AI & Media
  {
    key: "can_trigger_ingestion",
    label: "Trigger Live Ingestion Pipelines",
    description: "Run live Hackathon (Devpost/X) and Orbital Wire (HN/arXiv) sync pipelines.",
    domain: "RESEARCH_MEDIA",
    risk: "medium",
  },
  {
    key: "can_web_research",
    label: "Web Research & URL Fetching",
    description: "Search live web sources and fetch sanitized webpage metadata.",
    domain: "RESEARCH_MEDIA",
    risk: "medium",
  },
  {
    key: "can_use_ai_drafter",
    label: "Invoke Gemini Editorial Drafter",
    description: "Run structured AI drafting via draft_post_with_ai (returns preview JSON).",
    domain: "RESEARCH_MEDIA",
    risk: "medium",
  },
  {
    key: "can_manage_media",
    label: "Generate, Upload & Delete Media",
    description: "Generate cover visuals, import URLs, upload images, and delete assets.",
    domain: "RESEARCH_MEDIA",
    risk: "medium",
  },
];

export const ALL_MCP_SCOPE_KEYS: McpScopeKey[] = MCP_SCOPE_DEFINITIONS.map((d) => d.key);

export interface McpRolePresetInfo {
  id: McpRolePreset;
  label: string;
  badge: string;
  description: string;
  permissionsMode: McpPermissionsMode;
  defaultScopes: Record<McpScopeKey, boolean>;
}

function makeScopeMap(enabledKeys: McpScopeKey[]): Record<McpScopeKey, boolean> {
  const set = new Set<McpScopeKey>(enabledKeys);
  const out = {} as Record<McpScopeKey, boolean>;
  for (const k of ALL_MCP_SCOPE_KEYS) {
    out[k] = set.has(k);
  }
  return out;
}

export const MCP_ROLE_PRESETS: Record<McpRolePreset, McpRolePresetInfo> = {
  inherit: {
    id: "inherit",
    label: "Inherit AI Policy",
    badge: "INHERIT",
    description: "Dynamically follows global AI Permissions toggles. PII remains off unless Global PII Ceiling is ON.",
    permissionsMode: "inherit",
    defaultScopes: makeScopeMap([
      "can_read_public_content",
      "can_read_drafts_and_pending",
      "can_read_media_library",
    ]),
  },
  readonly_public: {
    id: "readonly_public",
    label: "Public Reader (Read-Only)",
    badge: "READONLY",
    description: "Strict read-only access to published Dispatches, News, Hackathons, Labs, and Media. Zero drafts or PII.",
    permissionsMode: "readonly",
    defaultScopes: makeScopeMap(["can_read_public_content", "can_read_media_library"]),
  },
  editorial_writer: {
    id: "editorial_writer",
    label: "Editorial Writer",
    badge: "EDITORIAL",
    description: "Draft Journal Dispatches & Orbital Wire news with web research and cover generation; held for Admin review.",
    permissionsMode: "custom",
    defaultScopes: makeScopeMap([
      "can_read_public_content",
      "can_read_drafts_and_pending",
      "can_read_media_library",
      "can_create_journal",
      "can_create_news",
      "can_edit_posts",
      "can_web_research",
      "can_use_ai_drafter",
      "can_manage_media",
    ]),
  },
  hackathon_scout: {
    id: "hackathon_scout",
    label: "Hackathon Scout",
    badge: "SCOUT",
    description: "Ingest, research, create, and update Hackathon Radar entries without touching Journal, Labs, or CRM.",
    permissionsMode: "custom",
    defaultScopes: makeScopeMap([
      "can_read_public_content",
      "can_read_drafts_and_pending",
      "can_read_media_library",
      "can_create_hackathons",
      "can_edit_posts",
      "can_trigger_ingestion",
      "can_web_research",
      "can_use_ai_drafter",
      "can_manage_media",
    ]),
  },
  labs_copilot: {
    id: "labs_copilot",
    label: "Labs & Skunkworks Copilot",
    badge: "LABS",
    description: "Manage G-01..G-04 Lab Drops, append changelogs, score 25-pt scorecards, and draft related Dispatches.",
    permissionsMode: "custom",
    defaultScopes: makeScopeMap([
      "can_read_public_content",
      "can_read_drafts_and_pending",
      "can_read_media_library",
      "can_manage_labs",
      "can_score_lab_graduation",
      "can_create_journal",
      "can_edit_posts",
      "can_web_research",
      "can_use_ai_drafter",
      "can_manage_media",
    ]),
  },
  crm_operator: {
    id: "crm_operator",
    label: "CRM & Orbit Operator",
    badge: "CRM",
    description: "Review and triage B2B Inquiries, Orbit applicants, and Newsletter subscribers (requires Global PII Ceiling).",
    permissionsMode: "custom",
    defaultScopes: makeScopeMap([
      "can_read_public_content",
      "can_read_inquiries_pii",
      "can_read_orbit_pii",
      "can_read_subscribers_pii",
      "can_read_audit_logs",
      "can_manage_inquiries",
      "can_manage_orbit_and_subscribers",
    ]),
  },
  full_ops: {
    id: "full_ops",
    label: "Full Ops Parity",
    badge: "FULL",
    description: "All operational tools enabled (still respects Admin-only, PII ceiling, and bulk-delete dry-run guardrails).",
    permissionsMode: "full",
    defaultScopes: makeScopeMap(ALL_MCP_SCOPE_KEYS),
  },
  custom: {
    id: "custom",
    label: "Custom Scopes",
    badge: "CUSTOM",
    description: "Manually toggle any combination of the 29 least-privilege permissions.",
    permissionsMode: "custom",
    defaultScopes: makeScopeMap([
      "can_read_public_content",
      "can_read_drafts_and_pending",
      "can_read_media_library",
    ]),
  },
};

export interface ResolvedMcpContext {
  enabled: boolean;
  effectiveMode: McpPermissionsMode;
  downgradedFromFull: boolean;
  rolePreset: McpRolePreset;
  scopes: Record<McpScopeKey, boolean>;
  ceilings: {
    mcp_enabled: boolean;
    mcp_inherit_ai_permissions: boolean;
    mcp_allow_pii_over_mcp: boolean;
    mcp_allow_full_parity_tokens: boolean;
    mcp_require_dry_run_for_bulk_delete: boolean;
    mcp_expose_prompts: boolean;
    mcp_expose_resources: boolean;
  };
}

export function buildInheritedMcpScopes(
  policy: AiPermissionsPolicy
): Record<McpScopeKey, boolean> {
  const allowPii = Boolean(policy.mcp_allow_pii_over_mcp);
  return {
    can_read_public_content: true,
    can_read_drafts_and_pending: true,
    can_read_media_library: true,
    can_read_inquiries_pii: allowPii && Boolean(policy.can_manage_inquiries),
    can_read_orbit_pii: allowPii && Boolean(policy.can_manage_orbit_and_subscribers),
    can_read_subscribers_pii: allowPii && Boolean(policy.can_manage_orbit_and_subscribers),
    can_read_audit_logs: Boolean(policy.mcp_read_audit_logs),
    can_create_journal: Boolean(policy.can_create_posts),
    can_create_news: Boolean(policy.can_create_posts),
    can_create_hackathons: Boolean(policy.can_create_posts),
    can_edit_posts: Boolean(policy.can_edit_posts),
    can_publish_directly_journal: Boolean(policy.can_publish_directly_journal),
    can_publish_directly_news: Boolean(policy.can_publish_directly_news),
    can_publish_directly_hackathons: Boolean(policy.can_publish_directly_hackathons),
    can_approve_posts: Boolean(policy.can_approve_posts),
    can_revoke_approval: Boolean(policy.can_revoke_approval),
    can_bulk_moderate: Boolean(
      policy.can_bulk_moderate ?? (policy.can_approve_posts && policy.can_revoke_approval)
    ),
    can_delete_posts: Boolean(policy.can_delete_posts),
    can_purge_expired_posts: Boolean(policy.can_delete_posts),
    can_manage_labs: Boolean(policy.can_manage_labs),
    can_score_lab_graduation: Boolean(policy.can_manage_labs),
    can_promote_to_skunkworks: Boolean(policy.can_manage_labs),
    can_manage_inquiries: Boolean(policy.can_manage_inquiries),
    can_manage_orbit_and_subscribers: Boolean(policy.can_manage_orbit_and_subscribers),
    can_export_crm_data:
      allowPii &&
      Boolean(policy.can_manage_inquiries || policy.can_manage_orbit_and_subscribers),
    can_trigger_ingestion: Boolean(policy.can_trigger_ingestion),
    can_web_research: Boolean(policy.can_web_research),
    can_use_ai_drafter: Boolean(policy.can_use_ai_drafter ?? true),
    can_manage_media: Boolean(policy.can_manage_media),
  };
}

export function resolveEffectiveMcpContext(
  actor: OpsActorContext,
  policy: AiPermissionsPolicy
): ResolvedMcpContext {
  const allowPii = Boolean(policy.mcp_allow_pii_over_mcp);
  const allowFullTokens = policy.mcp_allow_full_parity_tokens !== false;
  const requireDryRunBulk = policy.mcp_require_dry_run_for_bulk_delete !== false;
  const exposePrompts = policy.mcp_expose_prompts !== false;
  const exposeResources = policy.mcp_expose_resources !== false;

  const rawMode: McpPermissionsMode = actor.permissionsMode ?? "inherit";
  const downgradedFromFull = rawMode === "full" && !allowFullTokens;
  const effectiveMode: McpPermissionsMode = downgradedFromFull ? "inherit" : rawMode;

  const preset: McpRolePreset =
    actor.rolePreset && actor.rolePreset in MCP_ROLE_PRESETS
      ? actor.rolePreset
      : effectiveMode === "readonly"
      ? "readonly_public"
      : effectiveMode === "full"
      ? "full_ops"
      : effectiveMode === "custom"
      ? "custom"
      : "inherit";

  let scopes: Record<McpScopeKey, boolean>;

  if (effectiveMode === "readonly" || preset === "readonly_public") {
    scopes = { ...MCP_ROLE_PRESETS.readonly_public.defaultScopes };
  } else if (effectiveMode === "full" && allowFullTokens) {
    scopes = makeScopeMap(ALL_MCP_SCOPE_KEYS);
  } else if (effectiveMode === "custom") {
    const presetDefaults = MCP_ROLE_PRESETS[preset]?.defaultScopes ?? MCP_ROLE_PRESETS.custom.defaultScopes;
    scopes = { ...presetDefaults };
    if (actor.customScopes) {
      for (const k of ALL_MCP_SCOPE_KEYS) {
        if (typeof actor.customScopes[k] === "boolean") {
          scopes[k] = actor.customScopes[k]!;
        }
      }
    }
  } else {
    // inherit mode
    if (!policy.mcp_inherit_ai_permissions) {
      scopes = makeScopeMap([
        "can_read_public_content",
        "can_read_drafts_and_pending",
        "can_read_media_library",
      ]);
    } else {
      scopes = buildInheritedMcpScopes(policy);
    }
  }

  // Enforce global PII master ceiling across EVERY MCP token mode (including full!)
  if (!allowPii) {
    scopes.can_read_inquiries_pii = false;
    scopes.can_read_orbit_pii = false;
    scopes.can_read_subscribers_pii = false;
    scopes.can_export_crm_data = false;
  }

  return {
    enabled: Boolean(policy.mcp_enabled),
    effectiveMode,
    downgradedFromFull,
    rolePreset: preset,
    scopes,
    ceilings: {
      mcp_enabled: Boolean(policy.mcp_enabled),
      mcp_inherit_ai_permissions: Boolean(policy.mcp_inherit_ai_permissions),
      mcp_allow_pii_over_mcp: allowPii,
      mcp_allow_full_parity_tokens: allowFullTokens,
      mcp_require_dry_run_for_bulk_delete: requireDryRunBulk,
      mcp_expose_prompts: exposePrompts,
      mcp_expose_resources: exposeResources,
    },
  };
}

export function checkMcpScopeRequirement(
  required: McpScopeKey | McpScopeKey[] | null | undefined,
  actor: OpsActorContext,
  policy: AiPermissionsPolicy
): { allowed: boolean; reason?: string } {
  if (actor.actorType !== "mcp") {
    return { allowed: true };
  }

  const ctx = resolveEffectiveMcpContext(actor, policy);
  if (!ctx.enabled) {
    return {
      allowed: false,
      reason: "External MCP server access is currently disabled by Admin policy.",
    };
  }

  if (!required) {
    return { allowed: true };
  }

  const requiredList = Array.isArray(required) ? required : [required];
  if (requiredList.some((scope) => ctx.scopes[scope])) {
    return { allowed: true };
  }

  const isPii = requiredList.some(
    (s) =>
      s === "can_read_inquiries_pii" ||
      s === "can_read_orbit_pii" ||
      s === "can_read_subscribers_pii" ||
      s === "can_export_crm_data"
  );

  if (isPii && !ctx.ceilings.mcp_allow_pii_over_mcp) {
    return {
      allowed: false,
      reason: `Blocked by Global MCP PII Ceiling (mcp_allow_pii_over_mcp is OFF). Enable it in AI Permissions and grant scope ${requiredList.join(" / ")}.`,
    };
  }

  if (ctx.effectiveMode === "readonly") {
    return {
      allowed: false,
      reason: `MCP token "${actor.actorLabel}" is read-only and lacks scope ${requiredList.join(" or ")}.`,
    };
  }

  return {
    allowed: false,
    reason: `MCP token "${actor.actorLabel}" (${ctx.rolePreset}) lacks required permission scope "${requiredList.join(" or ")}".`,
  };
}

export function checkMcpEntityPrivacy(
  entity: string,
  actor: OpsActorContext,
  policy: AiPermissionsPolicy
): { allowed: boolean; reason?: string } {
  if (actor.actorType !== "mcp") {
    return { allowed: true };
  }
  const normalized = entity.toLowerCase().trim();
  if (normalized === "inquiries" || normalized === "inquiry") {
    return checkMcpScopeRequirement("can_read_inquiries_pii", actor, policy);
  }
  if (normalized === "orbit" || normalized === "orbit_applications") {
    return checkMcpScopeRequirement("can_read_orbit_pii", actor, policy);
  }
  if (normalized === "subscribers" || normalized === "newsletter_subscribers") {
    return checkMcpScopeRequirement("can_read_subscribers_pii", actor, policy);
  }
  if (normalized === "audit_logs" || normalized === "audit") {
    return checkMcpScopeRequirement("can_read_audit_logs", actor, policy);
  }
  if (normalized === "media" || normalized === "media_assets") {
    return checkMcpScopeRequirement("can_read_media_library", actor, policy);
  }
  return checkMcpScopeRequirement("can_read_public_content", actor, policy);
}
