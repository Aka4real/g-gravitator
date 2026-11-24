import React from "react";
import type { Metadata } from "next";
import { ArrowDown, ArrowRight } from "lucide-react";
import { PricingMatrix } from "@/components/systems/PricingMatrix";

export const metadata: Metadata = {
  title: "Systems · B2B AI & Software Foundry",
  description:
    "Software systems shipped in weeks, not quarters. Commission a 5-day Gravity Audit, 4-week Velocity MVP, or fractional Lab Retainer.",
  alternates: {
    canonical: "/systems",
  },
  openGraph: {
    title: "G-Gravitator Systems · B2B AI & Software Foundry",
    description:
      "Software systems shipped in weeks, not quarters. Commission a 5-day Gravity Audit, 4-week Velocity MVP, or fractional Lab Retainer.",
    url: "/systems",
  },
};

export default function SystemsPage() {
  return (
    <div className="mx-auto max-w-[1360px] px-5 pt-12 pb-24 sm:px-8 lg:px-12 lg:pt-16 lg:pb-32">
      {/* Open Editorial Hero */}
      <header className="max-w-4xl">
        <h1 className="font-display text-[clamp(2.35rem,5vw,4.6rem)] font-bold leading-[1.04] tracking-[-0.03em] text-[#F4F3EF]">
          Software systems shipped in weeks, not quarters.
        </h1>

        <p className="mt-6 max-w-[62ch] text-base leading-relaxed text-[#A1A1AA] sm:text-lg">
          Principal engineers and battle-tested OXAKALABS agent kernels delivering
          production web platforms, internal operations agents, and custom AI
          infrastructure without agency handoffs.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#scope-intake"
            className="press-tactile inline-flex h-11 items-center gap-2 rounded-full bg-[#FF3B1F] px-6 text-sm font-semibold whitespace-nowrap text-[#08080A] hover:bg-[#FF5238]"
          >
            <span>Initiate build</span>
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </a>
          <a
            href="#engagement-tiers"
            className="press-tactile inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.12] bg-[#18181D] px-6 text-sm font-medium whitespace-nowrap text-[#F4F3EF] hover:border-white/[0.2] hover:bg-white/[0.08]"
          >
            <span>Compare tiers</span>
            <ArrowDown className="h-4 w-4 text-[#A1A1AA]" strokeWidth={1.8} />
          </a>
        </div>
      </header>

      {/* Interactive 3-Tier Matrix, Capabilities, Protocol & Scoping Form */}
      <PricingMatrix />
    </div>
  );
}
