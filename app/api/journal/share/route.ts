import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/admin-auth";
import { getDispatchById, getDispatchBySlug } from "@/lib/db/repository";
import {
  buildJournalShareUrls,
  buildSocialShareTargets,
  sanitizeShareText,
} from "@/lib/journal/share";
import {
  getRequestOriginFromRequest,
  signDispatchShareToken,
} from "@/lib/journal/share-token";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      slug?: string;
      id?: string;
    };

    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!slug && !id) {
      return NextResponse.json(
        { error: "Provide a journal dispatch slug or id." },
        { status: 400 }
      );
    }

    const dispatch = id
      ? await getDispatchById(id)
      : await getDispatchBySlug(slug, { includeUnpublished: true });

    if (!dispatch) {
      return NextResponse.json({ error: "Dispatch not found." }, { status: 404 });
    }

    const isUnpublished = dispatch.is_published === false;
    let shareToken: string | null = null;

    if (isUnpublished) {
      const admin = await getAuthenticatedAdmin();
      if (!admin) {
        return NextResponse.json({ error: "Dispatch not found." }, { status: 404 });
      }
      shareToken = signDispatchShareToken(dispatch);
    }

    const origin = getRequestOriginFromRequest(request);
    const urls = buildJournalShareUrls({
      dispatch,
      origin,
      shareToken,
    });

    const cleanTitle = sanitizeShareText(dispatch.title);
    const cleanSubtitle = sanitizeShareText(dispatch.subtitle);
    const socialTargets = buildSocialShareTargets({
      url: urls.shareUrl,
      title: cleanTitle,
      subtitle: cleanSubtitle,
      issueNumber: dispatch.issue_number,
    });

    return NextResponse.json({
      ok: true,
      ...urls,
      socialTargets,
      preview: {
        issueNumber: dispatch.issue_number,
        category: dispatch.category,
        title: cleanTitle,
        description: cleanSubtitle,
        authorName: dispatch.author_name,
        readingTimeMins: dispatch.reading_time_mins,
        coverImageUrl: dispatch.cover_image_url ?? null,
        ogImageUrl: urls.ogImageUrl,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not generate journal share link." },
      { status: 500 }
    );
  }
}
