import { getAuthenticatedAdmin } from "@/lib/auth/admin-auth";
import {
  renderJournalOgImage,
  type RenderedJournalOgImage,
} from "@/lib/brand/journal-og";
import { getDispatchBySlug } from "@/lib/db/repository";
import { verifyDispatchShareToken } from "@/lib/journal/share-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildImageHeaders(
  image: RenderedJournalOgImage,
  extra: Record<string, string>
): Record<string, string> {
  const ext = image.contentType === "image/jpeg" ? "jpg" : "png";
  return {
    "Content-Type": image.contentType,
    "Content-Length": String(image.buffer.byteLength),
    "Content-Disposition": `inline; filename="ggravitator-share-card.${ext}"`,
    "X-Content-Type-Options": "nosniff",
    ...extra,
  };
}

async function resolveOgResponse(
  request: Request,
  context: { params: Promise<{ slug: string }> },
  headOnly: boolean
): Promise<Response> {
  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  const shareToken = searchParams.get("share");

  const dispatch = await getDispatchBySlug(slug, { includeUnpublished: true });

  if (!dispatch) {
    const fallback = await renderJournalOgImage(null);
    return new Response(headOnly ? null : new Uint8Array(fallback.buffer), {
      status: 200,
      headers: buildImageHeaders(fallback, {
        "Cache-Control": "public, max-age=300",
      }),
    });
  }

  const isUnpublished = dispatch.is_published === false;
  if (isUnpublished) {
    const validShare = verifyDispatchShareToken(shareToken, dispatch);
    const admin = validShare ? null : await getAuthenticatedAdmin();
    if (!validShare && !admin) {
      const fallback = await renderJournalOgImage(null);
      return new Response(headOnly ? null : new Uint8Array(fallback.buffer), {
        status: 200,
        headers: buildImageHeaders(fallback, {
          "Cache-Control": "private, no-store, max-age=0",
          "X-Robots-Tag": "noindex, nofollow",
        }),
      });
    }

    const draftImage = await renderJournalOgImage(dispatch);
    return new Response(headOnly ? null : new Uint8Array(draftImage.buffer), {
      status: 200,
      headers: buildImageHeaders(draftImage, {
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
      }),
    });
  }

  const image = await renderJournalOgImage(dispatch);
  return new Response(headOnly ? null : new Uint8Array(image.buffer), {
    status: 200,
    headers: buildImageHeaders(image, {
      "Cache-Control":
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    }),
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  return resolveOgResponse(request, context, false);
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  return resolveOgResponse(request, context, true);
}
