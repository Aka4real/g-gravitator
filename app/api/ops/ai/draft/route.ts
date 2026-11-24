import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/admin-auth";
import { appendAuditLog } from "@/lib/db/repository";
import { generateStructuredPostDraft, type DraftEntityType } from "@/lib/ops/draft";

export const maxDuration = 60;

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      entity?: DraftEntityType;
      topic?: string;
      accentColor?: string;
      generateCover?: boolean;
    };

    const entity: DraftEntityType =
      body.entity === "news" || body.entity === "hackathon" ? body.entity : "dispatch";
    const topic = (body.topic || "").trim();
    if (!topic) {
      return NextResponse.json(
        { error: "Provide a topic or brief for AI drafting." },
        { status: 400 }
      );
    }

    const result = await generateStructuredPostDraft({
      entity,
      topic,
      accentColor: body.accentColor,
      generateCover: body.generateCover,
      createdBy: "admin",
    });

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
      ...result,
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
