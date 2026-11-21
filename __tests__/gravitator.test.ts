import { describe, expect, it } from "vitest";
import { HarmBlockThreshold } from "@google/genai";
import {
  buildMaxPermissionConfig,
  GEMINI_DEFAULT_MODEL,
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_MAX_PERMISSION_SAFETY_SETTINGS,
  getGeminiModelName,
} from "@/lib/gemini/client";
import { evaluateGraduationScorecard } from "@/lib/scorecard";
import {
  computeHackathonFingerprint,
  heuristicNormalizeHackathon,
  isRetrospectiveOrSpamNoise,
  parsePrizeFromText,
} from "@/lib/ingestion/hackathons/normalize";
import { mergeHackathonSources } from "@/lib/db/repository";
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

