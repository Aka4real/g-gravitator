import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminCurateSchema } from "@/lib/validators";
import {
  updateClientInquiryStatus,
  updateHackathonAdmin,
  updateNewsItemAdmin,
} from "@/lib/db/repository";

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get("gg_admin_session")?.value === "authenticated";
  if (!isAuthed) {
    return NextResponse.json({ error: "Admin session required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = adminCurateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid curation payload" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (data.entity === "hackathon") {
      const updated = await updateHackathonAdmin(data.id, {
        ...(data.is_published !== undefined ? { is_published: data.is_published } : {}),
        ...(data.is_featured !== undefined ? { is_featured: data.is_featured } : {}),
        ...(data.oxakalabs_status !== undefined
          ? { oxakalabs_status: data.oxakalabs_status }
          : {}),
      });
      return NextResponse.json({ ok: true, hackathon: updated });
    }

    if (data.entity === "news") {
      const updated = await updateNewsItemAdmin(data.id, {
        ...(data.is_pinned !== undefined ? { is_pinned: data.is_pinned } : {}),
        ...(data.is_published !== undefined ? { is_published: data.is_published } : {}),
      });
      return NextResponse.json({ ok: true, newsItem: updated });
    }

    if (data.entity === "inquiry") {
      const updated = await updateClientInquiryStatus(data.id, data.status);
      return NextResponse.json({ ok: true, inquiry: updated });
    }

    return NextResponse.json({ error: "Unknown entity" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to apply admin mutation" }, { status: 500 });
  }
}
