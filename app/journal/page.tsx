import React from "react";
import type { Metadata } from "next";
import { JournalHubClient } from "@/components/journal/JournalHubClient";
import { getDispatches, getNewsItems } from "@/lib/db/repository";

export const metadata: Metadata = {
  title: "Journal and The Orbital Wire | AI Intelligence and Lab Dispatches",
  description:
    "Dual-track intelligence center combining G-Gravitator and OXAKALABS original Lab Dispatches with The Orbital Wire automated AI and tech news radar.",
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
    <div className="mx-auto max-w-[1360px] px-5 pt-10 pb-24 sm:px-8 lg:px-12 lg:pt-14 lg:pb-32">
      {/* Open Editorial Header */}
      <header className="max-w-3xl">
        <h1 className="font-display text-[clamp(2rem,4.2vw,3.5rem)] font-bold tracking-[-0.03em] text-[#F4F3EF]">
          Engineering dispatches and live AI intelligence
        </h1>
        <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-[#A1A1AA]">
          Original architectural breakdowns and post-mortems written by G-Gravitator and
          OXAKALABS engineers, paired with{" "}
          <strong className="font-medium text-[#F4F3EF]">The Orbital Wire</strong>, our
          real-time radar distilling breakthroughs across frontier models, agentic
          tooling, arXiv research, and Hacker News into concise builder takeaways.
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
