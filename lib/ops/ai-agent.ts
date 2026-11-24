import type { Content, Part } from "@google/genai";
import {
  getAiPermissions,
  getClientInquiries,
  getDispatches,
  getHackathons,
  getLabProjects,
  getNewsItems,
  getNewsletterSubscribers,
  getOrbitApplications,
  listMediaAssets,
} from "@/lib/db/repository";
import {
  buildThinkingConfigForModel,
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_MAX_PERMISSION_SAFETY_SETTINGS,
  getGeminiBetaClient,
  getOrderedGeminiModels,
  isAuthGeminiError,
  isModelFallbackableError,
  isTransientGeminiError,
} from "@/lib/gemini/client";
import {
  executeOpsTool,
  getGeminiFunctionDeclarations,
  type OpsActorContext,
} from "@/lib/ops/tools";

export interface AgentChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ExecutedToolTrace {
  name: string;
  args: Record<string, unknown>;
  ok: boolean;
  summary: string;
}

function summarizeToolResult(
  name: string,
  res: { ok: boolean; data?: Record<string, unknown>; error?: string }
): string {
  if (!res.ok) return res.error || "Failed";
  const d = res.data || {};
  if (typeof d.note === "string") return d.note;
  if (d.deleted) return `Deleted ${String(d.id ?? name)}`;
  if (d.approved) return `Approved ${String(d.entity ?? "")}`;
  if (d.revoked) return `Revoked approval for ${String(d.entity ?? "")}`;
  if (d.rejected) return `Rejected ${String(d.entity ?? "")}`;
  if (typeof d.count === "number") return `Returned ${d.count} items`;
  if (Array.isArray(d.findings)) return `Found ${d.findings.length} research findings`;
  if (d.asset && typeof d.asset === "object") {
    const gen = typeof d.generator === "string" ? ` (${d.generator})` : "";
    return `Stored media ${(d.asset as { url?: string }).url ?? ""}${gen}`;
  }
  if (d.report && typeof d.report === "object") {
    const r = d.report as { inserted?: number; merged?: number; total?: number };
    if (typeof r.inserted === "number") {
      return `Inserted ${r.inserted}${typeof r.merged === "number" ? `, merged ${r.merged}` : ""} (${r.total ?? 0} total)`;
    }
  }
  if (d.dispatch && typeof d.dispatch === "object") {
    return `Saved dispatch "${(d.dispatch as { title?: string }).title ?? ""}"`;
  }
  if (d.newsItem && typeof d.newsItem === "object") {
    return `Saved wire post "${(d.newsItem as { title?: string }).title ?? ""}"`;
  }
  if (d.hackathon && typeof d.hackathon === "object") {
    return `Saved hackathon "${(d.hackathon as { title?: string }).title ?? ""}"`;
  }
  if (d.project && typeof d.project === "object") {
    return `Saved project ${(d.project as { code?: string }).code ?? ""}`;
  }
  if (typeof d.removedHackathons === "number" || typeof d.removedNews === "number") {
    return `Removed ${d.removedHackathons ?? 0} hackathons, ${d.removedNews ?? 0} news`;
  }
  return "Completed";
}

/**
 * Compacts oversized tool payloads before feeding them back to Gemini in multi-step
 * tool loops so context stays lean and latency stays well under serverless limits.
 */
function compactToolOutputForModel(
  toolName: string,
  data: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!data) return {};
  if (toolName === "list_content" && Array.isArray(data.items)) {
    const compactItems = data.items.slice(0, 20).map((item) => {
      if (!item || typeof item !== "object") return item;
      const rec = item as Record<string, unknown>;
      const copy: Record<string, unknown> = { ...rec };
      if (typeof copy.mdx_content === "string" && copy.mdx_content.length > 260) {
        copy.mdx_content = `${copy.mdx_content.slice(0, 260)}... [truncated; use get_post_details for full body]`;
      }
      if (typeof copy.summary === "string" && copy.summary.length > 260) {
        copy.summary = `${copy.summary.slice(0, 260)}...`;
      }
      if (typeof copy.description === "string" && copy.description.length > 260) {
        copy.description = `${copy.description.slice(0, 260)}...`;
      }
      delete copy.data_url;
      return copy;
    });
    return { ...data, items: compactItems };
  }

  if (toolName === "fetch_webpage" && typeof data.excerpt === "string" && data.excerpt.length > 2400) {
    return { ...data, excerpt: `${data.excerpt.slice(0, 2400)}...` };
  }

  const serialized = JSON.stringify(data);
  if (serialized.length <= 14_000) return data;

  return {
    truncated: true,
    preview: serialized.slice(0, 12_000),
    note: "Result compacted for token budget; key identifiers preserved.",
  };
}

