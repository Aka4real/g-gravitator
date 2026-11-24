import {
  getAiPermissions,
  getAuditLogs,
  getClientInquiries,
  getDispatches,
  getHackathons,
  getLabProjects,
  getNewsItems,
  getNewsletterSubscribers,
  getOrbitApplications,
  listMediaAssets,
} from "@/lib/db/repository";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  checkMcpEntityPrivacy,
  checkMcpScopeRequirement,
  resolveEffectiveMcpContext,
  type OpsActorContext,
} from "@/lib/mcp/permissions";
import type { AiPermissionsPolicy, McpScopeKey } from "@/lib/supabase/types";

export interface McpResourceDescriptor {
  uri: string;
  name: string;
  title?: string;
  description: string;
  mimeType: string;
  annotations?: {
    audience?: ("user" | "assistant")[];
    priority?: number;
  };
}

export interface McpResourceTemplateDescriptor {
  uriTemplate: string;
  name: string;
  title?: string;
  description: string;
  mimeType: string;
  annotations?: {
    audience?: ("user" | "assistant")[];
    priority?: number;
  };
}

const EDITORIAL_GUIDE_MARKDOWN = `# G-Gravitator — Kinetic Luxury Editorial & Design Specification

## Identity & Tone
- **Brand:** G-Gravitator (Applied AI Engineering Foundry & Product Studio) · **R&D Strike Arm:** OXAKALABS
- **Voice:** Crisp, technically dense, systems-engineering prose. Zero fluff, zero clickbait, zero generic AI hype ("revolutionize", "game-changer"). Lead with architecture, concrete numbers, failure modes, and build tradeoffs.

## Visual & Token Spec (85/15 Kinetic Obsidian)
- **Primary Canvas:** Obsidian \`#08080A\` / Surface luminance step-ups \`#111114\` → \`#18181D\`
- **Structural Lines:** \`1px solid rgba(255,255,255,0.08)\` Brushed Tungsten dividers
- **Canonical Accent Palette:**
  - **Ion Signal Vermilion (Primary):** \`#FF3B1F\`
  - **Terminal Emerald (Live / Approved):** \`#10B981\`
  - **Telemetry Amber (Deadline / Warning):** \`#F59E0B\`
  - **Electric Violet / Sky (Research):** \`#38BDF8\` / \`#818CF8\`
- **Preferred Post Layouts (\`design\`):**
  - \`hero_layout\`: \`"editorial" | "split" | "fullbleed" | "minimal"\`
  - \`callout_style\`: \`"left-bar" | "glass-card" | "tinted-banner"\`

## Journal Dispatch MDX Formatting Rules
1. Start sections with clean \`## Heading\` blocks (avoid skipping straight to \`####\`).
2. Include at least one accented insight block using \`> [!ACCENT] ...\` syntax.
3. Embed custom cover visuals generated via \`generate_post_image\` (hosted at \`/api/media/<id>\`).
4. Always attach verified primary links in \`featured_links\` / \`related_links\`.
5. Keep category within: \`ARCHITECTURE | POST-MORTEM | AI SYSTEMS | HACKATHON LOG | DESIGN ENGINEERING\`.
`;

interface ScopedStaticResource extends McpResourceDescriptor {
  requiredScope: McpScopeKey | null;
}

interface ScopedResourceTemplate extends McpResourceTemplateDescriptor {
  requiredScope: McpScopeKey | null;
}

const STATIC_RESOURCES: ScopedStaticResource[] = [
  {
    uri: "ggravitator://overview",
    name: "system-overview",
    title: "System Overview",
    description: "Live G-Gravitator counts across Journal, Orbital Wire, Hackathons, Labs, and CRM.",
    mimeType: "application/json",
    requiredScope: "can_read_public_content",
    annotations: { audience: ["assistant", "user"], priority: 0.9 },
  },
  {
    uri: "ggravitator://permissions/effective",
    name: "effective-permissions",
    title: "Effective MCP Permissions",
    description: "Resolved capability scopes, preset metadata, and global security ceilings for this token.",
    mimeType: "application/json",
    requiredScope: null,
    annotations: { audience: ["assistant"], priority: 1.0 },
  },
  {
    uri: "ggravitator://brand/editorial-guide",
    name: "editorial-guide",
    title: "Kinetic Luxury Editorial Guide",
    description: "Voice, visual hex tokens, MDX callout formatting, and Dispatch structure rules.",
    mimeType: "text/markdown",
    requiredScope: "can_read_public_content",
    annotations: { audience: ["assistant"], priority: 0.85 },
  },
  {
    uri: "ggravitator://labs/catalog",
    name: "labs-catalog",
    title: "Labs & Skunkworks Catalog",
    description: "Complete G-01..G-04 Labs Drops and OXAKALABS Skunkworks prototypes with 25-pt scorecards.",
    mimeType: "application/json",
    requiredScope: "can_read_public_content",
    annotations: { audience: ["assistant", "user"], priority: 0.8 },
  },
  {
    uri: "ggravitator://pending-reviews",
    name: "pending-reviews",
    title: "Pending Review Queue",
    description: "Unpublished community hackathons and AI/MCP drafts awaiting approval.",
    mimeType: "application/json",
    requiredScope: "can_read_drafts_and_pending",
    annotations: { audience: ["assistant"], priority: 0.9 },
  },
  {
    uri: "ggravitator://ingestion/health",
    name: "ingestion-health",
    title: "Ingestion & Quality Diagnostics",
    description: "Expired hackathon counts, missing covers, backlog counts, and integration health.",
    mimeType: "application/json",
    requiredScope: "can_read_drafts_and_pending",
    annotations: { audience: ["assistant"], priority: 0.75 },
  },
];

