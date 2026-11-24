import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DispatchReaderClient } from "@/components/journal/DispatchReaderClient";
import { getAuthenticatedAdmin } from "@/lib/auth/admin-auth";
import { getDispatchBySlug, getDispatches } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dispatch = await getDispatchBySlug(slug, { includeUnpublished: true });
  if (!dispatch) {
    return { title: "Dispatch Not Found | G-Gravitator Journal" };
  }
  if (dispatch.is_published === false) {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return {
        title: "Dispatch Not Found | G-Gravitator Journal",
        robots: { index: false, follow: false },
      };
    }
    return {
      title: `[Admin Preview] Issue ${dispatch.issue_number}: ${dispatch.title}`,
      description: dispatch.subtitle,
      robots: { index: false, follow: false },
    };
  }
  return {
    title: `Issue ${dispatch.issue_number}: ${dispatch.title}`,
    description: dispatch.subtitle,
    openGraph: {
      title: dispatch.title,
      description: dispatch.subtitle,
      type: "article",
      publishedTime: dispatch.published_at,
      authors: [dispatch.author_name],
    },
  };
}

export default async function DispatchArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [dispatch, allDispatches] = await Promise.all([
    getDispatchBySlug(slug, { includeUnpublished: true }),
    getDispatches(),
  ]);

  if (!dispatch) {
    notFound();
  }

  let isAdminPreview = false;
  if (dispatch.is_published === false) {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      notFound();
    }
    isAdminPreview = true;
  }

  const otherDispatches = allDispatches.filter((d) => d.slug !== dispatch.slug);

  return (
    <DispatchReaderClient
      dispatch={dispatch}
      otherDispatches={otherDispatches}
      isAdminPreview={isAdminPreview}
    />
  );
}
