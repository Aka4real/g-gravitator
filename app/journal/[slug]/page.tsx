import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DispatchReaderClient } from "@/components/journal/DispatchReaderClient";
import { getDispatchBySlug, getDispatches } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dispatch = await getDispatchBySlug(slug);
  if (!dispatch) {
    return { title: "Dispatch Not Found | G-Gravitator Journal" };
  }
  return {
    title: `Dispatch // ${dispatch.issue_number}: ${dispatch.title}`,
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
    getDispatchBySlug(slug),
    getDispatches(),
  ]);

  if (!dispatch) {
    notFound();
  }

  const otherDispatches = allDispatches.filter((d) => d.slug !== dispatch.slug);

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <div className="border-x border-[#27272A]">
        <DispatchReaderClient
          dispatch={dispatch}
          otherDispatches={otherDispatches}
        />
      </div>
    </div>
  );
}