const RESOURCE_TEMPLATES: ScopedResourceTemplate[] = [
  {
    uriTemplate: "ggravitator://dispatches/{slug}",
    name: "dispatch-by-slug",
    title: "Dispatch Article (MDX)",
    description: "Read full Markdown/MDX article and design metadata for a specific Journal Dispatch slug or issue number.",
    mimeType: "text/markdown",
    requiredScope: "can_read_public_content",
  },
  {
    uriTemplate: "ggravitator://hackathons/{slug}",
    name: "hackathon-by-slug",
    title: "Hackathon Listing",
    description: "Read full Hackathon record, sources, deadlines, and OXAKALABS status by slug or ID.",
    mimeType: "application/json",
    requiredScope: "can_read_public_content",
  },
  {
    uriTemplate: "ggravitator://labs/{code}",
    name: "lab-by-code",
    title: "Lab Drop / Skunkworks Project",
    description: "Read a single Labs/Skunkworks project by code (e.g. G-01) or slug, including architecture notes & changelog.",
    mimeType: "application/json",
    requiredScope: "can_read_public_content",
  },
  {
    uriTemplate: "ggravitator://inquiries/{status}",
    name: "inquiries-by-status",
    title: "B2B Inquiries by Pipeline Status",
    description: "Read B2B inquiries filtered by NEW, REVIEWED, DISCOVERY_CALL, CLOSED_WON, ARCHIVED, or ALL (PII gated).",
    mimeType: "application/json",
    requiredScope: "can_read_inquiries_pii",
  },
  {
    uriTemplate: "ggravitator://audit/{actor_type}",
    name: "audit-by-actor",
    title: "Audit Log Stream",
    description: "Read recent audit events filtered by all, admin, ai_assistant, or mcp.",
    mimeType: "application/json",
    requiredScope: "can_read_audit_logs",
  },
];

export function listMcpResources(
  actor: OpsActorContext,
  policy: AiPermissionsPolicy
): McpResourceDescriptor[] {
  const ctx = resolveEffectiveMcpContext(actor, policy);
  if (!ctx.enabled || !ctx.ceilings.mcp_expose_resources) return [];

  return STATIC_RESOURCES.filter(
    (r) => r.requiredScope === null || ctx.scopes[r.requiredScope]
  ).map(({ requiredScope: _omit, ...rest }) => {
    void _omit;
    return rest;
  });
}

export function listMcpResourceTemplates(
  actor: OpsActorContext,
  policy: AiPermissionsPolicy
): McpResourceTemplateDescriptor[] {
  const ctx = resolveEffectiveMcpContext(actor, policy);
  if (!ctx.enabled || !ctx.ceilings.mcp_expose_resources) return [];

  return RESOURCE_TEMPLATES.filter(
    (t) => t.requiredScope === null || ctx.scopes[t.requiredScope]
  ).map(({ requiredScope: _omit, ...rest }) => {
    void _omit;
    return rest;
  });
}

