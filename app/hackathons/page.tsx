import React from "react";
import type { Metadata } from "next";
import { HackathonRadar } from "@/components/hackathons/HackathonRadar";
import { getHackathons } from "@/lib/db/repository";

export const metadata: Metadata = {
  title: "Live Hackathon Radar | Multi-Provider and X Signal Tracker",
  description:
    "Real-time AI and software hackathon radar aggregating Devpost, DoraHacks, X (Twitter), Lablab.ai, Luma, MLH, ETHGlobal, Kaggle, Devfolio, and Unstop.",
};

export const dynamic = "force-dynamic";

export default async function HackathonsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; submit?: string }>;
}) {
  const sp = await searchParams;
  const { items: hackathons, lastSyncAt } = await getHackathons();

  return (
    <div className="mx-auto max-w-[1360px] px-5 pt-10 pb-24 sm:px-8 lg:px-12 lg:pt-14 lg:pb-32">
      {/* Unboxed Editorial Operate Header */}
      <header className="max-w-3xl">
        <h1 className="font-display text-[clamp(2rem,4.2vw,3.5rem)] font-bold tracking-[-0.03em] text-[#F4F3EF]">
          Global AI and software hackathon radar
        </h1>
        <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-[#A1A1AA]">
          Built for <strong className="font-medium text-[#F4F3EF]">OXAKALABS</strong>{" "}
          strike deployment and the global builder community. Unifies Devpost, DoraHacks,
          Lablab.ai, MLH, Luma, Devfolio, ETHGlobal, Kaggle, Unstop, and breaking
          announcements on <strong className="font-medium text-[#F4F3EF]">X (Twitter)</strong>{" "}
          into one normalized, deduplicated feed.
        </p>
      </header>

      {/* Interactive Radar Console */}
      <div className="mt-8">
        <HackathonRadar
          initialHackathons={hackathons}
          lastSyncAt={lastSyncAt}
          initialQuery={sp.q ?? ""}
          initialOpenSubmit={sp.submit === "1"}
        />
      </div>
    </div>
  );
}
