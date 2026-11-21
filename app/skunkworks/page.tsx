import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Radar, GitBranch } from "lucide-react";
import { CrosshairCell } from "@/components/kinetic/CrosshairCell";
import { GraduationScorecard } from "@/components/skunkworks/GraduationScorecard";
import { getLabProjects } from "@/lib/db/repository";
import { evaluateGraduationScorecard } from "@/lib/scorecard";

export const metadata: Metadata = {
  title: "OXAKALABS // Skunkworks by G-Gravitator — 48-Hour R&D & Hackathon Foundry",
  description:
    "Est. 2022. OXAKALABS is G-Gravitator's 48-hour build engine, hackathon strike team, and open-source R&D foundry.",
};

export const dynamic = "force-dynamic";

export default async function SkunkworksPage() {
  const builds = await getLabProjects("SKUNKWORKS");

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <div className="border-x border-[#27272A]">
        {/* Identity Header */}
        <section className="border-b border-[#27272A] px-6 py-16 sm:px-10 lg:px-14 lg:py-24">
          <div className="font-mono-telemetry inline-flex items-center gap-2 border border-[#FF3B1F]/50 bg-[#FF3B1F]/10 px-3 py-1 text-[11px] text-[#FF3B1F]">
            <span>UNIT 03 // OXAKALABS // SKUNKWORKS BY G-GRAVITATOR</span>
            <span className="text-[#3F3F46]">|</span>
            <span className="text-[#F3F2EE]">EST. 2022</span>
          </div>

          <h1 className="font-display mt-6 max-w-4xl text-[clamp(2.5rem,5.5vw,5rem)] font-extrabold tracking-[-0.035em] text-[#F3F2EE] uppercase">
            OUR 48-HOUR BUILD ENGINE, HACKATHON STRIKE TEAM &amp; R&amp;D SANDBOX.
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-[#A1A1AA]">
            Founded in 2022, <strong className="text-[#F3F2EE]">OXAKALABS</strong> is
            preserved and elevated as G-Gravitator&apos;s official experimental R&amp;D
            foundry. Every hackathon prototype, multi-agent harness, and open-source
            utility carries the{" "}
            <span className="font-mono-telemetry text-xs text-[#FF3B1F]">
              OXAKALABS // SKUNKWORKS
            </span>{" "}
            badge and feeds directly into our 25-Point Graduation Pipeline.
          </p>

          {/* Cross-Link Banner to Live Hackathon Tracker */}
          <div className="mt-10 flex flex-col items-start justify-between gap-4 border border-[#27272A] bg-[#111114] p-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <Radar className="h-6 w-6 shrink-0 text-[#FF3B1F]" strokeWidth={1.5} />
              <div>
                <div className="font-mono-telemetry text-xs font-bold text-[#F3F2EE]">
                  SEE WHAT OXAKALABS IS HUNTING RIGHT NOW
                </div>
                <p className="text-xs text-[#A1A1AA]">
                  Live multi-provider + X (Twitter) hackathon radar tracking active global
                  bounties and deployed OXAKALABS squads.
                </p>
              </div>
            </div>
            <Link
              href="/hackathons"
              className="font-mono-telemetry inline-flex shrink-0 items-center gap-2 bg-[#FF3B1F] px-5 py-3 text-xs font-semibold text-[#09090B] hover:bg-[#F3F2EE]"
            >
              <span>OPEN LIVE HACKATHON RADAR</span>
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </div>
        </section>

        {/* Interactive 25-Point Graduation Scorecard Widget */}
        <section className="border-b border-[#27272A] p-6 sm:p-10 lg:p-14">
          <div className="mb-6">
            <span className="font-mono-telemetry text-[11px] text-[#FF3B1F]">
              THE GRADUATION PROTOCOL // 25-POINT FILTER
            </span>
            <h2 className="font-display mt-1 text-2xl font-extrabold uppercase sm:text-3xl">
              HOW WEEKEND HACKS GRADUATE INTO G-GRAVITATOR LABS DROPS
            </h2>
          </div>

          <GraduationScorecard presets={builds} />
        </section>

        {/* Shipped Prototypes & Hackathon Archive (Real Aka4real GitHub Builds) */}
        <section>
          <div className="flex flex-col justify-between gap-4 border-b border-[#27272A] px-6 py-8 sm:flex-row sm:items-end lg:px-10">
            <div>
              <span className="font-mono-telemetry text-[11px] text-[#FF3B1F]">
                AUTHENTIC REPOSITORY ARCHIVE // GITHUB.COM/AKA4REAL
              </span>
              <h2 className="font-display mt-1 text-2xl font-extrabold uppercase sm:text-3xl">
                SHIPPED PROTOTYPES &amp; HACKATHON BUILDS (OXA-01 — OXA-06)
              </h2>
            </div>
            <a
              href="https://github.com/Aka4real"
              target="_blank"
              rel="noreferrer"
              className="font-mono-telemetry inline-flex items-center gap-1.5 border border-[#27272A] bg-[#111114] px-4 py-2.5 text-xs text-[#F3F2EE] hover:border-[#FF3B1F]"
            >
              <span>GITHUB FOUNDRY (@AKA4REAL)</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.8} />
            </a>
          </div>

          <div className="grid grid-cols-1 divide-y divide-[#27272A] md:grid-cols-2 md:divide-y-0 lg:grid-cols-3">
            {builds.map((build) => {
              const verdict = build.scorecard
                ? evaluateGraduationScorecard(build.scorecard)
                : null;
              return (
                <CrosshairCell
                  key={build.id}
                  id={build.slug}
                  corners={["tl", "tr"]}
                  className="flex flex-col justify-between border-r border-b border-[#27272A] bg-[#09090B] p-7 transition-colors hover:bg-[#111114]"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono-telemetry border border-[#FF3B1F]/60 bg-[#FF3B1F]/15 px-2 py-0.5 text-[10px] font-bold text-[#FF3B1F]">
                        {build.code} // SKUNKWORKS
                      </span>
                      {verdict && (
                        <span
                          className="font-mono-telemetry border px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            borderColor: verdict.accentColor,
                            color: verdict.accentColor,
                          }}
                        >
                          SCORE: {verdict.total}/25
                        </span>
                      )}
                    </div>

                    <h3 className="font-display mt-4 text-xl font-bold text-[#F3F2EE]">
                      {build.name}
                    </h3>

                    <p className="mt-2 text-xs font-medium text-[#F3F2EE]">
                      {build.tagline}
                    </p>

                    <p className="mt-2.5 text-xs leading-relaxed text-[#A1A1AA]">
                      {build.description}
                    </p>

                    {build.hackathon_origin && (
                      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[#71717A]">
                        <GitBranch className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.5} />
                        <span className="font-mono-telemetry text-[10px]">
                          {build.hackathon_origin}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 border-t border-[#27272A] pt-4">
                    <div className="flex flex-wrap gap-1.5">
                      {build.tech_stack.map((t) => (
                        <span
                          key={t}
                          className="font-mono-telemetry border border-[#27272A] bg-[#09090B] px-1.5 py-0.5 text-[9px] text-[#A1A1AA]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      {build.repo_url && (
                        <a
                          href={build.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono-telemetry inline-flex items-center gap-1.5 text-xs font-semibold text-[#F3F2EE] hover:text-[#FF3B1F]"
                        >
                          <span>OPEN GITHUB REPO</span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.8} />
                        </a>
                      )}
                      {verdict && (
                        <span className="font-mono-telemetry text-[10px] text-[#71717A]">
                          {verdict.label}
                        </span>
                      )}
                    </div>
                  </div>
                </CrosshairCell>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
