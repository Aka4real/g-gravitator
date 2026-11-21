import { NextResponse } from "next/server";
import { getHackathons } from "@/lib/db/repository";
import type { HackathonFormat, HackathonProvider } from "@/lib/supabase/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = (searchParams.get("source") ?? "all") as HackathonProvider | "all";
  const format = (searchParams.get("format") ?? "ALL") as HackathonFormat | "ALL";
  const theme = searchParams.get("theme") ?? "ALL";
  const sort = (searchParams.get("sort") ?? "closing_soon") as
    | "closing_soon"
    | "prize_pool"
    | "newest"
    | "oxakalabs";
  const q = searchParams.get("q") ?? "";
  const includeExpired = searchParams.get("includeExpired") === "true";

  const { items, lastSyncAt } = await getHackathons({
    source,
    format,
    theme,
    sort,
    q,
    includeExpired,
  });

  return NextResponse.json(
    { hackathons: items, lastSyncAt, count: items.length },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
