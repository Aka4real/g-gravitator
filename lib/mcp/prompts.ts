import {
  getClientInquiries,
  getDispatches,
  getHackathons,
  getLabProjects,
} from "@/lib/db/repository";
import {
  checkMcpScopeRequirement,
  resolveEffectiveMcpContext,
  type OpsActorContext,
} from "@/lib/mcp/permissions";
import { readMcpResource } from "@/lib/mcp/resources";
import type { AiPermissionsPolicy, McpScopeKey } from "@/lib/supabase/types";

export interface McpPromptArgument {
  name: string;
  description: string;
  required?: boolean;
}

export interface McpPromptDescriptor {
  name: string;
  title: string;
  description: string;
  arguments: McpPromptArgument[];
}

interface ScopedPromptDefinition extends McpPromptDescriptor {
  requiredScopes: McpScopeKey[];
  buildMessages: (
    args: Record<string, string>,
    actor: OpsActorContext,
    policy: AiPermissionsPolicy
  ) => Promise<
    Array<{
      role: "user" | "assistant";
      content:
        | { type: "text"; text: string }
        | { type: "resource"; resource: { uri: string; mimeType: string; text: string } };
    }>
  >;
}

const PROMPT_CATALOG: ScopedPromptDefinition[] = [
  {
    name: "draft-journal-dispatch",
    title: "Draft Flagship Journal Dispatch",
    description:
      "Research a topic, generate a bespoke cover visual, follow Kinetic Luxury editorial standards, and create a structured Dispatch.",
    requiredScopes: ["can_read_public_content", "can_create_journal"],
    arguments: [
      { name: "topic", description: "Technical subject or thesis for the Dispatch", required: true },
      {
        name: "category",
        description: "ARCHITECTURE | POST-MORTEM | AI SYSTEMS | HACKATHON LOG | DESIGN ENGINEERING",
        required: false,
      },
      { name: "source_url", description: "Optional primary paper/repo/article URL to inspect first", required: false },
    ],
    buildMessages: async (args, actor, policy) => {
      const topic = args.topic?.trim() || "Applied Multi-Agent Systems";
      const category = args.category?.trim() || "AI SYSTEMS";
      const sourceUrl = args.source_url?.trim();
      const [guideRes, existing] = await Promise.all([
        readMcpResource("ggravitator://brand/editorial-guide", actor, policy),
        getDispatches(undefined, undefined, { includeUnpublished: true }),
      ]);
      const recentTitles = existing
        .slice(0, 8)
        .map((d) => `- Issue ${d.issue_number}: ${d.title} (${d.category})`)
        .join("\n");

      const messages: Array<{
        role: "user" | "assistant";
        content:
          | { type: "text"; text: string }
          | { type: "resource"; resource: { uri: string; mimeType: string; text: string } };
      }> = [];

      if (guideRes.ok && guideRes.contents?.[0]) {
        messages.push({
          role: "user",
          content: { type: "resource", resource: guideRes.contents[0] },
        });
      }

      messages.push({
        role: "user",
        content: {
          type: "text",
          text: `Draft a G-Gravitator Lab Dispatch on: "${topic}" (target category: ${category}).
${sourceUrl ? `First inspect the primary URL via \`fetch_webpage\`: ${sourceUrl}\n` : ""}
Recent Dispatches (avoid duplicating angles):
${recentTitles || "(none)"}

Execution Checklist:
1. Gather verified facts and references with \`web_research\`${sourceUrl ? " and `fetch_webpage`" : ""}.
2. Generate cover artwork via \`generate_post_image\` (obsidian dark canvas + accent color) or pick from \`list_content({ entity: "media" })\`.
3. Write rich MDX using \`##\` sections, concrete engineering depth, at least one \`> [!ACCENT]\` callout, and verified \`featured_links\`.
4. Submit via \`create_dispatch\`, then validate quality with \`audit_post_readiness\`.`,
        },
      });

      return messages;
    },
  },
  {
    name: "scout-weekly-hackathons",
    title: "Scout & Curate AI Hackathons",
    description:
      "Trigger ingestion, research high-signal sprints online, dedupe against active radar listings, and add new hackathons.",
    requiredScopes: ["can_read_public_content", "can_create_hackathons"],
    arguments: [
      { name: "themes", description: "Focus themes e.g. 'Agents, Multimodal, Open Source'", required: false },
      { name: "min_prize_usd", description: "Minimum prize pool USD filter", required: false },
    ],
    buildMessages: async (args) => {
      const themes = args.themes?.trim() || "Agents, Applied AI, Open Source";
      const minPrize = args.min_prize_usd?.trim() || "10000";
      const { items } = await getHackathons({ includeUnpublished: true, includeExpired: false });
      const activeList = items
        .slice(0, 15)
        .map((h) => `- ${h.title} (${h.organizer}) · ${h.prize_display} · deadline ${h.deadline_at.slice(0, 10)}`)
        .join("\n");

      return [
        {
          role: "user",
          content: {
            type: "text",
            text: `Scout upcoming high-signal AI hackathons matching themes "${themes}" (target prize >= $${minPrize}).

Currently indexed active hackathons (do not duplicate):
${activeList || "(none)"}

Workflow:
1. Check \`get_ingestion_health\` for backlog and expired events.
2. Optionally run \`run_hackathon_ingestion\` if permitted, plus \`web_research\` for upcoming Devpost / DoraHacks / Cerebral Valley / Lablab / ETHGlobal sprints.
3. Verify each candidate's registration URL with \`fetch_webpage\` to confirm future deadline_at in UTC.
4. Create qualified events using \`create_hackathon\` (set \`oxakalabs_status: "SCOUTING"\` on high-fit sprints).`,
          },
        },
      ];
    },
  },
  {
    name: "review-pending-queue",
    title: "QA & Moderate Pending Review Queue",
    description:
      "Inspect all pending community hackathons and AI drafts, run readiness audits, and prepare approve/reject actions.",
    requiredScopes: ["can_read_drafts_and_pending"],
    arguments: [],
    buildMessages: async (_args, actor, policy) => {
      const pendingRes = await readMcpResource("ggravitator://pending-reviews", actor, policy);
      const messages: Array<{
        role: "user" | "assistant";
        content:
          | { type: "text"; text: string }
          | { type: "resource"; resource: { uri: string; mimeType: string; text: string } };
      }> = [];
      if (pendingRes.ok && pendingRes.contents?.[0]) {
        messages.push({
          role: "user",
          content: { type: "resource", resource: pendingRes.contents[0] },
        });
      }
      messages.push({
        role: "user",
        content: {
          type: "text",
          text: `Review every item in the Pending Review Queue above:
1. Run \`audit_post_readiness\` on each pending item.
2. Flag spam, broken URLs, expired hackathon deadlines, or weak editorial prose.
3. Recommend clear APPROVE / EDIT / REJECT decisions (and execute them directly via \`approve_content\` / \`bulk_moderate_content\` / \`reject_content\` if this token holds moderation scopes).`,
        },
      });
      return messages;
    },
  },
  {
    name: "lab-graduation-audit",
    title: "OXAKALABS 25-Pt Graduation Audit",
    description:
      "Evaluate a Skunkworks prototype or Lab Drop on the 25-point OXAKALABS Graduation Scorecard (>= 20/25 promotes to Labs).",
    requiredScopes: ["can_read_public_content"],
    arguments: [
      { name: "project_code", description: "Project code or slug (e.g. G-01 or OXA-01)", required: true },
    ],
    buildMessages: async (args, actor, policy) => {
      const code = args.project_code?.trim() || "G-01";
      const labs = await getLabProjects();
      const target = labs.find(
        (p) => p.code.toLowerCase() === code.toLowerCase() || p.slug === code
      );
      const labRes = target
        ? await readMcpResource(`ggravitator://labs/${encodeURIComponent(target.code)}`, actor, policy)
        : null;

      const messages: Array<{
        role: "user" | "assistant";
        content:
          | { type: "text"; text: string }
          | { type: "resource"; resource: { uri: string; mimeType: string; text: string } };
      }> = [];

      if (labRes?.ok && labRes.contents?.[0]) {
        messages.push({
          role: "user",
          content: { type: "resource", resource: labRes.contents[0] },
        });
      }

      messages.push({
        role: "user",
        content: {
          type: "text",
          text: `Evaluate project "${code}" against the 25-Point OXAKALABS Graduation Scorecard:
- \`pain_intensity\` (1-5): Severity and urgency of the workflow bottleneck solved.
- \`willingness_to_pay\` (1-5): Evidence that technical buyers or teams pay to eliminate this pain.
- \`technical_moat\` (1-5): Defensibility in orchestration, UX physics, or proprietary telemetry.
- \`distribution_hook\` (1-5): Organic OSS, MCP, benchmark, or build-in-public pull.
- \`lean_maintainability\` (1-5): Ability for a small high-leverage team to operate reliably.

Thresholds: 20-25 = Promote to G-Gravitator Labs (\`promote_to_labs\`); 14-19 = Open-Source / Case Study; < 14 = Post-Mortem Dispatch & Archive.
Save updated scores with \`update_lab_scorecard\`.`,
        },
      });
      return messages;
    },
  },
  {
    name: "triage-b2b-inquiries",
    title: "Triage B2B Systems Inquiries",
    description:
      "Scope incoming Gravity Audit / Velocity MVP client briefs, identify stack risks, and recommend pipeline updates (requires PII scope).",
    requiredScopes: ["can_read_inquiries_pii", "can_manage_inquiries"],
    arguments: [
      { name: "status", description: "Pipeline status filter (default NEW)", required: false },
    ],
    buildMessages: async (args) => {
      const status = (args.status || "NEW").toUpperCase();
      const all = await getClientInquiries();
      const filtered = status === "ALL" ? all : all.filter((i) => i.status === status);
      return [
        {
          role: "user",
          content: {
            type: "text",
            text: `Triage these G-Gravitator Systems B2B inquiries (status=${status}):

${JSON.stringify(filtered, null, 2)}

For each inquiry:
1. Validate tier fit (\`GRAVITY_AUDIT\` vs \`VELOCITY_MVP\` vs \`LAB_RETAINER\` vs \`CUSTOM\`).
2. Identify technical unknowns and 3 discovery call questions.
3. Recommend next status (\`REVIEWED\`, \`DISCOVERY_CALL\`, \`ARCHIVED\`) and update via \`update_inquiry_status\` if appropriate.`,
          },
        },
      ];
    },
  },
  {
    name: "daily-ops-briefing",
    title: "Daily Executive Ops Briefing",
    description:
      "Synthesize live system overview, pending backlog, expired hackathons, and missing covers into a tight founder briefing.",
    requiredScopes: ["can_read_public_content"],
    arguments: [],
    buildMessages: async (_args, actor, policy) => {
      const [overviewRes, healthRes] = await Promise.all([
        readMcpResource("ggravitator://overview", actor, policy),
        readMcpResource("ggravitator://ingestion/health", actor, policy),
      ]);
      const messages: Array<{
        role: "user" | "assistant";
        content:
          | { type: "text"; text: string }
          | { type: "resource"; resource: { uri: string; mimeType: string; text: string } };
      }> = [];
      if (overviewRes.ok && overviewRes.contents?.[0]) {
        messages.push({ role: "user", content: { type: "resource", resource: overviewRes.contents[0] } });
      }
      if (healthRes.ok && healthRes.contents?.[0]) {
        messages.push({ role: "user", content: { type: "resource", resource: healthRes.contents[0] } });
      }
      messages.push({
        role: "user",
        content: {
          type: "text",
          text: `Deliver a crisp executive operations brief covering:
1. Content velocity & live coverage (Journal, Orbital Wire, Hackathons, Labs).
2. Action items requiring attention (pending review items, expired hackathons to purge, dispatches missing covers).
3. Top 2 highest-leverage next actions I can approve right now.`,
        },
      });
      return messages;
    },
  },
];

