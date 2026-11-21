import { NextResponse } from "next/server";
import { newsletterSubscribeSchema } from "@/lib/validators";
import { createNewsletterSubscriber } from "@/lib/db/repository";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = newsletterSubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid email address" },
        { status: 400 }
      );
    }

    const subscriber = await createNewsletterSubscriber({
      email: parsed.data.email,
      source: parsed.data.source,
    });

    return NextResponse.json({ ok: true, subscriber }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to register newsletter subscription" },
      { status: 500 }
    );
  }
}
