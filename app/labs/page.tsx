import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { PreloadLink } from "@/components/layout/PreloadLink";
import { ArrowRight, ArrowUpRight, GitBranch } from "lucide-react";
import { Reveal, StaggerGroup, StaggerItem } from "@/lib/motion";
import { getLabProjects } from "@/lib/db/repository";
import { evaluateGraduationScorecard } from "@/lib/scorecard";
import type { LabProjectStatus } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Labs · Flagship Software & AI Product Drops",
  description:
    "Proprietary commercial software and AI tools shipped as numbered drops: G-01 Gravity Deck, G-02 OpsPilot, G-03 Kinetic Studio, and G-04 OrbitBench.",
  alternates: {
    canonical: "/labs",
  },
  openGraph: {
    title: "G-Gravitator Labs · Flagship Product Drops",
    description:
      "Proprietary commercial software and AI tools shipped as numbered drops: G-01 Gravity Deck, G-02 OpsPilot, G-03 Kinetic Studio, and G-04 OrbitBench.",
    url: "/labs",
  },
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

function getStatusColor(status: LabProjectStatus): string {
  switch (status) {
    case "LIVE":
      return "text-[#34D399]";
    case "PROTOTYPING":
    case "BETA":
      return "text-[#FF7A63]";
    case "R&D":
    case "SKUNKWORKS CANDIDATE":
      return "text-[#FBBF24]";
    default:
      return "text-[var(--ink-muted)]";
  }
}

