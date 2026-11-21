import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { runNewsIngestionPipeline } from "@/lib/ingestion/news";

export const maxDuration = 60;

async function isAuthorizedCronOrAdmin(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  const cookieStore = await cookies();
  if (cookieStore.get("gg_admin_session")?.value === "authenticated") {
    return true;
  }
  if (!cronSecret) return true;
  return false;
}

export async function POST(request: Request) {
  if (!(await isAuthorizedCronOrAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
  }
  const report = await runNewsIngestionPipeline();
  return NextResponse.json({ ok: true, report });
}

export async function GET(request: Request) {
  return POST(request);
}
