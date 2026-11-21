import crypto from "node:crypto";
import { Type } from "@google/genai";
import { generateGeminiStructuredJSON } from "@/lib/gemini/client";
import type { NewsCategory, NewsItem } from "@/lib/supabase/types";

export interface RawNewsCandidate {
  title: string;
  sourceName: string;
  sourceUrl: string;
  rawSummary?: string;
  publishedAt?: string;
  pointsHint?: number;
}

export function hashNewsUrl(url: string): string {
  const norm = url.trim().toLowerCase().replace(/\/+$/, "");
  return crypto.createHash("sha256").update(norm).digest("hex").slice(0, 24);
}

export function inferNewsCategory(text: string, sourceName: string): NewsCategory {
  const lower = `${text} ${sourceName}`.toLowerCase();
  if (/\b(arxiv|paper|benchmark|theorem|dataset|reasoning)\b/.test(lower)) {
    return "RESEARCH";
  }
  if (/\b(agent|agentic|mcp|tool[- ]calling|autonomous|computer[- ]use)\b/.test(lower)) {
    return "AGENTS";
  }
  if (/\b(gemini|claude|gpt|llama|qwen|mistral|deepseek|weights|checkpoint|model)\b/.test(lower)) {
    return "MODELS";
  }
  if (/\b(open[- ]source|github|repo|mit license|apache 2|sqlite|pgvector)\b/.test(lower)) {
    return "OPEN_SOURCE";
  }
  if (/\b(funding|series [abc]|acquisition|enterprise|pricing|valuation|revenue)\b/.test(lower)) {
    return "BUSINESS";
  }
  return "DEVTOOLS";
}

export function heuristicSynthesizeNews(
  raw: RawNewsCandidate
): Omit<NewsItem, "id" | "created_at"> {
  const category = inferNewsCategory(
    `${raw.title} ${raw.rawSummary ?? ""}`,
    raw.sourceName
  );

  let impact = 82;
  if (raw.pointsHint && raw.pointsHint >= 250) impact = 93;
  else if (raw.pointsHint && raw.pointsHint >= 150) impact = 88;
  else if (/deepmind|anthropic|openai|vercel/i.test(raw.sourceName)) impact = 91;

  const cleanSnippet = (raw.rawSummary || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const sentenceOne =
    cleanSnippet.length > 35
      ? cleanSnippet.split(/(?<=[.!?])\s+/)[0]?.slice(0, 180) ||
        `${raw.sourceName} released ${raw.title}, shifting the production baseline for ${category.toLowerCase()} engineering.`
      : `${raw.sourceName} published ${raw.title}, introducing new primitives for ${category.toLowerCase()} architectures.`;

  const actionableByCategory: Record<NewsCategory, string> = {
    MODELS:
      "Evaluate latency, structured schema compliance, and cost-per-1k tokens in OrbitBench before migrating production routing.",
    AGENTS:
      "Integrate via strict JSON Schema tool contracts and deterministic verification gates to prevent multi-step drift.",
    DEVTOOLS:
      "Reduces deployment friction and runtime cold-starts for standalone full-stack AI applications.",
    RESEARCH:
      "Validates replacing unconstrained multi-turn prompting with compiler-verified execution loops.",
    BUSINESS:
      "Signals continued enterprise budget migration toward outcome-priced, IP-transferred AI systems.",
    OPEN_SOURCE:
      "Can be self-hosted inside sovereign Docker/Coolify environments with zero vendor lock-in.",
  };

  const gravityTake = `${sentenceOne.endsWith(".") ? sentenceOne : `${sentenceOne}.`} ${
    actionableByCategory[category]
  }`;

  const pubDate =
    raw.publishedAt && !Number.isNaN(new Date(raw.publishedAt).getTime())
      ? new Date(raw.publishedAt).toISOString()
      : new Date().toISOString();

  return {
    url_hash: hashNewsUrl(raw.sourceUrl),
    title: raw.title.trim(),
    source_name: raw.sourceName,
    source_url: raw.sourceUrl,
    category,
    gravity_take: gravityTake,
    impact_score: Math.min(99, Math.max(50, impact)),
    published_at: pubDate,
    is_pinned: false,
    is_published: true,
  };
}

export async function synthesizeNewsCandidate(
  raw: RawNewsCandidate
): Promise<Omit<NewsItem, "id" | "created_at">> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return heuristicSynthesizeNews(raw);
  }

  try {
    const parsed = await generateGeminiStructuredJSON<{
      category: NewsCategory;
      gravity_take: string;
      impact_score: number;
    }>({
      contents: `Synthesize this AI/tech news item for G-Gravitator's "The Orbital Wire". Provide a category, an impact_score (1-100), and a sharp 2-sentence "gravity_take" explaining why this matters to software & AI builders (zero clickbait).\n\nTitle: ${raw.title}\nSource: ${raw.sourceName}\nSummary: ${raw.rawSummary ?? ""}`,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            enum: [
              "MODELS",
              "AGENTS",
              "DEVTOOLS",
              "RESEARCH",
              "BUSINESS",
              "OPEN_SOURCE",
            ],
          },
          gravity_take: { type: Type.STRING },
          impact_score: { type: Type.INTEGER },
        },
        required: ["category", "gravity_take", "impact_score"],
      },
    });

    const fallback = heuristicSynthesizeNews(raw);
    if (!parsed) return fallback;

    return {
      ...fallback,
      category: parsed.category || fallback.category,
      gravity_take: parsed.gravity_take || fallback.gravity_take,
      impact_score: Math.min(100, Math.max(1, parsed.impact_score || fallback.impact_score)),
    };
  } catch {
    return heuristicSynthesizeNews(raw);
  }
}
