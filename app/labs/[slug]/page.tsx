import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, GitBranch } from "lucide-react";
import { Reveal, StaggerGroup, StaggerItem } from "@/lib/motion";
import { getLabProjectBySlug, getLabProjects } from "@/lib/db/repository";
import { evaluateGraduationScorecard } from "@/lib/scorecard";
import { NewsletterBar } from "@/components/journal/NewsletterBar";
import {
  buildBreadcrumbJsonLd,
  truncateWordBoundary,
} from "@/lib/seo/site";
import { getSiteOrigin } from "@/lib/seo/server";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getLabProjectBySlug(slug);
  if (!project) {
    return { title: "Drop Not Found | Labs" };
  }
  const displayName = formatDropName(project.code, project.name);
  const desc = truncateWordBoundary(sanitizeText(project.tagline), 160);
  const canonicalPath = `/labs/${project.slug}`;
  return {
    title: `${project.code} ${displayName} · Labs`,
    description: desc,
    keywords: [
      ...project.tech_stack,
      project.code,
      displayName,
      "G-Gravitator Labs",
    ],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${project.code} ${displayName} | G-Gravitator Labs`,
      description: desc,
      type: "website",
      siteName: "G-Gravitator",
      url: canonicalPath,
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.code} ${displayName}`,
      description: desc,
    },
  };
}

