import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { passcode?: string; action?: string };
    const cookieStore = await cookies();

    if (body.action === "logout") {
      cookieStore.delete("gg_admin_session");
      return NextResponse.json({ ok: true, authenticated: false });
    }

    const expected = process.env.ADMIN_PASSCODE || "GG-ORBIT-2026";
    if (body.passcode && body.passcode.trim() === expected) {
      cookieStore.set("gg_admin_session", "authenticated", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return NextResponse.json({ ok: true, authenticated: true });
    }

    return NextResponse.json(
      { error: "Invalid founder security clearance passcode." },
      { status: 401 }
    );
  } catch {
    return NextResponse.json({ error: "Authentication error" }, { status: 500 });
  }
}
