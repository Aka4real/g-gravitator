import React from "react";
import type { Metadata } from "next";
import { HackathonRadar } from "@/components/hackathons/HackathonRadar";
import { getHackathons } from "@/lib/db/repository";

export const metadata: Metadata = {
  title: "Live Hackathon Tracker — Global Multi-Provider + X (Twitter) Radar",
  description:
    "Real-time AI & software hackathon radar aggregating Devpost, DoraHacks, X (Twitter), Lablab.ai, Luma, MLH, ETHGlobal, Kaggle, Devfolio, and Unstop.",
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
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <div className="border-x border-[#27272A]">
        {/* Header */}
        <section className="border-b border-[#27272A] px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <div className="font-mono-telemetry inline-flex items-center gap-2 border border-[#27272A] bg-[#111114] px-3 py-1 text-[11px] text-[#FF3B1F]">
            <span>DEEP-DIVE MODULE 01 // OXAKALABS HUNTING RADAR</span>
            <span className="text-[#3F3F46]">|</span>
            <span className="text-[#10B981]">10 PROVIDERS + LIVE X EXTRACTION</span>
          </div>

          <h1 className="font-display mt-5 max-w-4xl text-[clamp(2.25rem,5vw,4.5rem)] font-extrabold tracking-[-0.035em] text-[#F3F2EE] uppercase">
            GLOBAL AI &amp; SOFTWARE HACKATHON RADAR.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#A1A1AA]">
            Engineered for <strong className="text-[#F3F2EE]">OXAKALABS</strong> internal
            strike deployment and the global builder community. Unifies Devpost, DoraHacks,
            Lablab.ai, MLH, Luma / Cerebral Valley, Devfolio, ETHGlobal, Kaggle, Unstop, and
            breaking announcements on <strong className="text-[#F3F2EE]">X (Twitter)</strong>
            —normalized and deduplicated into a single mission control console.
          </p>
        </section>

        {/* Interactive Radar Console */}
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
