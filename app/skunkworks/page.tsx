import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { PreloadLink } from "@/components/layout/PreloadLink";
import { ArrowUpRight, GitBranch } from "lucide-react";
import { GraduationScorecard } from "@/components/skunkworks/GraduationScorecard";
import { Reveal, StaggerGroup, StaggerItem } from "@/lib/motion";
import { getLabProjects } from "@/lib/db/repository";
import {
  evaluateGraduationScorecard,
  type GraduationVerdictCode,
} from "@/lib/scorecard";

export const metadata: Metadata = {
  title: "OXAKALABS Skunkworks · 48-Hour R&D Foundry",
  description:
    "Founded in 2022, OXAKALABS is G-Gravitator's 48-hour build engine, hackathon strike team, and open-source R&D foundry.",
  alternates: {
    canonical: "/skunkworks",
  },
  openGraph: {
    title: "OXAKALABS Skunkworks · 48-Hour R&D Foundry",
    description:
      "Founded in 2022, OXAKALABS is G-Gravitator's 48-hour build engine, hackathon strike team, and open-source R&D foundry.",
    url: "/skunkworks",
  },
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

function getScoreTextColor(code: GraduationVerdictCode): string {
  switch (code) {
    case "PROMOTE_TO_LABS":
      return "text-[#FF7A63]";
    case "B2B_CASE_STUDY_OPEN_SOURCE":
      return "text-[#FBBF24]";
    default:
      return "text-[var(--ink-muted)]";
  }
}

export default async function SkunkworksPage() {
  const builds = await getLabProjects("SKUNKWORKS");

  return (
    <div className="bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
      {/* Centered Architectural Opening + Panoramic Foundry Stage */}
      <section className="mx-auto max-w-[1360px] px-5 pt-24 pb-16 sm:px-8 lg:px-12 lg:pt-28 lg:pb-20">
        <header className="mx-auto max-w-4xl text-center">
          <h1 className="font-display text-[clamp(2.5rem,5.2vw,4.5rem)] font-bold leading-[1.0] tracking-[-0.035em] text-[var(--ink-primary)]">
            OXAKALABS. 48 hours from hypothesis to code.
          </h1>

          <p className="mx-auto mt-6 max-w-[58ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
            Founded in 2022,{" "}
            <strong className="font-semibold text-[var(--ink-primary)]">
              OXAKALABS
            </strong>{" "}
            is G-Gravitator&apos;s R&amp;D foundry and hackathon strike arm.
            Every prototype runs through our 25-point filter to earn promotion
            into commercial Labs drops.
          </p>

          <div className="mt-8">
            <PreloadLink
              href="/hackathons"
              className="press-tactile inline-flex h-12 items-center gap-2 rounded-full bg-[var(--accent)] px-7 text-[14px] font-semibold whitespace-nowrap text-[#07090D] hover:bg-[var(--accent-hover)]"
            >
              <span>Open Hackathon Radar</span>
              <ArrowUpRight className="h-4 w-4 shrink-0" strokeWidth={2} />
            </PreloadLink>
          </div>
        </header>

        <div className="mt-14 aspect-[21/9] w-full overflow-hidden rounded-2xl bg-[var(--bg-surface)] ring-1 ring-inset ring-white/[0.08]">
          <Image
            src="/images/skunkworks-forge.jpg"
            alt="Macro CNC-milled matte black aerospace alloy mechanism around a frosted optical glass aperture"
            width={1376}
            height={768}
            preload
            sizes="100vw"
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      {/* Cool Architectural Stone Band: Interactive 25-Point Graduation Filter */}
      <section className="surface-stone py-24 lg:py-32">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <Reveal>
            <h2 className="type-heading text-[var(--ink-stone-primary)]">
              How weekend builds graduate into Labs drops
            </h2>
            <p className="mt-3 max-w-[62ch] text-[16px] leading-[1.65] text-[var(--ink-stone-muted)]">
              Prototypes scoring 20 to 25 promote directly into numbered
              G-Gravitator Labs releases. Test any shipped build or calibrate
              your own prototype below.
            </p>
          </Reveal>

          <Reveal delay={0.05} className="mt-10">
            <GraduationScorecard presets={builds} />
          </Reveal>
        </div>
      </section>

      {/* Shipped Prototypes Archive */}
      <section className="border-t border-[var(--hairline)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="type-heading text-[var(--ink-primary)]">
                Shipped open-source prototypes
              </h2>
              <p className="mt-3 max-w-[60ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                Public repositories built under OXAKALABS and audited against
                our 25-point commercial viability criteria.
              </p>
            </div>

            <a
              href="https://github.com/Aka4real"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--ink-primary)] underline decoration-white/25 underline-offset-4 transition-colors duration-150 hover:text-[#FF7A63]"
            >
              <span>All repositories on GitHub</span>
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
            </a>
          </Reveal>

          <StaggerGroup className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {builds.map((build) => {
              const verdict = build.scorecard
                ? evaluateGraduationScorecard(build.scorecard)
                : null;
              const displayName = formatBuildName(build.code, build.name);

              return (
                <StaggerItem key={build.id} className="flex">
                  <article
                    id={build.slug}
                    className="flex w-full scroll-mt-24 flex-col justify-between border-t border-[var(--hairline-strong)] pt-6"
                  >
                    <div>
                      <div className="font-tabular flex items-baseline justify-between gap-2 text-[14px]">
                        <span className="font-semibold text-[var(--accent)]">
                          {build.code}
                        </span>
                        {verdict && (
                          <span
                            className={`font-semibold ${getScoreTextColor(verdict.code)}`}
                          >
                            {verdict.total}/25
                          </span>
                        )}
                      </div>

                      <h3 className="type-subhead mt-3 text-[var(--ink-primary)]">
                        {displayName}
                      </h3>

                      <p className="mt-2.5 text-[16px] font-medium leading-[1.55] text-[var(--ink-primary)]">
                        {sanitizeText(build.tagline)}
                      </p>

                      <p className="mt-2.5 text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                        {sanitizeText(build.description)}
                      </p>

                      {build.hackathon_origin && (
                        <p className="mt-4 flex items-start gap-2 text-[14px] text-[var(--ink-muted)]">
                          <GitBranch
                            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]"
                            strokeWidth={1.8}
                          />
                          <span>{sanitizeText(build.hackathon_origin)}</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-6 border-t border-[var(--hairline)] pt-4">
                      <p className="text-[14px] text-[var(--ink-muted)]">
                        {build.tech_stack.join(" · ")}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        {build.repo_url && (
                          <a
                            href={build.repo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--ink-primary)] underline decoration-[var(--accent)]/70 underline-offset-4 transition-colors duration-150 hover:text-[#FF7A63]"
                          >
                            <span>Open repository</span>
                            <ArrowUpRight className="h-4 w-4" strokeWidth={1.9} />
                          </a>
                        )}
                        {verdict && (
                          <span className="text-[14px] text-[var(--ink-muted)]">
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
        </div>
      </section>
    </div>
  );
}