export async function readMcpResource(
  uri: string,
  actor: OpsActorContext,
  policy: AiPermissionsPolicy
): Promise<{
  ok: boolean;
  denied?: boolean;
  notFound?: boolean;
  error?: string;
  contents?: Array<{ uri: string; mimeType: string; text: string }>;
}> {
  const ctx = resolveEffectiveMcpContext(actor, policy);
  if (!ctx.enabled) {
    return { ok: false, denied: true, error: "External MCP server is disabled." };
  }
  if (!ctx.ceilings.mcp_expose_resources) {
    return {
      ok: false,
      denied: true,
      error: "MCP Resources surface is disabled in Admin AI Governance settings.",
    };
  }

  const trimmedUri = uri.trim();

  if (trimmedUri === "ggravitator://permissions/effective") {
    return {
      ok: true,
      contents: [
        {
          uri: trimmedUri,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              actor_label: actor.actorLabel,
              permissions_mode: ctx.effectiveMode,
              role_preset: ctx.rolePreset,
              downgraded_from_full: ctx.downgradedFromFull,
              ceilings: ctx.ceilings,
              scopes: ctx.scopes,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (trimmedUri === "ggravitator://brand/editorial-guide") {
    const check = checkMcpScopeRequirement("can_read_public_content", actor, policy);
    if (!check.allowed) return { ok: false, denied: true, error: check.reason };
    return {
      ok: true,
      contents: [
        {
          uri: trimmedUri,
          mimeType: "text/markdown",
          text: EDITORIAL_GUIDE_MARKDOWN,
        },
      ],
    };
  }

  if (trimmedUri === "ggravitator://overview") {
    const check = checkMcpScopeRequirement("can_read_public_content", actor, policy);
    if (!check.allowed) return { ok: false, denied: true, error: check.reason };
    const [
      dispatches,
      { items: news },
      { items: hackathons },
      labs,
      inquiries,
      orbit,
      subscribers,
      media,
    ] = await Promise.all([
      getDispatches(undefined, undefined, { includeUnpublished: true }),
      getNewsItems({ includeUnpublished: true }),
      getHackathons({ includeUnpublished: true, includeExpired: true }),
      getLabProjects(),
      getClientInquiries(),
      getOrbitApplications(),
      getNewsletterSubscribers(),
      listMediaAssets(),
    ]);
    return {
      ok: true,
      contents: [
        {
          uri: trimmedUri,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              counts: {
                dispatches_total: dispatches.length,
                dispatches_published: dispatches.filter((d) => d.is_published !== false).length,
                news_total: news.length,
                hackathons_total: hackathons.length,
                labs_projects: labs.length,
                inquiries: inquiries.length,
                orbit_applications: orbit.length,
                newsletter_subscribers: subscribers.length,
                media_assets: media.length,
              },
              effective_scopes: ctx.scopes,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (trimmedUri === "ggravitator://labs/catalog") {
    const check = checkMcpScopeRequirement("can_read_public_content", actor, policy);
    if (!check.allowed) return { ok: false, denied: true, error: check.reason };
    const labs = await getLabProjects();
    return {
      ok: true,
      contents: [
        {
          uri: trimmedUri,
          mimeType: "application/json",
          text: JSON.stringify({ count: labs.length, projects: labs }, null, 2),
        },
      ],
    };
  }

  if (trimmedUri === "ggravitator://pending-reviews") {
    const check = checkMcpScopeRequirement("can_read_drafts_and_pending", actor, policy);
    if (!check.allowed) return { ok: false, denied: true, error: check.reason };
    const [dispatches, { items: news }, { items: hackathons }] = await Promise.all([
      getDispatches(undefined, undefined, { includeUnpublished: true }),
      getNewsItems({ includeUnpublished: true }),
      getHackathons({ includeUnpublished: true, includeExpired: true }),
    ]);
    return {
      ok: true,
      contents: [
        {
          uri: trimmedUri,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              pending_hackathons: hackathons.filter((h) => !h.is_published),
              pending_dispatches: dispatches.filter((d) => d.is_published === false),
              pending_news: news.filter((n) => !n.is_published),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (trimmedUri === "ggravitator://ingestion/health") {
    const check = checkMcpScopeRequirement("can_read_drafts_and_pending", actor, policy);
    if (!check.allowed) return { ok: false, denied: true, error: check.reason };
    const [dispatches, { items: news }, { items: hackathons }] = await Promise.all([
      getDispatches(undefined, undefined, { includeUnpublished: true }),
      getNewsItems({ includeUnpublished: true }),
      getHackathons({ includeUnpublished: true, includeExpired: true }),
    ]);
    const nowMs = Date.now();
    return {
      ok: true,
      contents: [
        {
          uri: trimmedUri,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              checked_at: new Date().toISOString(),
              gemini_configured: isGeminiConfigured(),
              supabase_configured: isSupabaseConfigured(),
              expired_hackathons: hackathons.filter(
                (h) => new Date(h.deadline_at).getTime() < nowMs
              ).length,
              pending_hackathons: hackathons.filter((h) => !h.is_published).length,
              pending_dispatches: dispatches.filter((d) => d.is_published === false).length,
              pending_news: news.filter((n) => !n.is_published).length,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  // Template: ggravitator://dispatches/{slug}
  if (trimmedUri.startsWith("ggravitator://dispatches/")) {
    const check = checkMcpScopeRequirement("can_read_public_content", actor, policy);
    if (!check.allowed) return { ok: false, denied: true, error: check.reason };
    const key = decodeURIComponent(trimmedUri.slice("ggravitator://dispatches/".length));
    const all = await getDispatches(undefined, undefined, { includeUnpublished: true });
    const found = all.find((d) => d.slug === key || d.id === key || d.issue_number === key);
    if (!found) return { ok: false, notFound: true, error: `Dispatch "${key}" not found.` };
    if (found.is_published === false && !ctx.scopes.can_read_drafts_and_pending) {
      return {
        ok: false,
        denied: true,
        error: `Dispatch "${key}" is unpublished and token lacks scope "can_read_drafts_and_pending".`,
      };
    }
    const markdown = `---
id: ${found.id}
issue_number: ${found.issue_number}
slug: ${found.slug}
category: ${found.category}
is_published: ${found.is_published !== false}
approval_status: ${found.approval_status ?? "APPROVED"}
tags: [${found.tags.join(", ")}]
---

# ${found.title}

> ${found.subtitle}

${found.mdx_content}
`;
    return {
      ok: true,
      contents: [{ uri: trimmedUri, mimeType: "text/markdown", text: markdown }],
    };
  }

  // Template: ggravitator://hackathons/{slug}
  if (trimmedUri.startsWith("ggravitator://hackathons/")) {
    const check = checkMcpScopeRequirement("can_read_public_content", actor, policy);
    if (!check.allowed) return { ok: false, denied: true, error: check.reason };
    const key = decodeURIComponent(trimmedUri.slice("ggravitator://hackathons/".length));
    const { items } = await getHackathons({ includeUnpublished: true, includeExpired: true });
    const found = items.find((h) => h.slug === key || h.id === key);
    if (!found) return { ok: false, notFound: true, error: `Hackathon "${key}" not found.` };
    if (!found.is_published && !ctx.scopes.can_read_drafts_and_pending) {
      return {
        ok: false,
        denied: true,
        error: `Hackathon "${key}" is unpublished and token lacks scope "can_read_drafts_and_pending".`,
      };
    }
    return {
      ok: true,
      contents: [
        { uri: trimmedUri, mimeType: "application/json", text: JSON.stringify(found, null, 2) },
      ],
    };
  }

  // Template: ggravitator://labs/{code}
  if (trimmedUri.startsWith("ggravitator://labs/")) {
    const check = checkMcpScopeRequirement("can_read_public_content", actor, policy);
    if (!check.allowed) return { ok: false, denied: true, error: check.reason };
    const key = decodeURIComponent(trimmedUri.slice("ggravitator://labs/".length));
    const labs = await getLabProjects();
    const found = labs.find(
      (p) => p.code.toLowerCase() === key.toLowerCase() || p.slug === key || p.id === key
    );
    if (!found) return { ok: false, notFound: true, error: `Lab project "${key}" not found.` };
    return {
      ok: true,
      contents: [
        { uri: trimmedUri, mimeType: "application/json", text: JSON.stringify(found, null, 2) },
      ],
    };
  }

  // Template: ggravitator://inquiries/{status}
  if (trimmedUri.startsWith("ggravitator://inquiries/")) {
    const check = checkMcpEntityPrivacy("inquiries", actor, policy);
    if (!check.allowed) return { ok: false, denied: true, error: check.reason };
    const statusFilter = decodeURIComponent(
      trimmedUri.slice("ggravitator://inquiries/".length)
    ).toUpperCase();
    const all = await getClientInquiries();
    const filtered =
      statusFilter === "ALL" || !statusFilter
        ? all
        : all.filter((i) => i.status === statusFilter);
    return {
      ok: true,
      contents: [
        {
          uri: trimmedUri,
          mimeType: "application/json",
          text: JSON.stringify({ status: statusFilter || "ALL", items: filtered }, null, 2),
        },
      ],
    };
  }

  // Template: ggravitator://audit/{actor_type}
  if (trimmedUri.startsWith("ggravitator://audit/")) {
    const check = checkMcpScopeRequirement("can_read_audit_logs", actor, policy);
    if (!check.allowed) return { ok: false, denied: true, error: check.reason };
    const actorFilter = decodeURIComponent(
      trimmedUri.slice("ggravitator://audit/".length)
    ).toLowerCase();
    const logs = await getAuditLogs(60);
    const filtered =
      actorFilter === "all" || !actorFilter
        ? logs
        : logs.filter((l) => l.actor_type.toLowerCase() === actorFilter);
    return {
      ok: true,
      contents: [
        {
          uri: trimmedUri,
          mimeType: "application/json",
          text: JSON.stringify({ actor_type: actorFilter || "all", items: filtered }, null, 2),
        },
      ],
    };
  }

  // Preserve current active policy reference so TypeScript doesn't flag unused helper if imported later
  void getAiPermissions;

  return { ok: false, notFound: true, error: `Unknown resource URI: ${trimmedUri}` };
}
