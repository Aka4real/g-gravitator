import React from "react";
import type { Metadata } from "next";
import { PricingMatrix } from "@/components/systems/PricingMatrix";

export const metadata: Metadata = {
  title: "G-Gravitator Systems — High-Ticket B2B AI & Software Foundry",
  description:
    "Bespoke AI systems shipped at lab speed. Commission a 5-day Gravity Audit, 4-week Velocity MVP, or fractional Lab Retainer.",
};

export default function SystemsPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <div className="border-x border-[#27272A]">
        {/* Hero Banner */}
        <section className="border-b border-[#27272A] bg-[#09090B] px-6 py-16 sm:px-10 lg:px-14 lg:py-24">
          <div className="font-mono-telemetry inline-flex items-center gap-2 border border-[#27272A] bg-[#111114] px-3 py-1 text-[11px] text-[#FF3B1F]">
            <span>UNIT 01 // G-GRAVITATOR SYSTEMS</span>
            <span className="text-[#3F3F46]">|</span>
            <span className="text-[#A1A1AA]">ENTERPRISE &amp; HIGH-TICKET B2B FOUNDRY</span>
          </div>

          <h1 className="font-display mt-6 max-w-4xl text-[clamp(2.5rem,5.5vw,5rem)] font-extrabold tracking-[-0.035em] text-[#F3F2EE] uppercase">
            BESPOKE AI SYSTEMS. SHIPPED AT LAB SPEED.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#A1A1AA]">
            Traditional agencies bill for bloated slide decks and hand your architecture to
            juniors. G-Gravitator Systems deploys principal engineers and battle-tested
            OXAKALABS agent kernels to ship production web platforms, internal operations
            agents, and custom AI infrastructure in weeks—not quarters.
          </p>
        </section>

        {/* Interactive 3-Tier Matrix, Capabilities, Protocol & Scoping Form */}
        <PricingMatrix />
      </div>
    </div>
  );
}