export default async function LabDropDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, origin] = await Promise.all([
    getLabProjectBySlug(slug),
    getSiteOrigin(),
  ]);
  if (!project) {
    notFound();
  }

  const allDrops = await getLabProjects("LABS");
  const verdict = project.scorecard
    ? evaluateGraduationScorecard(project.scorecard)
    : null;
  const displayName = formatDropName(project.code, project.name);
  const canonicalUrl = `${origin}/labs/${project.slug}`;

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${project.code} ${displayName}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description: sanitizeText(project.tagline),
    url: canonicalUrl,
    ...(project.live_url ? { sameAs: [project.live_url] } : {}),
    creator: {
      "@type": "Organization",
      name: "G-Gravitator",
      url: origin,
    },
  };

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: origin },
    { name: "Labs", url: `${origin}/labs` },
    { name: `${project.code} ${displayName}`, url: canonicalUrl },
  ]);

  return (
    <div className="mx-auto max-w-[1360px] px-5 pt-28 pb-24 sm:px-8 lg:px-12 lg:pt-32 lg:pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* Breadcrumb Bar */}
      <nav
        aria-label="Labs breadcrumb"
        className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--hairline)] pb-5"
      >
        <Link
          href="/labs"
          className="inline-flex items-center gap-2 text-[14px] font-medium text-[var(--ink-muted)] transition-colors duration-150 hover:text-[var(--ink-primary)]"
        >
          <ArrowLeft
            className="h-4 w-4 text-[var(--accent)]"
            strokeWidth={1.8}
          />
          <span>Back to Labs</span>
        </Link>

        <p className="font-tabular text-[14px] font-medium text-[var(--ink-muted)]">
          <span className="font-semibold text-[var(--ink-primary)]">
            {project.code}
          </span>{" "}
          · {formatStatusLabel(project.status)}
          {verdict ? ` · Score ${verdict.total}/25` : ""}
        </p>
      </nav>

      {/* Dossier Header */}
      <header className="mt-12 max-w-4xl">
        <h1 className="font-display text-[clamp(2.5rem,5.5vw,4.75rem)] font-bold leading-[1.0] tracking-[-0.035em] text-[var(--ink-primary)]">
          {displayName}
        </h1>

        <p className="mt-5 max-w-[60ch] text-[16px] font-medium leading-[1.6] text-[var(--ink-primary)]">
          {sanitizeText(project.tagline)}
        </p>

        <p className="mt-4 max-w-[65ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
          {sanitizeText(project.description)}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-5">
          {project.repo_url ? (
            <>
              <a
                href={project.repo_url}
                target="_blank"
                rel="noreferrer"
                className="press-tactile inline-flex h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-6 text-[14px] font-semibold whitespace-nowrap text-[#07090D] hover:bg-[var(--accent-hover)]"
              >
                <span>Inspect origin repository</span>
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </a>
              <Link
                href="/systems#scope-intake"
                className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--ink-primary)] underline decoration-white/30 underline-offset-4 transition-colors duration-150 hover:text-[#FF7A63]"
              >
                <span>Request enterprise deployment</span>
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
            </>
          ) : (
            <Link
              href="/systems#scope-intake"
              className="press-tactile inline-flex h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-6 text-[14px] font-semibold whitespace-nowrap text-[#07090D] hover:bg-[var(--accent-hover)]"
            >
              <span>Request enterprise deployment</span>
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <section className="mt-16 grid grid-cols-1 gap-12 border-t border-[var(--hairline)] pt-14 lg:mt-20 lg:grid-cols-12 lg:gap-14">
        <div className="space-y-14 lg:col-span-7">
          <Reveal>
            <h2 className="type-heading text-[var(--ink-primary)]">
              Product thesis
            </h2>
            <p className="mt-4 max-w-[65ch] text-[16px] leading-[1.7] text-[var(--ink-muted)]">
              {sanitizeText(project.thesis ?? project.description)}
            </p>
          </Reveal>

          {project.architecture_notes &&
            project.architecture_notes.length > 0 && (
              <Reveal className="border-t border-[var(--hairline)] pt-12">
                <h2 className="type-heading text-[var(--ink-primary)]">
                  System architecture
                </h2>
                <div className="mt-6 divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
                  {project.architecture_notes.map((note) => {
                    const cleaned = sanitizeText(note);
                    const sepIdx = cleaned.indexOf(":");
                    const title = sepIdx > 0 ? cleaned.slice(0, sepIdx) : null;
                    const detail =
                      sepIdx > 0 ? cleaned.slice(sepIdx + 1).trim() : cleaned;

                    return (
                      <div key={note} className="py-5">
                        {title && (
                          <h3 className="type-subhead text-[var(--ink-primary)]">
                            {title}
                          </h3>
                        )}
                        <p
                          className={`${
                            title ? "mt-2" : ""
                          } max-w-[64ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]`}
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
            <Reveal className="border-t border-[var(--hairline)] pt-12">
              <h2 className="type-heading text-[var(--ink-primary)]">
                Release log
              </h2>
              <div className="mt-6 divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
                {project.changelog.map((entry) => (
                  <div key={entry.version} className="py-5">
                    <div className="font-tabular flex flex-wrap items-baseline justify-between gap-2 text-[14px]">
                      <span className="font-semibold text-[var(--ink-primary)]">
                        {entry.version}
                      </span>
                      <span className="text-[var(--ink-muted)]">
                        {entry.date}
                      </span>
                    </div>
                    <p className="mt-2.5 max-w-[64ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                      {sanitizeText(entry.summary)}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          )}
        </div>

        <aside className="space-y-8 lg:col-span-5">
          {/* Runtime Specs */}
          <Reveal className="surface-slab p-6 sm:p-8">
            <h2 className="type-subhead text-[var(--ink-primary)]">
              Runtime specifications
            </h2>

            <dl className="mt-5 divide-y divide-[var(--hairline)] border-t border-[var(--hairline)] text-[14px]">
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-[var(--ink-muted)]">Designation</dt>
                <dd className="font-tabular font-semibold text-[var(--ink-primary)]">
                  {project.code}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-[var(--ink-muted)]">Release stage</dt>
                <dd className="font-medium text-[var(--ink-primary)]">
                  {formatStatusLabel(project.status)}
                </dd>
              </div>
              {project.hackathon_origin && (
                <div className="py-3.5">
                  <dt className="text-[var(--ink-muted)]">Provenance</dt>
                  <dd className="mt-1.5 flex items-start gap-2 text-[14px] text-[var(--ink-primary)]">
                    <GitBranch
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]"
                      strokeWidth={1.8}
                    />
                    <span>{sanitizeText(project.hackathon_origin)}</span>
                  </dd>
                </div>
              )}
              <div className="pt-3.5">
                <dt className="text-[var(--ink-muted)]">Technical stack</dt>
                <dd className="mt-1.5 text-[14px] text-[var(--ink-primary)]">
                  {project.tech_stack.join(" · ")}
                </dd>
              </div>
            </dl>
          </Reveal>

          {/* 25-Point Graduation Evaluation */}
          {project.scorecard && verdict && (
            <Reveal delay={0.05} className="surface-slab p-6 sm:p-8">
              <div className="flex items-baseline justify-between gap-4 border-b border-[var(--hairline)] pb-5">
                <div>
                  <h2 className="type-subhead text-[var(--ink-primary)]">
                    Graduation scorecard
                  </h2>
                  <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
                    Five viability axes
                  </p>
                </div>
                <p className="font-display font-tabular text-[32px] font-bold leading-none text-[var(--ink-primary)]">
                  {verdict.total}
                  <span className="text-[16px] font-normal text-[var(--ink-muted)]">
                    /25
                  </span>
                </p>
              </div>

              <div className="mt-4 divide-y divide-[var(--hairline)]">
                {[
                  {
                    label: "Pain intensity",
                    val: project.scorecard.pain_intensity,
                  },
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
                    className="flex items-center justify-between gap-3 py-3 text-[14px]"
                  >
                    <span className="text-[var(--ink-muted)]">{row.label}</span>
                    <span className="font-tabular font-semibold text-[var(--ink-primary)]">
                      {row.val} / 5
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-[var(--hairline)] pt-5">
                <p className="text-[14px] font-semibold text-[#34D399]">
                  {verdict.label}
                </p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--ink-muted)]">
                  {verdict.actionDirective}
                </p>
              </div>
            </Reveal>
          )}

          <Reveal delay={0.1}>
            <NewsletterBar
              title={`${project.code} ${displayName} early access`}
              subtitle={`Receive release binaries, sandbox access, and architectural notes for ${project.code}.`}
              source={`labs-${project.code.toLowerCase()}`}
            />
          </Reveal>
        </aside>
      </section>

      {/* Other Drops */}
      <section className="mt-20 border-t border-[var(--hairline)] pt-14 lg:mt-24">
        <Reveal>
          <h2 className="type-heading text-[var(--ink-primary)]">
            More from G-Gravitator Labs
          </h2>
        </Reveal>

        <StaggerGroup className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {allDrops
            .filter((d) => d.slug !== project.slug)
            .map((other) => (
              <StaggerItem key={other.id}>
                <Link
                  href={`/labs/${other.slug}`}
                  className="group block border-t border-[var(--hairline-strong)] pt-5"
                >
                  <p className="font-tabular text-[14px] font-medium text-[var(--ink-muted)]">
                    <span className="font-semibold text-[var(--ink-primary)]">
                      {other.code}
                    </span>{" "}
                    · {formatStatusLabel(other.status)}
                  </p>
                  <h3 className="type-subhead mt-2.5 text-[var(--ink-primary)] transition-colors duration-150 group-hover:text-[#FF7A63]">
                    {formatDropName(other.code, other.name)}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-[16px] leading-[1.6] text-[var(--ink-muted)]">
                    {sanitizeText(other.tagline)}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-[14px] font-medium text-[var(--ink-primary)]">
                    <span>Inspect drop</span>
                    <ArrowUpRight
                      className="h-4 w-4 text-[var(--accent)]"
                      strokeWidth={1.9}
                    />
                  </span>
                </Link>
              </StaggerItem>
            ))}
        </StaggerGroup>
      </section>
    </div>
  );
}