/**
 * Converts a markdown operator response into natural, human-sounding speech text
 * free of raw URLs, UUIDs, markdown symbols, code blocks, and snake_case tokens.
 */
export function buildVoiceSummary(markdownText: string): string {
  const plain = markdownText
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\bhttps?:\/\/[^\s)]+/gi, "")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "")
    .replace(/\/api\/media\/[a-zA-Z0-9_-]+/g, "the media library")
    .replace(/\|[-:\s|]+\|/g, " ")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/([a-z])_([a-z])/gi, "$1 $2")
    .replace(/\s*\/\/\s*/g, ", ")
    .replace(/[#>*_`~|]/g, " ")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  if (!plain) return "Done.";
  if (plain.length <= 540) return plain;

  const sentences = plain.split(/(?<=[.!?])\s+/);
  let out = "";
  for (const s of sentences) {
    if (!s.trim()) continue;
    if ((out ? out.length + 1 : 0) + s.length > 520) break;
    out = out ? `${out} ${s}` : s;
  }
  return out || `${plain.slice(0, 510).trimEnd()}...`;
}

async function callGeminiWithFallback(params: {
  ai: NonNullable<ReturnType<typeof getGeminiBetaClient>>;
  preferredModel: string;
  allModels: string[];
  contents: Content[];
  systemInstruction: string;
  declarations?: ReturnType<typeof getGeminiFunctionDeclarations>;
  stepLabel: string;
}) {
  const ordered = [
    params.preferredModel,
    ...params.allModels.filter((m) => m !== params.preferredModel),
  ];

  let lastErr: unknown = null;

  for (const candidateModel of ordered) {
    const thinkingConfig = buildThinkingConfigForModel(candidateModel, "low");
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await params.ai.models.generateContent({
          model: candidateModel,
          contents: params.contents,
          config: {
            abortSignal: AbortSignal.timeout(26_000),
            systemInstruction: params.systemInstruction,
            safetySettings: GEMINI_MAX_PERMISSION_SAFETY_SETTINGS,
            maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
            ...(thinkingConfig ? { thinkingConfig } : {}),
            ...(params.declarations && params.declarations.length > 0
              ? { tools: [{ functionDeclarations: params.declarations }] }
              : {}),
          },
        });
        return { response, modelUsed: candidateModel };
      } catch (err) {
        lastErr = err;
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(
          `[ops:ai-agent] ${candidateModel} (${params.stepLabel}, attempt ${attempt}) failed: ${errMsg.slice(0, 200)}`
        );
        if (isAuthGeminiError(err)) {
          throw new Error("Invalid GEMINI_API_KEY configured on the server.");
        }
        if (isTransientGeminiError(err) && attempt < 2) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        if (isModelFallbackableError(err)) {
          break; // try next fallback model
        }
        throw err;
      }
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error("All Gemini models failed to respond. Please try again.");
}

export async function runAdminAiAssistant(params: {
  messages: AgentChatMessage[];
  actorLabel: string;
}): Promise<{
  reply: string;
  voiceSummary: string;
  toolCalls: ExecutedToolTrace[];
  modelUsed: string;
}> {
  const ai = getGeminiBetaClient();
  if (!ai) {
    throw new Error(
      "GEMINI_API_KEY is not configured on the server. Add GEMINI_API_KEY in your environment settings to activate the AI Operator."
    );
  }

  const [
    policy,
    dispatches,
    { items: news },
    { items: hackathons },
    labs,
    inquiries,
    orbit,
    subscribers,
    media,
  ] = await Promise.all([
    getAiPermissions(),
    getDispatches(undefined, undefined, { includeUnpublished: true }),
    getNewsItems({ includeUnpublished: true }),
    getHackathons({ includeUnpublished: true, includeExpired: true }),
    getLabProjects(),
    getClientInquiries(),
    getOrbitApplications(),
    getNewsletterSubscribers(),
    listMediaAssets(),
  ]);

  if (!policy.ai_enabled) {
    return {
      reply:
        "AI Assistant execution is currently turned off in **AI Permissions & Governance**. Enable **AI Operator Enabled** to let me perform research, curation, and operations.",
      voiceSummary:
        "AI Assistant execution is currently disabled in AI Permissions. Enable AI Operator to continue.",
      toolCalls: [],
      modelUsed: "policy-gate",
    };
  }

  const nowIso = new Date().toISOString();
  const pendingHacks = hackathons
    .filter((h) => !h.is_published)
    .slice(0, 8)
    .map((h) => `${h.id} ("${h.title}", by ${h.created_by ?? "ingestion"})`);
  const pendingDispatches = dispatches
    .filter((d) => d.is_published === false)
    .slice(0, 8)
    .map((d) => `${d.id} ("${d.title}", by ${d.created_by ?? "admin"})`);
  const pendingNews = news
    .filter((n) => !n.is_published)
    .slice(0, 8)
    .map((n) => `${n.id} ("${n.title}")`);

  const systemInstruction = `You are the G-Gravitator Executive AI Operator inside the private /gg-command Command Center.
You respond cleanly and decisively to both written instructions and natural human voice commands from the Admin ("${params.actorLabel}").

Current Date/Time (UTC): ${nowIso}

Current Live System Snapshot:
- Dispatches: ${dispatches.length} total (${pendingDispatches.length} pending review: ${pendingDispatches.join("; ") || "none"})
- Orbital Wire News: ${news.length} total (${pendingNews.length} pending review: ${pendingNews.join("; ") || "none"})
- Hackathons: ${hackathons.length} total (${pendingHacks.length} pending review: ${pendingHacks.join("; ") || "none"})
- Labs & Skunkworks Projects: ${labs.length} total (${labs.map((p) => `${p.code} ${p.name}`).join(", ") || "none"})
- B2B Inquiries: ${inquiries.length} total | Orbit Applications: ${orbit.length} | Subscribers: ${subscribers.length} | Media Assets: ${media.length}
- Active AI Permissions Policy:
  - direct_publish: journal=${policy.can_publish_directly_journal}, news=${policy.can_publish_directly_news}, hackathons=${policy.can_publish_directly_hackathons}
  - can_create_posts=${policy.can_create_posts}, can_edit_posts=${policy.can_edit_posts}, can_approve_posts=${policy.can_approve_posts}, can_revoke_approval=${policy.can_revoke_approval}, can_delete_posts=${policy.can_delete_posts}
  - can_manage_labs=${policy.can_manage_labs}, can_manage_inquiries=${policy.can_manage_inquiries}, can_manage_orbit_and_subscribers=${policy.can_manage_orbit_and_subscribers}
  - can_trigger_ingestion=${policy.can_trigger_ingestion}, can_web_research=${policy.can_web_research}, can_manage_media=${policy.can_manage_media}

Operational Rules:
1. Execute real tasks immediately using your tools whenever the Admin asks (research topics online, inspect URLs, generate/import cover images, design and create/edit Journal Dispatches, Orbital Wire News, or Hackathons, approve/revoke/reject reviews, clean stale posts, manage Labs/Inquiries/Orbit/Subscribers, or trigger live ingestion).
2. Always use the current UTC date (${nowIso.slice(0, 10)}) when computing hackathon deadlines, relative dates ("next week", "this month"), or news recency.
3. When creating a rich post: call \`web_research\` (and optionally \`generate_post_image\` in parallel) first when current facts, links, or visuals are helpful, then pass the real \`/api/media/...\` image URL, markdown callouts (\`> [!ACCENT] ...\`), real verified links, and clean \`design\` settings into \`create_dispatch\`, \`create_news_item\`, or \`create_hackathon\`.
4. To inspect a specific item before editing, use \`get_post_details\`. Do not invent IDs—look them up via \`list_content\` or \`list_pending_reviews\` if not already shown above.
5. Respect permissions transparently: if direct publish is false for a channel, report clearly that the post was saved to Pending Review for Admin approval. If any tool returns a permission error, explain which toggle to enable without claiming success.
6. Keep your final reply crisp, direct, and natural—avoid dumping raw JSON or long UUIDs so it reads cleanly and sounds great when spoken aloud.`;

  const contents: Content[] = params.messages.slice(-16).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const declarations = getGeminiFunctionDeclarations();
  const actor: OpsActorContext = {
    actorType: "ai_assistant",
    actorLabel: `AI Operator (${params.actorLabel})`,
  };

  const models = getOrderedGeminiModels();
  const toolTrace: ExecutedToolTrace[] = [];
  let activeModel = models[0];
  const maxSteps = 8;

  for (let step = 0; step < maxSteps; step++) {
    const { response, modelUsed } = await callGeminiWithFallback({
      ai,
      preferredModel: activeModel,
      allModels: models,
      contents,
      systemInstruction,
      declarations,
      stepLabel: `step-${step}`,
    });
    activeModel = modelUsed;

    const modelContent = response.candidates?.[0]?.content;
    const calls = response.functionCalls;

    if (!calls || calls.length === 0) {
      const reply =
        response.text?.trim() ||
        (toolTrace.length > 0
          ? `Completed ${toolTrace.length} operation(s): ${toolTrace.map((t) => `${t.name} (${t.summary})`).join("; ")}.`
          : "Ready for your command.");
      return {
        reply,
        voiceSummary: buildVoiceSummary(reply),
        toolCalls: toolTrace,
        modelUsed: activeModel,
      };
    }

    // Preserve the exact model content turn (including thought & thoughtSignature parts)
    if (modelContent && Array.isArray(modelContent.parts) && modelContent.parts.length > 0) {
      contents.push({
        role: modelContent.role || "model",
        parts: modelContent.parts,
      });
    } else {
      contents.push({
        role: "model",
        parts: calls.map((c) => ({ functionCall: c })),
      });
    }

    // Execute batched tool calls concurrently while preserving result ordering
    const executed = await Promise.all(
      calls.map(async (call) => {
        const callName = call.name || "";
        const callArgs =
          call.args && typeof call.args === "object"
            ? (call.args as Record<string, unknown>)
            : {};
        const result = await executeOpsTool(callName, callArgs, actor);
        return { call, callName, callArgs, result };
      })
    );

    const responseParts: Part[] = [];
    for (const { call, callName, callArgs, result } of executed) {
      toolTrace.push({
        name: callName,
        args: callArgs,
        ok: result.ok,
        summary: summarizeToolResult(callName, result),
      });
      responseParts.push({
        functionResponse: {
          name: callName,
          ...(call.id ? { id: call.id } : {}),
          response: result.ok
            ? { output: compactToolOutputForModel(callName, result.data) }
            : { error: result.error || "Execution failed" },
        },
      });
    }

    contents.push({
      role: "user",
      parts: responseParts,
    });
  }

  // Final synthesis turn (without tools) if all tool steps were consumed
  try {
    contents.push({
      role: "user",
      parts: [
        {
          text: "Summarize the exact operations you completed above in a crisp, clear response for the Admin.",
        },
      ],
    });
    const { response, modelUsed } = await callGeminiWithFallback({
      ai,
      preferredModel: activeModel,
      allModels: models,
      contents,
      systemInstruction,
      stepLabel: "final-summary",
    });
    activeModel = modelUsed;
    const summaryReply = response.text?.trim();
    if (summaryReply) {
      return {
        reply: summaryReply,
        voiceSummary: buildVoiceSummary(summaryReply),
        toolCalls: toolTrace,
        modelUsed: activeModel,
      };
    }
  } catch (err) {
    console.warn("[ops:ai-agent] final synthesis failed:", err);
  }

  const fallbackReply = `Completed ${toolTrace.length} operation(s): ${toolTrace
    .map((t) => `${t.name} (${t.ok ? t.summary : `failed: ${t.summary}`})`)
    .join("; ")}.`;
  return {
    reply: fallbackReply,
    voiceSummary: buildVoiceSummary(fallbackReply),
    toolCalls: toolTrace,
    modelUsed: activeModel,
  };
}
