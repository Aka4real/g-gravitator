import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { PreloadLink } from "@/components/layout/PreloadLink";
import { ArrowRight, ArrowUpRight, GitBranch, Layers } from "lucide-react";
import { Reveal, StaggerGroup, StaggerItem } from "@/lib/motion";
import { getLabProjects } from "@/lib/db/repository";
import { evaluateGraduationScorecard } from "@/lib/scorecard";
import type { LabProjectStatus } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "G-Gravitator Labs | Numbered Software & AI Product Drops",
  description:
    "Proprietary commercial software and AI tools shipped as numbered drops: G-01 Gravity Deck, G-02 OpsPilot, G-03 Kinetic Studio, and G-04 OrbitBench.",
};

export const dynamic = "force-dynamic";

const DISPLAY_NAMES: Record<string, string> = {
  "G-01": "Gravity Deck",
  "G-02": "OpsPilot",
  "G-03": "Kinetic Studio",
  "G-04": "OrbitBench",
};

function formatDropName(code: string, rawName: string): string {
  if (DISPLAY_NAMES[code]) return DISPLAY_NAMES[code];
  return rawName
    .replaceAll(" // ", ": ")
    .replaceAll("\u2014", ", ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function sanitizeText(text: string): string {
  return text.replaceAll(" // ", " \u00B7 ").replaceAll("\u2014", ", ");
}

function formatStatusLabel(status: LabProjectStatus): string {
  switch (status) {
    case "LIVE":
      return "Live";
    case "BETA":
      return "Beta";
    case "PROTOTYPING":
      return "Prototyping";
    case "R&D":
      return "R&D";
    case "SKUNKWORKS CANDIDATE":
      return "Skunkworks Candidate";
    case "CONCEPT":
      return "Concept";
    case "ARCHIVED":
      return "Archived";
    default:
      return status;
  }
}

function getStatusClasses(status: LabProjectStatus): string {
  switch (status) {
    case "LIVE":
      return "border-[#10B981]/30 bg-[#10B981]/12 text-[#34D399]";
    case "PROTOTYPING":
    case "BETA":
      return "border-[#FF3B1F]/30 bg-[#FF3B1F]/12 text-[#FF8A7A]";
    case "R&D":
    case "SKUNKWORKS CANDIDATE":
      return "border-[#F59E0B]/30 bg-[#F59E0B]/12 text-[#FBBF24]";
    default:
      return "border-white/[0.12] bg-white/[0.06] text-[#D4D4D8]";
  }
}

export default async function LabsCatalogPage() {
  const drops = await getLabProjects("LABS");
  const [flagship, ...remainingDrops] = drops;

  return (
    <div className="mx-auto max-w-[1360px] px-5 pt-12 pb-24 sm:px-8 lg:px-12 lg:pt-16 lg:pb-32">
      {/* Experience-Mode Editorial Hero + Studio Photography */}
      <header className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6">
          <h1 className="font-display text-[clamp(2.35rem,4.7vw,4.35rem)] font-bold leading-[1.04] tracking-[-0.03em] text-[#F4F3EF]">
            Numbered software drops engineered to hold load.
          </h1>

          <p className="mt-6 max-w-[56ch] text-base leading-relaxed text-[#A1A1AA] sm:text-lg">
            Every G-Gravitator Labs release starts as an acute operational bottleneck
            inside{" "}
            <PreloadLink
              href="/systems"
              className="text-[#F4F3EF] underline decoration-white/30 underline-offset-4 transition-colors hover:text-[#FF8A7A] hover:decoration-[#FF3B1F]"
            >
              Systems
            </PreloadLink>{" "}
            or a 48-hour build graduating from{" "}
            <PreloadLink
              href="/skunkworks"
              className="text-[#F4F3EF] underline decoration-white/30 underline-offset-4 transition-colors hover:text-[#FF8A7A] hover:decoration-[#FF3B1F]"
            >
              OXAKALABS Skunkworks
            </PreloadLink>{" "}
            after clearing our 20/25 graduation filter.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#labs-catalog"
              className="press-tactile inline-flex h-11 items-center gap-2 rounded-full bg-[#FF3B1F] px-6 text-sm font-semibold whitespace-nowrap text-[#08080A] hover:bg-[#FF5238]"
            >
              <span>Explore drops</span>
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </a>
            <PreloadLink
              href="/skunkworks"
              className="press-tactile inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.12] bg-[#18181D] px-5 text-sm font-medium whitespace-nowrap text-[#F4F3EF] hover:border-white/[0.22] hover:bg-white/[0.08]"
            >
              <span>Inspect Skunkworks pipeline</span>
              <ArrowUpRight className="h-4 w-4 text-[#A1A1AA]" strokeWidth={1.8} />
            </PreloadLink>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="aspect-video overflow-hidden rounded-2xl bg-[#111114] ring-1 ring-inset ring-white/[0.08]">
            <Image
              src="/images/labs-prism.jpg"
              alt="Stacked smoked optical glass and bead-blasted matte obsidian monoliths with a hairline warm vermilion internal light line"
              width={1376}
              height={768}
              preload
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* Asymmetric Catalog Showcase (G-01 Flagship + G-02..G-04 Row) */}
      <section
        id="labs-catalog"
        className="mt-20 border-t border-white/[0.07] pt-16 lg:mt-28 lg:pt-20"
      >
        <Reveal>
          <h2 className="font-display text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F4F3EF]">
            Active catalog
          </h2>
          <p className="mt-3 max-w-[60ch] text-base text-[#A1A1AA]">
            Four proprietary software instruments spanning executable founder decks,
            autonomous SME operations, motion rendering, and LLM evaluation.
          </p>
        </Reveal>

        {/* Flagship Drop (G-01) Asymmetric Lead Surface */}
        {flagship && (() => {
          const verdict = flagship.scorecard
            ? evaluateGraduationScorecard(flagship.scorecard)
            : null;
          const displayName = formatDropName(flagship.code, flagship.name);

          return (
            <Reveal className="mt-10">
              <article className="surface-card p-7 sm:p-9 lg:p-11">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-14">
                  {/* Left 7 Cols */}
                  <div className="flex flex-col justify-between lg:col-span-7">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono-telemetry rounded-full bg-[#FF3B1F] px-3 py-1 text-xs font-semibold text-[#08080A]">
                          {flagship.code}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
                            flagship.status
                          )}`}
                        >
                          {formatStatusLabel(flagship.status)}
                        </span>
                        {verdict && (
                          <span className="font-mono-telemetry rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-3 py-1 text-xs font-medium text-[#34D399]">
                            Score {verdict.total}/25
                          </span>
                        )}
                      </div>

                      <h3 className="font-display mt-5 text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.025em] text-[#F4F3EF]">
                        {displayName}
                      </h3>

                      <p className="mt-3 max-w-[58ch] text-base font-medium leading-snug text-[#F4F3EF]/90">
                        {sanitizeText(flagship.tagline)}
                      </p>

                      <p className="mt-3.5 max-w-[62ch] text-sm leading-relaxed text-[#A1A1AA]">
                        {sanitizeText(flagship.description)}
                      </p>

                      {flagship.hackathon_origin && (
                        <div className="mt-5 inline-flex items-center gap-2 text-xs text-[#8B8B94]">
                          <GitBranch
                            className="h-3.5 w-3.5 shrink-0 text-[#FF3B1F]"
                            strokeWidth={1.7}
                          />
                          <span>{sanitizeText(flagship.hackathon_origin)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                      <PreloadLink
                        href={`/labs/${flagship.slug}`}
                        className="press-tactile inline-flex h-11 items-center gap-2 rounded-full bg-[#F4F3EF] px-5 text-sm font-semibold whitespace-nowrap text-[#08080A] hover:bg-[#FF3B1F]"
                      >
                        <span>Inspect {flagship.code} dossier</span>
                        <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                      </PreloadLink>

                      {flagship.repo_url && (
                        <a
                          href={flagship.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="press-tactile inline-flex h-11 items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-5 text-sm font-medium whitespace-nowrap text-[#D4D4D8] hover:border-white/[0.22] hover:text-[#F4F3EF]"
                        >
                          <span>Source repository</span>
                          <ArrowUpRight
                            className="h-4 w-4 text-[#FF3B1F]"
                            strokeWidth={1.8}
                          />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Right 5 Cols: Architecture Highlights & Runtime Stack */}
                  <div className="flex flex-col justify-between border-t border-white/[0.07] pt-7 lg:col-span-5 lg:border-t-0 lg:pt-0">
                    {flagship.architecture_notes &&
                      flagship.architecture_notes.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 text-xs font-medium text-[#8B8B94]">
                            <Layers
                              className="h-3.5 w-3.5 text-[#FF3B1F]"
                              strokeWidth={1.7}
                            />
                            <span>Core architecture modules</span>
                          </div>
                          <ul className="mt-4 space-y-3.5 text-sm leading-relaxed text-[#A1A1AA]">
                            {flagship.architecture_notes.map((note) => {
                              const cleaned = sanitizeText(note);
                              const sepIdx = cleaned.indexOf(":");
                              const title =
                                sepIdx > 0 ? cleaned.slice(0, sepIdx) : null;
                              const detail =
                                sepIdx > 0 ? cleaned.slice(sepIdx + 1).trim() : cleaned;

                              return (
                                <li key={note}>
                                  {title && (
                                    <span className="font-medium text-[#F4F3EF]">
                                      {title}:{" "}
                                    </span>
                                  )}
                                  <span>{detail}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                    <div className="mt-7 border-t border-white/[0.07] pt-5">
                      <div className="flex flex-wrap gap-2">
                        {flagship.tech_stack.map((tech) => (
                          <span
                            key={tech}
                            className="font-mono-telemetry rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-[#D4D4D8]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })()}

        {/* Remaining Catalog Drops (G-02..G-04) */}
        {remainingDrops.length > 0 && (
          <StaggerGroup className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {remainingDrops.map((drop) => {
              const verdict = drop.scorecard
                ? evaluateGraduationScorecard(drop.scorecard)
                : null;
              const displayName = formatDropName(drop.code, drop.name);

              return (
                <StaggerItem key={drop.id} className="flex">
                  <article className="surface-card surface-card-interactive flex w-full flex-col justify-between p-7">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-telemetry rounded-full border border-white/[0.12] bg-white/[0.07] px-3 py-1 text-xs font-semibold text-[#F4F3EF]">
                            {drop.code}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                              drop.status
                            )}`}
                          >
                            {formatStatusLabel(drop.status)}
                          </span>
                        </div>
                        {verdict && (
                          <span className="font-mono-telemetry text-xs font-medium text-[#34D399]">
                            {verdict.total}/25
                          </span>
                        )}
                      </div>

                      <h3 className="font-display mt-5 text-2xl font-semibold tracking-[-0.02em] text-[#F4F3EF]">
                        {displayName}
                      </h3>

                      <p className="mt-2.5 text-sm font-medium leading-snug text-[#F4F3EF]/90">
                        {sanitizeText(drop.tagline)}
                      </p>

                      <p className="mt-3 text-sm leading-relaxed text-[#A1A1AA]">
                        {sanitizeText(drop.description)}
                      </p>

                      {drop.hackathon_origin && (
                        <div className="mt-4 flex items-center gap-2 text-xs text-[#8B8B94]">
                          <GitBranch
                            className="h-3.5 w-3.5 shrink-0 text-[#FF3B1F]"
                            strokeWidth={1.7}
                          />
                          <span>{sanitizeText(drop.hackathon_origin)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-7 border-t border-white/[0.07] pt-5">
                      <div className="flex flex-wrap gap-1.5">
                        {drop.tech_stack.map((tech) => (
                          <span
                            key={tech}
                            className="font-mono-telemetry rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-[#A1A1AA]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                        <PreloadLink
                          href={`/labs/${drop.slug}`}
                          className="press-tactile inline-flex h-10 items-center gap-1.5 rounded-full bg-[#18181D] border border-white/[0.12] px-4 text-xs font-semibold whitespace-nowrap text-[#F4F3EF] hover:border-white/[0.24] hover:bg-white/[0.08]"
                        >
                          <span>Inspect {drop.code}</span>
                          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                        </PreloadLink>

                        {drop.repo_url && (
                          <a
                            href={drop.repo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#A1A1AA] transition-colors hover:text-[#F4F3EF]"
                          >
                            <span>Source</span>
                            <ArrowUpRight
                              className="h-3.5 w-3.5 text-[#FF3B1F]"
                              strokeWidth={1.8}
                            />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        )}
      </section>
    </div>
  );
}
