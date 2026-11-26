import React from "react";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
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
    <div className="bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
      {/* Full-Width Editorial Opening (zero split template, single primary CTA) */}
      <section className="mx-auto max-w-[1360px] px-5 pt-28 pb-16 sm:px-8 lg:px-12 lg:pt-36 lg:pb-24">
        <header className="max-w-5xl">
          <h1 className="font-display text-[clamp(2.5rem,6vw,5.25rem)] font-bold leading-[0.98] tracking-[-0.035em] text-[var(--ink-primary)]">
            Ship production AI in weeks, not quarters.
          </h1>

          <p className="mt-6 max-w-[58ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
            Principal engineers and proven OXAKALABS agent kernels delivering
            production web platforms, internal operations agents, and custom AI
            infrastructure without agency handoffs.
          </p>

          <div className="mt-8">
            <a
              href="#scope-intake"
              className="press-tactile inline-flex h-12 items-center gap-2 rounded-full bg-[var(--accent)] px-7 text-[14px] font-semibold whitespace-nowrap text-[#07090D] hover:bg-[var(--accent-hover)]"
            >
              <span>Initiate build</span>
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </a>
          </div>
        </header>
      </section>

      {/* Interactive Pricing, Architectural Stone Capabilities Band, Cadence & Intake */}
      <PricingMatrix />
    </div>
  );
}
