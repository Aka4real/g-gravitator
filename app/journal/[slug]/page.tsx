import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DispatchReaderClient } from "@/components/journal/DispatchReaderClient";
import { getAuthenticatedAdmin } from "@/lib/auth/admin-auth";
import { BRAND } from "@/lib/brand/mark";
import { getDispatchBySlug, getDispatches } from "@/lib/db/repository";
import {
  buildJournalShareUrls,
  sanitizeShareText,
} from "@/lib/journal/share";
import {
  getRequestOrigin,
  signDispatchShareToken,
  verifyDispatchShareToken,
} from "@/lib/journal/share-token";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ share?: string }>;
}): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const dispatch = await getDispatchBySlug(slug, { includeUnpublished: true });
  if (!dispatch) {
    return { title: "Dispatch Not Found | G-Gravitator Journal" };
  }

  const origin = await getRequestOrigin();
  const cleanTitle = sanitizeShareText(dispatch.title);
  const cleanDescription = sanitizeShareText(dispatch.subtitle);
  const imageAlt = `${cleanTitle} | ${BRAND.name} Journal`;

  if (dispatch.is_published === false) {
    const validShareToken = verifyDispatchShareToken(sp.share, dispatch)
      ? sp.share!.trim()
      : null;
    const admin = validShareToken ? null : await getAuthenticatedAdmin();

    if (!validShareToken && !admin) {
      return {
        title: "Dispatch Not Found | G-Gravitator Journal",
        robots: { index: false, follow: false },
      };
    }

    const effectiveToken = validShareToken || signDispatchShareToken(dispatch);
    const urls = buildJournalShareUrls({
      dispatch,
      origin,
      shareToken: effectiveToken,
    });

    return {
      title: admin
        ? `[Admin Preview] Issue ${dispatch.issue_number}: ${cleanTitle}`
        : `Issue ${dispatch.issue_number}: ${cleanTitle}`,
      description: cleanDescription,
      robots: { index: false, follow: false, nocache: true },
      openGraph: {
        title: cleanTitle,
        description: cleanDescription,
        url: urls.shareUrl,
        siteName: BRAND.name,
        locale: "en_US",
        type: "article",
        publishedTime: dispatch.published_at,
        modifiedTime: dispatch.updated_at,
        authors: [dispatch.author_name],
        section: dispatch.category,
        tags: dispatch.tags,
        images: [
          {
            url: urls.ogImageUrl,
            secureUrl: urls.ogImageUrl.startsWith("https://")
              ? urls.ogImageUrl
              : undefined,
            width: 1200,
            height: 630,
            alt: imageAlt,
            type: "image/png",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: cleanTitle,
        description: cleanDescription,
        images: [
          {
            url: urls.ogImageUrl,
            width: 1200,
            height: 630,
            alt: imageAlt,
          },
        ],
      },
    };
  }

  const urls = buildJournalShareUrls({ dispatch, origin });

  return {
    title: `Issue ${dispatch.issue_number}: ${cleanTitle}`,
    description: cleanDescription,
    alternates: {
      canonical: urls.canonicalUrl,
    },
    openGraph: {
      title: cleanTitle,
      description: cleanDescription,
      url: urls.canonicalUrl,
      siteName: BRAND.name,
      locale: "en_US",
      type: "article",
      publishedTime: dispatch.published_at,
      modifiedTime: dispatch.updated_at,
      authors: [dispatch.author_name],
      section: dispatch.category,
      tags: dispatch.tags,
      images: [
        {
          url: urls.ogImageUrl,
          secureUrl: urls.ogImageUrl.startsWith("https://")
            ? urls.ogImageUrl
            : undefined,
          width: 1200,
          height: 630,
          alt: imageAlt,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: cleanTitle,
      description: cleanDescription,
      images: [
        {
          url: urls.ogImageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
  };
}

export default async function DispatchArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ share?: string }>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const [dispatch, allDispatches, origin] = await Promise.all([
    getDispatchBySlug(slug, { includeUnpublished: true }),
    getDispatches(),
    getRequestOrigin(),
  ]);

  if (!dispatch) {
    notFound();
  }

  let isAdminPreview = false;
  let isSharedDraft = false;
  let initialShareToken: string | null = null;

  if (dispatch.is_published === false) {
    const validShareToken = verifyDispatchShareToken(sp.share, dispatch)
      ? sp.share!.trim()
      : null;
    const admin = await getAuthenticatedAdmin();

    if (!admin && !validShareToken) {
      notFound();
    }

    isAdminPreview = Boolean(admin);
    isSharedDraft = !admin && Boolean(validShareToken);
    initialShareToken = validShareToken || (admin ? signDispatchShareToken(dispatch) : null);
  }

  const otherDispatches = allDispatches.filter((d) => d.slug !== dispatch.slug);
  const urls = buildJournalShareUrls({
    dispatch,
    origin,
    shareToken: initialShareToken,
  });

  const articleJsonLd =
    dispatch.is_published !== false
      ? {
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: sanitizeShareText(dispatch.title),
          description: sanitizeShareText(dispatch.subtitle),
          image: [urls.ogImageUrl],
          datePublished: dispatch.published_at,
          dateModified: dispatch.updated_at,
          author: {
            "@type": "Person",
            name: dispatch.author_name,
          },
          publisher: {
            "@type": "Organization",
            name: BRAND.name,
            url: origin,
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": urls.canonicalUrl,
          },
        }
      : null;

  return (
    <>
      {articleJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <DispatchReaderClient
        dispatch={dispatch}
        otherDispatches={otherDispatches}
        isAdminPreview={isAdminPreview}
        isSharedDraft={isSharedDraft}
        initialShareToken={initialShareToken}
        initialOrigin={origin}
      />
    </>
  );
}