export default async function LabsCatalogPage() {
  const drops = await getLabProjects("LABS");
  const [flagship, ...remainingDrops] = drops;

  return (
    <div className="bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
      {/* Centered Monumental Opening + Panoramic Studio Visual Stage */}
      <section className="mx-auto max-w-[1360px] px-5 pt-24 pb-16 sm:px-8 lg:px-12 lg:pt-28 lg:pb-20">
        <header className="mx-auto max-w-4xl text-center">
          <h1 className="font-display text-[clamp(2.5rem,5.2vw,4.5rem)] font-bold leading-[1.0] tracking-[-0.035em] text-[var(--ink-primary)]">
            Software drops engineered to hold load.
          </h1>

          <p className="mx-auto mt-6 max-w-[56ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
            Every Labs release starts inside{" "}
            <PreloadLink
              href="/systems"
              className="text-[var(--ink-primary)] underline decoration-white/30 underline-offset-4 transition-colors duration-150 hover:text-[#FF7A63]"
            >
              Systems
            </PreloadLink>{" "}
            or graduates from{" "}
            <PreloadLink
              href="/skunkworks"
              className="text-[var(--ink-primary)] underline decoration-white/30 underline-offset-4 transition-colors duration-150 hover:text-[#FF7A63]"
            >
              OXAKALABS Skunkworks
            </PreloadLink>{" "}
            after clearing our 20/25 graduation filter.
          </p>

          <div className="mt-8">
            <a
              href="#labs-catalog"
              className="press-tactile inline-flex h-12 items-center gap-2 rounded-full bg-[var(--accent)] px-7 text-[14px] font-semibold whitespace-nowrap text-[#07090D] hover:bg-[var(--accent-hover)]"
            >
              <span>Explore active catalog</span>
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </a>
          </div>
        </header>

        <div className="mt-14 aspect-[21/9] w-full overflow-hidden rounded-2xl bg-[var(--bg-surface)] ring-1 ring-inset ring-white/[0.08]">
          <Image
            src="/images/labs-prism.jpg"
            alt="Stacked smoked optical glass and matte obsidian monoliths with a hairline vermilion internal light line"
            width={1376}
            height={768}
            preload
            sizes="100vw"
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      {/* Catalog Section */}
      <section
        id="labs-catalog"
        className="border-t border-[var(--hairline)] py-20 lg:py-28"
      >
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <Reveal>
            <h2 className="type-heading text-[var(--ink-primary)]">
              Active catalog
            </h2>
            <p className="mt-3 max-w-[60ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
              Four proprietary software instruments spanning executable founder
              decks, autonomous SME operations, motion rendering, and LLM
              evaluation.
            </p>
          </Reveal>

          {/* Flagship Lead Release */}
          {flagship &&
            (() => {
              const verdict = flagship.scorecard
                ? evaluateGraduationScorecard(flagship.scorecard)
                : null;
              const displayName = formatDropName(flagship.code, flagship.name);

              return (
                <Reveal className="mt-12">
                  <article className="surface-slab p-7 sm:p-10 lg:p-12">
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
                      <div className="flex flex-col justify-between lg:col-span-7">
                        <div>
                          <p className="font-tabular text-[14px] font-medium text-[var(--ink-muted)]">
                            <span className="font-semibold text-[var(--accent)]">
                              {flagship.code}
                            </span>{" "}
                            ·{" "}
                            <span className={getStatusColor(flagship.status)}>
                              {formatStatusLabel(flagship.status)}
                            </span>
                            {verdict ? ` · Score ${verdict.total}/25` : ""}
                          </p>

                          <h3 className="type-heading mt-4 text-[var(--ink-primary)]">
                            {displayName}
                          </h3>

                          <p className="mt-4 max-w-[58ch] text-[16px] font-medium leading-[1.6] text-[var(--ink-primary)]">
                            {sanitizeText(flagship.tagline)}
                          </p>

                          <p className="mt-3 max-w-[62ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                            {sanitizeText(flagship.description)}
                          </p>

                          {flagship.hackathon_origin && (
                            <p className="mt-5 inline-flex items-center gap-2 text-[14px] text-[var(--ink-muted)]">
                              <GitBranch
                                className="h-4 w-4 shrink-0 text-[var(--accent)]"
                                strokeWidth={1.8}
                              />
                              <span>
                                {sanitizeText(flagship.hackathon_origin)}
                              </span>
                            </p>
                          )}
                        </div>

                        <div className="mt-8 flex flex-wrap items-center gap-5">
                          <PreloadLink
                            href={`/labs/${flagship.slug}`}
                            className="press-tactile inline-flex h-11 items-center gap-2 rounded-full bg-[var(--ink-primary)] px-6 text-[14px] font-semibold whitespace-nowrap text-[#07090D] hover:bg-[var(--accent)]"
                          >
                            <span>Inspect {flagship.code} dossier</span>
                            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                          </PreloadLink>

                          {flagship.repo_url && (
                            <a
                              href={flagship.repo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--ink-primary)] underline decoration-white/25 underline-offset-4 transition-colors duration-150 hover:text-[#FF7A63]"
                            >
                              <span>Source repository</span>
                              <ArrowUpRight
                                className="h-4 w-4"
                                strokeWidth={1.8}
                              />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-between border-t border-[var(--hairline)] pt-7 lg:col-span-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
                        {flagship.architecture_notes &&
                          flagship.architecture_notes.length > 0 && (
                            <div>
                              <h4 className="text-[14px] font-semibold text-[var(--ink-primary)]">
                                Core architecture modules
                              </h4>
                              <ul className="mt-4 space-y-4 text-[16px] leading-[1.6] text-[var(--ink-muted)]">
                                {flagship.architecture_notes.map((note) => {
                                  const cleaned = sanitizeText(note);
                                  const sepIdx = cleaned.indexOf(":");
                                  const title =
                                    sepIdx > 0
                                      ? cleaned.slice(0, sepIdx)
                                      : null;
                                  const detail =
                                    sepIdx > 0
                                      ? cleaned.slice(sepIdx + 1).trim()
                                      : cleaned;

                                  return (
                                    <li key={note}>
                                      {title && (
                                        <span className="font-medium text-[var(--ink-primary)]">
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

                        <div className="mt-8 border-t border-[var(--hairline)] pt-5">
                          <p className="text-[14px] text-[var(--ink-muted)]">
                            {flagship.tech_stack.join(" · ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                </Reveal>
              );
            })()}

          {/* Remaining Releases */}
          {remainingDrops.length > 0 && (
            <StaggerGroup className="mt-14 grid grid-cols-1 gap-10 border-t border-[var(--hairline)] pt-12 lg:grid-cols-3">
              {remainingDrops.map((drop) => {
                const verdict = drop.scorecard
                  ? evaluateGraduationScorecard(drop.scorecard)
                  : null;
                const displayName = formatDropName(drop.code, drop.name);

                return (
                  <StaggerItem key={drop.id} className="flex">
                    <article className="flex w-full flex-col justify-between">
                      <div>
                        <p className="font-tabular text-[14px] font-medium text-[var(--ink-muted)]">
                          <span className="font-semibold text-[var(--ink-primary)]">
                            {drop.code}
                          </span>{" "}
                          ·{" "}
                          <span className={getStatusColor(drop.status)}>
                            {formatStatusLabel(drop.status)}
                          </span>
                          {verdict ? ` · ${verdict.total}/25` : ""}
                        </p>

                        <h3 className="type-heading mt-3 text-[var(--ink-primary)]">
                          <PreloadLink
                            href={`/labs/${drop.slug}`}
                            className="transition-colors duration-150 hover:text-[#FF7A63]"
                          >
                            {displayName}
                          </PreloadLink>
                        </h3>

                        <p className="mt-3 text-[16px] font-medium leading-[1.55] text-[var(--ink-primary)]">
                          {sanitizeText(drop.tagline)}
                        </p>

                        <p className="mt-3 text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                          {sanitizeText(drop.description)}
                        </p>

                        {drop.hackathon_origin && (
                          <p className="mt-4 flex items-center gap-2 text-[14px] text-[var(--ink-muted)]">
                            <GitBranch
                              className="h-4 w-4 shrink-0 text-[var(--accent)]"
                              strokeWidth={1.8}
                            />
                            <span>{sanitizeText(drop.hackathon_origin)}</span>
                          </p>
                        )}
                      </div>

                      <div className="mt-7 border-t border-[var(--hairline)] pt-5">
                        <p className="text-[14px] text-[var(--ink-muted)]">
                          {drop.tech_stack.join(" · ")}
                        </p>

                        <div className="mt-5 flex flex-wrap items-center gap-5">
                          <PreloadLink
                            href={`/labs/${drop.slug}`}
                            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--ink-primary)] underline decoration-[var(--accent)]/70 underline-offset-4 transition-colors duration-150 hover:text-[#FF7A63]"
                          >
                            <span>Inspect {drop.code}</span>
                            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                          </PreloadLink>

                          {drop.repo_url && (
                            <a
                              href={drop.repo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[14px] font-medium text-[var(--ink-muted)] transition-colors duration-150 hover:text-[var(--ink-primary)]"
                            >
                              <span>Source</span>
                              <ArrowUpRight
                                className="h-3.5 w-3.5"
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
        </div>
      </section>
    </div>
  );
}
