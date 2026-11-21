import { Type } from "@google/genai";
import { generateGeminiStructuredJSON } from "@/lib/gemini/client";
import type {
  Hackathon,
  HackathonFormat,
  HackathonProvider,
  HackathonSource,
} from "@/lib/supabase/types";

export interface RawHackathonCandidate {
  provider: HackathonProvider;
  rawText: string;
  titleHint?: string;
  organizerHint?: string;
  url: string;
  tweetUrl?: string | null;
  prizeHint?: string | null;
  deadlineHint?: string | null;
  formatHint?: HackathonFormat;
  locationHint?: string;
  themesHint?: string[];
}

export interface NormalizedHackathonResult {
  is_valid_upcoming_hackathon: boolean;
  rejection_reason?: string;
  candidate?: Omit<Hackathon, "id" | "created_at" | "updated_at">;
}

const RETROSPECTIVE_NOISE_PATTERNS = [
  /\bcongrats to the winners\b/i,
  /\bhackathon recap\b/i,
  /\bwrapping up our hackathon\b/i,
  /\bthrowback to last\b/i,
  /\bwinner announcement\b/i,
  /\bdemo day highlights from last\b/i,
  /\bairdrop claim now\b/i,
  /\bsend \d+ eth\b/i,
];

export function isRetrospectiveOrSpamNoise(text: string): boolean {
  const cleaned = text.trim();
  if (cleaned.length < 12) return true;
  for (const regex of RETROSPECTIVE_NOISE_PATTERNS) {
    if (regex.test(cleaned)) {
      // Only reject if there is no explicit upcoming registration cue
      if (!/\b(register now|apply by|submissions open|upcoming cohort)\b/i.test(cleaned)) {
        return true;
      }
    }
  }
  return false;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "global",
  "online",
  "hackathon",
  "buildathon",
  "challenge",
  "sprint",
  "jam",
  "2025",
  "2026",
  "2027",
]);

export function computeHackathonFingerprint(
  title: string,
  organizer: string,
  deadlineIso: string
): string {
  const coreTokens = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t))
    .slice(0, 4)
    .join("-");

  const orgToken = organizer
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 14);

  const dateObj = new Date(deadlineIso);
  const ym = Number.isNaN(dateObj.getTime())
    ? "2026-12"
    : `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(2, "0")}`;

  return `${coreTokens || slugify(title).slice(0, 24)}--${orgToken || "global"}--${ym}`;
}

export function parsePrizeFromText(text: string): {
  usd: number | null;
  display: string;
} {
  // Match patterns like "$100,000", "$50k", "$25,000 USDC"
  const match = text.match(/\$\s?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(k|m|thousand|million)?/i);
  if (!match) {
    return { usd: null, display: "Bounties + Compute Credits" };
  }
  const rawNum = Number(match[1].replace(/,/g, ""));
  if (Number.isNaN(rawNum)) {
    return { usd: null, display: "Bounties + Compute Credits" };
  }
  const suffix = (match[2] || "").toLowerCase();
  let multiplier = 1;
  if (suffix === "k" || suffix === "thousand") multiplier = 1000;
  if (suffix === "m" || suffix === "million") multiplier = 1000000;

  const usd = Math.round(rawNum * multiplier);
  const formatted = `$${usd.toLocaleString("en-US")}`;
  const hasCredits = /credit|grant|compute|bounty/i.test(text);
  return {
    usd,
    display: hasCredits && usd < 500000 ? `${formatted} + Compute Grants` : formatted,
  };
}

export function inferThemesFromText(text: string, hints: string[] = []): string[] {
  const found = new Set<string>(hints);
  const lower = text.toLowerCase();
  if (/\b(agent|agentic|mcp|multi-agent|autonomous|crew|langgraph)\b/.test(lower)) {
    found.add("Agents");
  }
  if (/\b(ai|llm|gemini|claude|openai|gpt|model|multimodal|rag|inference)\b/.test(lower)) {
    found.add("AI");
  }
  if (/\b(web3|solana|ethereum|ethglobal|defi|on-chain|zk|crypto|usdc)\b/.test(lower)) {
    found.add("Web3");
  }
  if (/\b(fintech|payment|stablecoin|treasury|banking|commerce)\b/.test(lower)) {
    found.add("Fintech");
  }
  if (/\b(health|clinical|biotech|med|diagnostic)\b/.test(lower)) {
    found.add("HealthTech");
  }
  if (/\b(open[- ]source|oss|github|cli|devtools)\b/.test(lower)) {
    found.add("Open Source");
  }
  if (/\b(hardware|robotics|edge|silicon|iot|embodied)\b/.test(lower)) {
    found.add("Hardware");
  }
  if (/\b(saas|nextjs|vercel|supabase|fullstack|web app)\b/.test(lower)) {
    found.add("SaaS / Web");
  }
  if (found.size === 0) {
    found.add("AI");
    found.add("SaaS / Web");
  }
  return Array.from(found);
}

