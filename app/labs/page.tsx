import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, GitBranch, Layers } from "lucide-react";
import { CrosshairCell } from "@/components/kinetic/CrosshairCell";
import { getLabProjects } from "@/lib/db/repository";
import { evaluateGraduationScorecard } from "@/lib/scorecard";

export const metadata: Metadata = {
  title: "G-Gravitator Labs — Numbered Software & AI Product Drops (G-01..G-04)",
  description:
    "Proprietary commercial software and AI tools engineered as numbered industrial drops: G-01 Gravity Deck, G-02 OpsPilot, G-03 Kinetic Studio, and G-04 OrbitBench.",
};

export const dynamic = "force-dynamic";

export default async function LabsCatalogPage() {
  const drops = await getLabProjects("LABS");

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <div className="border-x border-[#27272A]">
        {/* Hero */}
        <section className="border-b border-[#27272A] px-6 py-16 sm:px-10 lg:px-14 lg:py-24">
          <div className="font-mono-telemetry inline-flex items-center gap-2 border border-[#27272A] bg-[#111114] px-3 py-1 text-[11px] text-[#FF3B1F]">
            <span>UNIT 02 // G-GRAVITATOR LABS</span>
            <span className="text-[#3F3F46]">|</span>
            <span className="text-[#A1A1AA]">NUMBERED COMMERCIAL DROPS</span>
          </div>

          <h1 className="font-display mt-6 max-w-4xl text-[clamp(2.5rem,5.5vw,5rem)] font-extrabold tracking-[-0.035em] text-[#F3F2EE] uppercase">
            INDUSTRIAL SOFTWARE DROPS. ENGINEERED TO HOLD LOAD.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#A1A1AA]">
            Every G-Gravitator Labs release begins either as an acute enterprise bottleneck
            inside{" "}
            <Link href="/systems" className="text-[#F3F2EE] underline">
              Systems
            </Link>{" "}
            or a high-scoring 48-hour build graduating from{" "}
            <Link href="/skunkworks" className="text-[#F3F2EE] underline">
              OXAKALABS // Skunkworks
            </Link>{" "}
            after clearing our 20/25 Graduation Filter.
          </p>
        </section>

        {/* Numbered Catalog Grid */}
        <section className="grid grid-cols-1 divide-y divide-[#27272A] lg:grid-cols-2 lg:divide-y-0">
          {drops.map((drop, index) => {
            const verdict = drop.scorecard
              ? evaluateGraduationScorecard(drop.scorecard)
              : null;
            const borderCls =
              index === 0
                ? "lg:border-r lg:border-b border-[#27272A]"
                : index === 1
                ? "lg:border-b border-[#27272A]"
                : index === 2
                ? "lg:border-r border-[#27272A]"
                : "";

            return (
              <CrosshairCell
                key={drop.id}
                corners={["tl", "tr", "bl", "br"]}
                className={`flex flex-col justify-between bg-[#09090B] p-8 transition-colors hover:bg-[#111114] lg:p-11 ${borderCls}`}
              >
                <div>
                  {/* Top Telemetry Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono-telemetry bg-[#FF3B1F] px-2.5 py-1 text-xs font-bold text-[#09090B]">
                        LAB // {drop.code}
                      </span>
                      <span className="font-mono-telemetry border border-[#27272A] bg-[#111114] px-2.5 py-1 text-[10px] text-[#F3F2EE]">
                        STATUS: {drop.status}
                      </span>
                    </div>
                    {verdict && (
                      <span className="font-mono-telemetry border border-[#27272A] bg-[#09090B] px-2.5 py-1 text-[10px] text-[#10B981]">
                        GRADUATION SCORE: {verdict.total}/25
                      </span>
                    )}
                  </div>

                  {/* Product Title & Tagline */}
                  <h2 className="font-display mt-6 text-3xl font-extrabold tracking-tight text-[#F3F2EE] sm:text-4xl">
                    {drop.code} // {drop.name}
                  </h2>

                  <p className="mt-3 text-base font-medium text-[#F3F2EE]">
                    {drop.tagline}
                  </p>

                  <p className="mt-3 text-sm leading-relaxed text-[#A1A1AA]">
                    {drop.description}
                  </p>

                  {drop.hackathon_origin && (
                    <div className="mt-5 flex items-center gap-2 border border-[#27272A] bg-[#111114] px-3.5 py-2 text-xs text-[#A1A1AA]">
                      <GitBranch className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.5} />
                      <span className="font-mono-telemetry text-[10px]">
                        PROVENANCE: {drop.hackathon_origin}
                      </span>
                    </div>
                  )}

                  {/* Architecture Highlights */}
                  {drop.architecture_notes && drop.architecture_notes.length > 0 && (
                    <div className="mt-6 border-t border-[#27272A] pt-5">
                      <div className="font-mono-telemetry flex items-center gap-1.5 text-[10px] text-[#71717A]">
                        <Layers className="h-3 w-3 text-[#FF3B1F]" strokeWidth={1.5} />
                        <span>CORE ARCHITECTURE MODULES</span>
                      </div>
                      <ul className="mt-3 space-y-2 text-xs text-[#A1A1AA]">
                        {drop.architecture_notes.map((note) => (
                          <li key={note} className="flex items-start gap-2">
                            <span className="mt-1.5 h-1 w-1 shrink-0 bg-[#FF3B1F]" />
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Stack & Actions */}
                <div className="mt-8 border-t border-[#27272A] pt-5">
                  <div className="flex flex-wrap gap-1.5">
                    {drop.tech_stack.map((tech) => (
                      <span
                        key={tech}
                        className="font-mono-telemetry border border-[#27272A] bg-[#09090B] px-2 py-0.5 text-[10px] text-[#A1A1AA]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <Link
                      href={`/labs/${drop.slug}`}
                      className="font-mono-telemetry inline-flex items-center gap-2 bg-[#F3F2EE] px-4 py-2.5 text-xs font-semibold text-[#09090B] transition-colors hover:bg-[#FF3B1F]"
                    >
                      <span>INSPECT {drop.code} DOSSIER &amp; CHANGELOG</span>
                      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </Link>

                    {drop.repo_url && (
                      <a
                        href={drop.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono-telemetry inline-flex items-center gap-1.5 text-xs text-[#A1A1AA] hover:text-[#F3F2EE]"
                      >
                        <span>VIEW SOURCE KERNEL</span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.8} />
                      </a>
                    )}
                  </div>
                </div>
              </CrosshairCell>
            );
          })}
        </section>
      </div>
    </div>
  );
}
