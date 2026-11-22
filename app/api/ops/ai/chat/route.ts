import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/admin-auth";
import { runAdminAiAssistant, type AgentChatMessage } from "@/lib/ops/ai-agent";

export const maxDuration = 60;

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      messages?: AgentChatMessage[];
    };
    const messages = Array.isArray(body.messages)
      ? body.messages.filter(
          (m) =>
            m &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.trim().length > 0
        )
      : [];

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "Provide at least one message." },
        { status: 400 }
      );
    }

    const result = await runAdminAiAssistant({
      messages,
      actorLabel: admin.email,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "AI Assistant execution failed.",
      },
      { status: 500 }
    );
  }
}
