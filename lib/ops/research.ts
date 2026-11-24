import {
  buildThinkingConfigForModel,
  GEMINI_MAX_PERMISSION_SAFETY_SETTINGS,
  getGeminiBetaClient,
  getOrderedGeminiModels,
  isAuthGeminiError,
} from "@/lib/gemini/client";

export interface ResearchFinding {
  title: string;
  url: string;
  source: string;
  snippet: string;
  published_at?: string;
}

export function validateSafePublicUrl(rawUrl: string): URL {
  const parsed = new URL(rawUrl.trim());
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are permitted.");
  }

  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "::1" ||
    host === "[::1]"
  ) {
    throw new Error("Local or internal hostnames are blocked.");
  }

  // Block private IPv4 ranges
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    ) {
      throw new Error("Private network IP addresses are blocked.");
    }
  }

  return parsed;
}

async function searchHackerNews(query: string): Promise<ResearchFinding[]> {
  try {
    const res = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=6`,
      { signal: AbortSignal.timeout(5500) }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      hits?: {
        title?: string;
        url?: string;
        objectID?: string;
        points?: number;
        created_at?: string;
      }[];
    };
    return (data.hits ?? [])
      .filter((h) => h.title)
      .map((h) => ({
        title: h.title!,
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        source: "Hacker News",
        snippet: `HN discussion (${h.points ?? 0} points)`,
        published_at: h.created_at,
      }));
  } catch {
    return [];
  }
}

async function searchArxiv(query: string): Promise<ResearchFinding[]> {
  try {
    const res = await fetch(
      `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&sortBy=submittedDate&sortOrder=descending&max_results=5`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return [];
    const xml = await res.text();
    const entries = xml.split("<entry>").slice(1, 6);
    const items: ResearchFinding[] = [];
    for (const entry of entries) {
      const title = entry
        .match(/<title>([\s\S]*?)<\/title>/)?.[1]
        ?.replace(/\s+/g, " ")
        .trim();
      const summary = entry
        .match(/<summary>([\s\S]*?)<\/summary>/)?.[1]
        ?.replace(/\s+/g, " ")
        .trim();
      const url = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1]?.trim();
      const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.trim();
      if (title && url) {
        items.push({
          title,
          url,
          source: "arXiv",
          snippet: (summary || "").slice(0, 260),
          published_at: published,
        });
      }
    }
    return items;
  } catch {
    return [];
  }
}

async function searchDevpost(query: string): Promise<ResearchFinding[]> {
  try {
    const res = await fetch(
      `https://devpost.com/api/hackathons?search=${encodeURIComponent(query)}&status[]=upcoming&status[]=open&per_page=5`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 G-Gravitator-Research/1.0",
        },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      hackathons?: {
        title?: string;
        url?: string;
        organization_name?: string;
        prize_amount?: string;
        submission_period_dates?: string;
      }[];
    };
    return (data.hackathons ?? [])
      .filter((h) => h.title && h.url)
      .map((h) => ({
        title: h.title!,
        url: h.url!,
        source: "Devpost",
        snippet: `Organizer: ${h.organization_name ?? "Devpost"} · Prize: ${(h.prize_amount || "TBA").replace(/<[^>]+>/g, "")} · Window: ${h.submission_period_dates ?? "Open"}`,
      }));
  } catch {
    return [];
  }
}

