import type { Content, Part } from "@google/genai";
import {
  getAiPermissions,
  getDispatches,
  getHackathons,
  getNewsItems,
} from "@/lib/db/repository";
import {
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_MAX_PERMISSION_SAFETY_SETTINGS,
  getGeminiBetaClient,
  getOrderedGeminiModels,
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
    return `Stored media ${(d.asset as { url?: string }).url ?? ""}`;
  }
  return "Completed";
}

function buildVoiceSummary(markdownText: string): string {
  const plain = markdownText
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_`~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= 480) return plain;
  const sentences = plain.split(/(?<=[.!?])\s+/);
  let out = "";
  for (const s of sentences) {
    if ((out + " " + s).length > 460) break;
    out = out ? `${out} ${s}` : s;
  }
  return out || plain.slice(0, 460);
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
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const [policy, dispatches, { items: news }, { items: hackathons }] =
    await Promise.all([
      getAiPermissions(),
      getDispatches(undefined, undefined, { includeUnpublished: true }),
      getNewsItems({ includeUnpublished: true }),
      getHackathons({ includeUnpublished: true, includeExpired: true }),
    ]);

  if (!policy.ai_enabled) {
    return {
      reply:
        "AI Assistant execution is currently turned off in **AI Permissions & Governance**. Enable **AI Enabled** to let me perform research, curation, and operations.",
      voiceSummary:
        "AI Assistant execution is currently disabled in AI Permissions. Enable AI Enabled to continue.",
      toolCalls: [],
      modelUsed: "policy-gate",
    };
  }

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

  const systemInstruction = `You are the G-Gravitator Executive AI Operator inside the private Command Center.
You respond cleanly to both written instructions and natural human voice commands from the Admin ("${params.actorLabel}").

Current Live System Snapshot:
- Dispatches: ${dispatches.length} total (${pendingDispatches.length} pending review: ${pendingDispatches.join(", ") || "none"})
- Orbital Wire News: ${news.length} total (${pendingNews.length} pending review: ${pendingNews.join(", ") || "none"})
- Hackathons: ${hackathons.length} total (${pendingHacks.length} pending review: ${pendingHacks.join(", ") || "none"})
- Current AI Permissions Policy:
  - ai_enabled=${policy.ai_enabled}, full_admin_parity=${policy.full_admin_parity}
  - direct_publish: journal=${policy.can_publish_directly_journal}, news=${policy.can_publish_directly_news}, hackathons=${policy.can_publish_directly_hackathons}
  - can_create_posts=${policy.can_create_posts}, can_edit_posts=${policy.can_edit_posts}, can_approve_posts=${policy.can_approve_posts}, can_revoke_approval=${policy.can_revoke_approval}, can_delete_posts=${policy.can_delete_posts}
  - can_manage_labs=${policy.can_manage_labs}, can_manage_inquiries=${policy.can_manage_inquiries}, can_manage_orbit_and_subscribers=${policy.can_manage_orbit_and_subscribers}
  - can_trigger_ingestion=${policy.can_trigger_ingestion}, can_web_research=${policy.can_web_research}, can_manage_media=${policy.can_manage_media}

Operational Rules:
1. Execute real tasks immediately using your tools whenever the Admin asks (e.g., research topics online, design and create Journal Dispatches / News / Hackathons with cover images via \`generate_post_image\` or \`import_image_from_url\`, custom accent colors, callouts \`> [!ACCENT]\`, and markdown links, remove old posts, approve or revoke approval, manage Labs/Inquiries/Orbit/Subscribers, or run live ingestion).
2. When designing a rich post: first call \`web_research\` or \`fetch_webpage\` when factual/up-to-date details or real links are needed, optionally call \`generate_post_image\` or \`import_image_from_url\` to get a real \`/api/media/...\` image URL, embed images (\`![caption](url)\`), colored callouts (\`> [!ACCENT] Key Takeaway...\`), and real links (\`[Label](https://...)\` + \`featured_links\`).
3. Respect permissions transparently: if direct publish is false for Journal/News/Hackathons, \`create_dispatch\` / \`create_news_item\` / \`create_hackathon\` will queue the post in \`PENDING_REVIEW\` for Admin review—report that clearly! If any tool returns a permission-denied error, tell the Admin honestly without faking success.
4. Keep responses concise, natural, and crisp so they sound great when read aloud in human voice.`;

  const contents: Content[] = params.messages.slice(-14).map((m) => ({
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

  for (let step = 0; step < 8; step++) {
    let response = null;
    let lastErr: unknown = null;

    for (const candidateModel of models) {
      try {
        response = await ai.models.generateContent({
          model: candidateModel,
          contents,
          config: {
            systemInstruction,
            safetySettings: GEMINI_MAX_PERMISSION_SAFETY_SETTINGS,
            maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
            tools: [{ functionDeclarations: declarations }],
          },
        });
        activeModel = candidateModel;
        break;
      } catch (err) {
        lastErr = err;
        console.warn(
          `[ops:ai-agent] ${candidateModel} step ${step} failed: ${
            err instanceof Error ? err.message.slice(0, 180) : String(err)
          }`
        );
        if (!isTransientGeminiError(err)) {
          throw err;
        }
      }
    }

    if (!response) {
      throw lastErr instanceof Error
        ? lastErr
        : new Error("All Gemini models failed due to transient demand.");
    }

    const modelContent = response.candidates?.[0]?.content;
    const calls = response.functionCalls;

    if (!calls || calls.length === 0) {
      const reply =
        response.text?.trim() ||
        (toolTrace.length > 0
          ? `Completed ${toolTrace.length} operation(s).`
          : "Ready for your command.");
      return {
        reply,
        voiceSummary: buildVoiceSummary(reply),
        toolCalls: toolTrace,
        modelUsed: activeModel,
      };
    }

    if (modelContent) {
      contents.push(modelContent);
    }

    const responseParts: Part[] = [];
    for (const call of calls) {
      const callName = call.name || "";
      const callArgs =
        call.args && typeof call.args === "object"
          ? (call.args as Record<string, unknown>)
          : {};
      const result = await executeOpsTool(callName, callArgs, actor);
      toolTrace.push({
        name: callName,
        args: callArgs,
        ok: result.ok,
        summary: summarizeToolResult(callName, result),
      });
      responseParts.push({
        functionResponse: {
          name: callName,
          id: call.id,
          response: result.ok
            ? { output: result.data }
            : { error: result.error || "Execution failed" },
        },
      });
    }

    contents.push({
      role: "user",
      parts: responseParts,
    });
  }

  const fallbackReply = `Executed ${toolTrace.length} operation(s). Check the action trace or console view for updated records.`;
  return {
    reply: fallbackReply,
    voiceSummary: fallbackReply,
    toolCalls: toolTrace,
    modelUsed: activeModel,
  };
}
