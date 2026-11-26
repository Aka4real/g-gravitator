import React from "react";
import type { Metadata } from "next";
import { JournalHubClient } from "@/components/journal/JournalHubClient";
import { getDispatches, getNewsItems } from "@/lib/db/repository";

export const metadata: Metadata = {
  title: "Journal & Orbital Wire · AI Dispatches & Radar",
  description:
    "Dual-track intelligence center combining G-Gravitator and OXAKALABS original Lab Dispatches with The Orbital Wire automated AI and tech news radar.",
  alternates: {
    canonical: "/journal",
  },
  openGraph: {
    title: "Journal & The Orbital Wire | G-Gravitator",
    description:
      "Long-form engineering dispatches from G-Gravitator and OXAKALABS paired with The Orbital Wire real-time AI intelligence.",
    type: "website",
    siteName: "G-Gravitator",
    url: "/journal",
  },
  twitter: {
    card: "summary_large_image",
    title: "Journal & The Orbital Wire | G-Gravitator",
    description:
      "Long-form engineering dispatches from G-Gravitator and OXAKALABS paired with The Orbital Wire real-time AI intelligence.",
  },
};

export const dynamic = "force-dynamic";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const [dispatches, { items: newsItems }] = await Promise.all([
    getDispatches(),
    getNewsItems(),
  ]);

  return (
    <div className="mx-auto max-w-[1360px] px-5 pt-24 pb-24 sm:px-8 lg:px-12 lg:pt-28 lg:pb-32">
      {/* Immediate Broadsheet Masthead */}
      <header className="max-w-3xl">
        <h1 className="font-display text-[clamp(2rem,4.2vw,3.5rem)] font-bold leading-[1.04] tracking-[-0.035em] text-[var(--ink-primary)]">
          Engineering dispatches and Orbital Wire
        </h1>
        <p className="mt-3 max-w-[65ch] text-[16px] leading-[1.6] text-[var(--ink-muted)]">
          Original architectural essays and post-mortems written by G-Gravitator
          and OXAKALABS engineers, paired with{" "}
          <strong className="font-semibold text-[var(--ink-primary)]">
            The Orbital Wire
          </strong>
          , distilling frontier models, agentic tooling, arXiv papers, and
          engineering releases into builder takeaways.
        </p>
      </header>

      <div className="mt-8">
        <JournalHubClient
          dispatches={dispatches}
          newsItems={newsItems}
          initialQuery={sp.q ?? ""}
        />
      </div>
    </div>
  );
}
