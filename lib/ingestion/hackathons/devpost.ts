import type { RawHackathonCandidate } from "@/lib/ingestion/hackathons/normalize";

interface DevpostApiHackathon {
  id?: number;
  title?: string;
  organization_name?: string;
  url?: string;
  prize_amount?: string;
  submission_period_dates?: string;
  displayed_location?: { location?: string };
  themes?: { name?: string }[];
  online?: boolean;
}

export async function fetchDevpostHackathons(): Promise<RawHackathonCandidate[]> {
  try {
    const res = await fetch(
      "https://devpost.com/api/hackathons?status[]=upcoming&status[]=open&per_page=12",
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 G-Gravitator-Radar/1.0",
        },
        signal: AbortSignal.timeout(7000),
      }
    );

    if (!res.ok) return [];
    const data = (await res.json()) as { hackathons?: DevpostApiHackathon[] };
    const list = data.hackathons ?? [];

    return list.slice(0, 12).map((item) => {
      const cleanPrize = (item.prize_amount || "")
        .replace(/<[^>]+>/g, "")
        .trim();
      const themes = (item.themes ?? [])
        .map((t) => t.name || "")
        .filter(Boolean);
      const loc = item.displayed_location?.location || "Online";
      const isOnline = item.online || /online|remote/i.test(loc);

      return {
        provider: "devpost",
        titleHint: item.title || "Devpost Global Hackathon",
        organizerHint: item.organization_name || "Devpost",
        url: item.url || "https://devpost.com/hackathons",
        prizeHint: cleanPrize || "$25,000",
        formatHint: isOnline ? "ONLINE" : "IN_PERSON",
        locationHint: isOnline ? "Global / Remote" : loc,
        themesHint: themes.length > 0 ? themes : ["AI", "SaaS / Web"],
        rawText: `${item.title ?? ""} organized by ${
          item.organization_name ?? "Devpost"
        }. Prize pool: ${cleanPrize}. Submission window: ${
          item.submission_period_dates ?? "Open now"
        }. Themes: ${themes.join(", ")}.`,
      };
    });
  } catch {
    return [];
  }
}
