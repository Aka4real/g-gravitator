import type { FunctionDeclaration } from "@google/genai";
import {
  appendAuditLog,
  createDispatch,
  createHackathon,
  createLabProject,
  createNewsletterSubscriber,
  createNewsItem,
  deleteClientInquiry,
  deleteDispatch,
  deleteHackathon,
  deleteLabProject,
  deleteMediaAsset,
  deleteNewsletterSubscriber,
  deleteNewsItem,
  deleteOrbitApplication,
  getAiPermissions,
  getAuditLogs,
  getClientInquiries,
  getDispatchById,
  getDispatches,
  getHackathonById,
  getHackathons,
  getLabProjectById,
  getLabProjects,
  getNewsItemById,
  getNewsItems,
  getNewsletterSubscribers,
  getOrbitApplications,
  listMediaAssets,
  updateAiPermissions,
  updateClientInquiryStatus,
  updateDispatch,
  updateHackathon,
  updateLabProject,
  updateNewsItem,
  updateOrbitApplication,
} from "@/lib/db/repository";
import { runHackathonIngestionPipeline } from "@/lib/ingestion/hackathons";
import { runNewsIngestionPipeline } from "@/lib/ingestion/news";
import {
  issueBulkPurgeConfirmToken,
  verifyBulkPurgeConfirmToken,
} from "@/lib/mcp/guards";
import {
  checkMcpEntityPrivacy,
  checkMcpScopeRequirement,
  resolveEffectiveMcpContext,
  type OpsActorContext,
} from "@/lib/mcp/permissions";
import { generateStructuredPostDraft, type DraftEntityType } from "@/lib/ops/draft";
import {
  generateAndStoreImage,
  importAndStoreImageFromUrl,
  uploadAndStoreImage,
} from "@/lib/ops/media";
import { fetchWebpageMetadata, runLiveWebResearch } from "@/lib/ops/research";
import { evaluateGraduationScorecard } from "@/lib/scorecard";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  AiPermissionsPolicy,
  ContentAuthorType,
  DispatchCategory,
  HackathonFormat,
  InquiryStatus,
  LabDivision,
  LabProjectStatus,
  McpScopeKey,
  NewsCategory,
  OrbitApplicationStatus,
  OrbitTrack,
  OxakalabsStatus,
  PostDesignConfig,
  PostLinkRef,
} from "@/lib/supabase/types";

export type { OpsActorContext };

export type PermissionRequirement =
  | keyof AiPermissionsPolicy
  | "admin_only"
  | null;

