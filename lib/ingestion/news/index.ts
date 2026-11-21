import {
  synthesizeNewsCandidate,
  type RawNewsCandidate,
} from "@/lib/ingestion/news/synthesize";
import { upsertNewsItems } from "@/lib/db/repository";

interface HnHit {
  title?: string;
  url?: string;
  points?: number;
  created_at?: string;
  objectID?: string;
}

async function fetchHackerNewsAiSignals(): Promise<RawNewsCandidate[]> {
  try {
    const res = await fetch(
      "https://hn.algolia.com/api/v1/search?query=AI+LLM+agent&tags=story&numericFilters=points>100&hitsPerPage=8",
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { hits?: HnHit[] };
    return (data.hits ?? [])
      .filter((h) => h.title && (h.url || h.objectID))
      .slice(0, 6)
      .map((hit) => ({
        title: hit.title!,
        sourceName: "Hacker News",
        sourceUrl:
          hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        publishedAt: hit.created_at,
        pointsHint: hit.points,
      }));
  } catch {
    return [];
  }
}

async function fetchArxivAiPapers(): Promise<RawNewsCandidate[]> {
  try {
    const res = await fetch(
      "https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.CL&sortBy=submittedDate&sortOrder=descending&max_results=4",
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return [];
    const xml = await res.text();
    const entries = xml.split("<entry>").slice(1, 5);

    const results: RawNewsCandidate[] = [];
    for (const entry of entries) {
      const title = entry
        .match(/<title>([\s\S]*?)<\/title>/)?.[1]
        ?.replace(/\s+/g, " ")
        .trim();
      const summary = entry
        .match(/<summary>([\s\S]*?)<\/summary>/)?.[1]
        ?.replace(/\s+/g, " ")
        .trim();
      const idUrl = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1]?.trim();
      const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.trim();

      if (title && idUrl) {
        results.push({
          title,
          sourceName: "arXiv cs.AI",
          sourceUrl: idUrl,
          rawSummary: summary,
          publishedAt: published,
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

export async function runNewsIngestionPipeline(): Promise<{
  fetchedRaw: number;
  inserted: number;
  total: number;
  sources: Record<string, string>;
}> {
  const sources: Record<string, string> = {};
  const [hnRes, arxivRes] = await Promise.allSettled([
    fetchHackerNewsAiSignals(),
    fetchArxivAiPapers(),
  ]);

  const rawList: RawNewsCandidate[] = [];
  if (hnRes.status === "fulfilled") {
    rawList.push(...hnRes.value);
    sources.hacker_news = `OK (${hnRes.value.length} items)`;
  } else {
    sources.hacker_news = "DEGRADED";
  }

  if (arxivRes.status === "fulfilled") {
    rawList.push(...arxivRes.value);
    sources.arxiv = `OK (${arxivRes.value.length} papers)`;
  } else {
    sources.arxiv = "DEGRADED";
  }

  // Enforce strict batch cap of 40 news items per cron run (Cost Control Rule 6.4)
  const capped = rawList.slice(0, 40);
  const synthesized = [];

  for (const item of capped) {
    const record = await synthesizeNewsCandidate(item);
    synthesized.push(record);
  }

  const stats = await upsertNewsItems(synthesized);
  return {
    fetchedRaw: capped.length,
    ...stats,
    sources,
  };
}
