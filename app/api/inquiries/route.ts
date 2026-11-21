import { NextResponse } from "next/server";
import { clientInquirySchema } from "@/lib/validators";
import { createClientInquiry, getClientInquiries } from "@/lib/db/repository";

export async function GET() {
  const inquiries = await getClientInquiries();
  return NextResponse.json({ inquiries });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = clientInquirySchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid inquiry payload";
      return NextResponse.json({ error: firstError, issues: parsed.error.issues }, { status: 400 });
    }

    const inquiry = await createClientInquiry({
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company ?? null,
      tier: parsed.data.tier,
      budget_range: parsed.data.budget_range ?? null,
      timeline: parsed.data.timeline ?? null,
      project_brief: parsed.data.project_brief,
    });

    // Optional Resend founder notification when RESEND_API_KEY is configured
    if (process.env.RESEND_API_KEY && process.env.FOUNDER_NOTIFICATION_EMAIL) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "G-Gravitator Systems <systems@ggravitator.com>",
          to: [process.env.FOUNDER_NOTIFICATION_EMAIL],
          subject: `[G-GRAVITATOR SYSTEMS] New ${inquiry.tier} Brief from ${inquiry.name}`,
          text: `Name: ${inquiry.name}\nEmail: ${inquiry.email}\nCompany: ${inquiry.company ?? "N/A"}\nTier: ${inquiry.tier}\nBudget: ${inquiry.budget_range ?? "N/A"}\nTimeline: ${inquiry.timeline ?? "N/A"}\n\nBrief:\n${inquiry.project_brief}`,
        }),
      }).catch(() => null);
    }

    return NextResponse.json({ ok: true, inquiry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to process B2B systems inquiry" },
      { status: 500 }
    );
  }
}
