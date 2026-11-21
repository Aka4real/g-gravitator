import { NextResponse } from "next/server";
import { getNewsItems } from "@/lib/db/repository";
import type { NewsCategory } from "@/lib/supabase/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get("category") ?? "ALL") as NewsCategory | "ALL";
  const q = searchParams.get("q") ?? "";

  const { items, lastSyncAt } = await getNewsItems({ category, q });
  return NextResponse.json({ news: items, lastSyncAt, count: items.length });
}