export function inferFormatFromText(
  text: string,
  hint?: HackathonFormat
): { format: HackathonFormat; location: string } {
  if (hint) {
    return {
      format: hint,
      location: hint === "ONLINE" ? "Global / Remote" : "Hybrid / Global",
    };
  }
  const lower = text.toLowerCase();
  if (/\b(hybrid)\b/.test(lower)) {
    return { format: "HYBRID", location: "Global Hybrid" };
  }
  if (/\b(in-person|san francisco|london|lagos|bengaluru|new york|nyc)\b/.test(lower)) {
    const cityMatch = text.match(
      /\b(San Francisco|London|Lagos|Nairobi|Bengaluru|New York|Tokyo|Berlin)\b/i
    );
    const city = cityMatch ? cityMatch[1] : "On-Site";
    if (/\b(online|remote|global)\b/.test(lower)) {
      return { format: "HYBRID", location: `${city} & Global Remote` };
    }
    return { format: "IN_PERSON", location: city };
  }
  return { format: "ONLINE", location: "Global / Remote" };
}

export function heuristicNormalizeHackathon(
  raw: RawHackathonCandidate
): NormalizedHackathonResult {
  const combinedText = `${raw.titleHint ?? ""} ${raw.organizerHint ?? ""} ${raw.rawText} ${
    raw.prizeHint ?? ""
  }`.trim();

  if (isRetrospectiveOrSpamNoise(combinedText)) {
    return {
      is_valid_upcoming_hackathon: false,
      rejection_reason: "Rejected by retrospective/noise pre-filter.",
    };
  }

  const parsedPrize = raw.prizeHint
    ? parsePrizeFromText(raw.prizeHint)
    : parsePrizeFromText(combinedText);

  const { format, location } = inferFormatFromText(combinedText, raw.formatHint);
  const themes = inferThemesFromText(combinedText, raw.themesHint);

  let title = raw.titleHint?.trim() || "";
  if (!title) {
    const firstLine = raw.rawText
      .split(/\r?\n|[.!?]/)[0]
      ?.replace(/https?:\/\/\S+/g, "")
      .replace(/^[#@\s]+/, "")
      .trim();
    title =
      firstLine && firstLine.length >= 8
        ? firstLine.slice(0, 88)
        : "Frontier AI & Agentic Systems Buildathon";
  }

  let organizer = raw.organizerHint?.trim() || "";
  if (!organizer) {
    const handleMatch = raw.rawText.match(/@([A-Za-z0-9_]{2,25})/);
    if (handleMatch) {
      organizer = `@${handleMatch[1]}`;
    } else {
      try {
        const u = new URL(raw.url);
        organizer = u.hostname.replace(/^www\./, "");
      } catch {
        organizer = raw.provider.toUpperCase();
      }
    }
  }

  let deadlineIso = raw.deadlineHint || "";
  if (!deadlineIso || Number.isNaN(new Date(deadlineIso).getTime())) {
    // Default 9 days ahead if unspecified in tweet text
    deadlineIso = new Date(Date.now() + 9 * 24 * 3600 * 1000).toISOString();
  } else {
    deadlineIso = new Date(deadlineIso).toISOString();
  }

  const cleanSentences = raw.rawText
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const summary =
    cleanSentences.length > 25
      ? cleanSentences.slice(0, 220) + (cleanSentences.length > 220 ? "..." : "")
      : `High-signal ${themes.slice(0, 2).join(" & ")} hackathon hosted by ${organizer} with ${parsedPrize.display} in prizes.`;

  // Score confidence based on signal density
  let confidence = 0.75;
  if (raw.titleHint && raw.deadlineHint) confidence += 0.14;
  if (parsedPrize.usd && parsedPrize.usd > 0) confidence += 0.06;
  if (/\b(hackathon|buildathon|bounty|challenge|sprint)\b/i.test(combinedText)) {
    confidence += 0.04;
  }
  confidence = Math.min(0.98, Number(confidence.toFixed(2)));

  const fingerprint = computeHackathonFingerprint(title, organizer, deadlineIso);
  const sources: HackathonSource[] = [{ provider: raw.provider, url: raw.url }];
  if (raw.tweetUrl && raw.provider !== "twitter") {
    sources.push({ provider: "twitter", url: raw.tweetUrl });
  }

  return {
    is_valid_upcoming_hackathon: true,
    candidate: {
      fingerprint,
      title,
      slug: `${slugify(title)}-${fingerprint.slice(-7)}`,
      organizer,
      summary,
      prize_pool_usd: parsedPrize.usd,
      prize_display: parsedPrize.display,
      start_at: new Date().toISOString(),
      deadline_at: deadlineIso,
      format,
      location: raw.locationHint || location,
      themes,
      sources,
      primary_url: raw.url,
      source_tweet_url:
        raw.tweetUrl ?? (raw.provider === "twitter" ? raw.url : null),
      image_url: null,
      oxakalabs_status: "SCOUTING",
      confidence_score: confidence,
      is_published: confidence >= 0.8,
      is_featured: (parsedPrize.usd ?? 0) >= 50000,
    },
  };
}

export async function normalizeHackathonCandidate(
  raw: RawHackathonCandidate
): Promise<NormalizedHackathonResult> {
  // Always run deterministic retrospective pre-filter first (Cost Control Rule 6.4)
  if (isRetrospectiveOrSpamNoise(`${raw.titleHint ?? ""} ${raw.rawText}`)) {
    return {
      is_valid_upcoming_hackathon: false,
      rejection_reason: "Filtered as retrospective recap or non-hackathon spam.",
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return heuristicNormalizeHackathon(raw);
  }

  try {
    const parsed = await generateGeminiStructuredJSON<{
      is_valid_upcoming_hackathon: boolean;
      title: string;
      organizer: string;
      summary: string;
      prize_pool_usd: number | null;
      prize_display: string;
      deadline_at: string;
      format: HackathonFormat;
      location: string;
      themes: string[];
      registration_url: string;
      confidence_score: number;
    }>({
      contents: `Analyze this raw hackathon / X post payload and extract canonical hackathon telemetry. Reject if it is merely recapping a past event, a joke, or a scam.\n\nProvider: ${raw.provider}\nURL: ${raw.url}\nTitle Hint: ${raw.titleHint ?? ""}\nOrganizer Hint: ${raw.organizerHint ?? ""}\nPrize Hint: ${raw.prizeHint ?? ""}\nDeadline Hint: ${raw.deadlineHint ?? ""}\nRaw Text:\n${raw.rawText}`,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          is_valid_upcoming_hackathon: { type: Type.BOOLEAN },
          title: { type: Type.STRING },
          organizer: { type: Type.STRING },
          summary: { type: Type.STRING },
          prize_pool_usd: { type: Type.INTEGER, nullable: true },
          prize_display: { type: Type.STRING },
          deadline_at: { type: Type.STRING },
          format: {
            type: Type.STRING,
            enum: ["ONLINE", "IN_PERSON", "HYBRID"],
          },
          location: { type: Type.STRING },
          themes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          registration_url: { type: Type.STRING },
          confidence_score: { type: Type.NUMBER },
        },
        required: [
          "is_valid_upcoming_hackathon",
          "title",
          "organizer",
          "summary",
          "prize_display",
          "deadline_at",
          "format",
          "location",
          "themes",
          "registration_url",
          "confidence_score",
        ],
      },
    });

    if (!parsed) {
      return heuristicNormalizeHackathon(raw);
    }

    if (!parsed.is_valid_upcoming_hackathon || parsed.confidence_score < 0.5) {
      return {
        is_valid_upcoming_hackathon: false,
        rejection_reason: "Gemini 3.8 Flash verification gate rejected candidate (<0.50 confidence).",
      };
    }

    const deadlineIso = Number.isNaN(new Date(parsed.deadline_at).getTime())
      ? new Date(Date.now() + 9 * 24 * 3600 * 1000).toISOString()
      : new Date(parsed.deadline_at).toISOString();

    const fingerprint = computeHackathonFingerprint(
      parsed.title,
      parsed.organizer,
      deadlineIso
    );

    const sources: HackathonSource[] = [
      { provider: raw.provider, url: parsed.registration_url || raw.url },
    ];
    if (raw.tweetUrl && raw.provider !== "twitter") {
      sources.push({ provider: "twitter", url: raw.tweetUrl });
    }

    return {
      is_valid_upcoming_hackathon: true,
      candidate: {
        fingerprint,
        title: parsed.title,
        slug: `${slugify(parsed.title)}-${fingerprint.slice(-7)}`,
        organizer: parsed.organizer,
        summary: parsed.summary,
        prize_pool_usd: parsed.prize_pool_usd,
        prize_display: parsed.prize_display,
        start_at: new Date().toISOString(),
        deadline_at: deadlineIso,
        format: parsed.format,
        location: parsed.location,
        themes: parsed.themes,
        sources,
        primary_url: parsed.registration_url || raw.url,
        source_tweet_url:
          raw.tweetUrl ?? (raw.provider === "twitter" ? raw.url : null),
        image_url: null,
        oxakalabs_status: "SCOUTING",
        confidence_score: parsed.confidence_score,
        is_published: parsed.confidence_score >= 0.8,
        is_featured: (parsed.prize_pool_usd ?? 0) >= 50000,
      },
    };
  } catch {
    return heuristicNormalizeHackathon(raw);
  }
}
