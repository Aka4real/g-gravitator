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
import { generateAndStoreImage, importAndStoreImageFromUrl } from "@/lib/ops/media";
import { fetchWebpageMetadata, runLiveWebResearch } from "@/lib/ops/research";
import type {
  AiPermissionsPolicy,
  ContentAuthorType,
  DispatchCategory,
  HackathonFormat,
  InquiryStatus,
  LabDivision,
  LabProjectStatus,
  NewsCategory,
  OrbitApplicationStatus,
  OrbitTrack,
  OxakalabsStatus,
  PostDesignConfig,
  PostLinkRef,
} from "@/lib/supabase/types";

export interface OpsActorContext {
  actorType: "admin" | "ai_assistant" | "mcp";
  actorLabel: string;
  permissionsMode?: "inherit" | "full" | "readonly";
}

export type PermissionRequirement =
  | keyof AiPermissionsPolicy
  | "admin_only"
  | null;

export interface OpsToolDefinition {
  name: string;
  description: string;
  requiredPermission: PermissionRequirement;
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

  if (actor.actorType === "ai_assistant" && !policy.ai_enabled) {
    return {
      allowed: false,
      reason: "AI Assistant execution is currently disabled by Admin policy.",
    };
  }

  if (actor.actorType === "mcp") {
    if (!policy.mcp_enabled) {
      return {
        allowed: false,
        reason: "External MCP server access is currently disabled by Admin policy.",
      };
    }
    if (actor.permissionsMode === "readonly" && tool.requiredPermission !== null) {
      return {
        allowed: false,
        reason: `MCP token "${actor.actorLabel}" is read-only and cannot invoke mutating tool "${tool.name}".`,
      };
    }
    if (actor.permissionsMode === "full") {
      return { allowed: true };
    }
    if (!policy.mcp_inherit_ai_permissions && tool.requiredPermission !== null) {
      return {
        allowed: false,
        reason: "MCP token permission inheritance is disabled by Admin policy.",
      };
    }
  }

  if (tool.requiredPermission === null) {
    return { allowed: true };
  }

  if (!policy[tool.requiredPermission]) {
    return {
      allowed: false,
      reason: `Permission "${tool.requiredPermission}" is currently disabled in AI Permissions policy.`,
    };
  }

  return { allowed: true };
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
  if (actor.actorType === "mcp" && actor.permissionsMode === "full") {
    return { isPublished: requestedPublish ?? true };
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

export const OPS_TOOLS: OpsToolDefinition[] = [
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
      "List items across any entity type (dispatches, news, hackathons, labs, inquiries, orbit, subscribers, media, audit_logs) with optional search filter.",
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
    execute: async (args) => {
      const entity = asString(args.entity);
      const q = asString(args.query).toLowerCase();
      const limit = Math.min(50, Math.max(1, asNumber(args.limit) ?? 25));

      let rows: unknown[] = [];
      if (entity === "dispatches") {
        rows = await getDispatches(undefined, q || undefined, {
          includeUnpublished: true,
        });
      } else if (entity === "news") {
        rows = (await getNewsItems({ includeUnpublished: true, q })).items;
      } else if (entity === "hackathons") {
        rows = (
          await getHackathons({
            includeUnpublished: true,
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
    execute: async (args) => {
      const entity = asString(args.entity);
      const key = asString(args.id_or_slug).trim();
      if (!key) throw new Error("Provide id_or_slug.");

      if (entity === "dispatch") {
        const all = await getDispatches(undefined, undefined, { includeUnpublished: true });
        const found = all.find((d) => d.id === key || d.slug === key || d.issue_number === key);
        if (!found) throw new Error(`Dispatch "${key}" not found.`);
        return { entity, item: found };
      }
      if (entity === "news") {
        const { items } = await getNewsItems({ includeUnpublished: true });
        const found = items.find((n) => n.id === key || n.url_hash === key);
        if (!found) throw new Error(`News item "${key}" not found.`);
        return { entity, item: found };
      }
      if (entity === "hackathon") {
        const { items } = await getHackathons({ includeUnpublished: true, includeExpired: true });
        const found = items.find((h) => h.id === key || h.slug === key);
        if (!found) throw new Error(`Hackathon "${key}" not found.`);
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
      "Bulk delete old/expired posts (expired hackathons or old news/dispatches older than N days). Useful for cleaning stale items.",
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
      },
      required: ["entity"],
    },
    execute: async (args) => {
      const entity = asString(args.entity, "hackathons");
      const days = asNumber(args.older_than_days) ?? 0;
      const includePinned = asBoolean(args.include_pinned) ?? false;
      const nowMs = Date.now();
      const cutoffMs = nowMs - Math.max(0, days) * 24 * 3600 * 1000;

      let removedHackathons = 0;
      let removedNews = 0;

      if (entity === "hackathons" || entity === "all") {
        const { items } = await getHackathons({
          includeExpired: true,
          includeUnpublished: true,
        });
        for (const h of items) {
          const deadlineMs = new Date(h.deadline_at).getTime();
          if (deadlineMs < (days > 0 ? cutoffMs : nowMs)) {
            if (await deleteHackathon(h.id)) removedHackathons++;
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
            if (await deleteNewsItem(n.id)) removedNews++;
          }
        }
      }

      return { removedHackathons, removedNews };
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
            can_delete_posts: { type: "boolean" },
            can_manage_labs: { type: "boolean" },
            can_manage_inquiries: { type: "boolean" },
            can_manage_orbit_and_subscribers: { type: "boolean" },
            can_trigger_ingestion: { type: "boolean" },
            can_web_research: { type: "boolean" },
            can_manage_media: { type: "boolean" },
            community_hackathons_require_approval: { type: "boolean" },
            mcp_enabled: { type: "boolean" },
            mcp_inherit_ai_permissions: { type: "boolean" },
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
    return { ok: false, error: perm.reason || "Permission denied." };
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
    const errMsg = error instanceof Error ? error.message : String(error);
    await appendAuditLog({
      actor_type: actor.actorType,
      actor_label: actor.actorLabel,
      action: name,
      entity_type: "error",
      summary: `${name} failed: ${errMsg.slice(0, 140)}`,
      status: "error",
    });
    return { ok: false, error: errMsg };
  }
}

export function getGeminiFunctionDeclarations(): FunctionDeclaration[] {
  return OPS_TOOLS.filter((t) => t.requiredPermission !== "admin_only").map((t) => ({
    name: t.name,
    description: t.description,
    parametersJsonSchema: t.inputSchema,
  }));
}
