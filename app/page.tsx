import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { PreloadLink } from "@/components/layout/PreloadLink";
import { ArrowUpRight } from "lucide-react";
import { GravityFieldCanvas } from "@/components/kinetic/GravityFieldCanvas";
import { FlywheelMatrix } from "@/components/kinetic/FlywheelMatrix";
import { CountdownTimer } from "@/components/hackathons/CountdownTimer";
import {
  SourceBadges,
  OxakalabsStatusBadge,
} from "@/components/hackathons/SourceBadges";
import { Reveal, StaggerGroup, StaggerItem } from "@/lib/motion";
import {
  getDispatches,
  getHackathons,
  getLabProjects,
  getNewsItems,
} from "@/lib/db/repository";
import type { LabProjectStatus } from "@/lib/supabase/types";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
  },
};

export const dynamic = "force-dynamic";

const DROP_DISPLAY_NAMES: Record<string, string> = {
  "GRAVITY DECK": "Gravity Deck",
  OPSPILOT: "OpsPilot",
  "KINETIC STUDIO": "Kinetic Studio",
  ORBITBENCH: "OrbitBench",
};

const DROP_STATUS_META: Record<
  LabProjectStatus,
  { label: string; colorClass: string }
> = {
  PROTOTYPING: { label: "Prototyping", colorClass: "text-[#FF7A63]" },
  "R&D": { label: "R&D", colorClass: "text-[#34D399]" },
  LIVE: { label: "Live", colorClass: "text-[#34D399]" },
  BETA: { label: "Beta", colorClass: "text-[#34D399]" },
  CONCEPT: { label: "Concept", colorClass: "text-[var(--ink-muted)]" },
  "SKUNKWORKS CANDIDATE": { label: "Skunkworks", colorClass: "text-[#FBBF24]" },
  ARCHIVED: { label: "Archived", colorClass: "text-[var(--ink-muted)]" },
};

const CATEGORY_LABELS: Record<string, string> = {
  MODELS: "Models",
  AGENTS: "Agents",
  DEVTOOLS: "Devtools",
  RESEARCH: "Research",
  BUSINESS: "Business",
  OPEN_SOURCE: "Open Source",
  ARCHITECTURE: "Architecture",
  "POST-MORTEM": "Post-Mortem",
  "AI SYSTEMS": "AI Systems",
  "HACKATHON LOG": "Hackathon Log",
  "DESIGN ENGINEERING": "Design Engineering",
};

function cleanCopy(text: string): string {
  return text.replace(/\s+\u2014\s+/g, ": ").replace(/\u2014/g, ", ");
}

function cleanOrigin(origin: string): string {
  return cleanCopy(origin).replace(/\s*\/\/\s*/g, " · ");
}

function formatDropName(name: string): string {
  const trimmed = name.trim();
  const mapped = DROP_DISPLAY_NAMES[trimmed.toUpperCase()];
  if (mapped) return mapped;
  if (trimmed === trimmed.toUpperCase()) {
    return trimmed.toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());
  }
  return trimmed;
}

function formatCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category.toUpperCase()] ?? category;
}

