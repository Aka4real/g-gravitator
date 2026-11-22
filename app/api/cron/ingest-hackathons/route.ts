import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/admin-auth";
import { runHackathonIngestionPipeline } from "@/lib/ingestion/hackathons";

export const maxDuration = 60;

async function isAuthorizedCronOrAdmin(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  const admin = await getAuthenticatedAdmin();
  if (admin) {
    return true;
  }
  if (!cronSecret && process.env.NODE_ENV !== "production") return true;
  return false;
}

export async function POST(request: Request) {
  if (!(await isAuthorizedCronOrAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
  }

  const report = await runHackathonIngestionPipeline();
  return NextResponse.json({ ok: true, report });
}

export async function GET(request: Request) {
  return POST(request);
}
