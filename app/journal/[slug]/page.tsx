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
import {
  buildBreadcrumbJsonLd,
  buildDispatchSeoDescription,
  buildDispatchSeoTitle,
  estimateWordCount,
  extractDispatchImageUrls,
} from "@/lib/seo/site";

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
  const seoTitle = buildDispatchSeoTitle(dispatch);
  const seoDescription = buildDispatchSeoDescription(dispatch);
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
      title: admin ? `[Admin Preview] ${seoTitle}` : seoTitle,
      description: seoDescription,
      robots: { index: false, follow: false, nocache: true },
      openGraph: {
        title: cleanTitle,
        description: seoDescription,
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
            type: "image/jpeg",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: cleanTitle,
        description: seoDescription,
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
  const articleKeywords = Array.from(
    new Set([
      ...(dispatch.design?.seo_keywords ?? []),
      ...(dispatch.tags ?? []),
      dispatch.category,
      dispatch.author_name,
      BRAND.name,
    ])
  ).filter(Boolean);

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: articleKeywords,
    authors: [{ name: dispatch.author_name }],
    alternates: {
      canonical: urls.canonicalUrl,
    },
    openGraph: {
      title: cleanTitle,
      description: seoDescription,
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
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: cleanTitle,
      description: seoDescription,
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

  const cleanHeadline = sanitizeShareText(dispatch.title);
  const cleanSubtitle = sanitizeShareText(dispatch.subtitle);
  const seoDescription = buildDispatchSeoDescription(dispatch);
  const articleImages = Array.from(
    new Set([urls.ogImageUrl, ...extractDispatchImageUrls(dispatch, origin)])
  );
  const citationUrls = (dispatch.design?.featured_links ?? [])
    .map((lnk) => lnk.url)
    .filter((u) => typeof u === "string" && u.startsWith("http"));

  const articleJsonLd =
    dispatch.is_published !== false
      ? {
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: cleanHeadline,
          alternativeHeadline: cleanSubtitle,
          description: seoDescription,
          image: articleImages,
          datePublished: dispatch.published_at,
          dateModified: dispatch.updated_at,
          articleSection: dispatch.category,
          keywords: [
            ...(dispatch.design?.seo_keywords ?? []),
            ...(dispatch.tags ?? []),
          ].join(", "),
          wordCount: estimateWordCount(dispatch.mdx_content || ""),
          timeRequired: `PT${Math.max(1, dispatch.reading_time_mins || 1)}M`,
          inLanguage: "en-US",
          isAccessibleForFree: true,
          author: {
            "@type": "Person",
            name: dispatch.author_name,
            ...(dispatch.author_role ? { jobTitle: dispatch.author_role } : {}),
          },
          publisher: {
            "@type": "Organization",
            name: BRAND.name,
            url: origin,
            logo: {
              "@type": "ImageObject",
              url: `${origin}/icon.svg`,
            },
          },
          ...(citationUrls.length > 0 ? { citation: citationUrls } : {}),
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": urls.canonicalUrl,
          },
        }
      : null;

  const breadcrumbJsonLd =
    dispatch.is_published !== false
      ? buildBreadcrumbJsonLd([
          { name: "Home", url: origin },
          { name: "Journal", url: `${origin}/journal` },
          { name: cleanHeadline, url: urls.canonicalUrl },
        ])
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
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
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
