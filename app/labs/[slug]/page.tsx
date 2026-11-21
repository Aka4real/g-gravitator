import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, GitBranch, Layers, Terminal } from "lucide-react";
import { getLabProjectBySlug, getLabProjects } from "@/lib/db/repository";
import { evaluateGraduationScorecard } from "@/lib/scorecard";
import { NewsletterBar } from "@/components/journal/NewsletterBar";

export const dynamic = "force-dynamic";

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
  return {
    title: `${project.code} // ${project.name} — G-Gravitator Labs`,
    description: project.tagline,
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

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <div className="border-x border-[#27272A]">
        {/* Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272A] bg-[#111114] px-6 py-3.5 lg:px-10">
          <Link
            href="/labs"
            className="font-mono-telemetry inline-flex items-center gap-2 text-xs text-[#A1A1AA] hover:text-[#F3F2EE]"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.8} />
            <span>BACK TO LABS CATALOG (/LABS)</span>
          </Link>
          <div className="font-mono-telemetry flex items-center gap-3 text-[11px] text-[#A1A1AA]">
            <span>DESIGNATION: {project.code}</span>
            <span className="text-[#3F3F46]">|</span>
            <span className="text-[#FF3B1F]">STATUS: {project.status}</span>
          </div>
        </div>

        {/* Hero Dossier Header */}
        <section className="border-b border-[#27272A] px-6 py-14 sm:px-10 lg:px-14 lg:py-20">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono-telemetry bg-[#FF3B1F] px-3 py-1 text-xs font-bold text-[#09090B]">
              {project.code} // PROPRIETARY DROP
            </span>
            <span className="font-mono-telemetry border border-[#27272A] bg-[#111114] px-3 py-1 text-xs text-[#F3F2EE]">
              {project.status}
            </span>
            {verdict && (
              <span className="font-mono-telemetry border border-[#10B981]/50 bg-[#10B981]/10 px-3 py-1 text-xs text-[#10B981]">
                GRADUATION SCORE: {verdict.total}/25 ({verdict.label})
              </span>
            )}
          </div>

          <h1 className="font-display mt-6 text-[clamp(2.5rem,5.5vw,4.75rem)] font-extrabold tracking-[-0.035em] text-[#F3F2EE] uppercase">
            {project.code} // {project.name}
          </h1>

          <p className="mt-4 max-w-3xl text-lg font-medium text-[#F3F2EE]">
            {project.tagline}
          </p>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#A1A1AA]">
            {project.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {project.repo_url && (
              <a
                href={project.repo_url}
                target="_blank"
                rel="noreferrer"
                className="font-mono-telemetry inline-flex items-center gap-2 bg-[#FF3B1F] px-5 py-3.5 text-xs font-semibold text-[#09090B] hover:bg-[#F3F2EE]"
              >
                <span>INSPECT ORIGIN REPOSITORY &amp; DEMO</span>
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
              </a>
            )}
            <Link
              href="/systems#scope-intake"
              className="font-mono-telemetry inline-flex items-center gap-2 border border-[#F3F2EE] px-5 py-3.5 text-xs font-semibold text-[#F3F2EE] hover:border-[#FF3B1F]"
            >
              <span>REQUEST ENTERPRISE DEPLOYMENT</span>
              <ArrowUpRight className="h-4 w-4 text-[#FF3B1F]" strokeWidth={1.8} />
            </Link>
          </div>
        </section>

        {/* Two-Column Technical Breakdown & Scorecard */}
        <section className="grid grid-cols-1 divide-y divide-[#27272A] border-b border-[#27272A] lg:grid-cols-12 lg:divide-x lg:divide-y-0">
          {/* Left 7 Cols: Product Thesis & Architecture Modules */}
          <div className="p-7 sm:p-10 lg:col-span-7">
            <div className="font-mono-telemetry flex items-center gap-2 text-xs text-[#FF3B1F]">
              <Terminal className="h-4 w-4" strokeWidth={1.5} />
              <span>01 // PRODUCT THESIS &amp; PROBLEM MASS</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#F3F2EE]">
              {project.thesis ?? project.description}
            </p>

            {project.architecture_notes && project.architecture_notes.length > 0 && (
              <div className="mt-10 border-t border-[#27272A] pt-8">
                <div className="font-mono-telemetry flex items-center gap-2 text-xs text-[#FF3B1F]">
                  <Layers className="h-4 w-4" strokeWidth={1.5} />
                  <span>02 // SYSTEM ARCHITECTURE SCHEMATIC</span>
                </div>
                <div className="mt-5 space-y-4">
                  {project.architecture_notes.map((note, idx) => (
                    <div
                      key={note}
                      className="border border-[#27272A] bg-[#111114] p-4"
                    >
                      <div className="font-mono-telemetry text-[10px] text-[#FF3B1F]">
                        MODULE 0{idx + 1}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#F3F2EE]">
                        {note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Version Changelog */}
            {project.changelog && project.changelog.length > 0 && (
              <div className="mt-10 border-t border-[#27272A] pt-8">
                <div className="font-mono-telemetry flex items-center gap-2 text-xs text-[#FF3B1F]">
                  <GitBranch className="h-4 w-4" strokeWidth={1.5} />
                  <span>03 // VERSION TELEMETRY &amp; CHANGELOG</span>
                </div>
                <div className="mt-5 divide-y divide-[#27272A] border border-[#27272A] bg-[#111114]">
                  {project.changelog.map((entry) => (
                    <div key={entry.version} className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono-telemetry text-xs font-bold text-[#F3F2EE]">
                          {entry.version}
                        </span>
                        <span className="font-mono-telemetry text-[10px] text-[#71717A]">
                          {entry.date}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-[#A1A1AA]">{entry.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right 5 Cols: Stack, Provenance & 25-Point Graduation Matrix */}
          <div className="bg-[#111114]/50 p-7 sm:p-10 lg:col-span-5">
            <h2 className="font-mono-telemetry text-xs text-[#71717A]">
              TECHNICAL STACK &amp; RUNTIME
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.tech_stack.map((tech) => (
                <span
                  key={tech}
                  className="font-mono-telemetry border border-[#27272A] bg-[#09090B] px-3 py-1 text-xs text-[#F3F2EE]"
                >
                  {tech}
                </span>
              ))}
            </div>

            {project.scorecard && verdict && (
              <div className="mt-10 border border-[#27272A] bg-[#09090B] p-6">
                <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
                  <span className="font-mono-telemetry text-xs text-[#FF3B1F]">
                    25-POINT GRADUATION SCORECARD
                  </span>
                  <span className="font-display text-2xl font-extrabold text-[#F3F2EE]">
                    {verdict.total}/25
                  </span>
                </div>

                <div className="mt-5 space-y-3.5 text-xs">
                  {[
                    { label: "01. Pain Intensity", val: project.scorecard.pain_intensity },
                    {
                      label: "02. Willingness to Pay",
                      val: project.scorecard.willingness_to_pay,
                    },
                    {
                      label: "03. Technical Moat & Polish",
                      val: project.scorecard.technical_moat,
                    },
                    {
                      label: "04. Distribution Hook",
                      val: project.scorecard.distribution_hook,
                    },
                    {
                      label: "05. Solo/Lean Maintainability",
                      val: project.scorecard.lean_maintainability,
                    },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between text-[#A1A1AA]">
                        <span>{row.label}</span>
                        <span className="font-mono-telemetry text-[#F3F2EE]">
                          {row.val} / 5
                        </span>
                      </div>
                      <div className="mt-1.5 flex gap-1">
                        {[1, 2, 3, 4, 5].map((step) => (
                          <span
                            key={step}
                            className={`h-1.5 flex-1 ${
                              step <= row.val ? "bg-[#FF3B1F]" : "bg-[#27272A]"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-[#27272A] pt-4">
                  <div className="font-mono-telemetry text-[10px] text-[#10B981]">
                    VERDICT // {verdict.label}
                  </div>
                  <p className="mt-1 text-xs text-[#A1A1AA]">{verdict.actionDirective}</p>
                </div>
              </div>
            )}

            {/* Early Access Waitlist Capture */}
            <div className="mt-8">
              <NewsletterBar
                title={`JOIN ${project.code} // ${project.name} EARLY ACCESS`}
                subtitle={`Receive release binaries, sandbox credentials, and architectural updates for ${project.code}.`}
                source={`labs-${project.code.toLowerCase()}`}
              />
            </div>
          </div>
        </section>

        {/* Other Drops Navigation Strip */}
        <section className="px-6 py-10 lg:px-10">
          <div className="font-mono-telemetry text-xs text-[#71717A]">
            OTHER G-GRAVITATOR LABS RELEASES
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {allDrops
              .filter((d) => d.slug !== project.slug)
              .map((other) => (
                <Link
                  key={other.id}
                  href={`/labs/${other.slug}`}
                  className="border border-[#27272A] bg-[#111114] p-5 transition-colors hover:border-[#FF3B1F]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-telemetry text-xs font-bold text-[#FF3B1F]">
                      {other.code}
                    </span>
                    <span className="font-mono-telemetry text-[10px] text-[#71717A]">
                      {other.status}
                    </span>
                  </div>
                  <div className="font-display mt-2 text-lg font-bold text-[#F3F2EE]">
                    {other.name}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-[#A1A1AA]">
                    {other.tagline}
                  </p>
                </Link>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