export default async function HomePage() {
  const [
    { items: hackathons },
    { items: newsItems },
    dispatches,
    labsDrops,
    skunkworksBuilds,
  ] = await Promise.all([
    getHackathons({ sort: "closing_soon" }),
    getNewsItems(),
    getDispatches(),
    getLabProjects("LABS"),
    getLabProjects("SKUNKWORKS"),
  ]);

  const topHackathons = hackathons.slice(0, 4);
  const topNews = newsItems.slice(0, 4);
  const featuredDispatch =
    dispatches.find((d) => d.is_featured) ?? dispatches[0] ?? null;

  return (
    <div className="relative overflow-x-clip bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
      {/* ===================================================================
          SECTION 1: FULL-BLEED LAYERED HERO (y = 0 behind borderless header)
         =================================================================== */}
      <section className="relative flex min-h-[100dvh] flex-col justify-between overflow-hidden bg-[var(--bg-canvas)] pt-24 pb-14 sm:pt-28 sm:pb-16">
        {/* Living orbital gravity field */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <GravityFieldCanvas />
        </div>

        {/* Centered sculptural titanium and smoked optical glass core */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center"
        >
          <div className="relative aspect-video w-[125vw] max-w-[1240px] sm:w-[96vw] lg:w-[82vw]">
            <Image
              src="/images/hero-monolith.jpg"
              alt="Centered bead-blasted titanium and smoked optical glass gravitational sphere encircled by a brushed steel ring"
              fill
              preload
              sizes="100vw"
              className="object-cover object-center opacity-95"
            />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_56%_at_50%_50%,transparent_42%,#07090D_92%)]" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#07090D] to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#07090D] to-transparent" />
          </div>
        </div>

        {/* Upper Monumental Display Headline */}
        <div className="relative z-10 mx-auto w-full max-w-[1360px] px-5 text-center sm:px-8 lg:px-12">
          <h1 className="font-display mx-auto max-w-[14ch] text-[clamp(3.25rem,9vw,8.25rem)] font-bold leading-[0.94] tracking-[-0.04em] text-[var(--ink-primary)]">
            Build with weight.
          </h1>
        </div>

        {/* Visual Clearing for the Sculptural Centerpiece */}
        <div aria-hidden="true" className="h-[26vh] min-h-[170px] sm:h-[30vh] lg:h-[34vh]" />

        {/* Lower Horizon Copy & Single Primary Action */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1360px] flex-col items-center px-5 text-center sm:px-8 lg:px-12">
          <p className="max-w-[58ch] text-balance text-[16px] leading-[1.6] text-[var(--ink-muted)]">
            Software systems, commercial Labs drops, and 48-hour{" "}
            <PreloadLink
              href="/skunkworks"
              className="font-medium text-[var(--ink-primary)] underline decoration-[var(--accent)]/80 underline-offset-4 transition-colors duration-150 hover:text-[#FF7A63]"
            >
              OXAKALABS
            </PreloadLink>{" "}
            prototypes engineered to pull ambitious markets into orbit.
          </p>

          <div className="mt-7">
            <PreloadLink
              href="/systems"
              id="hero-cta-commission-system"
              className="press-tactile inline-flex h-12 items-center gap-2 rounded-full bg-[var(--accent)] px-7 text-[14px] font-semibold whitespace-nowrap text-[#07090D] hover:bg-[var(--accent-hover)]"
            >
              <span>Commission a system</span>
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </PreloadLink>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 2: COOL ARCHITECTURAL STONE BAND (INTERACTIVE FLYWHEEL)
         =================================================================== */}
      <section className="surface-stone py-24 lg:py-32">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <Reveal>
            <h2 className="type-heading text-[var(--ink-stone-primary)]">
              One lab, four interlocking engines.
            </h2>
            <p className="mt-4 max-w-[60ch] text-[16px] leading-[1.65] text-[var(--ink-stone-muted)]">
              Select a division to trace how enterprise Systems contracts and
              OXAKALABS sprints fund commercial Labs releases and recruit Orbit
              builders.
            </p>
          </Reveal>

          <Reveal delay={0.06} className="mt-12 lg:mt-14">
            <FlywheelMatrix />
          </Reveal>
        </div>
      </section>

      {/* ===================================================================
          SECTION 3: PROPRIETARY LABS DROPS (ASYMMETRIC GALLERY + LEDGER)
         =================================================================== */}
      <section className="border-t border-[var(--hairline)] bg-[var(--bg-canvas)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h2 className="type-heading text-[var(--ink-primary)]">
                Software built for real operational load.
              </h2>
              <p className="mt-4 max-w-[56ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                Commercial releases graduated from our internal sprints into
                focused instruments for founders, operators, and engineering
                teams.
              </p>
            </div>

            <PreloadLink
              href="/labs"
              id="hero-cta-explore-lab"
              className="press-tactile inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--ink-primary)] px-6 text-[14px] font-semibold whitespace-nowrap text-[#07090D] hover:bg-[var(--accent)]"
            >
              <span>Explore Labs catalog</span>
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </PreloadLink>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start lg:gap-14">
            {/* Left Sticky Photographic Monolith (zero overlaid labels) */}
            <Reveal className="min-w-0 lg:sticky lg:top-24 lg:col-span-5">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[var(--bg-surface)] ring-1 ring-inset ring-white/[0.08]">
                <Image
                  src="/images/labs-prism.jpg"
                  alt="Stacked smoked optical glass and matte dark titanium monoliths with a hairline vermilion refraction"
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
              </div>

              <div className="mt-6">
                <h3 className="type-subhead text-[var(--ink-primary)]">
                  Graduated from 48-hour sprints into production releases
                </h3>
                <p className="mt-2 max-w-[46ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                  Prototypes scoring 20 to 25 on our Graduation Filter promote
                  from OXAKALABS into numbered G-Gravitator Labs software.
                </p>
                <p className="font-tabular mt-4 text-[14px] font-medium text-[var(--ink-muted)]">
                  {labsDrops.length} active drops · G-01 to G-04
                </p>
              </div>
            </Reveal>

            {/* Right Open Hairline-Ruled Catalog List */}
            <div className="min-w-0 lg:col-span-7">
              {labsDrops.length === 0 ? (
                <div className="border-y border-[var(--hairline)] py-8 text-[16px] text-[var(--ink-muted)]">
                  Labs catalog releases are syncing.{" "}
                  <PreloadLink
                    href="/labs"
                    className="font-medium text-[var(--ink-primary)] underline underline-offset-4"
                  >
                    Open Labs catalog
                  </PreloadLink>
                </div>
              ) : (
                <StaggerGroup className="divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
                  {labsDrops.map((drop) => {
                    const statusMeta =
                      DROP_STATUS_META[drop.status] ?? DROP_STATUS_META.CONCEPT;

                    return (
                      <StaggerItem key={drop.id}>
                        <PreloadLink
                          href={`/labs/${drop.slug}`}
                          className="group block py-7 transition-colors duration-150 hover:bg-white/[0.02] sm:px-4"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-3">
                            <span className="font-tabular text-[14px] font-medium text-[var(--ink-muted)]">
                              <span className="font-semibold text-[var(--ink-primary)]">
                                {drop.code}
                              </span>{" "}
                              ·{" "}
                              <span className={statusMeta.colorClass}>
                                {statusMeta.label}
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[14px] font-medium text-[var(--ink-primary)] transition-colors duration-150 group-hover:text-[#FF7A63]">
                              <span>Inspect spec</span>
                              <ArrowUpRight
                                className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
                                strokeWidth={1.8}
                              />
                            </span>
                          </div>

                          <h3 className="type-heading mt-3 text-[var(--ink-primary)]">
                            {formatDropName(drop.name)}
                          </h3>

                          <p className="mt-2.5 max-w-[58ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                            {cleanCopy(drop.tagline)}
                          </p>

                          <p className="mt-3 text-[14px] text-[var(--ink-muted)]">
                            {drop.tech_stack.slice(0, 4).join(" · ")}
                            {drop.hackathon_origin
                              ? ` · ${cleanOrigin(drop.hackathon_origin)}`
                              : ""}
                          </p>
                        </PreloadLink>
                      </StaggerItem>
                    );
                  })}
                </StaggerGroup>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 4: BROADSHEET INTELLIGENCE (JOURNAL + LIVE HACKATHON RADAR)
         =================================================================== */}
      <section className="border-t border-[var(--hairline)] bg-[var(--bg-surface)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <Reveal>
            <h2 className="type-heading text-[var(--ink-primary)]">
              Dispatches and signals from the frontier.
            </h2>
            <p className="mt-4 max-w-[60ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
              Original engineering essays, daily Orbital Wire summaries with
              concrete builder takeaways, and active hackathons tracked across
              ten sources.
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-14 lg:grid-cols-12 lg:items-start lg:gap-12">
            {/* Left 7 Cols: Lead Dispatch + Hairline Wire */}
            <div className="min-w-0 lg:col-span-7">
              {featuredDispatch && (
                <Reveal>
                  <article className="border-y border-[var(--hairline-strong)] py-8">
                    <p className="font-tabular text-[14px] font-medium text-[var(--ink-muted)]">
                      <span className="font-semibold text-[var(--accent)]">
                        Dispatch {featuredDispatch.issue_number}
                      </span>{" "}
                      · {formatCategoryLabel(featuredDispatch.category)} ·{" "}
                      {featuredDispatch.reading_time_mins} min read
                    </p>

                    <h3 className="type-heading mt-4 text-[var(--ink-primary)]">
                      <PreloadLink
                        href={`/journal/${featuredDispatch.slug}`}
                        className="transition-colors duration-150 hover:text-[#FF7A63]"
                      >
                        {cleanCopy(featuredDispatch.title)}
                      </PreloadLink>
                    </h3>

                    <p className="mt-4 max-w-[60ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                      {cleanCopy(featuredDispatch.subtitle)}
                    </p>

                    <div className="mt-6">
                      <PreloadLink
                        href={`/journal/${featuredDispatch.slug}`}
                        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--ink-primary)] underline decoration-[var(--accent)]/70 underline-offset-4 transition-colors duration-150 hover:text-[#FF7A63]"
                      >
                        <span>Read featured dispatch</span>
                        <ArrowUpRight className="h-4 w-4" strokeWidth={1.9} />
                      </PreloadLink>
                    </div>
                  </article>
                </Reveal>
              )}

              <div className={featuredDispatch ? "mt-10" : ""}>
                <Reveal className="flex flex-wrap items-baseline justify-between gap-3 pb-4">
                  <h3 className="type-subhead text-[var(--ink-primary)]">
                    The Orbital Wire
                  </h3>
                  <PreloadLink
                    href="/journal"
                    className="inline-flex items-center gap-1 text-[14px] font-medium text-[var(--ink-muted)] transition-colors duration-150 hover:text-[var(--ink-primary)]"
                  >
                    <span>
                      All {dispatches.length} dispatches and {newsItems.length}{" "}
                      signals
                    </span>
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                  </PreloadLink>
                </Reveal>

                {topNews.length === 0 ? (
                  <p className="border-t border-[var(--hairline)] py-6 text-[16px] text-[var(--ink-muted)]">
                    Fresh Orbital Wire signals are syncing now.
                  </p>
                ) : (
                  <StaggerGroup className="divide-y divide-[var(--hairline)] border-t border-[var(--hairline)]">
                    {topNews.map((item) => (
                      <StaggerItem key={item.id}>
                        <article className="py-6">
                          <div className="flex flex-wrap items-baseline justify-between gap-2 text-[14px]">
                            <span className="text-[var(--ink-muted)]">
                              <span className="font-medium text-[var(--ink-primary)]">
                                {formatCategoryLabel(item.category)}
                              </span>{" "}
                              · {item.source_name}
                            </span>

                            <span className="font-tabular font-medium text-[#34D399]">
                              Impact {item.impact_score}/100
                            </span>
                          </div>

                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="type-subhead mt-2 block text-[var(--ink-primary)] transition-colors duration-150 hover:text-[#FF7A63]"
                          >
                            {cleanCopy(item.title)}
                          </a>

                          <p className="mt-2 max-w-[62ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                            <span className="font-medium text-[var(--ink-primary)]">
                              Gravity Take:{" "}
                            </span>
                            {cleanCopy(item.gravity_take)}
                          </p>
                        </article>
                      </StaggerItem>
                    ))}
                  </StaggerGroup>
                )}
              </div>
            </div>

            {/* Right 5 Cols: Open Hackathon Radar Ledger */}
            <Reveal delay={0.08} className="min-w-0 lg:col-span-5">
              <div className="border-t-2 border-[var(--accent)] pt-6">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <h3 className="type-subhead text-[var(--ink-primary)]">
                      Hackathon Radar
                    </h3>
                    <p className="font-tabular mt-1 text-[14px] text-[var(--ink-muted)]">
                      {hackathons.length} active events across Devpost,
                      DoraHacks, X, and Luma
                    </p>
                  </div>
                </div>

                {topHackathons.length === 0 ? (
                  <p className="mt-6 border-t border-[var(--hairline)] pt-6 text-[16px] text-[var(--ink-muted)]">
                    No active hackathon windows are listed right now.
                  </p>
                ) : (
                  <div className="mt-6 divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
                    {topHackathons.map((hack) => (
                      <article key={hack.id} className="py-5">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <SourceBadges sources={hack.sources} />
                          <OxakalabsStatusBadge
                            status={hack.oxakalabs_status}
                          />
                        </div>

                        <h4 className="type-subhead mt-2.5 text-[var(--ink-primary)]">
                          <PreloadLink
                            href={`/hackathons?q=${encodeURIComponent(hack.title)}`}
                            className="transition-colors duration-150 hover:text-[#FF7A63]"
                          >
                            {cleanCopy(hack.title)}
                          </PreloadLink>
                        </h4>

                        <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-[var(--ink-muted)]">
                          {cleanCopy(hack.summary)}
                        </p>

                        <div className="mt-3.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                          <span className="font-tabular text-[14px] font-semibold text-[#34D399]">
                            {cleanCopy(hack.prize_display)}
                          </span>

                          <div className="flex items-center gap-4">
                            <CountdownTimer
                              deadlineAt={hack.deadline_at}
                              compact
                            />
                            <a
                              href={hack.primary_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[14px] font-medium text-[var(--ink-primary)] transition-colors duration-150 hover:text-[#FF7A63]"
                            >
                              <span>Source</span>
                              <ArrowUpRight
                                className="h-3.5 w-3.5"
                                strokeWidth={1.8}
                              />
                            </a>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                <div className="mt-7">
                  <PreloadLink
                    href="/hackathons"
                    id="hero-cta-hackathon-radar"
                    className="press-tactile inline-flex h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-6 text-[14px] font-semibold whitespace-nowrap text-[#07090D] hover:bg-[var(--accent-hover)]"
                  >
                    <span>Open all {hackathons.length} tracked hackathons</span>
                    <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                  </PreloadLink>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 5: MANIFESTO & ARCHITECTURAL STUDIO PATHWAYS
         =================================================================== */}
      <section className="border-t border-[var(--hairline)] bg-[var(--bg-canvas)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <Reveal className="max-w-4xl">
            <blockquote className="type-heading text-[var(--ink-primary)]">
              &ldquo;Most labs chase visuals without an engine underneath, or
              ship raw software nobody wants to touch. G-Gravitator operates at
              the center of mass: where software craft, applied AI, and
              OXAKALABS velocity pull sharp minds into orbit.&rdquo;
            </blockquote>
            <p className="mt-6 text-[14px] font-medium text-[var(--ink-muted)]">
              G-Gravitator Labs Ltd · Operating OXAKALABS since 2022
            </p>
          </Reveal>

          {/* Asymmetric Editorial Pathways (Systems Ledger + 2 Studio Photography Panels) */}
          <div className="mt-16 grid grid-cols-1 gap-10 border-t border-[var(--hairline)] pt-14 lg:mt-20 lg:grid-cols-12 lg:gap-10">
            {/* Systems Engagement Summary */}
            <Reveal className="flex flex-col justify-between lg:col-span-4">
              <div>
                <h3 className="type-heading text-[var(--ink-primary)]">
                  G-Gravitator Systems
                </h3>
                <p className="mt-4 text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                  Book a 5-day Gravity Audit or 4-week Velocity MVP for
                  production AI workflows and full-stack software with clean IP
                  handover.
                </p>

                <dl className="mt-8 divide-y divide-[var(--hairline)] border-y border-[var(--hairline)] text-[14px]">
                  <div className="flex items-center justify-between py-3.5">
                    <dt className="text-[var(--ink-muted)]">Gravity Audit</dt>
                    <dd className="font-tabular font-medium text-[var(--ink-primary)]">
                      5 days
                    </dd>
                  </div>
                  <div className="flex items-center justify-between py-3.5">
                    <dt className="text-[var(--ink-muted)]">Velocity MVP</dt>
                    <dd className="font-tabular font-medium text-[var(--ink-primary)]">
                      3 to 4 weeks
                    </dd>
                  </div>
                  <div className="flex items-center justify-between py-3.5">
                    <dt className="text-[var(--ink-muted)]">Lab Retainer</dt>
                    <dd className="font-tabular font-medium text-[var(--ink-primary)]">
                      Monthly
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-8">
                <PreloadLink
                  href="/systems"
                  className="press-tactile inline-flex h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-6 text-[14px] font-semibold whitespace-nowrap text-[#07090D] hover:bg-[var(--accent-hover)]"
                >
                  <span>Scope your build</span>
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </PreloadLink>
              </div>
            </Reveal>

            {/* OXAKALABS Skunkworks Photographic Pathway */}
            <Reveal delay={0.05} className="lg:col-span-4">
              <PreloadLink href="/skunkworks" className="group block">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[var(--bg-surface)] ring-1 ring-inset ring-white/[0.08]">
                  <Image
                    src="/images/skunkworks-forge.jpg"
                    alt="CNC-milled dark aerospace alloy mechanism and frosted glass aperture representing OXAKALABS Skunkworks"
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
                  />
                </div>
                <h3 className="type-subhead mt-5 text-[var(--ink-primary)] transition-colors duration-150 group-hover:text-[#FF7A63]">
                  OXAKALABS Skunkworks
                </h3>
                <p className="mt-2 text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                  Inspect {skunkworksBuilds.length} shipped 48-hour GitHub
                  prototypes and calibrate product viability on our 25-point
                  Graduation Filter.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--ink-primary)]">
                  <span>Enter Skunkworks</span>
                  <ArrowUpRight
                    className="h-4 w-4 text-[var(--accent)]"
                    strokeWidth={1.9}
                  />
                </span>
              </PreloadLink>
            </Reveal>

            {/* G-Gravitator Orbit Photographic Pathway */}
            <Reveal delay={0.1} className="lg:col-span-4">
              <PreloadLink href="/orbit" className="group block">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[var(--bg-surface)] ring-1 ring-inset ring-white/[0.08]">
                  <Image
                    src="/images/orbit-atelier.jpg"
                    alt="Twilight monolithic dark concrete and smoked glass studio interior representing G-Gravitator Orbit"
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
                  />
                </div>
                <h3 className="type-subhead mt-5 text-[var(--ink-primary)] transition-colors duration-150 group-hover:text-[#FF7A63]">
                  G-Gravitator Orbit
                </h3>
                <p className="mt-2 text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                  Apply for Orbit Cycle 01, a selective 6-week residency in AI
                  engineering, full-stack product systems, and kinetic craft.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--ink-primary)]">
                  <span>Apply for Cycle 01</span>
                  <ArrowUpRight
                    className="h-4 w-4 text-[var(--accent)]"
                    strokeWidth={1.9}
                  />
                </span>
              </PreloadLink>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