export function listMcpPrompts(
  actor: OpsActorContext,
  policy: AiPermissionsPolicy
): McpPromptDescriptor[] {
  const ctx = resolveEffectiveMcpContext(actor, policy);
  if (!ctx.enabled || !ctx.ceilings.mcp_expose_prompts) return [];

  return PROMPT_CATALOG.filter((p) =>
    p.requiredScopes.every((scope) => ctx.scopes[scope])
  ).map(({ requiredScopes: _omit1, buildMessages: _omit2, ...descriptor }) => {
    void _omit1;
    void _omit2;
    return descriptor;
  });
}

export async function getMcpPrompt(
  name: string,
  args: Record<string, string>,
  actor: OpsActorContext,
  policy: AiPermissionsPolicy
): Promise<{
  ok: boolean;
  denied?: boolean;
  notFound?: boolean;
  error?: string;
  description?: string;
  messages?: Awaited<ReturnType<ScopedPromptDefinition["buildMessages"]>>;
}> {
  const ctx = resolveEffectiveMcpContext(actor, policy);
  if (!ctx.enabled) {
    return { ok: false, denied: true, error: "External MCP server is disabled." };
  }
  if (!ctx.ceilings.mcp_expose_prompts) {
    return {
      ok: false,
      denied: true,
      error: "MCP Prompts surface is disabled in Admin AI Governance settings.",
    };
  }

  const prompt = PROMPT_CATALOG.find((p) => p.name === name);
  if (!prompt) {
    return { ok: false, notFound: true, error: `Unknown prompt "${name}".` };
  }

  for (const scope of prompt.requiredScopes) {
    const check = checkMcpScopeRequirement(scope, actor, policy);
    if (!check.allowed) {
      return { ok: false, denied: true, error: check.reason };
    }
  }

  const messages = await prompt.buildMessages(args, actor, policy);
  return {
    ok: true,
    description: prompt.description,
    messages,
  };
}
