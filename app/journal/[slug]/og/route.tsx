import { getAuthenticatedAdmin } from "@/lib/auth/admin-auth";
import { renderJournalOgPngBuffer } from "@/lib/brand/journal-og";
import { getDispatchBySlug } from "@/lib/db/repository";
import { verifyDispatchShareToken } from "@/lib/journal/share-token";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  const shareToken = searchParams.get("share");

  const dispatch = await getDispatchBySlug(slug, { includeUnpublished: true });

  if (!dispatch) {
    const fallbackPng = await renderJournalOgPngBuffer(null);
    return new Response(new Uint8Array(fallbackPng), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const isUnpublished = dispatch.is_published === false;
  if (isUnpublished) {
    const validShare = verifyDispatchShareToken(shareToken, dispatch);
    const admin = validShare ? null : await getAuthenticatedAdmin();
    if (!validShare && !admin) {
      const fallbackPng = await renderJournalOgPngBuffer(null);
      return new Response(new Uint8Array(fallbackPng), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "private, no-store, max-age=0",
          "X-Robots-Tag": "noindex, nofollow",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const draftPng = await renderJournalOgPngBuffer(dispatch);
    return new Response(new Uint8Array(draftPng), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const png = await renderJournalOgPngBuffer(dispatch);
  return new Response(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
