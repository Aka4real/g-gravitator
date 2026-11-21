import type { RawHackathonCandidate } from "@/lib/ingestion/hackathons/normalize";

export const MONITORED_X_ACCOUNTS = [
  "devpost",
  "DoraHacks",
  "lablabai",
  "cerebral_valley",
  "MLHacks",
  "devfolio",
  "ETHGlobal",
  "GoogleAI",
  "AnthropicAI",
  "OpenAIDevs",
  "vercel",
  "supabase",
];

export const X_SEARCH_OPERATOR_QUERY =
  '("hackathon" OR "buildathon") ("AI" OR "agents" OR "LLM" OR "prize" OR "$") (apply OR register OR lu.ma OR devpost OR dorahacks) -is:retweet lang:en';

export function isTwitterUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname === "x.com" ||
      u.hostname === "www.x.com" ||
      u.hostname === "twitter.com" ||
      u.hostname === "www.twitter.com"
    );
  } catch {
    return false;
  }
}

export function extractTweetIdFromUrl(url: string): string | null {
  const match = url.match(/status\/(\d{10,25})/);
  return match ? match[1] : null;
}

/**
 * Zero-Key Public Tweet & Web URL Resolver:
 * Uses X's public Syndication JSON & oEmbed endpoints when an x.com URL is submitted,
 * or fetches OpenGraph metadata for standard hackathon landing pages.
 */
export async function resolvePublicUrlOrTweet(
  url: string,
  rawContext?: string
): Promise<RawHackathonCandidate> {
  const isX = isTwitterUrl(url);
  if (isX) {
    const tweetId = extractTweetIdFromUrl(url);
    const authorMatch = url.match(/(?:x\.com|twitter\.com)\/([A-Za-z0-9_]+)\/status/);
    const authorHandle = authorMatch ? `@${authorMatch[1]}` : "@XBuilderSignal";

    if (tweetId) {
      try {
        const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=a`;
        const res = await fetch(syndicationUrl, {
          headers: { "User-Agent": "Mozilla/5.0 G-Gravitator-Radar/1.0" },
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            text?: string;
            user?: { name?: string; screen_name?: string };
            entities?: { urls?: { expanded_url?: string }[] };
          };
          const expandedUrl =
            data.entities?.urls?.find(
              (u) =>
                u.expanded_url &&
                !u.expanded_url.includes("twitter.com") &&
                !u.expanded_url.includes("x.com")
            )?.expanded_url || url;

          const text = `${data.text || ""} ${rawContext || ""}`.trim();
          const orgName = data.user?.name
            ? `${data.user.name} (@${data.user.screen_name})`
            : authorHandle;

          return {
            provider: "twitter",
            rawText:
              text ||
              `AI & Agentic Hackathon announced on X by ${orgName}. Register via ${expandedUrl}`,
            organizerHint: orgName,
            url: expandedUrl,
            tweetUrl: url,
          };
        }
      } catch {
        // Fallback to oEmbed or rawContext below
      }
    }

    // Secondary Zero-Key Fallback: publish.twitter.com/oembed
    try {
      const oembedRes = await fetch(
        `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (oembedRes.ok) {
        const oembed = (await oembedRes.json()) as {
          author_name?: string;
          html?: string;
        };
        const plainText = (oembed.html || "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        return {
          provider: "twitter",
          rawText: `${plainText} ${rawContext || ""}`.trim(),
          organizerHint: oembed.author_name || authorHandle,
          url,
          tweetUrl: url,
        };
      }
    } catch {
      // Fallback to rawContext / URL metadata
    }

    return {
      provider: "twitter",
      rawText:
        rawContext && rawContext.trim().length > 10
          ? rawContext.trim()
          : `Breaking AI Hackathon & Builder Bounty announced on X by ${authorHandle}. Open for builder registrations and prize submissions.`,
      organizerHint: authorHandle,
      url,
      tweetUrl: url,
    };
  }

  // Standard Web URL (Devpost, Luma, DoraHacks, Lablab, etc.)
  let detectedProvider: RawHackathonCandidate["provider"] = "devpost";
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("dorahacks")) detectedProvider = "dorahacks";
  else if (lowerUrl.includes("lablab")) detectedProvider = "lablab";
  else if (lowerUrl.includes("lu.ma") || lowerUrl.includes("luma")) detectedProvider = "luma";
  else if (lowerUrl.includes("mlh.io")) detectedProvider = "mlh";
  else if (lowerUrl.includes("devfolio")) detectedProvider = "devfolio";
  else if (lowerUrl.includes("ethglobal")) detectedProvider = "ethglobal";
  else if (lowerUrl.includes("kaggle")) detectedProvider = "kaggle";
  else if (lowerUrl.includes("unstop")) detectedProvider = "unstop";

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 G-Gravitator-Radar/1.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const html = await res.text();
      const titleMatch =
        html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descMatch =
        html.match(
          /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
        ) ||
        html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);

      const titleHint = titleMatch?.[1]?.trim();
      const desc = descMatch?.[1]?.trim() || "";

      return {
        provider: detectedProvider,
        titleHint,
        rawText: `${titleHint ?? ""} ${desc} ${rawContext ?? ""}`.trim(),
        url,
      };
    }
  } catch {
    // Use rawContext fallback
  }

  return {
    provider: detectedProvider,
    rawText:
      rawContext && rawContext.trim().length > 10
        ? rawContext.trim()
        : `Global AI & Software Engineering Hackathon listed on ${detectedProvider.toUpperCase()} (${url}).`,
    url,
  };
}

