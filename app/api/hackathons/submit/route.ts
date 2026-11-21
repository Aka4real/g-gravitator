import { NextResponse } from "next/server";
import { hackathonSubmitUrlSchema } from "@/lib/validators";
import { submitAndVerifyHackathonUrl } from "@/lib/ingestion/hackathons";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = hackathonSubmitUrlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid hackathon or X URL" },
        { status: 400 }
      );
    }

    const result = await submitAndVerifyHackathonUrl({
      url: parsed.data.url,
      rawContext: parsed.data.raw_context,
    });

    if (!result.accepted) {
      return NextResponse.json(
        {
          ok: false,
          error: result.reason,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        candidate: result.candidate,
        stats: result.stats,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to process hackathon / X URL submission" },
      { status: 500 }
    );
  }
}