export interface McpToolAnnotations {
  title: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface OpsToolDefinition {
  name: string;
  description: string;
  requiredPermission: PermissionRequirement;
  requiredMcpScope?: McpScopeKey | McpScopeKey[] | null;
  annotations?: McpToolAnnotations;
  inputSchema: Record<string, unknown>;
  execute: (
    args: Record<string, unknown>,
    actor: OpsActorContext
  ) => Promise<Record<string, unknown>>;
}

function actorAuthorType(actor: OpsActorContext): ContentAuthorType {
  if (actor.actorType === "ai_assistant") return "ai_assistant";
  if (actor.actorType === "mcp") return "mcp";
  return "admin";
}

function asString(val: unknown, fallback = ""): string {
  return typeof val === "string" ? val : fallback;
}

function asOptionalString(val: unknown): string | undefined {
  return typeof val === "string" && val.trim().length > 0 ? val.trim() : undefined;
}

function asBoolean(val: unknown): boolean | undefined {
  return typeof val === "boolean" ? val : undefined;
}

function asNumber(val: unknown): number | undefined {
  return typeof val === "number" && Number.isFinite(val) ? val : undefined;
}

function asStringArray(val: unknown): string[] | undefined {
  if (!Array.isArray(val)) return undefined;
  return val.filter((v): v is string => typeof v === "string").map((s) => s.trim()).filter(Boolean);
}

function asLinksArray(val: unknown): PostLinkRef[] | undefined {
  if (!Array.isArray(val)) return undefined;
  const out: PostLinkRef[] = [];
  for (const item of val) {
    if (item && typeof item === "object") {
      const rec = item as Record<string, unknown>;
      const label = asOptionalString(rec.label);
      const url = asOptionalString(rec.url);
      if (label && url) {
        out.push({
          label,
          url,
          description: asOptionalString(rec.description),
        });
      }
    }
  }
  return out;
}

function asDesignConfig(val: unknown): PostDesignConfig | undefined {
  if (!val || typeof val !== "object") return undefined;
  const rec = val as Record<string, unknown>;
  const design: PostDesignConfig = {};
  if (typeof rec.accent_color === "string") design.accent_color = rec.accent_color;
  if (typeof rec.surface_tint === "string") design.surface_tint = rec.surface_tint;
  if (
    rec.hero_layout === "editorial" ||
    rec.hero_layout === "split" ||
    rec.hero_layout === "fullbleed" ||
    rec.hero_layout === "minimal"
  ) {
    design.hero_layout = rec.hero_layout;
  }
  if (
    rec.callout_style === "left-bar" ||
    rec.callout_style === "glass-card" ||
    rec.callout_style === "tinted-banner"
  ) {
    design.callout_style = rec.callout_style;
  }
  if (Array.isArray(rec.gallery_images)) {
    design.gallery_images = rec.gallery_images
      .filter((g): g is Record<string, unknown> => Boolean(g && typeof g === "object"))
      .map((g) => ({
        url: asString(g.url),
        caption: asOptionalString(g.caption),
        alt: asOptionalString(g.alt),
      }))
      .filter((g) => Boolean(g.url));
  }
  if (Array.isArray(rec.featured_links)) {
    design.featured_links = asLinksArray(rec.featured_links);
  }
  return design;
}

const DISPATCH_CATEGORIES: DispatchCategory[] = [
  "ARCHITECTURE",
  "POST-MORTEM",
  "AI SYSTEMS",
  "HACKATHON LOG",
  "DESIGN ENGINEERING",
];

const NEWS_CATEGORIES: NewsCategory[] = [
  "MODELS",
  "AGENTS",
  "DEVTOOLS",
  "RESEARCH",
  "BUSINESS",
  "OPEN_SOURCE",
];

const HACKATHON_FORMATS: HackathonFormat[] = ["ONLINE", "IN_PERSON", "HYBRID"];

const OXAKALABS_STATUSES: OxakalabsStatus[] = [
  "NONE",
  "SCOUTING",
  "SQUAD_DEPLOYED",
  "SUBMITTED",
  "WON",
];

const LAB_DIVISIONS: LabDivision[] = ["LABS", "SKUNKWORKS"];

const LAB_STATUSES: LabProjectStatus[] = [
  "CONCEPT",
  "PROTOTYPING",
  "R&D",
  "SKUNKWORKS CANDIDATE",
  "BETA",
  "LIVE",
  "ARCHIVED",
];

function normalizeEnum<T extends string>(
  raw: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  if (typeof raw !== "string") return fallback;
  const upper = raw.trim().toUpperCase().replace(/-/g, "_");
  const exact = allowed.find(
    (v) => v.toUpperCase() === raw.trim().toUpperCase() || v.toUpperCase().replace(/-/g, "_") === upper
  );
  return exact ?? fallback;
}

function normalizeIsoDate(raw: unknown, fallbackDaysAhead?: number): string {
  if (typeof raw === "string" && raw.trim()) {
    const parsed = new Date(raw.trim());
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  if (fallbackDaysAhead !== undefined) {
    return new Date(Date.now() + fallbackDaysAhead * 24 * 3600 * 1000).toISOString();
  }
  throw new Error(
    "Invalid deadline_at timestamp. Provide a valid ISO-8601 date string (e.g. 2026-12-15T23:59:00Z)."
  );
}

function assertPublishPermission(
  actor: OpsActorContext,
  policy: AiPermissionsPolicy,
  requestedPublish: boolean,
  entityLabel: string
): void {
  if (actor.actorType === "admin") return;
  if (actor.actorType === "mcp" && actor.permissionsMode === "full") return;
  if (requestedPublish && !policy.can_approve_posts) {
    throw new Error(
      `Permission "can_approve_posts" is required to approve/publish ${entityLabel}.`
    );
  }
  if (!requestedPublish && !policy.can_revoke_approval) {
    throw new Error(
      `Permission "can_revoke_approval" is required to unpublish/revoke ${entityLabel}.`
    );
  }
}

const LINK_REF_ITEM_SCHEMA = {
  type: "object",
  properties: {
    label: { type: "string", description: "Visible link label" },
    url: { type: "string", description: "Full https:// URL" },
    description: { type: "string", description: "Optional short link note" },
  },
  required: ["label", "url"],
};

const POST_DESIGN_SCHEMA = {
  type: "object",
  description: "Optional visual styling metadata for the post",
  properties: {
    accent_color: { type: "string", description: "Hex accent color e.g. #FF3B1F or #10B981" },
    surface_tint: { type: "string", description: "Optional hex backdrop glow tint" },
    hero_layout: {
      type: "string",
      enum: ["editorial", "split", "fullbleed", "minimal"],
    },
    callout_style: {
      type: "string",
      enum: ["left-bar", "glass-card", "tinted-banner"],
    },
    featured_links: {
      type: "array",
      items: LINK_REF_ITEM_SCHEMA,
    },
    gallery_images: {
      type: "array",
      items: {
        type: "object",
        properties: {
          url: { type: "string" },
          caption: { type: "string" },
          alt: { type: "string" },
        },
        required: ["url"],
      },
    },
  },
};

const SCORECARD_SCHEMA = {
  type: "object",
  description: "25-point OXAKALABS Graduation Scorecard (1-5 per axis)",
  properties: {
    pain_intensity: { type: "number", minimum: 1, maximum: 5 },
    willingness_to_pay: { type: "number", minimum: 1, maximum: 5 },
    technical_moat: { type: "number", minimum: 1, maximum: 5 },
    distribution_hook: { type: "number", minimum: 1, maximum: 5 },
    lean_maintainability: { type: "number", minimum: 1, maximum: 5 },
  },
  required: [
    "pain_intensity",
    "willingness_to_pay",
    "technical_moat",
    "distribution_hook",
    "lean_maintainability",
  ],
};

const TOOL_MCP_META: Record<
  string,
  { requiredMcpScope: McpScopeKey | McpScopeKey[] | null; annotations: McpToolAnnotations }
> = {
  get_my_mcp_identity: {
    requiredMcpScope: null,
    annotations: { title: "Inspect My MCP Identity & Scopes", readOnlyHint: true, idempotentHint: true },
  },
  get_system_overview: {
    requiredMcpScope: "can_read_public_content",
    annotations: { title: "System Overview", readOnlyHint: true, idempotentHint: true },
  },
  list_pending_reviews: {
    requiredMcpScope: "can_read_drafts_and_pending",
    annotations: { title: "List Pending Reviews", readOnlyHint: true, idempotentHint: true },
  },
  list_content: {
    requiredMcpScope: "can_read_public_content",
    annotations: { title: "List Platform Content", readOnlyHint: true, idempotentHint: true },
  },
  get_post_details: {
    requiredMcpScope: "can_read_public_content",
    annotations: { title: "Get Content Details", readOnlyHint: true, idempotentHint: true },
  },
  search_platform: {
    requiredMcpScope: "can_read_public_content",
    annotations: { title: "Search Platform", readOnlyHint: true, idempotentHint: true },
  },
  get_audit_logs: {
    requiredMcpScope: "can_read_audit_logs",
    annotations: { title: "Read Audit Logs", readOnlyHint: true, idempotentHint: true },
  },
  get_ingestion_health: {
    requiredMcpScope: "can_read_drafts_and_pending",
    annotations: { title: "Get Ingestion Health", readOnlyHint: true, idempotentHint: true },
  },
  audit_post_readiness: {
    requiredMcpScope: "can_read_drafts_and_pending",
    annotations: { title: "Audit Post Readiness", readOnlyHint: true, idempotentHint: true },
  },
  draft_post_with_ai: {
    requiredMcpScope: "can_use_ai_drafter",
    annotations: { title: "Draft Post With Gemini AI", readOnlyHint: true, openWorldHint: true },
  },
  create_dispatch: {
    requiredMcpScope: "can_create_journal",
    annotations: { title: "Create Journal Dispatch", readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
  update_dispatch: {
    requiredMcpScope: "can_edit_posts",
    annotations: { title: "Update Journal Dispatch", readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  },
  delete_dispatch: {
    requiredMcpScope: "can_delete_posts",
    annotations: { title: "Delete Journal Dispatch", readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  },
  create_news_item: {
    requiredMcpScope: "can_create_news",
    annotations: { title: "Create Orbital Wire News", readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
  update_news_item: {
    requiredMcpScope: "can_edit_posts",
    annotations: { title: "Update Orbital Wire News", readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  },
  delete_news_item: {
    requiredMcpScope: "can_delete_posts",
    annotations: { title: "Delete Orbital Wire News", readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  },
  create_hackathon: {
    requiredMcpScope: "can_create_hackathons",
    annotations: { title: "Create Hackathon", readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
  update_hackathon: {
    requiredMcpScope: "can_edit_posts",
    annotations: { title: "Update Hackathon", readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  },
  delete_hackathon: {
    requiredMcpScope: "can_delete_posts",
    annotations: { title: "Delete Hackathon", readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  },
  remove_old_posts: {
    requiredMcpScope: "can_purge_expired_posts",
    annotations: { title: "Purge Expired Posts", readOnlyHint: false, destructiveHint: true, idempotentHint: false },
  },
  approve_content: {
    requiredMcpScope: "can_approve_posts",
    annotations: { title: "Approve Pending Content", readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  },
  revoke_approval: {
    requiredMcpScope: "can_revoke_approval",
    annotations: { title: "Revoke Content Approval", readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  },
  reject_content: {
    requiredMcpScope: "can_revoke_approval",
    annotations: { title: "Reject Pending Content", readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  },
  bulk_moderate_content: {
    requiredMcpScope: "can_bulk_moderate",
    annotations: { title: "Bulk Moderate Content", readOnlyHint: false, destructiveHint: true, idempotentHint: false },
  },
  create_lab_project: {
    requiredMcpScope: "can_manage_labs",
    annotations: { title: "Create Lab Project", readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
  update_lab_project: {
    requiredMcpScope: "can_manage_labs",
    annotations: { title: "Update Lab Project", readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  },
  append_lab_changelog: {
    requiredMcpScope: "can_manage_labs",
    annotations: { title: "Append Lab Changelog", readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
  update_lab_scorecard: {
    requiredMcpScope: "can_score_lab_graduation",
    annotations: { title: "Update 25-Pt Graduation Scorecard", readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  },
  promote_to_labs: {
    requiredMcpScope: "can_promote_to_skunkworks",
    annotations: { title: "Graduate Skunkworks Prototype to Labs", readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  },
  delete_lab_project: {
    requiredMcpScope: "can_manage_labs",
    annotations: { title: "Delete Lab Project", readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  },
  update_inquiry_status: {
    requiredMcpScope: "can_manage_inquiries",
    annotations: { title: "Update Inquiry Status", readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  },
  delete_inquiry: {
    requiredMcpScope: "can_manage_inquiries",
    annotations: { title: "Delete B2B Inquiry", readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  },
  update_orbit_application: {
    requiredMcpScope: "can_manage_orbit_and_subscribers",
    annotations: { title: "Update Orbit Application", readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  },
  delete_orbit_application: {
    requiredMcpScope: "can_manage_orbit_and_subscribers",
    annotations: { title: "Delete Orbit Application", readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  },
  add_newsletter_subscriber: {
    requiredMcpScope: "can_manage_orbit_and_subscribers",
    annotations: { title: "Add Newsletter Subscriber", readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  },
  delete_newsletter_subscriber: {
    requiredMcpScope: "can_manage_orbit_and_subscribers",
    annotations: { title: "Delete Newsletter Subscriber", readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  },
  run_hackathon_ingestion: {
    requiredMcpScope: "can_trigger_ingestion",
    annotations: { title: "Run Hackathon Ingestion", readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  run_news_ingestion: {
    requiredMcpScope: "can_trigger_ingestion",
    annotations: { title: "Run News Ingestion", readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  web_research: {
    requiredMcpScope: "can_web_research",
    annotations: { title: "Live Web Research", readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  },
  fetch_webpage: {
    requiredMcpScope: "can_web_research",
    annotations: { title: "Fetch Webpage Metadata", readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  },
  generate_post_image: {
    requiredMcpScope: "can_manage_media",
    annotations: { title: "Generate Post Image", readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
  import_image_from_url: {
    requiredMcpScope: "can_manage_media",
    annotations: { title: "Import Image From URL", readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  upload_media_asset: {
    requiredMcpScope: "can_manage_media",
    annotations: { title: "Upload Base64 Media Asset", readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
  delete_media_asset: {
    requiredMcpScope: "can_manage_media",
    annotations: { title: "Delete Media Asset", readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  },
  get_ai_permissions: {
    requiredMcpScope: null,
    annotations: { title: "Read AI & MCP Policy", readOnlyHint: true, idempotentHint: true },
  },
  update_ai_permissions: {
    requiredMcpScope: null,
    annotations: { title: "Update AI & MCP Policy", readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  },
};

export function getToolMcpAnnotations(tool: OpsToolDefinition): McpToolAnnotations {
  return (
    tool.annotations ??
    TOOL_MCP_META[tool.name]?.annotations ?? {
      title: tool.name,
      readOnlyHint: tool.requiredPermission === null,
      destructiveHint: tool.name.startsWith("delete_") || tool.name === "remove_old_posts",
    }
  );
}

export function getToolRequiredMcpScope(
  tool: OpsToolDefinition
): McpScopeKey | McpScopeKey[] | null {
  if (tool.requiredMcpScope !== undefined) {
    return tool.requiredMcpScope;
  }
  if (tool.name in TOOL_MCP_META) {
    return TOOL_MCP_META[tool.name].requiredMcpScope;
  }
  return null;
}

export function checkToolPermission(
  tool: OpsToolDefinition,
  actor: OpsActorContext,
  policy: AiPermissionsPolicy
): { allowed: boolean; reason?: string } {
  if (actor.actorType === "admin") {
    return { allowed: true };
  }

  if (tool.requiredPermission === "admin_only") {
    return {
      allowed: false,
      reason: `Action "${tool.name}" is restricted to human Admin approval in the Command Center.`,
    };
  }

  if (actor.actorType === "ai_assistant") {
    if (!policy.ai_enabled) {
      return {
        allowed: false,
        reason: "AI Assistant execution is currently disabled by Admin policy.",
      };
    }
    if (tool.requiredPermission === null) {
      return { allowed: true };
    }
    const granted = policy[tool.requiredPermission];
    if (granted === false) {
      return {
        allowed: false,
        reason: `Permission "${tool.requiredPermission}" is currently disabled in AI Permissions policy.`,
      };
    }
    return { allowed: true };
  }

  // External MCP actor — evaluate global ceilings + token role preset/scopes
  const ctx = resolveEffectiveMcpContext(actor, policy);
  if (!ctx.enabled) {
    return {
      allowed: false,
      reason: "External MCP server access is currently disabled by Admin policy.",
    };
  }

  const annotations = getToolMcpAnnotations(tool);
  if (ctx.effectiveMode === "readonly" && (!annotations.readOnlyHint || tool.requiredPermission !== null)) {
    return {
      allowed: false,
      reason: `MCP token "${actor.actorLabel}" is read-only and cannot invoke mutating tool "${tool.name}".`,
    };
  }

  const requiredScope = getToolRequiredMcpScope(tool);
  if (requiredScope !== null) {
    const scopeCheck = checkMcpScopeRequirement(requiredScope, actor, policy);
    if (!scopeCheck.allowed) {
      return scopeCheck;
    }
  }

  if (
    ctx.effectiveMode === "inherit" &&
    !policy.mcp_inherit_ai_permissions &&
    tool.requiredPermission !== null
  ) {
    return {
      allowed: false,
      reason: "MCP token permission inheritance is disabled by Admin policy.",
    };
  }

  return { allowed: true };
}

export function getAllowedMcpTools(
  actor: OpsActorContext,
  policy: AiPermissionsPolicy
): OpsToolDefinition[] {
  return OPS_TOOLS.filter(
    (t) =>
      t.requiredPermission !== "admin_only" &&
      checkToolPermission(t, actor, policy).allowed
  );
}

function shouldAutoPublishPost(
  actor: OpsActorContext,
  policy: AiPermissionsPolicy,
  channel: "journal" | "news" | "hackathons",
  requestedPublish?: boolean
): { isPublished: boolean; queuedReason?: string } {
  if (actor.actorType === "admin") {
    return { isPublished: requestedPublish ?? true };
  }

  if (actor.actorType === "mcp") {
    const ctx = resolveEffectiveMcpContext(actor, policy);
    if (ctx.effectiveMode === "full") {
      return { isPublished: requestedPublish ?? true };
    }
    const publishScope: McpScopeKey =
      channel === "journal"
        ? "can_publish_directly_journal"
        : channel === "news"
        ? "can_publish_directly_news"
        : "can_publish_directly_hackathons";

    if (ctx.scopes[publishScope]) {
      return { isPublished: requestedPublish ?? true };
    }

    return {
      isPublished: false,
      queuedReason: `Direct publishing for ${channel} is disabled for this MCP token/policy, so this post was saved as PENDING_REVIEW in the Admin Review Queue.`,
    };
  }

  const directFlag =
    channel === "journal"
      ? policy.can_publish_directly_journal
      : channel === "news"
      ? policy.can_publish_directly_news
      : policy.can_publish_directly_hackathons;

  if (directFlag) {
    return { isPublished: requestedPublish ?? true };
  }

  return {
    isPublished: false,
    queuedReason:
      `Direct publishing for ${channel} is currently disabled, so this post was saved as PENDING_REVIEW in the Admin Review Queue.`,
  };
}

export class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

export const OPS_TOOLS: OpsToolDefinition[] = [
  {
    name: "get_my_mcp_identity",
    description:
      "Inspect the caller's authenticated identity, token preset, effective permission scopes, global MCP governance ceilings, expiry, and allowed tool list.",
    requiredPermission: null,
    inputSchema: { type: "object", properties: {} },
    execute: async (_args, actor) => {
      const policy = await getAiPermissions();
      const ctx =
        actor.actorType === "mcp"
          ? resolveEffectiveMcpContext(actor, policy)
          : null;
      const allowedTools = OPS_TOOLS.filter(
        (t) =>
          (actor.actorType !== "mcp" || t.requiredPermission !== "admin_only") &&
          checkToolPermission(t, actor, policy).allowed
      ).map((t) => t.name);

      return {
        actor_type: actor.actorType,
        actor_label: actor.actorLabel,
        token_id: actor.tokenId ?? null,
        permissions_mode: ctx?.effectiveMode ?? actor.permissionsMode ?? "admin",
        downgraded_from_full: ctx?.downgradedFromFull ?? false,
        role_preset: ctx?.rolePreset ?? actor.rolePreset ?? null,
        expires_at: actor.expiresAt ?? null,
        rate_limit_rpm: actor.rateLimitRpm ?? null,
        global_ceilings: ctx?.ceilings ?? {
          mcp_enabled: policy.mcp_enabled,
          mcp_inherit_ai_permissions: policy.mcp_inherit_ai_permissions,
          mcp_allow_pii_over_mcp: Boolean(policy.mcp_allow_pii_over_mcp),
          mcp_allow_full_parity_tokens: policy.mcp_allow_full_parity_tokens !== false,
          mcp_require_dry_run_for_bulk_delete:
            policy.mcp_require_dry_run_for_bulk_delete !== false,
          mcp_expose_prompts: policy.mcp_expose_prompts !== false,
          mcp_expose_resources: policy.mcp_expose_resources !== false,
        },
        effective_scopes: ctx?.scopes ?? null,
        allowed_tools_count: allowedTools.length,
        allowed_tools: allowedTools,
      };
    },
  },
  {
    name: "get_system_overview",
    description:
      "Return live system-wide metrics across Journal Dispatches, Orbital Wire News, Hackathons, Labs/Skunkworks, Inquiries, Orbit Waitlist, Newsletter Subscribers, Media Library, Pending Reviews, and AI Permissions.",
    requiredPermission: null,
    inputSchema: { type: "object", properties: {} },
    execute: async () => {
      const [
        dispatches,
        { items: news },
        { items: hackathons },
        labs,
        inquiries,
        orbit,
        subscribers,
        media,
        permissions,
      ] = await Promise.all([
        getDispatches(undefined, undefined, { includeUnpublished: true }),
        getNewsItems({ includeUnpublished: true }),
        getHackathons({ includeUnpublished: true, includeExpired: true }),
        getLabProjects(),
        getClientInquiries(),
        getOrbitApplications(),
        getNewsletterSubscribers(),
        listMediaAssets(),
        getAiPermissions(),
      ]);

      const pendingHackathons = hackathons.filter((h) => !h.is_published);
      const pendingDispatches = dispatches.filter((d) => d.is_published === false);
      const pendingNews = news.filter((n) => !n.is_published);

      return {
        counts: {
          dispatches_total: dispatches.length,
          dispatches_published: dispatches.length - pendingDispatches.length,
          dispatches_pending: pendingDispatches.length,
          news_total: news.length,
          news_published: news.length - pendingNews.length,
          news_pending: pendingNews.length,
          hackathons_total: hackathons.length,
          hackathons_published: hackathons.length - pendingHackathons.length,
          hackathons_pending: pendingHackathons.length,
          labs_projects: labs.length,
          inquiries: inquiries.length,
          orbit_applications: orbit.length,
          newsletter_subscribers: subscribers.length,
          media_assets: media.length,
        },
        ai_permissions: permissions,
      };
    },
  },
  {
    name: "list_pending_reviews",
    description:
      "List all unpublished or pending-review posts (community-submitted hackathons, AI-authored dispatches, news, and hackathons) awaiting review/approval.",
    requiredPermission: null,
    inputSchema: { type: "object", properties: {} },
    execute: async () => {
      const [dispatches, { items: news }, { items: hackathons }] =
        await Promise.all([
          getDispatches(undefined, undefined, { includeUnpublished: true }),
          getNewsItems({ includeUnpublished: true }),
          getHackathons({ includeUnpublished: true, includeExpired: true }),
        ]);

      return {
        pending_hackathons: hackathons
          .filter((h) => !h.is_published)
          .map((h) => ({
            id: h.id,
            title: h.title,
            organizer: h.organizer,
            created_by: h.created_by ?? "ingestion",
            approval_status: h.approval_status ?? "PENDING_REVIEW",
            confidence_score: h.confidence_score,
            primary_url: h.primary_url,
          })),
        pending_dispatches: dispatches
          .filter((d) => d.is_published === false)
          .map((d) => ({
            id: d.id,
            issue_number: d.issue_number,
            title: d.title,
            category: d.category,
            created_by: d.created_by ?? "admin",
            approval_status: d.approval_status ?? "PENDING_REVIEW",
          })),
        pending_news: news
          .filter((n) => !n.is_published)
          .map((n) => ({
            id: n.id,
            title: n.title,
            category: n.category,
            created_by: n.created_by ?? "ingestion",
            approval_status: n.approval_status ?? "PENDING_REVIEW",
          })),
      };
    },
  },
  {
    name: "list_content",
    description:
      "List items across any entity type (dispatches, news, hackathons, labs, inquiries, orbit, subscribers, media, audit_logs) with optional search filter. Enforces MCP PII privacy ceilings and draft-visibility scopes automatically.",
    requiredPermission: null,
    inputSchema: {
      type: "object",
      properties: {
        entity: {
          type: "string",
          enum: [
            "dispatches",
            "news",
            "hackathons",
            "labs",
            "inquiries",
            "orbit",
            "subscribers",
            "media",
            "audit_logs",
          ],
        },
        query: { type: "string" },
        limit: { type: "number" },
      },
      required: ["entity"],
    },
    execute: async (args, actor) => {
      const entity = asString(args.entity);
      const q = asString(args.query).toLowerCase();
      const limit = Math.min(50, Math.max(1, asNumber(args.limit) ?? 25));

      const policy = await getAiPermissions();
      const privacy = checkMcpEntityPrivacy(entity, actor, policy);
      if (!privacy.allowed) {
        throw new PermissionDeniedError(
          privacy.reason || `Access denied for entity "${entity}".`
        );
      }

      const includeDrafts =
        actor.actorType !== "mcp" ||
        resolveEffectiveMcpContext(actor, policy).scopes.can_read_drafts_and_pending;

      let rows: unknown[] = [];
      if (entity === "dispatches") {
        rows = await getDispatches(undefined, q || undefined, {
          includeUnpublished: includeDrafts,
        });
      } else if (entity === "news") {
        rows = (await getNewsItems({ includeUnpublished: includeDrafts, q })).items;
      } else if (entity === "hackathons") {
        rows = (
          await getHackathons({
            includeUnpublished: includeDrafts,
            includeExpired: true,
            q,
          })
        ).items;
      } else if (entity === "labs") {
        rows = await getLabProjects();
      } else if (entity === "inquiries") {
        rows = await getClientInquiries();
      } else if (entity === "orbit") {
        rows = await getOrbitApplications();
      } else if (entity === "subscribers") {
        rows = await getNewsletterSubscribers();
      } else if (entity === "media") {
        rows = (await listMediaAssets()).map((m) => ({
          id: m.id,
          filename: m.filename,
          mime_type: m.mime_type,
          url: m.url,
          source_type: m.source_type,
          alt_text: m.alt_text,
          created_at: m.created_at,
        }));
      } else if (entity === "audit_logs") {
        rows = await getAuditLogs(limit);
      }

      if (q && !["dispatches", "news", "hackathons"].includes(entity)) {
        rows = rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
      }

      return { entity, count: rows.length, items: rows.slice(0, limit) };
    },
  },
  {
    name: "get_post_details",
    description:
      "Retrieve the full record (including full markdown body, design metadata, links, and scorecard) for a single dispatch, news item, hackathon, or lab project by ID or slug.",
    requiredPermission: null,
    inputSchema: {
      type: "object",
      properties: {
        entity: {
          type: "string",
          enum: ["dispatch", "news", "hackathon", "lab"],
        },
        id_or_slug: { type: "string" },
      },
      required: ["entity", "id_or_slug"],
    },
    execute: async (args, actor) => {
      const entity = asString(args.entity);
      const key = asString(args.id_or_slug).trim();
      if (!key) throw new Error("Provide id_or_slug.");

      const policy = await getAiPermissions();
      const canReadDrafts =
        actor.actorType !== "mcp" ||
        resolveEffectiveMcpContext(actor, policy).scopes.can_read_drafts_and_pending;

      if (entity === "dispatch") {
        const all = await getDispatches(undefined, undefined, { includeUnpublished: true });
        const found = all.find((d) => d.id === key || d.slug === key || d.issue_number === key);
        if (!found) throw new Error(`Dispatch "${key}" not found.`);
        if (found.is_published === false && !canReadDrafts) {
          throw new PermissionDeniedError(
            `Dispatch "${key}" is unpublished and token lacks scope "can_read_drafts_and_pending".`
          );
        }
        return { entity, item: found };
      }
      if (entity === "news") {
        const { items } = await getNewsItems({ includeUnpublished: true });
        const found = items.find((n) => n.id === key || n.url_hash === key);
        if (!found) throw new Error(`News item "${key}" not found.`);
        if (!found.is_published && !canReadDrafts) {
          throw new PermissionDeniedError(
            `News item "${key}" is unpublished and token lacks scope "can_read_drafts_and_pending".`
          );
        }
        return { entity, item: found };
      }
      if (entity === "hackathon") {
        const { items } = await getHackathons({ includeUnpublished: true, includeExpired: true });
        const found = items.find((h) => h.id === key || h.slug === key);
        if (!found) throw new Error(`Hackathon "${key}" not found.`);
        if (!found.is_published && !canReadDrafts) {
          throw new PermissionDeniedError(
            `Hackathon "${key}" is unpublished and token lacks scope "can_read_drafts_and_pending".`
          );
        }
        return { entity, item: found };
      }
      if (entity === "lab") {
        const all = await getLabProjects();
        const found = all.find(
          (p) => p.id === key || p.slug === key || p.code.toLowerCase() === key.toLowerCase()
        );
        if (!found) throw new Error(`Lab project "${key}" not found.`);
        return { entity, item: found };
      }
      throw new Error("Invalid entity type.");
    },
  },
  {
    name: "search_platform",
    description:
      "Fast cross-entity filtered search across Dispatches, Orbital Wire News, Hackathons, Labs/Skunkworks, Media (and optionally CRM Inquiries/Orbit when PII access is granted).",
    requiredPermission: null,
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        entities: {
          type: "array",
          items: {
            type: "string",
            enum: ["dispatches", "news", "hackathons", "labs", "media", "inquiries", "orbit"],
          },
        },
        include_unpublished: { type: "boolean" },
        limit: { type: "number" },
      },
      required: ["query"],
    },
    execute: async (args, actor) => {
      const q = asString(args.query).trim().toLowerCase();
      if (!q) throw new Error("Provide a search query.");
      const limit = Math.min(40, Math.max(1, asNumber(args.limit) ?? 15));
      const requestedEntities = asStringArray(args.entities) ?? [
        "dispatches",
        "news",
        "hackathons",
        "labs",
      ];

      const policy = await getAiPermissions();
      const ctx = actor.actorType === "mcp" ? resolveEffectiveMcpContext(actor, policy) : null;
      const allowDrafts =
        (asBoolean(args.include_unpublished) ?? true) &&
        (!ctx || ctx.scopes.can_read_drafts_and_pending);

      const results: Array<{
        entity: string;
        id: string;
        title: string;
        subtitle?: string;
        slug_or_code?: string;
        is_published?: boolean;
        url?: string;
      }> = [];

      for (const ent of requestedEntities) {
        const privacy = checkMcpEntityPrivacy(ent, actor, policy);
        if (!privacy.allowed) {
          throw new PermissionDeniedError(privacy.reason || `Access denied for ${ent}`);
        }
      }

      if (requestedEntities.includes("dispatches")) {
        const items = await getDispatches(undefined, q, { includeUnpublished: allowDrafts });
        for (const d of items) {
          results.push({
            entity: "dispatch",
            id: d.id,
            title: d.title,
            subtitle: `${d.issue_number} · ${d.category}`,
            slug_or_code: d.slug,
            is_published: d.is_published !== false,
            url: `/journal/${d.slug}`,
          });
        }
      }
      if (requestedEntities.includes("news")) {
        const { items } = await getNewsItems({ includeUnpublished: allowDrafts, q });
        for (const n of items) {
          results.push({
            entity: "news",
            id: n.id,
            title: n.title,
            subtitle: `${n.source_name} · ${n.category} · Impact ${n.impact_score}`,
            is_published: n.is_published,
            url: n.source_url,
          });
        }
      }
      if (requestedEntities.includes("hackathons")) {
        const { items } = await getHackathons({
          includeUnpublished: allowDrafts,
          includeExpired: true,
          q,
        });
        for (const h of items) {
          results.push({
            entity: "hackathon",
            id: h.id,
            title: h.title,
            subtitle: `${h.organizer} · ${h.prize_display} · Deadline ${h.deadline_at.slice(0, 10)}`,
            slug_or_code: h.slug,
            is_published: h.is_published,
            url: h.primary_url,
          });
        }
      }
      if (requestedEntities.includes("labs")) {
        const labs = await getLabProjects();
        for (const p of labs) {
          if (`${p.code} ${p.name} ${p.tagline} ${p.tech_stack.join(" ")}`.toLowerCase().includes(q)) {
            results.push({
              entity: "lab",
              id: p.id,
              title: `${p.code} · ${p.name}`,
              subtitle: `${p.division} · ${p.status} · ${p.tagline}`,
              slug_or_code: p.code,
              is_published: true,
              url: p.division === "LABS" ? `/labs/${p.slug}` : `/skunkworks#${p.slug}`,
            });
          }
        }
      }
      if (requestedEntities.includes("media")) {
        const media = await listMediaAssets();
        for (const m of media) {
          if (`${m.filename} ${m.prompt ?? ""} ${m.alt_text ?? ""}`.toLowerCase().includes(q)) {
            results.push({
              entity: "media",
              id: m.id,
              title: m.filename,
              subtitle: `${m.source_type} · ${m.mime_type}`,
              url: m.url,
            });
          }
        }
      }
      if (requestedEntities.includes("inquiries")) {
        const inq = await getClientInquiries();
        for (const i of inq) {
          if (`${i.name} ${i.company ?? ""} ${i.email} ${i.project_brief}`.toLowerCase().includes(q)) {
            results.push({
              entity: "inquiry",
              id: i.id,
              title: `${i.name}${i.company ? ` (${i.company})` : ""}`,
              subtitle: `${i.tier} · ${i.status} · ${i.email}`,
            });
          }
        }
      }
      if (requestedEntities.includes("orbit")) {
        const orbit = await getOrbitApplications();
        for (const o of orbit) {
          if (`${o.full_name} ${o.email} ${o.track} ${o.proof_of_work ?? ""}`.toLowerCase().includes(q)) {
            results.push({
              entity: "orbit",
              id: o.id,
              title: o.full_name,
              subtitle: `${o.track} · ${o.status ?? "NEW"} · ${o.email}`,
            });
          }
        }
      }

      return {
        query: q,
        count: results.length,
        items: results.slice(0, limit),
      };
    },
  },
  {
    name: "get_audit_logs",
    description:
      "Retrieve recent Command Center audit trail entries filtered by actor_type, status, or limit.",
    requiredPermission: null,
    inputSchema: {
      type: "object",
      properties: {
        actor_type: { type: "string", enum: ["ALL", "admin", "ai_assistant", "mcp"] },
        status: { type: "string", enum: ["ALL", "ok", "denied", "error"] },
        limit: { type: "number" },
      },
    },
    execute: async (args) => {
      const limit = Math.min(100, Math.max(1, asNumber(args.limit) ?? 30));
      const actorFilter = asString(args.actor_type, "ALL");
      const statusFilter = asString(args.status, "ALL");
      const logs = await getAuditLogs(Math.max(limit * 2, 60));
      const filtered = logs.filter((l) => {
        if (actorFilter !== "ALL" && l.actor_type !== actorFilter) return false;
        if (statusFilter !== "ALL" && l.status !== statusFilter) return false;
        return true;
      });
      return {
        count: filtered.length,
        items: filtered.slice(0, limit),
      };
    },
  },
  {
    name: "get_ingestion_health",
    description:
      "Diagnose platform freshness: expired hackathons, pending review backlog, posts missing cover visuals, latest publish timestamps, and external integration status.",
    requiredPermission: null,
    inputSchema: { type: "object", properties: {} },
    execute: async () => {
      const [dispatches, { items: news }, { items: hackathons }, labs] = await Promise.all([
        getDispatches(undefined, undefined, { includeUnpublished: true }),
        getNewsItems({ includeUnpublished: true }),
        getHackathons({ includeUnpublished: true, includeExpired: true }),
        getLabProjects(),
      ]);

      const nowMs = Date.now();
      const expiredHackathons = hackathons.filter((h) => new Date(h.deadline_at).getTime() < nowMs);
      const pendingHackathons = hackathons.filter((h) => !h.is_published);
      const pendingDispatches = dispatches.filter((d) => d.is_published === false);
      const pendingNews = news.filter((n) => !n.is_published);
      const dispatchesMissingCovers = dispatches
        .filter((d) => !d.cover_image_url)
        .map((d) => ({ id: d.id, slug: d.slug, title: d.title }));
      const unscoredLabs = labs
        .filter((l) => !l.scorecard)
        .map((l) => ({ id: l.id, code: l.code, name: l.name }));

      return {
        checked_at: new Date().toISOString(),
        integrations: {
          gemini_configured: isGeminiConfigured(),
          supabase_configured: isSupabaseConfigured(),
        },
        backlog: {
          pending_hackathons: pendingHackathons.length,
          pending_dispatches: pendingDispatches.length,
          pending_news: pendingNews.length,
          expired_hackathons: expiredHackathons.length,
        },
        quality_gaps: {
          dispatches_missing_covers_count: dispatchesMissingCovers.length,
          dispatches_missing_covers: dispatchesMissingCovers.slice(0, 10),
          unscored_labs_count: unscoredLabs.length,
          unscored_labs: unscoredLabs,
        },
        freshness: {
          latest_dispatch_at: dispatches[0]?.published_at ?? null,
          latest_news_at: news[0]?.published_at ?? null,
          latest_hackathon_updated_at: hackathons[0]?.updated_at ?? null,
        },
      };
    },
  },
  {
    name: "audit_post_readiness",
    description:
      "Run a pre-publish QA readiness checklist on a Dispatch, News item, Hackathon, or Lab Project (cover image, accent hex, markdown structure, deadline validity, links, scorecard).",
    requiredPermission: null,
    inputSchema: {
      type: "object",
      properties: {
        entity: { type: "string", enum: ["dispatch", "news", "hackathon", "lab"] },
        id_or_slug: { type: "string" },
      },
      required: ["entity", "id_or_slug"],
    },
    execute: async (args) => {
      const entity = asString(args.entity);
      const key = asString(args.id_or_slug).trim();
      if (!key) throw new Error("Provide id_or_slug.");

      const warnings: string[] = [];
      const errors: string[] = [];
      let score = 100;

      const checkHex = (hex?: string | null) => {
        if (hex && !/^#[0-9a-fA-F]{3,8}$/.test(hex)) {
          warnings.push(`Invalid design accent hex "${hex}".`);
          score -= 10;
        }
      };

      if (entity === "dispatch") {
        const all = await getDispatches(undefined, undefined, { includeUnpublished: true });
        const d = all.find((x) => x.id === key || x.slug === key || x.issue_number === key);
        if (!d) throw new Error(`Dispatch "${key}" not found.`);
        if (!d.title?.trim()) {
          errors.push("Missing title.");
          score -= 30;
        }
        if (!d.subtitle?.trim()) {
          warnings.push("Missing subtitle.");
          score -= 10;
        }
        if (!d.cover_image_url) {
          warnings.push("No cover_image_url attached.");
          score -= 15;
        }
        if (!/^##\s+/m.test(d.mdx_content || "")) {
          warnings.push("No ## section headings in mdx_content.");
          score -= 10;
        }
        if (!(d.mdx_content || "").includes("[!ACCENT]")) {
          warnings.push("Missing > [!ACCENT] key takeaway callout block.");
          score -= 5;
        }
        if ((d.tags?.length ?? 0) === 0) {
          warnings.push("No tags specified.");
          score -= 5;
        }
        checkHex(d.design?.accent_color);
        return {
          entity,
          id: d.id,
          title: d.title,
          score: Math.max(0, score),
          ready_to_publish: errors.length === 0,
          errors,
          warnings,
        };
      }

      if (entity === "news") {
        const { items } = await getNewsItems({ includeUnpublished: true });
        const n = items.find((x) => x.id === key || x.url_hash === key);
        if (!n) throw new Error(`News item "${key}" not found.`);
        if (!n.gravity_take || n.gravity_take.length < 40) {
          warnings.push("gravity_take is shorter than 40 characters.");
          score -= 15;
        }
        if (!n.source_url?.startsWith("http")) {
          errors.push("Invalid or missing source_url.");
          score -= 30;
        }
        if (!n.image_url) {
          warnings.push("No cover image attached.");
          score -= 10;
        }
        checkHex(n.design?.accent_color);
        return {
          entity,
          id: n.id,
          title: n.title,
          score: Math.max(0, score),
          ready_to_publish: errors.length === 0,
          errors,
          warnings,
        };
      }

      if (entity === "hackathon") {
        const { items } = await getHackathons({ includeUnpublished: true, includeExpired: true });
        const h = items.find((x) => x.id === key || x.slug === key);
        if (!h) throw new Error(`Hackathon "${key}" not found.`);
        if (new Date(h.deadline_at).getTime() <= Date.now()) {
          errors.push(`Deadline (${h.deadline_at}) is already in the past.`);
          score -= 35;
        }
        if (!h.primary_url?.startsWith("http")) {
          errors.push("Invalid or missing primary_url.");
          score -= 25;
        }
        if (!h.image_url) {
          warnings.push("No cover image attached.");
          score -= 10;
        }
        checkHex(h.design?.accent_color);
        return {
          entity,
          id: h.id,
          title: h.title,
          score: Math.max(0, score),
          ready_to_publish: errors.length === 0,
          errors,
          warnings,
        };
      }

      if (entity === "lab") {
        const all = await getLabProjects();
        const p = all.find(
          (x) => x.id === key || x.slug === key || x.code.toLowerCase() === key.toLowerCase()
        );
        if (!p) throw new Error(`Lab project "${key}" not found.`);
        if (!p.thesis) {
          warnings.push("Missing product thesis.");
          score -= 15;
        }
        if (!p.scorecard) {
          warnings.push("Missing 25-point OXAKALABS Graduation Scorecard.");
          score -= 20;
        }
        if ((p.architecture_notes?.length ?? 0) === 0) {
          warnings.push("No architecture_notes recorded.");
          score -= 10;
        }
        return {
          entity,
          id: p.id,
          code: p.code,
          title: p.name,
          score: Math.max(0, score),
          ready_to_publish: errors.length === 0,
          errors,
          warnings,
        };
      }

      throw new Error("Invalid entity type.");
    },
  },
  {
    name: "draft_post_with_ai",
    description:
      "Run G-Gravitator's Gemini structured AI Drafter with live web research and optional cover art generation, returning a ready-to-review draft JSON without saving yet.",
    requiredPermission: "can_use_ai_drafter",
    inputSchema: {
      type: "object",
      properties: {
        entity: { type: "string", enum: ["dispatch", "news", "hackathon"] },
        topic: { type: "string" },
        accent_color: { type: "string" },
        generate_cover: { type: "boolean" },
      },
      required: ["entity", "topic"],
    },
    execute: async (args, actor) => {
      const entityRaw = asString(args.entity);
      const entity: DraftEntityType =
        entityRaw === "news" || entityRaw === "hackathon" ? entityRaw : "dispatch";
      return generateStructuredPostDraft({
        entity,
        topic: asString(args.topic),
        accentColor: asOptionalString(args.accent_color),
        generateCover: asBoolean(args.generate_cover) ?? true,
        createdBy: actorAuthorType(actor),
      });
    },
  },
  {
    name: "create_dispatch",
    description:
      "Create and design a Journal Lab Dispatch post with rich markdown (headings, callouts > [!ACCENT], ![alt](url) images, [link](url)), custom accent color, cover image, and featured links. Respects AI direct-publish vs review-queue permission.",
    requiredPermission: "can_create_posts",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        category: {
          type: "string",
          enum: [
            "ARCHITECTURE",
            "POST-MORTEM",
            "AI SYSTEMS",
            "HACKATHON LOG",
            "DESIGN ENGINEERING",
          ],
        },
        mdx_content: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        author_name: { type: "string" },
        author_role: { type: "string" },
        cover_image_url: { type: "string" },
        accent_color: { type: "string" },
        hero_layout: {
          type: "string",
          enum: ["editorial", "split", "fullbleed", "minimal"],
        },
        callout_style: {
          type: "string",
          enum: ["left-bar", "glass-card", "tinted-banner"],
        },
        featured_links: {
          type: "array",
          items: LINK_REF_ITEM_SCHEMA,
        },
        is_featured: { type: "boolean" },
        is_published: { type: "boolean" },
        design: POST_DESIGN_SCHEMA,
      },
      required: ["title", "subtitle", "category", "mdx_content"],
    },
    execute: async (args, actor) => {
      const policy = await getAiPermissions();
      const pub = shouldAutoPublishPost(
        actor,
        policy,
        "journal",
        asBoolean(args.is_published)
      );
      const inlineDesign = asDesignConfig(args.design) ?? {};
      if (asOptionalString(args.accent_color)) {
        inlineDesign.accent_color = asOptionalString(args.accent_color);
      }
      if (
        args.hero_layout === "editorial" ||
        args.hero_layout === "split" ||
        args.hero_layout === "fullbleed" ||
        args.hero_layout === "minimal"
      ) {
        inlineDesign.hero_layout = args.hero_layout;
      }
      if (
        args.callout_style === "left-bar" ||
        args.callout_style === "glass-card" ||
        args.callout_style === "tinted-banner"
      ) {
        inlineDesign.callout_style = args.callout_style;
      }
      const featuredLinks = asLinksArray(args.featured_links);
      if (featuredLinks && featuredLinks.length > 0) {
        inlineDesign.featured_links = featuredLinks;
      }

      const created = await createDispatch({
        title: asString(args.title),
        subtitle: asString(args.subtitle),
        category: normalizeEnum(args.category, DISPATCH_CATEGORIES, "AI SYSTEMS"),
        mdx_content: asString(args.mdx_content),
        tags: asStringArray(args.tags),
        author_name: asOptionalString(args.author_name),
        author_role: asOptionalString(args.author_role),
        cover_image_url: asOptionalString(args.cover_image_url) ?? null,
        is_featured: asBoolean(args.is_featured) ?? false,
        is_published: pub.isPublished,
        approval_status: pub.isPublished ? "APPROVED" : "PENDING_REVIEW",
        created_by: actorAuthorType(actor),
        design: Object.keys(inlineDesign).length > 0 ? inlineDesign : null,
      });

      return {
        dispatch: created,
        queued_for_review: !pub.isPublished,
        note: pub.queuedReason || "Dispatch created and published live.",
      };
    },
  },
  {
    name: "update_dispatch",
    description:
      "Edit an existing Journal Lab Dispatch (title, subtitle, category, author, content, tags, cover image, accent color, featured status, links, publish state).",
    requiredPermission: "can_edit_posts",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        subtitle: { type: "string" },
        category: {
          type: "string",
          enum: [
            "ARCHITECTURE",
            "POST-MORTEM",
            "AI SYSTEMS",
            "HACKATHON LOG",
            "DESIGN ENGINEERING",
          ],
        },
        author_name: { type: "string" },
        author_role: { type: "string" },
        mdx_content: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        cover_image_url: { type: "string" },
        is_featured: { type: "boolean" },
        is_published: { type: "boolean" },
        design: POST_DESIGN_SCHEMA,
      },
      required: ["id"],
    },
    execute: async (args, actor) => {
      const id = asString(args.id);
      const existing = await getDispatchById(id);
      if (!existing) throw new Error(`Dispatch ${id} not found.`);

      const patch: Record<string, unknown> = {};
      if (asOptionalString(args.title)) patch.title = asOptionalString(args.title);
      if (asOptionalString(args.subtitle)) patch.subtitle = asOptionalString(args.subtitle);
      if (asOptionalString(args.category)) {
        patch.category = normalizeEnum(args.category, DISPATCH_CATEGORIES, existing.category);
      }
      if (asOptionalString(args.author_name)) patch.author_name = asOptionalString(args.author_name);
      if (asOptionalString(args.author_role)) patch.author_role = asOptionalString(args.author_role);
      if (asOptionalString(args.mdx_content)) patch.mdx_content = asOptionalString(args.mdx_content);
      if (asStringArray(args.tags)) patch.tags = asStringArray(args.tags);
      if (typeof args.cover_image_url === "string") {
        patch.cover_image_url = args.cover_image_url || null;
      }
      if (asBoolean(args.is_featured) !== undefined) {
        patch.is_featured = asBoolean(args.is_featured);
      }
      const reqPub = asBoolean(args.is_published);
      if (reqPub !== undefined) {
        const policy = await getAiPermissions();
        assertPublishPermission(actor, policy, reqPub, "dispatches");
        patch.is_published = reqPub;
        patch.approval_status = reqPub ? "APPROVED" : "PENDING_REVIEW";
      }
      const nextDesign = asDesignConfig(args.design);
      if (nextDesign) {
        patch.design = { ...(existing.design ?? {}), ...nextDesign };
      }

      const updated = await updateDispatch(id, patch);
      return { dispatch: updated };
    },
  },
  {
    name: "delete_dispatch",
    description: "Permanently remove a Journal Dispatch by ID.",
    requiredPermission: "can_delete_posts",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    execute: async (args) => {
      const ok = await deleteDispatch(asString(args.id));
      if (!ok) throw new Error("Dispatch not found.");
      return { deleted: true, id: asString(args.id) };
    },
  },
  {
    name: "create_news_item",
    description:
      "Create an Orbital Wire news item with category, impact score, builder Gravity Take, image, accent color, and related links.",
    requiredPermission: "can_create_posts",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        source_name: { type: "string" },
        source_url: { type: "string" },
        category: {
          type: "string",
          enum: ["MODELS", "AGENTS", "DEVTOOLS", "RESEARCH", "BUSINESS", "OPEN_SOURCE"],
        },
        gravity_take: { type: "string" },
        impact_score: { type: "number" },
        is_pinned: { type: "boolean" },
        is_published: { type: "boolean" },
        image_url: { type: "string" },
        related_links: { type: "array", items: LINK_REF_ITEM_SCHEMA },
        design: POST_DESIGN_SCHEMA,
      },
      required: ["title", "source_name", "source_url", "category", "gravity_take"],
    },
    execute: async (args, actor) => {
      const policy = await getAiPermissions();
      const pub = shouldAutoPublishPost(
        actor,
        policy,
        "news",
        asBoolean(args.is_published)
      );
      const created = await createNewsItem({
        title: asString(args.title),
        source_name: asString(args.source_name),
        source_url: asString(args.source_url),
        category: normalizeEnum(args.category, NEWS_CATEGORIES, "DEVTOOLS"),
        gravity_take: asString(args.gravity_take),
        impact_score: asNumber(args.impact_score) ?? 86,
        is_pinned: asBoolean(args.is_pinned) ?? false,
        is_published: pub.isPublished,
        approval_status: pub.isPublished ? "APPROVED" : "PENDING_REVIEW",
        created_by: actorAuthorType(actor),
        image_url: asOptionalString(args.image_url) ?? null,
        related_links: asLinksArray(args.related_links) ?? [],
        design: asDesignConfig(args.design) ?? null,
      });
      return {
        newsItem: created,
        queued_for_review: !pub.isPublished,
        note: pub.queuedReason || "News item created and published live.",
      };
    },
  },
  {
    name: "update_news_item",
    description:
      "Update an existing Orbital Wire news item (title, gravity_take, category, impact_score, pin status, publish status, image, links, design).",
    requiredPermission: "can_edit_posts",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        source_name: { type: "string" },
        source_url: { type: "string" },
        category: {
          type: "string",
          enum: ["MODELS", "AGENTS", "DEVTOOLS", "RESEARCH", "BUSINESS", "OPEN_SOURCE"],
        },
        gravity_take: { type: "string" },
        impact_score: { type: "number" },
        is_pinned: { type: "boolean" },
        is_published: { type: "boolean" },
        image_url: { type: "string" },
        related_links: { type: "array", items: LINK_REF_ITEM_SCHEMA },
        design: POST_DESIGN_SCHEMA,
      },
      required: ["id"],
    },
    execute: async (args, actor) => {
      const id = asString(args.id);
      const existing = await getNewsItemById(id);
      if (!existing) throw new Error(`News item ${id} not found.`);

      const patch: Record<string, unknown> = {};
      if (asOptionalString(args.title)) patch.title = asOptionalString(args.title);
      if (asOptionalString(args.source_name)) patch.source_name = asOptionalString(args.source_name);
      if (asOptionalString(args.source_url)) patch.source_url = asOptionalString(args.source_url);
      if (asOptionalString(args.category)) {
        patch.category = normalizeEnum(args.category, NEWS_CATEGORIES, existing.category);
      }
      if (asOptionalString(args.gravity_take)) patch.gravity_take = asOptionalString(args.gravity_take);
      if (asNumber(args.impact_score) !== undefined) {
        patch.impact_score = Math.min(100, Math.max(1, Math.round(asNumber(args.impact_score)!)));
      }
      if (asBoolean(args.is_pinned) !== undefined) patch.is_pinned = asBoolean(args.is_pinned);
      if (asBoolean(args.is_published) !== undefined) {
        const pub = asBoolean(args.is_published)!;
        const policy = await getAiPermissions();
        assertPublishPermission(actor, policy, pub, "news items");
        patch.is_published = pub;
        patch.approval_status = pub ? "APPROVED" : "PENDING_REVIEW";
      }
      if (typeof args.image_url === "string") patch.image_url = args.image_url || null;
      if (asLinksArray(args.related_links)) patch.related_links = asLinksArray(args.related_links);
      if (asDesignConfig(args.design)) {
        patch.design = { ...(existing.design ?? {}), ...asDesignConfig(args.design) };
      }

      const updated = await updateNewsItem(id, patch);
      return { newsItem: updated };
    },
  },
  {
    name: "delete_news_item",
    description: "Permanently remove an Orbital Wire news item by ID.",
    requiredPermission: "can_delete_posts",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    execute: async (args) => {
      const ok = await deleteNewsItem(asString(args.id));
      if (!ok) throw new Error("News item not found.");
      return { deleted: true, id: asString(args.id) };
    },
  },
  {
    name: "create_hackathon",
    description:
      "Create a Hackathon listing on the radar with prize pool, ISO-8601 deadline_at, format, themes, OXAKALABS squad status, cover image, accent color, and related links.",
    requiredPermission: "can_create_posts",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        organizer: { type: "string" },
        summary: { type: "string" },
        prize_pool_usd: { type: "number" },
        prize_display: { type: "string" },
        deadline_at: {
          type: "string",
          description: "ISO-8601 UTC deadline timestamp e.g. 2026-12-20T23:59:00Z",
        },
        format: { type: "string", enum: ["ONLINE", "IN_PERSON", "HYBRID"] },
        location: { type: "string" },
        themes: { type: "array", items: { type: "string" } },
        primary_url: { type: "string" },
        source_tweet_url: { type: "string" },
        image_url: { type: "string" },
        oxakalabs_status: {
          type: "string",
          enum: ["NONE", "SCOUTING", "SQUAD_DEPLOYED", "SUBMITTED", "WON"],
        },
        is_featured: { type: "boolean" },
        is_published: { type: "boolean" },
        related_links: { type: "array", items: LINK_REF_ITEM_SCHEMA },
        design: POST_DESIGN_SCHEMA,
      },
      required: ["title", "organizer", "summary", "deadline_at", "primary_url"],
    },
    execute: async (args, actor) => {
      const policy = await getAiPermissions();
      const pub = shouldAutoPublishPost(
        actor,
        policy,
        "hackathons",
        asBoolean(args.is_published)
      );
      const deadlineIso = normalizeIsoDate(args.deadline_at, 14);
      const created = await createHackathon({
        title: asString(args.title),
        organizer: asString(args.organizer),
        summary: asString(args.summary),
        prize_pool_usd: asNumber(args.prize_pool_usd) ?? null,
        prize_display: asOptionalString(args.prize_display) || "Prizes + Credits",
        deadline_at: deadlineIso,
        format: normalizeEnum(args.format, HACKATHON_FORMATS, "ONLINE"),
        location: asOptionalString(args.location) || "Global / Remote",
        themes: asStringArray(args.themes) || ["AI", "Agents"],
        primary_url: asString(args.primary_url),
        source_tweet_url: asOptionalString(args.source_tweet_url) ?? null,
        image_url: asOptionalString(args.image_url) ?? null,
        oxakalabs_status: normalizeEnum(
          args.oxakalabs_status,
          OXAKALABS_STATUSES,
          "SCOUTING"
        ),
        is_featured: asBoolean(args.is_featured) ?? false,
        is_published: pub.isPublished,
        approval_status: pub.isPublished ? "APPROVED" : "PENDING_REVIEW",
        created_by: actorAuthorType(actor),
        related_links: asLinksArray(args.related_links) ?? [],
        design: asDesignConfig(args.design) ?? null,
      });

      return {
        hackathon: created,
        queued_for_review: !pub.isPublished,
        note: pub.queuedReason || "Hackathon created and published live.",
      };
    },
  },
  {
    name: "update_hackathon",
    description:
      "Update any hackathon fields including title, summary, organizer, deadline, prize, OXAKALABS status, source_tweet_url, image_url, featured status, links, and publish state.",
    requiredPermission: "can_edit_posts",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        organizer: { type: "string" },
        summary: { type: "string" },
        prize_pool_usd: { type: "number" },
        prize_display: { type: "string" },
        deadline_at: { type: "string" },
        format: { type: "string", enum: ["ONLINE", "IN_PERSON", "HYBRID"] },
        location: { type: "string" },
        themes: { type: "array", items: { type: "string" } },
        primary_url: { type: "string" },
        source_tweet_url: { type: "string" },
        image_url: { type: "string" },
        oxakalabs_status: {
          type: "string",
          enum: ["NONE", "SCOUTING", "SQUAD_DEPLOYED", "SUBMITTED", "WON"],
        },
        is_featured: { type: "boolean" },
        is_published: { type: "boolean" },
        related_links: { type: "array", items: LINK_REF_ITEM_SCHEMA },
        design: POST_DESIGN_SCHEMA,
      },
      required: ["id"],
    },
    execute: async (args, actor) => {
      const id = asString(args.id);
      const existing = await getHackathonById(id);
      if (!existing) throw new Error(`Hackathon ${id} not found.`);

      const patch: Record<string, unknown> = {};
      for (const field of [
        "title",
        "organizer",
        "summary",
        "prize_display",
        "location",
        "primary_url",
      ]) {
        const val = asOptionalString(args[field]);
        if (val !== undefined) patch[field] = val;
      }
      if (asOptionalString(args.deadline_at)) {
        patch.deadline_at = normalizeIsoDate(args.deadline_at);
      }
      if (asOptionalString(args.format)) {
        patch.format = normalizeEnum(args.format, HACKATHON_FORMATS, existing.format);
      }
      if (asOptionalString(args.oxakalabs_status)) {
        patch.oxakalabs_status = normalizeEnum(
          args.oxakalabs_status,
          OXAKALABS_STATUSES,
          existing.oxakalabs_status
        );
      }
      if (typeof args.source_tweet_url === "string") {
        patch.source_tweet_url = args.source_tweet_url.trim() || null;
      }
      if (asNumber(args.prize_pool_usd) !== undefined) {
        patch.prize_pool_usd = asNumber(args.prize_pool_usd);
      }
      if (asStringArray(args.themes)) patch.themes = asStringArray(args.themes);
      if (typeof args.image_url === "string") patch.image_url = args.image_url || null;
      if (asBoolean(args.is_featured) !== undefined) {
        patch.is_featured = asBoolean(args.is_featured);
      }
      if (asBoolean(args.is_published) !== undefined) {
        const pub = asBoolean(args.is_published)!;
        const policy = await getAiPermissions();
        assertPublishPermission(actor, policy, pub, "hackathons");
        patch.is_published = pub;
        patch.approval_status = pub ? "APPROVED" : "PENDING_REVIEW";
      }
      if (asLinksArray(args.related_links)) patch.related_links = asLinksArray(args.related_links);
      if (asDesignConfig(args.design)) {
        patch.design = { ...(existing.design ?? {}), ...asDesignConfig(args.design) };
      }

      const updated = await updateHackathon(id, patch);
      return { hackathon: updated };
    },
  },
  {
    name: "delete_hackathon",
    description: "Permanently delete a hackathon by ID.",
    requiredPermission: "can_delete_posts",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    execute: async (args) => {
      const ok = await deleteHackathon(asString(args.id));
      if (!ok) throw new Error("Hackathon not found.");
      return { deleted: true, id: asString(args.id) };
    },
  },
  {
    name: "remove_old_posts",
    description:
      "Bulk delete expired hackathons or old news posts older than N days. Supports non-destructive dry_run preview returning candidates + confirm_token.",
    requiredPermission: "can_delete_posts",
    inputSchema: {
      type: "object",
      properties: {
        entity: {
          type: "string",
          enum: ["hackathons", "news", "all"],
        },
        older_than_days: { type: "number" },
        include_pinned: { type: "boolean" },
        dry_run: { type: "boolean" },
        confirm_token: { type: "string" },
      },
      required: ["entity"],
    },
    execute: async (args, actor) => {
      const entity = asString(args.entity, "hackathons");
      const days = asNumber(args.older_than_days) ?? 0;
      const includePinned = asBoolean(args.include_pinned) ?? false;
      const policy = await getAiPermissions();
      const requireDryRunGuard =
        actor.actorType === "mcp" && policy.mcp_require_dry_run_for_bulk_delete !== false;

      const requestedDryRun = asBoolean(args.dry_run);
      const isDryRun =
        requestedDryRun !== undefined ? requestedDryRun : requireDryRunGuard;

      const nowMs = Date.now();
      const cutoffMs = nowMs - Math.max(0, days) * 24 * 3600 * 1000;

      const candidateHackathons: Array<{ id: string; title: string; deadline_at: string }> = [];
      const candidateNews: Array<{ id: string; title: string; published_at: string }> = [];

      if (entity === "hackathons" || entity === "all") {
        const { items } = await getHackathons({
          includeExpired: true,
          includeUnpublished: true,
        });
        for (const h of items) {
          const deadlineMs = new Date(h.deadline_at).getTime();
          if (deadlineMs < (days > 0 ? cutoffMs : nowMs)) {
            candidateHackathons.push({
              id: h.id,
              title: h.title,
              deadline_at: h.deadline_at,
            });
          }
        }
      }

      if (entity === "news" || entity === "all") {
        const { items } = await getNewsItems({ includeUnpublished: true });
        const newsCutoff =
          days > 0 ? cutoffMs : nowMs - 14 * 24 * 3600 * 1000;
        for (const n of items) {
          if (!includePinned && n.is_pinned) continue;
          const pubMs = new Date(n.published_at).getTime();
          if (pubMs < newsCutoff) {
            candidateNews.push({
              id: n.id,
              title: n.title,
              published_at: n.published_at,
            });
          }
        }
      }

      const candidateCount = candidateHackathons.length + candidateNews.length;

      if (isDryRun) {
        const confirmToken = issueBulkPurgeConfirmToken({
          entity,
          olderThanDays: days,
          includePinned,
          candidateCount,
        });
        return {
          dry_run: true,
          would_remove_hackathons: candidateHackathons.length,
          would_remove_news: candidateNews.length,
          candidates: {
            hackathons: candidateHackathons.slice(0, 25),
            news: candidateNews.slice(0, 25),
          },
          confirm_token: confirmToken,
          note:
            candidateCount === 0
              ? "No stale/expired posts matched the criteria."
              : `Dry run complete (${candidateCount} candidate(s)). Pass dry_run: false with confirm_token to permanently delete.`,
        };
      }

      if (requireDryRunGuard && candidateCount > 0) {
        const token = asString(args.confirm_token).trim();
        if (!token) {
          throw new PermissionDeniedError(
            "Bulk delete over MCP requires a confirm_token from a prior dry_run: true call (mcp_require_dry_run_for_bulk_delete is ON)."
          );
        }
        const check = verifyBulkPurgeConfirmToken(token, {
          entity,
          olderThanDays: days,
          includePinned,
          candidateCount,
        });
        if (!check.valid) {
          throw new PermissionDeniedError(check.reason || "Invalid confirm_token.");
        }
      }

      let removedHackathons = 0;
      let removedNews = 0;

      for (const h of candidateHackathons) {
        if (await deleteHackathon(h.id)) removedHackathons++;
      }
      for (const n of candidateNews) {
        if (await deleteNewsItem(n.id)) removedNews++;
      }

      return { dry_run: false, removedHackathons, removedNews };
    },
  },
  {
    name: "approve_content",
    description:
      "Approve and publish a pending Dispatch, News item, or Hackathon so it goes live immediately.",
    requiredPermission: "can_approve_posts",
    inputSchema: {
      type: "object",
      properties: {
        entity: { type: "string", enum: ["dispatch", "news", "hackathon"] },
        id: { type: "string" },
      },
      required: ["entity", "id"],
    },
    execute: async (args) => {
      const entity = asString(args.entity);
      const id = asString(args.id);
      if (entity === "dispatch") {
        const updated = await updateDispatch(id, {
          is_published: true,
          approval_status: "APPROVED",
        });
        if (!updated) throw new Error(`Dispatch ${id} not found.`);
        return { approved: true, entity, item: updated };
      }
      if (entity === "news") {
        const updated = await updateNewsItem(id, {
          is_published: true,
          approval_status: "APPROVED",
        });
        if (!updated) throw new Error(`News item ${id} not found.`);
        return { approved: true, entity, item: updated };
      }
      if (entity === "hackathon") {
        const updated = await updateHackathon(id, {
          is_published: true,
          approval_status: "APPROVED",
        });
        if (!updated) throw new Error(`Hackathon ${id} not found.`);
        return { approved: true, entity, item: updated };
      }
      throw new Error("Invalid entity type.");
    },
  },
  {
    name: "revoke_approval",
    description:
      "Remove approval and unpublish a Dispatch, News item, or Hackathon from the public site (moves it back to PENDING_REVIEW).",
    requiredPermission: "can_revoke_approval",
    inputSchema: {
      type: "object",
      properties: {
        entity: { type: "string", enum: ["dispatch", "news", "hackathon"] },
        id: { type: "string" },
        reason: { type: "string" },
      },
      required: ["entity", "id"],
    },
    execute: async (args) => {
      const entity = asString(args.entity);
      const id = asString(args.id);
      const reason = asOptionalString(args.reason);
      if (entity === "dispatch") {
        const updated = await updateDispatch(id, {
          is_published: false,
          approval_status: "PENDING_REVIEW",
        });
        if (!updated) throw new Error(`Dispatch ${id} not found.`);
        return { revoked: true, entity, item: updated };
      }
      if (entity === "news") {
        const updated = await updateNewsItem(id, {
          is_published: false,
          approval_status: "PENDING_REVIEW",
        });
        if (!updated) throw new Error(`News item ${id} not found.`);
        return { revoked: true, entity, item: updated };
      }
      if (entity === "hackathon") {
        const updated = await updateHackathon(id, {
          is_published: false,
          approval_status: "PENDING_REVIEW",
          ...(reason ? { review_notes: reason } : {}),
        });
        if (!updated) throw new Error(`Hackathon ${id} not found.`);
        return { revoked: true, entity, item: updated };
      }
      throw new Error("Invalid entity type.");
    },
  },
  {
    name: "reject_content",
    description:
      "Reject a pending Dispatch, News item, or Hackathon (marks approval_status=REJECTED and keeps it unpublished).",
    requiredPermission: "can_revoke_approval",
    inputSchema: {
      type: "object",
      properties: {
        entity: { type: "string", enum: ["dispatch", "news", "hackathon"] },
        id: { type: "string" },
        reason: { type: "string" },
      },
      required: ["entity", "id"],
    },
    execute: async (args) => {
      const entity = asString(args.entity);
      const id = asString(args.id);
      const reason = asOptionalString(args.reason);
      if (entity === "dispatch") {
        const updated = await updateDispatch(id, {
          is_published: false,
          approval_status: "REJECTED",
        });
        if (!updated) throw new Error(`Dispatch ${id} not found.`);
        return { rejected: true, entity, item: updated };
      }
      if (entity === "news") {
        const updated = await updateNewsItem(id, {
          is_published: false,
          approval_status: "REJECTED",
        });
        if (!updated) throw new Error(`News item ${id} not found.`);
        return { rejected: true, entity, item: updated };
      }
      if (entity === "hackathon") {
        const updated = await updateHackathon(id, {
          is_published: false,
          approval_status: "REJECTED",
          ...(reason ? { review_notes: reason } : {}),
        });
        if (!updated) throw new Error(`Hackathon ${id} not found.`);
        return { rejected: true, entity, item: updated };
      }
      throw new Error("Invalid entity type.");
    },
  },
  {
    name: "bulk_moderate_content",
    description:
      "Approve, revoke approval, or reject up to 25 Dispatches, News items, or Hackathons in a single audited batch call.",
    requiredPermission: "can_bulk_moderate",
    inputSchema: {
      type: "object",
      properties: {
        decision: { type: "string", enum: ["APPROVE", "REVOKE", "REJECT"] },
        reason: { type: "string" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              entity: { type: "string", enum: ["dispatch", "news", "hackathon"] },
              id: { type: "string" },
            },
            required: ["entity", "id"],
          },
        },
      },
      required: ["decision", "items"],
    },
    execute: async (args, actor) => {
      const decision = normalizeEnum(
        args.decision,
        ["APPROVE", "REVOKE", "REJECT"] as const,
        "APPROVE"
      );
      const reason = asOptionalString(args.reason);
      const rawItems = Array.isArray(args.items) ? args.items.slice(0, 25) : [];
      if (rawItems.length === 0) {
        throw new Error("Provide at least one item in items[].");
      }

      const policy = await getAiPermissions();
      if (actor.actorType === "ai_assistant") {
        if (decision === "APPROVE" && !policy.can_approve_posts) {
          throw new PermissionDeniedError("can_approve_posts is required for bulk APPROVE.");
        }
        if (decision !== "APPROVE" && !policy.can_revoke_approval) {
          throw new PermissionDeniedError("can_revoke_approval is required for bulk REVOKE/REJECT.");
        }
      } else if (actor.actorType === "mcp") {
        const subCheck = checkMcpScopeRequirement(
          decision === "APPROVE" ? "can_approve_posts" : "can_revoke_approval",
          actor,
          policy
        );
        if (!subCheck.allowed) {
          throw new PermissionDeniedError(subCheck.reason || "Missing moderation scope.");
        }
      }

      const publishFlag = decision === "APPROVE";
      const approvalStatus =
        decision === "APPROVE"
          ? "APPROVED"
          : decision === "REJECT"
          ? "REJECTED"
          : "PENDING_REVIEW";

      const outcomes: Array<{
        entity: string;
        id: string;
        ok: boolean;
        error?: string;
      }> = [];

      for (const rawItem of rawItems) {
        if (!rawItem || typeof rawItem !== "object") continue;
        const rec = rawItem as Record<string, unknown>;
        const entity = asString(rec.entity);
        const id = asString(rec.id).trim();
        if (!id) continue;

        try {
          if (entity === "dispatch") {
            const updated = await updateDispatch(id, {
              is_published: publishFlag,
              approval_status: approvalStatus,
            });
            outcomes.push({ entity, id, ok: Boolean(updated), ...(updated ? {} : { error: "Not found" }) });
          } else if (entity === "news") {
            const updated = await updateNewsItem(id, {
              is_published: publishFlag,
              approval_status: approvalStatus,
            });
            outcomes.push({ entity, id, ok: Boolean(updated), ...(updated ? {} : { error: "Not found" }) });
          } else if (entity === "hackathon") {
            const updated = await updateHackathon(id, {
              is_published: publishFlag,
              approval_status: approvalStatus,
              ...(reason ? { review_notes: reason } : {}),
            });
            outcomes.push({ entity, id, ok: Boolean(updated), ...(updated ? {} : { error: "Not found" }) });
          } else {
            outcomes.push({ entity, id, ok: false, error: "Invalid entity" });
          }
        } catch (err) {
          outcomes.push({
            entity,
            id,
            ok: false,
            error: err instanceof Error ? err.message : "Failed",
          });
        }
      }

      const succeeded = outcomes.filter((o) => o.ok).length;
      return {
        decision,
        total: outcomes.length,
        succeeded,
        failed: outcomes.length - succeeded,
        outcomes,
      };
    },
  },
  {
    name: "create_lab_project",
    description: "Create a new G-Gravitator Labs or OXAKALABS Skunkworks project.",
    requiredPermission: "can_manage_labs",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string" },
        division: { type: "string", enum: ["LABS", "SKUNKWORKS"] },
        name: { type: "string" },
        tagline: { type: "string" },
        description: { type: "string" },
        thesis: { type: "string" },
        architecture_notes: { type: "array", items: { type: "string" } },
        status: {
          type: "string",
          enum: [
            "CONCEPT",
            "PROTOTYPING",
            "R&D",
            "SKUNKWORKS CANDIDATE",
            "BETA",
            "LIVE",
            "ARCHIVED",
          ],
        },
        tech_stack: { type: "array", items: { type: "string" } },
        live_url: { type: "string" },
        repo_url: { type: "string" },
        hackathon_origin: { type: "string" },
        scorecard: SCORECARD_SCHEMA,
      },
      required: ["code", "division", "name", "tagline", "description", "status"],
    },
    execute: async (args) => {
      const created = await createLabProject({
        code: asString(args.code),
        division: normalizeEnum(args.division, LAB_DIVISIONS, "SKUNKWORKS"),
        name: asString(args.name),
        tagline: asString(args.tagline),
        description: asString(args.description),
        thesis: asOptionalString(args.thesis),
        architecture_notes: asStringArray(args.architecture_notes) ?? [],
        status: normalizeEnum(args.status, LAB_STATUSES, "PROTOTYPING"),
        tech_stack: asStringArray(args.tech_stack) ?? [],
        live_url: asOptionalString(args.live_url) ?? null,
        repo_url: asOptionalString(args.repo_url) ?? null,
        hackathon_origin: asOptionalString(args.hackathon_origin) ?? null,
        scorecard:
          args.scorecard && typeof args.scorecard === "object"
            ? (args.scorecard as LabProjectScorecardParam)
            : null,
      });
      return { project: created };
    },
  },
  {
    name: "update_lab_project",
    description:
      "Update a Labs or Skunkworks project (status, division, scorecard, tagline, description, thesis, architecture_notes, hackathon_origin, URLs, tech stack).",
    requiredPermission: "can_manage_labs",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        division: { type: "string", enum: ["LABS", "SKUNKWORKS"] },
        name: { type: "string" },
        tagline: { type: "string" },
        description: { type: "string" },
        thesis: { type: "string" },
        architecture_notes: { type: "array", items: { type: "string" } },
        status: {
          type: "string",
          enum: [
            "CONCEPT",
            "PROTOTYPING",
            "R&D",
            "SKUNKWORKS CANDIDATE",
            "BETA",
            "LIVE",
            "ARCHIVED",
          ],
        },
        tech_stack: { type: "array", items: { type: "string" } },
        live_url: { type: "string" },
        repo_url: { type: "string" },
        hackathon_origin: { type: "string" },
        scorecard: SCORECARD_SCHEMA,
      },
      required: ["id"],
    },
    execute: async (args) => {
      const id = asString(args.id);
      const existing = await getLabProjectById(id);
      if (!existing) throw new Error(`Project ${id} not found.`);
      const patch: Record<string, unknown> = {};
      if (asOptionalString(args.division)) {
        patch.division = normalizeEnum(args.division, LAB_DIVISIONS, existing.division);
      }
      if (asOptionalString(args.status)) {
        patch.status = normalizeEnum(args.status, LAB_STATUSES, existing.status);
      }
      for (const f of ["name", "tagline", "description"]) {
        const v = asOptionalString(args[f]);
        if (v !== undefined) patch[f] = v;
      }
      if (typeof args.thesis === "string") {
        patch.thesis = args.thesis.trim() || undefined;
      }
      if (asStringArray(args.architecture_notes)) {
        patch.architecture_notes = asStringArray(args.architecture_notes);
      }
      if (asStringArray(args.tech_stack)) patch.tech_stack = asStringArray(args.tech_stack);
      if (typeof args.live_url === "string") patch.live_url = args.live_url || null;
      if (typeof args.repo_url === "string") patch.repo_url = args.repo_url || null;
      if (typeof args.hackathon_origin === "string") {
        patch.hackathon_origin = args.hackathon_origin.trim() || null;
      }
      if (args.scorecard && typeof args.scorecard === "object") {
        patch.scorecard = args.scorecard;
      }
      const updated = await updateLabProject(id, patch);
      return { project: updated };
    },
  },
  {
    name: "append_lab_changelog",
    description:
      "Append a versioned changelog entry (version, date, summary) to a Labs or Skunkworks project by ID, slug, or project code (e.g. G-01).",
    requiredPermission: "can_manage_labs",
    inputSchema: {
      type: "object",
      properties: {
        id_or_code: { type: "string" },
        version: { type: "string" },
        summary: { type: "string" },
        date: { type: "string" },
      },
      required: ["id_or_code", "version", "summary"],
    },
    execute: async (args) => {
      const key = asString(args.id_or_code).trim();
      const all = await getLabProjects();
      const existing = all.find(
        (p) => p.id === key || p.slug === key || p.code.toLowerCase() === key.toLowerCase()
      );
      if (!existing) throw new Error(`Lab project "${key}" not found.`);
      const version = asString(args.version).trim();
      const summary = asString(args.summary).trim();
      const date = asOptionalString(args.date) || new Date().toISOString().slice(0, 10);
      const nextChangelog = [
        { version, date, summary },
        ...(Array.isArray(existing.changelog) ? existing.changelog : []),
      ].slice(0, 40);
      const updated = await updateLabProject(existing.id, { changelog: nextChangelog });
      return { project: updated, added_entry: { version, date, summary } };
    },
  },
  {
    name: "update_lab_scorecard",
    description:
      "Update the 25-point OXAKALABS Graduation Scorecard on a Labs/Skunkworks project by ID, slug, or code and compute graduation readiness.",
    requiredPermission: "can_manage_labs",
    inputSchema: {
      type: "object",
      properties: {
        id_or_code: { type: "string" },
        scorecard: SCORECARD_SCHEMA,
      },
      required: ["id_or_code", "scorecard"],
    },
    execute: async (args) => {
      const key = asString(args.id_or_code).trim();
      const all = await getLabProjects();
      const existing = all.find(
        (p) => p.id === key || p.slug === key || p.code.toLowerCase() === key.toLowerCase()
      );
      if (!existing) throw new Error(`Lab project "${key}" not found.`);
      const sc = args.scorecard as LabProjectScorecardParam | undefined;
      if (!sc || typeof sc !== "object") {
        throw new Error("Provide valid 5-axis scorecard values (1-5 each).");
      }
      const clampScore = (v: unknown) => Math.max(1, Math.min(5, Math.round(Number(v) || 1)));
      const normalized: LabProjectScorecardParam = {
        pain_intensity: clampScore(sc.pain_intensity),
        willingness_to_pay: clampScore(sc.willingness_to_pay),
        technical_moat: clampScore(sc.technical_moat),
        distribution_hook: clampScore(sc.distribution_hook),
        lean_maintainability: clampScore(sc.lean_maintainability),
      };
      const evaluation = evaluateGraduationScorecard(normalized);
      const updated = await updateLabProject(existing.id, { scorecard: normalized });
      return { project: updated, scorecard: normalized, evaluation };
    },
  },
  {
    name: "promote_to_labs",
    description:
      "Graduate a high-scoring OXAKALABS Skunkworks prototype into G-Gravitator Labs (division=LABS), optionally assigning a new G-XX drop code and appending a graduation changelog entry.",
    requiredPermission: "can_manage_labs",
    inputSchema: {
      type: "object",
      properties: {
        id_or_code: { type: "string" },
        new_code: { type: "string" },
        status: { type: "string", enum: ["BETA", "LIVE", "PROTOTYPING"] },
      },
      required: ["id_or_code"],
    },
    execute: async (args) => {
      const key = asString(args.id_or_code).trim();
      const all = await getLabProjects();
      const existing = all.find(
        (p) => p.id === key || p.slug === key || p.code.toLowerCase() === key.toLowerCase()
      );
      if (!existing) throw new Error(`Project "${key}" not found.`);

      const evaluation = existing.scorecard
        ? evaluateGraduationScorecard(existing.scorecard)
        : null;
      const nextStatus = normalizeEnum(
        args.status,
        ["BETA", "LIVE", "PROTOTYPING"] as const,
        "BETA"
      );
      const nextCode = asOptionalString(args.new_code) || existing.code;
      const today = new Date().toISOString().slice(0, 10);
      const nextChangelog = [
        {
          version: "v1.0-LABS",
          date: today,
          summary: `Graduated from ${existing.division} (${existing.code}) to G-Gravitator Labs as ${nextCode}${evaluation ? ` with scorecard ${evaluation.total}/25` : ""}.`,
        },
        ...(Array.isArray(existing.changelog) ? existing.changelog : []),
      ];

      const updated = await updateLabProject(existing.id, {
        division: "LABS",
        code: nextCode,
        status: nextStatus,
        changelog: nextChangelog,
      });
      return {
        promoted: true,
        project: updated,
        evaluation,
        warning:
          evaluation && evaluation.total < 20
            ? `Scorecard total is ${evaluation.total}/25 (below standard 20/25 threshold).`
            : undefined,
      };
    },
  },
  {
    name: "delete_lab_project",
    description: "Delete a Labs or Skunkworks project by ID.",
    requiredPermission: "can_manage_labs",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    execute: async (args) => {
      const ok = await deleteLabProject(asString(args.id));
      if (!ok) throw new Error("Project not found.");
      return { deleted: true, id: asString(args.id) };
    },
  },
  {
    name: "update_inquiry_status",
    description: "Update a B2B client inquiry pipeline status.",
    requiredPermission: "can_manage_inquiries",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        status: {
          type: "string",
          enum: ["NEW", "REVIEWED", "DISCOVERY_CALL", "CLOSED_WON", "ARCHIVED"],
        },
      },
      required: ["id", "status"],
    },
    execute: async (args) => {
      const updated = await updateClientInquiryStatus(
        asString(args.id),
        normalizeEnum(
          args.status,
          ["NEW", "REVIEWED", "DISCOVERY_CALL", "CLOSED_WON", "ARCHIVED"] as const,
          "REVIEWED"
        ) as InquiryStatus
      );
      if (!updated) throw new Error("Inquiry not found.");
      return { inquiry: updated };
    },
  },
  {
    name: "delete_inquiry",
    description: "Delete a B2B client inquiry by ID.",
    requiredPermission: "can_manage_inquiries",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    execute: async (args) => {
      const ok = await deleteClientInquiry(asString(args.id));
      if (!ok) throw new Error("Inquiry not found.");
      return { deleted: true, id: asString(args.id) };
    },
  },
  {
    name: "update_orbit_application",
    description: "Update an Orbit residency application status, track, or reviewer notes.",
    requiredPermission: "can_manage_orbit_and_subscribers",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        status: {
          type: "string",
          enum: ["NEW", "REVIEWING", "ACCEPTED", "WAITLISTED", "REJECTED"],
        },
        track: {
          type: "string",
          enum: ["AI_ENGINEERING", "FULLSTACK_SYSTEMS", "KINETIC_DESIGN"],
        },
        notes: { type: "string" },
      },
      required: ["id"],
    },
    execute: async (args) => {
      const patch: {
        status?: OrbitApplicationStatus;
        track?: OrbitTrack;
        notes?: string;
      } = {};
      if (asOptionalString(args.status)) {
        patch.status = normalizeEnum(
          args.status,
          ["NEW", "REVIEWING", "ACCEPTED", "WAITLISTED", "REJECTED"] as const,
          "REVIEWING"
        ) as OrbitApplicationStatus;
      }
      if (asOptionalString(args.track)) {
        patch.track = normalizeEnum(
          args.track,
          ["AI_ENGINEERING", "FULLSTACK_SYSTEMS", "KINETIC_DESIGN"] as const,
          "AI_ENGINEERING"
        ) as OrbitTrack;
      }
      if (typeof args.notes === "string") {
        patch.notes = args.notes;
      }
      const updated = await updateOrbitApplication(asString(args.id), patch);
      if (!updated) throw new Error("Orbit application not found.");
      return { application: updated };
    },
  },
  {
    name: "delete_orbit_application",
    description: "Delete an Orbit residency application by ID.",
    requiredPermission: "can_manage_orbit_and_subscribers",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    execute: async (args) => {
      const ok = await deleteOrbitApplication(asString(args.id));
      if (!ok) throw new Error("Orbit application not found.");
      return { deleted: true, id: asString(args.id) };
    },
  },
  {
    name: "add_newsletter_subscriber",
    description: "Add a subscriber email to the Weekly Orbital Brief list.",
    requiredPermission: "can_manage_orbit_and_subscribers",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string" },
        source: { type: "string" },
      },
      required: ["email"],
    },
    execute: async (args) => {
      const sub = await createNewsletterSubscriber({
        email: asString(args.email),
        source: asOptionalString(args.source) || "admin",
      });
      return { subscriber: sub };
    },
  },
  {
    name: "delete_newsletter_subscriber",
    description: "Remove a Weekly Orbital Brief subscriber by ID.",
    requiredPermission: "can_manage_orbit_and_subscribers",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    execute: async (args) => {
      const ok = await deleteNewsletterSubscriber(asString(args.id));
      if (!ok) throw new Error("Subscriber not found.");
      return { deleted: true, id: asString(args.id) };
    },
  },
  {
    name: "run_hackathon_ingestion",
    description:
      "Trigger live hackathon ingestion across Devpost and X (Twitter) discovery pipelines.",
    requiredPermission: "can_trigger_ingestion",
    inputSchema: { type: "object", properties: {} },
    execute: async () => {
      const report = await runHackathonIngestionPipeline();
      return { report };
    },
  },
  {
    name: "run_news_ingestion",
    description:
      "Trigger live Orbital Wire news ingestion across Hacker News and arXiv with Gemini synthesis.",
    requiredPermission: "can_trigger_ingestion",
    inputSchema: { type: "object", properties: {} },
    execute: async () => {
      const report = await runNewsIngestionPipeline();
      return { report };
    },
  },
  {
    name: "web_research",
    description:
      "Perform live internet research across Hacker News, arXiv, Devpost, Wikipedia, and Google Search grounding to gather real facts, links, and dates before drafting posts or updates.",
    requiredPermission: "can_web_research",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        sources: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["query"],
    },
    execute: async (args) => {
      return runLiveWebResearch(asString(args.query), asStringArray(args.sources));
    },
  },
  {
    name: "fetch_webpage",
    description:
      "Fetch a specific public web page URL and extract its title, description, OG image URL, top links, and text excerpt.",
    requiredPermission: "can_web_research",
    inputSchema: {
      type: "object",
      properties: { url: { type: "string" } },
      required: ["url"],
    },
    execute: async (args) => {
      return fetchWebpageMetadata(asString(args.url));
    },
  },
  {
    name: "generate_post_image",
    description:
      "Generate a cover or inline graphic image using Gemini Image generation (with custom editorial SVG fallback) and store it in the Media Library with a public /api/media/... URL.",
    requiredPermission: "can_manage_media",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string" },
        title: { type: "string" },
        subtitle: { type: "string" },
        accent_color: { type: "string" },
        category: { type: "string" },
      },
      required: ["prompt"],
    },
    execute: async (args, actor) => {
      const { asset, generator } = await generateAndStoreImage({
        prompt: asString(args.prompt),
        title: asOptionalString(args.title),
        subtitle: asOptionalString(args.subtitle),
        accentColor: asOptionalString(args.accent_color),
        category: asOptionalString(args.category),
        createdBy: actorAuthorType(actor),
      });
      return {
        generator,
        asset: {
          id: asset.id,
          filename: asset.filename,
          mime_type: asset.mime_type,
          url: asset.url,
          download_url: `${asset.url}?download=1`,
          alt_text: asset.alt_text,
        },
      };
    },
  },
  {
    name: "import_image_from_url",
    description:
      "Download and import an image from a public URL into the G-Gravitator Media Library so it is hosted cleanly at /api/media/[id] and downloadable.",
    requiredPermission: "can_manage_media",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        alt_text: { type: "string" },
      },
      required: ["url"],
    },
    execute: async (args, actor) => {
      const asset = await importAndStoreImageFromUrl({
        url: asString(args.url),
        altText: asOptionalString(args.alt_text),
        createdBy: actorAuthorType(actor),
      });
      return {
        asset: {
          id: asset.id,
          filename: asset.filename,
          mime_type: asset.mime_type,
          url: asset.url,
          download_url: `${asset.url}?download=1`,
          alt_text: asset.alt_text,
        },
      };
    },
  },
  {
    name: "upload_media_asset",
    description:
      "Upload a base64-encoded image (PNG, JPEG, WEBP, GIF, SVG up to 5 MB) into the G-Gravitator Media Library and receive a permanent /api/media/[id] URL.",
    requiredPermission: "can_manage_media",
    inputSchema: {
      type: "object",
      properties: {
        filename: { type: "string" },
        mime_type: { type: "string" },
        base64_data: { type: "string" },
        alt_text: { type: "string" },
      },
      required: ["filename", "mime_type", "base64_data"],
    },
    execute: async (args, actor) => {
      const asset = await uploadAndStoreImage({
        filename: asString(args.filename),
        mimeType: asString(args.mime_type),
        base64Data: asString(args.base64_data),
        altText: asOptionalString(args.alt_text),
        createdBy: actorAuthorType(actor),
      });
      return {
        asset: {
          id: asset.id,
          filename: asset.filename,
          mime_type: asset.mime_type,
          url: asset.url,
          download_url: `${asset.url}?download=1`,
          alt_text: asset.alt_text,
        },
      };
    },
  },
  {
    name: "delete_media_asset",
    description: "Delete a stored image asset from the Media Library by ID.",
    requiredPermission: "can_manage_media",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    execute: async (args) => {
      const ok = await deleteMediaAsset(asString(args.id));
      if (!ok) throw new Error("Media asset not found.");
      return { deleted: true, id: asString(args.id) };
    },
  },
  {
    name: "get_ai_permissions",
    description:
      "Read current AI assistant, community moderation, and MCP permission flags.",
    requiredPermission: null,
    inputSchema: { type: "object", properties: {} },
    execute: async () => {
      return { permissions: await getAiPermissions() };
    },
  },
  {
    name: "update_ai_permissions",
    description:
      "Update AI permission flags (admin-only governance control).",
    requiredPermission: "admin_only",
    inputSchema: {
      type: "object",
      properties: {
        patch: {
          type: "object",
          properties: {
            ai_enabled: { type: "boolean" },
            full_admin_parity: { type: "boolean" },
            can_create_posts: { type: "boolean" },
            can_publish_directly_journal: { type: "boolean" },
            can_publish_directly_news: { type: "boolean" },
            can_publish_directly_hackathons: { type: "boolean" },
            can_edit_posts: { type: "boolean" },
            can_approve_posts: { type: "boolean" },
            can_revoke_approval: { type: "boolean" },
            can_bulk_moderate: { type: "boolean" },
            can_delete_posts: { type: "boolean" },
            can_manage_labs: { type: "boolean" },
            can_manage_inquiries: { type: "boolean" },
            can_manage_orbit_and_subscribers: { type: "boolean" },
            can_trigger_ingestion: { type: "boolean" },
            can_web_research: { type: "boolean" },
            can_use_ai_drafter: { type: "boolean" },
            can_manage_media: { type: "boolean" },
            community_hackathons_require_approval: { type: "boolean" },
            mcp_enabled: { type: "boolean" },
            mcp_inherit_ai_permissions: { type: "boolean" },
            mcp_allow_pii_over_mcp: { type: "boolean" },
            mcp_allow_full_parity_tokens: { type: "boolean" },
            mcp_require_dry_run_for_bulk_delete: { type: "boolean" },
            mcp_expose_prompts: { type: "boolean" },
            mcp_expose_resources: { type: "boolean" },
            mcp_read_audit_logs: { type: "boolean" },
            mcp_default_rate_limit_rpm: { type: "number" },
          },
        },
      },
      required: ["patch"],
    },
    execute: async (args) => {
      const raw =
        args.patch && typeof args.patch === "object"
          ? (args.patch as Partial<AiPermissionsPolicy>)
          : (args as Partial<AiPermissionsPolicy>);
      const updated = await updateAiPermissions(raw);
      return { permissions: updated };
    },
  },
];

type LabProjectScorecardParam = {
  pain_intensity: number;
  willingness_to_pay: number;
  technical_moat: number;
  distribution_hook: number;
  lean_maintainability: number;
};

export async function executeOpsTool(
  name: string,
  args: Record<string, unknown>,
  actor: OpsActorContext
): Promise<{
  ok: boolean;
  denied?: boolean;
  data?: Record<string, unknown>;
  error?: string;
}> {
  const tool = OPS_TOOLS.find((t) => t.name === name);
  if (!tool) {
    return { ok: false, error: `Unknown tool "${name}".` };
  }

  const policy = await getAiPermissions();
  const perm = checkToolPermission(tool, actor, policy);
  if (!perm.allowed) {
    await appendAuditLog({
      actor_type: actor.actorType,
      actor_label: actor.actorLabel,
      action: name,
      entity_type: "permission_gate",
      summary: perm.reason || `Permission denied for ${name}`,
      status: "denied",
    });
    return { ok: false, denied: true, error: perm.reason || "Permission denied." };
  }

  try {
    const data = await tool.execute(args, actor);
    const entityId =
      typeof args.id === "string"
        ? args.id
        : typeof (data.dispatch as { id?: string } | undefined)?.id === "string"
        ? (data.dispatch as { id: string }).id
        : typeof (data.newsItem as { id?: string } | undefined)?.id === "string"
        ? (data.newsItem as { id: string }).id
        : typeof (data.hackathon as { id?: string } | undefined)?.id === "string"
        ? (data.hackathon as { id: string }).id
        : typeof (data.project as { id?: string } | undefined)?.id === "string"
        ? (data.project as { id: string }).id
        : null;

    await appendAuditLog({
      actor_type: actor.actorType,
      actor_label: actor.actorLabel,
      action: name,
      entity_type: typeof args.entity === "string" ? args.entity : "ops",
      entity_id: entityId,
      summary: `${actor.actorLabel} executed ${name}`,
      status: "ok",
    });
    return { ok: true, data };
  } catch (error) {
    const isDenied = error instanceof PermissionDeniedError;
    const errMsg = error instanceof Error ? error.message : String(error);
    await appendAuditLog({
      actor_type: actor.actorType,
      actor_label: actor.actorLabel,
      action: name,
      entity_type: isDenied ? "permission_gate" : "error",
      summary: `${name} ${isDenied ? "denied" : "failed"}: ${errMsg.slice(0, 140)}`,
      status: isDenied ? "denied" : "error",
    });
    return { ok: false, denied: isDenied, error: errMsg };
  }
}

export function getGeminiFunctionDeclarations(): FunctionDeclaration[] {
  return OPS_TOOLS.filter((t) => t.requiredPermission !== "admin_only").map((t) => ({
    name: t.name,
    description: t.description,
    parametersJsonSchema: t.inputSchema,
  }));
}

export function getMcpToolListings(
  actor: OpsActorContext,
  policy: AiPermissionsPolicy
) {
  return getAllowedMcpTools(actor, policy).map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
    annotations: getToolMcpAnnotations(t),
  }));
}