/**
 * Scheduled X (Twitter) Hackathon Discovery Adapter
 * Supports:
 * 1. Primary Mode ("x_api"): Official X API v2 Recent Search when X_BEARER_TOKEN is set
 * 2. Fallback Mode ("search_api"): Tavily Search API (site:x.com) when TAVILY_API_KEY is set
 */
export async function fetchTwitterHackathonSignals(): Promise<RawHackathonCandidate[]> {
  const bearer = process.env.X_BEARER_TOKEN;

  // Mode 1: X API v2 Recent Search
  if (bearer) {
    try {
      const endpoint = new URL("https://api.twitter.com/2/tweets/search/recent");
      endpoint.searchParams.set("query", X_SEARCH_OPERATOR_QUERY);
      endpoint.searchParams.set("max_results", "20");
      endpoint.searchParams.set("tweet.fields", "created_at,entities,author_id,text");

      const res = await fetch(endpoint.toString(), {
        headers: { Authorization: `Bearer ${bearer}` },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const payload = (await res.json()) as {
          data?: {
            id: string;
            text: string;
            entities?: { urls?: { expanded_url?: string }[] };
          }[];
        };

        return (payload.data ?? []).slice(0, 15).map((tweet) => {
          const tweetUrl = `https://x.com/i/web/status/${tweet.id}`;
          const externalUrl =
            tweet.entities?.urls?.find(
              (u) =>
                u.expanded_url &&
                !u.expanded_url.includes("twitter.com") &&
                !u.expanded_url.includes("x.com")
            )?.expanded_url || tweetUrl;

          return {
            provider: "twitter",
            rawText: tweet.text,
            url: externalUrl,
            tweetUrl,
          };
        });
      }
    } catch {
      // Fall through to search_api or graceful empty
    }
  }

  // Mode 2: Tavily Search API fallback for site:x.com
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (tavilyKey) {
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: "site:x.com AI hackathon buildathon prize register 2026",
          max_results: 10,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          results?: { title: string; url: string; content: string }[];
        };
        return (data.results ?? []).map((item) => ({
          provider: "twitter",
          titleHint: item.title,
          rawText: item.content,
          url: item.url,
          tweetUrl: isTwitterUrl(item.url) ? item.url : null,
        }));
      }
    } catch {
      // Graceful fallback
    }
  }

  return [];
}
