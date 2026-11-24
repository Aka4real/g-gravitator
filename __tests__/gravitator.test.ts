import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { HarmBlockThreshold, ThinkingLevel } from "@google/genai";
import {
  buildMaxPermissionConfig,
  buildThinkingConfigForModel,
  ensureWavAudioBuffer,
  GEMINI_DEFAULT_MODEL,
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_MAX_PERMISSION_SAFETY_SETTINGS,
  getGeminiModelName,
  normalizeAudioMimeType,
  wrapPcmAsWav,
} from "@/lib/gemini/client";
import { evaluateGraduationScorecard } from "@/lib/scorecard";
import {
  computeHackathonFingerprint,
  heuristicNormalizeHackathon,
  isRetrospectiveOrSpamNoise,
  parsePrizeFromText,
} from "@/lib/ingestion/hackathons/normalize";
import {
  getAiPermissions,
  mergeHackathonSources,
  readLocalStore,
  updateAiPermissions,
  writeLocalStore,
  type LocalStoreState,
} from "@/lib/db/repository";
import {
  hashPassword,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
} from "@/lib/auth/admin-auth";
import { submitAndVerifyHackathonUrl } from "@/lib/ingestion/hackathons";
import { buildVoiceSummary } from "@/lib/ops/ai-agent";
import {
  executeOpsTool,
  getGeminiFunctionDeclarations,
  OPS_TOOLS,
} from "@/lib/ops/tools";
import { generateHackathonIcs } from "@/lib/ics";
import { heuristicSynthesizeNews } from "@/lib/ingestion/news/synthesize";
import { SEED_HACKATHONS } from "@/lib/seed-fallback";