async function searchWikipedia(query: string): Promise<ResearchFinding[]> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=4&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      query?: { search?: { title: string; snippet: string }[] };
    };
    return (data.query?.search ?? []).map((item) => ({
      title: item.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, "_"))}`,
      source: "Wikipedia",
      snippet: item.snippet.replace(/<[^>]+>/g, "").trim(),
    }));
  } catch {
    return [];
  }
}

async function searchGeminiGrounded(query: string): Promise<{
  summary: string | null;
  findings: ResearchFinding[];
}> {
  const ai = getGeminiBetaClient();
  if (!ai) return { summary: null, findings: [] };

  const models = getOrderedGeminiModels().slice(0, 3);
  for (const model of models) {
    try {
      const thinkingConfig = buildThinkingConfigForModel(model, "low");
      const res = await ai.models.generateContent({
        model,
        contents: `Research the latest factual information for: ${query}. Provide a concise factual engineering brief with concrete dates, versions, and key facts.`,
        config: {
          abortSignal: AbortSignal.timeout(12_000),
          safetySettings: GEMINI_MAX_PERMISSION_SAFETY_SETTINGS,
          ...(thinkingConfig ? { thinkingConfig } : {}),
          tools: [{ googleSearch: {} }],
        },
      });
      const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const findings: ResearchFinding[] = chunks
        .filter((c) => c.web?.uri)
        .slice(0, 6)
        .map((c) => ({
          title: c.web?.title || c.web?.uri || "Web result",
          url: c.web!.uri!,
          source: "Google Search Grounding",
          snippet: "Verified web grounding citation.",
        }));
      return {
        summary: res.text?.trim() || null,
        findings,
      };
    } catch (error) {
      console.warn(
        `[ops:research] ${model} grounded search failed: ${
          error instanceof Error ? error.message.slice(0, 140) : String(error)
        }`
      );
      if (isAuthGeminiError(error)) {
        return { summary: null, findings: [] };
      }
    }
  }

  return { summary: null, findings: [] };
}

export async function runLiveWebResearch(
  query: string,
  sources?: string[]
): Promise<{
  query: string;
  groundedSummary: string | null;
  findings: ResearchFinding[];
}> {
  const wanted = new Set(
    (sources && sources.length > 0
      ? sources
      : ["hackernews", "arxiv", "devpost", "wikipedia", "google"]
    ).map((s) => s.toLowerCase())
  );

  const tasks: Promise<unknown>[] = [];
  const findings: ResearchFinding[] = [];
  let groundedSummary: string | null = null;

  if (wanted.has("hackernews") || wanted.has("hn")) {
    tasks.push(searchHackerNews(query).then((r) => findings.push(...r)));
  }
  if (wanted.has("arxiv")) {
    tasks.push(searchArxiv(query).then((r) => findings.push(...r)));
  }
  if (wanted.has("devpost") || wanted.has("hackathons")) {
    tasks.push(searchDevpost(query).then((r) => findings.push(...r)));
  }
  if (wanted.has("wikipedia") || wanted.has("web")) {
    tasks.push(searchWikipedia(query).then((r) => findings.push(...r)));
  }
  if (wanted.has("google") || wanted.has("web")) {
    tasks.push(
      searchGeminiGrounded(query).then((r) => {
        if (r.summary) groundedSummary = r.summary;
        findings.push(...r.findings);
      })
    );
  }

  await Promise.allSettled(tasks);

  // Deduplicate by URL
  const seen = new Set<string>();
  const deduped = findings.filter((f) => {
    if (seen.has(f.url)) return false;
    seen.add(f.url);
    return true;
  });

  return {
    query,
    groundedSummary,
    findings: deduped.slice(0, 20),
  };
}

export async function fetchWebpageMetadata(rawUrl: string): Promise<{
  url: string;
  title: string;
  description: string;
  imageUrl: string | null;
  links: { label: string; url: string }[];
  excerpt: string;
}> {
  const parsed = validateSafePublicUrl(rawUrl);
  const res = await fetch(parsed.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 G-Gravitator-Research/1.0",
      Accept: "text/html,application/xhtml+xml,text/plain;q=0.9",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} while fetching ${parsed.toString()}`);
  }

  const contentType = res.headers.get("content-type") || "";
  const rawBody = await res.text();

  if (!contentType.includes("html")) {
    return {
      url: parsed.toString(),
      title: parsed.hostname,
      description: "",
      imageUrl: null,
      links: [],
      excerpt: rawBody.slice(0, 4000),
    };
  }

  const title =
    rawBody.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    rawBody.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ") ||
    parsed.hostname;

  const description =
    rawBody.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    rawBody.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    "";

  const rawImage =
    rawBody.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    rawBody.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    null;

  let imageUrl: string | null = null;
  if (rawImage) {
    try {
      imageUrl = new URL(rawImage, parsed).toString();
    } catch {
      imageUrl = null;
    }
  }

  const linkMatches = [...rawBody.matchAll(/<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const links: { label: string; url: string }[] = [];
  const seenLinks = new Set<string>();
  for (const m of linkMatches) {
    const href = m[1];
    const label = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!href || !label || label.length < 3 || seenLinks.has(href)) continue;
    seenLinks.add(href);
    links.push({ label: label.slice(0, 80), url: href });
    if (links.length >= 12) break;
  }

  const cleanedText = rawBody
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);

  return {
    url: parsed.toString(),
    title: title.trim(),
    description: description.trim(),
    imageUrl,
    links,
    excerpt: cleanedText,
  };
}
