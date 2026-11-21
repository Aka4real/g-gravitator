import React from "react";
import type { Metadata } from "next";
import { JournalHubClient } from "@/components/journal/JournalHubClient";
import { getDispatches, getNewsItems } from "@/lib/db/repository";

export const metadata: Metadata = {
  title: "Journal & The Orbital Wire — AI Intelligence & Engineering Dispatches",
  description:
    "Dual-track intelligence center combining G-Gravitator & OXAKALABS original Lab Dispatches with The Orbital Wire automated AI & tech news radar.",
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
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <div className="border-x border-[#27272A]">
        {/* Header */}
        <section className="border-b border-[#27272A] px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <div className="font-mono-telemetry inline-flex items-center gap-2 border border-[#27272A] bg-[#111114] px-3 py-1 text-[11px] text-[#FF3B1F]">
            <span>DEEP-DIVE MODULE 02 // DUAL-TRACK INTELLIGENCE</span>
            <span className="text-[#3F3F46]">|</span>
            <span className="text-[#10B981]">LAB DISPATCHES + THE ORBITAL WIRE</span>
          </div>

          <h1 className="font-display mt-5 max-w-4xl text-[clamp(2.25rem,5vw,4.5rem)] font-extrabold tracking-[-0.035em] text-[#F3F2EE] uppercase">
            ENGINEERING DISPATCHES &amp; LIVE AI TELEMETRY.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#A1A1AA]">
            Original architectural breakdowns and post-mortems authored by G-Gravitator
            &amp; OXAKALABS engineers—paired with{" "}
            <strong className="text-[#F3F2EE]">The Orbital Wire</strong>, our real-time
            radar synthesizing breakthroughs across frontier models, agentic tooling,
            arXiv research, and Hacker News into 2-sentence builder takeaways.
          </p>
        </section>

        <JournalHubClient
          dispatches={dispatches}
          newsItems={newsItems}
          initialQuery={sp.q ?? ""}
        />
      </div>
    </div>
  );
}
