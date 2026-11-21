import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { PreloadLink } from "@/components/layout/PreloadLink";
import { ArrowUpRight, GitBranch, Radar } from "lucide-react";
import { GraduationScorecard } from "@/components/skunkworks/GraduationScorecard";
import { Reveal, StaggerGroup, StaggerItem } from "@/lib/motion";
import { getLabProjects } from "@/lib/db/repository";
import {
  evaluateGraduationScorecard,
  type GraduationVerdictCode,
} from "@/lib/scorecard";

export const metadata: Metadata = {
  title: "OXAKALABS Skunkworks | G-Gravitator 48-Hour R&D Foundry",
  description:
    "Founded in 2022, OXAKALABS is G-Gravitator's 48-hour build engine, hackathon strike team, and open-source R&D foundry.",
};

export const dynamic = "force-dynamic";

const BUILD_DISPLAY_NAMES: Record<string, string> = {
  "OXA-01": "DEMOPILOT",
  "OXA-02": "Nexus Retail Operations Suite",
  "OXA-03": "All-Things-Agentic Harness",
  "OXA-04": "Aify Cycle",
  "OXA-05": "AI-API-ATP: Autonomous API Agent",
  "OXA-06": "Solana Token Launch Forge",
};

function formatBuildName(code: string, rawName: string): string {
  if (BUILD_DISPLAY_NAMES[code]) return BUILD_DISPLAY_NAMES[code];
  return rawName
    .replaceAll(" // ", ": ")
    .replaceAll("\u2014", ", ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function sanitizeText(text: string): string {
  return text.replaceAll(" // ", " \u00B7 ").replaceAll("\u2014", ", ");
}

function getScorePillClasses(code: GraduationVerdictCode): string {
  switch (code) {
    case "PROMOTE_TO_LABS":
      return "border-[#FF3B1F]/30 bg-[#FF3B1F]/12 text-[#FF8A7A]";
    case "B2B_CASE_STUDY_OPEN_SOURCE":
      return "border-[#F59E0B]/30 bg-[#F59E0B]/12 text-[#FBBF24]";
    default:
      return "border-white/[0.12] bg-white/[0.06] text-[#D4D4D8]";
  }
}

export default async function SkunkworksPage() {
  const builds = await getLabProjects("SKUNKWORKS");

  return (
    <div className="mx-auto max-w-[1360px] px-5 pt-12 pb-24 sm:px-8 lg:px-12 lg:pt-16 lg:pb-32">
      {/* Experience-Mode Editorial Hero + Studio Photography */}
      <header className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6">
          <h1 className="font-display text-[clamp(2.35rem,4.7vw,4.35rem)] font-bold leading-[1.04] tracking-[-0.03em] text-[#F4F3EF]">
            OXAKALABS. Our 48-hour build engine and R&amp;D foundry.
          </h1>

          <p className="mt-6 max-w-[56ch] text-base leading-relaxed text-[#A1A1AA] sm:text-lg">
            Founded in 2022,{" "}
            <strong className="font-semibold text-[#F4F3EF]">OXAKALABS</strong> operates
            as G-Gravitator&apos;s experimental R&amp;D arm and hackathon strike team.
            Every prototype, multi-agent harness, and open-source tool runs through our
            25-point filter to earn promotion into commercial Labs drops.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <PreloadLink
              href="/hackathons"
              className="press-tactile inline-flex h-11 items-center gap-2 rounded-full bg-[#FF3B1F] px-6 text-sm font-semibold whitespace-nowrap text-[#08080A] hover:bg-[#FF5238]"
            >
              <Radar className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span>Open Hackathon Radar</span>
              <ArrowUpRight className="h-4 w-4 shrink-0" strokeWidth={2} />
            </PreloadLink>
            <a
              href="https://github.com/Aka4real"
              target="_blank"
              rel="noreferrer"
              className="press-tactile inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.12] bg-[#18181D] px-5 text-sm font-medium whitespace-nowrap text-[#F4F3EF] hover:border-white/[0.22] hover:bg-white/[0.08]"
            >
              <span>GitHub (@Aka4real)</span>
              <ArrowUpRight className="h-4 w-4 text-[#FF3B1F]" strokeWidth={1.8} />
            </a>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="aspect-video overflow-hidden rounded-2xl bg-[#111114] ring-1 ring-inset ring-white/[0.08]">
            <Image
              src="/images/skunkworks-forge.jpg"
              alt="Macro CNC-milled matte black aerospace alloy gearwork surrounding a frosted optical glass aperture with warm inner reflection"
              width={1376}
              height={768}
              preload
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* Interactive 25-Point Graduation Scorecard */}
      <section className="mt-20 border-t border-white/[0.07] pt-16 lg:mt-28 lg:pt-20">
        <Reveal>
          <h2 className="font-display text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F4F3EF]">
            How weekend builds graduate into Labs drops
          </h2>
          <p className="mt-3 max-w-[62ch] text-base text-[#A1A1AA]">
            Prototypes scoring 20 to 25 promote directly into numbered G-Gravitator Labs
            releases. Test any shipped build or calibrate your own prototype below.
          </p>
        </Reveal>

        <Reveal delay={0.05} className="mt-10">
          <GraduationScorecard presets={builds} />
        </Reveal>
      </section>

      {/* Shipped Prototypes & Hackathon Archive (OXA-01 to OXA-06) */}
      <section className="mt-20 border-t border-white/[0.07] pt-16 lg:mt-28 lg:pt-20">
        <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F4F3EF]">
              Shipped prototypes (OXA-01 to OXA-06)
            </h2>
            <p className="mt-3 max-w-[60ch] text-base text-[#A1A1AA]">
              Public repositories built under OXAKALABS and audited against our 25-point
              commercial viability criteria.
            </p>
          </div>

          <a
            href="https://github.com/Aka4real"
            target="_blank"
            rel="noreferrer"
            className="press-tactile inline-flex h-10 w-fit shrink-0 items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#18181D] px-4 text-xs font-medium whitespace-nowrap text-[#F4F3EF] hover:border-white/[0.22] hover:bg-white/[0.08]"
          >
            <span>All repositories on GitHub</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.8} />
          </a>
        </Reveal>

        <StaggerGroup className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {builds.map((build) => {
            const verdict = build.scorecard
              ? evaluateGraduationScorecard(build.scorecard)
              : null;
            const displayName = formatBuildName(build.code, build.name);

            return (
              <StaggerItem key={build.id} className="flex">
                <article
                  id={build.slug}
                  className="surface-card surface-card-interactive scroll-mt-24 flex w-full flex-col justify-between p-6 sm:p-7"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono-telemetry rounded-full border border-[#FF3B1F]/30 bg-[#FF3B1F]/12 px-3 py-1 text-xs font-semibold text-[#FF8A7A]">
                        {build.code}
                      </span>
                      {verdict && (
                        <span
                          className={`font-mono-telemetry rounded-full border px-2.5 py-1 text-xs font-semibold ${getScorePillClasses(
                            verdict.code
                          )}`}
                        >
                          {verdict.total}/25
                        </span>
                      )}
                    </div>

                    <h3 className="font-display mt-5 text-xl font-semibold tracking-[-0.02em] text-[#F4F3EF]">
                      {displayName}
                    </h3>

                    <p className="mt-2.5 text-sm font-medium leading-snug text-[#F4F3EF]/90">
                      {sanitizeText(build.tagline)}
                    </p>

                    <p className="mt-2.5 text-sm leading-relaxed text-[#A1A1AA]">
                      {sanitizeText(build.description)}
                    </p>

                    {build.hackathon_origin && (
                      <div className="mt-4 flex items-start gap-2 text-xs text-[#8B8B94]">
                        <GitBranch
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF3B1F]"
                          strokeWidth={1.7}
                        />
                        <span>{sanitizeText(build.hackathon_origin)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 border-t border-white/[0.07] pt-5">
                    <div className="flex flex-wrap gap-1.5">
                      {build.tech_stack.map((tech) => (
                        <span
                          key={tech}
                          className="font-mono-telemetry rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-[#A1A1AA]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      {build.repo_url && (
                        <a
                          href={build.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="press-tactile inline-flex h-9 items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#18181D] px-4 text-xs font-semibold whitespace-nowrap text-[#F4F3EF] hover:border-white/[0.24] hover:bg-white/[0.08]"
                        >
                          <span>Open repository</span>
                          <ArrowUpRight
                            className="h-3.5 w-3.5 text-[#FF3B1F]"
                            strokeWidth={2}
                          />
                        </a>
                      )}
                      {verdict && (
                        <span className="text-xs font-medium text-[#8B8B94]">
                          {verdict.code === "PROMOTE_TO_LABS"
                            ? "Promoted to Labs"
                            : verdict.code === "B2B_CASE_STUDY_OPEN_SOURCE"
                            ? "Case study and OSS"
                            : "Archived"}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </section>
    </div>
  );
}
