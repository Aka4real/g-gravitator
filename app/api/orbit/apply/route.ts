import { NextResponse } from "next/server";
import { orbitApplicationSchema } from "@/lib/validators";
import { createOrbitApplication, getOrbitApplications } from "@/lib/db/repository";

export async function GET() {
  const applications = await getOrbitApplications();
  return NextResponse.json({ applications });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = orbitApplicationSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid Orbit application";
      return NextResponse.json({ error: firstError, issues: parsed.error.issues }, { status: 400 });
    }

    const application = await createOrbitApplication({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      track: parsed.data.track,
      portfolio_url: parsed.data.portfolio_url || null,
      proof_of_work: parsed.data.proof_of_work || null,
    });

    return NextResponse.json({ ok: true, application }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit Orbit cohort application" },
      { status: 500 }
    );
  }
}
