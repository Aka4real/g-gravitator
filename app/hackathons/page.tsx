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
    <div className="mx-auto max-w-[1440px] px-4 pt-6 pb-20 sm:px-6 sm:pt-8 md:px-8 lg:px-12 lg:pt-10 lg:pb-24">
      <HackathonRadar
        initialHackathons={hackathons}
        lastSyncAt={lastSyncAt}
        initialQuery={sp.q ?? ""}
        initialOpenSubmit={sp.submit === "1"}
      />
    </div>
  );
}
