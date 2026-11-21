import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, GitBranch } from "lucide-react";
import { Reveal, StaggerGroup, StaggerItem } from "@/lib/motion";
import { getLabProjectBySlug, getLabProjects } from "@/lib/db/repository";
import { evaluateGraduationScorecard } from "@/lib/scorecard";
import { NewsletterBar } from "@/components/journal/NewsletterBar";
import type { LabProjectStatus } from "@/lib/supabase/types";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getLabProjectBySlug(slug);
  if (!project) {
    return { title: "Drop Not Found | G-Gravitator Labs" };
  }
  const displayName = formatDropName(project.code, project.name);
  return {
    title: `${project.code} ${displayName} | G-Gravitator Labs`,
    description: sanitizeText(project.tagline),
  };
}

export default async function LabDropDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getLabProjectBySlug(slug);
  if (!project) {
    notFound();
  }

  const allDrops = await getLabProjects("LABS");
  const verdict = project.scorecard
    ? evaluateGraduationScorecard(project.scorecard)
    : null;
  const displayName = formatDropName(project.code, project.name);

  return (
    <div className="mx-auto max-w-[1360px] px-5 pt-10 pb-24 sm:px-8 lg:px-12 lg:pt-14 lg:pb-32">
      {/* Clean Back Navigation Pill */}
      <nav aria-label="Labs breadcrumb" className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/labs"
          className="press-tactile inline-flex h-10 items-center gap-2 rounded-full border border-white/[0.1] bg-[#111114] px-4 text-sm font-medium text-[#D4D4D8] hover:border-white/[0.2] hover:text-[#F4F3EF]"
        >
          <ArrowLeft className="h-4 w-4 text-[#FF3B1F]" strokeWidth={1.8} />
          <span>Back to Labs</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <span className="font-mono-telemetry rounded-full border border-white/[0.1] bg-[#111114] px-3 py-1 text-xs font-semibold text-[#F4F3EF]">
            {project.code}
          </span>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
              project.status
            )}`}
          >
            {formatStatusLabel(project.status)}
          </span>
        </div>
      </nav>

      {/* Editorial Product Detail Header */}
      <header className="mt-10 max-w-4xl">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono-telemetry rounded-full bg-[#FF3B1F] px-3 py-1 text-xs font-semibold text-[#08080A]">
            {project.code}
          </span>
          {verdict && (
            <span className="font-mono-telemetry rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-3 py-1 text-xs font-medium text-[#34D399]">
              Graduation score {verdict.total}/25
            </span>
          )}
        </div>

        <h1 className="font-display mt-5 text-[clamp(2.35rem,5vw,4.5rem)] font-bold leading-[1.04] tracking-[-0.03em] text-[#F4F3EF]">
          {displayName}
        </h1>

        <p className="mt-5 max-w-[60ch] text-lg font-medium leading-snug text-[#F4F3EF]/90 sm:text-xl">
          {sanitizeText(project.tagline)}
        </p>

        <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-[#A1A1AA]">
          {sanitizeText(project.description)}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {project.repo_url && (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noreferrer"
              className="press-tactile inline-flex h-11 items-center gap-2 rounded-full bg-[#FF3B1F] px-6 text-sm font-semibold whitespace-nowrap text-[#08080A] hover:bg-[#FF5238]"
            >
              <span>Inspect origin repository</span>
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </a>
          )}
          <Link
            href="/systems#scope-intake"
            className={`press-tactile inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold whitespace-nowrap ${
              project.repo_url
                ? "border border-white/[0.12] bg-[#18181D] text-[#F4F3EF] hover:border-white/[0.22] hover:bg-white/[0.08]"
                : "bg-[#FF3B1F] text-[#08080A] hover:bg-[#FF5238]"
            }`}
          >
            <span>Request enterprise deployment</span>
            <ArrowUpRight
              className={`h-4 w-4 ${project.repo_url ? "text-[#FF3B1F]" : ""}`}
              strokeWidth={2}
            />
          </Link>
        </div>
      </header>

      {/* Main Content: Architecture Narrative + Grouped Spec Clusters */}
      <section className="mt-16 grid grid-cols-1 gap-12 border-t border-white/[0.07] pt-14 lg:mt-20 lg:grid-cols-12 lg:gap-14">
        {/* Left 7 Cols: Thesis, Architecture & Release History */}
        <div className="space-y-14 lg:col-span-7">
          <Reveal>
            <h2 className="font-display text-2xl font-semibold tracking-[-0.025em] text-[#F4F3EF] sm:text-3xl">
              Product thesis
            </h2>
            <p className="mt-4 max-w-[65ch] text-base leading-[1.7] text-[#D4D4D8]">
              {sanitizeText(project.thesis ?? project.description)}
            </p>
          </Reveal>

          {project.architecture_notes && project.architecture_notes.length > 0 && (
            <Reveal className="border-t border-white/[0.07] pt-12">
              <h2 className="font-display text-2xl font-semibold tracking-[-0.025em] text-[#F4F3EF] sm:text-3xl">
                System architecture
              </h2>
              <div className="mt-6 space-y-4">
                {project.architecture_notes.map((note) => {
                  const cleaned = sanitizeText(note);
                  const sepIdx = cleaned.indexOf(":");
                  const title = sepIdx > 0 ? cleaned.slice(0, sepIdx) : null;
                  const detail =
                    sepIdx > 0 ? cleaned.slice(sepIdx + 1).trim() : cleaned;

                  return (
                    <div
                      key={note}
                      className="surface-card rounded-2xl p-5 sm:p-6"
                    >
                      {title && (
                        <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-[#F4F3EF]">
                          {title}
                        </h3>
                      )}
                      <p
                        className={`${
                          title ? "mt-2" : ""
                        } text-sm leading-relaxed text-[#A1A1AA]`}
                      >
                        {detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          )}

          {project.changelog && project.changelog.length > 0 && (
            <Reveal className="border-t border-white/[0.07] pt-12">
              <h2 className="font-display text-2xl font-semibold tracking-[-0.025em] text-[#F4F3EF] sm:text-3xl">
                Release log
              </h2>
              <div className="mt-6 space-y-6">
                {project.changelog.map((entry, idx) => (
                  <div
                    key={entry.version}
                    className={idx > 0 ? "border-t border-white/[0.07] pt-6" : ""}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono-telemetry rounded-full border border-white/[0.1] bg-[#111114] px-3 py-1 text-xs font-semibold text-[#F4F3EF]">
                        {entry.version}
                      </span>
                      <span className="font-mono-telemetry text-xs text-[#8B8B94]">
                        {entry.date}
                      </span>
                    </div>
                    <p className="mt-3 max-w-[64ch] text-sm leading-relaxed text-[#A1A1AA]">
                      {sanitizeText(entry.summary)}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          )}
        </div>

        {/* Right 5 Cols: Grouped Spec Clusters */}
        <aside className="space-y-6 lg:col-span-5">
          {/* Cluster 1: Runtime & Provenance */}
          <Reveal className="surface-card rounded-2xl p-6 sm:p-7">
            <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-[#F4F3EF]">
              Runtime specifications
            </h2>

            <div className="mt-5 grid grid-cols-2 gap-4 border-b border-white/[0.07] pb-5">
              <div>
                <div className="text-xs text-[#8B8B94]">Designation</div>
                <div className="font-mono-telemetry mt-1 text-sm font-semibold text-[#F4F3EF]">
                  {project.code}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#8B8B94]">Release stage</div>
                <div className="mt-1 text-sm font-medium text-[#F4F3EF]">
                  {formatStatusLabel(project.status)}
                </div>
              </div>
            </div>

            {project.hackathon_origin && (
              <div className="mt-5 border-b border-white/[0.07] pb-5">
                <div className="text-xs text-[#8B8B94]">Provenance</div>
                <div className="mt-1.5 flex items-start gap-2 text-sm text-[#D4D4D8]">
                  <GitBranch
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#FF3B1F]"
                    strokeWidth={1.7}
                  />
                  <span>{sanitizeText(project.hackathon_origin)}</span>
                </div>
              </div>
            )}

            <div className="mt-5">
              <div className="text-xs text-[#8B8B94]">Technical stack</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.tech_stack.map((tech) => (
                  <span
                    key={tech}
                    className="font-mono-telemetry rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-[#D4D4D8]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Cluster 2: 25-Point Graduation Evaluation */}
          {project.scorecard && verdict && (
            <Reveal delay={0.05} className="surface-card rounded-2xl p-6 sm:p-7">
              <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.07] pb-5">
                <div>
                  <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-[#F4F3EF]">
                    Graduation scorecard
                  </h2>
                  <p className="mt-1 text-xs text-[#8B8B94]">
                    Evaluated across five viability axes
                  </p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono-telemetry text-3xl font-bold text-[#F4F3EF]">
                    {verdict.total}
                  </span>
                  <span className="font-mono-telemetry text-sm text-[#8B8B94]">
                    /25
                  </span>
                </div>
              </div>

              <div className="mt-4">
                {[
                  { label: "Pain intensity", val: project.scorecard.pain_intensity },
                  {
                    label: "Willingness to pay",
                    val: project.scorecard.willingness_to_pay,
                  },
                  {
                    label: "Technical moat and polish",
                    val: project.scorecard.technical_moat,
                  },
                  {
                    label: "Distribution hook",
                    val: project.scorecard.distribution_hook,
                  },
                  {
                    label: "Lean maintainability",
                    val: project.scorecard.lean_maintainability,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 border-b border-white/[0.06] py-3 last:border-b-0"
                  >
                    <span className="text-xs font-medium text-[#D4D4D8]">
                      {row.label}
                    </span>
                    <span className="font-mono-telemetry tabular-nums rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-0.5 text-xs font-semibold text-[#F4F3EF]">
                      {row.val} / 5
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-white/[0.07] pt-5">
                <div className="font-mono-telemetry text-xs font-semibold text-[#34D399]">
                  {verdict.label}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#A1A1AA]">
                  {verdict.actionDirective}
                </p>
              </div>
            </Reveal>
          )}

          {/* Cluster 3: Early Access Waitlist */}
          <Reveal delay={0.1}>
            <NewsletterBar
              title={`${project.code} ${displayName} early access`}
              subtitle={`Receive release binaries, sandbox access, and architectural notes for ${project.code}.`}
              source={`labs-${project.code.toLowerCase()}`}
            />
          </Reveal>
        </aside>
      </section>

      {/* Other Drops Navigation Strip */}
      <section className="mt-20 border-t border-white/[0.07] pt-16 lg:mt-24">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.025em] text-[#F4F3EF]">
            More from G-Gravitator Labs
          </h2>
        </Reveal>

        <StaggerGroup className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {allDrops
            .filter((d) => d.slug !== project.slug)
            .map((other) => (
              <StaggerItem key={other.id} className="flex">
                <Link
                  href={`/labs/${other.slug}`}
                  className="surface-card surface-card-interactive flex w-full flex-col justify-between p-6"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-telemetry rounded-full border border-white/[0.1] bg-white/[0.05] px-2.5 py-0.5 text-xs font-semibold text-[#F4F3EF]">
                        {other.code}
                      </span>
                      <span className="text-xs font-medium text-[#8B8B94]">
                        {formatStatusLabel(other.status)}
                      </span>
                    </div>
                    <div className="font-display mt-4 text-xl font-semibold tracking-[-0.02em] text-[#F4F3EF]">
                      {formatDropName(other.code, other.name)}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#A1A1AA]">
                      {sanitizeText(other.tagline)}
                    </p>
                  </div>

                  <div className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[#D4D4D8]">
                    <span>Inspect drop</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={2} />
                  </div>
                </Link>
              </StaggerItem>
            ))}
        </StaggerGroup>
      </section>
    </div>
  );
}