describe("G-Gravitator Core Platform Verification Suite", () => {
  it("evaluates the 25-Point OXAKALABS Graduation Scorecard thresholds accurately", () => {
    const promote = evaluateGraduationScorecard({
      pain_intensity: 5,
      willingness_to_pay: 5,
      technical_moat: 4,
      distribution_hook: 5,
      lean_maintainability: 4,
    });
    expect(promote.total).toBe(23);
    expect(promote.code).toBe("PROMOTE_TO_LABS");
    expect(promote.label).toBe("PROMOTE TO LABS (G-XX)");

    const caseStudy = evaluateGraduationScorecard({
      pain_intensity: 4,
      willingness_to_pay: 3,
      technical_moat: 4,
      distribution_hook: 3,
      lean_maintainability: 3,
    });
    expect(caseStudy.total).toBe(17);
    expect(caseStudy.code).toBe("B2B_CASE_STUDY_OPEN_SOURCE");

    const archive = evaluateGraduationScorecard({
      pain_intensity: 2,
      willingness_to_pay: 2,
      technical_moat: 3,
      distribution_hook: 2,
      lean_maintainability: 2,
    });
    expect(archive.total).toBe(11);
    expect(archive.code).toBe("DISPATCH_AND_ARCHIVE");
  });

  it("rejects retrospective recap tweets and scam noise in the hackathon pre-filter", () => {
    expect(
      isRetrospectiveOrSpamNoise(
        "Congrats to the winners of our AI hackathon last weekend! Here is the demo day recap."
      )
    ).toBe(true);

    expect(
      isRetrospectiveOrSpamNoise(
        "Announcing the $75,000 Anthropic & Cerebral Valley AI Agents Buildathon! Register now on lu.ma/cv-agents"
      )
    ).toBe(false);
  });

  it("normalizes raw X (Twitter) hackathon signals into canonical structured fields", () => {
    const res = heuristicNormalizeHackathon({
      provider: "twitter",
      rawText:
        "Announcing the $80,000 Autonomous MCP & Multi-Agent Buildathon hosted by @AnthropicAI in San Francisco and online! Apply by Dec 15.",
      url: "https://lu.ma/anthropic-mcp-buildathon",
      tweetUrl: "https://x.com/AnthropicAI/status/189001234567890",
    });

    expect(res.is_valid_upcoming_hackathon).toBe(true);
    expect(res.candidate).toBeDefined();
    expect(res.candidate?.prize_pool_usd).toBe(80000);
    expect(res.candidate?.format).toBe("HYBRID");
    expect(res.candidate?.themes).toContain("Agents");
    expect(res.candidate?.source_tweet_url).toBe(
      "https://x.com/AnthropicAI/status/189001234567890"
    );
  });

  it("computes deterministic fingerprints and merges cross-source Devpost + X badges without duplicates", () => {
    const fp1 = computeHackathonFingerprint(
      "Gemini Multi-Agent Buildathon 2026",
      "Google DeepMind",
      "2026-11-28T00:00:00Z"
    );
    const fp2 = computeHackathonFingerprint(
      "The Gemini Multi-Agent Buildathon",
      "Google DeepMind",
      "2026-11-22T00:00:00Z"
    );
    expect(fp1).toBe(fp2);

    const merged = mergeHackathonSources(
      [{ provider: "devpost", url: "https://devpost.com/gemini" }],
      [
        { provider: "twitter", url: "https://x.com/GoogleAI/status/1" },
        { provider: "devpost", url: "https://devpost.com/gemini" },
      ]
    );
    expect(merged).toHaveLength(2);
    expect(merged.map((s) => s.provider)).toEqual(["devpost", "twitter"]);
  });

  it("parses diverse prize pool notations accurately", () => {
    expect(parsePrizeFromText("Win $120,000 in prizes").usd).toBe(120000);
    expect(parsePrizeFromText("$50k + API compute credits").usd).toBe(50000);
  });

  it("generates RFC 5545 compliant .ics calendar files with 24h VALARM reminder", () => {
    const ics = generateHackathonIcs(SEED_HACKATHONS[0]);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("TRIGGER:-PT24H");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("synthesizes Orbital Wire AI news items with category classification and 2-sentence Gravity Takes", () => {
    const item = heuristicSynthesizeNews({
      title: "arXiv:2611.09911 — Compiler-Verified Multi-Agent Tool Calling at Scale",
      sourceName: "arXiv cs.AI",
      sourceUrl: "https://arxiv.org/abs/2611.09911",
      rawSummary:
        "We demonstrate that deterministic AST verification gates eliminate multi-turn error compounding across autonomous coding agents.",
    });

    expect(item.category).toBe("RESEARCH");
    expect(item.impact_score).toBeGreaterThanOrEqual(80);
    expect(item.gravity_take.length).toBeGreaterThan(40);
  });

  it("configures Gemini 3.8 Flash with maximum permission safety settings (HarmBlockThreshold.OFF) and 65,536 maxOutputTokens", () => {
    expect(GEMINI_DEFAULT_MODEL).toBe("gemini-3.8-flash");
    expect(getGeminiModelName()).toBe("gemini-3.8-flash");
    expect(GEMINI_MAX_PERMISSION_SAFETY_SETTINGS.length).toBe(5);
    for (const setting of GEMINI_MAX_PERMISSION_SAFETY_SETTINGS) {
      expect(setting.threshold).toBe(HarmBlockThreshold.OFF);
    }
    const cfg = buildMaxPermissionConfig();
    expect(cfg.maxOutputTokens).toBe(GEMINI_MAX_OUTPUT_TOKENS);
    expect(cfg.safetySettings).toEqual(GEMINI_MAX_PERMISSION_SAFETY_SETTINGS);
  });
});

describe("Disconnected Ops Auth, Moderation Gate & Unified Tool Registry", () => {
  let snapshot: LocalStoreState;

  beforeAll(() => {
    snapshot = structuredClone(readLocalStore());
  });

  afterAll(() => {
    writeLocalStore(snapshot);
  });

  it("hashes passwords with scrypt and signs/verifies HMAC admin session tokens", () => {
    const hash = hashPassword("StrongPass!2026");
    expect(verifyPassword("StrongPass!2026", hash)).toBe(true);
    expect(verifyPassword("WrongPass", hash)).toBe(false);

    const token = signSessionToken({
      id: "admin-1",
      email: "founder@ggravitator.com",
      name: "Founder",
      role: "SUPER_ADMIN",
    });
    const verified = verifySessionToken(token);
    expect(verified?.email).toBe("founder@ggravitator.com");
    expect(verified?.role).toBe("SUPER_ADMIN");
    expect(verifySessionToken(`${token}tampered`)).toBeNull();
  });

  it("holds community-submitted hackathons in PENDING_REVIEW until approved", async () => {
    await updateAiPermissions({ community_hackathons_require_approval: true });
    const prevKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      const submission = await submitAndVerifyHackathonUrl({
        url: "https://example.com/ai-frontier-hackathon-2026-test",
        rawContext:
          "Announcing the $45,000 Frontier AI Agents Hackathon! Register now before Dec 20, 2026.",
      });
      expect(submission.accepted).toBe(true);
      expect(submission.candidate?.is_published).toBe(false);
      expect(submission.candidate?.approval_status).toBe("PENDING_REVIEW");
      expect(submission.candidate?.created_by).toBe("community");
    } finally {
      if (prevKey !== undefined) process.env.GEMINI_API_KEY = prevKey;
    }
  });

  it("queues AI-created dispatches for review by default, allows direct publish when granted, and supports approve/revoke", async () => {
    await updateAiPermissions({
      ai_enabled: true,
      can_create_posts: true,
      can_publish_directly_journal: false,
      can_approve_posts: true,
      can_revoke_approval: true,
    });

    const queuedRes = await executeOpsTool(
      "create_dispatch",
      {
        title: "AI Drafted Dispatch Pending Review",
        subtitle: "Testing review queue gating",
        category: "AI SYSTEMS",
        mdx_content: "## Architecture\n\nBody text.",
        accent_color: "#10B981",
      },
      { actorType: "ai_assistant", actorLabel: "AI Operator" }
    );
    expect(queuedRes.ok).toBe(true);
    expect(queuedRes.data?.queued_for_review).toBe(true);
    const createdDisp = queuedRes.data?.dispatch as {
      id: string;
      is_published: boolean;
      approval_status: string;
    };
    expect(createdDisp.is_published).toBe(false);
    expect(createdDisp.approval_status).toBe("PENDING_REVIEW");

    // Approve it
    const approveRes = await executeOpsTool(
      "approve_content",
      { entity: "dispatch", id: createdDisp.id },
      { actorType: "admin", actorLabel: "admin@test.com" }
    );
    expect(approveRes.ok).toBe(true);
    expect((approveRes.data?.item as { is_published: boolean }).is_published).toBe(true);

    // Revoke approval
    const revokeRes = await executeOpsTool(
      "revoke_approval",
      { entity: "dispatch", id: createdDisp.id },
      { actorType: "ai_assistant", actorLabel: "AI Operator" }
    );
    expect(revokeRes.ok).toBe(true);
    expect((revokeRes.data?.item as { is_published: boolean }).is_published).toBe(false);

    // Grant direct publishing permission to AI
    await updateAiPermissions({ can_publish_directly_journal: true });
    const directRes = await executeOpsTool(
      "create_dispatch",
      {
        title: "AI Direct Published Dispatch",
        subtitle: "Direct publish permission active",
        category: "AI SYSTEMS",
        mdx_content: "## Direct Publish\n\nVerified.",
      },
      { actorType: "ai_assistant", actorLabel: "AI Operator" }
    );
    expect(directRes.ok).toBe(true);
    expect(directRes.data?.queued_for_review).toBe(false);
    expect((directRes.data?.dispatch as { is_published: boolean }).is_published).toBe(true);
  });

  it("enforces OPS_TOOLS permissions cleanly across AI, MCP, and Admin actors", async () => {
    expect(OPS_TOOLS.length).toBeGreaterThanOrEqual(25);
    await updateAiPermissions({ can_delete_posts: false, mcp_enabled: true });

    const deniedAiDelete = await executeOpsTool(
      "delete_dispatch",
      { id: "non-existent" },
      { actorType: "ai_assistant", actorLabel: "AI Operator" }
    );
    expect(deniedAiDelete.ok).toBe(false);
    expect(deniedAiDelete.error).toContain("can_delete_posts");

    const deniedAiPolicyChange = await executeOpsTool(
      "update_ai_permissions",
      { patch: { can_delete_posts: true } },
      { actorType: "ai_assistant", actorLabel: "AI Operator" }
    );
    expect(deniedAiPolicyChange.ok).toBe(false);

    const deniedReadonlyMcp = await executeOpsTool(
      "create_news_item",
      {
        title: "Readonly test",
        source_name: "Test",
        source_url: "https://example.com",
        category: "MODELS",
        gravity_take: "Test.",
      },
      {
        actorType: "mcp",
        actorLabel: "ReadOnly Token",
        permissionsMode: "readonly",
      }
    );
    expect(deniedReadonlyMcp.ok).toBe(false);
    expect(deniedReadonlyMcp.error).toContain("read-only");

    const policy = await getAiPermissions();
    expect(policy.can_delete_posts).toBe(false);
  });

  it("enforces can_approve_posts and can_revoke_approval on update_news_item and update_hackathon and supports get_post_details", async () => {
    await updateAiPermissions({
      ai_enabled: true,
      can_edit_posts: true,
      can_approve_posts: false,
      can_revoke_approval: false,
    });

    const store = readLocalStore();
    const publishedNews = store.news_items.find((n) => n.is_published);
    const pendingHack = store.hackathons.find((h) => !h.is_published);
    expect(publishedNews).toBeDefined();
    expect(pendingHack).toBeDefined();

    // Attempting to unpublish via update_news_item without can_revoke_approval must fail
    const revokeViaEdit = await executeOpsTool(
      "update_news_item",
      { id: publishedNews!.id, is_published: false },
      { actorType: "ai_assistant", actorLabel: "AI Operator" }
    );
    expect(revokeViaEdit.ok).toBe(false);
    expect(revokeViaEdit.error).toContain("can_revoke_approval");

    // Attempting to publish via update_hackathon without can_approve_posts must fail
    const approveViaEdit = await executeOpsTool(
      "update_hackathon",
      { id: pendingHack!.id, is_published: true },
      { actorType: "ai_assistant", actorLabel: "AI Operator" }
    );
    expect(approveViaEdit.ok).toBe(false);
    expect(approveViaEdit.error).toContain("can_approve_posts");

    // get_post_details fetches full records by slug/code/id
    const labRes = await executeOpsTool(
      "get_post_details",
      { entity: "lab", id_or_slug: "G-01" },
      { actorType: "ai_assistant", actorLabel: "AI Operator" }
    );
    expect(labRes.ok).toBe(true);
    expect((labRes.data?.item as { code: string }).code).toBe("G-01");
  });
});

describe("AI Voice Pipeline & Gemini Function Schema Integrity", () => {
  it("strips browser codec suffixes from audio MIME types for Gemini STT compatibility", () => {
    expect(normalizeAudioMimeType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(normalizeAudioMimeType("video/webm;codecs=vp8,opus")).toBe("audio/webm");
    expect(normalizeAudioMimeType("audio/mp4;codecs=mp4a.40.2")).toBe("audio/mp4");
    expect(normalizeAudioMimeType("audio/ogg; codecs=opus")).toBe("audio/ogg");
    expect(normalizeAudioMimeType("audio/x-m4a")).toBe("audio/mp4");
    expect(normalizeAudioMimeType("")).toBe("audio/webm");
  });

  it("wraps headerless raw L16 PCM TTS output into valid RIFF WAV and preserves existing WAV headers", () => {
    const rawPcm = Buffer.alloc(4800, 0x11);
    const wrapped = ensureWavAudioBuffer([rawPcm], "audio/L16;codec=pcm;rate=24000");
    expect(wrapped.mimeType).toBe("audio/wav");
    expect(wrapped.buffer.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(wrapped.buffer.subarray(8, 12).toString("ascii")).toBe("WAVE");
    expect(wrapped.buffer.readUInt32LE(24)).toBe(24000);
    expect(wrapped.buffer.readUInt32LE(40)).toBe(rawPcm.length);
    expect(wrapped.buffer.length).toBe(44 + rawPcm.length);

    // Passing a complete RIFF WAV passes through untouched
    const existingWav = wrapPcmAsWav(Buffer.alloc(1600, 0x22), 24000);
    const preserved = ensureWavAudioBuffer([existingWav], "audio/wav");
    expect(preserved.buffer.equals(existingWav)).toBe(true);

    // Multi-part WAV chunks merge into one valid WAV payload
    const chunkA = wrapPcmAsWav(Buffer.alloc(800, 0x33), 24000);
    const chunkB = wrapPcmAsWav(Buffer.alloc(1200, 0x44), 24000);
    const merged = ensureWavAudioBuffer([chunkA, chunkB], "audio/wav");
    expect(merged.buffer.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(merged.buffer.readUInt32LE(40)).toBe(2000);
    expect(merged.buffer.length).toBe(44 + 2000);
  });

  it("applies ThinkingLevel only on supported Gemini 3.x/4.x models and omits it on 2.5/TTS/Transcribe models", () => {
    expect(buildThinkingConfigForModel("gemini-3.8-flash", "low")).toEqual({
      thinkingLevel: ThinkingLevel.LOW,
    });
    expect(buildThinkingConfigForModel("gemini-3.8-flash", "medium")).toEqual({
      thinkingLevel: ThinkingLevel.MEDIUM,
    });
    expect(buildThinkingConfigForModel("gemini-2.5-flash", "low")).toBeUndefined();
    expect(buildThinkingConfigForModel("gemini-3.8-flash-lite-tts", "low")).toBeUndefined();
    expect(buildThinkingConfigForModel("gemini-3.5-transcribe", "low")).toBeUndefined();
  });

  it("sanitizes markdown, URLs, UUIDs, and tool names for natural spoken TTS", () => {
    const raw = `## Done!
Created **Issue 005** with cover \`/api/media/med-1234abcd\` and ID 550e8400-e29b-41d4-a716-446655440000.
See [Live Link](https://ggravitator.xyz/journal/test) and check \`pending_reviews\`.
\`\`\`ts
const x = 1;
\`\`\``;
    const spoken = buildVoiceSummary(raw);
    expect(spoken).not.toContain("https://");
    expect(spoken).not.toContain("550e8400");
    expect(spoken).not.toContain("/api/media/");
    expect(spoken).not.toContain("```");
    expect(spoken).not.toContain("pending_reviews");
    expect(spoken).toContain("Issue 005");
    expect(spoken).toContain("Live Link");
  });

  it("exposes strictly typed Gemini function declarations without admin_only tools or bare object schemas", () => {
    const decls = getGeminiFunctionDeclarations();
    expect(decls.length).toBeGreaterThanOrEqual(25);
    expect(decls.some((d) => d.name === "update_ai_permissions")).toBe(false);
    expect(decls.some((d) => d.name === "get_post_details")).toBe(true);

    const assertNoBareObjects = (node: unknown, pathLabel: string) => {
      if (!node || typeof node !== "object") return;
      const obj = node as Record<string, unknown>;
      const t = String(obj.type || "").toLowerCase();
      if (t === "object") {
        const props = obj.properties as Record<string, unknown> | undefined;
        expect(
          props && Object.keys(props).length > 0,
          `Bare object schema without properties at ${pathLabel}`
        ).toBe(true);
        if (props) {
          for (const [k, v] of Object.entries(props)) {
            assertNoBareObjects(v, `${pathLabel}.${k}`);
          }
        }
      }
      if (t === "array" && obj.items) {
        assertNoBareObjects(obj.items, `${pathLabel}[]`);
      }
    };

    for (const d of decls) {
      assertNoBareObjects(d.parameters, d.name || "unnamed");
    }
  });
});

