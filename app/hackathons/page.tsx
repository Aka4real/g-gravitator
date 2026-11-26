import React from "react";
import type { Metadata } from "next";
import { HackathonRadar } from "@/components/hackathons/HackathonRadar";
import { getHackathons } from "@/lib/db/repository";

export const metadata: Metadata = {
  title: "Live Hackathon Radar · Multi-Provider Tracker",
  description:
    "Real-time AI and software hackathon radar aggregating Devpost, DoraHacks, X (Twitter), Lablab.ai, Luma, MLH, ETHGlobal, Kaggle, Devfolio, and Unstop.",
  alternates: {
    canonical: "/hackathons",
  },
  openGraph: {
    title: "Live Hackathon Radar · Multi-Provider Tracker",
    description:
      "Real-time AI and software hackathon radar aggregating Devpost, DoraHacks, X, Lablab.ai, Luma, MLH, ETHGlobal, Kaggle, Devfolio, and Unstop.",
    url: "/hackathons",
  },
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
    <div className="mx-auto max-w-[1360px] px-5 pt-24 pb-24 sm:px-8 lg:px-12 lg:pt-28 lg:pb-32">
      {/* Immediate Workspace Masthead (zero hero banner) */}
      <header className="max-w-3xl">
        <h1 className="font-display text-[clamp(2rem,4.2vw,3.5rem)] font-bold leading-[1.04] tracking-[-0.035em] text-[var(--ink-primary)]">
          Global AI and software hackathon radar
        </h1>
        <p className="mt-3 max-w-[65ch] text-[16px] leading-[1.6] text-[var(--ink-muted)]">
          Unified feed across Devpost, DoraHacks, Lablab.ai, MLH, Luma,
          Devfolio, ETHGlobal, Kaggle, Unstop, and breaking announcements on X,
          built for{" "}
          <strong className="font-semibold text-[var(--ink-primary)]">
            OXAKALABS
          </strong>{" "}
          and the global builder community.
        </p>
      </header>

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
