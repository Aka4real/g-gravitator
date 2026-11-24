import { NextResponse } from "next/server";
import { Type } from "@google/genai";
import { getAuthenticatedAdmin } from "@/lib/auth/admin-auth";
import { appendAuditLog } from "@/lib/db/repository";
import { generateGeminiStructuredJSON } from "@/lib/gemini/client";
import { generateAndStoreImage } from "@/lib/ops/media";
import { runLiveWebResearch } from "@/lib/ops/research";

export const maxDuration = 60;

type DraftEntity = "dispatch" | "news" | "hackathon";

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      entity?: DraftEntity;
      topic?: string;
      accentColor?: string;
      generateCover?: boolean;
    };

    const entity: DraftEntity =
      body.entity === "news" || body.entity === "hackathon" ? body.entity : "dispatch";
    const topic = (body.topic || "").trim();
    if (!topic) {
      return NextResponse.json(
        { error: "Provide a topic or brief for AI drafting." },
        { status: 400 }
      );
    }

    const accentColor =
      /^#[0-9a-fA-F]{3,8}$/.test(body.accentColor || "")
        ? body.accentColor!
        : "#FF3B1F";

    const sources =
      entity === "hackathon"
        ? ["devpost", "google", "hackernews"]
        : ["hackernews", "arxiv", "google", "wikipedia"];

    // Run live web research and cover visual generation concurrently
    const [research, coverResult] = await Promise.all([
      runLiveWebResearch(topic, sources),
      body.generateCover !== false
        ? generateAndStoreImage({
            prompt: `Editorial hero artwork representing: ${topic}`,
            title: topic.slice(0, 80),
            accentColor,
            category: entity.toUpperCase(),
            createdBy: "admin",
          }).catch(() => null)
        : Promise.resolve(null),
    ]);

    const researchContext = [
      research.groundedSummary ? `Grounded Summary:\n${research.groundedSummary}` : "",
      research.findings.length > 0
        ? `Verified Web Sources:\n${research.findings
            .slice(0, 8)
            .map((f, idx) => `${idx + 1}. [${f.source}] ${f.title} — ${f.url}\n   ${f.snippet}`)
            .join("\n")}`
        : "No external web sources returned; write strictly from solid engineering fundamentals without fabricating URLs.",
    ]
      .filter(Boolean)
      .join("\n\n");

    const nowIso = new Date().toISOString();
    const defaultLinks = research.findings.slice(0, 4).map((f) => ({
      label: f.title.slice(0, 64),
      url: f.url,
      description: f.source,
    }));

    let draft: Record<string, unknown> | null = null;

    if (entity === "dispatch") {
      const generated = await generateGeminiStructuredJSON<{
        title: string;
        subtitle: string;
        category: string;
        tags: string[];
        mdx_content: string;
        featured_links: { label: string; url: string; description?: string }[];
      }>({
        thinkingLevel: "low",
        contents: `You are drafting a flagship G-Gravitator Lab Dispatch in crisp, authoritative systems-engineering prose (no clickbait, no fluff).
Current UTC Date: ${nowIso.slice(0, 10)}
Topic: ${topic}
${coverResult ? `Generated Cover Image URL: ${coverResult.asset.url}` : ""}

${researchContext}

Requirements:
- Write a compelling engineering title and concise 1-2 sentence subtitle.
- Choose the best category from: ARCHITECTURE, POST-MORTEM, AI SYSTEMS, HACKATHON LOG, DESIGN ENGINEERING.
- Write rich markdown in mdx_content using ## Section headings, bullet lists, at least one > [!ACCENT] key architectural takeaway callout, and inline links to verified sources above where relevant.
- Return 3-5 uppercase tags and up to 4 real featured_links from the research sources.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            category: {
              type: Type.STRING,
              enum: [
                "ARCHITECTURE",
                "POST-MORTEM",
                "AI SYSTEMS",
                "HACKATHON LOG",
                "DESIGN ENGINEERING",
              ],
            },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            mdx_content: { type: Type.STRING },
            featured_links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  url: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["label", "url"],
              },
            },
          },
          required: ["title", "subtitle", "category", "tags", "mdx_content", "featured_links"],
        },
      });

      draft = generated ?? {
        title: topic,
        subtitle:
          research.groundedSummary?.split(/(?<=[.!?])\s+/)[0] ||
          `Engineering teardown and architectural analysis of ${topic}.`,
        category: "AI SYSTEMS",
        tags: ["AI SYSTEMS", "ARCHITECTURE", "ENGINEERING"],
        mdx_content: `## Engineering Overview\n\n${
          research.groundedSummary ||
          `Technical analysis of ${topic} and its implications for production AI systems.`
        }\n\n> [!ACCENT] Focus on deterministic evaluation gates and measurable latency gains before adopting new abstractions in production.\n\n## Key Signals & References\n\n${
          defaultLinks.length > 0
            ? defaultLinks.map((l) => `- [${l.label}](${l.url})`).join("\n")
            : "- Add primary benchmark citations and architectural notes here."
        }`,
        featured_links: defaultLinks,
      };
    } else if (entity === "news") {
      const topSource = research.findings[0];
      const generated = await generateGeminiStructuredJSON<{
        title: string;
        source_name: string;
        source_url: string;
        category: string;
        gravity_take: string;
        impact_score: number;
        related_links: { label: string; url: string; description?: string }[];
      }>({
        thinkingLevel: "low",
        contents: `Draft a crisp Orbital Wire AI/tech intelligence item for software and AI builders.
Current UTC Date: ${nowIso.slice(0, 10)}
Topic: ${topic}

${researchContext}

Requirements:
- Sharp, factual headline (zero clickbait).
- Pick the primary verified source_name and source_url from the research above.
- Write a 2-sentence gravity_take explaining concrete architectural or strategic impact for builders.
- Score impact_score between 70 and 99.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            source_name: { type: Type.STRING },
            source_url: { type: Type.STRING },
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
            related_links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  url: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["label", "url"],
              },
            },
          },
          required: [
            "title",
            "source_name",
            "source_url",
            "category",
            "gravity_take",
            "impact_score",
            "related_links",
          ],
        },
      });

      draft = generated ?? {
        title: topSource?.title || topic,
        source_name: topSource?.source || "Orbital Wire Research",
        source_url: topSource?.url || "https://news.ycombinator.com",
        category: "AGENTS",
        gravity_take:
          research.groundedSummary?.slice(0, 320) ||
          `${topic} introduces meaningful shifts for applied AI builders. Evaluate schema adherence, latency, and deployment ergonomics before migrating production pipelines.`,
        impact_score: 88,
        related_links: defaultLinks,
      };
    } else {
      const topSource = research.findings[0];
      const defaultDeadline = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
      const generated = await generateGeminiStructuredJSON<{
        title: string;
        organizer: string;
        summary: string;
        prize_display: string;
        prize_pool_usd: number | null;
        deadline_at: string;
        format: "ONLINE" | "IN_PERSON" | "HYBRID";
        location: string;
        themes: string[];
        primary_url: string;
        related_links: { label: string; url: string; description?: string }[];
      }>({
        thinkingLevel: "low",
        contents: `Draft a structured hackathon listing for the G-Gravitator Live Hackathon Radar.
Current UTC Date: ${nowIso.slice(0, 10)}
Topic / Event: ${topic}

${researchContext}

Requirements:
- Use verified event title, organizer, prize pool, format, location, and registration URL from research where available.
- Return deadline_at as a future ISO-8601 UTC string (default to ~14 days from ${nowIso.slice(0, 10)} if exact deadline is unknown).
- Write a crisp 2-sentence builder-focused summary.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            organizer: { type: Type.STRING },
            summary: { type: Type.STRING },
            prize_display: { type: Type.STRING },
            prize_pool_usd: { type: Type.INTEGER, nullable: true },
            deadline_at: { type: Type.STRING },
            format: { type: Type.STRING, enum: ["ONLINE", "IN_PERSON", "HYBRID"] },
            location: { type: Type.STRING },
            themes: { type: Type.ARRAY, items: { type: Type.STRING } },
            primary_url: { type: Type.STRING },
            related_links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  url: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["label", "url"],
              },
            },
          },
          required: [
            "title",
            "organizer",
            "summary",
            "prize_display",
            "deadline_at",
            "format",
            "location",
            "themes",
            "primary_url",
            "related_links",
          ],
        },
      });

      draft = generated ?? {
        title: topSource?.title || topic,
        organizer: topSource?.source || "Global AI Builders",
        summary:
          research.groundedSummary?.slice(0, 280) ||
          `High-velocity AI engineering sprint focused on ${topic}. Build production-grade prototypes and ship live demos.`,
        prize_display: "$50,000 + Compute Credits",
        prize_pool_usd: 50000,
        deadline_at: defaultDeadline,
        format: "ONLINE",
        location: "Global / Remote",
        themes: ["AI", "Agents", "Open Source"],
        primary_url: topSource?.url || "https://devpost.com/hackathons",
        related_links: defaultLinks,
      };
    }

    await appendAuditLog({
      actor_type: "admin",
      actor_label: admin.email,
      action: "ai_draft_post",
      entity_type: entity,
      summary: `AI-drafted ${entity} into Post Designer for "${topic.slice(0, 60)}"`,
      status: "ok",
    });

    return NextResponse.json({
      ok: true,
      entity,
      draft,
      coverImageUrl: coverResult?.asset.url ?? null,
      coverGenerator: coverResult?.generator ?? null,
      researchCount: research.findings.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "AI draft generation failed.",
      },
      { status: 500 }
    );
  }
}
